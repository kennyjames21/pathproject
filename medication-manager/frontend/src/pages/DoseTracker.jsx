import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, MinusCircle, Clock, AlertCircle } from 'lucide-react';
import { api } from '../utils/api.js';
import { formatTime, formatDate } from '../utils/helpers.js';

const TAB_TODAY = 'today';
const TAB_HISTORY = 'history';
const TAB_MISSED = 'missed';

export default function DoseTracker() {
  const [tab, setTab] = useState(TAB_TODAY);
  const [today, setToday] = useState([]);
  const [history, setHistory] = useState([]);
  const [missed, setMissed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [t, h, m] = await Promise.all([
        api.getTodayDoses(),
        api.getDoseHistory({ days: 7 }),
        api.getMissedDoses(),
      ]);
      setToday(t);
      setHistory(h);
      setMissed(m);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.generateSchedule().then(loadData).catch(loadData);
  }, []);

  const markDose = async (dose, status) => {
    setUpdating(dose.id);
    try {
      if (dose.id && !dose.id.toString().startsWith('new')) {
        await api.updateDose(dose.id, { status });
      } else {
        await api.logDose({
          medication_id: dose.medication_id,
          scheduled_time: dose.scheduled_time,
          status,
        });
      }
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(null);
    }
  };

  const tabs = [
    { id: TAB_TODAY, label: "Today's Doses", count: today.length },
    { id: TAB_HISTORY, label: '7-Day History', count: null },
    { id: TAB_MISSED, label: 'Missed', count: missed.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dose Tracker</h2>
        <p className="text-gray-500 text-lg mt-1">Track your medication doses</p>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b-2 border-gray-200 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-lg font-semibold whitespace-nowrap border-b-2 transition-colors -mb-0.5
              ${tab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
          >
            {t.label}
            {t.count !== null && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-sm
                ${tab === t.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {tab === TAB_TODAY && <TodayDoses doses={today} onMark={markDose} updating={updating} />}
          {tab === TAB_HISTORY && <HistoryView doses={history} />}
          {tab === TAB_MISSED && <MissedView doses={missed} />}
        </>
      )}
    </div>
  );
}

function TodayDoses({ doses, onMark, updating }) {
  if (doses.length === 0) {
    return (
      <div className="card text-center py-16">
        <CheckCircle2 className="w-20 h-20 text-green-300 mx-auto mb-4" />
        <p className="text-2xl font-semibold text-gray-600">No doses scheduled today</p>
        <p className="text-gray-400 mt-2 text-lg">Add medications to see your daily schedule</p>
      </div>
    );
  }

  const taken = doses.filter((d) => d.status === 'taken').length;
  const total = doses.length;
  const pct = total > 0 ? Math.round((taken / total) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <p className="text-lg font-semibold text-blue-900">Today's Progress</p>
          <p className="text-2xl font-bold text-blue-700">{taken}/{total}</p>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-4">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-blue-700 font-semibold mt-2">{pct}% adherence today</p>
      </div>

      <div className="space-y-4">
        {doses.map((dose) => (
          <DoseCard key={dose.id} dose={dose} onMark={onMark} loading={updating === dose.id} />
        ))}
      </div>
    </div>
  );
}

function DoseCard({ dose, onMark, loading }) {
  const statusConfig = {
    taken: { bg: 'bg-green-50 border-green-300', icon: <CheckCircle2 className="w-6 h-6 text-green-600" />, text: 'Taken' },
    missed: { bg: 'bg-red-50 border-red-300', icon: <XCircle className="w-6 h-6 text-red-600" />, text: 'Missed' },
    skipped: { bg: 'bg-gray-50 border-gray-300', icon: <MinusCircle className="w-6 h-6 text-gray-500" />, text: 'Skipped' },
    pending: { bg: 'bg-white border-gray-200', icon: <Clock className="w-6 h-6 text-blue-500" />, text: 'Pending' },
  };

  const config = statusConfig[dose.status] || statusConfig.pending;

  return (
    <div className={`card border-2 ${config.bg} transition-all`}>
      <div className="flex items-center gap-4">
        <div className="w-4 h-14 rounded-full flex-shrink-0" style={{ backgroundColor: dose.color }} />
        <div className="flex-1 min-w-0">
          <p className="text-xl font-bold text-gray-900 truncate">{dose.medication_name}</p>
          <p className="text-gray-500 text-lg">{dose.dosage}</p>
          <div className="flex items-center gap-2 mt-1">
            {config.icon}
            <span className="font-semibold text-gray-700">{config.text}</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-500">{formatTime(dose.scheduled_time)}</span>
          </div>
        </div>

        {dose.status === 'pending' && (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onMark(dose, 'taken')}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700
                text-white rounded-xl font-semibold text-lg transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              {loading ? '...' : 'Taken'}
            </button>
            <button
              onClick={() => onMark(dose, 'skipped')}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300
                text-gray-700 rounded-xl font-semibold text-lg transition-colors disabled:opacity-50"
            >
              <MinusCircle className="w-5 h-5" />
              Skip
            </button>
          </div>
        )}

        {dose.status === 'taken' && (
          <button
            onClick={() => onMark(dose, 'pending')}
            disabled={loading}
            className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2 rounded-lg"
          >
            Undo
          </button>
        )}
      </div>
    </div>
  );
}

function HistoryView({ doses }) {
  if (doses.length === 0) {
    return (
      <div className="card text-center py-16">
        <p className="text-xl text-gray-500">No dose history yet</p>
      </div>
    );
  }

  const grouped = doses.reduce((acc, d) => {
    const date = d.scheduled_time.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(d);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, items]) => {
        const taken = items.filter((i) => i.status === 'taken').length;
        return (
          <div key={date} className="card">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-bold text-gray-900">{formatDate(date)}</h4>
              <span className={`px-3 py-1 rounded-full font-semibold text-base
                ${taken === items.length ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                {taken}/{items.length} taken
              </span>
            </div>
            <div className="space-y-3">
              {items.map((dose) => (
                <div key={dose.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
                  <div className="w-3 h-8 rounded-full" style={{ backgroundColor: dose.color }} />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{dose.medication_name}</p>
                    <p className="text-gray-500 text-base">{formatTime(dose.scheduled_time)}</p>
                  </div>
                  <StatusBadge status={dose.status} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MissedView({ doses }) {
  if (doses.length === 0) {
    return (
      <div className="card text-center py-16">
        <CheckCircle2 className="w-20 h-20 text-green-300 mx-auto mb-4" />
        <p className="text-2xl font-semibold text-gray-600">No missed doses in the last 30 days!</p>
        <p className="text-gray-400 mt-2 text-lg">Great job staying on track.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <p className="text-red-800 font-semibold text-lg">
            {doses.length} missed dose{doses.length !== 1 ? 's' : ''} in the last 30 days
          </p>
        </div>
        <p className="text-red-600 mt-1">Contact your doctor if you're having trouble with your medication schedule.</p>
      </div>
      {doses.map((dose) => (
        <div key={dose.id} className="card border-2 border-red-100">
          <div className="flex items-center gap-4">
            <div className="w-3 h-12 rounded-full" style={{ backgroundColor: dose.color }} />
            <div className="flex-1">
              <p className="text-xl font-bold text-gray-900">{dose.medication_name}</p>
              <p className="text-gray-500">{dose.dosage}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-700">{formatDate(dose.scheduled_time)}</p>
              <p className="text-gray-500 text-base">{formatTime(dose.scheduled_time)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = {
    taken: 'bg-green-100 text-green-800',
    missed: 'bg-red-100 text-red-800',
    skipped: 'bg-gray-100 text-gray-700',
    pending: 'bg-blue-100 text-blue-800',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-base font-semibold capitalize ${cfg[status] || cfg.pending}`}>
      {status}
    </span>
  );
}
