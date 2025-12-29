// Components
export { AutoForm, createTypedAutoForm } from './components/AutoForm';
export type { AutoFormProps, AutoFormRenderProps } from './components/AutoForm';

export { AutoField, AutoFieldArray, FieldRendererProvider } from './components/FieldRenderer';
export type { AutoFieldProps } from './components/FieldRenderer';

// Schema utilities
export {
  parseSchema,
  getFieldByPath,
  getDefaultValues,
  SchemaValidationError,
} from './schema/parser';
export type { ParsedSchema } from './schema/parser';

export { generateZodSchema, generatePartialZodSchema } from './schema/zodGenerator';
export type { ZodSchemaOptions } from './schema/zodGenerator';

// Registry
export {
  createFieldRegistry,
  mergeRegistries,
  getFieldComponent,
  hasFieldComponent,
  getRegisteredFieldTypes,
  validateRegistryForSchema,
} from './registry';
export type { FieldRegistry, FieldRegistryConfig } from './registry';

// Data source
export { DataSourceManager, createDataSourceManager, clearDataSourceCache } from './datasource';

// Hooks
export { useAutoForm } from './hooks/useAutoForm';
export type { UseAutoFormOptions, UseAutoFormResult } from './hooks/useAutoForm';

export { useDataSource, clearCache, clearSourceCache } from './hooks/useDataSource';
export type { UseDataSourceOptions } from './hooks/useDataSource';

export { useFieldRenderer } from './hooks/useFieldRenderer';
export type { UseFieldRendererOptions, UseFieldRendererResult } from './hooks/useFieldRenderer';

// Context
export { AutoFormProvider, useAutoFormContext, useIsInsideAutoForm } from './context';
export type { AutoFormContextValue, AutoFormProviderProps } from './context';

// Types
export type {
  // Schema types
  FieldType,
  ValidationRules,
  ConditionConfig,
  LayoutConfig,
  FieldDefinition,
  AutoFormSchema,
  InferSchemaValues,

  // Component types
  FieldState,
  FieldOption,
  FieldComponentProps,
  FieldComponent,
  ArrayFieldComponentProps,
  ArrayFieldComponent,
  ObjectFieldComponentProps,
  ObjectFieldComponent,
  FormWrapperProps,
  FormWrapperComponent,

  // Data source types
  DataSourceFetchParams,
  DataSourceConfig,
  DataSourcesConfig,
  DataSourceState,
  UseDataSourceResult,
} from './types';
