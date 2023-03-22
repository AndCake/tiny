# Tiny DC

A tiny web components framework for declaratively defining them.

## Usage

Define a web component:

```html
<!-- defines the comment-list HTML element, whereby the data-list attribute is watched for changes -->
<template data-name="comment-list" data-attrs="list">
	<ul>
		<!-- we access the list attribute's value -->
		{{#list}}
			<li>
				<div><strong>{{author}} wrote:</strong></div>
				<p>{{text}}</p>
			</li>
		{{/list}}
	</ul>	
</template>
```

Using the declared component:

```html
<html>
<head>
	<!-- import the component -->
	<link rel="html" href="./comment-list.html"/>
</head>
<body>
	<!-- use the comment-list imported above -->
	<comment-list data-list='[{"author": "Carl Dall", "text": "Hi there!"}, {"author": "Me", "text": "Ohohoho!"}]'></comment-list>
	
	<!-- load the JS to render the comment-list -->
	<script type="module" src="https://raw.githubusercontent.com/AndCake/tiny/main/tiny.js"></script>
</body>
</html>
```
