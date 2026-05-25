# סיקרט — מדריך העלאה ל-App Store

מסמך צעד-אחר-צעד. סמן ✅ כשסיימת.

---

## שלב 0 — לפני הכל (חובה)

| # | משימה | סטטוס |
|---|--------|--------|
| 0.1 | [Apple Developer Program](https://developer.apple.com/programs/) — 99$/שנה | ☐ |
| 0.2 | חשבון [Expo](https://expo.dev) (חינם) | ☐ |
| 0.3 | **שרת API בענן** — בלי זה האפליקציה לא תעבוד אחרי השקה | ☐ |
| 0.4 | **מדיניות פרטיות** ב-URL ציבורי (חובה ב-App Store) | ☐ |
| 0.5 | **אייקון 1024×1024** ל-`mobile/assets/icon.png` | ☐ |

---

## שלב 1 — שרת פרודקשן (API)

האפליקציה בבנייה לחנות **לא** יכולה להשתמש ב-`localhost`.

### איפה הכי זול? (המלצה)

| פלטפורמה | מחיר | מתאים לסיקרט? |
|----------|------|----------------|
| **[Render Free](https://render.com)** | **$0** | ✅ TestFlight — השרת "נרדם" בלי שימוש; בוט מתעורר עם הבקשה הראשונה |
| **Render Starter** | ~$7/חודש | ✅ App Store — תמיד דלוק |
| Railway | לפי שימוש | ✅ אם **כבר יש** לך חשבון — אותו תהליך (GitHub → Deploy) |
| Fly.io | ~$3–5 | ✅ תמיד דלוק, קצת יותר טכני |

**מדריך פריסה:** [`scripts/deploy-render.md`](scripts/deploy-render.md) + קובץ `render.yaml` בשורש הפרויקט.

### Wix (מדיניות + תמיכה)

אין צורך לאחסן את השרת ב-Wix — רק **עמודי טקסט**.  
העתק מ-[`docs/WIX-PAGES.md`](docs/WIX-PAGES.md) לשני עמודים: `/privacy` ו-`/support`.

---

## שלב 2 — הכנת האפליקציה (בטרמינל)

```bash
cd ~/Sikret/mobile

# התקנת כלים (פעם אחת)
npm install -g eas-cli

# התחברות ל-Expo
eas login

# קישור הפרויקט ל-EAS (יוצר projectId)
eas init
```

אחרי `eas init` — ודא ש-`app.json` עודכן עם `projectId` אמיתי (לא REPLACE_...).

### סוד API לבניית פרודקשן

```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://YOUR-API-URL"
```

(החלף ב-URL האמיתי של השרת, **בלי** סלאש בסוף)

### אייקון

1. צור תמונה **1024×1024** PNG (רקע כהה + ניאון / יהלום — לפי DESIGN-SIKRET.md)
2. שמור: `~/Sikret/mobile/assets/icon.png`
3. עדכן `app.json` — הוסף שורה: `"icon": "./assets/icon.png"`

---

## שלב 3 — בניית iOS לחנות (EAS)

```bash
cd ~/Sikret/mobile

eas build --platform ios --profile production
```

- לוקח ~15–25 דקות
- בפעם הראשונה: EAS יבקש להגדיר **Apple credentials** (Apple ID + Team)
- בסוף: קישור ל-`.ipa` או העלאה אוטומטית

### TestFlight (מומלץ לפני חנות)

```bash
eas build --platform ios --profile production
eas submit --platform ios --latest
```

או העלה ידנית ב-[App Store Connect](https://appstoreconnect.apple.com) → TestFlight.

---

## שלב 4 — App Store Connect

1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **אפליקציות** → **+**
2. שם: **סיקרט**
3. Bundle ID: `com.sikret.app` (חייב להתאים ל-`app.json`)
4. SKU: `sikret-ios` (כל מזהה)

### מטא-דאטה (עברית)

**שם:** סיקרט  
**כותרת משנה:** חיים בלי סודות  
**תיאור קצר:** מתוודים על סוד, מקבלים סוד זר בתמורה. אנונימי. טקסט בלבד.  
**מילות מפתח:** סוד, וידוי, אנונימי, שיתוף, תמיכה  
**קטגוריה:** Social Networking או Lifestyle  
**גיל:** 17+ (תוכן שנוצר על ידי משתמשים)

**מדיניות פרטיות (URL):**  
העלה את `docs/PRIVACY.md` ל-GitHub Pages / Notion / אתר — והדבק את ה-URL.

**תמיכה (URL):** מייל או טופס (חובה שדה תמיכה).

### צילומי מסך

- iPhone 6.7" — לפחות 3 צילומים
- מסך בית (תהודה + סוד חדש)
- מסך קבלת סוד
- מסך "משהו נחזר אליך"

### שאלון תוכן (App Review)

- **UGC:** כן — משתמשים כותבים טקסט
- **מודרציה:** דיווח + השעיה (תאר בקצרה)
- **חשבון:** אנונימי (מזהה מכשיר)
- **הצפנה:** HTTPS; תוכן לא מוצפן E2E ב-MVP (לציין בכנות)

---

## שלב 5 — שליחה לביקורת

```bash
cd ~/Sikret/mobile
eas submit --platform ios --latest
```

או ב-App Store Connect: בחר build → **שלח לביקורת**.

זמן המתנה: בדרך כלל 1–3 ימים (לפעמים יותר).

---

## פקודות מהירות (סיכום)

```bash
# 1. שרת בענן — URL ב-EXPO_PUBLIC_API_URL
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://..."

# 2. בנייה
cd ~/Sikret/mobile && eas build -p ios --profile production

# 3. שליחה
eas submit -p ios --latest
```

---

## בעיות נפוצות

| בעיה | פתרון |
|------|--------|
| האפליקציה לא מתחברת אחרי התקנה | `EXPO_PUBLIC_API_URL` לא הוגדר ב-EAS secret לפני build |
| Bundle ID לא תואם | אותו ID ב-Apple Developer + app.json |
| חסר Privacy URL | העלה `docs/PRIVACY.md` לאינטרנט |
| Build נכשל ב-credentials | `eas credentials` → iOS → התחבר מחדש |

---

*עדכון: מאי 2026*
