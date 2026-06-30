import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import { useFlowGuard } from '../src/hooks/useFlowGuard';
import { routes } from '../src/routes';
import { colors, spacing } from '../src/theme';
import { hebrewText } from '../src/typography';

function feedbackLabel(type: string | null) {
  if (type === 'touched') return copy.feedbackTouched;
  if (type === 'dishonest') return copy.feedbackDishonest;
  if (type === 'report') return copy.feedbackReport;
  return null;
}

export default function SwapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId, refreshMe, clearDraft } = useApp();
  useFlowGuard();
  const [swap, setSwap] = useState<SwapView | null>(null);
  const [reveal, setReveal] = useState<FeedbackResponse | null>(null);
  const [contentHidden, setContentHidden] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const poll = useCallback(async () => {
    if (!userId || !id || contentHidden) return;
    try {
      const s = await api.getSwap(userId, id);
      setSwap(s);
      setLoadError(false);
      if (s.peerHidden || !s.peerContent) {
        setContentHidden(true);
      }
    } catch {
      setLoadError(true);
    }
  }, [userId, id, contentHidden]);

  useFocusEffect(
    useCallback(() => {
      if (!id) {
        setLoadError(true);
        return;
      }
      poll();
      const t = setInterval(poll, 2500);
      return () => clearInterval(t);
    }, [poll, id]),
  );

  useEffect(() => {
    if (!id) {
      Alert.alert('שגיאה', copy.swapInvalid, [{ text: 'אישור', onPress: () => router.replace(routes.home) }]);
    }
  }, [id]);

  const finish = async () => {
    setReveal(null);
    await refreshMe();
    await clearDraft();
    router.replace(routes.home);
  };

  const onFeedbackDone = (result: FeedbackResponse) => {
    setReveal(result);
  };

  const hideContent = async () => {
    if (!userId || !id) return;
    try {
      await api.hideSwap(userId, id);
      setContentHidden(true);
      setSwap((prev) => (prev ? { ...prev, peerContent: null, peerHidden: true, phase: 'hidden' } : prev));
      await refreshMe();
      Alert.alert(copy.contentRemoved, '', [{ text: 'אישור', onPress: finish }]);
    } catch {
      Alert.alert('שגיאה', copy.networkError);
    }
  };

  const report = () => {
    if (!userId || !id) return;
    Alert.alert(copy.reportConfirmTitle, 'האם לדווח על הסוד ולהסירו מהמסך?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: copy.feedbackReport,
        style: 'destructive',
        onPress: async () => {
          setContentHidden(true);
          setSwap((prev) => (prev ? { ...prev, peerContent: null, peerHidden: true, phase: 'hidden' } : prev));
          try {
            await api.reportSwap(userId, id);
            Alert.alert(copy.reportConfirmTitle, copy.reportConfirmBody, [
              { text: 'אישור', onPress: finish },
            ]);
          } catch {
            Alert.alert('שגיאה', 'לא הצלחנו לשלוח דיווח. נסה שוב.');
            setContentHidden(false);
            poll();
          }
        },
      },
    ]);
  };

  const feedback = async (type: 'touched' | 'dishonest') => {
    if (!userId || !id) return;
    try {
      const result = await api.feedback(userId, id, type);
      onFeedbackDone(result);
    } catch {
      Alert.alert('שגיאה', copy.networkError);
    }
  };

  if (loadError && !swap) {
    return (
      <Screen>
        <Title>{copy.swapError}</Title>
        <OutlineButton label={copy.retry} onPress={poll} />
        <OutlineButton label="חזרה לבית" onPress={() => router.replace(routes.home)} />
      </Screen>
    );
  }

  if (!swap) {
    return (
      <Screen>
        <EnvelopeOrb mode="queue" />
        <Subtitle>{copy.swapLoading}</Subtitle>
      </Screen>
    );
  }

  const opened = swap.phase === 'opened' && swap.peerContent && !contentHidden;

  if (!opened) {
    if (contentHidden || swap.peerHidden) {
      return (
        <Screen>
          <Title>{copy.contentRemoved}</Title>
          <Subtitle>{copy.reportConfirmBody}</Subtitle>
          <PrimaryButton label="חזרה לבית" onPress={finish} />
        </Screen>
      );
    }
    return (
      <Screen>
        <EnvelopeOrb mode="queue" />
        <Title>{copy.swapPreparing}</Title>
        <Subtitle>{swap.isBot ? copy.botHint : 'רגע אחד'}</Subtitle>
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
      <OutlineButton label={copy.feedbackReport} onPress={report} danger />
      <OutlineButton label={copy.hideFromScreen} onPress={hideContent} />
      <OutlineButton
        label={copy.finishNoRate}
        onPress={async () => {
          if (!userId || !id) return;
          try {
            await api.complete(userId, id);
          } catch {
            Alert.alert('שגיאה', copy.networkError);
            return;
          }
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
    ...hebrewText,
  },
  secretFb: {
    color: colors.neonCyan,
    fontSize: 14,
    lineHeight: 22,
    ...hebrewText,
  },
});
