import { z } from 'zod';

const optionsMissingMessage = 'Options are required to display this menu.';

const formatZodPath = (path: (string | number)[]): string => {
  if (path.length === 0) {
    return '';
  }

  return `**${path.join('.')}** - `;
};

const getMissingRequiredOptions = (
  options: Record<string, unknown>,
  schema: z.AnyZodObject
): string[] => {
  const missingRequiredOptions: string[] = [];
  const schemaShape = schema.shape as z.ZodRawShape;

  for (const [fieldName, fieldSchema] of Object.entries(schemaShape)) {
    const isRequiredField = !fieldSchema.safeParse(undefined).success;
    const isMissingField = options[fieldName] === undefined;

    if (isRequiredField && isMissingField) {
      missingRequiredOptions.push(fieldName);
    }
  }

  return missingRequiredOptions;
};

export const parseCommandOptions = <TSchema extends z.AnyZodObject>(
  schema: TSchema,
  options?: unknown
): z.infer<TSchema> => {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error(optionsMissingMessage);
  }

  const objectOptions = options as Record<string, unknown>;
  const missingRequiredOptions = getMissingRequiredOptions(
    objectOptions,
    schema
  );

  if (missingRequiredOptions.length > 0) {
    throw new Error(
      `Missing required command option(s): \n - ${missingRequiredOptions.join(
        '\n - '
      )}`
    );
  }

  const parsed = schema.safeParse(options);

  if (!parsed.success) {
    const issueMessage = parsed.error.issues
      .map((issue) => `${formatZodPath(issue.path)}${issue.message}`)
      .join('\n - ');

    throw new Error(`Invalid command options: \n - ${issueMessage}`);
  }

  return parsed.data;
};
