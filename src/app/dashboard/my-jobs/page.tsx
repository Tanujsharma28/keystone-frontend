'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface WorkOrder {
  id: number;
  customerName: string;
  siteName: string;
  status: string;
  title: string;
  description: string;
  priority: string;
  slaDueAt: string | null;
}

interface Part {
  id: number;
  name: string;
  sku: string;
  stockQuantity: number;
}

const statusColors: Record<string, string> = {
  ASSIGNED: 'bg-blue-900 text-blue-300',
  IN_PROGRESS: 'bg-yellow-900 text-yellow-300',
  ON_HOLD: 'bg-orange-900 text-orange-300',
  COMPLETED: 'bg-green-900 text-green-300',
  CLOSED: 'bg-gray-800 text-gray-400',
};

const technicianActions: Record<string, { label: string; next: string }[]> = {
  ASSIGNED: [{ label: 'Start Job', next: 'IN_PROGRESS' }],
  IN_PROGRESS: [
    { label: 'Put On Hold', next: 'ON_HOLD' },
    { label: 'Mark Complete', next: 'COMPLETED' },
  ],
  ON_HOLD: [{ label: 'Resume', next: 'IN_PROGRESS' }],
  COMPLETED: [],
  CLOSED: [],
};

export default function MyJobsPage() {
  const [jobs, setJobs] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState('');

  // Current technician ki apni ID chahiye time-log bhejne ke liye
  const [myUserId, setMyUserId] = useState<number | null>(null);

  // Kaunsa job ke liye time/parts panel khula hai
  const [openPanel, setOpenPanel] = useState<{ jobId: number; type: 'time' | 'parts' } | null>(null);

  // Time log form
  const [minutes, setMinutes] = useState('');
  const [timeNote, setTimeNote] = useState('');
  const [logging, setLogging] = useState(false);
  const [logError, setLogError] = useState('');
  const [logSuccess, setLogSuccess] = useState('');

  // Parts form
  const [parts, setParts] = useState<Part[]>([]);
  const [selectedPart, setSelectedPart] = useState('');
  const [qty, setQty] = useState('1');

  useEffect(() => {
    fetchJobs();
    api.get('/api/users/me').then((res) => setMyUserId(res.data.id)).catch(() => {});
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/api/work-orders/my');
      setJobs(res.data);
    } catch (err) {
      setError('Could not load your jobs. Try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (jobId: number, newStatus: string) => {
    setActionError('');
    setUpdatingId(jobId);
    try {
      await api.patch(`/api/work-orders/${jobId}/status?newStatus=${newStatus}`);
      fetchJobs();
    } catch (err) {
      setActionError('Could not update this job.');
    } finally {
      setUpdatingId(null);
    }
  };

  const openTimePanel = (jobId: number) => {
    setOpenPanel({ jobId, type: 'time' });
    setMinutes('');
    setTimeNote('');
    setLogError('');
    setLogSuccess('');
  };

  const openPartsPanel = async (jobId: number) => {
    setOpenPanel({ jobId, type: 'parts' });
    setSelectedPart('');
    setQty('1');
    setLogError('');
    setLogSuccess('');
    if (parts.length === 0) {
      try {
        const res = await api.get('/api/parts');
        setParts(res.data);
      } catch (err) {
        setLogError('Could not load parts list.');
      }
    }
  };

  const handleLogTime = async (jobId: number) => {
    if (!minutes || !myUserId) return;
    setLogError('');
    setLogging(true);
    try {
      // Backend startTime/endTime leta hai, minutes se hi hisaab laga rahe hain
      const start = new Date();
      const end = new Date(start.getTime() + Number(minutes) * 60000);
      await api.post('/api/time-logs', {
        workOrderId: jobId,
        technicianId: myUserId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });
      setLogSuccess('Time logged successfully.');
      setMinutes('');
    } catch (err) {
      setLogError('Could not log time.');
    } finally {
      setLogging(false);
    }
  };

  const handleLogPart = async (jobId: number) => {
    if (!selectedPart || !qty) return;
    setLogError('');
    setLogging(true);
    try {
      await api.post('/api/part-usages', {
        workOrderId: jobId,
        partId: Number(selectedPart),
        quantityUsed: Number(qty),
      });
      setLogSuccess('Part usage recorded.');
      setSelectedPart('');
      setQty('1');
    } catch (err) {
      setLogError('Could not log part — check stock quantity.');
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 sm:p-8">
      <h1 className="text-xl font-bold mb-6">My Jobs</h1>

      {actionError && <p className="text-red-400 text-sm mb-4">{actionError}</p>}
      {loading && <p className="text-gray-400 text-sm">Loading your jobs...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && !error && (
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <p className="text-gray-500 text-sm">No jobs assigned to you right now.</p>
          ) : (
            jobs
              .sort((a, b) => (a.status === 'COMPLETED' || a.status === 'CLOSED' ? 1 : -1))
              .map((job) => {
                const actions = technicianActions[job.status] ?? [];
                const isActive = job.status !== 'CLOSED';
                const panelOpen = openPanel?.jobId === job.id ? openPanel.type : null;

                return (
                  <div
                    key={job.id}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="font-medium text-base">{job.title}</h2>
                      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${statusColors[job.status] ?? 'bg-gray-700'}`}>
                        {job.status}
                      </span>
                    </div>

                    <p className="text-sm text-gray-400 mb-1">
                      {job.customerName} — {job.siteName}
                    </p>
                    <p className="text-sm text-gray-500 mb-3">{job.description}</p>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>Priority: {job.priority}</span>
                      {job.slaDueAt && (
                        <span>Due: {new Date(job.slaDueAt).toLocaleString()}</span>
                      )}
                    </div>

                    <div className="flex gap-2 flex-wrap mb-3">
                      {actions.map((action) => (
                        <button
                          key={action.next}
                          disabled={updatingId === job.id}
                          onClick={() => handleAction(job.id, action.next)}
                          className="text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-3 py-1.5 rounded-lg transition"
                        >
                          {updatingId === job.id ? 'Updating...' : action.label}
                        </button>
                      ))}

                      {isActive && (
                        <>
                          <button
                            onClick={() => (panelOpen === 'time' ? setOpenPanel(null) : openTimePanel(job.id))}
                            className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition"
                          >
                            {panelOpen === 'time' ? 'Cancel' : 'Log Time'}
                          </button>
                          <button
                            onClick={() => (panelOpen === 'parts' ? setOpenPanel(null) : openPartsPanel(job.id))}
                            className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition"
                          >
                            {panelOpen === 'parts' ? 'Cancel' : 'Log Parts'}
                          </button>
                        </>
                      )}
                    </div>

                    {panelOpen === 'time' && (
                      <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 space-y-2">
                        {logError && <p className="text-red-400 text-xs">{logError}</p>}
                        {logSuccess && <p className="text-green-400 text-xs">{logSuccess}</p>}
                        <input
                          type="number"
                          placeholder="Minutes worked"
                          value={minutes}
                          onChange={(e) => setMinutes(e.target.value)}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          onClick={() => handleLogTime(job.id)}
                          disabled={logging || !minutes}
                          className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-3 py-1.5 rounded-lg transition"
                        >
                          {logging ? 'Saving...' : 'Save Time'}
                        </button>
                      </div>
                    )}

                    {panelOpen === 'parts' && (
                      <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 space-y-2">
                        {logError && <p className="text-red-400 text-xs">{logError}</p>}
                        {logSuccess && <p className="text-green-400 text-xs">{logSuccess}</p>}
                        <select
                          value={selectedPart}
                          onChange={(e) => setSelectedPart(e.target.value)}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">Select part</option>
                          {parts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.stockQuantity} in stock)
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          placeholder="Quantity"
                          value={qty}
                          onChange={(e) => setQty(e.target.value)}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          onClick={() => handleLogPart(job.id)}
                          disabled={logging || !selectedPart}
                          className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-3 py-1.5 rounded-lg transition"
                        >
                          {logging ? 'Saving...' : 'Save Part Usage'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      )}
    </div>
  );
}