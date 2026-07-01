import { useEffect } from 'react';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { routes } from '../routes';

/** Redirect if user cannot use core flows (EULA, ban, suspend). Quota is enforced by the server on join. */
export function useFlowGuard() {
  const { ready, me, eulaAccepted } = useApp();

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
    me?.banned ||
    !!(me?.suspendedUntil && me.suspendedUntil > Date.now()) ||
    (!eulaAccepted && !me?.eulaAccepted);

  return {
    ready,
    blocked,
    me,
    eulaOk: !!(eulaAccepted || me?.eulaAccepted),
  };
}
