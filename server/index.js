import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export function createApp({ dbFile = process.env.VANK_DB_FILE || path.join(__dirname, 'db.json') } = {}) {
  const DB_FILE = path.resolve(dbFile);
  const app = express();

  app.use(cors());
  app.use(express.json());

  // --- DB helpers ---
  function readDB() {
    if (!fs.existsSync(DB_FILE)) return defaultDB();
    return normalizeDB(JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')));
  }

  function writeDB(data) {
    // A failed read must not turn into an accidental reset on the next save.
    if (fs.existsSync(DB_FILE)) readDB();
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(`${DB_FILE}.tmp`, JSON.stringify(data, null, 2));
    fs.renameSync(`${DB_FILE}.tmp`, DB_FILE);
  }

  function defaultDB() {
    return { userProfile: null, virtualBanks: [], transactions: [], budgets: [], plannerSettings: {}, recurringPlans: [], plannerGoals: [] };
  }

  function normalizeDB(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('State must be an object');
    for (const key of ['virtualBanks', 'transactions', 'budgets', 'recurringPlans', 'plannerGoals']) {
      if (data[key] !== undefined && !Array.isArray(data[key])) throw new Error(`${key} must be an array`);
    }
    for (const key of ['userProfile', 'plannerSettings']) {
      if (data[key] != null && (typeof data[key] !== 'object' || Array.isArray(data[key]))) throw new Error(`${key} must be an object`);
    }
    return { ...defaultDB(), ...data };
  }

  // --- State (full load/save) ---
  app.get('/api/state', (req, res) => res.json(readDB()));

  app.post('/api/state', (req, res) => {
    let data;
    try { data = normalizeDB(req.body); }
    catch (error) { return res.status(400).json({ error: error.message }); }
    writeDB(data);
    res.json({ ok: true });
  });

  // --- Transactions ---
  app.get('/api/transactions', (req, res) => res.json(readDB().transactions));

  app.post('/api/transactions', (req, res) => {
    const db = readDB();
    db.transactions.unshift(req.body);
    writeDB(db);
    res.status(201).json(req.body);
  });

  app.put('/api/transactions/:id', (req, res) => {
    const db = readDB();
    const idx = db.transactions.findIndex(t => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    db.transactions[idx] = { ...db.transactions[idx], ...req.body };
    writeDB(db);
    res.json(db.transactions[idx]);
  });

  app.delete('/api/transactions/:id', (req, res) => {
    const db = readDB();
    db.transactions = db.transactions.filter(t => t.id !== req.params.id);
    writeDB(db);
    res.json({ ok: true });
  });

  // --- Virtual Banks ---
  app.get('/api/banks', (req, res) => res.json(readDB().virtualBanks));

  app.post('/api/banks', (req, res) => {
    const db = readDB();
    db.virtualBanks.push(req.body);
    writeDB(db);
    res.status(201).json(req.body);
  });

  app.put('/api/banks/:id', (req, res) => {
    const db = readDB();
    const idx = db.virtualBanks.findIndex(b => b.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    db.virtualBanks[idx] = { ...db.virtualBanks[idx], ...req.body };
    writeDB(db);
    res.json(db.virtualBanks[idx]);
  });

  app.delete('/api/banks/:id', (req, res) => {
    const db = readDB();
    db.virtualBanks = db.virtualBanks.filter(b => b.id !== req.params.id);
    writeDB(db);
    res.json({ ok: true });
  });

  // --- Budgets ---
  app.get('/api/budgets', (req, res) => res.json(readDB().budgets));

  app.post('/api/budgets', (req, res) => {
    const db = readDB();
    const idx = db.budgets.findIndex(b => b.category.toLowerCase() === req.body.category.toLowerCase());
    if (idx !== -1) { db.budgets[idx] = req.body; }
    else { db.budgets.push(req.body); }
    writeDB(db);
    res.status(201).json(req.body);
  });

  app.delete('/api/budgets/:category', (req, res) => {
    const db = readDB();
    db.budgets = db.budgets.filter(b => b.category.toLowerCase() !== req.params.category.toLowerCase());
    writeDB(db);
    res.json({ ok: true });
  });

  // --- Profile ---
  app.get('/api/profile', (req, res) => res.json(readDB().userProfile));

  app.put('/api/profile', (req, res) => {
    const db = readDB();
    db.userProfile = { ...(db.userProfile || {}), ...req.body };
    writeDB(db);
    res.json(db.userProfile);
  });

  // --- Planner ---
  app.put('/api/planner/settings', (req, res) => {
    const db = readDB();
    db.plannerSettings = { ...(db.plannerSettings || {}), ...req.body };
    writeDB(db);
    res.json(db.plannerSettings);
  });

  app.post('/api/planner/recurring', (req, res) => {
    const db = readDB();
    db.recurringPlans.unshift(req.body);
    writeDB(db);
    res.status(201).json(req.body);
  });

  app.put('/api/planner/recurring/:id', (req, res) => {
    const db = readDB();
    const idx = db.recurringPlans.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    db.recurringPlans[idx] = { ...db.recurringPlans[idx], ...req.body };
    writeDB(db);
    res.json(db.recurringPlans[idx]);
  });

  app.delete('/api/planner/recurring/:id', (req, res) => {
    const db = readDB();
    db.recurringPlans = db.recurringPlans.filter(p => p.id !== req.params.id);
    writeDB(db);
    res.json({ ok: true });
  });

  app.post('/api/planner/goals', (req, res) => {
    const db = readDB();
    db.plannerGoals.unshift(req.body);
    writeDB(db);
    res.status(201).json(req.body);
  });

  app.put('/api/planner/goals/:id', (req, res) => {
    const db = readDB();
    const idx = db.plannerGoals.findIndex(g => g.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    db.plannerGoals[idx] = { ...db.plannerGoals[idx], ...req.body };
    writeDB(db);
    res.json(db.plannerGoals[idx]);
  });

  app.delete('/api/planner/goals/:id', (req, res) => {
    const db = readDB();
    db.plannerGoals = db.plannerGoals.filter(g => g.id !== req.params.id);
    writeDB(db);
    res.json({ ok: true });
  });

  app.use((error, req, res, next) => {
    console.error('API request failed', error.message);
    res.status(error.status || 500).json({ error: 'Unable to process this request' });
  });

  return app;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const PORT = process.env.PORT || 3001;
  createApp().listen(PORT, '127.0.0.1', () => console.log(`Vank API running on http://127.0.0.1:${PORT}`));
}
