# typify

A command-line tool to convert JavaScript files to TypeScript with automatic type inference.

## Features

- Converts JavaScript files to TypeScript by just running the command.
- Automatically infers basic types for function parameters
- Converts `var` declarations to `let` or `const`
- Transforms CommonJS `require()` to ES6 `import` statements
- Preserves existing code structure and comments
- Smart type inference for common patterns:
  - **Core Patterns**:
    - Basic types (string, number, boolean)
    - Array methods → `Array<T>`
    - Object patterns → `Record<string, any>`
    - Error handling → `Error | null`
  - **Web Development**:
    - Express (Request, Response, NextFunction)
    - Socket.IO (Socket, Server)
    - JWT (JwtPayload)
    - React (FC, ReactNode)
    - Webpack (Configuration)
    - Axios (AxiosInstance, AxiosResponse)
  - **Databases**:
    - MongoDB (Db, Collection, Document)
    - Mongoose (Model, Schema)
    - SQL (Connection, Pool, Query)
  - **Testing**:
    - Jest (Mock, SpyInstance)
  - **Utilities**:
    - Lodash (LoDashStatic)
    - Date handling (Date/string/number)
    - Validation (Joi/Yup schemas)
    - Node.js FS (typeof fs)
  - **Cloud/Infra**:
    - AWS SDK (S3, DynamoDB)
    - Node.js streams (Readable/Writable)

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
  return 'Hello ' + name;
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
  return 'Hello ' + name;
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

### React Component Detection

Input (`component.js`):

```javascript
function Button(props) {
  return <button>{props.children}</button>;
}
```

Output (`component.tsx`):

```typescript
import { FC } from 'react';

const Button: FC<{ children?: ReactNode }> = (props) => {
  return <button>{props.children}</button>;
};
```

### Jest Test Patterns

Input (`test.js`):

```javascript
test('user login', async (mock) => {
  const user = mock.user.create();
  await user.login();
});
```

Output (`test.ts`):

```typescript
import { Mock } from 'jest';

test('user login', async (mock: jest.Mock) => {
  const user = mock.user.create();
  await user.login();
});
```

### Webpack Configuration

Input (`webpack.config.js`):

```javascript
module.exports = (env) => ({
  entry: './src/index.js',
  mode: env.production ? 'production' : 'development',
});
```

Output (`webpack.config.ts`):

```typescript
import { Configuration } from 'webpack';

export default (env: Record<string, boolean>): Configuration => ({
  entry: './src/index.js',
  mode: env.production ? 'production' : 'development',
});
```

## Type Inference Improvements

### React Components

- Detects `props`/`state` parameters
- Adds `FC` type with children prop
- Infers component return types

### Testing Frameworks

- Recognizes Jest mock functions
- Types test/mock parameters
- Adds proper async test typing

### Infrastructure Patterns

- AWS service client detection (S3, DynamoDB)
- Node.js stream type inference

### Error Handling

- Detects `error`/`err` parameters
- Adds `Error | null` union type
- Infers try/catch error types

### Database Operations

- Recognizes MongoDB collection patterns
- Types Mongoose models and schemas
- Infers SQL connection pools

### HTTP Clients

- Detects Axios instance usage
- Types fetch API parameters
- Infers response data shapes

## Limitations

- Complex generic types may need manual annotation
- AWS SDK v2 requires separate `@types/aws-sdk`
- Custom Express middleware types might need refinement
- Axios interceptors may require additional typing
- Date format detection has basic pattern matching

Do try it out! I'm always looking for feedback and suggestions.
Reach out to me on [linkedin](https://www.linkedin.com/in/shivam-trivedi-ui/)
