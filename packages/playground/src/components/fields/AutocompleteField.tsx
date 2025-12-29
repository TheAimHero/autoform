import React, { forwardRef, useState, useRef, useEffect } from 'react';
import type { FieldComponentProps } from '@autoform/core';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronsUpDown, Check, X } from 'lucide-react';

/**
 * Autocomplete field component using Shadcn UI (Combobox pattern)
 */
export const AutocompleteField = forwardRef<HTMLButtonElement, FieldComponentProps>(
  function AutocompleteField(
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
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');

    // Find selected option label
    const selectedOption = options.find((o) => o.value === value);

    // Update input value when selected option changes
    useEffect(() => {
      if (selectedOption) {
        setInputValue(selectedOption.label);
      } else {
        setInputValue('');
      }
    }, [selectedOption]);

    const handleSelect = (optionValue: string) => {
      if (optionValue === value) {
        // Deselect if clicking the same option
        onChange(undefined as any);
      } else {
        onChange(optionValue);
      }
      setOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(undefined as any);
      setInputValue('');
      onSearch?.('');
    };

    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <Label htmlFor={name} className="text-sm font-medium text-foreground">
            {label}
            {state.isRequired && <span className="ml-1 text-destructive">*</span>}
          </Label>
        )}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              id={name}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-invalid={!!error}
              disabled={state.isDisabled}
              onBlur={onBlur}
              className={cn(
                'w-full justify-between font-normal bg-background/50 hover:bg-background/50',
                !value && 'text-muted-foreground',
                error && 'border-destructive focus:ring-destructive'
              )}
            >
              <span className="truncate">
                {selectedOption ? selectedOption.label : placeholder || 'Select...'}
              </span>
              <div className="flex items-center gap-1 ml-2 shrink-0">
                {value && !state.isDisabled && !state.isReadOnly && (
                  <X
                    className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer"
                    onClick={handleClear}
                  />
                )}
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command shouldFilter={true}>
              <CommandInput
                placeholder={placeholder || 'Search...'}
                value={onSearch ? inputValue : undefined}
                onValueChange={(val) => {
                  if (onSearch) {
                    setInputValue(val);
                    onSearch(val);
                  }
                }}
                isLoading={state.isLoading}
              />
              <CommandList>
                <CommandEmpty>{state.isLoading ? 'Loading...' : 'No results found.'}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={String(option.value)}
                      value={String(option.value)}
                      onSelect={() => handleSelect(String(option.value))}
                      disabled={option.disabled}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === option.value ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {description && !error && <p className="text-sm text-muted-foreground">{description}</p>}
        {error && <p className="text-sm font-medium text-destructive">{error.message}</p>}
      </div>
    );
  }
);
