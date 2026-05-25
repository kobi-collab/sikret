import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, MeResponse } from '../api';
import { getUserId, isOnboardingDone, setOnboardingDone, setUserId } from '../storage';

type Draft = {
  intention?: string;
  content?: string;
};

type AppState = {
  ready: boolean;
  userId: string | null;
  me: MeResponse | null;
  onboardingDone: boolean;
  draft: Draft;
  setDraft: (d: Draft) => void;
  refreshMe: () => Promise<void>;
  finishOnboarding: () => Promise<void>;
};

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [userId, setUid] = useState<string | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [onboardingDone, setOb] = useState(false);
  const [draft, setDraftState] = useState<Draft>({});

  const refreshMe = useCallback(async () => {
    if (!userId) return;
    const m = await api.me(userId);
    setMe(m);
  }, [userId]);

  useEffect(() => {
    (async () => {
      try {
        const ob = await isOnboardingDone();
        setOb(ob);
        let id = await getUserId();
        const reg = await api.register(id);
        id = reg.userId;
        await setUserId(id);
        setUid(id);
        const m = await api.me(id);
        setMe(m);
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

  const value = useMemo(
    () => ({
      ready,
      userId,
      me,
      onboardingDone,
      draft,
      setDraft: (d: Draft) => setDraftState((prev) => ({ ...prev, ...d })),
      refreshMe,
      finishOnboarding,
    }),
    [ready, userId, me, onboardingDone, draft, refreshMe, finishOnboarding],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp outside provider');
  return ctx;
}
