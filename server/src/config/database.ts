/**
 * DATABASE CONFIGURATION (UC-137)
 * 
 * Purpose:
 * - Configure connection pooling for Supabase
 * - Optimize database performance
 * - Monitor connection health
 * 
 * Connection Pooling Strategy:
 * - Supabase provides built-in connection pooling via PgBouncer
 * - Connection string with :6543 port uses pooled connections
 * - Free tier: ~60 concurrent connections
 * - Paid tier: configurable pool size
 * 
 * Usage:
 *   import { getDatabaseConfig, getPooledConnectionString } from './config/database';
 */

export interface DatabaseConfig {
  url: string;
  pooledUrl?: string;
  maxConnections: number;
  connectionTimeout: number;
  idleTimeout: number;
  enablePooling: boolean;
}

/**
 * Get database configuration with pooling settings
 * 
 * Supabase Pooling:
 * - Direct connection: uses port 5432 (default PostgreSQL port)
 * - Pooled connection: uses port 6543 (PgBouncer)
 * 
 * Connection modes:
 * - Session mode (default): Connection held for session duration
 * - Transaction mode: Connection released after each transaction
 * 
 * For serverless/edge functions, always use pooled connections
 */
export function getDatabaseConfig(): DatabaseConfig {
  const baseUrl = process.env.SUPABASE_URL || '';
  const directUrl = process.env.DATABASE_URL || '';
  
  // Extract pooled connection URL from direct URL
  // Supabase pattern: postgresql://[user]:[pass]@[host]:5432/postgres
  // Pooled pattern: postgresql://[user]:[pass]@[host]:6543/postgres
  const pooledUrl = directUrl ? directUrl.replace(':5432/', ':6543/') : '';
  
  return {
    url: directUrl,
    pooledUrl: pooledUrl || undefined,
    // Free tier limits (document for UC-137)
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '60', 10),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10), // 10s
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10), // 30s
    enablePooling: process.env.DB_ENABLE_POOLING !== 'false', // Default true
  };
}

/**
 * Get pooled connection string for serverless environments
 * 
 * UC-137 Requirement: Connection pooling for scalability
 * 
 * Why pooling matters:
 * - Serverless functions create new connections per invocation
 * - Without pooling, you quickly hit connection limits
 * - PgBouncer reuses connections efficiently
 * 
 * Free tier considerations:
 * - ~60 concurrent connections available
 * - Pool size should be configured based on expected traffic
 * - Monitor connection usage in Supabase dashboard
 */
export function getPooledConnectionString(): string | null {
  const config = getDatabaseConfig();
  
  if (!config.enablePooling || !config.pooledUrl) {
    console.warn('⚠️ Database pooling not configured - using direct connection');
    return config.url || null;
  }
  
  return config.pooledUrl;
}

/**
 * Monitor database connection health
 * 
 * UC-137 Requirement: Resource usage monitoring
 * 
 * Metrics to track:
 * - Active connections
 * - Connection wait time
 * - Query execution time
 * - Connection pool saturation
 */
export interface ConnectionHealth {
  timestamp: number;
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  maxConnections: number;
  poolUtilization: number; // 0-1
  status: 'healthy' | 'warning' | 'critical';
}

/**
 * Check connection health status
 * 
 * Thresholds:
 * - Healthy: < 70% pool utilization
 * - Warning: 70-90% pool utilization
 * - Critical: > 90% pool utilization
 */
export function getConnectionHealthStatus(utilization: number): ConnectionHealth['status'] {
  if (utilization >= 0.9) return 'critical';
  if (utilization >= 0.7) return 'warning';
  return 'healthy';
}

/**
 * Log connection health metrics (for monitoring)
 * 
 * UC-137: This data can be exported to monitoring tools
 * like Datadog, New Relic, or custom dashboards
 */
export function logConnectionHealth(health: ConnectionHealth): void {
  const emoji = health.status === 'healthy' ? '✅' : 
                health.status === 'warning' ? '⚠️' : '❌';
  
  console.log(`${emoji} DB Connection Health: ${health.status.toUpperCase()}`);
  console.log(`   Active: ${health.activeConnections}/${health.maxConnections}`);
  console.log(`   Utilization: ${(health.poolUtilization * 100).toFixed(1)}%`);
}

/**
 * Connection pooling best practices (UC-137 documentation)
 * 
 * 1. Always use pooled connections in serverless environments
 * 2. Set appropriate timeout values based on query complexity
 * 3. Monitor connection usage regularly
 * 4. Configure max connections based on traffic patterns
 * 5. Use read replicas for read-heavy workloads (paid tier)
 * 6. Implement connection retry logic with exponential backoff
 * 7. Close connections properly in finally blocks
 * 8. Use connection pooling middleware for Express/Fastify
 * 
 * Scaling strategies:
 * - Horizontal: Multiple server instances with shared pool
 * - Vertical: Increase Supabase tier for more connections
 * - Read replicas: Split read/write traffic (paid feature)
 * - Caching: Reduce database queries with Redis/in-memory cache
 */
