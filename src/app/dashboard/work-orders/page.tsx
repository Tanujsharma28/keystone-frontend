'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Customer {
  id: number;
  name: string;
}

interface Site {
  id: number;
  customerId: number;
  name: string;
}

interface Technician {
  id: number;
  fullName: string;
  email: string;
}

interface WorkOrder {
  id: number;
  customerId: number;
  customerName: string;
  siteId: number;
  siteName: string;
  assignedTechnicianId: number | null;
  assignedTechnicianName: string | null;
  status: string;
  title: string;
  description: string;
  priority: string;
  slaDueAt: string | null;
  slaBreached: boolean;
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

const nextStatusOptions: Record<string, string[]> = {
  NEW: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['ON_HOLD', 'COMPLETED'],
  ON_HOLD: ['IN_PROGRESS'],
  COMPLETED: ['CLOSED'],
  CLOSED: [],
  CANCELLED: [],
};

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [customerId, setCustomerId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [statusError, setStatusError] = useState('');

  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [selectedTechnician, setSelectedTechnician] = useState('');

  useEffect(() => {
    setRole(localStorage.getItem('role'));
    fetchWorkOrders();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      const res = await api.get('/api/work-orders');
      setWorkOrders(res.data);
    } catch (err) {
      setError('Could not load work orders. Try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  const openForm = async () => {
    setShowForm(true);
    if (customers.length === 0) {
      try {
        const res = await api.get('/api/customers');
        setCustomers(res.data);
      } catch (err) {
        setFormError('Could not load customers for the form.');
      }
    }
  };

  const handleCustomerChange = async (id: string) => {
    setCustomerId(id);
    setSiteId('');
    if (!id) {
      setSites([]);
      return;
    }
    try {
      const res = await api.get(`/api/sites/customer/${id}`);
      setSites(res.data);
    } catch (err) {
      setSites([]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerId || !siteId) {
      setFormError('Select a customer and a site.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/api/work-orders', {
        customerId: Number(customerId),
        siteId: Number(siteId),
        title,
        description,
        priority,
      });
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setCustomerId('');
      setSiteId('');
      setShowForm(false);
      fetchWorkOrders();
    } catch (err) {
      setFormError('Could not create work order. Check the details and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (workOrderId: number, newStatus: string) => {
    setStatusError('');
    setUpdatingId(workOrderId);
    try {
      await api.patch(`/api/work-orders/${workOrderId}/status?newStatus=${newStatus}`);
      fetchWorkOrders();
    } catch (err) {
      setStatusError('Could not update status. This transition may not be allowed for your role.');
    } finally {
      setUpdatingId(null);
    }
  };

  const openAssign = async (workOrderId: number) => {
    setAssigningId(workOrderId);
    setSelectedTechnician('');
    if (technicians.length === 0) {
      try {
        const res = await api.get('/api/users/technicians');
        setTechnicians(res.data);
      } catch (err) {
        setStatusError('Could not load technicians.');
      }
    }
  };

  const handleAssign = async (workOrderId: number) => {
    if (!selectedTechnician) return;
    setStatusError('');
    setUpdatingId(workOrderId);
    try {
      await api.patch(`/api/work-orders/${workOrderId}/assign?technicianId=${selectedTechnician}`);
      setAssigningId(null);
      fetchWorkOrders();
    } catch (err) {
      setStatusError('Could not assign technician.');
    } finally {
      setUpdatingId(null);
    }
  };

  const canCreate = role === 'MANAGER' || role === 'DISPATCHER';
  const canAssign = role === 'MANAGER' || role === 'DISPATCHER';

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Work Orders</h1>
        {canCreate && (
          <button
            onClick={() => (showForm ? setShowForm(false) : openForm())}
            className="bg-indigo-600 hover:bg-indigo-500 text-sm px-4 py-2 rounded-lg transition"
          >
            {showForm ? 'Cancel' : '+ New Work Order'}
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
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
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Customer</label>
              <select
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Site</label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                required
                disabled={!customerId}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              >
                <option value="">Select site</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
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
            {saving ? 'Creating...' : 'Create Work Order'}
          </button>
        </form>
      )}

      {statusError && <p className="text-red-400 text-sm mb-4">{statusError}</p>}
      {loading && <p className="text-gray-400 text-sm">Loading work orders...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && !error && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-400 text-left">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Customer / Site</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Technician</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    No work orders yet.
                  </td>
                </tr>
              ) : (
                workOrders.map((wo) => {
                  const options = nextStatusOptions[wo.status] ?? [];
                  const isAssigning = assigningId === wo.id;
                  return (
                    <React.Fragment key={wo.id}>
                      <tr className="border-t border-gray-800 hover:bg-gray-800/50">
                        <td className="px-4 py-3">{wo.title}</td>
                        <td className="px-4 py-3 text-gray-400">
                          {wo.customerName} — {wo.siteName}
                        </td>
                        <td className="px-4 py-3 text-gray-400">{wo.priority}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[wo.status] ?? 'bg-gray-700'}`}>
                            {wo.status}
                          </span>
                          {wo.slaBreached && (
                            <span className="ml-2 text-xs px-2 py-1 rounded-full bg-red-950 text-red-400 border border-red-800">
                              SLA BREACHED
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {wo.assignedTechnicianName ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 flex-wrap">
                            {canAssign && !wo.assignedTechnicianName && (
                              <button
                                onClick={() => (isAssigning ? setAssigningId(null) : openAssign(wo.id))}
                                className="text-xs bg-indigo-800 hover:bg-indigo-700 px-2 py-1 rounded-lg transition"
                              >
                                {isAssigning ? 'Cancel' : 'Assign'}
                              </button>
                            )}
                            {options.length === 0 ? (
                              options.length === 0 && !canAssign ? (
                                <span className="text-xs text-gray-600">No actions</span>
                              ) : null
                            ) : (
                              options.map((next) => (
                                <button
                                  key={next}
                                  disabled={updatingId === wo.id}
                                  onClick={() => handleStatusChange(wo.id, next)}
                                  className="text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-50 px-2 py-1 rounded-lg transition"
                                >
                                  {updatingId === wo.id ? '...' : `→ ${next}`}
                                </button>
                              ))
                            )}
                          </div>
                        </td>
                      </tr>

                      {isAssigning && (
                        <tr className="border-t border-gray-800 bg-gray-950/50">
                          <td colSpan={6} className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <select
                                value={selectedTechnician}
                                onChange={(e) => setSelectedTechnician(e.target.value)}
                                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                              >
                                <option value="">Select technician</option>
                                {technicians.map((t) => (
                                  <option key={t.id} value={t.id}>{t.fullName}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleAssign(wo.id)}
                                disabled={!selectedTechnician || updatingId === wo.id}
                                className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-3 py-1.5 rounded-lg transition"
                              >
                                Confirm
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}