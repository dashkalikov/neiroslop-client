import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { VELVET_LEVER_IMAGE, VELVET_LEVER_MOUNT_IMAGE, velvetLeverArtwork } from '../lib/saloon-machine.js';

export default function VelvetLeverHardware({ progress }) {
  const atlas = useId().replaceAll(':', '') + '-velvet-lever';
  const { mount, ...movingParts } = velvetLeverArtwork(progress);
  const canvas = useRef(null);
  const renderer = useRef(null);
  const latestProgress = useRef(progress);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    latestProgress.current = progress;
    renderer.current?.draw(progress);
  }, [progress]);

  useEffect(() => {
    let cancelled = false;
    const target = canvas.current;
    const showFallback = () => { if (!cancelled) setReady(false); };
    target.addEventListener('webglcontextlost', showFallback);
    import('../lib/velvet-lever-rig.js').then(({ createVelvetLeverRenderer }) => {
      if (!cancelled) return createVelvetLeverRenderer(target);
    }).then(instance => {
      if (!instance) return;
      if (cancelled) {
        instance.dispose();
        return;
      }
      renderer.current = instance;
      instance.draw(latestProgress.current);
      setReady(true);
    }).catch(showFallback);
    return () => {
      cancelled = true;
      target.removeEventListener('webglcontextlost', showFallback);
      renderer.current?.dispose();
      renderer.current = null;
    };
  }, []);

  return <g data-velvet-renderer={ready ? '3d' : 'illustrated'}>
    <defs>
      <image id={atlas} href={VELVET_LEVER_IMAGE} width="1024" height="1536" />
    </defs>
    {!ready && Object.entries(movingParts).map(([part, frame]) => (
      <svg key={part} className={`velvet-lever-${part}`} {...frame} preserveAspectRatio="none" overflow="hidden">
        <use href={'#' + atlas} />
      </svg>
    ))}
    <svg className="velvet-lever-mount" {...mount} preserveAspectRatio="none" overflow="hidden">
      <image href={VELVET_LEVER_MOUNT_IMAGE} width="1254" height="1254" />
    </svg>
    <foreignObject width="200" height="1200" pointerEvents="none" visibility={ready ? 'visible' : 'hidden'}>
      <canvas ref={canvas} aria-hidden="true" style={{ display: 'block', width: '100%', height: '100%' }} />
    </foreignObject>
  </g>;
}
