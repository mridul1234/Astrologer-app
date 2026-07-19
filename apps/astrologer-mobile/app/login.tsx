import { useState } from "react";
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { api } from "@/src/api";
import { useSession } from "@/src/session";
import { colors, fonts, shadow } from "@/src/ui";

export default function LoginScreen() {
  const { setToken } = useSession();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendOtp() {
    if (!/^\d{10}$/.test(phone)) return Alert.alert("Enter a valid 10-digit mobile number");
    setBusy(true);
    try {
      const result = await api<{ verificationId: string }>("/api/auth/otp/send", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      setVerificationId(result.verificationId);
    } catch (error) {
      Alert.alert("Could not send OTP", error instanceof Error ? error.message : "Try again");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    if (!verificationId || otp.length < 4) return;
    setBusy(true);
    try {
      const result = await api<{ accessToken: string }>("/api/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ phone, otp, verificationId, client: "astrologer-mobile" }),
      });
      await setToken(result.accessToken);
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Could not verify OTP", error instanceof Error ? error.message : "Try again");
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
          <Text style={styles.cardTitle}>{verificationId ? "Verify your number" : "Sign in with your astrologer number"}</Text>
          {!verificationId ? (
            <>
              <View style={styles.phoneRow}>
                <View style={styles.country}><Text style={styles.code}>+91</Text></View>
                <TextInput
                  style={styles.input}
                  placeholder="Mobile number"
                  placeholderTextColor="#98A0AB"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
              <Pressable style={styles.primary} onPress={sendOtp} disabled={busy}>
                <Text style={styles.primaryText}>{busy ? "Sending..." : "Send OTP"}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.helper}>Enter the OTP sent to {phone}</Text>
              <TextInput
                style={[styles.input, styles.otp]}
                placeholder="0000"
                placeholderTextColor="#B8BEC7"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
              <Pressable style={styles.primary} onPress={verifyOtp} disabled={busy}>
                <Text style={styles.primaryText}>{busy ? "Verifying..." : "Verify and open portal"}</Text>
              </Pressable>
              <Pressable onPress={() => setVerificationId(null)}>
                <Text style={styles.link}>Change mobile number</Text>
              </Pressable>
            </>
          )}
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
  phoneRow: { flexDirection: "row", gap: 10 },
  country: { width: 74, borderWidth: 1, borderColor: colors.border, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFDF8" },
  code: { fontSize: 15, fontFamily: fonts.extrabold, color: colors.ink },
  input: { flex: 1, backgroundColor: "#FFFDF8", borderWidth: 1, borderColor: colors.border, borderRadius: 15, paddingHorizontal: 16, paddingVertical: 15, fontSize: 16, color: colors.ink },
  otp: { textAlign: "center", letterSpacing: 8, fontFamily: fonts.extrabold, fontSize: 20 },
  helper: { color: colors.muted, fontSize: 14, textAlign: "center", marginBottom: 12 },
  primary: { marginTop: 14, backgroundColor: colors.orange, borderRadius: 16, padding: 16, alignItems: "center" },
  primaryText: { color: colors.white, fontSize: 16, fontFamily: fonts.extrabold },
  link: { textAlign: "center", marginTop: 14, color: colors.orangeDark, fontFamily: fonts.bold },
});
