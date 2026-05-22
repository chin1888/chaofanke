import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Trash2, Plus, X, GripVertical, Tag, ChevronUp, ChevronDown, Type } from 'lucide-react';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { decode } from 'base64-arraybuffer';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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
  created_at?: string;
}

interface Category {
  id: string;
  name: string;
}

export default function ProductEdit() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cnyToUsd, setCnyToUsd] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [savingSuccess, setSavingSuccess] = useState(false);

  interface DetailBlock {
    type: 'image' | 'text';
    url?: string;
    content?: string;
  }
  const [detailBlocks, setDetailBlocks] = useState<DetailBlock[]>([]);
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailSavingSuccess, setDetailSavingSuccess] = useState(false);
  const detailFileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    price: '',
    original_price: '',
    stock: '',
    category_id: '',
    description: '',
    short_description: '',
    images: [] as string[],
    features: [''],
    box_contents: [''],
    is_active: true
  });

  const { t } = useLanguage();

  useEffect(() => {
    if (!isAuthenticated) { navigate('/admin/login'); return; }
    fetchProduct();
    fetchCategories();
    fetchExchangeRate();
  }, [isAuthenticated, id]);

  const fetchExchangeRate = async () => {
    setRateLoading(true);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/CNY');
      const data = await res.json();
      if (data?.rates?.USD) setCnyToUsd(data.rates.USD);
      else setCnyToUsd(0.138);
    } catch { setCnyToUsd(0.138); }
    setRateLoading(false);
  };

  const fetchProduct = async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(name)')
      .eq('id', id)
      .single();
    if (error || !data) {
      alert('Product not found');
      navigate('/admin/products');
      return;
    }
    setProduct(data);
    const loadData = async () => {
      const currentRate = cnyToUsd || 0.138;
      setFormData({
        name: data.name,
        slug: data.slug,
        price: (data.price / currentRate).toFixed(2),
        original_price: data.original_price ? (data.original_price / currentRate).toFixed(2) : '',
        stock: data.stock.toString(),
        category_id: data.category_id || '',
        description: data.description || '',
        short_description: data.short_description || '',
        images: data.images || [],
        features: data.features?.length ? data.features : [''],
        box_contents: data.box_contents?.length ? data.box_contents : [''],
        is_active: data.is_active
      });
      // Load detail blocks
      const { data: dpData } = await supabase
        .from('product_detail_pages')
        .select('layout')
        .eq('product_id', data.id)
        .maybeSingle();
      if (dpData?.layout && Array.isArray(dpData.layout)) {
        setDetailBlocks(dpData.layout as DetailBlock[]);
      } else {
        setDetailBlocks([]);
      }
    };
    loadData();
    setLoading(false);
  };

  // Re-calculate form prices once rate loads
  useEffect(() => {
    if (cnyToUsd && product) {
      setFormData(prev => ({
        ...prev,
        price: (product!.price / cnyToUsd).toFixed(2),
        original_price: product!.original_price ? (product!.original_price / cnyToUsd).toFixed(2) : '',
      }));
    }
  }, [cnyToUsd]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name').eq('is_active', true);
    setCategories(data || []);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      try {
        const base64 = await fileToBase64(file);
        const { error: uploadError } = await supabase.storage
          .from('products').upload(fileName, decode(base64), { contentType: file.type });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
        newImages.push(publicUrl);
      } catch (error) {
        alert(`Upload failed: ${(error as Error).message}`);
      }
    }
    if (newImages.length > 0) {
      setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (idx: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= formData.images.length) return;
    const newImages = [...formData.images];
    [newImages[from], newImages[to]] = [newImages[to], newImages[from]];
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug || !formData.price) {
      alert('Please fill in required fields (Name, Slug, Price)');
      return;
    }
    setSaving(true);
    const rate = cnyToUsd || 0.138;
    const priceUsd = parseFloat((parseFloat(formData.price) * rate).toFixed(2));
    const originalPriceUsd = formData.original_price
      ? parseFloat((parseFloat(formData.original_price) * rate).toFixed(2))
      : null;

    const payload = {
      name: formData.name,
      slug: formData.slug,
      price: priceUsd,
      original_price: originalPriceUsd,
      stock: parseInt(formData.stock) || 0,
      category_id: formData.category_id || null,
      description: formData.description,
      short_description: formData.short_description,
      images: formData.images.filter(img => img.trim()),
      features: formData.features.filter(f => f.trim()),
      box_contents: formData.box_contents.filter(b => b.trim()),
      is_active: formData.is_active
    };

    const { error } = await supabase.from('products').update(payload).eq('id', id);
    if (error) {
      setSaving(false);
      alert('Save failed: ' + error.message);
      return;
    }

    // Also save detail blocks if any
    if (detailBlocks.length > 0) {
      const { error: detailError } = await supabase
        .from('product_detail_pages')
        .upsert({
          product_id: id,
          layout: detailBlocks,
          content: detailBlocks.map(b => b.type === 'text' ? b.content : '').join('\n'),
          is_active: true
        }, { onConflict: 'product_id' });
      if (detailError) {
        setSaving(false);
        alert('Product saved, but detail content failed: ' + detailError.message);
        return;
      }
    }

    setSaving(false);
    setSavingSuccess(true);
    setTimeout(() => setSavingSuccess(false), 2000);
  };

  const updateFeature = (idx: number, val: string) => {
    const newFeatures = [...formData.features];
    newFeatures[idx] = val;
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };
  const removeFeature = (idx: number) => {
    if (formData.features.length <= 1) return;
    setFormData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== idx) }));
  };
  const addFeature = () => setFormData(prev => ({ ...prev, features: [...prev.features, ''] }));

  const updateBoxContent = (idx: number, val: string) => {
    const newBoxContents = [...formData.box_contents];
    newBoxContents[idx] = val;
    setFormData(prev => ({ ...prev, box_contents: newBoxContents }));
  };
  const removeBoxContent = (idx: number) => {
    if (formData.box_contents.length <= 1) return;
    setFormData(prev => ({ ...prev, box_contents: prev.box_contents.filter((_, i) => i !== idx) }));
  };
  const addBoxContent = () => setFormData(prev => ({ ...prev, box_contents: [...prev.box_contents, ''] }));

  // Detail blocks management
  const addDetailBlock = (type: 'image' | 'text') => {
    setDetailBlocks(prev => [...prev, { type, url: type === 'image' ? '' : undefined, content: type === 'text' ? '' : undefined }]);
  };
  const removeDetailBlock = (idx: number) => {
    setDetailBlocks(prev => prev.filter((_, i) => i !== idx));
  };
  const moveDetailBlock = (from: number, to: number) => {
    if (to < 0 || to >= detailBlocks.length) return;
    const newBlocks = [...detailBlocks];
    [newBlocks[from], newBlocks[to]] = [newBlocks[to], newBlocks[from]];
    setDetailBlocks(newBlocks);
  };
  const updateDetailBlock = (idx: number, updates: Partial<DetailBlock>) => {
    setDetailBlocks(prev => prev.map((b, i) => i === idx ? { ...b, ...updates } : b));
  };
  const handleDetailImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_detail_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    try {
      const base64 = await fileToBase64(file);
      const { error: uploadError } = await supabase.storage
        .from('products').upload(fileName, decode(base64), { contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
      updateDetailBlock(idx, { url: publicUrl });
    } catch (error) {
      alert(`Upload failed: ${(error as Error).message}`);
    }
    if (detailFileInputRef.current) detailFileInputRef.current.value = '';
  };

  const handleSaveDetailBlocks = async () => {
    if (!id) return;
    setDetailSaving(true);
    const { error } = await supabase
      .from('product_detail_pages')
      .upsert({
        product_id: id,
        layout: detailBlocks,
        content: detailBlocks.map(b => b.type === 'text' ? b.content : '').join('\n'),
        is_active: true
      }, { onConflict: 'product_id' });
    setDetailSaving(false);
    if (error) {
      alert('Save detail content failed: ' + error.message);
      return;
    }
    setDetailSavingSuccess(true);
    setTimeout(() => setDetailSavingSuccess(false), 2000);
  };

  if (!isAuthenticated || loading) return null;

  const rate = cnyToUsd || 0.138;
  const previewPriceUsd = formData.price ? (parseFloat(formData.price) * rate).toFixed(2) : '0.00';
  const previewOrigUsd = formData.original_price ? (parseFloat(formData.original_price) * rate).toFixed(2) : '';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/admin/products')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Edit Product</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {formData.name || 'Untitled Product'} · ID: {id?.slice(0, 12)}...
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Exchange rate badge */}
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 text-xs text-green-700">
              {rateLoading ? 'Loading rate...' : `1 CNY = ${rate.toFixed(4)} USD`}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-white font-medium transition-all ${
                savingSuccess
                  ? 'bg-green-500'
                  : 'bg-blue-500 hover:bg-blue-600'
              } disabled:opacity-50`}
            >
              {savingSuccess ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-8">

            {/* ========== Section: Basic Info ========== */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter product name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Slug <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="product-url-slug"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Category
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={formData.category_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Status
                    </label>
                    <div className="flex items-center h-[42px] space-x-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Active</span>
                      </label>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        formData.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {formData.is_active ? 'Visible to customers' : 'Hidden from store'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ========== Section: Pricing ========== */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">Pricing</h2>
                <span className="text-xs text-gray-400 ml-2">Input in CNY, stored in USD</span>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Price (CNY) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">¥</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    {formData.price && (
                      <p className="text-sm text-green-600 mt-1.5 ml-1">
                        ≈ ${previewPriceUsd} USD
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Original Price (CNY)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">¥</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.original_price}
                        onChange={(e) => setFormData(prev => ({ ...prev, original_price: e.target.value }))}
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    {formData.original_price && previewOrigUsd && (
                      <p className="text-sm text-green-600 mt-1.5 ml-1">
                        ≈ ${previewOrigUsd} USD
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                    className="w-48 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>
            </section>

            {/* ========== Section: Description ========== */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">Description</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={formData.short_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief product summary (shown in product cards)"
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-400 mt-1">{(formData.short_description?.length || 0)}/200</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={8}
                    placeholder="Detailed product description..."
                  />
                </div>
              </div>
            </section>

            {/* ========== Section: Images ========== */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Product Images</h2>
                  <span className="text-sm text-gray-400">({formData.images.length} uploaded)</span>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Images</span>
                </button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                multiple
                className="hidden"
              />
              <div className="p-6">
                {formData.images.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
                  >
                    <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Click to upload product images</p>
                    <p className="text-sm text-gray-400 mt-1">PNG, JPG, GIF up to 5MB each</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all">
                        <img src={img} alt={`Product image ${idx + 1}`} className="w-full h-full object-cover" />
                        {/* Index badge */}
                        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                          {idx === 0 ? 'Cover' : `#${idx + 1}`}
                        </div>
                        {/* Controls */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          {idx > 0 && (
                            <button
                              onClick={() => moveImage(idx, idx - 1)}
                              className="mr-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                              title="Move left"
                            >
                              <ArrowLeft className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => removeImage(idx)}
                            className="p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {idx < formData.images.length - 1 && (
                            <button
                              onClick={() => moveImage(idx, idx + 1)}
                              className="ml-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 rotate-180"
                              title="Move right"
                            >
                              <ArrowLeft className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {/* Add more button */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
                    >
                      <Plus className="w-8 h-8 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-400">Add</span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ========== Section: Features ========== */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <Star className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">Features</h2>
                <span className="text-sm text-gray-400">({formData.features.filter(f => f.trim()).length} items)</span>
              </div>
              <div className="p-6">
                {formData.features.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-3 mb-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {idx + 1}
                    </div>
                    <input
                      type="text"
                      value={f}
                      onChange={(e) => updateFeature(idx, e.target.value)}
                      placeholder={`Feature ${idx + 1}`}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formData.features.length > 1 && (
                      <button
                        onClick={() => removeFeature(idx)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addFeature}
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 mt-2 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Feature</span>
                </button>
              </div>
            </section>

            {/* ========== Section: Box Contents ========== */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">Box Contents</h2>
                <span className="text-sm text-gray-400">({formData.box_contents.filter(b => b.trim()).length} items)</span>
              </div>
              <div className="p-6">
                {formData.box_contents.map((b, idx) => (
                  <div key={idx} className="flex items-center gap-3 mb-3">
                    <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {idx + 1}
                    </div>
                    <input
                      type="text"
                      value={b}
                      onChange={(e) => updateBoxContent(idx, e.target.value)}
                      placeholder={`Box item ${idx + 1}`}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formData.box_contents.length > 1 && (
                      <button
                        onClick={() => removeBoxContent(idx)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addBoxContent}
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 mt-2 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Box Item</span>
                </button>
              </div>
            </section>

            {/* ========== Section: Detail Content / 商品详情 ========== */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Detail Content / 商品详情</h2>
                  <span className="text-sm text-gray-400">({detailBlocks.length} blocks)</span>
                </div>
                <button
                  onClick={handleSaveDetailBlocks}
                  disabled={detailSaving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all ${
                    detailSavingSuccess ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'
                  } disabled:opacity-50`}
                >
                  {detailSavingSuccess ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      <span>Saved</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{detailSaving ? 'Saving...' : 'Save Details'}</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-6 space-y-4">
                {detailBlocks.map((block, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {block.type === 'image' ? 'Image Block' : 'Text Block'} #{idx + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveDetailBlock(idx, idx - 1)}
                          disabled={idx === 0}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
                          title="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveDetailBlock(idx, idx + 1)}
                          disabled={idx === detailBlocks.length - 1}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
                          title="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeDetailBlock(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {block.type === 'image' && (
                      <div>
                        {block.url ? (
                          <div className="relative group">
                            <img src={block.url} alt="Detail" className="w-full max-h-64 object-contain rounded-lg bg-gray-100" />
                            <button
                              onClick={() => updateDetailBlock(idx, { url: '' })}
                              className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-sm text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => detailFileInputRef.current?.click()}
                            className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 transition-colors flex flex-col items-center gap-2"
                          >
                            <Upload className="w-8 h-8 text-gray-400" />
                            <span className="text-sm text-gray-500">Click to upload image</span>
                          </button>
                        )}
                        <input
                          ref={detailFileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleDetailImageUpload(e, idx)}
                        />
                      </div>
                    )}

                    {block.type === 'text' && (
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <ReactQuill
                          theme="snow"
                          value={block.content || ''}
                          onChange={(value) => updateDetailBlock(idx, { content: value })}
                          modules={{
                            toolbar: [
                              [{ header: [1, 2, 3, false] }],
                              ['bold', 'italic', 'underline', 'strike'],
                              [{ list: 'ordered' }, { list: 'bullet' }],
                              [{ color: [] }, { background: [] }],
                              ['link', 'clean']
                            ]
                          }}
                          style={{ minHeight: '150px' }}
                        />
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex gap-3">
                  <button
                    onClick={() => addDetailBlock('image')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-sm font-medium text-gray-700 hover:text-blue-600 transition-all"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Add Image Block
                  </button>
                  <button
                    onClick={() => addDetailBlock('text')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-sm font-medium text-gray-700 hover:text-blue-600 transition-all"
                  >
                    <Type className="w-4 h-4" />
                    Add Text Block
                  </button>
                </div>
              </div>
            </section>

            {/* Bottom Save Bar */}
            <div className="sticky bottom-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 -mx-8 -mb-8 px-8 py-4 flex items-center justify-between rounded-b-xl">
              <button
                onClick={() => navigate('/admin/products')}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-white font-medium transition-all ${
                  savingSuccess ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'
                } disabled:opacity-50`}
              >
                {savingSuccess ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
