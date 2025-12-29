import * as react_jsx_runtime from 'react/jsx-runtime';
import * as react from 'react';
import { Ref, ReactNode } from 'react';
import { FieldError, FieldValues, UseFormReturn, SubmitHandler, SubmitErrorHandler, Control, UseFormProps } from 'react-hook-form';
import { ZodObject, ZodTypeAny } from 'zod';
import { PrimitiveAtom } from 'jotai';

/**
 * Field types supported by AutoForm
 */
type FieldType = 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'multiselect' | 'autocomplete' | 'checkbox' | 'radio' | 'switch' | 'date' | 'datetime' | 'time' | 'file' | 'object' | 'array' | 'hidden';
/**
 * Validation rules that map to Zod validations
 */
interface ValidationRules {
    required?: boolean | string;
    min?: number | {
        value: number;
        message: string;
    };
    max?: number | {
        value: number;
        message: string;
    };
    minLength?: number | {
        value: number;
        message: string;
    };
    maxLength?: number | {
        value: number;
        message: string;
    };
    pattern?: string | {
        value: string;
        message: string;
    };
    email?: boolean | string;
    url?: boolean | string;
    uuid?: boolean | string;
    regex?: {
        pattern: string;
        flags?: string;
        message?: string;
    };
    custom?: string;
}
/**
 * Condition for conditional field rendering
 */
interface ConditionConfig {
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
interface LayoutConfig {
    type: 'vertical' | 'horizontal' | 'grid';
    columns?: number;
    gap?: string;
}
/**
 * Definition of a single form field
 */
interface FieldDefinition {
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
    /**
     * Nested field definitions for object type
     */
    fields?: FieldDefinition[];
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
interface AutoFormSchema {
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
type InferSchemaValues<_T extends AutoFormSchema> = Record<string, unknown>;

/**
 * State object passed to field components
 */
interface FieldState {
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
interface FieldOption<TValue = unknown> {
    label: string;
    value: TValue;
    disabled?: boolean;
}
/**
 * Props passed to every field component
 * This is the contract that custom components must implement
 */
interface FieldComponentProps<TValue = unknown> {
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
type FieldComponent<TValue = unknown> = React.ComponentType<FieldComponentProps<TValue>>;
/**
 * Props for array field component
 */
interface ArrayFieldComponentProps {
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
    fields: Array<{
        id: string;
        index: number;
    }>;
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
type ArrayFieldComponent = React.ComponentType<ArrayFieldComponentProps>;
/**
 * Props for object field wrapper component
 */
interface ObjectFieldComponentProps {
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
type ObjectFieldComponent = React.ComponentType<ObjectFieldComponentProps>;
/**
 * Form wrapper component props
 */
interface FormWrapperProps {
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
type FormWrapperComponent = React.ComponentType<FormWrapperProps>;

/**
 * Parameters passed to data source fetch function
 */
interface DataSourceFetchParams {
    /**
     * Values of fields this data source depends on
     * Key is the field name, value is the current field value
     */
    dependencies?: Record<string, unknown>;
    /**
     * Search query for autocomplete fields
     */
    searchQuery?: string;
    /**
     * AbortSignal for cancelling the request
     */
    signal?: AbortSignal;
}
/**
 * Configuration for a single data source
 */
interface DataSourceConfig<TData = unknown, TValue = unknown> {
    /**
     * Function to fetch the data
     */
    fetch: (params: DataSourceFetchParams) => Promise<TData>;
    /**
     * Transform the fetched data into options
     */
    transform: (data: TData) => FieldOption<TValue>[];
    /**
     * Generate a cache key for the request
     * If not provided, a default key based on dependencies is used
     */
    cacheKey?: (params: DataSourceFetchParams) => string;
    /**
     * Time in milliseconds before cached data is considered stale
     * @default 30000 (30 seconds)
     */
    staleTime?: number;
    /**
     * Error handler for fetch failures
     */
    onError?: (error: Error) => void;
    /**
     * Debounce time for search queries (autocomplete)
     * @default 300
     */
    debounceMs?: number;
}
/**
 * Map of data source keys to their configurations
 */
type DataSourcesConfig = Record<string, DataSourceConfig>;
/**
 * Internal state of a data source
 */
interface DataSourceState<TValue = unknown> {
    /**
     * Current options (result of transform)
     */
    options: FieldOption<TValue>[];
    /**
     * Whether currently loading
     */
    isLoading: boolean;
    /**
     * Error if fetch failed
     */
    error: Error | null;
    /**
     * Last successful fetch timestamp
     */
    lastFetched: number | null;
}
/**
 * Result of useDataSource hook
 */
interface UseDataSourceResult<TValue = unknown> {
    /**
     * Current options
     */
    options: FieldOption<TValue>[];
    /**
     * Whether loading
     */
    isLoading: boolean;
    /**
     * Error if any
     */
    error: Error | null;
    /**
     * Refetch the data
     */
    refetch: () => void;
    /**
     * Search handler for autocomplete
     */
    onSearch: (query: string) => void;
}

/**
 * Registry of field components mapped by field type
 */
interface FieldRegistry {
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
interface FieldRegistryConfig {
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
declare function createFieldRegistry(config?: FieldRegistryConfig): FieldRegistry;
/**
 * Merge two registries, with the second taking precedence
 */
declare function mergeRegistries(base: FieldRegistry, override: Partial<FieldRegistry>): FieldRegistry;
/**
 * Get a field component from the registry
 */
declare function getFieldComponent(registry: FieldRegistry, fieldType: FieldType): FieldComponent | undefined;
/**
 * Check if a registry has a component for a field type
 */
declare function hasFieldComponent(registry: FieldRegistry, fieldType: FieldType): boolean;
/**
 * Get all registered field types
 */
declare function getRegisteredFieldTypes(registry: FieldRegistry): FieldType[];
/**
 * Validate that a registry has all required components for a schema
 */
declare function validateRegistryForSchema(registry: FieldRegistry, fieldTypes: FieldType[], options?: {
    hasArrayFields?: boolean;
    hasNestedObjects?: boolean;
}): {
    valid: boolean;
    missing: string[];
};

/**
 * Props for AutoForm component
 */
interface AutoFormProps<TFieldValues extends FieldValues = FieldValues> {
    /**
     * Form schema definition
     */
    schema: AutoFormSchema;
    /**
     * React Hook Form instance (from useForm or useAutoForm)
     */
    form: UseFormReturn<TFieldValues>;
    /**
     * Field registry mapping types to components
     */
    registry: FieldRegistry;
    /**
     * Data sources configuration for async fields
     */
    dataSources?: DataSourcesConfig;
    /**
     * Submit handler
     */
    onSubmit?: SubmitHandler<TFieldValues>;
    /**
     * Error handler for submission errors
     */
    onError?: SubmitErrorHandler<TFieldValues>;
    /**
     * Whether the form is in loading state
     */
    isLoading?: boolean;
    /**
     * Whether the form is disabled
     */
    isDisabled?: boolean;
    /**
     * Whether all fields are read-only
     */
    isReadOnly?: boolean;
    /**
     * CSS class name for the form
     */
    className?: string;
    /**
     * Render prop for custom form layout
     * If provided, schema fields are passed to this function
     */
    children?: ReactNode | ((props: AutoFormRenderProps) => ReactNode);
}
/**
 * Props passed to render function
 */
interface AutoFormRenderProps {
    /**
     * Render all fields in schema order
     */
    fields: ReactNode;
    /**
     * Render a specific field by name
     */
    Field: React.ComponentType<{
        name: string;
    }>;
    /**
     * Form state
     */
    formState: UseFormReturn['formState'];
    /**
     * Whether form is submitting
     */
    isSubmitting: boolean;
    /**
     * Whether form is valid
     */
    isValid: boolean;
}
/**
 * Main AutoForm component
 */
declare function AutoForm<TFieldValues extends FieldValues = FieldValues>({ schema, form, registry, dataSources, onSubmit, onError, isLoading, isDisabled, isReadOnly, className, children, }: AutoFormProps<TFieldValues>): react_jsx_runtime.JSX.Element;
declare namespace AutoForm {
    var displayName: string;
}
/**
 * HOC to create a typed AutoForm component
 */
declare function createTypedAutoForm<TFieldValues extends FieldValues>(): React.ComponentType<AutoFormProps<TFieldValues>>;

/**
 * Props for AutoField component
 */
interface AutoFieldProps {
    field: FieldDefinition;
    control: Control<any>;
    registry: FieldRegistry;
    dataSources: DataSourcesConfig;
    basePath?: string;
    isDisabled?: boolean;
    isReadOnly?: boolean;
}
/**
 * Provider and entry point for field rendering
 */
declare function FieldRendererProvider({ children }: {
    children: ReactNode;
}): react_jsx_runtime.JSX.Element;
/**
 * AutoField component - renders a single field
 */
declare const AutoField: react.NamedExoticComponent<AutoFieldProps>;
/**
 * AutoFieldArray component - renders an array field
 */
declare const AutoFieldArray: react.NamedExoticComponent<AutoFieldProps>;

/**
 * Schema validation error
 */
declare class SchemaValidationError extends Error {
    path: string;
    details?: unknown | undefined;
    constructor(message: string, path: string, details?: unknown | undefined);
}
/**
 * Result of schema parsing
 */
interface ParsedSchema {
    schema: AutoFormSchema;
    fieldPaths: string[];
    hasAsyncFields: boolean;
    hasConditionalFields: boolean;
    hasArrayFields: boolean;
    hasNestedObjects: boolean;
}
/**
 * Parse and validate an AutoForm schema
 */
declare function parseSchema(schema: AutoFormSchema): ParsedSchema;
/**
 * Get a field definition by path
 */
declare function getFieldByPath(schema: AutoFormSchema, path: string): FieldDefinition | undefined;
/**
 * Get default values from schema
 */
declare function getDefaultValues(schema: AutoFormSchema): Record<string, unknown>;

/**
 * Options for Zod schema generation
 */
interface ZodSchemaOptions {
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
 * Generate a Zod schema from an AutoForm schema
 */
declare function generateZodSchema(formSchema: AutoFormSchema, options?: ZodSchemaOptions): ZodObject<Record<string, ZodTypeAny>>;
/**
 * Create a partial Zod schema (all fields optional)
 */
declare function generatePartialZodSchema(formSchema: AutoFormSchema, options?: ZodSchemaOptions): ZodObject<Record<string, ZodTypeAny>>;

/**
 * Data source manager for handling multiple data sources
 */
declare class DataSourceManager {
    private configs;
    private atoms;
    constructor(configs?: DataSourcesConfig);
    /**
     * Get or create an atom for a data source
     */
    getAtom(sourceKey: string): PrimitiveAtom<DataSourceState> | undefined;
    /**
     * Get the configuration for a data source
     */
    getConfig(sourceKey: string): DataSourceConfig | undefined;
    /**
     * Check if a data source exists
     */
    has(sourceKey: string): boolean;
    /**
     * Add a new data source configuration
     */
    addSource(sourceKey: string, config: DataSourceConfig): void;
    /**
     * Remove a data source
     */
    removeSource(sourceKey: string): void;
    /**
     * Clear all cached data
     */
    clearCache(): void;
    /**
     * Clear cache for a specific source
     */
    clearSourceCache(sourceKey: string): void;
}
/**
 * Create a data source manager instance
 */
declare function createDataSourceManager(configs?: DataSourcesConfig): DataSourceManager;
/**
 * Clear all data source cache
 */
declare function clearDataSourceCache(): void;

/**
 * Options for useAutoForm hook
 */
interface UseAutoFormOptions<TFieldValues extends FieldValues = FieldValues> extends Omit<UseFormProps<TFieldValues>, 'resolver' | 'defaultValues'> {
    /**
     * The form schema
     */
    schema: AutoFormSchema;
    /**
     * Default values (merged with schema defaults)
     */
    defaultValues?: Partial<TFieldValues>;
    /**
     * Zod schema generation options
     */
    zodOptions?: ZodSchemaOptions;
}
/**
 * Result of useAutoForm hook
 */
interface UseAutoFormResult<TFieldValues extends FieldValues = FieldValues> {
    /**
     * React Hook Form instance
     */
    form: UseFormReturn<TFieldValues>;
    /**
     * Generated Zod schema
     */
    zodSchema: ReturnType<typeof generateZodSchema>;
}
/**
 * Hook that sets up react-hook-form with auto-generated Zod schema
 */
declare function useAutoForm<TFieldValues extends FieldValues = FieldValues>(options: UseAutoFormOptions<TFieldValues>): UseAutoFormResult<TFieldValues>;

/**
 * Options for useDataSource hook
 */
interface UseDataSourceOptions {
    /**
     * Data source configuration
     */
    config: DataSourceConfig;
    /**
     * Unique key for this data source
     */
    sourceKey: string;
    /**
     * Field names this data source depends on
     */
    dependsOn?: string[];
    /**
     * React Hook Form control (for watching dependencies)
     */
    control?: Control<any>;
    /**
     * Whether to fetch on mount
     * @default true
     */
    fetchOnMount?: boolean;
    /**
     * Whether the data source is enabled
     * @default true
     */
    enabled?: boolean;
}
/**
 * Hook for managing async data sources
 */
declare function useDataSource<TValue = unknown>(options: UseDataSourceOptions): UseDataSourceResult<TValue>;
/**
 * Clear all data source cache
 */
declare function clearCache(): void;
/**
 * Clear cache for a specific source
 */
declare function clearSourceCache(sourceKey: string): void;

/**
 * Options for useFieldRenderer hook
 */
interface UseFieldRendererOptions {
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
interface UseFieldRendererResult {
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
 * Hook for preparing field rendering
 */
declare function useFieldRenderer(hookOptions: UseFieldRendererOptions): UseFieldRendererResult;

/**
 * Context value for AutoForm
 */
interface AutoFormContextValue<TFieldValues extends FieldValues = FieldValues> {
    /**
     * React Hook Form instance
     */
    form: UseFormReturn<TFieldValues>;
    /**
     * The form schema
     */
    schema: AutoFormSchema;
    /**
     * Field registry for component lookup
     */
    registry: FieldRegistry;
    /**
     * Data source manager for async fields
     */
    dataSourceManager: DataSourceManager;
    /**
     * Data sources configuration
     */
    dataSources: DataSourcesConfig;
    /**
     * Whether the form is in a loading state
     */
    isLoading?: boolean;
    /**
     * Whether the form is disabled
     */
    isDisabled?: boolean;
    /**
     * Whether all fields are read-only
     */
    isReadOnly?: boolean;
}
/**
 * Provider props
 */
interface AutoFormProviderProps<TFieldValues extends FieldValues = FieldValues> {
    value: AutoFormContextValue<TFieldValues>;
    children: ReactNode;
}
/**
 * AutoForm context provider
 */
declare function AutoFormProvider<TFieldValues extends FieldValues = FieldValues>({ value, children, }: AutoFormProviderProps<TFieldValues>): react_jsx_runtime.JSX.Element;
/**
 * Hook to access AutoForm context
 * @throws Error if used outside of AutoFormProvider
 */
declare function useAutoFormContext<TFieldValues extends FieldValues = FieldValues>(): AutoFormContextValue<TFieldValues>;
/**
 * Hook to check if we're inside AutoForm context
 */
declare function useIsInsideAutoForm(): boolean;

export { type ArrayFieldComponent, type ArrayFieldComponentProps, AutoField, AutoFieldArray, type AutoFieldProps, AutoForm, type AutoFormContextValue, type AutoFormProps, AutoFormProvider, type AutoFormProviderProps, type AutoFormRenderProps, type AutoFormSchema, type ConditionConfig, type DataSourceConfig, type DataSourceFetchParams, DataSourceManager, type DataSourceState, type DataSourcesConfig, type FieldComponent, type FieldComponentProps, type FieldDefinition, type FieldOption, type FieldRegistry, type FieldRegistryConfig, FieldRendererProvider, type FieldState, type FieldType, type FormWrapperComponent, type FormWrapperProps, type InferSchemaValues, type LayoutConfig, type ObjectFieldComponent, type ObjectFieldComponentProps, type ParsedSchema, SchemaValidationError, type UseAutoFormOptions, type UseAutoFormResult, type UseDataSourceOptions, type UseDataSourceResult, type UseFieldRendererOptions, type UseFieldRendererResult, type ValidationRules, type ZodSchemaOptions, clearCache, clearDataSourceCache, clearSourceCache, createDataSourceManager, createFieldRegistry, createTypedAutoForm, generatePartialZodSchema, generateZodSchema, getDefaultValues, getFieldByPath, getFieldComponent, getRegisteredFieldTypes, hasFieldComponent, mergeRegistries, parseSchema, useAutoForm, useAutoFormContext, useDataSource, useFieldRenderer, useIsInsideAutoForm, validateRegistryForSchema };
