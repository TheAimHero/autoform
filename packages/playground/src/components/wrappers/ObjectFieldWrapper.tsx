import React from 'react';
import type { ObjectFieldComponentProps } from '@autoform/core';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Object field wrapper component using Shadcn UI
 */
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
    <Card className={cn('bg-card/50', className)}>
      {(label || description) && (
        <CardHeader className="pb-4">
          {label && (
            <CardTitle className="text-base font-medium">
              {label}
              {state.isRequired && <span className="ml-1 text-destructive">*</span>}
            </CardTitle>
          )}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={cn(label || description ? '' : 'pt-6')}>
        <div className="space-y-4">{children}</div>
        {error && <p className="mt-4 text-sm font-medium text-destructive">{error.message}</p>}
      </CardContent>
    </Card>
  );
}
