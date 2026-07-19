import { useState } from "react";
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { api } from "@/src/api";
import { useSession } from "@/src/session";
import { colors, fonts, shadow } from "@/src/ui";

export default function LoginScreen() {
  const { setToken } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function login() {
    if (!email.trim() || !password) return Alert.alert("Enter your email and password");
    setBusy(true);
    try {
      const result = await api<{ accessToken: string }>("/api/mobile/astrologer/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      await setToken(result.accessToken);
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Could not sign in", error instanceof Error ? error.message : "Try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.headerGlow} />
      <View style={styles.content}>
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Ionicons name="sparkles" size={30} color={colors.purple} />
          </View>
          <Text style={styles.title}>AstroWalla</Text>
          <Text style={styles.portal}>ASTROLOGER PORTAL</Text>
          <Text style={styles.subtitle}>Go online, receive live chats, manage your earnings, and guide seekers from your phone.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in with your portal credentials</Text>
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor="#98A0AB"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Password"
            placeholderTextColor="#98A0AB"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Pressable style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed, busy && styles.primaryDisabled]} onPress={login} disabled={busy}>
            <Text style={styles.primaryText}>{busy ? "Signing in..." : "Open astrologer portal"}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  headerGlow: { position: "absolute", top: 0, left: 0, right: 0, height: 260, backgroundColor: colors.goldSoft, borderBottomLeftRadius: 44, borderBottomRightRadius: 44 },
  content: { flex: 1, padding: 22, justifyContent: "center" },
  brand: { alignItems: "center", marginBottom: 28 },
  logo: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center", marginBottom: 14, ...shadow },
  title: { fontSize: 34, fontFamily: fonts.extrabold, color: colors.ink },
  portal: { marginTop: 3, color: colors.orangeDark, fontSize: 11, fontFamily: fonts.extrabold, letterSpacing: 1.4 },
  subtitle: { marginTop: 12, color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: "center", maxWidth: 320 },
  card: { backgroundColor: colors.white, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border, ...shadow },
  cardTitle: { fontSize: 18, fontFamily: fonts.extrabold, color: colors.ink, marginBottom: 16 },
  input: { backgroundColor: "#FFFDF8", borderWidth: 1, borderColor: colors.border, borderRadius: 15, paddingHorizontal: 16, paddingVertical: 15, fontSize: 16, color: colors.ink },
  passwordInput: { marginTop: 12 },
  primary: { marginTop: 14, backgroundColor: colors.orange, borderRadius: 16, padding: 16, alignItems: "center" },
  primaryPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  primaryDisabled: { opacity: 0.7 },
  primaryText: { color: colors.white, fontSize: 16, fontFamily: fonts.extrabold },
});
