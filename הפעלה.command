#!/bin/bash
# סיקרט — הפעלה בלחיצה כפולה (macOS)
set -e
cd "$(dirname "$0")"

osascript -e 'tell app "Terminal" to do script "cd \"'"$(pwd)"'/server\" && npm run dev"' 2>/dev/null || true

sleep 2
cd mobile
if [ ! -d node_modules ]; then npm install; fi
npx expo start
