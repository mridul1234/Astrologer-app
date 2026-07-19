import { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { io, Socket } from "socket.io-client";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/src/api";
import { colors, fonts } from "@/src/ui";

type PendingChat = {
  sessionId: string;
  astrologerName: string;
  profileImage?: string | null;
  startedAt: number;
};

type PendingChatContextValue = {
  pendingChat: PendingChat | null;
  beginPendingChat: (chat: Omit<PendingChat, "startedAt">) => void;
  clearPendingChat: (sessionId?: string) => void;
};

const PendingChatContext = createContext<PendingChatContextValue | null>(null);

export function PendingChatProvider({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const [pendingChat, setPendingChat] = useState<PendingChat | null>(null);
  const [connected, setConnected] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [cancelling, setCancelling] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const openingRef = useRef(false);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setConnected(false);
    openingRef.current = false;
  }, []);

  const clearPendingChat = useCallback((sessionId?: string) => {
    setPendingChat((current) => {
      if (sessionId && current?.sessionId !== sessionId) return current;
      disconnect();
      return null;
    });
  }, [disconnect]);

  const beginPendingChat = useCallback((chat: Omit<PendingChat, "startedAt">) => {
    setPendingChat({
      ...chat,
      startedAt: Date.now(),
    });
  }, []);

  const openChat = useCallback((sessionId: string) => {
    if (openingRef.current) return;
    openingRef.current = true;
    disconnect();
    setPendingChat(null);
    router.push(`/chat/${sessionId}`);
  }, [disconnect]);

  useEffect(() => {
    if (!pendingChat) return;
    let active = true;
    openingRef.current = false;
    setSecondsLeft(600);
    setCancelling(false);

    (async () => {
      try {
        const { token } = await api<{ token: string }>("/api/chat/socket-token");
        if (!active) return;
        const client = io(process.env.EXPO_PUBLIC_SOCKET_URL || "http://10.0.2.2:3001", {
          auth: { token },
          transports: ["websocket"],
        });
        socketRef.current = client;

        client.on("connect", () => {
          setConnected(true);
          client.emit("join_session", { sessionId: pendingChat.sessionId });
        });
        client.on("disconnect", () => setConnected(false));
        client.on("astrologer_joined", () => openChat(pendingChat.sessionId));
        client.on("billing_started", () => openChat(pendingChat.sessionId));
        client.on("session_cancelled", () => clearPendingChat(pendingChat.sessionId));
        client.on("session_ended", () => clearPendingChat(pendingChat.sessionId));
      } catch {
        clearPendingChat(pendingChat.sessionId);
      }
    })();

    return () => {
      active = false;
      disconnect();
    };
  }, [clearPendingChat, disconnect, openChat, pendingChat]);

  useEffect(() => {
    if (!pendingChat) return;
    const timer = setInterval(() => {
      const next = Math.max(0, 600 - Math.floor((Date.now() - pendingChat.startedAt) / 1000));
      setSecondsLeft(next);
      if (next === 0) {
        clearInterval(timer);
        void api("/api/chat/cancel", { method: "POST", body: JSON.stringify({ sessionId: pendingChat.sessionId }) }).catch(() => undefined);
        clearPendingChat(pendingChat.sessionId);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [clearPendingChat, pendingChat]);

  const cancel = async () => {
    if (!pendingChat || cancelling) return;
    setCancelling(true);
    try {
      await api("/api/chat/cancel", { method: "POST", body: JSON.stringify({ sessionId: pendingChat.sessionId }) });
    } catch {
      // If billing already started, the route to chat will win via socket event.
    } finally {
      clearPendingChat(pendingChat.sessionId);
      setCancelling(false);
    }
  };

  const value = { pendingChat, beginPendingChat, clearPendingChat };
  const bottom = Math.max(insets.bottom, 10) + 66;

  return (
    <PendingChatContext.Provider value={value}>
      {children}
      {pendingChat ? (
        <View pointerEvents="box-none" style={[styles.overlay, { bottom }]}>
          <Pressable style={({ pressed }) => [styles.bar, pressed && styles.barPressed]} onPress={() => openChat(pendingChat.sessionId)}>
            <View style={styles.iconWrap}>
              {connected ? <Ionicons name="radio-button-on" size={18} color={colors.green} /> : <ActivityIndicator size="small" color={colors.orange} />}
            </View>
            <View style={styles.copy}>
              <Text style={styles.title} numberOfLines={1}>Waiting for {pendingChat.astrologerName}</Text>
              <Text style={styles.subtitle} numberOfLines={1}>{connected ? "You can keep using the app. We’ll open chat when they join." : "Connecting request..."}</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.time}>{formatClock(secondsLeft)}</Text>
              <Pressable hitSlop={8} style={styles.close} onPress={cancel} disabled={cancelling}>
                {cancelling ? <ActivityIndicator size="small" color={colors.red} /> : <Ionicons name="close" size={17} color={colors.red} />}
              </Pressable>
            </View>
          </Pressable>
        </View>
      ) : null}
    </PendingChatContext.Provider>
  );
}

export function usePendingChat() {
  const context = useContext(PendingChatContext);
  if (!context) throw new Error("usePendingChat must be used inside PendingChatProvider");
  return context;
}

function formatClock(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", left: 12, right: 12, zIndex: 1000 },
  bar: { minHeight: 68, borderRadius: 20, backgroundColor: "#FFFEFC", borderWidth: 1, borderColor: "#E9D7A8", shadowColor: "#1A1040", shadowOpacity: 0.16, shadowRadius: 18, elevation: 8, flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  barPressed: { transform: [{ scale: 0.985 }], opacity: 0.96 },
  iconWrap: { width: 38, height: 38, borderRadius: 14, backgroundColor: "#FFF3D8", alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.extrabold, color: colors.ink, fontSize: 14.5 },
  subtitle: { fontFamily: fonts.medium, color: colors.muted, fontSize: 11.5, marginTop: 2 },
  right: { alignItems: "center", gap: 5 },
  time: { fontFamily: fonts.extrabold, color: colors.orangeDark, fontSize: 12 },
  close: { width: 25, height: 25, borderRadius: 13, backgroundColor: "#FFF1F1", alignItems: "center", justifyContent: "center" },
});
