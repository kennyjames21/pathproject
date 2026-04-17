import React, { useEffect, useState } from 'react';
import { Bell, Plus, Trash2, X, Clock } from 'lucide-react';
import { api } from '../utils/api.js';

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ medication_id: '', time: '08:00', days: 'daily' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const [r, m] = await Promise.all([api.getReminders(), api.getMedications()]);
      setReminders(r);
      setMeds(m);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createReminder(form);
      setShowForm(false);
      setForm({ medication_id: '', time: '08:00', days: 'daily' });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this reminder?')) return;
    try {
      await api.deleteReminder(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleActive = async (r) => {
    try {
      await api.updateReminder(r.id, { active: r.active ? 0 : 1 });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatTime12 = (time24) => {
    const [h, m] = time24.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Reminders</h2>
          <p className="text-gray-500 text-lg mt-1">Manage your medication reminders</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Reminder
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex justify-between items-center">
          <p className="text-red-800 font-medium">{error}</p>
          <button onClick={() => setError(null)}><X className="w-5 h-5 text-red-600" /></button>
        </div>
      )}

      {/* Browser notification notice */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Bell className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900 text-lg">Reminder System</p>
            <p className="text-blue-700 text-base mt-1">
              Reminders are stored in your schedule. Your daily dose schedule is automatically
              generated each morning. For device notifications, keep MedManager open in your browser.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reminders.length === 0 ? (
        <div className="card text-center py-16">
          <Bell className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <p className="text-2xl font-semibold text-gray-600 mb-2">No reminders set</p>
          <p className="text-gray-400 mb-6 text-lg">Add reminders for your medications</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">Add First Reminder</button>
        </div>
      ) : (
        <div className="space-y-4">
          {reminders.map((r) => (
            <div key={r.id} className={`card border-2 transition-all
              ${r.active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: r.color + '30', border: `2px solid ${r.color}` }}
                >
                  <Clock className="w-7 h-7" style={{ color: r.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-bold text-gray-900 truncate">{r.medication_name}</p>
                  <p className="text-gray-500">{r.dosage}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-lg font-semibold text-blue-700">{formatTime12(r.time)}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-500 capitalize">{r.days}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleActive(r)}
                    className={`relative w-14 h-7 rounded-full transition-colors
                      ${r.active ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform
                      ${r.active ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b-2 border-gray-200 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">Add Reminder</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="label">Medication *</label>
                <select
                  className="input-field"
                  value={form.medication_id}
                  onChange={(e) => setForm((f) => ({ ...f, medication_id: e.target.value }))}
                  required
                >
                  <option value="">Select medication...</option>
                  {meds.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} {m.dosage}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Reminder Time *</label>
                <input
                  type="time"
                  className="input-field"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="label">Frequency</label>
                <select
                  className="input-field"
                  value={form.days}
                  onChange={(e) => setForm((f) => ({ ...f, days: e.target.value }))}
                >
                  <option value="daily">Every day</option>
                  <option value="weekdays">Weekdays only</option>
                  <option value="weekends">Weekends only</option>
                  <option value="monday,wednesday,friday">Mon, Wed, Fri</option>
                </select>
              </div>

              <div className="flex gap-4 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : 'Add Reminder'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
