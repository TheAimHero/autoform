import type { ArrayFieldComponentProps } from '@autoform/core';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Plus, ArrowUp, ArrowDown, X } from 'lucide-react';

/**
 * Array field wrapper component using Shadcn UI
 */
export function ArrayFieldWrapper({
  name: _name,
  label,
  description,
  fields,
  renderItem,
  onAppend,
  onRemove,
  onMove,
  state,
  error,
  minItems,
  maxItems,
  className,
}: ArrayFieldComponentProps) {
  const canAdd = maxItems === undefined || fields.length < maxItems;
  const canRemove = minItems === undefined || fields.length > minItems;

  return (
    <div className={cn('space-y-4', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-foreground">
            {label}
            {state.isRequired && <span className="ml-1 text-destructive">*</span>}
          </Label>
          {!state.isDisabled && !state.isReadOnly && canAdd && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAppend()}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          )}
        </div>
      )}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      <div className="space-y-3">
        {fields.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No items yet. Click "Add" to create one.
              </p>
            </CardContent>
          </Card>
        )}
        {fields.map(({ id, index }) => (
          <Card key={id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1 space-y-4">{renderItem(index)}</div>
                {!state.isDisabled && !state.isReadOnly && (
                  <div className="flex flex-col gap-1 shrink-0">
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onMove(index, index - 1)}
                        title="Move up"
                        className="h-8 w-8"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                    )}
                    {index < fields.length - 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onMove(index, index + 1)}
                        title="Move down"
                        className="h-8 w-8"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    )}
                    {canRemove && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove(index)}
                        title="Remove"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && <p className="text-sm font-medium text-destructive">{error.message}</p>}
    </div>
  );
}
