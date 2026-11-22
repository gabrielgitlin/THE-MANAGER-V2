import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface QueryOptions<T> {
  /** Supabase table name */
  table: string;
  /** Columns to select (default: '*') */
  select?: string;
  /** Filter conditions as key-value pairs */
  filters?: Record<string, unknown>;
  /** Column to order by */
  orderBy?: { column: string; ascending?: boolean };
  /** Limit number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Whether to fetch on mount (default: true) */
  enabled?: boolean;
  /** Transform function to apply to results */
  transform?: (data: any[]) => T[];
  /** Single result mode (.maybeSingle()) */
  single?: boolean;
}

interface QueryResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  count: number | null;
}

interface SingleQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Reusable hook for Supabase queries.
 * Replaces the repeated pattern of useState + useEffect + fetch + try/catch.
 *
 * @example
 * // Simple usage
 * const { data: artists, loading } = useSupabaseQuery<Artist>({ table: 'artists' });
 *
 * @example
 * // With filters and ordering
 * const { data: shows, loading, refetch } = useSupabaseQuery<Show>({
 *   table: 'shows',
 *   select: 'id, title, date, venue_name, status',
 *   filters: { artist_id: selectedArtistId },
 *   orderBy: { column: 'date', ascending: false },
 *   limit: 50,
 * });
 *
 * @example
 * // Single record
 * const { data: artist } = useSupabaseQuery<Artist>({
 *   table: 'artists',
 *   filters: { id: artistId },
 *   single: true,
 * });
 */
export function useSupabaseQuery<T = any>(
  options: QueryOptions<T> & { single: true }
): SingleQueryResult<T>;
export function useSupabaseQuery<T = any>(
  options: QueryOptions<T>
): QueryResult<T>;
export function useSupabaseQuery<T = any>(options: QueryOptions<T>) {
  const {
    table,
    select = '*',
    filters,
    orderBy,
    limit,
    offset,
    enabled = true,
    transform,
    single = false,
  } = options;

  const [data, setData] = useState<T[] | T | null>(single ? null : []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase.from(table).select(select, { count: 'exact' });

      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, {
          ascending: orderBy.ascending ?? true,
        });
      }

      // Apply pagination
      if (limit) {
        const start = offset ?? 0;
        query = query.range(start, start + limit - 1);
      }

      // Execute query
      if (single) {
        const { data: result, error: queryError } = await query.maybeSingle();
        if (queryError) throw queryError;
        if (mountedRef.current) {
          setData(result as T | null);
        }
      } else {
        const { data: result, error: queryError, count: totalCount } = await query;
        if (queryError) throw queryError;
        if (mountedRef.current) {
          const processed = transform && result ? transform(result) : (result as T[]);
          setData(processed ?? []);
          setCount(totalCount);
        }
      }
    } catch (err: any) {
      console.error(`Error fetching from ${table}:`, err);
      if (mountedRef.current) {
        setError(err.message || 'An error occurred');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [table, select, JSON.stringify(filters), JSON.stringify(orderBy), limit, offset, enabled, single]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  if (single) {
    return { data: data as T | null, loading, error, refetch: fetchData };
  }

  return { data: data as T[], loading, error, refetch: fetchData, count };
}

/**
 * Hook for Supabase mutations (insert, update, delete).
 * Handles loading state and error handling.
 *
 * @example
 * const { mutate: createShow, loading } = useSupabaseMutation<Show>({
 *   table: 'shows',
 *   operation: 'insert',
 *   onSuccess: () => refetchShows(),
 * });
 * await createShow({ title: 'New Show', date: '2025-06-01' });
 */
interface MutationOptions {
  table: string;
  operation: 'insert' | 'update' | 'delete' | 'upsert';
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

interface MutationResult<T> {
  mutate: (values: Partial<T>, match?: Record<string, unknown>) => Promise<T | null>;
  loading: boolean;
  error: string | null;
}

export function useSupabaseMutation<T = any>(
  options: MutationOptions
): MutationResult<T> {
  const { table, operation, onSuccess, onError } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (values: Partial<T>, match?: Record<string, unknown>): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        let query;

        switch (operation) {
          case 'insert':
            query = supabase.from(table).insert(values).select().single();
            break;
          case 'update': {
            let updateQuery = supabase.from(table).update(values);
            if (match) {
              Object.entries(match).forEach(([key, value]) => {
                updateQuery = updateQuery.eq(key, value);
              });
            }
            query = updateQuery.select().single();
            break;
          }
          case 'upsert':
            query = supabase.from(table).upsert(values).select().single();
            break;
          case 'delete': {
            let deleteQuery = supabase.from(table).delete();
            if (match) {
              Object.entries(match).forEach(([key, value]) => {
                deleteQuery = deleteQuery.eq(key, value);
              });
            }
            query = deleteQuery;
            break;
          }
        }

        const { data, error: mutationError } = await query;
        if (mutationError) throw mutationError;

        onSuccess?.(data);
        return data as T;
      } catch (err: any) {
        const errorMsg = err.message || 'Mutation failed';
        setError(errorMsg);
        onError?.(errorMsg);
        console.error(`Error in ${operation} on ${table}:`, err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [table, operation, onSuccess, onError]
  );

  return { mutate, loading, error };
}
