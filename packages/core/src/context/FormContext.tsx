import { createContext, useContext, ReactNode } from 'react';
import type { UseFormReturn, FieldValues } from 'react-hook-form';
import type { AutoFormSchema, DataSourcesConfig } from '../types';
import type { FieldRegistry } from '../registry';
import type { DataSourceManager } from '../datasource';

/**
 * Context value for AutoForm
 */
export interface AutoFormContextValue<TFieldValues extends FieldValues = FieldValues> {
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
 * AutoForm context
 */
const AutoFormContext = createContext<AutoFormContextValue | null>(null);

/**
 * Provider props
 */
export interface AutoFormProviderProps<TFieldValues extends FieldValues = FieldValues> {
  value: AutoFormContextValue<TFieldValues>;
  children: ReactNode;
}

/**
 * AutoForm context provider
 */
export function AutoFormProvider<TFieldValues extends FieldValues = FieldValues>({
  value,
  children,
}: AutoFormProviderProps<TFieldValues>) {
  return (
    <AutoFormContext.Provider value={value as AutoFormContextValue}>
      {children}
    </AutoFormContext.Provider>
  );
}

/**
 * Hook to access AutoForm context
 * @throws Error if used outside of AutoFormProvider
 */
export function useAutoFormContext<
  TFieldValues extends FieldValues = FieldValues,
>(): AutoFormContextValue<TFieldValues> {
  const context = useContext(AutoFormContext);

  if (!context) {
    throw new Error(
      'useAutoFormContext must be used within an AutoFormProvider. ' +
        'Make sure your component is wrapped with <AutoForm> or <AutoFormProvider>.'
    );
  }

  return context as AutoFormContextValue<TFieldValues>;
}

/**
 * Hook to check if we're inside AutoForm context
 */
export function useIsInsideAutoForm(): boolean {
  const context = useContext(AutoFormContext);
  return context !== null;
}
