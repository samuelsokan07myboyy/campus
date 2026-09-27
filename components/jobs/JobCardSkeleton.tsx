import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export function JobCardSkeleton() {
  const { theme } = useTheme();
  const c = theme.colors;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  return (
    <View style={[styles.skeletonCard, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={styles.topRow}>
        <Animated.View
          style={[
            styles.logoSkeleton,
            { backgroundColor: c.border, opacity: pulseAnim },
          ]}
        />
        <View style={styles.titleLines}>
          <Animated.View
            style={[
              styles.lineLong,
              { backgroundColor: c.border, opacity: pulseAnim },
            ]}
          />
          <Animated.View
            style={[
              styles.lineShort,
              { backgroundColor: c.border, opacity: pulseAnim },
            ]}
          />
        </View>
      </View>

      <View style={styles.locationSkeletonRow}>
        <Animated.View
          style={[
            styles.lineMedium,
            { backgroundColor: c.border, opacity: pulseAnim },
          ]}
        />
      </View>

      <View style={styles.pillsSkeletonRow}>
        <Animated.View
          style={[
            styles.pillSkeleton,
            { backgroundColor: c.border, opacity: pulseAnim },
          ]}
        />
        <Animated.View
          style={[
            styles.pillSkeletonSmall,
            { backgroundColor: c.border, opacity: pulseAnim },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoSkeleton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginRight: 12,
  },
  titleLines: {
    flex: 1,
    gap: 8,
  },
  lineLong: {
    height: 16,
    borderRadius: 8,
    width: '85%',
  },
  lineShort: {
    height: 12,
    borderRadius: 6,
    width: '45%',
  },
  locationSkeletonRow: {
    marginTop: 14,
  },
  lineMedium: {
    height: 12,
    borderRadius: 6,
    width: '60%',
  },
  pillsSkeletonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  pillSkeleton: {
    width: 80,
    height: 24,
    borderRadius: 8,
  },
  pillSkeletonSmall: {
    width: 60,
    height: 24,
    borderRadius: 8,
  },
});
