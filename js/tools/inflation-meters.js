/**
 * tools/inflation-meters.js — Inflation Meters
 *
 * Live mechanic: SVG gauge needles move in real time as items are
 * added and rated. A "reality check" pass lets the reader re-rate
 * to fair values, and the delta between claimed and fair is shown
 * explicitly as the "inflation gap."
 */

import { store } from '../storage.js';

export function renderInflationMeters(container) {
  const saved = store.getTool('inflationMeters');
  // Use a mutable ref so the relationship name stays in sync across saves
  const state = { relationship: saved.relationship ?? '' };
  const faults = saved.faults ? [...saved.faults] : [];
  const virtues = saved.virtues ? [...saved.virtues] : [];

  let newFaultText = '';
  let newVirtueText = '';
  let realityCheckMode = saved.realityCheckMode ?? false;

  function isComplete() {
    const f = faults.some(i => i.claimed !== undefined && i.fair !== undefined);
    const v = virtues.some(i => i.claimed !== undefined && i.fair !== undefined);
    return f && v;
  }

  function save() {
    store.setTool('inflationMeters', { relationship: state.relationship, faults: [...faults], virtues: [...virtues], realityCheckMode });
    store.setProgress('inflationMeters', isComplete() ? 'complete' : (faults.length || virtues.length) ? 'in_progress' : 'not_started');
  }

  function totalScore(items, field) {
    if (!items.length) return 0;
    const vals = items.filter(i => i[field] !== undefined).map(i => i[field]);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  }

  function render() {
    const faultClaimed = totalScore(faults, 'claimed');
    const faultFair    = totalScore(faults, 'fair');
    const virtClaimed  = totalScore(virtues, 'claimed');
    const virtFair     = totalScore(virtues, 'fair');

    container.innerHTML = `
      <div class="tool-header">
        <div class="tool-part">Part 2 · The Mechanism</div>
        <h1>Inflation Meters</h1>
        <p class="tool-desc">
          When we're in the box, we tend to inflate the other person's faults and
          our own virtues to keep the story consistent. Add items to each gauge,
          rate their intensity, then do a reality check — what's actually fair?
        </p>
      </div>

      <div class="field">
        <label for="relationship-name">Who is this about? (first name or label)</label>
        <input type="text" id="relationship-name" class="input" style="max-width:300px"
          placeholder="e.g. Marcus, my manager…" value="${escapeHTML(state.relationship)}" maxlength="40">
      </div>

      <div class="gauges-row">
        ${gaugeHTML('faults', 'Their faults', faultClaimed, faultFair, 'var(--in-box)')}
        ${gaugeHTML('virtues', 'My virtues', virtClaimed, virtFair, 'var(--out-box)')}
      </div>

      <div style="display:flex;gap:24px;flex-wrap:wrap;margin-bottom:24px">
        <!-- Faults list -->
        <div style="flex:1;min-width:200px">
          <div style="font-size:13px;font-weight:700;color:var(--text-2);margin-bottom:8px">Their faults — add items</div>
          ${itemListHTML(faults, 'faults', realityCheckMode)}
          <div style="display:flex;gap:8px;margin-top:8px">
            <input type="text" class="input" id="new-fault-input" placeholder="Add a fault…" maxlength="80" value="${escapeHTML(newFaultText)}">
            <button class="btn btn-ghost btn-sm add-item-btn" data-list="faults">+ Add</button>
          </div>
        </div>
        <!-- Virtues list -->
        <div style="flex:1;min-width:200px">
          <div style="font-size:13px;font-weight:700;color:var(--text-2);margin-bottom:8px">My virtues — add items</div>
          ${itemListHTML(virtues, 'virtues', realityCheckMode)}
          <div style="display:flex;gap:8px;margin-top:8px">
            <input type="text" class="input" id="new-virtue-input" placeholder="Add a virtue…" maxlength="80" value="${escapeHTML(newVirtueText)}">
            <button class="btn btn-ghost btn-sm add-item-btn" data-list="virtues">+ Add</button>
          </div>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:24px">
        <button id="reality-check-btn" class="btn ${realityCheckMode ? 'btn-primary' : 'btn-ghost'}">
          ${realityCheckMode ? '✓ Reality-check mode on' : 'Enter reality-check mode'}
        </button>
        ${realityCheckMode ? `<p style="font-size:13px;color:var(--text-2);flex:1">Re-rate each item to what is actually fair. The delta is the inflation gap.</p>` : `<p style="font-size:13px;color:var(--text-3);flex:1">After rating all items, switch to reality-check mode to calibrate.</p>`}
      </div>

      ${isComplete() ? `
        <div class="card" style="border-color:var(--accent);background:var(--accent-dim);margin-bottom:16px;animation:fadeSlideIn .4s ease-out">
          <strong>Inflation gaps visible.</strong>
          <div style="margin-top:12px;display:flex;gap:24px;flex-wrap:wrap;font-size:14px">
            <div>
              <div style="color:var(--text-3);font-size:12px;margin-bottom:4px">Their-faults gap</div>
              <div style="font-size:20px;font-weight:700;color:${faultClaimed > faultFair ? 'var(--in-box)' : 'var(--accent)'}">
                ${faultClaimed - faultFair > 0 ? '+' : ''}${faultClaimed - faultFair}
              </div>
            </div>
            <div>
              <div style="color:var(--text-3);font-size:12px;margin-bottom:4px">My-virtues gap</div>
              <div style="font-size:20px;font-weight:700;color:${virtClaimed > virtFair ? 'var(--in-box)' : 'var(--accent)'}">
                ${virtClaimed - virtFair > 0 ? '+' : ''}${virtClaimed - virtFair}
              </div>
            </div>
          </div>
          <p style="font-size:13px;color:var(--text-2);margin-top:12px;line-height:1.65">
            The gap is what the box adds. It's not the facts — it's the padding around the facts.
          </p>
        </div>
      ` : ''}

      <div class="tool-nav">
        <a href="#/part-2/sequence-builder" class="btn btn-ghost">← Sequence Builder</a>
        <a href="#/part-2/collusion-loop" class="btn ${isComplete() ? 'btn-primary' : 'btn-ghost'}">Next: Collusion Loop →</a>
      </div>
    `;

    // Wire relationship name
    container.querySelector('#relationship-name').addEventListener('input', function() {
      state.relationship = this.value;
      store.setTool('inflationMeters', { relationship: state.relationship, faults, virtues, realityCheckMode }, true);
    });

    // Wire reality check toggle
    container.querySelector('#reality-check-btn').addEventListener('click', () => {
      realityCheckMode = !realityCheckMode;
      save();
      render();
    });

    // Wire add buttons
    container.querySelectorAll('.add-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const listName = btn.dataset.list;
        const input = container.querySelector(`#new-${listName === 'faults' ? 'fault' : 'virtue'}-input`);
        const text = input.value.trim();
        if (!text) { input.focus(); return; }
        const list = listName === 'faults' ? faults : virtues;
        list.push({ id: Date.now(), text, claimed: 5, fair: undefined });
        if (listName === 'faults') newFaultText = ''; else newVirtueText = '';
        save();
        render();
      });
    });

    // Wire claim sliders
    container.querySelectorAll('.claim-slider').forEach(sl => {
      sl.addEventListener('input', () => {
        const list = sl.dataset.list === 'faults' ? faults : virtues;
        const idx = parseInt(sl.dataset.idx);
        list[idx].claimed = parseInt(sl.value);
        save();
        updateGauges();
      });
    });

    // Wire fair sliders
    container.querySelectorAll('.fair-slider').forEach(sl => {
      sl.addEventListener('input', () => {
        const list = sl.dataset.list === 'faults' ? faults : virtues;
        const idx = parseInt(sl.dataset.idx);
        list[idx].fair = parseInt(sl.value);
        save();
        updateGauges();
      });
    });

    // Wire delete buttons
    container.querySelectorAll('.item-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const list = btn.dataset.list === 'faults' ? faults : virtues;
        const idx = parseInt(btn.dataset.idx);
        list.splice(idx, 1);
        save();
        render();
      });
    });
  }

  function updateGauges() {
    const faultClaimed = totalScore(faults, 'claimed');
    const faultFair    = totalScore(faults, 'fair');
    const virtClaimed  = totalScore(virtues, 'claimed');
    const virtFair     = totalScore(virtues, 'fair');

    updateNeedle('gauge-faults-claimed', faultClaimed);
    updateNeedle('gauge-faults-fair', faultFair);
    updateNeedle('gauge-virtues-claimed', virtClaimed);
    updateNeedle('gauge-virtues-fair', virtFair);
  }

  function updateNeedle(id, value) {
    const needle = document.getElementById(id);
    if (!needle) return;
    const angle = -90 + (value / 10) * 180;
    needle.setAttribute('transform', `rotate(${angle}, 100, 100)`);
  }

  render();
}

function gaugeHTML(id, title, claimed, fair, accentColor) {
  const claimedAngle = -90 + (claimed / 10) * 180;
  const fairAngle    = fair !== undefined ? -90 + (fair / 10) * 180 : null;
  const delta = fair !== undefined ? claimed - fair : null;

  return `
    <div class="gauge-panel">
      <h3>${title}</h3>
      <svg class="gauge-svg" width="200" height="110" viewBox="0 0 200 110" aria-hidden="true">
        <!-- Background arc -->
        <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="var(--bg-surface3)" stroke-width="14" stroke-linecap="round"/>
        <!-- Claimed arc fill -->
        <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="${accentColor}" stroke-width="14" stroke-linecap="round"
          stroke-dasharray="${(claimed/10) * 283}" stroke-dashoffset="0" opacity="0.25"/>
        <!-- Fair arc overlay (shown if real-check mode has been used) -->
        ${fair !== undefined ? `
          <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="${accentColor}" stroke-width="6" stroke-linecap="round"
            stroke-dasharray="${(fair/10) * 283}" stroke-dashoffset="0" opacity="0.8"/>
        ` : ''}
        <!-- Needle -->
        <g id="gauge-${id}-claimed" class="gauge-needle" transform="rotate(${claimedAngle}, 100, 100)">
          <line x1="100" y1="100" x2="100" y2="20" stroke="${accentColor}" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="100" cy="100" r="5" fill="${accentColor}"/>
        </g>
        ${fair !== undefined ? `
          <g id="gauge-${id}-fair" class="gauge-needle" transform="rotate(${fairAngle}, 100, 100)">
            <line x1="100" y1="100" x2="100" y2="28" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 2"/>
          </g>
        ` : ''}
        <text x="10" y="115" font-size="9" fill="var(--text-3)" font-family="var(--font-ui)">0</text>
        <text x="188" y="115" font-size="9" fill="var(--text-3)" font-family="var(--font-ui)" text-anchor="end">10</text>
        <text x="100" y="82" font-size="18" font-weight="700" text-anchor="middle" fill="${accentColor}" font-family="var(--font-ui)">${claimed}</text>
      </svg>
      <div class="gauge-delta">
        Claimed avg: <strong>${claimed}</strong>
        ${fair !== undefined ? `· Fair avg: <strong>${fair}</strong> · <span class="delta-num" style="color:${delta > 0 ? 'var(--in-box)' : 'var(--accent)'}">Δ ${delta > 0 ? '+' : ''}${delta}</span>` : ''}
      </div>
    </div>
  `;
}

function itemListHTML(items, listName, realityMode) {
  if (!items.length) return '<p style="font-size:12px;color:var(--text-3);padding:8px 0">No items yet.</p>';
  return `<div class="item-list">
    ${items.map((item, i) => `
      <div class="item-row">
        <span class="item-text">${escapeHTML(item.text)}</span>
        <div class="item-ratings">
          <div style="font-size:11px;color:var(--text-3)">
            ${realityMode ? 'Claimed' : 'Intensity'}:
            <input type="range" class="claim-slider" data-list="${listName}" data-idx="${i}"
              min="0" max="10" value="${item.claimed ?? 5}"
              style="width:60px;vertical-align:middle"
              aria-label="Claimed intensity for ${escapeHTML(item.text)}">
            <span class="rating-pill rating-claimed">${item.claimed ?? 5}</span>
          </div>
          ${realityMode ? `
          <div style="font-size:11px;color:var(--text-3)">
            Fair:
            <input type="range" class="fair-slider" data-list="${listName}" data-idx="${i}"
              min="0" max="10" value="${item.fair ?? item.claimed ?? 5}"
              style="width:60px;vertical-align:middle"
              aria-label="Fair intensity for ${escapeHTML(item.text)}">
            <span class="rating-pill rating-fair">${item.fair ?? '—'}</span>
          </div>
          ` : ''}
        </div>
        <button class="item-del" data-list="${listName}" data-idx="${i}" aria-label="Remove">✕</button>
      </div>
    `).join('')}
  </div>`;
}

function escapeHTML(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
