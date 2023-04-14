/**
THIS LIBRARY HANDLES INITIALIZATION OF DECLARATIVE WEB COMPONENTS

Web Components are declared by creating a template tag with a data-name
attribute. The content of the template tag is then used to define how
it should be rendered.

Example:

<template data-name="x-avatar" data-as="div" data-attrs="user,clicked">
	<style>
		div { display: inline-block; }
		img {
			max-width: 15px;
			border: 0px;
		}
	</style>
	<div>
		<img src="https://ui-avatars.com/api/?name={{user}}"/>
		{{clicked}}
	</div>
	<script>
		{
			img: {    // use a CSS selector here to identify the element
				click: (e) => {   // event handler to attach
					this.counter = (this.counter || 0) + 1;
					this.dataset.clicked = this.counter;
				}
			}
		}
	</script>
</template>

Usage:

<x-avatar data-user="Minkel Hutz"></x-avatar>

Hint:

Custom element name must have a hyphen -, e.g. my-element and super-button are valid names, but myelement is not.
That’s to ensure that there are no name conflicts between built-in and custom HTML elements.

Component definitions can be imported into the page using the LINK tag:

<link rel="html" href="./comment.html"/>

 */
import Mustache from "https://esm.sh/mustache@4.2.0";

// first load all referenced components
export default async function init(
  { document, customElements, HTMLElement, MutationObserver, ...win },
) {
  if (!document) return;
  let components;
  let urls = [];
  do {
    const div = document.createElement("div");
    // fetch the content of all files coming from the href of a link[rel="html"]
    components = await Promise.all(
      Array.from(document.querySelectorAll('link[rel="html"]')).map(
        async (link) => {
          const href = link.href;
          link.remove();
          // make sure we're not fetching stuff more than once
          if (urls.includes(href)) return "";
          urls.push(href);
          return await fetch(href, new URL(location.href)).then((res) =>
            res.status === 200 && res.text() ||
            ("Component " + href + " not found.")
          );
        },
      ),
    );
    if (components.length > 0) {
      // if there are any, add them to the document's head
      div.innerHTML = components.join("");
      document.head.appendChild(div);
    }
  } while (components.length > 0);

  // once all are there, initialize them
  Array.from(document.querySelectorAll("template[data-name]")).forEach(
    (tpl) => {
      const elName = tpl.dataset.name;
      let ParentClass = HTMLElement;
      customElements.define(
        elName,
        class extends ParentClass {
          static formAssociated = ["input", "textarea", "select"].includes(
            tpl.dataset.as || "",
          );
          // make sure we get informed about registered attributes of the tag
          static get observedAttributes() {
            // we're only listening to data attributes
            return tpl.dataset.attrs?.split(",").map((x) => `data-${x}`) || [];
          }

          constructor() {
            super();
            if (
              ["input", "textarea", "select"].includes(tpl.dataset.as || "")
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
            this.context = {
              ...parseDataset(this.dataset),
              "@": this.innerHTML,
            };
            this.attachShadow({ mode: "open" });

            try {
              const content = document.createDocumentFragment();
              content.appendChild(tpl.content.cloneNode(true));

              const htmlContent = Array.from(content.children).filter((x) =>
                x.tagName?.toLowerCase() !== "script"
              ).map((x) => x.outerHTML || x.nodeValue || "").join("");
              this._htmlContent = htmlContent;

              const script = content.querySelector("script");
              if (script && !script.src) {
                // extract them
                const events = eval(
                  "(() => { return " + script.innerHTML?.trim() + "; })()",
                );
                // expose functions defined there to current element
                Object.assign(this, events);
                this._events = events;
              }
            } catch (e) {
              console.log(e);
              throw new Error(
                "Unable to parse script of " + elName + ": " + e.message +
                  ": " + content.querySelector("script").innerHTML?.trim(),
              );
            }
            this.render();

            // if we are interested in getting informed on changes to our content
            if (tpl.dataset.attrs?.includes("@")) {
              // observe it for changes (if changed, re-render)
              const observer = new MutationObserver(() => {
                this.context["@"] = this.innerHTML;
                //console.log("RE-RENDERING", elName);
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

          connectedCallback() {
            if (
              this.onComponentMounted &&
              typeof this.onComponentMounted === "function"
            ) {
              this.onComponentMounted.call(this);
            }
          }

          updateNotification() {
            Array.from(this.shadowRoot.querySelectorAll("*")).forEach((el) => {
              if (!el.hasAttributes()) return;
              for (const attr of el.attributes) {
                if (attr.name.startsWith("@")) {
                  el[`on${attr.name.substr(1)}`] = new Function(
                    "arg0",
                    "event",
                    `with (arg0) { ${attr.value}; } this.render(); `,
                  ).bind(this, { ...this.context, $el: el });
                } else if (attr.name === "x-show") {
                  const doShow = new Function(
                    "arg0",
                    `with (arg0) { return ${attr.value}; }`,
                  ).bind(this, { ...this.context, $el: el });
                  el.hidden = !doShow();
                } else if (attr.name === "x-if") {
                  const doShow = new Function(
                    "arg0",
                    `with (arg0) { return ${attr.value}; }`,
                  ).bind(this, { ...this.context, $el: el });
                  if (!doShow()) {
                    el.remove();
                  }
                } else if (attr.name === "x-html") {
                  const fn = new Function(
                    "arg0",
                    `with (arg0) { return ${attr.value}; }`,
                  ).bind(this, { ...this.context, $el: el });
                  el.innerHTML = fn();
                } else if (attr.name === "x-text") {
                  const fn = new Function(
                    "arg0",
                    `with (arg0) { return ${attr.value}; }`,
                  ).bind(this, { ...this.context, $el: el });
                  el.innerText = fn();
                } else if (attr.name.startsWith(":")) {
                  const fn = new Function(
                    "arg0",
                    `with (arg0) { return ${attr.value}; }`,
                  ).bind(this, { ...this.context, $el: el });
                  const val = fn();
                  if (val) {
                    el.setAttribute(attr.name.substr(1), val);
                  }
                } else if (attr.name === "x-model") {
                  el.onchange = (event) => {
                    this.context[attr.value] = el.value;
                  };
                } else if (attr.name === "x-ref") {
                  this.context.$refs = this.context.$refs || {};
                  this.context.$refs[attr.value] = el;
                }
              }
            });
          }

          // render the custom element by using the template
          render() {
            try {
              // use mustache to replace dynamic parts in the HTML
              this.shadowRoot.innerHTML = Mustache.render(
                this._htmlContent,
                this.context,
              );
            } catch (e) {
              throw new Error(
                "ERROR parsing " + elName + " definition: Mustache error " +
                  e.message,
              );
            }

            this.updateNotification();

            // and attach events them with the re-rendered elements
            Object.keys(this._events || {}).filter((x) =>
              typeof this._events[x] === "object" && this._events[x]
            )
              .forEach((el) => {
                Object.keys(this._events[el]).forEach((event) => {
                  Array.from(this.shadowRoot?.querySelectorAll(el)).forEach(
                    (ex) => {
                      ex?.addEventListener(
                        event,
                        (e) => {
                          try {
                            this._events[el][event](e);
                          } catch (ex) {
                            throw new Error(
                              "Unable to handle event " + event +
                                " on element " + el + " for component " +
                                elName + ": " + ex.message,
                            );
                          }
                        },
                      );
                    },
                  );
                });
              });
          }

          // whenever a registered attribute changes, re-render
          attributeChangedCallback(...args) {
            //console.log("attribute changed", elName, args);
            Object.assign(this.context, parseDataset(this.dataset));
            this.render();
          }
        },
      );
    },
  );
}

await init(window);
window?.document?.documentElement?.classList.add("tiny-loaded");

function safeParse(data) {
  if (data.startsWith("{") || data.startsWith("[") || data.startsWith('"')) {
    try {
      const val = JSON.parse(data);
      val.json = data;
      return val;
    } catch (e) {
      return data;
    }
  }
  return data;
}

// just in case we want to transfer JSON data in the dataset
// we have this parser here...
function parseDataset(dataset) {
  return (Object.keys(dataset).reduce(
    (acc, key) => ({ ...acc, [key]: safeParse(dataset[key]) }),
    {},
  ));
}
