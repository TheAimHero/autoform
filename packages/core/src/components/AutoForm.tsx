import { useMemo, ReactNode } from 'react';
import type {
  UseFormReturn,
  FieldValues,
  SubmitHandler,
  SubmitErrorHandler,
} from 'react-hook-form';
import type { AutoFormSchema, DataSourcesConfig } from '../types';
import type { FieldRegistry } from '../registry';
import { createDataSourceManager } from '../datasource';
import { AutoFormProvider, type AutoFormContextValue } from '../context';
import { AutoField, FieldRendererProvider } from './FieldRenderer';

/**
 * Props for AutoForm component
 */
export interface AutoFormProps<TFieldValues extends FieldValues = FieldValues> {
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
export interface AutoFormRenderProps {
  /**
   * Render all fields in schema order
   */
  fields: ReactNode;

  /**
   * Render a specific field by name
   */
  Field: React.ComponentType<{ name: string }>;

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
export function AutoForm<TFieldValues extends FieldValues = FieldValues>({
  schema,
  form,
  registry,
  dataSources = {},
  onSubmit,
  onError,
  isLoading = false,
  isDisabled = false,
  isReadOnly = false,
  className,
  children,
}: AutoFormProps<TFieldValues>) {
  // Create data source manager
  const dataSourceManager = useMemo(() => createDataSourceManager(dataSources), [dataSources]);

  // Create context value
  const contextValue: AutoFormContextValue<TFieldValues> = useMemo(
    () => ({
      form,
      schema,
      registry,
      dataSourceManager,
      dataSources,
      isLoading,
      isDisabled,
      isReadOnly,
    }),
    [form, schema, registry, dataSourceManager, dataSources, isLoading, isDisabled, isReadOnly]
  );

  // Handle submit
  const handleSubmit = form.handleSubmit(onSubmit || (() => {}), onError);

  // Render all fields
  const renderedFields = useMemo(
    () => (
      <>
        {schema.fields.map((field) => (
          <AutoField
            key={field.name}
            field={field}
            control={form.control}
            registry={registry}
            dataSources={dataSources}
            isDisabled={isDisabled}
            isReadOnly={isReadOnly}
          />
        ))}
      </>
    ),
    [schema.fields, form.control, registry, dataSources, isDisabled, isReadOnly]
  );

  // Field component for rendering specific fields
  const FieldByName = useMemo(() => {
    const Component = ({ name }: { name: string }) => {
      const field = schema.fields.find((f) => f.name === name);
      if (!field) {
        return null;
      }
      return (
        <AutoField
          field={field}
          control={form.control}
          registry={registry}
          dataSources={dataSources}
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
        />
      );
    };
    Component.displayName = 'AutoFormField';
    return Component;
  }, [schema.fields, form.control, registry, dataSources, isDisabled, isReadOnly]);

  // Render props for custom layout
  const renderProps: AutoFormRenderProps = {
    fields: renderedFields,
    Field: FieldByName,
    formState: form.formState,
    isSubmitting: form.formState.isSubmitting,
    isValid: form.formState.isValid,
  };

  // Form content
  const formContent =
    typeof children === 'function' ? children(renderProps) : (children ?? renderedFields);

  // Use custom form wrapper if provided
  const FormWrapper = registry.formWrapper;

  if (FormWrapper) {
    return (
      <AutoFormProvider value={contextValue}>
        <FieldRendererProvider>
          <FormWrapper onSubmit={handleSubmit} className={className}>
            {formContent}
          </FormWrapper>
        </FieldRendererProvider>
      </AutoFormProvider>
    );
  }

  // Default form element
  return (
    <AutoFormProvider value={contextValue}>
      <FieldRendererProvider>
        <form onSubmit={handleSubmit} className={className}>
          {formContent}
        </form>
      </FieldRendererProvider>
    </AutoFormProvider>
  );
}

AutoForm.displayName = 'AutoForm';

/**
 * HOC to create a typed AutoForm component
 */
export function createTypedAutoForm<TFieldValues extends FieldValues>() {
  return AutoForm as React.ComponentType<AutoFormProps<TFieldValues>>;
}
