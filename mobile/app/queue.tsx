import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { api, getApiHost, pingApi } from '../src/api';
import { EnvelopeOrb } from '../src/components/EnvelopeOrb';
import { Screen } from '../src/components/Screen';
import { OutlineButton, Subtitle, Title } from '../src/components/UI';
import { copy } from '../src/copy';
import { useApp } from '../src/context/AppContext';
import { colors } from '../src/theme';

async function goToSwapIfReady(userId: string): Promise<string | null> {
  const s = await api.queueStatus(userId);
  if (s.status === 'matched' && s.swapId) return s.swapId;
  const me = await api.me(userId);
  if (me.activeSwapId) return me.activeSwapId;
  return null;
}

export default function QueueScreen() {
  const { userId, draft, refreshMe } = useApp();
  const [status, setStatus] = useState<'joining' | 'queued' | 'error'>('joining');
  const [hint, setHint] = useState(copy.queueJoining);
  const joined = useRef(false);

  useEffect(() => {
    if (!userId || joined.current) return;
    joined.current = true;

    const joinTimeout = setTimeout(() => {
      Alert.alert(
        'אין חיבור לשרת',
        `ודא שהשרת רץ (start.sh) והטלפון באותו Wi‑Fi.\n${getApiHost()}`,
      );
      router.back();
    }, 12000);

    (async () => {
      const ok = await pingApi();
      if (!ok) {
        clearTimeout(joinTimeout);
        Alert.alert('אין חיבור לשרת', `הפעל start.sh\n${getApiHost()}`);
        router.back();
        return;
      }

      try {
        const res = await api.joinQueue(userId, {
          intention: draft.intention!,
          content: draft.content!,
        });
        clearTimeout(joinTimeout);

        if (res.status === 'matched' && res.swapId) {
          router.replace({ pathname: '/swap', params: { id: res.swapId } });
          return;
        }
        setStatus('queued');
        setHint(copy.queueWaiting);
      } catch (e: unknown) {
        clearTimeout(joinTimeout);
        const err = e as Error & { code?: string };
        setStatus('error');

        if (err.code === 'active_swap') {
          const me = await api.me(userId);
          if (me.activeSwapId) {
            router.replace({ pathname: '/swap', params: { id: me.activeSwapId } });
            return;
          }
        }

        Alert.alert(
          'שגיאה',
          err.code === 'quota'
            ? 'הגעת למכסה היומית'
            : err.code === 'network_error'
              ? 'אין חיבור לשרת'
              : 'לא הצלחנו להיכנס לתור',
        );
        router.back();
      }
    })();

    return () => clearTimeout(joinTimeout);
  }, [userId, draft]);

  useEffect(() => {
    if (status !== 'queued' || !userId) return;

    const poll = async () => {
      try {
        const swapId = await goToSwapIfReady(userId);
        if (swapId) {
          await refreshMe();
          router.replace({ pathname: '/swap', params: { id: swapId } });
        }
      } catch {
        setHint(copy.queueWaiting);
      }
    };

    poll();
    const t = setInterval(poll, 1000);
    return () => clearInterval(t);
  }, [status, userId, refreshMe]);

  const leave = async () => {
    if (userId) await api.leaveQueue(userId);
    router.back();
  };

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
  hint: { color: colors.textSecondary, textAlign: 'center', marginTop: 16, fontSize: 15 },
});
