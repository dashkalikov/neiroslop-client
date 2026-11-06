import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { VELVET_LEVER_IMAGE, mechanicalLeverAngle } from './saloon-machine.js';

const viewWidth = 200;
const viewHeight = 1200;
const cameraDistance = 1700;
const gripHeight = 430;

export function buildVelvetLeverRig(rubyTexture = null) {
  const root = new THREE.Group();
  // The fixed bearing is drawn behind the rig.
  const hinge = new THREE.Group();
  const hubView = new THREE.Group();
  hubView.position.x = 4;
  // Give the hub the same right-side presentation as its illustrated backplate.
  // Only the hub is angled, so the arm keeps its straight forward swing.
  hubView.rotation.y = THREE.MathUtils.degToRad(-20);
  const hub = new THREE.Group();
  hubView.add(hub);
  root.add(hinge, hubView);

  const brass = new THREE.MeshStandardMaterial({ color: '#c18a45', metalness: .92, roughness: .28 });
  const trim = new THREE.MeshStandardMaterial({ color: '#dba965', metalness: .88, roughness: .21 });
  const groove = new THREE.MeshStandardMaterial({ color: '#533315', metalness: .7, roughness: .45 });
  const enamel = new THREE.MeshStandardMaterial({ color: '#2c090d', metalness: .3, roughness: .42 });
  const ruby = new THREE.MeshBasicMaterial({ color: rubyTexture ? '#ffffff' : '#a71329', map: rubyTexture, alphaTest: .35, toneMapped: false });
  const materials = [brass, trim, groove, enamel, ruby];

  function mesh(geometry, material, x = 0, y = 0, z = 0, parent = hinge) {
    const part = new THREE.Mesh(geometry, material);
    part.position.set(x, y, z);
    parent.add(part);
    return part;
  }

  function axleBand(radius, width, x, material) {
    const part = mesh(new THREE.CylinderGeometry(radius, radius, width, 48), material, x, 0, 0, hub);
    part.rotation.z = Math.PI / 2;
    return part;
  }

  // The stepped cap and dark gasket make the right edge distinct from the sleeve.
  const sleeve = axleBand(27, 31, 0, brass);
  axleBand(28, 3.2, -14, trim);
  axleBand(28, 3.2, 15, trim);
  axleBand(25, 4, 18, brass);
  axleBand(24, 3, 21, groove);
  axleBand(23.5, 5, 25, brass);
  axleBand(21.5, 2, 28, trim);
  const endFace = mesh(new THREE.CircleGeometry(19.5, 48), brass, 29.1, 0, 0, hub);
  endFace.rotation.y = Math.PI / 2;
  mesh(new THREE.BoxGeometry(.6, 23, 3.2), enamel, 29.35, 0, 0, hub);
  const indexMark = mesh(new THREE.BoxGeometry(14, 3.8, 1.8), enamel, 0, 5, 26.4, hub);
  indexMark.rotation.x = -.18;
  const secondMark = mesh(new THREE.BoxGeometry(14, 2, 1.5), groove, 0, 19, 19.1, hub);
  secondMark.rotation.x = -.76;

  const shaftProfile = [
    [0, 19], [9, 19], [14, 24], [14, 35], [12.5, 39],
    [13, 42], [13, 51], [10.5, 56], [10.5, 350],
    [13, 355], [13, 362], [15, 364], [15, 370], [17, 373],
    [17, 384], [15, 387], [0, 387],
  ];
  const shaft = new THREE.LatheGeometry(shaftProfile.map(([radius, y]) => new THREE.Vector2(radius, y)), 48);
  let shaftMaterial = brass;
  if (rubyTexture) {
    // The original fluted brass artwork supplies grain and engraving on the
    // lathed arm. Lighting and the cylindrical silhouette still come from the mesh.
    const positions = shaft.getAttribute('position');
    const uv = shaft.getAttribute('uv');
    for (let i = 0; i < positions.count; i++) {
      const px = 272 + 2.2 * positions.getX(i);
      const py = Math.max(352, 1422 - positions.getY(i) * (1422 - 211) / gripHeight);
      uv.setXY(i, px / 1024, 1 - py / 1536);
    }
    shaftMaterial = new THREE.MeshStandardMaterial({ map: rubyTexture, metalness: .68, roughness: .3 });
    materials.push(shaftMaterial);
  }
  mesh(shaft, shaftMaterial);
  mesh(new THREE.CapsuleGeometry(1.05, 270, 4, 8), groove, 0, 203, 10.35);
  mesh(new THREE.CylinderGeometry(13.3, 13.3, 2.5, 48), trim, 0, 46);
  mesh(new THREE.CylinderGeometry(16.5, 16.5, 2.5, 48), trim, 0, 378);

  // Wrap the original ruby artwork around a solid sphere so its facets turn
  // with the shaft. Its position and diameter remain independent of the view.
  const rubyRadius = 51;
  const globe = new THREE.SphereGeometry(rubyRadius, 48, 32);
  const vertices = globe.getAttribute('position');
  const uv = globe.getAttribute('uv');
  for (let i = 0; i < vertices.count; i++) {
    const px = 270 + 141 * vertices.getX(i) / rubyRadius;
    const py = 211 - 134 * vertices.getY(i) / rubyRadius;
    uv.setXY(i, px / 1024, 1 - py / 1536);
  }
  const grip = mesh(globe, ruby, 0, gripHeight);

  return {
    root, sleeve, endFace, indexMark, grip,
    setProgress(progress) {
      const angle = mechanicalLeverAngle(progress);
      hinge.rotation.x = angle;
      hub.rotation.x = angle;
    },
    dispose() {
      root.traverse(part => { if (part.isMesh) part.geometry.dispose(); });
      for (const material of materials) material.dispose();
    },
  };
}

export async function createVelvetLeverRenderer(canvas) {
  const texture = await new THREE.TextureLoader().loadAsync(VELVET_LEVER_IMAGE);
  texture.colorSpace = THREE.SRGBColorSpace;
  let renderer, rig, environment;
  function dispose() {
    rig?.dispose();
    environment?.dispose();
    texture.dispose();
    renderer?.dispose();
    renderer?.forceContextLoss();
  }
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(viewWidth, viewHeight, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    const scene = new THREE.Scene();
    const fov = THREE.MathUtils.radToDeg(2 * Math.atan(viewHeight / (2 * cameraDistance)));
    const camera = new THREE.PerspectiveCamera(fov, viewWidth / viewHeight, 1, 3000);
    camera.position.set(0, gripHeight, cameraDistance);
    // Use the same principal point as the lever's pointer projection.
    camera.setViewOffset(viewWidth, viewHeight, 0, gripHeight, viewWidth, viewHeight);
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    try {
      environment = pmrem.fromScene(room, .05);
    } finally {
      room.dispose();
      pmrem.dispose();
    }
    scene.environment = environment.texture;
    scene.environmentIntensity = .85;
    const key = new THREE.DirectionalLight('#ffe4bc', 1.4);
    key.position.set(-350, 650, 600);
    scene.add(key);
    rig = buildVelvetLeverRig(texture);
    scene.add(rig.root);
    return {
      draw(progress) {
        rig.setProgress(progress);
        renderer.render(scene, camera);
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
