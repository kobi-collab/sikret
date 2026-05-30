import Constants from 'expo-constants';
import { Platform } from 'react-native';

function hostFromExpoLan(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const hostname = hostUri.split(':')[0];
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return hostname;
    }
  }

  const expoGo = Constants.expoGoConfig as { debuggerHost?: string } | null;
  if (expoGo?.debuggerHost) {
    const hostname = expoGo.debuggerHost.split(':')[0];
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return hostname;
    }
  }

  return null;
}

function readProductionApiUrl(): string | null {
  const extra = Constants.expoConfig?.extra as { apiUrl?: unknown } | undefined;
  const fromExtra = extra?.apiUrl;
  if (typeof fromExtra === 'string' && fromExtra.length > 0) {
    return fromExtra.replace(/\/$/, '');
  }
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (typeof fromEnv === 'string' && fromEnv.length > 0) {
    return fromEnv.replace(/\/$/, '');
  }
  return null;
}

function resolveApiHost(): string {
  const configured = readProductionApiUrl();

  if (configured && !configured.includes('127.0.0.1') && !configured.includes('localhost')) {
    return configured;
  }

  const lanHost = hostFromExpoLan();
  if (lanHost) {
    return `http://${lanHost}:3847`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3847';
  }

  // iOS Simulator on Mac
  if (Platform.OS === 'ios' && Constants.isDevice === false) {
    return 'http://127.0.0.1:3847';
  }

  return 'http://127.0.0.1:3847';
}

const host = resolveApiHost();

export function getApiHost() {
  return host;
}

async function request<T>(
  path: string,
  options: RequestInit & { userId?: string | null } = {},
): Promise<T> {
  const { userId, ...init } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (userId) headers['x-user-id'] = userId;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  let res: Response;
  try {
    res = await fetch(`${host}${path}`, { ...init, headers, signal: controller.signal });
  } catch {
    clearTimeout(timeout);
    const err = new Error('network_error') as Error & { code?: string };
    err.code = 'network_error';
    throw err;
  }
  clearTimeout(timeout);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || body.message || 'request_failed') as Error & {
      code?: string;
      data?: unknown;
    };
    err.code = body.error;
    err.data = body;
    throw err;
  }
  return body as T;
}

export async function pingApi(): Promise<boolean> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${host}/health`, { signal: controller.signal });
    const body = await res.json();
    return body?.ok === true;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

export type MeResponse = {
  userId: string;
  resonance: number;
  trustScore: number;
  suspendedUntil: number | null;
  banned?: boolean;
  eulaAccepted?: boolean;
  dailyCompleted: number;
  dailyLimit: number;
  canStart: boolean;
  quotaReason: string | null;
  activeSwapId: string | null;
};

export type SwapView = {
  id: string;
  intention: string;
  status: string;
  phase: string;
  myLocked: boolean;
  peerLocked: boolean;
  bothLocked: boolean;
  isBot: boolean;
  peerContent: string | null;
  peerHidden?: boolean;
  peerAlias: string;
  peerResonance: number;
  myResonance: number;
  envelopeFeedback: 'touched' | 'dishonest' | 'report' | null;
};

export type FeedbackResponse = {
  ok: boolean;
  dailyCompleted: number;
  myResonance: number;
  resonanceDelta: number;
  peerResonance: number | null;
  peerResonanceDelta: number;
  envelopeFeedback: 'touched' | 'dishonest' | 'report' | null;
};

export type ReportResponse = {
  ok: boolean;
  hidden: boolean;
  reportId: string;
  message: string;
  peerContent: null;
  phase: string;
};

export const api = {
  register: (userId?: string | null) =>
    request<{ userId: string }>('/api/users', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  me: (userId: string) => request<MeResponse>('/api/me', { userId }),

  acceptEula: (userId: string) =>
    request<{ ok: boolean; eulaAcceptedAt: number }>('/api/eula/accept', {
      method: 'POST',
      userId,
    }),

  joinQueue: (userId: string, payload: { intention: string; content: string }) =>
    request<{ status: string; swapId?: string; queueId?: string }>('/api/queue/join', {
      method: 'POST',
      userId,
      body: JSON.stringify(payload),
    }),

  queueStatus: (userId: string) =>
    request<{ status: string; swapId?: string }>('/api/queue/status', { userId }),

  leaveQueue: (userId: string) =>
    request<{ ok: boolean }>('/api/queue/leave', { method: 'DELETE', userId }),

  getSwap: (userId: string, swapId: string) =>
    request<SwapView>(`/api/swaps/${swapId}`, { userId }),

  lockSwap: (userId: string, swapId: string) =>
    request<SwapView>(`/api/swaps/${swapId}/lock`, { method: 'POST', userId }),

  feedback: (userId: string, swapId: string, type: 'touched' | 'dishonest') =>
    request<FeedbackResponse>(`/api/swaps/${swapId}/feedback`, {
      method: 'POST',
      userId,
      body: JSON.stringify({ type }),
    }),

  reportSwap: (userId: string, swapId: string) =>
    request<ReportResponse>(`/api/swaps/${swapId}/report`, {
      method: 'POST',
      userId,
      body: JSON.stringify({}),
    }),

  hideSwap: (userId: string, swapId: string) =>
    request<{ ok: boolean; hidden: boolean }>(`/api/swaps/${swapId}/hide`, {
      method: 'POST',
      userId,
    }),

  complete: (userId: string, swapId: string) =>
    request<{ ok: boolean }>(`/api/swaps/${swapId}/complete`, {
      method: 'POST',
      userId,
    }),
};
