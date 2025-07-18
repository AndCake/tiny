// tiny/tests/unit/attribute-processor.test.ts
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { assert, assertEquals, assertFalse } from "@std/assert";
import { AttributeProcessor } from "../../src/core/attribute-processor.ts";
import { DOMParser } from "linkedom";
import type ComponentRenderer from "../../src/component-renderer.ts";

describe("AttributeProcessor", () => {
  let element: HTMLElement;
  let context: ComponentRenderer & Record<string, unknown>;
  const document = new DOMParser().parseFromString(
    `<body></body>`,
    "text/html",
  );

  // Setup before each test
  beforeEach(() => {
    // Create a test element
    element = document.createElement("div", undefined);
    document.body.appendChild(element);

    // Setup mock context
    context = {
      ...element,
      items: ["apple", "banana", "cherry"],
      isVisible: true,
      user: { name: "John", active: true },
      message: "Hello, World!",
    } as unknown as ComponentRenderer & Record<string, unknown>;
  });

  // Cleanup after each test
  afterEach(() => {
    element.remove();
  });

  it("x-show attribute shows element when condition is true", () => {
    const attribute = { name: "x-show", value: "isVisible" } as Attr;
    AttributeProcessor.processAttribute(
      element,
      attribute,
      context,
      () => {},
    );
    assertFalse(element.hidden);
  });

  it("x-show attribute hides element when condition is false", () => {
    const attribute = { name: "x-show", value: "!isVisible" } as Attr;
    AttributeProcessor.processAttribute(
      element,
      attribute,
      context,
      () => {},
    );
    assert(element.hidden);
  });

  it("x-if attribute removes element when condition is false", () => {
    const attribute = { name: "x-if", value: "!user.active" } as Attr;
    AttributeProcessor.processAttribute(
      element,
      attribute,
      context,
      () => {},
    );
    assertFalse(document.body.contains(element));
  });

  it("x-html attribute sets innerHTML", () => {
    const attribute = { name: "x-html", value: "message" } as Attr;
    AttributeProcessor.processAttribute(
      element,
      attribute,
      context,
      () => {},
    );
    assertEquals(element.innerHTML, "Hello, World!");
  });

  it("x-text attribute sets textContent", () => {
    const attribute = { name: "x-text", value: "message" } as Attr;
    AttributeProcessor.processAttribute(
      element,
      attribute,
      context,
      () => {},
    );
    assertEquals(element.textContent, "Hello, World!");
  });

  it("can handle access to this.context attributes", () => {
    const attribute = {
      name: "x-if",
      value: 'this.context.message.includes("!")',
    } as Attr;
    AttributeProcessor.processAttribute(
      element,
      attribute,
      context,
      () => {},
    );
    assert(document.body.contains(element));
  });
});
