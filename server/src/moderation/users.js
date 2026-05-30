const DAY = 24 * 60 * 60 * 1000;

export function isBanned(user) {
  return !!user?.banned;
}

export function isSuspended(user) {
  if (isBanned(user)) return true;
  return !!(user?.suspendedUntil && user.suspendedUntil > Date.now());
}

export function banUser(user, reason = 'moderation') {
  user.banned = true;
  user.bannedAt = Date.now();
  user.banReason = reason;
  user.suspendedUntil = null;
}

export function suspendUser(user, days, reason = 'moderation') {
  user.suspendedUntil = Date.now() + days * DAY;
  user.lastSuspendReason = reason;
}

/** Report → 7 day suspend; severe filter hit → 30 day suspend */
export function applyReportPenalty(user, { severe = false } = {}) {
  user.reportsReceived = (user.reportsReceived || 0) + 1;
  if (severe || user.reportsReceived >= 5) {
    banUser(user, severe ? 'severe_content' : 'repeated_reports');
    return 'banned';
  }
  suspendUser(user, 7, 'report');
  return 'suspended';
}
