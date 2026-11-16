'use strict';
(() => {
  function atTime(time, intervals) {
    if (!Number.isFinite(time)) return {active:false,seconds:0};
    const away=intervals.find(x=>time>=x.start&&time<x.end);
    // Compare absolute timestamps, matching scoring at the exact full-second boundary.
    return away?{active:true,seconds:[1,2,3].filter(n=>time>=away.start+n).length}:{active:false,seconds:0};
  }
  function render(element,time,intervals) {
    if(!element)return;
    const state=atTime(time,intervals),key=state.active+':'+state.seconds;
    if(element.dataset.counterState===key)return;
    element.dataset.counterState=key;element.hidden=false;
    element.querySelectorAll('span').forEach((mark,i)=>mark.classList.toggle('is-complete',i<state.seconds));
    element.setAttribute('aria-label',state.active?(state.seconds?state.seconds+' full '+(state.seconds===1?'second':'seconds')+' looking away.':'Baby looks away. Start counting.'):'1, 2, 3. Waiting for baby to look away.');
  }
  window.GroupPracticeCounter={atTime,render};
})();
