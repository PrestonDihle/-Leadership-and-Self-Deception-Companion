/**
 * tools/what-hasnt-worked.js — Sort strategies into two bins.
 *
 * Live mechanic: As the reader drags cards to bins, the lopsided
 * pile in "did not change how I see them" builds on its own.
 * A closing interpretation updates as sorting happens.
 * Keyboard alternative: focus card → Enter to select → Tab to bin → Enter to place.
 */

import { store } from '../storage.js';

const DEFAULT_CARDS = [
  { id: 'c1', text: 'Tried to change their behavior directly' },
  { id: 'c2', text: 'Communicated more clearly or more often' },
  { id: 'c3', text: 'Set firmer boundaries' },
  { id: 'c4', text: 'Learned a new technique (communication model, framework)' },
  { id: 'c5', text: 'Coped with them — managed my reactions' },
  { id: 'c6', text: 'Reduced contact or stepped back' },
  { id: 'c7', text: 'Vented to someone else about them' },
  { id: 'c8', text: 'Changed my own outward behavior toward them' },
];

export function renderWhatHasntWorked(container) {
  const saved = store.getTool('whatHasntWorked');
  const assignments = { ...(saved.assignments ?? {}) };
  const customCards = [...(saved.customCards ?? [])];

  const allCards = [...DEFAULT_CARDS, ...customCards];
  let selectedCard = null; // keyboard mode
  let activeKeyHandler = null; // only one keyboard listener at a time

  function save() {
    store.setTool('whatHasntWorked', { assignments: { ...assignments }, customCards: [...customCards] });
    const allSorted = allCards.every(c => assignments[c.id]);
    store.setProgress('whatHasntWorked',
      allSorted ? 'complete' : Object.keys(assignments).length > 0 ? 'in_progress' : 'not_started'
    );
  }

  function getBinCards(binId) {
    return allCards.filter(c => assignments[c.id] === binId);
  }

  function getUnsorted() {
    return allCards.filter(c => !assignments[c.id]);
  }

  function interpretation() {
    const noCount = getBinCards('no').length;
    const yesCount = getBinCards('yes').length;
    const total = noCount + yesCount;
    if (total === 0) return '';
    const noPct = Math.round((noCount / total) * 100);
    if (noPct >= 75) {
      return `Most of your attempts sat in the "did not change how I see them" bin. That\'s the pattern — the book argues that approaches which don\'t change your view of the person are unlikely to fix the relationship, no matter how skillfully they\'re applied.`;
    } else if (noPct >= 50) {
      return `More strategies ended up in the "did not change how I see them" bin than the other. The ones that actually shifted your view are worth looking at closely — what made those different?`;
    } else if (yesCount > 0) {
      return `Several strategies did shift how you see the person. What was different about those — what moved, and what was driving the move?`;
    }
    return '';
  }

  function render() {
    const unsorted = getUnsorted();
    const yesCards = getBinCards('yes');
    const noCards  = getBinCards('no');

    container.innerHTML = `
      <div class="tool-header">
        <div class="tool-part">Part 3 · Getting Out</div>
        <h1>What Hasn't Worked</h1>
        <p class="tool-desc">
          Think of a difficult relationship. Sort these strategies into two bins:
          the ones that actually changed how you see the person — and the ones
          that didn't, even if they changed your behavior.
        </p>
      </div>

      <div id="keyboard-hint" style="font-size:12px;color:var(--text-3);margin-bottom:12px" aria-live="polite">
        ${selectedCard ? `"${escapeHTML(selectedCard.text)}" selected — press <kbd>1</kbd> for "changed how I see them" or <kbd>2</kbd> for "did not"` : 'Drag cards to the bins below, or press Enter on a card to select it, then 1 or 2 to place it.'}
      </div>

      <div class="sort-pool" id="sort-pool" role="list" aria-label="Unsorted strategies">
        ${unsorted.map(c => `
          <div class="sort-card" draggable="true" tabindex="0"
            data-id="${c.id}" role="listitem"
            aria-label="${escapeHTML(c.text)} — press Enter to select"
            ${selectedCard?.id === c.id ? 'style="border-color:var(--accent);background:var(--accent-dim)"' : ''}>
            <span class="drag-handle" aria-hidden="true">⠿</span>
            ${escapeHTML(c.text)}
          </div>
        `).join('')}
        ${unsorted.length === 0 ? '<span style="font-size:13px;color:var(--accent)">All sorted ✓</span>' : ''}
      </div>

      <div style="display:flex;gap:8px;margin-bottom:16px">
        <input type="text" id="custom-card-input" class="input" style="flex:1" maxlength="80" placeholder="Add your own strategy…">
        <button id="add-custom-btn" class="btn btn-ghost btn-sm">+ Add</button>
      </div>

      <div class="sort-bins">
        <div class="sort-bin bin-yes" id="bin-yes" data-bin="yes" role="region" aria-label="Changed how I see them">
          <div>
            <h3>Changed how I see them</h3>
            <span class="bin-count">${yesCards.length}</span>
          </div>
          <div class="bin-cards" id="bin-cards-yes">
            ${yesCards.map(c => binCardHTML(c, 'yes')).join('')}
          </div>
        </div>
        <div class="sort-bin bin-no" id="bin-no" data-bin="no" role="region" aria-label="Did not change how I see them">
          <div>
            <h3>Did not change how I see them</h3>
            <span class="bin-count">${noCards.length}</span>
          </div>
          <div class="bin-cards" id="bin-cards-no">
            ${noCards.map(c => binCardHTML(c, 'no')).join('')}
          </div>
        </div>
      </div>

      ${interpretation() ? `
        <div class="sort-interpretation" style="animation:fadeSlideIn .4s ease-out">
          ${interpretation()}
        </div>
      ` : ''}

      <div class="tool-nav">
        <a href="#/part-3" class="btn btn-ghost">← Part 3</a>
        <a href="#/part-3/apology-builder" class="btn ${unsorted.length === 0 ? 'btn-primary' : 'btn-ghost'}">Next: Apology Builder →</a>
      </div>
    `;

    // ── Drag and Drop ──────────────────────────────────────────
    container.querySelectorAll('.sort-card').forEach(card => {
      card.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', card.dataset.id);
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));

      // Keyboard: Enter to select
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectedCard = allCards.find(c => c.id === card.dataset.id) ?? null;
          render();
        }
      });
    });

    container.querySelectorAll('.sort-bin').forEach(bin => {
      bin.addEventListener('dragover', e => { e.preventDefault(); bin.classList.add('drag-over'); });
      bin.addEventListener('dragleave', () => bin.classList.remove('drag-over'));
      bin.addEventListener('drop', e => {
        e.preventDefault();
        bin.classList.remove('drag-over');
        const id = e.dataTransfer.getData('text/plain');
        assignments[id] = bin.dataset.bin;
        selectedCard = null;
        save();
        render();
      });
    });

    // Keyboard shortcut: 1 / 2 when card is selected (remove old handler first)
    if (activeKeyHandler) document.removeEventListener('keydown', activeKeyHandler);
    activeKeyHandler = e => {
      if (!selectedCard) return;
      if (e.key === '1') { assignments[selectedCard.id] = 'yes'; selectedCard = null; save(); render(); }
      if (e.key === '2') { assignments[selectedCard.id] = 'no';  selectedCard = null; save(); render(); }
      if (e.key === 'Escape') { selectedCard = null; render(); }
    };
    document.addEventListener('keydown', activeKeyHandler);

    // Remove bin card → back to pool
    container.querySelectorAll('.bin-card-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        delete assignments[btn.dataset.id];
        save();
        render();
      });
    });

    // Custom card
    container.querySelector('#add-custom-btn').addEventListener('click', () => {
      const input = container.querySelector('#custom-card-input');
      const text = input.value.trim();
      if (!text) { input.focus(); return; }
      const id = 'custom_' + Date.now();
      customCards.push({ id, text });
      input.value = '';
      save();
      render();
    });
    container.querySelector('#custom-card-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') container.querySelector('#add-custom-btn').click();
    });

    return () => {
      if (activeKeyHandler) document.removeEventListener('keydown', activeKeyHandler);
      activeKeyHandler = null;
    };
  }

  return render();
}

function binCardHTML(card, binId) {
  return `
    <div class="bin-card ${binId === 'yes' ? 'placed-yes' : 'placed-no'}">
      <span>${escapeHTML(card.text)}</span>
      <button class="bin-card-remove" data-id="${card.id}" aria-label="Return to pool">↩</button>
    </div>
  `;
}

function escapeHTML(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
