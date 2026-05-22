import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, ArrowLeft, X, Upload, Image as ImageIcon, FileText, Eye, Tag, Package, LayoutDashboard, ShoppingCart, Users, Star, LogOut, TrendingUp, FileText as FileTextIcon, CreditCard, BarChart3, MoreVertical, Copy, Eye as EyeIcon } from 'lucide-react';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { decode } from 'base64-arraybuffer';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  stock: number;
  is_active: boolean;
  category_id: string;
  category?: { name: string };
  description: string;
  short_description: string;
  images: string[];
  features: string[];
  box_contents: string[];
  likes_count?: number;
  shares_count?: number;
  sales_count?: number;
  created_at?: string;
}

interface Category {
  id: string;
  name: string;
}

interface DetailPage {
  id: string;
  product_id: string;
  content: string;
  is_active: boolean;
}

type TabType = 'products' | 'detail';
type SortField = 'price' | 'stock' | 'sales' | 'created_at';
type SortOrder = 'asc' | 'desc';

export default function ProductPublish() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [detailPages, setDetailPages] = useState<Record<string, DetailPage>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '', slug: '', price: '', original_price: '', stock: '', category_id: '',
    description: '', short_description: '', images: [] as string[], features: [''], box_contents: [''], is_active: true
  });
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [detailImages, setDetailImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailFileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isAuthenticated) { navigate('/admin/login'); return; }
    fetchData();
  }, [isAuthenticated, navigate, activeTab]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: productsData } = await supabase.from('products').select('*, category:categories(name)').order('created_at', { ascending: false });
    setProducts(productsData || []);
    const { data: categoriesData } = await supabase.from('categories').select('id, name').eq('is_active', true);
    setCategories(categoriesData || []);
    const { data: pagesData } = await supabase.from('product_detail_pages').select('*');
    const pagesMap: Record<string, DetailPage> = {};
    pagesData?.forEach(page => { pagesMap[page.product_id] = page; });
    setDetailPages(pagesMap);
    setLoading(false);
  };
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? p.category_id === selectedCategory : true;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    const aVal = a[sortField] || 0;
    const bVal = b[sortField] || 0;
    return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await supabase.from('products').delete().eq('id', id);
      fetchData();
    }
  };

  const handleToggleStatus = async (id: string, current: boolean) => {
    await supabase.from('products').update({ is_active: !current }).eq('id', id);
    fetchData();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      <main className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <button onClick={() => setShowForm(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            <Plus className="w-5 h-5" /><span>Add Product</span>
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex items-center space-x-4 p-4 border-b border-gray-100">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          
          {loading ? <div className="text-center py-8">Loading...</div> : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product Info</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:text-blue-600" onClick={() => handleSort('price')}>
                    Price {sortField === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:text-blue-600" onClick={() => handleSort('stock')}>
                    Total Stock {sortField === 'stock' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:text-blue-600" onClick={() => handleSort('sales')}>
                    Total Sales {sortField === 'sales' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:text-blue-600" onClick={() => handleSort('created_at')}>
                    Created At {sortField === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedProducts.map((product, index) => (
                  <tr key={product.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-full h-full p-4 text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">{product.name}</p>
                          <p className="text-xs text-gray-500 mt-1">ID:{product.id.slice(0, 18)}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">In Stock</span>
                            <button className="text-xs text-blue-600 hover:underline flex items-center">
                              <EyeIcon className="w-3 h-3 mr-1" />Preview
                            </button>
                            <button className="text-xs text-blue-600 hover:underline flex items-center">
                              <Copy className="w-3 h-3 mr-1" />Copy Link
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">${product.price}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{product.stock}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{product.sales_count || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${product.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        <span className="text-sm text-gray-700">{product.is_active ? 'Active' : 'Inactive'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(product.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="relative" ref={menuRef}>
                        <button 
                          onClick={() => setOpenMenuId(openMenuId === product.id ? null : product.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          More
                        </button>
                        {openMenuId === product.id && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[100px]"
                          >
                            <button 
                              onClick={() => { setEditingProduct(product); setShowForm(true); setOpenMenuId(null); }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => { handleToggleStatus(product.id, product.is_active); setOpenMenuId(null); }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {product.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button 
                              onClick={() => { handleDelete(product.id); setOpenMenuId(null); }}
                              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                            >
                              Delete
                            </button>
                          </motion.div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="flex items-center justify-between px-4 py-4 border-t border-gray-100">
            <span className="text-sm text-gray-600">Total {totalItems} products</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="w-8 h-8 flex items-center justify-center rounded border border-blue-500 text-blue-600 font-medium bg-blue-50">{currentPage}</span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="ml-4 px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
