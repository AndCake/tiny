/**
 * Attribute Processor Utility
 * Handles dynamic attribute processing for web components
 */
export class AttributeProcessor {
  /**
   * Process a single dynamic attribute
   * @param {HTMLElement} element - The target element
   * @param {Attr} attribute - The attribute to process
   * @param {Object} context - The rendering context
   * @param {Function} renderCallback - Callback to trigger re-rendering
   */
  static processAttribute(element, attribute, context, renderCallback) {
    const processors = {
      "x-show": this.processShowAttribute,
      "x-if": this.processIfAttribute,
      "x-for": this.processForAttribute,
      "x-html": this.processHtmlAttribute,
      "x-text": this.processTextAttribute,
      "x-model": this.processModelAttribute,
      "x-ref": this.processRefAttribute,
    };

    // Check for custom event or dynamic attributes
    if (attribute.name.startsWith("@")) {
      return this.processEventAttribute(
        element,
        attribute,
        context,
        renderCallback,
      );
    }

    if (attribute.name.startsWith(":")) {
      return this.processDynamicAttribute(element, attribute, context);
    }

    // Use specific processor if available
    const processor = processors[attribute.name];
    if (processor) {
      return processor.call(this, element, attribute, context, renderCallback);
    }
  }

  /**
   * Process x-show attribute for conditional visibility
   * @param {HTMLElement} element - The target element
   * @param {Attr} attribute - The x-show attribute
   * @param {Object} context - The rendering context
   */
  static processShowAttribute(element, attribute, context) {
    const show = this.evaluateExpression(attribute.value, context, element);
    element.hidden = !show;
  }

  /**
   * Process x-if attribute for conditional rendering
   * @param {HTMLElement} element - The target element
   * @param {Attr} attribute - The x-if attribute
   * @param {Object} context - The rendering context
   */
  static processIfAttribute(element, attribute, context) {
    const shouldRender = this.evaluateExpression(
      attribute.value,
      context,
      element,
    );
    if (!shouldRender) {
      element.remove();
    }
  }

  /**
   * Process x-for attribute for list rendering
   * @param {HTMLElement} element - The template element
   * @param {Attr} attribute - The x-for attribute
   * @param {Object} context - The rendering context
   * @param {Function} renderCallback - Callback to trigger re-rendering
   */
  static processForAttribute(element, attribute, context, renderCallback) {
    if (element.tagName.toLowerCase() !== "template") {
      console.warn(
        "For loops only allowed in template tags. Instead found on ",
        element.tagName,
      );
      return;
    }

    const iterations = this.parseListIterations(attribute.value, context);

    iterations.forEach((iterationContext) => {
      const clone = element.content.cloneNode(true);
      const fragment = document.createDocumentFragment();
      fragment.appendChild(clone);

      // Render each iteration with its local context
      renderCallback(fragment, iterationContext);

      // Insert rendered content before the template
      element.parentNode.insertBefore(fragment, element);
    });
  }

  /**
   * Process x-html attribute for dynamic HTML content
   * @param {HTMLElement} element - The target element
   * @param {Attr} attribute - The x-html attribute
   * @param {Object} context - The rendering context
   */
  static processHtmlAttribute(element, attribute, context) {
    const htmlContent = this.evaluateExpression(
      attribute.value,
      context,
      element,
    );
    element.innerHTML = htmlContent || "";
  }

  /**
   * Process x-text attribute for dynamic text content
   * @param {HTMLElement} element - The target element
   * @param {Attr} attribute - The x-text attribute
   * @param {Object} context - The rendering context
   */
  static processTextAttribute(element, attribute, context) {
    const textContent = this.evaluateExpression(
      attribute.value,
      context,
      element,
    );
    element.textContent = textContent || "";
  }

  /**
   * Process x-model attribute for two-way data binding
   * @param {HTMLElement} element - The input element
   * @param {Attr} attribute - The x-model attribute
   * @param {Object} context - The rendering context
   * @param {Function} renderCallback - Callback to trigger re-rendering
   */
  static processModelAttribute(element, attribute, context, renderCallback) {
    // Set initial value
    element.value =
      element.dataset.value =
        this.evaluateExpression(attribute.value, context, element) || "";

    // Two-way binding
    element.addEventListener("change", (event) => {
      this.updateContext(context, event.target.value, attribute.value);
      renderCallback();
      // @TODO: re-rendering here looses the focus
      // when trying to just focus, the cursor might be at the
      // wrong location after, so it needs to be properly
      // restored.
    });
  }

  static updateContext(context, value, attributeName) {
    const pathParts = attributeName.split(".");
    let obj = context;
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!obj[pathParts[i]]) {
        obj[pathParts[i]] = {};
      }
      obj = obj[pathParts[i]];
    }
    obj[pathParts[pathParts.length - 1]] = value;
    return context;
  }

  /**
   * Process x-ref attribute for element references
   * @param {HTMLElement} element - The target element
   * @param {Attr} attribute - The x-ref attribute
   * @param {Object} context - The rendering context
   */
  static processRefAttribute(element, attribute, context) {
    context.$refs = context.$refs || {};
    context.$refs[attribute.value] = element;
  }

  /**
   * Process event attributes (starting with @)
   * @param {HTMLElement} element - The target element
   * @param {Attr} attribute - The event attribute
   * @param {Object} context - The rendering context
   * @param {Function} renderCallback - Callback to trigger re-rendering
   */
  static processEventAttribute(element, attribute, context, renderCallback) {
    const eventName = attribute.name.substring(1);
    const handler = this.createEventHandler(attribute.value, context, element);

    element.addEventListener(eventName, (event) => {
      handler(event);
      renderCallback();
    });
  }

  /**
   * Process dynamic attributes (starting with :)
   * @param {HTMLElement} element - The target element
   * @param {Attr} attribute - The dynamic attribute
   * @param {Object} context - The rendering context
   */
  static processDynamicAttribute(element, attribute, context) {
    const attrName = attribute.name.substring(1);
    const value = this.evaluateExpression(attribute.value, context, element);

    if (value) {
      element.setAttribute(attrName, value);
    }
  }

  /**
   * Evaluate an expression within a given context
   * @param {string} expression - The expression to evaluate
   * @param {Object} context - The rendering context
   * @param {HTMLElement} [element] - Optional element reference
   * @returns {*} The evaluated expression result
   */
  static evaluateExpression(expression, context, element = null) {
    try {
      const fn = new Function(
        "context",
        `with (context) { return ${expression}; }`,
      );
      return fn.call(context, { ...context, $el: element });
    } catch (error) {
      console.error(`Expression evaluation error: ${expression}`, error);
      return null;
    }
  }

  /**
   * Create an event handler function
   * @param {string} expression - The event handler expression
   * @param {Object} context - The rendering context
   * @param {HTMLElement} element - The target element
   * @returns {Function} The event handler function
   */
  static createEventHandler(expression, context, element) {
    return (event) => {
      try {
        const fn = new Function(
          "context",
          "event",
          `with (context) { ${expression}; }`,
        );
        fn.call(context, { ...context, $event: event, $el: element, event });
      } catch (error) {
        console.error(`Event handler error: ${expression}`, error);
      }
    };
  }

  /**
   * Parse list iterations for x-for attribute
   * @param {string} expression - The x-for expression
   * @param {Object} context - The rendering context
   * @returns {Array} List of iteration contexts
   */
  static parseListIterations(expression, context) {
    try {
      const [iteratorVar, collectionExpr] = expression.split(/\s+(?:of|in)\s+/);

      const fn = new Function(
        "context",
        `with (context) {
          return ${collectionExpr}.map((${iteratorVar}, _idx) => ({
            ...context,
            ${iteratorVar},
            _idx
          }));
        }`,
      );

      return fn.call(context, context);
    } catch (error) {
      console.error("List iteration parsing error:", error);
      return [];
    }
  }
}

export default AttributeProcessor;
