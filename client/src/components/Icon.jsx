const paths = {
  pause:'<path d="M8 5v14M16 5v14" stroke-width="3"/>',
  play:'<path d="m8 4 12 8-12 8Z"/>',
  settings:'<path d="m9 3 1-1h4l1 3 3 1 3-1 2 4-2 2v3l2 2-2 4-3-1-3 1-1 3h-4l-1-3-3-1-3 1-2-4 2-2v-3l-2-2 2-4 3 1 3-1Z"/><circle cx="12" cy="12" r="3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
  moon: '<path d="M20.8 13A9 9 0 0 1 11 3.2 9 9 0 1 0 20.8 13Z"/>',
  auto: '<path d="m9 7 8 5-8 5Z"/><path d="M20.2 7A9 9 0 0 0 4 6L2 9m0-5v5h5M3.8 17A9 9 0 0 0 20 18l2-3m0 5v-5h-5"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  lobby: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-8h6v8"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  book: '<path d="M12 5Q6 1 2 4v15q5-3 10 1 5-4 10-1V4q-4-3-10 1Zm0 0v15"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 10h18c0-3-3-3-3-10M10 21h4"/>',
  shield: '<path d="m12 2 8 3v6c0 6-8 11-8 11S4 17 4 11V5Z"/><path d="m8 11 3 3 5-5"/>',
  coins: '<ellipse cx="9" cy="6" rx="6" ry="3"/><path d="M3 6v5c0 4 12 4 12 0V6M3 11v5c0 3 8 4 11 1M18 8c5 1 5 5 0 6M18 14c5 1 5 5 0 6M21 11v6"/>',
  gift: '<path d="M3 8h18v5H3ZM5 13v9h14v-9M12 8v14"/><path d="M12 8C2 8 4 0 8 3l4 5c10 0 8-8 4-5Z"/>',
  sparkles: '<path d="m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3ZM20 2v4M18 4h4M4 18v4M2 20h4"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  slots: '<rect x="2" y="4" width="20" height="16" rx="3"/><path d="M8 4v16M16 4v16M5 9v5M11 9h3l-2 5M18 9h2l-1 5"/>',
  search: '<circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/>',
  volume: '<path d="m11 3-6 5H2v8h3l6 5ZM15 8a6 6 0 0 1 0 8M18 4a11 11 0 0 1 0 16"/>',
  mute: '<path d="m11 3-6 5H2v8h3l6 5ZM16 9l6 6M22 9l-6 6"/>',
  spin: '<path d="M21 7v5h-5M3 17v-5h5"/><path d="M5 7a8 8 0 0 1 13-2l3 7M3 12l3 7a8 8 0 0 0 13-2"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 10-12h-7Z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
};

export default function Icon({ name, className = '' }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: paths[name] || paths.sparkles }} />;
}
