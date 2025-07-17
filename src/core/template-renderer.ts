/**
 * Simplified Template Renderer
 * Supports basic mustache-like interpolation, sections, and inverted sections
 */
export class TemplateRenderer {
  /**
   * Render a template string with given context
   * @param template - Template string
   * @param context - Rendering context
   * @returns Rendered template
   */
  static render(template: string, context: Record<string, unknown>): string {
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
   * @param template - Template string
   * @param context - Rendering context
   * @returns Template with inverted sections processed
   */
  static renderInvertedSections(
    template: string,
    context: Record<string, unknown>,
  ): string {
    return template.replace(
      /\{\{\^(.*?)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
      (_, key: string, content: string) => {
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
   * @param template - Template string
   * @param context - Rendering context
   * @returns Template with sections processed
   */
  static renderSections(
    template: string,
    context: Record<string, unknown>,
  ): string {
    return template.replace(
      /\{\{#(.*?)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
      (_, key: string, content: string) => {
        const value = this.resolveValue(context, key.trim());

        if (Array.isArray(value)) {
          return value.map((item) =>
            this.render(content, { ...context, ...item, ".": item })
          ).join("");
        }

        if (value) {
          return this.render(content, { ...context, ".": value });
        }

        return "";
      },
    );
  }

  /**
   * Process template interpolations
   * @param template - Template string
   * @param context - Rendering context
   * @returns Template with interpolations replaced
   */
  static renderInterpolation(
    template: string,
    context: Record<string, unknown>,
  ): string {
    return template.replace(
      /\{\{\{(.*?)\}\}\}|\{\{(.*?)\}\}/g,
      (_match: string, unescaped?: string, escaped?: string) => {
        const key = (unescaped || escaped || "").trim();
        const value = this.resolveValue(context, key);

        // Unescaped interpolation allows HTML
        if (unescaped) return this.stringifyValue(value);

        // Escaped interpolation sanitizes HTML
        return this.escapeHTML(value ?? "");
      },
    );
  }

  /**
   * Convert a value to a string, handling various types
   * @param value - Value to stringify
   * @returns String representation of the value
   */
  private static stringifyValue(value: unknown): string {
    if (value === undefined || value === null) return "";

    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }

    return String(value);
  }

  /**
   * Resolve a value from the context using dot notation
   * @param context - Rendering context
   * @param key - Key to resolve
   * @returns Resolved value
   */
  static resolveValue(context: Record<string, unknown>, key: string): unknown {
    // Handle '.' for current context in sections
    if (key === ".") return context["."];

    return key.split(".").reduce((acc: unknown, part: string) => {
      if (acc === undefined || acc === null) return undefined;

      if (typeof acc == "object" && acc !== null) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, context);
  }

  /**
   * Escape HTML to prevent XSS
   * @param value - Value to escape
   * @returns Escaped HTML string
   */
  static escapeHTML(value: unknown): string {
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
