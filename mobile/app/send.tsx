import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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
import { getDraft, type Draft } from '../src/storage';

async function resolveDraft(contextDraft: Draft): Promise<Draft> {
  const stored = await getDraft();
  return {
    intention: contextDraft.intention ?? stored.intention,
    content: contextDraft.content ?? stored.content,
  };
}

export default function SendScreen() {
  const { draft, setDraft, refreshMe } = useApp();
  const { blocked } = useFlowGuard();
  const [sending, setSending] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getDraft().then((stored) => {
        if (stored.intention || stored.content) {
          setDraft(stored);
        }
      });
      refreshMe();
    }, [setDraft, refreshMe]),
  );

  if (blocked) return null;

  const send = () => {
    if (sending) return;

    setSending(true);
    (async () => {
      try {
        const resolved = await resolveDraft(draft);
        if (resolved.intention !== draft.intention || resolved.content !== draft.content) {
          setDraft(resolved);
        }

        if (!resolved.intention || !resolved.content || resolved.content.length < MIN_CHARS) {
          Alert.alert('שגיאה', 'חסרים פרטים לשליחה.');
          router.replace(routes.intention);
          return;
        }

        router.push(routes.queue);
      } finally {
        setSending(false);
      }
    })();
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
      <PrimaryButton
        label={sending ? copy.queueJoining : copy.sendCta}
        onPress={send}
        disabled={sending}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', marginBottom: spacing.sm },
  warn: { color: colors.warning, lineHeight: 22, fontSize: 14, alignSelf: 'stretch', ...hebrewText },
});
