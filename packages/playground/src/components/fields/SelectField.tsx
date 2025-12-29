import { forwardRef } from 'react';
import type { FieldComponentProps } from '@autoform/core';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * Select field component using Shadcn UI
 */
export const SelectField = forwardRef<HTMLButtonElement, FieldComponentProps>(function SelectField(
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
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={name} className="text-sm font-medium text-foreground">
          {label}
          {state.isRequired && <span className="ml-1 text-destructive">*</span>}
        </Label>
      )}
      <Select
        value={value as string}
        onValueChange={onChange}
        disabled={state.isDisabled || state.isLoading}
      >
        <SelectTrigger
          ref={ref}
          id={name}
          className={cn(error && 'border-destructive focus:ring-destructive')}
          isLoading={state.isLoading}
          onBlur={onBlur}
          aria-invalid={!!error}
        >
          <SelectValue placeholder={state.isLoading ? 'Loading...' : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={String(option.value)}
              value={String(option.value)}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && !error && <p className="text-sm text-muted-foreground">{description}</p>}
      {error && <p className="text-sm font-medium text-destructive">{error.message}</p>}
    </div>
  );
});
