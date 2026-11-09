const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>1-(1-n)**3;
const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};

/** Visual trajectory constrained to the authoritative server result. */
export function sampleRouletteMotion(from,to,progress){
  const t=clamp(progress),wheel=from.wheel+(to.wheel-from.wheel)*ease(t);
  const captureWheel=from.wheel+(to.wheel-from.wheel)*ease(.8);
  const captureBall=to.ball-(to.wheel-captureWheel);
  const u=Math.max(0,t-.8);
  const rattle=t<1?Math.sin(u*80)*Math.exp(-24*u)*2*(1-t)/.2:0;
  const ball=t<.8?from.ball+(captureBall-from.ball)*ease(t/.8):to.ball-(to.wheel-wheel)+rattle;
  const drop=smooth((t-.56)/.25);
  const bounce=t>.66&&t<.96?Math.abs(Math.sin((t-.66)*65))*.13*(1-smooth((t-.66)/.3)):0;
  return {wheel,ball:t===1?to.ball:ball,ballRadius:3.86+(2.43-3.86)*drop,
    ballHeight:t===1?.335:1.04+(.335-1.04)*drop+bounce};
}

/** Linear contact speed along the track, before the rotor carries the ball. */
export function sampleRouletteRoll(from, to, progress, duration) {
  const t = clamp(progress);
  if (t >= .8) return { gain: 0, rate: .55 };
  const next = Math.min(.8, t + .001);
  // Stay on the rolling side of the capture boundary when sampling velocity.
  const end = Math.min(next, .799999);
  if (end <= t) return { gain: 0, rate: .55 };
  const a = sampleRouletteMotion(from, to, t);
  const b = sampleRouletteMotion(from, to, end);
  const distance = Math.abs(b.ball - a.ball) * Math.PI / 180 * (a.ballRadius + b.ballRadius) / 2;
  const speed = distance / ((end - t) * duration / 1000);
  const strength = speed / (speed + 85);
  const release = 1 - smooth((t - .56) / .24);
  return { gain: .46 * Math.sqrt(strength) * release, rate: .55 + 1.7 * strength };
}
