/**
 * Middleware Barrel Export
 *
 * Re-exports all middleware modules for convenient importing.
 *
 * Usage:
 *   import { requireAuth, getCorsHeaders, createRequestContext } from './middleware/index.js';
 */

// CORS middleware
export {
  getCorsHeaders,
  handleCorsPreflight,
  type CorsOptions,
} from "./cors.js";

// Logging middleware
export { createRequestContext, type RequestContext } from "./logging.js";

// Auth middleware
export { requireAuth, tryAuth } from "./auth.js";
