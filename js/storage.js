/**
 * storage.js — Single-store persistence for LSD Companion
 *
 * All reader data lives in one versioned localStorage key.
 * Nothing is ever sent to a server; the store is entirely local.
 */

const STORAGE_KEY = 'lsd_companion_v1';

const DEFAULT_STATE = {
  version: 1,
  createdAt: null,
  updatedAt: null,
  progress: {},
  sealedLetter: {
    writtenAt: null,
    text: '',
    unsealedAt: null,
    reply: ''
  },
  tellsPulse: [],
  tools: {}
};

function mergeDeep(target, source) {
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeDeep(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

class Store {
  #state;
  #saveTimer = null;

  constructor() {
    this.#state = this.#load();
    if (!this.#state.createdAt) {
      this.#state.createdAt = new Date().toISOString();
      this.#persist();
    }
  }

  #load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.#fresh();
      const parsed = JSON.parse(raw);
      // Merge persisted data over defaults (preserves unknown future keys)
      return mergeDeep(this.#fresh(), parsed);
    } catch {
      return this.#fresh();
    }
  }

  #fresh() {
    const s = JSON.parse(JSON.stringify(DEFAULT_STATE));
    s.createdAt = new Date().toISOString();
    return s;
  }

  #persist() {
    this.#state.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#state));
    } catch (e) {
      console.warn('[LSD] Storage write failed:', e);
    }
  }

  /** Debounced save — coalesces rapid writes (e.g., typing) */
  #debouncedSave(delay = 500) {
    clearTimeout(this.#saveTimer);
    this.#saveTimer = setTimeout(() => this.#persist(), delay);
  }

  #emit(type, detail = {}) {
    document.dispatchEvent(new CustomEvent(type, { detail }));
  }

  // ── Public API ────────────────────────────────────────────────

  getState() { return this.#state; }

  getTool(id) { return this.#state.tools[id] ?? {}; }

  setTool(id, data, debounce = false) {
    this.#state.tools[id] = { ...(this.#state.tools[id] ?? {}), ...data };
    if (debounce) this.#debouncedSave();
    else this.#persist();
    this.#emit('store:changed', { toolId: id });
  }

  setProgress(toolId, status) {
    if (this.#state.progress[toolId] === status) return;
    this.#state.progress[toolId] = status;
    this.#persist();
    this.#emit('progress:changed', { toolId, status });
  }

  getProgress(toolId) {
    return this.#state.progress[toolId] ?? 'not_started';
  }

  getAllProgress() { return { ...this.#state.progress }; }

  getSealedLetter() { return { ...this.#state.sealedLetter }; }

  setSealedLetter(data, debounce = false) {
    this.#state.sealedLetter = { ...this.#state.sealedLetter, ...data };
    if (debounce) this.#debouncedSave();
    else this.#persist();
    this.#emit('store:changed', { toolId: 'sealedLetter' });
  }

  addTell(tell) {
    this.#state.tellsPulse.push({ ts: new Date().toISOString(), tell });
    this.#persist();
    this.#emit('tells:changed');
  }

  getTells() { return [...this.#state.tellsPulse]; }

  // ── Import / Export / Reset ──────────────────────────────────

  exportJSON() {
    return JSON.stringify(this.#state, null, 2);
  }

  importJSON(json) {
    const parsed = JSON.parse(json);
    if (!parsed.version) throw new Error('Invalid export file');
    this.#state = mergeDeep(this.#fresh(), parsed);
    this.#persist();
    this.#emit('store:reset');
  }

  reset() {
    this.#state = this.#fresh();
    this.#persist();
    this.#emit('store:reset');
  }
}

export const store = new Store();
