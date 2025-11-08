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
  return { error: "error", message: err?.message ?? String(err) };
}
