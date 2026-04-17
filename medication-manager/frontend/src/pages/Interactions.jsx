import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, Info, Shield } from 'lucide-react';
import { api } from '../utils/api.js';
import { getSeverityBadge, timeAgo } from '../utils/helpers.js';

export default function Interactions() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const result = await api.getInteractions();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runCheck = async () => {
    setChecking(true);
    setError(null);
    try {
      const result = await api.checkInteractions();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Drug Interactions</h2>
          <p className="text-gray-500 text-lg mt-1">
            AI-powered interaction checker using Claude
          </p>
        </div>
        <button
          onClick={runCheck}
          disabled={checking}
          className="btn-primary flex items-center gap-2 flex-shrink-0"
        >
          <RefreshCw className={`w-5 h-5 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Checking...' : 'Check Now'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : checking ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-2xl font-semibold text-gray-700">Claude AI is checking interactions...</p>
          <p className="text-gray-400 text-lg mt-2">Analyzing your current medications</p>
        </div>
      ) : !data ? (
        <div className="card text-center py-16">
          <Shield className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <p className="text-2xl font-semibold text-gray-600">No interaction data yet</p>
          <p className="text-gray-400 mt-2 mb-6 text-lg">Run a check to see if your medications interact</p>
          <button onClick={runCheck} className="btn-primary">Check for Interactions</button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Status banner */}
          <div className={`card border-2 ${data.safe
            ? 'bg-green-50 border-green-300'
            : 'bg-red-50 border-red-300'}`}>
            <div className="flex items-center gap-4">
              {data.safe
                ? <CheckCircle2 className="w-10 h-10 text-green-600 flex-shrink-0" />
                : <AlertTriangle className="w-10 h-10 text-red-600 flex-shrink-0" />
              }
              <div>
                <p className={`text-xl font-bold ${data.safe ? 'text-green-900' : 'text-red-900'}`}>
                  {data.safe ? 'No Dangerous Interactions Found' : 'Interactions Detected'}
                </p>
                {data.summary && (
                  <p className={`text-lg mt-1 ${data.safe ? 'text-green-700' : 'text-red-700'}`}>
                    {data.summary}
                  </p>
                )}
                {data.checked_at && (
                  <p className="text-base text-gray-500 mt-1">
                    Last checked {timeAgo(data.checked_at)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Interaction cards */}
          {data.interactions && data.interactions.length > 0 ? (
            data.interactions.map((interaction, i) => (
              <InteractionCard key={i} interaction={interaction} />
            ))
          ) : (
            <div className="card text-center py-10">
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-3" />
              <p className="text-xl font-semibold text-gray-700">
                Your current medications have no significant interactions
              </p>
              <p className="text-gray-400 mt-2 text-lg">
                Always consult your pharmacist or doctor with any concerns
              </p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 text-lg">Important Disclaimer</p>
                <p className="text-blue-700 text-base mt-1">
                  This AI-powered tool is for informational purposes only. Always consult your
                  pharmacist, doctor, or other qualified healthcare professional before making any
                  decisions about your medications.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InteractionCard({ interaction }) {
  const severityConfig = {
    major: { bg: 'bg-red-50 border-red-300', headerBg: 'bg-red-100', iconColor: 'text-red-600' },
    moderate: { bg: 'bg-orange-50 border-orange-300', headerBg: 'bg-orange-100', iconColor: 'text-orange-600' },
    minor: { bg: 'bg-yellow-50 border-yellow-300', headerBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
  };

  const cfg = severityConfig[interaction.severity?.toLowerCase()] || severityConfig.minor;

  return (
    <div className={`card border-2 ${cfg.bg}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className={`w-7 h-7 ${cfg.iconColor} flex-shrink-0`} />
          <div>
            <p className="text-xl font-bold text-gray-900">
              {Array.isArray(interaction.medications)
                ? interaction.medications.join(' + ')
                : 'Interaction detected'}
            </p>
          </div>
        </div>
        <span className={getSeverityBadge(interaction.severity)}>
          {interaction.severity?.charAt(0).toUpperCase() + interaction.severity?.slice(1)}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="font-semibold text-gray-700 text-base">What happens:</p>
          <p className="text-gray-600 text-lg">{interaction.description}</p>
        </div>
        {interaction.recommendation && (
          <div className={`p-4 rounded-xl ${cfg.headerBg}`}>
            <p className="font-semibold text-gray-800 text-base mb-1">Recommendation:</p>
            <p className="text-gray-700 text-lg">{interaction.recommendation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
