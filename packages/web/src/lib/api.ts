// Every request to the server goes through here (the lint rule allows `fetch` only in lib/):
// `call` for anything, `request` for a change whose answer isn't needed, `useFetch` (useFetch.ts)
// for reading once, and `useLive` (useLive.ts) for following a view.

/** The answer to a request: its data, or an error message (and the status, if the server answered). */
export type Result<T> =
  | { data: T; error: null; status: number }
  | { data: null; error: string; status: number | null };

/** Sends a request with a JSON body, or a file (a photo) as it is. Never throws. */
export async function call<T = unknown>(
  method: string,
  url: string,
  body?: object | Blob,
): Promise<Result<T>> {
  const file = body instanceof Blob;
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body ? { "content-type": file ? body.type : "application/json" } : {},
      body: body ? (file ? body : JSON.stringify(body)) : null,
    });
  } catch {
    return { data: null, error: "Server not reachable", status: null };
  }
  const json: unknown = res.status === 204 ? null : await res.json().catch(() => null);
  if (res.ok) return { data: json as T, error: null, status: res.status };
  const message = (json as { error?: unknown } | null)?.error;
  return {
    data: null,
    error: typeof message === "string" ? message : `Server error ${res.status}`,
    status: res.status,
  };
}

/** Sends a change; resolves to an error message, or null on success. */
export async function request(method: string, url: string, body?: object | Blob) {
  return (await call(method, url, body)).error;
}
