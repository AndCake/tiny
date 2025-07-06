import { parseDataset, safeParse } from "./dataset-parser.js";
import { initComponents } from "./component-renderer.js";
import { compileCSS } from "./stylis-utils.js";

/**
 * Tiny Web Components Library
 *
 * A lightweight, declarative library for creating custom web components
 * with template-based rendering, dynamic event handling, and advanced CSS processing.
 *
 * @module tiny
 */

// Ensure window object exists in non-browser environments
if (typeof window === "undefined") {
  self.window = self;
}

/**
 * Initialize Tiny Web Components library
 *
 * @param {Object} [options={}] - Configuration options
 * @param {Window} [options.window=globalThis.window] - Window object to use
 * @param {boolean} [options.runScripts=true] - Whether to execute inline scripts
 * @returns {Promise<void>}
 */
async function init(options = {}) {
  const {
    window = globalThis.window,
    runScripts = true,
  } = options;

  if (!window?.document) return;

  // Initialize components
  await initComponents({
    document: window.document,
    customElements: window.customElements,
    HTMLElement: window.HTMLElement,
    MutationObserver: window.MutationObserver,
    runScripts,
  });

  // Add library loaded class to document root
  window?.document?.documentElement?.classList.add("tiny-loaded");
}

// Public API
export { compileCSS, init, initComponents, parseDataset, safeParse };

// Auto-initialize if module is loaded directly
if (typeof window !== "undefined") {
  init().catch(console.error);
}

export default init;
