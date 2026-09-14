'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Site {
  id: number;
  customerId: number;
  name: string;
}

interface WorkOrder {
  id: number;
  siteName: string;
  status: string;
  title: string;
  description: string;
  priority: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  NEW: 'bg-gray-700 text-gray-200',
  ASSIGNED: 'bg-blue-900 text-blue-300',
  IN_PROGRESS: 'bg-yellow-900 text-yellow-300',
  ON_HOLD: 'bg-orange-900 text-orange-300',
  COMPLETED: 'bg-green-900 text-green-300',
  CLOSED: 'bg-gray-800 text-gray-400',
  CANCELLED: 'bg-red-900 text-red-300',
};

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [siteId, setSiteId] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/api/work-orders/customer/my');
      setRequests(res.data);
    } catch (err) {
      setError('Could not load your requests. Try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  // Form kholte hi apne khud ka customerId nikaal ke uski sites load karo
  const openForm = async () => {
    setShowForm(true);
    setFormError('');
    if (sites.length === 0) {
      try {
        const me = await api.get('/api/users/me');
        const customerId = me.data.customerId;
        if (!customerId) {
          setFormError('Your account is not linked to a customer.');
          return;
        }
        const res = await api.get(`/api/sites/customer/${customerId}`);
        setSites(res.data);
      } catch (err) {
        setFormError('Could not load your sites.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!siteId) {
      setFormError('Select a site.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/api/work-orders/customer/request', {
        siteId: Number(siteId),
        title,
        description,
        priority,
      });
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setSiteId('');
      setShowForm(false);
      fetchRequests();
    } catch (err) {
      setFormError('Could not submit request. Check the details and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">My Requests</h1>
        <button
          onClick={() => (showForm ? setShowForm(false) : openForm())}
          className="bg-indigo-600 hover:bg-indigo-500 text-sm px-4 py-2 rounded-lg transition"
        >
          {showForm ? 'Cancel' : '+ New Request'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6 max-w-lg space-y-3"
        >
          {formError && <p className="text-red-400 text-sm">{formError}</p>}

          <div>
            <label className="block text-xs text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. AC not cooling"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              placeholder="Describe the issue..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Site</label>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select site</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-sm px-4 py-2 rounded-lg transition"
          >
            {saving ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      )}

      {loading && <p className="text-gray-400 text-sm">Loading your requests...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && !error && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <p className="text-gray-500 text-sm">You haven't raised any requests yet.</p>
          ) : (
            requests.map((r) => (
              <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="font-medium text-base">{r.title}</h2>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[r.status] ?? 'bg-gray-700'}`}>
                    {r.status}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-1">{r.siteName}</p>
                <p className="text-sm text-gray-500">{r.description}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}