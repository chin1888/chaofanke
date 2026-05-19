import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ArrowLeft, X, Upload, Trash2, MoreHorizontal, Eye, Link2, LayoutDashboard, BarChart3, Users, Package, Image, Grid3X3, MessageSquare, CreditCard, TrendingUp, FileText, ShoppingCart, Star } from 'lucide-react';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
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
  likes_count?: number;
  shares_count?: number;
  sales_count?: number;
  created_at?: string;
}

interface Category {
  id: string;
  name: string;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    fetchProducts();
    fetchCategories();
  }, [isAuthenticated, navigate]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(name)')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('fetchProducts error:', error);
      }
      setProducts(data || []);
    } catch (err) {
      console.error('fetchProducts catch:', err);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name').eq('is_active', true);
    setCategories(data || []);
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
      const fileName = `${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

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
        alert(`"${file.name}" Upload failed: ${(error as Error).message}`);
      }
    }

    if (newImages.length > 0) {
      setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (idx: number) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== idx) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      slug: formData.slug,
      price: parseFloat(formData.price),
      original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      stock: parseInt(formData.stock),
      category_id: formData.category_id || null,
      description: formData.description,
      short_description: formData.short_description,
      images: formData.images.filter(img => img.trim()),
      features: formData.features.filter(f => f.trim()),
      box_contents: formData.box_contents.filter(b => b.trim()),
      is_active: formData.is_active
    };

    if (editingProduct) {
      await supabase.from('products').update(payload).eq('id', editingProduct.id);
      alert('Product updated');
      fetchProducts();
    } else {
      await supabase.from('products').insert([payload]);
      fetchProducts();
    }
    setShowForm(false);
    setEditingProduct(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      price: '',
      original_price: '',
      stock: '',
      category_id: '',
      description: '',
      short_description: '',
      images: [],
      features: [''],
      box_contents: [''],
      is_active: true
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    fetchProducts();
  };

  const handleToggleStatus = async (product: Product) => {
    const newStatus = !product.is_active;
    const { error } = await supabase
      .from('products')
      .update({ is_active: newStatus })
      .eq('id', product.id);

    if (error) {
      alert('Operation failed: ' + error.message);
      return;
    }

    fetchProducts();
  };

  const openCreate = () => {
    setEditingProduct(null);
    resetForm();
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      price: product.price.toString(),
      original_price: product.original_price?.toString() || '',
      stock: product.stock.toString(),
      category_id: product.category_id || '',
      description: product.description || '',
      short_description: product.short_description || '',
      images: product.images || [],
      features: product.features?.length ? product.features : [''],
      box_contents: product.box_contents?.length ? product.box_contents : [''],
      is_active: product.is_active
    });
    setShowForm(true);
  };

  const addFeatureField = () => setFormData({ ...formData, features: [...formData.features, ''] });
  const removeFeatureField = (idx: number) => setFormData({ ...formData, features: formData.features.filter((_, i) => i !== idx) });
  const updateFeature = (idx: number, val: string) => {
    const newFeatures = [...formData.features];
    newFeatures[idx] = val;
    setFormData({ ...formData, features: newFeatures });
  };

  const addBoxContentField = () => setFormData({ ...formData, box_contents: [...formData.box_contents, ''] });
  const removeBoxContentField = (idx: number) => setFormData({ ...formData, box_contents: formData.box_contents.filter((_, i) => i !== idx) });
  const updateBoxContent = (idx: number, val: string) => {
    const newBoxContents = [...formData.box_contents];
    newBoxContents[idx] = val;
    setFormData({ ...formData, box_contents: newBoxContents });
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProducts = filteredProducts.length;
  const totalPages = Math.ceil(totalProducts / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { name: 'Overview', icon: FileText, path: '/admin/user-stats' },
    { name: 'Traffic', icon: TrendingUp, path: '/admin/traffic-stats' },
    { name: 'Sales', icon: ShoppingCart, path: '/admin/orders' },
    { name: 'Products', icon: Package, path: '/admin/products' },
    { name: 'Banners', icon: Image, path: '/admin/banners' },
    { name: 'Categories', icon: BarChart3, path: '/admin/categories' },
    { name: 'Users', icon: Users, path: '/admin/users' },
    { name: 'Reviews', icon: Star, path: '/admin/reviews' },
    { name: 'Payments', icon: CreditCard, path: '/admin/payment-gateways' },
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
            onClick={() => navigate('/admin/login')}
            className="w-full flex items-center space-x-3 px-4 py-2 text-gray-600 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-200 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Product Management</h1>
          </div>
          <button onClick={openCreate} className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : (
            <div className="divide-y divide-gray-200">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-sm font-medium text-gray-600">
                <div className="col-span-4">Product Info</div>
                <div className="col-span-1 text-center">Price</div>
                <div className="col-span-1 text-center">Stock</div>
                <div className="col-span-1 text-center">Sales</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-2 text-center">Created At</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              {paginatedProducts.map((product) => (
                <div key={product.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50">
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-gray-400 text-xs">No Image</div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-xs text-gray-500 mt-1">ID:{product.id.slice(0, 8)}...</div>
                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">In Stock</span>
                        <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                          <Eye className="w-3 h-3" /> Preview
                        </button>
                        <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                          <Link2 className="w-3 h-3" /> Copy Link
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-1 text-center text-gray-900">€{product.price}</div>
                  <div className="col-span-1 text-center text-gray-900">{product.stock}</div>
                  <div className="col-span-1 text-center text-gray-900">{product.sales_count || 0}</div>
                  <div className="col-span-1 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${product.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      <span className="text-sm text-gray-600">{product.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  <div className="col-span-2 text-center text-sm text-gray-500">
                    {product.created_at ? new Date(product.created_at).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\//g, '/') : '-'}
                  </div>
                  <div className="col-span-2 text-right">
                    <div className="relative group inline-block">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        More
                      </button>
                      <div className="absolute right-0 top-full mt-1 w-28 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <button
                          onClick={() => openEdit(product)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(product)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {product.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Total {totalProducts} items</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 px-2">
                Page {currentPage} of {totalPages || 1}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => { setShowForm(false); resetForm(); }}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
                <button onClick={() => { setShowForm(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Product Name *</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Slug *</label>
                    <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Price *</label>
                    <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Original Price</label>
                    <input type="number" step="0.01" value={formData.original_price} onChange={(e) => setFormData({ ...formData, original_price: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Stock *</label>
                    <input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">Select Category</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Short Description</label>
                  <input type="text" value={formData.short_description} onChange={(e) => setFormData({ ...formData, short_description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={4} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Product Images</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <div className="border border-gray-200 rounded-lg p-4 mb-3 min-h-[120px]">
                    {formData.images.length === 0 ? (
                      <div className="text-gray-400 text-center py-8">No images</div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {formData.images.map((img, idx) => (
                          <div key={idx} className="relative w-24 h-24 group">
                            <img src={img} alt={`Product image ${idx + 1}`} className="w-full h-full object-cover rounded-lg border border-gray-200" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96?text=Error'; }} />
                            <button
                              onClick={() => removeImage(idx)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                              title="Delete Image"
                            >
                              ×
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 text-center rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              Image {idx + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{uploading ? 'Uploading...' : 'Upload Images'}</span>
                    </button>
                    <span className="text-sm text-gray-500">{formData.images.length} images uploaded</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Features</label>
                  {formData.features.map((f, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input type="text" value={f} onChange={(e) => updateFeature(idx, e.target.value)} placeholder="Feature description" className="flex-1 px-3 py-2 border rounded-lg" />
                      {formData.features.length > 1 && <button onClick={() => removeFeatureField(idx)} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  ))}
                  <button onClick={addFeatureField} className="text-sm text-blue-600 hover:text-blue-700">+ Add Feature</button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Box Contents</label>
                  {formData.box_contents.map((b, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input type="text" value={b} onChange={(e) => updateBoxContent(idx, e.target.value)} placeholder="Item name" className="flex-1 px-3 py-2 border rounded-lg" />
                      {formData.box_contents.length > 1 && <button onClick={() => removeBoxContentField(idx)} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  ))}
                  <button onClick={addBoxContentField} className="text-sm text-blue-600 hover:text-blue-700">+ Add Item</button>
                </div>

                <div className="flex items-center space-x-2">
                  <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                  <label className="text-sm">Active</label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">Save</button>
                </div>
              </form>
          </div>
        </div>
      )}
    </div>
  );
}
