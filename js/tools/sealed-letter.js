/**
 * tools/sealed-letter.js — The bookend: write at Part I start, unseal at Part III end.
 *
 * Write mode: focused textarea with gentle prompts. On save, text is hidden
 * and shown only as a sealed envelope with a lock date.
 *
 * Unseal mode: called from /part-3/unseal. Reveals original text in a
 * quiet animation alongside a "reply to your past self" field.
 */

import { store } from '../storage.js';
import { showToast } from '../companion.js';

export function renderSealedLetter(container, options = {}) {
  const unsealMode = options?.unsealMode === true;
  const letter = store.getSealedLetter();

  if (unsealMode) {
    renderUnsealMode(container, letter);
  } else if (letter.writtenAt) {
    renderSealedView(container, letter);
  } else {
    renderWriteMode(container);
  }
}

// ── Write mode ──────────────────────────────────────────────────
function renderWriteMode(container) {
  container.innerHTML = `
    <div class="tool-header">
      <div class="tool-part">Bookend</div>
      <h1>Sealed Letter</h1>
      <p class="tool-desc">
        Before the exercises shape your thinking, write a letter to your future self
        about a relationship that's genuinely hard for you. Capture what you believe
        is true right now — why it's difficult, where you think the fault lies,
        what you've tried. The letter will be sealed and hidden until you finish
        Part III, when you'll read it again and reply.
      </p>
    </div>

    <div class="card" style="margin-bottom:20px">
      <p style="font-size:13px;color:var(--text-2);line-height:1.65">
        A few things to consider as you write:
        <br>• Who is hard to be around, and what story do you tell yourself about why?
        <br>• What have you tried? What hasn't worked?
        <br>• What do you think they need to change for things to improve?
      </p>
    </div>

    <div class="field">
      <label for="letter-textarea">Your letter <span style="color:var(--text-3);font-weight:400">(nothing is auto-sent — this stays in your browser)</span></label>
      <textarea
        id="letter-textarea"
        class="textarea large reading"
        placeholder="Dear future me,&#10;&#10;Right now I'm thinking about…"
        aria-describedby="letter-hint"
      ></textarea>
      <p id="letter-hint" class="field-hint">Write as much or as little as feels true. You won't be able to re-read this until the end of Part III.</p>
    </div>

    <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:8px">
      <a href="#/part-1" class="btn btn-ghost">← Back</a>
      <button id="seal-btn" class="btn btn-primary" disabled>Seal the letter 🔒</button>
    </div>
  `;

  const textarea = container.querySelector('#letter-textarea');
  const sealBtn = container.querySelector('#seal-btn');

  textarea.addEventListener('input', () => {
    sealBtn.disabled = textarea.value.trim().length < 20;
    store.setSealedLetter({ text: textarea.value }, true);
  });

  // Restore any in-progress draft
  const saved = store.getSealedLetter();
  if (saved.text) {
    textarea.value = saved.text;
    sealBtn.disabled = saved.text.trim().length < 20;
  }

  sealBtn.addEventListener('click', () => {
    const text = textarea.value.trim();
    if (text.length < 20) return;
    store.setSealedLetter({ text, writtenAt: new Date().toISOString() });
    store.setProgress('sealedLetter', 'in_progress');
    showToast('Letter sealed 🔒', 'success');
    renderSealedView(container, store.getSealedLetter());
  });
}

// ── Sealed view ─────────────────────────────────────────────────
function renderSealedView(container, letter) {
  const dateStr = new Date(letter.writtenAt).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  container.innerHTML = `
    <div class="tool-header">
      <div class="tool-part">Bookend</div>
      <h1>Sealed Letter</h1>
    </div>

    <div class="sealed-envelope">
      ${envelopeSVG()}
      <p class="sealed-date">Written and sealed on ${dateStr}</p>
      <p class="sealed-locked">
        This letter is sealed. It will open when you reach the end of Part III.
        Continue with the exercises — come back to it when you're ready.
      </p>
      <a href="#/part-1" class="btn btn-ghost" style="margin-top:8px">← Part 1</a>
    </div>
  `;
}

// ── Unseal mode ─────────────────────────────────────────────────
function renderUnsealMode(container, letter) {
  if (!letter.writtenAt) {
    container.innerHTML = `
      <div style="text-align:center;padding:80px 24px">
        <p style="color:var(--text-2)">No sealed letter found. Write one from Part I first.</p>
        <a href="#/part-1" class="btn btn-ghost" style="margin-top:16px">← Part 1</a>
      </div>`;
    return;
  }

  const prog = store.getAllProgress();
  const radarDone = prog['leadershipRadar'] === 'complete';
  if (!radarDone && !letter.unsealedAt) {
    container.innerHTML = `
      <div style="text-align:center;padding:80px 24px">
        <p style="color:var(--text-2);margin-bottom:16px">Complete the Leadership Radar to unlock your letter.</p>
        <a href="#/part-3/leadership-radar" class="btn btn-primary">Go to Leadership Radar →</a>
      </div>`;
    return;
  }

  // Mark as unsealed on first open
  if (!letter.unsealedAt) {
    store.setSealedLetter({ unsealedAt: new Date().toISOString() });
    store.setProgress('sealedLetter', 'complete');
  }

  const dateStr = new Date(letter.writtenAt).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  container.innerHTML = `
    <div class="tool-header">
      <div class="tool-part">Bookend — Unseal</div>
      <h1>Your Letter, Opened</h1>
      <p class="tool-desc">
        This is what you wrote before the exercises. Read it without editing.
        Then write a reply — to your past self, from where you stand now.
      </p>
    </div>

    <div class="card" style="margin-bottom:24px">
      <div style="font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--text-3);margin-bottom:12px">
        Written on ${dateStr}
      </div>
      <div class="original-letter unseal-reveal">${escapeHTML(letter.text)}</div>
    </div>

    <div class="field">
      <label for="reply-textarea">Your reply — from now</label>
      <textarea
        id="reply-textarea"
        class="textarea large reading"
        placeholder="Dear past me,&#10;&#10;What I notice reading this now is…"
        aria-describedby="reply-hint"
      >${escapeHTML(letter.reply || '')}</textarea>
      <p id="reply-hint" class="field-hint">Write as much or as little as you want. This saves automatically.</p>
    </div>

    <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:8px">
      <a href="#/part-3" class="btn btn-ghost">← Part 3</a>
      <button id="save-reply-btn" class="btn btn-primary">Save reply</button>
    </div>
  `;

  const replyTextarea = container.querySelector('#reply-textarea');
  const saveBtn = container.querySelector('#save-reply-btn');

  replyTextarea.addEventListener('input', () => {
    store.setSealedLetter({ reply: replyTextarea.value }, true);
    if (replyTextarea.value.trim().length > 0) {
      store.setProgress('sealedLetter', 'complete');
    }
  });

  saveBtn.addEventListener('click', () => {
    store.setSealedLetter({ reply: replyTextarea.value });
    store.setProgress('sealedLetter', 'complete');
    showToast('Reply saved', 'success');
  });
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function envelopeSVG() {
  return `
    <svg class="envelope-svg" width="120" height="90" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="4" y="14" width="112" height="72" rx="6" fill="var(--bg-surface2)" stroke="var(--border-hi)" stroke-width="1.5"/>
      <path d="M4 20 L60 56 L116 20" stroke="var(--accent)" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M4 86 L44 52M116 86 L76 52" stroke="var(--border-hi)" stroke-width="1" stroke-linecap="round"/>
      <!-- lock -->
      <rect x="50" y="30" width="20" height="16" rx="3" fill="var(--accent)" opacity="0.9"/>
      <path d="M53 30V26a7 7 0 0 1 14 0v4" stroke="var(--accent)" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="60" cy="37" r="2" fill="var(--bg-base)"/>
    </svg>
  `;
}
