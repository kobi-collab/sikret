import { v4 as uuidv4, validate as uuidValidate } from 'uuid';
import { peerContentForUser } from './moderation/swaps.js';
import { isBanned } from './moderation/users.js';
import { DEFAULT_RESONANCE, getResonance } from './reputation.js';
import { todayKey } from './store.js';

export function dailyLimit(user) {
  if (!user.firstCompletedAt) return 2;
  return 3;
}

export function getOrCreateUser(data, userId) {
  if (userId && uuidValidate(userId) && data.users[userId]) {
    const user = data.users[userId];
    if (user.banned === undefined) user.banned = false;
    if (user.eulaAcceptedAt === undefined) user.eulaAcceptedAt = null;
    return user;
  }
  const id = uuidv4();
  data.users[id] = {
    id,
    reputation: DEFAULT_RESONANCE,
    trustScore: 50,
    suspendedUntil: null,
    banned: false,
    bannedAt: null,
    eulaAcceptedAt: null,
    completedSwaps: 0,
    firstCompletedAt: null,
    daily: {},
    reportsReceived: 0,
    filterViolations: 0,
    createdAt: Date.now(),
  };
  return data.users[id];
}

export function requireEula(user, res) {
  if (!user.eulaAcceptedAt) {
    res.status(403).json({ error: 'eula_required' });
    return false;
  }
  return true;
}

export function canStartSwap(user) {
  if (isBanned(user)) {
    return { ok: false, reason: 'banned' };
  }
  if (user.suspendedUntil && user.suspendedUntil > Date.now()) {
    return { ok: false, reason: 'suspended', until: user.suspendedUntil };
  }
  const day = user.daily[todayKey()] || { completed: 0 };
  const limit = dailyLimit(user);
  if (day.completed >= limit) {
    return { ok: false, reason: 'quota', limit, used: day.completed };
  }
  return { ok: true, limit, used: day.completed };
}

export function activeSwapForUser(data, userId) {
  return Object.values(data.swaps).find(
    (s) =>
      (s.userA === userId || s.userB === userId) &&
      !['completed', 'abandoned', 'removed'].includes(s.status),
  );
}

export function requireActiveUser(user, res) {
  if (!user) {
    res.status(401).json({ error: 'unknown_user' });
    return false;
  }
  if (isBanned(user)) {
    res.status(403).json({ error: 'banned' });
    return false;
  }
  if (user.suspendedUntil && user.suspendedUntil > Date.now()) {
    res.status(403).json({ error: 'suspended', until: user.suspendedUntil });
    return false;
  }
  return true;
}

export function completeSwapForUser(data, swap, userId) {
  const user = data.users[userId];
  if (!user) return;
  if (!user.daily[todayKey()]) user.daily[todayKey()] = { completed: 0 };
  if (!swap.completedBy) swap.completedBy = {};
  if (!swap.completedBy[userId]) {
    swap.completedBy[userId] = Date.now();
    user.daily[todayKey()].completed += 1;
    if (!user.firstCompletedAt) user.firstCompletedAt = Date.now();
    user.completedSwaps += 1;
  }
  const parties = swap.isBot ? 1 : 2;
  if (Object.keys(swap.completedBy).length >= parties) {
    swap.status = 'completed';
  }
}

export function swapViewForUser(swap, userId, data) {
  const isA = swap.userA === userId;
  const exchanged = swap.status === 'opened' || swap.status === 'completed';
  const peerId = isA ? swap.userB : swap.userA;
  const peerUser = peerId !== 'bot' ? data.users[peerId] : null;
  const myRatingFromPeer = isA ? swap.ratingByB : swap.ratingByA;
  const peerContent = exchanged ? peerContentForUser(swap, userId) : null;

  return {
    id: swap.id,
    intention: swap.intention,
    status: swap.status,
    phase: exchanged && peerContent ? 'opened' : exchanged ? 'hidden' : 'waiting_match',
    myLocked: true,
    peerLocked: true,
    bothLocked: true,
    isBot: swap.isBot,
    peerContent,
    peerHidden: exchanged && !peerContent,
    peerAlias: swap.isBot ? 'סוד-ערפילי' : isA ? 'סוד-כחול' : 'סוד-ורוד',
    peerResonance: swap.isBot ? 3.2 : getResonance(peerUser),
    myResonance: getResonance(data.users[userId]),
    envelopeFeedback: myRatingFromPeer || null,
  };
}
