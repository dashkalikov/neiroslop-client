export function createCarousel({ids,onChange,onPauseChange=()=>{},schedule=setTimeout,cancel=clearTimeout,interval=10000}){
  let index=0,timer=null,playing=false,disposed=false;
  function clear(){if(timer!==null){cancel(timer);timer=null;}}
  function queue(){
    if(!playing||disposed||ids.length<2)return;
    timer=schedule(()=>{timer=null;move(index+1);},interval);
  }
  function move(next){
    if(disposed||!ids.length)return;
    clear();index=(next+ids.length)%ids.length;onChange(ids[index]);queue();
  }
  return {
    start(){if(disposed||playing)return;playing=true;onPauseChange(false);queue();},
    pause(){if(disposed)return;playing=false;clear();onPauseChange(true);},
    next(){move(index+1);},previous(){move(index-1);},
    select(id){const next=ids.indexOf(id);if(next>=0)move(next);},
    dispose(){disposed=true;playing=false;clear();},
  };
}
