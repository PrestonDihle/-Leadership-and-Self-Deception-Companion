/**
 * companion.js — The "Tells Pulse" floating widget.
 *
 * Always accessible from any screen; lets the reader log
 * in-the-box "tells" they notice in real life. Accumulates
 * a live frequency chart and time-of-day strip.
 */

import { store } from './storage.js';

const TELLS = [
  'Defensiveness',
  'Scorekeeping',
  'Rehearsing an argument',
  'Quiet satisfaction at their stumble',
  'Feeling owed',
  'Going cold',
  'Inflating their faults',
  'Justifying myself',
];

const HOUR_LABELS = ['12a','3a','6a','9a','12p','3p','6p','9p'];

function init() {
  const btn = document.getElementById('tells-pulse-btn');
  const panel = document.getElementById('tells-pulse-panel');
  if (!btn || !panel) return;

  renderPanel(panel);

  btn.addEventListener('click', () => {
    const open = panel.getAttribute('hidden') === null;
    if (open) {
      closePanel(btn, panel);
    } else {
      openPanel(btn, panel);
    }
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!document.getElementById('tells-pulse-widget').contains(e.target)) {
      if (panel.getAttribute('hidden') === null) closePanel(btn, panel);
    }
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && panel.getAttribute('hidden') === null) {
      closePanel(btn, panel);
      btn.focus();
    }
  });

  // Live updates when a tell is added
  document.addEventListener('tells:changed', () => {
    renderPanel(panel);
    updateBadge();
  });

  updateBadge();
}

function openPanel(btn, panel) {
  panel.removeAttribute('hidden');
  btn.setAttribute('aria-expanded', 'true');
  renderPanel(panel);
  // Focus first interactive element
  const first = panel.querySelector('button, [tabindex="0"]');
  if (first) first.focus();
}

function closePanel(btn, panel) {
  panel.setAttribute('hidden', '');
  btn.setAttribute('aria-expanded', 'false');
}

function updateBadge() {
  const badge = document.getElementById('pulse-badge');
  if (!badge) return;
  const tells = store.getTells();
  if (tells.length === 0) {
    badge.setAttribute('hidden', '');
    return;
  }
  badge.removeAttribute('hidden');
  // Show today's count
  const today = new Date().toDateString();
  const todayCount = tells.filter(t => new Date(t.ts).toDateString() === today).length;
  badge.textContent = todayCount > 99 ? '99+' : String(todayCount);
}

function renderPanel(panel) {
  const tells = store.getTells();
  const freq = computeFreq(tells);
  const timeSlots = computeTimeSlots(tells);
  const maxFreq = Math.max(1, ...Object.values(freq));

  panel.innerHTML = `
    <div class="pulse-panel-header">
      <h3>Tells Pulse</h3>
      <button class="pulse-close icon-btn" aria-label="Close">✕</button>
    </div>

    <div class="pulse-tell-list" role="group" aria-label="Log a tell">
      ${TELLS.map(t => `
        <button class="pulse-tell-btn" data-tell="${t}">${t}</button>
      `).join('')}
    </div>

    <div class="pulse-chart-area">
      ${tells.length === 0 ? `
        <p class="pulse-chart-title" style="color:var(--text-3);font-style:italic">
          Tap a tell above to start logging.
        </p>
      ` : `
        <p class="pulse-chart-title">Frequency (all time · ${tells.length} logged)</p>
        <div class="pulse-bars" role="list">
          ${TELLS.map(t => `
            <div class="pulse-bar-row" role="listitem">
              <span class="pulse-bar-label">${t}</span>
              <div class="pulse-bar-track" role="progressbar" aria-valuenow="${freq[t]||0}" aria-valuemin="0" aria-valuemax="${maxFreq}" aria-label="${t}: ${freq[t]||0}">
                <div class="pulse-bar-fill" style="width:${((freq[t]||0)/maxFreq)*100}%"></div>
              </div>
              <span class="pulse-bar-count">${freq[t]||0}</span>
            </div>
          `).join('')}
        </div>

        <p class="pulse-chart-title" style="margin-top:16px">Time of day</p>
        <div class="time-strip" role="img" aria-label="Time-of-day distribution">
          ${timeSlots.map((count, i) => `
            <div class="time-slot ${count > 0 ? (count > 2 ? 'many-tells' : 'has-tells') : ''}"
                 title="${HOUR_LABELS[i]}: ${count} tell${count !== 1 ? 's' : ''}">
              <span class="time-slot-label">${HOUR_LABELS[i]}</span>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;

  // Wire close button
  panel.querySelector('.pulse-close')?.addEventListener('click', () => {
    const btn = document.getElementById('tells-pulse-btn');
    closePanel(btn, panel);
    btn.focus();
  });

  // Wire tell buttons
  panel.querySelectorAll('.pulse-tell-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      store.addTell(btn.dataset.tell);
      // Brief visual flash
      btn.style.background = 'var(--accent-dim)';
      btn.style.borderColor = 'var(--accent)';
      setTimeout(() => {
        btn.style.background = '';
        btn.style.borderColor = '';
      }, 600);
      showToast(`Logged: ${btn.dataset.tell}`, 'success');
    });
  });
}

function computeFreq(tells) {
  const freq = {};
  for (const { tell } of tells) {
    freq[tell] = (freq[tell] || 0) + 1;
  }
  return freq;
}

function computeTimeSlots(tells) {
  // 8 slots of 3 hours each: 0-2, 3-5, 6-8, 9-11, 12-14, 15-17, 18-20, 21-23
  const slots = new Array(8).fill(0);
  for (const { ts } of tells) {
    const h = new Date(ts).getHours();
    slots[Math.floor(h / 3)]++;
  }
  return slots;
}

export function showToast(message, type = '') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast${type ? ' ' + type : ''}`;
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

export { init as initCompanion };
