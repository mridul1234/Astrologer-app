import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/src/api";
import { colors, fonts, shadow } from "@/src/ui";
import type { AstrologerProfile, Withdrawal } from "@/src/types";

function dateLabel(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function WalletScreen() {
  const [profile, setProfile] = useState<AstrologerProfile | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [amount, setAmount] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const [nextProfile, nextWithdrawals] = await Promise.all([
      api<AstrologerProfile>("/api/astrologer/profile"),
      api<{ withdrawals: Withdrawal[] }>("/api/astrologer/withdrawals"),
    ]);
    setProfile(nextProfile);
    setWithdrawals(nextWithdrawals.withdrawals || []);
  }, []);

  useEffect(() => { load().catch(() => {}); }, [load]);

  async function submit() {
    const numeric = Number(amount);
    if (!numeric || numeric < 500) return Alert.alert("Minimum withdrawal is ₹500");
    setSubmitting(true);
    try {
      await api("/api/astrologer/withdrawals", { method: "POST", body: JSON.stringify({ amount: numeric }) });
      setAmount("");
      Alert.alert("Withdrawal requested", "Your request has been sent for processing.");
      await load();
    } catch (error) {
      Alert.alert("Could not request withdrawal", error instanceof Error ? error.message : "Try again");
    } finally {
      setSubmitting(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }

  if (!profile) return <View style={styles.loading}><ActivityIndicator color={colors.orange} /></View>;

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={withdrawals}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.orange} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Wallet</Text>
            <View style={styles.balanceCard}>
              <View style={styles.balanceIcon}><Ionicons name="wallet" size={28} color={colors.green} /></View>
              <Text style={styles.balanceLabel}>Available to withdraw</Text>
              <Text style={styles.balance}>₹{Math.round(profile.balance || 0)}</Text>
              <View style={styles.form}>
                <Text style={styles.label}>Request withdrawal</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Min ₹500"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
                <Pressable style={[styles.button, (submitting || profile.balance < 500) && styles.buttonDisabled]} onPress={submit} disabled={submitting || profile.balance < 500}>
                  <Text style={styles.buttonText}>{submitting ? "Submitting..." : "Withdraw"}</Text>
                </Pressable>
              </View>
            </View>
            <Text style={styles.historyTitle}>Withdrawal History</Text>
            {withdrawals.length === 0 && <Text style={styles.empty}>No previous requests.</Text>}
          </View>
        }
        renderItem={({ item }) => <WithdrawalRow item={item} />}
        contentContainerStyle={styles.content}
      />
    </SafeAreaView>
  );
}

function WithdrawalRow({ item }: { item: Withdrawal }) {
  const color = item.status === "APPROVED" ? colors.green : item.status === "REJECTED" ? colors.red : colors.orangeDark;
  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.rowAmount}>₹{Math.round(item.amount)}</Text>
        <Text style={styles.rowDate}>{dateLabel(item.createdAt)}</Text>
      </View>
      <Text style={[styles.status, { color }]}>{item.status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream },
  content: { paddingBottom: 24 },
  header: { padding: 16 },
  title: { fontSize: 28, fontFamily: fonts.extrabold, color: colors.ink, marginBottom: 14 },
  balanceCard: { backgroundColor: colors.white, borderRadius: 26, padding: 18, borderWidth: 1, borderColor: colors.border, ...shadow },
  balanceIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.greenSoft, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  balanceLabel: { color: colors.muted, fontSize: 12, fontFamily: fonts.extrabold, textTransform: "uppercase", letterSpacing: 1 },
  balance: { color: colors.green, fontSize: 42, fontFamily: fonts.extrabold, marginTop: 4 },
  form: { marginTop: 16, padding: 14, borderRadius: 20, backgroundColor: "#FFFDF8", borderWidth: 1, borderColor: colors.border },
  label: { color: colors.orangeDark, fontSize: 12, fontFamily: fonts.extrabold, marginBottom: 8 },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, fontSize: 16, color: colors.ink },
  button: { marginTop: 10, backgroundColor: colors.orange, borderRadius: 14, padding: 15, alignItems: "center" },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.white, fontFamily: fonts.extrabold, fontSize: 15 },
  historyTitle: { color: colors.ink, fontSize: 18, fontFamily: fonts.extrabold, marginTop: 22 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 28 },
  row: { marginHorizontal: 16, marginTop: 10, backgroundColor: colors.white, borderRadius: 18, padding: 15, borderWidth: 1, borderColor: colors.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowAmount: { color: colors.ink, fontSize: 18, fontFamily: fonts.extrabold },
  rowDate: { color: colors.muted, marginTop: 3, fontSize: 12 },
  status: { fontSize: 12, fontFamily: fonts.extrabold },
});
