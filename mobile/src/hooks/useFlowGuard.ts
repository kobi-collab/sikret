import { useCallback, useEffect } from 'react';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { routes } from '../routes';

/** Redirect if user cannot use core flows (EULA, ban, suspend, quota). */
export function useFlowGuard(options?: { requireQuota?: boolean }) {
  const { ready, me, eulaAccepted, userId, meLoading, refreshMe, retryServerSync } = useApp();

  useFocusEffect(
    useCallback(() => {
      if (!ready) return;
      if (!userId) {
        retryServerSync();
        return;
      }
      refreshMe();
    }, [ready, userId, refreshMe, retryServerSync]),
  );

  const quotaBlocked = !!(
    options?.requireQuota &&
    me &&
    !meLoading &&
    !me.canStart &&
    !me.activeSwapId
  );

  const pending =
    !ready || (!!userId && options?.requireQuota && !me && meLoading) || (!userId && meLoading);

  useEffect(() => {
    if (!ready || pending) return;
    if (me?.banned || (me?.suspendedUntil && me.suspendedUntil > Date.now())) {
      router.replace('/suspended');
      return;
    }
    if (!eulaAccepted && !me?.eulaAccepted) {
      router.replace(routes.terms);
      return;
    }
    if (quotaBlocked) {
      router.replace(routes.home);
    }
  }, [ready, pending, me, eulaAccepted, quotaBlocked]);

  const blocked =
    pending ||
    !userId ||
    me?.banned ||
    !!(me?.suspendedUntil && me.suspendedUntil > Date.now()) ||
    (!eulaAccepted && !me?.eulaAccepted) ||
    quotaBlocked;

  return {
    ready,
    blocked,
    pending,
    me,
    userId,
    eulaOk: !!(eulaAccepted || me?.eulaAccepted),
  };
}
