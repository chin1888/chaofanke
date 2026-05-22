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

  const filteredOrders = orders.filter(o => 
    o.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      <main className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Sales Analysis</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
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
                      <p className="text-2xl font-bold text-gray-900">{stat.total_quantity} pcs</p>
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
            <div className="text-center py-8">Loading...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Order No.</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
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
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {order.status}
                      </span>
                      {order.payment_status && (
                        <span className={`ml-1 px-2 py-1 rounded text-xs ${
                          order.payment_status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'
                        }`}>
                          {order.payment_status === 'paid' ? '✓ Paid' : '○ Unpaid'}
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
                          Actions
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
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order: {selectedOrder.order_number}</h3>
              <div className="space-y-3 mb-6">
                <div className="text-sm text-gray-600">
                  <strong>Customer:</strong> {selectedOrder.customer_name}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Email:</strong> {selectedOrder.customer_email || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Phone:</strong> {selectedOrder.customer_phone || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Address:</strong> {selectedOrder.shipping_address || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Amount:</strong> ${selectedOrder.total_amount}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Payment:</strong> {selectedOrder.payment_method || 'N/A'} ({selectedOrder.payment_status})
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Update Order Status</label>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
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
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Update Payment Status</label>
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
                    ✓ Mark as Paid
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
                    ○ Mark as Unpaid
                  </button>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
