import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Pressable, RefreshControl, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { api } from "@/src/api";
import { useSession } from "@/src/session";
import { colors, fonts, shadow } from "@/src/ui";
import type { AstrologerProfile, ChatSession } from "@/src/types";

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function DashboardScreen() {
  const { profile, refresh } = useSession();
  const [data, setData] = useState<AstrologerProfile | null>(profile);
  const [refreshing, setRefreshing] = useState(false);
  const [busyOnline, setBusyOnline] = useState(false);

  const load = useCallback(async () => {
    const next = await api<AstrologerProfile>("/api/astrologer/profile");
    setData(next);
  }, []);

  useEffect(() => {
    load().catch(() => {});
    const id = setInterval(() => load().catch(() => {}), 5000);
    return () => clearInterval(id);
  }, [load]);

  const active = useMemo(() => (data?.chatSessions || []).filter((s) => s.status === "ACTIVE"), [data]);
  const ended = useMemo(() => (data?.chatSessions || []).filter((s) => s.status === "ENDED"), [data]);

  async function toggleOnline() {
    if (!data) return;
    setBusyOnline(true);
    const next = !data.isOnline;
    setData({ ...data, isOnline: next });
    try {
      const updated = await api<AstrologerProfile>("/api/astrologer/profile", {
        method: "PATCH",
        body: JSON.stringify({ isOnline: next }),
      });
      setData((old) => old ? { ...old, isOnline: updated.isOnline } : old);
      await refresh();
    } catch (error) {
      setData({ ...data, isOnline: data.isOnline });
      Alert.alert("Could not update status", error instanceof Error ? error.message : "Try again");
    } finally {
      setBusyOnline(false);
    }
  }

  async function reject(sessionId: string) {
    Alert.alert("Reject chat?", "The seeker will not be charged.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          try {
            await api("/api/chat/cancel", { method: "POST", body: JSON.stringify({ sessionId }) });
            await load();
          } catch (error) {
            Alert.alert("Could not reject", error instanceof Error ? error.message : "Try again");
          }
        },
      },
    ]);
  }

  async function onRefresh() {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }

  if (!data) {
    return <View style={styles.loading}><ActivityIndicator color={colors.orange} /></View>;
  }

  const listData: Array<{ type: "active"; item: ChatSession } | { type: "history"; item: ChatSession }> = [
    ...active.map((item) => ({ type: "active" as const, item })),
    ...ended.map((item) => ({ type: "history" as const, item })),
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={listData}
        keyExtractor={(row) => `${row.type}-${row.item.id}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.orange} />}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <View style={styles.hero}>
              <View style={styles.profileRow}>
                {data.profileImage ? <Image source={{ uri: data.profileImage }} style={styles.avatar} /> : <View style={styles.avatarFallback}><Text style={styles.avatarText}>{data.user.name[0]}</Text></View>}
                <View style={styles.profileText}>
                  <Text style={styles.greeting}>Namaste</Text>
                  <Text style={styles.name}>{data.user.name}</Text>
                </View>
                <Pressable style={[styles.onlinePill, data.isOnline && styles.onlinePillOn]} onPress={toggleOnline} disabled={busyOnline}>
                  <View style={[styles.dot, data.isOnline && styles.dotOn]} />
                  <Text style={[styles.onlineText, data.isOnline && styles.onlineTextOn]}>{data.isOnline ? "Online" : "Offline"}</Text>
                </Pressable>
              </View>
              <View style={styles.statsGrid}>
                <Stat label="Today" value={`₹${Math.round(data.todaysEarnings || 0)}`} icon="today-outline" color={colors.green} />
                <Stat label="Total" value={`₹${Math.round(data.totalEarnings || 0)}`} icon="cash-outline" color={colors.orange} />
                <Stat label="Rating" value={data.avgRating ? data.avgRating.toFixed(1) : "-"} icon="star-outline" color={colors.gold} />
              </View>
            </View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{active.length ? "Incoming Chats" : "Recent Consults"}</Text>
              {active.length > 0 && <Text style={styles.liveBadge}>{active.length} LIVE</Text>}
            </View>
            {listData.length === 0 && (
              <View style={styles.emptyCard}>
                <Ionicons name="moon-outline" size={42} color={colors.gold} />
                <Text style={styles.emptyTitle}>The queue is quiet</Text>
                <Text style={styles.emptyText}>Stay online to receive chat requests from seekers.</Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => item.type === "active" ? (
          <ActiveSession item={item.item} onJoin={() => router.push(`/chat/${item.item.id}`)} onReject={() => reject(item.item.id)} />
        ) : (
          <HistorySession item={item.item} />
        )}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

function Stat({ label, value, icon, color }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; color: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={19} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActiveSession({ item, onJoin, onReject }: { item: ChatSession; onJoin: () => void; onReject: () => void }) {
  return (
    <View style={[styles.sessionCard, styles.activeCard]}>
      <View style={styles.sessionTop}>
        <View style={styles.initial}><Text style={styles.initialText}>{(item.user?.name || "U")[0]}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sessionName}>{item.user?.name || "User"}</Text>
          <Text style={styles.sessionMeta}>Started {timeLabel(item.startedAt)}</Text>
        </View>
        <View style={styles.pulseBadge}><Text style={styles.pulseText}>WAITING</Text></View>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.rejectBtn} onPress={onReject}><Text style={styles.rejectText}>Reject</Text></Pressable>
        <Pressable style={styles.joinBtn} onPress={onJoin}><Text style={styles.joinText}>Join Chat</Text></Pressable>
      </View>
    </View>
  );
}

function HistorySession({ item }: { item: ChatSession }) {
  return (
    <View style={styles.sessionCard}>
      <View style={styles.sessionTop}>
        <View style={styles.initialMuted}><Text style={styles.initialMutedText}>{(item.user?.name || "U")[0]}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sessionName}>{item.user?.name || "User"}</Text>
          <Text style={styles.sessionMeta}>{dateLabel(item.startedAt)} at {timeLabel(item.startedAt)}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.earned}>+₹{Math.round(item.astrologerEarnings ?? item.totalCost ?? 0)}</Text>
          <Text style={styles.earnedLabel}>earned</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream },
  list: { paddingBottom: 24 },
  headerWrap: { padding: 16, paddingBottom: 4 },
  hero: { backgroundColor: colors.white, borderRadius: 26, padding: 16, borderWidth: 1, borderColor: colors.border, ...shadow },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 56, height: 56, borderRadius: 20, backgroundColor: colors.goldSoft },
  avatarFallback: { width: 56, height: 56, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  avatarText: { fontSize: 22, fontFamily: fonts.extrabold, color: colors.purple },
  profileText: { flex: 1 },
  greeting: { color: colors.orangeDark, fontSize: 12, fontFamily: fonts.extrabold, letterSpacing: 1 },
  name: { color: colors.ink, fontSize: 22, fontFamily: fonts.extrabold },
  onlinePill: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 18, backgroundColor: "#F4F4F5" },
  onlinePillOn: { backgroundColor: colors.greenSoft },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#9CA3AF" },
  dotOn: { backgroundColor: colors.green },
  onlineText: { fontSize: 12, color: colors.muted, fontFamily: fonts.extrabold },
  onlineTextOn: { color: colors.green },
  statsGrid: { flexDirection: "row", gap: 10, marginTop: 16 },
  stat: { flex: 1, borderRadius: 18, backgroundColor: "#FFFDF8", borderWidth: 1, borderColor: colors.border, padding: 12 },
  statValue: { marginTop: 6, fontSize: 19, fontFamily: fonts.extrabold },
  statLabel: { color: colors.muted, fontSize: 11, fontFamily: fonts.bold, marginTop: 2 },
  sectionHeader: { marginTop: 20, marginBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 18, color: colors.ink, fontFamily: fonts.extrabold },
  liveBadge: { backgroundColor: colors.greenSoft, color: colors.green, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, overflow: "hidden", fontSize: 11, fontFamily: fonts.extrabold },
  emptyCard: { alignItems: "center", backgroundColor: colors.white, borderRadius: 24, padding: 32, borderWidth: 1, borderColor: colors.border },
  emptyTitle: { color: colors.ink, fontSize: 18, fontFamily: fonts.extrabold, marginTop: 12 },
  emptyText: { color: colors.muted, textAlign: "center", marginTop: 6, lineHeight: 20 },
  sessionCard: { marginHorizontal: 16, marginTop: 10, backgroundColor: colors.white, borderRadius: 22, padding: 14, borderWidth: 1, borderColor: colors.border, ...shadow },
  activeCard: { borderColor: "#B9F4DA", backgroundColor: "#FBFFFD" },
  sessionTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  initial: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.greenSoft, alignItems: "center", justifyContent: "center" },
  initialText: { color: colors.green, fontFamily: fonts.extrabold, fontSize: 18 },
  initialMuted: { width: 44, height: 44, borderRadius: 15, backgroundColor: "#F5F5F4", alignItems: "center", justifyContent: "center" },
  initialMutedText: { color: colors.muted, fontFamily: fonts.extrabold, fontSize: 16 },
  sessionName: { color: colors.ink, fontFamily: fonts.extrabold, fontSize: 16 },
  sessionMeta: { color: colors.muted, fontSize: 12, marginTop: 3 },
  pulseBadge: { backgroundColor: colors.green, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 },
  pulseText: { color: colors.white, fontSize: 10, fontFamily: fonts.extrabold },
  actions: { flexDirection: "row", gap: 10, marginTop: 14 },
  rejectBtn: { flex: 1, alignItems: "center", padding: 13, borderRadius: 15, backgroundColor: "#FFF1F1" },
  rejectText: { color: colors.red, fontFamily: fonts.extrabold },
  joinBtn: { flex: 2, alignItems: "center", padding: 13, borderRadius: 15, backgroundColor: colors.orange },
  joinText: { color: colors.white, fontFamily: fonts.extrabold },
  earned: { color: colors.green, fontFamily: fonts.extrabold, fontSize: 16 },
  earnedLabel: { color: colors.muted, textTransform: "uppercase", fontSize: 9, fontFamily: fonts.extrabold },
});
