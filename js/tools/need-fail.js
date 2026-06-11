/**
 * tools/need-fail.js — Do I Need Them to Fail?
 *
 * Live mechanic: The reflection paragraph is generated entirely
 * from the reader's own slider positions and updates continuously
 * as sliders move. Any uncomfortable finding arrives as the reader's
 * own admission — never the tool's verdict.
 *
 * This is the most sensitive tool. Tone: gentle, wondering, never labeling.
 */

import { store } from '../storage.js';

const SLIDERS = [
  {
    key: 'relief',
    label: 'Relief',
    description: 'If this person suddenly behaved exactly as I\'d want, how much would I feel relief?',
    lo: 'None at all',
    hi: 'Profound relief',
  },
  {
    key: 'suspicion',
    label: 'Suspicion',
    description: 'I\'d suspect it wouldn\'t last — this would probably revert.',
    lo: 'No suspicion',
    hi: 'Strong suspicion',
  },
  {
    key: 'disappointment',
    label: 'Disappointment',
    description: 'Some part of me would feel disappointed, even let down, if they suddenly changed.',
    lo: 'No disappointment',
    hi: 'Noticeable disappointment',
  },
  {
    key: 'loss',
    label: 'Sense of loss',
    description: 'I\'d feel like I\'d lost something — a familiar role, a clear story, or a reason to be right.',
    lo: 'No sense of loss',
    hi: 'Clear sense of loss',
  },
  {
    key: 'satisfaction',
    label: 'Quiet satisfaction',
    description: 'If I\'m honest, some part of me gets a quiet satisfaction when this person struggles or fails.',
    lo: 'None',
    hi: 'Yes, if I\'m honest',
  },
];

export function renderNeedFail(container) {
  const saved = store.getTool('needFail');
  const sliders = { ...(saved.sliders ?? {}) };
  const person = saved.person ?? '';

  function allSet() {
    return SLIDERS.every(s => sliders[s.key] !== undefined);
  }

  function save() {
    store.setTool('needFail', { sliders: { ...sliders }, person });
    store.setProgress('needFail', allSet() ? 'complete' : Object.keys(sliders).length > 0 ? 'in_progress' : 'not_started');
  }

  function generateReflection(sv) {
    const { relief = 5, suspicion = 5, disappointment = 5, loss = 5, satisfaction = 5 } = sv;
    const lines = [];

    if (relief >= 7) {
      lines.push('The strength of your relief suggests that this relationship genuinely costs you — you\'d welcome a real change.');
    } else if (relief <= 3) {
      lines.push('The low relief is worth sitting with. If you wouldn\'t feel much better if they changed, it may be worth asking: what work would still remain?');
    }

    if (disappointment >= 6 || loss >= 6) {
      lines.push(`There's ${disappointment >= 6 ? 'notable disappointment' : ''}${(disappointment >= 6 && loss >= 6) ? ' and ' : ''}${loss >= 6 ? 'a sense of loss' : ''} here. It may be worth asking what you would lose if this person changed — the story, the role you play in it, or the certainty you feel about being right.`);
    }

    if (suspicion >= 7) {
      lines.push('The suspicion that it wouldn\'t last could reflect real experience. It\'s also worth asking: would you find ways to discount their change even if it were genuine?');
    }

    if (satisfaction >= 6) {
      lines.push('The satisfaction you notice — even quietly — when they struggle is a significant signal. Not a verdict about who you are, but a question: what does being right require of them?');
    }

    if (disappointment >= 6 && relief <= 4) {
      lines.push('The combination of low relief and noticeable disappointment raises a quiet question: has their difficult behavior become load-bearing in some way — something you rely on to make sense of yourself or the situation?');
    }

    if (lines.length === 0) {
      lines.push('The slider positions don\'t suggest any strong pattern — or perhaps the honest readings are still coming into focus. This tool works best when the situation is one that\'s genuinely charged for you.');
    }

    return lines.join(' ');
  }

  function render() {
    container.innerHTML = `
      <div class="tool-header">
        <div class="tool-part">Part 2 · The Mechanism</div>
        <h1>Do I Need Them to Fail?</h1>
        <p class="tool-desc">
          When we're in the box toward someone, our self-justification can quietly depend
          on them continuing to behave badly. This tool asks an uncomfortable question:
          how would you honestly feel if they changed?
        </p>
      </div>

      <div class="field">
        <label for="person-input">Who is this about? (optional)</label>
        <input type="text" id="person-input" class="input" style="max-width:280px"
          placeholder="First name or 'my colleague', 'a family member'…"
          value="${escapeHTML(person)}" maxlength="40"
          autocomplete="off">
      </div>

      <p style="font-size:14px;color:var(--text-2);margin-bottom:24px;line-height:1.65">
        Imagine this person suddenly, genuinely started behaving in exactly the way you'd want.
        No backsliding. They've changed. Move each slider to your honest first reaction.
      </p>

      <div class="need-fail-sliders" id="sliders-container">
        ${SLIDERS.map(s => `
          <div class="slider-item">
            <label for="sl-${s.key}">${s.label}</label>
            <p class="slider-description">${s.description}</p>
            <div class="slider-wrap">
              <span class="slider-label-lo">${s.lo}</span>
              <input type="range" id="sl-${s.key}" class="nf-slider"
                data-key="${s.key}" min="0" max="10"
                value="${sliders[s.key] ?? 5}"
                aria-valuemin="0" aria-valuemax="10" aria-valuenow="${sliders[s.key] ?? 5}"
                aria-label="${s.label}">
              <span class="slider-label-hi">${s.hi}</span>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="need-fail-reflection" id="reflection">
        <div class="reflection-label">What this might suggest</div>
        ${Object.keys(sliders).length > 0
          ? generateReflection(sliders)
          : '<span style="color:var(--text-3)">Move the sliders to see the reflection update in real time.</span>'}
      </div>

      ${allSet() ? `
        <div class="card" style="margin-top:16px;border-color:var(--border);background:var(--bg-surface2);animation:fadeSlideIn .4s ease-out">
          <p style="font-size:13px;color:var(--text-3);line-height:1.65">
            There are no wrong answers here. The sliders don't produce a verdict — they surface something worth sitting with.
            If anything felt uncomfortable to move, that discomfort is probably the most useful thing this tool offered.
          </p>
        </div>
      ` : ''}

      <div class="tool-nav">
        <a href="#/part-2/collusion-loop" class="btn btn-ghost">← Collusion Loop</a>
        <a href="#/part-3" class="btn ${allSet() ? 'btn-primary' : 'btn-ghost'}">Next: Part 3 →</a>
      </div>
    `;

    // Wire person input
    container.querySelector('#person-input').addEventListener('input', function() {
      store.setTool('needFail', { sliders: { ...sliders }, person: this.value }, true);
    });

    // Wire sliders — live reflection update
    container.querySelectorAll('.nf-slider').forEach(sl => {
      sl.addEventListener('input', () => {
        sliders[sl.dataset.key] = parseInt(sl.value);
        sl.setAttribute('aria-valuenow', sl.value);
        save();
        const reflection = document.getElementById('reflection');
        if (reflection) {
          reflection.innerHTML = `
            <div class="reflection-label">What this might suggest</div>
            ${generateReflection(sliders)}
          `;
        }
      });
    });
  }

  render();
}

function escapeHTML(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
