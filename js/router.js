/**
 * router.js — Hash-based SPA router
 *
 * Routes are registered as exact strings or patterns.
 * The router calls the matched render function with the
 * main content container and any extracted params.
 */

class Router {
  #routes = [];
  #current = null;
  #cleanupFn = null;

  constructor() {
    window.addEventListener('hashchange', () => this.#dispatch());
  }

  /**
   * Call once after all routes are registered.
   * ES modules are deferred, so DOMContentLoaded has already fired;
   * we dispatch via a microtask so synchronous route registration
   * in app.js completes first.
   */
  start() {
    queueMicrotask(() => this.#dispatch());
  }

  /**
   * Register a route.
   * @param {string} pattern — e.g. '/part-1/spot-the-box' or '/part-:n'
   * @param {function} handler — render(container, params)
   */
  on(pattern, handler) {
    this.#routes.push({ pattern, handler, regex: this.#toRegex(pattern) });
    return this;
  }

  #toRegex(pattern) {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const withParams = escaped.replace(/:([a-zA-Z]+)/g, '(?<$1>[^/]+)');
    return new RegExp(`^${withParams}$`);
  }

  #getPath() {
    const hash = window.location.hash;
    return hash ? hash.slice(1) : '/';  // strip leading '#'
  }

  async #dispatch() {
    const path = this.#getPath();
    if (path === this.#current) return;
    this.#current = path;

    // Run cleanup for previous route
    if (typeof this.#cleanupFn === 'function') {
      this.#cleanupFn();
      this.#cleanupFn = null;
    }

    const container = document.getElementById('main-content');
    if (!container) return;

    for (const route of this.#routes) {
      const match = path.match(route.regex);
      if (match) {
        const params = match.groups ?? {};
        container.innerHTML = '';
        container.classList.remove('wide');
        window.scrollTo({ top: 0, behavior: 'instant' });
        const cleanup = await route.handler(container, params);
        if (typeof cleanup === 'function') this.#cleanupFn = cleanup;
        document.dispatchEvent(new CustomEvent('route:changed', { detail: { path } }));
        return;
      }
    }

    // 404 fallback
    container.innerHTML = `
      <div style="text-align:center;padding:80px 24px">
        <p style="color:var(--text-3);font-size:14px">Page not found</p>
        <a href="#/" class="btn btn-ghost mt-4" style="display:inline-flex;margin-top:16px">← Home</a>
      </div>`;
  }

  /** Programmatic navigation */
  go(path) {
    window.location.hash = path;
  }

  getCurrent() { return this.#current; }
}

export const router = new Router();
