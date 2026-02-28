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
  displayName: string;
  type: string;
  isRequired: boolean;
  isArray: boolean;
  ref?: string;
  depth: number;
  isParent: boolean; // true for object/embedded containers
}

interface MapValueSchema {
  mapFieldPath: string;
  valueType: string;
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
    ref?: string;
    depth?: number;
    isNestedField?: boolean;
  }>;
}

interface EntityDefinition {
  name: string;
  fields: EntityField[];
  relationships: Array<{ to: string; type: string }>;
  mapSchemas: MapValueSchema[];
}

/**
 * Map a Mongoose instance name to a display-friendly type string
 */
function mapInstanceToType(instance: string): string {
  switch (instance) {
    case 'ObjectID':
    case 'ObjectId':
      return 'ObjectId';
    case 'String':
      return 'string';
    case 'Number':
      return 'number';
    case 'Boolean':
      return 'boolean';
    case 'Date':
      return 'date';
    case 'Map':
      return 'Map';
    case 'Embedded':
    case 'SubDocument':
      return 'object';
    default:
      return instance || 'unknown';
  }
}

/**
 * Determine the display type for an array schema path using Mongoose 9's
 * embeddedSchemaType API. Falls back to ref name or 'object[]'.
 */
function getArrayElementType(schemaPath: any): string {
  const ref = schemaPath.options?.ref;
  const elementInstance = schemaPath.embeddedSchemaType?.instance;

  if (ref) {
    return `${ref}[]`;
  }
  if (elementInstance) {
    return `${mapInstanceToType(elementInstance)}[]`;
  }
  return 'object[]';
}

/**
 * Extract type name from schema path
 */
function getTypeName(schemaPath: any): string {
  if (!schemaPath) return 'unknown';

  const instance = schemaPath.instance;
  if (!instance) return 'unknown';

  if (instance === 'Array') {
    return getArrayElementType(schemaPath);
  }

  return mapInstanceToType(instance);
}

/**
 * Walk a schema path and collect fields + relationships. Recurses into
 * embedded subdocuments and document arrays so that nested refs
 * (e.g. quests.active → Quest, pokedex.id → DexEntry) are captured.
 */
function walkSchemaPath(
  normalizedName: string,
  displayName: string,
  depth: number,
  schemaPath: any,
  fields: EntityField[],
  relationships: Map<string, string>
): void {
  const instance: string | undefined = schemaPath.instance;
  if (!instance) return;

  const isEmbedded = instance === 'Embedded' || instance === 'SubDocument';
  const isArray = instance === 'Array';

  // Recurse into embedded subdocuments (e.g. quests, graphicSettings)
  if (isEmbedded && schemaPath.schema) {
    // Add the parent object field
    fields.push({
      name: normalizedName,
      displayName,
      type: 'object',
      isRequired: !!schemaPath.isRequired,
      isArray: false,
      depth,
      isParent: true,
    });

    schemaPath.schema.eachPath((childName: string, childPath: any) => {
      if (childName === '_id' || childName === '__v') return;
      walkSchemaPath(
        `${normalizedName}_${childName}`,
        childName,
        depth + 1,
        childPath,
        fields,
        relationships
      );
    });
    return;
  }

  // Recurse into document arrays with sub-schemas (e.g. pokedex[].id)
  if (isArray && schemaPath.embeddedSchemaType?.schema) {
    // Add the array field itself
    fields.push({
      name: normalizedName,
      displayName,
      type: 'object[]',
      isRequired: !!schemaPath.isRequired,
      isArray: true,
      depth,
      isParent: true,
    });

    schemaPath.embeddedSchemaType.schema.eachPath(
      (childName: string, childPath: any) => {
        if (childName === '_id' || childName === '__v') return;
        walkSchemaPath(
          `${normalizedName}_${childName}`,
          childName,
          depth + 1,
          childPath,
          fields,
          relationships
        );
      }
    );
    return;
  }

  // Leaf field — add it directly
  const ref = schemaPath.options?.ref;
  const typeName = getTypeName(schemaPath);

  fields.push({
    name: normalizedName,
    displayName,
    type: typeName,
    isRequired: !!schemaPath.isRequired,
    isArray,
    ref,
    depth,
    isParent: false,
  });

  if (ref && typeof ref === 'string') {
    relationships.set(normalizedName, ref);
  }
}

/**
 * Extract Map value schema fields for documentation.
 * For document arrays, descends into nested schema to show structure.
 */
function extractMapValueSchema(
  mapFieldPath: string,
  valueSchema: any,
  relationships: Map<string, string>
): MapValueSchema {
  const fields: Array<{
    name: string;
    type: string;
    required: boolean;
    ref?: string;
    depth?: number;
    isNestedField?: boolean;
  }> = [];

  if (valueSchema && valueSchema.eachPath) {
    valueSchema.eachPath((childName: string, childPath: any) => {
      if (childName === '_id' || childName === '__v') return;

      const ref = childPath.options?.ref;
      const isArray = childPath.instance === 'Array';
      const hasEmbeddedSchema = isArray && childPath.embeddedSchemaType?.schema;

      // For document arrays, descend into the schema to show nested fields
      if (hasEmbeddedSchema) {
        // Add the array field itself
        fields.push({
          name: childName,
          type: 'object[]',
          required: !!childPath.isRequired,
          depth: 0,
          isNestedField: false,
        });

        // Add nested fields with indentation
        childPath.embeddedSchemaType.schema.eachPath(
          (nestedName: string, nestedPath: any) => {
            if (nestedName === '_id' || nestedName === '__v') return;

            const nestedRef = nestedPath.options?.ref;
            fields.push({
              name: `${childName}.${nestedName}`,
              type: getTypeName(nestedPath),
              required: !!nestedPath.isRequired,
              ref: nestedRef,
              depth: 1,
              isNestedField: true,
            });

            if (nestedRef && typeof nestedRef === 'string') {
              const normalizedName = `${mapFieldPath}_${childName}_${nestedName}`;
              relationships.set(normalizedName, nestedRef);
            }
          }
        );
      } else {
        // Regular field (not a document array)
        fields.push({
          name: childName,
          type: getTypeName(childPath),
          required: !!childPath.isRequired,
          ref,
          depth: 0,
          isNestedField: false,
        });

        // Track relationships for Map value fields
        if (ref && typeof ref === 'string') {
          const normalizedName = `${mapFieldPath}_${childName}`;
          relationships.set(normalizedName, ref);
        }
      }
    });
  }

  return {
    mapFieldPath,
    valueType: valueSchema?.constructor?.name || 'object',
    fields,
  };
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
  const mapSchemas: MapValueSchema[] = [];

  schema.eachPath((pathName: string) => {
    if (pathName === '_id' || pathName === '__v') return;

    const schemaPath = schema.path(pathName);
    if (!schemaPath || pathName.startsWith('_')) return;

    // Skip Map sub-paths like "progressionDefinitions.$*"
    if (/[$*]/.test(pathName)) return;

    // Handle Maps specially - inspect value schema
    if (schemaPath.instance === 'Map' && schemaPath.options?.of) {
      const valueSchema = schemaPath.options.of;
      mapSchemas.push(
        extractMapValueSchema(pathName, valueSchema, relationships)
      );

      // Still add the Map field itself
      fields.push({
        name: pathName,
        displayName: pathName,
        type: 'Map',
        isRequired: !!schemaPath.isRequired,
        isArray: false,
        depth: 0,
        isParent: false,
      });
      return;
    }

    walkSchemaPath(pathName, pathName, 0, schemaPath, fields, relationships);
  });

  return {
    name,
    fields,
    relationships: Array.from(relationships.entries()).map(([field, to]) => ({
      to,
      type: field,
    })),
    mapSchemas,
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

  // Generate relationships — dedupe by entity + target + field name to preserve
  // distinct and bi-directional references between the same entity pair
  const processedRels = new Set<string>();
  for (const entity of entities) {
    for (const rel of entity.relationships) {
      const relKey = `${entity.name}-${rel.to}-${rel.type}`;
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
  let markdown = `# Entity Relationship Diagram

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

      // Add indentation for nested fields - repeat ↳ for each depth level
      const indent = '↳ '.repeat(field.depth);
      const displayName = indent + field.displayName;

      markdown += `| \`${displayName}\` | ${field.type} | ${required} | ${notes} |\n`;
    }

    markdown += '\n';

    // Add Map value schemas inline with the entity
    if (entity.mapSchemas.length > 0) {
      for (const map of entity.mapSchemas) {
        markdown += `#### Map: \`${map.mapFieldPath}\`\n\n`;
        markdown += `**Value Type:** \`${map.valueType}\`\n\n`;

        if (map.fields.length > 0) {
          markdown += '| Field | Type | Required | Notes |\n';
          markdown += '|-------|------|----------|-------|\n';

          for (const field of map.fields) {
            const required = field.required ? '✓' : '';
            const notes = field.ref ? `References: ${field.ref}` : '';
            // Add indentation for nested fields
            const indent = field.depth ? '↳ '.repeat(field.depth) : '';
            const displayName = indent + field.name;
            markdown += `| \`${displayName}\` | ${field.type} | ${required} | ${notes} |\n`;
          }
          markdown += '\n';
        } else {
          markdown +=
            '_No structured fields (primitive values or complex schema)._\n\n';
        }
      }
    }
  }

  markdown += `## Relationships\n\n`;
  const allRels: Array<{ from: string; to: string; field: string }> = [];

  for (const entity of entities) {
    for (const rel of entity.relationships) {
      allRels.push({ from: entity.name, to: rel.to, field: rel.type });
    }
  }

  if (allRels.length === 0) {
    markdown += 'No relationships defined.\n';
  } else {
    markdown += '| From | Field | To |\n';
    markdown += '|------|-------|----|';
    for (const rel of allRels) {
      markdown += `\n| ${rel.from} | \`${rel.field}\` | ${rel.to} |`;
    }
    markdown += '\n';
  }

  return markdown;
}

/**
 * Main function - load models and generate ERD
 */
async function generateERD() {
  try {
    // Manually import models (since we can't use dynamic requires in ts-node safely)
    const { userSchema } = await import('../shared/src/models/user.model');
    const { serverSchema } = await import('../shared/src/models/server.model');
    const { regionSchema } = await import(
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
