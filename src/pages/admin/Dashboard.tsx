import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, ShoppingCart, Users, Star, LogOut, TrendingUp, FileText, CreditCard, Image as ImageIcon, LayoutDashboard, BarChart3, Settings, HelpCircle, ChevronLeft, ChevronRight, Download, Eye, ShoppingBag, Activity, PieChart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, getSupabaseUrl } from '../../supabase/client';

interface TrafficData {
  unique_visitors: number;
  page_views: number;
  product_views: number;
  paying_customers: number;
  new_visitors: number;
  returning_visitors: number;
  avg_pages_per_session: number;
  orders_count: number;
}

interface TrafficSource {
  source_name: string;
  visitors: number;
}

interface HourlyData {
  hour: number;
  page_views: number;
  unique_visitors: number;
}

interface ProductViewStat {
  product_id: string;
  product_name: string;
  view_count: number;
  unique_visitors: number;
}

export default function AdminDashboard() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [timeRange, setTimeRange] = useState<'realtime' | '7days' | '30days' | 'day' | 'week' | 'month'>('realtime');
  const [currentData, setCurrentData] = useState<TrafficData | null>(null);
  const [prevData, setPrevData] = useState<TrafficData | null>(null);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [productStats, setProductStats] = useState<ProductViewStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState<number[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const authHeaders = session ? { Authorization: `Bearer ${session.access_token}` } : {};

      const response = await fetch(`${getSupabaseUrl()}/functions/v1/traffic-stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ timeRange })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Function error:', result);
        setLoading(false);
        return;
      }

      setCurrentData(result.current);
      setPrevData(result.prev);
      setTrafficSources(result.trafficSources || []);
      setHourlyData(result.hourlyData || []);
      setProductStats(result.productStats || []);
      setTrendData(result.trendData || []);
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setLoading(false);
  };

  const calcChange = (current: number | undefined, prev: number | undefined) => {
    if (!prev || prev === 0) return 0;
    return ((current || 0) - prev) / prev * 100;
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const exportToExcel = () => {
    const data = [
      ['Metric', 'Current', 'Yesterday', 'Change'],
      ['Visitors', currentData?.unique_visitors || 0, prevData?.unique_visitors || 0, `${calcChange(currentData?.unique_visitors, prevData?.unique_visitors).toFixed(2)}%`],
      ['Page Views', currentData?.page_views || 0, prevData?.page_views || 0, `${calcChange(currentData?.page_views, prevData?.page_views).toFixed(2)}%`],
      ['Product Views', currentData?.product_views || 0, prevData?.product_views || 0, `${calcChange(currentData?.product_views, prevData?.product_views).toFixed(2)}%`],
      ['Paying Customers', currentData?.paying_customers || 0, prevData?.paying_customers || 0, `${calcChange(currentData?.paying_customers, prevData?.paying_customers).toFixed(2)}%`],
      ['New Visitors', currentData?.new_visitors || 0, prevData?.new_visitors || 0, `${calcChange(currentData?.new_visitors, prevData?.new_visitors).toFixed(2)}%`],
      ['Returning Visitors', currentData?.returning_visitors || 0, prevData?.returning_visitors || 0, `${calcChange(currentData?.returning_visitors, prevData?.returning_visitors).toFixed(2)}%`],
    ];

    const csv = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Traffic_Stats_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  const renderTrendChart = (color: string) => {
    const points = trendData.length > 0 ? trendData : [20, 45, 30, 60, 40, 75, 50, 80, 45, 70, 55, 85, 40, 65, 50, 90, 60, 70, 45, 80];
    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = max - min || 1;
    const width = 200;
    const height = 60;
    const step = width / (points.length - 1);

    const pathPoints = points.map((p, i) => {
      const x = i * step;
      const y = height - ((p - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width="100%" height="60" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`lineGradient-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <linearGradient id={`areaGradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,${height} ${pathPoints} ${width},${height}`}
          fill={`url(#areaGradient-${color})`}
        />
        <polyline
          points={pathPoints}
          fill="none"
          stroke={`url(#lineGradient-${color})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const MainCard = ({ title, subtitle, value, change, color, isActive = false, icon: Icon }: {
    title: string;
    subtitle: string;
    value: number;
    change: number;
    color: string;
    isActive?: boolean;
    icon: React.ElementType;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl p-6 shadow-sm border-2 transition-all cursor-pointer ${
        isActive ? 'border-blue-500' : 'border-transparent hover:border-gray-200'
      }`}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-lg`} style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <span className="text-blue-600 font-semibold text-base">{title}</span>
        <span className="text-gray-500 text-sm">{subtitle}</span>
        <HelpCircle className="w-4 h-4 text-gray-300" />
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-4xl font-bold text-gray-900 mb-3">{value.toLocaleString()}</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">vs same time yesterday</span>
            {change === 0 ? (
              <span className="text-gray-400">-</span>
            ) : (
              <span className={`flex items-center ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {change >= 0 ? '▼' : '▲'} {Math.abs(change).toFixed(2)}%
              </span>
            )}
          </div>
        </div>
        <div className="w-32">
          {renderTrendChart(color)}
        </div>
      </div>
    </motion.div>
  );

  const SmallCard = ({ title, value, change, icon: Icon, color }: { title: string; value: number | string; change: number; icon: React.ElementType; color: string }) => {
    const formatValue = (val: number | string) => {
      if (typeof val === 'number') {
        return Number.isInteger(val) ? val.toString() : val.toFixed(2);
      }
      return val;
    };
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className={`p-2 rounded-lg`} style={{ backgroundColor: `${color}20` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <span className="text-gray-600 text-sm">{title}</span>
          <HelpCircle className="w-4 h-4 text-gray-300 ml-auto" />
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-3">{formatValue(value)}</div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">vs previous day</span>
          {change === 0 ? (
            <span className="text-gray-400">-</span>
          ) : (
            <span className={`flex items-center ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Math.abs(change).toFixed(2)}% {change >= 0 ? '▼' : '▲'}
            </span>
          )}
        </div>
      </motion.div>
    );
  };

  const TagCard = ({ title, value, tag, icon: Icon, color }: { title: string; value: number; tag?: string; icon: React.ElementType; color: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg`} style={{ backgroundColor: `${color}20` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <span className="text-gray-600 text-sm">{title}</span>
        </div>
        <HelpCircle className="w-3 h-3 text-gray-300" />
      </div>
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {tag && (
          <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded">{tag}</span>
        )}
      </div>
      <div className="flex items-center justify-between text-sm mt-1">
        <span className="text-gray-500">vs previous day</span>
        <span className="text-gray-400">-</span>
      </div>
    </motion.div>
  );

  const visitors = currentData?.unique_visitors || 0;
  const prevVisitors = prevData?.unique_visitors || 0;
  const pageViews = currentData?.page_views || 0;
  const prevPageViews = prevData?.page_views || 0;
  const productViews = currentData?.product_views || 0;
  const prevProductViews = prevData?.product_views || 0;
  const payingCustomers = currentData?.paying_customers || 0;
  const prevPayingCustomers = prevData?.paying_customers || 0;
  const newVisitors = currentData?.new_visitors || 0;
  const prevNewVisitors = prevData?.new_visitors || 0;
  const returningVisitors = currentData?.returning_visitors || 0;
  const prevReturningVisitors = prevData?.returning_visitors || 0;
  const avgPages = currentData?.avg_pages_per_session || 0;
  const prevAvgPages = prevData?.avg_pages_per_session || 0;
  const ordersCount = currentData?.orders_count || 0;
  const prevOrdersCount = prevData?.orders_count || 0;

  const totalSourceVisitors = trafficSources.reduce((sum, s) => sum + s.visitors, 0);

  if (!isAuthenticated) return null;

  const menuItems = [
    { name: 'Common', path: '/admin', icon: LayoutDashboard },
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

      <main className="flex-1 overflow-auto">
        <div className="bg-white border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold">Traffic Dashboard</h1>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">Stats Time {new Date().toLocaleString('en-US')}</span>
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  {(['realtime', '7days', '30days', 'day', 'week', 'month'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTimeRange(t)}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                        timeRange === t
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {t === 'realtime' ? 'Realtime' : t === '7days' ? '7 Days' : t === '30days' ? '30 Days' : t === 'day' ? 'Day' : t === 'week' ? 'Week' : 'Month'}
                    </button>
                  ))}
                  <div className="flex items-center px-2 border-l border-gray-200 ml-1">
                    <ChevronLeft className="w-4 h-4 text-gray-400 cursor-pointer" />
                    <ChevronRight className="w-4 h-4 text-gray-400 cursor-pointer" />
                  </div>
                </div>
                <button
                  onClick={exportToExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                >
                  <Download className="w-4 h-4" />
                  Export Data
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <span className="text-lg font-semibold text-gray-900">Traffic Overview</span>
              <span className="text-lg text-blue-500 cursor-pointer">Visitor Analysis &gt;</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                <span>Time Trend</span>
                <ChevronLeft className="w-4 h-4 rotate-90" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                <span>All Devices</span>
                <ChevronLeft className="w-4 h-4 rotate-90" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <MainCard
              title="Visitors"
              subtitle="Visitors"
              value={visitors}
              change={calcChange(visitors, prevVisitors)}
              color="#3B82F6"
              isActive={true}
              icon={Users}
            />
            <MainCard
              title="Product Views"
              subtitle="Product Visitors"
              value={productViews}
              change={calcChange(productViews, prevProductViews)}
              color="#06B6D4"
              icon={ShoppingBag}
            />
            <MainCard
              title="Conversion"
              subtitle="Paying Customers"
              value={payingCustomers}
              change={calcChange(payingCustomers, prevPayingCustomers)}
              color="#8B5CF6"
              icon={TrendingUp}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <SmallCard title="Visitors" value={visitors} change={calcChange(visitors, prevVisitors)} icon={Users} color="#3B82F6" />
            <SmallCard title="Page Views" value={pageViews} change={calcChange(pageViews, prevPageViews)} icon={Eye} color="#10B981" />
            <SmallCard title="Avg Pages/Session" value={Math.round(avgPages)} change={calcChange(avgPages, prevAvgPages)} icon={Activity} color="#F59E0B" />
            <SmallCard title="Returning Visitors" value={returningVisitors} change={calcChange(returningVisitors, prevReturningVisitors)} icon={Users} color="#8B5CF6" />
            <SmallCard title="New Visitors" value={newVisitors} change={calcChange(newVisitors, prevNewVisitors)} icon={Users} color="#EC4899" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <TagCard title="Store Followers" value={0} icon={Users} color="#3B82F6" />
            <TagCard title="Live Visitors" value={0} tag="Live" icon={Eye} color="#EF4444" />
            <TagCard title="Short Video" value={0} tag="Video" icon={Eye} color="#10B981" />
            <TagCard title="Image/Text" value={0} icon={Eye} color="#F59E0B" />
            <TagCard title="Store Page" value={0} icon={Eye} color="#8B5CF6" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  Traffic Sources
                </h3>
              </div>
              <div className="space-y-3 min-h-[200px] flex flex-col">
                {trafficSources.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-400">No Data</div>
                  </div>
                ) : (
                  trafficSources.map((source, index) => {
                    const percentage = totalSourceVisitors > 0 ? (source.visitors / totalSourceVisitors) * 100 : 0;
                    return (
                      <div key={source.source_name} className="flex items-center">
                        <span className="w-6 text-sm text-gray-400">{index + 1}</span>
                        <span className="w-24 text-sm text-gray-600 truncate">{source.source_name}</span>
                        <div className="flex-1 mx-3">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                              className="h-full bg-blue-500 rounded-full"
                            />
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-700 w-12 text-right">{source.visitors}</span>
                        <span className="text-sm font-medium text-gray-500 w-12 text-right">{percentage.toFixed(1)}%</span>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-500" />
                  Top Products TOP10
                </h3>
              </div>
              <div className="space-y-3 min-h-[200px] flex flex-col">
                {productStats.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-400">No Data</div>
                  </div>
                ) : (
                  productStats.map((product, index) => {
                    const totalViews = productStats.reduce((sum, p) => sum + p.view_count, 0);
                    const percentage = totalViews > 0 ? (product.view_count / totalViews) * 100 : 0;
                    return (
                      <div key={product.product_id} className="flex items-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-2 ${
                          index < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="flex-1 text-sm text-gray-600 truncate">{product.product_name}</span>
                        <div className="w-24 mx-3">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                              className="h-full bg-purple-500 rounded-full"
                            />
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-700 w-12 text-right">{product.view_count}</span>
                        <span className="text-sm font-medium text-gray-500 w-12 text-right">{product.unique_visitors}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-500" />
                24h Traffic Trend
              </h3>
            </div>
            <div className="h-64 flex items-end justify-between px-4">
              {hourlyData.length === 0 ? (
                <div className="w-full text-center text-gray-400 py-8">No Data</div>
              ) : (
                (() => {
                  const maxViews = Math.max(...hourlyData.map(h => h.page_views), 1);
                  const timeLabels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
                  const displayData = hourlyData.filter((_, i) => i % 4 === 0).slice(0, 6);
                  return displayData.map((hour, i) => {
                    const height = (hour.page_views / maxViews) * 180;
                    return (
                      <div key={i} className="flex flex-col items-center flex-1 group">
                        <div className="relative">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(height, 10)}px` }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="w-12 bg-blue-200 rounded-t-lg cursor-pointer hover:bg-blue-300 transition-colors"
                          />
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {hour.page_views} people
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 mt-2">{timeLabels[i]}</span>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
