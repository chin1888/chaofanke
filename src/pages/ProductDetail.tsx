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

interface DetailBlock {
  type: 'image' | 'text';
  url?: string;
  content?: string;
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [detailPage, setDetailPage] = useState<DetailPage | null>(null);
  const [detailBlocks, setDetailBlocks] = useState<DetailBlock[]>([]);
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
    try {
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
    } catch (err) {
      console.error('recordProductView error:', err);
    }
  };

  const fetchProduct = async () => {
    if (!slug) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single();
      if (error) {
        console.error('fetchProduct error:', error);
      } else if (data) {
        setProduct(data as Product);
        fetchDetailPage(data.id);
        fetchRelatedProducts(data.category_id, data.id);
      }
    } catch (err) {
      console.error('fetchProduct exception:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailPage = async (productId: string) => {
    try {
      const { data } = await supabase
        .from('product_detail_pages')
        .select('content, layout')
        .eq('product_id', productId)
        .eq('is_active', true)
        .maybeSingle();
      if (data) {
        setDetailPage(data as DetailPage);
        const blocks = (data as any).layout;
        if (Array.isArray(blocks)) {
          setDetailBlocks(blocks as DetailBlock[]);
        }
      }
    } catch (err) {
      console.error('fetchDetailPage error:', err);
    }
  };

  const fetchRelatedProducts = async (categoryId: string, currentProductId: string) => {
    try {
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, price, original_price, images, short_description, likes_count, shares_count')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .neq('id', currentProductId)
        .limit(4);

      // Get real-time counts
      const productsWithRealCounts = await Promise.all(
        (data || []).map(async (product) => {
          const [{ count: likesCount }, { count: sharesCount }] = await Promise.all([
            supabase.from('product_likes').select('*', { count: 'exact', head: true }).eq('product_id', product.id),
            supabase.from('product_shares').select('*', { count: 'exact', head: true }).eq('product_id', product.id)
          ]);
          return {
            ...product,
            likes_count: likesCount ?? product.likes_count ?? 0,
            shares_count: sharesCount ?? product.shares_count ?? 0
          };
        })
      );
      setRelatedProducts(productsWithRealCounts as Product[]);
    } catch (err) {
      console.error('fetchRelatedProducts error:', err);
    }
  };

  const checkIfLiked = async () => {
    try {
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
    } catch (err) {
      console.error('checkIfLiked error:', err);
      setLiked(false);
    }
  };

  const [likeLoading, setLikeLoading] = useState(false);

  const handleLike = async () => {
    if (!product || likeLoading) return;
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      navigate('/login');
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
          // Also remove from user_favorites
          await supabase.from('user_favorites').delete()
            .eq('product_id', product.id)
            .eq('user_id', userId);
          const { count, error: countError } = await supabase.from('product_likes').select('*', { count: 'exact', head: true }).eq('product_id', product.id);
          if (countError) console.error('Count error:', countError);
          const newCount = count || 0;
          // Sync to products table so count persists across page loads
          await supabase.from('products').update({ likes_count: newCount }).eq('id', product.id);
          setProduct(prev => prev ? { ...prev, likes_count: newCount } : null);
          setLiked(false);
        }
      } else {
        const { error } = await supabase.from('product_likes').insert({ product_id: product.id, user_id: userId, username });
        if (error) {
          console.error('Insert error:', error);
        } else {
          // Also add to user_favorites
          await supabase.from('user_favorites').insert({
            user_id: userId,
            product_id: product.id
          });
          const { count, error: countError } = await supabase.from('product_likes').select('*', { count: 'exact', head: true }).eq('product_id', product.id);
          if (countError) console.error('Count error:', countError);
          const newCount = count || 0;
          // Sync to products table so count persists across page loads
          await supabase.from('products').update({ likes_count: newCount }).eq('id', product.id);
          setProduct(prev => prev ? { ...prev, likes_count: newCount } : null);
          setLiked(true);
        }
      }
    } catch (err) {
      console.error('handleLike error:', err);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleShare = async (platform: string) => {
    if (!product) return;
    const userId = localStorage.getItem('user_id') || 'anonymous';
    const username = localStorage.getItem('username') || '默认用户';
    const shareUrl = `${window.location.origin}/products/${product.slug}`;
    const shareText = `${product.name} - ${product.short_description}`;

    try {
      // Record share in database
      await supabase.from('product_shares').insert({ product_id: product.id, platform, user_id: userId, username });
      const newSharesCount = (product.shares_count || 0) + 1;
      // Sync to products table
      await supabase.from('products').update({ shares_count: newSharesCount }).eq('id', product.id);
      setProduct(prev => prev ? { ...prev, shares_count: newSharesCount } : null);
    } catch (err) {
      console.error('handleShare error:', err);
    }

    // Actually open share dialog
    switch (platform) {
      case 'wechat':
        // Copy share text for WeChat
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        alert('Link copied! Paste it in WeChat to share.');
        break;
      case 'weibo':
        window.open(`https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
        break;
      default:
        break;
    }
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
      <SEO title={`${product.name} - E-Hookan`} description={product.short_description} />
      
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
              <span className="text-4xl font-bold text-gray-900">${product.price}</span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-xl text-gray-400 line-through">${product.original_price}</span>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-200">
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
                      <button onClick={() => handleShare('wechat')} className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#07C160"><path d="M8.5 11.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm7 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM12 2C6.48 2 2 6.03 2 11c0 2.76 1.36 5.22 3.5 6.83V22l4.07-2.24c.76.21 1.57.35 2.43.35 5.52 0 10-4.03 10-9s-4.48-9-10-9z"/></svg>
                        WeChat
                      </button>
                      <button onClick={() => handleShare('weibo')} className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#E6162D"><path d="M10.6 5.35c-.07-.62.33-1.17.98-1.17.4 0 .78.21.98.62.73 1.57 2.11 2.78 3.83 3.21 1.23.3 2.52-.26 3.01-1.35.19-.41.26-.86.19-1.31-.38-2.56-2.64-4.44-5.26-4.44-1.55 0-3.02.73-3.96 1.91-.19.23-.31.5-.31.79 0 .69.56 1.25 1.25 1.25.31 0 .6-.12.83-.32.36-.34.55-.8.55-1.28.04-.59-.26-1.13-.76-1.44-.07-.04-.12-.1-.12-.18 0-.1.1-.18.21-.18.52-.04 1.02.17 1.37.55.34.38.53.87.53 1.38 0 .52-.19 1.01-.54 1.38-.35.37-.81.59-1.3.59-.49 0-.96-.21-1.3-.58-.35-.37-.54-.86-.54-1.38 0-.24.04-.48.13-.71.04-.09.13-.15.23-.15.12 0 .2.09.2.2z"/></svg>
                        Weibo
                      </button>
                      <button onClick={() => handleShare('facebook')} className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        Facebook
                      </button>
                      <button onClick={() => handleShare('twitter')} className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1DA1F2"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                        Twitter / X
                      </button>
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

        {/* ========== Product Detail Content / 商品详情 ========== */}
        {detailBlocks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 bg-gray-900 rounded-full" />
              <h2 className="text-2xl font-bold text-gray-900">Product Details</h2>
            </div>
            <div className="space-y-8">
              {detailBlocks.map((block, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                >
                  {block.type === 'image' && block.url && (
                    <div className="rounded-2xl overflow-hidden bg-gray-50">
                      <img src={block.url} alt="Product detail" className="w-full h-auto object-contain" />
                    </div>
                  )}
                  {block.type === 'text' && block.content && (
                    <div
                      className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-strong:text-gray-900 prose-li:text-gray-600"
                      dangerouslySetInnerHTML={{ __html: block.content }}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

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
                    <p className="text-gray-900 font-semibold mt-2">${item.price}</p>
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
