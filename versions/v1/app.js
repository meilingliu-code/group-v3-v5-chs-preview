'use strict';
// Standalone rendering adapter for the saved CHS content. No CHS APIs, child
// profiles, recording, consent submission, uploads, or response storage run here.
(() => {
  const protocol=window.GROUP_CHS_SOURCE;
  const player=document.querySelector('#experiment-player');
  const picker=document.querySelector('#page-picker');
  const version=document.querySelector('#version-picker');
  const condition=document.querySelector('#condition-picker');
  const frames=protocol.frames;
  const sourceOrder=protocol.sequence.slice();
  const platformIds=['video-config','video-consent'];
  const order=sourceOrder.filter(id=>!platformIds.includes(id));
  order.splice(order.indexOf('exit-survey'),0,...platformIds);
  let index=0,movieIndex=0,movieCleanup=()=>{},generation=0;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const human=id=>id.replace(/^group-guided-|^group-/g,'').replace(/-v\d$/,'').replaceAll('-',' ');
  const titleFor=(id,f)=>({
    'group-parent-practice-back-v1':'Original real-baby practice',
    'group-parent-webcam-check-v1':'Live camera check · reference',
    'group-assignment-block':'GROUP study movies',
    'group-start-recording-v1':'Start recording · disabled in this copy',
    'group-stop-recording-v1':'Stop recording · disabled in this copy',
    'group-upload-complete-v1':'Upload confirmation · reference',
    'video-config':'Webcam setup · reference',
    'video-consent':'Consent document · reference',
    'exit-survey':'Thank you and debrief'
  })[id]||f.blocks?.map(b=>b.title||b.text?.match(/<h1[^>]*>(.*?)<\/h1>/)?.[1]||'').find(Boolean)||human(id);
  order.forEach((id,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=`${i+1}. ${titleFor(id,frames[id]).replace(/<[^>]*>/g,'')}`;picker.append(o);});
  picker.onchange=()=>show(Number(picker.value));
  const assignment=()=>frames['group-assignment-block'].parameterSets.find(p=>p.ASSIGNMENT_ID===condition.value);
  function updateConditions(){
    condition.replaceChildren();
    frames['group-assignment-block'].parameterSets.filter(p=>p.STUDY_ARM===version.value).forEach(p=>{const o=document.createElement('option');o.value=p.ASSIGNMENT_ID;o.textContent=p.ASSIGNMENT_ID;condition.append(o);});
    const requested=new URLSearchParams(location.search).get('condition');if([...condition.options].some(o=>o.value===requested))condition.value=requested;
    movieIndex=0;if(order[index]==='group-assignment-block')show(index);
  }
  const requestedArm=new URLSearchParams(location.search).get('arm');if(['V3','V5'].includes(requestedArm))version.value=requestedArm;
  version.onchange=updateConditions;condition.onchange=()=>{movieIndex=0;if(order[index]==='group-assignment-block')show(index);};updateConditions();
  function sourceFunction(source){
    // CHS's researcher-only URL check is true solely in this standalone review.
    return source.replaceAll("location.pathname.includes('/exp/studies/1d2f8f0f-261f-4b8e-ad11-32b615c07f7a/')",'true')
      .replaceAll('location.pathname.includes("/exp/studies/1d2f8f0f-261f-4b8e-ad11-32b615c07f7a/")','true')
      .replaceAll('/\\/preview\\/?$/.test(location.pathname)','true');
  }
  function initializeShared(){
    if(window.__group6286WelcomeUI)return;
    // These are this project's existing instruction hooks, not an experiment
    // runner. Only the instruction-frame hooks are evaluated.
    new Function('return ('+sourceFunction(frames['group-guided-welcome-v3'].generateProperties)+')')()();
  }
  function stopMedia(){document.querySelectorAll('audio,video').forEach(media=>media.pause());if(window.__group6286WelcomeUI?.audio)window.__group6286WelcomeUI.audio.pause();}
  function move(delta){show(Math.max(0,Math.min(order.length-1,index+delta)));}
  function buttons(next='Continue →'){
    return '<div class="reference-actions"><button type="button" class="btn btn-default" data-back>← Back</button><button type="button" class="btn btn-success" data-next>'+esc(next)+'</button></div>';
  }
  function wireButtons(){player.querySelector('[data-back]')?.addEventListener('click',()=>move(-1));player.querySelector('[data-next]')?.addEventListener('click',()=>move(1));}
  function reference(title,body,next){player.innerHTML='<section class="reference-card"><h1>'+esc(title)+'</h1>'+body+buttons(next)+'</section>';wireButtons();}
  function instruction(id,f){
    const blocks=(f.blocks||[]).map(b=>{
      let html=(b.title?'<h2>'+esc(b.title)+'</h2>':'')+(b.text||'');
      if(b.mediaBlock){const m=b.mediaBlock,tag=m.isVideo?'video':'audio';html+='<div class="media-wrapper"><h2>'+esc(m.title)+'</h2><'+tag+' controls playsinline preload="metadata" class="player-media" src="'+esc(m.sources[0].src)+'"></'+tag+'><p>'+esc(m.text)+'</p></div>';}
      return html;
    }).join('');
    player.innerHTML='<div class="row exp-lookit-instructions"><div class="exp-text">'+blocks+'</div></div><div class="row exp-lookit-instructions"><div class="exp-text">'+(f.showPreviousButton?'<button type="button" class="btn btn-default pull-left" data-back>Previous</button>':'')+'<button type="button" id="nextbutton" class="btn btn-success pull-right">'+esc(f.nextButtonText||'Continue →')+'</button></div></div>';
    const next=document.querySelector('#nextbutton');
    player.querySelector('[data-back]')?.addEventListener('click',()=>move(-1));
    next.onclick=()=>{
      if(next.disabled)return;
      if(f.selectNextFrame){
        const target=new Function('return ('+sourceFunction(f.selectNextFrame)+')')()(order.map(id=>({id})),index);
        if(Number.isInteger(target)&&target>=0){show(target);return;}
      }
      move(1);
    };
    if(f.generateProperties)new Function('return ('+sourceFunction(f.generateProperties)+')')()({},order);
    const required=[...player.querySelectorAll('.player-media')];
    const requiredBlocks=(f.blocks||[]).filter(b=>b.mediaBlock?.mustPlay);
    if(requiredBlocks.length){next.disabled=true;const done=new Set();required.forEach(media=>media.addEventListener('ended',()=>{done.add(media);next.disabled=done.size<requiredBlocks.length;}));}
  }
  function consentReference(){
    const c=frames['video-consent'];
    const paragraphs=[['Why we are running this study',c.purpose],['What happens during this study',c.procedures],['What are the risks?',c.risk_statement],['What are the benefits?',c.payment],['How we use recordings',c.datause],['Questions about research rights',c.research_rights_statement],['Study team contact',c.PIContact]];
    reference('CHS consent document · read-only reference','<div class="preview-only"><strong>No consent is collected here.</strong>This is the source study’s text for collaborator review. Do not use this public preview to enroll a family.</div>'+paragraphs.map(([h,t])=>'<h2>'+esc(h)+'</h2><p>'+esc(t)+'</p>').join(''),'Continue to debrief →');
  }
  function cameraReference(id,f){
    const title=id==='video-config'?'CHS webcam setup · reference':'Check your baby’s real camera view.';
    reference(title,'<div class="preview-only"><strong>Camera off · Not recording</strong>This standalone copy shows the instructions, but does not access a webcam or microphone. The live feed and technical checks remain in the original CHS study.</div><div class="camera-placeholder">No camera feed in the GitHub review copy.</div>'+(f.blocks||[]).map(b=>'<h2>'+esc(b.title||'')+'</h2><p>'+esc(b.text||'')+'</p>').join('')+'<ul><li>Keep baby’s whole head, face and both eyes visible.</li><li>Use even light from in front.</li><li>Sit above and behind your baby, where you can watch their eyes and reach Space.</li><li>Keep the keyboard out of your baby’s reach.</li></ul>','Continue review →');
  }
  function replaceParameters(value,params){
    if(typeof value==='string'&&Object.prototype.hasOwnProperty.call(params,value))return structuredClone(params[value]);
    if(Array.isArray(value))return value.map(x=>replaceParameters(x,params));
    if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,replaceParameters(v,params)]));
    return value;
  }
  function movie({training=false}={}){
    const params=assignment(),list=frames['group-assignment-block'].frameList;
    const f=training?frames['group-parent-practice-back-v1']:replaceParameters(list[movieIndex],params);
    const source=f.video.source[0].src;
    const controlled=f.kind==='exp-lookit-video-infant-control';
    const delay=Number(f.measurementPeriodDelay||0),ceiling=Number(f.requiredDuration||60);
    const token=generation;
    player.innerHTML='<section class="movie-card"><h1>'+esc(training?'Original real-baby practice':params.ASSIGNMENT_ID+' · Movie '+(movieIndex+1)+' of '+list.length)+'</h1><p class="movie-meta">Review only · No camera recording or participant response is saved</p>'+(f.parentTextBlock?'<p class="movie-hint">'+esc(f.parentTextBlock.text)+'</p>':'')+'<div class="movie-stage"><video playsinline preload="metadata" aria-label="'+esc(training?'Original parent practice video':'GROUP V3/V5 study movie')+'" src="'+esc(source)+'"></video><div class="movie-overlay"><div><h2>Ready to review?</h2><button type="button" data-play>Play movie</button></div></div></div><p class="movie-status" role="status">Choose Play movie.</p><p class="movie-hint">'+(controlled?'Wait for the action to finish. Once the picture is still, count 3 full seconds continuously away, then press Space. A look back means start again.':'This movie moves on automatically in the CHS study.')+' Press P for a break; continuing restarts this movie.</p><div class="movie-actions"><button type="button" data-replay>↻ Replay</button><button type="button" data-pause>Pause / restart · P</button><button type="button" data-previous>← Previous movie</button><button type="button" data-next-movie>Next movie →</button><button type="button" data-finish>Continue beyond movies</button></div><details class="movie-source"><summary>Source movie</summary><a target="_blank" rel="noopener" href="'+esc(source)+'">'+esc(source)+'</a></details></section>';
    const video=player.querySelector('video'),overlay=player.querySelector('.movie-overlay'),status=player.querySelector('.movie-status');
    let running=false,paused=false,timer=null,ended=false,wallStart=0;
    function play(){clearTimeout(timer);ended=false;paused=false;video.currentTime=0;overlay.hidden=true;status.textContent='Movie playing. Wait for the still picture.';running=true;wallStart=performance.now();video.play().catch(()=>{running=false;overlay.hidden=false;status.textContent='The movie could not play. Try Play movie again.';});if(training)timer=setTimeout(()=>finish('Practice reference complete.'),ceiling*1000);}
    function finish(message){if(ended)return;ended=true;running=false;clearTimeout(timer);video.pause();status.textContent=message||'Review movie complete.';overlay.hidden=false;overlay.querySelector('div').innerHTML='<h2>'+esc(status.textContent)+'</h2><button type="button" data-continue>'+esc(training?'Continue review':'Next movie →')+'</button><button type="button" data-restart>Replay this movie</button>';overlay.querySelector('[data-continue]').onclick=()=>{if(training)move(1);else nextMovie();};overlay.querySelector('[data-restart]').onclick=play;}
    function nextMovie(){movieIndex++;if(movieIndex>=list.length){movieIndex=0;move(1);}else show(index);}
    function pause(){if(!running&&!paused)return;running=false;paused=true;clearTimeout(timer);video.pause();status.textContent='Paused. Continuing restarts this movie from the beginning.';overlay.hidden=false;overlay.querySelector('div').innerHTML='<h2>Movie paused</h2><button type="button" data-resume>Restart movie</button>';overlay.querySelector('[data-resume]').onclick=play;}
    video.onloadedmetadata=()=>{if(!Number.isFinite(video.duration))return;if(controlled&&!training&&video.duration+.4<delay)status.textContent='The source video is shorter than the configured motion period. Please report this.';};
    video.ontimeupdate=()=>{if(!running||training)return;if(controlled&&video.currentTime>=delay){status.textContent='The picture is still. Watch your baby’s eyes; count 3 full seconds away.';}else status.textContent='Movie playing. Wait for the still picture.';};
    video.onended=()=>{if(!running)return;if(!controlled){finish('Movie finished.');timer=setTimeout(()=>{if(generation===token)nextMovie();},600);}else if(training){finish('Original practice video finished.');}else{status.textContent='The picture is still. Watch baby’s eyes. Press Space after 3 full seconds away.';timer=setTimeout(()=>finish('This review trial reached its CHS time limit.'),Math.max(0,ceiling-delay)*1000);}};
    video.onerror=()=>{running=false;status.textContent='This source movie could not load. Check your connection or choose another movie.';};
    function key(e){if(/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)||e.repeat)return;if((e.code==='Space'||e.key===' ')&&controlled&&running){e.preventDefault();if(training||video.currentTime>=delay)finish('Space pressed · review response not saved.');else status.textContent='Not yet—wait for the action to finish first.';}else if(e.key.toLowerCase()==='p'){e.preventDefault();if(paused)play();else pause();}}
    function visibility(){if(document.hidden)pause();}
    player.querySelector('[data-play]').onclick=play;
    player.querySelector('[data-replay]').onclick=play;
    player.querySelector('[data-pause]').onclick=()=>paused?play():pause();
    player.querySelector('[data-next-movie]').onclick=()=>training?move(1):nextMovie();
    player.querySelector('[data-previous]').onclick=()=>{if(training)move(-1);else{movieIndex=Math.max(0,movieIndex-1);show(index);}};
    player.querySelector('[data-finish]').onclick=()=>move(1);
    document.addEventListener('keydown',key);document.addEventListener('visibilitychange',visibility);
    movieCleanup=()=>{clearTimeout(timer);running=false;video.pause();document.removeEventListener('keydown',key);document.removeEventListener('visibilitychange',visibility);};
  }
  function show(position){
    generation++;movieCleanup();movieCleanup=()=>{};stopMedia();
    index=position;picker.value=String(index);const id=order[index],f=frames[id];
    try{
      if(id==='group-cover-welcome-v1'){initializeShared();instruction(id,f);}
      else if(id==='group-upload-complete-v1')reference('Upload confirmation · reference only','<div class="preview-only"><strong>No recording or upload took place.</strong>This copy must not show a successful upload confirmation. In CHS, the next screen checks the real upload result.</div><p>The source study shows “Your video uploaded” only after CHS reports a completed upload. Otherwise, it asks the family to contact the study team.</p>','Review webcam setup and consent →');
      else if(f.kind==='exp-lookit-instructions'){initializeShared();instruction(id,f);}
      else if(f.kind==='choice')movie();
      else if(id==='group-parent-practice-back-v1')movie({training:true});
      else if(id==='video-consent')consentReference();
      else if(f.kind==='exp-video-config'||f.kind==='exp-lookit-webcam-display')cameraReference(id,f);
      else if(f.kind==='exp-lookit-start-recording')reference('Study-session recording · disabled here','<div class="preview-only"><strong>Recording is off.</strong>The CHS study starts its consented recording at this point. This GitHub copy does not.</div><p>You can review the original GROUP V3/V5 movies next.</p>','Review study movies →');
      else if(f.kind==='exp-lookit-stop-recording')reference('Study recording and upload · disabled here','<div class="preview-only"><strong>No recording was made or uploaded.</strong>In CHS, this step stops and uploads the study video.</div>','Continue review →');
      else if(f.kind==='exp-lookit-exit-survey'){
        const d=f.debriefing;reference(d.title,'<div class="heart" aria-hidden="true">♡</div><div class="preview-only"><strong>Collaborator review complete.</strong>No participant response, consent video, or study recording was created. The text below is the CHS debrief for reference; this preview does not create a payment entitlement.</div><div class="debrief"><p>'+esc(d.text)+'</p></div>','Back to welcome →');player.querySelector('[data-next]').onclick=()=>show(0);
      }else reference(titleFor(id,f),'<p>This CHS-only frame is available in the original study.</p>');
    }catch(error){reference('This page could not load','<p class="preview-error">'+esc(error.message)+'</p><p>Use Review navigation to inspect another page.</p>');console.error(error);}
    window.scrollTo(0,0);
  }
  show(0);
})();
