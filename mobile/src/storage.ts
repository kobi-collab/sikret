import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  userId: 'sikret_user_id',
  onboarding: 'sikret_onboarding_done',
  eula: 'sikret_eula_accepted',
  draft: 'sikret_draft',
};

export type Draft = {
  intention?: string;
  content?: string;
};

export async function getUserId(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.userId);
}

export async function setUserId(id: string) {
  await AsyncStorage.setItem(KEYS.userId, id);
}

export async function isOnboardingDone(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEYS.onboarding)) === '1';
}

export async function setOnboardingDone() {
  await AsyncStorage.setItem(KEYS.onboarding, '1');
}

export async function isEulaAcceptedLocal(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEYS.eula)) === '1';
}

export async function setEulaAcceptedLocal() {
  await AsyncStorage.setItem(KEYS.eula, '1');
}

export async function getDraft(): Promise<Draft> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.draft);
    return raw ? (JSON.parse(raw) as Draft) : {};
  } catch {
    return {};
  }
}

export async function saveDraft(draft: Draft) {
  await AsyncStorage.setItem(KEYS.draft, JSON.stringify(draft));
}

export async function clearDraft() {
  await AsyncStorage.removeItem(KEYS.draft);
}
