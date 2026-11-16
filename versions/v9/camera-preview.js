'use strict';
(() => {
  // Standalone adaptation of the CHS exp-lookit-webcam-display setup pattern.
  // Display a local stream, then stop/destroy it on navigation. No recording API.
  function createSession(mediaDevices, deliver, state) {
    let stream=null, generation=0, closed=false;
    function release(value){if(value)for(const track of value.getTracks())track.stop();}
    function stop(message='Camera off. Nothing was recorded.'){
      generation++;const old=stream;stream=null;release(old);deliver(null);if(!closed)state('off',message);
    }
    async function start(deviceId){
      if(closed)return;stop();const token=generation;state('loading','Allow camera access to see your preview.');
      if(!mediaDevices?.getUserMedia){state('error','Camera preview is unavailable here. Open this page in Chrome or Firefox over HTTPS.');return;}
      try{
        const next=await mediaDevices.getUserMedia({audio:false,video:{width:{ideal:1280},height:{ideal:720},...(deviceId?{deviceId:{exact:deviceId}}:{})}});
        if(closed||token!==generation){release(next);return;}
        stream=next;deliver(next);state('on','Check your baby’s face in the preview.');
        for(const track of next.getVideoTracks())track.addEventListener('ended',()=>{if(stream===next)stop('Camera disconnected. Choose Enable camera to try again.');},{once:true});
      }catch(error){
        if(closed||token!==generation)return;
        const message=error.name==='NotAllowedError'||error.name==='SecurityError'?'Camera access was blocked. Allow camera access in your browser, then try again.':error.name==='NotFoundError'?'No camera was found. Connect a webcam, then try again.':error.name==='NotReadableError'?'Your camera may be busy. Close other camera apps, then try again.':'The camera could not start. Check your camera and try again.';
        state('error',message);
      }
    }
    return {start,stop,destroy(){if(closed)return;stop();closed=true;}};
  }
  function mount({player,onPrevious,onContinue}){
    player.innerHTML=`<section class="camera-check-card"><header class="camera-check-heading"><p class="gi-eyebrow">Camera check</p><h1>Check your baby’s camera view.</h1><p>Turn on your camera to check the setup.</p></header><div class="camera-check-notice"><strong data-camera-badge>Camera off · Not recording</strong><span>Preview stays on your device. Nothing is saved or uploaded.</span></div><div class="camera-check-layout"><div><div class="camera-check-stage"><video autoplay muted playsinline aria-label="Your live camera preview" hidden></video><div class="camera-check-placeholder" data-camera-placeholder><svg viewBox="0 0 64 48" width="64" height="48" aria-hidden="true"><rect x="3" y="7" width="41" height="34" rx="8" fill="none" stroke="currentColor" stroke-width="3"/><path d="m44 17 16-9v32l-16-9z" fill="none" stroke="currentColor" stroke-width="3"/></svg><p>Your preview will appear here.</p></div></div><div class="camera-check-controls"><button type="button" data-camera-enable>Enable camera</button><button type="button" data-camera-stop disabled>Turn camera off</button></div><label class="camera-check-device" data-camera-device-label hidden>Camera<select data-camera-device aria-label="Camera"></select></label><p class="camera-check-status" data-camera-status role="status" aria-live="polite">Choose Enable camera when you’re ready.</p></div><aside class="camera-check-tips"><h2>A quick check</h2><div class="v8-camera-tips"><div class="v8-visual-tip"><span class="v8-tip-icon"><svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16V7h9m18 0h9v9M6 32v9h9m18 0h9v-9"/><ellipse cx="24" cy="24" rx="12" ry="15"/><circle cx="19" cy="21" r="1.4"/><circle cx="29" cy="21" r="1.4"/></svg></span><div><strong>Face fully visible</strong></div></div><div class="v8-visual-tip"><span class="v8-tip-icon"><svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="9"/><path d="M24 3v6m0 30v6M3 24h6m30 0h6M9 9l4 4m22 22l4 4M9 39l4-4m22-22l4-4"/></svg></span><div><strong>Baby’s face evenly lit</strong></div></div><div class="v8-visual-tip"><span class="v8-tip-icon"><svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="10" r="6"/><path d="M9 35v-9a15 15 0 0130 0v9"/><circle cx="24" cy="29" r="5"/><path d="M14 44v-4a10 10 0 0120 0v4"/></svg></span><div><strong>Sit above and behind</strong></div></div><div class="v8-visual-tip"><span class="v8-tip-icon"><svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="13" width="38" height="25" rx="4"/><path d="M11 20h2m6 0h2m6 0h2m6 0h2M11 26h2m6 0h2m6 0h2m6 0h2M15 32h18"/></svg></span><div><strong>Keep keyboard out of baby’s reach</strong></div></div></div></aside></div><div class="camera-check-navigation"><button type="button" data-camera-back>← Back</button><button type="button" data-camera-next disabled>Looks good →</button></div></section>`;
    const video=player.querySelector('video'),placeholder=player.querySelector('[data-camera-placeholder]'),enable=player.querySelector('[data-camera-enable]'),stop=player.querySelector('[data-camera-stop]'),badge=player.querySelector('[data-camera-badge]'),status=player.querySelector('[data-camera-status]'),picker=player.querySelector('[data-camera-device]'),label=player.querySelector('[data-camera-device-label]'),next=player.querySelector('[data-camera-next]');
    let dead=false,listed=false,session;
    async function listDevices(){
      if(!navigator.mediaDevices?.enumerateDevices)return;
      try{const devices=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='videoinput');if(dead)return;picker.replaceChildren();for(const [i,device]of devices.entries()){const option=document.createElement('option');option.value=device.deviceId;option.textContent=device.label||'Camera '+(i+1);picker.append(option);}const active=video.srcObject?.getVideoTracks()[0]?.getSettings?.().deviceId;if(active)picker.value=active;label.hidden=devices.length<2;listed=true;}catch(error){/* The current camera preview can still be used. */}
    }
    session=createSession(navigator.mediaDevices,value=>{video.srcObject=value;video.hidden=!value;placeholder.hidden=!!value;if(value)video.play().catch(()=>{status.textContent='Choose Enable camera to restart your preview.';});},(phase,message)=>{
      if(dead)return;status.textContent=message;badge.textContent=phase==='on'?'Camera on · Not recording':'Camera off · Not recording';enable.disabled=phase==='loading';enable.textContent=phase==='loading'?'Connecting…':phase==='on'?'Restart camera':'Enable camera';stop.disabled=phase!=='on'&&phase!=='loading';next.disabled=phase!=='on';if(phase==='on')listDevices();if(phase!=='on')label.hidden=true;
    });
    enable.onclick=()=>session.start(listed?picker.value:undefined);stop.onclick=()=>session.stop();picker.onchange=()=>session.start(picker.value);player.querySelector('[data-camera-back]').onclick=onPrevious;next.onclick=()=>{if(!next.disabled)onContinue();};
    function hidden(){if(document.hidden)session.stop('Camera off while this page was hidden. Choose Enable camera to resume.');}
    function leaving(){session.stop();}
    document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',leaving);
    return ()=>{dead=true;session.destroy();document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',leaving);};
  }
  window.GroupCameraPreview={createSession,mount};
})();
