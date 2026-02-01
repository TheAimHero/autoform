import { memo, useCallback, useMemo, createContext, useContext, ReactNode } from 'react';
import { useFieldArray } from 'react-hook-form';
import type { Control } from 'react-hook-form';
import type { FieldDefinition, DataSourcesConfig, FieldState } from '../types';
import type { FieldRegistry } from '../registry';
import { useFieldRenderer } from '../hooks/useFieldRenderer';

/**
 * Props for AutoField component
 */
export interface AutoFieldProps {
  field: FieldDefinition;
  control: Control<any>;
  registry: FieldRegistry;
  dataSources: DataSourcesConfig;
  basePath?: string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
}

/**
 * Context for field rendering to avoid circular imports
 */
const FieldRendererContext = createContext<{
  renderField: (props: AutoFieldProps) => ReactNode;
} | null>(null);

/**
 * Get default value for a field type
 */
function getDefaultForType(type?: string): unknown {
  switch (type) {
    case 'number':
      return 0;
    case 'checkbox':
    case 'switch':
      return false;
    case 'multiselect':
      return [];
    default:
      return '';
  }
}

/**
 * Internal array field component
 */
function ArrayFieldInternal({
  field,
  control,
  registry,
  dataSources,
  basePath,
  isDisabled,
  isReadOnly,
}: AutoFieldProps) {
  const context = useContext(FieldRendererContext);
  const fieldPath = basePath ? `${basePath}.${field.name}` : field.name;

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: fieldPath,
  });

  const ArrayWrapper = registry.arrayField;

  const state: FieldState = useMemo(
    () => ({
      isLoading: false,
      isDisabled: isDisabled || field.disabled || false,
      isRequired: !!field.validation?.required,
      isTouched: false,
      isDirty: false,
      isReadOnly: isReadOnly || field.readOnly || false,
    }),
    [isDisabled, field.disabled, field.validation?.required, isReadOnly, field.readOnly]
  );

  const handleAppend = useCallback(
    (value?: unknown) => {
      if (field.maxItems !== undefined && fields.length >= field.maxItems) {
        return;
      }

      if (field.itemType === 'object' && field.itemFields) {
        const defaultItem: Record<string, unknown> = {};
        for (const itemField of field.itemFields) {
          if (itemField.defaultValue !== undefined) {
            defaultItem[itemField.name] = itemField.defaultValue;
          }
        }
        append(value ?? defaultItem);
      } else {
        append(value ?? getDefaultForType(field.itemType));
      }
    },
    [append, field.itemType, field.itemFields, field.maxItems, fields.length]
  );

  const handleRemove = useCallback(
    (index: number) => {
      if (field.minItems !== undefined && fields.length <= field.minItems) {
        return;
      }
      remove(index);
    },
    [remove, field.minItems, fields.length]
  );

  const handleMove = useCallback(
    (fromIndex: number, toIndex: number) => {
      move(fromIndex, toIndex);
    },
    [move]
  );

  const renderItem = useCallback(
    (index: number) => {
      const itemPath = `${fieldPath}.${index}`;

      if (field.itemType === 'object' && field.itemFields) {
        return (
          <>
            {field.itemFields.map((itemField) =>
              context?.renderField({
                key: itemField.name,
                field: itemField,
                control,
                registry,
                dataSources,
                basePath: itemPath,
                isDisabled: isDisabled || field.disabled,
                isReadOnly: isReadOnly || field.readOnly,
              } as AutoFieldProps & { key: string })
            )}
          </>
        );
      }

      if (field.itemDefinition) {
        return context?.renderField({
          field: {
            ...field.itemDefinition,
            name: String(index),
          } as FieldDefinition,
          control,
          registry,
          dataSources,
          basePath: fieldPath,
          isDisabled: isDisabled || field.disabled,
          isReadOnly: isReadOnly || field.readOnly,
        });
      }

      const primitiveField: FieldDefinition = {
        name: String(index),
        type: (field.itemType as FieldDefinition['type']) || 'text',
        label: `Item ${index + 1}`,
      };

      return context?.renderField({
        field: primitiveField,
        control,
        registry,
        dataSources,
        basePath: fieldPath,
        isDisabled: isDisabled || field.disabled,
        isReadOnly: isReadOnly || field.readOnly,
      });
    },
    [
      fieldPath,
      field.itemType,
      field.itemFields,
      field.itemDefinition,
      field.disabled,
      field.readOnly,
      control,
      registry,
      dataSources,
      isDisabled,
      isReadOnly,
      context,
    ]
  );

  if (ArrayWrapper) {
    return (
      <ArrayWrapper
        name={fieldPath}
        label={field.label}
        description={field.description}
        fields={fields.map((f, i) => ({ id: f.id, index: i }))}
        renderItem={renderItem}
        onAppend={handleAppend}
        onRemove={handleRemove}
        onMove={handleMove}
        state={state}
        minItems={field.minItems}
        maxItems={field.maxItems}
        fieldProps={field.fieldProps}
        className={field.className}
      />
    );
  }

  return (
    <div className={field.className}>
      {field.label && <label>{field.label}</label>}
      {field.description && <p>{field.description}</p>}
      <div>
        {fields.map((f, index) => (
          <div key={f.id} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <div style={{ flex: 1 }}>{renderItem(index)}</div>
            {!state.isDisabled && !state.isReadOnly && (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={field.minItems !== undefined && fields.length <= field.minItems}
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
      {!state.isDisabled && !state.isReadOnly && (
        <button
          type="button"
          onClick={() => handleAppend()}
          disabled={field.maxItems !== undefined && fields.length >= field.maxItems}
        >
          Add Item
        </button>
      )}
    </div>
  );
}

/**
 * Internal field component
 */
function FieldInternal(props: AutoFieldProps) {
  const { field, control, registry, dataSources, basePath, isDisabled, isReadOnly } = props;
  const context = useContext(FieldRendererContext);

  const { fieldProps, Component, shouldRender, fieldPath } = useFieldRenderer({
    field,
    control,
    registry,
    dataSources,
    basePath,
    isDisabled,
    isReadOnly,
  });

  if (!shouldRender) {
    return null;
  }

  if (field.type === 'object' && field.fields) {
    const ObjectWrapper = registry.objectField;

    const nestedFields = (
      <>
        {field.fields.map((nestedField) =>
          context?.renderField({
            key: nestedField.name,
            field: nestedField,
            control,
            registry,
            dataSources,
            basePath: fieldPath,
            isDisabled: isDisabled || field.disabled,
            isReadOnly: isReadOnly || field.readOnly,
          } as AutoFieldProps & { key: string })
        )}
      </>
    );

    if (ObjectWrapper) {
      return (
        <ObjectWrapper
          name={fieldPath}
          label={field.label}
          description={field.description}
          state={fieldProps.state}
          error={fieldProps.error}
          fieldProps={field.fieldProps}
          className={field.className}
        >
          {nestedFields}
        </ObjectWrapper>
      );
    }

    return <div className={field.className}>{nestedFields}</div>;
  }

  if (field.type === 'array') {
    return <ArrayFieldInternal {...props} />;
  }

  if (!Component) {
    return null;
  }

  return <Component {...fieldProps} />;
}

const MemoizedField = memo(FieldInternal);

/**
 * Provider and entry point for field rendering
 */
export function FieldRendererProvider({ children }: { children: ReactNode }) {
  const renderField = useCallback((props: AutoFieldProps & { key?: string }) => {
    const { key, ...fieldProps } = props;
    return <MemoizedField key={key || fieldProps.field.name} {...fieldProps} />;
  }, []);

  return (
    <FieldRendererContext.Provider value={{ renderField }}>
      {children}
    </FieldRendererContext.Provider>
  );
}

/**
 * AutoField component - renders a single field
 */
export const AutoField = memo(function AutoField(props: AutoFieldProps) {
  return <MemoizedField {...props} />;
});

AutoField.displayName = 'AutoField';

/**
 * AutoFieldArray component - renders an array field
 */
export const AutoFieldArray = memo(function AutoFieldArray(props: AutoFieldProps) {
  return <ArrayFieldInternal {...props} />;
});

AutoFieldArray.displayName = 'AutoFieldArray';
