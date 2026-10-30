import { mkdir, writeFile } from 'node:fs/promises';

// Self-contained vector textures need no font downloads or runtime drawing.
const output = new URL('../client/public/assets/win-tokens/', import.meta.url);
await mkdir(output, { recursive: true });
const chips = [
  ['green', '25', '#36775b', '#153c2e'],
  ['orange', '100', '#ca7b39', '#763d1c'],
  ['red', '500', '#b94843', '#662626'],
  ['blue', '1000', '#405b99', '#202e56'],
  ['purple', '2500', '#834c87', '#45264c'],
  ['pink', '5000', '#c17aa7', '#793f65'],
  ['platinum', '50', '#91a7c1', '#43516b'],
];
const svg = (body, height = 104) => `<svg xmlns="http://www.w3.org/2000/svg" width="104" height="${height}" viewBox="0 0 104 ${height}">${body}</svg>`;

function chipFace(value, color, dark) {
  const inserts = Array.from({ length: 10 }, (_, i) => `<g transform="rotate(${i * 36} 52 49)"><path d="M47 5h10l-1 15h-8Z" fill="#eee9d9"/><path d="M49 7h6v10h-6Z" fill="#fff" opacity=".45"/><path d="M39 9l3-1 4 13-3 1Z" fill="#fff" opacity=".28"/></g>`).join('');
  return `<defs>
    <linearGradient id="edge" x2=".3" y2="1"><stop stop-color="${color}"/><stop offset=".45" stop-color="${dark}"/><stop offset=".65" stop-color="${color}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
    <radialGradient id="face" cx=".3" cy=".2" r=".9"><stop stop-color="${color}"/><stop offset=".65" stop-color="${color}"/><stop offset="1" stop-color="${dark}"/></radialGradient>
    <linearGradient id="paper" x2=".8" y2="1"><stop stop-color="#fffdf0"/><stop offset=".5" stop-color="#e5dfc8"/><stop offset="1" stop-color="#bdb99f"/></linearGradient>
    <linearGradient id="shine" x2=".8" y2="1"><stop stop-color="#fff" stop-opacity=".7"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".25"/></linearGradient>
  </defs><g id="chip">
    <circle cx="52" cy="55" r="46" fill="url(#edge)" stroke="${dark}" stroke-width="2"/>
    <path d="M10 71q42 48 84 0M12 76q40 44 80 0M16 82q36 34 72 0" fill="none" stroke="#fff" stroke-opacity=".2"/>
    <circle cx="52" cy="49" r="46" fill="url(#face)" stroke="${dark}" stroke-width="2"/>
    ${inserts}
    <circle cx="52" cy="49" r="43" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width=".8"/>
    <circle cx="52" cy="49" r="34" fill="none" stroke="#161b22" stroke-opacity=".4" stroke-width="1.5"/>
    <circle cx="52" cy="49" r="31.5" fill="url(#paper)" stroke="#f7eccb" stroke-width="1.2"/>
    <circle cx="52" cy="49" r="28.5" fill="none" stroke="${color}" stroke-width=".7" stroke-dasharray="1 1.5"/>
    <text x="52" y="33" text-anchor="middle" font-family="Georgia,serif" font-size="5.5" letter-spacing="1.1" fill="${dark}">LUCKY LOUNGE</text>
    <text x="52" y="60" text-anchor="middle" font-family="Georgia,serif" font-size="${value.length > 3 ? 23 : 28}" font-weight="bold" fill="${dark}">${value}</text>
    <text x="52" y="71" text-anchor="middle" font-family="Georgia,serif" font-size="5" letter-spacing="1.8" fill="${dark}">CASINO</text>
    <circle cx="52" cy="49" r="46" fill="url(#shine)"/>
  </g>`;
}

for (const [name, value, color, dark] of chips) {
  const face = chipFace(value, color, dark);
  await writeFile(new URL(`chip-${name}.svg`, output), svg(face));
  if (name === 'blue' || name === 'purple') {
    const layers = Array.from({ length: 6 }, (_, i) => {
      const y = 112 - i * 14;
      return `<ellipse cx="52" cy="${y + 9}" rx="46" ry="20" fill="${dark}" stroke="${color}"/>
        <use href="#chip" transform="translate(0 ${y - 22}) scale(1 .45)"/>
        <path d="M13 ${y + 15}l7 4v6l-7-4ZM33 ${y + 23}l8 1v5l-8-1ZM63 ${y + 24}l8-1v5l-8 1ZM84 ${y + 19}l7-4v6l-7 4Z" fill="#e8dfce"/>
        <path d="M12 ${y + 22}q40 18 80 0" fill="none" stroke="${color}" stroke-width="1.2"/>`;
    }).join('');
    await writeFile(new URL(`stack-${name}.svg`, output), svg(`<defs>${face}</defs>${layers}`, 152));
  }
}

for (const metal of ['gold', 'silver']) {
  const gold = metal === 'gold';
  const light = gold ? '#fff2ae' : '#f3f6ff';
  const mid = gold ? '#dca847' : '#b8c4d1';
  const dark = gold ? '#94601e' : '#66758b';
  const leaves = Array.from({ length: 10 }, (_, i) => `<g transform="rotate(${i * 11 - 50} 52 51)"><path d="M22 65q-10-10-3-17 8 6 3 17M23 62q7-9 12-6-3 9-12 6" fill="${mid}" stroke="${light}" stroke-width=".6"/></g>`).join('');
  await writeFile(new URL(`coin-${metal}.svg`, output), svg(`<defs>
    <linearGradient id="metal" x1=".1" y1=".1" x2=".9" y2="1"><stop stop-color="${light}"/><stop offset=".22" stop-color="${mid}"/><stop offset=".46" stop-color="${light}"/><stop offset=".62" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
    <radialGradient id="field" cx=".3" cy=".25"><stop stop-color="${light}"/><stop offset=".6" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/></radialGradient>
  </defs>
  <circle cx="52" cy="55" r="46" fill="${dark}" stroke="${mid}" stroke-width="2"/>
  <path d="M9 70q43 47 86 0M12 77q40 39 80 0" fill="none" stroke="${light}" stroke-width="1"/>
  <circle cx="52" cy="49" r="46" fill="url(#metal)" stroke="${dark}"/>
  <circle cx="52" cy="49" r="43" fill="none" stroke="${dark}" stroke-width="2" stroke-dasharray=".8 1.8"/>
  <circle cx="52" cy="49" r="40" fill="url(#field)" stroke="${light}"/>
  <circle cx="52" cy="49" r="37" fill="none" stroke="${light}" stroke-width=".7" stroke-dasharray=".6 2"/>
  <path d="M30 79q-15-22-5-42M74 79q15-22 5-42" fill="none" stroke="${light}" stroke-width="1.2"/>
  ${leaves}<g transform="translate(104 0) scale(-1 1)">${leaves}</g>
  <path d="M39 75l3-11q-7-5-5-16l3-13q3-10 15-10 14 1 15 14l-2 6 7 9-7 3-1 8-10 1 3 10Z" fill="url(#metal)" stroke="${dark}" stroke-width="1.3"/>
  <path d="M40 43q-6-16 12-18 13-2 16 12-8-6-14-3 7 5-1 9 4 5-3 9 3 6-5 9M42 67l14 3M44 72l11 2M62 45l4 1M62 58l5 1" fill="none" stroke="${dark}" stroke-width="1.6"/>
  <path d="M41 39q-1-12 11-12M39 48l2-9M43 66l-2 8M58 28q8 2 9 9" fill="none" stroke="${light}" stroke-width="1.5"/>
  <text x="52" y="20" text-anchor="middle" font-family="Georgia,serif" font-size="5.5" letter-spacing="1.5" fill="${dark}">LUCKY LOUNGE</text>
  <text x="52" y="86" text-anchor="middle" font-family="Georgia,serif" font-size="6" letter-spacing="1" fill="${dark}">${gold ? 'FINE GOLD · 999' : 'FINE SILVER · 925'}</text>
  <path d="M17 28q24-31 58-11" fill="none" stroke="${light}" stroke-width="1.8" stroke-linecap="round"/>`));
}
