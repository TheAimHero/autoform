import type { FieldError } from 'react-hook-form';
import type { ReactNode, Ref } from 'react';

/**
 * State object passed to field components
 */
export interface FieldState {
  /**
   * Whether the data source is loading (for async fields)
   */
  isLoading: boolean;

  /**
   * Whether the field is disabled
   */
  isDisabled: boolean;

  /**
   * Whether the field is required
   */
  isRequired: boolean;

  /**
   * Whether the field has been touched (blurred)
   */
  isTouched: boolean;

  /**
   * Whether the field value has been modified
   */
  isDirty: boolean;

  /**
   * Whether the field is read-only
   */
  isReadOnly: boolean;
}

/**
 * Option type for select, radio, autocomplete fields
 */
export interface FieldOption<TValue = unknown> {
  label: string;
  value: TValue;
  disabled?: boolean;
}

/**
 * Props passed to every field component
 * This is the contract that custom components must implement
 */
export interface FieldComponentProps<TValue = unknown> {
  /**
   * Field name (path) - used for identification
   */
  name: string;

  /**
   * Current field value
   */
  value: TValue;

  /**
   * Callback to update the field value
   */
  onChange: (value: TValue) => void;

  /**
   * Callback when field loses focus
   */
  onBlur: () => void;

  /**
   * Ref for the input element (for focus management)
   */
  inputRef?: Ref<HTMLElement>;

  /**
   * Display label
   */
  label?: string;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Help text/description
   */
  description?: string;

  /**
   * Options for select/radio/autocomplete fields
   */
  options?: FieldOption<TValue>[];

  /**
   * Field state flags
   */
  state: FieldState;

  /**
   * Validation error if any
   */
  error?: FieldError;

  /**
   * Callback for autocomplete search
   */
  onSearch?: (query: string) => void;

  /**
   * Additional props passed from schema
   */
  fieldProps?: Record<string, unknown>;

  /**
   * CSS class name
   */
  className?: string;
}

/**
 * Type for a field component
 */
export type FieldComponent<TValue = unknown> = React.ComponentType<FieldComponentProps<TValue>>;

/**
 * Props for array field component
 */
export interface ArrayFieldComponentProps {
  /**
   * Field name (path)
   */
  name: string;

  /**
   * Display label
   */
  label?: string;

  /**
   * Help text/description
   */
  description?: string;

  /**
   * Current array items
   */
  fields: Array<{ id: string; index: number }>;

  /**
   * Render function for each item
   */
  renderItem: (index: number) => ReactNode;

  /**
   * Add a new item
   */
  onAppend: (value?: unknown) => void;

  /**
   * Remove an item at index
   */
  onRemove: (index: number) => void;

  /**
   * Move an item from one index to another
   */
  onMove: (fromIndex: number, toIndex: number) => void;

  /**
   * Field state
   */
  state: FieldState;

  /**
   * Error for the array field itself
   */
  error?: FieldError;

  /**
   * Minimum items required
   */
  minItems?: number;

  /**
   * Maximum items allowed
   */
  maxItems?: number;

  /**
   * Additional props
   */
  fieldProps?: Record<string, unknown>;

  /**
   * CSS class name
   */
  className?: string;
}

/**
 * Type for array field wrapper component
 */
export type ArrayFieldComponent = React.ComponentType<ArrayFieldComponentProps>;

/**
 * Props for object field wrapper component
 */
export interface ObjectFieldComponentProps {
  /**
   * Field name (path)
   */
  name: string;

  /**
   * Display label
   */
  label?: string;

  /**
   * Help text/description
   */
  description?: string;

  /**
   * Rendered child fields
   */
  children: ReactNode;

  /**
   * Field state
   */
  state: FieldState;

  /**
   * Error for the object field itself
   */
  error?: FieldError;

  /**
   * Additional props
   */
  fieldProps?: Record<string, unknown>;

  /**
   * CSS class name
   */
  className?: string;
}

/**
 * Type for object field wrapper component
 */
export type ObjectFieldComponent = React.ComponentType<ObjectFieldComponentProps>;

/**
 * Form wrapper component props
 */
export interface FormWrapperProps {
  /**
   * Form children
   */
  children: ReactNode;

  /**
   * Submit handler
   */
  onSubmit: (e: React.FormEvent) => void;

  /**
   * CSS class name
   */
  className?: string;
}

/**
 * Type for form wrapper component
 */
export type FormWrapperComponent = React.ComponentType<FormWrapperProps>;
