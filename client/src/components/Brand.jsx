export function PalmMark(){
  return <svg className="palm-brand-mark" viewBox="0 0 64 64" aria-hidden="true">
    <defs><linearGradient id="brand-sunset" x2="0" y2="1"><stop stopColor="#ffb482"/><stop offset=".5" stopColor="#ff64ab"/><stop offset="1" stopColor="#9a62e6"/></linearGradient></defs>
    <circle cx="32" cy="29" r="23" fill="url(#brand-sunset)"/>
    <path d="M9 32h46M11 38h42M15 44h34M20 50h24" stroke="#221833" strokeWidth="2"/>
    <path d="M27 57q12-18 9-39M36 19q-12-16-24-5 13-3 24 5Zm0 0q-1-17 15-14-11 6-15 14Zm0 0q16-10 23 5-12-7-23-5Zm0 0Q19 16 17 33q8-10 19-14Zm0 0q11 1 10 15-6-10-10-15Z" fill="#182d3c" stroke="#71e0db" strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>;
}

export default function Brand(){
  return <><PalmMark/><img className="brand-wordmark" src="/assets/neiroslop-logo.png" alt="NEIROSLOP BURMALDA" width="190" height="88"/></>;
}
