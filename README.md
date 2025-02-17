# typify

A command-line tool to convert JavaScript files to TypeScript with automatic type inference.

## Features

- Converts JavaScript files to TypeScript
- Automatically infers basic types for function parameters
- Converts `var` declarations to `let` or `const`
- Transforms CommonJS `require()` to ES6 `import` statements
- Preserves existing code structure and comments

## Installation

```bash
npm install @sliderzz/typify
```

## Usage

```bash
typify <filename>
```

This will create a new TypeScript file (`filename.ts`) in the same directory.

## Examples

### Basic Function Conversion

Input (`example.js`): javascript
```js
function greet(name) {
return "Hello " + name;
}
function calculate(value) {
return value 2;
}
function processUser(user) {
return user.name;
}
```

Output (`example.ts`):
```js
typescript
function greet(name: string) {
return "Hello " + name;
}
function calculate(value: number) {
return value 2;
}
function processUser(user: object) {
return user.name;
}
```

## Type Inference

The tool automatically infers types based on usage:

- String type: When used in string concatenation
- Number type: When used in mathematical operations
- Boolean type: When used in conditional statements
- Object type: When properties are accessed
- Array type: When array methods are used
- Any type: When type cannot be determined

## Limitations

- Complex type inference might require manual refinement
- Generic types are not automatically inferred
- Custom types need to be added manually
- Union types are not automatically detected

