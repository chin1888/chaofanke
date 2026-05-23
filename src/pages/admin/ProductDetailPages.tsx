import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, ShoppingCart, Users, Star, LogOut, TrendingUp, FileText, CreditCard, Image as ImageIcon, LayoutDashboard, BarChart3 } from 'lucide-react';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import AdminSidebar from '../../components/admin/AdminSidebar';

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
  const { t } = useLanguage();
  const [pages, setPages] = useState<ProductDetailPage[]>([]);
  const [loading, setLoading] = useState(true);
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
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      <main className="flex-1 overflow-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('detailPages.title')}</h1>
        {loading ? (
          <div className="text-center py-8">{t('common.loading')}</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">{t('detailPages.productId')}</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">{t('common.status')}</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pages.map((page) => (
                  <tr key={page.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{page.product_id}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${page.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {page.is_active ? t('common.active') : t('common.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">{t('detailPages.edit')}</button>
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
