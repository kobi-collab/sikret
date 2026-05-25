import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type Props = {
  resonance: number;
  size?: number;
  showLabel?: boolean;
  label?: string;
};

export function ResonanceRing({ resonance, size = 88, showLabel = true, label }: Props) {
  const value = Math.min(5, Math.max(1, resonance));
  const fill = (value - 1) / 4;
  const inner = size - 10;

  return (
    <View style={[styles.wrap, { width: size, height: size + (showLabel ? 28 : 0) }]}>
      <View style={[styles.vessel, { width: size, height: size, borderRadius: size / 2 }]}>
        <View
          style={[
            styles.vesselInner,
            { width: inner, height: inner, borderRadius: inner / 2 },
          ]}
        >
          <LinearGradient
            colors={['#2DE2E6', '#7B2FF7', '#FF2E97']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={[styles.liquid, { height: `${Math.max(8, fill * 100)}%` }]}
          />
          <View style={styles.liquidShine} />
        </View>
        <View style={styles.valueBubble}>
          <Text style={styles.value}>{value.toFixed(1)}</Text>
        </View>
      </View>
      {showLabel ? <Text style={styles.caption}>{label ?? 'תהודה'}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  vessel: {
    borderWidth: 1.5,
    borderColor: 'rgba(45, 226, 230, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 16, 38, 0.9)',
  },
  vesselInner: {
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: colors.bgDeep,
  },
  liquid: {
    width: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    opacity: 0.92,
  },
  liquidShine: {
    position: 'absolute',
    bottom: '20%',
    left: '15%',
    width: '25%',
    height: '8%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
  },
  valueBubble: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 6,
  },
  caption: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 8,
  },
});
