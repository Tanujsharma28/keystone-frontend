'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Har role ke liye alag menu items — jaisa brief ke Section 03 mein likha hai
const roleMenus: Record<string, string[]> = {
  MANAGER: ['Overview', 'Work Orders', 'Customers & Sites', 'Parts', 'Reports'],
  DISPATCHER: ['Overview', 'Work Orders', 'Customers & Sites'],
  TECHNICIAN: ['My Jobs'],
  CUSTOMER: ['My Requests'],
};

// Har menu item ka apna route — jaise-jaise naye pages banenge, yahan add hote jayenge
const menuRoutes: Record<string, string> = {
  'Overview': '/dashboard',
  'Work Orders': '/dashboard/work-orders',
  'Customers & Sites': '/dashboard/customers',
  'Parts': '/dashboard/parts',
  'Reports': '/dashboard/reports',
  'My Jobs': '/dashboard/my-jobs',
  'My Requests': '/dashboard/my-requests',
};

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedEmail = localStorage.getItem('email');
    const storedRole = localStorage.getItem('role');

    if (!token) {
      router.push('/login');
      return;
    }

    setEmail(storedEmail);
    setRole(storedRole);
    setChecking(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    router.push('/login');
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        Checking session...
      </div>
    );
  }

  // Agar kisi wajah se role match nahi hua (typo, naya role, etc.) toh empty menu de do, crash mat karo
  const menuItems = role ? roleMenus[role] ?? [] : [];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar - role ke hisaab se menu */}
      <aside className="w-56 border-r border-gray-800 p-4 flex flex-col">
        <h1 className="text-lg font-bold mb-6">
          KEY<span className="text-indigo-500">STONE</span>
        </h1>
        <nav className="flex flex-col gap-1 flex-1">
          {menuItems.map((item) => (
            <button
              key={item}
              onClick={() => router.push(menuRoutes[item] ?? '/dashboard')}
              className="text-left text-sm text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg px-3 py-2 transition"
            >
              {item}
            </button>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="text-sm bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 transition"
        >
          Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md">
          <p className="text-gray-400 text-sm mb-1">Logged in as</p>
          <p className="text-lg font-medium">{email}</p>
          <p className="text-indigo-400 text-sm mt-1 uppercase tracking-wide">{role}</p>
        </div>
      </main>
    </div>
  );
}