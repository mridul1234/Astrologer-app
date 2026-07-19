import { useEffect, useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { AppHeader } from "@/src/AppHeader";
import { api } from "@/src/api";
import { Skeleton, SkeletonLine } from "@/src/Skeleton";
import { useSession } from "@/src/session";
import { useFocusSkeleton } from "@/src/useFocusSkeleton";
import { colors, fonts } from "@/src/ui";

type KundliProfile = {
  fullName: string;
  dateOfBirth: string;
  timeOfBirth: string | null;
  placeOfBirth: string;
};

export default function ProfileScreen() {
  const { user, logout, loading, refresh } = useSession();
  const focusSkeleton = useFocusSkeleton();
  const [kundli, setKundli] = useState<KundliProfile | null>(null);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "">("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const pageLoading = loading || focusSkeleton;

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  useEffect(() => {
    api<KundliProfile | null>("/api/user/kundli")
      .then((data) => {
        setKundli(data);
        if (data?.fullName) setName(data.fullName);
      })
      .catch(() => undefined);
  }, []);

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter your name.");
      return;
    }
    try {
      setSaving(true);
      await api("/api/mobile/me", {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim() }),
      });
      if (kundli?.dateOfBirth && kundli.placeOfBirth) {
        await api("/api/user/kundli", {
          method: "POST",
          body: JSON.stringify({
            fullName: name.trim(),
            dateOfBirth: kundli.dateOfBirth,
            timeOfBirth: kundli.timeOfBirth || "12:00",
            placeOfBirth: kundli.placeOfBirth,
          }),
        });
      }
      await refresh();
      Alert.alert("Profile updated", "Your profile details have been saved.");
    } catch (error: any) {
      Alert.alert("Could not save profile", error.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {pageLoading ? (
          <>
            <Skeleton width={116} height={116} radius={58} style={styles.avatarSkeleton} />
            <SkeletonLine width="42%" height={17} style={styles.centerSkeleton} />
            {[0, 1, 2, 3, 4, 5].map((item) => <SkeletonLine key={item} width="100%" height={62} style={styles.rowSkeleton} />)}
          </>
        ) : (
          <>
            <View style={styles.profileTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(name || user?.name || "U").charAt(0).toUpperCase()}</Text>
                <Pressable style={styles.uploadBadge} onPress={() => Alert.alert("Profile photo", "Photo upload can be added once image storage is enabled.")}>
                  <Ionicons name="cloud-upload-outline" size={17} color={colors.orangeDark} />
                </Pressable>
              </View>
              <Text style={styles.phone}>AstroWalla member</Text>
            </View>

            <ProfileField label="Name*" value={name} onChangeText={setName} placeholder="Enter your name" />

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderRow}>
                {(["Male", "Female"] as const).map((item) => (
                  <Pressable key={item} style={styles.genderOption} onPress={() => setGender(item)}>
                    <View style={[styles.radio, gender === item && styles.radioActive]}>
                      {gender === item && <View style={styles.radioDot} />}
                    </View>
                    <Text style={styles.genderText}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <DisplayField label="Date of Birth" value={kundli?.dateOfBirth ? formatDate(kundli.dateOfBirth) : "Add your birth date"} onPress={() => router.push("/onboarding")} />
            <DisplayField label="Time of Birth" value={kundli?.timeOfBirth ? formatTime(kundli.timeOfBirth) : "Add your birth time"} onPress={() => router.push("/onboarding")} />
            <DisplayField label="Place of Birth" value={kundli?.placeOfBirth || "Add your birth place"} onPress={() => router.push("/onboarding")} />
            <ProfileField label="Current Address" value={address} onChangeText={setAddress} placeholder="Enter flat, house no, building, apartment" />

            <Pressable style={[styles.submit, (!name.trim() || saving) && styles.submitDisabled]} disabled={!name.trim() || saving} onPress={submit}>
              <Text style={[styles.submitText, (!name.trim() || saving) && styles.submitTextDisabled]}>{saving ? "Saving..." : "Submit"}</Text>
            </Pressable>

            <View style={styles.actions}>
              <Pressable style={styles.actionRow} onPress={() => router.push("/settings")}>
                <Ionicons name="settings-outline" size={18} color={colors.orangeDark} />
                <Text style={styles.actionText}>Settings</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </Pressable>
              <Pressable style={styles.actionRow} onPress={logout}>
                <Ionicons name="log-out-outline" size={18} color={colors.red} />
                <Text style={[styles.actionText, styles.logoutText]}>Log out</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#8B8B8B" />
    </View>
  );
}

function DisplayField({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable style={styles.fieldBlock} onPress={onPress}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.displayRow}>
        <Text style={styles.displayValue}>{value}</Text>
        <Ionicons name="chevron-forward" size={16} color="#B8AD9D" />
      </View>
    </Pressable>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

function formatTime(value: string) {
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number(hourRaw || 0);
  const minute = Number(minuteRaw || 0);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F3F3F3" },
  content: { paddingHorizontal: 28, paddingTop: 24, paddingBottom: 34 },
  profileTop: { alignItems: "center", marginBottom: 25 },
  avatar: { width: 118, height: 118, borderRadius: 59, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center", position: "relative", borderWidth: 1, borderColor: "#E6C62D" },
  avatarText: { fontFamily: fonts.extrabold, fontSize: 45, color: colors.ink },
  uploadBadge: { position: "absolute", right: 2, bottom: 8, width: 36, height: 36, borderRadius: 18, backgroundColor: "#FFFEFC", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E9E2D7", shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 5, elevation: 3 },
  phone: { fontFamily: fonts.semibold, color: "#6B6B6B", fontSize: 16, marginTop: 13 },
  fieldBlock: { marginBottom: 22 },
  label: { fontFamily: fonts.regular, color: "#171717", fontSize: 18, marginBottom: 10 },
  input: { fontFamily: fonts.bold, color: "#686868", fontSize: 15.5, paddingVertical: 5, borderBottomWidth: 1.4, borderBottomColor: "#E4DFA6" },
  genderRow: { flexDirection: "row", alignItems: "center", gap: 34, paddingVertical: 4, borderBottomWidth: 1.4, borderBottomColor: "transparent" },
  genderOption: { flexDirection: "row", alignItems: "center", gap: 10 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 3, borderColor: colors.gold, alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: colors.orange },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.orange },
  genderText: { fontFamily: fonts.semibold, color: "#171717", fontSize: 15.5 },
  displayRow: { borderBottomWidth: 1.4, borderBottomColor: "#E4DFA6", paddingBottom: 7, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  displayValue: { flex: 1, fontFamily: fonts.bold, color: "#686868", fontSize: 15.5 },
  submit: { marginTop: 4, borderRadius: 0, backgroundColor: colors.gold, paddingVertical: 17, alignItems: "center" },
  submitDisabled: { backgroundColor: "#DADADA" },
  submitText: { fontFamily: fonts.extrabold, color: "#1A1040", fontSize: 16 },
  submitTextDisabled: { color: "#9B9B9B" },
  actions: { marginTop: 16, borderRadius: 18, backgroundColor: "#FFFEFC", borderWidth: 1, borderColor: "#E6DED2", overflow: "hidden" },
  actionRow: { minHeight: 52, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, borderBottomColor: "#F1E8DC" },
  actionText: { flex: 1, fontFamily: fonts.bold, color: colors.ink, fontSize: 14.5 },
  logoutText: { color: colors.red },
  avatarSkeleton: { alignSelf: "center", marginBottom: 12 },
  centerSkeleton: { alignSelf: "center", marginBottom: 22 },
  rowSkeleton: { marginBottom: 20 },
});
