import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { api } from "@/src/api";

const PUSH_TOKEN_KEY = "astrowalla_push_token";

export async function registerPushToken(appType: "USER" | "ASTROLOGER") {
  if (!Device.isDevice) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#F5C842",
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let finalStatus = existing.status;
  if (existing.status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }
  if (finalStatus !== "granted") return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
  const result = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  const token = result.data;
  if (!token) return;

  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
  await api("/api/mobile/push-token", {
    method: "POST",
    body: JSON.stringify({ token, platform: Platform.OS, appType }),
  });
}

export async function unregisterPushToken() {
  const token = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
  if (!token) return;
  await api("/api/mobile/push-token", {
    method: "DELETE",
    body: JSON.stringify({ token }),
  }).catch(() => undefined);
  await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
}
