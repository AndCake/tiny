// Test for improved error reporting in attributes
import { assertEquals } from "@std/assert";
import { ContextEvaluator } from "../../src/core/context-evaluator.ts";
import { AttributeProcessor } from "../../src/core/attribute-processor.ts";
import { DOMParser } from "linkedom";

Deno.test("Error reporting with component context", async (t) => {
  await t.step("should include component name and attribute in error", () => {
    const document = new DOMParser().parseFromString(
      `<div id="test"></div>`,
      "text/html",
    );
    const element = document.getElementById("test")!;
    const context = { user: { name: "John" } };

    // Capture console.error output
    let errorOutput = "";
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      errorOutput = args.map(a => String(a)).join(" ");
    };

    try {
      // Try to evaluate an expression that references an undefined variable
      ContextEvaluator.evaluate(
        "undefinedVar.name",
        context,
        element,
        {
          componentName: "my-component",
          attributeName: "x-text",
        },
      );

      // Check that the error message includes component and attribute info
      assertEquals(
        errorOutput.includes("component <my-component>"),
        true,
        "Error should mention component name",
      );
      assertEquals(
        errorOutput.includes('attribute "x-text"'),
        true,
        "Error should mention attribute name",
      );
      assertEquals(
        errorOutput.includes("undefinedVar.name"),
        true,
        "Error should include the expression",
      );
      assertEquals(
        errorOutput.includes("<div"),
        true,
        "Error should include element info",
      );
    } finally {
      console.error = originalError;
    }
  });

  await t.step("should work without component context (backward compatible)", () => {
    const document = new DOMParser().parseFromString(
      `<input />`,
      "text/html",
    );
    const element = document.querySelector("input")!;
    const context = {};

    let errorOutput = "";
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      errorOutput = args.map(a => String(a)).join(" ");
    };

    try {
      // Should work without error context
      ContextEvaluator.evaluate(
        "someUndefined",
        context,
        element as HTMLElement,
      );

      // Should still include element info
      assertEquals(
        errorOutput.includes("<input"),
        true,
        "Error should include element info even without component context",
      );
      assertEquals(
        errorOutput.includes("someUndefined"),
        true,
        "Error should include expression",
      );
    } finally {
      console.error = originalError;
    }
  });
});
