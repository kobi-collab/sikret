# סיקרט — חבילת App Store Connect + Wix

**אפליקציה:** סיקרט · Bundle `com.sikret.app` · ASC App ID `6773273537`  
**קישור:** https://appstoreconnect.apple.com/apps/6773273537  

**תמיכה:** office@tgbc.co.il  
**אתר:** https://www.tgbc.co.il  

---

## Wix — עמודים נפרדים (לא נוגעים באפליקציה האחרת)

| עמוד | URL סופי | הוראות |
|------|----------|--------|
| מדיניות | https://www.tgbc.co.il/sikret-privacy | עמוד **חדש** — ראה `docs/WIX-TGBC-SIKRET.md` |
| תמיכה | https://www.tgbc.co.il/sikret-support | עמוד **חדש** |

**לא** לערוך את העמוד המוסתר של האפליקציה השנייה — רק שני עמודים חדשים עם `sikret-` ב-URL.

---

# חלק א — App Store Connect (עברית)

## App Information

| שדה | ערך |
|-----|-----|
| **Name** | סיקרט |
| **Subtitle** (עד 30 תווים) | חיים בלי סודות |
| **Privacy Policy URL** | https://www.tgbc.co.il/sikret-privacy |
| **Category (Primary)** | Social Networking |
| **Category (Secondary)** | Lifestyle (אופציונלי) |
| **Content Rights** | אין מוזיקה/תוכן צד שלישי שדורש הרשאות |

## Version Information (1.0.0)

### Promotional Text (אופציונלי, עד 170)

מתוודים על סוד, מקבלים סוד זר בתמורה. אנונימי. טקסט בלבד. הסוד נשלח רק כשיש התאמה.

### Description (תיאור — העתק)

סיקרט — חיים בלי סודות.

סיקרט היא מקום לשתף סודות טקסט עם זרים, בלי פרופיל, בלי שם ובלי רשימת חברים.

איך זה עובד?
• בוחרים כיוון (כוונה) — לא את תוכן הסוד.
• כותבים סוד (טקסט, 100–1500 תווים).
• שולחים לתור — הסוד נשלח רק כשנמצא סוד זר בתמורה.
• מקבלים סוד של זר, קוראים, מדרגים (נגע בי / לא כנה) או מדווחים.
• תהודה — ציון 1–5 שמשקף איך הסודות שלך מתקבלים.

חשוב לדעת:
• גיל 18+ בלבד.
• אין ביטול אחרי שליחה — חשבו לפני ששולחים.
• אל תכללו שם, טלפון או @username בסוד.
• סיקרט אינה טיפול, ייעוץ או תמיכה מקצועית. במצב חירום פנו לעזרה מקומית.

בטא: אם אין זר זמין, אחרי כמה שניות עשוי להגיע סוד אנונימי (בוט) לצורך חוויית המסחר.

תמיכה: office@tgbc.co.il

### Keywords (מילות מפתח, עד 100 תווים, מופרדות בפסיק)

סוד,וידוי,אנונימי,שיתוף,תמיכה,טקסט,זרים,תהודה

### Support URL

https://www.tgbc.co.il/sikret-support

### Marketing URL (אופציונלי)

https://www.tgbc.co.il

---

## Age Rating (שאלון)

בחרו לפי הממשק — בדרך כלל:

| נושא | תשובה נפוצה לסיקרט |
|------|---------------------|
| Unrestricted Web Access | No |
| User Generated Content | **Yes** |
| Messaging / Chat | No (אין צ'אט רציף — החלפה חד-פעמית) |
| Mature/Suggestive Themes | Infrequent/Mild או None — לפי שיקול (תוכן משתמשים) |
| Horror / Violence | None |
| Gambling | None |

**תוצאה ב-Connect:** הגדר **18+** (לא 17+) — אפליקציה מיועדת למבוגרים, UGC, אין מודרציה ידנית 24/7 בזמן אמת.

---

## App Privacy (Nutrition Labels)

| סוג | פירוט |
|-----|--------|
| **Data linked to you** | מינימלי — מזהה מכשיר אנונימי לתפעול |
| **User Content** | סודות טקסט — לפונקציונליות האפליקציה |
| **Not used for tracking** | כן, אם אין פרסום |
| **Third-party advertising** | No |

אין מכירת נתונים לברוקרים. אין חשבון אימייל באפליקציה.

---

# App Review response (Guideline 1.2): see **APP_REVIEW_RESPONSE.md**

**Contact:** office@tgbc.co.il  
**Phone:** [המספר שלך — חובה למלא ב-Connect]  
**Notes:**

```
Sikret (Hebrew UI, RTL) — anonymous one-to-one text "secret swap" app.

Flow:
1. User picks an intention category (not the secret content).
2. User writes a text secret (100–1500 chars) and joins a queue.
3. When matched with another user (same intention), both secrets are exchanged.
4. User reads peer secret, rates (touched me / dishonest) or reports.
5. "Resonance" score 1–5 reflects how user's secrets are received.

No social graph, no chat, no photos in v1. No account email in-app.
Anonymous device ID for quotas and moderation.

Moderation: report button + graduated suspension (already implemented).
18+ onboarding disclaimer; not therapy/medical.

Beta: if no human match within ~8s, an anonymous bot secret may be delivered.

Backend: https://sikret-api.onrender.com (HTTPS). Test account not required — create user on first launch.

Demo: open app → complete 18+ onboarding → tap new secret → pick intention → write 100+ chars → send to queue. Second device/simulator with same intention will match faster.

Privacy: https://www.tgbc.co.il/sikret-privacy
Support: https://www.tgbc.co.il/sikret-support
```

**Sign-in required:** No  
**Demo account:** Not needed  

---

# חלק ג — צילומי מסך (אתה מוסיף)

מומלץ 3–5 מסכים (iPhone 6.7"):

1. מסך בית — תהודה + "סוד חדש"
2. כוונה
3. כתיבת סוד
4. קבלת סוד זר
5. "משהו נחזר אליך" (תהודה)

---

# חלק ד — שליחה לביקורת

1. ודא ש-Wix עמודים **פורסמו** ו-URL עובדים בדפדפן בסתר
2. מלא שדות למעלה ב-Connect
3. בחר build מ-TestFlight
4. **Add for Review**

---

*עודכן: מאי 2026*
