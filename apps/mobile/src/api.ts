import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3000";

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await SecureStore.getItemAsync("astrowalla_access_token");
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

export const apiUrl = API_URL;
