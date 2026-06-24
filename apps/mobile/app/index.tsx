import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useSession } from "@/src/session";
import { colors } from "@/src/ui";

export default function Index() {
  const { user, loading } = useSession();
  if (loading) return <View style={{ flex: 1, justifyContent: "center", backgroundColor: colors.cream }}><ActivityIndicator color={colors.orange} /></View>;
  return <Redirect href={user ? "/(tabs)/home" : "/login"} />;
}
