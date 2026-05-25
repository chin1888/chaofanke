import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, ArrowLeft, Image as ImageIcon, Upload, X, Package, ShoppingCart, Users, Star, LogOut, TrendingUp, FileText, CreditCard, LayoutDashboard, BarChart3 } from 'lucide-react';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { decode } from 'base64-arraybuffer';

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  images?: string[];
  link_url: string;
  position: string;
  sort_order: number;
  is_active: boolean;
}
export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    images: [] as string[],
    link_url: '',
    position: 'home',
    sort_order: 0,
    is_active: true
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    fetchBanners();
  }, [isAuthenticated, navigate]);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin-banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setBanners(data.banners || []);
      } else {
        const { data } = await supabase.from('banners').select('*').order('sort_order');
        setBanners(data || []);
      }
    } catch {
      const { data } = await supabase.from('banners').select('*').order('sort_order');
      setBanners(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      image_url: formData.images.join(','),
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { images, ...dbPayload } = payload as any;
    if (editingBanner) {
      await supabase.from('banners').update(dbPayload).eq('id', editingBanner.id);
    } else {
      await supabase.from('banners').insert([dbPayload]);
    }
    setShowModal(false);
    setEditingBanner(null);
    fetchBanners();
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `banners/${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      try {
        const base64 = await fileToBase64(file);
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, decode(base64), { contentType: file.type });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(fileName);

        newImages.push(publicUrl);
      } catch (error) {
        console.error('Upload failed:', error);
        alert(t('products.uploadFailed') + (error as Error).message);
      }
    }

    if (newImages.length > 0) {
      setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    setFormData(prev => {
      const newImages = [...prev.images];
      if (direction === 'left' && index > 0) {
        [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
      } else if (direction === 'right' && index < newImages.length - 1) {
        [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      }
      return { ...prev, images: newImages };
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('banners.confirmDelete'))) {
      await supabase.from('banners').delete().eq('id', id);
      fetchBanners();
    }
  };

  const openEdit = (banner: Banner) => {
    setEditingBanner(banner);
    const parsedImages = banner.image_url
      ? banner.image_url.split(',').map(u => u.trim()).filter(Boolean)
      : [];
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      image_url: banner.image_url,
      images: parsedImages,
      link_url: banner.link_url || '',
      position: banner.position || 'home',
      sort_order: banner.sort_order || 0,
      is_active: banner.is_active ?? true
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingBanner(null);
    setFormData({ title: '', subtitle: '', image_url: '', images: [], link_url: '', position: 'home', sort_order: 0, is_active: true });
    setShowModal(true);
  };
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      <main className="flex-1 overflow-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('banners.title')}</h1>
          <button
            onClick={openCreate}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Plus className="w-5 h-5" />
            <span>{t('banners.addBanner')}</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">{t('common.loading')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner) => {
              const bannerImages = banner.image_url
                ? banner.image_url.split(',').map(u => u.trim()).filter(Boolean)
                : [];
              return (
                <motion.div
                  key={banner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-sm overflow-hidden"
                >
                  <div className="relative h-48 bg-gray-100">
                    {bannerImages.length > 0 ? (
                      <img src={bannerImages[0]} alt={banner.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                    {banner.is_active && (
                      <span className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs rounded">{t('common.active')}</span>
                    )}
                    {bannerImages.length > 1 && (
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded">
                        {bannerImages.length} {t('products.imagesCount')}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900">{banner.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{banner.subtitle}</p>
                    <p className="text-sm text-gray-400 mt-2">{t('banners.sortOrderLabel')}: {banner.sort_order}</p>
                    <div className="flex items-center justify-end space-x-2 mt-4">
                      <button onClick={() => openEdit(banner)} className="p-2 text-blue-500 hover:bg-blue-50 rounded">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(banner.id)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{editingBanner ? t('banners.editBanner') : t('banners.addBanner')}</h2>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('banners.titleLabel')}</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('banners.subtitleLabel')}</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('banners.imageUrl')}</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />

                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative group aspect-square">
                          <img src={img} alt={`Banner ${idx + 1}`} className="w-full h-full object-cover rounded-lg border" />
                          {idx === 0 && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-blue-500 text-white text-[10px] rounded">{t('common.cover')}</span>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 rounded-lg">
                            <button
                              type="button"
                              onClick={() => moveImage(idx, 'left')}
                              disabled={idx === 0}
                              className="p-1 bg-white rounded hover:bg-gray-100 disabled:opacity-30"
                              title={t('common.moveLeft')}
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveImage(idx, 'right')}
                              disabled={idx === formData.images.length - 1}
                              className="p-1 bg-white rounded hover:bg-gray-100 disabled:opacity-30"
                              title={t('common.moveRight')}
                            >
                              <Edit2 className="w-3 h-3 rotate-180" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                              title={t('common.delete')}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <span className="text-sm text-gray-500">{t('common.uploading')}</span>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-600">{t('products.clickToUploadImages')}</span>
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-400 mt-1">{t('banners.imageUploadHint')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('banners.link')}</label>
                  <input
                    type="text"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('banners.sortOrderLabel')}</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <label className="text-sm">{t('common.active')}</label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    {t('common.save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
