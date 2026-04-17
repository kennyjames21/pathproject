import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Pill, Calendar, Clock, X, Check } from 'lucide-react';
import { api } from '../utils/api.js';
import { formatDate, MED_COLORS } from '../utils/helpers.js';

const EMPTY_FORM = {
  name: '', dosage: '', frequency: '', start_date: '',
  end_date: '', instructions: '', prescriber: '', pharmacy: '',
  refills_remaining: 0, supply_days: 30, supply_remaining: 30,
  color: MED_COLORS[0], active: 1,
};

export default function Medications() {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMed, setEditMed] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.getMedications();
      setMeds(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditMed(null);
    setForm({ ...EMPTY_FORM, start_date: new Date().toISOString().split('T')[0] });
    setShowForm(true);
  };

  const openEdit = (med) => {
    setEditMed(med);
    setForm({
      name: med.name, dosage: med.dosage, frequency: med.frequency,
      start_date: med.start_date, end_date: med.end_date || '',
      instructions: med.instructions || '', prescriber: med.prescriber || '',
      pharmacy: med.pharmacy || '', refills_remaining: med.refills_remaining,
      supply_days: med.supply_days, supply_remaining: med.supply_remaining,
      color: med.color, active: med.active,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editMed) {
        await api.updateMedication(editMed.id, form);
      } else {
        await api.createMedication(form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove ${name} from your medications?`)) return;
    try {
      await api.deleteMedication(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">My Medications</h2>
          <p className="text-gray-500 text-lg mt-1">{meds.length} medication{meds.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Medication
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-center justify-between">
          <p className="text-red-800 font-medium">{error}</p>
          <button onClick={() => setError(null)}><X className="w-5 h-5 text-red-600" /></button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : meds.length === 0 ? (
        <div className="card text-center py-16">
          <Pill className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <p className="text-2xl font-semibold text-gray-600 mb-2">No medications yet</p>
          <p className="text-gray-400 mb-6 text-lg">Add your first medication to get started</p>
          <button onClick={openAdd} className="btn-primary">Add Medication</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {meds.map((med) => (
            <MedCard key={med.id} med={med} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b-2 border-gray-200 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">
                {editMed ? 'Edit Medication' : 'Add New Medication'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="label">Medication Name *</label>
                  <input
                    className="input-field"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="e.g. Lisinopril"
                    required
                  />
                </div>
                <div>
                  <label className="label">Dosage *</label>
                  <input
                    className="input-field"
                    value={form.dosage}
                    onChange={(e) => set('dosage', e.target.value)}
                    placeholder="e.g. 10mg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Frequency *</label>
                <select
                  className="input-field"
                  value={form.frequency}
                  onChange={(e) => set('frequency', e.target.value)}
                  required
                >
                  <option value="">Select frequency...</option>
                  <option value="Once daily">Once daily</option>
                  <option value="Twice daily">Twice daily (BID)</option>
                  <option value="Three times daily">Three times daily (TID)</option>
                  <option value="Four times daily">Four times daily (QID)</option>
                  <option value="Every 8 hours">Every 8 hours</option>
                  <option value="Every 12 hours">Every 12 hours</option>
                  <option value="At bedtime">At bedtime</option>
                  <option value="As needed">As needed (PRN)</option>
                  <option value="Once weekly">Once weekly</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="label">Start Date *</label>
                  <input
                    type="date"
                    className="input-field"
                    value={form.start_date}
                    onChange={(e) => set('start_date', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">End Date (optional)</label>
                  <input
                    type="date"
                    className="input-field"
                    value={form.end_date}
                    onChange={(e) => set('end_date', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Special Instructions</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={form.instructions}
                  onChange={(e) => set('instructions', e.target.value)}
                  placeholder="e.g. Take with food, avoid grapefruit..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="label">Prescribing Doctor</label>
                  <input
                    className="input-field"
                    value={form.prescriber}
                    onChange={(e) => set('prescriber', e.target.value)}
                    placeholder="Dr. Smith"
                  />
                </div>
                <div>
                  <label className="label">Pharmacy</label>
                  <input
                    className="input-field"
                    value={form.pharmacy}
                    onChange={(e) => set('pharmacy', e.target.value)}
                    placeholder="CVS, Walgreens..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Refills Left</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    value={form.refills_remaining}
                    onChange={(e) => set('refills_remaining', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="label">Days Supply</label>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    value={form.supply_days}
                    onChange={(e) => set('supply_days', parseInt(e.target.value) || 30)}
                  />
                </div>
                <div>
                  <label className="label">Days Remaining</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    value={form.supply_remaining}
                    onChange={(e) => set('supply_remaining', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Color Code</label>
                <div className="flex gap-3 flex-wrap">
                  {MED_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set('color', c)}
                      className={`w-10 h-10 rounded-full border-4 transition-transform
                        ${form.color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : editMed ? 'Save Changes' : 'Add Medication'}
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

function MedCard({ med, onEdit, onDelete }) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-4 h-12 rounded-full" style={{ backgroundColor: med.color }} />
          <div>
            <h4 className="text-xl font-bold text-gray-900">{med.name}</h4>
            <p className="text-gray-500 text-lg">{med.dosage}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(med)}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(med.id, med.name)}
            className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-base">
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4 text-blue-500" />
          <span>{med.frequency}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4 text-green-500" />
          <span>Since {formatDate(med.start_date)}</span>
        </div>
        {med.prescriber && (
          <p className="text-gray-500">Dr. {med.prescriber}</p>
        )}
        {med.instructions && (
          <p className="text-gray-500 italic text-sm">{med.instructions}</p>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">Supply remaining</p>
          <p className={`text-xl font-bold ${
            med.supply_remaining <= 3 ? 'text-red-600' :
            med.supply_remaining <= 7 ? 'text-orange-500' : 'text-green-600'
          }`}>
            {med.supply_remaining} days
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Refills left</p>
          <p className="text-xl font-bold text-gray-700">{med.refills_remaining}</p>
        </div>
      </div>
    </div>
  );
}
