import { z, ZodTypeAny, ZodObject } from 'zod';
import type { AutoFormSchema, FieldDefinition, ValidationRules } from '../types/schema';

/**
 * Options for Zod schema generation
 */
export interface ZodSchemaOptions {
  /**
   * Custom validation functions referenced by key in schema
   */
  customValidators?: Record<string, (value: unknown) => boolean | string>;

  /**
   * Whether to make all fields optional by default
   * @default false
   */
  allOptional?: boolean;
}

/**
 * Apply validation rules to a Zod schema
 */
function applyValidationRules(
  schema: ZodTypeAny,
  rules: ValidationRules | undefined,
  fieldType: string,
  options: ZodSchemaOptions
): ZodTypeAny {
  if (!rules) return schema;

  let result = schema;

  // Required is handled at the field level, not here
  // Min/max for numbers
  if (fieldType === 'number') {
    if (rules.min !== undefined) {
      const min =
        typeof rules.min === 'object' ? rules.min : { value: rules.min, message: undefined };
      result = (result as z.ZodNumber).min(min.value, min.message);
    }
    if (rules.max !== undefined) {
      const max =
        typeof rules.max === 'object' ? rules.max : { value: rules.max, message: undefined };
      result = (result as z.ZodNumber).max(max.value, max.message);
    }
  }

  // String validations
  if (typeof (result as any).min === 'function' && fieldType !== 'number') {
    if (rules.minLength !== undefined) {
      const minLength =
        typeof rules.minLength === 'object'
          ? rules.minLength
          : { value: rules.minLength, message: undefined };
      result = (result as z.ZodString).min(minLength.value, minLength.message);
    }
    if (rules.maxLength !== undefined) {
      const maxLength =
        typeof rules.maxLength === 'object'
          ? rules.maxLength
          : { value: rules.maxLength, message: undefined };
      result = (result as z.ZodString).max(maxLength.value, maxLength.message);
    }
    if (rules.email) {
      const message = typeof rules.email === 'string' ? rules.email : undefined;
      result = (result as z.ZodString).email(message);
    }
    if (rules.url) {
      const message = typeof rules.url === 'string' ? rules.url : undefined;
      result = (result as z.ZodString).url(message);
    }
    if (rules.uuid) {
      const message = typeof rules.uuid === 'string' ? rules.uuid : undefined;
      result = (result as z.ZodString).uuid(message);
    }
    if (rules.regex) {
      const flags = rules.regex.flags || '';
      const regex = new RegExp(rules.regex.pattern, flags);
      result = (result as z.ZodString).regex(regex, rules.regex.message);
    }
    if (rules.pattern) {
      const pattern =
        typeof rules.pattern === 'object'
          ? rules.pattern
          : { value: rules.pattern, message: undefined };
      result = (result as z.ZodString).regex(new RegExp(pattern.value), pattern.message);
    }
  }

  // Custom validation
  if (rules.custom && options.customValidators?.[rules.custom]) {
    const validator = options.customValidators[rules.custom];
    result = result.refine(
      (val) => {
        const validationResult = validator(val);
        return validationResult === true;
      },
      (val) => {
        const validationResult = validator(val);
        return {
          message: typeof validationResult === 'string' ? validationResult : 'Validation failed',
        };
      }
    );
  }

  return result;
}

/**
 * Generate a Zod schema for a single field
 */
function generateFieldSchema(field: FieldDefinition, options: ZodSchemaOptions): ZodTypeAny {
  let schema: ZodTypeAny;

  switch (field.type) {
    case 'text':
    case 'email':
    case 'password':
    case 'textarea':
    case 'hidden':
      schema = z.string();
      break;

    case 'number':
      schema = z.number();
      break;

    case 'checkbox':
    case 'switch':
      schema = z.boolean();
      break;

    case 'date':
    case 'datetime':
    case 'time':
      // Accept both Date objects and ISO strings
      schema = z.union([z.date(), z.string()]);
      break;

    case 'select':
    case 'radio':
    case 'autocomplete':
      // For select fields, we accept any value since options can be dynamic
      // Runtime validation should check against actual options
      schema = z.any();
      break;

    case 'multiselect':
      schema = z.array(z.any());
      break;

    case 'file':
      // File can be File object or null
      schema = z.any();
      break;

    case 'object':
      if (field.fields) {
        const shape: Record<string, ZodTypeAny> = {};
        for (const nestedField of field.fields) {
          shape[nestedField.name] = generateFieldSchema(nestedField, options);
        }
        schema = z.object(shape);
      } else {
        schema = z.record(z.any());
      }
      break;

    case 'array':
      if (field.itemType === 'object' && field.itemFields) {
        const itemShape: Record<string, ZodTypeAny> = {};
        for (const itemField of field.itemFields) {
          itemShape[itemField.name] = generateFieldSchema(itemField, options);
        }
        let arraySchema = z.array(z.object(itemShape));

        if (field.minItems !== undefined) {
          arraySchema = arraySchema.min(field.minItems);
        }
        if (field.maxItems !== undefined) {
          arraySchema = arraySchema.max(field.maxItems);
        }
        schema = arraySchema;
      } else {
        // Primitive array
        let itemSchema: ZodTypeAny;
        switch (field.itemType) {
          case 'number':
            itemSchema = z.number();
            break;
          case 'checkbox':
            itemSchema = z.boolean();
            break;
          default:
            itemSchema = z.string();
        }

        let arraySchema = z.array(itemSchema);
        if (field.minItems !== undefined) {
          arraySchema = arraySchema.min(field.minItems);
        }
        if (field.maxItems !== undefined) {
          arraySchema = arraySchema.max(field.maxItems);
        }
        schema = arraySchema;
      }
      break;

    default:
      schema = z.any();
  }

  // Apply validation rules
  schema = applyValidationRules(schema, field.validation, field.type, options);

  // Handle required/optional
  const isRequired = field.validation?.required;
  if (!isRequired || options.allOptional) {
    // For strings, also allow empty string
    if (
      field.type === 'text' ||
      field.type === 'email' ||
      field.type === 'password' ||
      field.type === 'textarea'
    ) {
      schema = schema.optional().or(z.literal(''));
    } else {
      schema = schema.optional();
    }
  } else if (typeof isRequired === 'string') {
    // Custom required message - use refine
    const baseSchema = schema;
    schema = z.any().refine(
      (val) => {
        if (val === undefined || val === null) return false;
        if (typeof val === 'string' && val.trim() === '') return false;
        if (Array.isArray(val) && val.length === 0) return false;
        // Validate against base schema
        const result = baseSchema.safeParse(val);
        return result.success;
      },
      { message: isRequired }
    );
  }

  return schema;
}

/**
 * Generate a Zod schema from an AutoForm schema
 */
export function generateZodSchema(
  formSchema: AutoFormSchema,
  options: ZodSchemaOptions = {}
): ZodObject<Record<string, ZodTypeAny>> {
  const shape: Record<string, ZodTypeAny> = {};

  for (const field of formSchema.fields) {
    shape[field.name] = generateFieldSchema(field, options);
  }

  return z.object(shape);
}

/**
 * Create a partial Zod schema (all fields optional)
 */
export function generatePartialZodSchema(
  formSchema: AutoFormSchema,
  options: ZodSchemaOptions = {}
): ZodObject<Record<string, ZodTypeAny>> {
  return generateZodSchema(formSchema, { ...options, allOptional: true });
}
