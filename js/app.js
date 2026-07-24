/**
 * Expedition 33 — Build Reference : application logic
 *
 * Classic script (no modules) so that file:// still works.
 * Reads its content from the E33_DATA global defined in js/data.js.
 */
(function (data) {
  'use strict';

  var STORAGE_KEYS = {
    checklist: 'e33_checklist',
    level: 'e33_level',
    schema: 'e33_schema',
    backup: 'e33_backup'
  };

  var SCHEMA_VERSION = 2;

  /**
   * Frozen record of the v1 checklist order.
   *
   * v1 saved ticks under array indices, so the meaning of "3" was fixed by
   * the order the list happened to have then. checklistItems is free to be
   * reordered or extended; this array is history and must never change,
   * or someone's old save will be reinterpreted onto the wrong rows.
   */
  var LEGACY_V1_IDS = [
    'painted-power', 'cheater', 'energy-master', 'second-chance',
    'first-strike', 'recoat', 'lumina-slots', 'weapon-scaling'
  ];

  var DEFAULT_LEVEL = 12;
  var MIN_LEVEL = 1;
  var MAX_LEVEL = 99;

  /* ---------------------------------------------------------------
   * Storage helpers
   *
   * localStorage is the right fit here: two tiny values, read once on
   * boot, written on user interaction. It throws in Safari private mode
   * and when the ~5MB quota is hit, and a corrupted value used to take
   * the whole app down on load, so every access is guarded.
   *
   * Note: localStorage is NOT readable from the service worker. If the
   * worker ever needs to see progress, move this layer to IndexedDB —
   * only these four functions would change.
   * --------------------------------------------------------------- */

  function readJSON(key, fallback) {
    var raw;
    try {
      raw = window.localStorage.getItem(key);
    } catch (err) {
      reportStorageFailure('read');
      return fallback;
    }
    if (!raw) return fallback;
    try {
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') throw new Error('not an object');
      return parsed;
    } catch (err) {
      // Do not discard it. Park the unreadable value under its own key so
      // the next write cannot overwrite the only copy of it.
      quarantine(key, raw);
      return fallback;
    }
  }

  function quarantine(key, raw) {
    try {
      var qk = key + '__unreadable';
      if (window.localStorage.getItem(qk) === null) {
        window.localStorage.setItem(qk, raw);
      }
      console.warn('[e33] "' + key + '" was unreadable; kept a copy at "' + qk + '"');
    } catch (err) { /* out of room to even quarantine it */ }
  }

  function writeJSON(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn('[e33] could not save "' + key + '"', err);
      reportStorageFailure('write');
      return false;
    }
  }

  function readRaw(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  }

  function writeRaw(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (err) {
      console.warn('[e33] could not save "' + key + '"', err);
      reportStorageFailure('write');
      return false;
    }
  }

  /**
   * Saving can fail for reasons the user can act on — Safari private mode,
   * a full quota, storage disabled. Failing silently is the worst outcome:
   * they keep ticking boxes believing progress is kept. Say so once.
   */
  var storageWarned = false;
  function reportStorageFailure() {
    if (storageWarned) return;
    storageWarned = true;
    var el = document.getElementById('storageWarning');
    if (el) el.hidden = false;
  }

  /**
   * Take a one-time snapshot of the raw stored values before anything
   * rewrites them. Written once and never overwritten, so a later buggy
   * migration cannot destroy the evidence of what was originally there.
   */
  function backupOnce(reason) {
    try {
      if (window.localStorage.getItem(STORAGE_KEYS.backup) !== null) return;
      window.localStorage.setItem(STORAGE_KEYS.backup, JSON.stringify({
        reason: reason,
        takenAt: new Date().toISOString(),
        checklist: window.localStorage.getItem(STORAGE_KEYS.checklist),
        level: window.localStorage.getItem(STORAGE_KEYS.level)
      }));
    } catch (err) {
      console.warn('[e33] could not snapshot before migrating', err);
    }
  }

  /**
   * Bring stored progress up to the current schema.
   *
   * v1 kept ticks under array indices ({"0":true}); v2 uses stable string
   * ids. The rules here are deliberately conservative:
   *
   *   - it runs only when the recorded schema is behind, so it is
   *     idempotent and a normal launch never rewrites saved data;
   *   - it snapshots the old values first;
   *   - it never drops an entry it cannot interpret. An unrecognised key
   *     is carried across untouched rather than deleted, because a tick we
   *     cannot place is still information, and deleting it is unrecoverable.
   */
  function migrateChecklist() {
    var stored = readJSON(STORAGE_KEYS.checklist, null);
    var recorded = parseInt(readRaw(STORAGE_KEYS.schema), 10);

    if (stored === null) {
      // Nothing saved yet, or unreadable and already quarantined.
      writeRaw(STORAGE_KEYS.schema, String(SCHEMA_VERSION));
      return {};
    }

    if (recorded === SCHEMA_VERSION) return stored;

    backupOnce('schema ' + (recorded || 'unversioned') + ' -> ' + SCHEMA_VERSION);

    var migrated = {};
    var mapped = 0;
    var carried = 0;

    Object.keys(stored).forEach(function (key) {
      if (/^\d+$/.test(key)) {
        var id = LEGACY_V1_IDS[Number(key)];
        if (id) {
          migrated[id] = !!stored[key];
          mapped++;
        } else {
          migrated[key] = !!stored[key];
          carried++;
        }
      } else {
        // Already an id. Possibly one that has since been retired — keep it.
        migrated[key] = !!stored[key];
      }
    });

    if (writeJSON(STORAGE_KEYS.checklist, migrated)) {
      writeRaw(STORAGE_KEYS.schema, String(SCHEMA_VERSION));
      console.info('[e33] checklist migrated to schema v' + SCHEMA_VERSION +
        ' (' + mapped + ' mapped, ' + carried + ' kept unresolved)');
    }
    return migrated;
  }

  /* ---------------------------------------------------------------
   * Backup and restore
   *
   * localStorage is per-origin and the browser may clear it: iOS evicts
   * script-written storage for sites left unvisited, "clear site data"
   * takes it, and moving this app to a custom domain would leave it
   * behind. An export is the only thing that survives all of those.
   * --------------------------------------------------------------- */

  function exportProgress() {
    return JSON.stringify({
      app: 'expedition-33-build-reference',
      schema: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      level: readRaw(STORAGE_KEYS.level),
      checklist: readJSON(STORAGE_KEYS.checklist, {})
    }, null, 2);
  }

  /**
   * Merge an exported file back in. Ticks are unioned rather than replaced
   * so restoring an older backup onto a further-along device cannot lose
   * the newer progress.
   */
  function importProgress(text) {
    var payload = JSON.parse(text);
    if (!payload || typeof payload !== 'object' || !payload.checklist) {
      throw new Error('That file does not look like an Expedition 33 backup.');
    }
    backupOnce('before import');

    var current = readJSON(STORAGE_KEYS.checklist, {});
    var merged = {};
    var k;
    for (k in current) if (Object.prototype.hasOwnProperty.call(current, k)) merged[k] = current[k];
    for (k in payload.checklist) {
      if (Object.prototype.hasOwnProperty.call(payload.checklist, k)) {
        merged[k] = merged[k] || !!payload.checklist[k];
      }
    }
    writeJSON(STORAGE_KEYS.checklist, merged);

    var lvl = parseInt(payload.level, 10);
    if (lvl >= MIN_LEVEL && lvl <= MAX_LEVEL) writeRaw(STORAGE_KEYS.level, String(lvl));

    return Object.keys(merged).filter(function (key) { return merged[key]; }).length;
  }

  /* ---------------------------------------------------------------
   * Rendering
   * --------------------------------------------------------------- */

  function currentTier(level) {
    return data.tiers.find(function (t) {
      return level >= t.range[0] && level <= t.range[1];
    }) || data.tiers[data.tiers.length - 1];
  }

  function renderOverview(level) {
    var t = currentTier(level);
    return '' +
      '<div class="card active-tier">' +
        '<h2>Right now — Level ' + level + '</h2>' +
        '<div class="sub">' + t.name + ' (Lv ' + t.range[0] + '–' + t.range[1] + ')</div>' +
        '<div class="priority">' + t.priority + '</div>' +
        '<p class="sub">' + t.detail + '</p>' +
      '</div>' +
      '<div class="card">' +
        '<h2>How to use this guide</h2>' +
        '<ul>' +
          '<li>Drag the level slider up top to match your current character level — the Overview tab updates automatically.</li>' +
          '<li>Check the <b>Attributes</b> tab for the full tier breakdown across all levels.</li>' +
          '<li>Check each character\'s tab for their attribute lean, Picto/Lumina priorities by game stage, and playstyle notes.</li>' +
          '<li>Use the <b>My Progress</b> tab to track key must-get Pictos as you unlock them.</li>' +
        '</ul>' +
      '</div>';
  }

  function renderAttributes(level) {
    var html = data.tiers.map(function (t) {
      var active = level >= t.range[0] && level <= t.range[1];
      return '' +
        '<div class="card ' + (active ? 'active-tier' : '') + '">' +
          '<h2>' + t.name + ' <span class="sub">(Lv ' + t.range[0] + '–' + t.range[1] + ')</span></h2>' +
          '<div class="priority">' + t.priority + '</div>' +
          '<p class="sub">' + t.detail + '</p>' +
        '</div>';
    }).join('');

    html += '' +
      '<div class="card">' +
        '<h2>Attribute effects cheat sheet</h2>' +
        '<div class="grid2">' +
          data.attributeEffects.map(function (a) {
            return '<div class="stat-pill"><b>' + a.name + '</b>' + a.effect + '</div>';
          }).join('') +
        '</div>' +
      '</div>';

    return html;
  }

  function renderPictos() {
    return '' +
      '<div class="card">' +
        '<h2>Must-get Pictos (any character)</h2>' +
        '<ul>' +
          data.universalPictos.map(function (p) {
            return '<li><b>' + p.name + '</b> — <span class="sub">' + p.note + '</span></li>';
          }).join('') +
        '</ul>' +
      '</div>';
  }

  function renderCharacter(key) {
    var c = data.characters[key];
    var list = function (items) {
      return '<ul>' + items.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
    };
    return '' +
      '<div class="card">' +
        '<h2>' + c.label + ' <span class="sub">— ' + c.role + '</span></h2>' +
        '<div class="priority">Attributes: ' + c.attrs + '</div>' +
      '</div>' +
      '<div class="card">' +
        '<h3>Early game (Act 1)</h3>' + list(c.early) +
        '<div class="divider"></div>' +
        '<h3>Mid game</h3>' + list(c.mid) +
        '<div class="divider"></div>' +
        '<h3>Late game / Act 3+</h3>' + list(c.late) +
      '</div>' +
      '<div class="card">' +
        '<h3>Playstyle note</h3>' +
        '<p class="sub">' + c.note + '</p>' +
      '</div>';
  }

  function renderChecklist() {
    return '' +
      '<div class="card">' +
        '<h2>Progress checklist</h2>' +
        '<div class="checklist">' +
          data.checklistItems.map(function (item) {
            return '<label><input type="checkbox" data-id="' + item.id + '">' +
                   '<span>' + item.label + '</span></label>';
          }).join('') +
        '</div>' +
      '</div>' +
      '<div class="card">' +
        '<h3>Backup</h3>' +
        '<p class="sub">Progress is stored on this device only. Export a copy ' +
        'before clearing browser data, or to move it to another phone.</p>' +
        '<div class="backup-row">' +
          '<button type="button" class="btn" id="exportBtn">Export progress</button>' +
          '<button type="button" class="btn" id="importBtn">Restore from file</button>' +
          '<input type="file" id="importFile" accept="application/json,.json" hidden>' +
        '</div>' +
        '<p class="sub backup-status" id="backupStatus" role="status"></p>' +
      '</div>';
  }

  function wireBackup() {
    var exportBtn = document.getElementById('exportBtn');
    var importBtn = document.getElementById('importBtn');
    var fileInput = document.getElementById('importFile');
    var status = document.getElementById('backupStatus');
    if (!exportBtn || !importBtn || !fileInput) return;

    // Re-query each time: a restore rebuilds the section, replacing this node.
    function say(msg) {
      var el = document.getElementById('backupStatus');
      if (el) el.textContent = msg;
    }

    exportBtn.addEventListener('click', function () {
      var stamp = new Date().toISOString().slice(0, 10);
      var blob = new Blob([exportProgress()], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'expedition33-progress-' + stamp + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Revoking immediately can cancel the download on some mobile browsers.
      setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
      say('Exported expedition33-progress-' + stamp + '.json');
    });

    importBtn.addEventListener('click', function () { fileInput.click(); });

    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var count = importProgress(String(reader.result));
          var restoredLevel = parseInt(readRaw(STORAGE_KEYS.level), 10);
          buildSections(currentLevel);
          if (restoredLevel >= MIN_LEVEL && restoredLevel <= MAX_LEVEL) {
            setLevel(restoredLevel, 'force');
            els.slider.value = restoredLevel;
          }
          switchTab('checklist');
          say('Restored. ' + count + ' item' + (count === 1 ? '' : 's') + ' ticked.');
        } catch (err) {
          say(err.message || 'Could not read that file.');
        }
      };
      reader.onerror = function () { say('Could not read that file.'); };
      reader.readAsText(file);
      fileInput.value = '';
    });
  }

  /* ---------------------------------------------------------------
   * Wiring
   * --------------------------------------------------------------- */

  var els = {};
  var saveTimer = null;

  function buildTabs() {
    var tabs = [
      { id: 'overview', label: 'Overview' },
      { id: 'attributes', label: 'Attributes' },
      { id: 'pictos', label: 'Universal Pictos' }
    ].concat(
      Object.keys(data.characters).map(function (k) {
        return { id: k, label: data.characters[k].label };
      }),
      [{ id: 'checklist', label: 'My Progress' }]
    );

    els.nav.innerHTML = '';
    tabs.forEach(function (t, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = t.label;
      b.dataset.tab = t.id;
      b.setAttribute('aria-controls', t.id);
      if (i === 0) b.classList.add('active');
      b.addEventListener('click', function () { switchTab(t.id); });
      els.nav.appendChild(b);
    });
  }

  function switchTab(id) {
    var activeBtn = null;

    els.nav.querySelectorAll('button').forEach(function (b) {
      var on = b.dataset.tab === id;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on) activeBtn = b;
    });
    els.main.querySelectorAll('section').forEach(function (s) {
      s.classList.toggle('active', s.id === id);
    });

    // Tabs are separate documents as far as the reader is concerned. Without
    // this you keep the previous tab's scroll offset and land partway down
    // the new one, with its heading already off-screen.
    window.scrollTo(0, 0);

    if (activeBtn) ensureTabVisible(activeBtn);
  }

  /* Keep the selected chip fully on screen in the scrolling tab strip. */
  function ensureTabVisible(btn) {
    var navBox = els.nav.getBoundingClientRect();
    var btnBox = btn.getBoundingClientRect();
    var pad = 16;
    var delta = 0;

    if (btnBox.left < navBox.left + pad) {
      delta = btnBox.left - navBox.left - pad;
    } else if (btnBox.right > navBox.right - pad) {
      delta = btnBox.right - navBox.right + pad;
    }
    if (!delta) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (els.nav.scrollBy) {
      els.nav.scrollBy({ left: delta, behavior: reduce ? 'auto' : 'smooth' });
    } else {
      els.nav.scrollLeft += delta;
    }
  }

  /**
   * Build every section once. Only Overview and Attributes depend on the
   * level, so the slider updates just those two — which also means the
   * checklist DOM (and its listeners) survives, and the tab you are
   * looking at does not jump back to Overview mid-drag.
   */
  function buildSections(level) {
    var sections = [
      { id: 'overview', html: renderOverview(level) },
      { id: 'attributes', html: renderAttributes(level) },
      { id: 'pictos', html: renderPictos() }
    ].concat(
      Object.keys(data.characters).map(function (k) {
        return { id: k, html: renderCharacter(k) };
      }),
      [{ id: 'checklist', html: renderChecklist() }]
    );

    els.main.innerHTML = sections.map(function (s, i) {
      return '<section id="' + s.id + '"' + (i === 0 ? ' class="active"' : '') + ' role="tabpanel">' +
             s.html + '</section>';
    }).join('');

    wireChecklist();
    wireBackup();
  }

  function updateLevelSections(level) {
    document.getElementById('overview').innerHTML = renderOverview(level);
    document.getElementById('attributes').innerHTML = renderAttributes(level);
  }

  function wireChecklist() {
    var state = migrateChecklist();
    els.main.querySelectorAll('.checklist input').forEach(function (cb) {
      var id = cb.dataset.id;
      cb.checked = !!state[id];
      cb.addEventListener('change', function () {
        var current = readJSON(STORAGE_KEYS.checklist, {});
        current[id] = cb.checked;
        writeJSON(STORAGE_KEYS.checklist, current);
      });
    });
  }

  var currentLevel = DEFAULT_LEVEL;

  function setLevel(value, syncSlider) {
    value = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, value | 0));
    if (value === currentLevel && syncSlider !== 'force') return;

    currentLevel = value;
    if (syncSlider) els.slider.value = value;
    els.display.textContent = value;
    els.down.disabled = value <= MIN_LEVEL;
    els.up.disabled = value >= MAX_LEVEL;
    updateLevelSections(value);

    // Debounced: dragging fires continuously, no need to write every tick.
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      writeRaw(STORAGE_KEYS.level, String(value));
    }, 200);
  }

  /**
   * Wire a -/+ stepper with press-and-hold repeat.
   *
   * The slider gives roughly 3px per level on a phone, which is finer than a
   * fingertip can place, so exact levels need discrete controls.
   *
   * Stepping happens on pointerdown rather than click so that holding repeats
   * immediately and feels responsive; the synthetic click that follows is
   * swallowed. Keyboard activation produces a click with no preceding
   * pointerdown, so it still steps exactly once.
   */
  function attachStepper(btn, delta) {
    var holdTimer = null;
    var repeatTimer = null;
    var handledByPointer = false;

    function stop() {
      clearTimeout(holdTimer);
      clearInterval(repeatTimer);
      holdTimer = repeatTimer = null;
    }

    function step() {
      var next = currentLevel + delta;
      if (next < MIN_LEVEL || next > MAX_LEVEL) { stop(); return; }
      setLevel(next, true);
    }

    btn.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      handledByPointer = true;
      e.preventDefault();          // no focus ring flash, no text selection
      step();
      holdTimer = setTimeout(function () {
        repeatTimer = setInterval(step, 80);
      }, 450);
    });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
      btn.addEventListener(ev, stop);
    });
    window.addEventListener('blur', stop);

    btn.addEventListener('click', function () {
      if (handledByPointer) { handledByPointer = false; return; }
      step();                      // keyboard (Enter/Space) path
    });
  }

  function wireLevelControls() {
    var saved = parseInt(readRaw(STORAGE_KEYS.level), 10);
    var level = (!isNaN(saved) && saved >= MIN_LEVEL && saved <= MAX_LEVEL)
      ? saved
      : DEFAULT_LEVEL;

    els.slider.value = level;

    els.slider.addEventListener('input', function () {
      setLevel(parseInt(els.slider.value, 10), false);
    });

    attachStepper(els.down, -1);
    attachStepper(els.up, 1);

    return level;
  }

  function registerServiceWorker() {
    // Guarded: service workers are unavailable (and throw) under file://.
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return;

    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function (err) {
        console.warn('[e33] service worker registration failed', err);
      });
    });
  }

  function init() {
    els.nav = document.getElementById('tabnav');
    els.main = document.getElementById('mainContent');
    els.slider = document.getElementById('lvlSlider');
    els.display = document.getElementById('lvlDisplay');
    els.down = document.getElementById('lvlDown');
    els.up = document.getElementById('lvlUp');

    buildTabs();
    var level = wireLevelControls();
    buildSections(level);

    // 'force' so the initial paint runs even when level === DEFAULT_LEVEL.
    currentLevel = null;
    setLevel(level, 'force');

    registerServiceWorker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(E33_DATA);
