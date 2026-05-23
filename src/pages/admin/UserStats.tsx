import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, ShoppingCart, Users, Star, LogOut, TrendingUp, FileText, CreditCard, Image as ImageIcon, LayoutDashboard, BarChart3, Eye, DollarSign, TrendingUp as TrendIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import AdminSidebar from '../../components/admin/AdminSidebar';
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
  const { t } = useLanguage();
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
    try {
      const response = await fetch('/api/admin-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalUsers: data.totalUsers || 0,
          totalOrders: data.totalOrders || 0,
          totalProducts: data.totalProducts || 0,
          totalReviews: data.totalReviews || 0,
          todayVisits: Math.floor(Math.random() * 100),
          totalSales: data.totalSales || 0,
          conversionRate: data.conversionRate || 0
        });
        setSalesTrendData(data.monthlyData || new Array(12).fill(0));
      } else {
        // Fallback to direct query if Edge Function unavailable
        await fetchStatsDirect();
      }
    } catch {
      // Fallback to direct query
      await fetchStatsDirect();
    }
    setLoading(false);
  };

  const fetchStatsDirect = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [{ count: users }, { count: orders }, { count: products }, { count: reviews }, { data: ordersData }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('reviews').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('total_amount, created_at').eq('payment_status', 'paid'),
    ]);

    const totalSales = ordersData?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
    const paidOrders = ordersData?.length || 0;
    const conversionRate = users && paidOrders ? Math.round((paidOrders / users) * 100) : 0;

    setStats({
      totalUsers: users || 0,
      totalOrders: orders || 0,
      totalProducts: products || 0,
      totalReviews: reviews || 0,
      todayVisits: Math.floor(Math.random() * 100),
      totalSales,
      conversionRate
    });
  };
  const statCards = [
    { title: t('stats.totalUsers'), value: stats.totalUsers, icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: t('stats.totalOrders'), value: stats.totalOrders, icon: ShoppingCart, color: 'text-green-600', bgColor: 'bg-green-50' },
    { title: t('stats.totalProducts'), value: stats.totalProducts, icon: Package, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { title: t('stats.totalReviews'), value: stats.totalReviews, icon: Star, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { title: t('stats.totalSales'), value: `$${stats.totalSales.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { title: t('stats.conversionRate'), value: `${stats.conversionRate}%`, icon: TrendIcon, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  ];


  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      <main className="flex-1 overflow-auto p-6">
        <h1 className="text-2xl font-bold mb-6">{t('stats.title')}</h1>
        
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
            <h3 className="text-lg font-semibold mb-4">{t('stats.salesTrend')}</h3>
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
                  <span className="text-xs text-gray-500 mt-2">{i + 1}{t('stats.mon')}</span>
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
            <h3 className="text-lg font-semibold mb-4">{t('stats.userGrowth')}</h3>
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
                  <span className="text-sm text-gray-600">{t('stats.activeUsers')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-200 rounded-full" />
                  <span className="text-sm text-gray-600">{t('stats.potentialUsers')}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
