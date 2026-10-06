import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/src/api";
import { colors } from "@/src/ui";

type Block = { id: string; blocked: { id: string; name: string } };
export default function BlockedUsers() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const load = async () => {
    try { setBlocks(await api<Block[]>("/api/user/blocks")); }
    catch (error) { Alert.alert("Could not load blocks", error instanceof Error ? error.message : "Try again"); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const unblock = (block: Block) => Alert.alert(`Unblock ${block.blocked.name}?`, "You can start a new consultation after unblocking. Ended sessions will not restart automatically.", [
    { text: "Cancel", style: "cancel" }, { text: "Unblock", onPress: async () => {
      setBusy(block.id);
      try { await api("/api/user/blocks", { method: "DELETE", body: JSON.stringify({ blockedId: block.blocked.id }) }); await load(); }
      catch (error) { Alert.alert("Could not unblock", error instanceof Error ? error.message : "Try again"); }
      finally { setBusy(null); }
    } },
  ]);
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream, paddingTop: 30 }}>
    <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 12 }}><Pressable accessibilityLabel="Back" onPress={() => router.back()}><Ionicons name="chevron-back" size={26}/></Pressable><Text style={{ fontSize: 22, fontWeight: "700" }}>Blocked users</Text></View>
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {loading ? <ActivityIndicator/> : !blocks.length ? <Text>No blocked users.</Text> : blocks.map(block => <View key={block.id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderColor: colors.border, gap: 12 }}><Text style={{ flex: 1 }}>{block.blocked.name}</Text><Pressable disabled={!!busy} onPress={() => unblock(block)} style={{ padding: 12 }}><Text style={{ color: colors.orangeDark }}>{busy === block.id ? "Unblocking..." : "Unblock"}</Text></Pressable></View>)}
    </ScrollView>
  </SafeAreaView>;
}
