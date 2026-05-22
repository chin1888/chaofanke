import React, { useState, useEffect } from 'react';
import { Search, Users as UsersIcon, UserPlus, UserCheck } from 'lucide-react';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import AdminSidebar from '../../components/admin/AdminSidebar';

interface UserData {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  role: string;
}

export default function Users() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total: 0, newThisMonth: 0, active: 0 });
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(u =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setFilteredUsers(data.users || []);

        const now = new Date();
        const thisMonth = (data.users || []).filter((u: any) => {
          const d = new Date(u.created_at);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });

        setStats({
          total: data.total || 0,
          newThisMonth: thisMonth.length,
          active: (data.users || []).filter((u: any) => u.role !== 'banned').length
        });
      } else {
        // Fallback to direct query
        await fetchUsersDirect();
      }
    } catch {
      await fetchUsersDirect();
    }
    setLoading(false);
  };

  const fetchUsersDirect = async () => {
    try {
      const { data: profiles } = await supabase.from('profiles').select('*');
      const { data: roles } = await supabase.from('user_roles').select('*');

      const usersWithRoles = (profiles || []).map(p => ({
        ...p,
        role: roles?.find(r => r.user_id === p.id)?.role || 'user'
      }));

      setUsers(usersWithRoles);
      setFilteredUsers(usersWithRoles);

      const now = new Date();
      const thisMonth = usersWithRoles.filter((u: any) => {
        const d = new Date(u.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });

      setStats({
        total: usersWithRoles.length,
        newThisMonth: thisMonth.length,
        active: usersWithRoles.filter((u: any) => u.role !== 'banned').length
      });
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      <main className="flex-1 overflow-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('users.title')}</h1>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{t('users.totalUsers')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{t('users.newThisMonth')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.newThisMonth}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{t('users.activeUsers')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('users.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('users.username')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('users.email')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('users.phone')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('users.registered')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('users.role')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user, index) => (
                  <tr key={user.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.username}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.email || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.phone || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
