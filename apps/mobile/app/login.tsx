import { useState } from "react";
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { api } from "@/src/api";
import { useSession } from "@/src/session";
import { colors } from "@/src/ui";

export default function LoginScreen() {
  const { setToken } = useSession();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sendOtp = async () => {
    if (!/^\d{10}$/.test(phone)) return Alert.alert("Enter a valid 10-digit mobile number");
    setBusy(true);
    try { const result = await api<{ verificationId: string }>("/api/auth/otp/send", { method: "POST", body: JSON.stringify({ phone }) }); setVerificationId(result.verificationId); }
    catch (error) { Alert.alert("Could not send OTP", error instanceof Error ? error.message : "Try again"); }
    finally { setBusy(false); }
  };
  const verifyOtp = async () => {
    if (!verificationId || otp.length < 4) return;
    setBusy(true);
    try {
      const result = await api<{ accessToken: string }>("/api/auth/otp/verify", { method: "POST", body: JSON.stringify({ phone, otp, verificationId, name, client: "mobile" }) });
      await setToken(result.accessToken); router.replace("/(tabs)/home");
    } catch (error) { Alert.alert("Could not verify OTP", error instanceof Error ? error.message : "Try again"); }
    finally { setBusy(false); }
  };

  return <SafeAreaView style={styles.screen}><View style={styles.content}>
    <View style={styles.mark}><Text style={styles.markText}>A</Text></View>
    <Text style={styles.title}>AstroWalla</Text><Text style={styles.subtitle}>Guidance when you need it.</Text>
    {!verificationId ? <>
      <TextInput style={styles.input} placeholder="Your name (optional)" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="10-digit mobile number" keyboardType="phone-pad" maxLength={10} value={phone} onChangeText={setPhone} />
      <Pressable style={styles.primary} onPress={sendOtp} disabled={busy}><Text style={styles.primaryText}>{busy ? "Sending..." : "Continue"}</Text></Pressable>
    </> : <>
      <Text style={styles.helper}>We sent a 4-digit code to {phone}</Text>
      <TextInput style={styles.input} placeholder="Enter OTP" keyboardType="number-pad" maxLength={4} value={otp} onChangeText={setOtp} />
      <Pressable style={styles.primary} onPress={verifyOtp} disabled={busy}><Text style={styles.primaryText}>{busy ? "Verifying..." : "Verify and continue"}</Text></Pressable>
      <Pressable onPress={() => setVerificationId(null)}><Text style={styles.link}>Change mobile number</Text></Pressable>
    </>}
  </View></SafeAreaView>;
}
const styles = StyleSheet.create({ screen:{flex:1,backgroundColor:colors.cream},content:{flex:1,justifyContent:"center",padding:28,gap:14},mark:{width:64,height:64,borderRadius:20,backgroundColor:colors.orange,justifyContent:"center",alignItems:"center",marginBottom:8},markText:{color:"white",fontSize:32,fontWeight:"800"},title:{fontSize:32,fontWeight:"800",color:colors.ink},subtitle:{fontSize:16,color:colors.muted,marginBottom:24},input:{backgroundColor:"white",borderWidth:1,borderColor:colors.border,borderRadius:14,padding:16,fontSize:16,color:colors.ink},primary:{backgroundColor:colors.orange,borderRadius:14,padding:17,alignItems:"center",marginTop:6},primaryText:{color:"white",fontSize:16,fontWeight:"800"},helper:{color:colors.muted,fontSize:15},link:{textAlign:"center",color:colors.orange,fontWeight:"700",marginTop:10} });
