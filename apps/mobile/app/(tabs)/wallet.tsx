import { useMemo, useState } from "react";
import { Alert, Dimensions, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import RazorpayCheckout from "react-native-razorpay";
import { api } from "@/src/api";
import { AppHeader } from "@/src/AppHeader";
import { Skeleton, SkeletonLine } from "@/src/Skeleton";
import { useSession } from "@/src/session";
import { useFocusSkeleton } from "@/src/useFocusSkeleton";
import { colors, fonts } from "@/src/ui";

const packs = [
  { amount: 10 },
  { amount: 50 },
  { amount: 100, tag: "Popular" },
  { amount: 200 },
  { amount: 500 },
  { amount: 1000 },
];

const packSize = (Dimensions.get("window").width - 36 - 20) / 3;

export default function WalletScreen() {
  const { user, refresh, loading } = useSession();
  const focusSkeleton = useFocusSkeleton();
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState("50");
  const [paying, setPaying] = useState(false);

  const amount = useMemo(() => {
    const parsed = Number(customAmount);
    return Number.isFinite(parsed) ? parsed : selectedAmount;
  }, [customAmount, selectedAmount]);

  const topup = async () => {
    const rechargeAmount = Math.floor(amount);
    if (!rechargeAmount || rechargeAmount < 10) {
      Alert.alert("Minimum recharge", "Please add at least ₹10 to continue.");
      return;
    }

    try {
      setPaying(true);
      const order = await api<any>("/api/user/wallet/create-order", {
        method: "POST",
        body: JSON.stringify({ amount: rechargeAmount }),
      });
      const response: any = await RazorpayCheckout.open({
        key: order.keyId,
        amount: order.amount * 100,
        currency: order.currency,
        name: "AstroWalla",
        description: "Wallet top-up",
        order_id: order.orderId,
        theme: { color: colors.gold },
      });
      await api("/api/user/wallet/verify", { method: "POST", body: JSON.stringify(response) });
      await refresh();
      Alert.alert("Wallet updated", `₹${rechargeAmount} added successfully.`);
    } catch (error: any) {
      if (error?.code !== 0) Alert.alert("Top-up failed", error?.message || "Please try again.");
    } finally {
      setPaying(false);
    }
  };

  const selectPack = (value: number) => {
    setSelectedAmount(value);
    setCustomAmount(String(value));
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading || focusSkeleton ? <WalletSkeleton /> : null}
        {!loading && !focusSkeleton ? (
        <>
        <View style={styles.heroCard}>
          <View>
            <Text style={styles.heroLabel}>Available Balance</Text>
            <Text style={styles.heroAmount}>₹{Math.floor(user?.walletBalance || 0)}</Text>
            <Text style={styles.heroSub}>Secure payments · Instant credit · Razorpay protected</Text>
          </View>
          <View style={styles.heroIcon}>
            <Ionicons name="shield-checkmark" size={28} color="#7A4300" />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Enter Amount here</Text>
        <View style={styles.amountRow}>
          <TextInput
            value={customAmount}
            onChangeText={(value) => setCustomAmount(value.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            style={styles.amountInput}
            placeholder="50"
            placeholderTextColor="#9CA3AF"
          />
          <View style={styles.quickAdds}>
            {[50, 100].map((quick) => (
              <Pressable key={quick} style={styles.quickButton} onPress={() => selectPack((amount || 0) + quick)}>
                <Text style={styles.quickText}>+ ₹{quick}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.offerBar}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#C47A00" />
          <Text style={styles.offerText}>You pay exactly ₹{amount || 0}. No hidden additions or deductions.</Text>
        </View>

        <View style={styles.packHeader}>
          <Text style={styles.packTitle}>Choose recharge pack</Text>
          <Text style={styles.packHint}>Up to ₹1,000</Text>
        </View>

        <View style={styles.packGrid}>
          {packs.map((pack) => {
            const active = amount === pack.amount;
            return (
              <Pressable key={pack.amount} style={[styles.pack, active && styles.packActive]} onPress={() => selectPack(pack.amount)}>
                {pack.tag ? <View style={styles.packTag}><Text style={styles.packTagText}>{pack.tag}</Text></View> : null}
                {active ? <View style={styles.selectedDot}><Ionicons name="checkmark" size={11} color="white" /></View> : null}
                <Text style={styles.packAmount}>₹{pack.amount.toLocaleString("en-IN")}</Text>
                <Text style={styles.packCaption}>Wallet credit</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.trustRow}>
          {[
            ["flash", "Instant"],
            ["lock-closed", "Secure"],
            ["card", "UPI/Cards"],
          ].map(([icon, label]) => (
            <View key={label} style={styles.trustItem}>
              <Ionicons name={`${icon}-outline` as any} size={16} color={colors.orangeDark} />
              <Text style={styles.trustText}>{label}</Text>
            </View>
          ))}
        </View>
        </>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={[styles.proceed, (paying || loading || focusSkeleton) && styles.proceedDisabled]} disabled={paying || loading || focusSkeleton} onPress={() => void topup()}>
          <Text style={styles.proceedText}>{loading || focusSkeleton ? "Loading wallet..." : paying ? "Opening payment..." : `Proceed • ₹${amount || 0}`}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function WalletSkeleton() {
  return (
    <View>
      <View style={styles.heroCard}>
        <View style={{ flex: 1 }}>
          <SkeletonLine width="44%" height={11} />
          <Skeleton width={96} height={36} radius={12} style={styles.skeletonMt10} />
          <SkeletonLine width="78%" height={12} style={styles.skeletonMt10} />
        </View>
        <Skeleton width={51} height={51} radius={18} />
      </View>
      <SkeletonLine width="48%" height={17} style={styles.skeletonTitle} />
      <Skeleton width="100%" height={50} radius={12} style={styles.skeletonMt8} />
      <Skeleton width="100%" height={42} radius={15} style={styles.skeletonMt15} />
      <View style={styles.packHeader}>
        <SkeletonLine width="45%" height={15} />
        <SkeletonLine width="30%" height={10} />
      </View>
      <View style={styles.packGrid}>
        {packs.map((pack) => <Skeleton key={pack.amount} width={packSize} height={80} radius={16} />)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFEFC" },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 112 },
  heroCard: {
    borderRadius: 24,
    padding: 15,
    backgroundColor: "#FFF7DF",
    borderWidth: 1,
    borderColor: "#ECD06D",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    overflow: "hidden",
  },
  heroLabel: { fontFamily: fonts.extrabold, fontSize: 10.8, letterSpacing: 0.9, color: colors.orangeDark, textTransform: "uppercase" },
  heroAmount: { fontFamily: fonts.extrabold, fontSize: 31, color: colors.ink, marginTop: 2 },
  heroSub: { fontFamily: fonts.regular, maxWidth: 225, fontSize: 11.5, lineHeight: 16.5, color: colors.muted, marginTop: 3 },
  heroIcon: { width: 51, height: 51, borderRadius: 18, backgroundColor: "#FFE8A6", alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontFamily: fonts.bold, marginTop: 17, fontSize: 16.5, color: colors.ink },
  amountRow: { marginTop: 8, borderBottomWidth: 1, borderBottomColor: "#CFC7BC", flexDirection: "row", alignItems: "center", gap: 10 },
  amountInput: { fontFamily: fonts.semibold, flex: 1, minHeight: 49, fontSize: 25, color: colors.ink, paddingVertical: 4 },
  quickAdds: { flexDirection: "row", gap: 8 },
  quickButton: { borderWidth: 1, borderColor: "#A8A29A", borderRadius: 11, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: "#FFFEFC" },
  quickText: { fontFamily: fonts.bold, fontSize: 13.5, color: "#5F5A54" },
  offerBar: { marginTop: 15, borderRadius: 15, paddingHorizontal: 13, paddingVertical: 12, backgroundColor: "#FFF6D8", flexDirection: "row", alignItems: "center", gap: 8 },
  offerText: { fontFamily: fonts.bold, flex: 1, fontSize: 13.5, color: "#65543B" },
  packHeader: { marginTop: 14, marginBottom: 9, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  packTitle: { fontFamily: fonts.bold, fontSize: 15.5, color: colors.ink },
  packHint: { fontFamily: fonts.medium, fontSize: 10.5, color: colors.muted },
  packGrid: { flexDirection: "row", flexWrap: "wrap", columnGap: 10, rowGap: 9 },
  pack: {
    width: packSize,
    height: 80,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E9E1D5",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6B4E16",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  packActive: { borderWidth: 2, borderColor: colors.gold, backgroundColor: "#FFFBEA", shadowOpacity: 0.14, shadowRadius: 11, elevation: 3 },
  selectedDot: { position: "absolute", top: 7, left: 7, width: 17, height: 17, borderRadius: 9, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center", zIndex: 3 },
  packTag: { position: "absolute", top: 6, right: 6, backgroundColor: colors.orange, paddingHorizontal: 6, paddingVertical: 2.5, borderRadius: 8, zIndex: 2 },
  packTagText: { fontFamily: fonts.extrabold, color: "white", fontSize: 8.5 },
  packAmount: { fontFamily: fonts.extrabold, fontSize: 17.5, color: colors.ink },
  packCaption: { marginTop: 5, fontFamily: fonts.medium, fontSize: 10.5, color: colors.muted },
  trustRow: { marginTop: 15, flexDirection: "row", gap: 7 },
  trustItem: { flex: 1, borderRadius: 13, borderWidth: 1, borderColor: "#EFE5D4", backgroundColor: "#FFFDF8", paddingVertical: 9, alignItems: "center", gap: 3 },
  trustText: { fontFamily: fonts.semibold, fontSize: 10.4, color: colors.muted },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#FFFEFC", paddingHorizontal: 16, paddingTop: 10, paddingBottom: 15, borderTopWidth: 1, borderTopColor: "#EEE8DD" },
  proceed: { height: 52, borderRadius: 16, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center", shadowColor: "#D99A00", shadowOpacity: 0.18, shadowRadius: 12, elevation: 3 },
  proceedDisabled: { opacity: 0.65 },
  proceedText: { fontFamily: fonts.extrabold, fontSize: 15.5, color: "#18140E" },
  skeletonMt8: { marginTop: 8 },
  skeletonMt10: { marginTop: 10 },
  skeletonMt15: { marginTop: 15 },
  skeletonTitle: { marginTop: 17 },
});
