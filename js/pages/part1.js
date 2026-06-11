/**
 * pages/part1.js — Part 1 landing page
 */

import { store } from '../storage.js';
import { getPartTools } from '../progress.js';

const TOOL_META = {
  spotTheBox:  { icon: '◑', desc: 'Discover your default lens through a sequence of short scenarios.' },
  heatmap:     { icon: '⬛', desc: 'Map how you treat the people in your life on a live color heatmap.' },
  twoHearts:   { icon: '♡', desc: 'See how the same behavior lands completely differently depending on the state behind it.' },
};

export function renderPart1(container) {
  const tools = getPartTools(1);
  const prog = store.getAllProgress();
  const letter = store.getSealedLetter();

  container.innerHTML = `
    <div class="page-hero">
      <span class="part-badge">Part 1</span>
      <h1>Awareness</h1>
      <p>
        Before we can change something, we have to see it clearly.
        Part I introduces the central distinction — being in or out of the box —
        and gives you three ways to observe where you already stand.
      </p>
      <div class="read-prompt">Read Part I of the book before starting these exercises.</div>
    </div>

    ${!letter.writtenAt ? `
      <div class="card" style="border-color:var(--accent);background:var(--accent-dim);margin-bottom:24px">
        <div style="display:flex;align-items:center;gap:12px">
          <span style="font-size:24px">✉</span>
          <div style="flex:1">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px">Recommended first: Write your Sealed Letter</div>
            <div style="font-size:13px;color:var(--text-2)">Capture your current thinking before the exercises shape it. The letter seals until the end of Part III.</div>
          </div>
          <a href="#/sealed-letter" class="btn btn-primary btn-sm">Write it</a>
        </div>
      </div>
    ` : `
      <div class="card" style="margin-bottom:24px;display:flex;align-items:center;gap:12px">
        <span style="font-size:20px">🔒</span>
        <div>
          <div style="font-weight:600;font-size:14px">Sealed Letter written</div>
          <div style="font-size:13px;color:var(--text-3)">Sealed on ${new Date(letter.writtenAt).toLocaleDateString()}. Opens at the end of Part III.</div>
        </div>
      </div>
    `}

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

    <div class="tool-nav">
      <a href="#/" class="btn btn-ghost">← Home</a>
      <a href="#/part-2" class="btn btn-ghost">Part 2: The Mechanism →</a>
    </div>
  `;
}
