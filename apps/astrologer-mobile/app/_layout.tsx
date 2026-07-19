import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";
import { useFonts, NunitoSans_400Regular, NunitoSans_500Medium, NunitoSans_600SemiBold, NunitoSans_700Bold, NunitoSans_800ExtraBold } from "@expo-google-fonts/nunito-sans";
import { SessionProvider } from "@/src/session";
import { colors, fonts } from "@/src/ui";

export default function RootLayout() {
  const [loaded] = useFonts({
    NunitoSans_400Regular,
    NunitoSans_500Medium,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
    NunitoSans_800ExtraBold,
  });

  if (!loaded) {
    return <View style={styles.loading}><ActivityIndicator color={colors.orange} /></View>;
  }

  const defaultText = Text as typeof Text & { defaultProps?: { style?: unknown } };
  defaultText.defaultProps = defaultText.defaultProps || {};
  defaultText.defaultProps.style = [defaultText.defaultProps.style, { fontFamily: fonts.regular }];

  const defaultInput = TextInput as typeof TextInput & { defaultProps?: { style?: unknown } };
  defaultInput.defaultProps = defaultInput.defaultProps || {};
  defaultInput.defaultProps.style = [defaultInput.defaultProps.style, { fontFamily: fonts.regular }];

  return (
    <SessionProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
    </SessionProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream },
});
