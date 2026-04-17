import React, { useState } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Pill, ClipboardCheck, AlertTriangle,
  Bell, ScanLine, RefreshCw, Menu, X
} from 'lucide-react';
import Dashboard from './pages/Dashboard.jsx';
import Medications from './pages/Medications.jsx';
import DoseTracker from './pages/DoseTracker.jsx';
import Interactions from './pages/Interactions.jsx';
import Reminders from './pages/Reminders.jsx';
import PrescriptionScanner from './pages/PrescriptionScanner.jsx';
import RefillTracker from './pages/RefillTracker.jsx';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/medications', icon: Pill, label: 'Medications' },
  { to: '/doses', icon: ClipboardCheck, label: 'Dose Tracker' },
  { to: '/interactions', icon: AlertTriangle, label: 'Interactions' },
  { to: '/reminders', icon: Bell, label: 'Reminders' },
  { to: '/scanner', icon: ScanLine, label: 'Rx Scanner' },
  { to: '/refills', icon: RefreshCw, label: 'Refills' },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-72 bg-white border-r-2 border-gray-200
        transform transition-transform duration-300 md:transform-none
        ${menuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col shadow-xl md:shadow-none
      `}>
        <div className="p-6 border-b-2 border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
              <Pill className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">MedManager</h1>
              <p className="text-sm text-gray-500">AI-Powered</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 py-3.5 rounded-xl text-lg font-medium
                transition-colors duration-150
                ${isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              <Icon className="w-6 h-6 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t-2 border-gray-200">
          <p className="text-sm text-gray-400 text-center">
            Powered by Claude AI
          </p>
        </div>
      </aside>

      {/* Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar (mobile) */}
        <header className="md:hidden sticky top-0 z-20 bg-white border-b-2 border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">MedManager</span>
          </div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/medications" element={<Medications />} />
            <Route path="/doses" element={<DoseTracker />} />
            <Route path="/interactions" element={<Interactions />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/scanner" element={<PrescriptionScanner />} />
            <Route path="/refills" element={<RefillTracker />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
