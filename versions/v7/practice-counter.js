'use strict';
(() => {
  function atTime(time, intervals) {
    if (!Number.isFinite(time)) return {active:false,seconds:0};
    const away=intervals.find(x=>time>=x.start&&time<x.end);
    return away?{active:true,seconds:Math.min(3,Math.max(0,Math.floor(time-away.start+1e-7)))}:{active:false,seconds:0};
  }
  function render(element,time,intervals) {
    if(!element)return;
    const state=atTime(time,intervals),key=state.active+':'+state.seconds;
    if(element.dataset.counterState===key)return;
    element.dataset.counterState=key;element.hidden=!state.active;
    element.querySelectorAll('span').forEach((mark,i)=>mark.classList.toggle('is-complete',i<state.seconds));
    element.setAttribute('aria-label',state.active?(state.seconds?state.seconds+' full '+(state.seconds===1?'second':'seconds')+' looking away.':'Baby looks away. Start counting.'):'');
  }
  window.GroupPracticeCounter={atTime,render};
})();
