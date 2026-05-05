import { apiRequest, clearAuthToken, saveAuthToken } from "@/lib/api";

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user" | string;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    return await apiRequest<CurrentUser>("/user", { method: "POST" });
  } catch {
    return null;
  }
}

export async function loginWithPassword(payload: {
  email: string;
  password: string;
}): Promise<CurrentUser> {
  const result = await apiRequest<{
    token: string;
    token_type: "Bearer";
    user: CurrentUser;
  }>("/auth/login", {
    method: "POST",
    body: payload,
  });

  saveAuthToken(result.token);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  try {
    await apiRequest<{ message: string }>("/auth/logout", { method: "POST" });
  } finally {
    clearAuthToken();
  }
}

export function isAdminUser(user: CurrentUser | null): boolean {
  return user?.role === "admin";
}
