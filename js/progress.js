/**
 * progress.js — Tracks per-tool completion and drives the
 * overall progress bar and nav indicators.
 */

import { store } from './storage.js';

// Tool registry — all tools in order
export const TOOLS = [
  { id: 'sealedLetter',    part: 0, title: 'Sealed Letter',                  route: '/sealed-letter' },
  { id: 'spotTheBox',      part: 1, title: 'Spot the Box',                   route: '/part-1/spot-the-box' },
  { id: 'heatmap',         part: 1, title: 'Relationship Heatmap',           route: '/part-1/heatmap' },
  { id: 'twoHearts',       part: 1, title: 'Same Behavior, Two Hearts',      route: '/part-1/two-hearts' },
  { id: 'sequenceBuilder', part: 2, title: 'Self-Betrayal Sequence Builder', route: '/part-2/sequence-builder' },
  { id: 'inflationMeters', part: 2, title: 'Inflation Meters',               route: '/part-2/inflation-meters' },
  { id: 'collusionLoop',   part: 2, title: 'Collusion Loop Animator',        route: '/part-2/collusion-loop' },
  { id: 'needFail',        part: 2, title: 'Do I Need Them to Fail?',        route: '/part-2/need-fail' },
  { id: 'whatHasntWorked', part: 3, title: "What Hasn't Worked",             route: '/part-3/what-hasnt-worked' },
  { id: 'apologyBuilder',  part: 3, title: 'Clean Apology Builder',          route: '/part-3/apology-builder' },
  { id: 'honorSense',      part: 3, title: 'Honor-the-Sense Tracker',        route: '/part-3/honor-sense' },
  { id: 'leadershipRadar', part: 3, title: 'Out-of-the-Box Leadership Radar', route: '/part-3/leadership-radar' },
];

export const TOOL_MAP = Object.fromEntries(TOOLS.map(t => [t.id, t]));

export function getPartTools(partNum) {
  return TOOLS.filter(t => t.part === partNum);
}

/** Returns 0–100 integer representing overall completion */
export function getOverallPercent() {
  const prog = store.getAllProgress();
  const scoreable = TOOLS.filter(t => t.part > 0); // exclude bookend from pct calc
  const done = scoreable.filter(t => prog[t.id] === 'complete').length;
  return Math.round((done / scoreable.length) * 100);
}

export function isPartComplete(partNum) {
  const tools = getPartTools(partNum);
  if (!tools.length) return false;
  const prog = store.getAllProgress();
  return tools.every(t => prog[t.id] === 'complete');
}

export function isPartStarted(partNum) {
  const tools = getPartTools(partNum);
  const prog = store.getAllProgress();
  return tools.some(t => prog[t.id] !== 'not_started' && prog[t.id] !== undefined);
}

/** Update the global progress bar and nav dots */
export function refreshProgressUI() {
  const pct = getOverallPercent();
  const bar = document.getElementById('overall-progress-fill');
  const label = document.getElementById('overall-progress-label');
  const progressBar = document.getElementById('overall-progress-bar');

  if (bar) bar.style.width = pct + '%';
  if (label) label.textContent = pct + '%';
  if (progressBar) progressBar.setAttribute('aria-valuenow', pct);

  // Update nav part dots
  for (let p = 1; p <= 3; p++) {
    const link = document.querySelector(`.nav-part-link[data-part="${p}"]`);
    if (!link) continue;
    const dot = link.querySelector('.nav-check');
    if (isPartComplete(p)) {
      link.classList.add('done');
      if (dot) dot.title = 'Complete';
    } else {
      link.classList.remove('done');
    }
  }
}

// Keep progress bar in sync whenever progress changes
document.addEventListener('progress:changed', refreshProgressUI);
