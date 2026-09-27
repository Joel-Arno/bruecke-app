/* =====================================================================
   START
   ===================================================================== */
function init(){
  setStyle(D.style);
  $$('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
  $$('[data-style-btn]').forEach(b => b.addEventListener('click', () => { Sfx.ui(); setStyle(b.dataset.styleBtn); }));
  $$('[data-go]').forEach(b => b.addEventListener('click', () => { Sfx.ui(); go(b.dataset.go); }));
  $('#goKerker').addEventListener('click', () => { Sfx.ui(); go('kmenu'); });
  $('#goLicht').addEventListener('click', () => { Sfx.ui(); go('lmenu'); });
  $('#btnAch').addEventListener('click', () => { Sfx.ui(); achSheet(); });
  $('#btnStats').addEventListener('click', () => { Sfx.ui(); statsSheet(); });
  $('#btnSettings').addEventListener('click', () => { Sfx.ui(); settingsSheet(); });
  $('#btnInstall').addEventListener('click', async () => {
    if (!installEvt) return;
    installEvt.prompt();
    try { await installEvt.userChoice; } catch (e) {}
    installEvt = null; $('#btnInstall').hidden = true;
  });

  const kDirs = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
  document.addEventListener('keydown', e => {
    if (sheetOpen()){ if (e.key === 'Escape' && sheetDismiss) sheetDismiss(); return; }
    if (current === 'kerker'){
      if (kDirs[e.key]){ e.preventDefault(); move(kDirs[e.key]); }
      else if (e.key === ' ' || e.key === 'e'){ e.preventDefault(); abilityPress(); }
      else if (/^[1-7]$/.test(e.key)) itemPress(+e.key - 1);
      else if (e.key === 'Escape') pauseSheet();
    } else if (current === 'kmap'){
      if (e.key === 'Escape') pauseSheet();
    } else if (current === 'licht'){
      if (e.key === 'ArrowLeft' || e.key === 'a'){ keys.l = true; e.preventDefault(); }
      if (e.key === 'ArrowRight' || e.key === 'd'){ keys.r = true; e.preventDefault(); }
      if (e.key === 'Escape' || e.key === 'p') lPause();
    }
  });
  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.l = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.r = false;
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    if (current === 'licht') lPause();
    if (current === 'kerker' || current === 'kmap') saveRun();
  });
  window.addEventListener('pagehide', () => { if (current === 'kerker' || current === 'kmap') saveRun(); });

  ensureMissions();
  go('hub');
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (current === 'hub') refreshHub(); });

  // Offline-Cache, wenn das Spiel als Web-App ausgeliefert wird
  if ('serviceWorker' in navigator && document.querySelector('link[rel="manifest"]') && location.protocol === 'https:'){
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  if (DEBUG){
    window.__kl = {
      D: () => D, k: () => k, st: () => st, move, shoot, startRun, go, abilityPress, useAbility, itemPress, applyItem, closeSheet,
      sheetOpen, lUpdate, lNew, lStart, lStop, lDraw, crash, setStyle, save, kBusy: () => kBusy, kFlow: () => kFlow, BOSSES, RELIC_IDS, takeRelic,
      render, hud, newRun, enterNode, reachable, flow, isTarget, canShoot, twoAway, adjacent, setupRoom, nextWorld, current: () => current
    };
  }
}
if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(init);
else init();
