# Moderation admin — 24h review (developer only)

Set on Render: **Environment → ADMIN_SECRET** and **REPORT_EMAIL=office@tgbc.co.il**

Replace `YOUR-API` and `YOUR-SECRET`.

## List open reports

```bash
curl -s -H "x-admin-secret: YOUR-SECRET" \
  https://YOUR-API.onrender.com/admin/reports | jq
```

## Resolve a report

```bash
curl -s -X POST -H "x-admin-secret: YOUR-SECRET" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Reviewed — content removed, user banned"}' \
  https://YOUR-API.onrender.com/admin/reports/REPORT-UUID/resolve
```

## Remove swap content

```bash
curl -s -X POST -H "x-admin-secret: YOUR-SECRET" \
  https://YOUR-API.onrender.com/admin/swaps/SWAP-ID/remove
```

## Ban user (anonymous ID from report)

```bash
curl -s -X POST -H "x-admin-secret: YOUR-SECRET" \
  -H "Content-Type: application/json" \
  -d '{"reason":"guideline_1_2"}' \
  https://YOUR-API.onrender.com/admin/users/USER-UUID/ban
```

## Suspend user (days)

```bash
curl -s -X POST -H "x-admin-secret: YOUR-SECRET" \
  -H "Content-Type: application/json" \
  -d '{"days":7,"reason":"report"}' \
  https://YOUR-API.onrender.com/admin/users/USER-UUID/suspend
```

Reports also appear in Render logs as `[MODERATION ALERT]` when created.
