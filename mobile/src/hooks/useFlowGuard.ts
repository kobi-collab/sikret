import { useEffect } from 'react';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { routes } from '../routes';

/** Redirect if user cannot use core flows (EULA, ban, suspend, quota). */
export function useFlowGuard(options?: { requireQuota?: boolean }) {
  const { ready, me, eulaAccepted } = useApp();

  const quotaBlocked = !!(
    options?.requireQuota &&
    me &&
    !me.canStart &&
    !me.activeSwapId
  );

  useEffect(() => {
    if (!ready) return;
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
  }, [ready, me, eulaAccepted, quotaBlocked]);

  const blocked =
    !ready ||
    me?.banned ||
    !!(me?.suspendedUntil && me.suspendedUntil > Date.now()) ||
    (!eulaAccepted && !me?.eulaAccepted) ||
    quotaBlocked;

  return {
    ready,
    blocked,
    me,
    eulaOk: !!(eulaAccepted || me?.eulaAccepted),
  };
}
