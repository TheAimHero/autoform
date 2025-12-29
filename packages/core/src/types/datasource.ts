import type { FieldOption } from './component';

/**
 * Parameters passed to data source fetch function
 */
export interface DataSourceFetchParams {
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
   */
  signal?: AbortSignal;
}

/**
 * Configuration for a single data source
 */
export interface DataSourceConfig<TData = unknown, TValue = unknown> {
  /**
   * Function to fetch the data
   */
  fetch: (params: DataSourceFetchParams) => Promise<TData>;

  /**
   * Transform the fetched data into options
   */
  transform: (data: TData) => FieldOption<TValue>[];

  /**
   * Generate a cache key for the request
   * If not provided, a default key based on dependencies is used
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

/**
 * Map of data source keys to their configurations
 */
export type DataSourcesConfig = Record<string, DataSourceConfig>;

/**
 * Internal state of a data source
 */
export interface DataSourceState<TValue = unknown> {
  /**
   * Current options (result of transform)
   */
  options: FieldOption<TValue>[];

  /**
   * Whether currently loading
   */
  isLoading: boolean;

  /**
   * Error if fetch failed
   */
  error: Error | null;

  /**
   * Last successful fetch timestamp
   */
  lastFetched: number | null;
}

/**
 * Result of useDataSource hook
 */
export interface UseDataSourceResult<TValue = unknown> {
  /**
   * Current options
   */
  options: FieldOption<TValue>[];

  /**
   * Whether loading
   */
  isLoading: boolean;

  /**
   * Error if any
   */
  error: Error | null;

  /**
   * Refetch the data
   */
  refetch: () => void;

  /**
   * Search handler for autocomplete
   */
  onSearch: (query: string) => void;
}
