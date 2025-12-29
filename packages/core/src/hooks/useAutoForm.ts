import { useMemo } from 'react';
import { useForm, UseFormReturn, UseFormProps, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { AutoFormSchema } from '../types';
import { generateZodSchema, type ZodSchemaOptions } from '../schema/zodGenerator';
import { getDefaultValues } from '../schema/parser';

/**
 * Options for useAutoForm hook
 */
export interface UseAutoFormOptions<TFieldValues extends FieldValues = FieldValues> extends Omit<
  UseFormProps<TFieldValues>,
  'resolver' | 'defaultValues'
> {
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
export interface UseAutoFormResult<TFieldValues extends FieldValues = FieldValues> {
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
export function useAutoForm<TFieldValues extends FieldValues = FieldValues>(
  options: UseAutoFormOptions<TFieldValues>
): UseAutoFormResult<TFieldValues> {
  const { schema, defaultValues, zodOptions, ...formOptions } = options;

  // Generate Zod schema
  const zodSchema = useMemo(() => generateZodSchema(schema, zodOptions), [schema, zodOptions]);

  // Get default values from schema and merge with provided defaults
  const schemaDefaults = useMemo(() => getDefaultValues(schema), [schema]);
  const mergedDefaults = useMemo(
    () =>
      ({
        ...schemaDefaults,
        ...defaultValues,
      }) as TFieldValues,
    [schemaDefaults, defaultValues]
  );

  // Create form instance
  const form = useForm<TFieldValues>({
    ...formOptions,
    resolver: zodResolver(zodSchema),
    defaultValues: mergedDefaults as any,
  });

  return {
    form,
    zodSchema,
  };
}
