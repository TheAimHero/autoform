import type {
  FieldType,
  FieldComponent,
  ArrayFieldComponent,
  ObjectFieldComponent,
  FormWrapperComponent,
} from '../types';

/**
 * Registry of field components mapped by field type
 */
export interface FieldRegistry {
  /**
   * Field components by type
   */
  fields: Partial<Record<FieldType, FieldComponent>>;

  /**
   * Array field wrapper component
   */
  arrayField?: ArrayFieldComponent;

  /**
   * Object field wrapper component
   */
  objectField?: ObjectFieldComponent;

  /**
   * Form wrapper component
   */
  formWrapper?: FormWrapperComponent;
}

/**
 * Configuration for creating a field registry
 */
export interface FieldRegistryConfig {
  /**
   * Map of field types to components
   */
  fields?: Partial<Record<FieldType, FieldComponent>>;

  /**
   * Array field wrapper
   */
  arrayField?: ArrayFieldComponent;

  /**
   * Object field wrapper
   */
  objectField?: ObjectFieldComponent;

  /**
   * Form wrapper
   */
  formWrapper?: FormWrapperComponent;
}

/**
 * Create a field registry with the given components
 */
export function createFieldRegistry(config: FieldRegistryConfig = {}): FieldRegistry {
  return {
    fields: config.fields || {},
    arrayField: config.arrayField,
    objectField: config.objectField,
    formWrapper: config.formWrapper,
  };
}

/**
 * Merge two registries, with the second taking precedence
 */
export function mergeRegistries(
  base: FieldRegistry,
  override: Partial<FieldRegistry>
): FieldRegistry {
  return {
    fields: { ...base.fields, ...override.fields },
    arrayField: override.arrayField ?? base.arrayField,
    objectField: override.objectField ?? base.objectField,
    formWrapper: override.formWrapper ?? base.formWrapper,
  };
}

/**
 * Get a field component from the registry
 */
export function getFieldComponent(
  registry: FieldRegistry,
  fieldType: FieldType
): FieldComponent | undefined {
  return registry.fields[fieldType];
}

/**
 * Check if a registry has a component for a field type
 */
export function hasFieldComponent(registry: FieldRegistry, fieldType: FieldType): boolean {
  return fieldType in registry.fields && registry.fields[fieldType] !== undefined;
}

/**
 * Get all registered field types
 */
export function getRegisteredFieldTypes(registry: FieldRegistry): FieldType[] {
  return Object.keys(registry.fields).filter(
    (key) => registry.fields[key as FieldType] !== undefined
  ) as FieldType[];
}

/**
 * Validate that a registry has all required components for a schema
 */
export function validateRegistryForSchema(
  registry: FieldRegistry,
  fieldTypes: FieldType[],
  options: { hasArrayFields?: boolean; hasNestedObjects?: boolean } = {}
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  // Check field types
  for (const type of fieldTypes) {
    if (!hasFieldComponent(registry, type) && type !== 'object' && type !== 'array') {
      missing.push(`fields.${type}`);
    }
  }

  // Check array field wrapper if needed
  if (options.hasArrayFields && !registry.arrayField) {
    missing.push('arrayField');
  }

  // Check object field wrapper if needed
  if (options.hasNestedObjects && !registry.objectField) {
    missing.push('objectField');
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
