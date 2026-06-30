import cors from 'cors';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createAdminRouter } from './adminRoutes.js';
import { runBotIfStale } from './botMatch.js';
import { startBotWorker } from './botWorker.js';
import {
  activeSwapForUser,
  canStartSwap,
  completeSwapForUser,
  dailyLimit,
  getOrCreateUser,
  requireActiveUser,
  requireEula,
  swapViewForUser,
} from './guards.js';
import { tryMatch } from './match.js';
import { filterSecretContent } from './moderation/filter.js';
import { createReport, findOpenReportForSwap } from './moderation/reports.js';
import {
  hideSwapForUser,
  redactAllSwapContent,
  redactPeerContent,
  reportedContentSnapshot,
  reportedUserId,
} from './moderation/swaps.js';
import { applyReportPenalty, isBanned } from './moderation/users.js';
import { applyEnvelopeRating, botResonance, getResonance } from './reputation.js';
import { rateLimitMiddleware } from './rateLimit.js';
import { loadStore, saveStore, todayKey } from './store.js';

const app = express();
const PORT = process.env.PORT || 3847;

app.use(cors());
app.use(express.json({ limit: '32kb' }));

const joinLimit = rateLimitMiddleware(30, 60_000, (req) => `join:${req.headers['x-user-id'] || req.ip}`);
const reportLimit = rateLimitMiddleware(10, 60_000, (req) => `report:${req.headers['x-user-id'] || req.ip}`);

function suspendUserOnFilter(user, filtered) {
  user.filterViolations = (user.filterViolations || 0) + 1;
  if (filtered.severity === 'severe' || user.filterViolations >= 3) {
    user.banned = true;
    user.bannedAt = Date.now();
    user.banReason = 'filter_severe';
  } else {
    user.suspendedUntil = Date.now() + 24 * 60 * 60 * 1000;
  }
}

app.get('/health', (_, res) => res.json({ ok: true }));

app.use('/admin', createAdminRouter());

app.post('/api/users', (req, res) => {
  const data = loadStore();
  const existing = req.body.userId;
  const user = getOrCreateUser(data, existing);
  saveStore(data);
  res.json({ userId: user.id });
});

app.post('/api/eula/accept', (req, res) => {
  const data = loadStore();
  const userId = req.headers['x-user-id'];
  const user = getOrCreateUser(data, userId);
  user.eulaAcceptedAt = Date.now();
  saveStore(data);
  res.json({ ok: true, eulaAcceptedAt: user.eulaAcceptedAt });
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
  res.json({
    userId: user.id,
    resonance: getResonance(user),
    trustScore: user.trustScore,
    suspendedUntil: user.suspendedUntil,
    banned: isBanned(user),
    eulaAccepted: !!user.eulaAcceptedAt,
    dailyCompleted: day.completed,
    dailyLimit: dailyLimit(user),
    canStart: quota.ok,
    quotaReason: quota.reason || null,
    activeSwapId: active?.id || null,
  });
});

app.post('/api/queue/join', joinLimit, (req, res) => {
  const data = loadStore();
  const userId = req.headers['x-user-id'];
  const user = getOrCreateUser(data, userId);
  if (!requireEula(user, res)) return;
  if (!requireActiveUser(user, res)) return;

  const { intention, content } = req.body;

  if (!intention || !content) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  if (content.length < 25 || content.length > 1500) {
    return res.status(400).json({ error: 'invalid_length', min: 25, max: 1500 });
  }

  const filtered = filterSecretContent(content);
  if (!filtered.ok) {
    if (filtered.severity === 'severe') {
      suspendUserOnFilter(user, filtered);
    } else {
      user.filterViolations = (user.filterViolations || 0) + 1;
      if (user.filterViolations >= 5) {
        user.suspendedUntil = Date.now() + 24 * 60 * 60 * 1000;
      }
    }
    saveStore(data);
    return res.status(400).json({
      error: 'content_blocked',
      code: filtered.code,
      message: filtered.message,
      accountAction: user.banned ? 'banned' : user.suspendedUntil ? 'suspended' : null,
    });
  }

  const quota = canStartSwap(user);
  if (!quota.ok) return res.status(403).json({ error: quota.reason, ...quota });

  if (activeSwapForUser(data, userId)) {
    return res.status(409).json({ error: 'active_swap' });
  }

  // Remove only this user's prior unmatched queue entries
  data.queue = data.queue.filter((q) => !(q.userId === userId && !q.matched));

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

  let swap = tryMatch(data, activeSwapForUser);
  if (!swap) {
    saveStore(data);
    res.json({ status: 'queued', queueId: entry.id });
    return;
  }

  saveStore(data);
  res.json({ status: 'matched', swapId: swap.id });
});

function finishQueueStatus(data, userId, res) {
  runBotIfStale(data, userId, activeSwapForUser);
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
  const user = data.users[userId];
  if (!requireActiveUser(user, res)) return;
  if (!requireEula(user, res)) return;

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
  const user = data.users[userId];
  if (!requireActiveUser(user, res)) return;
  if (!requireEula(user, res)) return;

  const swap = data.swaps[req.params.id];
  if (!swap) return res.status(404).json({ error: 'not_found' });
  const isA = swap.userA === userId;
  if (!isA && swap.userB !== userId) return res.status(403).json({ error: 'forbidden' });

  if (isA) swap.lockA = true;
  else swap.lockB = true;

  if (swap.lockA && swap.lockB) {
    swap.status = 'opened';
  }

  saveStore(data);
  res.json(swapViewForUser(swap, userId, data));
});

app.post('/api/swaps/:id/hide', (req, res) => {
  const data = loadStore();
  const userId = req.headers['x-user-id'];
  const user = data.users[userId];
  if (!requireActiveUser(user, res)) return;
  if (!requireEula(user, res)) return;

  const swap = data.swaps[req.params.id];
  if (!swap) return res.status(404).json({ error: 'not_found' });
  if (swap.userA !== userId && swap.userB !== userId) {
    return res.status(403).json({ error: 'forbidden' });
  }

  hideSwapForUser(swap, userId);
  redactPeerContent(swap, userId);
  completeSwapForUser(data, swap, userId);
  saveStore(data);

  res.json({
    ok: true,
    hidden: true,
    ...swapViewForUser(swap, userId, data),
  });
});

app.post('/api/swaps/:id/report', reportLimit, (req, res) => {
  const data = loadStore();
  const userId = req.headers['x-user-id'];
  const user = data.users[userId];
  if (!requireActiveUser(user, res)) return;
  if (!requireEula(user, res)) return;

  const swap = data.swaps[req.params.id];
  if (!swap) return res.status(404).json({ error: 'not_found' });
  if (swap.userA !== userId && swap.userB !== userId) {
    return res.status(403).json({ error: 'forbidden' });
  }

  const existing = findOpenReportForSwap(data, swap.id, userId);
  if (existing) {
    return res.json({
      ok: true,
      hidden: true,
      reportId: existing.id,
      message: 'report_submitted',
      peerContent: null,
      phase: 'hidden',
    });
  }

  const isA = swap.userA === userId;
  if (isA) swap.ratingByA = 'report';
  else swap.ratingByB = 'report';

  const peerId = reportedUserId(swap, userId);
  const contentSnapshot = reportedContentSnapshot(swap, userId);

  hideSwapForUser(swap, userId);
  redactAllSwapContent(swap);

  const report = createReport(data, {
    swapId: swap.id,
    reporterId: userId,
    reportedUserId: peerId,
    contentSnapshot,
    reason: req.body?.reason || 'user_report',
  });

  let peerAction = null;
  const peer = peerId !== 'bot' ? data.users[peerId] : null;
  if (peer) {
    peerAction = applyReportPenalty(peer, { severe: false });
  }

  completeSwapForUser(data, swap, userId);
  saveStore(data);

  res.json({
    ok: true,
    hidden: true,
    reportId: report.id,
    peerAction,
    message: 'report_submitted',
    peerContent: null,
    phase: 'hidden',
  });
});

const FEEDBACK_TYPES = new Set(['touched', 'dishonest']);

app.post('/api/swaps/:id/feedback', (req, res) => {
  const data = loadStore();
  const userId = req.headers['x-user-id'];
  const user = data.users[userId];
  if (!requireActiveUser(user, res)) return;
  if (!requireEula(user, res)) return;

  const { type } = req.body;
  if (!FEEDBACK_TYPES.has(type)) {
    return res.status(400).json({ error: 'invalid_feedback_type' });
  }

  const swap = data.swaps[req.params.id];
  if (!swap) return res.status(404).json({ error: 'not_found' });

  const isA = swap.userA === userId;
  if (!isA && swap.userB !== userId) return res.status(403).json({ error: 'forbidden' });

  const peerId = isA ? swap.userB : swap.userA;
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
  }

  const myRatingFromPeer = isA ? swap.ratingByB : swap.ratingByA;
  let myResult = { before: getResonance(user), after: getResonance(user), delta: 0 };

  if (myRatingFromPeer && myRatingFromPeer !== 'complete') {
    myResult = applyEnvelopeRating(user, myRatingFromPeer);
  }

  completeSwapForUser(data, swap, userId);
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
  const user = data.users[userId];
  if (!requireActiveUser(user, res)) return;
  if (!requireEula(user, res)) return;

  const swap = data.swaps[req.params.id];
  if (!swap) return res.status(404).json({ error: 'not_found' });
  if (swap.userA !== userId && swap.userB !== userId) {
    return res.status(403).json({ error: 'forbidden' });
  }

  completeSwapForUser(data, swap, userId);
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
