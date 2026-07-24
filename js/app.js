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
    level: 'e33_level'
  };

  var DEFAULT_LEVEL = 12;

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
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return fallback;
      return parsed;
    } catch (err) {
      console.warn('[e33] could not read "' + key + '", using default', err);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn('[e33] could not save "' + key + '"', err);
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
    } catch (err) {
      console.warn('[e33] could not save "' + key + '"', err);
    }
  }

  /**
   * v1 stored checklist state under array indices ({"0":true}). v2 uses
   * stable string ids so rows can be reordered. Migrate once, in place.
   */
  function migrateChecklist(state) {
    var migrated = {};
    var changed = false;
    Object.keys(state).forEach(function (key) {
      if (/^\d+$/.test(key)) {
        var item = data.checklistItems[Number(key)];
        if (item) migrated[item.id] = !!state[key];
        changed = true;
      } else {
        migrated[key] = !!state[key];
      }
    });
    if (changed) writeJSON(STORAGE_KEYS.checklist, migrated);
    return migrated;
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
      '</div>';
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
    els.nav.querySelectorAll('button').forEach(function (b) {
      var on = b.dataset.tab === id;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    els.main.querySelectorAll('section').forEach(function (s) {
      s.classList.toggle('active', s.id === id);
    });
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
  }

  function updateLevelSections(level) {
    document.getElementById('overview').innerHTML = renderOverview(level);
    document.getElementById('attributes').innerHTML = renderAttributes(level);
  }

  function wireChecklist() {
    var state = migrateChecklist(readJSON(STORAGE_KEYS.checklist, {}));
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

  function wireSlider() {
    var saved = parseInt(readRaw(STORAGE_KEYS.level), 10);
    var level = (!isNaN(saved) && saved >= 1 && saved <= 99) ? saved : DEFAULT_LEVEL;

    els.slider.value = level;
    els.display.textContent = level;

    els.slider.addEventListener('input', function () {
      var value = parseInt(els.slider.value, 10);
      els.display.textContent = value;
      updateLevelSections(value);

      // Debounced: dragging fires this continuously, no need to write each tick.
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () {
        writeRaw(STORAGE_KEYS.level, String(value));
      }, 200);
    });

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

    buildTabs();
    var level = wireSlider();
    buildSections(level);
    registerServiceWorker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(E33_DATA);
