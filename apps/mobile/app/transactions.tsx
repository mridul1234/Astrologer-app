import { useEffect, useState } from "react";
import { Alert, Pressable, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { api } from "@/src/api";
import { Skeleton } from "@/src/Skeleton";
import { colors, fonts } from "@/src/ui";

type Transaction = { id: string; amount: number; type: string; reason: string | null; createdAt: string };

export default function TransactionsScreen() {
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    api<{ transactions: Transaction[] }>("/api/mobile/transactions")
      .then((data) => {
        setLoadError(false);
        setItems((data.transactions || []).filter((item) => Math.abs(item.amount) > 0));
      })
      .catch(() => {
        setLoadError(true);
        Alert.alert("Could not load transactions");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <Header title="Wallet Transactions" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? [0, 1, 2, 3].map((item) => <Skeleton key={item} width="100%" height={76} radius={18} />) : loadError ? (
          <Empty error />
        ) : items.length ? (
          items.map((item) => <TransactionRow key={item.id} item={item} />)
        ) : (
          <Empty />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TransactionRow({ item }: { item: Transaction }) {
  const credit = item.type === "CREDIT";
  return (
    <View style={styles.card}>
      <View style={[styles.icon, credit ? styles.iconCredit : styles.iconDebit]}>
        <Ionicons name={credit ? "arrow-down" : "arrow-up"} size={18} color={credit ? colors.green : colors.red} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.reason} numberOfLines={1}>{item.reason || (credit ? "Wallet credited" : "Wallet debited")}</Text>
        <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={[styles.amount, credit ? styles.credit : styles.debit]}>{credit ? "+" : "-"}₹{Math.abs(item.amount).toFixed(0)}</Text>
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

function Empty({ error = false }: { error?: boolean }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="receipt-outline" size={42} color={colors.orange} />
      <Text style={styles.emptyTitle}>{error ? "Could not load transactions" : "No transactions yet"}</Text>
      <Text style={styles.emptyText}>{error ? "Check your connection and try opening this page again." : "Your wallet recharges and chat deductions will appear here."}</Text>
      <Pressable style={styles.primary} onPress={() => error ? router.replace("/transactions") : router.push("/(tabs)/wallet")}><Text style={styles.primaryText}>{error ? "Try again" : "Recharge wallet"}</Text></Pressable>
    </View>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: 16, paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 12 : 14, paddingBottom: 14, backgroundColor: "#FFFEFC", borderBottomWidth: 1, borderBottomColor: "#F0E6D7", flexDirection: "row", alignItems: "center", gap: 10 },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: fonts.extrabold, color: colors.ink, fontSize: 21 },
  content: { padding: 16, gap: 9, paddingBottom: 30 },
  card: { borderRadius: 18, backgroundColor: "#FFFEFC", borderWidth: 1, borderColor: "#EFE5D4", padding: 13, flexDirection: "row", alignItems: "center", gap: 11 },
  icon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  iconCredit: { backgroundColor: "#EAF8F0" },
  iconDebit: { backgroundColor: "#FFF1F1" },
  copy: { flex: 1, minWidth: 0 },
  reason: { fontFamily: fonts.bold, color: colors.ink, fontSize: 14 },
  date: { fontFamily: fonts.regular, color: colors.muted, fontSize: 11.5, marginTop: 3 },
  amount: { fontFamily: fonts.extrabold, fontSize: 15 },
  credit: { color: colors.green },
  debit: { color: colors.red },
  empty: { minHeight: 430, justifyContent: "center", alignItems: "center", padding: 24 },
  emptyTitle: { fontFamily: fonts.extrabold, color: colors.ink, fontSize: 22, marginTop: 13 },
  emptyText: { fontFamily: fonts.regular, color: colors.muted, textAlign: "center", lineHeight: 20, marginTop: 6, marginBottom: 8 },
  primary: { marginTop: 8, borderRadius: 17, backgroundColor: colors.gold, paddingVertical: 14, paddingHorizontal: 22, alignItems: "center" },
  primaryText: { fontFamily: fonts.extrabold, color: "#1A1040", fontSize: 14 },
});
