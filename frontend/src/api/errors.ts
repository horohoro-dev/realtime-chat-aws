export type ApiError = Error & { name: "ApiError"; status: number };

export function createApiError(message: string, status: number): ApiError {
  return Object.assign(new Error(message), { name: "ApiError" as const, status });
}

export function isApiError(error: unknown): error is ApiError {
  return (
    error instanceof Error &&
    error.name === "ApiError" &&
    "status" in error &&
    typeof error.status === "number"
  );
}
