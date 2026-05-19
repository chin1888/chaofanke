import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ChevronLeft, Check, Heart, Share2, Link2, Minus, Plus, Package, Truck, Shield, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../supabase/client';
import { useCart } from '../contexts/CartContext';
import SEO from '../components/SEO';

interface Product {
  id: string;
  name: string;
  description: string;
  short_description: string;
  price: number;
  original_price: number | null;
  images: string[];
  features: string[];
  specifications: Record<string, any>;
  stock: number;
  box_contents: string[];
  likes_count: number;
  shares_count: number;
  category_id: string;
  sku: string;
  liked?: boolean;
}

interface DetailPage {
  content: string;
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [detailPage, setDetailPage] = useState<DetailPage | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [showBoxContents, setShowBoxContents] = useState(true);

  useEffect(() => {
    fetchProduct();
    recordProductView();
  }, [slug]);

  useEffect(() => {
    if (product) {
      checkIfLiked();
    }
  }, [product]);

  const recordProductView = async () => {
    if (!slug) return;
    const { data: productData } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .single();
    if (productData) {
      const userId = localStorage.getItem('user_id');
      const sessionId = localStorage.getItem('session_id') || Math.random().toString(36).substring(2);
      if (!localStorage.getItem('session_id')) {
        localStorage.setItem('session_id', sessionId);
      }
      const { data: existingView } = await supabase
        .from('product_views')
        .select('*')
        .eq('product_id', productData.id)
        .eq(userId ? 'user_id' : 'session_id', userId || sessionId)
        .maybeSingle();
      if (existingView) {
        await supabase
          .from('product_views')
          .update({
            view_count: (existingView.view_count || 0) + 1,
            last_viewed_at: new Date().toISOString()
          })
          .eq('id', existingView.id);
      } else {
        const { error: insertError } = await supabase.from('product_views').insert({
          product_id: productData.id,
          user_id: userId,
          session_id: sessionId,
          view_count: 1,
          last_viewed_at: new Date().toISOString()
        });
        if (insertError && insertError.code !== '23505') {
          console.error('Record view error:', insertError);
        }
      }
    }
  };

  const fetchProduct = async () => {
    if (!slug) return;
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single();
    if (data) {
      setProduct(data as Product);
      fetchDetailPage(data.id);
      fetchRelatedProducts(data.category_id, data.id);
    }
    setLoading(false);
  };

  const fetchDetailPage = async (productId: string) => {
    const { data } = await supabase
      .from('product_detail_pages')
      .select('content')
      .eq('product_id', productId)
      .eq('is_active', true)
      .maybeSingle();
    if (data) setDetailPage(data as DetailPage);
  };

  const fetchRelatedProducts = async (categoryId: string, currentProductId: string) => {
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price, original_price, images, short_description, likes_count, shares_count')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .neq('id', currentProductId)
      .limit(4);
    setRelatedProducts(data as Product[] || []);
  };

  const checkIfLiked = async () => {
    const userId = localStorage.getItem('user_id');
    if (!product || !userId) {
      setLiked(false);
      return;
    }
    const { data } = await supabase
      .from('product_likes')
      .select('*')
      .eq('product_id', product.id)
      .eq('user_id', userId)
      .maybeSingle();
    setLiked(!!data);
  };

  const [likeLoading, setLikeLoading] = useState(false);

  const handleLike = async () => {
    if (!product || likeLoading) return;
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      alert('Please login to like');
      return;
    }
    setLikeLoading(true);
    const username = localStorage.getItem('username') || '默认用户';
    try {
      const { data: existingLike } = await supabase
        .from('product_likes')
        .select('*')
        .eq('product_id', product.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingLike) {
        const { error } = await supabase.from('product_likes').delete().eq('product_id', product.id).eq('user_id', userId);
        if (error) {
          console.error('Delete error:', error);
        } else {
          const { count } = await supabase.from('product_likes').select('*', { count: 'exact', head: true }).eq('product_id', product.id);
          setProduct(prev => prev ? { ...prev, likes_count: count || 0 } : null);
          setLiked(false);
        }
      } else {
        const { error } = await supabase.from('product_likes').insert({ product_id: product.id, user_id: userId, username });
        if (error) {
          console.error('Insert error:', error);
        } else {
          const { count } = await supabase.from('product_likes').select('*', { count: 'exact', head: true }).eq('product_id', product.id);
          setProduct(prev => prev ? { ...prev, likes_count: count || 0 } : null);
          setLiked(true);
        }
      }
    } finally {
      setLikeLoading(false);
    }
  };

  const handleShare = async (platform: string) => {
    if (!product) return;
    const userId = localStorage.getItem('user_id') || 'anonymous';
    const username = localStorage.getItem('username') || '默认用户';
    await supabase.from('product_shares').insert({ product_id: product.id, platform, user_id: userId, username });
    setProduct({ ...product, shares_count: (product.shares_count || 0) + 1 });
    setShowShareMenu(false);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    handleShare('copy');
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem({ id: product.id, name: product.name, price: product.price, image: product.images?.[0] || '', quantity });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
        <button onClick={() => navigate('/products')} className="flex items-center text-gray-600 hover:text-gray-900">
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SEO title={`${product.name} - ALWAHA`} description={product.short_description} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-gray-900">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-gray-900">Products</Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="aspect-square bg-gray-50 rounded-2xl overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.img key={selectedImage} src={product.images?.[selectedImage] || 'https://via.placeholder.com/600'} alt={product.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="w-full h-full object-cover" />
              </AnimatePresence>
            </motion.div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <motion.button key={idx} onClick={() => setSelectedImage(idx)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${selectedImage === idx ? 'border-gray-900 ring-2 ring-gray-900/20' : 'border-gray-200 hover:border-gray-400'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-500 mb-2">SKU: {product.sku || 'N/A'}</p>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">{product.name}</h1>
              <p className="text-gray-600 text-lg leading-relaxed">{product.short_description}</p>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-gray-900">€{product.price}</span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-xl text-gray-400 line-through">€{product.original_price}</span>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Variant</label>
                <div className="flex gap-3">
                  {['Standard', 'Deluxe'].map((variant) => (
                    <motion.button key={variant} onClick={() => setSelectedVariant(variant)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={`px-6 py-3 rounded-xl border-2 font-medium transition-all ${selectedVariant === variant ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 hover:border-gray-400'}`}>
                      {variant}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border-2 border-gray-900 rounded-xl">
                    <motion.button onClick={() => setQuantity(Math.max(1, quantity - 1))} whileTap={{ scale: 0.9 }} className="px-4 py-3 hover:bg-gray-100 transition-colors">
                      <Minus className="w-4 h-4" />
                    </motion.button>
                    <span className="px-6 py-3 font-semibold text-lg min-w-[60px] text-center">{quantity}</span>
                    <motion.button onClick={() => setQuantity(quantity + 1)} whileTap={{ scale: 0.9 }} className="px-4 py-3 hover:bg-gray-100 transition-colors">
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  </div>
                  <span className="text-sm text-gray-500">Stock: {product.stock} pcs</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button onClick={handleAddToCart} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-800 transition-colors">
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </motion.button>
              <motion.button onClick={handleLike} disabled={likeLoading} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 transition-all ${liked ? 'bg-red-50 border-red-500 text-red-600' : 'border-gray-300 hover:border-gray-400'} ${likeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} />
                <span className="text-sm font-medium">{product.likes_count || 0}</span>
              </motion.button>
              <div className="relative">
                <motion.button onClick={() => setShowShareMenu(!showShareMenu)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 border-gray-300 hover:border-gray-400 transition-all">
                  <Share2 className="w-6 h-6" />
                  <span className="text-sm font-medium">{product.shares_count || 0}</span>
                </motion.button>
                <AnimatePresence>
                  {showShareMenu && (
                    <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-20 min-w-[160px]">
                      <button onClick={() => handleShare('wechat')} className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg text-sm">WeChat</button>
                      <button onClick={() => handleShare('weibo')} className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg text-sm">Weibo</button>
                      <button onClick={copyLink} className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg text-sm flex items-center gap-2">
                        <Link2 className="w-4 h-4" />
                        {copied ? 'Copied' : 'Copy Link'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 py-6 border-y border-gray-200">
              <div className="flex flex-col items-center text-center gap-2">
                <Truck className="w-6 h-6 text-gray-600" />
                <span className="text-sm text-gray-600">Free Shipping</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <Shield className="w-6 h-6 text-gray-600" />
                <span className="text-sm text-gray-600">2 Year Warranty</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <RotateCcw className="w-6 h-6 text-gray-600" />
                <span className="text-sm text-gray-600">30 Day Returns</span>
              </div>
            </div>

            {product.box_contents && product.box_contents.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setShowBoxContents(!showBoxContents)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-gray-600" />
                    <span className="font-semibold text-gray-900">Box Contents</span>
                  </div>
                  {showBoxContents ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                </button>
                <AnimatePresence>
                  {showBoxContents && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4">
                        <ul className="space-y-2">
                          {product.box_contents.map((item, idx) => (
                            <li key={idx} className="flex items-center text-gray-600">
                              <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {detailPage?.content && (
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-16 border-t pt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Product Details</h2>
            <div className="bg-gray-50 rounded-2xl p-8 lg:p-12">
              <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-strong:text-gray-900" dangerouslySetInnerHTML={{ __html: detailPage.content }} />
            </div>
          </motion.div>
        )}

        {relatedProducts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-16 border-t pt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((item) => (
                <Link key={item.id} to={`/products/${item.slug}`} className="group bg-white rounded-lg shadow-sm overflow-hidden">
                  <motion.div whileHover={{ y: -4 }} className="aspect-square bg-gray-100 overflow-hidden">
                    {item.images && item.images.length > 0 ? (
                      <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                  </motion.div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-1">{item.name}</h3>
                    <p className="text-gray-900 font-semibold mt-2">€{item.price}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {item.likes_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="w-4 h-4" />
                        {item.shares_count || 0}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
