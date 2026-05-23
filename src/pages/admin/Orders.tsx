import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, ShoppingCart, Users, Star, LogOut, TrendingUp, FileText, CreditCard, Image as ImageIcon, LayoutDashboard, BarChart3, Search, ArrowLeft, ChevronLeft, ChevronRight, DollarSign, Truck, CheckCircle, Clock } from 'lucide-react';
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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
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

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedOrders = filteredOrders.slice((safePage - 1) * pageSize, safePage * pageSize);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      <main className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{t('orders.title')}</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('orders.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-64 pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-600 font-medium">{t('orders.pending')}</span>
              </div>
              <div className="text-3xl font-bold text-orange-700">{pendingCount}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium">{t('orders.paid')}</span>
              </div>
              <div className="text-3xl font-bold text-green-700">{paidCount}</div>
              <div className="text-sm text-green-600 mt-1">${totalPaidAmount.toFixed(2)}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-600 font-medium">{t('orders.unshipped')}</span>
              </div>
              <div className="text-3xl font-bold text-blue-700">{unshippedCount}<span className="text-base font-normal text-blue-500"> / {shippedCount} {t('orders.shipped')}</span></div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-purple-600 font-medium">{t('orders.completed')}</span>
              </div>
              <div className="text-3xl font-bold text-purple-700">{completedCount}</div>
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
            <>
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
                {paginatedOrders.map((order) => (
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

            {/* Pagination */}
            {filteredOrders.length > pageSize && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">
                  {t('orders.showing')} {(safePage - 1) * pageSize + 1}-{Math.min(safePage * pageSize, filteredOrders.length)} {t('orders.of')} {filteredOrders.length}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        page === safePage
                          ? 'bg-blue-500 text-white'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            )}
            </>
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
