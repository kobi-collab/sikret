import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, waitForApi } from '../src/api';
import { EnvelopeOrb } from '../src/components/EnvelopeOrb';
import { Screen } from '../src/components/Screen';
import { OutlineButton, Subtitle, Title } from '../src/components/UI';
import { copy } from '../src/copy';
import { useApp } from '../src/context/AppContext';
import { useFlowGuard } from '../src/hooks/useFlowGuard';
import { routes } from '../src/routes';
import { colors } from '../src/theme';
import { MIN_CHARS } from '../src/constants';

async function goToSwapIfReady(userId: string): Promise<string | null> {
  const s = await api.queueStatus(userId);
  if (s.status === 'matched' && s.swapId) return s.swapId;
  const me = await api.me(userId);
  if (me.activeSwapId) return me.activeSwapId;
  return null;
}

export default function QueueScreen() {
  const { ready, userId, draft, refreshMe, clearDraft, retryServerSync } = useApp();
  const { blocked, pending } = useFlowGuard({ requireQuota: true });
  const [status, setStatus] = useState<'joining' | 'queued' | 'error' | 'idle'>('joining');
  const [hint, setHint] = useState(copy.queueJoining);
  const joining = useRef(false);
  const idleTicks = useRef(0);
  const draftKey = `${draft.intention ?? ''}:${draft.content?.length ?? 0}`;

  useFocusEffect(
    useCallback(() => {
      joining.current = false;
      idleTicks.current = 0;
      setStatus('joining');
      setHint(copy.queueJoining);
    }, []),
  );

  useEffect(() => {
    if (!ready || blocked || pending) return;
    if (!userId) {
      const t = setTimeout(() => {
        Alert.alert(copy.networkError, copy.serverWaking, [
          { text: copy.retry, onPress: () => retryServerSync() },
          { text: 'חזרה', onPress: () => router.back() },
        ]);
      }, 8000);
      return () => clearTimeout(t);
    }
    if (!draft.intention || !draft.content || draft.content.length < MIN_CHARS) {
      Alert.alert('שגיאה', 'חסרים פרטים לשליחה.', [{ text: 'אישור', onPress: () => router.back() }]);
      return;
    }
    if (joining.current) return;
    joining.current = true;

    const joinTimeout = setTimeout(() => {
      joining.current = false;
      Alert.alert(copy.networkError, copy.serverWaking, [
        { text: copy.retry, onPress: () => router.replace(routes.queue) },
        { text: 'חזרה', onPress: () => router.back() },
      ]);
    }, 60000);

    (async () => {
      setHint(copy.queueWaking);
      const ok = await waitForApi();
      if (!ok) {
        clearTimeout(joinTimeout);
        joining.current = false;
        setStatus('error');
        Alert.alert(copy.networkError, '', [{ text: 'חזרה', onPress: () => router.back() }]);
        return;
      }

      try {
        const res = await api.joinQueue(userId, {
          intention: draft.intention!,
          content: draft.content!,
        });
        clearTimeout(joinTimeout);

        if (res.status === 'matched' && res.swapId) {
          await clearDraft();
          router.replace({ pathname: '/swap', params: { id: res.swapId } });
          return;
        }
        setStatus('queued');
        setHint(copy.queueWaiting);
      } catch (e: unknown) {
        clearTimeout(joinTimeout);
        joining.current = false;
        const err = e as Error & { code?: string; data?: { message?: string; accountAction?: string } };
        setStatus('error');

        if (err.code === 'active_swap') {
          const me = await api.me(userId);
          if (me.activeSwapId) {
            router.replace({ pathname: '/swap', params: { id: me.activeSwapId } });
            return;
          }
        }
        if (err.code === 'suspended' || err.code === 'banned') {
          router.replace(routes.suspended);
          return;
        }
        if (err.code === 'quota') {
          Alert.alert('שגיאה', copy.quotaExhausted);
        } else if (err.code === 'content_blocked') {
          const msg = err.data?.message;
          if (err.data?.accountAction === 'banned' || err.data?.accountAction === 'suspended') {
            router.replace(routes.suspended);
            return;
          }
          Alert.alert('לא ניתן לשלוח', msg || 'התוכן אינו עומד בכללי הקהילה.');
        } else if (err.code === 'eula_required') {
          router.replace(routes.terms);
        } else if (err.code === 'network_error') {
          Alert.alert('שגיאה', copy.networkError);
        } else {
          Alert.alert('שגיאה', 'לא הצלחנו להיכנס לתור');
        }
        router.back();
      }
    })();

    return () => {
      clearTimeout(joinTimeout);
      joining.current = false;
    };
  }, [ready, blocked, pending, userId, draftKey, draft, clearDraft, retryServerSync]);

  useEffect(() => {
    if (status !== 'queued' || !userId) return;

    const poll = async () => {
      try {
        const swapId = await goToSwapIfReady(userId);
        if (swapId) {
          idleTicks.current = 0;
          await refreshMe();
          await clearDraft();
          router.replace({ pathname: '/swap', params: { id: swapId } });
          return;
        }
        const st = await api.queueStatus(userId);
        if (st.status === 'idle') {
          idleTicks.current += 1;
          if (idleTicks.current >= 30) {
            setStatus('idle');
            setHint(copy.networkError);
          }
        } else {
          idleTicks.current = 0;
        }
      } catch {
        setHint(copy.queueWaiting);
      }
    };

    poll();
    const t = setInterval(poll, 1000);
    return () => clearInterval(t);
  }, [status, userId, refreshMe, clearDraft]);

  const leave = async () => {
    joining.current = false;
    if (userId) {
      try {
        await api.leaveQueue(userId);
      } catch {
        /* leave anyway */
      }
    }
    router.back();
  };

  if (pending) {
    return (
      <Screen>
        <ActivityIndicator color={colors.neonCyan} size="large" />
        <Text style={styles.hint}>{copy.loadingProfile}</Text>
      </Screen>
    );
  }

  if (status === 'error') {
    return (
      <Screen>
        <Title>{copy.networkError}</Title>
        <OutlineButton label={copy.retry} onPress={() => router.replace(routes.queue)} />
        <OutlineButton label={copy.leaveQueue} onPress={leave} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>{copy.queueTitle}</Title>
      <Subtitle>{copy.queueHint}</Subtitle>
      <EnvelopeOrb mode="queue" />
      <Text style={styles.hint}>{hint}</Text>
      <OutlineButton label={copy.leaveQueue} onPress={leave} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.textSecondary, textAlign: 'center', writingDirection: 'rtl', marginTop: 16, fontSize: 15 },
});
