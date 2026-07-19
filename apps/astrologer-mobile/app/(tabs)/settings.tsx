import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { api } from "@/src/api";
import { useSession } from "@/src/session";
import { colors, fonts, shadow } from "@/src/ui";
import type { AstrologerProfile } from "@/src/types";

const SPECIALITIES = ["Vedic Astrology", "KP Astrology", "Numerology", "Tarot", "Palmistry", "Vastu Shastra", "Career", "Marriage", "Love"];
const LANGUAGES = ["Hindi", "English", "Tamil", "Telugu", "Kannada", "Bengali", "Marathi", "Punjabi"];

export default function SettingsScreen() {
  const { profile, refresh, logout } = useSession();
  const [local, setLocal] = useState({
    name: "",
    bio: "",
    speciality: [] as string[],
    languages: [] as string[],
    ratePerMin: "10",
    phoneNumber: "",
    telegramChatId: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setLocal({
      name: profile.user.name || "",
      bio: profile.bio || "",
      speciality: profile.speciality ? profile.speciality.split(",").map((s) => s.trim()).filter(Boolean) : [],
      languages: profile.languages ? profile.languages.split(",").map((s) => s.trim()).filter(Boolean) : [],
      ratePerMin: String(profile.ratePerMin || 10),
      phoneNumber: profile.phoneNumber || "",
      telegramChatId: profile.telegramChatId || "",
    });
  }, [profile]);

  if (!profile) return <View style={styles.loading}><ActivityIndicator color={colors.orange} /></View>;

  function toggle(list: "speciality" | "languages", value: string) {
    setLocal((prev) => ({
      ...prev,
      [list]: prev[list].includes(value) ? prev[list].filter((item) => item !== value) : [...prev[list], value],
    }));
  }

  async function save() {
    setSaving(true);
    try {
      await api<AstrologerProfile>("/api/astrologer/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: local.name.trim(),
          bio: local.bio,
          speciality: local.speciality.join(", "),
          languages: local.languages.join(", "),
          ratePerMin: Number(local.ratePerMin),
          phoneNumber: local.phoneNumber,
          telegramChatId: local.telegramChatId,
        }),
      });
      await refresh();
      Alert.alert("Saved", "Your astrologer profile has been updated.");
    } catch (error) {
      Alert.alert("Could not save", error instanceof Error ? error.message : "Try again");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await logout();
    router.replace("/login");
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Settings</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Profile Details</Text>
            <Field label="Display Name" value={local.name} onChangeText={(name) => setLocal((p) => ({ ...p, name }))} />
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              multiline
              value={local.bio}
              onChangeText={(bio) => setLocal((p) => ({ ...p, bio }))}
              placeholder="Tell seekers about your experience and approach"
              placeholderTextColor="#9CA3AF"
            />
            <Field label="Rate per minute (₹)" value={local.ratePerMin} onChangeText={(ratePerMin) => setLocal((p) => ({ ...p, ratePerMin }))} keyboardType="number-pad" />
          </View>

          <ChipSection title="Specialities" values={SPECIALITIES} selected={local.speciality} onToggle={(v) => toggle("speciality", v)} />
          <ChipSection title="Languages" values={LANGUAGES} selected={local.languages} onToggle={(v) => toggle("languages", v)} />

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Alerts</Text>
            <Field label="Phone Number for Call Alerts" value={local.phoneNumber} onChangeText={(phoneNumber) => setLocal((p) => ({ ...p, phoneNumber }))} keyboardType="phone-pad" />
            <Field label="Telegram Chat ID" value={local.telegramChatId} onChangeText={(telegramChatId) => setLocal((p) => ({ ...p, telegramChatId }))} keyboardType="number-pad" />
            <View style={styles.help}>
              <Ionicons name="information-circle-outline" size={18} color={colors.blue} />
              <Text style={styles.helpText}>Open Telegram, search @astrowalla_alerts_bot, send /start, then paste the returned Chat ID here.</Text>
            </View>
          </View>

          <Pressable style={[styles.save, saving && styles.disabled]} onPress={save} disabled={saving}>
            <Text style={styles.saveText}>{saving ? "Saving..." : "Save Settings"}</Text>
          </Pressable>

          <Pressable style={styles.logout} onPress={signOut}>
            <Ionicons name="log-out-outline" size={20} color={colors.red} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor="#9CA3AF" {...props} />
    </View>
  );
}

function ChipSection({ title, values, selected, onToggle }: { title: string; values: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.chips}>
        {values.map((value) => {
          const active = selected.includes(value);
          return (
            <Pressable key={value} style={[styles.chip, active && styles.chipActive]} onPress={() => onToggle(value)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{value}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream },
  content: { padding: 16, paddingBottom: 34 },
  title: { fontSize: 28, color: colors.ink, fontFamily: fonts.extrabold, marginBottom: 14 },
  card: { backgroundColor: colors.white, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14, ...shadow },
  cardTitle: { color: colors.ink, fontSize: 18, fontFamily: fonts.extrabold, marginBottom: 2 },
  label: { color: colors.orangeDark, fontSize: 12, fontFamily: fonts.extrabold, marginBottom: 7 },
  input: { backgroundColor: "#FFFDF8", borderWidth: 1, borderColor: colors.border, borderRadius: 15, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: colors.ink },
  textarea: { minHeight: 104, textAlignVertical: "top", lineHeight: 21 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14, backgroundColor: "#FFFDF8", borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.goldSoft, borderColor: colors.gold },
  chipText: { color: colors.muted, fontSize: 12, fontFamily: fonts.bold },
  chipTextActive: { color: colors.orangeDark, fontFamily: fonts.extrabold },
  help: { marginTop: 12, flexDirection: "row", gap: 8, backgroundColor: "#EFF6FF", borderRadius: 14, padding: 12 },
  helpText: { flex: 1, color: colors.blue, lineHeight: 18, fontSize: 12 },
  save: { backgroundColor: colors.orange, borderRadius: 17, padding: 17, alignItems: "center", marginTop: 2 },
  disabled: { opacity: 0.6 },
  saveText: { color: colors.white, fontSize: 16, fontFamily: fonts.extrabold },
  logout: { marginTop: 14, borderRadius: 17, padding: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, backgroundColor: "#FFF1F1" },
  logoutText: { color: colors.red, fontSize: 15, fontFamily: fonts.extrabold },
});
