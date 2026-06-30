import { Router } from 'express';
import { createReport, listOpenReports, resolveReport } from './moderation/reports.js';
import { banUser, suspendUser } from './moderation/users.js';
import { loadStore, saveStore } from './store.js';

function adminAuth(req, res, next) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return res.status(503).json({ error: 'admin_not_configured', hint: 'Set ADMIN_SECRET env var' });
  }
  const provided = req.headers['x-admin-secret'];
  if (provided !== secret) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

export function createAdminRouter() {
  const router = Router();
  router.use(adminAuth);

  router.get('/reports', (req, res) => {
    const data = loadStore();
    const open = listOpenReports(data);
    res.json({ reports: open, count: open.length });
  });

  router.post('/reports/:id/resolve', (req, res) => {
    const data = loadStore();
    const report = resolveReport(data, req.params.id, req.body?.notes || null);
    if (!report) return res.status(404).json({ error: 'not_found' });
    saveStore(data);
    res.json({ ok: true, report });
  });

  router.post('/swaps/:id/remove', (req, res) => {
    const data = loadStore();
    const swap = data.swaps[req.params.id];
    if (!swap) return res.status(404).json({ error: 'not_found' });
    swap.contentRemoved = true;
    swap.contentA = '[removed by moderation]';
    swap.contentB = '[removed by moderation]';
    swap.status = 'removed';
    swap.removedAt = Date.now();
    saveStore(data);
    res.json({ ok: true, swapId: swap.id });
  });

  router.post('/users/:id/ban', (req, res) => {
    const data = loadStore();
    const user = data.users[req.params.id];
    if (!user) return res.status(404).json({ error: 'not_found' });
    banUser(user, req.body?.reason || 'admin_ban');
    saveStore(data);
    res.json({ ok: true, userId: user.id, banned: true });
  });

  router.post('/users/:id/suspend', (req, res) => {
    const data = loadStore();
    const user = data.users[req.params.id];
    if (!user) return res.status(404).json({ error: 'not_found' });
    const days = Number(req.body?.days) || 7;
    suspendUser(user, days, req.body?.reason || 'admin_suspend');
    saveStore(data);
    res.json({ ok: true, userId: user.id, suspendedUntil: user.suspendedUntil });
  });

  return router;
}
