# Arrays & Objects

AutoForm supports complex nested structures including objects (grouped fields) and arrays (repeatable fields).

## Table of Contents

- [Object Fields](#object-fields)
- [Array Fields](#array-fields)
- [Deeply Nested Structures](#deeply-nested-structures)
- [Validation](#validation)
- [Data Sources in Nested Fields](#data-sources-in-nested-fields)
- [Custom Wrappers](#custom-wrappers)

## Object Fields

Object fields group related fields together and create nested data structures.

### Basic Object

```typescript
const schema = {
  fields: [
    {
      name: "address",
      type: "object",
      label: "Address",
      fields: [
        { name: "street", type: "text", label: "Street" },
        { name: "city", type: "text", label: "City" },
        { name: "state", type: "text", label: "State" },
        { name: "zipCode", type: "text", label: "ZIP Code" },
      ],
    },
  ],
};

// Produces form data:
// {
//   address: {
//     street: "123 Main St",
//     city: "Springfield",
//     state: "IL",
//     zipCode: "62701"
//   }
// }
```

### Nested Objects

```typescript
const schema = {
  fields: [
    {
      name: "company",
      type: "object",
      label: "Company Information",
      fields: [
        { name: "name", type: "text", label: "Company Name" },
        {
          name: "headquarters",
          type: "object",
          label: "Headquarters",
          fields: [
            { name: "city", type: "text", label: "City" },
            { name: "country", type: "select", label: "Country", dataSourceKey: "countries" },
          ],
        },
        {
          name: "contact",
          type: "object",
          label: "Contact",
          fields: [
            { name: "email", type: "email", label: "Email" },
            { name: "phone", type: "text", label: "Phone" },
          ],
        },
      ],
    },
  ],
};

// Produces:
// {
//   company: {
//     name: "Acme Inc",
//     headquarters: { city: "New York", country: "us" },
//     contact: { email: "info@acme.com", phone: "+1..." }
//   }
// }
```

### Object with Wrapper Component

Register an object wrapper to style grouped fields:

```typescript
const registry = createFieldRegistry({
  fields: { /* ... */ },
  objectField: ObjectFieldWrapper,  // Custom wrapper
});
```

```tsx
// ObjectFieldWrapper.tsx
function ObjectFieldWrapper({
  name,
  label,
  description,
  children,
  state,
  className,
}: ObjectFieldComponentProps) {
  return (
    <fieldset className={`object-field ${className || ""}`}>
      {label && <legend>{label}</legend>}
      {description && <p className="description">{description}</p>}
      <div className="object-fields">{children}</div>
    </fieldset>
  );
}
```

## Array Fields

Array fields allow users to add, remove, and reorder items.

### Array of Primitive Values

```typescript
{
  name: "tags",
  type: "array",
  label: "Tags",
  itemType: "text",
  minItems: 1,
  maxItems: 5,
}

// Produces: { tags: ["react", "typescript", "forms"] }
```

### Array of Objects

```typescript
{
  name: "contacts",
  type: "array",
  label: "Emergency Contacts",
  itemType: "object",
  itemFields: [
    {
      name: "name",
      type: "text",
      label: "Name",
      validation: { required: true },
    },
    {
      name: "phone",
      type: "text",
      label: "Phone",
      validation: { required: true },
    },
    {
      name: "relationship",
      type: "select",
      label: "Relationship",
      options: [
        { label: "Spouse", value: "spouse" },
        { label: "Parent", value: "parent" },
        { label: "Sibling", value: "sibling" },
        { label: "Friend", value: "friend" },
        { label: "Other", value: "other" },
      ],
    },
  ],
  minItems: 1,
  maxItems: 3,
}

// Produces:
// {
//   contacts: [
//     { name: "Jane Doe", phone: "+1...", relationship: "spouse" },
//     { name: "John Doe", phone: "+1...", relationship: "parent" }
//   ]
// }
```

### Array with Custom Item Definition

For more control over individual items:

```typescript
{
  name: "skills",
  type: "array",
  label: "Skills",
  itemDefinition: {
    type: "autocomplete",
    placeholder: "Search skills...",
    dataSourceKey: "skills",
    validation: { required: true },
  },
  minItems: 1,
  maxItems: 10,
}
```

### Array Configuration Options

```typescript
{
  name: "items",
  type: "array",
  label: "Items",
  
  // Item type (primitive or "object")
  itemType: "text",
  
  // For object items
  itemFields: [/* field definitions */],
  
  // For custom item rendering
  itemDefinition: {/* field definition without name */},
  
  // Constraints
  minItems: 1,      // Minimum items required
  maxItems: 10,     // Maximum items allowed
  
  // Default value
  defaultValue: [{ name: "", email: "" }],
}
```

### Array Field Wrapper

Register a custom wrapper for array UI:

```typescript
const registry = createFieldRegistry({
  fields: { /* ... */ },
  arrayField: ArrayFieldWrapper,
});
```

```tsx
// ArrayFieldWrapper.tsx
function ArrayFieldWrapper({
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
}: ArrayFieldComponentProps) {
  const canAdd = maxItems === undefined || fields.length < maxItems;
  const canRemove = minItems === undefined || fields.length > minItems;

  return (
    <div className="array-field">
      <div className="array-header">
        {label && <label>{label}</label>}
        {description && <p>{description}</p>}
      </div>

      <div className="array-items">
        {fields.map(({ id, index }) => (
          <div key={id} className="array-item">
            <div className="item-content">
              {renderItem(index)}
            </div>
            
            <div className="item-actions">
              <button
                type="button"
                onClick={() => onMove(index, index - 1)}
                disabled={index === 0 || state.isDisabled}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => onMove(index, index + 1)}
                disabled={index === fields.length - 1 || state.isDisabled}
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => onRemove(index)}
                disabled={!canRemove || state.isDisabled}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onAppend()}
        disabled={!canAdd || state.isDisabled}
        className="add-button"
      >
        + Add Item
      </button>
    </div>
  );
}
```

## Deeply Nested Structures

Combine objects and arrays for complex forms:

```typescript
const schema = {
  fields: [
    {
      name: "company",
      type: "object",
      label: "Company",
      fields: [
        { name: "name", type: "text", label: "Name" },
        {
          name: "departments",
          type: "array",
          label: "Departments",
          itemType: "object",
          itemFields: [
            { name: "name", type: "text", label: "Department Name" },
            { name: "budget", type: "number", label: "Budget" },
            {
              name: "employees",
              type: "array",
              label: "Employees",
              itemType: "object",
              itemFields: [
                { name: "name", type: "text", label: "Name" },
                { name: "role", type: "text", label: "Role" },
                { name: "email", type: "email", label: "Email" },
              ],
              maxItems: 20,
            },
          ],
          maxItems: 10,
        },
      ],
    },
  ],
};

// Produces deeply nested structure:
// {
//   company: {
//     name: "Acme Inc",
//     departments: [
//       {
//         name: "Engineering",
//         budget: 500000,
//         employees: [
//           { name: "Alice", role: "Senior Dev", email: "alice@..." },
//           { name: "Bob", role: "Dev", email: "bob@..." }
//         ]
//       }
//     ]
//   }
// }
```

## Validation

### Object Validation

Validate nested fields individually:

```typescript
{
  name: "address",
  type: "object",
  fields: [
    {
      name: "street",
      type: "text",
      validation: { required: "Street is required" },
    },
    {
      name: "zipCode",
      type: "text",
      validation: {
        required: true,
        pattern: { value: "^\\d{5}$", message: "Invalid ZIP" },
      },
    },
  ],
}
```

### Array Validation

Validate array length and item values:

```typescript
{
  name: "tags",
  type: "array",
  minItems: 1,  // At least 1 tag required
  maxItems: 5,  // Maximum 5 tags
  itemType: "text",
}
```

For item validation:

```typescript
{
  name: "emails",
  type: "array",
  itemDefinition: {
    type: "email",
    validation: {
      required: "Email is required",
      email: "Invalid email",
    },
  },
}
```

### Cross-Field Validation in Arrays

Use Zod refinements for complex array validation:

```typescript
import { z } from "zod";

const zodSchema = baseSchema.refine(
  (data) => {
    // Ensure no duplicate emails in contacts
    const emails = data.contacts.map((c) => c.email);
    return new Set(emails).size === emails.length;
  },
  {
    message: "Duplicate emails are not allowed",
    path: ["contacts"],
  }
);
```

## Data Sources in Nested Fields

Data sources work in nested contexts:

```typescript
{
  name: "locations",
  type: "array",
  label: "Locations",
  itemType: "object",
  itemFields: [
    {
      name: "country",
      type: "select",
      label: "Country",
      dataSourceKey: "countries",
    },
    {
      name: "city",
      type: "autocomplete",
      label: "City",
      dataSourceKey: "cities",
      dependsOn: ["country"],  // Relative to item
    },
  ],
}
```

### Accessing Dependencies in Arrays

For array items, dependencies are resolved relative to the item:

```typescript
// In cities data source
const dataSources = {
  cities: {
    fetch: async ({ dependencies }) => {
      // dependencies.country contains the country value
      // from the same array item
      const countryId = dependencies?.country;
      // ...
    },
    // ...
  },
};
```

## Custom Wrappers

### Styled Object Wrapper

```tsx
import { Card, CardHeader, CardContent } from "./ui/card";

function StyledObjectWrapper({
  label,
  description,
  children,
  className,
}: ObjectFieldComponentProps) {
  return (
    <Card className={className}>
      {label && (
        <CardHeader>
          <h3>{label}</h3>
          {description && <p>{description}</p>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
}
```

### Drag-and-Drop Array Wrapper

```tsx
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";

function DraggableArrayWrapper({
  fields,
  renderItem,
  onMove,
  onRemove,
  onAppend,
  // ...
}: ArrayFieldComponentProps) {
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      onMove(oldIndex, newIndex);
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <SortableContext items={fields.map((f) => f.id)}>
        {fields.map(({ id, index }) => (
          <SortableItem key={id} id={id}>
            {renderItem(index)}
            <button onClick={() => onRemove(index)}>Remove</button>
          </SortableItem>
        ))}
      </SortableContext>
      <button onClick={() => onAppend()}>Add Item</button>
    </DndContext>
  );
}
```

### Collapsible Array Items

```tsx
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./ui/collapsible";

function CollapsibleArrayWrapper({
  label,
  fields,
  renderItem,
  onRemove,
  onAppend,
  minItems,
  maxItems,
}: ArrayFieldComponentProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  return (
    <div className="array-field">
      <h3>{label}</h3>
      
      {fields.map(({ id, index }) => (
        <Collapsible
          key={id}
          open={openItems.has(id)}
          onOpenChange={(open) => {
            const next = new Set(openItems);
            open ? next.add(id) : next.delete(id);
            setOpenItems(next);
          }}
        >
          <div className="item-header">
            <CollapsibleTrigger>
              Item {index + 1} {openItems.has(id) ? "▼" : "▶"}
            </CollapsibleTrigger>
            <button onClick={() => onRemove(index)}>Remove</button>
          </div>
          <CollapsibleContent>
            {renderItem(index)}
          </CollapsibleContent>
        </Collapsible>
      ))}
      
      <button
        onClick={() => {
          onAppend();
          // Auto-expand new item
          const newId = fields[fields.length]?.id;
          if (newId) setOpenItems((prev) => new Set(prev).add(newId));
        }}
        disabled={maxItems !== undefined && fields.length >= maxItems}
      >
        Add Item
      </button>
    </div>
  );
}
```

## Complete Example

```typescript
const jobApplicationSchema = {
  fields: [
    // Personal Info (Object)
    {
      name: "personal",
      type: "object",
      label: "Personal Information",
      fields: [
        { name: "firstName", type: "text", label: "First Name", validation: { required: true } },
        { name: "lastName", type: "text", label: "Last Name", validation: { required: true } },
        { name: "email", type: "email", label: "Email", validation: { required: true, email: true } },
        { name: "phone", type: "text", label: "Phone" },
      ],
    },

    // Work Experience (Array of Objects)
    {
      name: "experience",
      type: "array",
      label: "Work Experience",
      description: "Add your previous positions",
      itemType: "object",
      itemFields: [
        { name: "company", type: "text", label: "Company", validation: { required: true } },
        { name: "title", type: "text", label: "Job Title", validation: { required: true } },
        { name: "startDate", type: "date", label: "Start Date" },
        { name: "endDate", type: "date", label: "End Date" },
        { name: "current", type: "checkbox", label: "I currently work here" },
        { name: "description", type: "textarea", label: "Description" },
      ],
      minItems: 0,
      maxItems: 10,
    },

    // Education (Array of Objects)
    {
      name: "education",
      type: "array",
      label: "Education",
      itemType: "object",
      itemFields: [
        { name: "school", type: "text", label: "School/University", validation: { required: true } },
        { name: "degree", type: "text", label: "Degree" },
        { name: "field", type: "text", label: "Field of Study" },
        { name: "graduationYear", type: "number", label: "Graduation Year" },
      ],
      minItems: 0,
      maxItems: 5,
    },

    // Skills (Array of Primitives with Autocomplete)
    {
      name: "skills",
      type: "array",
      label: "Skills",
      itemDefinition: {
        type: "autocomplete",
        placeholder: "Search or add a skill...",
        dataSourceKey: "skills",
      },
      minItems: 1,
      maxItems: 15,
    },

    // References (Array with Nested Object)
    {
      name: "references",
      type: "array",
      label: "References",
      itemType: "object",
      itemFields: [
        { name: "name", type: "text", label: "Name", validation: { required: true } },
        {
          name: "contact",
          type: "object",
          label: "Contact Information",
          fields: [
            { name: "email", type: "email", label: "Email" },
            { name: "phone", type: "text", label: "Phone" },
          ],
        },
        { name: "relationship", type: "text", label: "Relationship" },
      ],
      minItems: 0,
      maxItems: 3,
    },
  ],
};
```

## Next Steps

- [Schema Reference](./schema-reference.md) - All field options
- [Field Components](./field-components.md) - Building array/object wrappers
- [Validation](./validation.md) - Validating nested structures




