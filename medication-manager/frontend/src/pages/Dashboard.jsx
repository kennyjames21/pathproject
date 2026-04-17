import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pill, CheckCircle2, AlertCircle, TrendingUp, Clock, Package, ChevronRight } from 'lucide-react';
import { api } from '../utils/api.js';
import { formatTime, formatDateTime, timeAgo, getSupplyColor } from '../utils/helpers.js';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      await api.generateSchedule();
      const dashboard = await api.getDashboard();
      setData(dashboard);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={load} />;

  const { stats, low_supply, recent_activity, next_doses } = data;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Good {getTimeOfDay()}!</h2>
        <p className="text-lg text-gray-500 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Pill className="w-8 h-8 text-blue-600" />}
          label="Active Medications"
          value={stats.total_medications}
          bg="bg-blue-50"
        />
        <StatCard
          icon={<CheckCircle2 className="w-8 h-8 text-green-600" />}
          label="Taken Today"
          value={`${stats.taken_today}/${stats.doses_today}`}
          bg="bg-green-50"
        />
        <StatCard
          icon={<TrendingUp className="w-8 h-8 text-purple-600" />}
          label="Adherence Rate"
          value={`${stats.adherence_rate}%`}
          bg="bg-purple-50"
        />
        <StatCard
          icon={<AlertCircle className="w-8 h-8 text-red-600" />}
          label="Missed (7 days)"
          value={stats.missed_this_week}
          bg="bg-red-50"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Next doses */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600" />
              Next Doses
            </h3>
            <Link to="/doses" className="text-blue-600 hover:underline text-lg font-medium flex items-center gap-1">
              All doses <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
          {next_doses.length === 0 ? (
            <p className="text-gray-500 text-lg py-4 text-center">No upcoming doses scheduled</p>
          ) : (
            <div className="space-y-3">
              {next_doses.map((dose) => (
                <div key={dose.id} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <div
                    className="w-4 h-12 rounded-full flex-shrink-0"
                    style={{ backgroundColor: dose.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-lg truncate">{dose.medication_name}</p>
                    <p className="text-gray-500">{dose.dosage}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-700 text-lg">{formatTime(dose.scheduled_time)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-5">Recent Activity</h3>
          {recent_activity.length === 0 ? (
            <p className="text-gray-500 text-lg py-4 text-center">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recent_activity.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                      ${item.status === 'taken' ? 'bg-green-100' : 'bg-red-100'}`}
                  >
                    {item.status === 'taken'
                      ? <CheckCircle2 className="w-6 h-6 text-green-600" />
                      : <AlertCircle className="w-6 h-6 text-red-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{item.medication_name}</p>
                    <p className="text-gray-500 text-base capitalize">{item.status}</p>
                  </div>
                  <p className="text-gray-400 text-base flex-shrink-0">
                    {timeAgo(item.taken_at || item.scheduled_time)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Low supply alerts */}
      {low_supply.length > 0 && (
        <div className="card border-2 border-orange-300 bg-orange-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-orange-900 flex items-center gap-2">
              <Package className="w-6 h-6" />
              Low Supply Alerts
            </h3>
            <Link to="/refills" className="text-orange-700 hover:underline font-semibold">
              Manage Refills →
            </Link>
          </div>
          <div className="space-y-3">
            {low_supply.map((med) => (
              <div key={med.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-10 rounded-full" style={{ backgroundColor: med.color }} />
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">{med.name}</p>
                    <p className="text-gray-500">{med.dosage}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${getSupplyColor(med.supply_remaining)}`}>
                    {med.supply_remaining} days
                  </p>
                  <p className="text-sm text-gray-500">remaining</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, bg }) {
  return (
    <div className={`card ${bg}`}>
      <div className="flex items-start justify-between">
        <div>{icon}</div>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-base text-gray-600 mt-1">{label}</p>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-4">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-xl text-gray-600">Loading your dashboard...</p>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="card text-center py-12">
      <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <p className="text-xl text-gray-900 font-semibold mb-2">Failed to load dashboard</p>
      <p className="text-gray-500 mb-6">{error}</p>
      <button onClick={onRetry} className="btn-primary">Try Again</button>
    </div>
  );
}
