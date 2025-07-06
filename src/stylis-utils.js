/**
 * Stylis CSS Compilation Utilities
 *
 * Provides advanced CSS processing and compilation using Stylis middleware
 */
import { compile, middleware, prefixer, serialize, stringify } from "stylis";

/**
 * Compile and process CSS with Stylis middleware
 *
 * @param {string} cssText - Raw CSS text to compile
 * @returns {string} Processed and compiled CSS
 */
export function compileCSS(cssText) {
  // Use Stylis middleware to process CSS
  // Handles vendor prefixing, serialization, and stringification
  return serialize(
    compile(cssText),
    middleware([prefixer, stringify]),
  );
}

/**
 * Process CSS within HTML template, replacing <style> blocks
 *
 * @param {string} htmlTemplate - HTML template containing <style> tags
 * @returns {string} HTML template with processed CSS
 */
export function processTemplateCSS(htmlTemplate) {
  return htmlTemplate.replaceAll(
    /<style>((?:[^<]|<[^\/]))*<\/style>/g,
    function (styleBlock) {
      // Extract pure CSS content
      const cssContent = styleBlock
        .replace(/<style>/g, "")
        .replace(/<\/style>/g, "");

      // Compile CSS and wrap back in <style> tags
      const processedCSS = compileCSS(cssContent);
      return `<style>${processedCSS}</style>`;
    },
  );
}
