import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/src/api";
import { colors } from "@/src/ui";

export function ChatSafety({ sessionId, name, messageId, onBlocked, label = false }: {
  sessionId: string; name: string; messageId?: string; onBlocked: () => void; label?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("Harassment");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const block = () => Alert.alert(`Block ${name}?`, "This ends your active consultation and prevents further messages and charges. Previously billed time is not refunded. You can unblock in Settings.", [
    { text: "Cancel", style: "cancel" }, { text: "Block", style: "destructive", onPress: async () => {
      setBusy(true);
      try { await api("/api/user/blocks", { method: "POST", body: JSON.stringify({ sessionId }) }); setVisible(false); onBlocked(); }
      catch (error) { Alert.alert("Could not block", error instanceof Error ? error.message : "Try again"); }
      finally { setBusy(false); }
    } },
  ]);
  const report = async () => {
    setBusy(true);
    try {
      await api("/api/user/reports", { method: "POST", body: JSON.stringify({ sessionId, messageId, reason, details }) });
      setVisible(false); setReporting(false); setDetails("");
      Alert.alert("Report received", "Your report was sent to the support team for review. Reporting does not end or block the chat.");
    } catch (error) { Alert.alert("Could not report", error instanceof Error ? error.message : "Try again"); }
    finally { setBusy(false); }
  };
  return <>
    <Pressable accessibilityLabel={messageId ? "Report message" : "Chat safety options"} style={styles.trigger} onPress={() => { setReporting(!!messageId); setVisible(true); }}>
      <Ionicons name={messageId ? "flag-outline" : "shield-outline"} size={20} color={colors.ink} />
      {label && <Text style={styles.text}>{messageId ? "Report" : "Safety"}</Text>}
    </Pressable>
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => !busy && setVisible(false)}>
      <View style={styles.overlay}><View style={styles.panel}><ScrollView keyboardShouldPersistTaps="handled">
        <View style={styles.heading}><Text style={styles.title}>{reporting ? "Report conversation" : name}</Text><Pressable accessibilityLabel="Close safety options" disabled={busy} onPress={() => setVisible(false)}><Ionicons name="close" size={25}/></Pressable></View>
        {!reporting ? <>
          <Pressable disabled={busy} style={styles.action} onPress={() => setReporting(true)}><Ionicons name="flag-outline" size={22}/><Text>Report conversation</Text></Pressable>
          <Pressable disabled={busy} style={styles.action} onPress={block}><Ionicons name="ban-outline" size={22} color={colors.red}/><Text style={{ color: colors.red }}>{busy ? "Blocking..." : "Block astrologer"}</Text></Pressable>
        </> : <>
          {["Harassment", "Sexual content", "Violence or threats", "Scam or payment request", "Other"].map(item => <Pressable disabled={busy} key={item} style={styles.action} accessibilityRole="radio" accessibilityState={{ checked: reason === item }} onPress={() => setReason(item)}><Ionicons name={reason === item ? "radio-button-on" : "radio-button-off"} size={20} color={colors.orangeDark}/><Text>{item}</Text></Pressable>)}
          <TextInput accessibilityLabel="Report details" placeholder="Additional details (optional)" multiline maxLength={1000} value={details} onChangeText={setDetails} style={styles.input}/>
          <Pressable disabled={busy} style={styles.submit} onPress={() => void report()}><Text style={{ color: "white", fontWeight: "700" }}>{busy ? "Sending..." : "Send report"}</Text></Pressable>
        </>}
      </ScrollView></View></View>
    </Modal>
  </>;
}
const styles = StyleSheet.create({ trigger: { minHeight: 44, minWidth: 44, flexDirection: "row", gap: 5, alignItems: "center", justifyContent: "center" }, text: { fontSize: 12, color: colors.muted }, overlay: { flex: 1, backgroundColor: "rgba(0,0,0,.4)", justifyContent: "flex-end" }, panel: { backgroundColor: "white", padding: 20, paddingBottom: 32, maxHeight: "85%", borderTopLeftRadius: 8, borderTopRightRadius: 8 }, heading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }, title: { flex: 1, fontSize: 18, fontWeight: "700" }, action: { flexDirection: "row", gap: 12, alignItems: "center", paddingVertical: 14 }, input: { borderWidth: 1, borderColor: colors.border, padding: 12, minHeight: 80, borderRadius: 8, textAlignVertical: "top" }, submit: { alignItems: "center", backgroundColor: colors.orange, padding: 14, borderRadius: 8, marginTop: 12 } });
