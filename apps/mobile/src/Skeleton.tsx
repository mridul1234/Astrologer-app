import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, type ViewStyle } from "react-native";

type SkeletonProps = {
  width?: number | `${number}%`;
  height: number;
  radius?: number;
  style?: ViewStyle;
};

export function Skeleton({ width = "100%", height, radius = 12, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 760, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 760, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.skeleton, { width, height, borderRadius: radius, opacity }, style]} />;
}

export function SkeletonLine({ width = "100%", height = 12, style }: Omit<SkeletonProps, "height"> & { height?: number }) {
  return <Skeleton width={width} height={height} radius={height / 2} style={style} />;
}

export function AstrologerCardSkeleton() {
  return (
    <View style={styles.astroCard}>
      <View style={styles.astroTop}>
        <View style={styles.photoColumn}>
          <Skeleton width={52} height={52} radius={26} />
          <SkeletonLine width={48} height={9} style={styles.mt8} />
          <SkeletonLine width={52} height={8} style={styles.mt5} />
        </View>
        <View style={styles.flex}>
          <SkeletonLine width="62%" height={17} />
          <SkeletonLine width="88%" height={12} style={styles.mt8} />
          <SkeletonLine width="72%" height={12} style={styles.mt7} />
          <SkeletonLine width="55%" height={12} style={styles.mt7} />
        </View>
        <View style={styles.side}>
          <Skeleton width={27} height={27} radius={14} />
          <Skeleton width={64} height={31} radius={11} />
        </View>
      </View>
      <View style={styles.footer}>
        <SkeletonLine width="52%" height={10} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: { backgroundColor: "#EFE7DA" },
  astroCard: { backgroundColor: "#FFFEFC", marginHorizontal: 18, marginBottom: 9, borderWidth: 1, borderColor: "#E5E2DD", borderRadius: 17, overflow: "hidden" },
  astroTop: { paddingHorizontal: 11, paddingVertical: 9, flexDirection: "row", alignItems: "center", gap: 10 },
  photoColumn: { width: 62, alignItems: "center" },
  flex: { flex: 1 },
  side: { width: 70, alignSelf: "stretch", alignItems: "center", justifyContent: "space-between", paddingVertical: 1 },
  footer: { minHeight: 25, borderTopWidth: 1, borderTopColor: "#E6E1DA", alignItems: "center", justifyContent: "center" },
  mt5: { marginTop: 5 },
  mt7: { marginTop: 7 },
  mt8: { marginTop: 8 },
});
