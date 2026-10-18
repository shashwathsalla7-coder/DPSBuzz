// Standalone Zego Audio Fixes for HTML/JS pages
(function () {
  if (typeof window === 'undefined' || window.__zego_audio_fixes_applied) return;
  window.__zego_audio_fixes_applied = true;

  if (typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype) {
    var originalSetSinkId = HTMLMediaElement.prototype.setSinkId;
    HTMLMediaElement.prototype.setSinkId = async function (sinkId) {
      if (typeof sinkId !== 'string') sinkId = '';
      try {
        if (typeof originalSetSinkId === 'function') {
          return await originalSetSinkId.call(this, sinkId);
        }
      } catch (err) {
        return Promise.resolve();
      }
    };
  }

  var applySpeaker = async function (el) {
    if (window.__zego_selected_speaker_id && typeof el.setSinkId === 'function') {
      try {
        await el.setSinkId(window.__zego_selected_speaker_id);
      } catch (e) {}
    }
  };

  if (typeof MutationObserver !== 'undefined' && document.body) {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) {
            if (node.tagName === 'AUDIO' || node.tagName === 'VIDEO') {
              applySpeaker(node);
            } else if (node.querySelectorAll) {
              node.querySelectorAll('audio, video').forEach(applySpeaker);
            }
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  var resumeAudio = function () {
    window.removeEventListener('click', resumeAudio);
    window.removeEventListener('touchstart', resumeAudio);
  };
  window.addEventListener('click', resumeAudio, { passive: true });
  window.addEventListener('touchstart', resumeAudio, { passive: true });
})();
