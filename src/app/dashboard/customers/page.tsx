'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

interface Site {
  id: number;
  customerId: number;
  customerName: string;
  name: string;
  address: string;
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState<string | null>(null);

  // Add Customer form
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Expanded row + sites ke liye state
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [showSiteForm, setShowSiteForm] = useState(false);
  const [siteName, setSiteName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [siteSaving, setSiteSaving] = useState(false);
  const [siteError, setSiteError] = useState('');

  useEffect(() => {
    setRole(localStorage.getItem('role'));
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/api/customers');
      setCustomers(res.data);
    } catch (err) {
      setError('Could not load customers. Try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await api.post('/api/customers', { name, email, phone });
      setName('');
      setEmail('');
      setPhone('');
      setShowForm(false);
      fetchCustomers();
    } catch (err) {
      setFormError('Could not save customer. Check the details and try again.');
    } finally {
      setSaving(false);
    }
  };

  // Customer row pe click — sites load karo, ya agar already khula hai toh band kar do
  const toggleCustomer = async (customerId: number) => {
    if (expandedId === customerId) {
      setExpandedId(null);
      setShowSiteForm(false);
      return;
    }
    setExpandedId(customerId);
    setShowSiteForm(false);
    setSitesLoading(true);
    try {
      const res = await api.get(`/api/sites/customer/${customerId}`);
      setSites(res.data);
    } catch (err) {
      setSites([]);
    } finally {
      setSitesLoading(false);
    }
  };

  const handleAddSite = async (e: React.FormEvent, customerId: number) => {
    e.preventDefault();
    setSiteError('');
    setSiteSaving(true);
    try {
      await api.post('/api/sites', {
        customerId,
        name: siteName,
        address: siteAddress,
      });
      setSiteName('');
      setSiteAddress('');
      setShowSiteForm(false);
      // Sites list dobara load karo isi customer ke liye
      const res = await api.get(`/api/sites/customer/${customerId}`);
      setSites(res.data);
    } catch (err) {
      setSiteError('Could not save site. Check the details and try again.');
    } finally {
      setSiteSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Customers</h1>
        {role === 'MANAGER' && (
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="bg-indigo-600 hover:bg-indigo-500 text-sm px-4 py-2 rounded-lg transition"
          >
            {showForm ? 'Cancel' : '+ Add Customer'}
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleAddCustomer}
          className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6 max-w-md space-y-3"
        >
          {formError && <p className="text-red-400 text-sm">{formError}</p>}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-sm px-4 py-2 rounded-lg transition"
          >
            {saving ? 'Saving...' : 'Save Customer'}
          </button>
        </form>
      )}

      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-sm mb-6 focus:outline-none focus:border-indigo-500"
      />

      {loading && <p className="text-gray-400 text-sm">Loading customers...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && !error && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-400 text-left">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <React.Fragment key={c.id}>
                    <tr
                      onClick={() => toggleCustomer(c.id)}
                      className="border-t border-gray-800 hover:bg-gray-800/50 cursor-pointer"
                    >
                      <td className="px-4 py-3">{c.name}</td>
                      <td className="px-4 py-3 text-gray-400">{c.email}</td>
                      <td className="px-4 py-3 text-gray-400">{c.phone}</td>
                    </tr>

                    {expandedId === c.id && (
                      <tr className="border-t border-gray-800 bg-gray-950/50">
                        <td colSpan={3} className="px-4 py-4">
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-medium text-gray-300">Sites</h3>
                            {role === 'MANAGER' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowSiteForm((prev) => !prev);
                                }}
                                className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition"
                              >
                                {showSiteForm ? 'Cancel' : '+ Add Site'}
                              </button>
                            )}
                          </div>

                          {showSiteForm && (
                            <form
                              onClick={(e) => e.stopPropagation()}
                              onSubmit={(e) => handleAddSite(e, c.id)}
                              className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-3 max-w-sm space-y-2"
                            >
                              {siteError && <p className="text-red-400 text-xs">{siteError}</p>}
                              <input
                                type="text"
                                placeholder="Site name"
                                value={siteName}
                                onChange={(e) => setSiteName(e.target.value)}
                                required
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                              />
                              <input
                                type="text"
                                placeholder="Address"
                                value={siteAddress}
                                onChange={(e) => setSiteAddress(e.target.value)}
                                required
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                              />
                              <button
                                type="submit"
                                disabled={siteSaving}
                                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-xs px-3 py-1.5 rounded-lg transition"
                              >
                                {siteSaving ? 'Saving...' : 'Save Site'}
                              </button>
                            </form>
                          )}

                          {sitesLoading ? (
                            <p className="text-xs text-gray-500">Loading sites...</p>
                          ) : sites.length === 0 ? (
                            <p className="text-xs text-gray-500">No sites yet for this customer.</p>
                          ) : (
                            <ul className="space-y-1">
                              {sites.map((s) => (
                                <li key={s.id} className="text-xs text-gray-400">
                                  <span className="text-white">{s.name}</span> — {s.address}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}