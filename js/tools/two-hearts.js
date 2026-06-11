/**
 * tools/two-hearts.js — Same Behavior, Two Hearts
 *
 * Live mechanic: A single toggle flips between in-box and out-of-box
 * internal state. The behavior description stays identical; the thought
 * bubble and "how they likely experience this" line swap instantly.
 * Holding two things constant while one changes IS the lesson.
 */

import { store } from '../storage.js';

const SCENARIOS = [
  {
    id: 'sc1',
    behavior: 'You stay late to help a colleague finish a project that\'s running behind.',
    inBox: {
      thought: 'I\'ll make sure they remember this. I\'ve gone above and beyond — again. They owe me one, and I plan to cash in when I need something.',
      experience: 'Grateful on the surface, but something feels transactional. Like there\'s a string attached that hasn\'t been named yet.',
    },
    outBox: {
      thought: 'I actually want this to go well. I care about what they\'re working on, and the extra hour doesn\'t feel like a cost — it feels like contribution.',
      experience: 'Genuinely supported. The absence of strings attached is something people can feel, even if they can\'t name it.',
    },
  },
  {
    id: 'sc2',
    behavior: 'You give a team member critical feedback on a piece of work they submitted.',
    inBox: {
      thought: 'This is frustrating. I shouldn\'t have to keep catching these things. Let them feel the weight of the standard here.',
      experience: 'Judged. Even if the feedback is accurate, it lands as a verdict about them rather than useful information about the work.',
    },
    outBox: {
      thought: 'I want them to get better at this. I\'m going to be direct because I believe they can handle honest input and because I care about their growth.',
      experience: 'Seen and challenged in a way that feels respectful. The feedback is the same words, but the quality of the conversation is different.',
    },
  },
  {
    id: 'sc3',
    behavior: 'You acknowledge a mistake you made in front of the team.',
    inBox: {
      thought: 'I need to say this before someone else does — get ahead of it and control how it\'s received. This will actually make me look confident.',
      experience: 'Managed. The apology is technically present but people sense the calculation behind it. Trust doesn\'t build from managed disclosure.',
    },
    outBox: {
      thought: 'I got this wrong, and the team deserves to know that. Saying so is just the honest thing to do.',
      experience: 'Respected. When accountability is genuine rather than strategic, it\'s palpable — and it changes the team\'s relationship with error.',
    },
  },
  {
    id: 'sc4',
    behavior: 'You share information about an upcoming organizational change with your team.',
    inBox: {
      thought: 'I\'ll share what they need to know without getting into the messy details. I need to manage how this lands so they don\'t overreact.',
      experience: 'Told rather than trusted. Even when information is delivered calmly, people can sense when transparency has been curated to manage their reaction.',
    },
    outBox: {
      thought: 'They deserve the real picture. They\'re capable of handling uncertainty, and they can only make good decisions with accurate information.',
      experience: 'Trusted with the truth. This kind of transparency — including the uncertainty — actually builds stability rather than undermining it.',
    },
  },
  {
    id: 'sc5',
    behavior: 'You ask how a direct report is doing.',
    inBox: {
      thought: 'I should check in — it\'s good management practice. A quick conversation covers my bases and lets me get back to what I actually need to do.',
      experience: 'Checked up on. The question is the same, but people can sense when attention is procedural versus actually present.',
    },
    outBox: {
      thought: 'I notice I don\'t really know how they\'re doing lately. I\'m genuinely curious.',
      experience: 'Seen. A simple question lands entirely differently when the asker actually wants to know the answer.',
    },
  },
  {
    id: 'sc6',
    behavior: 'You cover for a colleague who has to leave early due to a family situation.',
    inBox: {
      thought: 'Fine. But this is the second time this month, and I\'m keeping track. When I need flexibility, I expect the same.',
      experience: 'Covered, but aware there\'s a ledger being kept. Favors that come with invisible price tags don\'t quite land as generosity.',
    },
    outBox: {
      thought: 'Of course. Family stuff is real, and they\'d do the same. This is just what teams do.',
      experience: 'Genuinely supported. The difference between help-as-investment and help-as-care is something people sense even when nothing is said.',
    },
  },
];

export function renderTwoHearts(container) {
  const saved = store.getTool('twoHearts');
  const viewed = new Set(saved.viewed ?? []);
  const notes = { ...(saved.notes ?? {}) };

  let currentIdx = 0;
  let isInBox = true; // start in-box so the first toggle is from in→out

  function markViewed(id) {
    viewed.add(id);
    const done = viewed.size >= SCENARIOS.length && [...viewed].every(id => {
      const sc = SCENARIOS.find(s => s.id === id);
      return sc;
    });
    store.setTool('twoHearts', { viewed: [...viewed], notes: { ...notes } });
    store.setProgress('twoHearts', done ? 'complete' : viewed.size > 0 ? 'in_progress' : 'not_started');
  }

  function render() {
    const scenario = SCENARIOS[currentIdx];
    const state = isInBox ? scenario.inBox : scenario.outBox;
    const allViewed = viewed.size >= SCENARIOS.length;

    container.innerHTML = `
      <div class="tool-header">
        <div class="tool-part">Part 1 · Awareness</div>
        <h1>Same Behavior, Two Hearts</h1>
        <p class="tool-desc">
          The behavior never changes — only the state behind it. Toggle between
          in-box and out-of-box and notice what shifts. Then move through all six scenarios.
        </p>
      </div>

      <div class="hearts-scenario">
        <div class="behavior-card">
          <div style="font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--text-3);margin-bottom:8px">The behavior (unchanged)</div>
          ${escapeHTML(scenario.behavior)}
        </div>

        <div class="hearts-toggle-row">
          <span class="heart-state-label in-box" id="in-box-lbl">In-box state</span>
          <button
            role="switch"
            class="toggle-btn"
            aria-checked="${!isInBox}"
            aria-label="Toggle between in-box and out-of-box state"
            id="hearts-toggle"
          ></button>
          <span class="heart-state-label out-box" id="out-box-lbl">Out-of-box state</span>
        </div>

        <div class="thought-bubble ${isInBox ? 'in-state' : 'out-state'}" id="thought-bubble">
          <p class="thought-text" id="thought-text">"${escapeHTML(state.thought)}"</p>
        </div>

        <div class="experience-line" id="exp-line">
          <strong>How the other person likely experiences this:</strong><br>
          ${escapeHTML(state.experience)}
        </div>

        <div class="field mt-4">
          <label for="hearts-note" style="font-size:12px;color:var(--text-3)">Optional: a note to yourself about this scenario</label>
          <textarea
            id="hearts-note"
            class="textarea"
            style="min-height:64px"
            placeholder="What does this bring up for you?"
          >${escapeHTML(notes[scenario.id] ?? '')}</textarea>
        </div>
      </div>

      <div class="hearts-deck-nav">
        <button class="btn btn-ghost btn-sm" id="prev-btn" ${currentIdx === 0 ? 'disabled' : ''}>← Previous</button>
        <span class="deck-counter">
          ${[...Array(SCENARIOS.length)].map((_, i) => `
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;margin:0 2px;background:${
              viewed.has(SCENARIOS[i].id) ? 'var(--accent)' : i === currentIdx ? 'var(--text-3)' : 'var(--bg-surface3)'
            }"></span>
          `).join('')}
          <span style="margin-left:8px;font-size:12px;color:var(--text-3)">${currentIdx + 1} / ${SCENARIOS.length}</span>
        </span>
        <button class="btn btn-ghost btn-sm" id="next-btn" ${currentIdx >= SCENARIOS.length - 1 ? 'disabled' : ''}>Next →</button>
      </div>

      ${allViewed ? `
        <div class="card" style="margin-top:24px;border-color:var(--accent);background:var(--accent-dim);animation:fadeSlideIn .4s ease-out">
          <strong>All six scenarios explored.</strong>
          <p style="color:var(--text-2);font-size:13px;margin-top:8px;line-height:1.65">
            The behavior was identical every time. What changed was the state behind it — and that's what the other person actually lives with.
          </p>
        </div>
      ` : ''}

      <div class="tool-nav">
        <a href="#/part-1/heatmap" class="btn btn-ghost">← Heatmap</a>
        <a href="#/part-2" class="btn ${allViewed ? 'btn-primary' : 'btn-ghost'}">Next: Part 2 →</a>
      </div>
    `;

    // Mark this one as viewed when loaded
    markViewed(scenario.id);

    // Toggle button
    container.querySelector('#hearts-toggle').addEventListener('click', function() {
      isInBox = !isInBox;
      this.setAttribute('aria-checked', String(!isInBox));
      updateState(scenario, isInBox);
    });

    // Arrow key support on toggle
    container.querySelector('#hearts-toggle').addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { isInBox = true; this.setAttribute('aria-checked', 'false'); updateState(scenario, isInBox); }
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { isInBox = false; this.setAttribute('aria-checked', 'true'); updateState(scenario, isInBox); }
    });

    // Nav
    container.querySelector('#prev-btn').addEventListener('click', () => {
      if (currentIdx > 0) { currentIdx--; isInBox = true; render(); }
    });
    container.querySelector('#next-btn').addEventListener('click', () => {
      if (currentIdx < SCENARIOS.length - 1) { currentIdx++; isInBox = true; render(); }
    });

    // Note autosave
    container.querySelector('#hearts-note').addEventListener('input', function() {
      notes[scenario.id] = this.value;
      store.setTool('twoHearts', { viewed: [...viewed], notes: { ...notes } }, true);
    });
  }

  function updateState(scenario, inBox) {
    const state = inBox ? scenario.inBox : scenario.outBox;
    const bubble = document.getElementById('thought-bubble');
    const text = document.getElementById('thought-text');
    const exp = document.getElementById('exp-line');
    if (bubble) {
      bubble.className = `thought-bubble ${inBox ? 'in-state' : 'out-state'}`;
    }
    if (text) text.textContent = `"${state.thought}"`;
    if (exp) exp.innerHTML = `<strong>How the other person likely experiences this:</strong><br>${escapeHTML(state.experience)}`;
  }

  render();
}

function escapeHTML(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
