import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { api } from "@/src/api";
import { Skeleton } from "@/src/Skeleton";
import { colors, fonts } from "@/src/ui";

type ChatSession = {
  id: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  totalCost: number;
  astrologer: { name: string; speciality: string | null; ratePerMin: number };
};

export default function OrdersScreen() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ sessions: ChatSession[] }>("/api/mobile/chats")
      .then((data) => setSessions(data.sessions || []))
      .catch(() => Alert.alert("Could not load order history"))
      .finally(() => setLoading(false));
  }, []);

  const spent = useMemo(() => sessions.reduce((sum, item) => sum + Number(item.totalCost || 0), 0), [sessions]);

  return (
    <SafeAreaView style={styles.screen}>
      <Header title="Order History" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summary}>
          <View>
            <Text style={styles.kicker}>CONSULTATIONS</Text>
            <Text style={styles.big}>{sessions.length}</Text>
          </View>
          <View style={styles.divider} />
          <View>
            <Text style={styles.kicker}>TOTAL SPENT</Text>
            <Text style={[styles.big, styles.spent]}>₹{spent.toFixed(0)}</Text>
          </View>
        </View>
        {loading ? [0, 1, 2].map((item) => <Skeleton key={item} width="100%" height={92} radius={20} />) : sessions.length ? (
          sessions.map((item) => <OrderCard key={item.id} item={item} />)
        ) : (
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={42} color={colors.orange} />
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptyText}>Your completed consultation sessions will appear here.</Text>
            <Pressable style={styles.primary} onPress={() => router.push("/(tabs)/chats")}><Text style={styles.primaryText}>Start a chat</Text></Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function OrderCard({ item }: { item: ChatSession }) {
  return (
    <View style={styles.card}>
      <View style={styles.orderIcon}><Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.orangeDark} /></View>
      <View style={styles.copy}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>{item.astrologer.name}</Text>
          <Text style={styles.cost}>₹{Number(item.totalCost || 0).toFixed(0)}</Text>
        </View>
        <Text style={styles.meta} numberOfLines={1}>{item.astrologer.speciality || "Astrology"} · {duration(item.startedAt, item.endedAt)}</Text>
        <Text style={styles.date}>{formatDate(item.startedAt)} · {label(item.status)}</Text>
      </View>
    </View>
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

function duration(start: string, end: string | null) {
  if (!end) return "In progress";
  const mins = Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
  return `${mins} min${mins !== 1 ? "s" : ""}`;
}

function label(status: string) {
  return status === "ACTIVE" || status === "PENDING" ? "In progress" : "Completed";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: 16, paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 12 : 14, paddingBottom: 14, backgroundColor: "#FFFEFC", borderBottomWidth: 1, borderBottomColor: "#F0E6D7", flexDirection: "row", alignItems: "center", gap: 10 },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: fonts.extrabold, color: colors.ink, fontSize: 21 },
  content: { padding: 16, gap: 10, paddingBottom: 30 },
  summary: { borderRadius: 24, padding: 18, backgroundColor: "#FFF6D8", borderWidth: 1, borderColor: "#EBC75F", flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  kicker: { fontFamily: fonts.extrabold, color: colors.orangeDark, fontSize: 10, letterSpacing: 1.1 },
  big: { fontFamily: fonts.extrabold, color: colors.ink, fontSize: 28, marginTop: 3 },
  spent: { color: colors.red },
  divider: { width: 1, height: 44, backgroundColor: "rgba(120,84,24,.18)" },
  card: { borderRadius: 20, backgroundColor: "#FFFEFC", borderWidth: 1, borderColor: "#EFE5D4", padding: 13, flexDirection: "row", alignItems: "center", gap: 12 },
  orderIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: "#FFF2D6", alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, minWidth: 0 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  name: { flex: 1, fontFamily: fonts.extrabold, color: colors.ink, fontSize: 15.5 },
  cost: { fontFamily: fonts.extrabold, color: colors.red, fontSize: 14.5 },
  meta: { fontFamily: fonts.medium, color: colors.muted, fontSize: 12.3, marginTop: 4 },
  date: { fontFamily: fonts.regular, color: "#8A8277", fontSize: 11.5, marginTop: 5 },
  empty: { minHeight: 350, justifyContent: "center", alignItems: "center", padding: 24 },
  emptyTitle: { fontFamily: fonts.extrabold, color: colors.ink, fontSize: 22, marginTop: 13 },
  emptyText: { fontFamily: fonts.regular, color: colors.muted, textAlign: "center", lineHeight: 20, marginTop: 6, marginBottom: 8 },
  primary: { marginTop: 8, borderRadius: 17, backgroundColor: colors.gold, paddingVertical: 14, paddingHorizontal: 22, alignItems: "center" },
  primaryText: { fontFamily: fonts.extrabold, color: "#1A1040", fontSize: 14 },
});
