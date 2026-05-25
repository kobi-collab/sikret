import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, FeedbackResponse, SwapView } from '../src/api';
import { EnvelopeOrb } from '../src/components/EnvelopeOrb';
import { ResonanceReveal } from '../src/components/ResonanceReveal';
import { ResonanceRing } from '../src/components/ResonanceRing';
import { Screen } from '../src/components/Screen';
import { GlassCard, OutlineButton, PrimaryButton, Subtitle, Title } from '../src/components/UI';
import { copy } from '../src/copy';
import { useApp } from '../src/context/AppContext';
import { colors, spacing } from '../src/theme';

function feedbackLabel(type: string | null) {
  if (type === 'touched') return copy.feedbackTouched;
  if (type === 'dishonest') return copy.feedbackDishonest;
  if (type === 'report') return copy.feedbackReport;
  return null;
}

export default function SwapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId, refreshMe, setDraft } = useApp();
  const [swap, setSwap] = useState<SwapView | null>(null);
  const [reveal, setReveal] = useState<FeedbackResponse | null>(null);

  const poll = useCallback(async () => {
    if (!userId || !id) return;
    const s = await api.getSwap(userId, id);
    setSwap(s);
  }, [userId, id]);

  useFocusEffect(
    useCallback(() => {
      poll();
      const t = setInterval(poll, 2500);
      return () => clearInterval(t);
    }, [poll]),
  );

  const finish = async () => {
    setReveal(null);
    await refreshMe();
    setDraft({});
    router.replace('/');
  };

  const onFeedbackDone = (result: FeedbackResponse) => {
    setReveal(result);
  };

  const feedback = async (type: 'touched' | 'dishonest' | 'report') => {
    if (!userId || !id) return;
    if (type === 'report') {
      Alert.alert('דיווח', 'הדיווח נשלח. תודה על שמירה על הקהילה.', [
        {
          text: 'אישור',
          onPress: async () => {
            const result = await api.feedback(userId, id, type);
            onFeedbackDone(result);
          },
        },
      ]);
      return;
    }
    const result = await api.feedback(userId, id, type);
    onFeedbackDone(result);
  };

  if (!swap) {
    return (
      <Screen>
        <EnvelopeOrb mode="queue" />
        <Subtitle>{copy.swapLoading}</Subtitle>
      </Screen>
    );
  }

  const opened = swap.phase === 'opened' && swap.peerContent;

  if (!opened) {
    return (
      <Screen>
        <EnvelopeOrb mode="queue" />
        <Title>{copy.swapPreparing}</Title>
        <Subtitle>רגע אחד</Subtitle>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <ResonanceReveal visible={!!reveal} result={reveal} onClose={finish} />
      <View style={styles.resonanceRow}>
        <ResonanceRing resonance={swap.myResonance} size={72} label={copy.resonanceYours} />
        <ResonanceRing resonance={swap.peerResonance} size={72} label={copy.resonancePeer} />
      </View>
      <Title>{copy.swapFrom(swap.peerAlias)}</Title>
      <GlassCard>
        <Text style={styles.content}>{swap.peerContent}</Text>
      </GlassCard>
      {swap.envelopeFeedback ? (
        <GlassCard>
          <Text style={styles.secretFb}>
            {copy.swapYourSecretFeedback(feedbackLabel(swap.envelopeFeedback) ?? '')}
          </Text>
        </GlassCard>
      ) : null}
      <Subtitle>{copy.swapRateQuestion}</Subtitle>
      <PrimaryButton label={copy.feedbackTouched} onPress={() => feedback('touched')} />
      <OutlineButton label={copy.feedbackDishonest} onPress={() => feedback('dishonest')} />
      <OutlineButton label={copy.feedbackReport} onPress={() => feedback('report')} danger />
      <OutlineButton
        label={copy.finishNoRate}
        onPress={async () => {
          if (userId && id) await api.complete(userId, id);
          finish();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  resonanceRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  content: {
    color: colors.textPrimary,
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'right',
  },
  secretFb: {
    color: colors.neonCyan,
    textAlign: 'right',
    fontSize: 14,
    lineHeight: 22,
  },
});
