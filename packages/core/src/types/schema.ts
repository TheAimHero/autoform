/**
 * Field types supported by AutoForm
 */
export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'autocomplete'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'date'
  | 'datetime'
  | 'time'
  | 'file'
  | 'object'
  | 'array'
  | 'hidden';

/**
 * Validation rules that map to Zod validations
 */
export interface ValidationRules {
  required?: boolean | string; // string is custom error message
  min?: number | { value: number; message: string };
  max?: number | { value: number; message: string };
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  pattern?: string | { value: string; message: string };
  email?: boolean | string;
  url?: boolean | string;
  uuid?: boolean | string;
  regex?: { pattern: string; flags?: string; message?: string };
  custom?: string; // Reference to a custom validation function key
}

/**
 * Condition for conditional field rendering
 */
export interface ConditionConfig {
  /**
   * Field name to watch
   */
  when: string;
  /**
   * Operator for comparison
   */
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'notIn' | 'exists' | 'notExists';
  /**
   * Value to compare against
   */
  value?: unknown;
}

/**
 * Layout configuration for form sections
 */
export interface LayoutConfig {
  type: 'vertical' | 'horizontal' | 'grid';
  columns?: number;
  gap?: string;
}

/**
 * Definition of a single form field
 */
export interface FieldDefinition {
  /**
   * Unique field name - used for form registration
   * Supports dot notation for nested paths: "address.city"
   */
  name: string;

  /**
   * Type of the field - determines which component to render
   */
  type: FieldType;

  /**
   * Display label for the field
   */
  label?: string;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Help text/description shown below the field
   */
  description?: string;

  /**
   * Default value for the field
   */
  defaultValue?: unknown;

  /**
   * Validation rules
   */
  validation?: ValidationRules;

  /**
   * Key to lookup in dataSources config for async options
   */
  dataSourceKey?: string;

  /**
   * List of field names this field depends on
   * When any of these change, the data source is refetched
   */
  dependsOn?: string[];

  /**
   * Condition for when to render this field
   */
  condition?: ConditionConfig;

  /**
   * Whether the field is disabled
   */
  disabled?: boolean;

  /**
   * Whether the field is read-only
   */
  readOnly?: boolean;

  /**
   * Additional props passed directly to the component
   */
  fieldProps?: Record<string, unknown>;

  /**
   * CSS class name for the field wrapper
   */
  className?: string;

  // ---- For object type fields ----

  /**
   * Nested field definitions for object type
   */
  fields?: FieldDefinition[];

  // ---- For array type fields ----

  /**
   * Type of items in the array
   */
  itemType?: FieldType | 'object';

  /**
   * Field definitions for object items in array
   */
  itemFields?: FieldDefinition[];

  /**
   * Field definition for primitive items in array
   */
  itemDefinition?: Omit<FieldDefinition, 'name'>;

  /**
   * Minimum number of items required
   */
  minItems?: number;

  /**
   * Maximum number of items allowed
   */
  maxItems?: number;

  // ---- For select/radio type fields ----

  /**
   * Static options for select/radio fields
   */
  options?: Array<{
    label: string;
    value: unknown;
    disabled?: boolean;
  }>;
}

/**
 * Root schema definition for AutoForm
 */
export interface AutoFormSchema {
  /**
   * Array of field definitions
   */
  fields: FieldDefinition[];

  /**
   * Optional layout configuration
   */
  layout?: LayoutConfig;
}

/**
 * Inferred form values type helper
 * This provides a basic type - for full type safety, use Zod's infer
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type InferSchemaValues<_T extends AutoFormSchema> = Record<string, unknown>;
