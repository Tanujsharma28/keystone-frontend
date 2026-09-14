'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface TechnicianLoad {
  technicianName: string;
  activeJobCount: number;
}

interface ReportSummary {
  statusCounts: Record<string, number>;
  overdueCount: number;
  slaCompliancePercent: number;
  byTechnician: TechnicianLoad[];
}

const statusColors: Record<string, string> = {
  NEW: 'bg-gray-700',
  ASSIGNED: 'bg-blue-700',
  IN_PROGRESS: 'bg-yellow-700',
  ON_HOLD: 'bg-orange-700',
  COMPLETED: 'bg-green-700',
  CLOSED: 'bg-gray-600',
  CANCELLED: 'bg-red-700',
};

// Sabhi possible statuses fixed order mein rakhte hain, taaki chart har baar
// same order mein dikhe chahe backend jis order mein data de
const STATUS_ORDER = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED', 'CANCELLED'];

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/api/reports/summary');
      setSummary(res.data);
    } catch (err) {
      setError('Could not load report data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        Loading dashboard...
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-red-400">
        {error || 'No data available.'}
      </div>
    );
  }

  const totalWorkOrders = Object.values(summary.statusCounts).reduce((a, b) => a + b, 0);
  const maxCount = Math.max(...Object.values(summary.statusCounts), 1);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-xl font-bold mb-6">Reports</h1>

      {/* Top summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">Total Work Orders</p>
          <p className="text-3xl font-bold">{totalWorkOrders}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">Overdue</p>
          <p className={`text-3xl font-bold ${summary.overdueCount > 0 ? 'text-red-400' : 'text-white'}`}>
            {summary.overdueCount}
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">SLA Compliance</p>
          <p className="text-3xl font-bold text-green-400">
            {summary.slaCompliancePercent.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Status breakdown — simple bar chart, CSS se banaya hai */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8">
        <h2 className="text-sm font-medium text-gray-300 mb-4">Work Orders by Status</h2>
        {totalWorkOrders === 0 ? (
          <p className="text-gray-500 text-sm">No work orders yet.</p>
        ) : (
          <div className="space-y-3">
            {STATUS_ORDER.filter((s) => summary.statusCounts[s]).map((status) => {
              const count = summary.statusCounts[status] ?? 0;
              const widthPercent = (count / maxCount) * 100;
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-28">{status}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-5 overflow-hidden">
                    <div
                      className={`h-full ${statusColors[status] ?? 'bg-gray-600'} flex items-center justify-end px-2`}
                      style={{ width: `${widthPercent}%` }}
                    >
                      <span className="text-xs text-white">{count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Technician breakdown */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-medium text-gray-300 mb-4">Active Jobs by Technician</h2>
        {summary.byTechnician.length === 0 ? (
          <p className="text-gray-500 text-sm">No technicians have active jobs right now.</p>
        ) : (
          <div className="space-y-2">
            {summary.byTechnician.map((t) => (
              <div key={t.technicianName} className="flex justify-between text-sm">
                <span className="text-gray-300">{t.technicianName}</span>
                <span className="text-gray-400">{t.activeJobCount} active job(s)</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}