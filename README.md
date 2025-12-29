# AutoForm

A headless React library that parses custom JSON schemas to render forms, with first-class support for react-hook-form, Zod validation, and async data sources.

## Features

- 🎯 **React Hook Form Integration** - Uses your existing `useForm` instance
- 🔒 **Zod Validation** - Automatic schema generation from your form schema
- 🔄 **Async Data Sources** - First-class support for API-dependent fields with debouncing, caching, and dependencies
- 🧩 **Pluggable Components** - Bring your own components that follow the contract
- 📦 **Headless** - No styling included, full control over appearance
- 🏗️ **Full Complexity Support** - Nested objects, arrays, conditional fields
- ⚡ **React Query Compatible** - Easily integrate with TanStack Query

## Installation

```bash
pnpm add @autoform/core react-hook-form zod @hookform/resolvers
```

## Quick Start

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AutoForm,
  createFieldRegistry,
  generateZodSchema,
} from "@autoform/core";

// Define your schema
const schema = {
  fields: [
    {
      name: "email",
      type: "text",
      label: "Email",
      validation: { required: true, email: true },
    },
    {
      name: "country",
      type: "select",
      label: "Country",
      dataSourceKey: "countries",
    },
  ],
};

// Create field registry with your components
const registry = createFieldRegistry({
  fields: {
    text: MyTextInput,
    select: MySelect,
  },
});

// Define data sources
const dataSources = {
  countries: {
    fetch: async () => fetch("/api/countries").then((r) => r.json()),
    transform: (data) => data.map((c) => ({ label: c.name, value: c.id })),
  },
};

// Generate Zod schema
const zodSchema = generateZodSchema(schema);

function MyForm() {
  const form = useForm({
    resolver: zodResolver(zodSchema),
  });

  return (
    <AutoForm
      schema={schema}
      form={form}
      registry={registry}
      dataSources={dataSources}
      onSubmit={(data) => console.log(data)}
    />
  );
}
```

## Documentation

- [Schema Reference](./docs/schema-reference.md) - Complete field definition API
- [Data Sources & Async Fields](./docs/data-sources.md) - Async data fetching with debounce, caching, and dependencies
- [React Query Integration](./docs/react-query-integration.md) - Using TanStack Query with AutoForm
- [Field Components Contract](./docs/field-components.md) - Building custom field components
- [Validation](./docs/validation.md) - Validation rules and Zod schema generation
- [Conditional Fields](./docs/conditional-fields.md) - Show/hide fields based on form values
- [Arrays & Objects](./docs/arrays-objects.md) - Nested structures and repeatable fields

## Supported Field Types

| Type           | Description                            |
| -------------- | -------------------------------------- |
| `text`         | Single-line text input                 |
| `email`        | Email input with validation            |
| `password`     | Password input                         |
| `number`       | Numeric input                          |
| `textarea`     | Multi-line text input                  |
| `select`       | Dropdown selection                     |
| `multiselect`  | Multiple selection                     |
| `autocomplete` | Searchable dropdown with async support |
| `checkbox`     | Boolean checkbox                       |
| `radio`        | Radio button group                     |
| `switch`       | Toggle switch                          |
| `date`         | Date picker                            |
| `datetime`     | Date and time picker                   |
| `time`         | Time picker                            |
| `file`         | File upload                            |
| `object`       | Nested object with sub-fields          |
| `array`        | Repeatable field group                 |
| `hidden`       | Hidden field                           |

## Development

```bash
# Install dependencies
pnpm install

# Start playground
pnpm dev

# Build library
pnpm build
```

## License

MIT
