# Container CI/CD

The pipeline builds two application images, one for Linux amd64 and one for Windows amd64 Server Core LTSC 2022. Both images contain the React build and the FastAPI application. FastAPI serves the client at `/` and the API at `/api` when `STATIC_DIR` is set. The browser uses relative API URLs, so the bundle works under the deployment domain without a separate frontend server.

```mermaid
flowchart LR
    Browser[Browser] -->|HTTPS| Proxy[Reverse proxy]
    Proxy --> App["App image · React files + FastAPI"]
    App -->|SQLAlchemy / asyncpg| DB[(PostgreSQL)]
```

PostgreSQL is a separate service. The local Linux stack starts it in a second container and stores its data in a named volume. The Windows app connects to a reachable PostgreSQL server. In CI, that server runs on the Windows runner and accepts connections on Docker's NAT subnet.

## Pipeline

```mermaid
flowchart LR
    Push["PR, main push, or release tag"] --> Checks["npm test · pytest · Vite build"]
    Checks --> Linux["Ubuntu · build + PostgreSQL smoke test"]
    Checks --> Windows["Server 2022 · build + PostgreSQL smoke test"]
    Linux -->|Release tag| LImage["GHCR · Linux digest"]
    Windows -->|Release tag| WImage["GHCR · Windows digest"]
    LImage --> Deploy["Optional Linux deployment"]
    WImage --> Deploy
```

| Stage | What runs |
| --- | --- |
| Trigger | Pull requests to `main`, pushes to `main`, and manual runs validate both platforms. A pushed `v*` tag must point to a commit in `main` before the workflow can publish. |
| Application checks | Node 24 installs the locked dependencies with `npm ci`, runs the React tests and uploads the production bundle. Python 3.13 runs the backend suite. |
| Linux build | The multi-stage Dockerfile builds the client with Node and copies the result into a Python runtime image. Docker Compose starts that image and PostgreSQL 17. |
| Windows build | A native Server 2022 runner downloads the frontend artifact and packages it with the official Python Server Core base. The runner creates an isolated PostgreSQL test cluster and removes the test container and firewall rule afterward. |
| Smoke tests | Both images must serve HTML and the built JavaScript, answer the database health check, create a guest session, and persist and replay a virtual-coin round. |
| Delivery | Each successful release build pushes its tested local image to GitHub Container Registry. The job summary records the image digest. A failed platform makes the release workflow fail and prevents deployment. |
| Deployment | After both release builds succeed, the optional production job sends the Linux digest over SSH, waits for the new container to become healthy, and restores the previous image if the update fails. |

The workflows live in [ci-cd.yml](../.github/workflows/ci-cd.yml) and [build-containers.yml](../.github/workflows/build-containers.yml). The Python smoke script runs against both images. The PowerShell Windows wrapper starts and cleans up the test database. The deployment script uses the production Compose file installed on the host.

## Run locally with Linux containers

From the project root, run this command with a Linux Docker engine running. On Windows, use Docker Desktop in Linux container mode.

```sh
docker compose up --build --wait
```

Compose builds React and FastAPI, starts PostgreSQL, and waits for both services to become healthy in the background. Open `http://127.0.0.1:8000/`. If that port is in use, set `APP_PORT` before starting Compose. To check a running stack with the optional Python smoke test, run `python scripts/ci/smoke.py` and pass `--url` if you changed the port.

The default database password is for local development. The app binds to loopback and PostgreSQL is available only inside the Compose network. If you initialized a local volume with a custom password, keep using it. You can set `POSTGRES_PASSWORD` in the shell or run `docker compose --env-file .env.containers up --build --wait` with your existing ignored env file. Use a URL-safe password because Compose interpolates it into the database URL. `docker compose down` stops the stack and keeps the database volume.

## Run locally with Windows containers

Use a Windows Docker engine on a Server 2022 host with process isolation. For a Windows 11 host, consult Microsoft's compatibility table and use Hyper-V isolation where required. Run the Windows job in GitHub Actions if your development machine runs Windows 10, which cannot run Server Core 2022. The published image also works without a local Node installation. [Windows container compatibility](https://learn.microsoft.com/en-us/virtualization/windowscontainers/deploy-containers/version-compatibility)

```powershell
$env:VITE_API_BASE = '/api'
npm ci
npm run build
$env:DOCKER_BUILDKIT = '0'
docker build --isolation process --file Dockerfile.windows --tag neiroslop:windows .
docker run --detach --name neiroslop-windows --isolation process --publish 8000:8000 --env-file .env.windows neiroslop:windows
```

Create the ignored `.env.windows` file with your settings before running the container. Use a database address reachable from inside the container.

```dotenv
DATABASE_URL=postgresql+asyncpg://neiroslop:URL_ENCODED_PASSWORD@postgres.example.internal:5432/neiroslop
ALLOWED_ORIGINS=http://127.0.0.1:8000,http://localhost:8000
COOKIE_SECURE=false
```

`docker info --format '{{.OSType}}'` identifies the engine mode. `docker logs neiroslop-windows` shows startup and database errors. A Linux Docker daemon cannot build or run the Windows Server Core image. [GitHub's Windows 2022 runner inventory](https://github.com/actions/runner-images/blob/main/images/windows/Windows2022-Readme.md)

## Enable GitHub Actions and delivery

The existing client, server and database repositories are component repositories. Put this workflow at the root of the [full-stack integration repository](https://github.com/dashkalikov/neiroslop-integration), which has `client/`, `backend/`, the root npm and Vite files, the two Dockerfiles, `compose.yaml`, `deploy/`, `scripts/ci/` and `.github/workflows/`. Use the same integration commit to capture the selected versions of the client and server. Review the staged files before the initial commit so credentials, local database data, dependency caches and repository exports stay out of Git.

1. Push the reviewed integration changes to `main`. Run **Container CI/CD** from the Actions tab or open a pull request and watch the Linux and Windows jobs. Require the container checks in the integration repository's branch protection if they should gate merges.
2. After the checks pass, create a release tag on the reviewed commit. Restrict who can create or update `v*` tags in the repository's ruleset.

   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. Read the two image digests in the run summary. The tags are `ghcr.io/<owner>/<integration-repo>:linux-v1.0.0` and `ghcr.io/<owner>/<integration-repo>:windows-ltsc2022-v1.0.0`. The workflow uses GitHub's job token to publish. A target host pulling a private package needs separately configured read access. [GitHub Container Registry publishing](https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images)

Use the recorded digest with `docker pull` for repeatable delivery. On Windows, substitute the published Windows digest for `neiroslop:windows` in the run command above.

## Enable the optional Linux deployment

1. On a Linux amd64 deployment host with Docker Compose, install [deploy/compose.yaml](https://github.com/dashkalikov/neiroslop-integration/blob/main/deploy/compose.yaml) as `/srv/neiroslop/compose.yaml`. Set up a restricted SSH deploy account with Docker access and access to the private GHCR package if needed.
2. Create `/etc/neiroslop/app.env` on that host and allow the deploy account to read it. Set `DATABASE_URL` for the persistent PostgreSQL service, `ALLOWED_ORIGINS` to the HTTPS site origin, and `COOKIE_SECURE=true`. Configure your TLS reverse proxy to send traffic to `127.0.0.1:8000`. PostgreSQL must allow the app user to create the initial tables and update the catalog.
3. In the integration repository, create the `production` GitHub environment, restrict it to release tags, and configure required reviewers where available. Add environment secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` and `DEPLOY_KNOWN_HOSTS`. Use the server's independently verified SSH host key for the last value. Set the repository variable `DEPLOY_LINUX=true` when the target is ready. [GitHub deployment environments](https://docs.github.com/en/actions/concepts/workflows-and-actions/deployment-environments)
4. Push a release tag and approve its production job if configured. Verify the public site and its `/api/health` endpoint. The app's health check includes a live database query.

If the new container fails its health check, the script attempts to restore the previous running container's image reference and marks the job failed. For a failed first deployment, it stops the candidate. Inspect the app logs on the deployment host. You can also redeploy a known good Linux digest on the host.

```bash
bash deploy-linux.sh "$PREVIOUS_LINUX_IMAGE"
```

Use the checked-in deployment script for that command and set `PREVIOUS_LINUX_IMAGE` to the full digest reference from a successful release. Image rollback restores application code. Database schema changes need their own migration and rollback procedure. This prototype currently creates tables on startup and has no versioned migration runner.
