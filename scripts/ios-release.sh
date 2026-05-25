#!/bin/bash
# הרצה אחרי: eas login, eas init, פריסת API, URL ב-EAS secret
set -euo pipefail
cd "$(dirname "$0")/../mobile"

echo "=== סיקרט — בניית iOS ל-TestFlight ==="
echo "ודא: eas whoami עובד, projectId ב-app.json, EXPO_PUBLIC_API_URL ב-secret"
echo ""

if ! eas whoami >/dev/null 2>&1; then
  echo "הרץ קודם: eas login"
  exit 1
fi

eas build --platform ios --profile production --non-interactive

echo ""
echo "אחרי שה-build הסתיים:"
echo "  eas submit --platform ios --latest"
echo "או העלה ידנית ב-App Store Connect → TestFlight"
