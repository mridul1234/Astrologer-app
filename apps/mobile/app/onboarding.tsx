import { useEffect, useMemo, useState } from "react";
import { Alert, Image, KeyboardAvoidingView, PermissionsAndroid, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { api } from "@/src/api";
import { useSession } from "@/src/session";
import { colors } from "@/src/ui";

type Details = { fullName: string; dateOfBirth: string; timeOfBirth: string; placeOfBirth: string };
const steps = ["Name", "Birth date", "Birth time", "Birth place", "Notifications"];
const pad = (value: number) => String(value).padStart(2, "0");
const dateToApi = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const timeToApi = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;
const dateForPicker = (value: string) => value ? new Date(`${value}T12:00:00`) : new Date(2000, 0, 1);
const timeForPicker = (value: string) => { const [hour = "12", minute = "00"] = value.split(":"); const date = new Date(); date.setHours(Number(hour), Number(minute), 0, 0); return date; };

export default function Onboarding() {
  const { user, refresh } = useSession();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  // A new OTP user is initially named after their phone number on the server. Never
  // prefill that fallback value: the user must deliberately choose their display name.
  const [details, setDetails] = useState<Details>({ fullName: "", dateOfBirth: "", timeOfBirth: "", placeOfBirth: "" });
  useEffect(() => { if (user?.kundliProfile) router.replace("/(tabs)/chats"); }, [user?.kundliProfile]);
  const valid = useMemo(() => (step === 0 ? details.fullName.trim().length >= 2 : step === 1 ? Boolean(details.dateOfBirth) : step === 3 ? details.placeOfBirth.trim().length >= 2 : true), [details, step]);
  const update = (key: keyof Details, value: string) => setDetails((old) => ({ ...old, [key]: value }));
  const selectDate = (_event: DateTimePickerEvent, date?: Date) => { setShowDatePicker(false); if (date) update("dateOfBirth", dateToApi(date)); };
  const selectTime = (_event: DateTimePickerEvent, time?: Date) => { setShowTimePicker(false); if (time) update("timeOfBirth", timeToApi(time)); };
  const finish = async () => {
    setSaving(true);
    try {
      await api("/api/user/kundli", { method: "POST", body: JSON.stringify({ ...details, timeOfBirth: details.timeOfBirth || "12:00" }) });
      if (Platform.OS === "android" && Number(Platform.Version) >= 33) await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      await refresh(); router.replace("/(tabs)/chats");
    } catch (error) { Alert.alert("We couldn't save your details", error instanceof Error ? error.message : "Please try again."); }
    finally { setSaving(false); }
  };
  const next = () => { if (!valid) return; if (step === steps.length - 1) void finish(); else setStep((current) => current + 1); };
  const skipTime = () => { update("timeOfBirth", ""); setStep(3); };

  return <SafeAreaView style={styles.screen}><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><Pressable style={styles.back} onPress={() => step ? setStep((current) => current - 1) : router.replace("/login")} hitSlop={10}><Ionicons name="chevron-back" size={22} color={colors.ink}/></Pressable><View style={styles.brand}><Image source={require("../assets/astrowalla-logo.jpeg")} style={styles.headerLogo}/><Text style={styles.brandName}>AstroWalla</Text></View><Text style={styles.stepCount}>{step + 1}/{steps.length}</Text></View>
    <View style={styles.progressTrack}>{steps.map((item, index) => <View key={item} style={[styles.progressSegment, index <= step && styles.progressActive]}/>)}</View>
    <View style={styles.card}><View style={styles.stepLabel}><View style={styles.stepBadge}><Text style={styles.stepBadgeText}>{step + 1}</Text></View><Text style={styles.stepLabelText}>{steps[step]}</Text></View>
      {step === 0 && <Question icon="person-outline" eyebrow="LET'S BEGIN" title="What should we call you?" subtitle="This is how your astrologer will greet you."><TextInput autoFocus value={details.fullName} onChangeText={(value) => update("fullName", value)} placeholder="Enter your full name" placeholderTextColor="#94A3B8" style={styles.input} autoCapitalize="words" returnKeyType="next" onSubmitEditing={next}/></Question>}
      {step === 1 && <Question icon="calendar-outline" eyebrow="YOUR KUNDLI" title="When were you born?" subtitle="Select your date of birth to begin creating your cosmic map."><Pressable style={styles.selector} onPress={() => setShowDatePicker(true)}><Ionicons name="calendar-clear-outline" size={21} color={colors.orangeDark}/><Text style={[styles.selectorText, !details.dateOfBirth && styles.placeholder]}>{details.dateOfBirth ? new Date(`${details.dateOfBirth}T12:00:00`).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" }) : "Select date of birth"}</Text><Ionicons name="chevron-forward" size={19} color={colors.muted}/></Pressable><Text style={styles.hint}>Use the picker to choose the day, month, and year.</Text></Question>}
      {step === 2 && <Question icon="time-outline" eyebrow="YOUR KUNDLI" title="What time were you born?" subtitle="An exact birth time makes your Kundli and predictions more precise."><Pressable style={styles.selector} onPress={() => setShowTimePicker(true)}><Ionicons name="time-outline" size={21} color={colors.orangeDark}/><Text style={[styles.selectorText, !details.timeOfBirth && styles.placeholder]}>{details.timeOfBirth ? timeForPicker(details.timeOfBirth).toLocaleTimeString("en-IN", { hour:"numeric", minute:"2-digit" }) : "Select birth time"}</Text><Ionicons name="chevron-forward" size={19} color={colors.muted}/></Pressable><Text style={styles.hint}>Not sure? You can continue without it.</Text></Question>}
      {step === 3 && <Question icon="location-outline" eyebrow="YOUR KUNDLI" title="Where were you born?" subtitle="Your birthplace determines your Ascendant and house positions."><TextInput autoFocus value={details.placeOfBirth} onChangeText={(value) => update("placeOfBirth", value)} placeholder="City, State" placeholderTextColor="#94A3B8" style={styles.input} autoCapitalize="words" returnKeyType="done" onSubmitEditing={next}/></Question>}
      {step === 4 && <Question icon="notifications-outline" eyebrow="STAY CONNECTED" title="Never miss guidance" subtitle="Get notified when an astrologer replies, your chat starts, or an update matters."><View style={styles.notice}><View style={styles.noticeIcon}><Ionicons name="sparkles" size={21} color={colors.orangeDark}/></View><View style={styles.noticeCopy}><Text style={styles.noticeTitle}>Only the useful stuff</Text><Text style={styles.noticeText}>You can change this whenever you like in your phone settings.</Text></View></View></Question>}
      <Pressable onPress={next} disabled={!valid || saving} style={[styles.primary, (!valid || saving) && styles.primaryDisabled]}><Text style={styles.primaryText}>{saving ? "Saving your details..." : step === 4 ? "Continue to AstroWalla" : "Continue"}</Text><Ionicons name="arrow-forward" size={18} color="white"/></Pressable>
      {step === 2 && <Pressable onPress={skipTime} style={styles.skip}><Text style={styles.skipText}>I don't know my birth time</Text></Pressable>}
    </View><Text style={styles.privacy}><Ionicons name="lock-closed" size={11} color={colors.muted}/> Your details are safe, private, and only used to personalise your experience.</Text>
    {showDatePicker && <DateTimePicker value={dateForPicker(details.dateOfBirth)} mode="date" display="spinner" maximumDate={new Date()} onChange={selectDate}/>} 
    {showTimePicker && <DateTimePicker value={timeForPicker(details.timeOfBirth)} mode="time" display="spinner" onChange={selectTime}/>} 
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

function Question({ icon, eyebrow, title, subtitle, children }: { icon: keyof typeof Ionicons.glyphMap; eyebrow: string; title: string; subtitle: string; children: React.ReactNode }) {
  return <View><View style={styles.iconCircle}><Ionicons name={icon} size={25} color={colors.orangeDark}/></View><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.questionTitle}>{title}</Text><Text style={styles.questionSubtitle}>{subtitle}</Text><View style={styles.answer}>{children}</View></View>;
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.cream},flex:{flex:1},content:{flexGrow:1,padding:20,paddingBottom:25},header:{height:54,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},back:{width:36,height:36,borderRadius:18,alignItems:"center",justifyContent:"center",backgroundColor:"#FFFDF9",borderWidth:1,borderColor:"#EFE5D4"},brand:{flexDirection:"row",alignItems:"center",gap:8},headerLogo:{width:28,height:28,borderRadius:14,resizeMode:"cover"},brandName:{fontSize:17,fontWeight:"900",color:colors.ink},stepCount:{fontSize:12,fontWeight:"800",color:colors.orangeDark,width:36,textAlign:"right"},progressTrack:{flexDirection:"row",gap:5,marginTop:17,marginBottom:22},progressSegment:{height:5,flex:1,borderRadius:4,backgroundColor:"#E9E4DA"},progressActive:{backgroundColor:colors.gold},card:{flex:1,backgroundColor:"rgba(255,255,255,.88)",borderRadius:27,borderWidth:1,borderColor:"#F0E4C8",padding:24,shadowColor:"#B97A1C",shadowOpacity:.08,shadowRadius:22,elevation:2},stepLabel:{flexDirection:"row",alignItems:"center",gap:8,marginBottom:24},stepBadge:{width:25,height:25,borderRadius:13,alignItems:"center",justifyContent:"center",backgroundColor:colors.gold},stepBadgeText:{fontSize:12,fontWeight:"900",color:"#7A4300"},stepLabelText:{fontSize:12,fontWeight:"800",letterSpacing:.7,textTransform:"uppercase",color:colors.orangeDark},iconCircle:{width:50,height:50,borderRadius:16,alignItems:"center",justifyContent:"center",backgroundColor:colors.goldLight,marginBottom:17},eyebrow:{fontSize:11,fontWeight:"900",letterSpacing:1.2,color:colors.orangeDark},questionTitle:{fontSize:28,lineHeight:35,fontWeight:"900",letterSpacing:-.5,color:colors.ink,marginTop:7},questionSubtitle:{fontSize:15,lineHeight:22,color:colors.muted,marginTop:9},answer:{marginTop:27},input:{backgroundColor:"#FFFEFC",borderWidth:1,borderColor:"#E7DED0",borderRadius:16,paddingHorizontal:16,paddingVertical:17,fontSize:16,color:colors.ink},selector:{backgroundColor:"#FFFEFC",borderWidth:1,borderColor:"#E7DED0",borderRadius:16,minHeight:59,paddingHorizontal:16,alignItems:"center",flexDirection:"row",gap:12},selectorText:{fontSize:16,fontWeight:"700",color:colors.ink,flex:1},placeholder:{fontWeight:"500",color:"#94A3B8"},hint:{fontSize:12,lineHeight:18,color:colors.muted,marginTop:9},notice:{backgroundColor:"#FFFBEF",borderRadius:17,borderWidth:1,borderColor:"#F4DEA1",padding:15,flexDirection:"row",gap:12},noticeIcon:{width:42,height:42,borderRadius:14,backgroundColor:"#FCE8B2",alignItems:"center",justifyContent:"center"},noticeCopy:{flex:1},noticeTitle:{fontSize:14,fontWeight:"900",color:colors.ink},noticeText:{fontSize:12,lineHeight:17,color:colors.muted,marginTop:3},primary:{backgroundColor:colors.orange,borderRadius:15,minHeight:55,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:9,marginTop:"auto",shadowColor:colors.orange,shadowOpacity:.28,shadowRadius:12,elevation:3},primaryDisabled:{backgroundColor:"#C7BFB4",shadowOpacity:0},primaryText:{color:"white",fontSize:16,fontWeight:"900"},skip:{alignItems:"center",paddingTop:17,paddingBottom:2},skipText:{fontSize:13,fontWeight:"800",color:colors.orangeDark},privacy:{textAlign:"center",fontSize:11,lineHeight:17,color:colors.muted,marginTop:16,paddingHorizontal:13},
});
