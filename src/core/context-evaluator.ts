import type ComponentRenderer from "../component-renderer.ts";

/**
 * Context Evaluator Utility
 * Provides safe and flexible evaluation of dynamic expressions within a given context
 */
export class ContextEvaluator {
  /**
   * Safely evaluate an expression within a given context
   * @param expression - The expression to evaluate
   * @param context - The context object for evaluation
   * @param element - Optional element reference
   * @returns The result of the expression
   */
  static evaluate(
    expression: string,
    context: Record<string, unknown>,
    element: HTMLElement | null = null,
  ): unknown {
    try {
      // Extend context with element reference if provided
      const fullContext = element ? { ...context, $el: element } : context;

      // Use Function constructor with 'with' statement for dynamic evaluation
      const evalFunction = new Function(
        "context",
        `with (context) { return ${expression}; }`,
      );

      return evalFunction.call(element, fullContext);
    } catch (error) {
      console.log(`Expression evaluation error: ${expression}`, error);
      return null;
    }
  }

  /**
   * Create a function that can be bound to an element for event handling
   * @param expression - The event handler expression
   * @param context - The context object
   * @param element - The element to bind to
   * @returns A bound event handler function
   */
  static createEventHandler(
    expression: string,
    context: ComponentRenderer & Record<string, unknown>,
    element: HTMLElement,
  ): (event: Event) => void {
    return function (this: ComponentRenderer, event: Event) {
      try {
        // Extend context with event and element references
        const fullContext = {
          ...context,
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
        console.error(`Event handler error: ${expression}`, error);
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
