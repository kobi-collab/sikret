# סיקרט (Sikret)

אפליקציית החלפת מעטפות טקסט עם זרים — MVP לבדיקות ולהעלאה ל-App Store.

## מבנה

- `mobile/` — Expo (React Native) · iOS + Android
- `server/` — API מקומי (תור, זיווג, נעילה, דיווח)
- `PRD-SIKRET-MVP.md` · `DESIGN-SIKRET.md`

## הרצה מקומית (בדיקה)

### 1. שרת

```bash
cd server
npm install
npm run dev
```

ה-API על `http://0.0.0.0:3847`

### 2. אפליקציה

```bash
cd mobile
npm install
npx expo start
```

- **סימולטור iOS:** `i` בתוך Expo — ה-API כבר על `127.0.0.1:3847`
- **מכשיר פיזי:** צור `mobile/.env.local`:

```bash
EXPO_PUBLIC_API_URL=http://<IP-של-המחשב>:3847
```

(אותה רשת Wi‑Fi; IP מ-`ifconfig` / הגדרות רשת)

### 3. בדיקה עם שני משתמשים

1. שני סימולטורים / טלפון + סימולטור  
2. אותה כוונה (למשל "מתוודה") בשניהם  
3. נכנסים לתור — אמור להתאים תוך שניות  
4. אם אין זר — אחרי ~12 שניות מצטרפת **מעטפת בוט** (בטא)

## העלאה ל-App Store (iOS)

**מדריך מלא:** [`APP_STORE.md`](APP_STORE.md) (צ'קליסט + App Store Connect + בעיות נפוצות)

### התחלה מהירה

```bash
cd mobile
npm i -g eas-cli && eas login
eas init
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://YOUR-API"
eas build --platform ios --profile production
eas submit --platform ios --latest
```

**לפני build:** שרת בענן (`server/Dockerfile`), אייקון `mobile/assets/icon.png`, מדיניות `docs/PRIVACY.md` ב-URL ציבורי.

### Android (Play Store)

```bash
eas build --platform android --profile production
eas submit --platform android
```

## פיצ'רים ב-MVP

- [x] onboarding + 18+
- [x] כוונה, טקסט (100–1500), מצב פתיחה
- [x] תור + זיווג + בוט אחרי 12ש
- [x] נעילה כפולה, בלי ביטול
- [x] דירוג / דיווח / השעיה
- [x] 3 מעטפות/יום (2 לחשבון חדש)
- [x] עיצוב Cyber-Spiritual
- [ ] תמונות + מנוי (v1.1)
- [ ] שרת פרודקשן מוצפן E2E מלא

## פתרון בעיות

| בעיה | פתרון |
|------|--------|
| Network request failed | בדוק שהשרת רץ; בטלפון השתמש ב-IP המחשב ב-`.env.local` |
| לא מתאים לזר | ודא אותה **כוונה**; או המתן לבוט |
| EPERM ביצירת תיקיות | הרץ מהטרמינל המקומי: `npm install` בתוך `server` ו-`mobile` |

---

*נבנה לפי PRD מאי 2026*
# sikret
