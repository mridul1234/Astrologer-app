import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, ImageBackground, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import RazorpayCheckout from "react-native-razorpay";
import { router } from "expo-router";
import { api } from "@/src/api";
import { AppHeader } from "@/src/AppHeader";
import { AstrologerCardSkeleton } from "@/src/Skeleton";
import { usePendingChat } from "@/src/pending-chat";
import { useSession } from "@/src/session";
import { useFocusSkeleton } from "@/src/useFocusSkeleton";
import { colors, fonts } from "@/src/ui";

type Astrologer = {
  id: string;
  speciality: string | null;
  categories: string[];
  languages: string;
  ratePerMin: number;
  isOnline: boolean;
  isBusy: boolean;
  averageRating: number;
  reviewCount: number;
  orderCount: number;
  experienceYears: number;
  profileImage?: string | null;
  user: { name: string };
};

const filters = [
  { label: "Filter", icon: "options-outline" },
  { label: "All", icon: "sparkles-outline" },
  { label: "Love", icon: "heart-outline" },
  { label: "Education", icon: "school-outline" },
  { label: "Career", icon: "briefcase-outline" },
  { label: "Marriage", icon: "rose-outline" },
] as const;

export default function ChatsScreen() {
  const { user, refresh } = useSession();
  const { beginPendingChat } = usePendingChat();
  const focusSkeleton = useFocusSkeleton();
  const [astrologers, setAstrologers] = useState<Astrologer[]>([]);
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Astrologer | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const load = async () => {
    try {
      setAstrologers(await api<Astrologer[]>("/api/astrologers"));
    } catch (error) {
      Alert.alert("Couldn't load astrologers", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const displayed = useMemo(
    () =>
      astrologers
        .filter((astrologer) => {
          const text = [astrologer.user.name, astrologer.speciality || "", astrologer.categories.join(" ")]
            .join(" ")
            .toLowerCase();
          return category === "All" || category === "Filter" || text.includes(category.toLowerCase());
        })
        .sort((a, b) => Number(b.isOnline) - Number(a.isOnline) || b.averageRating - a.averageRating),
    [astrologers, category],
  );

  const start = async (astrologer: Astrologer, bypass = false) => {
    if (!astrologer.isOnline || astrologer.isBusy) return;
    if (!bypass && !user?.introOfferUsed) {
      setSelected(astrologer);
      return;
    }
    setStartingId(astrologer.id);
    try {
      const session = await api<{ sessionId: string }>("/api/chat/start", {
        method: "POST",
        body: JSON.stringify({ astrologerId: astrologer.id }),
      });
      beginPendingChat({
        sessionId: session.sessionId,
        astrologerName: astrologer.user.name,
        profileImage: astrologer.profileImage,
      });
    } catch (error: any) {
      if (error.status === 402 && error.body?.introOfferAvailable && !bypass) setSelected(astrologer);
      else if (error.status === 402) router.push("/(tabs)/wallet");
      else Alert.alert("Couldn't start chat", error.message || "Please try again.");
    } finally {
      setStartingId(null);
    }
  };

  const unlock = async () => {
    if (!selected || paying) return;
    try {
      setPaying(true);
      const order = await api<any>("/api/user/wallet/create-order", {
        method: "POST",
        body: JSON.stringify({ amount: 1, purpose: "INTRO_CHAT_PASS" }),
      });
      const payment: any = await RazorpayCheckout.open({
        key: order.keyId,
        amount: order.amount * 100,
        currency: order.currency,
        name: "AstroWalla",
        description: "3-minute intro chat pass",
        order_id: order.orderId,
        theme: { color: colors.orange },
      });
      await api("/api/user/wallet/verify", { method: "POST", body: JSON.stringify(payment) });
      const astrologer = selected;
      setSelected(null);
      await refresh();
      void start(astrologer, true);
    } catch (error: any) {
      if (error?.code !== 0) Alert.alert("Payment couldn't be completed", error?.message || "Please try again.");
    } finally {
      setPaying(false);
    }
  };

  const online = displayed.filter((item) => item.isOnline && !item.isBusy).length;
  const firstAvailable = astrologers.find((item) => item.isOnline && !item.isBusy);

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader />
      <FlatList
        data={focusSkeleton ? [] : displayed}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <View style={styles.bannerWrap}>
              <Pressable style={({ pressed }) => [styles.banner, pressed && styles.bannerPressed]} onPress={() => (firstAvailable ? void start(firstAvailable) : router.push("/(tabs)/wallet"))}>
                <ImageBackground source={require("../../assets/chats-banner.png")} style={styles.bannerImage} resizeMode="cover" />
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {filters.map((item) => (
                <Pressable
                  key={item.label}
                  onPress={() => setCategory(item.label)}
                  style={[styles.chip, category === item.label && styles.chipActive]}
                >
                  <Ionicons name={item.icon} size={15} color={category === item.label ? "#8A5200" : colors.muted} />
                  <Text style={[styles.chipText, category === item.label && styles.chipTextActive]}>{item.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.compactInfo}>
              <Text style={styles.compactTitle}>Chat with astrologers</Text>
              <Text style={styles.compactSub}>{online} online now</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          loading || focusSkeleton ? (
            <View style={styles.skeletonList}>
              {[0, 1, 2, 3].map((item) => <AstrologerCardSkeleton key={item} />)}
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="telescope-outline" size={42} color={colors.orange} />
              <Text style={styles.emptyTitle}>No guides found</Text>
              <Text style={styles.emptyText}>Try another speciality.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <AstrologerCard
            astrologer={item}
            loading={startingId === item.id}
            introLocked={!user?.introOfferUsed}
            introMinutesLeft={user?.freeMinutesLeft || 0}
            onChat={() => void start(item)}
          />
        )}
      />

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.overlay}>
          <View style={styles.paywall}>
            <View style={styles.paywallIcon}>
              <Ionicons name="sparkles" size={27} color="#8B5100" />
            </View>
            <Text style={styles.paywallTitle}>Start with a little magic</Text>
            <Text style={styles.paywallText}>Pay ₹1 once to unlock your first 3 minutes. After that, normal wallet billing starts based on the astrologer's per-minute price.</Text>
            <Pressable
              disabled={paying}
              style={({ pressed }) => [styles.paywallButton, (pressed || paying) && styles.paywallButtonPressed, paying && styles.paywallButtonDisabled]}
              onPress={() => void unlock()}
            >
              {paying && <ActivityIndicator size="small" color="white" />}
              <Text style={styles.paywallButtonText}>{paying ? "Opening payment..." : "Pay ₹1 and unlock chat"}</Text>
            </Pressable>
            <Pressable onPress={() => setSelected(null)}>
              <Text style={styles.notNow}>Not now</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function AstrologerCard({
  astrologer,
  loading,
  introLocked,
  introMinutesLeft,
  onChat,
}: {
  astrologer: Astrologer;
  loading: boolean;
  introLocked: boolean;
  introMinutesLeft: number;
  onChat: () => void;
}) {
  const available = astrologer.isOnline && !astrologer.isBusy;
  const speciality = astrologer.speciality || astrologer.categories.slice(0, 2).join(", ") || "Vedic Astrology";
  const orders = astrologer.orderCount > 0 ? `${astrologer.orderCount.toLocaleString("en-IN")} orders` : "New";
  const rating = astrologer.reviewCount > 0 && astrologer.averageRating > 0 ? astrologer.averageRating.toFixed(1) : "New";
  const cta = loading
    ? "Starting..."
    : !available
      ? astrologer.isBusy ? "Busy" : "Offline"
      : introLocked
        ? "Pay ₹1"
        : introMinutesLeft > 0
          ? `${introMinutesLeft}m left`
          : "Chat";

  return (
    <View style={styles.card}>
      {available && (
        <View style={styles.topRibbon}>
          <Text style={styles.topRibbonText}>TOP</Text>
        </View>
      )}
      <View style={styles.cardTop}>
        <View style={styles.photoColumn}>
          {astrologer.profileImage ? (
            <Image source={{ uri: astrologer.profileImage }} style={styles.photo} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{astrologer.user.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          {available && <View style={styles.onlineDot} />}
          <Text style={styles.starsText}>{rating === "New" ? "New" : `★ ${rating}`}</Text>
          <Text style={styles.orders}>{orders}</Text>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.name} numberOfLines={1}>{astrologer.user.name}</Text>
          <Text style={styles.speciality} numberOfLines={1}>{speciality}</Text>
          <Text style={styles.languages} numberOfLines={1}>{astrologer.languages || "English, Hindi"}</Text>
          <Text style={styles.exp}>Exp- {astrologer.experienceYears || 1} Years</Text>
          <View style={styles.priceRow}>
            <Text style={styles.rate}>₹ {astrologer.ratePerMin}<Text style={styles.perMin}>/min</Text></Text>
          </View>
        </View>

        <View style={styles.rightColumn}>
          <View style={[styles.statusDot, available ? styles.statusDotOnline : styles.statusDotOffline]} />
          <Pressable
            disabled={!available || loading}
            onPress={onChat}
            style={({ pressed }) => [styles.chatButton, pressed && styles.chatButtonPressed, (!available || loading) && styles.chatDisabled]}
          >
            <Text style={[styles.chatButtonText, (!available || loading) && styles.chatDisabledText]}>
              {cta}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Ionicons name="ribbon-outline" size={12} color="#B7B0A4" />
        <Text style={styles.footerText}>
          {introLocked ? "₹1 unlock required for first 3 minutes" : introMinutesLeft > 0 ? "Intro minutes active — wallet billing starts after this" : `Wallet billing: ₹${astrologer.ratePerMin}/min`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F1F4F7" },
  list: { paddingBottom: 18 },
  bannerWrap: { backgroundColor: "#F1F4F7", paddingTop: 0, paddingBottom: 12 },
  banner: { height: 138, overflow: "hidden", backgroundColor: "#211044" },
  bannerPressed: { opacity: 0.94 },
  bannerImage: { width: "100%", height: "100%" },
  chips: { paddingHorizontal: 22, paddingVertical: 8, gap: 10, backgroundColor: "#F1F4F7", borderTopWidth: 0, borderBottomWidth: 0 },
  chip: {
    height: 45,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E4E0DA",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  chipActive: { borderColor: "#E9BD39", backgroundColor: "#FFF9DD" },
  chipText: { fontFamily: fonts.bold, fontSize: 14.5, color: "#3D4652" },
  chipTextActive: { color: "#7A4300" },
  compactInfo: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 10, backgroundColor: "#F1F4F7", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  compactTitle: { fontFamily: fonts.extrabold, fontSize: 15.5, color: "#111827" },
  compactSub: { fontFamily: fonts.bold, fontSize: 12.5, color: "#24A260" },
  card: { backgroundColor: "#FFFFFF", marginHorizontal: 22, marginBottom: 18, borderWidth: 0, borderRadius: 23, overflow: "hidden", shadowColor: "#64748B", shadowOpacity: 0.08, shadowRadius: 14, elevation: 2 },
  topRibbon: { position: "absolute", left: -27, top: 14, width: 92, height: 24, backgroundColor: "#FF9D1C", alignItems: "center", justifyContent: "center", transform: [{ rotate: "-45deg" }], zIndex: 3 },
  topRibbonText: { fontFamily: fonts.extrabold, color: "white", fontSize: 10, letterSpacing: 0.6 },
  cardTop: { paddingHorizontal: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  photoColumn: { width: 78, alignItems: "center", position: "relative" },
  photo: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#EEE", borderWidth: 2, borderColor: "#F6D36E" },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#FFF0D2", borderWidth: 2, borderColor: "#F6D36E", alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: fonts.extrabold, fontSize: 23, color: colors.orangeDark },
  onlineDot: { position: "absolute", right: 7, top: 47, width: 15, height: 15, borderRadius: 8, backgroundColor: "#10B981", borderWidth: 2, borderColor: "white" },
  starsText: { marginTop: 9, fontFamily: fonts.extrabold, fontSize: 14, color: "#111827" },
  orders: { fontFamily: fonts.semibold, fontSize: 11.5, color: "#8A8A8A", marginTop: 1 },
  cardInfo: { flex: 1, minWidth: 0, alignSelf: "stretch", justifyContent: "center" },
  name: { fontFamily: fonts.extrabold, fontSize: 18, lineHeight: 22, color: "#111111" },
  speciality: { fontFamily: fonts.medium, fontSize: 13.3, color: "#6B7280", marginTop: 3 },
  languages: { fontFamily: fonts.regular, fontSize: 13.1, color: "#6B7280", marginTop: 3 },
  exp: { fontFamily: fonts.regular, fontSize: 13.1, color: "#6B7280", marginTop: 3 },
  priceRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  rate: { fontFamily: fonts.extrabold, fontSize: 14.3, color: "#C51E22" },
  perMin: { fontFamily: fonts.bold, fontSize: 12, color: "#C51E22" },
  rightColumn: { width: 76, alignSelf: "stretch", alignItems: "center", justifyContent: "space-between", paddingVertical: 1 },
  statusDot: { width: 18, height: 18, borderRadius: 9, alignSelf: "flex-end", borderWidth: 2, borderColor: "#FFFFFF" },
  statusDotOnline: { backgroundColor: "#4FC464" },
  statusDotOffline: { backgroundColor: "#D1D5DB" },
  chatButton: { borderRadius: 20, borderWidth: 1.5, borderColor: "#20A862", backgroundColor: "#FFFFFF", paddingHorizontal: 12, paddingVertical: 9, minWidth: 72, alignItems: "center" },
  chatButtonPressed: { backgroundColor: "#EAF8F0", transform: [{ scale: 0.96 }] },
  chatButtonText: { fontFamily: fonts.extrabold, fontSize: 13.5, color: "#16A060" },
  chatDisabled: { borderColor: "#D8D8D8", backgroundColor: "#F8F8F8" },
  chatDisabledText: { color: "#9BA3AE" },
  cardFooter: { borderTopWidth: 1, borderTopColor: "#E6E1DA", minHeight: 25, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#FFFEFC" },
  footerText: { fontFamily: fonts.regular, fontSize: 11, color: "#96928C" },
  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  skeletonList: { paddingTop: 2 },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  emptyText: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(30,41,59,.35)", padding: 14 },
  paywall: { backgroundColor: "#FFFEFC", borderRadius: 25, padding: 25, alignItems: "center" },
  paywallIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: "#FFF0B8", alignItems: "center", justifyContent: "center" },
  paywallTitle: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.ink, marginTop: 14 },
  paywallText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.muted, textAlign: "center", marginTop: 7 },
  paywallButton: { alignSelf: "stretch", alignItems: "center", justifyContent: "center", backgroundColor: colors.orange, borderRadius: 14, padding: 16, marginTop: 22, flexDirection: "row", gap: 8 },
  paywallButtonPressed: { opacity: 0.86, transform: [{ scale: 0.98 }] },
  paywallButtonDisabled: { opacity: 0.72 },
  paywallButtonText: { fontFamily: fonts.bold, color: "white", fontSize: 15 },
  notNow: { fontFamily: fonts.semibold, paddingTop: 16, fontSize: 13, color: colors.muted },
});
