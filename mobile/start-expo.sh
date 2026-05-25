#!/bin/bash
cd "$(dirname "$0")"

IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
if [ -n "$IP" ]; then
  echo "EXPO_PUBLIC_API_URL=http://${IP}:3847" > .env.local
  echo "API URL: http://${IP}:3847"
else
  echo "לא מצאתי IP — ערוך ידנית את .env.local"
fi

export EXPO_PUBLIC_API_URL="http://${IP}:3847"

echo "מפעיל Expo (LAN) — API: $EXPO_PUBLIC_API_URL"
npx expo start --port 8082 -c --lan
