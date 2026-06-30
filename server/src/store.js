import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..');
const DATA_FILE = path.join(dataDir, 'data.json');
const BACKUP_FILE = path.join(dataDir, 'data.json.bak');

const defaultData = () => ({
  users: {},
  queue: [],
  swaps: {},
  reports: {},
});

export function loadStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[store] corrupt data.json, backing up:', err.message);
    try {
      if (fs.existsSync(DATA_FILE)) {
        fs.copyFileSync(DATA_FILE, `${BACKUP_FILE}.${Date.now()}`);
      }
    } catch {
      /* ignore backup failure */
    }
  }
  return defaultData();
}

/** Atomic write — temp file then rename */
export function saveStore(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

/** Israel calendar day (Asia/Jerusalem) */
export function todayKey() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(new Date());
}
