// tiny/tests/unit/template-renderer.test.ts
import { assertEquals } from "@std/assert";
import { TemplateRenderer } from "../../src/core/template-renderer.ts";

Deno.test("TemplateRenderer", async (t) => {
  await t.step("renders simple interpolation", () => {
    const template = "Hello, {{name}}!";
    const context = { name: "World" };
    assertEquals(
      TemplateRenderer.render(template, context),
      "Hello, World!",
    );
  });

  await t.step("renders advanced interpolation", () => {
    const template = "Hello, {{profile.name}}!";
    const context = { profile: { name: "World" } };
    assertEquals(
      TemplateRenderer.render(template, context),
      "Hello, World!",
    );
  });

  await t.step("escapes HTML in interpolation", () => {
    const template = "Hello, {{name}}!";
    const context = { name: '<script>alert("XSS")</script>' };
    assertEquals(
      TemplateRenderer.render(template, context),
      "Hello, &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;!",
    );
  });

  await t.step("unescaped HTML in interpolation", () => {
    const template = "Hello, {{{name}}}!";
    const context = { name: '<script>alert("XSS")</script>' };
    assertEquals(
      TemplateRenderer.render(template, context),
      'Hello, <script>alert("XSS")</script>!',
    );
  });

  await t.step("renders sections", () => {
    const template = "{{#users}}{{name}} {{/users}}";
    const context = {
      users: [
        { name: "Alice" },
        { name: "Bob" },
      ],
    };
    assertEquals(
      TemplateRenderer.render(template, context),
      "Alice Bob ",
    );
  });

  await t.step("renders inverted sections", () => {
    const template = "{{^users}}No users{{/users}}";
    const context = { users: [] };
    assertEquals(
      TemplateRenderer.render(template, context),
      "No users",
    );
  });
});
