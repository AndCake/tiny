import "../browser-mocks.js";
import { TemplateRenderer } from "../../src/core/template-renderer.ts";
import { describe, it } from "@std/testing/bdd";
import { JSDOM } from "jsdom";
import { initComponents } from "@andcake/tiny";
import { assertEquals } from "@std/assert";

function renderPage(template, context) {
  return TemplateRenderer.render(template, context);
}

describe("Server-side rendering", () => {
  const template = `
    <div>
      <h1>{{title}}</h1>
      {{#items}}
        <p>{{.}}</p>
      {{/items}}
      <link rel="html" href="/path/to/x-list.html"/>
      <x-list data-items='{{{items}}}'></x-list>
      <script type="module" src="path/to/tiny.js"></script>
    </div>
  `;

  const context = {
    title: "Server-Rendered List",
    items: ["Item 1", "Item 2", "Item 3"],
  };

  it("should allow to render a simple page", () => {
    const rendered = renderPage(template, context);
    assertEquals(
      rendered,
      `
    <div>
      <h1>Server-Rendered List</h1>
      \n        <p>Item 1</p>
      \n        <p>Item 2</p>
      \n        <p>Item 3</p>
      \n      <link rel="html" href="/path/to/x-list.html"/>
      <x-list data-items='["Item 1","Item 2","Item 3"]'></x-list>
      <script type="module" src="path/to/tiny.js"></script>
    </div>
  `,
    );
  });
});
