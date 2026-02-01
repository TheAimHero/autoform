# Data Sources & Async Fields

AutoForm provides powerful support for asynchronous data fetching, perfect for fields like autocomplete, select dropdowns, and any field that needs to load options from an API.

## Table of Contents

- [Overview](#overview)
- [Basic Configuration](#basic-configuration)
- [Autocomplete with Search](#autocomplete-with-search)
- [Field Dependencies](#field-dependencies)
- [Caching](#caching)
- [Error Handling](#error-handling)
- [API Reference](#api-reference)

## Overview

Data sources are configured separately from your form schema and connected via the `dataSourceKey` property. This separation allows you to:

- Reuse data sources across multiple forms
- Keep your schema declarative and serializable
- Easily mock data sources for testing

## Basic Configuration

### 1. Define a Data Source

```typescript
import type { DataSourcesConfig } from "@autoform/core";

const dataSources: DataSourcesConfig = {
  countries: {
    // Fetch function - called to load the data
    fetch: async ({ signal }) => {
      const response = await fetch("/api/countries", { signal });
      return response.json();
    },
    // Transform function - converts API response to options format
    transform: (data) =>
      data.map((country) => ({
        label: country.name,
        value: country.id,
      })),
  },
};
```

### 2. Reference in Schema

```typescript
const schema = {
  fields: [
    {
      name: "country",
      type: "select",
      label: "Country",
      dataSourceKey: "countries", // Links to the data source
      validation: { required: true },
    },
  ],
};
```

### 3. Pass to AutoForm

```tsx
<AutoForm
  schema={schema}
  form={form}
  registry={registry}
  dataSources={dataSources}
  onSubmit={handleSubmit}
/>
```

## Autocomplete with Search

For autocomplete fields that need to fetch data based on user input:

### Schema Definition

```typescript
const schema = {
  fields: [
    {
      name: "city",
      type: "autocomplete",
      label: "City",
      placeholder: "Start typing to search...",
      dataSourceKey: "cities",
    },
  ],
};
```

### Data Source with Search Query

```typescript
const dataSources: DataSourcesConfig = {
  cities: {
    fetch: async ({ searchQuery, signal }) => {
      // searchQuery contains the user's input
      const response = await fetch(
        `/api/cities?q=${encodeURIComponent(searchQuery || "")}`,
        { signal }
      );
      return response.json();
    },
    transform: (data) =>
      data.map((city) => ({
        label: city.name,
        value: city.id,
      })),
    // Debounce search requests (default: 300ms)
    debounceMs: 200,
  },
};
```

### How It Works

1. User types in the autocomplete field
2. The `onSearch` callback is triggered (debounced)
3. AutoForm calls your `fetch` function with `searchQuery`
4. Results are transformed and displayed
5. Previous requests are automatically cancelled

## Field Dependencies

Create cascading dropdowns where one field's options depend on another field's value:

### Schema with Dependencies

```typescript
const schema = {
  fields: [
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
      dependsOn: ["country"], // Re-fetches when country changes
    },
  ],
};
```

### Data Source with Dependencies

```typescript
const dataSources: DataSourcesConfig = {
  countries: {
    fetch: async () => {
      const response = await fetch("/api/countries");
      return response.json();
    },
    transform: (data) =>
      data.map((country) => ({
        label: country.name,
        value: country.id,
      })),
  },
  cities: {
    fetch: async ({ dependencies, searchQuery, signal }) => {
      const countryId = dependencies?.country;
      
      // Don't fetch if no country selected
      if (!countryId) return [];
      
      const params = new URLSearchParams({
        country: String(countryId),
        ...(searchQuery && { q: searchQuery }),
      });
      
      const response = await fetch(`/api/cities?${params}`, { signal });
      return response.json();
    },
    transform: (data) =>
      data.map((city) => ({
        label: city.name,
        value: city.id,
      })),
    debounceMs: 200,
  },
};
```

### Multiple Dependencies

```typescript
{
  name: "district",
  type: "select",
  label: "District",
  dataSourceKey: "districts",
  dependsOn: ["country", "state"], // Both values available in dependencies
}
```

```typescript
districts: {
  fetch: async ({ dependencies }) => {
    const { country, state } = dependencies || {};
    if (!country || !state) return [];
    
    const response = await fetch(
      `/api/districts?country=${country}&state=${state}`
    );
    return response.json();
  },
  transform: (data) => data.map((d) => ({ label: d.name, value: d.id })),
}
```

## Caching

AutoForm caches data source results to avoid unnecessary API calls:

### Configure Cache Duration

```typescript
const dataSources: DataSourcesConfig = {
  countries: {
    fetch: async () => fetch("/api/countries").then((r) => r.json()),
    transform: (data) => data.map((c) => ({ label: c.name, value: c.id })),
    // Data considered fresh for 5 minutes
    staleTime: 300000, // 5 minutes in ms (default: 30000)
  },
};
```

### Custom Cache Keys

By default, cache keys are generated from `sourceKey + dependencies + searchQuery`. You can customize this:

```typescript
const dataSources: DataSourcesConfig = {
  users: {
    fetch: async ({ dependencies, searchQuery }) => {
      // ... fetch logic
    },
    transform: (data) => data.map((u) => ({ label: u.name, value: u.id })),
    // Custom cache key generation
    cacheKey: ({ dependencies, searchQuery }) => {
      return `users:${dependencies?.role}:${searchQuery || ""}`;
    },
  },
};
```

### Clear Cache Programmatically

```typescript
import { clearDataSourceCache } from "@autoform/core";

// Clear all cached data
clearDataSourceCache();
```

## Error Handling

### Global Error Handler

```typescript
const dataSources: DataSourcesConfig = {
  cities: {
    fetch: async ({ signal }) => {
      const response = await fetch("/api/cities", { signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    transform: (data) => data.map((c) => ({ label: c.name, value: c.id })),
    // Handle errors
    onError: (error) => {
      console.error("Failed to fetch cities:", error);
      // Show toast notification, log to monitoring service, etc.
    },
  },
};
```

### Access Error State in Components

Your field components receive the error state:

```tsx
function AutocompleteField({ state, error, ...props }) {
  // state.isLoading - true while fetching
  // error - contains fetch error if any
  
  if (error) {
    return <div className="error">Failed to load options</div>;
  }
  
  return (
    <div>
      {state.isLoading && <Spinner />}
      {/* ... rest of component */}
    </div>
  );
}
```

## API Reference

### DataSourceConfig

```typescript
interface DataSourceConfig<TData = unknown, TValue = unknown> {
  /**
   * Function to fetch the data
   * @param params - Contains dependencies, searchQuery, and AbortSignal
   */
  fetch: (params: DataSourceFetchParams) => Promise<TData>;

  /**
   * Transform the fetched data into options format
   * @param data - Raw data from fetch
   * @returns Array of FieldOption objects
   */
  transform: (data: TData) => FieldOption<TValue>[];

  /**
   * Custom cache key generator
   * @default Generated from sourceKey + dependencies + searchQuery
   */
  cacheKey?: (params: DataSourceFetchParams) => string;

  /**
   * Time in milliseconds before cached data is considered stale
   * @default 30000 (30 seconds)
   */
  staleTime?: number;

  /**
   * Error handler for fetch failures
   */
  onError?: (error: Error) => void;

  /**
   * Debounce time for search queries (autocomplete)
   * @default 300
   */
  debounceMs?: number;
}
```

### DataSourceFetchParams

```typescript
interface DataSourceFetchParams {
  /**
   * Values of fields this data source depends on
   * Key is the field name, value is the current field value
   */
  dependencies?: Record<string, unknown>;

  /**
   * Search query for autocomplete fields
   */
  searchQuery?: string;

  /**
   * AbortSignal for cancelling the request
   * Always use this to support request cancellation
   */
  signal?: AbortSignal;
}
```

### FieldOption

```typescript
interface FieldOption<TValue = unknown> {
  label: string;
  value: TValue;
  disabled?: boolean;
}
```

## Complete Example

Here's a full example with countries and cities:

```typescript
import type { AutoFormSchema, DataSourcesConfig } from "@autoform/core";

// Schema
export const locationSchema: AutoFormSchema = {
  fields: [
    {
      name: "country",
      type: "select",
      label: "Country",
      placeholder: "Select a country",
      dataSourceKey: "countries",
      validation: { required: "Please select a country" },
    },
    {
      name: "city",
      type: "autocomplete",
      label: "City",
      placeholder: "Search for a city...",
      dataSourceKey: "cities",
      dependsOn: ["country"],
      description: "Start typing to search",
    },
  ],
};

// Data Sources
export const locationDataSources: DataSourcesConfig = {
  countries: {
    fetch: async ({ signal }) => {
      const response = await fetch("https://api.example.com/countries", {
        signal,
      });
      if (!response.ok) throw new Error("Failed to fetch countries");
      return response.json();
    },
    transform: (data: Array<{ id: string; name: string }>) =>
      data.map((country) => ({
        label: country.name,
        value: country.id,
      })),
    staleTime: 300000, // 5 minutes - countries rarely change
    onError: (error) => {
      console.error("Countries fetch failed:", error);
    },
  },
  cities: {
    fetch: async ({ dependencies, searchQuery, signal }) => {
      const countryId = dependencies?.country as string;
      
      // Return empty if no country selected
      if (!countryId) return [];
      
      const params = new URLSearchParams({ country: countryId });
      if (searchQuery) {
        params.append("q", searchQuery);
      }
      
      const response = await fetch(
        `https://api.example.com/cities?${params}`,
        { signal }
      );
      if (!response.ok) throw new Error("Failed to fetch cities");
      return response.json();
    },
    transform: (data: Array<{ id: string; name: string; population: number }>) =>
      data.map((city) => ({
        label: `${city.name} (pop. ${city.population.toLocaleString()})`,
        value: city.id,
      })),
    debounceMs: 200,
    staleTime: 60000, // 1 minute
    onError: (error) => {
      console.error("Cities fetch failed:", error);
    },
  },
};
```

## Next Steps

- [React Query Integration](./react-query-integration.md) - For advanced caching and state management
- [Field Components Contract](./field-components.md) - Build your autocomplete component
- [Schema Reference](./schema-reference.md) - All field definition options




