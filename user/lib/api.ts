export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type Options = Omit<RequestInit, "body"> & { body?: unknown };

export async function api<T = unknown>(path: string, { body, headers, ...init }: Options = {}): Promise<T> {
  const isForm = body instanceof FormData;

  const res = await fetch(`/api${path}`, {
    credentials: "include",
    ...init,
    headers: isForm ? headers : { "Content-Type": "application/json", ...headers },
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.message || "Une erreur est survenue", res.status);
  }
  return data as T;
}

export function query(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}
