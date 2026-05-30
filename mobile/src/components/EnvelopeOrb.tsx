import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, ColorValue, Easing, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

type Mode = 'idle' | 'queue' | 'locked' | 'open';

type Props = { mode?: Mode; size?: number };

function ringGradientColors(mode: Mode): readonly [ColorValue, ColorValue, ...ColorValue[]] {
  if (mode === 'locked') {
    return [colors.locked, colors.neonMagenta, colors.locked];
  }
  return [colors.neonCyan, colors.neonPurple, colors.neonMagenta, colors.neonCyan];
}

export function EnvelopeOrb({ mode = 'idle', size = 140 }: Props) {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (mode === 'queue') {
      Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      spin.stopAnimation();
      spin.setValue(0);
    }
  }, [mode, spin]);

  useEffect(() => {
    if (mode === 'open') {
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    }
  }, [mode, pulse]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const ringColors = ringGradientColors(mode);

  return (
    <Animated.View style={{ transform: [{ rotate }, { scale }], marginVertical: 24 }}>
      <View
        style={[
          styles.outer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            shadowColor: mode === 'locked' ? colors.neonMagenta : colors.neonCyan,
          },
        ]}
      >
        <LinearGradient colors={ringColors} style={styles.ring} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={[styles.core, { width: size - 16, height: size - 16, borderRadius: (size - 16) / 2 }]}>
            <View style={styles.diamond} />
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  ring: {
    padding: 3,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  core: {
    backgroundColor: colors.bgDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamond: {
    width: 28,
    height: 28,
    backgroundColor: colors.neonCyan,
    transform: [{ rotate: '45deg' }],
    opacity: 0.85,
  },
});
