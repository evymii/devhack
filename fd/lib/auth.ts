import { apiRequest, clearAuthToken, saveAuthToken } from "@/lib/api";

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  national_id?: string | null;
  nationalId?: string | null;
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

export async function loginWithFace(biometricData: number[]): Promise<CurrentUser> {
  const result = await apiRequest<{
    token: string;
    token_type: "Bearer";
    user: CurrentUser;
    distance: number;
  }>("/auth/face-login", {
    method: "POST",
    body: { biometric_data: biometricData },
  });

  saveAuthToken(result.token);
  return result.user;
}

export async function sendRegisterOtp(email: string): Promise<{ message: string; dev_otp?: string }> {
  return apiRequest<{ message: string; dev_otp?: string }>("/auth/register/otp/send", {
    method: "POST",
    body: { email },
  });
}

export async function verifyRegisterOtp(payload: {
  email: string;
  otp: string;
}): Promise<{ message: string; verification_token: string }> {
  return apiRequest<{ message: string; verification_token: string }>("/auth/register/otp/verify", {
    method: "POST",
    body: payload,
  });
}

export async function completeRegister(payload: {
  email: string;
  verificationToken: string;
  name: string;
  nationalId: string;
  biometricData: number[];
  biometricSnapshot?: string;
}): Promise<{ user: CurrentUser; faceId: string }> {
  const result = await apiRequest<{
    token: string;
    token_type: "Bearer";
    user: CurrentUser;
    face_id: string;
  }>("/auth/register/complete", {
    method: "POST",
    body: {
      email: payload.email,
      verification_token: payload.verificationToken,
      name: payload.name,
      national_id: payload.nationalId,
      biometric_data: payload.biometricData,
      biometric_snapshot: payload.biometricSnapshot ?? "",
    },
  });

  saveAuthToken(result.token);
  return { user: result.user, faceId: result.face_id };
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
