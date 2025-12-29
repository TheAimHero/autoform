import type { AutoFormSchema, FieldDefinition, FieldType } from '../types/schema';

/**
 * Valid field types
 */
const VALID_FIELD_TYPES: FieldType[] = [
  'text',
  'email',
  'password',
  'number',
  'textarea',
  'select',
  'multiselect',
  'autocomplete',
  'checkbox',
  'radio',
  'switch',
  'date',
  'datetime',
  'time',
  'file',
  'object',
  'array',
  'hidden',
];

/**
 * Schema validation error
 */
export class SchemaValidationError extends Error {
  constructor(
    message: string,
    public path: string,
    public details?: unknown
  ) {
    super(`Schema validation error at "${path}": ${message}`);
    this.name = 'SchemaValidationError';
  }
}

/**
 * Result of schema parsing
 */
export interface ParsedSchema {
  schema: AutoFormSchema;
  fieldPaths: string[];
  hasAsyncFields: boolean;
  hasConditionalFields: boolean;
  hasArrayFields: boolean;
  hasNestedObjects: boolean;
}

/**
 * Validate a single field definition
 */
function validateField(field: FieldDefinition, path: string): void {
  // Name is required
  if (!field.name || typeof field.name !== 'string') {
    throw new SchemaValidationError('Field must have a valid "name" string', path);
  }

  // Type is required and must be valid
  if (!field.type || !VALID_FIELD_TYPES.includes(field.type)) {
    throw new SchemaValidationError(
      `Field must have a valid "type". Got "${field.type}", expected one of: ${VALID_FIELD_TYPES.join(', ')}`,
      `${path}.${field.name}`
    );
  }

  // Object type must have fields
  if (field.type === 'object') {
    if (!field.fields || !Array.isArray(field.fields) || field.fields.length === 0) {
      throw new SchemaValidationError(
        'Object type field must have a non-empty "fields" array',
        `${path}.${field.name}`
      );
    }
    // Recursively validate nested fields
    for (const nestedField of field.fields) {
      validateField(nestedField, `${path}.${field.name}`);
    }
  }

  // Array type validation
  if (field.type === 'array') {
    if (!field.itemType) {
      throw new SchemaValidationError(
        'Array type field must have "itemType" defined',
        `${path}.${field.name}`
      );
    }

    // If itemType is 'object', must have itemFields
    if (field.itemType === 'object') {
      if (!field.itemFields || !Array.isArray(field.itemFields) || field.itemFields.length === 0) {
        throw new SchemaValidationError(
          'Array field with itemType "object" must have a non-empty "itemFields" array',
          `${path}.${field.name}`
        );
      }
      // Validate item fields
      for (const itemField of field.itemFields) {
        validateField(itemField, `${path}.${field.name}[]`);
      }
    }
  }

  // Select/radio/multiselect must have options or dataSourceKey
  if (['select', 'multiselect', 'radio'].includes(field.type)) {
    if (!field.options && !field.dataSourceKey) {
      throw new SchemaValidationError(
        `Field type "${field.type}" must have either "options" array or "dataSourceKey"`,
        `${path}.${field.name}`
      );
    }
  }

  // Validate condition if present
  if (field.condition) {
    if (!field.condition.when || typeof field.condition.when !== 'string') {
      throw new SchemaValidationError(
        'Condition must have a valid "when" field name',
        `${path}.${field.name}.condition`
      );
    }
    if (!field.condition.operator) {
      throw new SchemaValidationError(
        'Condition must have an "operator"',
        `${path}.${field.name}.condition`
      );
    }
  }

  // Validate dependsOn if present
  if (field.dependsOn) {
    if (!Array.isArray(field.dependsOn)) {
      throw new SchemaValidationError(
        '"dependsOn" must be an array of field names',
        `${path}.${field.name}`
      );
    }
  }
}

/**
 * Collect all field paths from schema
 */
function collectFieldPaths(fields: FieldDefinition[], basePath: string = ''): string[] {
  const paths: string[] = [];

  for (const field of fields) {
    const fieldPath = basePath ? `${basePath}.${field.name}` : field.name;
    paths.push(fieldPath);

    if (field.type === 'object' && field.fields) {
      paths.push(...collectFieldPaths(field.fields, fieldPath));
    }

    // For arrays, we don't add nested paths since they're dynamic
  }

  return paths;
}

/**
 * Check if schema has async fields (dataSourceKey)
 */
function hasAsyncFields(fields: FieldDefinition[]): boolean {
  for (const field of fields) {
    if (field.dataSourceKey) return true;
    if (field.type === 'object' && field.fields && hasAsyncFields(field.fields)) return true;
    if (field.type === 'array' && field.itemFields && hasAsyncFields(field.itemFields)) return true;
  }
  return false;
}

/**
 * Check if schema has conditional fields
 */
function hasConditionalFields(fields: FieldDefinition[]): boolean {
  for (const field of fields) {
    if (field.condition) return true;
    if (field.type === 'object' && field.fields && hasConditionalFields(field.fields)) return true;
    if (field.type === 'array' && field.itemFields && hasConditionalFields(field.itemFields))
      return true;
  }
  return false;
}

/**
 * Check if schema has array fields
 */
function hasArrayFields(fields: FieldDefinition[]): boolean {
  for (const field of fields) {
    if (field.type === 'array') return true;
    if (field.type === 'object' && field.fields && hasArrayFields(field.fields)) return true;
  }
  return false;
}

/**
 * Check if schema has nested objects
 */
function hasNestedObjects(fields: FieldDefinition[]): boolean {
  for (const field of fields) {
    if (field.type === 'object') return true;
  }
  return false;
}

/**
 * Parse and validate an AutoForm schema
 */
export function parseSchema(schema: AutoFormSchema): ParsedSchema {
  // Basic structure validation
  if (!schema || typeof schema !== 'object') {
    throw new SchemaValidationError('Schema must be an object', 'root');
  }

  if (!schema.fields || !Array.isArray(schema.fields)) {
    throw new SchemaValidationError('Schema must have a "fields" array', 'root');
  }

  if (schema.fields.length === 0) {
    throw new SchemaValidationError('Schema must have at least one field', 'root.fields');
  }

  // Validate each field
  for (const field of schema.fields) {
    validateField(field, 'root');
  }

  // Check for duplicate field names at root level
  const rootNames = new Set<string>();
  for (const field of schema.fields) {
    if (rootNames.has(field.name)) {
      throw new SchemaValidationError(`Duplicate field name "${field.name}" at root level`, 'root');
    }
    rootNames.add(field.name);
  }

  return {
    schema,
    fieldPaths: collectFieldPaths(schema.fields),
    hasAsyncFields: hasAsyncFields(schema.fields),
    hasConditionalFields: hasConditionalFields(schema.fields),
    hasArrayFields: hasArrayFields(schema.fields),
    hasNestedObjects: hasNestedObjects(schema.fields),
  };
}

/**
 * Get a field definition by path
 */
export function getFieldByPath(schema: AutoFormSchema, path: string): FieldDefinition | undefined {
  const parts = path.split('.');
  let fields = schema.fields;
  let field: FieldDefinition | undefined;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    // Handle array index notation (e.g., "items.0.name")
    if (/^\d+$/.test(part)) {
      // This is an array index, skip to next part
      continue;
    }

    field = fields.find((f) => f.name === part);
    if (!field) return undefined;

    if (i < parts.length - 1) {
      // Need to go deeper
      if (field.type === 'object' && field.fields) {
        fields = field.fields;
      } else if (field.type === 'array' && field.itemFields) {
        fields = field.itemFields;
      } else {
        return undefined;
      }
    }
  }

  return field;
}

/**
 * Get default values from schema
 */
export function getDefaultValues(schema: AutoFormSchema): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};

  function processFields(fields: FieldDefinition[], target: Record<string, unknown>) {
    for (const field of fields) {
      if (field.defaultValue !== undefined) {
        target[field.name] = field.defaultValue;
      } else if (field.type === 'object' && field.fields) {
        const nestedDefaults: Record<string, unknown> = {};
        processFields(field.fields, nestedDefaults);
        if (Object.keys(nestedDefaults).length > 0) {
          target[field.name] = nestedDefaults;
        }
      } else if (field.type === 'array') {
        target[field.name] = [];
      } else if (field.type === 'checkbox' || field.type === 'switch') {
        target[field.name] = false;
      }
    }
  }

  processFields(schema.fields, defaults);
  return defaults;
}
