# typify

A command-line tool to convert JavaScript files to TypeScript with automatic type inference.

## Features

- Converts JavaScript files to TypeScript
- Automatically infers basic types for function parameters
- Converts `var` declarations to `let` or `const`
- Transforms CommonJS `require()` to ES6 `import` statements
- Preserves existing code structure and comments
- Smart type inference for common patterns:
  - Database patterns (MongoDB, Mongoose, SQL)
  - Web patterns (Express, Socket.IO, JWT, Axios)
  - Basic type inference (string, number, boolean)

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

Input (`example.js`):
```javascript
function greet(name) {
  return "Hello " + name;
}
function calculate(value) {
  return value * 2;
}
function processUser(user) {
  return user.name;
}
```

Output (`example.ts`):
```typescript
function greet(name: string) {
  return "Hello " + name;
}
function calculate(value: number) {
  return value * 2;
}
function processUser(user: Record<string, any>) {
  return user.name;
}
```

### Database Pattern Detection

Input (`db-example.js`):
```javascript
async function findUsers(db, query) {
  const collection = db.collection('users');
  return collection.find(query);
}
```

Output (`db-example.ts`):
```typescript
import { Db, Collection } from 'mongodb';

async function findUsers(db: Db, query: Record<string, any>) {
  const collection: Collection = db.collection('users');
  return collection.find(query);
}
```

### Web Pattern Detection

Input (`web-example.js`):
```javascript
function handleSocket(socket) {
  socket.on('message', (data) => {
    socket.emit('response', data);
  });
}

async function verifyToken(token) {
  return jwt.verify(token, process.env.SECRET);
}
```

Output (`web-example.ts`):
```typescript
import { Socket } from 'socket.io';
import { JwtPayload } from 'jsonwebtoken';

function handleSocket(socket: Socket) {
  socket.on('message', (data: any) => {
    socket.emit('response', data);
  });
}

async function verifyToken(token: string): Promise<JwtPayload> {
  return jwt.verify(token, process.env.SECRET);
}
```

## Type Inference

The tool automatically infers types based on:

### Basic Types
- String type: When used in string concatenation
- Number type: When used in mathematical operations
- Boolean type: When used in conditional statements
- Array type: When array methods are used
- Any type: When type cannot be determined

### Database Patterns
- MongoDB: `Db`, `Collection`, `Document`
- Mongoose: `Model`, `Schema`, `Document`
- SQL: `Connection`, `Pool`, `Query`

### Web Patterns
- Express: `Request`, `Response`, `NextFunction`
- Socket.IO: `Socket`, `Server`
- JWT: `JwtPayload`
- HTTP Clients: `AxiosInstance`, `AxiosResponse`, `RequestInit`

## Limitations

- Complex type inference might require manual refinement
- Generic types are not automatically inferred
- Custom types need to be added manually
- Union types are not automatically detected

