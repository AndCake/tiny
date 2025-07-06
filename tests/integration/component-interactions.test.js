// tiny/tests/integration/component-interactions.test.ts
import "../browser-mocks.js";
import { assertEquals, assertExists } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { initComponents } from "../../src/component-renderer.js";

describe("Component Interactions", () => {
  let container;

  // Setup before each test
  beforeEach(() => {
    // Create a container for our test components
    container = document.createElement("div");
    document.body.appendChild(container);

    // Create a template for a parent-child interaction component
    const template = document.createElement("div");
    template.innerHTML = `
      <template data-name="x-parent-component" data-attrs="childMessage">
        <div>
          <span>{{childMessage}}</span>
          <x-child-component @update-message="this.updateMessage($event)"></x-child-component>
        </div>
        <script>
        ({
          childMessage: 'Initial Message',
          updateMessage(event) {
            this.childMessage = event.detail.message;
          }
        })
        </script>
      </template>

      <template data-name="x-child-component">
        <button @click="this.sendMessage()">Update</button>
        <script>
        ({
          sendMessage() {
            const event = new CustomEvent('update-message', {
              detail: { message: 'Updated from child' },
              bubbles: true
            });
            this.dispatchEvent(event);
          }
        })
        </script>
      </template>
    `;
    container.appendChild(template);
  });

  // Cleanup after each test
  afterEach(() => {
    document.body.removeChild(container);
  });

  it("parent-child component communication", async () => {
    // Create parent component
    const parentComponent = document.createElement("x-parent-component");
    container.appendChild(parentComponent);

    // Initialize components
    await initComponents({ document });

    // Wait for render and component initialization
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Find child button and trigger click
    const childComponent = parentComponent.shadowRoot?.querySelector(
      "x-child-component",
    );
    assertExists(childComponent, "Child wasn't rendered");
    const childButton = childComponent.shadowRoot?.querySelector("button");
    assertExists(childButton);
    childButton.click();

    // Wait for render
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Check if parent component's message was updated
    const messageSpan = parentComponent.shadowRoot?.querySelector("span");
    assertExists(messageSpan);
    assertEquals(messageSpan.textContent, "Updated from child");
  });
});
