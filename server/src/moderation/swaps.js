/** Hide received secret from recipient view */
export function hideSwapForUser(swap, userId) {
  const isA = swap.userA === userId;
  if (!isA && swap.userB !== userId) return false;
  if (isA) swap.hiddenForA = true;
  else swap.hiddenForB = true;
  swap.hiddenAt = swap.hiddenAt || Date.now();
  if (swap.status !== 'completed') swap.status = 'completed';
  return true;
}

export function redactPeerContent(swap, userId) {
  const isA = swap.userA === userId;
  if (isA) swap.contentB = null;
  else swap.contentA = null;
}

export function peerContentForUser(swap, userId) {
  if (swap.contentRemoved) return null;
  const isA = swap.userA === userId;
  if (isA && swap.hiddenForA) return null;
  if (!isA && swap.hiddenForB) return null;
  return isA ? swap.contentB : swap.contentA;
}

export function reportedUserId(swap, reporterId) {
  const isA = swap.userA === reporterId;
  return isA ? swap.userB : swap.userA;
}

export function reportedContentSnapshot(swap, reporterId) {
  return peerContentForUser(swap, reporterId) || '';
}
