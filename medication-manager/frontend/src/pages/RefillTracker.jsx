import React, { useEffect, useState } from 'react';
import { Package, RefreshCw, AlertTriangle, CheckCircle2, Phone } from 'lucide-react';
import { api } from '../utils/api.js';
import { formatDate, getSupplyColor, getSupplyBg } from '../utils/helpers.js';

export default function RefillTracker() {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refilling, setRefilling] = useState(null);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.getMedications();
      setMeds(data.filter((m) => m.active));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRefill = async (med) => {
    if (med.refills_remaining <= 0) {
      alert(`No refills remaining for ${med.name}. Please contact your doctor for a new prescription.`);
      return;
    }
    if (!confirm(`Mark refill for ${med.name}? This will reset supply to ${med.supply_days} days and use 1 refill.`)) return;

    setRefilling(med.id);
    try {
      await api.refillMedication(med.id);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setRefilling(null);
    }
  };

  const critical = meds.filter((m) => m.supply_remaining <= 3);
  const low = meds.filter((m) => m.supply_remaining > 3 && m.supply_remaining <= 7);
  const ok = meds.filter((m) => m.supply_remaining > 7);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Refill Tracker</h2>
        <p className="text-gray-500 text-lg mt-1">Monitor medication supplies and manage refills</p>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : meds.length === 0 ? (
        <div className="card text-center py-16">
          <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <p className="text-2xl font-semibold text-gray-600">No medications to track</p>
          <p className="text-gray-400 mt-2 text-lg">Add medications to track their refills</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card bg-red-50 border-2 border-red-200 text-center">
              <p className="text-4xl font-bold text-red-600">{critical.length}</p>
              <p className="text-base text-red-700 mt-1 font-semibold">Critical (≤3 days)</p>
            </div>
            <div className="card bg-orange-50 border-2 border-orange-200 text-center">
              <p className="text-4xl font-bold text-orange-600">{low.length}</p>
              <p className="text-base text-orange-700 mt-1 font-semibold">Low (≤7 days)</p>
            </div>
            <div className="card bg-green-50 border-2 border-green-200 text-center">
              <p className="text-4xl font-bold text-green-600">{ok.length}</p>
              <p className="text-base text-green-700 mt-1 font-semibold">Adequate supply</p>
            </div>
          </div>

          {critical.length > 0 && (
            <Section title="Critical — Refill Immediately" icon="🚨" meds={critical}
              onRefill={handleRefill} refilling={refilling} />
          )}

          {low.length > 0 && (
            <Section title="Low Supply — Order Soon" icon="⚠️" meds={low}
              onRefill={handleRefill} refilling={refilling} />
          )}

          {ok.length > 0 && (
            <Section title="Adequate Supply" icon="✅" meds={ok}
              onRefill={handleRefill} refilling={refilling} />
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, meds, onRefill, refilling }) {
  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-4">{icon} {title}</h3>
      <div className="space-y-4">
        {meds.map((med) => (
          <RefillCard key={med.id} med={med} onRefill={onRefill} refilling={refilling === med.id} />
        ))}
      </div>
    </div>
  );
}

function RefillCard({ med, onRefill, refilling }) {
  const pct = Math.round((med.supply_remaining / med.supply_days) * 100);
  const barColor = med.supply_remaining <= 3 ? 'bg-red-500' :
    med.supply_remaining <= 7 ? 'bg-orange-500' : 'bg-green-500';

  return (
    <div className={`card border-2 ${getSupplyBg(med.supply_remaining)}`}>
      <div className="flex items-start gap-4">
        <div className="w-4 h-16 rounded-full flex-shrink-0" style={{ backgroundColor: med.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-xl font-bold text-gray-900">{med.name}</h4>
              <p className="text-gray-500 text-lg">{med.dosage} · {med.frequency}</p>
              {med.pharmacy && (
                <p className="text-gray-400 text-base mt-1">📍 {med.pharmacy}</p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-3xl font-bold ${getSupplyColor(med.supply_remaining)}`}>
                {med.supply_remaining}
              </p>
              <p className="text-sm text-gray-500">days left</p>
            </div>
          </div>

          {/* Supply bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${barColor}`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-400 mt-1">
              <span>0 days</span>
              <span>{med.supply_days} days</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4 text-base">
              <span className={`font-semibold ${med.refills_remaining > 0 ? 'text-green-700' : 'text-red-600'}`}>
                {med.refills_remaining > 0
                  ? `${med.refills_remaining} refill${med.refills_remaining !== 1 ? 's' : ''} remaining`
                  : 'No refills — contact doctor'
                }
              </span>
              {med.last_refill_date && (
                <span className="text-gray-400">Last filled: {formatDate(med.last_refill_date)}</span>
              )}
            </div>

            <button
              onClick={() => onRefill(med)}
              disabled={refilling}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-lg transition-colors
                ${med.refills_remaining > 0
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                } disabled:opacity-50`}
            >
              {refilling
                ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <RefreshCw className="w-5 h-5" />
              }
              {med.refills_remaining > 0 ? 'Mark Refilled' : 'Call Doctor'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
