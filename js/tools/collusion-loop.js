/**
 * tools/collusion-loop.js — Collusion Loop Animator
 *
 * Live mechanic: As the four fields are filled, an SVG circular
 * diagram wires up node by node. When complete, the loop "spins"
 * via a CSS animation, then settles with the reader's own node
 * highlighted as the single point of intervention.
 */

import { store } from '../storage.js';

export function renderCollusionLoop(container) {
  const saved = store.getTool('collusionLoop');
  const nodes = {
    myBox:        saved.nodes?.myBox        ?? '',
    myBehavior:   saved.nodes?.myBehavior   ?? '',
    theirBox:     saved.nodes?.theirBox     ?? '',
    theirBehavior: saved.nodes?.theirBehavior ?? '',
  };

  let highlightMyNode = saved.highlightMyNode ?? false;

  function isComplete() {
    return Object.values(nodes).every(v => v.trim().length > 3);
  }

  function save() {
    store.setTool('collusionLoop', { nodes: { ...nodes }, highlightMyNode });
    store.setProgress('collusionLoop',
      isComplete() ? 'complete' : Object.values(nodes).some(v => v.trim()) ? 'in_progress' : 'not_started'
    );
  }

  function render() {
    container.innerHTML = `
      <div class="tool-header">
        <div class="tool-part">Part 2 · The Mechanism</div>
        <h1>Collusion Loop Animator</h1>
        <p class="tool-desc">
          Two people in conflict aren't separate actors — they're a loop. Fill in
          the four positions: your internal state, your behavior, their internal state,
          their behavior. Then see how each triggers the next.
        </p>
      </div>

      <div class="loop-diagram" id="loop-diagram">
        ${loopSVG(nodes, highlightMyNode, isComplete())}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:24px 0">
        ${fieldGroup('myBox',        'My box (how I see them)',   'e.g. "They\'re obstructive and don\'t care about the work"', nodes.myBox, '#3FB6A8')}
        ${fieldGroup('theirBehavior','Their behavior',            'e.g. "They become defensive and withhold information"', nodes.theirBehavior, '#C2575A')}
        ${fieldGroup('myBehavior',   'My behavior',               'e.g. "I stop consulting them and go around them"', nodes.myBehavior, '#3FB6A8')}
        ${fieldGroup('theirBox',     'Their box (how they see me)', 'e.g. "They see me as arrogant and dismissive"', nodes.theirBox, '#C2575A')}
      </div>

      ${isComplete() ? `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap">
          <button id="highlight-btn" class="btn ${highlightMyNode ? 'btn-primary' : 'btn-ghost'}">
            ${highlightMyNode ? '✓ Showing my intervention point' : 'Where could I break this loop?'}
          </button>
          <p style="font-size:13px;color:var(--text-2);flex:1;min-width:200px">
            You control exactly one node: your own box. That's where the loop can be broken.
          </p>
        </div>

        <div class="card" style="border-color:var(--border);background:var(--bg-surface);animation:fadeSlideIn .4s ease-out">
          <p style="font-size:14px;color:var(--text-2);line-height:1.7">
            Notice that each node in the loop seems to justify the next — their behavior looks like evidence that your view
            is correct, and vice versa. The loop isn't something happening to you. You're helping power it.
            The only node you can actually move is yours.
          </p>
        </div>
      ` : ''}

      <div class="tool-nav">
        <a href="#/part-2/inflation-meters" class="btn btn-ghost">← Inflation Meters</a>
        <a href="#/part-2/need-fail" class="btn ${isComplete() ? 'btn-primary' : 'btn-ghost'}">Next: Do I Need Them to Fail? →</a>
      </div>
    `;

    // Wire text inputs
    container.querySelectorAll('.loop-field').forEach(ta => {
      ta.addEventListener('input', () => {
        nodes[ta.dataset.key] = ta.value;
        save();
        const diag = container.querySelector('#loop-diagram');
        if (diag) diag.innerHTML = loopSVG(nodes, highlightMyNode, isComplete());
      });
    });

    // Wire highlight button
    container.querySelector('#highlight-btn')?.addEventListener('click', () => {
      highlightMyNode = !highlightMyNode;
      save();
      render();
    });
  }

  render();
}

function fieldGroup(key, label, placeholder, value, color) {
  return `
    <div class="field" style="margin-bottom:0">
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-2);font-weight:600;margin-bottom:6px">
        <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block;flex-shrink:0"></span>
        ${label}
      </label>
      <textarea class="textarea loop-field" data-key="${key}" placeholder="${placeholder}" style="min-height:70px" aria-label="${label}">${escapeHTML(value)}</textarea>
    </div>
  `;
}

function loopSVG(nodes, highlight, complete) {
  const W = 340, H = 280;
  const cx = W / 2, cy = H / 2;
  const r = 100;
  // Node positions: top (myBox), right (myBehavior), bottom (theirBox), left (theirBehavior)
  const positions = [
    { key: 'myBox',         angle: -90,  label: 'My box',          mine: true  },
    { key: 'myBehavior',    angle:   0,  label: 'My behavior',     mine: true  },
    { key: 'theirBox',      angle:  90,  label: 'Their box',       mine: false },
    { key: 'theirBehavior', angle: 180,  label: 'Their behavior',  mine: false },
  ];

  function toXY(angle) {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const nodeR = 36;

  // Draw curved arrows between nodes
  const arrows = positions.map((pos, i) => {
    const next = positions[(i + 1) % positions.length];
    const from = toXY(pos.angle);
    const to   = toXY(next.angle);
    const hasContent = nodes[pos.key]?.trim().length > 3;
    const color = hasContent ? (pos.mine ? 'var(--accent)' : 'var(--in-box)') : 'var(--border)';

    // Midpoint offset for a curve passing near center
    const midX = cx + (cx - (from.x + to.x) / 2) * 0.15;
    const midY = cy + (cy - (from.y + to.y) / 2) * 0.15;

    // Arrow head direction
    const dx = to.x - midX, dy = to.y - midY;
    const len = Math.sqrt(dx*dx + dy*dy);
    const ux = dx/len, uy = dy/len;
    const ax = to.x - ux*nodeR, ay = to.y - uy*nodeR;
    const arrowLen = 8;
    const p1x = ax - uy*4 - ux*arrowLen;
    const p1y = ay + ux*4 - uy*arrowLen;
    const p2x = ax + uy*4 - ux*arrowLen;
    const p2y = ay - ux*4 - uy*arrowLen;

    return `
      <path d="M ${from.x} ${from.y} Q ${midX} ${midY} ${ax} ${ay}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"
        ${complete && hasContent ? `stroke-dasharray="none"` : `stroke-dasharray="5 3"`}/>
      ${hasContent ? `<polygon points="${ax},${ay} ${p1x},${p1y} ${p2x},${p2y}" fill="${color}"/>` : ''}
    `;
  });

  // Draw nodes
  const nodeEls = positions.map(pos => {
    const { x, y } = toXY(pos.angle);
    const val = nodes[pos.key] ?? '';
    const hasContent = val.trim().length > 3;
    const isHighlight = highlight && pos.mine;
    const stroke = isHighlight ? 'var(--accent)' : hasContent ? (pos.mine ? 'var(--accent)' : 'var(--in-box)') : 'var(--border)';
    const fill   = isHighlight ? 'var(--accent-dim)' : hasContent ? (pos.mine ? 'rgba(63,182,168,0.1)' : 'rgba(194,87,90,0.1)') : 'var(--bg-surface2)';
    const textColor = pos.mine ? 'var(--accent)' : 'var(--in-box)';

    // Truncate label for display
    const displayVal = val.length > 22 ? val.slice(0, 20) + '…' : val;

    return `
      <circle cx="${x}" cy="${y}" r="${nodeR}" fill="${fill}" stroke="${stroke}" stroke-width="${isHighlight ? 2.5 : 1.5}"/>
      ${isHighlight ? `<circle cx="${x}" cy="${y}" r="${nodeR + 5}" fill="none" stroke="var(--accent)" stroke-width="1" stroke-dasharray="3 3" opacity="0.6"/>` : ''}
      <text x="${x}" y="${y - 6}" text-anchor="middle" font-size="8" fill="var(--text-3)" font-family="var(--font-ui)" font-weight="700">${pos.label}</text>
      <text x="${x}" y="${y + 7}" text-anchor="middle" font-size="8" fill="${hasContent ? textColor : 'var(--text-3)'}" font-family="var(--font-ui)">
        ${hasContent ? displayVal : '—'}
      </text>
      ${isHighlight ? `<text x="${x}" y="${y + 22}" text-anchor="middle" font-size="9" fill="var(--accent)" font-family="var(--font-ui)" font-weight="700">↗ Your move</text>` : ''}
    `;
  });

  return `
    <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" aria-hidden="true"
      class="${complete ? 'loop-complete' : ''}">
      ${arrows.join('')}
      ${nodeEls.join('')}
      ${!complete ? `<text x="${cx}" y="${cy+4}" text-anchor="middle" font-size="10" fill="var(--text-3)" font-family="var(--font-ui)">Fill all four</text>` : ''}
    </svg>
  `;
}

function escapeHTML(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
