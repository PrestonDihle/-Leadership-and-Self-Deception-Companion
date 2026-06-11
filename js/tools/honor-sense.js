/**
 * tools/honor-sense.js — Honor-the-Sense Tracker
 *
 * Live mechanic: A contribution-style calendar heatmap fills over days.
 * Honored days glow in the accent color; not-honored days in muted red.
 * Streaks and gaps become visible as the habit builds.
 * Designed to be returned to daily over a week or more.
 */

import { store } from '../storage.js';

export function renderHonorSense(container) {
  const saved = store.getTool('honorSense');
  const entries = [...(saved.entries ?? [])];

  const today = dateKey(new Date());

  function getEntry(date) {
    return entries.find(e => e.date === date);
  }

  function upsertEntry(date, data) {
    const idx = entries.findIndex(e => e.date === date);
    if (idx >= 0) {
      entries[idx] = { ...entries[idx], ...data };
    } else {
      entries.push({ date, sense: '', honored: null, note: '', ...data });
    }
    const doneCount = entries.filter(e => e.date !== undefined).length;
    store.setTool('honorSense', { entries: [...entries] });
    store.setProgress('honorSense', doneCount >= 7 ? 'complete' : doneCount > 0 ? 'in_progress' : 'not_started');
  }

  let editingDate = today;
  const todayEntry = getEntry(today);

  function render() {
    const daysLogged = entries.filter(e => e.sense?.trim()).length;
    const honored = entries.filter(e => e.honored === true).length;
    const editEntry = getEntry(editingDate) ?? { date: editingDate, sense: '', honored: null, note: '' };

    container.innerHTML = `
      <div class="tool-header">
        <div class="tool-part">Part 3 · Getting Out</div>
        <h1>Honor-the-Sense Tracker</h1>
        <p class="tool-desc">
          Each day: what sense did you have toward someone? Did you act on it?
          Log it here. The calendar fills over time — streaks and gaps
          become visible on their own. This tool is meant to be returned to daily.
        </p>
      </div>

      <div class="log-form">
        <h3>Today, ${formatDate(editingDate)}</h3>
        <div class="field">
          <label for="sense-input">What sense did you have toward someone today?</label>
          <input type="text" id="sense-input" class="input"
            placeholder="e.g. "I should check on how my colleague is doing""
            value="${escapeHTML(editEntry.sense ?? '')}" maxlength="200" autocomplete="off">
        </div>
        <div class="field" style="margin-bottom:12px">
          <label>Did you act on it?</label>
          <div style="display:flex;gap:10px;margin-top:6px">
            <button class="btn ${editEntry.honored === true ? 'btn-primary' : 'btn-ghost'} honor-btn" data-val="true">
              ✓ Honored it
            </button>
            <button class="btn ${editEntry.honored === false ? 'btn-danger' : 'btn-ghost'} honor-btn" data-val="false">
              ✕ Didn't act on it
            </button>
          </div>
        </div>
        <div class="field" style="margin-bottom:0">
          <label for="note-input">Optional reflection</label>
          <input type="text" id="note-input" class="input"
            placeholder="What got in the way, or what happened when you did?"
            value="${escapeHTML(editEntry.note ?? '')}" maxlength="200" autocomplete="off">
        </div>
      </div>

      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;font-size:13px;color:var(--text-3)">
        <span>Days logged: <strong style="color:var(--text-1)">${daysLogged}</strong></span>
        <span>Honored: <strong style="color:var(--accent)">${honored}</strong></span>
        <span>Completion: ${daysLogged < 7 ? `${daysLogged}/7 days to mark complete` : '<span style="color:var(--accent)">✓ 7+ days</span>'}</span>
      </div>

      <div class="calendar-wrap">
        ${calendarSVG(entries)}
      </div>

      <div class="calendar-legend">
        <span><span class="legend-dot" style="background:var(--accent)"></span>Honored</span>
        <span><span class="legend-dot" style="background:var(--in-box);opacity:.5"></span>Didn't act</span>
        <span><span class="legend-dot" style="background:var(--bg-surface3);border:1px solid var(--border)"></span>No entry</span>
      </div>

      ${daysLogged > 0 ? `
        <div class="entry-list">
          <div style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-3);margin-bottom:8px;padding:0 4px">
            Recent entries
          </div>
          ${entries
              .filter(e => e.sense?.trim())
              .slice(-10)
              .reverse()
              .map(e => `
                <div class="entry-item">
                  <span class="entry-date">${formatDate(e.date)}</span>
                  <span class="entry-sense">${escapeHTML(e.sense)}</span>
                  <span class="entry-status ${e.honored === true ? 'honored' : e.honored === false ? 'not-honored' : 'no-data'}"
                    title="${e.honored === true ? 'Honored' : e.honored === false ? 'Not acted on' : 'Not set'}"></span>
                </div>
              `).join('')}
        </div>
      ` : ''}

      <div class="tool-nav">
        <a href="#/part-3/apology-builder" class="btn btn-ghost">← Apology Builder</a>
        <a href="#/part-3/leadership-radar" class="btn ${daysLogged >= 7 ? 'btn-primary' : 'btn-ghost'}">Next: Leadership Radar →</a>
      </div>
    `;

    // Wire sense input
    container.querySelector('#sense-input').addEventListener('input', function() {
      upsertEntry(editingDate, { sense: this.value });
    });

    // Wire note input
    container.querySelector('#note-input').addEventListener('input', function() {
      upsertEntry(editingDate, { note: this.value });
    });

    // Wire honored buttons
    container.querySelectorAll('.honor-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.val === 'true';
        upsertEntry(editingDate, { honored: val });
        render();
      });
    });

    // Wire calendar cell clicks
    container.querySelectorAll('.cal-day[data-date]').forEach(cell => {
      cell.addEventListener('click', () => {
        editingDate = cell.dataset.date;
        render();
        container.querySelector('#sense-input')?.focus();
      });
      cell.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          editingDate = cell.dataset.date;
          render();
          container.querySelector('#sense-input')?.focus();
        }
      });
    });
  }

  render();
}

function calendarSVG(entries) {
  const WEEKS = 15;
  const CELL = 14;
  const GAP  = 3;
  const STEP = CELL + GAP;
  const LEFT_PAD = 24;
  const TOP_PAD  = 18;
  const DAY_LABELS = ['M','T','W','T','F','S','S'];

  const today = new Date();
  today.setHours(0,0,0,0);

  // Start from Monday of (WEEKS) weeks ago
  const start = new Date(today);
  start.setDate(start.getDate() - start.getDay() + 1 - (WEEKS - 1) * 7);

  const entryMap = {};
  for (const e of entries) {
    entryMap[e.date] = e;
  }

  const W = LEFT_PAD + WEEKS * STEP + 4;
  const H = TOP_PAD + 7 * STEP + 20;

  let cells = '';
  let monthLabels = '';
  let lastMonth = -1;

  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(date.getDate() + w * 7 + d);
      if (date > today) continue;

      const key = dateKey(date);
      const entry = entryMap[key];
      const cx = LEFT_PAD + w * STEP;
      const cy = TOP_PAD + d * STEP;
      const isToday = key === dateKey(today);

      let fill = 'var(--bg-surface3)';
      let stroke = 'var(--border)';
      if (entry?.sense?.trim()) {
        if (entry.honored === true) fill = 'var(--accent)';
        else if (entry.honored === false) fill = 'rgba(194,87,90,0.55)';
        else fill = 'var(--warn)';
      }
      if (isToday) stroke = 'var(--accent)';

      cells += `
        <rect class="cal-day" data-date="${key}"
          x="${cx}" y="${cy}" width="${CELL}" height="${CELL}" rx="3"
          fill="${fill}" stroke="${stroke}" stroke-width="${isToday ? 1.5 : 0.5}"
          tabindex="0" role="button"
          aria-label="${formatDate(key)}${entry?.sense ? ': ' + entry.sense.slice(0,40) : ''}"
          style="cursor:pointer">
          <title>${formatDate(key)}${entry?.sense ? '\n' + entry.sense : ''}</title>
        </rect>
      `;

      // Month label on first week of each month
      if (d === 0 && date.getMonth() !== lastMonth) {
        lastMonth = date.getMonth();
        const monthStr = date.toLocaleDateString(undefined, { month: 'short' });
        monthLabels += `<text x="${cx}" y="${TOP_PAD - 5}" font-size="9" fill="var(--text-3)" font-family="var(--font-ui)">${monthStr}</text>`;
      }
    }
  }

  const dayLabelEls = DAY_LABELS.map((l, i) => {
    if (i % 2 === 0) {
      return `<text x="${LEFT_PAD - 14}" y="${TOP_PAD + i * STEP + 11}" font-size="9" fill="var(--text-3)" font-family="var(--font-ui)" text-anchor="middle">${l}</text>`;
    }
    return '';
  }).join('');

  return `<svg class="calendar-svg" viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;height:auto" role="grid" aria-label="Habit calendar">
    ${dayLabelEls}
    ${monthLabels}
    ${cells}
  </svg>`;
}

function dateKey(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

function formatDate(key) {
  const d = new Date(key + 'T12:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function escapeHTML(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
