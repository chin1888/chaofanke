import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, ShoppingCart, Users, Star, LogOut, TrendingUp, FileText, CreditCard, Image as ImageIcon, LayoutDashboard, BarChart3, Eye, DollarSign, TrendingUp as TrendIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase/client';

interface StatsData {
  totalUsers: number;
  totalOrders: number;
  totalProducts: number;
  totalReviews: number;
  todayVisits: number;
  totalSales: number;
  conversionRate: number;
}

export default function UserStats() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salesTrendData, setSalesTrendData] = useState<number[]>([30, 45, 35, 55, 48, 62, 58, 75, 68, 85, 78, 92]);
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalReviews: 0,
    todayVisits: 0,
    totalSales: 0,
    conversionRate: 0
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    fetchStats();
  }, [isAuthenticated, navigate]);

  const fetchStats = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const [{ count: users }, { count: orders }, { count: products }, { count: reviews }, { data: ordersData }, { data: monthlyOrders }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('reviews').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('total_amount, created_at').eq('status', 'completed'),
      supabase.from('orders').select('total_amount').eq('status', 'completed').gte('created_at', startOfMonth)
    ]);

    const totalSales = ordersData?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
    const conversionRate = users && orders ? Math.round((orders / users) * 100) : 0;

    const monthlyData = new Array(12).fill(0);
    ordersData?.forEach(o => {
      const date = new Date(o.created_at);
      const month = date.getMonth();
      monthlyData[month] += o.total_amount || 0;
    });

    setStats({
      totalUsers: users || 0,
      totalOrders: orders || 0,
      totalProducts: products || 0,
      totalReviews: reviews || 0,
      todayVisits: Math.floor(Math.random() * 100),
      totalSales,
      conversionRate
    });
    setSalesTrendData(monthlyData.map(v => Math.round(v / 100)));
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const menuItems = [
    { id: 1, name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { id: 2, name: 'Overview', path: '/admin/user-stats', icon: FileText },
    { id: 3, name: 'Traffic', path: '/admin/traffic-stats', icon: TrendingUp },
    { id: 4, name: 'Sales', path: '/admin/orders', icon: ShoppingCart },
    { id: 5, name: 'Products', path: '/admin/products', icon: Package },
    { id: 6, name: 'Banners', path: '/admin/banners', icon: ImageIcon },
    { id: 7, name: 'Categories', path: '/admin/categories', icon: BarChart3 },
    { id: 8, name: 'Users', path: '/admin/users', icon: Users },
    { id: 9, name: 'Reviews', path: '/admin/reviews', icon: Star },
    { id: 10, name: 'Payments', path: '/admin/payment-gateways', icon: CreditCard },
  ];

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'text-green-600', bgColor: 'bg-green-50' },
    { title: 'Total Products', value: stats.totalProducts, icon: Package, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { title: 'Total Reviews', value: stats.totalReviews, icon: Star, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { title: 'Total Sales', value: `$${stats.totalSales.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { title: 'Conversion Rate', value: `${stats.conversionRate}%`, icon: TrendIcon, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  ];


  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-blue-50 min-h-screen flex flex-col">
        <div className="p-4">
          <h1 className="text-lg font-bold text-gray-800">Admin Panel</h1>
        </div>
        <nav className="flex-1 px-2">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-100 rounded-lg transition-colors text-left ${
                location.pathname === item.path ? 'bg-blue-100 text-blue-700' : ''
              }`}
            >
              <item.icon className="w-5 h-5 text-gray-600" />
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
        <h1 className="text-2xl font-bold mb-6">Data Overview</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {statCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-sm p-5 border border-gray-100"
            >
              <div className={`w-10 h-10 ${card.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-xs text-gray-500 mb-1">{card.title}</p>
              <p className="text-xl font-bold text-gray-900">{loading ? '-' : card.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
            <div className="h-48 flex items-end justify-between gap-1 px-2">
              {salesTrendData.map((value, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group relative">
                  <div className="relative w-full flex flex-col items-center">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {value}
                    </div>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max((value / Math.max(...salesTrendData, 1)) * 140, 4)}px` }}
                      transition={{ delay: i * 0.03 }}
                      className="w-4 bg-blue-400 rounded-t hover:bg-blue-500 transition-colors cursor-pointer"
                    />
                  </div>
                  <span className="text-xs text-gray-500 mt-2">{i + 1}Mon</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <h3 className="text-lg font-semibold mb-4">User Growth</h3>
            <div className="h-48 flex items-center justify-center">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="12"
                    strokeDasharray={`${stats.conversionRate * 2.51} 251`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</span>
                </div>
              </div>
              <div className="ml-8 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-sm text-gray-600">Active Users</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-200 rounded-full" />
                  <span className="text-sm text-gray-600">Potential Users</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
