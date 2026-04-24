/**
 * Typed API fetch utility.
 *
 * Wraps fetch with:
 * - Proper TypeScript generics (no more `{}` inference errors)
 * - Safe JSON parsing (won't throw on empty/error responses)
 * - Consistent error handling
 *
 * Usage:
 *   const data = await apiFetch<{ brands: Brand[] }>("/api/admin/brands");
 *   setBrands(data.brands ?? []);
 */

type ApiResult<T> = T & Record<string, unknown>;

export async function apiFetch<T extends Record<string, unknown>>(
  url: string,
  options?: RequestInit
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return {} as ApiResult<T>;
    const text = await res.text();
    if (!text) return {} as ApiResult<T>;
    return JSON.parse(text) as ApiResult<T>;
  } catch {
    return {} as ApiResult<T>;
  }
}

export async function apiPost<T extends Record<string, unknown>>(
  url: string,
  body: unknown,
  options?: Omit<RequestInit, "method" | "body">
): Promise<ApiResult<T> & { status?: number }> {
  try {
    const res = await fetch(url, {
      ...options,
      method: "POST",
      headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    const data = text ? (JSON.parse(text) as ApiResult<T>) : ({} as ApiResult<T>);
    return { ...data, status: res.status };
  } catch {
    return { status: 500 } as ApiResult<T> & { status: number };
  }
}

export async function apiPatch<T extends Record<string, unknown>>(
  url: string,
  body: unknown
): Promise<ApiResult<T> & { status?: number }> {
  return apiPost<T>(url, body, { method: "PATCH" } as RequestInit) as Promise<
    ApiResult<T> & { status?: number }
  >;
}
