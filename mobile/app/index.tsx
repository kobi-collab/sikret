import { router } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ResonanceRing } from '../src/components/ResonanceRing';
import { Screen } from '../src/components/Screen';
import { GlassCard, OutlineButton, PrimaryButton, Subtitle } from '../src/components/UI';
import { copy } from '../src/copy';
import { useApp } from '../src/context/AppContext';
import { colors, spacing } from '../src/theme';
import { hebrewText } from '../src/typography';

export default function HomeScreen() {
  const { me, refreshMe } = useApp();

  useFocusEffect(
    useCallback(() => {
      refreshMe();
    }, [refreshMe]),
  );

  if (me?.suspendedUntil && me.suspendedUntil > Date.now()) {
    router.replace('/suspended');
    return null;
  }

  const remaining = (me?.dailyLimit ?? 3) - (me?.dailyCompleted ?? 0);
  const canStart = me?.canStart ?? true;

  const start = () => {
    if (me?.activeSwapId) {
      router.push({ pathname: '/swap', params: { id: me.activeSwapId } });
      return;
    }
    router.push('/intention');
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.logo}>{copy.appName}</Text>
        <Text style={styles.tagline}>{copy.tagline}</Text>
      </View>
      <View style={styles.center}>
        <ResonanceRing resonance={me?.resonance ?? 3} size={100} label={copy.resonanceYours} />
      </View>
      <GlassCard>
        <Text style={styles.statLabel}>{copy.secretsToday}</Text>
        <Text style={styles.statValue}>
          {me?.dailyCompleted ?? 0} / {me?.dailyLimit ?? 3}
        </Text>
        <Text style={styles.statHint}>{copy.secretsLeft(Math.max(0, remaining))}</Text>
      </GlassCard>
      <Subtitle>{copy.homeHint}</Subtitle>
      <PrimaryButton
        label={me?.activeSwapId ? copy.continueSecret : copy.newSecret}
        onPress={start}
        disabled={!canStart && !me?.activeSwapId}
      />
      {!canStart && (
        <Text style={styles.warn}>הגעת למכסה היומית. חוזר בחצות.</Text>
      )}
      <OutlineButton label={copy.howItWorks} onPress={() => router.push('/onboarding')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.md },
  logo: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    alignSelf: 'stretch',
    ...hebrewText,
  },
  tagline: {
    color: colors.neonCyan,
    marginTop: 6,
    fontSize: 16,
    fontWeight: '500',
    alignSelf: 'stretch',
    ...hebrewText,
  },
  center: { alignItems: 'center' },
  statLabel: { color: colors.textMuted, fontSize: 13, alignSelf: 'stretch', ...hebrewText },
  statValue: {
    color: colors.textPrimary,
    fontSize: 36,
    fontWeight: '700',
    marginVertical: 4,
    alignSelf: 'stretch',
    ...hebrewText,
  },
  statHint: { color: colors.textSecondary, fontSize: 14, alignSelf: 'stretch', ...hebrewText },
  warn: { color: colors.warning, textAlign: 'center', marginTop: spacing.sm },
});
