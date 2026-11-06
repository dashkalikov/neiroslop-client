export const GAME_GROUPS=[{id:'all',name:'All games',icon:'grid',description:'Every kind of escape'},
  {id:'slots',name:'Slots',icon:'slots',description:'Reels, stories & free spins'},
  {id:'mechanical',name:'Mechanical',icon:'settings',description:'Pull a lever. Feel the craft.'},
  {id:'tables',name:'Table games',icon:'roulette',description:'Take a seat at the table'}];
export function filterCatalog(games,{group='all',view='all',favorites=[],recent=[],query='',theme='All worlds'}={}){
  return games.filter(g=>(group==='all'||(group==='tables'?g.type==='table':group==='mechanical'?g.type!=='table'&&g.reels===3:g.type!=='table'))&&
    (view!=='favorites'||favorites.includes(g.id))&&(view!=='recent'||recent.includes(g.id))&&
    g.name.toLowerCase().includes(query.trim().toLowerCase())&&(theme==='All worlds'||g.category===theme));
}
