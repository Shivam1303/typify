#!/usr/bin/env node

const commander = require('commander');
const fs = require('fs-extra');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const path = require('path');

const program = new commander.Command();

program
  .name('typify')
  .description('Convert JavaScript files to TypeScript')
  .version('1.0.0')
  .argument('<file>', 'JavaScript file to convert')
  .action(convertFile);

function inferParameterType(param, functionPath) {
  const references = functionPath.scope.getBinding(param.name)?.referencePaths || [];

  // Check if this is a callback function parameter
  if (
    functionPath.node.type === 'ArrowFunctionExpression' ||
    functionPath.node.type === 'FunctionDeclaration'
  ) {
    // Special case for error parameter in callbacks
    if (param.name === 'err' || param.name === 'error') {
      return {
        type: 'TSTypeAnnotation',
        typeAnnotation: {
          type: 'TSUnionType',
          types: [
            { type: 'TSTypeReference', typeName: { type: 'Identifier', name: 'Error' } },
            { type: 'TSNullKeyword' },
          ],
        },
      };
    }
    // Special case for 'next' middleware parameter
    if (param.name === 'next') {
      return {
        type: 'TSTypeAnnotation',
        typeAnnotation: {
          type: 'TSTypeReference',
          typeName: { type: 'Identifier', name: 'NextFunction' },
        },
      };
    }
  }

  for (const ref of references) {
    const parent = ref.parentPath;

    // Case 1: String concatenation
    if (parent.isBinaryExpression() && parent.node.operator === '+') {
      return { type: 'TSTypeAnnotation', typeAnnotation: { type: 'TSStringKeyword' } };
    }

    // Case 2: Numeric operations
    if (parent.isBinaryExpression() && ['+', '-', '*', '/'].includes(parent.node.operator)) {
      const otherOperand = parent.node.left === ref.node ? parent.node.right : parent.node.left;
      if (otherOperand.type === 'NumericLiteral') {
        return { type: 'TSTypeAnnotation', typeAnnotation: { type: 'TSNumberKeyword' } };
      }
    }

    // Case 3: Array operations
    if (
      parent.isCallExpression() &&
      ref.node === parent.node.callee &&
      parent.node.callee.property?.name === 'map'
    ) {
      return {
        type: 'TSTypeAnnotation',
        typeAnnotation: {
          type: 'TSArrayType',
          elementType: { type: 'TSAnyKeyword' },
        },
      };
    }

    // Case 4: Boolean conditions
    if (parent.isIfStatement() || parent.isConditionalExpression()) {
      return { type: 'TSTypeAnnotation', typeAnnotation: { type: 'TSBooleanKeyword' } };
    }

    // Case 5: Object property access (enhanced)
    if (parent.isMemberExpression()) {
      // Check if it's a request or response object
      if (param.name === 'req' || param.name === 'request') {
        return {
          type: 'TSTypeAnnotation',
          typeAnnotation: {
            type: 'TSTypeReference',
            typeName: { type: 'Identifier', name: 'Request' },
          },
        };
      }
      if (param.name === 'res' || param.name === 'response') {
        return {
          type: 'TSTypeAnnotation',
          typeAnnotation: {
            type: 'TSTypeReference',
            typeName: { type: 'Identifier', name: 'Response' },
          },
        };
      }
      // Default object type for other cases
      return {
        type: 'TSTypeAnnotation',
        typeAnnotation: {
          type: 'TSTypeReference',
          typeName: {
            type: 'Identifier',
            name: 'Record',
          },
          typeParameters: {
            type: 'TSTypeParameterInstantiation',
            params: [{ type: 'TSStringKeyword' }, { type: 'TSAnyKeyword' }],
          },
        },
      };
    }
  }

  return { type: 'TSTypeAnnotation', typeAnnotation: { type: 'TSAnyKeyword' } };
}

function handleRequireToImport(path, imports, importNodes) {
  const declaration = path.node.declarations[0];

  if (!declaration || !declaration.init || declaration.init.type !== 'CallExpression') {
    return;
  }

  if (!declaration.init.callee || declaration.init.callee.name !== 'require') {
    return;
  }

  const requirePath = declaration.init.arguments[0];
  if (!requirePath || requirePath.type !== 'StringLiteral') return;

  let importDeclaration;

  if (declaration.id.type === 'Identifier') {
    importDeclaration = {
      type: 'ImportDeclaration',
      specifiers: [
        {
          type: 'ImportDefaultSpecifier',
          local: declaration.id,
        },
      ],
      source: requirePath,
    };
  } else if (declaration.id.type === 'ObjectPattern') {
    importDeclaration = {
      type: 'ImportDeclaration',
      specifiers: declaration.id.properties.map((prop) => ({
        type: 'ImportSpecifier',
        imported: {
          type: 'Identifier',
          name: prop.key.name,
        },
        local: {
          type: 'Identifier',
          name: prop.value.name || prop.key.name,
        },
      })),
      source: requirePath,
    };
  }

  if (importDeclaration) {
    const importSource = requirePath.value;
    if (!imports.has(importSource)) {
      imports.add(importSource);
      importNodes.push(importDeclaration);
    }
    path.remove();
  }
}

async function convertFile(filePath) {
  try {
    const source = await fs.readFile(filePath, 'utf-8');

    const ast = parser.parse(source, {
      sourceType: 'module',
      plugins: ['jsx'],
    });

    const imports = new Set();
    const importNodes = [];

    // Check if we need Express types
    let needsExpressTypes = false;

    traverse(ast, {
      Function(path) {
        path.node.params.forEach((param) => {
          if (param.type === 'Identifier') {
            const paramName = param.name.toLowerCase();
            if (
              paramName === 'req' ||
              paramName === 'request' ||
              paramName === 'res' ||
              paramName === 'response' ||
              paramName === 'next'
            ) {
              needsExpressTypes = true;
            }
            if (!param.typeAnnotation) {
              param.typeAnnotation = inferParameterType(param, path);
            }
          }
        });
      },
      VariableDeclaration(path) {
        handleRequireToImport(path, imports, importNodes);

        if (path.node && path.node.kind === 'var') {
          const declaration = path.node.declarations[0];
          if (declaration && declaration.id.name) {
            const binding = path.scope.getBinding(declaration.id.name);
            path.node.kind = binding?.constant ? 'const' : 'let';
          }
        }
      },
    });

    // Add Express types import if needed
    if (needsExpressTypes) {
      importNodes.unshift({
        type: 'ImportDeclaration',
        specifiers: [
          {
            type: 'ImportSpecifier',
            imported: { type: 'Identifier', name: 'Request' },
            local: { type: 'Identifier', name: 'Request' },
          },
          {
            type: 'ImportSpecifier',
            imported: { type: 'Identifier', name: 'Response' },
            local: { type: 'Identifier', name: 'Response' },
          },
          {
            type: 'ImportSpecifier',
            imported: { type: 'Identifier', name: 'NextFunction' },
            local: { type: 'Identifier', name: 'NextFunction' },
          },
        ],
        source: { type: 'StringLiteral', value: 'express' },
      });
    }

    const formattedImports = importNodes.map((node) => generate(node).code).join('\n\n');
    const restOfCode = generate(ast, {
      retainLines: true,
      comments: true,
    }).code;

    const finalCode = `${formattedImports}\n\n${restOfCode}`;

    const parsedPath = path.parse(filePath);
    const outputPath = path.join(parsedPath.dir, `${parsedPath.name}.ts`);

    await fs.writeFile(outputPath, finalCode);
    console.log(`Successfully converted ${filePath} to ${outputPath}`);
  } catch (error) {
    console.error('Error converting file:', error);
    process.exit(1);
  }
}

program.parse();
