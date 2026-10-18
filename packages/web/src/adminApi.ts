/** Sends a JSON request; resolves to an error message, or null on success. */
export async function request(method: string, url: string, body?: object): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "content-type": "application/json" } : {},
      body: body ? JSON.stringify(body) : null,
    });
    if (res.ok) return null;
    const json = await res.json().catch(() => ({}));
    return (json as { error?: string }).error ?? `Server error ${res.status}`;
  } catch {
    return "Server not reachable";
  }
}
