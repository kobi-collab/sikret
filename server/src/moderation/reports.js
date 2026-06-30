import { v4 as uuidv4 } from 'uuid';
import { notifyReportCreated } from '../notify.js';

export function ensureReportsStore(data) {
  if (!data.reports) data.reports = {};
}

export function findOpenReportForSwap(data, swapId, reporterId) {
  ensureReportsStore(data);
  return Object.values(data.reports).find(
    (r) => r.status === 'open' && r.swapId === swapId && r.reporterId === reporterId,
  );
}

export function createReport(data, payload) {
  ensureReportsStore(data);
  const existing = findOpenReportForSwap(data, payload.swapId, payload.reporterId);
  if (existing) return existing;

  const id = uuidv4();
  const report = {
    id,
    swapId: payload.swapId,
    reporterId: payload.reporterId,
    reportedUserId: payload.reportedUserId,
    contentSnapshot: payload.contentSnapshot?.slice(0, 2000) || '',
    reason: payload.reason || 'user_report',
    status: 'open',
    createdAt: Date.now(),
    resolvedAt: null,
    adminNotes: null,
  };
  data.reports[id] = report;
  notifyReportCreated(report).catch((err) => console.warn('[notify]', err.message));
  return report;
}

export function listOpenReports(data) {
  ensureReportsStore(data);
  return Object.values(data.reports)
    .filter((r) => r.status === 'open')
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function resolveReport(data, reportId, notes = null) {
  ensureReportsStore(data);
  const report = data.reports[reportId];
  if (!report) return null;
  report.status = 'resolved';
  report.resolvedAt = Date.now();
  if (notes) report.adminNotes = notes;
  return report;
}
