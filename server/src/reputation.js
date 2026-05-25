export const MIN_RESONANCE = 1;
export const MAX_RESONANCE = 5;
export const DEFAULT_RESONANCE = 3;

export function getResonance(user) {
  if (user?.reputation != null) return clampResonance(user.reputation);
  if (user?.trustScore != null) {
    return clampResonance(1 + (user.trustScore / 100) * 4);
  }
  return DEFAULT_RESONANCE;
}

export function clampResonance(value) {
  return Math.round(Math.min(MAX_RESONANCE, Math.max(MIN_RESONANCE, value)) * 10) / 10;
}

export function applyEnvelopeRating(user, type) {
  const before = getResonance(user);
  let after = before;

  if (type === 'touched') after += 0.35;
  else if (type === 'dishonest') {
    after -= 0.6;
    user.reportsReceived = (user.reportsReceived || 0) + 1;
  } else if (type === 'report') {
    after -= 1.2;
    user.reportsReceived = (user.reportsReceived || 0) + 1;
  }

  user.reputation = clampResonance(after);
  const delta = Math.round((user.reputation - before) * 10) / 10;

  return { before, after: user.reputation, delta };
}

export function botResonance() {
  return 4.2;
}
