import Mustache from "./core/template-renderer.ts";
import { parseDataset } from "./dataset-parser.ts";
import { processTemplateCSS } from "./stylis-utils.ts";
import { ContextEvaluator } from "./core/context-evaluator.ts";
import { AttributeProcessor } from "./core/attribute-processor.ts";

export const TemplateRenderer = Mustache;

const knownElements: string[] = [];
/**
 * Initialization options for components
 */
interface InitComponentOptions {
  document?: Document;
  customElements?: CustomElementRegistry;
  HTMLElement?: typeof HTMLElement;
  MutationObserver?: typeof MutationObserver;
  runScripts?: boolean;
}

/**
 * Advanced Web Component Renderer
 * Provides a flexible and extensible rendering mechanism for declarative web components
 */
export default class ComponentRenderer extends HTMLElement {
  template: HTMLTemplateElement;
  context: ComponentRenderer & Record<string, unknown>;
  internals_?: ElementInternals;
  _htmlContent: string = "";
  _events?: Record<string, unknown>;

  /**
   * Initialize the web component
   */
  constructor(template: HTMLTemplateElement) {
    super();
    this.attachShadow({ mode: "open" });

    // Initialize context with dataset and inner HTML
    this.template = template;
    this.context = this as ComponentRenderer & Record<string, unknown>;
    Object.assign(this.context, {
      ...parseDataset(this.dataset),
      "@": this.innerHTML,
      $refs: {},
    });

    this.handleFormElements();
    this.handleExternalMutations();
  }

  /**
   * Handle form-associated elements
   */
  handleFormElements(): void {
    if (
      ["input", "textarea", "select"].includes(this.template.dataset.as || "")
    ) {
      this.internals_ = this.attachInternals?.();
      this.closest("form")?.addEventListener(
        "formdata",
        (event: FormDataEvent) => {
          const formData = event.formData;
          formData.set(
            this.dataset.name || this.getAttribute("name") || "",
            (this as unknown as HTMLInputElement).value,
          );
        },
      );
    }
  }

  /**
   * Handle external mutations to the component's content
   */
  handleExternalMutations(): void {
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
   * @param template - Component's template element
   */
  prepareContent(template: HTMLTemplateElement): void {
    const content = template.content.cloneNode(true) as DocumentFragment;

    // Extract HTML content (excluding scripts)
    this._htmlContent = Array.from(content.children)
      .filter((x) => x.tagName?.toLowerCase() !== "script")
      .map((x) => x.outerHTML || x.nodeValue || "")
      .join("");

    // Process inline script if present
    const scriptElement = content.querySelector("script");
    if (scriptElement && !(scriptElement as HTMLScriptElement).src) {
      this.processInlineScript(scriptElement as HTMLScriptElement);
    }
  }

  /**
   * Process and evaluate inline script content
   * @param scriptElement - Script tag to process
   */
  processInlineScript(scriptElement: HTMLScriptElement): void {
    try {
      const scriptContent = scriptElement.innerHTML?.trim();
      const events = ContextEvaluator.evaluate(
        `(() => { return ${scriptContent}; })()`,
        this.context,
        this,
      ) as Record<string, unknown>;

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
  render(): void {
    try {
      // Render Mustache template
      const renderedContent = Mustache.render(this._htmlContent, this.context);

      // Process CSS
      const processedContent = processTemplateCSS(renderedContent);

      // Update shadow DOM
      if (this.shadowRoot) {
        this.shadowRoot.innerHTML = processedContent;
      }

      // Process dynamic attributes
      this.processDynamicAttributes();
      this.handleEventProcessing();

      // Trigger component rendered lifecycle
      try {
        this.onComponentRendered();
      } catch (lifecycleError) {
        const componentName = this.tagName.toLowerCase() || this.template?.dataset?.name || 'unknown-component';
        console.error(
          `Error in onComponentRendered for component "${componentName}":`,
          lifecycleError
        );
        throw new Error(
          `Component "${componentName}" failed during onComponentRendered: ${(lifecycleError as Error).message}`,
          { cause: lifecycleError }
        );
      }
    } catch (error) {
      const componentName = this.tagName.toLowerCase() || this.template?.dataset?.name || 'unknown-component';
      console.error(`Rendering error in component "${componentName}":`, error);
      throw error;
    }
  }

  /**
   * Lifecycle method called when component is rendered
   */
  onComponentRendered(): void {}

  /**
   * Lifecycle method called when component is mounted
   */
  onComponentMounted(): void {}

  /**
   * Handle event processing for the component
   */
  handleEventProcessing(): void {
    const eventObjects = Object.keys(this).filter((x) =>
      typeof this[x as keyof this] === "object" && this[x as keyof this] &&
      Object.values(this[x as keyof this] as Record<string, Function>).every((
        y,
      ) => typeof y === "function")
    );

    eventObjects.forEach((el) => {
      Object.keys(this[el as keyof this] as Record<string, Function>).forEach(
        (event) => {
          Array.from(this.shadowRoot?.querySelectorAll(el) || []).forEach(
            (ex) => {
              ex?.addEventListener(event, (e) => {
                try {
                  ((this[el as keyof this] as Record<string, Function>)[
                    event
                  ] as Function).call(this, e);
                } catch (ex) {
                  throw new Error(
                    `Unable to handle event ${event} on element ${el} for component ${this.tagName}: ${
                      (ex as Error).message
                    }\n${(ex as Error).stack}`,
                    {
                      cause: ex,
                    },
                  );
                }
              });
            },
          );
        },
      );
    });
  }

  /**
   * Process dynamic attributes across rendered elements
   * @param fragment - Optional fragment to process
   * @param privateContext - Optional private context for processing
   */
  processDynamicAttributes(
    fragment?: DocumentFragment,
    privateContext?: Record<string, unknown>,
  ): void {
    const elements = (fragment ?? this.shadowRoot ?? document).querySelectorAll(
      "*",
    );

    elements.forEach((element: Element) => {
      // Skip elements inside template tags
      if (
        element.parentElement && !!element.parentElement?.closest?.("template")
      ) {
        return;
      }

      // Process each attribute using AttributeProcessor
      Array.from(element.attributes).forEach((attr) => {
        AttributeProcessor.processAttribute(
          element as HTMLElement,
          attr,
          (privateContext ?? this.context) as
            & ComponentRenderer
            & Record<string, unknown>,
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
  connectedCallback(): void {
    if (typeof this.onComponentMounted === "function") {
      try {
        this.onComponentMounted();
      } catch (error) {
        const componentName = this.tagName.toLowerCase() || this.template?.dataset?.name || 'unknown-component';
        console.error(
          `Error in onComponentMounted for component "${componentName}":`,
          error
        );
        throw new Error(
          `Component "${componentName}" failed during onComponentMounted: ${(error as Error).message}`,
          { cause: error }
        );
      }
    }
  }

  /**
   * Lifecycle method when observed attributes change
   * @param name - Attribute name
   */
  attributeChangedCallback(_name: string): void {
    // Update context and re-render
    Object.assign(this.context, parseDataset(this.dataset));
    this.render();
  }
}

/**
 * Initialize web components from template tags
 * @param options - Initialization options
 */
export async function initComponents(
  options: InitComponentOptions = {},
): Promise<void> {
  const {
    document = window.document,
    customElements = window.customElements,
  } = options;

  if (!document) return;

  // Fetch external component definitions
  let components: string[] = [];
  const urls: string[] = [];

  // import all required components using the LINK[rel="html"] tag
  do {
    const div = document.createElement("div");
    components = await Promise.all(
      Array.from(document.querySelectorAll('link[rel="html"]')).map(
        async (link: Element) => {
          const href = (link as HTMLLinkElement).href;
          link.remove();

          // Prevent duplicate fetches
          if (urls.includes(href)) return "";
          urls.push(href);

          return await fetch(new URL(href, location.href)).then((res) =>
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
    (template: Element) => {
      const elementName = (template as HTMLTemplateElement).dataset.name ??
        "not-defined";
      if (knownElements?.includes(elementName)) return;
      knownElements.push(elementName);

      const isFormAssociated = ["input", "textarea", "select"].includes(
        (template as HTMLTemplateElement).dataset.as || "",
      );

      const observedAttributes = template
        ? ((template as HTMLTemplateElement).dataset.attrs?.split(",").map((
          x,
        ) => `data-${x}`) || [])
        : [];

      // Create a custom element class for this template
      const ComponentClass = class extends ComponentRenderer {
        static formAssociated = isFormAssociated;
        static observedAttributes = observedAttributes;

        constructor() {
          super(template as HTMLTemplateElement);
          this.prepareContent(template as HTMLTemplateElement);
          this.render();
        }
      };

      // Define the custom element
      customElements.define(elementName || "", ComponentClass);
    },
  );
}

// Auto-initialize if in browser environment
if (typeof window !== "undefined") {
  initComponents().catch(console.error);
}

export { initComponents as init };
