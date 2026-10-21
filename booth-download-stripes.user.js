// ==UserScript==
// @name         BOOTH Download Row Stripes
// @namespace    https://github.com/YOUR_GITHUB_USERNAME/booth-userscripts
// @version      1.1.0
// @description  Alternates background colours of download rows on BOOTH and marks rows you've downloaded
// @author       YOUR_NAME
// @license      MIT
// @homepageURL  https://github.com/YOUR_GITHUB_USERNAME/booth-userscripts
// @supportURL   https://github.com/YOUR_GITHUB_USERNAME/booth-userscripts/issues
// @updateURL    https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/booth-userscripts/main/booth-download-stripes.user.js
// @downloadURL  https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/booth-userscripts/main/booth-download-stripes.user.js
// @match        https://accounts.booth.pm/*
// @match        https://booth.pm/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // ---- Settings -----------------------------------------------------------
  const COLOR_A    = '#ffffff';  // odd rows
  const COLOR_B    = '#eef3fb';  // even rows (soft blue)
  const HOVER      = '#dde8f8';  // row hover
  const DONE_A     = '#eaf7ee';  // downloaded row (odd)
  const DONE_B     = '#dcf1e3';  // downloaded row (even)
  const BADGE_TEXT = 'Downloaded';
  const RESET_PER_ITEM = true;   // restart the stripe pattern for each product card
  const REMEMBER   = true;       // keep "Downloaded" marks after reloading the page
  // -------------------------------------------------------------------------

  const FILE_RE = /^[^\s].{0,180}\.(zip|rar|7z|unitypackage|fbx|blend|psd|png|jpg|pdf|txt|vrm|tar|gz|exe|mp4|wav|mp3)$/i;
  const DL_RE = /download|ダウンロード/i;
  const DL_LINK = 'a[href*="/downloadables/"]';
  const STORE_KEY = 'bds-downloaded';

  // ---- Storage ------------------------------------------------------------
  function loadDone() {
    if (!REMEMBER) return {};
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
  }
  function saveDone(map) {
    if (!REMEMBER) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(map)); } catch {}
  }
  const done = loadDone();

  // ---- Styles -------------------------------------------------------------
  const style = document.createElement('style');
  style.textContent = `
    .bds-row { border-radius: 10px; padding-left: 12px !important; padding-right: 12px !important;
               transition: background-color .15s ease; }
    .bds-a { background-color: ${COLOR_A} !important; }
    .bds-b { background-color: ${COLOR_B} !important; }
    .bds-row.bds-done.bds-a { background-color: ${DONE_A} !important; }
    .bds-row.bds-done.bds-b { background-color: ${DONE_B} !important; }
    .bds-row:hover { background-color: ${HOVER} !important; }
    .bds-badge { display: inline-flex; align-items: center; gap: 4px; margin-left: 10px;
                 padding: 2px 9px; border-radius: 999px; font-size: 12px; font-weight: 600;
                 line-height: 1.6; color: #1d7a3e; background: #c9ecd5; white-space: nowrap;
                 vertical-align: middle; }
    .bds-badge time { font-weight: 400; opacity: .75; }
    @keyframes bds-pop { from { transform: scale(.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .bds-badge.bds-new { animation: bds-pop .2s ease-out; }
  `;
  document.head.appendChild(style);

  // ---- Row detection ------------------------------------------------------
  function rowFor(label) {
    let el = label;
    for (let i = 0; i < 8 && el && el !== document.body; i++) {
      el = el.parentElement;
      if (!el) break;
      if (el.querySelector(DL_LINK)) return el;
      if ([...el.querySelectorAll('a, button')].some(b => DL_RE.test(b.textContent))) return el;
    }
    return null;
  }

  // Key used to remember a row: the main download link's ID, or the filename
  function keyFor(row) {
    const link = row.querySelector(DL_LINK);
    const m = link && link.href.match(/downloadables\/(\d+)/);
    return m ? 'id:' + m[1] : 'file:' + (row.dataset.bdsFile || '');
  }

  function fmtTime(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function markRow(row, ts, isNew) {
    row.classList.add('bds-done');
    let badge = row.querySelector('.bds-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'bds-badge';
      const label = row.querySelector('[data-bds-label]');
      (label || row).insertAdjacentElement(label ? 'afterend' : 'afterbegin', badge);
      // Keep label and badge on one line if the label is a block element
      if (label) label.style.display = 'inline';
    }
    badge.innerHTML = `✓ ${BADGE_TEXT} <time>${fmtTime(ts)}</time>`;
    if (isNew) {
      badge.classList.remove('bds-new');
      void badge.offsetWidth; // restart animation
      badge.classList.add('bds-new');
    }
  }

  // ---- Main pass ----------------------------------------------------------
  function apply() {
    const labels = [...document.querySelectorAll('div, span, p, a, b')]
      .filter(e => e.childElementCount === 0 && FILE_RE.test(e.textContent.trim()));

    const rows = [];
    for (const l of labels) {
      const r = rowFor(l);
      if (r && !rows.includes(r)) {
        l.setAttribute('data-bds-label', '');
        r.dataset.bdsFile = l.textContent.trim();
        rows.push(r);
      }
    }

    const groups = new Map();
    for (const r of rows) {
      const key = RESET_PER_ITEM ? r.parentElement : document.body;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    }

    for (const list of groups.values()) {
      list.forEach((r, i) => {
        r.classList.add('bds-row');
        r.classList.toggle('bds-a', i % 2 === 0);
        r.classList.toggle('bds-b', i % 2 === 1);
        const ts = done[keyFor(r)];
        if (ts) markRow(r, ts, false);
      });
    }
  }

  // ---- Click detection ----------------------------------------------------
  // Finds the row a clicked download control belongs to. Links in the
  // "Other Downloads" dropdown may be rendered outside the row, so fall back
  // to matching the downloadable ID.
  function rowFromClick(target) {
    const ctl = target.closest('a, button');
    if (!ctl) return null;
    const isDl = ctl.matches(DL_LINK) || DL_RE.test(ctl.textContent);
    if (!isDl) return null;

    // Ignore the "Other Downloads" toggle itself (it only opens a menu)
    if (ctl.tagName === 'BUTTON' && /other/i.test(ctl.textContent) && !ctl.matches(DL_LINK)) return null;

    const row = ctl.closest('.bds-row');
    if (row) return row;

    const m = ctl.href && ctl.href.match(/downloadables\/(\d+)/);
    if (m) {
      return [...document.querySelectorAll('.bds-row')]
        .find(r => r.querySelector(`a[href*="/downloadables/${m[1]}"]`)) || null;
    }
    return null;
  }

  function onClick(e) {
    // Left click or middle click (open in new tab)
    if (e.type === 'auxclick' && e.button !== 1) return;
    const row = rowFromClick(e.target);
    if (!row) return;
    const ts = Date.now();
    done[keyFor(row)] = ts;
    saveDone(done);
    markRow(row, ts, true);
  }
  document.addEventListener('click', onClick, true);
  document.addEventListener('auxclick', onClick, true);

  // ---- Keep up with dynamic content ---------------------------------------
  let timer;
  new MutationObserver(muts => {
    // Ignore changes the script made itself (badges)
    if (muts.every(m => [...m.addedNodes].every(n => n.classList && n.classList.contains('bds-badge')))) return;
    clearTimeout(timer);
    timer = setTimeout(apply, 250);
  }).observe(document.body, { childList: true, subtree: true });

  apply();
})();
