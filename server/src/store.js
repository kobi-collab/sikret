import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..');
const DATA_FILE = path.join(dataDir, 'data.json');

const defaultData = () => ({
  users: {},
  queue: [],
  swaps: {},
  reports: {},
});

export function loadStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch {
    /* fresh */
  }
  return defaultData();
}

export function saveStore(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
