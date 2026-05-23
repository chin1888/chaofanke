import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, Image as ImageIcon, X, Upload, Package, ShoppingCart, Users, Star, LogOut, TrendingUp, FileText, CreditCard, LayoutDashboard, BarChart3 } from 'lucide-react';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { decode } from 'base64-arraybuffer';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    sort_order: 0,
    is_active: true
  });
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    fetchCategories();
  }, [isAuthenticated, navigate]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      } else {
        const { data } = await supabase.from('categories').select('*').order('sort_order');
        setCategories(data || []);
      }
    } catch {
      const { data } = await supabase.from('categories').select('*').order('sort_order');
      setCategories(data || []);
    }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `category_${Date.now()}.${fileExt}`;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const { error: uploadError } = await supabase.storage.from('categories').upload(fileName, decode(base64), { contentType: file.type });
          if (uploadError) {
            alert(t('categories.uploadFailed') + ': ' + uploadError.message);
          } else {
            const { data: { publicUrl } } = supabase.storage.from('categories').getPublicUrl(fileName);
            setFormData(prev => ({ ...prev, image_url: publicUrl }));
          }
        } catch (err) {
          alert(t('categories.uploadFailed'));
        }
        setUploading(false);
      };
      reader.onerror = () => {
        alert(t('categories.uploadFailed'));
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert(t('categories.uploadFailed'));
      setUploading(false);
    }
  };

  const moveCategory = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;
    const newCategories = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];
    const updates = newCategories.map((cat, idx) => ({ id: cat.id, sort_order: idx }));
    for (const update of updates) {
      await supabase.from('categories').update({ sort_order: update.sort_order }).eq('id', update.id);
    }
    setCategories(newCategories);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      await supabase.from('categories').update(formData).eq('id', editingCategory.id);
    } else {
      await supabase.from('categories').insert([formData]);
    }
    setShowModal(false);
    setEditingCategory(null);
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('categories.confirmDelete'))) {
      await supabase.from('categories').delete().eq('id', id);
      fetchCategories();
    }
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url || '',
      sort_order: category.sort_order || 0,
      is_active: category.is_active ?? true
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '', description: '', image_url: '', sort_order: categories.length, is_active: true });
    setShowModal(true);
  };
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold">{t('categories.title')}</h1>
            <button onClick={openCreate} className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
              <Plus className="w-4 h-4" />
              <span>{t('categories.addCategory')}</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('categories.image')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('categories.name')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('categories.slug')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('categories.sortOrder')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('categories.status')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('categories.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((category, index) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      {category.image_url ? (
                        <img src={category.image_url} alt="" className="w-12 h-12 object-cover rounded-lg" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium">{category.name}</td>
                    <td className="px-6 py-4 text-gray-500">{category.slug}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm">{category.sort_order}</span>
                        <button onClick={() => moveCategory(index, 'up')} disabled={index === 0} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30">
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button onClick={() => moveCategory(index, 'down')} disabled={index === categories.length - 1} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30">
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${category.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {category.is_active ? t('common.active') : t('common.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => openEdit(category)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(category.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-bold mb-4">{editingCategory ? t('categories.editCategory') : t('categories.addCategory')}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('categories.name')}</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('categories.slug')}</label>
                  <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('categories.description')}</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('categories.categoryImage')}</label>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                  {formData.image_url ? (
                    <div className="relative mb-3">
                      <img src={formData.image_url} alt="预览" className="w-full h-48 object-cover rounded-lg border" />
                      <button onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">{uploading ? t('common.uploading') : t('categories.clickUpload')}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('categories.sortOrder')}</label>
                  <input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                  <label className="text-sm">{t('common.active')}</label>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">{t('common.cancel')}</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">{t('common.save')}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
