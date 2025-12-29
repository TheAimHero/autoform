import { useState, useEffect, useRef, useCallback } from 'react';
import { useWatch } from 'react-hook-form';
import type { Control } from 'react-hook-form';
import type {
  DataSourceConfig,
  UseDataSourceResult,
  FieldOption,
  DataSourceFetchParams,
} from '../types';

/**
 * Cache entry
 */
interface CacheEntry {
  data: FieldOption[];
  timestamp: number;
}

/**
 * Global cache
 */
const cache = new Map<string, CacheEntry>();

/**
 * Default stale time
 */
const DEFAULT_STALE_TIME = 30000;

/**
 * Default debounce time
 */
const DEFAULT_DEBOUNCE_MS = 300;

/**
 * Options for useDataSource hook
 */
export interface UseDataSourceOptions {
  /**
   * Data source configuration
   */
  config: DataSourceConfig;

  /**
   * Unique key for this data source
   */
  sourceKey: string;

  /**
   * Field names this data source depends on
   */
  dependsOn?: string[];

  /**
   * React Hook Form control (for watching dependencies)
   */
  control?: Control<any>;

  /**
   * Whether to fetch on mount
   * @default true
   */
  fetchOnMount?: boolean;

  /**
   * Whether the data source is enabled
   * @default true
   */
  enabled?: boolean;
}

/**
 * Generate cache key
 */
function generateCacheKey(sourceKey: string, params: DataSourceFetchParams): string {
  const deps = params.dependencies ? JSON.stringify(params.dependencies) : '';
  const query = params.searchQuery || '';
  return `${sourceKey}:${deps}:${query}`;
}

/**
 * Hook for managing async data sources
 */
export function useDataSource<TValue = unknown>(
  options: UseDataSourceOptions
): UseDataSourceResult<TValue> {
  const {
    config,
    sourceKey,
    dependsOn = [],
    control,
    fetchOnMount = true,
    enabled = true,
  } = options;

  const [state, setState] = useState<{
    options: FieldOption<TValue>[];
    isLoading: boolean;
    error: Error | null;
  }>({
    options: [],
    isLoading: false,
    error: null,
  });

  // Watch dependent fields
  const dependencyValues = useWatch({
    control,
    name: dependsOn,
    disabled: !control || dependsOn.length === 0,
  });

  // Create dependencies object
  const dependencies = dependsOn.reduce(
    (acc, name, index) => {
      acc[name] = Array.isArray(dependencyValues) ? dependencyValues[index] : dependencyValues;
      return acc;
    },
    {} as Record<string, unknown>
  );

  // Abort controller ref
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce timer ref
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search query ref
  const searchQueryRef = useRef<string>('');

  // Fetch data function
  const fetchData = useCallback(
    async (searchQuery?: string) => {
      if (!enabled) return;

      const staleTime = config.staleTime ?? DEFAULT_STALE_TIME;
      const params: DataSourceFetchParams = {
        dependencies: dependsOn.length > 0 ? dependencies : undefined,
        searchQuery,
      };

      // Check custom cache key
      const cacheKeyFn = config.cacheKey || ((p) => generateCacheKey(sourceKey, p));
      const cacheKey = cacheKeyFn(params);

      // Check cache
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < staleTime) {
        setState({
          options: cached.data as FieldOption<TValue>[],
          isLoading: false,
          error: null,
        });
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await config.fetch({
          ...params,
          signal: abortControllerRef.current.signal,
        });

        const options = config.transform(data) as FieldOption<TValue>[];

        // Update cache
        cache.set(cacheKey, {
          data: options,
          timestamp: Date.now(),
        });

        setState({
          options,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        const errorObj = error instanceof Error ? error : new Error(String(error));

        if (config.onError) {
          config.onError(errorObj);
        }

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorObj,
        }));
      }
    },
    [config, sourceKey, dependencies, dependsOn, enabled]
  );

  // Debounced search handler
  const onSearch = useCallback(
    (query: string) => {
      searchQueryRef.current = query;

      const debounceMs = config.debounceMs ?? DEFAULT_DEBOUNCE_MS;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        fetchData(query);
      }, debounceMs);
    },
    [fetchData, config.debounceMs]
  );

  // Refetch function
  const refetch = useCallback(() => {
    fetchData(searchQueryRef.current);
  }, [fetchData]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    if (fetchOnMount && enabled) {
      fetchData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [fetchData, fetchOnMount, enabled, JSON.stringify(dependencies)]);

  return {
    options: state.options,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
    onSearch,
  };
}

/**
 * Clear all data source cache
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Clear cache for a specific source
 */
export function clearSourceCache(sourceKey: string): void {
  for (const [key] of cache) {
    if (key.startsWith(`${sourceKey}:`)) {
      cache.delete(key);
    }
  }
}
