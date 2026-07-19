import { Animated, Dimensions, Modal, Platform, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useSession } from "@/src/session";
import { Skeleton, SkeletonLine } from "@/src/Skeleton";
import { useFocusSkeleton } from "@/src/useFocusSkeleton";
import { colors, fonts } from "@/src/ui";

const drawerWidth = Math.min(Dimensions.get("window").width * 0.82, 330);

const menuItems = [
  { label: "Home", icon: "home", route: "/(tabs)/home" },
  { label: "Astrologers", icon: "sparkles", route: "/(tabs)/chats" },
  { label: "My Kundli", icon: "planet", route: "/kundli" },
  { label: "My Chats", icon: "chatbubbles", route: "/my-chats" },
  { label: "Wallet", icon: "wallet", route: "/(tabs)/wallet" },
  { label: "Wallet Transactions", icon: "receipt", route: "/transactions" },
  { label: "Order History", icon: "time", route: "/orders" },
  { label: "Profile", icon: "person", route: "/(tabs)/profile" },
  { label: "Settings", icon: "settings", route: "/settings" },
] as const;

const socialIcons = [
  { icon: "logo-facebook", bg: "#2563EB" },
  { icon: "logo-instagram", bg: "#E1306C" },
] as const;

export function AppHeader() {
  const { user, logout, loading } = useSession();
  const focusSkeleton = useFocusSkeleton(260);
  const [open, setOpen] = useState(false);
  const slide = useRef(new Animated.Value(-drawerWidth)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const firstName = user?.name?.trim()?.split(" ")[0] || "User";
  const initial = firstName.charAt(0).toUpperCase();

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.timing(slide, { toValue: 0, duration: 240, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      slide.setValue(-drawerWidth);
      fade.setValue(0);
    }
  }, [fade, open, slide]);

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slide, { toValue: -drawerWidth, duration: 210, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => setOpen(false));
  };

  const go = (route: string) => {
    closeDrawer();
    router.push(route as any);
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFEFC" />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {loading || focusSkeleton ? <Skeleton width={36} height={36} radius={18} /> : (
            <Pressable style={styles.userAvatar} onPress={() => setOpen(true)}>
              <Text style={styles.avatarText}>{initial}</Text>
              <View style={styles.avatarMenu}>
                <Ionicons name="menu" size={10} color="#8B8274" />
              </View>
            </Pressable>
          )}
          <View style={styles.titleWrap}>
            {loading || focusSkeleton ? (
              <>
                <SkeletonLine width="54%" height={17} />
                <SkeletonLine width="70%" height={10} style={styles.skeletonCaption} />
              </>
            ) : (
              <>
                <Text style={styles.brand} numberOfLines={1}>AstroWalla</Text>
                <Text style={styles.caption} numberOfLines={1}>Hi, {firstName}</Text>
              </>
            )}
          </View>
        </View>

        <Pressable style={styles.search} onPress={() => router.push("/(tabs)/chats")}>
          <Ionicons name="search" size={23} color="#0F172A" />
        </Pressable>
        {loading || focusSkeleton ? <Skeleton width={78} height={34} radius={18} /> : (
          <Pressable style={styles.wallet} onPress={() => router.push("/(tabs)/wallet")}>
            <Ionicons name="wallet-outline" size={20} color="white" />
            <Text style={styles.walletText}>₹{Math.floor(user?.walletBalance || 0)}</Text>
            <View style={styles.walletPlus}>
              <Ionicons name="add" size={13} color={colors.green} />
            </View>
          </Pressable>
        )}
      </View>

      <Modal visible={open} transparent animationType="none" onRequestClose={closeDrawer}>
        <View style={styles.overlay}>
          <Animated.View style={[styles.scrim, { opacity: fade }]} />
          <Pressable style={styles.scrimTouchable} onPress={closeDrawer} />
          <Animated.View style={[styles.drawer, { transform: [{ translateX: slide }] }]}>
            <View style={styles.drawerTop}>
              <View style={styles.drawerAvatar}>
                <Text style={styles.drawerAvatarText}>{initial}</Text>
              </View>
              <View style={styles.drawerInfo}>
                <Text style={styles.drawerName} numberOfLines={1}>{user?.name || firstName}</Text>
                <Text style={styles.drawerMeta}>{user?.id ? "AstroWalla member" : "+91 • AstroWalla"}</Text>
              </View>
              <Pressable style={styles.editPill} onPress={() => go("/(tabs)/profile")}>
                <Ionicons name="pencil" size={14} color={colors.ink} />
              </Pressable>
              <Pressable style={styles.closePlain} onPress={closeDrawer}>
                <Ionicons name="close" size={28} color="#111827" />
              </Pressable>
            </View>

            <View style={styles.menuList}>
              {menuItems.map((item) => (
                <Pressable key={item.label} style={styles.menuItem} onPress={() => go(item.route)}>
                  <Ionicons name={item.icon} size={24} color="#8A8A8A" style={styles.menuIconPlain} />
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.socialBlock}>
              <Text style={styles.socialTitle}>Also available on</Text>
              <View style={styles.socialRow}>
                {socialIcons.map((item) => (
                  <View key={item.icon} style={[styles.socialIcon, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon} size={18} color="white" />
                  </View>
                ))}
              </View>
              <Text style={styles.version}>Version 1.0.0</Text>
            </View>

            <Pressable
              style={styles.logout}
              onPress={() => {
                closeDrawer();
                void logout();
              }}
            >
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              <Text style={styles.logoutText}>Log out</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 12 : 12,
    paddingBottom: 13,
    backgroundColor: "#FFFEFC",
    borderBottomWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  headerLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, minWidth: 0 },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF0D2",
    borderWidth: 1,
    borderColor: "#EAD393",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarText: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.orangeDark },
  avatarMenu: { position: "absolute", right: -3, bottom: 1, backgroundColor: "#FFFEFC", borderRadius: 7 },
  titleWrap: { flex: 1, minWidth: 0 },
  brand: { fontFamily: fonts.extrabold, fontSize: 18, lineHeight: 22, color: colors.ink, letterSpacing: 0 },
  caption: { marginTop: -1, fontFamily: fonts.medium, fontSize: 11.5, color: colors.muted },
  skeletonCaption: { marginTop: 5 },
  search: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  wallet: {
    backgroundColor: "#08A84F",
    borderRadius: 22,
    paddingVertical: 7,
    paddingLeft: 10,
    paddingRight: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    shadowColor: "#08A84F",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  walletText: { fontFamily: fonts.extrabold, fontSize: 15, color: "white" },
  walletPlus: { width: 19, height: 19, borderRadius: 10, backgroundColor: "white", alignItems: "center", justifyContent: "center" },
  overlay: { flex: 1, flexDirection: "row" },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,.55)" },
  scrimTouchable: { ...StyleSheet.absoluteFillObject },
  drawer: {
    width: drawerWidth,
    height: "100%",
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 18 : 20,
    paddingHorizontal: 26,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 12,
  },
  drawerTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 22 },
  drawerAvatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E8D469" },
  drawerAvatarText: { fontFamily: fonts.extrabold, color: colors.ink, fontSize: 22 },
  drawerInfo: { flex: 1, minWidth: 0 },
  drawerName: { fontFamily: fonts.bold, fontSize: 18, color: "#111827" },
  drawerMeta: { fontFamily: fonts.regular, fontSize: 12, color: "#111827", marginTop: 3 },
  editPill: { marginLeft: -4, width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  closePlain: { marginLeft: 8, width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  menuList: { gap: 0 },
  menuItem: { minHeight: 48, flexDirection: "row", alignItems: "center" },
  menuIconPlain: { width: 39 },
  menuLabel: { fontFamily: fonts.regular, fontSize: 17.5, color: "#111827" },
  socialBlock: { marginTop: "auto", paddingBottom: 16 },
  socialTitle: { fontFamily: fonts.regular, fontSize: 14, color: "#555", marginBottom: 12 },
  socialRow: { flexDirection: "row", gap: 14 },
  socialIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  version: { fontFamily: fonts.regular, color: colors.green, fontSize: 16, textAlign: "center", marginTop: 16 },
  logout: { marginTop: 8, marginBottom: 20, borderRadius: 14, backgroundColor: "#FFF1F1", padding: 11, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  logoutText: { fontFamily: fonts.bold, color: "#EF4444", fontSize: 14 },
});
