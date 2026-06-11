/**
 * tools/heatmap.js — Relationship Heatmap
 *
 * Live mechanic: slider changes instantly recolor each row using the
 * in-box / out-of-box palette. At 5+ rows, a one-line aggregate read
 * appears and updates live.
 */

import { store } from '../storage.js';

const CATEGORIES = ['', 'Team', 'Family', 'Peer', 'Boss', 'Friend', 'Other'];

export function renderHeatmap(container) {
  const saved = store.getTool('heatmap');
  const rows = saved.rows ? [...saved.rows] : [];

  function save() {
    store.setTool('heatmap', { rows: [...rows] });
    const done = rows.length >= 5;
    store.setProgress('heatmap', rows.length === 0 ? 'not_started' : done ? 'complete' : 'in_progress');
  }

  function cellColor(value) {
    // 0 = full in-box (#C2575A), 100 = full out-of-box (#3FB6A8)
    // Interpolate in RGB space
    const t = value / 100;
    const r = Math.round(194 + (63 - 194) * t);
    const g = Math.round(87 + (182 - 87) * t);
    const b = Math.round(90 + (168 - 90) * t);
    return `rgb(${r},${g},${b})`;
  }

  function aggregateText() {
    if (rows.length < 5) return '';
    const avg = rows.reduce((s, r) => s + r.value, 0) / rows.length;
    const cats = {};
    for (const r of rows) {
      if (r.category) cats[r.category] = (cats[r.category] || []).concat(r.value);
    }
    const catLines = Object.entries(cats)
      .map(([cat, vals]) => {
        const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        return `${cat} (avg ${avg})`;
      })
      .join(' · ');

    let reading = '';
    if (avg >= 70) reading = 'Your heatmap leans out-of-box on average.';
    else if (avg >= 40) reading = 'A mixed picture — some relationships are solid, others more strained.';
    else reading = 'Your heatmap leans in-box on average.';

    return reading + (catLines ? ` ${catLines}.` : '');
  }

  function render() {
    container.innerHTML = `
      <div class="tool-header">
        <div class="tool-part">Part 1 · Awareness</div>
        <h1>Relationship Heatmap</h1>
        <p class="tool-desc">
          Add the people in your life — use first names or labels. For each, move the
          slider to reflect where you honestly see them: as an obstacle to manage, or
          as a full person you're genuinely in relationship with. The color field
          itself is the insight.
        </p>
      </div>

      <div style="display:flex;gap:16px;margin-bottom:12px;flex-wrap:wrap;align-items:flex-end">
        <div class="field" style="flex:1;min-width:140px;margin-bottom:0">
          <label for="new-name">Name or label</label>
          <input type="text" id="new-name" class="input" placeholder="e.g. Alex, my boss…" maxlength="40" autocomplete="off">
        </div>
        <div class="field" style="flex-shrink:0;margin-bottom:0">
          <label for="new-cat">Category</label>
          <select id="new-cat" class="select" style="width:110px">
            ${CATEGORIES.map(c => `<option value="${c}">${c || '—'}</option>`).join('')}
          </select>
        </div>
        <button id="add-row-btn" class="btn btn-primary" style="flex-shrink:0">Add</button>
      </div>

      <div id="heatmap-rows" role="list" aria-label="Relationship rows">
        ${rows.length === 0 ? `<p style="color:var(--text-3);font-size:13px;padding:24px 0;text-align:center">Add at least five people to see the pattern.</p>` : ''}
        ${rows.map((row, i) => rowHTML(row, i)).join('')}
      </div>

      <div id="aggregate-line" class="heatmap-aggregate" style="display:${rows.length >= 5 ? 'block' : 'none'}">
        ${aggregateText()}
      </div>

      <div style="margin-top:16px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
        <div style="display:flex;gap:16px;font-size:12px;color:var(--text-3);align-items:center">
          <span style="display:flex;align-items:center;gap:6px">
            <span style="width:14px;height:14px;border-radius:3px;background:var(--in-box);display:inline-block"></span> Object
          </span>
          <span style="display:flex;align-items:center;gap:6px">
            <span style="width:14px;height:14px;border-radius:3px;background:var(--out-box);display:inline-block"></span> Person
          </span>
          <span>${rows.length} added</span>
        </div>
        ${rows.length >= 5 ? `<span style="font-size:12px;color:var(--accent)">✓ 5+ rows — pattern visible</span>` : `<span style="font-size:12px;color:var(--text-3)">${5 - rows.length} more to unlock the aggregate read</span>`}
      </div>

      <div class="tool-nav">
        <a href="#/part-1/spot-the-box" class="btn btn-ghost">← Spot the Box</a>
        <a href="#/part-1/two-hearts" class="btn ${rows.length >= 5 ? 'btn-primary' : 'btn-ghost'}">Next: Two Hearts →</a>
      </div>
    `;

    // Wire add button
    const addBtn = container.querySelector('#add-row-btn');
    const nameInput = container.querySelector('#new-name');
    const catSelect = container.querySelector('#new-cat');

    function addRow() {
      const label = nameInput.value.trim();
      if (!label) { nameInput.focus(); return; }
      rows.push({ id: Date.now(), label, value: 50, category: catSelect.value });
      save();
      nameInput.value = '';
      catSelect.value = '';
      render();
      // Focus the new row's slider
      const sliders = container.querySelectorAll('.row-slider');
      const last = sliders[sliders.length - 1];
      if (last) last.focus();
    }

    addBtn.addEventListener('click', addRow);
    nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') addRow(); });

    // Wire sliders
    container.querySelectorAll('.row-slider').forEach(slider => {
      const idx = parseInt(slider.dataset.idx);
      const cell = container.querySelector(`.heatmap-cell[data-idx="${idx}"]`);

      slider.addEventListener('input', () => {
        const v = parseInt(slider.value);
        rows[idx].value = v;
        if (cell) cell.style.background = cellColor(v);
        store.setTool('heatmap', { rows: [...rows] }, true);
        updateAggregate();
        save();
      });
    });

    // Wire delete buttons
    container.querySelectorAll('.delete-row-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        rows.splice(idx, 1);
        save();
        render();
      });
    });
  }

  function rowHTML(row, i) {
    const color = cellColor(row.value);
    return `
      <div class="heatmap-row" role="listitem">
        <div>
          <div class="heatmap-name">${escapeHTML(row.label)}</div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:4px">
            <span style="font-size:10px;color:var(--text-3)">Object</span>
            <input type="range" class="row-slider" data-idx="${i}" min="0" max="100" value="${row.value}"
              aria-label="How much do you treat ${escapeHTML(row.label)} as a full person" aria-valuemin="0" aria-valuemax="100">
            <span style="font-size:10px;color:var(--text-3)">Person</span>
          </div>
        </div>
        <div class="heatmap-cell" data-idx="${i}" style="background:${color};opacity:0.85"></div>
        <div class="heatmap-cat" style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
          ${row.category ? `<span style="font-size:11px;color:var(--text-3)">${row.category}</span>` : ''}
          <button class="delete-row-btn" data-idx="${i}" style="font-size:11px;color:var(--text-3);padding:2px 4px;" aria-label="Remove ${escapeHTML(row.label)}">✕</button>
        </div>
      </div>
    `;
  }

  function updateAggregate() {
    const el = container.querySelector('#aggregate-line');
    if (!el) return;
    if (rows.length >= 5) {
      el.style.display = 'block';
      el.textContent = aggregateText();
    } else {
      el.style.display = 'none';
    }
  }

  render();
}

function escapeHTML(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
