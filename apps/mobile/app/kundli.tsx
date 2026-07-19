import { useEffect, useState } from "react";
import { Alert, Pressable, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { api } from "@/src/api";
import { Skeleton, SkeletonLine } from "@/src/Skeleton";
import { colors, fonts } from "@/src/ui";

type KundliProfile = {
  fullName: string;
  dateOfBirth: string;
  timeOfBirth: string | null;
  placeOfBirth: string;
  latitude?: number | null;
  longitude?: number | null;
};

export default function KundliScreen() {
  const [profile, setProfile] = useState<KundliProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<KundliProfile | null>("/api/user/kundli")
      .then(setProfile)
      .catch(() => Alert.alert("Could not load Kundli details"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <Header title="My Kundli" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <>
            <Skeleton width="100%" height={145} radius={24} />
            {[0, 1, 2, 3].map((item) => <SkeletonLine key={item} width="100%" height={54} style={styles.skeletonRow} />)}
          </>
        ) : profile ? (
          <>
            <View style={styles.hero}>
              <Text style={styles.kicker}>COSMIC PROFILE</Text>
              <Text style={styles.name}>{profile.fullName}</Text>
              <Text style={styles.sub}>Your saved birth details for personal guidance.</Text>
            </View>
            <Info label="Birth date" value={formatDate(profile.dateOfBirth)} icon="calendar-outline" />
            <Info label="Birth time" value={profile.timeOfBirth || "12:00 PM"} icon="time-outline" />
            <Info label="Birth place" value={profile.placeOfBirth} icon="location-outline" />
            <Info label="Coordinates" value={profile.latitude && profile.longitude ? `${profile.latitude.toFixed(2)}, ${profile.longitude.toFixed(2)}` : "Not available"} icon="navigate-outline" />
            <Pressable style={styles.primary} onPress={() => router.push("/onboarding")}>
              <Text style={styles.primaryText}>Update Kundli details</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="planet-outline" size={42} color={colors.orange} />
            <Text style={styles.emptyTitle}>No Kundli details yet</Text>
            <Text style={styles.emptyText}>Add your birth details so astrologers can guide you better.</Text>
            <Pressable style={styles.primary} onPress={() => router.push("/onboarding")}>
              <Text style={styles.primaryText}>Create my Kundli</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <Pressable style={styles.back} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color={colors.ink} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.info}>
      <View style={styles.infoIcon}><Ionicons name={icon} size={18} color={colors.orangeDark} /></View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: 16, paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 12 : 14, paddingBottom: 14, backgroundColor: "#FFFEFC", borderBottomWidth: 1, borderBottomColor: "#F0E6D7", flexDirection: "row", alignItems: "center", gap: 10 },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: fonts.extrabold, color: colors.ink, fontSize: 21 },
  content: { padding: 16, gap: 11, paddingBottom: 30 },
  hero: { borderRadius: 24, padding: 20, backgroundColor: "#1A1040", borderWidth: 1, borderColor: "rgba(245,200,66,.25)" },
  kicker: { fontFamily: fonts.extrabold, color: colors.gold, fontSize: 10, letterSpacing: 1.2 },
  name: { fontFamily: fonts.extrabold, color: "white", fontSize: 27, marginTop: 8 },
  sub: { fontFamily: fonts.regular, color: "rgba(255,255,255,.68)", fontSize: 13, marginTop: 5, lineHeight: 18 },
  info: { borderRadius: 18, backgroundColor: "#FFFEFC", borderWidth: 1, borderColor: "#EFE5D4", padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  infoIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: "#FFF2D6", alignItems: "center", justifyContent: "center" },
  infoCopy: { flex: 1 },
  infoLabel: { fontFamily: fonts.medium, color: colors.muted, fontSize: 11.5 },
  infoValue: { fontFamily: fonts.bold, color: colors.ink, fontSize: 14.5, marginTop: 2 },
  primary: { marginTop: 8, borderRadius: 17, backgroundColor: colors.gold, padding: 15, alignItems: "center" },
  primaryText: { fontFamily: fonts.extrabold, color: "#1A1040", fontSize: 14 },
  empty: { minHeight: 420, justifyContent: "center", alignItems: "center", padding: 24 },
  emptyTitle: { fontFamily: fonts.extrabold, color: colors.ink, fontSize: 22, marginTop: 13 },
  emptyText: { fontFamily: fonts.regular, color: colors.muted, textAlign: "center", lineHeight: 20, marginTop: 6, marginBottom: 8 },
  skeletonRow: { marginTop: 10 },
});
