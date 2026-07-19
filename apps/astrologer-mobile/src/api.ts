import * as SecureStore from "expo-secure-store";

export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3000";
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || "http://10.0.2.2:3001";
export const TOKEN_KEY = "astrowalla_astrologer_access_token";

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(body.error || "Request failed"), { status: response.status, body });
  return body as T;
}
