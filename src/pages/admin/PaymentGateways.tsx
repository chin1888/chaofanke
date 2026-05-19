import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ShoppingCart, Users, Star, LogOut, TrendingUp, FileText, CreditCard, Image as ImageIcon, LayoutDashboard, BarChart3, Check, X, Settings, TestTube, Loader2, Edit2 } from 'lucide-react';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';

interface PaymentGateway {
  id: string;
  name: string;
  code: string;
  icon: string;
  is_active: boolean;
  api_key: string | null;
  api_secret: string | null;
  fee_percent: number | null;
  fee_fixed: number | null;
  test_mode: boolean;
  sort_order: number | null;
}

const iconMap: Record<string, React.ReactNode> = {
  credit_card: <CreditCard className="w-6 h-6" />,
  paypal: <LayoutDashboard className="w-6 h-6" />,
  alipay: <ImageIcon className="w-6 h-6" />,
  wechat: <Users className="w-6 h-6" />,
  stripe: <CreditCard className="w-6 h-6" />,
};

export default function PaymentGateways() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [editing, setEditing] = useState<PaymentGateway | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    api_key: '',
    api_secret: '',
    fee_percent: 0,
    fee_fixed: 0,
    test_mode: false,
  });

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Overview', path: '/admin/user-stats', icon: FileText },
    { name: 'Traffic', path: '/admin/traffic-stats', icon: TrendingUp },
    { name: 'Sales', path: '/admin/orders', icon: ShoppingCart },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Banners', path: '/admin/banners', icon: ImageIcon },
    { name: 'Categories', path: '/admin/categories', icon: BarChart3 },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Reviews', path: '/admin/reviews', icon: Star },
    { name: 'Payments', path: '/admin/payment-gateways', icon: CreditCard },
  ];

  useEffect(() => {
    if (!isAuthenticated) navigate('/admin/login');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    setLoading(true);
    const { data } = await supabase.from('payment_gateways').select('*').order('sort_order');
    setGateways(data || []);
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const toggleGateway = async (id: string, currentStatus: boolean) => {
    await supabase.from('payment_gateways').update({ is_active: !currentStatus }).eq('id', id);
    setGateways(prev => prev.map(g => g.id === id ? { ...g, is_active: !currentStatus } : g));
  };

  const openEditModal = (gateway: PaymentGateway) => {
    setEditing(gateway);
    setFormData({
      api_key: gateway.api_key || '',
      api_secret: gateway.api_secret || '',
      fee_percent: gateway.fee_percent || 0,
      fee_fixed: gateway.fee_fixed || 0,
      test_mode: gateway.test_mode || false,
    });
  };

  const closeEditModal = () => {
    setEditing(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    await supabase
      .from('payment_gateways')
      .update({
        api_key: formData.api_key || null,
        api_secret: formData.api_secret || null,
        fee_percent: formData.fee_percent,
        fee_fixed: formData.fee_fixed,
        test_mode: formData.test_mode,
      })
      .eq('id', editing.id);

    setGateways(prev =>
      prev.map(g =>
        g.id === editing.id
          ? {
              ...g,
              api_key: formData.api_key || null,
              api_secret: formData.api_secret || null,
              fee_percent: formData.fee_percent,
              fee_fixed: formData.fee_fixed,
              test_mode: formData.test_mode,
            }
          : g
      )
    );
    closeEditModal();
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-blue-50 min-h-screen flex flex-col">
        <div className="p-4">
          <h1 className="text-lg font-bold text-gray-800">Admin Panel</h1>
        </div>
        <nav className="flex-1 px-2">
          {menuItems.map((item, index) => (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-100 rounded-lg transition-colors text-left ${
                location.pathname === item.path ? 'bg-blue-100 text-blue-700' : ''
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-base font-medium">{item.name}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-blue-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 text-gray-600 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="space-y-4">
              {gateways.map((gateway) => (
                <div key={gateway.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {iconMap[gateway.icon] || <CreditCard className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{gateway.name}</h3>
                      <p className="text-sm text-gray-500">Fee: {gateway.fee_percent}% + ${gateway.fee_fixed}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => openEditModal(gateway)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Settings"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <span className={`px-2 py-1 rounded text-sm ${gateway.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {gateway.is_active ? 'Enabled' : 'Disabled'}
                    </span>
                    <button
                      onClick={() => toggleGateway(gateway.id, gateway.is_active)}
                      className={`w-12 h-6 rounded-full transition-colors ${gateway.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${gateway.is_active ? 'translate-x-6' : 'translate-x-0.5'} mt-0.5`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Edit {editing.name} Settings</h3>
                <button onClick={closeEditModal} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">API Key</label>
                  <input
                    type="text"
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Enter API Key"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">API Secret</label>
                  <input
                    type="password"
                    value={formData.api_secret}
                    onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Enter API Secret"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Fee Percent (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.fee_percent}
                      onChange={(e) => setFormData({ ...formData, fee_percent: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Fixed Fee ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.fee_fixed}
                      onChange={(e) => setFormData({ ...formData, fee_fixed: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.test_mode}
                    onChange={(e) => setFormData({ ...formData, test_mode: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label className="text-sm">Test Mode</label>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeEditModal}
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
