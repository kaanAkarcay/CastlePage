// Handles loading the events for <model-viewer>'s slotted progress bar
const mv = document.querySelector('model-viewer');
const arButton = document.getElementById('ar-button');
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

if (window.location.protocol === 'file:') {
  const note = document.createElement('div');
  note.setAttribute('role', 'alert');
  note.style.cssText =
    'position:fixed;top:0;left:0;right:0;padding:12px 16px;background:#fef3c7;color:#78350f;font:14px/1.4 system-ui,sans-serif;z-index:9999;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.12);';
  note.textContent =
    'Bu sayfayı dosya olarak (file://) açtığınız için 3D model çoğu tarayıcıda yüklenmez; poster görünür kalır. Klasörde terminal açıp şunu çalıştırın: python3 -m http.server 8080 — sonra tarayıcıda http://localhost:8080 açın. GLB ~77 MB; yükleme bir süre sürebilir.';
  document.body.appendChild(note);
}

const onProgress = (event) => {
  const progressBar = event.target.querySelector('.progress-bar');
  const updatingBar = event.target.querySelector('.update-bar');
  if (!progressBar || !updatingBar) return;
  updatingBar.style.width = `${event.detail.totalProgress * 100}%`;
  if (event.detail.totalProgress === 1) {
    progressBar.classList.add('hide');
    event.target.removeEventListener('progress', onProgress);
  } else {
    progressBar.classList.remove('hide');
  }
};

mv.addEventListener('progress', onProgress);

if (mv) {
  mv.addEventListener('ar-status', (event) => {
    // Useful for debugging AR handoff failures on device.
    console.log('[model-viewer][ar-status]', event.detail.status);
  });
}

if (mv && arButton && isIOS) {
  arButton.addEventListener('click', (event) => {
    const iosSrc = mv.getAttribute('ios-src');
    if (!iosSrc) return;

    // On some iOS/Safari combinations Quick Look handoff from model-viewer
    // can fail silently; force a direct rel="ar" launch as fallback.
    event.preventDefault();
    event.stopPropagation();

    const quickLookUrl = new URL(iosSrc, window.location.href).toString();
    const quickLookAnchor = document.createElement('a');
    quickLookAnchor.setAttribute('rel', 'ar');
    quickLookAnchor.setAttribute('href', quickLookUrl);

    const img = document.createElement('img');
    img.alt = 'Launch AR';
    quickLookAnchor.appendChild(img);

    document.body.appendChild(quickLookAnchor);
    quickLookAnchor.click();
    quickLookAnchor.remove();

    // If Quick Look handoff fails silently, force direct navigation to the USDZ.
    setTimeout(() => {
      if (document.visibilityState === 'visible') {
        window.location.href = quickLookUrl;
      }
    }, 900);
  }, true);
}

// Show AR button only on devices/browser combos that can actually launch AR.
if (mv && arButton && typeof mv.canActivateAR === 'function') {
  mv.canActivateAR().then((canAR) => {
    if (!canAR) {
      arButton.style.display = 'none';
    }
  }).catch(() => {
    arButton.style.display = 'none';
  });
}

mv.addEventListener('error', () => {
  const err = document.createElement('div');
  err.setAttribute('role', 'alert');
  err.style.cssText =
    'position:fixed;bottom:16px;left:16px;right:16px;padding:12px;background:#fee2e2;color:#991b1b;font:14px/1.4 system-ui,sans-serif;z-index:9999;border-radius:8px;';
  err.textContent =
    'Model yüklenemedi. Dosyayı yerel sunucu üzerinden açtığınızdan emin olun; konsolda (F12) ayrıntıya bakın.';
  document.body.appendChild(err);
});
