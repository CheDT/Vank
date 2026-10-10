const BASE = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(5000)
  });
  if (!res.ok) throw new Error(`API ${method} ${path} failed: ${res.status}`);
  return res.json();
}

export const api = {
  // Full state sync
  loadState: ()           => req('GET',    '/state'),
  saveState: (data)       => req('POST',   '/state', data),

  // Transactions
  addTransaction:    (tx) => req('POST',   '/transactions', tx),
  updateTransaction: (id, data) => req('PUT', `/transactions/${id}`, data),
  deleteTransaction: (id) => req('DELETE', `/transactions/${id}`),

  // Banks
  addBank:    (bank)      => req('POST',   '/banks', bank),
  updateBank: (id, data)  => req('PUT',    `/banks/${id}`, data),
  deleteBank: (id)        => req('DELETE', `/banks/${id}`),

  // Budgets
  setBudget:    (b)       => req('POST',   '/budgets', b),
  deleteBudget: (cat)     => req('DELETE', `/budgets/${encodeURIComponent(cat)}`),

  // Profile
  updateProfile: (data)   => req('PUT',    '/profile', data),

  // Planner
  setPlannerSettings:    (data) => req('PUT',    '/planner/settings', data),
  addRecurringPlan:      (p)    => req('POST',   '/planner/recurring', p),
  updateRecurringPlan:   (id, data) => req('PUT', `/planner/recurring/${id}`, data),
  deleteRecurringPlan:   (id)   => req('DELETE', `/planner/recurring/${id}`),
  addPlannerGoal:        (g)    => req('POST',   '/planner/goals', g),
  updatePlannerGoal:     (id, data) => req('PUT', `/planner/goals/${id}`, data),
  deletePlannerGoal:     (id)   => req('DELETE', `/planner/goals/${id}`)
};
