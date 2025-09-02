import { z } from 'zod';
import { Types } from 'mongoose';
import { createRequestDTOSchema } from './schema-helpers';

describe('createRequestDTOSchema', () => {
  it('should create a request DTO schema by omitting the _id field', () => {
    // Create a test entity schema with _id and other fields
    const testEntitySchema = z.object({
      _id: z.instanceof(Types.ObjectId),
      name: z.string(),
      value: z.number(),
    });

    // Create the request DTO schema using the helper
    const requestDTOSchema = createRequestDTOSchema(testEntitySchema);

    // Test that it accepts valid data without _id
    const validRequestData = {
      name: 'test',
      value: 42,
    };
    expect(() => requestDTOSchema.parse(validRequestData)).not.toThrow();

    // Test that _id field is not included in the parsed result when provided
    const dataWithId = {
      _id: new Types.ObjectId(),
      name: 'test',
      value: 42,
    };
    const parsed = requestDTOSchema.parse(dataWithId);
    expect(parsed).toEqual({
      name: 'test',
      value: 42,
    });
    expect(parsed).not.toHaveProperty('_id');

    // Test that it still validates other fields
    const incompleteRequestData = {
      name: 'test',
      // missing value field
    };
    expect(() => requestDTOSchema.parse(incompleteRequestData)).toThrow();
  });

  it('should preserve all other fields from the original schema', () => {
    const complexEntitySchema = z.object({
      _id: z.instanceof(Types.ObjectId),
      requiredString: z.string(),
      optionalString: z.string().optional(),
      numberField: z.number(),
      arrayField: z.array(z.string()),
    });

    const requestDTOSchema = createRequestDTOSchema(complexEntitySchema);

    const validData = {
      requiredString: 'test',
      optionalString: 'optional',
      numberField: 123,
      arrayField: ['item1', 'item2'],
    };

    const parsed = requestDTOSchema.parse(validData);
    expect(parsed).toEqual(validData);

    // Ensure optional fields work
    const validDataWithoutOptional = {
      requiredString: 'test',
      numberField: 123,
      arrayField: ['item1', 'item2'],
    };

    expect(() => requestDTOSchema.parse(validDataWithoutOptional)).not.toThrow();
  });
});