import { useEffect,useRef,useState } from 'react';
import { asset, games } from '../data/games.js';
import { useLounge } from '../LoungeContext.jsx';
import Icon from './Icon.jsx';
import {createCarousel} from '../lib/carousel.js';

const featureIds=games.map(game=>game.id);

export default function Lobby({ view, navigate }) {
  const { favorites, toggleFavorite, history } = useLounge();
  const [feature, setFeature] = useState(games[0].id);
  const [rotationPaused,setRotationPaused]=useState(false);
  const carousel=useRef(null);
  useEffect(()=>{
    const controller=createCarousel({ids:featureIds,onChange:setFeature,onPauseChange:setRotationPaused});
    carousel.current=controller;
    const start=()=>controller.start();
    if(document.getElementById('startup-screen'))window.addEventListener('neiroslop:ready',start,{once:true});else start();
    return ()=>{window.removeEventListener('neiroslop:ready',start);controller.dispose();};
  },[]);
  useEffect(()=>{
    const index=featureIds.indexOf(feature);
    for(const offset of [-1,1]){const image=new Image();image.src=asset(featureIds[(index+offset+featureIds.length)%featureIds.length]);}
  },[feature]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All worlds');
  const [sort, setSort] = useState('Featured');
  const game = games.find(g => g.id === feature);
  const recentIds = new Set(history.map(round => round.game));
  const list = games.filter(g => (view !== 'favorites' || favorites.includes(g.id)) &&
    (view !== 'recent' || recentIds.has(g.id)) && g.name.toLowerCase().includes(query.toLowerCase()) &&
    (category === 'All worlds' || category === g.category));
  if (sort === 'Name A–Z') list.sort((a, b) => a.name.localeCompare(b.name));

  return <main className="lobby-main">
    <section className="welcome"><div><p className="eyebrow"><span className="green-dot" /> GOOD TIMES START HERE</p><h1>Welcome to your lucky place<span>.</span></h1><p>A little thrill, a little wonder. A whole lot of possibilities.</p></div><div className="virtual-badge"><Icon name="shield" />100% virtual. 100% fun.</div></section>
    <section className={`hero premium-hero featured-carousel ${game.id}`} aria-label={`Featured game ${game.name}`} aria-roledescription="carousel" onKeyDown={event=>{if(event.key==='ArrowLeft'){event.preventDefault();carousel.current?.previous();}else if(event.key==='ArrowRight'){event.preventDefault();carousel.current?.next();}}}>
      <img key={game.id} className="hero-image" src={asset(game.id)} alt="" fetchpriority="high" />
      <button className="hero-arrow hero-previous" onClick={()=>carousel.current?.previous()} aria-label="Previous featured game"><Icon name="arrow"/></button>
      <button className="hero-arrow hero-next" onClick={()=>carousel.current?.next()} aria-label="Next featured game"><Icon name="arrow"/></button>
      <div className="hero-shade" /><div className="ambient-motes" aria-hidden="true">{Array.from({length:12}, (_, i) => <i key={i} style={{'--i': i}} />)}</div>
      <div className="hero-content"><span className="feature-pill"><span>✦</span> THE ART OF A LITTLE ESCAPE</span><h2>{game.headline[0]}<br /><em>{game.headline[1]}</em></h2><p>{game.feature.split('\n').map((line, i) => <span key={line}>{line}{i === 0 ? <br /> : null}</span>)}</p><button className="primary-button" onClick={() => navigate(`game/${game.id}`)}>Discover the game <Icon name="arrow" /></button><span className="hero-footnote">YOUR NEXT ADVENTURE AWAITS</span></div>
      <div className="hero-game-label"><span>{game.subtitle}</span><strong>{game.name}</strong><div>✦ &nbsp; {game.reels || 5} reels &nbsp; · &nbsp; {game.meta}</div></div>
      <div className="hero-pages">{games.map(g => <button key={g.id} className={feature === g.id ? 'selected' : ''} onClick={() => carousel.current?.select(g.id)} aria-label={`Feature ${g.name}`} aria-pressed={feature === g.id} />)}</div>
      <div className="hero-rotation-tools"><span>{String(featureIds.indexOf(feature)+1).padStart(2,'0')} / {String(games.length).padStart(2,'0')}</span><button onClick={()=>rotationPaused?carousel.current?.start():carousel.current?.pause()} aria-label={rotationPaused?'Resume banner rotation':'Pause banner rotation'} aria-pressed={rotationPaused}><Icon name={rotationPaused?'play':'pause'}/></button></div>
    </section>
    <section className="perks" aria-label="Casino features">{[['coins','violet','Play for the feeling','Virtual coins. Real excitement.'],['gift','gold','A daily dose of lucky','1,500 free coins, every day.'],['sparkles','mint','Find your kind of fun','Beautiful worlds. Memorable moments.']].map(([ic,color,title,copy]) => <div key={title}><span className={`perk-icon ${color}`}><Icon name={ic} /></span><p><strong>{title}</strong><span>{copy}</span></p></div>)}</section>
    <section className="games-section" aria-labelledby="games-title"><div className="section-heading"><div><p className="eyebrow collection-eyebrow">THE NEIROSLOP BURMALDA COLLECTION</p><h2 id="games-title">{view === 'favorites' ? 'Your favorite escapes' : view === 'recent' ? 'Back to your favorite feeling' : 'Choose your next adventure'} <span>✦</span></h2><p>{games.length} extraordinary worlds. Where will you go?</p></div><span className="game-count">Thoughtfully crafted. Ready to explore.</span></div>
      <div className="filter-bar"><div className="filters" role="group" aria-label="Filter games">{[['all','grid','All games'],['favorites','heart','Favorites'],['recent','clock','Recent']].map(([id,ic,name]) => <button key={id} className={`filter ${view === id ? 'active' : ''}`} onClick={() => navigate(id)}><Icon name={ic} />{name}{id === 'all' ? <span className="filter-number">{games.length}</span> : null}</button>)}</div><div className="catalog-tools"><select value={category} onChange={e => setCategory(e.target.value)} aria-label="Game theme">{['All worlds',...new Set(games.map(g=>g.category))].map(c => <option key={c}>{c}</option>)}</select><select className="sort-select" value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort games"><option>Featured</option><option>Name A–Z</option></select><label className="search-box"><Icon name="search" /><input type="search" aria-label="Search games" value={query} onChange={e => setQuery(e.target.value)} placeholder="Find your game…" /></label></div></div>
      <div className="game-grid">{list.map(g => <article key={g.id} className={`game-card premium-card ${g.id}`}>
        <div className="card-cover"><button className="card-play-area" onClick={() => navigate(`game/${g.id}`)} aria-label={`Play ${g.name}`}><img src={asset(g.id)} alt="" loading="lazy" /><span className={`card-tag ${g.id}`}>{g.tag}</span><span className="cover-title"><small>{g.subtitle}</small><strong>{g.title[0]}<em>{g.title[1]}</em></strong></span><span className="play-overlay"><span>▶</span></span></button><button className={`favorite-button ${favorites.includes(g.id) ? 'saved' : ''}`} onClick={() => toggleFavorite(g.id)} aria-label={`${favorites.includes(g.id) ? 'Remove' : 'Add'} ${g.name} ${favorites.includes(g.id) ? 'from' : 'to'} favorites`} aria-pressed={favorites.includes(g.id)}><Icon name="heart" /></button><span className="card-bonus-chip">✦ &nbsp; {g.meta}</span></div>
        <div className="card-info"><h3>{g.name}</h3><span>{g.category}</span></div><div className="card-meta"><span>{g.copy}</span><button onClick={() => navigate(`game/${g.id}`)} aria-label={`Open ${g.name}`}><Icon name="arrow" /></button></div>
      </article>)}</div>
      {!list.length ? <div className="empty-state"><span>✧</span><h3>{query ? 'No adventures found.' : 'A little quiet here.'}</h3><p>{view === 'favorites' ? 'Tap a heart to keep a world close.' : view === 'recent' ? 'Play a round and your recent games will appear here.' : 'Try another theme or search term.'}</p><button className="secondary-button" onClick={() => {setQuery('');setCategory('All worlds');navigate('all');}}>Explore all games</button></div> : null}
    </section>
    <section className="bottom-banner"><span className="banner-sparkle">✧</span><div><strong>Your first adventure is on us.</strong><p>10,000 welcome coins. {games.length} beautiful worlds. Make yourself at home.</p></div><span className="welcome-label"><span className="green-dot" /> FREE TO EXPLORE</span></section>
  </main>;
}
