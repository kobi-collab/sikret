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
import { getUserId } from '../src/storage';

async function goToSwapIfReady(userId: string): Promise<string | null> {
  const s = await api.queueStatus(userId);
  if (s.status === 'matched' && s.swapId) return s.swapId;
  const me = await api.me(userId);
  if (me.activeSwapId) return me.activeSwapId;
  return null;
}

export default function QueueScreen() {
  const { ready, userId, draft, refreshMe, clearDraft, retryServerSync } = useApp();
  const { blocked } = useFlowGuard({ requireQuota: true });
  const [status, setStatus] = useState<'joining' | 'queued' | 'error' | 'idle'>('joining');
  const [hint, setHint] = useState(copy.queueJoining);
  const [joinAttempt, setJoinAttempt] = useState(1);
  const idleTicks = useRef(0);
  const hadFocus = useRef(false);

  useFocusEffect(
    useCallback(() => {
      idleTicks.current = 0;
      setStatus('joining');
      setHint(copy.queueJoining);
      if (hadFocus.current) {
        setJoinAttempt((n) => n + 1);
      } else {
        hadFocus.current = true;
      }
    }, []),
  );

  useEffect(() => {
    if (!ready || blocked) return;

    let cancelled = false;

    (async () => {
      let uid = userId ?? (await getUserId());
      if (!uid) {
        await retryServerSync();
        uid = userId ?? (await getUserId());
      }
      if (!uid || cancelled) {
        if (!cancelled) {
          setStatus('error');
          Alert.alert(copy.networkError, copy.serverWaking, [
            { text: copy.retry, onPress: () => setJoinAttempt((n) => n + 1) },
            { text: 'חזרה', onPress: () => router.back() },
          ]);
        }
        return;
      }

      if (!draft.intention || !draft.content || draft.content.length < MIN_CHARS) {
        Alert.alert('שגיאה', 'חסרים פרטים לשליחה.', [{ text: 'אישור', onPress: () => router.back() }]);
        return;
      }

      setHint(copy.queueWaking);
      const ok = await waitForApi();
      if (!ok || cancelled) {
        if (!cancelled) {
          setStatus('error');
          Alert.alert(copy.networkError, '', [{ text: 'חזרה', onPress: () => router.back() }]);
        }
        return;
      }

      try {
        const res = await api.joinQueue(uid, {
          intention: draft.intention!,
          content: draft.content!,
        });
        if (cancelled) return;

        if (res.status === 'matched' && res.swapId) {
          await clearDraft();
          router.replace({ pathname: '/swap', params: { id: res.swapId } });
          return;
        }
        setStatus('queued');
        setHint(copy.queueWaiting);
      } catch (e: unknown) {
        if (cancelled) return;
        const err = e as Error & { code?: string; data?: { message?: string; accountAction?: string } };
        setStatus('error');

        if (err.code === 'active_swap') {
          const me = await api.me(uid);
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
      cancelled = true;
    };
  }, [ready, blocked, userId, joinAttempt, draft.intention, draft.content, clearDraft, retryServerSync]);

  useEffect(() => {
    if (status !== 'queued') return;

    const poll = async () => {
      try {
        const uid = userId ?? (await getUserId());
        if (!uid) return;
        const swapId = await goToSwapIfReady(uid);
        if (swapId) {
          idleTicks.current = 0;
          await refreshMe();
          await clearDraft();
          router.replace({ pathname: '/swap', params: { id: swapId } });
          return;
        }
        const st = await api.queueStatus(uid);
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
    const uid = userId ?? (await getUserId());
    if (uid) {
      try {
        await api.leaveQueue(uid);
      } catch {
        /* leave anyway */
      }
    }
    router.back();
  };

  if (!ready) {
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
        <OutlineButton label={copy.retry} onPress={() => setJoinAttempt((n) => n + 1)} />
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
