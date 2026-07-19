import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, ImageBackground, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import RazorpayCheckout from "react-native-razorpay";
import { api } from "@/src/api";
import { AppHeader } from "@/src/AppHeader";
import { AstrologerCardSkeleton, Skeleton, SkeletonLine } from "@/src/Skeleton";
import { usePendingChat } from "@/src/pending-chat";
import { useSession } from "@/src/session";
import { useFocusSkeleton } from "@/src/useFocusSkeleton";
import { colors, fonts } from "@/src/ui";

type Astrologer = {
  id: string;
  speciality: string | null;
  categories?: string[];
  languages?: string;
  ratePerMin: number;
  isOnline: boolean;
  isBusy: boolean;
  averageRating: number;
  reviewCount: number;
  orderCount?: number;
  experienceYears?: number;
  profileImage?: string | null;
  user: { name: string };
};

type HoroscopeItem = {
  sign: string;
  displayName: string;
  symbol: string;
  date: string;
  horoscope: string;
};

type HoroscopeResponse = {
  date: string;
  userSign: string;
  primary: HoroscopeItem;
  horoscopes: HoroscopeItem[];
};

const services = [
  { title: "Love & Marriage", desc: "Compatibility, relationship clarity and timing.", icon: "heart-outline", color: "#EF4444" },
  { title: "Career Guidance", desc: "Career changes, growth, money and business calls.", icon: "briefcase-outline", color: "#0EA5E9" },
  { title: "Free Kundli", desc: "Your personal birth chart and core placements.", icon: "sparkles-outline", color: "#7C3AED" },
  { title: "Private Chat", desc: "Talk confidentially with verified astrologers.", icon: "lock-closed-outline", color: "#10B981" },
] as const;

const trust = [
  ["Verified", "Experts"],
  ["Private", "Chats"],
  ["Instant", "Connect"],
] as const;

export default function HomeScreen() {
  const { user, refresh, loading: userLoading } = useSession();
  const { beginPendingChat } = usePendingChat();
  const focusSkeleton = useFocusSkeleton();
  const [items, setItems] = useState<Astrologer[]>([]);
  const [selected, setSelected] = useState<Astrologer | null>(null);
  const [loading, setLoading] = useState(true);
  const [horoscope, setHoroscope] = useState<HoroscopeResponse | null>(null);
  const [horoscopeLoading, setHoroscopeLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const load = async () => {
    try {
      setItems(await api<Astrologer[]>("/api/astrologers"));
    } catch {
      Alert.alert("Could not load astrologers");
    } finally {
      setLoading(false);
    }
  };

  const loadHoroscope = async () => {
    try {
      setHoroscope(await api<HoroscopeResponse>("/api/mobile/horoscope"));
    } catch {
      setHoroscope(null);
    } finally {
      setHoroscopeLoading(false);
    }
  };

  useEffect(() => {
    void load();
    void loadHoroscope();
  }, []);

  const firstName = user?.name?.split(" ")[0] || "Seeker";
  const topAstrologers = useMemo(
    () => [...items].sort((a, b) => Number(b.isOnline) - Number(a.isOnline) || (b.reviewCount || 0) - (a.reviewCount || 0)).slice(0, 5),
    [items],
  );
  const online = items.filter((item) => item.isOnline && !item.isBusy).length;

  const start = async (astro: Astrologer, bypass = false) => {
    if (!astro.isOnline || astro.isBusy) return;
    if (!bypass && !user?.introOfferUsed) {
      setSelected(astro);
      return;
    }
    setStartingId(astro.id);
    try {
      const session = await api<{ sessionId: string }>("/api/chat/start", {
        method: "POST",
        body: JSON.stringify({ astrologerId: astro.id }),
      });
      beginPendingChat({
        sessionId: session.sessionId,
        astrologerName: astro.user.name,
        profileImage: astro.profileImage,
      });
    } catch (error: any) {
      if (error.status === 402 && error.body?.introOfferAvailable && !bypass) setSelected(astro);
      else if (error.status === 402) router.push("/(tabs)/wallet");
      else Alert.alert("Could not start chat", error.message || "Please try again.");
    } finally {
      setStartingId(null);
    }
  };

  const unlock = async () => {
    if (paying) return;
    try {
      setPaying(true);
      const order = await api<any>("/api/user/wallet/create-order", {
        method: "POST",
        body: JSON.stringify({ amount: 1, purpose: "INTRO_CHAT_PASS" }),
      });
      const result: any = await RazorpayCheckout.open({
        key: order.keyId,
        amount: order.amount * 100,
        currency: order.currency,
        name: "AstroWalla",
        description: "3-minute Intro Chat Pass",
        order_id: order.orderId,
        theme: { color: colors.orange },
      });
      await api("/api/user/wallet/verify", { method: "POST", body: JSON.stringify({ ...result }) });
      const astro = selected;
      setSelected(null);
      await refresh();
      if (astro) void start(astro, true);
    } catch (error: any) {
      if (error?.code !== 0) Alert.alert("Payment could not be completed", error?.message || "Try again");
    } finally {
      setPaying(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.welcome}>
          <View>
            <Text style={styles.welcomeKicker}>Welcome back</Text>
            {userLoading || focusSkeleton ? <SkeletonLine width={120} height={20} style={styles.mt6} /> : <Text style={styles.welcomeName}>{firstName} ✨</Text>}
          </View>
          <View style={styles.stats}>
            {userLoading || focusSkeleton ? <Skeleton width={62} height={45} radius={13} /> : <MiniStat label="Balance" value={`₹${Math.floor(user?.walletBalance || 0)}`} color={colors.green} />}
            {loading || focusSkeleton ? <Skeleton width={62} height={45} radius={13} /> : <MiniStat label="Online" value={String(online)} color={colors.gold} />}
          </View>
        </View>

        <Pressable style={styles.hero} onPress={() => router.push("/(tabs)/chats")}>
          <ImageBackground source={require("../../assets/home-banner.png")} style={styles.heroImage} resizeMode="cover" />
        </Pressable>

        <DailyHoroscope data={horoscope} loading={horoscopeLoading || focusSkeleton} />

        <View style={styles.sectionRow}>
          <SectionTitle title="Top astrologers" compact />
          <Pressable onPress={() => router.push("/(tabs)/chats")}><Text style={styles.viewAll}>View all</Text></Pressable>
        </View>
        {loading || focusSkeleton ? (
          <View style={styles.astroSkeletons}>{[0, 1].map((item) => <AstrologerCardSkeleton key={item} />)}</View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.astroRow}>
            {topAstrologers.map((item) => (
              <HomeAstrologer
                key={item.id}
                astrologer={item}
                loading={startingId === item.id}
                introLocked={!user?.introOfferUsed}
                introMinutesLeft={user?.freeMinutesLeft || 0}
                onChat={() => void start(item)}
              />
            ))}
          </ScrollView>
        )}

        <SectionTitle title="AstroWalla services" />
        <View style={styles.serviceGrid}>
          {services.map((item) => (
            <View key={item.title} style={styles.serviceCard}>
              <View style={[styles.serviceIcon, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={styles.serviceCopy}>
                <Text style={styles.serviceTitle}>{item.title}</Text>
                <Text style={styles.serviceDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.trustCard}>
          <Text style={styles.trustTitle}>Why seekers choose us</Text>
          <View style={styles.trustRow}>
            {trust.map(([value, label]) => (
              <View key={label} style={styles.trustItem}>
                <Text style={styles.trustValue}>{value}</Text>
                <Text style={styles.trustLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.finalCta}>
          <Text style={styles.finalKicker}>YOUR DESTINY AWAITS</Text>
          <Text style={styles.finalTitle}>Ask what matters today</Text>
          <Text style={styles.finalText}>Love, career, marriage, health — get private guidance from verified astrologers.</Text>
          <Pressable style={styles.finalButton} onPress={() => router.push("/(tabs)/chats")}>
            <Text style={styles.finalButtonText}>Start chatting</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.overlay}>
          <View style={styles.paywall}>
            <View style={styles.offerIcon}><Text style={styles.offerNumber}>₹1</Text></View>
            <Text style={styles.offerTitle}>Start with 3 minutes</Text>
            <Text style={styles.offerBody}>Pay ₹1 once to unlock your first 3 minutes. After that, wallet billing follows the astrologer's per-minute rate.</Text>
            <Pressable disabled={paying} style={({ pressed }) => [styles.primary, (pressed || paying) && styles.primaryPressed, paying && styles.primaryDisabled]} onPress={() => void unlock()}>
              {paying && <ActivityIndicator size="small" color="white" />}
              <Text style={styles.primaryText}>{paying ? "Opening payment..." : "Pay ₹1 and unlock"}</Text>
            </Pressable>
            <Pressable onPress={() => setSelected(null)}><Text style={styles.dismiss}>Not now</Text></Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title, compact = false }: { title: string; compact?: boolean }) {
  return <Text style={[styles.sectionTitle, compact && styles.sectionCompact]}>✦ {title}</Text>;
}

function DailyHoroscope({ data, loading }: { data: HoroscopeResponse | null; loading: boolean }) {
  const [selectedHoroscope, setSelectedHoroscope] = useState<HoroscopeItem | null>(null);

  if (loading) {
    return (
      <View style={styles.horoscopeWrap}>
        <Skeleton width="100%" height={142} radius={22} />
      </View>
    );
  }

  if (!data?.primary) {
    return (
      <View style={styles.horoscopeWrap}>
        <View style={styles.horoscopeEmpty}>
          <Ionicons name="sunny-outline" size={22} color={colors.orangeDark} />
          <Text style={styles.horoscopeEmptyText}>Daily horoscope is refreshing. Check back in a moment.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.horoscopeWrap}>
      <View style={styles.horoscopeHeader}>
        <View>
          <Text style={styles.horoscopeKicker}>Daily Horoscope</Text>
          <Text style={styles.horoscopeTitle}>Your zodiac insight</Text>
        </View>
        <View style={styles.horoscopeDatePill}>
          <Ionicons name="calendar-clear-outline" size={13} color={colors.orangeDark} />
          <Text style={styles.horoscopeDateText}>{formatShortDate(data.primary.date)}</Text>
        </View>
      </View>

      <Pressable style={({ pressed }) => [styles.primaryHoroscope, pressed && styles.primaryHoroscopePressed]} onPress={() => setSelectedHoroscope(data.primary)}>
        <View style={styles.signOrb}>
          <Text style={styles.signSymbol}>{data.primary.symbol}</Text>
        </View>
        <View style={styles.primaryCopy}>
          <Text style={styles.primarySign}>{data.primary.displayName}</Text>
          <Text style={styles.primaryHoroscopeText}>Know your horoscope for today</Text>
          <View style={styles.horoscopeAction}>
            <Text style={styles.horoscopeActionText}>Read full horoscope</Text>
            <Ionicons name="chevron-forward" size={16} color="#1A1040" />
          </View>
        </View>
      </Pressable>

      <Modal visible={!!selectedHoroscope} transparent animationType="fade" onRequestClose={() => setSelectedHoroscope(null)}>
        <View style={styles.horoscopeModalOverlay}>
          <View style={styles.horoscopeModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalSignOrb}>
                <Text style={styles.modalSymbol}>{selectedHoroscope?.symbol}</Text>
              </View>
              <View style={styles.modalTitleCopy}>
                <Text style={styles.modalKicker}>Daily Horoscope</Text>
                <Text style={styles.modalTitle}>{selectedHoroscope?.displayName}</Text>
              </View>
              <Pressable style={styles.modalClose} onPress={() => setSelectedHoroscope(null)}>
                <Ionicons name="close" size={18} color={colors.muted} />
              </Pressable>
            </View>
            <Text style={styles.modalText}>{selectedHoroscope?.horoscope}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function formatShortDate(value: string) {
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Today";
  return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function HomeAstrologer({
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
    <View style={styles.astroCard}>
      {astrologer.profileImage ? (
        <Image source={{ uri: astrologer.profileImage }} style={styles.astroPhoto} />
      ) : (
        <View style={styles.astroAvatar}><Text style={styles.astroInitial}>{astrologer.user.name[0]}</Text></View>
      )}
      <Text style={styles.astroName} numberOfLines={1}>{astrologer.user.name}</Text>
      <Text style={styles.astroSpec} numberOfLines={1}>{astrologer.speciality || "Vedic Astrology"}</Text>
      <Text style={styles.astroMeta}>{astrologer.experienceYears || 1} yrs • ₹{astrologer.ratePerMin}/min</Text>
      <Pressable disabled={!available || loading} style={({ pressed }) => [styles.astroChat, pressed && styles.astroChatPressed, (!available || loading) && styles.astroChatDisabled]} onPress={onChat}>
        <Text style={[styles.astroChatText, (!available || loading) && styles.astroChatTextDisabled]}>{cta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { paddingTop: 14, paddingBottom: 28, gap: 14 },
  welcome: { marginHorizontal: 14, borderRadius: 18, padding: 14, backgroundColor: "#1A1040", borderWidth: 1, borderColor: "rgba(245,200,66,.25)", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  welcomeKicker: { fontFamily: fonts.extrabold, color: colors.gold, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase" },
  welcomeName: { fontFamily: fonts.extrabold, color: "white", fontSize: 19, marginTop: 3 },
  stats: { flexDirection: "row", gap: 7 },
  stat: { minWidth: 62, borderRadius: 13, paddingVertical: 8, paddingHorizontal: 9, backgroundColor: "rgba(255,255,255,.09)", borderWidth: 1, borderColor: "rgba(255,255,255,.12)", alignItems: "center" },
  statValue: { fontFamily: fonts.extrabold, fontSize: 14 },
  statLabel: { fontFamily: fonts.medium, color: "rgba(255,255,255,.62)", fontSize: 9, marginTop: 1, textTransform: "uppercase" },
  hero: { height: 168, overflow: "hidden", backgroundColor: "#251458" },
  heroImage: { width: "100%", height: "100%" },
  horoscopeWrap: { marginHorizontal: 14, gap: 10 },
  horoscopeSkeletonRow: { gap: 10, paddingRight: 8 },
  horoscopeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  horoscopeKicker: { fontFamily: fonts.extrabold, color: colors.orangeDark, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase" },
  horoscopeTitle: { fontFamily: fonts.extrabold, color: colors.ink, fontSize: 18, marginTop: 1 },
  horoscopeDatePill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: "#FFF3D8", borderWidth: 1, borderColor: "#EBC75F", flexDirection: "row", alignItems: "center", gap: 5 },
  horoscopeDateText: { fontFamily: fonts.extrabold, color: colors.orangeDark, fontSize: 11 },
  primaryHoroscope: { borderRadius: 22, padding: 15, backgroundColor: "#1A1040", borderWidth: 1, borderColor: "rgba(245,200,66,.28)", flexDirection: "row", gap: 13, alignItems: "flex-start" },
  primaryHoroscopePressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  signOrb: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  signSymbol: { fontFamily: fonts.extrabold, color: "#1A1040", fontSize: 31 },
  primaryCopy: { flex: 1 },
  primarySign: { fontFamily: fonts.extrabold, color: "white", fontSize: 18 },
  primaryHoroscopeText: { fontFamily: fonts.regular, color: "rgba(255,255,255,.72)", fontSize: 12.2, lineHeight: 17.5, marginTop: 5 },
  horoscopeAction: { alignSelf: "flex-start", marginTop: 12, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: colors.gold, flexDirection: "row", alignItems: "center", gap: 4 },
  horoscopeActionText: { fontFamily: fonts.extrabold, color: "#1A1040", fontSize: 11.5 },
  horoscopeRow: { gap: 10, paddingRight: 8 },
  smallHoroscope: { width: 158, minHeight: 112, borderRadius: 18, padding: 12, backgroundColor: "#FFFEFC", borderWidth: 1, borderColor: "#EFE5D4" },
  smallHoroscopePressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  smallSignRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 7 },
  smallSymbol: { fontFamily: fonts.extrabold, color: colors.orangeDark, fontSize: 18 },
  smallSign: { fontFamily: fonts.extrabold, color: colors.ink, fontSize: 13.5 },
  smallText: { fontFamily: fonts.regular, color: colors.muted, fontSize: 11, lineHeight: 15.5 },
  readFull: { fontFamily: fonts.extrabold, color: colors.orangeDark, fontSize: 11, marginTop: 8 },
  horoscopeModalOverlay: { flex: 1, backgroundColor: "rgba(17,24,39,.46)", justifyContent: "center", padding: 18 },
  horoscopeModal: { borderRadius: 24, backgroundColor: "#FFFEFC", padding: 18, borderWidth: 1, borderColor: "#EFE5D4" },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  modalSignOrb: { width: 50, height: 50, borderRadius: 18, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  modalSymbol: { fontFamily: fonts.extrabold, color: "#1A1040", fontSize: 27 },
  modalTitleCopy: { flex: 1 },
  modalKicker: { fontFamily: fonts.extrabold, color: colors.orangeDark, fontSize: 10, letterSpacing: 1.1, textTransform: "uppercase" },
  modalTitle: { fontFamily: fonts.extrabold, color: colors.ink, fontSize: 22, marginTop: 1 },
  modalClose: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#F4F1EC", alignItems: "center", justifyContent: "center" },
  modalText: { fontFamily: fonts.regular, color: colors.muted, fontSize: 15, lineHeight: 22 },
  horoscopeEmpty: { borderRadius: 18, padding: 13, backgroundColor: "#FFF3D8", borderWidth: 1, borderColor: "#EBC75F", flexDirection: "row", alignItems: "center", gap: 9 },
  horoscopeEmptyText: { flex: 1, fontFamily: fonts.bold, color: "#6B4A12", fontSize: 12, lineHeight: 17 },
  sectionTitle: { fontFamily: fonts.extrabold, color: colors.ink, fontSize: 16, marginTop: 2, marginHorizontal: 14 },
  sectionCompact: { marginTop: 0 },
  sectionRow: { marginHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  viewAll: { fontFamily: fonts.bold, color: colors.orangeDark, fontSize: 12 },
  astroSkeletons: { marginHorizontal: -18 },
  astroRow: { gap: 10, paddingHorizontal: 14, paddingRight: 22 },
  astroCard: { width: 145, borderRadius: 20, padding: 12, backgroundColor: "#FFFEFC", borderWidth: 1, borderColor: "#E9E2D7", alignItems: "center" },
  astroPhoto: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#EEE" },
  astroAvatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#FFF0D2", borderWidth: 1, borderColor: "#EAD393", alignItems: "center", justifyContent: "center" },
  astroInitial: { fontFamily: fonts.extrabold, color: colors.orangeDark, fontSize: 23 },
  astroName: { fontFamily: fonts.extrabold, color: colors.ink, fontSize: 14.5, marginTop: 8, maxWidth: "100%" },
  astroSpec: { fontFamily: fonts.medium, color: colors.muted, fontSize: 11.2, marginTop: 2, maxWidth: "100%" },
  astroMeta: { fontFamily: fonts.regular, color: colors.muted, fontSize: 10.5, marginTop: 5 },
  astroChat: { marginTop: 10, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 8, borderWidth: 1, borderColor: colors.green, backgroundColor: "#FFFEFC" },
  astroChatPressed: { backgroundColor: "#EAF8F0", transform: [{ scale: 0.96 }] },
  astroChatDisabled: { borderColor: "#D8D8D8", backgroundColor: "#F7F7F7" },
  astroChatText: { fontFamily: fonts.bold, color: "#16A060", fontSize: 12.5 },
  astroChatTextDisabled: { color: "#98A0AB" },
  serviceGrid: { marginHorizontal: 14, gap: 9 },
  serviceCard: { borderRadius: 18, padding: 13, backgroundColor: "#FFFEFC", borderWidth: 1, borderColor: "#EFE5D4", flexDirection: "row", alignItems: "center", gap: 12 },
  serviceIcon: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  serviceCopy: { flex: 1 },
  serviceTitle: { fontFamily: fonts.bold, fontSize: 13.8, color: colors.ink },
  serviceDesc: { fontFamily: fonts.regular, fontSize: 11.1, lineHeight: 15.5, color: colors.muted, marginTop: 2 },
  trustCard: { marginHorizontal: 14, borderRadius: 22, padding: 16, backgroundColor: "#FFF6D8", borderWidth: 1, borderColor: "#EBC75F" },
  trustTitle: { fontFamily: fonts.extrabold, color: "#4A3212", fontSize: 15 },
  trustRow: { flexDirection: "row", marginTop: 12, gap: 8 },
  trustItem: { flex: 1, borderRadius: 14, backgroundColor: "rgba(255,255,255,.6)", padding: 10, alignItems: "center" },
  trustValue: { fontFamily: fonts.extrabold, color: colors.orangeDark, fontSize: 13 },
  trustLabel: { fontFamily: fonts.medium, color: "#7A6646", fontSize: 10, marginTop: 1 },
  finalCta: { marginHorizontal: 14, borderRadius: 26, padding: 20, backgroundColor: "#1A1040", alignItems: "center", borderWidth: 1, borderColor: "rgba(245,200,66,.25)" },
  finalKicker: { fontFamily: fonts.extrabold, color: colors.gold, fontSize: 10, letterSpacing: 1.1 },
  finalTitle: { fontFamily: fonts.extrabold, color: "white", fontSize: 22, marginTop: 5 },
  finalText: { fontFamily: fonts.regular, color: "rgba(255,255,255,.64)", textAlign: "center", fontSize: 12, lineHeight: 17, marginTop: 5 },
  finalButton: { marginTop: 15, borderRadius: 16, backgroundColor: colors.gold, paddingHorizontal: 22, paddingVertical: 11 },
  finalButtonText: { fontFamily: fonts.bold, color: "#1A1040", fontSize: 13 },
  overlay: { flex: 1, backgroundColor: "rgba(31,41,55,.45)", justifyContent: "flex-end", padding: 16 },
  paywall: { backgroundColor: "white", borderRadius: 22, padding: 24, alignItems: "center", gap: 12 },
  offerIcon: { minWidth: 54, height: 54, borderRadius: 17, backgroundColor: "#FDE6B4", alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  offerNumber: { fontFamily: fonts.extrabold, fontSize: 21, color: colors.orangeDark },
  offerTitle: { fontFamily: fonts.extrabold, fontSize: 23, color: colors.ink },
  offerBody: { fontFamily: fonts.regular, textAlign: "center", lineHeight: 21, color: colors.muted },
  primary: { backgroundColor: colors.orange, borderRadius: 13, padding: 16, alignSelf: "stretch", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 8 },
  primaryPressed: { opacity: 0.86, transform: [{ scale: 0.98 }] },
  primaryDisabled: { opacity: 0.72 },
  primaryText: { fontFamily: fonts.bold, color: "white", fontSize: 15 },
  dismiss: { fontFamily: fonts.semibold, color: colors.muted, padding: 8 },
  mt6: { marginTop: 6 },
});
