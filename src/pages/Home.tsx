import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Zap, Sparkles, Leaf, Truck, ShoppingCart, TrendingUp } from 'lucide-react';
import { supabase } from '../supabase/client';
import SEO from '../components/SEO';
import AgeVerificationModal from '../components/AgeVerificationModal';
import LanguageSelector from '../components/LanguageSelector';
import { useCart } from '../contexts/CartContext';

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string;
}

interface Review {
  id: string;
  customer_name: string;
  location: string;
  rating: number;
  content: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  images: string[];
  short_description: string;
  sales_count: number;
}

export default function Home() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [hotProducts, setHotProducts] = useState<Product[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [currentReview, setCurrentReview] = useState(0);
  const [showAgeModal, setShowAgeModal] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    const verified = localStorage.getItem('age_verified');
    if (!verified) setShowAgeModal(true);
  }, []);

  const handleAgeConfirm = () => {
    localStorage.setItem('age_verified', 'true');
    setShowAgeModal(false);
  };

  const handleAgeDeny = () => {
    window.location.href = 'https://www.baidu.com';
  };

  useEffect(() => {
    fetchBanners();
    fetchCategories();
    fetchReviews();
    fetchHotProducts();
  }, []);

  const fetchBanners = async () => {
    const { data } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (data) setBanners(data);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (data) setCategories(data);
  };

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false });
    if (data) setReviews(data);
  };

  const fetchHotProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('sales_count', { ascending: false })
      .limit(4);
    if (data) setHotProducts(data);
  };

  const nextBanner = () => setCurrentBanner((prev) => (prev + 1) % banners.length);
  const prevBanner = () => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  const nextReview = () => setCurrentReview((prev) => (prev + 1) % reviews.length);
  const prevReview = () => setCurrentReview((prev) => (prev - 1 + reviews.length) % reviews.length);

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '',
    });
  };

  const features = [
    { icon: Zap, title: 'AM SCHNELLSTEN', desc: 'Mit ALWAHA verbringst Du weniger Zeit mit Warten' },
    { icon: Sparkles, title: 'AM SAUBERSTEN', desc: 'Ohne die Mühe mit Kohle ist ALWAHA die sauberste Art' },
    { icon: Leaf, title: 'VOLLER GENUSS', desc: 'Tauche ein in eine Geschmackswelt mit erstklassiger Molasse' },
    { icon: Truck, title: 'MAXIMALE VIELSEITIGKEIT', desc: 'ALWAHA ist für einfache Mobilität gemacht' },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ALWAHA',
    description: 'Premium Elektro-Shisha ohne Kompromisse',
    url: '/',
    logo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200',
    sameAs: [
      'https://facebook.com/ooka',
      'https://instagram.com/ooka',
      'https://twitter.com/ooka'
    ]
  };

  return (
    <>
      <SEO
        title="ALWAHA - Premium Electric Shisha without Compromises"
        description="German premium electric shisha brand, first carbon-free shisha, 5-minute quick start, 94% less harmful substances. Explore devices, pods and accessories."
        keywords="ALWAHA,electric shisha,shisha,carbon-free,premium,device,pods,German brand"
      />
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      {showAgeModal && <AgeVerificationModal onConfirm={handleAgeConfirm} onDeny={handleAgeDeny} />}
      <div className="bg-white">
        <div className="fixed top-4 right-4 z-40">
          <LanguageSelector />
        </div>
        <section className="relative h-[600px] overflow-hidden">
          {banners.map((banner, index) => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: index === currentBanner ? 1 : 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${banner.image_url})` }}
              />
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute inset-0 flex items-center justify-center text-center text-white">
                <div className="max-w-2xl px-4">
                  <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl md:text-6xl font-bold mb-4"
                  >
                    {banner.title}
                  </motion.h1>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg md:text-xl mb-8"
                  >
                    {banner.subtitle}
                  </motion.p>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Link
                      to={banner.link_url}
                      className="inline-block bg-white text-gray-900 px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
                    >
                      Explore Now
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
          <button
            onClick={prevBanner}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextBanner}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </section>

        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-sm text-gray-500 mb-2">VON DER WELTWEITEN #1</p>
              <h2 className="text-3xl font-bold text-gray-900">DARUM IST ALWAHA BESSER</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center p-6"
                >
                  <feature.icon className="w-12 h-12 mx-auto mb-4 text-gray-900" />
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-500 text-sm">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Explore Our Products</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link
                    to={`/products?category=${category.slug}`}
                    className="group relative block aspect-[4/5] overflow-hidden rounded-2xl"
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                      style={{ backgroundImage: `url(${category.image_url || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'})` }}
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <h3 className="text-2xl font-bold text-white">{category.name}</h3>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {hotProducts.length > 0 && (
          <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-red-500" />
                  <p className="text-sm text-red-500 font-medium">BESTSELLER</p>
                </div>
                  <h2 className="text-3xl font-bold text-gray-900">Hot Products</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {hotProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-lg shadow-sm overflow-hidden group"
                  >
                    <Link to={`/products/${product.slug}`} className="block">
                      <div className="aspect-square bg-gray-100 overflow-hidden relative">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-contain bg-white group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100"><span>No Image</span></div>';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                            <span>No Image</span>
                          </div>
                        )}
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          HOT
                        </div>
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link to={`/products/${product.slug}`}>
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
                      </Link>
                      <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                        {product.short_description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900">
                            €{product.price}
                          </span>
                          {product.original_price && (
                            <span className="text-sm text-gray-400 line-through">
                              €{product.original_price}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="text-center mt-10">
                <Link
                  to="/products"
                  className="inline-block bg-gray-900 text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
                >
                  View All Products
                </Link>
              </div>
            </div>
          </section>
        )}

        <section className="py-20 bg-gray-900 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-sm text-gray-400 mb-2">DAS SAGEN DIE ALWAHA-FANS</p>
            </div>
            {reviews.length > 0 && (
              <div className="relative">
                <motion.div
                  key={currentReview}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-center"
                >
                  <div className="flex justify-center mb-4">
                    {[...Array(reviews[currentReview].rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-lg md:text-xl mb-6 italic">
                    "{reviews[currentReview].content}"
                  </p>
                  <p className="font-semibold">{reviews[currentReview].customer_name}</p>
                  {reviews[currentReview].location && (
                    <p className="text-gray-400 text-sm">{reviews[currentReview].location}</p>
                  )}
                </motion.div>
                <button
                  onClick={prevReview}
                  className="absolute left-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextReview}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Eine ALWAHA. Viele Gründe zum Lächeln
                </h2>
                <p className="text-gray-600 mb-4">
                  Als Pioniere in der Shisha-Welt haben wir ALWAHA geschaffen, um eine von uns gemeisterte Kategorie zu modernisieren.
                </p>
                <p className="text-gray-600 mb-6">
                  Unterstützt von 4 Jahren Forschung und mehr als 50 Millionen US-Dollar in der Entwicklung, bietet ALWAHA eine neue und moderne Alternative zur herkömmlichen Shisha.
                </p>
                <Link
                  to="/products"
                  className="inline-block bg-gray-900 text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
                >
                  Explore Products
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative aspect-square rounded-2xl overflow-hidden"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800)' }}
                />
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
