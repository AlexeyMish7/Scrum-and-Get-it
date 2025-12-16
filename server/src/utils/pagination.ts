/**
 * PAGINATION UTILITIES (UC-137)
 * 
 * Purpose:
 * - Implement pagination for large datasets
 * - Support offset-based and cursor-based pagination
 * - Reduce memory usage and improve response times
 * 
 * UC-137 Requirements:
 * - Implement pagination for large data sets
 * - Optimize database queries
 * - Monitor resource usage
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor?: string;
    previousCursor?: string;
  };
}

export interface CursorPaginationParams {
  limit?: number;
  cursor?: string;
  cursorField?: string; // e.g., 'created_at', 'id'
  direction?: 'asc' | 'desc';
}

/**
 * Default pagination limits (UC-137)
 * 
 * Free tier considerations:
 * - Smaller page sizes reduce memory usage
 * - Larger page sizes reduce database queries
 * - Balance between UX and resource usage
 */
export const PAGINATION_DEFAULTS = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
  DEFAULT_PAGE: 1,
};

/**
 * Validate pagination parameters
 * 
 * Ensures limits are within acceptable range
 */
export function validatePaginationParams(params: PaginationParams): {
  page: number;
  limit: number;
} {
  const page = Math.max(
    PAGINATION_DEFAULTS.DEFAULT_PAGE,
    Number(params.page) || PAGINATION_DEFAULTS.DEFAULT_PAGE
  );
  
  const limit = Math.min(
    PAGINATION_DEFAULTS.MAX_LIMIT,
    Math.max(
      PAGINATION_DEFAULTS.MIN_LIMIT,
      Number(params.limit) || PAGINATION_DEFAULTS.DEFAULT_LIMIT
    )
  );
  
  return { page, limit };
}

/**
 * Calculate offset from page number
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Calculate total pages from total items
 */
export function calculateTotalPages(totalItems: number, limit: number): number {
  return Math.ceil(totalItems / limit);
}

/**
 * Build paginated response
 * 
 * UC-137: Standardized pagination format
 */
export function buildPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  totalItems: number,
  nextCursor?: string,
  previousCursor?: string
): PaginatedResponse<T> {
  const totalPages = calculateTotalPages(totalItems, limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextCursor,
      previousCursor,
    },
  };
}

/**
 * Generate Supabase range for pagination
 * 
 * Example:
 * page 1, limit 20 → range(0, 19)
 * page 2, limit 20 → range(20, 39)
 */
export function getSupabaseRange(page: number, limit: number): { from: number; to: number } {
  const offset = calculateOffset(page, limit);
  return {
    from: offset,
    to: offset + limit - 1,
  };
}

/**
 * Encode cursor for cursor-based pagination
 * 
 * Cursor contains:
 * - Record ID or timestamp
 * - Direction (asc/desc)
 */
export function encodeCursor(value: string | number, field: string = 'id'): string {
  const cursor = { value, field };
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
}

/**
 * Decode cursor from base64
 */
export function decodeCursor(cursor: string): { value: string | number; field: string } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode cursor:', error);
    return null;
  }
}

/**
 * Build Supabase query with cursor pagination
 * 
 * UC-137: Cursor-based pagination for real-time data
 * Benefits:
 * - Consistent results even with new data
 * - Better performance for large datasets
 * - Works well with real-time subscriptions
 */
export function applyCursorPagination<T>(
  query: any, // Supabase query builder
  params: CursorPaginationParams
): any {
  const limit = Math.min(
    PAGINATION_DEFAULTS.MAX_LIMIT,
    params.limit || PAGINATION_DEFAULTS.DEFAULT_LIMIT
  );
  
  const field = params.cursorField || 'id';
  const direction = params.direction || 'desc';
  
  // Apply cursor filter
  if (params.cursor) {
    const decoded = decodeCursor(params.cursor);
    if (decoded && decoded.field === field) {
      if (direction === 'desc') {
        query = query.lt(field, decoded.value);
      } else {
        query = query.gt(field, decoded.value);
      }
    }
  }
  
  // Apply ordering and limit
  query = query.order(field, { ascending: direction === 'asc' }).limit(limit + 1);
  
  return query;
}

/**
 * Process cursor pagination results
 * 
 * Returns data + next cursor if more results exist
 */
export function processCursorResults<T>(
  results: T[],
  limit: number,
  cursorField: string = 'id'
): {
  data: T[];
  nextCursor: string | undefined;
  hasMore: boolean;
} {
  const hasMore = results.length > limit;
  const data = hasMore ? results.slice(0, limit) : results;
  
  let nextCursor: string | undefined;
  if (hasMore && data.length > 0) {
    const lastItem = data[data.length - 1] as any;
    if (lastItem[cursorField]) {
      nextCursor = encodeCursor(lastItem[cursorField], cursorField);
    }
  }
  
  return { data, nextCursor, hasMore };
}

/**
 * Parse pagination params from query string
 * 
 * Example URLs:
 * - /api/jobs?page=2&limit=50
 * - /api/jobs?cursor=eyJpZCI6MTIzfQ==&limit=20
 */
export function parsePaginationParams(queryParams: Record<string, any>): PaginationParams {
  return {
    page: queryParams.page ? parseInt(queryParams.page as string, 10) : undefined,
    limit: queryParams.limit ? parseInt(queryParams.limit as string, 10) : undefined,
    cursor: queryParams.cursor as string | undefined,
  };
}

/**
 * Example usage with Supabase (offset-based)
 * 
 * ```typescript
 * import { supabaseAdmin } from '../services/supabaseAdmin';
 * import { getSupabaseRange, buildPaginatedResponse } from '../utils/pagination';
 * 
 * async function getJobsPaginated(userId: string, page: number, limit: number) {
 *   const { from, to } = getSupabaseRange(page, limit);
 *   
 *   // Get total count
 *   const { count } = await supabaseAdmin
 *     .from('jobs')
 *     .select('*', { count: 'exact', head: true })
 *     .eq('user_id', userId);
 *   
 *   // Get paginated data
 *   const { data, error } = await supabaseAdmin
 *     .from('jobs')
 *     .select('*')
 *     .eq('user_id', userId)
 *     .order('created_at', { ascending: false })
 *     .range(from, to);
 *   
 *   if (error) throw error;
 *   
 *   return buildPaginatedResponse(data, page, limit, count || 0);
 * }
 * ```
 */

/**
 * Example usage with cursor-based pagination
 * 
 * ```typescript
 * import { applyCursorPagination, processCursorResults } from '../utils/pagination';
 * 
 * async function getJobsCursor(userId: string, cursor?: string, limit: number = 20) {
 *   let query = supabaseAdmin
 *     .from('jobs')
 *     .select('*')
 *     .eq('user_id', userId);
 *   
 *   query = applyCursorPagination(query, {
 *     cursor,
 *     limit,
 *     cursorField: 'created_at',
 *     direction: 'desc'
 *   });
 *   
 *   const { data, error } = await query;
 *   if (error) throw error;
 *   
 *   return processCursorResults(data, limit, 'created_at');
 * }
 * ```
 */

/**
 * UC-137 Pagination Strategies Documentation
 * 
 * Offset-Based Pagination (page/limit):
 * ✅ Pros:
 *    - Simple to implement
 *    - Users can jump to any page
 *    - Total page count visible
 * ❌ Cons:
 *    - Performance degrades with large offsets
 *    - Inconsistent results if data changes
 * 
 * Use when:
 * - Small to medium datasets (< 10k rows)
 * - Static or slow-changing data
 * - Need page numbers for UI
 * 
 * Cursor-Based Pagination:
 * ✅ Pros:
 *    - Consistent results even with new data
 *    - Better performance for large datasets
 *    - Works well with real-time updates
 * ❌ Cons:
 *    - Cannot jump to specific page
 *    - No total count (infinite scroll only)
 * 
 * Use when:
 * - Large datasets (> 10k rows)
 * - Frequently changing data
 * - Real-time feeds or infinite scroll
 * 
 * Performance Benchmarks (UC-137):
 * - Offset LIMIT 20 OFFSET 0: ~5ms
 * - Offset LIMIT 20 OFFSET 10000: ~50ms
 * - Cursor WHERE id > X LIMIT 20: ~5ms (constant time)
 * 
 * Scaling Recommendations:
 * 1. Start with offset pagination for simplicity
 * 2. Switch to cursor for feeds > 10k items
 * 3. Add database indexes on cursor fields
 * 4. Cache total counts for offset pagination
 * 5. Use cursor for real-time subscriptions
 */
