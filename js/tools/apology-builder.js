/**
 * tools/apology-builder.js — Clean Apology Builder
 *
 * Live mechanic: As the reader types, flagged constructions are
 * highlighted inline in real time. A "clean / not yet" indicator
 * updates on every keystroke. The reader decides when it's ready.
 */

import { store } from '../storage.js';

// Each pattern: regex, the matched text to flag, and a tip
const FLAG_PATTERNS = [
  {
    regex: /\b(but)\b/gi,
    key: 'but',
    tip: '"But" often cancels what came before it. Try ending the sentence before it, or dropping it entirely.',
  },
  {
    regex: /\b(because you|because they)\b/gi,
    key: 'because-you',
    tip: 'Tracing cause back to them shifts accountability. Try "I" instead.',
  },
  {
    regex: /\b(you made me|you make me|they made me)\b/gi,
    key: 'made-me',
    tip: 'This locates responsibility entirely with them. Own the response as yours.',
  },
  {
    regex: /\b(if you hadn\'t|if you didn\'t|if you wouldn\'t|if they hadn\'t|if they didn\'t)\b/gi,
    key: 'if-you',
    tip: 'Conditional apologies ("if you hadn\'t…") are really arguments. Drop the condition.',
  },
  {
    regex: /\b(you should have|you shouldn\'t have|they should have)\b/gi,
    key: 'should-have',
    tip: 'Pointing at what they should have done is the apology looking outward again.',
  },
  {
    regex: /\b(I was just|I only|I merely)\b/gi,
    key: 'i-was-just',
    tip: 'Minimizers ("I was just…") reduce the weight of the impact. Leave them out.',
  },
  {
    regex: /\b(to be fair|in fairness|technically|actually)\b/gi,
    key: 'to-be-fair',
    tip: 'These pivot toward your defense or the factual record. An apology is about impact, not accuracy.',
  },
  {
    regex: /\b(I\'m sorry you feel|I\'m sorry you think|I\'m sorry that you)\b/gi,
    key: 'sorry-you-feel',
    tip: '"Sorry you feel that way" isn\'t an apology — it apologizes for their reaction, not your action.',
  },
];

export function renderApologyBuilder(container) {
  const saved = store.getTool('apologyBuilder');
  const draft = saved.draft ?? '';
  const isFinal = saved.isFinal ?? false;

  function computeFlags(text) {
    const flags = [];
    const seen = new Set();
    for (const pattern of FLAG_PATTERNS) {
      const matches = [...text.matchAll(new RegExp(pattern.regex))];
      for (const m of matches) {
        const key = pattern.key + '_' + m.index;
        if (!seen.has(key)) {
          seen.add(key);
          flags.push({ key: pattern.key, index: m.index, length: m[0].length, tip: pattern.tip, word: m[0] });
        }
      }
    }
    return flags;
  }

  function isClean(flags) { return flags.length === 0; }

  function buildHighlightHTML(text, flags) {
    if (!flags.length) return escapeHTML(text);
    // Sort by index
    const sorted = [...flags].sort((a, b) => a.index - b.index);
    let result = '';
    let cursor = 0;
    for (const f of sorted) {
      result += escapeHTML(text.slice(cursor, f.index));
      result += `<mark class="flag-word" title="${escapeHTML(f.tip)}">${escapeHTML(text.slice(f.index, f.index + f.length))}</mark>`;
      cursor = f.index + f.length;
    }
    result += escapeHTML(text.slice(cursor));
    return result;
  }

  function render() {
    const flags = computeFlags(draft);
    const clean = isClean(flags);
    // Unique flag types
    const uniqueTips = [...new Map(flags.map(f => [f.key, f])).values()];

    container.innerHTML = `
      <div class="tool-header">
        <div class="tool-part">Part 3 · Getting Out</div>
        <h1>Clean Apology Builder</h1>
        <p class="tool-desc">
          Draft an apology for a real situation. As you type, the tool highlights
          constructions that tend to keep apologies inside the box — subtle defenses,
          blame transfers, and minimizers. Watch them appear and decide what to cut.
        </p>
      </div>

      <div class="clean-indicator ${clean && draft.trim().length > 10 ? 'clean' : 'not-yet'}">
        <div class="clean-dot"></div>
        ${clean && draft.trim().length > 10 ? 'Looking clean — no flagged constructions' : `${flags.length} flagged construction${flags.length !== 1 ? 's' : ''} — still in progress`}
      </div>

      <div class="apology-area" style="position:relative;margin-bottom:16px">
        <div class="apology-highlight-layer" id="highlight-layer" aria-hidden="true">${buildHighlightHTML(draft, flags)}</div>
        <textarea
          id="apology-draft"
          class="textarea large apology-textarea"
          placeholder="Start with: I want to apologize for…&#10;&#10;Write it as you actually mean it, then watch what gets flagged."
          aria-label="Your apology draft"
          spellcheck="true"
        >${escapeHTML(draft)}</textarea>
      </div>

      ${uniqueTips.length > 0 ? `
        <div class="apology-flags" role="list" aria-label="Flagged constructions">
          ${uniqueTips.map(f => `
            <div class="flag-item" role="listitem">
              <span class="flag-word-label">"${escapeHTML(f.word)}"</span>
              <span class="flag-tip">${f.tip}</span>
            </div>
          `).join('')}
        </div>
      ` : draft.trim().length > 20 ? `
        <div class="card" style="border-color:var(--accent);background:var(--out-box-dim);margin-bottom:16px;animation:fadeSlideIn .4s ease-out">
          <p style="color:var(--accent);font-size:14px">No flagged constructions — this reads as clean.</p>
          <p style="color:var(--text-2);font-size:13px;margin-top:6px">That doesn't mean it's the right thing to say or that the timing is right — only you can judge that. But the box isn't showing up here.</p>
        </div>
      ` : ''}

      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:16px">
        <button id="mark-final-btn" class="btn ${isFinal ? 'btn-primary' : 'btn-ghost'}">
          ${isFinal ? '✓ Marked as final' : 'Mark this version as final'}
        </button>
        ${isFinal ? `<span style="font-size:13px;color:var(--accent)">Saved on ${new Date(saved.finalizedAt ?? Date.now()).toLocaleDateString()}</span>` : `<span style="font-size:13px;color:var(--text-3)">Mark it final when you're satisfied — this logs completion.</span>`}
      </div>

      <div class="tool-nav">
        <a href="#/part-3/what-hasnt-worked" class="btn btn-ghost">← What Hasn't Worked</a>
        <a href="#/part-3/honor-sense" class="btn ${isFinal ? 'btn-primary' : 'btn-ghost'}">Next: Honor-the-Sense Tracker →</a>
      </div>
    `;

    const textarea = container.querySelector('#apology-draft');
    const highlightLayer = container.querySelector('#highlight-layer');

    // Sync scroll between textarea and highlight overlay
    textarea.addEventListener('scroll', () => {
      highlightLayer.scrollTop = textarea.scrollTop;
    });

    textarea.addEventListener('input', () => {
      const text = textarea.value;
      const newFlags = computeFlags(text);
      highlightLayer.innerHTML = buildHighlightHTML(text, newFlags);
      store.setTool('apologyBuilder', { draft: text, isFinal: false }, true);

      // Update clean indicator
      const indicator = container.querySelector('.clean-indicator');
      if (indicator) {
        const clean = isClean(newFlags);
        indicator.className = `clean-indicator ${clean && text.trim().length > 10 ? 'clean' : 'not-yet'}`;
        indicator.innerHTML = `<div class="clean-dot"></div>${clean && text.trim().length > 10 ? 'Looking clean — no flagged constructions' : `${newFlags.length} flagged construction${newFlags.length !== 1 ? 's' : ''} — still in progress`}`;
      }

      // Update flag list
      const flagList = container.querySelector('.apology-flags');
      const uniqueTips = [...new Map(newFlags.map(f => [f.key, f])).values()];
      if (uniqueTips.length > 0) {
        const html = `<div class="apology-flags" role="list" aria-label="Flagged constructions">${
          uniqueTips.map(f => `<div class="flag-item" role="listitem"><span class="flag-word-label">"${escapeHTML(f.word)}"</span><span class="flag-tip">${f.tip}</span></div>`).join('')
        }</div>`;
        if (flagList) flagList.outerHTML = html;
      }
    });

    container.querySelector('#mark-final-btn').addEventListener('click', () => {
      const currentDraft = textarea.value;
      store.setTool('apologyBuilder', { draft: currentDraft, isFinal: true, finalizedAt: new Date().toISOString() });
      store.setProgress('apologyBuilder', 'complete');
      render();
    });
  }

  render();
}

function escapeHTML(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
