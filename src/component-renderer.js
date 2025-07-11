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
  static formAssociated;
  /**
   * Static method to define observed attributes dynamically
   * @returns {string[]} List of data attributes to observe
   */
  static get observedAttributes() {
    return this.template
      ? (this.template.dataset.attrs?.split(",").map((x) => `data-${x}`) || [])
      : [];
  }

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
    this.formAssociated = ["input", "textarea", "select"].includes(
      this.template.dataset.as || "",
    );

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
    if (this.template.dataset.attrs?.includes("@")) {
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
        `(function() { return ${scriptContent}; })()`,
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

      // Trigger component rendered lifecycle
      this.onComponentRendered();
    } catch (error) {
      console.error("Rendering error:", error);
    }
  }

  onComponentRendered() {}
  onComponentMounted() {}

  /**
   * Process dynamic attributes across rendered elements
   */
  processDynamicAttributes(fragment, privateContext) {
    const elements = (fragment ?? this.shadowRoot).querySelectorAll("*");

    elements.forEach((element) => {
      /* Skip elements inside template tags
      if (element.closest("template")) {
        console.log("Found stuff inside template", element);
        return;
      }//*/

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
  Array.from(document.querySelectorAll("template[data-name]")).forEach(
    (template) => {
      const elementName = template.dataset.name;

      // Create a custom element class for this template
      const ComponentClass = class extends ComponentRenderer {
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
