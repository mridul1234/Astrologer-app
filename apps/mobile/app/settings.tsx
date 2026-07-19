import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Switch, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useSession } from "@/src/session";
import { colors, fonts } from "@/src/ui";
import { api } from "@/src/api";

type SettingKey = "chatAlerts" | "offers" | "profilePrivacy";

const preferenceKeys: Record<SettingKey, string> = {
  chatAlerts: "astrowalla_setting_chat_alerts",
  offers: "astrowalla_setting_offers",
  profilePrivacy: "astrowalla_setting_profile_privacy",
};

export default function SettingsScreen() {
  const { logout } = useSession();
  const [deleting, setDeleting] = useState(false);
  const [prefs, setPrefs] = useState<Record<SettingKey, boolean>>({
    chatAlerts: true,
    offers: true,
    profilePrivacy: true,
  });

  useEffect(() => {
    let alive = true;
    Promise.all(
      (Object.keys(preferenceKeys) as SettingKey[]).map(async (key) => {
        const saved = await SecureStore.getItemAsync(preferenceKeys[key]);
        return [key, saved === null ? true : saved === "true"] as const;
      }),
    ).then((entries) => {
      if (alive) setPrefs(Object.fromEntries(entries) as Record<SettingKey, boolean>);
    });
    return () => {
      alive = false;
    };
  }, []);

  const toggle = async (key: SettingKey) => {
    const next = !prefs[key];
    setPrefs((current) => ({ ...current, [key]: next }));
    await SecureStore.setItemAsync(preferenceKeys[key], String(next));
  };

  const openWeb = (path: string) => {
    void Linking.openURL(`https://www.astrowalla.com${path}`);
  };

  const doLogout = () => {
    Alert.alert("Log out?", "You will need to login again to access your AstroWalla account.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => void logout().then(() => router.replace("/login")) },
    ]);
  };

  const deleteAccount = () => {
    Alert.alert(
      "Delete account",
      "This permanently removes your AstroWalla seeker account, chats, wallet history, and Kundli details from this app.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await api("/api/user/profile", { method: "DELETE" });
              await logout();
              router.replace("/login");
            } catch (error) {
              Alert.alert("Could not delete account", error instanceof Error ? error.message : "Please contact support.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={25} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="Notifications">
          <SettingSwitch icon="chatbubble-outline" title="Chat alerts" subtitle="Replies, chat starts and session updates." value={prefs.chatAlerts} onValueChange={() => void toggle("chatAlerts")} />
          <Divider />
          <SettingSwitch icon="sparkles-outline" title="Offers and reminders" subtitle="Recharge offers and useful AstroWalla updates." value={prefs.offers} onValueChange={() => void toggle("offers")} />
        </Section>

        <Section title="Privacy">
          <SettingSwitch icon="lock-closed-outline" title="Profile privacy" subtitle="Show your name only where it is needed for sessions and reviews." value={prefs.profilePrivacy} onValueChange={() => void toggle("profilePrivacy")} />
          <Divider />
          <SettingRow icon="shield-checkmark-outline" title="Manage privacy" subtitle="Read how your chats and details are protected." onPress={() => openWeb("/privacy-policy")} />
        </Section>

        <Section title="Preferences">
          <SettingRow icon="language-outline" title="App language" right="English" onPress={() => Alert.alert("Language", "English is currently available. More languages can be added later.")} />
          <Divider />
          <SettingRow icon="notifications-outline" title="Phone notification settings" subtitle="Open Android settings to manage system permissions." onPress={() => Linking.openSettings()} />
        </Section>

        <Section title="Account">
          <SettingRow icon="receipt-outline" title="Wallet transactions" onPress={() => router.push("/transactions")} />
          <Divider />
          <SettingRow icon="card-outline" title="Manage billing address" subtitle="Used for invoices and payment records." onPress={() => Alert.alert("Billing address", "Billing address management will be added once invoices are enabled.")} />
        </Section>

        <Section title="Legal">
          <SettingRow icon="document-text-outline" title="Terms and Conditions" onPress={() => openWeb("/terms-and-conditions")} />
          <Divider />
          <SettingRow icon="shield-outline" title="Privacy Policy" onPress={() => openWeb("/privacy-policy")} />
        </Section>

        <Pressable style={styles.logoutButton} onPress={doLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
        <Pressable style={styles.deleteButton} onPress={deleteAccount}>
          <Text style={styles.deleteText}>{deleting ? "Deleting account..." : "Delete my account"}</Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.brand}>AstroWalla</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function SettingSwitch({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: () => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={20} color={colors.orangeDark} />
      </View>
      <View style={styles.settingCopy}>
        <Text style={styles.settingTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: "#DDD6CC", true: "#F5C842" }} thumbColor="#FFFFFF" />
    </View>
  );
}

function SettingRow({
  icon,
  title,
  subtitle,
  right,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  right?: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.settingRow} onPress={onPress}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={20} color={colors.orangeDark} />
      </View>
      <View style={styles.settingCopy}>
        <Text style={styles.settingTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {!!right && <Text style={styles.rightText}>{right}</Text>}
      <Ionicons name="chevron-forward" size={18} color="#B4A99B" />
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: 16, paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 12 : 14, paddingBottom: 14, backgroundColor: "#FFFEFC", borderBottomWidth: 1, borderBottomColor: "#F0E6D7", flexDirection: "row", alignItems: "center", gap: 10 },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: fonts.extrabold, color: colors.ink, fontSize: 22 },
  content: { padding: 16, gap: 17, paddingBottom: 34 },
  sectionTitle: { fontFamily: fonts.extrabold, color: "#A56A16", fontSize: 11, letterSpacing: 2.2, textTransform: "uppercase", marginBottom: 9, marginLeft: 2 },
  sectionCard: { borderRadius: 22, backgroundColor: "#FFFEFC", borderWidth: 1, borderColor: "#EFE5D4", overflow: "hidden" },
  settingRow: { minHeight: 68, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  settingIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#FFF2D6", alignItems: "center", justifyContent: "center" },
  settingCopy: { flex: 1, minWidth: 0 },
  settingTitle: { fontFamily: fonts.bold, color: colors.ink, fontSize: 15.5 },
  settingSubtitle: { fontFamily: fonts.regular, color: colors.muted, fontSize: 11.8, lineHeight: 16.5, marginTop: 3 },
  rightText: { fontFamily: fonts.semibold, color: colors.muted, fontSize: 13.5 },
  divider: { height: 1, backgroundColor: "#F0E6D7", marginLeft: 68 },
  logoutButton: { borderRadius: 20, backgroundColor: "#FFFEFC", borderWidth: 1, borderColor: "#EFE5D4", padding: 16, alignItems: "center" },
  logoutText: { fontFamily: fonts.extrabold, color: colors.ink, fontSize: 16 },
  deleteButton: { padding: 7, alignItems: "center" },
  deleteText: { fontFamily: fonts.extrabold, color: colors.red, fontSize: 16 },
  footer: { alignItems: "center", marginTop: 4 },
  brand: { fontFamily: fonts.extrabold, color: colors.ink, fontSize: 20 },
  version: { fontFamily: fonts.regular, color: colors.muted, fontSize: 13, marginTop: 3 },
});
