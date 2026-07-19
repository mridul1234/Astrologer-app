import { useState } from "react";
import { Alert, Image, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { api } from "@/src/api";
import { useSession } from "@/src/session";
import { colors } from "@/src/ui";

export default function LoginScreen() {
  const { setToken } = useSession();
  const [phone, setPhone] = useState("");
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
      const result = await api<{ accessToken: string }>("/api/auth/otp/verify", { method: "POST", body: JSON.stringify({ phone, otp, verificationId, client: "mobile" }) });
      await setToken(result.accessToken); router.replace("/onboarding");
    } catch (error) { Alert.alert("Could not verify OTP", error instanceof Error ? error.message : "Try again"); }
    finally { setBusy(false); }
  };

  return <SafeAreaView style={styles.screen}><View style={styles.content}>
    <View style={styles.hero}><Image source={require("../assets/astrowalla-logo.jpeg")} style={styles.logo}/><Text style={styles.title}>AstroWalla</Text><Text style={styles.subtitle}>Your celestial guide, always close.</Text></View>
    <View style={styles.ruleRow}><View style={styles.rule}/><Text style={styles.ruleText}>{verificationId ? "VERIFY YOUR NUMBER" : "LOGIN OR SIGN UP"}</Text><View style={styles.rule}/></View>
    {!verificationId ? <>
      <View style={styles.phoneRow}><View style={styles.country}><Text style={styles.flag}>🇮🇳</Text><Text style={styles.code}>+91</Text></View><TextInput style={[styles.input,styles.phoneInput]} placeholder="Mobile number" placeholderTextColor="#98A0AB" keyboardType="phone-pad" maxLength={10} value={phone} onChangeText={setPhone} /></View>
      <Pressable style={styles.primary} onPress={sendOtp} disabled={busy}><Text style={styles.primaryText}>{busy ? "Sending..." : "Continue"}</Text></Pressable>
    </> : <>
      <Text style={styles.helper}>We sent a 4-digit code to {phone}</Text>
      <TextInput style={[styles.input,styles.otp]} placeholder="• • • •" placeholderTextColor="#B8BEC7" keyboardType="number-pad" maxLength={4} value={otp} onChangeText={setOtp} />
      <Pressable style={styles.primary} onPress={verifyOtp} disabled={busy}><Text style={styles.primaryText}>{busy ? "Verifying..." : "Verify and continue"}</Text></Pressable>
      <Pressable onPress={() => setVerificationId(null)}><Text style={styles.link}>Change mobile number</Text></Pressable>
    </>}
    <Text style={styles.terms}>By continuing, you agree to our Terms of Use and Privacy Policy.</Text>
  </View></SafeAreaView>;
}
const styles = StyleSheet.create({ screen:{flex:1,backgroundColor:colors.cream},content:{flex:1,paddingHorizontal:28,paddingTop:42,gap:14},hero:{alignItems:"center",marginTop:20,marginBottom:28},logo:{width:88,height:88,borderRadius:44,resizeMode:"cover"},title:{fontSize:31,fontWeight:"900",color:colors.ink,marginTop:13},subtitle:{fontSize:15,color:colors.muted,marginTop:6,textAlign:"center"},ruleRow:{flexDirection:"row",alignItems:"center",gap:10,marginBottom:10},rule:{height:1,backgroundColor:colors.border,flex:1},ruleText:{fontSize:11,fontWeight:"800",letterSpacing:.8,color:colors.orangeDark},input:{backgroundColor:"white",borderWidth:1,borderColor:colors.border,borderRadius:15,paddingHorizontal:16,paddingVertical:16,fontSize:16,color:colors.ink},phoneRow:{flexDirection:"row",gap:9},country:{width:92,borderWidth:1,borderColor:colors.border,borderRadius:15,backgroundColor:"white",alignItems:"center",justifyContent:"center",flexDirection:"row",gap:5},flag:{fontSize:18},code:{fontSize:15,fontWeight:"800",color:colors.ink},phoneInput:{flex:1},otp:{textAlign:"center",fontWeight:"800",letterSpacing:9,fontSize:20},primary:{backgroundColor:colors.orange,borderRadius:15,padding:17,alignItems:"center",marginTop:8,shadowColor:colors.orange,shadowOpacity:.22,shadowRadius:12,elevation:2},primaryText:{color:"white",fontSize:16,fontWeight:"800"},helper:{color:colors.muted,fontSize:15,textAlign:"center",lineHeight:22},link:{textAlign:"center",color:colors.orangeDark,fontWeight:"700",marginTop:10},terms:{marginTop:"auto",marginBottom:20,textAlign:"center",fontSize:12,lineHeight:18,color:colors.muted} });
