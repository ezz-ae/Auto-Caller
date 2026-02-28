#!/usr/bin/env node

const baseUrl = process.env.APP_URL || 'http://localhost:3000';

async function expectJson(pathname, expectedStatus = 200) {
  const res = await fetch(`${baseUrl}${pathname}`);
  const contentType = res.headers.get('content-type') || '';

  if (res.status !== expectedStatus) {
    throw new Error(`${pathname} returned ${res.status}, expected ${expectedStatus}`);
  }

  if (!contentType.includes('application/json')) {
    throw new Error(`${pathname} did not return JSON`);
  }

  return res.json();
}

async function run() {
  console.log(`Running smoke test against ${baseUrl}`);

  await expectJson('/api/settings');
  await expectJson('/api/voices');
  await expectJson('/api/calls');
  await expectJson('/api/recordings');
  await expectJson('/api/team-members');

  const badCallRes = await fetch(`${baseUrl}/api/calls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
