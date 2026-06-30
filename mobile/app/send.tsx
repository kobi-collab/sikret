import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { EnvelopeOrb } from '../src/components/EnvelopeOrb';
import { Screen } from '../src/components/Screen';
import { GlassCard, PrimaryButton, Subtitle, Title } from '../src/components/UI';
import { copy } from '../src/copy';
import { useApp } from '../src/context/AppContext';
import { useFlowGuard } from '../src/hooks/useFlowGuard';
import { MIN_CHARS } from '../src/constants';
import { routes } from '../src/routes';
import { colors, spacing } from '../src/theme';
import { hebrewText } from '../src/typography';

export default function SendScreen() {
  const { draft, refreshMe, retryServerSync } = useApp();
  const { blocked, pending } = useFlowGuard({ requireQuota: true });
  const [sending, setSending] = useState(false);

  if (pending) {
    return (
      <Screen>
        <ActivityIndicator color={colors.neonCyan} size="large" />
        <Subtitle>{copy.loadingProfile}</Subtitle>
      </Screen>
    );
  }

  if (blocked) return null;

  const send = async () => {
    if (sending) return;
    if (!draft.intention || !draft.content || draft.content.length < MIN_CHARS) {
      Alert.alert('שגיאה', 'חסרים פרטים לשליחה.');
      router.replace(routes.intention);
      return;
    }

    setSending(true);
    try {
      let profile = await refreshMe();
      if (!profile) {
        await retryServerSync();
        profile = await refreshMe();
      }
      if (!profile) {
        Alert.alert(copy.networkError, copy.serverWaking, [
          { text: copy.retry, onPress: () => send() },
        ]);
        return;
      }
      if (!profile.canStart && !profile.activeSwapId) {
        Alert.alert('שגיאה', copy.quotaExhausted, [
          { text: 'אישור', onPress: () => router.replace(routes.home) },
        ]);
        return;
      }
      router.push(routes.queue);
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen scroll>
      <View style={styles.center}>
        <EnvelopeOrb mode="locked" />
      </View>
      <Title>{copy.sendTitle}</Title>
      <Subtitle>{copy.sendHint}</Subtitle>
      <GlassCard>
        <Text style={styles.warn}>{copy.sendWarn}</Text>
      </GlassCard>
      <PrimaryButton label={copy.sendCta} onPress={send} disabled={sending} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', marginBottom: spacing.sm },
  warn: { color: colors.warning, lineHeight: 22, fontSize: 14, alignSelf: 'stretch', ...hebrewText },
});
