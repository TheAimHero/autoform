import { atom, PrimitiveAtom } from 'jotai';
import type {
  DataSourceConfig,
  DataSourcesConfig,
  DataSourceState,
  DataSourceFetchParams,
  FieldOption,
} from '../types';

/**
 * Cache entry for data source results
 */
interface CacheEntry {
  data: FieldOption[];
  timestamp: number;
  cacheKey: string;
}

/**
 * Global cache for data source results
 */
const dataSourceCache = new Map<string, CacheEntry>();

/**
 * Default stale time (30 seconds)
 */
const DEFAULT_STALE_TIME = 30000;

/**
 * Generate a default cache key from params
 */
function generateDefaultCacheKey(sourceKey: string, params: DataSourceFetchParams): string {
  const deps = params.dependencies ? JSON.stringify(params.dependencies) : '';
  const query = params.searchQuery || '';
  return `${sourceKey}:${deps}:${query}`;
}

/**
 * Check if a cache entry is stale
 */
function isCacheStale(entry: CacheEntry, staleTime: number): boolean {
  return Date.now() - entry.timestamp > staleTime;
}

/**
 * Create a data source atom for managing async data
 */
export function createDataSourceAtom<TData, TValue>(
  sourceKey: string,
  config: DataSourceConfig<TData, TValue>
): PrimitiveAtom<DataSourceState<TValue>> {
  // Base state atom
  const stateAtom = atom<DataSourceState<TValue>>({
    options: [],
    isLoading: false,
    error: null,
    lastFetched: null,
  });

  // Store config and sourceKey for later use
  (stateAtom as any).__config = config;
  (stateAtom as any).__sourceKey = sourceKey;
  (stateAtom as any).__generateCacheKey = (params: DataSourceFetchParams) => {
    const cacheKeyFn =
      config.cacheKey || ((p: DataSourceFetchParams) => generateDefaultCacheKey(sourceKey, p));
    return cacheKeyFn(params);
  };
  (stateAtom as any).__staleTime = config.staleTime ?? DEFAULT_STALE_TIME;

  return stateAtom;
}

/**
 * Fetch data for a data source atom
 */
export async function fetchDataSourceAtom<TData, TValue>(
  sourceKey: string,
  config: DataSourceConfig<TData, TValue>,
  params: DataSourceFetchParams,
  setState: (state: DataSourceState<TValue>) => void,
  getState: () => DataSourceState<TValue>
): Promise<void> {
  // Generate cache key
  const cacheKeyFn =
    config.cacheKey || ((p: DataSourceFetchParams) => generateDefaultCacheKey(sourceKey, p));
  const cacheKey = cacheKeyFn(params);
  const staleTime = config.staleTime ?? DEFAULT_STALE_TIME;

  // Check cache
  const cached = dataSourceCache.get(cacheKey);
  if (cached && !isCacheStale(cached, staleTime)) {
    setState({
      options: cached.data as FieldOption<TValue>[],
      isLoading: false,
      error: null,
      lastFetched: cached.timestamp,
    });
    return;
  }

  // Set loading state
  setState({
    ...getState(),
    isLoading: true,
    error: null,
  });

  try {
    const data = await config.fetch(params);
    const options = config.transform(data);
    const timestamp = Date.now();

    // Update cache
    dataSourceCache.set(cacheKey, {
      data: options,
      timestamp,
      cacheKey,
    });

    setState({
      options,
      isLoading: false,
      error: null,
      lastFetched: timestamp,
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

    setState({
      ...getState(),
      isLoading: false,
      error: errorObj,
    });
  }
}

/**
 * Data source manager for handling multiple data sources
 */
export class DataSourceManager {
  private configs: DataSourcesConfig;
  private atoms: Map<string, PrimitiveAtom<DataSourceState>>;

  constructor(configs: DataSourcesConfig = {}) {
    this.configs = configs;
    this.atoms = new Map();
  }

  /**
   * Get or create an atom for a data source
   */
  getAtom(sourceKey: string): PrimitiveAtom<DataSourceState> | undefined {
    const config = this.configs[sourceKey];
    if (!config) {
      return undefined;
    }

    if (!this.atoms.has(sourceKey)) {
      this.atoms.set(sourceKey, createDataSourceAtom(sourceKey, config));
    }

    return this.atoms.get(sourceKey);
  }

  /**
   * Get the configuration for a data source
   */
  getConfig(sourceKey: string): DataSourceConfig | undefined {
    return this.configs[sourceKey];
  }

  /**
   * Check if a data source exists
   */
  has(sourceKey: string): boolean {
    return sourceKey in this.configs;
  }

  /**
   * Add a new data source configuration
   */
  addSource(sourceKey: string, config: DataSourceConfig): void {
    this.configs[sourceKey] = config;
  }

  /**
   * Remove a data source
   */
  removeSource(sourceKey: string): void {
    delete this.configs[sourceKey];
    this.atoms.delete(sourceKey);
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    dataSourceCache.clear();
  }

  /**
   * Clear cache for a specific source
   */
  clearSourceCache(sourceKey: string): void {
    for (const [key] of dataSourceCache) {
      if (key.startsWith(`${sourceKey}:`)) {
        dataSourceCache.delete(key);
      }
    }
  }
}

/**
 * Create a data source manager instance
 */
export function createDataSourceManager(configs: DataSourcesConfig = {}): DataSourceManager {
  return new DataSourceManager(configs);
}

/**
 * Clear all data source cache
 */
export function clearDataSourceCache(): void {
  dataSourceCache.clear();
}
