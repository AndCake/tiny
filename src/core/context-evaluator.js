/**
 * Context Evaluator Utility
 * Provides safe and flexible evaluation of dynamic expressions within a given context
 */
export class ContextEvaluator {
  /**
   * Safely evaluate an expression within a given context
   * @param {string} expression - The expression to evaluate
   * @param {Object} context - The context object for evaluation
   * @param {HTMLElement} [element] - Optional element reference
   * @returns {*} The result of the expression
   */
  static evaluate(expression, context, element = null) {
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
   * @param {string} expression - The event handler expression
   * @param {Object} context - The context object
   * @param {HTMLElement} element - The element to bind to
   * @returns {Function} A bound event handler function
   */
  static createEventHandler(expression, context, element) {
    return function (event) {
      try {
        // Extend context with event and element references
        const fullContext = {
          ...context,
          $el: element,
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
   * @param {string} key - The key to retrieve
   * @param {Object} context - The context object
   * @param {*} [defaultValue] - Optional default value
   * @returns {*} The parsed value
   */
  static parseContextValue(key, context, defaultValue = undefined) {
    return this.evaluate(key, context) ?? defaultValue;
  }
}

export default ContextEvaluator;
