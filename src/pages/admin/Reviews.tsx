import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, Share2, Trash2, Check, Package, ShoppingCart, Users, LogOut, TrendingUp, FileText, CreditCard, Image as ImageIcon, LayoutDashboard, BarChart3, Search } from 'lucide-react';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import AdminSidebar from '../../components/admin/AdminSidebar';

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  content: string;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  product_name?: string;
}

interface Product {
  id: string;
  name: string;
  likes_count: number;
  shares_count: number;
  actualLikes?: number;
  actualShares?: number;
}

interface LikeItem {
  id: string;
  product_id: string;
  user_id: string | null;
  username: string;
}

interface ShareItem {
  id: string;
  product_id: string;
  user_id: string | null;
  username: string;
}

type TabType = 'reviews' | 'likes' | 'shares';

export default function AdminReviews() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('reviews');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [likesList, setLikesList] = useState<LikeItem[]>([]);
  const [sharesList, setSharesList] = useState<ShareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ reviews: 0, likes: 0, shares: 0 });
  const [likesSortOrder, setLikesSortOrder] = useState<'desc' | 'asc'>('desc');
  useEffect(() => {
    if (!isAuthenticated) { navigate('/admin/login'); return; }
    fetchData();

    const likesChannel = supabase.channel('product_likes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_likes' }, () => fetchData())
      .subscribe();

    const sharesChannel = supabase.channel('product_shares_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_shares' }, () => fetchData())
      .subscribe();

    return () => {
      likesChannel.unsubscribe();
      sharesChannel.unsubscribe();
    };
  }, [isAuthenticated, navigate, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        const reviewsData = data.reviews || [];
        setReviews(reviewsData);

        const { data: likesData } = await supabase.from('product_likes').select('*');
        const { data: sharesData } = await supabase.from('product_shares').select('*');
        const { data: productsData } = await supabase.from('products').select('id, name, likes_count, shares_count');

        const productsWithLikes = (productsData || []).map((p: any) => ({
          ...p,
          actualLikes: (likesData || []).filter((l: any) => l.product_id === p.id).length,
          actualShares: (sharesData || []).filter((s: any) => s.product_id === p.id).length
        }));

        setProducts(productsWithLikes);
        setLikesList(likesData || []);
        setSharesList(sharesData || []);
        setStats({
          reviews: reviewsData.length,
          likes: likesData?.length || 0,
          shares: sharesData?.length || 0
        });
      } else {
        await fetchDataDirect();
      }
    } catch {
      await fetchDataDirect();
    }
    setLoading(false);
  };

  const fetchDataDirect = async () => {
    const { data: reviewsData } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    const { data: productsData } = await supabase.from('products').select('id, name, likes_count, shares_count');
    const { data: likesData } = await supabase.from('product_likes').select('*');
    const { data: sharesData } = await supabase.from('product_shares').select('*');

    const productsWithLikes = (productsData || []).map((p: any) => ({
      ...p,
      actualLikes: (likesData || []).filter((l: any) => l.product_id === p.id).length,
      actualShares: (sharesData || []).filter((s: any) => s.product_id === p.id).length
    }));

    setReviews(reviewsData || []);
    setProducts(productsWithLikes);
    setLikesList(likesData || []);
    setSharesList(sharesData || []);
    setStats({
      reviews: reviewsData?.length || 0,
      likes: likesData?.length || 0,
      shares: sharesData?.length || 0
    });
  };
  const handleDelete = async (id: string) => {
    if (confirm(t('reviews.confirmDelete'))) {
      await supabase.from('reviews').delete().eq('id', id);
      fetchData();
    }
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    await supabase.from('reviews').update({ is_featured: !current }).eq('id', id);
    fetchData();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('reviews').update({ is_active: !current }).eq('id', id);
    fetchData();
  };

  const filteredReviews = reviews.filter(r => 
    r.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      <main className="flex-1 overflow-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('reviews.title')}</h1>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{t('reviews.totalReviews')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.reviews}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{t('reviews.totalLikes')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.likes}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ThumbsUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{t('reviews.totalShares')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.shares}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Share2 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex gap-2">
              {(['reviews', 'likes', 'shares'] as TabType[]).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === tab ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {tab === 'reviews' ? t('reviews.reviewsTab') : tab === 'likes' ? t('reviews.likesTab') : t('reviews.sharesTab')}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder={t('reviews.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {loading ? <div className="text-center py-12 text-gray-500">{t('common.loading')}</div> : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {activeTab === 'likes' ? (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('reviews.product')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:text-blue-600" onClick={() => setLikesSortOrder(likesSortOrder === 'desc' ? 'asc' : 'desc')}>
                        {t('reviews.likesCount')} {likesSortOrder === 'desc' ? '↓' : '↑'}
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('reviews.user')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('reviews.product')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{activeTab === 'reviews' ? t('reviews.rating') : t('reviews.count')}</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeTab === 'reviews' && filteredReviews.map((review, index) => (
                  <tr key={review.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{review.customer_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{review.product_name || t('reviews.unknownProduct')}</td>
                    <td className="px-4 py-3 text-sm text-blue-600">{review.rating}</td>
                  </tr>
                ))}
                {activeTab === 'likes' && products
                  .sort((a, b) => likesSortOrder === 'desc' ? (b.actualLikes || 0) - (a.actualLikes || 0) : (a.actualLikes || 0) - (b.actualLikes || 0))
                  .map((product, index) => (
                  <tr key={product.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.name}</td>
                    <td className="px-4 py-3 text-sm text-blue-600">{product.actualLikes || 0}</td>
                  </tr>
                ))}
                {activeTab === 'shares' && sharesList.map((share, index) => (
                  <tr key={share.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{share.username || t('reviews.defaultUser')}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{products.find(p => p.id === share.product_id)?.name || t('products.unknown')}</td>
                    <td className="px-4 py-3 text-sm text-green-600">1</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
