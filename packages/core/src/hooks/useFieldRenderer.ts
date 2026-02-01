import { useMemo } from 'react';
import { useController, useWatch } from 'react-hook-form';
import type { Control } from 'react-hook-form';
import type { FieldDefinition, FieldComponentProps, FieldState, FieldOption } from '../types';
import type { FieldRegistry } from '../registry';
import { useDataSource } from './useDataSource';
import type { DataSourcesConfig } from '../types';

/**
 * Options for useFieldRenderer hook
 */
export interface UseFieldRendererOptions {
  /**
   * Field definition from schema
   */
  field: FieldDefinition;

  /**
   * React Hook Form control
   */
  control: Control<any>;

  /**
   * Field registry
   */
  registry: FieldRegistry;

  /**
   * Data sources configuration
   */
  dataSources: DataSourcesConfig;

  /**
   * Base path for nested fields
   */
  basePath?: string;

  /**
   * Whether the field is disabled
   */
  isDisabled?: boolean;

  /**
   * Whether the field is read-only
   */
  isReadOnly?: boolean;
}

/**
 * Result of useFieldRenderer hook
 */
export interface UseFieldRendererResult {
  /**
   * Props to pass to the field component
   */
  fieldProps: FieldComponentProps;

  /**
   * The component to render
   */
  Component: React.ComponentType<FieldComponentProps> | undefined;

  /**
   * Whether the field should be rendered (based on conditions)
   */
  shouldRender: boolean;

  /**
   * Full field path
   */
  fieldPath: string;
}

/**
 * Evaluate a condition
 */
function evaluateCondition(
  condition: FieldDefinition['condition'],
  formValues: Record<string, unknown>
): boolean {
  if (!condition) return true;

  const { when, operator, value } = condition;
  const fieldValue = getNestedValue(formValues, when);

  switch (operator) {
    case 'eq':
      return fieldValue === value;
    case 'neq':
      return fieldValue !== value;
    case 'gt':
      return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue > value;
    case 'gte':
      return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue >= value;
    case 'lt':
      return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue < value;
    case 'lte':
      return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue <= value;
    case 'in':
      return Array.isArray(value) && value.includes(fieldValue);
    case 'notIn':
      return Array.isArray(value) && !value.includes(fieldValue);
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
    case 'notExists':
      return fieldValue === undefined || fieldValue === null || fieldValue === '';
    default:
      return true;
  }
}

/**
 * Get nested value from object by path
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj as unknown);
}

/**
 * Hook for preparing field rendering
 */
export function useFieldRenderer(hookOptions: UseFieldRendererOptions): UseFieldRendererResult {
  const {
    field,
    control,
    registry,
    dataSources,
    basePath = '',
    isDisabled = false,
    isReadOnly = false,
  } = hookOptions;

  // Compute full field path
  const fieldPath = basePath ? `${basePath}.${field.name}` : field.name;

  // Get the field component
  const Component = registry.fields[field.type];

  // Use controller for field state
  const { field: controllerField, fieldState } = useController({
    name: fieldPath,
    control,
    defaultValue: field.defaultValue,
  });

  // Watch all form values for condition evaluation
  const formValues = useWatch({ control });

  // Evaluate condition
  const shouldRender = useMemo(
    () => evaluateCondition(field.condition, formValues as Record<string, unknown>),
    [field.condition, formValues]
  );

  // Get data source config if needed
  const dataSourceConfig = field.dataSourceKey ? dataSources[field.dataSourceKey] : undefined;

  // Use data source if configured
  const dataSourceResult = useDataSource({
    config: dataSourceConfig || {
      fetch: async () => [],
      transform: (data) => data as FieldOption[],
    },
    sourceKey: field.dataSourceKey || fieldPath,
    dependsOn: field.dependsOn,
    control,
    fetchOnMount: !!dataSourceConfig,
    enabled: !!dataSourceConfig && shouldRender,
  });

  // Merge static options with async options
  const options: FieldOption[] = useMemo(() => {
    if (dataSourceConfig) {
      return dataSourceResult.options;
    }
    return field.options || [];
  }, [field.options, dataSourceConfig, dataSourceResult.options]);

  // Build field state
  const state: FieldState = useMemo(
    () => ({
      isLoading: dataSourceResult.isLoading,
      isDisabled: isDisabled || field.disabled || false,
      isRequired: !!field.validation?.required,
      isTouched: fieldState.isTouched,
      isDirty: fieldState.isDirty,
      isReadOnly: isReadOnly || field.readOnly || false,
    }),
    [
      dataSourceResult.isLoading,
      isDisabled,
      field.disabled,
      field.validation?.required,
      fieldState.isTouched,
      fieldState.isDirty,
      isReadOnly,
      field.readOnly,
    ]
  );

  // Build props for the component
  const fieldProps: FieldComponentProps = useMemo(
    () => ({
      name: fieldPath,
      value: controllerField.value,
      onChange: controllerField.onChange,
      onBlur: controllerField.onBlur,
      inputRef: controllerField.ref,
      label: field.label,
      placeholder: field.placeholder,
      description: field.description,
      options,
      state,
      error: fieldState.error,
      onSearch: dataSourceConfig ? dataSourceResult.onSearch : undefined,
      fieldProps: field.fieldProps,
      className: field.className,
    }),
    [
      fieldPath,
      controllerField,
      field.label,
      field.placeholder,
      field.description,
      field.fieldProps,
      field.className,
      options,
      state,
      fieldState.error,
      dataSourceConfig,
      dataSourceResult.onSearch,
    ]
  );

  return {
    fieldProps,
    Component,
    shouldRender,
    fieldPath,
  };
}
