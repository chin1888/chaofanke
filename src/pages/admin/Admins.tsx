import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, ArrowLeft, Shield, User, LayoutDashboard, FileText, TrendingUp, ShoppingCart, Package, Image as ImageIcon, BarChart3, Users, Star, CreditCard, LogOut } from 'lucide-react';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import AdminSidebar from '../../components/admin/AdminSidebar';

interface Admin {
  id: string;
  username: string;
  role: string;
  is_active: boolean;
  created_at: string;
}
export default function AdminAdmins() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'admin',
    is_active: true
  });
  const { admin: currentAdmin, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || currentAdmin?.role !== 'superadmin') {
      navigate('/admin');
      return;
    }
    fetchAdmins();
  }, [isAuthenticated, currentAdmin, navigate]);

  const fetchAdmins = async () => {
    const { data } = await supabase.from('admins').select('*').order('created_at', { ascending: false });
    setAdmins(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAdmin) {
      const updateData: any = { role: formData.role, is_active: formData.is_active };
      if (formData.password) updateData.password_hash = formData.password;
      await supabase.from('admins').update(updateData).eq('id', editingAdmin.id);
    } else {
      await supabase.from('admins').insert([{
        username: formData.username,
        password_hash: formData.password,
        role: formData.role,
        is_active: formData.is_active
      }]);
    }
    setShowModal(false);
    setEditingAdmin(null);
    fetchAdmins();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Confirm delete this admin?')) {
      await supabase.from('admins').delete().eq('id', id);
      fetchAdmins();
    }
  };

  const openEdit = (admin: Admin) => {
    setEditingAdmin(admin);
    setFormData({
      username: admin.username,
      password: '',
      role: admin.role,
      is_active: admin.is_active
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingAdmin(null);
    setFormData({ username: '', password: '', role: 'admin', is_active: true });
    setShowModal(true);
  };
  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      <main className="flex-1 overflow-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-200 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Admin Management</h1>
          </div>
          <button onClick={openCreate} className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
            <Plus className="w-4 h-4" />
            <span>Add Admin</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Username</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Role</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Created At</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="font-medium">{admin.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${admin.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {admin.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${admin.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {admin.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(admin.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button onClick={() => openEdit(admin)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(admin.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">{editingAdmin ? 'Edit Admin' : 'Add Admin'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={!!editingAdmin}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password {editingAdmin && '(Leave blank if not changing)'}</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required={!editingAdmin}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <label className="text-sm">Active</label>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
