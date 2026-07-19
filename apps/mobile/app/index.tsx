import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Image, View, Text, StyleSheet } from "react-native";
import { useSession } from "@/src/session";
import { colors } from "@/src/ui";

export default function Index() {
  const { user, loading } = useSession();
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => { const timeout = setTimeout(() => setShowSplash(false), 1200); return () => clearTimeout(timeout); }, []);
  if (loading || showSplash) return <View style={styles.splash}><Image source={require("../assets/astrowalla-logo.jpeg")} style={styles.logo}/><Text style={styles.wordmark}>AstroWalla</Text><Text style={styles.tagline}>Your celestial guide</Text></View>;
  return <Redirect href={!user ? "/login" : user.kundliProfile ? "/(tabs)/chats" : "/onboarding"} />;
}

const styles = StyleSheet.create({
  splash:{flex:1,alignItems:"center",justifyContent:"center",backgroundColor:colors.cream},
  logo:{width:132,height:132,borderRadius:66,resizeMode:"cover"},
  wordmark:{marginTop:17,fontSize:31,fontWeight:"900",letterSpacing:.1,color:colors.ink},
  tagline:{marginTop:6,color:colors.orangeDark,fontSize:12,fontWeight:"800",letterSpacing:1.3,textTransform:"uppercase"},
});
