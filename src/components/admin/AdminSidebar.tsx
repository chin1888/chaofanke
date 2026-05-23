import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, TrendingUp, ShoppingCart, Package, Star, LogOut, CreditCard, BarChart3, Image as ImageIcon, Users as UsersIcon, Globe, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

const menuConfig = [
  { nameKey: 'menu.traffic', path: '/admin/traffic-stats', icon: TrendingUp },
  { nameKey: 'menu.overview', path: '/admin/user-stats', icon: FileText },
  { nameKey: 'menu.sales', path: '/admin/orders', icon: ShoppingCart },
  { nameKey: 'menu.products', path: '/admin/products', icon: Package },
  { nameKey: 'menu.banners', path: '/admin/banners', icon: ImageIcon },
  { nameKey: 'menu.categories', path: '/admin/categories', icon: BarChart3 },
  { nameKey: 'menu.users', path: '/admin/users', icon: UsersIcon },
  { nameKey: 'menu.reviews', path: '/admin/reviews', icon: Star },
  { nameKey: 'menu.payments', path: '/admin/payment-gateways', icon: CreditCard },
];

export default function AdminSidebar() {
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const toggleLang = () => {
    setLang(lang === 'en' ? 'zh' : 'en');
  };

  return (
    <aside className="w-56 bg-blue-50 min-h-screen flex flex-col">
      <div className="p-4">
        <h1 className="text-lg font-bold text-gray-800">{t('admin.title')}</h1>
      </div>

      {/* Language Toggle */}
      <div className="px-3 mb-2">
        <button
          onClick={toggleLang}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-blue-200 bg-white hover:bg-blue-100 transition-colors text-gray-600"
        >
          <Globe className="w-4 h-4" />
          <span>{lang === 'en' ? '中文' : 'English'}</span>
        </button>
      </div>

      <nav className="flex-1 px-2">
        {menuConfig.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path === '/admin/traffic-stats' && location.pathname === '/admin/traffic-stats');
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-100 rounded-lg transition-colors text-left ${
                isActive ? 'bg-blue-100 text-blue-700' : ''
              }`}
            >
              <item.icon className="w-5 h-5 text-gray-600" />
              <span className="text-base font-medium">{t(item.nameKey)}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-blue-100">
        <button
          onClick={() => { logout(); navigate('/admin/login'); }}
          className="w-full flex items-center space-x-3 px-4 py-2 text-gray-600 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">{t('admin.logout')}</span>
        </button>
      </div>
    </aside>
  );
}
