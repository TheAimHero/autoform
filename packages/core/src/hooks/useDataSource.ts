import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
 * Track in-flight requests to prevent duplicate fetches
 */
const inFlightRequests = new Map<string, Promise<FieldOption[]>>();

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

  // Store config in a ref to avoid recreating fetchData on config changes
  const configRef = useRef(config);
  configRef.current = config;

  // Watch dependent fields
  const dependencyValues = useWatch({
    control,
    name: dependsOn,
    disabled: !control || dependsOn.length === 0,
  });

  // Memoize dependencies object to prevent unnecessary re-renders
  const dependenciesKey = useMemo(() => {
    if (dependsOn.length === 0) return '';
    const deps: Record<string, unknown> = {};
    dependsOn.forEach((name, index) => {
      deps[name] = Array.isArray(dependencyValues) ? dependencyValues[index] : dependencyValues;
    });
    return JSON.stringify(deps);
  }, [dependsOn, dependencyValues]);

  // Abort controller ref
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce timer ref
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search query ref
  const searchQueryRef = useRef<string>('');

  // Track if component is mounted
  const isMountedRef = useRef(true);

  // Track the last fetch key to prevent duplicate concurrent fetches
  const lastFetchKeyRef = useRef<string | null>(null);

  // Track if initial fetch is in progress
  const isFetchingRef = useRef(false);

  // Fetch data function - uses refs for stability
  const fetchData = useCallback(
    async (searchQuery?: string) => {
      if (!enabled) return;

      const currentConfig = configRef.current;
      const staleTime = currentConfig.staleTime ?? DEFAULT_STALE_TIME;
      const dependencies = dependenciesKey ? JSON.parse(dependenciesKey) : undefined;

      const params: DataSourceFetchParams = {
        dependencies,
        searchQuery,
      };

      // Check custom cache key
      const cacheKeyFn = currentConfig.cacheKey || ((p) => generateCacheKey(sourceKey, p));
      const cacheKey = cacheKeyFn(params);

      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < staleTime) {
        if (isMountedRef.current) {
          setState({
            options: cached.data as FieldOption<TValue>[],
            isLoading: false,
            error: null,
          });
        }
        return;
      }

      // Check if there's already an in-flight request for this key
      const existingRequest = inFlightRequests.get(cacheKey);
      if (existingRequest) {
        try {
          const options = await existingRequest;
          if (isMountedRef.current) {
            setState({
              options: options as FieldOption<TValue>[],
              isLoading: false,
              error: null,
            });
          }
        } catch {
          // Error handled by the original request
        }
        return;
      }

      // Prevent duplicate fetch for same key
      if (lastFetchKeyRef.current === cacheKey) {
        return;
      }
      lastFetchKeyRef.current = cacheKey;
      isFetchingRef.current = true;

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      if (isMountedRef.current) {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
      }

      // Create the fetch promise
      const fetchPromise = (async () => {
        const data = await currentConfig.fetch({
          ...params,
          signal: abortControllerRef.current!.signal,
        });
        return currentConfig.transform(data) as FieldOption[];
      })();

      // Track the in-flight request
      inFlightRequests.set(cacheKey, fetchPromise);

      try {
        const options = await fetchPromise;

        // Update cache
        cache.set(cacheKey, {
          data: options,
          timestamp: Date.now(),
        });

        if (isMountedRef.current) {
          setState({
            options: options as FieldOption<TValue>[],
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        const errorObj = error instanceof Error ? error : new Error(String(error));

        if (currentConfig.onError) {
          currentConfig.onError(errorObj);
        }

        if (isMountedRef.current) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: errorObj,
          }));
        }
      } finally {
        // Remove from in-flight requests
        inFlightRequests.delete(cacheKey);
        // Clear the last fetch key so future fetches can proceed
        if (lastFetchKeyRef.current === cacheKey) {
          lastFetchKeyRef.current = null;
        }
        isFetchingRef.current = false;
      }
    },
    [sourceKey, dependenciesKey, enabled]
  );

  // Debounced search handler
  const onSearch = useCallback(
    (query: string) => {
      searchQueryRef.current = query;

      const debounceMs = configRef.current.debounceMs ?? DEFAULT_DEBOUNCE_MS;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        fetchData(query);
      }, debounceMs);
    },
    [fetchData]
  );

  // Refetch function
  const refetch = useCallback(() => {
    // Clear the last fetch key to allow refetch
    lastFetchKeyRef.current = null;
    fetchData(searchQueryRef.current);
  }, [fetchData]);

  // Track previous dependencies key for change detection
  const prevDependenciesKeyRef = useRef<string>('');

  // Fetch on mount and when dependencies change
  useEffect(() => {
    isMountedRef.current = true;

    const shouldFetchOnMount = fetchOnMount && enabled && !isFetchingRef.current;
    const dependenciesChanged = dependenciesKey !== prevDependenciesKeyRef.current;

    if (shouldFetchOnMount || (dependenciesChanged && dependsOn.length > 0)) {
      prevDependenciesKeyRef.current = dependenciesKey;
      // Clear the last fetch key to allow fetch
      lastFetchKeyRef.current = null;
      fetchData();
    }

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [fetchOnMount, enabled, fetchData, dependenciesKey, dependsOn.length]);

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
