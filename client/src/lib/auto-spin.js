/** Schedule a single round only after the previous promise has settled. */
export function createAutoSpin({spin, status, onChange = () => {}, onStop = () => {},
  schedule = setTimeout, cancel = clearTimeout, delay = () => 650}) {
  let enabled = false;
  let running = false;
  let disposed = false;
  let timer = null;

  function stop(reason = 'manual') {
    const wasEnabled = enabled;
    enabled = false;
    if (timer !== null) { cancel(timer); timer = null; }
    if (!disposed && wasEnabled) { onChange(false); onStop(reason); }
  }
  function queue() {
    if (enabled && !disposed && !running && timer === null) timer = schedule(tick, delay());
  }
  async function tick() {
    timer = null;
    if (!enabled || disposed || running) return;
    const action = status();
    if (action === 'wait') { queue(); return; }
    if (action !== 'spin') { stop(action); return; }
    running = true;
    try {
      if (await spin() === false) stop('error');
    } catch { stop('error'); }
    finally { running = false; queue(); }
  }
  return {
    start() {
      if (enabled || disposed) return;
      enabled = true; onChange(true); queue();
    },
    stop,
    isEnabled: () => enabled,
    dispose() { disposed = true; stop(); },
  };
}
