import React, { forwardRef } from 'react';
import type { FieldComponentProps } from '@autoform/core';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * Text field component using Shadcn UI
 */
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
    const inputType = (fieldProps?.type as string) || 'text';

    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <Label htmlFor={name} className="text-sm font-medium text-foreground">
            {label}
            {state.isRequired && <span className="ml-1 text-destructive">*</span>}
          </Label>
        )}
        <Input
          ref={ref}
          id={name}
          name={name}
          type={inputType}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={state.isDisabled}
          readOnly={state.isReadOnly}
          className={cn(error && 'border-destructive focus-visible:ring-destructive')}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : description ? `${name}-desc` : undefined}
        />
        {description && !error && (
          <p id={`${name}-desc`} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
        {error && (
          <p id={`${name}-error`} className="text-sm font-medium text-destructive">
            {error.message}
          </p>
        )}
      </div>
    );
  }
);
