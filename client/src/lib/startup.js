export function createStartup({onExit,onRemove,minimum=2600,maximum=7000,fade=650,schedule=setTimeout,cancel=clearTimeout}){
  let elapsed=false,loaded=false,exiting=false,disposed=false;
  const timers=new Set();
  function later(fn,delay){const id=schedule(()=>{timers.delete(id);fn();},delay);timers.add(id);}
  function clear(){for(const id of timers)cancel(id);timers.clear();}
  function exit(){
    if(exiting||disposed)return;
    exiting=true;clear();onExit();
    if(fade===0)onRemove();else later(()=>{if(!disposed)onRemove();},fade);
  }
  later(()=>{elapsed=true;if(loaded)exit();},minimum);
  later(exit,maximum);
  return {
    ready(){loaded=true;if(elapsed)exit();},skip:exit,
    dispose(){disposed=true;clear();},
  };
}
