# React Query Integration

AutoForm's data source system can be seamlessly integrated with [TanStack Query](https://tanstack.com/query) (React Query) for advanced caching, background refetching, and better developer experience.

## Table of Contents

- [Why Use React Query?](#why-use-react-query)
- [Integration Options](#integration-options)
- [Option 1: Custom Hook Replacement](#option-1-custom-hook-replacement)
- [Option 2: Use React Query in Fetch Functions](#option-2-use-react-query-in-fetch-functions)
- [Option 3: Create a Data Source Adapter](#option-3-create-a-data-source-adapter)
- [Complete Example](#complete-example)
- [Best Practices](#best-practices)

## Why Use React Query?

| Feature | Built-in Data Sources | With React Query |
|---------|----------------------|------------------|
| Caching | ✅ Basic (in-memory) | ✅ Advanced (persistence, GC) |
| Stale Time | ✅ | ✅ |
| Debouncing | ✅ Built-in | ⚡ Manual (more control) |
| Request Cancellation | ✅ | ✅ |
| Window Focus Refetch | ❌ | ✅ |
| Network Status Refetch | ❌ | ✅ |
| Retry Logic | ❌ | ✅ |
| Optimistic Updates | ❌ | ✅ |
| DevTools | ❌ | ✅ |
| SSR/Hydration | ❌ | ✅ |
| Parallel Queries | Manual | ✅ Built-in |

## Integration Options

There are several ways to integrate React Query with AutoForm, depending on your needs:

1. **Custom Hook Replacement** - Replace `useDataSource` with a React Query-powered version
2. **Fetch Function Integration** - Use React Query's `queryClient` inside fetch functions
3. **Data Source Adapter** - Create a helper to convert React Query queries to data sources

## Option 1: Custom Hook Replacement

Create a `useDataSourceWithQuery` hook that uses React Query under the hood:

### Installation

```bash
pnpm add @tanstack/react-query
```

### Create the Hook

```typescript
// src/hooks/useDataSourceWithQuery.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWatch } from "react-hook-form";
import { useCallback, useRef, useState, useEffect } from "react";
import type { Control } from "react-hook-form";
import type { DataSourceConfig, FieldOption } from "@autoform/core";

interface UseDataSourceWithQueryOptions {
  config: DataSourceConfig;
  sourceKey: string;
  dependsOn?: string[];
  control?: Control<any>;
  enabled?: boolean;
}

export function useDataSourceWithQuery<TValue = unknown>(
  options: UseDataSourceWithQueryOptions
) {
  const {
    config,
    sourceKey,
    dependsOn = [],
    control,
    enabled = true,
  } = options;

  const [searchQuery, setSearchQuery] = useState("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Watch dependencies
  const dependencyValues = useWatch({
    control,
    name: dependsOn,
    disabled: !control || dependsOn.length === 0,
  });

  // Build dependencies object
  const dependencies = dependsOn.reduce(
    (acc, name, index) => {
      acc[name] = Array.isArray(dependencyValues)
        ? dependencyValues[index]
        : dependencyValues;
      return acc;
    },
    {} as Record<string, unknown>
  );

  // Use React Query
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [sourceKey, dependencies, searchQuery],
    queryFn: async ({ signal }) => {
      const result = await config.fetch({
        dependencies: dependsOn.length > 0 ? dependencies : undefined,
        searchQuery: searchQuery || undefined,
        signal,
      });
      return config.transform(result) as FieldOption<TValue>[];
    },
    enabled,
    staleTime: config.staleTime ?? 30000,
    gcTime: config.staleTime ? config.staleTime * 2 : 60000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Debounced search handler
  const onSearch = useCallback(
    (query: string) => {
      const debounceMs = config.debounceMs ?? 300;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        setSearchQuery(query);
      }, debounceMs);
    },
    [config.debounceMs]
  );

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    options: data ?? [],
    isLoading,
    error: error as Error | null,
    refetch: () => refetch(),
    onSearch,
  };
}
```

### Usage with Custom Field Renderer

To use this hook, you'll need to create a custom field renderer or modify your field components to use it:

```tsx
// In your autocomplete component
import { useDataSourceWithQuery } from "./hooks/useDataSourceWithQuery";

function MyAutocomplete({ dataSourceKey, dataSources, control, ...props }) {
  const { options, isLoading, onSearch } = useDataSourceWithQuery({
    config: dataSources[dataSourceKey],
    sourceKey: dataSourceKey,
    dependsOn: props.dependsOn,
    control,
    enabled: true,
  });

  return (
    <Combobox
      options={options}
      isLoading={isLoading}
      onSearch={onSearch}
      {...props}
    />
  );
}
```

## Option 2: Use React Query in Fetch Functions

The simplest integration - use `queryClient.fetchQuery` inside your data source's fetch function:

### Setup QueryClient

```typescript
// src/lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      gcTime: 300000,
      retry: 2,
    },
  },
});
```

### Data Source Configuration

```typescript
import { queryClient } from "./lib/queryClient";
import type { DataSourcesConfig } from "@autoform/core";

const dataSources: DataSourcesConfig = {
  countries: {
    fetch: async ({ signal }) => {
      // Use React Query's fetchQuery for caching
      return queryClient.fetchQuery({
        queryKey: ["countries"],
        queryFn: async () => {
          const response = await fetch("/api/countries", { signal });
          if (!response.ok) throw new Error("Failed to fetch");
          return response.json();
        },
        staleTime: 300000, // 5 minutes
      });
    },
    transform: (data) =>
      data.map((c: any) => ({ label: c.name, value: c.id })),
    // Disable built-in caching (React Query handles it)
    staleTime: 0,
  },

  cities: {
    fetch: async ({ dependencies, searchQuery, signal }) => {
      const countryId = dependencies?.country;
      if (!countryId) return [];

      return queryClient.fetchQuery({
        queryKey: ["cities", countryId, searchQuery],
        queryFn: async () => {
          const params = new URLSearchParams({
            country: String(countryId),
            ...(searchQuery && { q: searchQuery }),
          });
          const response = await fetch(`/api/cities?${params}`, { signal });
          if (!response.ok) throw new Error("Failed to fetch");
          return response.json();
        },
        staleTime: 60000, // 1 minute
      });
    },
    transform: (data) =>
      data.map((c: any) => ({ label: c.name, value: c.id })),
    staleTime: 0,
    debounceMs: 200,
  },
};
```

### Wrap App with QueryClientProvider

```tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./lib/queryClient";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourFormComponent />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

## Option 3: Create a Data Source Adapter

Create a helper function that converts React Query configuration to AutoForm data sources:

```typescript
// src/lib/createQueryDataSource.ts
import { queryClient } from "./queryClient";
import type { DataSourceConfig, FieldOption } from "@autoform/core";
import type { QueryKey } from "@tanstack/react-query";

interface QueryDataSourceOptions<TData, TValue> {
  /**
   * Function to generate the query key
   */
  queryKey: (params: {
    dependencies?: Record<string, unknown>;
    searchQuery?: string;
  }) => QueryKey;

  /**
   * The query function to fetch data
   */
  queryFn: (params: {
    dependencies?: Record<string, unknown>;
    searchQuery?: string;
    signal?: AbortSignal;
  }) => Promise<TData>;

  /**
   * Transform raw data to field options
   */
  transform: (data: TData) => FieldOption<TValue>[];

  /**
   * React Query options
   */
  staleTime?: number;
  gcTime?: number;
  retry?: number | boolean;

  /**
   * AutoForm debounce (for search)
   */
  debounceMs?: number;
}

export function createQueryDataSource<TData, TValue>(
  options: QueryDataSourceOptions<TData, TValue>
): DataSourceConfig<TData, TValue> {
  return {
    fetch: async ({ dependencies, searchQuery, signal }) => {
      return queryClient.fetchQuery({
        queryKey: options.queryKey({ dependencies, searchQuery }),
        queryFn: () =>
          options.queryFn({ dependencies, searchQuery, signal }),
        staleTime: options.staleTime ?? 30000,
        gcTime: options.gcTime ?? 300000,
        retry: options.retry ?? 2,
      });
    },
    transform: options.transform,
    staleTime: 0, // Disable built-in caching
    debounceMs: options.debounceMs ?? 300,
  };
}
```

### Usage

```typescript
import { createQueryDataSource } from "./lib/createQueryDataSource";

const dataSources = {
  countries: createQueryDataSource({
    queryKey: () => ["countries"],
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/countries", { signal });
      return res.json();
    },
    transform: (data) => data.map((c) => ({ label: c.name, value: c.id })),
    staleTime: 300000,
  }),

  cities: createQueryDataSource({
    queryKey: ({ dependencies, searchQuery }) => [
      "cities",
      dependencies?.country,
      searchQuery,
    ],
    queryFn: async ({ dependencies, searchQuery, signal }) => {
      if (!dependencies?.country) return [];
      const params = new URLSearchParams({
        country: String(dependencies.country),
        ...(searchQuery && { q: searchQuery }),
      });
      const res = await fetch(`/api/cities?${params}`, { signal });
      return res.json();
    },
    transform: (data) => data.map((c) => ({ label: c.name, value: c.id })),
    staleTime: 60000,
    debounceMs: 200,
  }),
};
```

## Complete Example

Here's a full working example with React Query integration:

```tsx
// src/App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AutoForm,
  createFieldRegistry,
  generateZodSchema,
} from "@autoform/core";
import type { DataSourcesConfig } from "@autoform/core";

// Components
import { TextField, SelectField, AutocompleteField } from "./components/fields";

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      gcTime: 300000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Schema
const schema = {
  fields: [
    {
      name: "name",
      type: "text",
      label: "Full Name",
      validation: { required: true },
    },
    {
      name: "country",
      type: "select",
      label: "Country",
      dataSourceKey: "countries",
      validation: { required: true },
    },
    {
      name: "city",
      type: "autocomplete",
      label: "City",
      placeholder: "Search cities...",
      dataSourceKey: "cities",
      dependsOn: ["country"],
    },
  ],
};

// Data sources using React Query
const dataSources: DataSourcesConfig = {
  countries: {
    fetch: async ({ signal }) => {
      return queryClient.fetchQuery({
        queryKey: ["countries"],
        queryFn: async () => {
          // Simulate API call
          await new Promise((r) => setTimeout(r, 500));
          return [
            { id: "us", name: "United States" },
            { id: "uk", name: "United Kingdom" },
            { id: "ca", name: "Canada" },
          ];
        },
        staleTime: 300000,
      });
    },
    transform: (data) => data.map((c) => ({ label: c.name, value: c.id })),
    staleTime: 0,
  },
  cities: {
    fetch: async ({ dependencies, searchQuery, signal }) => {
      const countryId = dependencies?.country;
      if (!countryId) return [];

      return queryClient.fetchQuery({
        queryKey: ["cities", countryId, searchQuery],
        queryFn: async () => {
          await new Promise((r) => setTimeout(r, 300));
          
          const citiesByCountry: Record<string, Array<{ id: string; name: string }>> = {
            us: [
              { id: "nyc", name: "New York" },
              { id: "la", name: "Los Angeles" },
              { id: "chi", name: "Chicago" },
            ],
            uk: [
              { id: "lon", name: "London" },
              { id: "man", name: "Manchester" },
            ],
            ca: [
              { id: "tor", name: "Toronto" },
              { id: "van", name: "Vancouver" },
            ],
          };

          let cities = citiesByCountry[countryId as string] || [];
          
          if (searchQuery) {
            cities = cities.filter((c) =>
              c.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
          }
          
          return cities;
        },
        staleTime: 60000,
      });
    },
    transform: (data) => data.map((c) => ({ label: c.name, value: c.id })),
    staleTime: 0,
    debounceMs: 200,
  },
};

// Registry
const registry = createFieldRegistry({
  fields: {
    text: TextField,
    select: SelectField,
    autocomplete: AutocompleteField,
  },
});

// Form component
function LocationForm() {
  const zodSchema = generateZodSchema(schema);
  
  const form = useForm({
    resolver: zodResolver(zodSchema),
  });

  const handleSubmit = (data: any) => {
    console.log("Form submitted:", data);
  };

  return (
    <AutoForm
      schema={schema}
      form={form}
      registry={registry}
      dataSources={dataSources}
      onSubmit={handleSubmit}
    />
  );
}

// App with providers
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Location Form</h1>
        <LocationForm />
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

## Best Practices

### 1. Consistent Query Keys

Use a consistent query key structure across your app:

```typescript
// Good - hierarchical and predictable
queryKey: ["locations", "countries"]
queryKey: ["locations", "cities", countryId, searchQuery]

// Avoid - inconsistent structure
queryKey: ["getCountries"]
queryKey: [countryId, "cities", searchQuery]
```

### 2. Handle Loading States

Always show loading indicators for async fields:

```tsx
function AutocompleteField({ state, options, ...props }) {
  return (
    <div>
      <Combobox options={options} {...props} />
      {state.isLoading && <Spinner className="absolute right-2" />}
    </div>
  );
}
```

### 3. Prefetch on Hover

Improve UX by prefetching data before the user interacts:

```typescript
const prefetchCities = (countryId: string) => {
  queryClient.prefetchQuery({
    queryKey: ["cities", countryId, ""],
    queryFn: () => fetchCities(countryId),
    staleTime: 60000,
  });
};

// In your country select component
<Select
  onFocus={() => {
    // Prefetch when user focuses on the next field
  }}
/>
```

### 4. Error Boundaries

Wrap your forms with error boundaries for graceful error handling:

```tsx
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

function FormWithErrorBoundary() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ resetErrorBoundary }) => (
            <div>
              <p>Something went wrong loading form data.</p>
              <button onClick={resetErrorBoundary}>Try again</button>
            </div>
          )}
        >
          <LocationForm />
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
```

### 5. DevTools for Debugging

Always include React Query DevTools in development:

```tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Only in development
{process.env.NODE_ENV === 'development' && (
  <ReactQueryDevtools initialIsOpen={false} />
)}
```

## Next Steps

- [Data Sources](./data-sources.md) - Built-in data source configuration
- [Field Components Contract](./field-components.md) - Building custom field components
- [Schema Reference](./schema-reference.md) - Complete field definition API


