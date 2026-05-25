#!/bin/bash
cd "$(dirname "$0")"

if [ ! -d node_modules/cors ]; then
  echo "מתקין תלויות..."
  npm install
fi

PID=$(lsof -ti:3847 2>/dev/null)
if [ -n "$PID" ]; then
  echo "סוגר תהליך ישן על פורט 3847..."
  kill -9 $PID 2>/dev/null || true
  sleep 1
fi

echo "מפעיל שרת סיקרט..."
npm start
