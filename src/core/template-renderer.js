/**
 * Simplified Template Renderer
 * Supports basic mustache-like interpolation, sections, and inverted sections
 */
export class TemplateRenderer {
  /**
   * Render a template string with given context
   * @param {string} template - Template string
   * @param {Object} context - Rendering context
   * @returns {string} Rendered template
   */
  static render(template, context) {
    return this.renderInterpolation(
      this.renderSections(
        this.renderInvertedSections(template, context),
        context,
      ),
      context,
    );
  }

  /**
   * Process inverted sections ({{^block}}...{{/block}})
   * @param {string} template - Template string
   * @param {Object} context - Rendering context
   * @returns {string} Template with inverted sections processed
   */
  static renderInvertedSections(template, context) {
    return template.replace(
      /\{\{\^(.*?)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
      (_, key, content) => {
        const value = this.resolveValue(context, key.trim());

        // Render content when value is falsy
        if (!value || (Array.isArray(value) && value.length === 0)) {
          return this.render(content, context);
        }

        return "";
      },
    );
  }

  /**
   * Process template sections ({{#block}}...{{/block}})
   * @param {string} template - Template string
   * @param {Object} context - Rendering context
   * @returns {string} Template with sections processed
   */
  static renderSections(template, context) {
    return template.replace(
      /\{\{#(.*?)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
      (_, key, content) => {
        const value = this.resolveValue(context, key.trim());

        if (Array.isArray(value)) {
          return value.map((item) =>
            this.render(content, { ...context, ...item, ".": item })
          ).join("");
        }

        if (value === true) {
          return this.render(content, context);
        }

        return "";
      },
    );
  }

  /**
   * Process template interpolations
   * @param {string} template - Template string
   * @param {Object} context - Rendering context
   * @returns {string} Template with interpolations replaced
   */
  static renderInterpolation(template, context) {
    return template.replace(
      /\{\{\{(.*?)\}\}\}|\{\{(.*?)\}\}/g,
      (_, unescaped, escaped) => {
        const key = (unescaped || escaped).trim();
        const value = this.resolveValue(context, key);

        // Unescaped interpolation allows HTML
        if (unescaped) return value ?? "";

        // Escaped interpolation sanitizes HTML
        return this.escapeHTML(value ?? "");
      },
    );
  }

  /**
   * Resolve a value from the context using dot notation
   * @param {Object} context - Rendering context
   * @param {string} key - Key to resolve
   * @returns {*} Resolved value
   */
  static resolveValue(context, key) {
    // Handle '.' for current context in sections
    if (key === ".") return context["."];

    return key.split(".").reduce((acc, part) => {
      return acc && acc[part] !== undefined ? acc[part] : undefined;
    }, context);
  }

  /**
   * Escape HTML to prevent XSS
   * @param {*} value - Value to escape
   * @returns {string} Escaped HTML string
   */
  static escapeHTML(value) {
    if (value == null) return "";

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

export default TemplateRenderer;
