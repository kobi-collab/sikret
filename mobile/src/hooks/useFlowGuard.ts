import { useEffect } from 'react';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { routes } from '../routes';

/** Redirect if user cannot use core flows (EULA, ban, suspend). */
export function useFlowGuard(options?: { requireQuota?: boolean }) {
  const { ready, me, eulaAccepted, userId } = useApp();

  useEffect(() => {
    if (!ready) return;
    if (me?.banned || (me?.suspendedUntil && me.suspendedUntil > Date.now())) {
      router.replace('/suspended');
      return;
    }
    if (!eulaAccepted && !me?.eulaAccepted) {
      router.replace(routes.terms);
    }
  }, [ready, me, eulaAccepted]);

  const blocked =
    !ready ||
    !userId ||
    me?.banned ||
    !!(me?.suspendedUntil && me.suspendedUntil > Date.now()) ||
    (!eulaAccepted && !me?.eulaAccepted);

  const quotaBlocked =
    options?.requireQuota && me && !me.canStart && !me.activeSwapId;

  return {
    ready,
    blocked: blocked || !!quotaBlocked,
    me,
    userId,
    eulaOk: !!(eulaAccepted || me?.eulaAccepted),
  };
}
