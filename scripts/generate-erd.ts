#!/usr/bin/env node
/**
 * Generate a Mermaid ER diagram from Mongoose models
 *
 * Usage: npx ts-node scripts/generate-erd.ts
 * Output: docs/erd.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { Schema } from 'mongoose';

interface EntityField {
  name: string;
  type: string;
  isRequired: boolean;
  isArray: boolean;
  ref?: string;
}

interface EntityDefinition {
  name: string;
  fields: EntityField[];
  relationships: Array<{ to: string; type: string }>;
}

/**
 * Extract type name from schema path
 */
function getTypeName(schemaPath: any): string {
  if (!schemaPath) return 'Unknown';

  if (schemaPath.instance) {
    const instance = schemaPath.instance;
    if (instance === 'ObjectID') return 'ObjectId';
    if (instance === 'String') return 'string';
    if (instance === 'Number') return 'number';
    if (instance === 'Boolean') return 'boolean';
    if (instance === 'Date') return 'date';
    if (instance === 'Array') {
      // Access caster safely for array element types
      const caster =
        (schemaPath as any).caster?._schema || (schemaPath as any).caster;
      const arrayType = caster?.instance || 'unknown';
      return `${arrayType}[]`;
    }
    if (instance === 'Embedded') return 'object';
    return instance;
  }

  return 'unknown';
}

/**
 * Extract entity definition from Mongoose schema
 */
function extractEntityDefinition(
  name: string,
  schema: Schema<any>
): EntityDefinition {
  const fields: EntityField[] = [];
  const relationships: Map<string, string> = new Map();

  // Iterate through all schema paths
  schema.eachPath((pathName: string) => {
    if (pathName === '_id') return;

    const schemaPath = schema.path(pathName);

    // Skip virtuals and internal mongoose fields, and fields with special characters (Draw.io incompatible)
    if (!schemaPath || pathName.startsWith('_') || /[.$*]/.test(pathName))
      return;

    const isArray = schemaPath.instance === 'Array';
    const ref = schemaPath.options?.ref;
    const isRequired = schemaPath.isRequired;

    let typeName = getTypeName(schemaPath);

    // Handle array types
    if (isArray) {
      const caster = (schemaPath as any).caster;
      if (caster && getTypeName(caster) !== 'ObjectId') {
        const casterType = getTypeName(caster);
        typeName = `${casterType}[]`;
      } else if (ref) {
        typeName = `${ref}[]`;
      } else {
        typeName = 'ObjectId[]';
      }
    }

    fields.push({
      name: pathName,
      type: typeName,
      isRequired: !!isRequired,
      isArray,
      ref,
    });

    // Track relationships
    if (ref && typeof ref === 'string') {
      relationships.set(pathName, ref);
    }
  });

  return {
    name,
    fields,
    relationships: Array.from(relationships.entries()).map(([field, to]) => ({
      to,
      type: 'references',
    })),
  };
}

/**
 * Generate Mermaid ER diagram from entity definitions
 */
function generateMermaidERD(entities: EntityDefinition[]): string {
  let mermaid = 'erDiagram\n';

  // Generate entity definitions
  for (const entity of entities) {
    mermaid += `    ${entity.name} {\n`;

    for (const field of entity.fields) {
      // Determine primary key
      const isPK = field.name === '_id' ? 'PK' : '';
      const isFK = field.ref ? 'FK' : '';
      const key = [isFK, isPK].filter(Boolean).join(' ') || 'string';

      // Format field type
      let displayType = field.type;
      if (field.isArray && !field.type.includes('[]')) {
        displayType = `${field.type}[]`;
      }

      // Truncate long types for readability
      if (displayType.length > 30) {
        displayType = displayType.substring(0, 27) + '...';
      }

      // Note: Draw.io doesn't support '?' for optional fields, so we omit it
      mermaid += `        ${displayType} ${field.name}\n`;
    }

    mermaid += `    }\n\n`;
  }

  // Generate relationships
  const processedRels = new Set<string>();
  for (const entity of entities) {
    for (const rel of entity.relationships) {
      const relKey = [entity.name, rel.to].sort().join('-');
      if (!processedRels.has(relKey)) {
        mermaid += `    ${entity.name} ||--o{ ${rel.to} : "${rel.type}"\n`;
        processedRels.add(relKey);
      }
    }
  }

  return mermaid;
}

/**
 * Generate markdown documentation with the diagram
 */
function generateMarkdown(
  mermaid: string,
  entities: EntityDefinition[]
): string {
  const timestamp = new Date().toISOString();

  let markdown = `# Entity Relationship Diagram

**Generated:** ${timestamp}

## Diagram

\`\`\`mermaid
${mermaid}\`\`\`

## Entities

`;

  for (const entity of entities) {
    markdown += `### ${entity.name}\n\n`;

    markdown += '| Field | Type | Required | Notes |\n';
    markdown += '|-------|------|----------|-------|\n';

    for (const field of entity.fields) {
      const required = field.isRequired ? '✓' : '';
      const notes = field.ref ? `References: ${field.ref}` : '';
      markdown += `| \`${field.name}\` | ${field.type} | ${required} | ${notes} |\n`;
    }

    markdown += '\n';
  }

  markdown += `## Relationships\n\n`;
  const allRels: Array<{ from: string; to: string }> = [];

  for (const entity of entities) {
    for (const rel of entity.relationships) {
      allRels.push({ from: entity.name, to: rel.to });
    }
  }

  if (allRels.length === 0) {
    markdown += 'No relationships defined.\n';
  } else {
    markdown += '| From | To |\n';
    markdown += '|------|----|\n';
    for (const rel of allRels) {
      markdown += `| ${rel.from} | ${rel.to} |\n`;
    }
  }

  return markdown;
}

/**
 * Main function - load models and generate ERD
 */
async function generateERD() {
  try {
    // Import all models dynamically
    const modelsPath = path.join(__dirname, '../shared/src/models');

    // Manually import models (since we can't use dynamic requires in ts-node safely)
    const { User, userSchema } = await import(
      '../shared/src/models/user.model'
    );
    const { Server, serverSchema } = await import(
      '../shared/src/models/server.model'
    );
    const { Region, regionSchema } = await import(
      '../shared/src/models/region/region.model'
    );

    const entities: EntityDefinition[] = [
      extractEntityDefinition('User', userSchema),
      extractEntityDefinition('Server', serverSchema),
      extractEntityDefinition('Region', regionSchema),
    ];

    // Generate Mermaid diagram
    const mermaid = generateMermaidERD(entities);

    // Generate markdown with diagram
    const markdown = generateMarkdown(mermaid, entities);

    // Create docs directory if it doesn't exist
    const docsDir = path.join(__dirname, '../docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    // Write ERD file
    const erdPath = path.join(docsDir, 'erd.md');
    fs.writeFileSync(erdPath, markdown, 'utf-8');

    console.log(`✓ ERD generated successfully: ${erdPath}`);
    console.log(`\n${mermaid}`);
  } catch (error) {
    console.error('✗ Error generating ERD:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateERD();
}

export { generateERD, extractEntityDefinition, generateMermaidERD };
