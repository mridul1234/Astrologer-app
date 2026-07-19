import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/src/api";
import { colors, fonts, shadow } from "@/src/ui";
import type { AstrologerProfile, Review } from "@/src/types";

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ReviewsScreen() {
  const [profile, setProfile] = useState<AstrologerProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => setProfile(await api<AstrologerProfile>("/api/astrologer/profile")), []);
  useEffect(() => { load().catch(() => {}); }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }

  if (!profile) return <View style={styles.loading}><ActivityIndicator color={colors.orange} /></View>;

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={profile.reviews}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.orange} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Feedback</Text>
            <View style={styles.summary}>
              <View style={styles.ratingCircle}>
                <Text style={styles.rating}>{profile.avgRating ? profile.avgRating.toFixed(1) : "-"}</Text>
                <Text style={styles.stars}>★★★★★</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryTitle}>{profile.reviews.length} reviews</Text>
                <Text style={styles.summaryText}>User feedback from completed consultations appears here.</Text>
              </View>
            </View>
            {profile.reviews.length === 0 && <Empty />}
          </View>
        }
        renderItem={({ item }) => <ReviewCard item={item} />}
        contentContainerStyle={styles.content}
      />
    </SafeAreaView>
  );
}

function Empty() {
  return (
    <View style={styles.empty}>
      <Ionicons name="star-outline" size={38} color={colors.gold} />
      <Text style={styles.emptyTitle}>No reviews yet</Text>
      <Text style={styles.emptyText}>Ratings and comments will appear after seekers review your sessions.</Text>
    </View>
  );
}

function ReviewCard({ item }: { item: Review }) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View>
          <Text style={styles.name}>{item.reviewerName || item.user?.name || "Anonymous user"}</Text>
          <Text style={styles.date}>{dateLabel(item.createdAt)}</Text>
        </View>
        <Text style={styles.cardStars}>{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</Text>
      </View>
      <Text style={styles.comment}>{item.comment || "No comment provided."}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream },
  content: { paddingBottom: 24 },
  header: { padding: 16, gap: 14 },
  title: { fontSize: 28, fontFamily: fonts.extrabold, color: colors.ink },
  summary: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: colors.white, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: colors.border, ...shadow },
  ratingCircle: { width: 96, height: 96, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: colors.goldSoft },
  rating: { fontSize: 30, fontFamily: fonts.extrabold, color: colors.orangeDark },
  stars: { color: colors.gold, fontSize: 12, marginTop: 3 },
  summaryTitle: { color: colors.ink, fontSize: 18, fontFamily: fonts.extrabold },
  summaryText: { color: colors.muted, marginTop: 5, lineHeight: 20 },
  empty: { backgroundColor: colors.white, borderRadius: 24, padding: 28, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  emptyTitle: { marginTop: 12, color: colors.ink, fontSize: 18, fontFamily: fonts.extrabold },
  emptyText: { color: colors.muted, textAlign: "center", marginTop: 6, lineHeight: 20 },
  card: { marginHorizontal: 16, marginTop: 10, backgroundColor: colors.white, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  name: { color: colors.ink, fontSize: 16, fontFamily: fonts.extrabold },
  date: { color: colors.muted, fontSize: 12, marginTop: 3 },
  cardStars: { color: colors.gold, fontSize: 14 },
  comment: { color: colors.muted, marginTop: 12, lineHeight: 21, fontStyle: "italic" },
});
