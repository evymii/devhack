export type ApiResponse<T> = {
  response_code: "success" | "error";
  response: T;
};

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8004/api";

const TOKEN_KEY = "facepass_jwt";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token =
    typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      `API did not return JSON. Check NEXT_PUBLIC_API_BASE_URL (${API_BASE_URL}).`,
    );
  }

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || payload.response_code === "error") {
    const message =
      typeof payload.response === "string" ? payload.response : "API error";
    throw new Error(message);
  }

  return payload.response;
}

export function saveAuthToken(token: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearAuthToken() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

export function getAuthToken() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY);
}
