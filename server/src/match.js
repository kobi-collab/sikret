import { getResonance } from './reputation.js';

const BOT_RESPONSES = [
  'לפעמים אני מרגיש שאני מחזיק הכל לבד, ואף אחד לא יודע כמה זה כבד. כתבתי את זה כאן כי לא יכולתי לומר את זה בקול.',
  'יש סוד קטן שאני אוהב: אני עדיין שומר הודעה מישהו שלא אמור לדעת שזה מרגש אותי. זה מטופל, אבל הלב לא תמיד מסתדר.',
  'הייתי רוצה להגיד למישהו אנונימי: תודה על ההקשבה. גם בלי שם, זה מרגיש שמישהו שם.',
  'אני מתוודה שאני מפחד מהדחייה יותר ממה שאני מוכן להודות בו. זה הסוד שלי להיום.',
];

export function pickBotResponse() {
  return BOT_RESPONSES[Math.floor(Math.random() * BOT_RESPONSES.length)];
}

export function tryMatch(data, activeSwapForUser) {
  const waiting = data.queue.filter((q) => !q.matched);
  let bestPair = null;
  let bestDiff = Infinity;

  for (let i = 0; i < waiting.length; i++) {
    for (let j = i + 1; j < waiting.length; j++) {
      const a = waiting[i];
      const b = waiting[j];
      if (a.intention !== b.intention || a.userId === b.userId) continue;
      if (activeSwapForUser?.(data, a.userId) || activeSwapForUser?.(data, b.userId)) continue;

      const resA = getResonance(data.users[a.userId]);
      const resB = getResonance(data.users[b.userId]);
      const diff = Math.abs(resA - resB);

      if (diff < bestDiff) {
        bestDiff = diff;
        bestPair = [a, b];
      }
    }
  }

  if (!bestPair) return null;
  return createSwap(data, bestPair[0], bestPair[1]);
}

function createSwap(data, entryA, entryB) {
  const swapId = `swap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const swap = {
    id: swapId,
    intention: entryA.intention,
    status: 'opened',
    createdAt: Date.now(),
    userA: entryA.userId,
    userB: entryB.userId,
    lockA: true,
    lockB: true,
    contentA: entryA.content,
    contentB: entryB.content,
    isBot: false,
    ratingByA: null,
    ratingByB: null,
  };
  data.swaps[swapId] = swap;
  data.queue = data.queue.filter((q) => q.id !== entryA.id && q.id !== entryB.id);
  entryA.matched = swapId;
  entryB.matched = swapId;
  return swap;
}

export function createBotSwap(data, entry) {
  const swapId = `swap_bot_${Date.now()}`;
  const swap = {
    id: swapId,
    intention: entry.intention,
    status: 'opened',
    createdAt: Date.now(),
    userA: entry.userId,
    userB: 'bot',
    lockA: true,
    lockB: true,
    contentA: entry.content,
    contentB: pickBotResponse(),
    isBot: true,
    ratingByA: null,
    ratingByB: null,
  };
  data.swaps[swapId] = swap;
  data.queue = data.queue.filter((q) => q.id !== entry.id);
  return swap;
}
