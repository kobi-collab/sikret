#!/usr/bin/env node
/** Integration verification for Guideline 1.2 server enforcement */
const BASE = process.env.API_BASE || 'http://127.0.0.1:3848';
const SECRET = process.env.ADMIN_SECRET || 'test-admin-secret-123';

const pad = (c) => c.repeat(100);

async function req(path, { method = 'GET', userId, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (userId) headers['x-user-id'] = userId;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function admin(path, method = 'GET', body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': SECRET,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function main() {
  const results = [];

  const reg = await req('/api/users', { method: 'POST', body: {} });
  const uid = reg.data.userId;
  results.push(['register user', reg.status === 200 && !!uid]);

  const noEula = await req('/api/queue/join', {
    method: 'POST',
    userId: uid,
    body: { intention: 'confess', content: pad('a') },
  });
  results.push(['1. queue join blocked without EULA', noEula.status === 403 && noEula.data.error === 'eula_required']);

  await req('/api/eula/accept', { method: 'POST', userId: uid });
  const withEula = await req('/api/queue/join', {
    method: 'POST',
    userId: uid,
    body: { intention: 'confess', content: pad('b') },
  });
  results.push(['1. queue join allowed after EULA', withEula.status === 200]);

  const filtered = await req('/api/queue/join', {
    method: 'POST',
    userId: uid,
    body: { intention: 'confess', content: `spam@test.com ${pad('c')}` },
  });
  results.push(['2. server filter blocks email', filtered.status === 400 && filtered.data.error === 'content_blocked']);

  // Two-user queue integrity (regression: queue wipe bug)
  const regA = await req('/api/users', { method: 'POST', body: {} });
  const regB = await req('/api/users', { method: 'POST', body: {} });
  const uidA = regA.data.userId;
  const uidB = regB.data.userId;
  await req('/api/eula/accept', { method: 'POST', userId: uidA });
  await req('/api/eula/accept', { method: 'POST', userId: uidB });
  await req('/api/queue/join', {
    method: 'POST',
    userId: uidA,
    body: { intention: 'confess', content: pad('h') },
  });
  const joinB = await req('/api/queue/join', {
    method: 'POST',
    userId: uidB,
    body: { intention: 'confess', content: pad('i') },
  });
  const stA = await req('/api/queue/status', { userId: uidA });
  results.push([
    'queue: two users match (no wipe)',
    joinB.data.status === 'matched' || stA.data.status === 'matched' || !!stA.data.swapId,
  ]);

  // wait for bot match
  let swapId = null;
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const st = await req('/api/queue/status', { userId: uid });
    if (st.data.swapId) {
      swapId = st.data.swapId;
      break;
    }
  }
  results.push(['bot/swap available for report test', !!swapId]);

  if (swapId) {
    const before = await req(`/api/swaps/${swapId}`, { userId: uid });
    results.push(['swap has peer content before report', !!before.data.peerContent]);

    const report = await req(`/api/swaps/${swapId}/report`, { method: 'POST', userId: uid, body: {} });
    results.push(['3. report creates reportId', report.status === 200 && !!report.data.reportId]);
    results.push(['4. report hides content in response', report.data.peerContent === null || report.data.hidden === true]);

    const after = await req(`/api/swaps/${swapId}`, { userId: uid });
    results.push(['4. GET swap after report has no peerContent', !after.data.peerContent]);

    const adminList = await admin('/admin/reports');
    const found = adminList.data.reports?.some((r) => r.id === report.data.reportId);
    results.push([
      '3. report persisted open with fields',
      found &&
        adminList.data.reports.find((r) => r.id === report.data.reportId).status === 'open' &&
        adminList.data.reports.find((r) => r.id === report.data.reportId).swapId === swapId,
    ]);

    // hide test on new swap
    const reg2 = await req('/api/users', { method: 'POST', body: {} });
    const uid2 = reg2.data.userId;
    await req('/api/eula/accept', { method: 'POST', userId: uid2 });
    await req('/api/queue/join', { method: 'POST', userId: uid2, body: { intention: 'confess', content: pad('d') } });
    let swap2 = null;
    for (let i = 0; i < 12; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const st = await req('/api/queue/status', { userId: uid2 });
      if (st.data.swapId) {
        swap2 = st.data.swapId;
        break;
      }
    }
    if (swap2) {
      const hide = await req(`/api/swaps/${swap2}/hide`, { method: 'POST', userId: uid2 });
      const afterHide = await req(`/api/swaps/${swap2}`, { userId: uid2 });
      results.push(['5. hide updates server state', hide.data.hidden === true && !afterHide.data.peerContent]);
    } else {
      results.push(['5. hide test skipped', false]);
    }

    const peerId = report.data.reportedUserId || before.data.isBot ? 'bot' : null;
    if (peerId && peerId !== 'bot') {
      await admin(`/admin/users/${peerId}/ban`, 'POST', { reason: 'test' });
      const bannedJoin = await req('/api/queue/join', {
        method: 'POST',
        userId: peerId,
        body: { intention: 'confess', content: pad('e') },
      });
      results.push(['6. banned user cannot submit', bannedJoin.status === 403 && bannedJoin.data.error === 'banned']);
    } else {
      // ban uid2 for test
      await admin(`/admin/users/${uid2}/ban`, 'POST', { reason: 'test' });
      const bannedJoin = await req('/api/queue/join', {
        method: 'POST',
        userId: uid2,
        body: { intention: 'confess', content: pad('f') },
      });
      results.push(['6. banned user cannot submit', bannedJoin.status === 403 && bannedJoin.data.error === 'banned']);
    }

    const resolve = await admin(`/admin/reports/${report.data.reportId}/resolve`, 'POST', { notes: 'test' });
    results.push(['7. resolve report', resolve.data.ok === true]);

    const remove = await admin(`/admin/swaps/${swapId}/remove`, 'POST');
    results.push(['7. remove swap', remove.data.ok === true]);

    const suspendUser = uid;
    await admin(`/admin/users/${suspendUser}/suspend`, 'POST', { days: 1 });
    const suspendedJoin = await req('/api/queue/join', {
      method: 'POST',
      userId: suspendUser,
      body: { intention: 'confess', content: pad('g') },
    });
    results.push(['7. suspend user', suspendedJoin.status === 403 && suspendedJoin.data.error === 'suspended']);
  }

  console.log('\n=== Verification Results ===');
  let pass = 0;
  for (const [name, ok] of results) {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} passed`);
  process.exit(pass === results.length ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
