import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, 'db.json');
const app = express();

app.use(cors());
app.use(express.json());

// --- DB helpers ---
function readDB() {
  if (!fs.existsSync(DB_FILE)) return defaultDB();
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')); }
  catch { return defaultDB(); }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function defaultDB() {
  return { userProfile: null, virtualBanks: [], transactions: [], budgets: [], plannerSettings: {}, recurringPlans: [], plannerGoals: [] };
}

// --- State (full load/save) ---
app.get('/api/state', (req, res) => res.json(readDB()));

app.post('/api/state', (req, res) => {
  writeDB(req.body);
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Vank API running on http://localhost:${PORT}`));
