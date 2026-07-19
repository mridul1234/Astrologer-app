import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { io, Socket } from "socket.io-client";
import { api, SOCKET_URL } from "@/src/api";
import { colors, fonts } from "@/src/ui";
import type { ChatSession } from "@/src/types";

type Message = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  isMe: boolean;
};

type ParsedMessage = { type: "text"; text: string } | { type: "image"; uri: string };

function parseContent(content: string): ParsedMessage {
  try {
    const parsed = JSON.parse(content) as { type?: string; uri?: string };
    if (parsed.type === "image" && typeof parsed.uri === "string" && parsed.uri.startsWith("data:image/")) {
      return { type: "image", uri: parsed.uri };
    }
  } catch {}
  return { type: "text", text: content };
}

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function AstrologerChatScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [ended, setEnded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [billingStarted, setBillingStarted] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const [sessionData, profile, tokenData] = await Promise.all([
          api<ChatSession & { messages?: Array<{ id: string; senderId: string; content: string; createdAt: string }> }>(`/api/chat/session/${sessionId}`),
          api<{ userId: string; id: string }>("/api/astrologer/profile"),
          api<{ token: string }>("/api/chat/socket-token"),
        ]);
        if (!mounted) return;
        const uid = profile.userId || profile.id;
        setMyUserId(uid);
        setSession(sessionData);
        setEnded(sessionData.status === "ENDED");
        setMessages((sessionData.messages || []).map((m) => ({ ...m, isMe: m.senderId === uid })));
        const socket = io(SOCKET_URL, { auth: { token: tokenData.token }, transports: ["websocket"], timeout: 60000 });
        socketRef.current = socket;
        socket.on("connect", () => {
          setConnected(true);
          socket.emit("join_session", { sessionId });
        });
        socket.on("disconnect", () => setConnected(false));
        socket.on("billing_started", () => setBillingStarted(true));
        socket.on("session_ended", () => setEnded(true));
        socket.on("user_typing", ({ isTyping }: { isTyping: boolean }) => {
          setTyping(isTyping);
          if (typingTimeout.current) clearTimeout(typingTimeout.current);
          if (isTyping) typingTimeout.current = setTimeout(() => setTyping(false), 3000);
        });
        socket.on("receive_message", (msg: { id: string; senderId: string; content: string; createdAt: string }) => {
          setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, { ...msg, isMe: msg.senderId === uid }]);
        });
      } catch (error) {
        Alert.alert("Could not open chat", error instanceof Error ? error.message : "Try again", [{ text: "Back", onPress: () => router.back() }]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      socketRef.current?.disconnect();
    };
  }, [sessionId]);

  useEffect(() => {
    if (ended || !connected || !billingStarted) return;
    const id = setInterval(() => setDuration((value) => value + 1), 1000);
    return () => clearInterval(id);
  }, [connected, billingStarted, ended]);

  function send() {
    const text = input.trim();
    if (!text || ended || !socketRef.current) return;
    socketRef.current.emit("send_message", { sessionId, content: text });
    socketRef.current.emit("typing", { sessionId, isTyping: false });
    setInput("");
  }

  function updateText(text: string) {
    setInput(text);
    socketRef.current?.emit("typing", { sessionId, isTyping: text.length > 0 });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    if (text.length > 0) {
      typingTimeout.current = setTimeout(() => socketRef.current?.emit("typing", { sessionId, isTyping: false }), 1800);
    }
  }

  function endSession() {
    Alert.alert("End chat?", "This will end billing and close the live session.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End",
        style: "destructive",
        onPress: () => {
          socketRef.current?.emit("end_session", { sessionId });
          setEnded(true);
        },
      },
    ]);
  }

  if (loading) return <View style={styles.loading}><ActivityIndicator color={colors.orange} /><Text style={styles.loadingText}>Opening session...</Text></View>;

  const userName = session?.user?.name || "User";
  const rate = Math.round(session?.astrologer?.ratePerMin || 0);
  const earned = ended ? Math.round(session?.astrologerEarnings || session?.totalCost || 0) : Math.ceil(duration / 60) * rate;

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <Pressable style={styles.back} onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={colors.orangeDark} /></Pressable>
          <View style={styles.userAvatar}><Text style={styles.userInitial}>{userName[0]}</Text></View>
          <View style={styles.headerText}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={[styles.status, connected ? styles.connected : styles.disconnected]}>{connected ? "Connected" : "Reconnecting"}</Text>
          </View>
          <View style={styles.miniStats}>
            <Text style={styles.timer}>{formatDuration(duration)}</Text>
            <Text style={styles.earn}>₹{earned}</Text>
          </View>
          {!ended && <Pressable style={styles.endBtn} onPress={endSession}><Text style={styles.endText}>End</Text></Pressable>}
        </View>

        {session?.user?.kundliProfile && (
          <View style={styles.kundli}>
            <Text style={styles.kundliTitle}>Kundli Details</Text>
            <Text style={styles.kundliText}>{session.user.kundliProfile.fullName} · {session.user.kundliProfile.dateOfBirth} · {session.user.kundliProfile.timeOfBirth}</Text>
            <Text style={styles.kundliText}>{session.user.kundliProfile.placeOfBirth}</Text>
          </View>
        )}

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messages}
          renderItem={({ item }) => <Bubble item={item} userInitial={userName[0]} />}
          ListFooterComponent={typing ? <Typing userInitial={userName[0]} /> : ended ? <Ended /> : null}
          onContentSizeChange={() => {}}
        />

        {!ended && (
          <View style={styles.composer}>
            <TextInput
              value={input}
              onChangeText={updateText}
              placeholder="Share your guidance..."
              placeholderTextColor="#9CA3AF"
              multiline
              style={styles.input}
            />
            <Pressable style={[styles.send, !input.trim() && styles.sendDisabled]} onPress={send} disabled={!input.trim()}>
              <Ionicons name="send" size={20} color={colors.white} />
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ item, userInitial }: { item: Message; userInitial: string }) {
  const parsed = parseContent(item.content);
  return (
    <View style={[styles.bubbleRow, item.isMe && styles.bubbleRowMe]}>
      {!item.isMe && <View style={styles.smallAvatar}><Text style={styles.smallAvatarText}>{userInitial}</Text></View>}
      <View style={[styles.bubble, item.isMe ? styles.meBubble : styles.themBubble]}>
        {parsed.type === "image" ? <Image source={{ uri: parsed.uri }} style={styles.imageMessage} /> : <Text style={[styles.bubbleText, item.isMe && styles.meText]}>{parsed.text}</Text>}
        <Text style={[styles.bubbleTime, item.isMe && styles.meTime]}>{timeLabel(item.createdAt)}</Text>
      </View>
    </View>
  );
}

function Typing({ userInitial }: { userInitial: string }) {
  return (
    <View style={styles.bubbleRow}>
      <View style={styles.smallAvatar}><Text style={styles.smallAvatarText}>{userInitial}</Text></View>
      <View style={styles.typing}><Text style={styles.typingText}>typing...</Text></View>
    </View>
  );
}

function Ended() {
  return <Text style={styles.ended}>Session ended</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FBF6EA" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream, gap: 10 },
  loadingText: { color: colors.muted, fontFamily: fonts.bold },
  header: { flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { width: 36, height: 36, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF6E8" },
  userAvatar: { width: 44, height: 44, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: colors.goldSoft, borderWidth: 1, borderColor: colors.gold },
  userInitial: { color: colors.orangeDark, fontSize: 17, fontFamily: fonts.extrabold },
  headerText: { flex: 1 },
  userName: { color: colors.ink, fontSize: 16, fontFamily: fonts.extrabold },
  status: { fontSize: 11, fontFamily: fonts.bold, marginTop: 2 },
  connected: { color: colors.green },
  disconnected: { color: colors.red },
  miniStats: { alignItems: "flex-end" },
  timer: { color: colors.orangeDark, fontFamily: fonts.extrabold, fontSize: 12 },
  earn: { color: colors.green, fontFamily: fonts.extrabold, fontSize: 12 },
  endBtn: { backgroundColor: "#FFF1F1", borderRadius: 12, paddingHorizontal: 11, paddingVertical: 9 },
  endText: { color: colors.red, fontFamily: fonts.extrabold, fontSize: 12 },
  kundli: { backgroundColor: colors.goldSoft, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  kundliTitle: { color: colors.orangeDark, fontFamily: fonts.extrabold, fontSize: 12 },
  kundliText: { color: colors.ink, fontSize: 12, marginTop: 2 },
  messages: { padding: 14, gap: 10 },
  bubbleRow: { flexDirection: "row", gap: 8, alignItems: "flex-end", marginVertical: 4 },
  bubbleRowMe: { justifyContent: "flex-end" },
  smallAvatar: { width: 32, height: 32, borderRadius: 12, backgroundColor: colors.goldSoft, alignItems: "center", justifyContent: "center" },
  smallAvatarText: { color: colors.orangeDark, fontFamily: fonts.extrabold },
  bubble: { maxWidth: "78%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  themBubble: { backgroundColor: colors.white, borderBottomLeftRadius: 5 },
  meBubble: { backgroundColor: colors.orange, borderBottomRightRadius: 5 },
  bubbleText: { color: colors.ink, fontSize: 15, lineHeight: 21 },
  meText: { color: colors.white },
  bubbleTime: { alignSelf: "flex-end", color: colors.muted, fontSize: 10, marginTop: 5 },
  meTime: { color: "#FFE9CA" },
  imageMessage: { width: 220, height: 220, borderRadius: 14, backgroundColor: "#F3F4F6" },
  typing: { backgroundColor: colors.white, borderRadius: 18, borderBottomLeftRadius: 5, paddingHorizontal: 14, paddingVertical: 10 },
  typingText: { color: colors.muted, fontStyle: "italic" },
  ended: { textAlign: "center", color: colors.muted, fontFamily: fonts.bold, marginVertical: 16 },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 10, padding: 12, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, maxHeight: 120, backgroundColor: "#FFFDF8", borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 12, color: colors.ink, fontSize: 15 },
  send: { width: 48, height: 48, borderRadius: 18, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center" },
  sendDisabled: { opacity: 0.45 },
});
