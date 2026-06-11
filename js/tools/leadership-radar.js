/**
 * tools/leadership-radar.js — Out-of-the-Box Leadership Radar
 *
 * Live mechanic: The SVG radar polygon bends in real time as each
 * Likert statement is rated. Each axis maps to a concrete practice
 * shown when that axis scores low.
 *
 * Statements describe in-box behavior; low agreement = stronger score
 * = further from center = more out-of-box. The radar fills outward
 * as the reader moves toward the out-of-box end.
 *
 * Retake overlay: a second snapshot can be overlaid faintly for comparison.
 */

import { store } from '../storage.js';
import { showToast } from '../companion.js';

const AXES = [
  {
    id: 'presence',
    label: 'Presence',
    statement: 'I find myself thinking mainly about what I need from each person rather than engaging with them as a whole person.',
    practice: 'Ask one genuine question about their situation or priorities before the meeting turns to yours.',
  },
  {
    id: 'accountability',
    label: 'Accountability',
    statement: 'When something goes wrong, I tend to look first at what others did wrong before considering what I contributed.',
    practice: 'Before any post-mortem, write down two things you could have done differently — before reviewing anyone else\'s role.',
  },
  {
    id: 'transparency',
    label: 'Transparency',
    statement: 'I share information about decisions selectively, partly to manage how I appear to others.',
    practice: 'Share the reasoning behind one decision this week that you\'d normally just announce.',
  },
  {
    id: 'contribution',
    label: 'Contribution',
    statement: 'I notice myself keeping score — mentally tracking who owes what, or who\'s ahead.',
    practice: 'Do one thing for someone on your team this week with no expectation of return or recognition.',
  },
  {
    id: 'listening',
    label: 'Listening',
    statement: 'In disagreements, I\'m often preparing my response while the other person is still talking.',
    practice: 'In the next difficult conversation, wait until the other person has fully stopped before you begin to reply.',
  },
  {
    id: 'candor',
    label: 'Candor',
    statement: 'I avoid certain conversations with certain people because the discomfort doesn\'t feel worth it.',
    practice: 'Identify one conversation you\'ve been avoiding. Write one sentence stating what you actually need to say.',
  },
];

const LIKERT_LABELS = ['Strongly\nagree', 'Agree', 'Neutral', 'Disagree', 'Strongly\ndisagree'];

export function renderLeadershipRadar(container) {
  container.classList.add && container.classList.add('wide');
  document.getElementById('main-content')?.classList.add('wide');

  const saved = store.getTool('leadershipRadar');
  const scores = { ...(saved.scores ?? {}) };
  const snapshots = [...(saved.snapshots ?? [])];
  const showOverlay = saved.showOverlay ?? false;

  function displayScore(score) {
    // score 1–5; 1=strongly agree (in-box) → display 1; 5=strongly disagree → display 5
    // We invert: radar shows 6-score so higher agreement=closer to center
    return score ? (6 - score) : 0;
  }

  function allRated() { return AXES.every(a => scores[a.id] !== undefined); }

  function save() {
    store.setTool('leadershipRadar', { scores: { ...scores }, snapshots: [...snapshots], showOverlay });
    store.setProgress('leadershipRadar', allRated() ? 'complete' : Object.keys(scores).length > 0 ? 'in_progress' : 'not_started');
  }

  function render() {
    const rated = Object.keys(scores).length;
    const prevSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;

    container.innerHTML = `
      <div class="tool-header">
        <div class="tool-part">Part 3 · Getting Out</div>
        <h1>Out-of-the-Box Leadership Radar</h1>
        <p class="tool-desc">
          Rate each statement about your leadership behavior. The radar bends as you
          respond — outward means more out-of-box on that dimension. Axes scoring low
          show a suggested practice.
        </p>
      </div>

      <div class="radar-wrap">
        <div class="radar-svg-container">
          ${radarSVG(scores, prevSnapshot && showOverlay ? prevSnapshot.scores : null)}
          ${allRated() ? `
            <div style="text-align:center;margin-top:8px;display:flex;flex-direction:column;gap:8px;align-items:center">
              <button id="snapshot-btn" class="btn btn-ghost btn-sm">Save snapshot for comparison</button>
              ${snapshots.length > 0 ? `
                <button id="overlay-btn" class="btn btn-ghost btn-sm">
                  ${showOverlay ? '✓ Showing previous' : 'Compare to previous'}
                </button>
                <div class="snapshot-item">${snapshots.length} snapshot${snapshots.length > 1 ? 's' : ''} saved</div>
              ` : ''}
            </div>
          ` : `<p style="font-size:12px;color:var(--text-3);text-align:center;margin-top:8px">${rated}/${AXES.length} rated</p>`}
        </div>

        <div class="radar-statements">
          ${AXES.map(axis => {
            const score = scores[axis.id];
            const isLow = score !== undefined && score <= 2; // 1-2 = strongly agree/agree = in-box end
            return `
              <div class="radar-statement" id="stmt-${axis.id}">
                <h4>${axis.label}</h4>
                <p style="font-size:13px;color:var(--text-2);margin-bottom:10px;line-height:1.5">${axis.statement}</p>
                <div class="likert-row" role="radiogroup" aria-label="${axis.label} rating">
                  ${[1,2,3,4,5].map(v => `
                    <button class="likert-btn ${score === v ? 'selected' : ''}"
                      data-axis="${axis.id}" data-val="${v}"
                      role="radio" aria-checked="${score === v}"
                      title="${LIKERT_LABELS[v-1].replace('\n', ' ')}">
                      ${v}
                    </button>
                  `).join('')}
                </div>
                <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-3);margin-top:4px;padding:0 2px">
                  <span>Strongly agree</span>
                  <span>Strongly disagree</span>
                </div>
                <div class="radar-axis-suggestion ${isLow ? 'visible' : ''}">
                  ↗ <strong>Practice:</strong> ${axis.practice}
                </div>
              </div>
            `;
          }).join('')}

          ${allRated() ? `
            <div class="card" style="border-color:var(--accent);background:var(--accent-dim);animation:fadeSlideIn .4s ease-out;margin-top:8px">
              <strong>All six dimensions rated.</strong>
              <p style="font-size:13px;color:var(--text-2);margin-top:8px;line-height:1.65">
                The shape of your radar is a profile, not a verdict. The dimensions closest
                to center are the ones the book suggests are most worth honest attention.
                Come back in 30 days to overlay a new snapshot and see what's shifted.
              </p>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="tool-nav" style="margin-top:32px">
        <a href="#/part-3/honor-sense" class="btn btn-ghost">← Honor-the-Sense</a>
        <a href="#/part-3/unseal" class="btn ${allRated() ? 'btn-primary' : 'btn-ghost'}">
          ${allRated() ? 'Open your Sealed Letter →' : 'Unseal (complete radar first)'}
        </a>
      </div>
    `;

    // Wire Likert buttons
    container.querySelectorAll('.likert-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const axis = btn.dataset.axis;
        const val = parseInt(btn.dataset.val);
        scores[axis] = val;
        save();
        updateRadar();
        updateStatement(axis, val);
        updateButtons(axis, val);
      });
    });

    // Wire snapshot
    container.querySelector('#snapshot-btn')?.addEventListener('click', () => {
      snapshots.push({ ts: new Date().toISOString(), scores: { ...scores } });
      save();
      showToast('Snapshot saved', 'success');
      render();
    });

    container.querySelector('#overlay-btn')?.addEventListener('click', () => {
      store.setTool('leadershipRadar', { scores, snapshots, showOverlay: !showOverlay });
      render();
    });
  }

  function updateRadar() {
    const svgContainer = container.querySelector('.radar-svg-container');
    if (!svgContainer) return;
    const prevSnapshot = snapshots.length > 0 && showOverlay ? snapshots[snapshots.length - 1] : null;
    const newSVG = radarSVG(scores, prevSnapshot?.scores ?? null);
    // Replace only the SVG portion
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newSVG;
    const oldSVG = svgContainer.querySelector('svg');
    const newSVGEl = tempDiv.querySelector('svg');
    if (oldSVG && newSVGEl) oldSVG.replaceWith(newSVGEl);
  }

  function updateStatement(axisId, score) {
    const isLow = score <= 2;
    const stmt = container.querySelector(`#stmt-${axisId}`);
    if (!stmt) return;
    const suggestion = stmt.querySelector('.radar-axis-suggestion');
    if (suggestion) suggestion.classList.toggle('visible', isLow);
  }

  function updateButtons(axisId, selectedVal) {
    container.querySelectorAll(`.likert-btn[data-axis="${axisId}"]`).forEach(btn => {
      const v = parseInt(btn.dataset.val);
      btn.classList.toggle('selected', v === selectedVal);
      btn.setAttribute('aria-checked', String(v === selectedVal));
    });
  }

  render();

  return () => {
    document.getElementById('main-content')?.classList.remove('wide');
  };
}

function radarSVG(scores, overlayScores) {
  const N = AXES.length;
  const CX = 170, CY = 170, R = 130;
  const W = 340, H = 340;

  function getPoint(i, value, radius) {
    const angle = (i / N) * 2 * Math.PI - Math.PI / 2;
    const r = (value / 5) * radius;
    return {
      x: CX + r * Math.cos(angle),
      y: CY + r * Math.sin(angle),
    };
  }

  // Grid circles
  const gridCircles = [1, 2, 3, 4, 5].map(v => {
    const r = (v / 5) * R;
    return `<circle cx="${CX}" cy="${CY}" r="${r}" fill="none" stroke="var(--border)" stroke-width="${v === 5 ? 1.5 : 0.8}" stroke-dasharray="${v < 5 ? '4 4' : 'none'}"/>`;
  }).join('');

  // Axis lines
  const axisLines = AXES.map((_, i) => {
    const end = getPoint(i, 5, R);
    return `<line x1="${CX}" y1="${CY}" x2="${end.x}" y2="${end.y}" stroke="var(--border)" stroke-width="1"/>`;
  }).join('');

  // Labels
  const axisLabels = AXES.map((axis, i) => {
    const angle = (i / N) * 2 * Math.PI - Math.PI / 2;
    const labelR = R + 22;
    const x = CX + labelR * Math.cos(angle);
    const y = CY + labelR * Math.sin(angle);
    const anchor = Math.abs(Math.cos(angle)) < 0.1 ? 'middle' : (Math.cos(angle) > 0 ? 'start' : 'end');
    return `<text x="${x}" y="${y + 4}" text-anchor="${anchor}" font-size="11" fill="var(--text-2)" font-family="var(--font-ui)" font-weight="600">${axis.label}</text>`;
  }).join('');

  // Data polygon
  const dataPoints = AXES.map((axis, i) => {
    const v = scores[axis.id] ? (6 - scores[axis.id]) : 0;
    return getPoint(i, v, R);
  });
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  // Overlay polygon (previous snapshot)
  let overlayPath = '';
  if (overlayScores) {
    const overlayPoints = AXES.map((axis, i) => {
      const v = overlayScores[axis.id] ? (6 - overlayScores[axis.id]) : 0;
      return getPoint(i, v, R);
    });
    overlayPath = `<path d="${overlayPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} Z"
      fill="rgba(212,130,26,0.06)" stroke="rgba(212,130,26,0.25)" stroke-width="1.5" stroke-dasharray="4 3"/>`;
  }

  // Dot markers on data polygon
  const dataDots = dataPoints
    .filter((_, i) => scores[AXES[i].id] !== undefined)
    .map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="var(--accent)" stroke="var(--bg-base)" stroke-width="1.5"/>`).join('');

  const filledAny = AXES.some(a => scores[a.id] !== undefined);

  return `
    <svg class="radar-svg" viewBox="0 0 ${W} ${H}" aria-label="Leadership radar chart" role="img">
      ${gridCircles}
      ${axisLines}
      ${axisLabels}
      ${overlayPath}
      ${filledAny ? `
        <path d="${dataPath}" fill="rgba(212,130,26,0.15)" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>
        ${dataDots}
      ` : ''}
      <!-- Axis scale labels -->
      ${[1,3,5].map(v => {
        const y = CY - (v / 5) * R - 3;
        return `<text x="${CX + 3}" y="${y}" font-size="8" fill="var(--text-3)" font-family="var(--font-ui)">${v}</text>`;
      }).join('')}
    </svg>
  `;
}
