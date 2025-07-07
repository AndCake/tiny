# Tiny Web Components

A lightweight, declarative library for creating custom web components with dynamic rendering, server-side rendering, event handling, and advanced CSS processing.

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Component Syntax](#component-syntax)
- [Template Syntax](#template-syntax)
- [Dynamic Attributes](#dynamic-attributes)
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
npm install @serenomica/tiny-web-components
```

### Direct Browser Import
```html
<script type="module" src="/path/to/tiny/index.js"></script>
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
import { TemplateRenderer } from '@serenomica/tiny-web-components';

function renderComponent(template, context) {
  return TemplateRenderer.render(template, context);
}

const template = `
  <div>
    <h1>{{title}}</h1>
    {{#items}}
      <p>{{.}}</p>
    {{/items}}
  </div>
`;

const context = {
  title: 'Server-Rendered List',
  items: ['Item 1', 'Item 2', 'Item 3']
};

const renderedHTML = renderComponent(template, context);
```

### 2. Node.js Rendering

```javascript
import { JSDOM } from 'jsdom';
import { initComponents } from '@serenomica/tiny-web-components';

async function serverRenderComponent(html, context) {
  const dom = new JSDOM(html);
  global.window = dom.window;
  global.document = dom.window.document;

  // Initialize components in server environment
  await initComponents({
    document: dom.window.document,
    runScripts: true
  });

  // Apply context to components
  const components = dom.window.document.querySelectorAll('template[data-name]');
  components.forEach(template => {
    const componentClass = customElements.get(template.dataset.name);
    const instance = new componentClass();
    instance.context = { ...instance.context, ...context };
    instance.render();
  });

  return dom.window.document.body.innerHTML;
}
```

### 3. Hydration Strategy

```javascript
// Render initial state on the server
const initialHTML = renderComponent(template, serverContext);

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
- Lightweight (~5kb gzipped)
- No external dependencies
- Efficient rendering mechanism
- Optimized for both client and server environments

## Contributing
Contributions are welcome! 
- Report issues on GitHub
- Submit pull requests

## License
MIT License
