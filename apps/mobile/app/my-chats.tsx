import { useEffect, useState } from "react";
import { Alert, Image, Pressable, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { api } from "@/src/api";
import { Skeleton } from "@/src/Skeleton";
import { colors, fonts } from "@/src/ui";

type ChatSession = {
  id: string;
  status: string;
  startedAt: string;
  totalCost: number;
  astrologer: { name: string; speciality: string | null; profileImage?: string | null; ratePerMin: number };
  lastMessage: { content?: string; createdAt?: string } | null;
};

export default function MyChatsScreen() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ sessions: ChatSession[] }>("/api/mobile/chats")
      .then((data) => setSessions(data.sessions || []))
      .catch(() => Alert.alert("Could not load chats"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <Header title="My Chats" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? [0, 1, 2].map((item) => <Skeleton key={item} width="100%" height={94} radius={20} />) : sessions.length ? (
          sessions.map((item) => <ChatCard key={item.id} item={item} />)
        ) : (
          <Empty icon="chatbubbles-outline" title="No chats yet" text="Your conversations with astrologers will show here." action="Find astrologers" route="/(tabs)/chats" />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ChatCard({ item }: { item: ChatSession }) {
  const canOpen = item.status === "ACTIVE" || item.status === "PENDING";
  return (
    <Pressable style={styles.card} onPress={() => canOpen && router.push(`/chat/${item.id}`)}>
      {item.astrologer.profileImage ? <Image source={{ uri: item.astrologer.profileImage }} style={styles.photo} /> : <View style={styles.avatar}><Text style={styles.initial}>{item.astrologer.name[0]}</Text></View>}
      <View style={styles.copy}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>{item.astrologer.name}</Text>
          <Status status={item.status} />
        </View>
        <Text style={styles.meta} numberOfLines={1}>{item.astrologer.speciality || "Vedic Astrology"} · ₹{item.astrologer.ratePerMin}/min</Text>
        <Text style={styles.preview} numberOfLines={1}>{item.lastMessage?.content || `Started ${formatDate(item.startedAt)}`}</Text>
      </View>
    </Pressable>
  );
}

function Header({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <Pressable style={styles.back} onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={colors.ink} /></Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

function Status({ status }: { status: string }) {
  const active = status === "ACTIVE" || status === "PENDING";
  return <Text style={[styles.status, active && styles.statusActive]}>{active ? "Open" : "Done"}</Text>;
}

function Empty({ icon, title, text, action, route }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string; action: string; route: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={42} color={colors.orange} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
      <Pressable style={styles.primary} onPress={() => router.push(route as any)}><Text style={styles.primaryText}>{action}</Text></Pressable>
    </View>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: 16, paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 12 : 14, paddingBottom: 14, backgroundColor: "#FFFEFC", borderBottomWidth: 1, borderBottomColor: "#F0E6D7", flexDirection: "row", alignItems: "center", gap: 10 },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: fonts.extrabold, color: colors.ink, fontSize: 21 },
  content: { padding: 16, gap: 10, paddingBottom: 30 },
  card: { borderRadius: 20, backgroundColor: "#FFFEFC", borderWidth: 1, borderColor: "#EFE5D4", padding: 13, flexDirection: "row", alignItems: "center", gap: 12 },
  photo: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#EEE" },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#FFF0D2", borderWidth: 1, borderColor: "#EAD393", alignItems: "center", justifyContent: "center" },
  initial: { fontFamily: fonts.extrabold, color: colors.orangeDark, fontSize: 22 },
  copy: { flex: 1, minWidth: 0 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  name: { flex: 1, fontFamily: fonts.extrabold, color: colors.ink, fontSize: 16 },
  meta: { fontFamily: fonts.medium, color: colors.muted, fontSize: 12.3, marginTop: 3 },
  preview: { fontFamily: fonts.regular, color: "#8A8277", fontSize: 12.2, marginTop: 6 },
  status: { fontFamily: fonts.bold, color: colors.muted, fontSize: 10.5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: "#F3F1EC" },
  statusActive: { color: colors.green, backgroundColor: "#EAF8F0" },
  empty: { minHeight: 430, justifyContent: "center", alignItems: "center", padding: 24 },
  emptyTitle: { fontFamily: fonts.extrabold, color: colors.ink, fontSize: 22, marginTop: 13 },
  emptyText: { fontFamily: fonts.regular, color: colors.muted, textAlign: "center", lineHeight: 20, marginTop: 6, marginBottom: 8 },
  primary: { marginTop: 8, borderRadius: 17, backgroundColor: colors.gold, paddingVertical: 14, paddingHorizontal: 22, alignItems: "center" },
  primaryText: { fontFamily: fonts.extrabold, color: "#1A1040", fontSize: 14 },
});
