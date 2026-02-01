# Conditional Fields

AutoForm supports conditional field rendering - show or hide fields based on other field values.

## Table of Contents

- [Overview](#overview)
- [Condition Syntax](#condition-syntax)
- [Operators](#operators)
- [Examples](#examples)
- [Nested Conditions](#nested-conditions)
- [Conditional Validation](#conditional-validation)
- [Best Practices](#best-practices)

## Overview

Conditional fields are automatically shown/hidden based on other form values. When a field is hidden:

- It's removed from the DOM
- Its value is preserved in form state
- Validation is still applied (see [Conditional Validation](#conditional-validation))

## Condition Syntax

```typescript
interface ConditionConfig {
  when: string;           // Field name to watch
  operator: Operator;     // Comparison operator
  value?: unknown;        // Value to compare against
}
```

Add conditions to any field:

```typescript
{
  name: "otherReason",
  type: "textarea",
  label: "Please specify",
  condition: {
    when: "reason",
    operator: "eq",
    value: "other",
  },
}
```

## Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equal | `{ when: "type", operator: "eq", value: "business" }` |
| `neq` | Not equal | `{ when: "status", operator: "neq", value: "cancelled" }` |
| `gt` | Greater than | `{ when: "quantity", operator: "gt", value: 10 }` |
| `gte` | Greater than or equal | `{ when: "age", operator: "gte", value: 18 }` |
| `lt` | Less than | `{ when: "price", operator: "lt", value: 100 }` |
| `lte` | Less than or equal | `{ when: "items", operator: "lte", value: 5 }` |
| `in` | Value is in array | `{ when: "category", operator: "in", value: ["a", "b"] }` |
| `notIn` | Value not in array | `{ when: "role", operator: "notIn", value: ["guest"] }` |
| `exists` | Has a value | `{ when: "email", operator: "exists" }` |
| `notExists` | No value | `{ when: "nickname", operator: "notExists" }` |

## Examples

### Show Field When Value Equals

```typescript
// Show "Company Name" when account type is "business"
{
  name: "companyName",
  type: "text",
  label: "Company Name",
  condition: {
    when: "accountType",
    operator: "eq",
    value: "business",
  },
}
```

### Show Field When Checkbox is Checked

```typescript
// Show shipping address when "different address" is checked
{
  name: "shippingAddress",
  type: "object",
  label: "Shipping Address",
  condition: {
    when: "differentShippingAddress",
    operator: "eq",
    value: true,
  },
  fields: [
    { name: "street", type: "text", label: "Street" },
    { name: "city", type: "text", label: "City" },
    // ...
  ],
}
```

### Show Field Based on Number

```typescript
// Show bulk discount field when quantity > 100
{
  name: "bulkDiscount",
  type: "number",
  label: "Bulk Discount (%)",
  condition: {
    when: "quantity",
    operator: "gt",
    value: 100,
  },
}
```

### Show Field When Value is in List

```typescript
// Show technical details for support-related subjects
{
  name: "technicalDetails",
  type: "textarea",
  label: "Technical Details",
  description: "Include error messages, steps to reproduce, etc.",
  condition: {
    when: "subject",
    operator: "in",
    value: ["bug-report", "technical-support", "feature-request"],
  },
}
```

### Show Field When Another Field Has Value

```typescript
// Show "Confirm Email" when email is filled
{
  name: "confirmEmail",
  type: "email",
  label: "Confirm Email",
  condition: {
    when: "email",
    operator: "exists",
  },
}
```

### Show Field When Value is NOT Something

```typescript
// Show custom priority for non-standard requests
{
  name: "customPriority",
  type: "number",
  label: "Custom Priority (1-10)",
  condition: {
    when: "priorityType",
    operator: "neq",
    value: "standard",
  },
}
```

### Hide Field Based on Role

```typescript
// Hide admin options for non-admin users
{
  name: "adminSettings",
  type: "object",
  label: "Admin Settings",
  condition: {
    when: "userRole",
    operator: "notIn",
    value: ["user", "guest"],
  },
  fields: [/* ... */],
}
```

## Nested Conditions

Conditions work with nested field paths using dot notation:

```typescript
const schema = {
  fields: [
    {
      name: "shipping",
      type: "object",
      fields: [
        {
          name: "method",
          type: "select",
          label: "Shipping Method",
          options: [
            { label: "Standard", value: "standard" },
            { label: "Express", value: "express" },
            { label: "Pickup", value: "pickup" },
          ],
        },
        {
          name: "address",
          type: "text",
          label: "Shipping Address",
          // Show only when method is not pickup
          condition: {
            when: "shipping.method",  // Dot notation for nested field
            operator: "neq",
            value: "pickup",
          },
        },
        {
          name: "pickupLocation",
          type: "select",
          label: "Pickup Location",
          dataSourceKey: "pickupLocations",
          // Show only when method is pickup
          condition: {
            when: "shipping.method",
            operator: "eq",
            value: "pickup",
          },
        },
      ],
    },
  ],
};
```

## Conditional Validation

By default, hidden fields still validate. To conditionally validate:

### Option 1: Use Zod's `.optional()` with Refinements

```typescript
import { z } from "zod";
import { generateZodSchema } from "@autoform/core";

const baseSchema = generateZodSchema(formSchema);

const zodSchema = baseSchema.superRefine((data, ctx) => {
  // Only validate companyName if accountType is business
  if (data.accountType === "business" && !data.companyName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Company name is required for business accounts",
      path: ["companyName"],
    });
  }
});
```

### Option 2: Mark Hidden Fields as Optional

```typescript
{
  name: "companyName",
  type: "text",
  label: "Company Name",
  // Not required in base schema
  validation: {
    // Only required is handled conditionally
  },
  condition: {
    when: "accountType",
    operator: "eq",
    value: "business",
  },
}
```

Then add conditional validation:

```typescript
const zodSchema = baseSchema.refine(
  (data) => {
    if (data.accountType === "business") {
      return !!data.companyName && data.companyName.length >= 2;
    }
    return true;
  },
  {
    message: "Company name is required for business accounts",
    path: ["companyName"],
  }
);
```

## Complex Conditional Forms

### Multi-Step Conditional Form

```typescript
const schema = {
  fields: [
    // Step 1: Account Type
    {
      name: "accountType",
      type: "radio",
      label: "Account Type",
      options: [
        { label: "Personal", value: "personal" },
        { label: "Business", value: "business" },
      ],
      validation: { required: true },
    },

    // Personal Fields
    {
      name: "fullName",
      type: "text",
      label: "Full Name",
      condition: { when: "accountType", operator: "eq", value: "personal" },
      validation: { required: "Name is required" },
    },
    {
      name: "dateOfBirth",
      type: "date",
      label: "Date of Birth",
      condition: { when: "accountType", operator: "eq", value: "personal" },
    },

    // Business Fields
    {
      name: "companyName",
      type: "text",
      label: "Company Name",
      condition: { when: "accountType", operator: "eq", value: "business" },
      validation: { required: "Company name is required" },
    },
    {
      name: "taxId",
      type: "text",
      label: "Tax ID",
      condition: { when: "accountType", operator: "eq", value: "business" },
    },
    {
      name: "companySize",
      type: "select",
      label: "Company Size",
      condition: { when: "accountType", operator: "eq", value: "business" },
      options: [
        { label: "1-10 employees", value: "small" },
        { label: "11-50 employees", value: "medium" },
        { label: "51-200 employees", value: "large" },
        { label: "200+ employees", value: "enterprise" },
      ],
    },

    // Enterprise-only field (nested condition)
    {
      name: "enterpriseContact",
      type: "text",
      label: "Enterprise Account Manager",
      condition: { when: "companySize", operator: "eq", value: "enterprise" },
    },
  ],
};
```

### Cascading Conditions

```typescript
const schema = {
  fields: [
    {
      name: "hasVehicle",
      type: "checkbox",
      label: "Do you own a vehicle?",
    },
    {
      name: "vehicleType",
      type: "select",
      label: "Vehicle Type",
      condition: { when: "hasVehicle", operator: "eq", value: true },
      options: [
        { label: "Car", value: "car" },
        { label: "Motorcycle", value: "motorcycle" },
        { label: "Truck", value: "truck" },
      ],
    },
    {
      name: "carMake",
      type: "autocomplete",
      label: "Car Make",
      dataSourceKey: "carMakes",
      condition: { when: "vehicleType", operator: "eq", value: "car" },
    },
    {
      name: "motorcycleType",
      type: "select",
      label: "Motorcycle Type",
      condition: { when: "vehicleType", operator: "eq", value: "motorcycle" },
      options: [
        { label: "Sport", value: "sport" },
        { label: "Cruiser", value: "cruiser" },
        { label: "Touring", value: "touring" },
      ],
    },
    {
      name: "truckCapacity",
      type: "number",
      label: "Truck Capacity (tons)",
      condition: { when: "vehicleType", operator: "eq", value: "truck" },
    },
  ],
};
```

## Best Practices

### 1. Keep Conditions Simple

```typescript
// Good - simple, clear condition
condition: { when: "type", operator: "eq", value: "other" }

// Avoid - complex nested logic
// Instead, use computed values or break into multiple fields
```

### 2. Use Meaningful Default Values

```typescript
// Set sensible defaults for conditional fields
{
  name: "priority",
  type: "select",
  defaultValue: "medium",  // Sensible default
  condition: { when: "isUrgent", operator: "eq", value: true },
}
```

### 3. Consider UX

```typescript
// Group related conditional fields
{
  name: "businessInfo",
  type: "object",
  label: "Business Information",
  condition: { when: "accountType", operator: "eq", value: "business" },
  fields: [
    { name: "companyName", type: "text", label: "Company Name" },
    { name: "taxId", type: "text", label: "Tax ID" },
    { name: "industry", type: "select", label: "Industry" },
  ],
}
```

### 4. Handle Form Reset

When resetting forms with conditional fields:

```tsx
const form = useForm({
  resolver: zodResolver(zodSchema),
  defaultValues: {
    accountType: "personal",
    // Include defaults for all conditional fields
    companyName: "",
    fullName: "",
  },
});

// Reset clears everything properly
form.reset();
```

### 5. Clear Dependent Values

When a parent field changes, you might want to clear dependent values:

```tsx
// Watch the parent field
const accountType = form.watch("accountType");

// Clear dependent fields when parent changes
useEffect(() => {
  if (accountType === "personal") {
    form.setValue("companyName", "");
    form.setValue("taxId", "");
  } else {
    form.setValue("fullName", "");
  }
}, [accountType, form]);
```

## Next Steps

- [Schema Reference](./schema-reference.md) - All field options
- [Validation](./validation.md) - Conditional validation
- [Arrays & Objects](./arrays-objects.md) - Nested structures




