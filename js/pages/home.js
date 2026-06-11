/**
 * pages/home.js — Home / overview page
 */

import { store } from '../storage.js';
import { getOverallPercent, isPartComplete, isPartStarted, getPartTools } from '../progress.js';

export function renderHome(container) {
  const pct = getOverallPercent();
  const letter = store.getSealedLetter();
  const prog = store.getAllProgress();

  const partCards = [
    {
      num: 1,
      title: 'Awareness',
      subtitle: 'See the pattern in yourself',
      tools: 3,
      desc: 'Identify what the box is and where you already live in it.',
    },
    {
      num: 2,
      title: 'The Mechanism',
      subtitle: 'Understand how it works',
      tools: 4,
      desc: 'Trace how self-betrayal loops into conflict and self-justification.',
    },
    {
      num: 3,
      title: 'Getting Out',
      subtitle: 'Change what actually matters',
      tools: 4,
      desc: 'Practice the out-of-the-box moves that aren\'t just behavior patches.',
    },
  ];

  container.innerHTML = `
    <div class="home-hero">
      <h1>Leadership &amp;<br>Self-Deception</h1>
      <p class="subtitle">
        A companion for your own honest exploration—not a summary of the book,
        but a set of exercises that make its ideas concrete by working with your own words.
      </p>

      ${pct > 0 ? `
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:32px">
          <div id="home-progress-bar" style="width:200px;height:6px;background:var(--bg-surface3);border-radius:999px;overflow:hidden">
            <div style="width:${pct}%;height:100%;background:var(--accent);border-radius:999px;transition:width 0.6s ease-out"></div>
          </div>
          <span style="font-size:13px;color:var(--text-3)">${pct}% complete</span>
        </div>
      ` : ''}

      <div class="parts-path">
        ${!letter.writtenAt ? `
          <a href="#/sealed-letter" class="part-card" style="border-color:var(--accent);background:var(--accent-dim)">
            <div class="part-num" style="border-color:var(--accent);color:var(--accent)">✉</div>
            <div class="part-body">
              <div class="part-title">Start here — Write your Sealed Letter</div>
              <div class="part-subtitle">A letter to your future self, sealed until the end</div>
            </div>
            <span style="color:var(--accent);font-size:13px;flex-shrink:0">Begin →</span>
          </a>
        ` : `
          <div class="part-card" style="border-color:var(--border);cursor:default;opacity:0.7">
            <div class="part-num" style="border-color:var(--accent);color:var(--accent)">✉</div>
            <div class="part-body">
              <div class="part-title">Sealed Letter — written</div>
              <div class="part-subtitle">Sealed on ${new Date(letter.writtenAt).toLocaleDateString()}. Opens after Part III.</div>
            </div>
            <span style="color:var(--accent);font-size:18px">🔒</span>
          </div>
        `}

        ${partCards.map(p => {
          const done = isPartComplete(p.num);
          const started = isPartStarted(p.num);
          const tools = getPartTools(p.num);
          const doneCount = tools.filter(t => (prog[t.id] ?? 'not_started') === 'complete').length;
          return `
            <a href="#/part-${p.num}" class="part-card ${done ? 'done' : ''}">
              <div class="part-num">${p.num}</div>
              <div class="part-body">
                <div class="part-title">Part ${p.num}: ${p.title}</div>
                <div class="part-subtitle">${p.subtitle}</div>
                ${started ? `<div class="part-tools-count" style="margin-top:4px">${doneCount} / ${tools.length} tools complete</div>` : ''}
              </div>
              <span style="color:var(--text-3);font-size:18px">${done ? '✓' : '→'}</span>
            </a>
          `;
        }).join('')}
      </div>

      <div class="how-to-box">
        <h2>How to use this companion</h2>
        <ul>
          <li>Work through the parts in order — each builds on the last.</li>
          <li>Read the corresponding part of the book before doing its exercises.</li>
          <li>Keep honest. The box hides from clever answers.</li>
          <li>Expect some discomfort. That's the point of contact.</li>
          <li>Use the <strong>◎</strong> button any time to log a tell you notice.</li>
        </ul>
      </div>

      <p class="privacy-note">
        <span class="lock-icon">🔒</span>
        Everything you write stays in your browser. Nothing is sent anywhere.
        Use ⚙ to export, import, or reset your data.
      </p>
    </div>
  `;
}
