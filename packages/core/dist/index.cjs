'use strict';

var react = require('react');
var jotai = require('jotai');
var jsxRuntime = require('react/jsx-runtime');
var reactHookForm = require('react-hook-form');
var zod = require('zod');
var zod$1 = require('@hookform/resolvers/zod');

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var dataSourceCache = /* @__PURE__ */ new Map();
var DEFAULT_STALE_TIME = 3e4;
function generateDefaultCacheKey(sourceKey, params) {
  const deps = params.dependencies ? JSON.stringify(params.dependencies) : "";
  const query = params.searchQuery || "";
  return `${sourceKey}:${deps}:${query}`;
}
function createDataSourceAtom(sourceKey, config) {
  const stateAtom = jotai.atom({
    options: [],
    isLoading: false,
    error: null,
    lastFetched: null
  });
  stateAtom.__config = config;
  stateAtom.__sourceKey = sourceKey;
  stateAtom.__generateCacheKey = (params) => {
    const cacheKeyFn = config.cacheKey || ((p) => generateDefaultCacheKey(sourceKey, p));
    return cacheKeyFn(params);
  };
  stateAtom.__staleTime = config.staleTime ?? DEFAULT_STALE_TIME;
  return stateAtom;
}
var DataSourceManager = class {
  constructor(configs = {}) {
    __publicField(this, "configs");
    __publicField(this, "atoms");
    this.configs = configs;
    this.atoms = /* @__PURE__ */ new Map();
  }
  /**
   * Get or create an atom for a data source
   */
  getAtom(sourceKey) {
    const config = this.configs[sourceKey];
    if (!config) {
      return void 0;
    }
    if (!this.atoms.has(sourceKey)) {
      this.atoms.set(sourceKey, createDataSourceAtom(sourceKey, config));
    }
    return this.atoms.get(sourceKey);
  }
  /**
   * Get the configuration for a data source
   */
  getConfig(sourceKey) {
    return this.configs[sourceKey];
  }
  /**
   * Check if a data source exists
   */
  has(sourceKey) {
    return sourceKey in this.configs;
  }
  /**
   * Add a new data source configuration
   */
  addSource(sourceKey, config) {
    this.configs[sourceKey] = config;
  }
  /**
   * Remove a data source
   */
  removeSource(sourceKey) {
    delete this.configs[sourceKey];
    this.atoms.delete(sourceKey);
  }
  /**
   * Clear all cached data
   */
  clearCache() {
    dataSourceCache.clear();
  }
  /**
   * Clear cache for a specific source
   */
  clearSourceCache(sourceKey) {
    for (const [key] of dataSourceCache) {
      if (key.startsWith(`${sourceKey}:`)) {
        dataSourceCache.delete(key);
      }
    }
  }
};
function createDataSourceManager(configs = {}) {
  return new DataSourceManager(configs);
}
function clearDataSourceCache() {
  dataSourceCache.clear();
}
var AutoFormContext = react.createContext(null);
function AutoFormProvider({
  value,
  children
}) {
  return /* @__PURE__ */ jsxRuntime.jsx(AutoFormContext.Provider, { value, children });
}
function useAutoFormContext() {
  const context = react.useContext(AutoFormContext);
  if (!context) {
    throw new Error(
      "useAutoFormContext must be used within an AutoFormProvider. Make sure your component is wrapped with <AutoForm> or <AutoFormProvider>."
    );
  }
  return context;
}
function useIsInsideAutoForm() {
  const context = react.useContext(AutoFormContext);
  return context !== null;
}
var cache = /* @__PURE__ */ new Map();
var DEFAULT_STALE_TIME2 = 3e4;
var DEFAULT_DEBOUNCE_MS = 300;
function generateCacheKey(sourceKey, params) {
  const deps = params.dependencies ? JSON.stringify(params.dependencies) : "";
  const query = params.searchQuery || "";
  return `${sourceKey}:${deps}:${query}`;
}
function useDataSource(options) {
  const {
    config,
    sourceKey,
    dependsOn = [],
    control,
    fetchOnMount = true,
    enabled = true
  } = options;
  const [state, setState] = react.useState({
    options: [],
    isLoading: false,
    error: null
  });
  const dependencyValues = reactHookForm.useWatch({
    control,
    name: dependsOn,
    disabled: !control || dependsOn.length === 0
  });
  const dependencies = dependsOn.reduce(
    (acc, name, index) => {
      acc[name] = Array.isArray(dependencyValues) ? dependencyValues[index] : dependencyValues;
      return acc;
    },
    {}
  );
  const abortControllerRef = react.useRef(null);
  const debounceTimerRef = react.useRef(null);
  const searchQueryRef = react.useRef("");
  const fetchData = react.useCallback(
    async (searchQuery) => {
      if (!enabled) return;
      const staleTime = config.staleTime ?? DEFAULT_STALE_TIME2;
      const params = {
        dependencies: dependsOn.length > 0 ? dependencies : void 0,
        searchQuery
      };
      const cacheKeyFn = config.cacheKey || ((p) => generateCacheKey(sourceKey, p));
      const cacheKey = cacheKeyFn(params);
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < staleTime) {
        setState({
          options: cached.data,
          isLoading: false,
          error: null
        });
        return;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const data = await config.fetch({
          ...params,
          signal: abortControllerRef.current.signal
        });
        const options2 = config.transform(data);
        cache.set(cacheKey, {
          data: options2,
          timestamp: Date.now()
        });
        setState({
          options: options2,
          isLoading: false,
          error: null
        });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        const errorObj = error instanceof Error ? error : new Error(String(error));
        if (config.onError) {
          config.onError(errorObj);
        }
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorObj
        }));
      }
    },
    [config, sourceKey, dependencies, dependsOn, enabled]
  );
  const onSearch = react.useCallback(
    (query) => {
      searchQueryRef.current = query;
      const debounceMs = config.debounceMs ?? DEFAULT_DEBOUNCE_MS;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        fetchData(query);
      }, debounceMs);
    },
    [fetchData, config.debounceMs]
  );
  const refetch = react.useCallback(() => {
    fetchData(searchQueryRef.current);
  }, [fetchData]);
  react.useEffect(() => {
    if (fetchOnMount && enabled) {
      fetchData();
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [fetchData, fetchOnMount, enabled, JSON.stringify(dependencies)]);
  return {
    options: state.options,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
    onSearch
  };
}
function clearCache() {
  cache.clear();
}
function clearSourceCache(sourceKey) {
  for (const [key] of cache) {
    if (key.startsWith(`${sourceKey}:`)) {
      cache.delete(key);
    }
  }
}

// src/hooks/useFieldRenderer.ts
function evaluateCondition(condition, formValues) {
  if (!condition) return true;
  const { when, operator, value } = condition;
  const fieldValue = getNestedValue(formValues, when);
  switch (operator) {
    case "eq":
      return fieldValue === value;
    case "neq":
      return fieldValue !== value;
    case "gt":
      return typeof fieldValue === "number" && typeof value === "number" && fieldValue > value;
    case "gte":
      return typeof fieldValue === "number" && typeof value === "number" && fieldValue >= value;
    case "lt":
      return typeof fieldValue === "number" && typeof value === "number" && fieldValue < value;
    case "lte":
      return typeof fieldValue === "number" && typeof value === "number" && fieldValue <= value;
    case "in":
      return Array.isArray(value) && value.includes(fieldValue);
    case "notIn":
      return Array.isArray(value) && !value.includes(fieldValue);
    case "exists":
      return fieldValue !== void 0 && fieldValue !== null && fieldValue !== "";
    case "notExists":
      return fieldValue === void 0 || fieldValue === null || fieldValue === "";
    default:
      return true;
  }
}
function getNestedValue(obj, path) {
  return path.split(".").reduce((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return acc[key];
    }
    return void 0;
  }, obj);
}
function useFieldRenderer(hookOptions) {
  const {
    field,
    control,
    registry,
    dataSources,
    basePath = "",
    isDisabled = false,
    isReadOnly = false
  } = hookOptions;
  const fieldPath = basePath ? `${basePath}.${field.name}` : field.name;
  const Component = registry.fields[field.type];
  const { field: controllerField, fieldState } = reactHookForm.useController({
    name: fieldPath,
    control,
    defaultValue: field.defaultValue
  });
  const formValues = reactHookForm.useWatch({ control });
  const shouldRender = react.useMemo(
    () => evaluateCondition(field.condition, formValues),
    [field.condition, formValues]
  );
  const dataSourceConfig = field.dataSourceKey ? dataSources[field.dataSourceKey] : void 0;
  const dataSourceResult = useDataSource({
    config: dataSourceConfig || {
      fetch: async () => [],
      transform: (data) => data
    },
    sourceKey: field.dataSourceKey || fieldPath,
    dependsOn: field.dependsOn,
    control,
    fetchOnMount: !!dataSourceConfig,
    enabled: !!dataSourceConfig && shouldRender
  });
  const options = react.useMemo(() => {
    if (dataSourceConfig) {
      return dataSourceResult.options;
    }
    return field.options || [];
  }, [field.options, dataSourceConfig, dataSourceResult.options]);
  const state = react.useMemo(
    () => ({
      isLoading: dataSourceResult.isLoading,
      isDisabled: isDisabled || field.disabled || false,
      isRequired: !!field.validation?.required,
      isTouched: fieldState.isTouched,
      isDirty: fieldState.isDirty,
      isReadOnly: isReadOnly || field.readOnly || false
    }),
    [
      dataSourceResult.isLoading,
      isDisabled,
      field.disabled,
      field.validation?.required,
      fieldState.isTouched,
      fieldState.isDirty,
      isReadOnly,
      field.readOnly
    ]
  );
  const fieldProps = react.useMemo(
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
      onSearch: dataSourceConfig ? dataSourceResult.onSearch : void 0,
      fieldProps: field.fieldProps,
      className: field.className
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
      dataSourceResult.onSearch
    ]
  );
  return {
    fieldProps,
    Component,
    shouldRender,
    fieldPath
  };
}
var FieldRendererContext = react.createContext(null);
function getDefaultForType(type) {
  switch (type) {
    case "number":
      return 0;
    case "checkbox":
    case "switch":
      return false;
    case "multiselect":
      return [];
    default:
      return "";
  }
}
function ArrayFieldInternal({
  field,
  control,
  registry,
  dataSources,
  basePath,
  isDisabled,
  isReadOnly
}) {
  const context = react.useContext(FieldRendererContext);
  const fieldPath = basePath ? `${basePath}.${field.name}` : field.name;
  const { fields, append, remove, move } = reactHookForm.useFieldArray({
    control,
    name: fieldPath
  });
  const ArrayWrapper = registry.arrayField;
  const state = react.useMemo(
    () => ({
      isLoading: false,
      isDisabled: isDisabled || field.disabled || false,
      isRequired: !!field.validation?.required,
      isTouched: false,
      isDirty: false,
      isReadOnly: isReadOnly || field.readOnly || false
    }),
    [
      isDisabled,
      field.disabled,
      field.validation?.required,
      isReadOnly,
      field.readOnly
    ]
  );
  const handleAppend = react.useCallback(
    (value) => {
      if (field.maxItems !== void 0 && fields.length >= field.maxItems) {
        return;
      }
      if (field.itemType === "object" && field.itemFields) {
        const defaultItem = {};
        for (const itemField of field.itemFields) {
          if (itemField.defaultValue !== void 0) {
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
  const handleRemove = react.useCallback(
    (index) => {
      if (field.minItems !== void 0 && fields.length <= field.minItems) {
        return;
      }
      remove(index);
    },
    [remove, field.minItems, fields.length]
  );
  const handleMove = react.useCallback(
    (fromIndex, toIndex) => {
      move(fromIndex, toIndex);
    },
    [move]
  );
  const renderItem = react.useCallback(
    (index) => {
      const itemPath = `${fieldPath}.${index}`;
      if (field.itemType === "object" && field.itemFields) {
        return /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children: field.itemFields.map(
          (itemField) => context?.renderField({
            key: itemField.name,
            field: itemField,
            control,
            registry,
            dataSources,
            basePath: itemPath,
            isDisabled: isDisabled || field.disabled,
            isReadOnly: isReadOnly || field.readOnly
          })
        ) });
      }
      if (field.itemDefinition) {
        return context?.renderField({
          field: {
            ...field.itemDefinition,
            name: String(index)
          },
          control,
          registry,
          dataSources,
          basePath: fieldPath,
          isDisabled: isDisabled || field.disabled,
          isReadOnly: isReadOnly || field.readOnly
        });
      }
      const primitiveField = {
        name: String(index),
        type: field.itemType || "text",
        label: `Item ${index + 1}`
      };
      return context?.renderField({
        field: primitiveField,
        control,
        registry,
        dataSources,
        basePath: fieldPath,
        isDisabled: isDisabled || field.disabled,
        isReadOnly: isReadOnly || field.readOnly
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
      context
    ]
  );
  if (ArrayWrapper) {
    return /* @__PURE__ */ jsxRuntime.jsx(
      ArrayWrapper,
      {
        name: fieldPath,
        label: field.label,
        description: field.description,
        fields: fields.map((f, i) => ({ id: f.id, index: i })),
        renderItem,
        onAppend: handleAppend,
        onRemove: handleRemove,
        onMove: handleMove,
        state,
        minItems: field.minItems,
        maxItems: field.maxItems,
        fieldProps: field.fieldProps,
        className: field.className
      }
    );
  }
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: field.className, children: [
    field.label && /* @__PURE__ */ jsxRuntime.jsx("label", { children: field.label }),
    field.description && /* @__PURE__ */ jsxRuntime.jsx("p", { children: field.description }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { children: fields.map((f, index) => /* @__PURE__ */ jsxRuntime.jsxs(
      "div",
      {
        style: { display: "flex", gap: "8px", marginBottom: "8px" },
        children: [
          /* @__PURE__ */ jsxRuntime.jsx("div", { style: { flex: 1 }, children: renderItem(index) }),
          !state.isDisabled && !state.isReadOnly && /* @__PURE__ */ jsxRuntime.jsx(
            "button",
            {
              type: "button",
              onClick: () => handleRemove(index),
              disabled: field.minItems !== void 0 && fields.length <= field.minItems,
              children: "Remove"
            }
          )
        ]
      },
      f.id
    )) }),
    !state.isDisabled && !state.isReadOnly && /* @__PURE__ */ jsxRuntime.jsx(
      "button",
      {
        type: "button",
        onClick: () => handleAppend(),
        disabled: field.maxItems !== void 0 && fields.length >= field.maxItems,
        children: "Add Item"
      }
    )
  ] });
}
function FieldInternal(props) {
  const {
    field,
    control,
    registry,
    dataSources,
    basePath,
    isDisabled,
    isReadOnly
  } = props;
  const context = react.useContext(FieldRendererContext);
  const { fieldProps, Component, shouldRender, fieldPath } = useFieldRenderer({
    field,
    control,
    registry,
    dataSources,
    basePath,
    isDisabled,
    isReadOnly
  });
  if (!shouldRender) {
    return null;
  }
  if (field.type === "object" && field.fields) {
    const ObjectWrapper = registry.objectField;
    const nestedFields = /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children: field.fields.map(
      (nestedField) => context?.renderField({
        key: nestedField.name,
        field: nestedField,
        control,
        registry,
        dataSources,
        basePath: fieldPath,
        isDisabled: isDisabled || field.disabled,
        isReadOnly: isReadOnly || field.readOnly
      })
    ) });
    if (ObjectWrapper) {
      return /* @__PURE__ */ jsxRuntime.jsx(
        ObjectWrapper,
        {
          name: fieldPath,
          label: field.label,
          description: field.description,
          state: fieldProps.state,
          error: fieldProps.error,
          fieldProps: field.fieldProps,
          className: field.className,
          children: nestedFields
        }
      );
    }
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className: field.className, children: nestedFields });
  }
  if (field.type === "array") {
    return /* @__PURE__ */ jsxRuntime.jsx(ArrayFieldInternal, { ...props });
  }
  if (!Component) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntime.jsx(Component, { ...fieldProps });
}
var MemoizedField = react.memo(FieldInternal);
function FieldRendererProvider({ children }) {
  const renderField = react.useCallback(
    (props) => {
      const { key, ...fieldProps } = props;
      return /* @__PURE__ */ jsxRuntime.jsx(MemoizedField, { ...fieldProps }, key || fieldProps.field.name);
    },
    []
  );
  return /* @__PURE__ */ jsxRuntime.jsx(FieldRendererContext.Provider, { value: { renderField }, children });
}
var AutoField = react.memo(function AutoField2(props) {
  return /* @__PURE__ */ jsxRuntime.jsx(MemoizedField, { ...props });
});
AutoField.displayName = "AutoField";
var AutoFieldArray = react.memo(function AutoFieldArray2(props) {
  return /* @__PURE__ */ jsxRuntime.jsx(ArrayFieldInternal, { ...props });
});
AutoFieldArray.displayName = "AutoFieldArray";
function AutoForm({
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
  children
}) {
  const dataSourceManager = react.useMemo(() => createDataSourceManager(dataSources), [dataSources]);
  const contextValue = react.useMemo(
    () => ({
      form,
      schema,
      registry,
      dataSourceManager,
      dataSources,
      isLoading,
      isDisabled,
      isReadOnly
    }),
    [form, schema, registry, dataSourceManager, dataSources, isLoading, isDisabled, isReadOnly]
  );
  const handleSubmit = form.handleSubmit(onSubmit || (() => {
  }), onError);
  const renderedFields = react.useMemo(
    () => /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children: schema.fields.map((field) => /* @__PURE__ */ jsxRuntime.jsx(
      AutoField,
      {
        field,
        control: form.control,
        registry,
        dataSources,
        isDisabled,
        isReadOnly
      },
      field.name
    )) }),
    [schema.fields, form.control, registry, dataSources, isDisabled, isReadOnly]
  );
  const FieldByName = react.useMemo(() => {
    const Component = ({ name }) => {
      const field = schema.fields.find((f) => f.name === name);
      if (!field) {
        return null;
      }
      return /* @__PURE__ */ jsxRuntime.jsx(
        AutoField,
        {
          field,
          control: form.control,
          registry,
          dataSources,
          isDisabled,
          isReadOnly
        }
      );
    };
    Component.displayName = "AutoFormField";
    return Component;
  }, [schema.fields, form.control, registry, dataSources, isDisabled, isReadOnly]);
  const renderProps = {
    fields: renderedFields,
    Field: FieldByName,
    formState: form.formState,
    isSubmitting: form.formState.isSubmitting,
    isValid: form.formState.isValid
  };
  const formContent = typeof children === "function" ? children(renderProps) : children ?? renderedFields;
  const FormWrapper = registry.formWrapper;
  if (FormWrapper) {
    return /* @__PURE__ */ jsxRuntime.jsx(AutoFormProvider, { value: contextValue, children: /* @__PURE__ */ jsxRuntime.jsx(FieldRendererProvider, { children: /* @__PURE__ */ jsxRuntime.jsx(FormWrapper, { onSubmit: handleSubmit, className, children: formContent }) }) });
  }
  return /* @__PURE__ */ jsxRuntime.jsx(AutoFormProvider, { value: contextValue, children: /* @__PURE__ */ jsxRuntime.jsx(FieldRendererProvider, { children: /* @__PURE__ */ jsxRuntime.jsx("form", { onSubmit: handleSubmit, className, children: formContent }) }) });
}
AutoForm.displayName = "AutoForm";
function createTypedAutoForm() {
  return AutoForm;
}

// src/schema/parser.ts
var VALID_FIELD_TYPES = [
  "text",
  "email",
  "password",
  "number",
  "textarea",
  "select",
  "multiselect",
  "autocomplete",
  "checkbox",
  "radio",
  "switch",
  "date",
  "datetime",
  "time",
  "file",
  "object",
  "array",
  "hidden"
];
var SchemaValidationError = class extends Error {
  constructor(message, path, details) {
    super(`Schema validation error at "${path}": ${message}`);
    this.path = path;
    this.details = details;
    this.name = "SchemaValidationError";
  }
};
function validateField(field, path) {
  if (!field.name || typeof field.name !== "string") {
    throw new SchemaValidationError('Field must have a valid "name" string', path);
  }
  if (!field.type || !VALID_FIELD_TYPES.includes(field.type)) {
    throw new SchemaValidationError(
      `Field must have a valid "type". Got "${field.type}", expected one of: ${VALID_FIELD_TYPES.join(", ")}`,
      `${path}.${field.name}`
    );
  }
  if (field.type === "object") {
    if (!field.fields || !Array.isArray(field.fields) || field.fields.length === 0) {
      throw new SchemaValidationError(
        'Object type field must have a non-empty "fields" array',
        `${path}.${field.name}`
      );
    }
    for (const nestedField of field.fields) {
      validateField(nestedField, `${path}.${field.name}`);
    }
  }
  if (field.type === "array") {
    if (!field.itemType) {
      throw new SchemaValidationError(
        'Array type field must have "itemType" defined',
        `${path}.${field.name}`
      );
    }
    if (field.itemType === "object") {
      if (!field.itemFields || !Array.isArray(field.itemFields) || field.itemFields.length === 0) {
        throw new SchemaValidationError(
          'Array field with itemType "object" must have a non-empty "itemFields" array',
          `${path}.${field.name}`
        );
      }
      for (const itemField of field.itemFields) {
        validateField(itemField, `${path}.${field.name}[]`);
      }
    }
  }
  if (["select", "multiselect", "radio"].includes(field.type)) {
    if (!field.options && !field.dataSourceKey) {
      throw new SchemaValidationError(
        `Field type "${field.type}" must have either "options" array or "dataSourceKey"`,
        `${path}.${field.name}`
      );
    }
  }
  if (field.condition) {
    if (!field.condition.when || typeof field.condition.when !== "string") {
      throw new SchemaValidationError(
        'Condition must have a valid "when" field name',
        `${path}.${field.name}.condition`
      );
    }
    if (!field.condition.operator) {
      throw new SchemaValidationError(
        'Condition must have an "operator"',
        `${path}.${field.name}.condition`
      );
    }
  }
  if (field.dependsOn) {
    if (!Array.isArray(field.dependsOn)) {
      throw new SchemaValidationError(
        '"dependsOn" must be an array of field names',
        `${path}.${field.name}`
      );
    }
  }
}
function collectFieldPaths(fields, basePath = "") {
  const paths = [];
  for (const field of fields) {
    const fieldPath = basePath ? `${basePath}.${field.name}` : field.name;
    paths.push(fieldPath);
    if (field.type === "object" && field.fields) {
      paths.push(...collectFieldPaths(field.fields, fieldPath));
    }
  }
  return paths;
}
function hasAsyncFields(fields) {
  for (const field of fields) {
    if (field.dataSourceKey) return true;
    if (field.type === "object" && field.fields && hasAsyncFields(field.fields)) return true;
    if (field.type === "array" && field.itemFields && hasAsyncFields(field.itemFields)) return true;
  }
  return false;
}
function hasConditionalFields(fields) {
  for (const field of fields) {
    if (field.condition) return true;
    if (field.type === "object" && field.fields && hasConditionalFields(field.fields)) return true;
    if (field.type === "array" && field.itemFields && hasConditionalFields(field.itemFields))
      return true;
  }
  return false;
}
function hasArrayFields(fields) {
  for (const field of fields) {
    if (field.type === "array") return true;
    if (field.type === "object" && field.fields && hasArrayFields(field.fields)) return true;
  }
  return false;
}
function hasNestedObjects(fields) {
  for (const field of fields) {
    if (field.type === "object") return true;
  }
  return false;
}
function parseSchema(schema) {
  if (!schema || typeof schema !== "object") {
    throw new SchemaValidationError("Schema must be an object", "root");
  }
  if (!schema.fields || !Array.isArray(schema.fields)) {
    throw new SchemaValidationError('Schema must have a "fields" array', "root");
  }
  if (schema.fields.length === 0) {
    throw new SchemaValidationError("Schema must have at least one field", "root.fields");
  }
  for (const field of schema.fields) {
    validateField(field, "root");
  }
  const rootNames = /* @__PURE__ */ new Set();
  for (const field of schema.fields) {
    if (rootNames.has(field.name)) {
      throw new SchemaValidationError(`Duplicate field name "${field.name}" at root level`, "root");
    }
    rootNames.add(field.name);
  }
  return {
    schema,
    fieldPaths: collectFieldPaths(schema.fields),
    hasAsyncFields: hasAsyncFields(schema.fields),
    hasConditionalFields: hasConditionalFields(schema.fields),
    hasArrayFields: hasArrayFields(schema.fields),
    hasNestedObjects: hasNestedObjects(schema.fields)
  };
}
function getFieldByPath(schema, path) {
  const parts = path.split(".");
  let fields = schema.fields;
  let field;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (/^\d+$/.test(part)) {
      continue;
    }
    field = fields.find((f) => f.name === part);
    if (!field) return void 0;
    if (i < parts.length - 1) {
      if (field.type === "object" && field.fields) {
        fields = field.fields;
      } else if (field.type === "array" && field.itemFields) {
        fields = field.itemFields;
      } else {
        return void 0;
      }
    }
  }
  return field;
}
function getDefaultValues(schema) {
  const defaults = {};
  function processFields(fields, target) {
    for (const field of fields) {
      if (field.defaultValue !== void 0) {
        target[field.name] = field.defaultValue;
      } else if (field.type === "object" && field.fields) {
        const nestedDefaults = {};
        processFields(field.fields, nestedDefaults);
        if (Object.keys(nestedDefaults).length > 0) {
          target[field.name] = nestedDefaults;
        }
      } else if (field.type === "array") {
        target[field.name] = [];
      } else if (field.type === "checkbox" || field.type === "switch") {
        target[field.name] = false;
      }
    }
  }
  processFields(schema.fields, defaults);
  return defaults;
}
function applyValidationRules(schema, rules, fieldType, options) {
  if (!rules) return schema;
  let result = schema;
  if (fieldType === "number") {
    if (rules.min !== void 0) {
      const min = typeof rules.min === "object" ? rules.min : { value: rules.min, message: void 0 };
      result = result.min(min.value, min.message);
    }
    if (rules.max !== void 0) {
      const max = typeof rules.max === "object" ? rules.max : { value: rules.max, message: void 0 };
      result = result.max(max.value, max.message);
    }
  }
  if (typeof result.min === "function" && fieldType !== "number") {
    if (rules.minLength !== void 0) {
      const minLength = typeof rules.minLength === "object" ? rules.minLength : { value: rules.minLength, message: void 0 };
      result = result.min(minLength.value, minLength.message);
    }
    if (rules.maxLength !== void 0) {
      const maxLength = typeof rules.maxLength === "object" ? rules.maxLength : { value: rules.maxLength, message: void 0 };
      result = result.max(maxLength.value, maxLength.message);
    }
    if (rules.email) {
      const message = typeof rules.email === "string" ? rules.email : void 0;
      result = result.email(message);
    }
    if (rules.url) {
      const message = typeof rules.url === "string" ? rules.url : void 0;
      result = result.url(message);
    }
    if (rules.uuid) {
      const message = typeof rules.uuid === "string" ? rules.uuid : void 0;
      result = result.uuid(message);
    }
    if (rules.regex) {
      const flags = rules.regex.flags || "";
      const regex = new RegExp(rules.regex.pattern, flags);
      result = result.regex(regex, rules.regex.message);
    }
    if (rules.pattern) {
      const pattern = typeof rules.pattern === "object" ? rules.pattern : { value: rules.pattern, message: void 0 };
      result = result.regex(new RegExp(pattern.value), pattern.message);
    }
  }
  if (rules.custom && options.customValidators?.[rules.custom]) {
    const validator = options.customValidators[rules.custom];
    result = result.refine(
      (val) => {
        const validationResult = validator(val);
        return validationResult === true;
      },
      (val) => {
        const validationResult = validator(val);
        return {
          message: typeof validationResult === "string" ? validationResult : "Validation failed"
        };
      }
    );
  }
  return result;
}
function generateFieldSchema(field, options) {
  let schema;
  switch (field.type) {
    case "text":
    case "email":
    case "password":
    case "textarea":
    case "hidden":
      schema = zod.z.string();
      break;
    case "number":
      schema = zod.z.number();
      break;
    case "checkbox":
    case "switch":
      schema = zod.z.boolean();
      break;
    case "date":
    case "datetime":
    case "time":
      schema = zod.z.union([zod.z.date(), zod.z.string()]);
      break;
    case "select":
    case "radio":
    case "autocomplete":
      schema = zod.z.any();
      break;
    case "multiselect":
      schema = zod.z.array(zod.z.any());
      break;
    case "file":
      schema = zod.z.any();
      break;
    case "object":
      if (field.fields) {
        const shape = {};
        for (const nestedField of field.fields) {
          shape[nestedField.name] = generateFieldSchema(nestedField, options);
        }
        schema = zod.z.object(shape);
      } else {
        schema = zod.z.record(zod.z.any());
      }
      break;
    case "array":
      if (field.itemType === "object" && field.itemFields) {
        const itemShape = {};
        for (const itemField of field.itemFields) {
          itemShape[itemField.name] = generateFieldSchema(itemField, options);
        }
        let arraySchema = zod.z.array(zod.z.object(itemShape));
        if (field.minItems !== void 0) {
          arraySchema = arraySchema.min(field.minItems);
        }
        if (field.maxItems !== void 0) {
          arraySchema = arraySchema.max(field.maxItems);
        }
        schema = arraySchema;
      } else {
        let itemSchema;
        switch (field.itemType) {
          case "number":
            itemSchema = zod.z.number();
            break;
          case "checkbox":
            itemSchema = zod.z.boolean();
            break;
          default:
            itemSchema = zod.z.string();
        }
        let arraySchema = zod.z.array(itemSchema);
        if (field.minItems !== void 0) {
          arraySchema = arraySchema.min(field.minItems);
        }
        if (field.maxItems !== void 0) {
          arraySchema = arraySchema.max(field.maxItems);
        }
        schema = arraySchema;
      }
      break;
    default:
      schema = zod.z.any();
  }
  schema = applyValidationRules(schema, field.validation, field.type, options);
  const isRequired = field.validation?.required;
  if (!isRequired || options.allOptional) {
    if (field.type === "text" || field.type === "email" || field.type === "password" || field.type === "textarea") {
      schema = schema.optional().or(zod.z.literal(""));
    } else {
      schema = schema.optional();
    }
  } else if (typeof isRequired === "string") {
    const baseSchema = schema;
    schema = zod.z.any().refine(
      (val) => {
        if (val === void 0 || val === null) return false;
        if (typeof val === "string" && val.trim() === "") return false;
        if (Array.isArray(val) && val.length === 0) return false;
        const result = baseSchema.safeParse(val);
        return result.success;
      },
      { message: isRequired }
    );
  }
  return schema;
}
function generateZodSchema(formSchema, options = {}) {
  const shape = {};
  for (const field of formSchema.fields) {
    shape[field.name] = generateFieldSchema(field, options);
  }
  return zod.z.object(shape);
}
function generatePartialZodSchema(formSchema, options = {}) {
  return generateZodSchema(formSchema, { ...options, allOptional: true });
}

// src/registry/fieldRegistry.ts
function createFieldRegistry(config = {}) {
  return {
    fields: config.fields || {},
    arrayField: config.arrayField,
    objectField: config.objectField,
    formWrapper: config.formWrapper
  };
}
function mergeRegistries(base, override) {
  return {
    fields: { ...base.fields, ...override.fields },
    arrayField: override.arrayField ?? base.arrayField,
    objectField: override.objectField ?? base.objectField,
    formWrapper: override.formWrapper ?? base.formWrapper
  };
}
function getFieldComponent(registry, fieldType) {
  return registry.fields[fieldType];
}
function hasFieldComponent(registry, fieldType) {
  return fieldType in registry.fields && registry.fields[fieldType] !== void 0;
}
function getRegisteredFieldTypes(registry) {
  return Object.keys(registry.fields).filter(
    (key) => registry.fields[key] !== void 0
  );
}
function validateRegistryForSchema(registry, fieldTypes, options = {}) {
  const missing = [];
  for (const type of fieldTypes) {
    if (!hasFieldComponent(registry, type) && type !== "object" && type !== "array") {
      missing.push(`fields.${type}`);
    }
  }
  if (options.hasArrayFields && !registry.arrayField) {
    missing.push("arrayField");
  }
  if (options.hasNestedObjects && !registry.objectField) {
    missing.push("objectField");
  }
  return {
    valid: missing.length === 0,
    missing
  };
}
function useAutoForm(options) {
  const { schema, defaultValues, zodOptions, ...formOptions } = options;
  const zodSchema = react.useMemo(() => generateZodSchema(schema, zodOptions), [schema, zodOptions]);
  const schemaDefaults = react.useMemo(() => getDefaultValues(schema), [schema]);
  const mergedDefaults = react.useMemo(
    () => ({
      ...schemaDefaults,
      ...defaultValues
    }),
    [schemaDefaults, defaultValues]
  );
  const form = reactHookForm.useForm({
    ...formOptions,
    resolver: zod$1.zodResolver(zodSchema),
    defaultValues: mergedDefaults
  });
  return {
    form,
    zodSchema
  };
}

exports.AutoField = AutoField;
exports.AutoFieldArray = AutoFieldArray;
exports.AutoForm = AutoForm;
exports.AutoFormProvider = AutoFormProvider;
exports.DataSourceManager = DataSourceManager;
exports.FieldRendererProvider = FieldRendererProvider;
exports.SchemaValidationError = SchemaValidationError;
exports.clearCache = clearCache;
exports.clearDataSourceCache = clearDataSourceCache;
exports.clearSourceCache = clearSourceCache;
exports.createDataSourceManager = createDataSourceManager;
exports.createFieldRegistry = createFieldRegistry;
exports.createTypedAutoForm = createTypedAutoForm;
exports.generatePartialZodSchema = generatePartialZodSchema;
exports.generateZodSchema = generateZodSchema;
exports.getDefaultValues = getDefaultValues;
exports.getFieldByPath = getFieldByPath;
exports.getFieldComponent = getFieldComponent;
exports.getRegisteredFieldTypes = getRegisteredFieldTypes;
exports.hasFieldComponent = hasFieldComponent;
exports.mergeRegistries = mergeRegistries;
exports.parseSchema = parseSchema;
exports.useAutoForm = useAutoForm;
exports.useAutoFormContext = useAutoFormContext;
exports.useDataSource = useDataSource;
exports.useFieldRenderer = useFieldRenderer;
exports.useIsInsideAutoForm = useIsInsideAutoForm;
exports.validateRegistryForSchema = validateRegistryForSchema;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map