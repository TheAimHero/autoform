# Field Components Contract

AutoForm is headless - it doesn't provide any UI components. Instead, you bring your own components that implement a simple contract. This guide explains how to build custom field components.

## Table of Contents

- [Overview](#overview)
- [Basic Field Contract](#basic-field-contract)
- [Building a Text Field](#building-a-text-field)
- [Building a Select Field](#building-a-select-field)
- [Building an Autocomplete Field](#building-an-autocomplete-field)
- [Array Field Wrapper](#array-field-wrapper)
- [Object Field Wrapper](#object-field-wrapper)
- [Field Registry](#field-registry)
- [TypeScript Types](#typescript-types)

## Overview

Every field component in AutoForm receives a standardized set of props. This contract ensures that:

1. Form state is managed by react-hook-form
2. Components are reusable across different forms
3. Async data sources work seamlessly
4. Validation errors are displayed consistently

## Basic Field Contract

All field components receive these props:

```typescript
interface FieldComponentProps<TValue = unknown> {
  // Identification
  name: string;                    // Field path (e.g., "address.city")
  
  // Value & Handlers
  value: TValue;                   // Current field value
  onChange: (value: TValue) => void;  // Update handler
  onBlur: () => void;              // Blur handler (for touched state)
  inputRef?: Ref<HTMLElement>;     // Ref for focus management
  
  // Display
  label?: string;                  // Field label
  placeholder?: string;            // Placeholder text
  description?: string;            // Help text below field
  className?: string;              // CSS class name
  
  // Options (for select/radio/autocomplete)
  options?: FieldOption<TValue>[]; // Available options
  onSearch?: (query: string) => void;  // Search handler (autocomplete)
  
  // State
  state: FieldState;               // Loading, disabled, etc.
  error?: FieldError;              // Validation error
  
  // Custom Props
  fieldProps?: Record<string, unknown>;  // Additional props from schema
}
```

### FieldState

```typescript
interface FieldState {
  isLoading: boolean;    // Data source is loading
  isDisabled: boolean;   // Field is disabled
  isRequired: boolean;   // Field is required
  isTouched: boolean;    // Field has been focused and blurred
  isDirty: boolean;      // Field value has changed
  isReadOnly: boolean;   // Field is read-only
}
```

### FieldOption

```typescript
interface FieldOption<TValue = unknown> {
  label: string;
  value: TValue;
  disabled?: boolean;
}
```

## Building a Text Field

Here's a complete example of a text field component:

```tsx
import { forwardRef } from "react";
import type { FieldComponentProps } from "@autoform/core";

export const TextField = forwardRef<HTMLInputElement, FieldComponentProps<string>>(
  function TextField(
    {
      name,
      value,
      onChange,
      onBlur,
      label,
      placeholder,
      description,
      state,
      error,
      fieldProps,
      className,
    },
    ref
  ) {
    // Determine input type from fieldProps or default to "text"
    const inputType = (fieldProps?.type as string) || "text";

    return (
      <div className={`field-wrapper ${className || ""}`}>
        {/* Label */}
        {label && (
          <label htmlFor={name} className="field-label">
            {label}
            {state.isRequired && <span className="required-indicator">*</span>}
          </label>
        )}

        {/* Input */}
        <input
          ref={ref}
          id={name}
          name={name}
          type={inputType}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={state.isDisabled}
          readOnly={state.isReadOnly}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${name}-error` : description ? `${name}-desc` : undefined
          }
          className={`field-input ${error ? "field-input--error" : ""}`}
        />

        {/* Description */}
        {description && !error && (
          <p id={`${name}-desc`} className="field-description">
            {description}
          </p>
        )}

        {/* Error */}
        {error && (
          <p id={`${name}-error`} className="field-error" role="alert">
            {error.message}
          </p>
        )}
      </div>
    );
  }
);
```

## Building a Select Field

```tsx
import { forwardRef } from "react";
import type { FieldComponentProps } from "@autoform/core";

export const SelectField = forwardRef<HTMLSelectElement, FieldComponentProps>(
  function SelectField(
    {
      name,
      value,
      onChange,
      onBlur,
      label,
      placeholder,
      description,
      options = [],
      state,
      error,
      className,
    },
    ref
  ) {
    return (
      <div className={`field-wrapper ${className || ""}`}>
        {label && (
          <label htmlFor={name} className="field-label">
            {label}
            {state.isRequired && <span className="required-indicator">*</span>}
          </label>
        )}

        <div className="select-container">
          <select
            ref={ref}
            id={name}
            name={name}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            disabled={state.isDisabled || state.isLoading}
            aria-invalid={!!error}
            className={`field-select ${error ? "field-select--error" : ""}`}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={String(option.value)}
                value={String(option.value)}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Loading spinner */}
          {state.isLoading && <span className="select-spinner" />}
        </div>

        {description && !error && (
          <p className="field-description">{description}</p>
        )}

        {error && (
          <p className="field-error" role="alert">
            {error.message}
          </p>
        )}
      </div>
    );
  }
);
```

## Building an Autocomplete Field

The autocomplete field is more complex as it handles search functionality:

```tsx
import { forwardRef, useState, useRef, useEffect } from "react";
import type { FieldComponentProps } from "@autoform/core";

export const AutocompleteField = forwardRef<
  HTMLInputElement,
  FieldComponentProps
>(function AutocompleteField(
  {
    name,
    value,
    onChange,
    onBlur,
    label,
    placeholder,
    description,
    options = [],
    state,
    error,
    onSearch,
    className,
  },
  ref
) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Find selected option label
  const selectedOption = options.find((o) => o.value === value);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync input value with selected option
  useEffect(() => {
    if (selectedOption) {
      setInputValue(selectedOption.label);
    }
  }, [selectedOption]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setIsOpen(true);
    // Trigger search - this is debounced by the data source
    onSearch?.(val);
  };

  const handleSelect = (optionValue: unknown) => {
    onChange(optionValue);
    setIsOpen(false);
    const selected = options.find((o) => o.value === optionValue);
    if (selected) {
      setInputValue(selected.label);
    }
  };

  const handleClear = () => {
    onChange(undefined as any);
    setInputValue("");
    onSearch?.("");
  };

  return (
    <div ref={wrapperRef} className={`field-wrapper ${className || ""}`}>
      {label && (
        <label htmlFor={name} className="field-label">
          {label}
          {state.isRequired && <span className="required-indicator">*</span>}
        </label>
      )}

      <div className="autocomplete-container">
        <input
          ref={ref}
          id={name}
          name={name}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(onBlur, 200)}
          placeholder={placeholder}
          disabled={state.isDisabled}
          readOnly={state.isReadOnly}
          autoComplete="off"
          aria-invalid={!!error}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={`${name}-listbox`}
          className={`field-input ${error ? "field-input--error" : ""}`}
        />

        {/* Loading spinner */}
        {state.isLoading && <span className="autocomplete-spinner" />}

        {/* Clear button */}
        {value && !state.isDisabled && !state.isReadOnly && (
          <button
            type="button"
            onClick={handleClear}
            className="autocomplete-clear"
            aria-label="Clear selection"
          >
            ×
          </button>
        )}

        {/* Dropdown */}
        {isOpen && (
          <ul
            id={`${name}-listbox`}
            role="listbox"
            className="autocomplete-dropdown"
          >
            {options.length > 0 ? (
              options.map((option) => (
                <li
                  key={String(option.value)}
                  role="option"
                  aria-selected={option.value === value}
                  className={`autocomplete-option ${
                    option.value === value ? "autocomplete-option--selected" : ""
                  } ${option.disabled ? "autocomplete-option--disabled" : ""}`}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li className="autocomplete-empty">
                {state.isLoading ? "Loading..." : "No results found"}
              </li>
            )}
          </ul>
        )}
      </div>

      {description && !error && (
        <p className="field-description">{description}</p>
      )}

      {error && (
        <p className="field-error" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
});
```

### Using with Radix UI and cmdk

For a production-ready autocomplete with keyboard navigation:

```tsx
import { forwardRef, useState } from "react";
import { Command } from "cmdk";
import * as Popover from "@radix-ui/react-popover";
import type { FieldComponentProps } from "@autoform/core";

export const ComboboxField = forwardRef<HTMLInputElement, FieldComponentProps>(
  function ComboboxField(
    { name, value, onChange, options = [], state, onSearch, label, placeholder },
    ref
  ) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const selectedOption = options.find((o) => o.value === value);

    return (
      <div className="field-wrapper">
        {label && <label className="field-label">{label}</label>}
        
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <button
              ref={ref as any}
              type="button"
              role="combobox"
              aria-expanded={open}
              className="combobox-trigger"
            >
              {selectedOption?.label || placeholder || "Select..."}
              {state.isLoading && <span className="spinner" />}
            </button>
          </Popover.Trigger>

          <Popover.Content className="combobox-content" align="start">
            <Command>
              <Command.Input
                placeholder="Search..."
                value={search}
                onValueChange={(val) => {
                  setSearch(val);
                  onSearch?.(val);
                }}
              />
              <Command.List>
                <Command.Empty>
                  {state.isLoading ? "Loading..." : "No results found."}
                </Command.Empty>
                {options.map((option) => (
                  <Command.Item
                    key={String(option.value)}
                    value={option.label}
                    disabled={option.disabled}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    {option.label}
                    {option.value === value && <span>✓</span>}
                  </Command.Item>
                ))}
              </Command.List>
            </Command>
          </Popover.Content>
        </Popover.Root>
      </div>
    );
  }
);
```

## Array Field Wrapper

Array fields require a wrapper component to handle add/remove/reorder operations:

```tsx
import type { ArrayFieldComponentProps } from "@autoform/core";

export function ArrayFieldWrapper({
  name,
  label,
  description,
  fields,
  renderItem,
  onAppend,
  onRemove,
  onMove,
  state,
  minItems,
  maxItems,
  className,
}: ArrayFieldComponentProps) {
  const canRemove = minItems === undefined || fields.length > minItems;
  const canAdd = maxItems === undefined || fields.length < maxItems;

  return (
    <div className={`array-field ${className || ""}`}>
      {label && (
        <div className="array-field__header">
          <span className="field-label">{label}</span>
          {description && (
            <p className="field-description">{description}</p>
          )}
        </div>
      )}

      <div className="array-field__items">
        {fields.map(({ id, index }) => (
          <div key={id} className="array-field__item">
            {/* Item content */}
            <div className="array-field__item-content">
              {renderItem(index)}
            </div>

            {/* Item actions */}
            {!state.isDisabled && !state.isReadOnly && (
              <div className="array-field__item-actions">
                {/* Move up */}
                <button
                  type="button"
                  onClick={() => onMove(index, index - 1)}
                  disabled={index === 0}
                  aria-label="Move up"
                >
                  ↑
                </button>

                {/* Move down */}
                <button
                  type="button"
                  onClick={() => onMove(index, index + 1)}
                  disabled={index === fields.length - 1}
                  aria-label="Move down"
                >
                  ↓
                </button>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  disabled={!canRemove}
                  aria-label="Remove item"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add button */}
      {!state.isDisabled && !state.isReadOnly && (
        <button
          type="button"
          onClick={() => onAppend()}
          disabled={!canAdd}
          className="array-field__add"
        >
          + Add Item
        </button>
      )}
    </div>
  );
}
```

## Object Field Wrapper

Object fields can optionally use a wrapper for grouping:

```tsx
import type { ObjectFieldComponentProps } from "@autoform/core";

export function ObjectFieldWrapper({
  name,
  label,
  description,
  children,
  state,
  error,
  className,
}: ObjectFieldComponentProps) {
  return (
    <fieldset
      className={`object-field ${className || ""}`}
      disabled={state.isDisabled}
    >
      {label && <legend className="object-field__legend">{label}</legend>}
      
      {description && (
        <p className="object-field__description">{description}</p>
      )}

      <div className="object-field__content">{children}</div>

      {error && (
        <p className="field-error" role="alert">
          {error.message}
        </p>
      )}
    </fieldset>
  );
}
```

## Field Registry

Register all your components in a field registry:

```typescript
import { createFieldRegistry } from "@autoform/core";
import {
  TextField,
  SelectField,
  AutocompleteField,
  CheckboxField,
  TextAreaField,
  NumberField,
} from "./components/fields";
import { ArrayFieldWrapper, ObjectFieldWrapper } from "./components/wrappers";

export const registry = createFieldRegistry({
  // Map field types to components
  fields: {
    text: TextField,
    email: TextField,      // Reuse TextField for email
    password: TextField,   // Reuse TextField for password
    number: NumberField,
    textarea: TextAreaField,
    select: SelectField,
    autocomplete: AutocompleteField,
    checkbox: CheckboxField,
    // Add more as needed...
  },
  
  // Optional: Wrapper for array fields
  arrayField: ArrayFieldWrapper,
  
  // Optional: Wrapper for object fields
  objectField: ObjectFieldWrapper,
  
  // Optional: Custom form wrapper
  formWrapper: CustomFormWrapper,
});
```

## TypeScript Types

### Complete Type Definitions

```typescript
import type { FieldError } from "react-hook-form";
import type { ReactNode, Ref } from "react";

// Field state flags
interface FieldState {
  isLoading: boolean;
  isDisabled: boolean;
  isRequired: boolean;
  isTouched: boolean;
  isDirty: boolean;
  isReadOnly: boolean;
}

// Option for select/autocomplete
interface FieldOption<TValue = unknown> {
  label: string;
  value: TValue;
  disabled?: boolean;
}

// Props for regular fields
interface FieldComponentProps<TValue = unknown> {
  name: string;
  value: TValue;
  onChange: (value: TValue) => void;
  onBlur: () => void;
  inputRef?: Ref<HTMLElement>;
  label?: string;
  placeholder?: string;
  description?: string;
  options?: FieldOption<TValue>[];
  state: FieldState;
  error?: FieldError;
  onSearch?: (query: string) => void;
  fieldProps?: Record<string, unknown>;
  className?: string;
}

// Props for array field wrapper
interface ArrayFieldComponentProps {
  name: string;
  label?: string;
  description?: string;
  fields: Array<{ id: string; index: number }>;
  renderItem: (index: number) => ReactNode;
  onAppend: (value?: unknown) => void;
  onRemove: (index: number) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  state: FieldState;
  error?: FieldError;
  minItems?: number;
  maxItems?: number;
  fieldProps?: Record<string, unknown>;
  className?: string;
}

// Props for object field wrapper
interface ObjectFieldComponentProps {
  name: string;
  label?: string;
  description?: string;
  children: ReactNode;
  state: FieldState;
  error?: FieldError;
  fieldProps?: Record<string, unknown>;
  className?: string;
}
```

## Best Practices

### 1. Use forwardRef

Always use `forwardRef` so AutoForm can manage focus:

```tsx
export const TextField = forwardRef<HTMLInputElement, FieldComponentProps>(
  function TextField(props, ref) {
    return <input ref={ref} {...} />;
  }
);
```

### 2. Handle All States

Your components should handle all possible states:

```tsx
// Loading state
{state.isLoading && <Spinner />}

// Disabled state
<input disabled={state.isDisabled} />

// Read-only state
<input readOnly={state.isReadOnly} />

// Error state
{error && <ErrorMessage>{error.message}</ErrorMessage>}

// Required indicator
{state.isRequired && <span>*</span>}
```

### 3. Accessibility

Include proper ARIA attributes:

```tsx
<input
  aria-invalid={!!error}
  aria-describedby={error ? `${name}-error` : undefined}
  aria-required={state.isRequired}
/>
```

### 4. Consistent Styling

Use className props for external styling:

```tsx
<div className={`field-wrapper ${className || ""} ${error ? "has-error" : ""}`}>
```

## Next Steps

- [Schema Reference](./schema-reference.md) - Field definition options
- [Data Sources](./data-sources.md) - Async data fetching
- [Validation](./validation.md) - Validation rules



