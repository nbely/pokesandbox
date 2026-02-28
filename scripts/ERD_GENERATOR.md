# ERD Generator

Automatically generates Entity Relationship Diagrams from your Mongoose models.

## Usage

```bash
npm run erd:generate
```

This generates a Mermaid ER diagram and outputs it to `docs/erd.md`.

## Output

The script creates a markdown file containing:

- **Mermaid ER Diagram** — Visual representation of entities and relationships
- **Entity Tables** — Detailed field information (type, required, references)
- **Relationships List** — Cross-reference table

## How It Works

The script:

1. Imports all Mongoose models from `/shared/src/models/`
2. Introspects each schema to extract fields, types, and relationships
3. Generates Mermaid ER syntax with proper cardinality
4. Creates a markdown file with diagram + documentation

## Updating the Diagram

Whenever you add/remove a model or modify relationships:

```bash
npm run erd:generate
```

Then commit the updated `docs/erd.md` to git for team visibility.

## Extending the Generator

To add more models:

Edit `scripts/generate-erd.ts` and add to the `generateERD()` function:

```typescript
const { YourModel, yourSchema } = await import(
  '../shared/src/models/your.model'
);
// ...
entities.push(extractEntityDefinition('YourModel', yourSchema));
```

Then regenerate: `npm run erd:generate`

## Output Files

- `docs/erd.md` — Generated ERD with full documentation
- Committed to git for team collaboration
