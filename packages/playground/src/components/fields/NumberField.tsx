import React, { forwardRef } from 'react';
import type { FieldComponentProps } from '@autoform/core';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * Number field component using Shadcn UI
 */
export const NumberField = forwardRef<HTMLInputElement, FieldComponentProps<number>>(
  function NumberField(
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
    const min = fieldProps?.min as number | undefined;
    const max = fieldProps?.max as number | undefined;
    const step = fieldProps?.step as number | undefined;

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
          type="number"
          value={value ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val === '' ? (undefined as any) : Number(val));
          }}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={state.isDisabled}
          readOnly={state.isReadOnly}
          min={min}
          max={max}
          step={step}
          className={cn(error && 'border-destructive focus-visible:ring-destructive')}
          aria-invalid={!!error}
        />
        {description && !error && <p className="text-sm text-muted-foreground">{description}</p>}
        {error && <p className="text-sm font-medium text-destructive">{error.message}</p>}
      </div>
    );
  }
);
