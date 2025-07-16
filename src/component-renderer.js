import Mustache from "./core/template-renderer.js";
import { parseDataset } from "./dataset-parser.js";
import { processTemplateCSS } from "./stylis-utils.js";
import { ContextEvaluator } from "./core/context-evaluator.js";
import { AttributeProcessor } from "./core/attribute-processor.js";

/**
 * Advanced Web Component Renderer
 * Provides a flexible and extensible rendering mechanism for declarative web components
 */

export default class ComponentRenderer extends HTMLElement {
  /**
   * Initialize the web component
   */
  constructor(template) {
    super();
    this.attachShadow({ mode: "open" });

    // Initialize context with dataset and inner HTML
    this.template = template;
    this.context = this;
    Object.assign(this.context, {
      ...parseDataset(this.dataset),
      "@": this.innerHTML,
      $refs: {},
    });

    this.handleFormElements();
    this.handleExternalMutations();
  }

  handleFormElements() {
    if (
      ["input", "textarea", "select"].includes(this.template.dataset.as || "")
    ) {
      this.internals_ = this.attachInternals && this.attachInternals();
      this.closest("form")?.addEventListener("formdata", (event) => {
        const formData = event.formData;
        formData.set(
          this.dataset.name || this.getAttribute("name"),
          this.value,
        );
      });
    }
  }

  handleExternalMutations() {
    // if we are interested in getting informed on changes to our content
    if (!this.template.dataset.attrs?.includes("@")) {
      return;
    }
    // observe it for changes (if changed, re-render)
    const observer = new MutationObserver(() => {
      this.context["@"] = this.innerHTML;
      this.render();
    });

    // Start observing the target node for configured mutations
    observer.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  /**
   * Prepare component content from template
   * @param {HTMLTemplateElement} template - Component's template element
   */
  prepareContent(template) {
    const content = template.content.cloneNode(true);

    // Extract HTML content (excluding scripts)
    this._htmlContent = Array.from(content.children)
      .filter((x) => x.tagName?.toLowerCase() !== "script")
      .map((x) => x.outerHTML || x.nodeValue || "")
      .join("");

    // Process inline script if present
    const scriptElement = content.querySelector("script");
    if (scriptElement && !scriptElement.src) {
      this.processInlineScript(scriptElement);
    }
  }

  /**
   * Process and evaluate inline script content
   * @param {HTMLScriptElement} scriptElement - Script tag to process
   */
  processInlineScript(scriptElement) {
    try {
      const scriptContent = scriptElement.innerHTML?.trim();
      const events = ContextEvaluator.evaluate(
        `(() => { return ${scriptContent}; })()`,
        this.context,
        this,
      );

      // Merge script exports into component context
      Object.assign(this, events);
      Object.assign(this.context, events);
      this._events = events;
    } catch (error) {
      console.error("Script parsing error:", error);
    }
  }

  /**
   * Primary rendering method for the component
   */
  render() {
    try {
      // Render Mustache template
      const renderedContent = Mustache.render(this._htmlContent, this.context);

      // Process CSS
      const processedContent = processTemplateCSS(renderedContent);

      // Update shadow DOM
      this.shadowRoot.innerHTML = processedContent;

      // Process dynamic attributes
      this.processDynamicAttributes();
      this.handleEventProcessing();

      // Trigger component rendered lifecycle
      this.onComponentRendered();
    } catch (error) {
      console.error("Rendering error:", error);
    }
  }

  onComponentRendered() {}
  onComponentMounted() {}

  handleEventProcessing() {
    const eventObjects = Object.keys(this).filter((x) =>
      typeof this[x] === "object" && this[x] &&
      Object.values(this[x]).every((y) => typeof y === "function")
    );
    eventObjects.forEach((el) => {
      Object.keys(this[el]).forEach((event) => {
        Array.from(this.shadowRoot?.querySelectorAll(el)).forEach((ex) => {
          ex?.addEventListener(event, (e) => {
            try {
              this[el][event].call(this, e);
            } catch (ex) {
              throw new Error(
                "Unable to handle event " + event +
                  " on element " + el + " for component " +
                  this.tagName + ": " + ex.message + "\n" + ex.stack,
                {
                  cause: ex,
                },
              );
            }
          });
        });
      });
    });
  }

  /**
   * Process dynamic attributes across rendered elements
   */
  processDynamicAttributes(fragment, privateContext) {
    const elements = (fragment ?? this.shadowRoot).querySelectorAll("*");

    elements.forEach((element) => {
      // Skip elements inside template tags
      if (element.parentNode && !!element.parentNode?.closest?.("template")) {
        return;
      }

      // Process each attribute using AttributeProcessor
      Array.from(element.attributes).forEach((attr) => {
        AttributeProcessor.processAttribute(
          element,
          attr,
          privateContext ?? this.context,
          (fragment, privateContext) => {
            if (fragment && privateContext) {
              this.processDynamicAttributes(fragment, privateContext);
            } else {
              this.render();
            }
          },
        );
      });
    });
  }

  /**
   * Lifecycle method when component is added to the DOM
   */
  connectedCallback() {
    if (typeof this.onComponentMounted === "function") {
      this.onComponentMounted();
    }
  }

  /**
   * Lifecycle method when observed attributes change
   * @param {string} name - Attribute name
   */
  attributeChangedCallback(_name) {
    // Update context and re-render
    Object.assign(this.context, parseDataset(this.dataset));
    this.render();
  }
}

/**
 * Initialize web components from template tags
 * @param {Object} options - Initialization options
 */
export async function initComponents(options = {}) {
  const {
    document = window.document,
    customElements = window.customElements,
  } = options;

  if (!document) return;

  // Fetch external component definitions
  let components;
  const urls = [];

  // import all required components using the LINK[rel="html"] tag
  do {
    const div = document.createElement("div");
    components = await Promise.all(
      Array.from(document.querySelectorAll('link[rel="html"]')).map(
        async (link) => {
          const href = link.href;
          link.remove();

          // Prevent duplicate fetches
          if (urls.includes(href)) return "";
          urls.push(href);

          return await fetch(href, new URL(location.href)).then((res) =>
            res.status === 200 ? res.text() : `Component ${href} not found.`
          );
        },
      ),
    );

    // Add fetched components to document
    if (components.length > 0) {
      div.innerHTML = components.join("");
      document.head.appendChild(div);
    }
  } while (components.length > 0);

  // Define custom elements from templates
  window.knownElements = window.knownElements || [];
  Array.from(document.querySelectorAll("template[data-name]")).forEach(
    (template) => {
      const elementName = template.dataset.name;
      if (window.knownElements.includes(elementName)) return;
      window.knownElements.push(elementName);

      const isFormAssociated = ["input", "textarea", "select"].includes(
        template.dataset.as || "",
      );

      const observedAttributes = template
        ? (template.dataset.attrs?.split(",").map((x) => `data-${x}`) || [])
        : [];

      // Create a custom element class for this template
      const ComponentClass = class extends ComponentRenderer {
        static formAssociated = isFormAssociated;
        static observedAttributes = observedAttributes;

        constructor() {
          super(template);
          this.prepareContent(template);
          this.render();
        }
      };

      // Define the custom element
      customElements.define(elementName, ComponentClass);
    },
  );
}

// Auto-initialize if in browser environment
if (typeof window !== "undefined") {
  initComponents().catch(console.error);
}

export { initComponents as init };
