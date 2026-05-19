import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, ShoppingCart, Users, Star, LogOut, TrendingUp, FileText, CreditCard, Image as ImageIcon, LayoutDashboard, BarChart3 } from 'lucide-react';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';

interface ProductDetailPage {
  id: string;
  product_id: string;
  content: string;
  is_active: boolean;
}

export default function ProductDetailPages() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [pages, setPages] = useState<ProductDetailPage[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    fetchPages();
  }, [isAuthenticated, navigate]);

  const fetchPages = async () => {
    const { data } = await supabase.from('product_detail_pages').select('*');
    setPages(data || []);
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Product Detail Pages</h1>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Product ID</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pages.map((page) => (
                  <tr key={page.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{page.product_id}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${page.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {page.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
