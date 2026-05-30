import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, MeResponse } from '../api';
import {
  getUserId,
  isEulaAcceptedLocal,
  isOnboardingDone,
  setEulaAcceptedLocal,
  setOnboardingDone,
  setUserId,
} from '../storage';

type Draft = {
  intention?: string;
  content?: string;
};

type AppState = {
  ready: boolean;
  userId: string | null;
  me: MeResponse | null;
  onboardingDone: boolean;
  eulaAccepted: boolean;
  draft: Draft;
  setDraft: (d: Draft) => void;
  refreshMe: () => Promise<void>;
  finishOnboarding: () => Promise<void>;
  acceptEula: () => Promise<void>;
};

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [userId, setUid] = useState<string | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [onboardingDone, setOb] = useState(false);
  const [eulaAccepted, setEula] = useState(false);
  const [draft, setDraftState] = useState<Draft>({});

  const refreshMe = useCallback(async () => {
    if (!userId) return;
    const m = await api.me(userId);
    setMe(m);
    if (m.eulaAccepted) setEula(true);
  }, [userId]);

  useEffect(() => {
    (async () => {
      try {
        const ob = await isOnboardingDone();
        setOb(ob);
        const eulaLocal = await isEulaAcceptedLocal();
        setEula(eulaLocal);
        let id = await getUserId();
        const reg = await api.register(id);
        id = reg.userId;
        await setUserId(id);
        setUid(id);
        const m = await api.me(id);
        setMe(m);
        if (m.eulaAccepted) {
          setEula(true);
          await setEulaAcceptedLocal();
        }
      } catch (e) {
        console.warn('init', e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const finishOnboarding = useCallback(async () => {
    await setOnboardingDone();
    setOb(true);
  }, []);

  const acceptEula = useCallback(async () => {
    if (userId) {
      await api.acceptEula(userId);
      await refreshMe();
    }
    await setEulaAcceptedLocal();
    setEula(true);
  }, [userId, refreshMe]);

  const value = useMemo(
    () => ({
      ready,
      userId,
      me,
      onboardingDone,
      eulaAccepted,
      draft,
      setDraft: (d: Draft) => setDraftState((prev) => ({ ...prev, ...d })),
      refreshMe,
      finishOnboarding,
      acceptEula,
    }),
    [ready, userId, me, onboardingDone, eulaAccepted, draft, refreshMe, finishOnboarding, acceptEula],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp outside provider');
  return ctx;
}
