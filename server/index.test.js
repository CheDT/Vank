// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from './index.js';
import { seededState, transaction } from '../tests/helpers/fixtures.js';

let directory, dbFile, baseURL;
const servers = [];
async function start() {
  const server = createApp({ dbFile }).listen(0, '127.0.0.1');
  servers.push(server);
  await new Promise(resolve => server.once('listening', resolve));
  return `http://127.0.0.1:${server.address().port}/api`;
}
async function request(method, route, body) {
  return fetch(`${baseURL}${route}`, {
    method, headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined
  });
}
async function readState() { return (await request('GET', '/state')).json(); }

beforeEach(async () => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vank-api-test-'));
  dbFile = path.join(directory, 'db.json');
  baseURL = await start();
});
afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))));
  if (path.dirname(directory) !== path.resolve(os.tmpdir()) || !path.basename(directory).startsWith('vank-api-test-')) throw new Error('Unexpected test directory');
  fs.rmSync(directory, { recursive: true, force: true });
});

describe('Real API and file persistence', () => {
  it('returns a clean state for a missing database', async () => {
    expect(await readState()).toMatchObject({ userProfile: null, transactions: [], recurringPlans: [], plannerGoals: [] });
    expect(fs.existsSync(dbFile)).toBe(false);
  });

  it('persists a full state across a new server instance', async () => {
    const saved = seededState();
    saved.transactions = [transaction()];
    expect((await request('POST', '/state', saved)).ok).toBe(true);
    baseURL = await start();
    expect(await readState()).toEqual(saved);
    expect(JSON.parse(fs.readFileSync(dbFile, 'utf8'))).toEqual(saved);
  });

  it.each([
    ['transactions', 'transactions', transaction(), { amount: 250 }],
    ['banks', 'virtualBanks', seededState().virtualBanks[0], { name: 'Updated bank' }],
    ['planner/recurring', 'recurringPlans', { id: 'plan-test', name: 'Internet', amount: 1500 }, { active: false }],
    ['planner/goals', 'plannerGoals', { id: 'goal-test', name: 'Laptop', targetAmount: 10000 }, { currentAmount: 500 }]
  ])('creates, updates and deletes %s', async (route, key, item, update) => {
    expect((await request('POST', `/${route}`, item)).status).toBe(201);
    expect((await request('PUT', `/${route}/${item.id}`, update)).ok).toBe(true);
    expect((await readState())[key][0]).toMatchObject({ ...item, ...update });
    expect((await request('PUT', `/${route}/missing`, update)).status).toBe(404);
    expect((await request('DELETE', `/${route}/${item.id}`)).ok).toBe(true);
    expect((await readState())[key]).toEqual([]);
  });

  it('upserts budgets by category and deletes encoded category names', async () => {
    await request('POST', '/budgets', { category: 'Meals / Travel', limit: 1000 });
    await request('POST', '/budgets', { category: 'meals / travel', limit: 2000 });
    expect((await readState()).budgets).toEqual([{ category: 'meals / travel', limit: 2000 }]);
    await request('DELETE', '/budgets/Meals%20%2F%20Travel');
    expect((await readState()).budgets).toEqual([]);
  });

  it('merges profile and planner settings updates', async () => {
    await request('PUT', '/profile', { name: 'User', currencyCode: 'PHP' });
    await request('PUT', '/profile', { name: 'Updated' });
    await request('PUT', '/planner/settings', { savingsTarget: 10000 });
    await request('PUT', '/planner/settings', { alertThreshold: 90 });
    expect((await request('GET', '/profile')).ok).toBe(true);
    expect(await readState()).toMatchObject({
      userProfile: { name: 'Updated', currencyCode: 'PHP' },
      plannerSettings: { savingsTarget: 10000, alertThreshold: 90 }
    });
  });

  it('rejects malformed state without replacing existing data', async () => {
    await request('POST', '/state', seededState());
    expect((await request('POST', '/state', { transactions: 'invalid' })).status).toBe(400);
    expect((await readState()).userProfile.name).toBe('Test User');
  });

  it('reports a corrupt database instead of silently overwriting it', async () => {
    fs.writeFileSync(dbFile, '{broken JSON');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await request('GET', '/state')).status).toBe(500);
    expect((await request('POST', '/transactions', transaction())).status).toBe(500);
    expect((await request('POST', '/state', seededState())).status).toBe(500);
    expect(fs.readFileSync(dbFile, 'utf8')).toBe('{broken JSON');
  });
});
