import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ResonanceRing } from '../src/components/ResonanceRing';
import { Screen } from '../src/components/Screen';
import { GlassCard, OutlineButton, PrimaryButton, Subtitle } from '../src/components/UI';
import { copy } from '../src/copy';
import { useApp } from '../src/context/AppContext';
import { colors, spacing } from '../src/theme';
import { routes } from '../src/routes';
import { hebrewText } from '../src/typography';

function quotaMessage(me: NonNullable<ReturnType<typeof useApp>['me']>) {
  if (me.quotaReason === 'quota' && me.dailyLimit === 2) return copy.quotaFirstDay;
  if (me.quotaReason === 'quota') return copy.quotaExhausted;
  return copy.quotaExhausted;
}

export default function HomeScreen() {
  const { me, refreshMe, meLoading, meError, retryServerSync, clearDraft } = useApp();

  useFocusEffect(
    useCallback(() => {
      refreshMe();
    }, [refreshMe]),
  );

  const remaining = me ? me.dailyLimit - me.dailyCompleted : 0;
  const canStart = me ? me.canStart : true;

  const start = async () => {
    let profile = me ?? (await refreshMe());
    if (!profile) {
      await retryServerSync();
      profile = await refreshMe();
      if (!profile) return;
    }
    if (profile.activeSwapId) {
      router.push({ pathname: '/swap', params: { id: profile.activeSwapId } });
      return;
    }
    await clearDraft();
    router.push(routes.intention);
  };

  if (meLoading && !me) {
    return (
      <Screen>
        <ActivityIndicator color={colors.neonCyan} size="large" />
        <Subtitle>{copy.loadingProfile}</Subtitle>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.logo}>{copy.appName}</Text>
        <Text style={styles.tagline}>{copy.tagline}</Text>
      </View>
      {meError && (
        <GlassCard>
          <Text style={styles.err}>{copy.networkError}</Text>
          <OutlineButton label={copy.retry} onPress={retryServerSync} />
        </GlassCard>
      )}
      <View style={styles.center}>
        <ResonanceRing resonance={me?.resonance ?? 3} size={100} label={copy.resonanceYours} />
      </View>
      <GlassCard>
        <Text style={styles.statLabel}>{copy.secretsToday}</Text>
        <Text style={styles.statValue}>
          {me?.dailyCompleted ?? 0} / {me?.dailyLimit ?? 2}
        </Text>
        <Text style={styles.statHint}>{copy.secretsLeft(Math.max(0, remaining))}</Text>
      </GlassCard>
      <Subtitle>{copy.homeHint}</Subtitle>
      <PrimaryButton
        label={me?.activeSwapId ? copy.continueSecret : copy.newSecret}
        onPress={start}
        disabled={meLoading || !!(me && !canStart && !me.activeSwapId)}
      />
      {me && !canStart && !me.activeSwapId && (
        <Text style={styles.warn}>{quotaMessage(me)}</Text>
      )}
      <OutlineButton label={copy.howItWorks} onPress={() => router.replace(routes.onboarding)} />
      <OutlineButton label={copy.supportLink} onPress={() => router.push(routes.support)} />
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
  warn: { color: colors.warning, textAlign: 'center', marginTop: spacing.sm, ...hebrewText },
  err: { color: colors.danger, marginBottom: spacing.sm, ...hebrewText },
});
