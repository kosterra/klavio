export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** JSON fetch against our own /api; cookies are httpOnly and sent automatically. */
export async function api<T = unknown>(method: Method, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK');
  }
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'UNKNOWN');
  return data as T;
}

/**
 * Not an answer about the request itself: no connection, the server busy or
 * restarting. Worth trying again later; what is on the device stays valid.
 */
export function isTransient(err: unknown): boolean {
  return (
    err instanceof ApiError && (err.code === 'NETWORK' || err.status === 429 || err.status >= 500)
  );
}
