'use strict';
(() => {
  // Reviewed rear-view training clip. These are video timestamps, not live gaze detection.
  const timing = Object.freeze({
    source: './assets/original-parent-practice-scored-v4.mp4',
    duration: 27.7,
    awaySeconds: 3,
    responseAllowance: 2,
    intervals: [{start: 0, end: 19.8, gaze: 'on'}, {start: 19.8, end: 27.7, gaze: 'away'}]
  });
  function classify(time, intervals = timing.intervals, allowance = timing.responseAllowance) {
    if (!Number.isFinite(time) || time < 0) return 'invalid';
    const interval = intervals.find(x => time >= x.start && time <= x.end);
    if (!interval || interval.gaze !== 'away' || time < interval.start + timing.awaySeconds) return 'early';
    return time <= interval.start + timing.awaySeconds + allowance ? 'correct' : 'late';
  }
  function mount({player, onPrevious, onContinue}) {
    player.innerHTML = `<section class="real-practice-card" tabindex="-1" data-real-practice>
      <nav class="gi-progress" aria-label="Getting ready progress"><span class="complete"><i>✓</i><b>Welcome</b></span><span class="complete"><i>✓</i><b>Get ready</b></span><span class="active" aria-current="step"><i>3</i><b>Parent practice</b></span><span><i>4</i><b>Baby’s turn</b></span></nav>
      <div class="gi-walkthrough-primer real-practice-instructions">
        <div class="gi-primer-summary">
          <p class="gi-primer-lede">In the next video, you’ll watch from behind the baby.</p>
          <ul class="gi-primer-topics">
            <li>Monitor the baby’s attention to the screen.</li>
            <li>Press <kbd>Space</kbd> after <strong>3 full seconds</strong> looking away.</li>
            <li>If baby looks back, start counting again.</li>
          </ul>
        </div>
      </div>
      <div class="real-practice-stage"><video playsinline preload="metadata" aria-label="Original real-baby practice video" src="${timing.source}"></video></div>
      <div class="real-practice-controls"><button type="button" data-real-start>Start practice</button><button type="button" data-real-pause disabled>Pause · P</button></div>
      <p class="real-practice-status" data-real-status role="status" aria-live="polite">Your baby can join later.</p>
      <div class="real-practice-feedback" data-real-feedback hidden aria-live="polite"></div>
      <div class="real-practice-navigation"><button type="button" data-real-back>← Back</button><button type="button" data-real-next disabled>Continue →</button></div>
    </section>`;
    const root=player.querySelector('[data-real-practice]'),video=root.querySelector('video'),start=root.querySelector('[data-real-start]'),pause=root.querySelector('[data-real-pause]'),next=root.querySelector('[data-real-next]'),status=root.querySelector('[data-real-status]'),feedback=root.querySelector('[data-real-feedback]');
    let running=false,passed=false,dead=false,starting=false,lastTime=0,lastWall=0,watched=0;
    function stop(){running=false;video.pause();pause.disabled=true;}
    function interrupted(message){if(!running&&!starting)return;starting=false;stop();passed=false;next.disabled=true;start.disabled=false;start.textContent='Start again';status.textContent=message;}
    function result(kind){
      stop();passed=kind==='correct';next.disabled=!passed;start.disabled=false;start.textContent=passed?'Try again (optional)':'Try again';
      feedback.hidden=false;feedback.className='real-practice-feedback '+(passed?'is-correct':'is-retry');
      const messages={early:['A little early','Wait for 3 full seconds looking away. If the child looks back, start counting again.'],correct:['You timed it correctly!','That was 3 full seconds looking away. You’re ready to continue.'],late:['A little late','Press Space as soon as you’ve counted 3 full seconds looking away. Let’s try again.']};
      const [title,copy]=messages[kind];feedback.innerHTML='<strong></strong><p></p>';feedback.querySelector('strong').textContent=title;feedback.querySelector('p').textContent=copy;
      status.textContent=passed?'Practice complete.':'You can try as many times as you like.';
    }
    async function play(){
      if(dead||starting)return;starting=true;stop();passed=false;next.disabled=true;feedback.hidden=true;start.disabled=true;start.textContent='Practice running';status.textContent='Watch the child. Count silently, then press Space.';watched=0;lastTime=0;video.playbackRate=1;
      try {
        if(video.readyState<1)await new Promise((resolve,reject)=>{const ready=()=>{clear();resolve();},error=()=>{clear();reject(new Error('load'));},timeout=setTimeout(error,15000);function clear(){clearTimeout(timeout);video.removeEventListener('loadedmetadata',ready);video.removeEventListener('error',error);}video.addEventListener('loadedmetadata',ready);video.addEventListener('error',error);});
        if(dead)return;
        // The source's audio/container runs to 27.7s; its video track ends at 26.84s.
        if(!Number.isFinite(video.duration)||Math.min(Math.abs(video.duration-27.7),Math.abs(video.duration-26.84))>.25)throw new Error('source duration changed');
        if(video.currentTime>.01)await new Promise(resolve=>{video.addEventListener('seeked',resolve,{once:true});video.currentTime=0;});
        if(dead)return;lastWall=performance.now();lastTime=0;await video.play();if(dead){video.pause();return;}running=true;starting=false;pause.disabled=false;root.focus({preventScroll:true});
      }catch(error){starting=false;stop();start.disabled=false;start.textContent='Try loading again';status.textContent='The practice video could not load. Please try again.';}
    }
    function update(){
      if(!running)return;
      const now=performance.now(),delta=video.currentTime-lastTime,wall=(now-lastWall)/1000;
      if(video.playbackRate!==1||delta<-.1||delta>wall+.4){interrupted('Playback changed. Start again to practice at normal speed.');return;}
      watched+=Math.max(0,delta);lastTime=video.currentTime;lastWall=now;
    }
    function respond(){if(!running||video.seeking||document.hidden)return;update();if(!running)return;const time=video.currentTime;if(watched<time-.8){interrupted('Let’s watch the example from the beginning.');return;}result(classify(time));}
    function key(event){
      if(/^(INPUT|SELECT|TEXTAREA)$/.test(event.target.tagName)||event.altKey||event.ctrlKey||event.metaKey)return;
      if(event.code==='Space'||event.key===' '){if(running){event.preventDefault();if(!event.repeat)respond();}}
      else if((event.code==='KeyP'||event.key.toLowerCase()==='p')&&running){event.preventDefault();interrupted('Paused. Choose Start again when you’re ready.');}
    }
    function hidden(){if(document.hidden)interrupted('Practice paused while this page was hidden. Start again when you’re ready.');}
    function seeking(){if(running&&!starting)interrupted('The video moved. Start again to practice the timing.');}
    function rate(){if(running&&video.playbackRate!==1)interrupted('Start again at normal speed.');}
    function ended(){if(running)result('late');}
    function error(){if(running)interrupted('The video stopped loading. Please try again.');}
    start.onclick=play;pause.onclick=()=>interrupted('Paused. Choose Start again when you’re ready.');next.onclick=()=>{if(passed)onContinue();};root.querySelector('[data-real-back]').onclick=onPrevious;
    video.addEventListener('timeupdate',update);video.addEventListener('seeking',seeking);video.addEventListener('ratechange',rate);video.addEventListener('ended',ended);video.addEventListener('error',error);document.addEventListener('keydown',key);document.addEventListener('visibilitychange',hidden);
    return ()=>{dead=true;starting=false;stop();document.removeEventListener('keydown',key);document.removeEventListener('visibilitychange',hidden);video.removeEventListener('timeupdate',update);video.removeEventListener('seeking',seeking);video.removeEventListener('ratechange',rate);video.removeEventListener('ended',ended);video.removeEventListener('error',error);};
  }
  window.GroupRealBabyPractice={mount,classify,timing};
})();
