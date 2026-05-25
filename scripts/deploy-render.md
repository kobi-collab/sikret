# פריסת API ל-Render (הכי פשוט + חינם להתחלה)

## עלויות (2026)

| שירות | מחיר | הערה |
|--------|------|------|
| **Render Free** | $0 | נרדם אחרי ~15 דק׳ בלי טראפיק; התעוררות ~30 שנ׳ |
| **Render Starter** | ~$7/חודש | תמיד דלוק — מומלץ לפני שליחה לביקורת App Store |
| Fly.io | ~$3–5 | דורש CLI; תמיד דלוק |
| Railway | שימוש | אם כבר יש לך חשבון — גם טוב |

**לסיקרט:** צריך תהליך רץ (בוט כל 2 שניות). ב-Free השרת ישן — הבוט לא יעבוד עד שמישהו "מעיר" את השרת. ל-**TestFlight ראשון** — Free מספיק. ל-**חנות** — Starter.

## שלבים (10 דקות)

### 1. GitHub

```bash
cd ~/Sikret
git init
git add .
git commit -m "Sikret MVP — mobile + API"
```

צור repo ב-GitHub (private OK), ואז:

```bash
git remote add origin https://github.com/YOUR_USER/sikret.git
git push -u origin main
```

### 2. Render

1. https://dashboard.render.com — התחבר (Google/GitHub)
2. **New** → **Blueprint** → בחר את ה-repo
3. Render יזהה את `render.yaml` ויצור `sikret-api`
4. אחרי Deploy — העתק URL, למשל: `https://sikret-api.onrender.com`
5. בדוק: `https://sikret-api.onrender.com/health` → `{"ok":true}`

### 3. חיבור לאפליקציה

```bash
cd ~/Sikret/mobile
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://sikret-api.onrender.com"
```

(בלי `/` בסוף)

### 4. שדרוג (לפני App Store)

ב-Render → השירות → **Settings** → Plan → **Starter** ($7).
