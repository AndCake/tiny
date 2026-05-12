import ContextEvaluator from "./context-evaluator.ts";
import { styleObjectToCss } from "../style-registry.ts";
import type ComponentRenderer from "../component-renderer.ts";

/**
 * Attribute Processor Utility
 * Handles dynamic attribute processing for web components
 */
export class AttributeProcessor {
  /**
   * Process a single dynamic attribute
   * @param element - The target element
   * @param attribute - The attribute to process
   * @param context - The rendering context
   * @param renderCallback - Callback to trigger re-rendering
   * @param componentName - Optional component name for error reporting
   */
  static processAttribute(
    element: HTMLElement,
    attribute: Attr,
    context: ComponentRenderer & Record<string, unknown>,
    renderCallback: (
      fragment?: DocumentFragment,
      privateContext?: Record<string, unknown>,
    ) => void,
    componentName?: string,
  ): void {
    const processors: Record<string, Function> = {
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
        componentName,
      );
    }

    if (attribute.name.startsWith(":")) {
      return this.processDynamicAttribute(element, attribute, context, componentName);
    }

    // Use specific processor if available
    const processor = processors[attribute.name];
    if (processor) {
      return processor.call(this, element, attribute, context, renderCallback, componentName);
    }
  }

  /**
   * Process x-show attribute for conditional visibility
   * @param element - The target element
   * @param attribute - The x-show attribute
   * @param context - The rendering context
   * @param componentName - Optional component name for error reporting
   */
  static processShowAttribute(
    element: HTMLElement,
    attribute: Attr,
    context: Record<string, unknown>,
    _renderCallback?: Function,
    componentName?: string,
  ): void {
    const show = ContextEvaluator.evaluate(attribute.value, context, element, {
      componentName,
      attributeName: 'x-show',
    });
    element.hidden = !show;
  }

  /**
   * Process x-if attribute for conditional rendering
   * @param element - The target element
   * @param attribute - The x-if attribute
   * @param context - The rendering context
   * @param componentName - Optional component name for error reporting
   */
  static processIfAttribute(
    element: HTMLElement,
    attribute: Attr,
    context: Record<string, unknown>,
    _renderCallback?: Function,
    componentName?: string,
  ): void {
    const shouldRender = ContextEvaluator.evaluate(
      attribute.value,
      context,
      element,
      { componentName, attributeName: 'x-if' },
    );
    if (!shouldRender) {
      element.remove();
    }
  }

  /**
   * Process x-for attribute for list rendering
   * @param element - The template element
   * @param attribute - The x-for attribute
   * @param context - The rendering context
   * @param renderCallback - Callback to trigger re-rendering
   * @param componentName - Optional component name for error reporting
   */
  static processForAttribute(
    element: HTMLTemplateElement,
    attribute: Attr,
    context: Record<string, unknown>,
    renderCallback: (
      fragment: DocumentFragment,
      privateContext: Record<string, unknown>,
    ) => void,
    componentName?: string,
  ): void {
    if (element.tagName.toLowerCase() !== "template") {
      console.warn(
        "For loops only allowed in template tags. Instead found on ",
        element.tagName,
      );
      return;
    }

    const iterations = this.parseListIterations(attribute.value, context, componentName);

    iterations.forEach((iterationContext) => {
      const clone = element.content.cloneNode(true) as DocumentFragment;
      const fragment = document.createDocumentFragment();
      fragment.appendChild(clone);

      // Render each iteration with its local context
      renderCallback(fragment, iterationContext);

      // Insert rendered content before the template
      element.parentNode?.insertBefore(fragment, element);
    });
  }

  /**
   * Process x-html attribute for dynamic HTML content
   * @param element - The target element
   * @param attribute - The x-html attribute
   * @param context - The rendering context
   * @param componentName - Optional component name for error reporting
   */
  static processHtmlAttribute(
    element: HTMLElement,
    attribute: Attr,
    context: Record<string, unknown>,
    _renderCallback?: Function,
    componentName?: string,
  ): void {
    const htmlContent = ContextEvaluator.evaluate(
      attribute.value,
      context,
      element,
      { componentName, attributeName: 'x-html' },
    ) as string;
    element.innerHTML = htmlContent || "";
  }

  /**
   * Process x-text attribute for dynamic text content
   * @param element - The target element
   * @param attribute - The x-text attribute
   * @param context - The rendering context
   * @param componentName - Optional component name for error reporting
   */
  static processTextAttribute(
    element: HTMLElement,
    attribute: Attr,
    context: Record<string, unknown>,
    _renderCallback?: Function,
    componentName?: string,
  ): void {
    const textContent = ContextEvaluator.evaluate(
      attribute.value,
      context,
      element,
      { componentName, attributeName: 'x-text' },
    ) as string;
    element.textContent = textContent || "";
  }

  /**
   * Process x-model attribute for two-way data binding
   * @param element - The input element
   * @param attribute - The x-model attribute
   * @param context - The rendering context
   * @param renderCallback - Callback to trigger re-rendering
   * @param componentName - Optional component name for error reporting
   */
  static processModelAttribute(
    element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    attribute: Attr,
    context: Record<string, unknown>,
    renderCallback: () => void,
    componentName?: string,
  ): void {
    // Set initial value
    const initialValue = (ContextEvaluator.evaluate(
      attribute.value,
      context,
      element as HTMLElement,
      { componentName, attributeName: 'x-model' },
    ) || "") as string;

    element.value = initialValue;
    element.dataset.value = initialValue;

    // Two-way binding
    element.addEventListener("change", (event) => {
      const target = event.target as HTMLInputElement;
      this.updateContext(context, target.value, attribute.value);
      renderCallback();
    });
  }

  /**
   * Process x-ref attribute for element references
   * @param element - The target element
   * @param attribute - The x-ref attribute
   * @param context - The rendering context
   * @param componentName - Optional component name for error reporting
   */
  static processRefAttribute(
    element: HTMLElement,
    attribute: Attr,
    context: Record<string, unknown>,
    _renderCallback?: Function,
    _componentName?: string,
  ): void {
    context.$refs = context.$refs || {};
    (context.$refs as Record<string, HTMLElement>)[attribute.value] = element;
  }

  /**
   * Process event attributes (starting with @)
   * @param element - The target element
   * @param attribute - The event attribute
   * @param context - The rendering context
   * @param renderCallback - Callback to trigger re-rendering
   * @param componentName - Optional component name for error reporting
   */
  static processEventAttribute(
    element: HTMLElement,
    attribute: Attr,
    context: ComponentRenderer & Record<string, unknown>,
    renderCallback: () => void,
    componentName?: string,
  ): void {
    const eventName = attribute.name.substring(1);
    const handler = ContextEvaluator.createEventHandler(
      attribute.value,
      context,
      element,
      componentName,
    );

    element.addEventListener(eventName, (event) => {
      handler(event);
      renderCallback();
    });
  }

  /**
   * Process dynamic attributes (starting with :)
   * @param element - The target element
   * @param attribute - The dynamic attribute
   * @param context - The rendering context
   * @param componentName - Optional component name for error reporting
   */
  static processDynamicAttribute(
    element: HTMLElement,
    attribute: Attr,
    context: Record<string, unknown>,
    componentName?: string,
  ): void {
    const attrName = attribute.name.substring(1);
    const value = ContextEvaluator.evaluate(
      attribute.value,
      context,
      element,
      { componentName, attributeName: `:${attrName}` },
    );

    // Object-valued :style is converted to a CSS declaration string,
    // enabling composition via spreads from $styles.
    if (attrName === "style" && value && typeof value === "object") {
      const cssText = styleObjectToCss(value as Record<string, unknown>);
      if (cssText) {
        element.setAttribute("style", cssText);
      } else {
        element.removeAttribute("style");
      }
      return;
    }

    if (value) {
      element.setAttribute(attrName, value as string);
    } else {
      element.removeAttribute(attrName);
    }
  }

  /**
   * Update context with a new value
   * @param context - The context to update
   * @param value - The new value
   * @param attributeName - The attribute/path to update
   * @returns Updated context
   */
  static updateContext(
    context: Record<string, unknown>,
    value: unknown,
    attributeName: string,
  ): Record<string, unknown> {
    const pathParts = attributeName.split(".");
    let obj = context;
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!obj[pathParts[i]]) {
        obj[pathParts[i]] = {};
      }
      obj = obj[pathParts[i]] as Record<string, unknown>;
    }
    obj[pathParts[pathParts.length - 1]] = value;
    return context;
  }

  /**
   * Parse list iterations for x-for attribute
   * @param expression - The x-for expression
   * @param context - The rendering context
   * @param componentName - Optional component name for error reporting
   * @returns List of iteration contexts
   */
  static parseListIterations(
    expression: string,
    context: Record<string, unknown>,
    componentName?: string,
  ): Record<string, unknown>[] {
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
      const contextStr = componentName ? ` in component <${componentName}>` : '';
      console.error(
        `List iteration parsing error${contextStr}:\n` +
        `  x-for expression: ${expression}\n` +
        `  Error: ${(error as Error).message}`,
        error,
      );
      return [];
    }
  }
}

export default AttributeProcessor;
