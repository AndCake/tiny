# Tiny Web Components

A lightweight, declarative library for creating custom web components with dynamic rendering, server-side rendering, event handling, and advanced CSS processing.

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Component Syntax](#component-syntax)
- [Template Syntax](#template-syntax)
- [Dynamic Attributes](#dynamic-attributes)
- [Advanced CSS Processing](#advanced-css-processing)
- [Event Handling](#event-handling)
- [Lifecycle Methods](#lifecycle-methods)
- [Server-Side Rendering](#server-side-rendering)
- [Examples](#examples)
- [API Reference](#api-reference)

## Features

- Declarative web component creation
- Mustache-like template rendering
- Server-Side Rendering (SSR) support
- Dynamic attribute processing
- Two-way data binding
- Conditional rendering
- List rendering
- Event handling
- CSS preprocessing
- Lightweight and framework-agnostic

## Installation

### Via NPM
```bash
npm install @andcake/tiny
```

### Direct Browser Import
```html
<script type="module" src="/path/to/tiny.min.js"></script>
```

## Getting Started

### Defining a Component

```html
<template data-name="x-user-profile" data-attrs="user">
  <style>
    .profile {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
    }
  </style>
  <div class="profile">
    <img class="avatar" src="{{user.avatarUrl}}" alt="{{user.name}}">
    <div>
      <h2>{{user.name}}</h2>
      <p>Email: <input x-model="user.email" type="email"></p>
      <p>Phone: <input x-model="user.phone" type="tel"></p>
      <button @click="updateProfile()">Update Profile</button>
    </div>
  </div>
  <script>
  {
    user: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      avatarUrl: 'https://ui-avatars.com/api/?name=John+Doe'
    },
    updateProfile() {
      // Simulate profile update
      console.log('Updating profile:', this.user);
      // In a real app, you might call an API here
      alert(`Profile updated for ${this.user.name}`);
    }
  }
  </script>
</template>
```

### Using the Component

```html
<x-user-profile></x-user-profile>
```

## Server-Side Rendering (SSR)

Tiny Web Components supports server-side rendering through several approaches:

### 1. Static Rendering

```javascript
import { TemplateRenderer } from '@andcake/tiny';

function renderPage(template, context) {
  return TemplateRenderer.render(template, context);
}

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
  title: 'Server-Rendered List',
  items: ['Item 1', 'Item 2', 'Item 3']
};
context.items = JSON.stringify(context.items);

const renderedHTML = renderPage(template, context);
```

x-list.html:
```html
<template data-name="x-list" data-attrs="items">
    <ul>
    {{#items}}
        <li>{{.}}</li>
    {{/items}}
    </ul>
</template>
```

### 2. Hydration Strategy

```javascript
// Render initial state on the server
const initialHTML = renderPage(template, serverContext);

// On the client, hydrate with full interactivity
document.body.innerHTML = initialHTML;
init(); // Initialize Tiny Web Components
```

## Component Syntax

### Template Attributes
- `data-name`: Define the custom element name
- `data-attrs`: List observed attributes
- `data-as`: Optional form element association

## Template Syntax

### Interpolation
- `{{expr}}`: Escaped HTML interpolation
- `{{{expr}}}`: Unescaped HTML interpolation

### Sections
```mustache
{{#items}}
  Item: {{name}}
{{/items}}
```

### Inverted Sections
```mustache
{{^items}}
  No items found
{{/items}}
```

## Dynamic Attributes

### Conditional Rendering
- `x-show`: Conditionally show/hide elements
- `x-if`: Conditionally render elements

### List Rendering
```html
<template x-for="item of items">
  <div>{{item.name}}</div>
</template>
```

### Two-Way Binding
```html
<input x-model="username" placeholder="Enter username">
<p>Current username: {{username}}</p>
```

### Element References
```html
<input x-ref="usernameInput">
<button @click="$refs.usernameInput.focus()">Focus</button>
```

## Advanced CSS Processing

Tiny Web Components leverages **Stylis** for advanced CSS processing, providing powerful features beyond standard CSS:

### CSS Nesting
Write nested CSS rules similar to Sass/SCSS:

```html
<template data-name="x-card">
  <style>
    .card {
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;

      .header {
        font-size: 1.2rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
      }

      .content {
        color: #666;

        p {
          margin: 0.5rem 0;
        }
      }

      &:hover {
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      &.featured {
        border-color: #007bff;
        background: #f8f9fa;
      }
    }
  </style>
  <div class="card">
    <div class="header">{{title}}</div>
    <div class="content">
      <p>{{description}}</p>
    </div>
  </div>
</template>
```

### Vendor Prefixing
Stylis automatically adds vendor prefixes where needed:

```html
<style>
  .animated-box {
    transform: scale(1.2);
    transition: transform 0.3s ease;
    user-select: none;
    /* Automatically becomes -webkit-user-select, -ms-user-select, etc. */
  }
</style>
```

### Media Queries and Responsive Design
```html
<style>
  .responsive-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (min-width: 1024px) {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>
```

### CSS Animations and Keyframes
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

  .slide-animation {
    animation: slideIn 0.5s ease-in-out;
  }
</style>
```

### Parent Selector (&) Usage
The `&` selector refers to the parent selector, enabling powerful pattern matching:

```html
<style>
  .button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;

    &.primary {
      background: #007bff;
      color: white;

      &:hover {
        background: #0056b3;
      }
    }

    &.secondary {
      background: #6c757d;
      color: white;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
</style>
```

### CSS Custom Properties (CSS Variables) Support
```html
<style>
  :host {
    --primary-color: #007bff;
    --secondary-color: #6c757d;
    --border-radius: 8px;
  }

  .themed-component {
    background: var(--primary-color);
    border-radius: var(--border-radius);

    .accent {
      color: var(--secondary-color);
    }
  }
</style>
```

### Advanced Pseudo-selectors
```html
<style>
  .list-item {
    padding: 0.5rem;

    &:nth-child(odd) {
      background: #f8f9fa;
    }

    &:first-child {
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
    }

    &:last-child {
      border-bottom-left-radius: 4px;
      border-bottom-right-radius: 4px;
    }

    &:not(.disabled) {
      cursor: pointer;

      &:hover {
        background: #e9ecef;
      }
    }
  }
</style>
```

### CSS Grid and Flexbox with Nesting
```html
<style>
  .dashboard {
    display: grid;
    grid-template-areas:
      "header header"
      "sidebar main";
    grid-template-rows: auto 1fr;
    grid-template-columns: 250px 1fr;
    min-height: 100vh;

    .header {
      grid-area: header;
      background: #343a40;
      color: white;
      padding: 1rem;

      .nav {
        display: flex;
        gap: 1rem;

        a {
          color: white;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }

    .sidebar {
      grid-area: sidebar;
      background: #f8f9fa;
      padding: 1rem;
    }

    .main {
      grid-area: main;
      padding: 1rem;
    }
  }
</style>
```

## Event Handling

### Basic Events
```html
<button @click="handleClick()">Click me</button>
```

### Custom Events
```html
<x-custom @my-event="handleCustomEvent()"></x-custom>
```

## Lifecycle Methods

### Component Mounted
```javascript
onComponentMounted() {
  console.log('Component is ready');
  // Perform initial setup, data fetching, etc.
}
```

### Component Rendered
```javascript
onComponentRendered() {
  console.log('Component has been rendered');
  // Additional rendering logic, animations, etc.
}
```

## Examples

### Complex Todo List Component
```html
<template data-name="x-todo-list" data-attrs="todos">
  <div>
    <input x-model="newTodo" placeholder="Enter a new todo">
    <button @click="addTodo()">Add Todo</button>
    <ul>
      {{#todos}}
        <li>
          <input
            type="checkbox"
            x-model="completed"
            @change="updateTodoStatus(_idx)"
          >
          <span :class="completed ? 'completed' : ''">{{text}}</span>
          <button @click="removeTodo(_idx)">Delete</button>
        </li>
      {{/todos}}
    </ul>
    <style>
      .completed { text-decoration: line-through; color: gray; }
    </style>
  </div>
  <script>
  {
    todos: [],
    newTodo: '',
    addTodo() {
      if (this.newTodo.trim()) {
        this.todos.push({
          text: this.newTodo,
          completed: false
        });
        this.newTodo = '';
      }
    },
    removeTodo(index) {
      this.todos.splice(index, 1);
    },
    updateTodoStatus(index) {
      this.todos[index].completed = !this.todos[index].completed;
    }
  }
  </script>
</template>
```

## API Reference

### `init(options)`
Initialize the Tiny Web Components library.

#### Options
- `window`: Custom window object
- `runScripts`: Enable/disable script execution (default: `true`)

### `parseDataset(dataset)`
Parse dataset attributes with type conversion.

### Supported Browser Environments
- Modern browsers with ES6 module support
- Chrome, Firefox, Safari, Edge (latest versions)
- Node.js with appropriate polyfills

## Performance Considerations
- Lightweight (~6kb gzipped)
- No external dependencies
- Efficient rendering mechanism
- Optimized for both client and server environments

## Contributing
Contributions are welcome!
- Report issues on GitHub
- Submit pull requests

## License
MIT License
