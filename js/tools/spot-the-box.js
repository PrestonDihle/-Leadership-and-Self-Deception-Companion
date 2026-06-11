/**
 * tools/spot-the-box.js — Lens-classification scenario quiz.
 *
 * Live mechanic: A tally bar shifts color balance as each scenario
 * is answered, so by the end the reader sees a lens profile they
 * didn't set out to prove.
 */

import { store } from '../storage.js';

const SCENARIOS = [
  {
    id: 's1',
    situation: 'A team member\'s report lands with errors for the third time. You need to address it before the week\'s out.',
    options: [
      { id: 'a', text: 'They just don\'t care about quality. I shouldn\'t have to keep fixing this.', lens: 'in', note: 'Assigning a character conclusion ("doesn\'t care") rather than staying curious about what\'s actually happening.' },
      { id: 'b', text: 'What do I not yet know about why this keeps happening?', lens: 'out', note: 'Genuine curiosity holds the other person as a full human being with a situation, not a verdict to hand down.' },
      { id: 'c', text: 'I need to make it clear that this is unacceptable.', lens: 'in', note: 'The priority is your message landing, with the team member positioned mainly as someone to be corrected.' },
      { id: 'd', text: 'Something about the setup isn\'t working. Let\'s figure out what.', lens: 'out', note: 'Locates the problem in the situation—leaves room for a real conversation rather than a verdict.' },
    ]
  },
  {
    id: 's2',
    situation: 'In a meeting, a peer immediately challenges your proposal before you\'ve finished presenting it.',
    options: [
      { id: 'a', text: 'They\'re always trying to undermine me in front of others.', lens: 'in', note: 'A story about their motives, built on minimal evidence — and it shuts down any real curiosity.' },
      { id: 'b', text: 'I\'m annoyed, but I wonder what they\'re actually reacting to.', lens: 'out', note: 'Acknowledges your reaction honestly without letting it harden into a story about their character.' },
      { id: 'c', text: 'I need to defend this well or I\'ll lose credibility with the room.', lens: 'in', note: 'Focus has shifted to self-protection. The peer is now an obstacle to manage rather than a person to engage.' },
      { id: 'd', text: 'Let me hear the concern — there might be something I missed.', lens: 'out', note: 'Treats the challenge as potentially useful rather than as an attack.' },
    ]
  },
  {
    id: 's3',
    situation: 'A family member brings up an old grievance you thought was resolved. You feel a familiar tightening.',
    options: [
      { id: 'a', text: 'Here we go again. They love holding onto this.', lens: 'in', note: 'Labels their character ("loves holding onto this") and positions you as the reasonable one before anything is said.' },
      { id: 'b', text: 'There\'s something here that hasn\'t actually been resolved for them.', lens: 'out', note: 'Stays with their experience rather than dismissing the topic as already settled.' },
      { id: 'c', text: 'I\'m going to stay calm and not take the bait.', lens: 'in', note: '"Not taking the bait" still frames them as someone doing something to you, even if your behavior looks fine.' },
      { id: 'd', text: 'I feel defensive, and I should probably sit with why before I respond.', lens: 'out', note: 'Turns attention inward — the defensiveness itself is interesting data.' },
    ]
  },
  {
    id: 's4',
    situation: 'You give a direct report critical feedback. They go quiet and seem to shut down.',
    options: [
      { id: 'a', text: 'They can\'t handle honest feedback. That\'s a problem.', lens: 'in', note: 'The takeaway is about their limitation, not about the exchange itself.' },
      { id: 'b', text: 'Something about how I said that landed badly. Worth asking about.', lens: 'out', note: 'Stays curious about what happened between you rather than reaching for a verdict about them.' },
      { id: 'c', text: 'I\'ll give them time to process. The feedback was fair.', lens: 'in', note: 'Retreating behind "the feedback was fair" is a way of closing off rather than staying present.' },
      { id: 'd', text: 'I notice they\'ve gone quiet. Let me check in rather than leave it here.', lens: 'out', note: 'Responds to what\'s actually happening in front of you.' },
    ]
  },
  {
    id: 's5',
    situation: 'A colleague receives public praise for a project you contributed to significantly. Your name isn\'t mentioned.',
    options: [
      { id: 'a', text: 'They took credit for my work. I\'m not going to forget this.', lens: 'in', note: 'A story of intentional wrongdoing — and now you\'re keeping score.' },
      { id: 'b', text: 'That stings. I\'m not sure they even realized I wasn\'t credited.', lens: 'out', note: 'Feels the sting honestly while leaving open that no ill intent was involved.' },
      { id: 'c', text: 'I\'ll say something — but mainly to protect myself next time.', lens: 'in', note: 'Addresses the situation, but through the lens of self-protection rather than genuine connection.' },
      { id: 'd', text: 'I\'d like to address this. Maybe there\'s a simple fix if I just bring it up.', lens: 'out', note: 'Practical, forward-oriented, and treats the colleague as someone capable of hearing this.' },
    ]
  },
  {
    id: 's6',
    situation: 'Someone on your team seems disengaged lately — short answers, absent from optional meetings.',
    options: [
      { id: 'a', text: 'They\'re coasting. I\'m paying attention even if they\'re not.', lens: 'in', note: 'Verdict first, curiosity absent — and now there\'s an adversarial frame forming.' },
      { id: 'b', text: 'Something might be going on with them. I should check in.', lens: 'out', note: 'Reads the behavior as a signal rather than a character flaw, and responds with care.' },
      { id: 'c', text: 'I\'ve created a good environment. What they do with it is up to them.', lens: 'in', note: 'Hands off responsibility cleanly — but also hands off the relationship.' },
      { id: 'd', text: 'I\'m curious what\'s behind the shift. I might be missing something.', lens: 'out', note: 'Stays genuinely curious about a person you\'re responsible for.' },
    ]
  },
  {
    id: 's7',
    situation: 'Your manager praises a colleague\'s approach to a problem you thought you\'d already solved better.',
    options: [
      { id: 'a', text: 'My manager just doesn\'t fully understand what I\'ve been doing.', lens: 'in', note: 'Explains the gap by diminishing their perception rather than staying open to learning something.' },
      { id: 'b', text: 'Maybe there\'s something in their approach I\'m not seeing. Worth asking about.', lens: 'out', note: 'Treats the praise as information rather than a verdict against you.' },
      { id: 'c', text: 'I should make my contributions more visible going forward.', lens: 'in', note: 'A reasonable action, but the impulse is about impression management, not the work itself.' },
      { id: 'd', text: 'I notice I feel a bit stung. What\'s actually useful to take from this?', lens: 'out', note: 'Names the feeling and then moves toward what\'s genuinely useful — rather than away from discomfort.' },
    ]
  },
  {
    id: 's8',
    situation: 'A friend cancels last-minute on plans you\'d been looking forward to. This has happened before.',
    options: [
      { id: 'a', text: 'They don\'t value my time. I\'m going to stop making the effort.', lens: 'in', note: 'Two conclusions stacked — about their values and your future behavior — without a real conversation.' },
      { id: 'b', text: 'I\'m disappointed. I wonder what\'s actually going on with them lately.', lens: 'out', note: 'Honest about your own feeling, curious about theirs — rather than building a case.' },
      { id: 'c', text: 'I\'ll say I\'m fine to avoid drama. But I\'m keeping track.', lens: 'in', note: 'Says one thing, does another — and the scorekeeping is a classic tell.' },
      { id: 'd', text: 'I should tell them honestly that the pattern is hard on me.', lens: 'out', note: 'Brings you into the conversation as a real person with a real reaction — not a score-keeper or a martyr.' },
    ]
  },
];

export function renderSpotTheBox(container) {
  const saved = store.getTool('spotTheBox');
  const answers = saved.answers ? [...saved.answers] : [];

  store.setProgress('spotTheBox', answers.length === 0 ? 'not_started' : answers.length >= SCENARIOS.length ? 'complete' : 'in_progress');

  let currentIdx = answers.length >= SCENARIOS.length ? SCENARIOS.length - 1 : answers.length;
  let isComplete = answers.length >= SCENARIOS.length;

  function countLens() {
    let inCount = 0, outCount = 0;
    for (const a of answers) {
      const sc = SCENARIOS.find(s => s.id === a.scenarioId);
      if (!sc) continue;
      const opt = sc.options.find(o => o.id === a.optionId);
      if (!opt) continue;
      if (opt.lens === 'in') inCount++;
      else outCount++;
    }
    return { inCount, outCount, total: inCount + outCount };
  }

  function render() {
    const { inCount, outCount, total } = countLens();
    const outPct = total > 0 ? Math.round((outCount / total) * 100) : 50;
    const scenario = SCENARIOS[currentIdx];

    container.innerHTML = `
      <div class="tool-header">
        <div class="tool-part">Part 1 · Awareness</div>
        <h1>Spot the Box</h1>
        <p class="tool-desc">
          Eight short scenarios. For each, choose the response that feels most
          like you — not the one that seems right. The tally updates as you go.
        </p>
      </div>

      <div class="lens-bar-wrap">
        <div class="lens-bar-labels">
          <span class="text-in-box">In-box lens</span>
          <span class="text-out-box">Out-of-box lens</span>
        </div>
        <div class="lens-bar" role="progressbar" aria-valuenow="${outPct}" aria-valuemin="0" aria-valuemax="100" aria-label="Lens balance">
          <div class="lens-bar-fill" style="width:${outPct}%"></div>
        </div>
        <div class="lens-count-row">
          <span class="count-in">${inCount} in-box</span>
          <span style="color:var(--text-3);font-size:12px">${total} / ${SCENARIOS.length} answered</span>
          <span class="count-out">${outCount} out-of-box</span>
        </div>
      </div>

      ${isComplete ? renderSummary(inCount, outCount) : renderScenario(scenario, answers, currentIdx)}

      <div class="tool-nav">
        <a href="#/part-1" class="btn btn-ghost">← Part 1</a>
        ${isComplete ? `<a href="#/part-1/heatmap" class="btn btn-primary">Next: Heatmap →</a>` : ''}
      </div>
    `;

    // Wire option buttons for current scenario
    if (!isComplete) {
      const answered = answers.find(a => a.scenarioId === scenario.id);
      container.querySelectorAll('.scenario-option[data-optid]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (answered) return; // don't re-answer
          const optId = btn.dataset.optid;
          const opt = scenario.options.find(o => o.id === optId);

          answers.push({ scenarioId: scenario.id, optionId: optId });
          store.setTool('spotTheBox', { answers: [...answers] });

          const done = answers.length >= SCENARIOS.length;
          store.setProgress('spotTheBox', done ? 'complete' : 'in_progress');

          // Show reveal inline before advancing
          btn.classList.add(`chosen-${opt.lens}`);
          const reveal = document.createElement('div');
          reveal.className = `option-reveal reveal-${opt.lens}`;
          reveal.innerHTML = `
            <span class="reveal-badge ${opt.lens === 'in' ? 'in' : 'out'}">
              ${opt.lens === 'in' ? 'In-box' : 'Out-of-box'}
            </span>
            ${opt.note}
          `;
          btn.parentNode.insertBefore(reveal, btn.nextSibling);

          // Advance after a short pause
          setTimeout(() => {
            if (done) {
              isComplete = true;
            } else {
              currentIdx = answers.length;
            }
            render();
          }, 1800);
        });
      });
    }
  }

  render();
}

function renderScenario(scenario, answers, idx) {
  const answered = answers.find(a => a.scenarioId === scenario.id);
  return `
    <div class="scenario-card">
      <p style="font-size:11px;color:var(--text-3);margin-bottom:8px;font-weight:600">
        ${idx + 1} of ${SCENARIOS.length}
      </p>
      <p class="scenario-text">${scenario.situation}</p>
      <div class="scenario-options" role="group" aria-label="Choose a response">
        ${scenario.options.map(opt => {
          let cls = 'scenario-option';
          if (answered && answered.optionId === opt.id) cls += ` chosen-${opt.lens}`;
          return `
            <button class="${cls}" data-optid="${opt.id}" ${answered ? 'aria-disabled="true"' : ''}>
              ${opt.text}
            </button>
            ${answered && answered.optionId === opt.id ? `
              <div class="option-reveal reveal-${opt.lens}">
                <span class="reveal-badge ${opt.lens === 'in' ? 'in' : 'out'}">
                  ${opt.lens === 'in' ? 'In-box' : 'Out-of-box'}
                </span>
                ${opt.note}
              </div>
            ` : ''}
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderSummary(inCount, outCount) {
  const total = inCount + outCount;
  const outPct = Math.round((outCount / total) * 100);
  let profile, note;

  if (outPct >= 75) {
    profile = 'Predominantly out-of-box lens';
    note = 'Your responses leaned toward curiosity, openness, and engaging with others as full people. Notice what that actually feels like in practice — and what makes it harder on some days than others.';
  } else if (outPct >= 50) {
    profile = 'Mixed lens, with an out-of-box tendency';
    note = 'Your responses were a mix. That\'s honest — most people\'s default lens shifts with context, stress, and the specific relationship. The scenarios where you chose in-box may be worth a closer look.';
  } else if (outPct >= 25) {
    profile = 'Mixed lens, with an in-box tendency';
    note = 'Your responses leaned in-box in several scenarios. That\'s not a verdict — it\'s information. Notice what those scenarios had in common. What was the pattern?';
  } else {
    profile = 'Predominantly in-box lens';
    note = 'Your responses leaned heavily toward in-box framings. That doesn\'t mean you\'re a bad person — it may mean the book is hitting on something real for you. Stay curious about what the scenarios had in common.';
  }

  return `
    <div class="card" style="animation:fadeSlideIn .4s ease-out">
      <div style="font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--text-3);margin-bottom:8px">Your lens profile</div>
      <div style="font-size:18px;font-weight:700;margin-bottom:12px">${profile}</div>
      <p style="font-size:14px;color:var(--text-2);line-height:1.7">${note}</p>
      <div style="margin-top:16px;display:flex;gap:16px;font-size:13px">
        <span class="text-in-box"><strong>${inCount}</strong> in-box</span>
        <span class="text-out-box"><strong>${outCount}</strong> out-of-box</span>
        <span style="color:var(--text-3)">out of ${total}</span>
      </div>
    </div>
  `;
}
