import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, ShoppingCart, Users, Star, LogOut, TrendingUp, FileText, CreditCard, Image as ImageIcon, LayoutDashboard, BarChart3, Search, ArrowLeft } from 'lucide-react';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import AdminSidebar from '../../components/admin/AdminSidebar';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address: string | null;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string | null;
  tracking_number: string | null;
  created_at: string;
  categories?: string[];
}

interface CategoryStat {
  category_id: string;
  category_name: string;
  total_quantity: number;
  total_amount: number;
}

export default function AdminOrders() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const { t } = useLanguage();
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        setCategoryStats(data.categoryStats || []);
      } else {
        await fetchDataDirect();
      }
    } catch {
      await fetchDataDirect();
    }
    setLoading(false);
  };

  const fetchDataDirect = async () => {
    const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    const { data: itemsData } = await supabase.from('order_items').select('order_id, product_id, quantity, total_price');
    const { data: productsData } = await supabase.from('products').select('id, category_id');
    const { data: categoriesData } = await supabase.from('categories').select('id, name');

    const categoryMap = new Map(categoriesData?.map(c => [c.id, c.name]) || []);
    const productMap = new Map(productsData?.map(p => [p.id, p.category_id]) || []);

    const stats: Record<string, CategoryStat> = {};
    const ordersWithCats = (ordersData || []).map((order: any) => {
      const orderItems = itemsData?.filter((i: any) => i.order_id === order.id) || [];
      const catIds = new Set<string>();
      orderItems.forEach((item: any) => {
        const catId = productMap.get(item.product_id);
        if (catId) {
          catIds.add(catId);
          if (!stats[catId]) {
            stats[catId] = { category_id: catId, category_name: categoryMap.get(catId) || 'Unknown', total_quantity: 0, total_amount: 0 };
          }
          stats[catId].total_quantity += item.quantity || 0;
          stats[catId].total_amount += item.total_price || 0;
        }
      });
      return { ...order, categories: Array.from(catIds).map((id: string) => categoryMap.get(id) || 'Unknown') };
    });

    setOrders(ordersWithCats);
    setCategoryStats(Object.values(stats));
  };
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (!error) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      } else {
        console.error('Failed to update order status:', error);
      }
    } catch (err) {
      console.error('Error updating order:', err);
    }
    setUpdatingOrderId(null);
    setSelectedOrder(null);
  };

  const handleUpdatePaymentStatus = async (orderId: string, newPaymentStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const updates: any = { payment_status: newPaymentStatus, updated_at: new Date().toISOString() };
      if (newPaymentStatus === 'paid') {
        updates.status = 'confirmed';
      }
      const { error } = await supabase.from('orders').update(updates).eq('id', orderId);

      if (!error) {
        setOrders(prev => prev.map(o => {
          if (o.id !== orderId) return o;
          return {
            ...o,
            payment_status: newPaymentStatus,
            status: newPaymentStatus === 'paid' ? 'confirmed' : o.status,
          };
        }));
      }
    } catch (err) {
      console.error('Error updating payment status:', err);
    }
    setUpdatingOrderId(null);
    setSelectedOrder(null);
  };

  const handleShipOrder = async (orderId: string) => {
    if (!trackingNumber.trim()) return;
    setUpdatingOrderId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'shipped',
          tracking_number: trackingNumber.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (!error) {
        setOrders(prev => prev.map(o =>
          o.id === orderId ? { ...o, status: 'shipped', tracking_number: trackingNumber.trim() } : o
        ));
        setTrackingNumber('');
      } else {
        console.error('Failed to ship order:', error);
        alert(t('orders.shipFailed') + ': ' + error.message);
      }
    } catch (err) {
      console.error('Error shipping order:', err);
    }
    setUpdatingOrderId(null);
    setSelectedOrder(null);
  };

  const filteredOrders = orders.filter(o =>
    o.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Summary stats
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const paidCount = orders.filter(o => o.payment_status === 'paid').length;
  const totalPaidAmount = orders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const shippedCount = orders.filter(o => o.status === 'shipped').length;
  const unshippedCount = orders.filter(o => o.payment_status === 'paid' && o.status === 'confirmed').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      <main className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-gray-900">{t('orders.title')}</h1>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-red-500">
                  {t('orders.pending')}/{t('orders.paid')}: <strong>{pendingCount}/{paidCount}</strong>
                </span>
                <span className="text-red-500">
                  {t('orders.paid')}: <strong>${totalPaidAmount.toLocaleString()}</strong>
                </span>
                <span className="text-red-500">
                  {t('orders.unshipped')}/{t('orders.shipped')}: <strong>{unshippedCount}/{shippedCount}</strong>
                </span>
                <span className="text-red-500">
                  {t('orders.completed')}: <strong>{completedCount}</strong>
                </span>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('orders.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {categoryStats.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {categoryStats.map((stat, index) => (
                <motion.div
                  key={stat.category_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-sm p-5 border border-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{stat.category_name}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.total_quantity} {t('orders.pcs')}</p>
                      <p className="text-sm text-green-600">${stat.total_amount.toLocaleString()}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">{t('common.loading')}</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">{t('orders.orderNo')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">{t('orders.customer')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">{t('products.category')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">{t('orders.amount')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">{t('common.status')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">{t('common.date')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{order.order_number}</td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-xs text-gray-500">{order.customer_email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(order.categories || []).map((cat, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold">${order.total_amount}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'shipped' ? 'bg-indigo-100 text-indigo-700' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {order.status === 'pending' ? t('orders.pending') :
                         order.status === 'confirmed' ? t('orders.confirmed') :
                         order.status === 'shipped' ? t('orders.shipped') :
                         order.status === 'completed' ? t('orders.completed') :
                         order.status === 'cancelled' ? t('orders.cancelled') :
                         order.status}
                      </span>
                      {order.payment_status && (
                        <span className={`ml-1 px-2 py-1 rounded text-xs ${
                          order.payment_status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'
                        }`}>
                          {order.payment_status === 'paid' ? t('orders.paid') : t('orders.unpaid')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          {t('common.actions')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Order Actions Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('orders.orderPrefix')} {selectedOrder.order_number}</h3>
              <div className="space-y-3 mb-6">
                <div className="text-sm text-gray-600">
                  <strong>{t('orders.customerLabel')}</strong> {selectedOrder.customer_name}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>{t('orders.emailLabel')}</strong> {selectedOrder.customer_email || t('common.na')}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>{t('orders.phoneLabel')}</strong> {selectedOrder.customer_phone || t('common.na')}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>{t('orders.addressLabel')}</strong> {selectedOrder.shipping_address || t('common.na')}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>{t('orders.amountLabel')}</strong> ${selectedOrder.total_amount}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>{t('orders.paymentLabel')}</strong> {selectedOrder.payment_method || t('common.na')} ({selectedOrder.payment_status})
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('orders.updateStatus')}</label>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'confirmed', 'shipped', 'completed', 'cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(selectedOrder.id, status)}
                      disabled={updatingOrderId === selectedOrder.id || selectedOrder.status === status}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                        selectedOrder.status === status
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status === 'pending' ? t('orders.pending') :
                       status === 'confirmed' ? t('orders.confirmed') :
                       status === 'shipped' ? t('orders.shipped') :
                       status === 'completed' ? t('orders.completed') :
                       t('orders.cancelled')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('orders.updatePaymentStatus')}</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleUpdatePaymentStatus(selectedOrder.id, 'paid')}
                    disabled={updatingOrderId === selectedOrder.id || selectedOrder.payment_status === 'paid'}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                      selectedOrder.payment_status === 'paid'
                        ? 'bg-green-600 text-white'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {t('orders.markPaid')}
                  </button>
                  <button
                    onClick={() => handleUpdatePaymentStatus(selectedOrder.id, 'unpaid')}
                    disabled={updatingOrderId === selectedOrder.id || selectedOrder.payment_status === 'unpaid'}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                      selectedOrder.payment_status === 'unpaid'
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t('orders.markUnpaid')}
                  </button>
                </div>
              </div>

              {/* Ship Order Section */}
              {(selectedOrder.status === 'confirmed' || selectedOrder.status === 'pending') && selectedOrder.payment_status === 'paid' && (
                <div className="mb-6 bg-blue-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-blue-800 mb-2">{t('orders.shipOrder')}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder={t('orders.trackingPlaceholder')}
                      className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => handleShipOrder(selectedOrder.id)}
                      disabled={updatingOrderId === selectedOrder.id || !trackingNumber.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('orders.ship')}
                    </button>
                  </div>
                </div>
              )}

              {selectedOrder.status === 'shipped' && selectedOrder.tracking_number && (
                <div className="mb-6 bg-blue-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-blue-800 mb-1">{t('orders.trackingNumber')}</label>
                  <p className="text-sm text-blue-700 font-mono">{selectedOrder.tracking_number}</p>
                  <p className="text-xs text-blue-500 mt-1">{t('orders.shippedStatus')}</p>
                </div>
              )}

              <button
                onClick={() => { setSelectedOrder(null); setTrackingNumber(''); }}
                className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t('common.close')}
              </button>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
