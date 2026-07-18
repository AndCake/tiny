import type ComponentRenderer from "../component-renderer.ts";

/**
 * Metadata for error reporting in expression evaluation
 */
interface EvaluationErrorContext {
  componentName?: string;
  attributeName?: string;
  elementInfo?: string;
}

/**
 * Context Evaluator Utility
 * Provides safe and flexible evaluation of dynamic expressions within a given context
 */
export class ContextEvaluator {
  /**
   * Get a human-readable description of an element for error reporting
   */
  private static getElementDescription(element: HTMLElement): string {
    const tagName = element.tagName?.toLowerCase() || 'unknown';
    const id = element.id ? `#${element.id}` : '';
    const classes = element.className ? `.${element.className.split(/\s+/).join('.')}` : '';
    const attrs = Array.from(element.attributes)
      .slice(0, 2)
      .map(attr => `${attr.name}="${attr.value}"`)
      .join(' ');
    const attrStr = attrs ? ` [${attrs}${element.attributes.length > 2 ? '...' : ''}]` : '';
    return `<${tagName}${id}${classes}${attrStr}>`;
  }

  /**
   * Safely evaluate an expression within a given context
   * @param expression - The expression to evaluate
   * @param context - The context object for evaluation
   * @param element - Optional element reference
   * @param errorContext - Optional error context for better error messages
   * @returns The result of the expression
   */
  static evaluate(
    expression: string,
    context: Record<string, unknown>,
    element: HTMLElement | null = null,
    errorContext?: EvaluationErrorContext,
  ): unknown {
    try {
      if (element) {
        element.context = context;
      }
      // Extend context with element reference if provided.
      // Object.create(context) keeps context in the prototype chain so `with`
      // resolves bare names (e.g. `isLogin`) the same as `this.context.isLogin`.
      const fullContext = element
        ? Object.assign(Object.create(context), { $el: element })
        : context;

      // Use Function constructor with 'with' statement for dynamic evaluation
      const evalFunction = new Function(
        "context",
        `with (context) { return ${expression}; }`,
      );

      return evalFunction.call(element, fullContext);
    } catch (error) {
      const parts: string[] = [];

      if (errorContext?.componentName) {
        parts.push(`component <${errorContext.componentName}>`);
      }
      if (errorContext?.attributeName) {
        parts.push(`attribute "${errorContext.attributeName}"`);
      }
      if (errorContext?.elementInfo) {
        parts.push(`element ${errorContext.elementInfo}`);
      } else if (element) {
        parts.push(`element ${this.getElementDescription(element)}`);
      }

      const contextStr = parts.length > 0 ? ` in ${parts.join(', ')}` : '';
      console.error(
        `Expression evaluation error${contextStr}:\n` +
        `  Expression: ${expression}\n` +
        `  Error: ${(error as Error).message}`,
        error,
      );
      return null;
    }
  }

  /**
   * Create a function that can be bound to an element for event handling
   * @param expression - The event handler expression
   * @param context - The context object
   * @param element - The element to bind to
   * @param componentName - Optional component name for error reporting
   * @returns A bound event handler function
   */
  static createEventHandler(
    expression: string,
    context: ComponentRenderer & Record<string, unknown>,
    element: HTMLElement,
    componentName?: string,
  ): (event: Event) => void {
    return function (this: ComponentRenderer, event: Event) {
      try {
        // Extend context with event and element references
        const fullContext = {
          ...context,
          context: context,
          $el: element,
          $event: event,
          event,
        };

        // Create function with 'with' statement
        const handlerFunction = new Function(
          "context",
          `with (context) { ${expression}; }`,
        );

        // Call the handler and trigger re-render
        handlerFunction.call(context, fullContext);

        // If this is part of a component, trigger render
        if (typeof this.render === "function") {
          this.render();
        }
      } catch (error) {
        const parts: string[] = [];

        if (componentName) {
          parts.push(`component <${componentName}>`);
        }
        parts.push(`event handler (${element.tagName.toLowerCase()})`);

        const contextStr = parts.join(', ');
        console.error(
          `Event handler error in ${contextStr}:\n` +
          `  Handler: ${expression}\n` +
          `  Element: ${this.getElementDescription(element)}\n` +
          `  Error: ${(error as Error).message}`,
          error,
        );
      }
    }.bind(context);
  }

  /**
   * Safely parse a value from the context
   * @param key - The key to retrieve
   * @param context - The context object
   * @param defaultValue - Optional default value
   * @returns The parsed value
   */
  static parseContextValue(
    key: string,
    context: Record<string, unknown>,
    defaultValue = undefined,
  ): unknown {
    return this.evaluate(key, context) ?? defaultValue;
  }
}

export default ContextEvaluator;
