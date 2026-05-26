import cors from 'cors';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { runBotIfStale } from './botMatch.js';
import { startBotWorker } from './botWorker.js';
import { tryMatch } from './match.js';
import {
  applyEnvelopeRating,
  botResonance,
  DEFAULT_RESONANCE,
  getResonance,
} from './reputation.js';
import { loadStore, saveStore, todayKey } from './store.js';

const app = express();
const PORT = process.env.PORT || 3847;

app.use(cors());
app.use(express.json({ limit: '32kb' }));

function getOrCreateUser(data, userId) {
  if (!userId || !data.users[userId]) {
    const id = uuidv4();
    data.users[id] = {
      id,
      reputation: DEFAULT_RESONANCE,
      trustScore: 50,
      suspendedUntil: null,
      completedSwaps: 0,
      firstCompletedAt: null,
      daily: {},
      reportsReceived: 0,
      createdAt: Date.now(),
    };
    return data.users[id];
  }
  return data.users[userId];
}

function dailyLimit(user) {
  const day = user.daily[todayKey()] || { completed: 0 };
  if (!user.firstCompletedAt) return 2;
  return 3;
}

function canStartSwap(user) {
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

function activeSwapForUser(data, userId) {
  return Object.values(data.swaps).find(
    (s) =>
      (s.userA === userId || s.userB === userId) &&
      !['completed', 'abandoned'].includes(s.status),
  );
}

function swapViewForUser(swap, userId, data) {
  const isA = swap.userA === userId;
  const exchanged = swap.status === 'opened' || swap.status === 'completed';
  const peerId = isA ? swap.userB : swap.userA;
  const peerUser = peerId !== 'bot' ? data.users[peerId] : null;
  const myRatingFromPeer = isA ? swap.ratingByB : swap.ratingByA;

  return {
    id: swap.id,
    intention: swap.intention,
    status: swap.status,
    phase: exchanged ? 'opened' : 'waiting_match',
    myLocked: true,
    peerLocked: true,
    bothLocked: true,
    isBot: swap.isBot,
    peerContent: exchanged ? (isA ? swap.contentB : swap.contentA) : null,
    peerAlias: swap.isBot ? 'סוד-ערפילי' : isA ? 'סוד-כחול' : 'סוד-ורוד',
    peerResonance: swap.isBot ? botResonance() : getResonance(peerUser),
    myResonance: getResonance(data.users[userId]),
    envelopeFeedback: myRatingFromPeer || null,
  };
}

app.get('/health', (_, res) => res.json({ ok: true }));

app.post('/api/users', (req, res) => {
  const data = loadStore();
  const existing = req.body.userId;
  const user = getOrCreateUser(data, existing);
  saveStore(data);
  res.json({ userId: user.id });
});

app.get('/api/me', (req, res) => {
  const data = loadStore();
  const userId = req.headers['x-user-id'];
  if (!userId || !data.users[userId]) {
    return res.status(401).json({ error: 'unknown_user' });
  }
  const user = data.users[userId];
  const day = user.daily[todayKey()] || { completed: 0 };
  const quota = canStartSwap(user);
  const active = activeSwapForUser(data, userId);
  saveStore(data);
  res.json({
    userId: user.id,
    resonance: getResonance(user),
    trustScore: user.trustScore,
    suspendedUntil: user.suspendedUntil,
    dailyCompleted: day.completed,
    dailyLimit: dailyLimit(user),
    canStart: quota.ok,
    quotaReason: quota.reason || null,
    activeSwapId: active?.id || null,
  });
});

app.post('/api/queue/join', (req, res) => {
  const data = loadStore();
  const userId = req.headers['x-user-id'];
  const user = getOrCreateUser(data, userId);
  const { intention, content } = req.body;

  if (!intention || !content) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  if (content.length < 100 || content.length > 1500) {
    return res.status(400).json({ error: 'invalid_length', min: 100, max: 1500 });
  }

  const quota = canStartSwap(user);
  if (!quota.ok) return res.status(403).json({ error: quota.reason, ...quota });

  if (activeSwapForUser(data, userId)) {
    return res.status(409).json({ error: 'active_swap' });
  }

  data.queue = data.queue.filter((q) => q.userId === userId && !q.matched);

  const entry = {
    id: uuidv4(),
    userId: user.id,
    intention,
    content: content.trim(),
    sealedAt: Date.now(),
    joinedAt: Date.now(),
    matched: null,
  };
  data.queue.push(entry);

  let swap = tryMatch(data);
  if (!swap) {
    saveStore(data);
    res.json({ status: 'queued', queueId: entry.id });
    return;
  }

  saveStore(data);
  res.json({ status: 'matched', swapId: swap.id });
});

function finishQueueStatus(data, userId, res) {
  runBotIfStale(data, userId);
  const active = activeSwapForUser(data, userId);
  if (active) {
    saveStore(data);
    return res.json({ status: 'matched', swapId: active.id });
  }
  const entry = data.queue.find((q) => q.userId === userId && !q.matched);
  saveStore(data);
  if (entry) return res.json({ status: 'queued', queueId: entry.id });
  return res.json({ status: 'idle' });
}

app.get('/api/queue/status', (req, res) => {
  const data = loadStore();
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'unknown_user' });
  finishQueueStatus(data, userId, res);
});

app.delete('/api/queue/leave', (req, res) => {
  const data = loadStore();
  const userId = req.headers['x-user-id'];
  data.queue = data.queue.filter((q) => !(q.userId === userId && !q.matched));
  saveStore(data);
  res.json({ ok: true });
});

app.get('/api/swaps/:id', (req, res) => {
  const data = loadStore();
  const userId = req.headers['x-user-id'];
  const swap = data.swaps[req.params.id];
  if (!swap) return res.status(404).json({ error: 'not_found' });
  if (swap.userA !== userId && swap.userB !== userId) {
    return res.status(403).json({ error: 'forbidden' });
  }
  res.json(swapViewForUser(swap, userId, data));
});

app.post('/api/swaps/:id/lock', (req, res) => {
  const data = loadStore();
  const userId = req.headers['x-user-id'];
  const swap = data.swaps[req.params.id];
  if (!swap) return res.status(404).json({ error: 'not_found' });
  const isA = swap.userA === userId;
  if (!isA && swap.userB !== userId) return res.status(403).json({ error: 'forbidden' });

  if (isA) swap.lockA = true;
  else swap.lockB = true;

  if (swap.lockA && swap.lockB) {
    swap.status = 'opened';
    if (swap.isBot) swap.status = 'opened';
  }

  saveStore(data);
  res.json(swapViewForUser(swap, userId, data));
});

app.post('/api/swaps/:id/feedback', (req, res) => {
  const data = loadStore();
  const userId = req.headers['x-user-id'];
  const { type } = req.body;
  const swap = data.swaps[req.params.id];
  if (!swap) return res.status(404).json({ error: 'not_found' });

  const isA = swap.userA === userId;
  if (!isA && swap.userB !== userId) return res.status(403).json({ error: 'forbidden' });

  const peerId = isA ? swap.userB : swap.userA;
  const user = data.users[userId];
  const peer = peerId !== 'bot' ? data.users[peerId] : null;

  if (isA) swap.ratingByA = type;
  else swap.ratingByB = type;

  let peerResonance = swap.isBot ? botResonance() : null;
  let peerDelta = 0;

  if (peer && type !== 'complete') {
    const peerResult = applyEnvelopeRating(peer, type);
    peerResonance = peerResult.after;
    peerDelta = peerResult.delta;

    if (type === 'dishonest' && peer.reportsReceived >= 3) {
      peer.suspendedUntil = Date.now() + 24 * 60 * 60 * 1000;
    }
    if (type === 'report') {
      peer.suspendedUntil = Date.now() + 7 * 24 * 60 * 60 * 1000;
    }
  }

  const myRatingFromPeer = isA ? swap.ratingByB : swap.ratingByA;
  let myResult = { before: getResonance(user), after: getResonance(user), delta: 0 };

  if (myRatingFromPeer && myRatingFromPeer !== 'complete') {
    myResult = applyEnvelopeRating(user, myRatingFromPeer);
  }

  if (!user.daily[todayKey()]) user.daily[todayKey()] = { completed: 0 };
  user.daily[todayKey()].completed += 1;
  if (!user.firstCompletedAt) user.firstCompletedAt = Date.now();
  user.completedSwaps += 1;
  swap.status = 'completed';

  saveStore(data);
  res.json({
    ok: true,
    dailyCompleted: user.daily[todayKey()].completed,
    myResonance: myResult.after,
    resonanceDelta: myResult.delta,
    peerResonance,
    peerResonanceDelta: peerDelta,
    envelopeFeedback: myRatingFromPeer || null,
  });
});

app.post('/api/swaps/:id/complete', (req, res) => {
  const data = loadStore();
  const userId = req.headers['x-user-id'];
  const swap = data.swaps[req.params.id];
  if (!swap) return res.status(404).json({ error: 'not_found' });

  const user = data.users[userId];
  if (!user.daily[todayKey()]) user.daily[todayKey()] = { completed: 0 };
  if (swap.status !== 'completed') {
    user.daily[todayKey()].completed += 1;
    if (!user.firstCompletedAt) user.firstCompletedAt = Date.now();
    swap.status = 'completed';
  }
  saveStore(data);
  res.json({ ok: true });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Sikret API http://0.0.0.0:${PORT}`);
  startBotWorker();
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nפורט ${PORT} כבר בשימוש. הרץ:\n  lsof -ti:${PORT} | xargs kill -9\nואז npm start\n`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
