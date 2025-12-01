/**
 * Error helpers for consistent API responses.
 */
export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function errorPayload(err: any) {
  if (err instanceof ApiError) {
    return { error: err.code ?? "error", message: err.message };
  }
  // Handle case where err might be an object without toString
  if (err && typeof err === 'object') {
    return { 
      error: "error", 
      message: err.message || err.toString?.() || JSON.stringify(err) 
    };
  }
  return { error: "error", message: String(err) };
}
