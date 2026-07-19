import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSession } from "@/src/session";
import { colors } from "@/src/ui";

export default function IndexScreen() {
  const { profile, loading } = useSession();
  if (loading) return <View style={styles.screen}><ActivityIndicator color={colors.orange} /></View>;
  return <Redirect href={profile ? "/(tabs)" : "/login"} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream },
});
