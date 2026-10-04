import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, View, Text, StyleSheet } from "react-native";
import { useSession } from "@/src/session";
import { colors } from "@/src/ui";

export default function Index() {
  const { user, loading, error, refresh } = useSession();
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => { const timeout = setTimeout(() => setShowSplash(false), 1200); return () => clearTimeout(timeout); }, []);
  if (loading || showSplash) return <View style={styles.splash}><Image source={require("../assets/astrowalla-logo.jpeg")} style={styles.logo}/><Text style={styles.wordmark}>AstroWalla</Text><Text style={styles.tagline}>Your celestial guide</Text></View>;
  if (error && !user) return <View style={styles.splash}><Text style={styles.error}>{error}</Text><Pressable onPress={() => void refresh()}><Text style={styles.retry}>Try again</Text></Pressable></View>;
  return <Redirect href={!user ? "/login" : user.kundliProfile ? "/(tabs)/chats" : "/onboarding"} />;
}

const styles = StyleSheet.create({
  error:{color:colors.ink,textAlign:"center",paddingHorizontal:28,fontSize:16},
  retry:{color:colors.orangeDark,fontWeight:"800",padding:20,fontSize:16},
  splash:{flex:1,alignItems:"center",justifyContent:"center",backgroundColor:colors.cream},
  logo:{width:132,height:132,borderRadius:66,resizeMode:"cover"},
  wordmark:{marginTop:17,fontSize:31,fontWeight:"900",letterSpacing:.1,color:colors.ink},
  tagline:{marginTop:6,color:colors.orangeDark,fontSize:12,fontWeight:"800",letterSpacing:1.3,textTransform:"uppercase"},
});
