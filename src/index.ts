import { parseDataset, safeParse } from "./dataset-parser.ts";
import { initComponents } from "./component-renderer.ts";
import { compileCSS } from "./stylis-utils.ts";

/**
 * Configuration options for Tiny Web Components library initialization
 */
interface InitOptions {
  window?: Window & typeof globalThis;
  runScripts?: boolean;
}

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
 * @param {InitOptions} [options={}] - Configuration options
 * @returns {Promise<void>}
 */
async function init(options: InitOptions = {}): Promise<void> {
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

// Auto-initialize if module is loaded directly in browser with customElements support
if (typeof window !== "undefined" && window.customElements) {
  init().catch(console.error);
}

export default init;
