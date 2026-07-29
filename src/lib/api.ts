const API_URL = import.meta.env.VITE_API_URL ?? "";
const TOKEN_KEY = "pcmo_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string | null) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const api = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const token = getToken();
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...((init.body && !(init.body instanceof FormData)) ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError("The PCMO API is unavailable. Please start the API server and try again.", 0);
  }

  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const fallback = response.status >= 500
      ? "The PCMO server could not complete this request. Please try again."
      : "Request failed";
    throw new ApiError(payload?.error ?? fallback, response.status, payload);
  }
  return payload;
};

export type PageResult<T> = { rows: T[]; total: number; page: number; limit: number };

export const resourceApi = {
  list: <T>(resource: string, params: Record<string, string | number | undefined> = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") search.set(key, String(value));
    });
    return api<PageResult<T>>(`/api/resources/${resource}?${search}`);
  },
  get: <T>(resource: string, id: string) => api<T>(`/api/resources/${resource}/${id}`),
  create: <T>(resource: string, input: Partial<T>) =>
    api<T>(`/api/resources/${resource}`, { method: "POST", body: JSON.stringify(input) }),
  update: <T>(resource: string, id: string, input: Partial<T>) =>
    api<T>(`/api/resources/${resource}/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  remove: (resource: string, id: string) => api<void>(`/api/resources/${resource}/${id}`, { method: "DELETE" }),
};
