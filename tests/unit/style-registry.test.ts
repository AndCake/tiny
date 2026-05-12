// tiny/tests/unit/style-registry.test.ts
import { afterEach, describe, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import {
  clearStyles,
  defineStyles,
  getStyles,
  styleObjectToCss,
} from "../../src/style-registry.ts";

describe("styleObjectToCss", () => {
  it("converts camelCase keys to kebab-case", () => {
    assertEquals(
      styleObjectToCss({ borderRadius: "8px", backgroundColor: "red" }),
      "border-radius: 8px; background-color: red",
    );
  });

  it("preserves CSS custom properties verbatim", () => {
    assertEquals(
      styleObjectToCss({ "--primary": "#007bff" }),
      "--primary: #007bff",
    );
  });

  it("vendor-prefixes leading-uppercase keys", () => {
    assertEquals(
      styleObjectToCss({ WebkitTransform: "scale(1.2)" }),
      "-webkit-transform: scale(1.2)",
    );
  });

  it("skips null, undefined, and false values", () => {
    assertEquals(
      styleObjectToCss({
        color: "red",
        padding: null,
        margin: undefined,
        border: false,
      }),
      "color: red",
    );
  });

  it("keeps the number 0 — only falsy-but-not-zero is dropped", () => {
    assertEquals(
      styleObjectToCss({ zIndex: 0, opacity: 0 }),
      "z-index: 0; opacity: 0",
    );
  });

  it("skips nested objects (selectors/media belong in <style>)", () => {
    assertEquals(
      styleObjectToCss({
        color: "red",
        "&:hover": { color: "blue" },
      }),
      "color: red",
    );
  });

  it("does not auto-append px — values are passed through", () => {
    assertEquals(
      styleObjectToCss({ padding: 16, lineHeight: 1.5 }),
      "padding: 16; line-height: 1.5",
    );
  });

  it("returns empty string for an empty object", () => {
    assertEquals(styleObjectToCss({}), "");
  });
});

describe("style registry", () => {
  afterEach(() => clearStyles());

  it("stores styles under a namespace", () => {
    defineStyles("theme", { card: { padding: "1rem" } });
    assertEquals(getStyles().theme.card, { padding: "1rem" });
  });

  it("merges keys when the same namespace is defined again", () => {
    defineStyles("theme", { card: { padding: "1rem" } });
    defineStyles("theme", { button: { cursor: "pointer" } });
    assertEquals(getStyles().theme, {
      card: { padding: "1rem" },
      button: { cursor: "pointer" },
    });
  });

  it("overrides a key when redefined with the same name", () => {
    defineStyles("theme", { card: { padding: "1rem" } });
    defineStyles("theme", { card: { padding: "2rem" } });
    assertEquals(getStyles().theme.card, { padding: "2rem" });
  });

  it("returns a live reference — late definitions are visible", () => {
    const live = getStyles();
    defineStyles("late", { foo: { color: "red" } });
    assertEquals(live.late.foo, { color: "red" });
  });
});
