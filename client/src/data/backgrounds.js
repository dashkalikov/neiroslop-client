export const backgrounds = [
  {id:'none',name:'Classic',description:'Clean surfaces · no image',image:null},
  {id:'miami',name:'Miami Nights',description:'Loading-screen skyline · neon palms',image:'/assets/miami-startup.png'},
  {id:'aurora',name:'Northern Lights',description:'Emerald skies · Arctic calm',image:'/assets/wallpaper-aurora.png'},
  {id:'coast',name:'Azure Coast',description:'Turquoise water · sunset glow',image:'/assets/wallpaper-coast.png'},
  {id:'forest',name:'Emerald Forest',description:'Golden light · quiet woodland',image:'/assets/wallpaper-forest.png'},
  {id:'lakeside',name:'Gone Fishing',description:'Mountain lake · blue water',image:'/assets/bigbass-scene.png'},
  {id:'moonlight',name:'Moonlit Escape',description:'Silver moon · enchanted violet',image:'/assets/moon-scene.png'},
  {id:'canyon',name:'Golden Canyon',description:'Warm timber · frontier dusk',image:'/assets/goldrush-scene.png'},
  {id:'velvet',name:'Velvet Lounge',description:'Ruby velvet · polished brass',image:'/assets/royal-scene.png'},
];
export const backgroundById = Object.fromEntries(backgrounds.map(background=>[background.id,background]));
