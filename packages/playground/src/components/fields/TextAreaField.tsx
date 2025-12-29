import React, { forwardRef } from 'react';
import type { FieldComponentProps } from '@autoform/core';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * Textarea field component using Shadcn UI
 */
export const TextAreaField = forwardRef<HTMLTextAreaElement, FieldComponentProps<string>>(
  function TextAreaField(
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
    const rows = (fieldProps?.rows as number) || 4;

    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <Label htmlFor={name} className="text-sm font-medium text-foreground">
            {label}
            {state.isRequired && <span className="ml-1 text-destructive">*</span>}
          </Label>
        )}
        <Textarea
          ref={ref}
          id={name}
          name={name}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={state.isDisabled}
          readOnly={state.isReadOnly}
          rows={rows}
          className={cn(error && 'border-destructive focus-visible:ring-destructive')}
          aria-invalid={!!error}
        />
        {description && !error && <p className="text-sm text-muted-foreground">{description}</p>}
        {error && <p className="text-sm font-medium text-destructive">{error.message}</p>}
      </div>
    );
  }
);
