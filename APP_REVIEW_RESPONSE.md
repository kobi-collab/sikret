# App Review Response — Guideline 1.2 (User-Generated Content)

Copy into **App Store Connect → App Review Information → Notes** (English).

---

```
Sikret — Guideline 1.2 UGC compliance (anonymous text swap, Hebrew UI, RTL)

ARCHITECTURE
- No public feed, no chat, no profiles, no photos in v1.
- One-to-one anonymous text exchange: user writes a secret, joins a queue, receives one stranger’s secret in return.
- Users identified only by anonymous server-side device/user ID.

EULA / COMMUNITY RULES (in-app, mandatory)
- After onboarding (18+), users must open “Terms & Community Rules” (/terms) and tap “I Agree” (אני מסכים/ה) before submitting or reading secrets.
- Agreement is persisted locally and on server (POST /api/eula/accept).
- Terms state zero tolerance for objectionable content and abusive users, list prohibited categories (harassment, threats, hate, sexual explicit, illegal, PII/doxxing, bullying, copyright abuse, self-harm encouragement, spam), and explain suspension/ban/removal.

CONTENT FILTERING (pre-submission)
- Client: mobile/src/moderation/filter.ts runs before compose continues and before queue join.
- Server: server/src/moderation/filter.js re-validates on POST /api/queue/join.
- Blocks PII patterns (email, phone, URLs) and a maintainable banned-term list (Hebrew/English).
- User sees a friendly Hebrew alert when blocked.

REPORTING (received secret screen)
- On swap screen after reading a received secret, user can tap “דיווח” (Report).
- POST /api/swaps/:id/report creates a persisted report (reports store with timestamp, status=open, content snapshot, reporter ID, reported user ID).
- Reported content is immediately hidden/removed from the recipient’s screen.
- Confirmation: “הדיווח נשלח והתוכן הוסר מהמסך”.
- Reported human senders receive automatic suspension (7 days) or ban after repeated/severe violations.

HIDE / REMOVE FROM SCREEN (no public feed — maps Apple “remove posts from feed”)
- Sikret has **no public feed, no public posts, no profile timeline**.
- The only UGC surface is the **one-time received secret** on the swap screen.
- “Remove posts from feed” is implemented as **immediate removal/redaction** of that received secret:
  - **Report** → content hidden instantly + server redaction (`hiddenForA/B`, content null).
  - **Hide from screen (הסר מהמסך)** → same recipient-side removal without filing a report.
- There is nothing to “remove from a feed” because content is never published to a shared feed.

BLOCK / EJECT ABUSIVE USERS
- Server tracks banned flag and suspendedUntil on anonymous user ID.
- Banned/suspended users cannot join queue (403).
- Suspended/banned users see in-app blocked state (/suspended).

24-HOUR DEVELOPER REVIEW
- All reports stored server-side with createdAt and status (open/resolved).
- On each new report, server logs [MODERATION ALERT] to production logs (Render) and targets office@tgbc.co.il (REPORT_EMAIL env).
- Developer moderation API (protected by ADMIN_SECRET env, not in app):
  - GET /admin/reports
  - POST /admin/reports/:id/resolve
  - POST /admin/swaps/:id/remove
  - POST /admin/users/:id/ban
  - POST /admin/users/:id/suspend
- See scripts/MODERATION_ADMIN.md for curl examples.

IN-APP CONTACT
- Support / Report Abuse screen (/support) reachable from home.
- Displays office@tgbc.co.il and explains reporting process.

TEST FOR REVIEWER
1. Launch app → complete onboarding → accept Terms on /terms.
2. Home → New secret → pick intention → write 100+ chars (no email/phone) → send → queue → receive secret (bot ~8s if alone).
3. On received secret: test “Report” (content disappears) or “Hide from screen”.
4. Support: Home → “תמיכה ודיווח”.

Privacy: https://www.tgbc.co.il/sikret-privacy
Support: https://www.tgbc.co.il/sikret-support
Contact: office@tgbc.co.il
```

---

## Apple bullet → implementation map

| Apple requirement | Implementation |
|-------------------|----------------|
| EULA before UGC | `/terms` + server `eulaAcceptedAt` gate |
| Zero tolerance stated | `mobile/src/terms.ts` + visible sections |
| Report mechanism | `swap.tsx` → `POST /api/swaps/:id/report` |
| Content removed after report | Immediate UI hide + server redaction |
| Remove/hide content | `הסר מהמסך` → `POST /api/swaps/:id/hide` |
| Filter before post | `moderation/filter.ts` + server filter |
| Block abusive users | ban/suspend on anonymous ID |
| 24h review | reports store + admin API + log/email |
| Contact in app | `/support` + `office@tgbc.co.il` |
