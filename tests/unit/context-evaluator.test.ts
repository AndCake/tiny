// tiny/tests/unit/context-evaluator.test.ts
import { assertEquals } from "@std/assert";
import { ContextEvaluator } from "../../src/core/context-evaluator.ts";

Deno.test("ContextEvaluator", async (t) => {
  await t.step("evaluate simple expressions", () => {
    const context = { x: 10, y: 20 };
    assertEquals(
      ContextEvaluator.evaluate("x + y", context),
      30,
    );
  });

  await t.step("handles object property access", () => {
    const context = { user: { name: "John" } };
    assertEquals(
      ContextEvaluator.evaluate("user.name", context),
      "John",
    );
  });

  await t.step("parseContextValue returns parsed value", () => {
    const context = { count: 42 };
    assertEquals(
      ContextEvaluator.parseContextValue("count", context),
      42,
    );
  });

  await t.step("parseContextValue returns default value", () => {
    const context = {};
    assertEquals(
      ContextEvaluator.parseContextValue("nonexistent", context, "default"),
      "default",
    );
  });
});
