import { createBotSwap } from './match.js';

export const BOT_WAIT_MS = 8000;

/** Run bot match on poll/join so queue works even if the interval worker was asleep. */
export function runBotIfStale(data, userId) {
  const entry = data.queue.find((q) => q.userId === userId && !q.matched);
  if (!entry) return false;
  const waited = Date.now() - (entry.joinedAt || entry.sealedAt || 0);
  if (waited < BOT_WAIT_MS) return false;
  const still = data.queue.find((q) => q.id === entry.id && !q.matched);
  if (!still) return false;
  createBotSwap(data, still);
  return true;
}
