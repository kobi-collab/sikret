import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '..', 'mobile', 'assets');

// Minimal valid 1x1 PNG (dark purple)
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

fs.mkdirSync(assetsDir, { recursive: true });
for (const name of ['icon.png', 'splash-icon.png', 'adaptive-icon.png', 'favicon.png']) {
  fs.writeFileSync(path.join(assetsDir, name), png);
}
console.log('Assets created in mobile/assets');
