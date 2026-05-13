# Tiny Web Components Framework

## Overview

Tiny Web Components is a lightweight, declarative library for creating custom web components with dynamic rendering, server-side rendering support, and advanced CSS processing. It uses a template-based approach with Mustache-like syntax and supports modern web component APIs.

**Key characteristics:**
- Lightweight (~6KB gzipped)
- No external dependencies (except Stylis for CSS processing)
- Framework-agnostic
- Supports both client-side and server-side rendering
- Template-driven component definition
- Automatic CSS compilation with vendor prefixing

---

## Core Architecture

### Component Lifecycle

1. **Template Registration**: Define components using `<template data-name="x-component-name">` tags
2. **Initialization**: Call `init()` to register custom elements
3. **Component Creation**: Browser creates new element instances
4. **Constructor**: Sets up context and initializes shadow DOM
5. **onComponentMounted()**: Called when component is added to DOM
6. **Attribute Changes**: `attributeChangedCallback()` triggers re-renders
7. **onComponentRendered()**: Called after each render cycle

### Template Structure

All components are defined using HTML `<template>` elements with three main sections:

```html
<template data-name="component-name" data-attrs="attr1,attr2" data-as="input">
  <!-- Optional: Style block -->
  <style>
    /* CSS with advanced processing via Stylis */
  </style>

  <!-- HTML content with template syntax -->
  <div>{{data}}</div>

  <!-- Optional: Script with initial context -->
  <script>
  {
    data: "initial value",
    method() { /* code */ }
  }
  </script>
</template>
```

### Template Attributes

- **`data-name`** (required): Custom element tag name (e.g., "x-user-card")
- **`data-attrs`** (optional): Comma-separated list of observed attributes (without "data-" prefix)
- **`data-as`** (optional): Form association type - "input", "textarea", or "select" for form-associated components

---

## Component Definition

### Basic Component Example

```html
<template data-name="x-counter" data-attrs="initialValue">
  <style>
    .counter {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    button {
      padding: 0.5rem 1rem;
      cursor: pointer;
    }
    .count {
      font-size: 1.5rem;
      font-weight: bold;
    }
  </style>

  <div class="counter">
    <button @click="decrement()">-</button>
    <span class="count">{{count}}</span>
    <button @click="increment()">+</button>
  </div>

  <script>
  {
    count: 0,
    increment() {
      this.count++;
      this.render?.();
    },
    decrement() {
      this.count--;
      this.render?.();
    },
    onComponentMounted() {
      if (this.dataset?.initialValue) {
        this.count = parseInt(this.dataset.initialValue);
      }
    }
  }
  </script>
</template>
```

### Using Components

```html
<x-counter data-initial-value="5"></x-counter>
```

---

## Template Syntax

### Interpolation

**Escaped HTML (safe for user input):**
```mustache
<p>Hello {{username}}</p>
```

**Unescaped HTML (allows HTML content):**
```mustache
<div>{{{richHtmlContent}}}</div>
```

### Sections (Loops)

Render content for each item in an array:
```mustache
{{#items}}
  <div>
    <h3>{{name}}</h3>
    <p>Price: ${{price}}</p>
  </div>
{{/items}}
```

Within sections, you have access to:
- `{{.}}` - The current item itself
- `{{propertyName}}` - Properties of the current item
- Parent context is also available

### Inverted Sections

Render when value is falsy or empty array:
```mustache
{{^items}}
  <p>No items found</p>
{{/items}}
```

### Context Resolution

Values are resolved from the component context using dot notation:
```mustache
{{user}}                    <!-- Simple property -->
{{user.profile.name}}       <!-- Nested property -->
{{user.0.id}}              <!-- Array index -->
```

---

## Dynamic Attributes

Dynamic attributes provide reactive behavior within templates.

### x-show: Conditional Visibility

Hide/show element based on condition (CSS display property):
```html
<div x-show="isVisible">Shown only if isVisible is truthy</div>
<button x-show="!isLoading">Click me</button>
```

### x-if: Conditional Rendering

Remove/add element from DOM based on condition:
```html
<div x-if="showContent">
  This entire element is removed from DOM if showContent is falsy
</div>
```

### x-for: List Rendering

Create elements for each item in an array (more flexible than {{#items}}):
```html
<template x-for="item of items" x-key="item.id">
  <div>{{item.name}} - ${{item.price}}</div>
</template>
```

The iteration variable (e.g., `item`) becomes available in the template context.

### x-model: Two-Way Binding

Bind input values bidirectionally to component context:
```html
<input type="text" x-model="username">
<input type="email" x-model="user.email">
<textarea x-model="description"></textarea>
```

Supports all input types and form elements. Changes to input automatically update the context, and context changes trigger re-renders.

### x-ref: Element References

Create references to elements for direct DOM access:
```html
<input x-ref="searchInput" type="text">
<button @click="focusSearch()">Focus Search</button>

<script>
{
  focusSearch() {
    this.$refs.searchInput.focus();
  }
}
</script>
```

References are stored in `this.$refs` object and automatically available.

### x-html: Raw HTML Content

Set element's innerHTML to a template value:
```html
<div x-html="dynamicHtmlString"></div>
```

The content is not escaped, use with caution.

### x-text: Text Content

Set element's textContent to a template value:
```html
<span x-text="message"></span>
```

This is safer than x-html as it always escapes content.

### :style with Object Values

The `:style` dynamic attribute accepts both strings and plain JS objects. Object keys are converted from camelCase to kebab-case automatically:

```html
<!-- String form (unchanged) -->
<div :style="'color: red; font-size: 14px'"></div>

<!-- Object form -->
<div :style="{ color: 'red', fontSize: '14px', '--my-var': '1rem' }"></div>

<!-- Compose from $styles registry -->
<div :style="{ ...$styles.theme.card, opacity: isActive ? 1 : 0.4 }"></div>
```

Rules for object values:
- `null`, `undefined`, and `false` values are skipped (safe for conditional spreads)
- Numbers are stringified as-is — no automatic `px` suffix; pass `"16px"` or `"1rem"` explicitly
- Nested objects are skipped (media queries/selectors belong in `<style>`)
- CSS custom properties (`--my-var`) pass through unchanged
- Leading-uppercase keys get a vendor prefix (`WebkitTransform` → `-webkit-transform`)

---

## Event Handling

### Event Listener Syntax

Use `@eventName` to attach event listeners:
```html
<button @click="handleClick()">Click me</button>
<input @change="handleChange()" type="text">
<div @mouseover="onHover()">Hover me</div>
```

### Event Handler Definition

Define handlers in the component script:
```html
<script>
{
  buttonState: false,
  handleClick() {
    this.buttonState = !this.buttonState;
  },
  handleChange() {
    console.log('Changed!');
  },
  onHover() {
    // Handle hover
  }
}
</script>
```

### Preventing Re-render After an Event

By default, every event handler triggers a re-render. Return `true` from a handler to skip it:

```html
<input @input="handleInput($event)">

<script>
{
  handleInput(event) {
    // Update something outside component state — no re-render needed
    this.externalService.update(event.target.value);
    return true; // suppress the automatic re-render
  }
}
</script>
```

This is useful for handlers that perform side effects only, or that manage their own DOM updates, and where triggering the full render cycle would cause flicker or redundant work.

### Event Object Access

Event handlers receive the native DOM event:
```html
<input @input="handleInput($event)" type="text">

<script>
{
  handleInput(event) {
    const value = event.target.value;
    this.inputValue = value;
  }
}
</script>
```

### Custom Events

Listen to custom events from child components:
```html
<x-dialog @close="handleDialogClose()"></x-dialog>

<script>
{
  handleDialogClose() {
    this.showDialog = false;
  }
}
</script>
```

---

## Lifecycle Methods

### onComponentMounted()

Called when component is added to the DOM (analogous to `connectedCallback`):
```javascript
onComponentMounted() {
  // Perform initialization, fetch data, set up listeners
  console.log('Component mounted');
  this.loadData();
}
```

**Use for:**
- Initial data fetching
- Setting up event listeners
- Initializing third-party libraries
- Setting default values from attributes

### onComponentRendered()

Called after each render cycle (after template is rendered and dynamic attributes processed):
```javascript
onComponentRendered() {
  // React to DOM changes
  console.log('Component rendered');
  // Update non-reactive state, animations, etc.
}
```

**Use for:**
- Running animations
- Measuring elements
- Updating external state
- Triggering side effects after DOM updates

---

## Data Binding

### Initial Context

Data from the component script becomes the template context:
```html
<template data-name="x-profile">
  <div>
    <h2>{{user.name}}</h2>
    <p>Email: {{user.email}}</p>
  </div>

  <script>
  {
    user: {
      name: 'John Doe',
      email: 'john@example.com'
    }
  }
  </script>
</template>
```

### Attribute Data Binding

Data attributes are automatically parsed and merged into context:
```html
<template data-name="x-product" data-attrs="id,category">
  <div>
    <h3>{{title}}</h3>
    <span>ID: {{dataset.id}}</span>
    <span>Category: {{dataset.category}}</span>
  </div>

  <script>
  {
    title: 'Default Title'
  }
  </script>
</template>

<!-- Usage -->
<x-product data-id="123" data-category="electronics"></x-product>
```

Data attributes are parsed with type inference (numbers, booleans, JSON objects).

### Reactive Updates

Modifying context directly triggers re-renders:
```javascript
// This will trigger a re-render
this.count = 10;

// Modifying nested objects also triggers re-renders
this.user.name = 'Jane Doe';

// Array modifications trigger re-renders
this.items.push(newItem);
this.items.splice(0, 1);
```

---

## CSS Processing

Tiny Web Components uses **Stylis** for advanced CSS processing with automatic vendor prefixing and modern CSS features.

### Nested CSS Rules

Write nested selectors similar to Sass/SCSS:
```html
<style>
  .card {
    padding: 1rem;
    border: 1px solid #ddd;

    .header {
      font-size: 1.2rem;
      font-weight: bold;
    }

    .content {
      color: #666;

      p {
        margin: 0.5rem 0;
      }
    }
  }
</style>
```

### Parent Selector (&)

Reference parent selector in nested rules:
```html
<style>
  .button {
    padding: 0.5rem 1rem;
    border: none;

    &.primary {
      background: #007bff;
      color: white;

      &:hover {
        background: #0056b3;
      }
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    &:nth-child(odd) {
      background: #f5f5f5;
    }
  }
</style>
```

### Vendor Prefixing

Automatic vendor prefixes for non-standard properties:
```html
<style>
  .box {
    user-select: none;        /* Becomes -webkit-user-select, -moz-user-select, etc. */
    transform: scale(1.5);    /* Becomes -webkit-transform, etc. */
    backdrop-filter: blur(10px);
  }
</style>
```

### Media Queries

Full support for media queries with nesting:
```html
<style>
  .grid {
    display: grid;
    grid-template-columns: 1fr;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (min-width: 1024px) {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>
```

### CSS Variables (Custom Properties)

Use CSS custom properties for theming:
```html
<style>
  :host {
    --primary-color: #007bff;
    --secondary-color: #6c757d;
    --spacing-unit: 1rem;
  }

  .component {
    background: var(--primary-color);
    margin: var(--spacing-unit);
    padding: calc(var(--spacing-unit) * 2);
  }
</style>
```

### Keyframe Animations

Define and use CSS animations:
```html
<style>
  @keyframes slideIn {
    from {
      transform: translateX(-100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .animated {
    animation: slideIn 0.5s ease-in-out;
  }
</style>
```

---

## Server-Side Rendering (SSR)

Tiny Web Components supports server-side rendering using the `TemplateRenderer`:

### Basic SSR Example

```javascript
import { TemplateRenderer } from '@andcake/tiny';

const template = `
  <h1>{{title}}</h1>
  {{#items}}
    <li>{{name}} - ${{price}}</li>
  {{/items}}
`;

const context = {
  title: 'Products',
  items: [
    { name: 'Item 1', price: 10 },
    { name: 'Item 2', price: 20 }
  ]
};

const html = TemplateRenderer.render(template, context);
```

### Server + Client Hydration

1. **Server-side**: Render initial HTML with server context
2. **Client-side**: Load script and call `init()` to add interactivity
3. **Hydration**: Existing DOM elements are enhanced with component logic

```html
<!-- Server-rendered HTML -->
<x-list data-items='[{"name":"Item1"},{"name":"Item2"}]'></x-list>

<!-- Client-side initialization -->
<script type="module">
  import { init } from '@andcake/tiny';
  init();
</script>
```

### Importing External Components

For SSR, components can be imported using `<link rel="html">`:
```html
<link rel="html" href="/components/x-card.html">
<link rel="html" href="/components/x-button.html">

<x-card></x-card>
<x-button>Click me</x-button>
```

The framework automatically fetches and registers these components.

---

## Form-Associated Components

Create custom form elements that work with standard form APIs:

```html
<template data-name="x-custom-input" data-as="input">
  <input type="text" x-model="value">

  <script>
  {
    value: '',
    onComponentMounted() {
      this.internals_ = this.attachInternals?.();
    }
  }
  </script>
</template>

<!-- Usage in form -->
<form>
  <x-custom-input name="custom-field"></x-custom-input>
  <button type="submit">Submit</button>
</form>
```

Values are automatically included in `FormData` when the form is submitted.

---

## API Reference

### Initialization

```javascript
import { init } from '@andcake/tiny';

// Initialize with options
await init({
  window: window,        // Custom window object (for SSR)
  runScripts: true      // Execute inline scripts (default: true)
});
```

### Template Rendering

```javascript
import { TemplateRenderer } from '@andcake/tiny';

const html = TemplateRenderer.render(template, context);
```

### Style Registry

Register reusable style token objects that become available inside every component as `$styles`:

```javascript
import { defineStyles, styleObjectToCss } from '@andcake/tiny';

// Register a namespace of style objects
defineStyles('theme', {
  card: {
    background: 'white',
    borderRadius: '8px',
    padding: '1rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  button: {
    padding: '0.5rem 1rem',
    cursor: 'pointer',
  },
});

// Convert a style object to a CSS declaration string manually
const cssText = styleObjectToCss({ color: 'red', fontSize: '14px' });
// → "color: red; font-size: 14px"
```

Use inside a component template via `$styles`:

```html
<div :style="$styles.theme.card">...</div>
<button :style="{ ...$styles.theme.button, background: isActive ? '#007bff' : '#ccc' }">
  Click
</button>
```

`defineStyles` merges into an existing namespace if called again with the same name. The registry is a live reference — styles defined after a component mounts are visible on its next render.

### CSS Compilation

```javascript
import { compileCSS } from '@andcake/tiny';

const processedCSS = compileCSS(rawCSS);
```

### Dataset Parsing

```javascript
import { parseDataset } from '@andcake/tiny';

const parsedData = parseDataset(element.dataset);
```

### Component Instance Methods

All custom elements inherit from `ComponentRenderer` and have access to:

```javascript
// Re-render the component
this.render();

// Component context/state
this.context

// Shadow DOM root
this.shadowRoot

// Element references
this.$refs.refName

// Template element
this.template

// Inner HTML as context variable
this.innerHTML  // Available as "@" in context
```

---

## Best Practices

### State Management

1. **Keep state in component**: Store all reactive data in the component script context
2. **Use clear naming**: Name properties descriptively (e.g., `isLoading`, `visibleItems`)
3. **Immutable patterns**: For complex updates, consider creating new objects instead of mutations

```html
<script>
{
  items: [],
  isLoading: false,
  addItem(name) {
    // Good: Create new array for reactivity
    this.items = [...this.items, { name, id: Date.now() }];
  },
  removeItem(id) {
    // Also good: Explicit assignment triggers reactivity
    this.items = this.items.filter(item => item.id !== id);
  }
}
</script>
```

### Performance

1. **Use x-show for frequent toggling**: Better than x-if for elements that toggle often
2. **Use x-if for rare visibility**: Completely removes from DOM
3. **Batch updates**: Update multiple properties before letting render cycle run
4. **Avoid excessive nesting**: Keep component hierarchy shallow

### Security

1. **Use `{{variable}}` for user input**: Automatically escapes HTML
2. **Use `{{{html}}}` only for trusted content**: Never with user input
3. **Validate attribute data**: Parse and validate `data-*` attributes
4. **Be careful with x-html**: Only use with trusted content

### Component Organization

```html
<!-- Well-structured component -->
<template data-name="x-user-card" data-attrs="userId">
  <style>
    /* Component styles */
  </style>

  <div class="user-card">
    <!-- Template markup -->
  </div>

  <script>
  {
    // Data/State
    user: null,
    isLoading: true,

    // Computed properties
    get displayName() { return this.user?.name || 'Unknown'; },

    // Methods
    async loadUser() { /* ... */ },
    handleAction() { /* ... */ },

    // Lifecycle
    onComponentMounted() { /* Initialize */ },
    onComponentRendered() { /* After render */ }
  }
  </script>
</template>
```

---

## Common Patterns

### Modal Component

```html
<template data-name="x-modal" data-attrs="open">
  <style>
    .modal-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
    }

    .modal-overlay.open {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }
  </style>

  <div class="modal-overlay" :class="{ open: isOpen }">
    <div class="modal-content">
      <button @click="close()">×</button>
      <slot></slot>
    </div>
  </div>

  <script>
  {
    isOpen: false,
    close() {
      this.isOpen = false;
    },
    onComponentMounted() {
      this.isOpen = this.dataset?.open === 'true';
    }
  }
  </script>
</template>
```

### Form with Validation

```html
<template data-name="x-form">
  <style>
    .form-field {
      margin-bottom: 1rem;
    }
    .error {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
    input.invalid {
      border-color: #dc3545;
    }
  </style>

  <form @submit="handleSubmit($event)">
    <div class="form-field">
      <input
        x-model="email"
        type="email"
        placeholder="Email"
        @blur="validateField('email')"
        :class="{ invalid: errors.email }"
      >
      {{#errors.email}}
        <div class="error">{{.}}</div>
      {{/errors.email}}
    </div>
    <button type="submit" :disabled="!isValid">Submit</button>
  </form>

  <script>
  {
    email: '',
    errors: {},
    validateField(fieldName) {
      if (fieldName === 'email' && !this.email.includes('@')) {
        this.errors.email = 'Invalid email';
      } else {
        delete this.errors.email;
      }
    },
    get isValid() {
      return this.email && Object.keys(this.errors).length === 0;
    },
    handleSubmit(event) {
      event.preventDefault();
      if (this.isValid) {
        console.log('Form submitted:', this.email);
      }
    }
  }
  </script>
</template>
```

### Data Table with Pagination

```html
<template data-name="x-data-table" data-attrs="items,pageSize">
  <style>
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background: #f8f9fa;
      font-weight: bold;
    }
    .pagination {
      margin-top: 1rem;
      display: flex;
      gap: 0.5rem;
    }
  </style>

  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      {{#displayedItems}}
        <tr>
          <td>{{name}}</td>
          <td>{{email}}</td>
          <td>{{status}}</td>
        </tr>
      {{/displayedItems}}
    </tbody>
  </table>

  <div class="pagination">
    <button @click="previousPage()" :disabled="currentPage === 1">Previous</button>
    <span>Page {{currentPage}} of {{totalPages}}</span>
    <button @click="nextPage()" :disabled="currentPage === totalPages">Next</button>
  </div>

  <script>
  {
    items: [],
    pageSize: 10,
    currentPage: 1,
    get totalPages() {
      return Math.ceil(this.items.length / this.pageSize);
    },
    get displayedItems() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.items.slice(start, start + this.pageSize);
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    },
    previousPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    }
  }
  </script>
</template>
```

---

## Component Loading and Dependencies

One of the most powerful features of Tiny Web Components is automatic dependency management through HTML link tags. This eliminates the need to manually track and load all components in the correct order.

### Basic Component Loading

Load components using standard HTML link tags with `rel="html"`:

```html
<head>
  <link rel="html" href="/components/x-button.html">
  <link rel="html" href="/components/x-card.html">
</head>
<body>
  <x-card>
    <x-button>Click me</x-button>
  </x-card>

  <script src="tiny.min.js"></script>
</body>
```

The framework automatically fetches each HTML file, registers the templates, and initializes the components.

### Declaring Component Dependencies

Each component can declare its dependencies by including link tags **before** the template definition. This ensures that any component it relies on is loaded first:

```html
<!-- x-user-card.html -->
<!-- Dependencies -->
<link rel="html" href="/components/x-avatar.html">
<link rel="html" href="/components/x-button.html">

<template data-name="x-user-card">
  <!-- Now safe to use x-avatar and x-button without worrying about load order -->
  <div class="user-card">
    <x-avatar data-name="John Doe"></x-avatar>
    <h3>John Doe</h3>
    <x-button @click="sendMessage()">Message</x-button>
  </div>

  <script>
  {
    sendMessage() {
      console.log('Message sent');
    }
  }
  </script>
</template>
```

### Dependency Graph Resolution

When you load a root component, the framework automatically resolves and loads the entire dependency graph:

```html
<!-- index.html -->
<head>
  <!-- Only need to load the root component -->
  <link rel="html" href="/components/x-app.html">
</head>
```

The `x-app.html` component's dependencies are loaded, and their dependencies are loaded transitively. This eliminates the need to manage the entire dependency tree manually.

### Example: Multi-Level Dependencies

```html
<!-- x-app.html -->
<link rel="html" href="/components/x-header.html">
<link rel="html" href="/components/x-sidebar.html">
<link rel="html" href="/components/x-content.html">

<template data-name="x-app">
  <!-- Layout -->
</template>
```

```html
<!-- x-header.html -->
<link rel="html" href="/components/x-nav.html">
<link rel="html" href="/components/x-logo.html">

<template data-name="x-header">
  <!-- Header content -->
</template>
```

```html
<!-- x-nav.html -->
<link rel="html" href="/components/x-nav-item.html">

<template data-name="x-nav">
  <!-- Navigation -->
</template>
```

When you load `x-app.html`, the framework automatically loads:
- `x-header.html` → which loads `x-nav.html` → which loads `x-nav-item.html`
- `x-logo.html`
- `x-sidebar.html`
- `x-content.html`

All dependencies are resolved and loaded in the correct order without you specifying them in the root HTML file.

### Circular Dependencies

The framework handles circular dependencies gracefully by tracking loaded components. If component A requires B and B requires A, both are loaded exactly once:

```html
<!-- x-parent.html -->
<link rel="html" href="/components/x-child.html">

<template data-name="x-parent">
  <x-child></x-child>
</template>
```

```html
<!-- x-child.html -->
<link rel="html" href="/components/x-parent.html">

<template data-name="x-child">
  <div>I can reference x-parent if needed via event emission</div>
</template>
```

### Best Practices for Component Dependencies

1. **Declare all child components**: If a component uses another component in its template, declare that dependency:
   ```html
   <!-- Bad: x-list.html uses x-list-item but doesn't declare it -->
   <template data-name="x-list">
     {{#items}}<x-list-item data-item="{{.}}"></x-list-item>{{/items}}
   </template>

   <!-- Good: Dependencies are explicit -->
   <link rel="html" href="/components/x-list-item.html">
   <template data-name="x-list">
     {{#items}}<x-list-item data-item="{{.}}"></x-list-item>{{/items}}
   </template>
   ```

2. **Use only root component in HTML**: When all dependencies are declared, you only need to include the root component:
   ```html
   <!-- Simple and clean -->
   <link rel="html" href="/components/x-app.html">
   ```

3. **Avoid redundant declarations**: Don't declare the same dependency in multiple files. The framework prevents duplicate loading:
   ```html
   <!-- x-sidebar.html -->
   <link rel="html" href="/components/x-button.html">

   <!-- x-content.html -->
   <link rel="html" href="/components/x-button.html">

   <!-- Both can safely declare the same dependency - it loads only once -->
   ```

4. **Keep dependencies minimal**: Only declare components you actually use to keep load times efficient

---

## Troubleshooting

### Component Not Registering
- Ensure `<template data-name="...">` tag is in the document before calling `init()`
- Check that the tag name follows custom element naming conventions (contains hyphen)
- Verify `init()` is called after templates are in the DOM

### Template Not Rendering
- Check context data is properly set in the script block
- Verify mustache syntax: `{{variable}}` for escaped, `{{{html}}}` for unescaped
- Check browser console for error messages

### Reading Error Messages

Expression evaluation errors now include structured context to help pinpoint the problem:

```
Expression evaluation error in component <x-my-card>, attribute ":class", element <div.card-body>:
  Expression: { active: isActive, highlight }
  Error: highlight is not defined
```

Event handler errors follow the same format:

```
Event handler error in component <x-counter>, event handler (button):
  Handler: increment()
  Element: <button#inc.btn>
  Error: increment is not a function
```

### Two-Way Binding Not Working
- Ensure `x-model` is used on form elements (input, textarea, select)
- Verify the bound property exists in the component context
- Note that direct property mutations should trigger re-renders automatically

### Styles Not Applied
- CSS inside `<style>` tags is automatically processed by Stylis
- Styles are scoped to shadow DOM - use descendant selectors, not global selectors
- Check that Stylis isn't rejecting your CSS syntax

### :style Object Not Applying
- Numbers do not get `px` added automatically — use strings: `{ width: '100px' }` not `{ width: 100 }`
- Nested objects are silently skipped; put media queries / selectors in `<style>` blocks instead
- `false`, `null`, and `undefined` values are intentionally skipped (for conditional spreads)
