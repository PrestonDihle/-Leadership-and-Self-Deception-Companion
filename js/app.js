/**
 * app.js — Entry point.
 * Wires up the router, nav, settings modal, and all page/tool renderers.
 */

import { router } from './router.js';
import { store } from './storage.js';
import { refreshProgressUI, getPartTools, isPartComplete, isPartStarted } from './progress.js';
import { initCompanion, showToast } from './companion.js';

// Pages
import { renderHome }  from './pages/home.js';
import { renderPart1 } from './pages/part1.js';
import { renderPart2 } from './pages/part2.js';
import { renderPart3 } from './pages/part3.js';

// Tools
import { renderSealedLetter }    from './tools/sealed-letter.js';
import { renderSpotTheBox }      from './tools/spot-the-box.js';
import { renderHeatmap }         from './tools/heatmap.js';
import { renderTwoHearts }       from './tools/two-hearts.js';
import { renderSequenceBuilder } from './tools/sequence-builder.js';
import { renderInflationMeters } from './tools/inflation-meters.js';
import { renderCollusionLoop }   from './tools/collusion-loop.js';
import { renderNeedFail }        from './tools/need-fail.js';
import { renderWhatHasntWorked } from './tools/what-hasnt-worked.js';
import { renderApologyBuilder }  from './tools/apology-builder.js';
import { renderHonorSense }      from './tools/honor-sense.js';
import { renderLeadershipRadar } from './tools/leadership-radar.js';

// ── Navigation ──────────────────────────────────────────────────
function buildNav() {
  const nav = document.getElementById('part-nav');
  if (!nav) return;
  const parts = [
    { num: 1, label: 'Awareness' },
    { num: 2, label: 'The Mechanism' },
    { num: 3, label: 'Getting Out' },
  ];
  nav.innerHTML = parts.map(p => `
    <a href="#/part-${p.num}" class="nav-part-link" data-part="${p.num}">
      <span class="nav-check"></span>
      Part ${p.num}: ${p.label}
    </a>
  `).join('');
}

function updateNavActive(path) {
  document.querySelectorAll('.nav-part-link').forEach(el => {
    const part = el.dataset.part;
    const active = path.startsWith('/part-' + part);
    el.classList.toggle('active', active);
    el.setAttribute('aria-current', active ? 'page' : 'false');
  });
}

// ── Settings modal ──────────────────────────────────────────────
function initSettings() {
  const btn = document.getElementById('settings-btn');
  const modal = document.getElementById('settings-modal');
  const overlay = document.getElementById('settings-overlay');
  if (!btn || !modal) return;

  function open() {
    modal.removeAttribute('hidden');
    overlay.removeAttribute('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    modal.focus();
    renderSettingsContent();
  }
  function close() {
    modal.setAttribute('hidden', '');
    overlay.setAttribute('hidden', '');
    overlay.setAttribute('aria-hidden', 'true');
    btn.focus();
  }

  btn.addEventListener('click', open);
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hasAttribute('hidden')) close();
  });

  function renderSettingsContent() {
    const state = store.getState();
    const created = state.createdAt
      ? new Date(state.createdAt).toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric' })
      : 'unknown';

    modal.innerHTML = `
      <div class="settings-header">
        <h2>Settings</h2>
        <button class="icon-btn close-settings-btn" aria-label="Close settings">✕</button>
      </div>
      <div class="settings-body">
        <div class="settings-section">
          <h3>Your data</h3>
          <p style="font-size:13px;color:var(--text-2);margin-bottom:12px;line-height:1.6">
            Session started ${created}. All entries are saved locally in your browser and are never sent anywhere.
          </p>
        </div>
        <div class="settings-section">
          <h3>Export &amp; Import</h3>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-ghost btn-sm" id="export-btn">⬇ Export JSON</button>
            <label class="btn btn-ghost btn-sm" style="cursor:pointer">
              ⬆ Import JSON
              <input type="file" accept=".json" id="import-file" class="sr-only">
            </label>
          </div>
        </div>
        <div class="settings-section">
          <h3>Reset</h3>
          <p style="font-size:13px;color:var(--text-2);margin-bottom:12px;line-height:1.6">
            Permanently clears all your entries, progress, and the sealed letter. This cannot be undone.
          </p>
          <button class="btn btn-danger btn-sm" id="reset-btn">⚠ Reset all data</button>
        </div>
      </div>
      <div class="settings-footer">
        🔒 All data is stored locally in your browser via localStorage.<br>
        Nothing is transmitted to any server. No analytics. No tracking.
      </div>
    `;

    modal.querySelector('.close-settings-btn').addEventListener('click', close);

    modal.querySelector('#export-btn').addEventListener('click', () => {
      const json = store.exportJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lsd-companion-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Exported successfully', 'success');
    });

    modal.querySelector('#import-file').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          store.importJSON(ev.target.result);
          showToast('Imported successfully — reloading…', 'success');
          close();
          setTimeout(() => window.location.reload(), 1200);
        } catch {
          showToast('Import failed: invalid file', 'error');
        }
      };
      reader.readAsText(file);
    });

    modal.querySelector('#reset-btn').addEventListener('click', () => {
      if (confirm('Reset all your progress and entries? This cannot be undone.')) {
        store.reset();
        showToast('All data cleared', '');
        close();
        setTimeout(() => router.go('/'), 600);
      }
    });
  }
}

// ── Route registration ──────────────────────────────────────────
router
  .on('/', renderHome)
  .on('/part-1', renderPart1)
  .on('/part-2', renderPart2)
  .on('/part-3', renderPart3)
  .on('/sealed-letter', renderSealedLetter)
  .on('/part-1/spot-the-box', renderSpotTheBox)
  .on('/part-1/heatmap', renderHeatmap)
  .on('/part-1/two-hearts', renderTwoHearts)
  .on('/part-2/sequence-builder', renderSequenceBuilder)
  .on('/part-2/inflation-meters', renderInflationMeters)
  .on('/part-2/collusion-loop', renderCollusionLoop)
  .on('/part-2/need-fail', renderNeedFail)
  .on('/part-3/what-hasnt-worked', renderWhatHasntWorked)
  .on('/part-3/apology-builder', renderApologyBuilder)
  .on('/part-3/honor-sense', renderHonorSense)
  .on('/part-3/leadership-radar', renderLeadershipRadar)
  .on('/part-3/unseal', c => renderSealedLetter(c, { unsealMode: true }));

// ── Kick off ────────────────────────────────────────────────────
// ES modules are always deferred — DOMContentLoaded has already fired here.
buildNav();
refreshProgressUI();
initSettings();
initCompanion();

document.addEventListener('route:changed', e => {
  updateNavActive(e.detail.path);
  refreshProgressUI();
});

document.addEventListener('progress:changed', refreshProgressUI);

// Trigger initial route dispatch after all routes are registered above
router.start();
