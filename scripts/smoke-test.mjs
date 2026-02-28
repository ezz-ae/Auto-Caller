#!/usr/bin/env node

const baseUrl = process.env.APP_URL || 'http://localhost:3000';
const smokeEmail = process.env.SMOKE_EMAIL || process.env.SMOKE_USERNAME || '';
const smokePassword = process.env.SMOKE_PASSWORD || '';

function mergeHeaders(...entries) {
  return Object.assign({}, ...entries.filter(Boolean));
}

function extractCookieHeader(setCookie) {
  if (!setCookie) return '';
  return setCookie
    .split(/,(?=\s*[\w.-]+=)/)
    .map(chunk => chunk.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
}

async function expectJson(pathname, expectedStatus = 200, headers = {}) {
  const res = await fetch(`${baseUrl}${pathname}`, { headers });
  const contentType = res.headers.get('content-type') || '';

  if (res.status !== expectedStatus) {
    if (res.status === 401 && !smokeEmail) {
      throw new Error(`${pathname} returned 401. Set SMOKE_EMAIL and SMOKE_PASSWORD for authenticated smoke tests.`);
    }
    throw new Error(`${pathname} returned ${res.status}, expected ${expectedStatus}`);
  }

  if (!contentType.includes('application/json')) {
    throw new Error(`${pathname} did not return JSON`);
  }

  return res.json();
}

async function run() {
  console.log(`Running smoke test against ${baseUrl}`);
  let authHeaders = {};

  if (smokeEmail && smokePassword) {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: smokeEmail,
        password: smokePassword,
        rememberDevice: true,
      }),
    });

    if (!loginRes.ok) {
      throw new Error(`/api/auth/login returned ${loginRes.status}. Verify SMOKE_EMAIL and SMOKE_PASSWORD.`);
    }

    const cookieHeader = extractCookieHeader(loginRes.headers.get('set-cookie') || '');
    if (!cookieHeader) {
      throw new Error('Login succeeded but no session cookie was returned.');
    }

    authHeaders = { Cookie: cookieHeader };
  } else {
    console.log('SMOKE_EMAIL/SMOKE_PASSWORD not set. Protected endpoints may return 401.');
  }

  await expectJson('/api/settings', 200, authHeaders);
  await expectJson('/api/voices', 200, authHeaders);
  await expectJson('/api/calls', 200, authHeaders);
  await expectJson('/api/recordings', 200, authHeaders);
  await expectJson('/api/team-members', 200, authHeaders);

  const badCallRes = await fetch(`${baseUrl}/api/calls`, {
    method: 'POST',
    headers: mergeHeaders({ 'Content-Type': 'application/json' }, authHeaders),
    body: JSON.stringify({ numbers: [] }),
  });

  if (badCallRes.status !== 400) {
    throw new Error(`/api/calls validation expected 400, got ${badCallRes.status}`);
  }

  console.log('Smoke test passed.');
}

run().catch(error => {
  console.error('Smoke test failed:', error.message);
  process.exit(1);
});
