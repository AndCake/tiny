// tiny/tests/browser-mocks.js
import { JSDOM } from "jsdom";

// Global mock setup
if (typeof globalThis.window === "undefined") {
  const {
    // note, these are *not* globals
    window,
    document,
    customElements,
    // other exports ..
  } = new JSDOM("<!DOCTYPE html><html><body></body></html>");
  globalThis.window = window;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.document = document;
  globalThis.customElements = customElements;

  globalThis.document = globalThis.window.document;
  globalThis.CustomEvent = window.CustomEvent;
}
