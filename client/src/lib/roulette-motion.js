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
