/**
 * pages/part3.js — Part 3 landing page
 */

import { store } from '../storage.js';
import { getPartTools, isPartComplete } from '../progress.js';

const TOOL_META = {
  whatHasntWorked: { icon: '⬡', desc: 'Sort your go-to fixes by whether they actually changed how you see the person.' },
  apologyBuilder:  { icon: '✎', desc: 'Draft an apology and watch live highlights reveal how much of it is still self-defense.' },
  honorSense:      { icon: '◉', desc: 'Build a daily habit of honoring the sense you have toward others, tracked as a calendar.' },
  leadershipRadar: { icon: '◈', desc: 'See your leadership profile across six dimensions as a live radar that bends as you rate.' },
};

export function renderPart3(container) {
  const tools = getPartTools(3);
  const prog = store.getAllProgress();
  const letter = store.getSealedLetter();
  const radarDone = (prog['leadershipRadar'] ?? 'not_started') === 'complete';
  const letterWritten = !!letter.writtenAt;
  const unsealable = radarDone && letterWritten && !letter.unsealedAt;
  const unsealed = !!letter.unsealedAt;

  container.innerHTML = `
    <div class="page-hero">
      <span class="part-badge">Part 3</span>
      <h1>Getting Out</h1>
      <p>
        Part III asks the real question: what would it actually mean to see this person
        differently? The four tools here move from diagnosing what hasn't worked to
        practicing what might.
      </p>
      <div class="read-prompt">Read Part III of the book before starting these exercises.</div>
    </div>

    <div class="tool-list" role="list">
      ${tools.map(tool => {
        const status = prog[tool.id] ?? 'not_started';
        const meta = TOOL_META[tool.id] ?? {};
        return `
          <a href="#${tool.route}" class="tool-list-item" role="listitem">
            <div class="tool-item-icon">${meta.icon ?? '○'}</div>
            <div class="tool-item-body">
              <div class="tool-item-title">${tool.title}</div>
              <div class="tool-item-desc">${meta.desc ?? ''}</div>
            </div>
            <div class="tool-item-status">
              <span class="completion-dot ${status}" title="${status.replace('_',' ')}"></span>
            </div>
          </a>
        `;
      }).join('')}
    </div>

    ${letterWritten ? `
      <div class="card" style="margin-top:24px;${unsealable ? 'border-color:var(--accent);background:var(--accent-dim)' : ''}">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <span style="font-size:24px">${unsealed ? '📬' : '🔒'}</span>
          <div style="flex:1;min-width:200px">
            ${unsealed ? `
              <div style="font-weight:700;font-size:14px;margin-bottom:4px">Sealed Letter — unsealed</div>
              <div style="font-size:13px;color:var(--text-2)">Your letter from the beginning is open. You've written your reply.</div>
            ` : unsealable ? `
              <div style="font-weight:700;font-size:14px;margin-bottom:4px;color:var(--accent)">Ready to unseal your letter</div>
              <div style="font-size:13px;color:var(--text-2)">You've completed the Leadership Radar — it's time to read what you wrote at the start.</div>
            ` : `
              <div style="font-weight:700;font-size:14px;margin-bottom:4px">Sealed Letter — waiting</div>
              <div style="font-size:13px;color:var(--text-2)">Complete the Leadership Radar to unlock the unseal screen.</div>
            `}
          </div>
          ${unsealable || unsealed ? `
            <a href="#/part-3/unseal" class="btn ${unsealable ? 'btn-primary' : 'btn-ghost'} btn-sm">
              ${unsealed ? 'Read again' : 'Unseal now →'}
            </a>
          ` : ''}
        </div>
      </div>
    ` : ''}

    <div class="tool-nav">
      <a href="#/part-2" class="btn btn-ghost">← Part 2</a>
      <a href="#/" class="btn btn-ghost">Home</a>
    </div>
  `;
}
