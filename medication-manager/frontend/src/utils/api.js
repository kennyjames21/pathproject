const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Dashboard
  getDashboard: () => request('/dashboard'),

  // Medications
  getMedications: () => request('/medications'),
  getMedication: (id) => request(`/medications/${id}`),
  createMedication: (data) => request('/medications', { method: 'POST', body: JSON.stringify(data) }),
  updateMedication: (id, data) => request(`/medications/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMedication: (id) => request(`/medications/${id}`, { method: 'DELETE' }),
  refillMedication: (id) => request(`/medications/${id}/refill`, { method: 'POST' }),

  // Doses
  getTodayDoses: () => request('/doses/today'),
  getDoseHistory: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/doses/history${q ? '?' + q : ''}`);
  },
  getMissedDoses: () => request('/doses/missed'),
  logDose: (data) => request('/doses', { method: 'POST', body: JSON.stringify(data) }),
  updateDose: (id, data) => request(`/doses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  generateSchedule: () => request('/doses/generate-schedule', { method: 'POST' }),

  // Interactions
  getInteractions: () => request('/interactions'),
  checkInteractions: () => request('/interactions/check', { method: 'POST' }),

  // Prescriptions
  parsePrescriptionText: (text) =>
    request('/prescriptions/parse-text', { method: 'POST', body: JSON.stringify({ text }) }),
  parsePrescriptionImage: (formData) =>
    fetch(`${BASE}/prescriptions/parse-image`, { method: 'POST', body: formData })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(err.error || 'Upload failed');
        }
        return res.json();
      }),

  // Reminders
  getReminders: () => request('/reminders'),
  createReminder: (data) => request('/reminders', { method: 'POST', body: JSON.stringify(data) }),
  updateReminder: (id, data) => request(`/reminders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReminder: (id) => request(`/reminders/${id}`, { method: 'DELETE' }),
};
