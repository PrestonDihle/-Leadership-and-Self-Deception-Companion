/**
 * pages/part2.js — Part 2 landing page
 */

import { store } from '../storage.js';
import { getPartTools } from '../progress.js';

const TOOL_META = {
  sequenceBuilder: { icon: '⬡', desc: 'Walk a real incident through the four-step self-betrayal sequence and watch the diagram fill.' },
  inflationMeters: { icon: '⬆', desc: 'Measure how much the box inflates their faults and your virtue—then reality-check both.' },
  collusionLoop:   { icon: '↻', desc: 'Map a two-person conflict as a loop you\'re helping power, and find your intervention point.' },
  needFail:        { icon: '?', desc: 'Explore whether some part of you needs the other person to keep failing.' },
};

export function renderPart2(container) {
  const tools = getPartTools(2);
  const prog = store.getAllProgress();

  container.innerHTML = `
    <div class="page-hero">
      <span class="part-badge">Part 2</span>
      <h1>The Mechanism</h1>
      <p>
        Part II shows how the box self-seals: we betray a small sense, then
        reconstruct the world to justify the betrayal. The four tools in this section
        let you watch that machine run on your own real material.
      </p>
      <div class="read-prompt">Read Part II of the book before starting these exercises.</div>
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

    <div class="tool-nav">
      <a href="#/part-1" class="btn btn-ghost">← Part 1</a>
      <a href="#/part-3" class="btn btn-ghost">Part 3: Getting Out →</a>
    </div>
  `;
}
