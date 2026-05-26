import { BOT_WAIT_MS } from './botMatch.js';
import { createBotSwap } from './match.js';
import { loadStore, saveStore } from './store.js';

export { BOT_WAIT_MS };
const TICK_MS = 2000;

export function startBotWorker() {
  setInterval(() => {
    const data = loadStore();
    const now = Date.now();
    const stale = data.queue.filter(
      (q) => !q.matched && now - (q.joinedAt || q.sealedAt || 0) >= BOT_WAIT_MS,
    );
    if (stale.length === 0) return;

    for (const entry of stale) {
      const stillThere = data.queue.find((q) => q.id === entry.id && !q.matched);
      if (stillThere) {
        createBotSwap(data, stillThere);
        console.log(`[bot] matched ${stillThere.id} for user ${stillThere.userId}`);
      }
    }
    saveStore(data);
  }, TICK_MS);

  console.log(`[bot] worker started (${BOT_WAIT_MS}ms wait)`);
}
