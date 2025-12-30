# Schema Reference

Complete reference for AutoForm schema definitions.

## Table of Contents

- [Overview](#overview)
- [Schema Structure](#schema-structure)
- [Field Definition](#field-definition)
- [Field Types](#field-types)
- [Validation Rules](#validation-rules)
- [Conditions](#conditions)
- [Layout Configuration](#layout-configuration)
- [Complete Examples](#complete-examples)

## Overview

AutoForm uses a JSON-serializable schema to define forms. This allows you to:

- Store form definitions in a database
- Generate forms dynamically from API responses
- Share schemas between frontend and backend

## Schema Structure

The root schema contains an array of fields and optional layout configuration:

```typescript
interface AutoFormSchema {
  fields: FieldDefinition[];
  layout?: LayoutConfig;
}
```

### Basic Example

```typescript
const schema: AutoFormSchema = {
  fields: [
    {
      name: "email",
      type: "text",
      label: "Email Address",
      validation: { required: true, email: true },
    },
    {
      name: "message",
      type: "textarea",
      label: "Message",
    },
  ],
};
```

## Field Definition

Every field requires at minimum a `name` and `type`:

```typescript
interface FieldDefinition {
  // Required
  name: string;              // Unique identifier, supports dot notation
  type: FieldType;           // Component type to render

  // Display
  label?: string;            // Display label
  placeholder?: string;      // Placeholder text
  description?: string;      // Help text below field
  className?: string;        // CSS class name

  // Value
  defaultValue?: unknown;    // Initial value

  // State
  disabled?: boolean;        // Disable the field
  readOnly?: boolean;        // Make field read-only

  // Validation
  validation?: ValidationRules;

  // Async Data
  dataSourceKey?: string;    // Key in dataSources config
  dependsOn?: string[];      // Fields this depends on

  // Conditional Rendering
  condition?: ConditionConfig;

  // Static Options (select/radio)
  options?: FieldOption[];

  // Custom Props
  fieldProps?: Record<string, unknown>;

  // Nested Fields (object type)
  fields?: FieldDefinition[];

  // Array Fields
  itemType?: FieldType | 'object';
  itemFields?: FieldDefinition[];
  itemDefinition?: Omit<FieldDefinition, 'name'>;
  minItems?: number;
  maxItems?: number;
}
```

## Field Types

### Text Input Fields

```typescript
// Basic text
{ name: "username", type: "text", label: "Username" }

// Email with validation
{ name: "email", type: "email", label: "Email", validation: { email: true } }

// Password
{ name: "password", type: "password", label: "Password" }

// Multi-line text
{ name: "bio", type: "textarea", label: "Biography", fieldProps: { rows: 4 } }
```

### Number Field

```typescript
{
  name: "age",
  type: "number",
  label: "Age",
  validation: {
    min: { value: 0, message: "Age must be positive" },
    max: { value: 120, message: "Invalid age" },
  },
  fieldProps: {
    step: 1,
    min: 0,
  },
}
```

### Select Field

With static options:

```typescript
{
  name: "priority",
  type: "select",
  label: "Priority",
  placeholder: "Select priority...",
  options: [
    { label: "Low", value: "low" },
    { label: "Medium", value: "medium" },
    { label: "High", value: "high" },
  ],
}
```

With async options:

```typescript
{
  name: "category",
  type: "select",
  label: "Category",
  dataSourceKey: "categories",
}
```

### Multi-Select Field

```typescript
{
  name: "tags",
  type: "multiselect",
  label: "Tags",
  options: [
    { label: "JavaScript", value: "js" },
    { label: "TypeScript", value: "ts" },
    { label: "React", value: "react" },
  ],
}
```

### Autocomplete Field

```typescript
{
  name: "city",
  type: "autocomplete",
  label: "City",
  placeholder: "Search for a city...",
  dataSourceKey: "cities",
  dependsOn: ["country"],
  description: "Start typing to search",
}
```

### Checkbox Field

```typescript
{
  name: "newsletter",
  type: "checkbox",
  label: "Subscribe to newsletter",
  description: "Receive updates about new features",
  defaultValue: false,
}
```

### Radio Field

```typescript
{
  name: "gender",
  type: "radio",
  label: "Gender",
  options: [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Other", value: "other" },
    { label: "Prefer not to say", value: "none" },
  ],
}
```

### Switch Field

```typescript
{
  name: "darkMode",
  type: "switch",
  label: "Dark Mode",
  description: "Enable dark theme",
  defaultValue: false,
}
```

### Date Fields

```typescript
// Date only
{
  name: "birthDate",
  type: "date",
  label: "Birth Date",
}

// Date and time
{
  name: "appointmentTime",
  type: "datetime",
  label: "Appointment",
}

// Time only
{
  name: "startTime",
  type: "time",
  label: "Start Time",
}
```

### File Field

```typescript
{
  name: "avatar",
  type: "file",
  label: "Profile Picture",
  fieldProps: {
    accept: "image/*",
    multiple: false,
  },
}
```

### Hidden Field

```typescript
{
  name: "formId",
  type: "hidden",
  defaultValue: "contact-form-v2",
}
```

### Object Field (Nested)

```typescript
{
  name: "address",
  type: "object",
  label: "Address",
  fields: [
    { name: "street", type: "text", label: "Street" },
    { name: "city", type: "text", label: "City" },
    { name: "zipCode", type: "text", label: "ZIP Code" },
    {
      name: "country",
      type: "select",
      label: "Country",
      dataSourceKey: "countries",
    },
  ],
}
```

### Array Field

Array of primitive values:

```typescript
{
  name: "tags",
  type: "array",
  label: "Tags",
  itemType: "text",
  minItems: 1,
  maxItems: 5,
}
```

Array of objects:

```typescript
{
  name: "contacts",
  type: "array",
  label: "Emergency Contacts",
  itemType: "object",
  itemFields: [
    { name: "name", type: "text", label: "Name", validation: { required: true } },
    { name: "phone", type: "text", label: "Phone" },
    { name: "relationship", type: "select", label: "Relationship", options: [
      { label: "Spouse", value: "spouse" },
      { label: "Parent", value: "parent" },
      { label: "Sibling", value: "sibling" },
      { label: "Friend", value: "friend" },
    ]},
  ],
  minItems: 1,
  maxItems: 3,
}
```

Array with custom item definition:

```typescript
{
  name: "skills",
  type: "array",
  label: "Skills",
  itemDefinition: {
    type: "autocomplete",
    placeholder: "Search skills...",
    dataSourceKey: "skills",
  },
}
```

## Validation Rules

```typescript
interface ValidationRules {
  // Required field
  required?: boolean | string;  // true or custom error message

  // Number validations
  min?: number | { value: number; message: string };
  max?: number | { value: number; message: string };

  // String length validations
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };

  // Pattern matching
  pattern?: string | { value: string; message: string };
  regex?: { pattern: string; flags?: string; message?: string };

  // Built-in validators
  email?: boolean | string;
  url?: boolean | string;
  uuid?: boolean | string;

  // Custom validation
  custom?: string;  // Key to custom validator function
}
```

### Examples

```typescript
// Required with custom message
{
  name: "email",
  type: "email",
  validation: {
    required: "Email is required",
    email: "Please enter a valid email address",
  },
}

// Number range
{
  name: "quantity",
  type: "number",
  validation: {
    required: true,
    min: { value: 1, message: "Minimum quantity is 1" },
    max: { value: 100, message: "Maximum quantity is 100" },
  },
}

// String length
{
  name: "username",
  type: "text",
  validation: {
    required: true,
    minLength: { value: 3, message: "Username must be at least 3 characters" },
    maxLength: { value: 20, message: "Username must be at most 20 characters" },
    pattern: { value: "^[a-zA-Z0-9_]+$", message: "Only letters, numbers, and underscores" },
  },
}

// URL validation
{
  name: "website",
  type: "text",
  validation: {
    url: "Please enter a valid URL",
  },
}

// Custom regex
{
  name: "phone",
  type: "text",
  validation: {
    regex: {
      pattern: "^\\+?[1-9]\\d{1,14}$",
      message: "Please enter a valid phone number",
    },
  },
}
```

## Conditions

Show/hide fields based on other field values:

```typescript
interface ConditionConfig {
  when: string;      // Field name to watch
  operator: ConditionOperator;
  value?: unknown;   // Value to compare against
}

type ConditionOperator =
  | 'eq'       // Equal
  | 'neq'      // Not equal
  | 'gt'       // Greater than
  | 'gte'      // Greater than or equal
  | 'lt'       // Less than
  | 'lte'      // Less than or equal
  | 'in'       // Value is in array
  | 'notIn'    // Value is not in array
  | 'exists'   // Value exists (not null/undefined/empty)
  | 'notExists';  // Value does not exist
```

### Examples

```typescript
// Show field when another field equals a value
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

// Show field when checkbox is checked
{
  name: "companyName",
  type: "text",
  label: "Company Name",
  condition: {
    when: "isCompany",
    operator: "eq",
    value: true,
  },
}

// Show field when number is greater than threshold
{
  name: "bulkDiscount",
  type: "number",
  label: "Bulk Discount (%)",
  condition: {
    when: "quantity",
    operator: "gt",
    value: 10,
  },
}

// Show field when value is in array
{
  name: "technicalDetails",
  type: "textarea",
  label: "Technical Details",
  condition: {
    when: "subject",
    operator: "in",
    value: ["support", "bug-report"],
  },
}

// Show field when another field has a value
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

## Layout Configuration

```typescript
interface LayoutConfig {
  type: 'vertical' | 'horizontal' | 'grid';
  columns?: number;  // For grid layout
  gap?: string;      // CSS gap value
}
```

### Example

```typescript
const schema: AutoFormSchema = {
  fields: [/* ... */],
  layout: {
    type: "grid",
    columns: 2,
    gap: "1rem",
  },
};
```

## Complete Examples

### Contact Form

```typescript
const contactFormSchema: AutoFormSchema = {
  fields: [
    {
      name: "name",
      type: "text",
      label: "Full Name",
      placeholder: "John Doe",
      validation: {
        required: "Name is required",
        minLength: { value: 2, message: "Name must be at least 2 characters" },
      },
    },
    {
      name: "email",
      type: "email",
      label: "Email Address",
      placeholder: "john@example.com",
      validation: {
        required: "Email is required",
        email: "Please enter a valid email",
      },
    },
    {
      name: "phone",
      type: "text",
      label: "Phone Number",
      placeholder: "+1 (555) 000-0000",
      description: "Optional - for urgent inquiries",
    },
    {
      name: "subject",
      type: "select",
      label: "Subject",
      placeholder: "Select a subject",
      options: [
        { label: "General Inquiry", value: "general" },
        { label: "Technical Support", value: "support" },
        { label: "Sales", value: "sales" },
        { label: "Other", value: "other" },
      ],
      validation: { required: "Please select a subject" },
    },
    {
      name: "priority",
      type: "select",
      label: "Priority",
      options: [
        { label: "Low", value: "low" },
        { label: "Medium", value: "medium" },
        { label: "High", value: "high" },
      ],
      defaultValue: "medium",
      condition: {
        when: "subject",
        operator: "eq",
        value: "support",
      },
    },
    {
      name: "message",
      type: "textarea",
      label: "Message",
      placeholder: "How can we help you?",
      fieldProps: { rows: 5 },
      validation: {
        required: "Message is required",
        minLength: { value: 20, message: "Please provide more details" },
      },
    },
    {
      name: "newsletter",
      type: "checkbox",
      label: "Subscribe to our newsletter",
      description: "Get updates about new features",
      defaultValue: false,
    },
  ],
};
```

### Job Application Form

```typescript
const jobApplicationSchema: AutoFormSchema = {
  fields: [
    // Personal Information
    {
      name: "personalInfo",
      type: "object",
      label: "Personal Information",
      fields: [
        {
          name: "firstName",
          type: "text",
          label: "First Name",
          validation: { required: true },
        },
        {
          name: "lastName",
          type: "text",
          label: "Last Name",
          validation: { required: true },
        },
        {
          name: "email",
          type: "email",
          label: "Email",
          validation: { required: true, email: true },
        },
        {
          name: "phone",
          type: "text",
          label: "Phone",
        },
      ],
    },
    // Position
    {
      name: "position",
      type: "select",
      label: "Position Applied For",
      dataSourceKey: "positions",
      validation: { required: true },
    },
    // Experience
    {
      name: "experience",
      type: "array",
      label: "Work Experience",
      itemType: "object",
      itemFields: [
        { name: "company", type: "text", label: "Company", validation: { required: true } },
        { name: "title", type: "text", label: "Job Title", validation: { required: true } },
        { name: "startDate", type: "date", label: "Start Date" },
        { name: "endDate", type: "date", label: "End Date" },
        { name: "current", type: "checkbox", label: "Currently working here" },
        { name: "description", type: "textarea", label: "Description" },
      ],
      minItems: 0,
      maxItems: 5,
    },
    // Skills
    {
      name: "skills",
      type: "array",
      label: "Skills",
      itemDefinition: {
        type: "autocomplete",
        placeholder: "Search skills...",
        dataSourceKey: "skills",
      },
      minItems: 1,
      maxItems: 10,
    },
    // Availability
    {
      name: "startDate",
      type: "date",
      label: "Earliest Start Date",
      validation: { required: true },
    },
    {
      name: "salaryExpectation",
      type: "number",
      label: "Salary Expectation (USD)",
      fieldProps: { step: 1000 },
    },
    // Resume
    {
      name: "resume",
      type: "file",
      label: "Resume",
      fieldProps: {
        accept: ".pdf,.doc,.docx",
      },
      validation: { required: true },
    },
    // Cover Letter
    {
      name: "coverLetter",
      type: "textarea",
      label: "Cover Letter",
      placeholder: "Tell us why you're interested in this position...",
      fieldProps: { rows: 6 },
    },
  ],
};
```

## Next Steps

- [Data Sources](./data-sources.md) - Async data configuration
- [Field Components](./field-components.md) - Building custom components
- [Validation](./validation.md) - Detailed validation guide
- [Conditional Fields](./conditional-fields.md) - Advanced conditions



