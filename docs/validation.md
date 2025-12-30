# Validation

AutoForm provides seamless integration with Zod for validation. This guide covers validation rules, error handling, and custom validators.

## Table of Contents

- [Overview](#overview)
- [Zod Schema Generation](#zod-schema-generation)
- [Built-in Validation Rules](#built-in-validation-rules)
- [Custom Error Messages](#custom-error-messages)
- [Custom Validators](#custom-validators)
- [Async Validation](#async-validation)
- [Cross-Field Validation](#cross-field-validation)
- [Error Display](#error-display)

## Overview

AutoForm uses a two-step validation approach:

1. **Schema Definition** - Define validation rules in your form schema
2. **Zod Generation** - AutoForm generates a Zod schema from your rules
3. **React Hook Form** - Uses `@hookform/resolvers/zod` for validation

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AutoForm, generateZodSchema } from "@autoform/core";

const schema = {
  fields: [
    {
      name: "email",
      type: "email",
      validation: { required: true, email: true },
    },
  ],
};

// Generate Zod schema from your form schema
const zodSchema = generateZodSchema(schema);

function MyForm() {
  const form = useForm({
    resolver: zodResolver(zodSchema),
  });

  return <AutoForm schema={schema} form={form} /* ... */ />;
}
```

## Zod Schema Generation

The `generateZodSchema` function converts your validation rules to Zod:

```typescript
import { generateZodSchema } from "@autoform/core";

const formSchema = {
  fields: [
    {
      name: "email",
      type: "email",
      validation: { required: true, email: true },
    },
    {
      name: "age",
      type: "number",
      validation: { min: 18, max: 100 },
    },
  ],
};

// Generates equivalent to:
// z.object({
//   email: z.string().min(1, "Required").email("Invalid email"),
//   age: z.number().min(18).max(100).optional(),
// })
const zodSchema = generateZodSchema(formSchema);
```

## Built-in Validation Rules

### Required

```typescript
// Simple required
{ validation: { required: true } }

// With custom message
{ validation: { required: "This field is required" } }
```

### String Length

```typescript
{
  name: "username",
  type: "text",
  validation: {
    minLength: 3,  // or { value: 3, message: "Too short" }
    maxLength: 20, // or { value: 20, message: "Too long" }
  },
}
```

### Number Range

```typescript
{
  name: "quantity",
  type: "number",
  validation: {
    min: 1,   // or { value: 1, message: "Minimum is 1" }
    max: 100, // or { value: 100, message: "Maximum is 100" }
  },
}
```

### Email

```typescript
{
  name: "email",
  type: "email",
  validation: {
    email: true, // or "Please enter a valid email"
  },
}
```

### URL

```typescript
{
  name: "website",
  type: "text",
  validation: {
    url: true, // or "Please enter a valid URL"
  },
}
```

### UUID

```typescript
{
  name: "id",
  type: "text",
  validation: {
    uuid: true, // or "Invalid UUID format"
  },
}
```

### Pattern (Regex)

Simple pattern:

```typescript
{
  name: "zipCode",
  type: "text",
  validation: {
    pattern: "^\\d{5}(-\\d{4})?$", // US ZIP code
  },
}
```

Pattern with message:

```typescript
{
  name: "zipCode",
  type: "text",
  validation: {
    pattern: {
      value: "^\\d{5}(-\\d{4})?$",
      message: "Invalid ZIP code format",
    },
  },
}
```

Advanced regex with flags:

```typescript
{
  name: "code",
  type: "text",
  validation: {
    regex: {
      pattern: "^[A-Z]{2}\\d{4}$",
      flags: "i", // case insensitive
      message: "Code must be 2 letters followed by 4 digits",
    },
  },
}
```

## Custom Error Messages

All validation rules support custom messages:

```typescript
{
  name: "password",
  type: "password",
  validation: {
    required: "Password is required",
    minLength: {
      value: 8,
      message: "Password must be at least 8 characters",
    },
    pattern: {
      value: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)",
      message: "Password must contain uppercase, lowercase, and number",
    },
  },
}
```

## Custom Validators

For complex validation logic, you can use custom validators:

### Define Custom Validators

```typescript
import { generateZodSchema } from "@autoform/core";

// Custom validator functions
const customValidators = {
  passwordStrength: (value: string) => {
    if (!/[A-Z]/.test(value)) return "Must contain uppercase letter";
    if (!/[a-z]/.test(value)) return "Must contain lowercase letter";
    if (!/[0-9]/.test(value)) return "Must contain number";
    if (!/[!@#$%^&*]/.test(value)) return "Must contain special character";
    return true;
  },
  
  uniqueUsername: async (value: string) => {
    const response = await fetch(`/api/check-username?username=${value}`);
    const { available } = await response.json();
    return available || "Username is already taken";
  },
};

// Generate schema with custom validators
const zodSchema = generateZodSchema(schema, { customValidators });
```

### Reference in Schema

```typescript
{
  name: "password",
  type: "password",
  validation: {
    required: true,
    minLength: 8,
    custom: "passwordStrength", // References the custom validator
  },
}
```

## Async Validation

For server-side validation like checking username availability:

### Using Custom Validators

```typescript
const customValidators = {
  checkEmail: async (value: string) => {
    const response = await fetch(`/api/check-email?email=${value}`);
    const { exists } = await response.json();
    return !exists || "Email is already registered";
  },
};

// Schema
{
  name: "email",
  type: "email",
  validation: {
    required: true,
    email: true,
    custom: "checkEmail",
  },
}
```

### Using React Hook Form's Async Validation

You can also add async validation directly to the form:

```typescript
const form = useForm({
  resolver: zodResolver(zodSchema),
  mode: "onBlur", // Validate on blur for async
});

// Add async validation manually
form.register("email", {
  validate: async (value) => {
    const response = await fetch(`/api/check-email?email=${value}`);
    const { exists } = await response.json();
    return !exists || "Email is already registered";
  },
});
```

## Cross-Field Validation

Validate fields based on other field values:

### Using Zod's Refine

```typescript
import { z } from "zod";
import { generateZodSchema } from "@autoform/core";

const baseSchema = generateZodSchema(formSchema);

// Add cross-field validation
const zodSchema = baseSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }
);
```

### Complex Cross-Field Validation

```typescript
const zodSchema = baseSchema
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    }
  )
  .refine(
    (data) => {
      if (data.hasEndDate) {
        return data.endDate > data.startDate;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );
```

## Error Display

### In Field Components

Errors are passed to your field components:

```tsx
function TextField({ name, error, ...props }) {
  return (
    <div>
      <input {...props} aria-invalid={!!error} />
      {error && (
        <p className="error-message" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}
```

### Accessing Errors Programmatically

```tsx
function MyForm() {
  const form = useForm({
    resolver: zodResolver(zodSchema),
  });

  // Access all errors
  const errors = form.formState.errors;

  // Access specific error
  const emailError = errors.email?.message;

  // Check if form has errors
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <AutoForm
      schema={schema}
      form={form}
      registry={registry}
      dataSources={dataSources}
      onSubmit={(data) => console.log(data)}
      onError={(errors) => console.error("Validation failed:", errors)}
    />
  );
}
```

### Form-Level Errors

For errors that don't belong to a specific field:

```tsx
function MyForm() {
  const form = useForm({
    resolver: zodResolver(zodSchema),
  });

  // Set form-level error
  const handleSubmit = async (data) => {
    try {
      await submitToAPI(data);
    } catch (error) {
      form.setError("root", {
        type: "manual",
        message: "Submission failed. Please try again.",
      });
    }
  };

  return (
    <>
      {form.formState.errors.root && (
        <div className="form-error">
          {form.formState.errors.root.message}
        </div>
      )}
      <AutoForm
        schema={schema}
        form={form}
        registry={registry}
        onSubmit={handleSubmit}
      />
    </>
  );
}
```

## Validation Timing

Control when validation runs:

```typescript
const form = useForm({
  resolver: zodResolver(zodSchema),
  mode: "onSubmit",      // Validate on submit (default)
  // mode: "onChange",   // Validate on every change
  // mode: "onBlur",     // Validate on blur
  // mode: "onTouched",  // Validate on first blur, then on change
  // mode: "all",        // Validate on blur and change
  
  reValidateMode: "onChange", // Re-validate after first submit
});
```

## Complete Example

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AutoForm, generateZodSchema } from "@autoform/core";

// Schema
const formSchema = {
  fields: [
    {
      name: "email",
      type: "email",
      label: "Email",
      validation: {
        required: "Email is required",
        email: "Invalid email address",
        custom: "checkEmailAvailable",
      },
    },
    {
      name: "password",
      type: "password",
      label: "Password",
      validation: {
        required: "Password is required",
        minLength: { value: 8, message: "At least 8 characters" },
        custom: "passwordStrength",
      },
    },
    {
      name: "confirmPassword",
      type: "password",
      label: "Confirm Password",
      validation: {
        required: "Please confirm your password",
      },
    },
    {
      name: "age",
      type: "number",
      label: "Age",
      validation: {
        required: "Age is required",
        min: { value: 18, message: "Must be 18 or older" },
        max: { value: 120, message: "Invalid age" },
      },
    },
  ],
};

// Custom validators
const customValidators = {
  checkEmailAvailable: async (value: string) => {
    // Simulate API check
    await new Promise((r) => setTimeout(r, 500));
    const taken = ["test@example.com", "admin@example.com"];
    return !taken.includes(value) || "Email is already taken";
  },
  
  passwordStrength: (value: string) => {
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecial = /[!@#$%^&*]/.test(value);
    
    if (!hasUpper) return "Must contain uppercase letter";
    if (!hasLower) return "Must contain lowercase letter";
    if (!hasNumber) return "Must contain number";
    if (!hasSpecial) return "Must contain special character (!@#$%^&*)";
    return true;
  },
};

// Generate base schema
const baseZodSchema = generateZodSchema(formSchema, { customValidators });

// Add cross-field validation
const zodSchema = baseZodSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }
);

// Form component
function RegistrationForm() {
  const form = useForm({
    resolver: zodResolver(zodSchema),
    mode: "onBlur",
  });

  const handleSubmit = async (data) => {
    try {
      await registerUser(data);
      alert("Registration successful!");
    } catch (error) {
      form.setError("root", {
        message: "Registration failed. Please try again.",
      });
    }
  };

  return (
    <div>
      {form.formState.errors.root && (
        <div className="form-error">
          {form.formState.errors.root.message}
        </div>
      )}
      
      <AutoForm
        schema={formSchema}
        form={form}
        registry={registry}
        onSubmit={handleSubmit}
        onError={(errors) => console.log("Validation errors:", errors)}
      />
    </div>
  );
}
```

## Next Steps

- [Schema Reference](./schema-reference.md) - All field options
- [Field Components](./field-components.md) - Displaying errors in components
- [Conditional Fields](./conditional-fields.md) - Conditional validation



