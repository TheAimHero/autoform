import { forwardRef } from 'react';
import type { FieldComponentProps } from '@autoform/core';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * Checkbox field component using Shadcn UI
 */
export const CheckboxField = forwardRef<HTMLButtonElement, FieldComponentProps<boolean>>(
  function CheckboxField(
    { name, value, onChange, onBlur, label, description, state, error, className },
    ref
  ) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center space-x-3">
          <Checkbox
            ref={ref}
            id={name}
            checked={value ?? false}
            onCheckedChange={(checked) => onChange(checked as boolean)}
            onBlur={onBlur}
            disabled={state.isDisabled}
            aria-invalid={!!error}
            className={cn(error && 'border-destructive data-[state=checked]:bg-destructive')}
          />
          {label && (
            <Label
              htmlFor={name}
              className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {label}
              {state.isRequired && <span className="ml-1 text-destructive">*</span>}
            </Label>
          )}
        </div>
        {description && !error && (
          <p className="text-sm text-muted-foreground pl-7">{description}</p>
        )}
        {error && <p className="text-sm font-medium text-destructive pl-7">{error.message}</p>}
      </div>
    );
  }
);
