/**
 * tools/sequence-builder.js — Self-Betrayal Sequence Builder
 *
 * Live mechanic: As steps are filled, an inline SVG flow diagram
 * lights up node by node and then animates the connecting path,
 * making the sequence the reader just described visible as a machine.
 */

import { store } from '../storage.js';

const STEPS = [
  {
    key: 'sense',
    label: 'The sense I had',
    number: '1',
    prompt: 'What did you sense you should do for this person — or how you should treat them?',
    placeholder: 'e.g. "I should have checked in after what they shared with me"',
  },
  {
    key: 'act',
    label: 'What I actually did',
    number: '2',
    prompt: 'What did you do instead — the act that went against that sense?',
    placeholder: 'e.g. "I said I was busy and didn\'t follow up"',
  },
  {
    key: 'view',
    label: 'How I started to see them — and myself',
    number: '3',
    prompt: 'After the act, how did your view of them shift? How did you come to see yourself to justify it?',
    placeholder: 'e.g. "They\'re too sensitive. I\'m just being realistic about what\'s possible right now."',
  },
  {
    key: 'inflate',
    label: 'What I began to inflate and blame',
    number: '4',
    prompt: 'What did you inflate about their faults or your virtues to make the story stick?',
    placeholder: 'e.g. "They never appreciate what I do. I\'m the one holding everything together."',
  },
];

export function renderSequenceBuilder(container) {
  const saved = store.getTool('sequenceBuilder');
  const fields = { ...(saved.fields ?? {}) };

  function filledCount() {
    return STEPS.filter(s => (fields[s.key] ?? '').trim().length > 10).length;
  }

  function save() {
    const n = filledCount();
    store.setTool('sequenceBuilder', { fields: { ...fields } });
    store.setProgress('sequenceBuilder',
      n === 0 ? 'not_started' : n >= 4 ? 'complete' : 'in_progress'
    );
  }

  function render() {
    const n = filledCount();

    container.innerHTML = `
      <div class="tool-header">
        <div class="tool-part">Part 2 · The Mechanism</div>
        <h1>Self-Betrayal Sequence Builder</h1>
        <p class="tool-desc">
          Think of a real moment — one where you had a sense of what you should do for someone,
          and then didn't do it. Walk it through the four steps below. The diagram fills as you go.
        </p>
      </div>

      ${diagramSVG(fields)}

      <div class="sequence-steps" id="steps-container">
        ${STEPS.map((step, i) => {
          const value = fields[step.key] ?? '';
          const filled = value.trim().length > 10;
          return `
            <div class="step-node ${filled ? 'filled' : ''}" data-step="${step.key}">
              <div class="step-node-marker" aria-hidden="true">${step.number}</div>
              <div class="step-node-body">
                <div class="step-label">${step.label}</div>
                <p style="font-size:13px;color:var(--text-3);margin-bottom:8px;line-height:1.5">${step.prompt}</p>
                <textarea
                  class="textarea step-textarea"
                  data-key="${step.key}"
                  placeholder="${step.placeholder}"
                  aria-label="${step.label}"
                  style="min-height:80px"
                >${escapeHTML(value)}</textarea>
              </div>
            </div>
            ${i < STEPS.length - 1 ? `<div class="step-connector ${filled ? 'lit' : ''}"></div>` : ''}
          `;
        }).join('')}
      </div>

      ${n === 4 ? `
        <div class="card" style="margin-top:24px;border-color:var(--accent);background:var(--accent-dim);animation:fadeSlideIn .4s ease-out">
          <strong style="color:var(--accent)">Sequence complete.</strong>
          <p style="color:var(--text-2);font-size:13px;margin-top:8px;line-height:1.65">
            Look at the four steps together. That is the machine. It ran without your permission
            — and it built the story you've been living in since.
          </p>
        </div>
      ` : `
        <p style="color:var(--text-3);font-size:13px;margin-top:16px;text-align:center">
          ${n} / 4 steps filled
        </p>
      `}

      <div class="tool-nav">
        <a href="#/part-2" class="btn btn-ghost">← Part 2</a>
        <a href="#/part-2/inflation-meters" class="btn ${n >= 4 ? 'btn-primary' : 'btn-ghost'}">Next: Inflation Meters →</a>
      </div>
    `;

    // Wire textareas
    container.querySelectorAll('.step-textarea').forEach(ta => {
      ta.addEventListener('input', () => {
        fields[ta.dataset.key] = ta.value;
        save();
        updateDiagram();
        updateStepUI();
      });
    });
  }

  function updateStepUI() {
    STEPS.forEach((step, i) => {
      const node = container.querySelector(`.step-node[data-step="${step.key}"]`);
      if (!node) return;
      const filled = (fields[step.key] ?? '').trim().length > 10;
      node.classList.toggle('filled', filled);
      // Update connector
      const connectors = container.querySelectorAll('.step-connector');
      if (connectors[i]) connectors[i].classList.toggle('lit', filled);
    });
  }

  function updateDiagram() {
    const svg = container.querySelector('#seq-diagram');
    if (!svg) return;
    svg.outerHTML = diagramSVGinner(fields);
  }

  render();
}

function diagramSVG(fields) {
  return `<div class="sequence-diagram" id="seq-diagram-wrap" style="padding:16px">
    ${diagramSVGinner(fields)}
  </div>`;
}

function diagramSVGinner(fields) {
  const nodes = STEPS.map(s => ({
    label: s.label,
    filled: (fields[s.key] ?? '').trim().length > 10,
    text: fields[s.key] ?? '',
  }));
  const W = 640, H = 80;
  const nodeW = 120, nodeH = 44;
  const gap = (W - 4 * nodeW) / 5;
  const cy = H / 2;

  const rects = nodes.map((n, i) => {
    const x = gap + i * (nodeW + gap);
    const fill = n.filled ? 'var(--accent-dim)' : 'var(--bg-surface2)';
    const stroke = n.filled ? 'var(--accent)' : 'var(--border)';
    const textColor = n.filled ? 'var(--accent)' : 'var(--text-3)';
    return `
      <rect x="${x}" y="${cy - nodeH/2}" width="${nodeW}" height="${nodeH}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
      <text x="${x + nodeW/2}" y="${cy}" text-anchor="middle" dominant-baseline="middle" fill="${textColor}" font-size="10" font-family="var(--font-ui)" font-weight="600">
        <tspan x="${x + nodeW/2}" dy="-6">${i + 1}</tspan>
        <tspan x="${x + nodeW/2}" dy="12" font-weight="400" font-size="9">${wrapLabel(STEPS[i].label)}</tspan>
      </text>
    `;
  });

  const arrows = nodes.slice(0, -1).map((n, i) => {
    const x1 = gap + i * (nodeW + gap) + nodeW;
    const x2 = gap + (i + 1) * (nodeW + gap);
    const mid = (x1 + x2) / 2;
    const color = n.filled && nodes[i+1].filled ? 'var(--accent)' : 'var(--border)';
    const animated = n.filled && nodes[i+1].filled;
    return `
      <path d="M ${x1} ${cy} L ${x2} ${cy}" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round"
        ${animated ? 'stroke-dasharray="6 3"' : ''}/>
      <polygon points="${x2},${cy} ${x2-7},${cy-4} ${x2-7},${cy+4}" fill="${color}"/>
    `;
  });

  return `<svg id="seq-diagram" viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block" aria-hidden="true">
    ${arrows.join('')}
    ${rects.join('')}
  </svg>`;
}

function wrapLabel(label) {
  // Truncate to ~16 chars for display in SVG node
  return label.length > 18 ? label.slice(0, 16) + '…' : label;
}

function escapeHTML(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
