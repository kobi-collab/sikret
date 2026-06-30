import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState as RNAppState, type AppStateStatus } from 'react-native';
import { api, MeResponse, waitForApi } from '../api';
import {
  clearDraft as clearDraftStorage,
  getDraft,
  getUserId,
  isEulaAcceptedLocal,
  isOnboardingDone,
  saveDraft,
  setEulaAcceptedLocal,
  setOnboardingDone,
  setUserId,
  type Draft,
} from '../storage';

type AppState = {
  ready: boolean;
  userId: string | null;
  me: MeResponse | null;
  onboardingDone: boolean;
  eulaAccepted: boolean;
  draft: Draft;
  meLoading: boolean;
  meError: boolean;
  setDraft: (d: Draft) => void;
  clearDraft: () => Promise<void>;
  refreshMe: () => Promise<MeResponse | null>;
  finishOnboarding: () => Promise<void>;
  acceptEula: () => Promise<void>;
  retryServerSync: () => Promise<void>;
};

const Ctx = createContext<AppState | null>(null);

async function syncUserFromServer(existingId: string | null): Promise<{
  userId: string;
  me: MeResponse;
} | null> {
  const apiUp = await waitForApi();
  if (!apiUp) return null;
  const reg = await api.register(existingId);
  await setUserId(reg.userId);
  const me = await api.me(reg.userId);
  return { userId: reg.userId, me };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [userId, setUid] = useState<string | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [onboardingDone, setOb] = useState(false);
  const [eulaAccepted, setEula] = useState(false);
  const [draft, setDraftState] = useState<Draft>({});
  const [meLoading, setMeLoading] = useState(false);
  const [meError, setMeError] = useState(false);

  const refreshMe = useCallback(async (): Promise<MeResponse | null> => {
    let id = userId;
    if (!id) {
      id = await getUserId();
      if (!id) return null;
    }
    setMeLoading(true);
    setMeError(false);
    try {
      const m = await api.me(id);
      setMe(m);
      setUid(id);
      if (m.eulaAccepted) {
        setEula(true);
        await setEulaAcceptedLocal();
      }
      return m;
    } catch (e) {
      const err = e as Error & { code?: string };
      if (err.code === 'unknown_user' || err.code === 'request_failed') {
        try {
          const synced = await syncUserFromServer(id);
          if (synced) {
            setUid(synced.userId);
            setMe(synced.me);
            setMeError(false);
            if (synced.me.eulaAccepted) {
              setEula(true);
              await setEulaAcceptedLocal();
            }
            return synced.me;
          }
        } catch {
          /* fall through */
        }
      }
      setMeError(true);
      return null;
    } finally {
      setMeLoading(false);
    }
  }, [userId]);

  const runServerSync = useCallback(async () => {
    setMeLoading(true);
    setMeError(false);
    try {
      const storedId = await getUserId();
      const synced = await syncUserFromServer(storedId);
      if (!synced) {
        setMeError(true);
        return;
      }
      setUid(synced.userId);
      setMe(synced.me);
      if (synced.me.eulaAccepted) {
        setEula(true);
        await setEulaAcceptedLocal();
      }
    } catch {
      setMeError(true);
    } finally {
      setMeLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [ob, eulaLocal, storedId, storedDraft] = await Promise.all([
          isOnboardingDone(),
          isEulaAcceptedLocal(),
          getUserId(),
          getDraft(),
        ]);
        if (cancelled) return;
        setOb(ob);
        setEula(eulaLocal);
        if (storedId) setUid(storedId);
        if (storedDraft.intention || storedDraft.content) setDraftState(storedDraft);
      } catch (e) {
        console.warn('local init', e);
      } finally {
        if (!cancelled) setReady(true);
      }

      if (!cancelled) await runServerSync();
    })();

    return () => {
      cancelled = true;
    };
  }, [runServerSync]);

  useEffect(() => {
    if (!ready || !userId) return;

    const onAppState = async (state: AppStateStatus) => {
      if (state === 'active') {
        const stored = await getUserId();
        if (stored) setUid(stored);
        refreshMe();
      }
    };

    const sub = RNAppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, [ready, userId, refreshMe]);

  const setDraft = useCallback((d: Draft) => {
    setDraftState((prev) => {
      const next = { ...prev, ...d };
      saveDraft(next).catch(() => {});
      return next;
    });
  }, []);

  const clearDraft = useCallback(async () => {
    await clearDraftStorage();
    setDraftState({});
  }, []);

  const finishOnboarding = useCallback(async () => {
    await setOnboardingDone();
    setOb(true);
  }, []);

  const acceptEula = useCallback(async () => {
    let id = userId;
    if (!id) {
      const synced = await syncUserFromServer(await getUserId());
      if (!synced) throw new Error('network_error');
      id = synced.userId;
      setUid(id);
      setMe(synced.me);
    }
    await api.acceptEula(id);
    await refreshMe();
    await setEulaAcceptedLocal();
    setEula(true);
  }, [userId, refreshMe]);

  const retryServerSync = useCallback(async () => {
    setMeError(false);
    await runServerSync();
  }, [runServerSync]);

  const value = useMemo(
    () => ({
      ready,
      userId,
      me,
      onboardingDone,
      eulaAccepted,
      draft,
      meLoading,
      meError,
      setDraft,
      clearDraft,
      refreshMe,
      finishOnboarding,
      acceptEula,
      retryServerSync,
    }),
    [
      ready,
      userId,
      me,
      onboardingDone,
      eulaAccepted,
      draft,
      meLoading,
      meError,
      setDraft,
      clearDraft,
      refreshMe,
      finishOnboarding,
      acceptEula,
      retryServerSync,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp outside provider');
  return ctx;
}
