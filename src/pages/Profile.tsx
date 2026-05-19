import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Package, MapPin, Settings, LogOut, X, Plus, Trash2, Star, ChevronRight, Heart } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../supabase/client';
import AddressSelector from '../components/AddressSelector';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
  shipping_address: string;
  customer_name: string;
  customer_phone: string;
  created_at: string;
  items?: OrderItem[];
}

interface Address {
  id: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail_address: string;
  is_default: boolean;
}

export default function Profile() {
  const { user, isLoggedIn, logout } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail_address: '',
    is_default: false
  });
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [isLoggedIn, navigate]);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const userId = authUser?.id || user?.id;

    if (!userId) {
      setLoading(false);
      return;
    }

    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const ordersWithItems = await Promise.all(
      (ordersData || []).map(async (order) => {
        const { data: items } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);
        return { ...order, items: items || [] };
      })
    );
    setOrders(ordersWithItems);

    const { data: addrData } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });
    setAddresses(addrData || []);

    const { data: productsData } = await supabase
      .from('products')
      .select('id, name, slug, price, images, likes_count, shares_count')
      .order('likes_count', { ascending: false })
      .limit(4);
    setRecommendedProducts(productsData || []);

    const { data: favoritesData } = await supabase
      .from('user_favorites')
      .select('*, product:products(id, name, price, images, likes_count, shares_count, slug)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setFavorites(favoritesData || []);

    setLoading(false);
  };

  const fetchOrdersByStatus = async (status: string) => {
    setLoading(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const userId = authUser?.id || user?.id;

    if (!userId) {
      setLoading(false);
      return;
    }

    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    const ordersWithItems = await Promise.all(
      (ordersData || []).map(async (order) => {
        const { data: items } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);
        return { ...order, items: items || [] };
      })
    );
    setOrders(ordersWithItems);
    setLoading(false);
  };

  const handleCancelOrder = async (orderId: string) => {
    if (confirm('Are you sure you want to cancel this order?')) {
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);
      fetchData();
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);
    return items || [];
  };

  const openOrderDetail = async (order: Order) => {
    const items = await fetchOrderDetails(order.id);
    setSelectedOrder({ ...order, items });
    setShowOrderModal(true);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const openAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      name: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      detail_address: '',
      is_default: false
    });
    setShowAddressModal(true);
  };

  const openEditAddress = (addr: Address) => {
    setEditingAddress(addr);
    setAddressForm({
      name: addr.name,
      phone: addr.phone,
      province: addr.province,
      city: addr.city,
      district: addr.district,
      detail_address: addr.detail_address,
      is_default: addr.is_default
    });
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (editingAddress) {
      await supabase
        .from('addresses')
        .update(addressForm)
        .eq('id', editingAddress.id);
    } else {
      await supabase
        .from('addresses')
        .insert([{ ...addressForm, user_id: user.id }]);
    }

    if (addressForm.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .neq('id', editingAddress?.id || '')
        .eq('user_id', user.id);
    }

    setShowAddressModal(false);
    fetchData();
  };

  const handleDeleteAddress = async (id: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      await supabase.from('addresses').delete().eq('id', id);
      fetchData();
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id);
    await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', id);
    fetchData();
  };

  const handleRemoveFavorite = async (productId: string) => {
    if (!user) return;
    await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);
    fetchData();
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: User },
    { id: 'orders', name: 'Orders', icon: Package },
    { id: 'favorites', name: 'Favorites', icon: Heart },
    { id: 'addresses', name: 'Addresses', icon: MapPin },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending: 'Pending',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    return map[status] || status;
  };

  const getPaymentStatusText = (status: string) => {
    const map: Record<string, string> = {
      unpaid: 'Unpaid',
      paid: 'Paid',
      refunded: 'Refunded'
    };
    return map[status] || status;
  };

  if (loading) return <div className="min-h-screen pt-20 flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">{user?.username}</h2>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                      activeTab === tab.id ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </button>
                ))}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </nav>
            </div>
          </div>

          <div className="md:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold">Account Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-500 text-sm">Total Orders</p>
                      <p className="text-2xl font-bold">{orders.length}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-500 text-sm">Addresses</p>
                      <p className="text-2xl font-bold">{addresses.length}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-500 text-sm">Membership</p>
                      <p className="text-2xl font-bold">Standard</p>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h3 className="text-xl font-bold mb-4">Recommended For You</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {recommendedProducts.map((product) => (
                        <motion.div
                          key={product.id}
                          whileHover={{ y: -4 }}
                          className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden cursor-pointer"
                          onClick={() => navigate(`/products/${product.slug || product.id}`)}
                        >
                          <div className="aspect-square bg-gray-100">
                            <img
                              src={product.images?.[0] || 'https://via.placeholder.com/200'}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-3">
                            <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
                            <p className="text-lg font-bold text-gray-900 mt-1">${product.price}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                                </svg>
                                {product.likes_count || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                                </svg>
                                {product.shares_count || 0}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">Order History</h3>
                    <div className="flex space-x-2">
                      <select
                        className="px-3 py-1.5 border rounded-lg text-sm"
                        onChange={(e) => {
                          const status = e.target.value;
                          if (status === 'all') {
                            fetchData();
                          } else {
                            fetchOrdersByStatus(status);
                          }
                        }}
                      >
                        <option value="all">All Orders</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No orders yet</p>
                      <button
                        onClick={() => navigate('/products')}
                        className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                      >
                        Shop Now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white"
                          onClick={() => openOrderDetail(order)}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-medium text-gray-900">Order: {order.order_number}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {new Date(order.created_at).toLocaleString('zh-CN')}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {getStatusText(order.status)}
                              </span>
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-3 border-t">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>{order.items?.length || 0} items</span>
                              <span>Payment: {order.payment_method || 'Unpaid'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">Total:</span>
                              <span className="text-xl font-bold text-gray-900">${order.total_amount.toFixed(2)}</span>
                            </div>
                          </div>
                          {order.status === 'pending' && (
                            <div className="flex justify-end mt-3 space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelOrder(order.id);
                                }}
                                className="px-4 py-1.5 border rounded-lg text-sm hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/checkout?order=${order.id}`);
                                }}
                                className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800"
                              >
                                Pay Now
                              </button>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'addresses' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">Shipping Addresses</h3>
                    <button
                      onClick={openAddAddress}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Address</span>
                    </button>
                  </div>
                  {addresses.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No addresses yet</p>
                  ) : (
                    <div className="space-y-3">
                      {addresses.map((addr) => (
                        <div key={addr.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <p className="font-medium">{addr.name}</p>
                                <span className="text-gray-500">{addr.phone}</span>
                                {addr.is_default && (
                                  <span className="px-2 py-0.5 bg-gray-900 text-white text-xs rounded">Default</span>
                                )}
                              </div>
                              <p className="text-gray-500 mt-1">
                                {addr.province} {addr.city} {addr.district} {addr.detail_address}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {!addr.is_default && (
                                <button
                                  onClick={() => handleSetDefault(addr.id)}
                                  className="p-2 text-gray-400 hover:text-yellow-500"
                                  title="Set Default"
                                >
                                  <Star className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => openEditAddress(addr)}
                                className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'favorites' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">My Favorites</h3>
                  {favorites.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No favorite products yet</p>
                      <button
                        onClick={() => navigate('/products')}
                        className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                      >
                        Browse Products
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {favorites.map((fav) => (
                        <motion.div
                          key={fav.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden group"
                        >
                          <div
                            className="aspect-square bg-gray-100 cursor-pointer relative"
                            onClick={() => navigate(`/product/${fav.product?.slug || fav.product_id}`)}
                          >
                            <img
                              src={fav.product?.images?.[0] || 'https://via.placeholder.com/200'}
                              alt={fav.product?.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFavorite(fav.product_id);
                              }}
                              className="absolute top-2 right-2 p-2 bg-white/90 rounded-full shadow-sm hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="p-3">
                            <h4
                              className="text-sm font-medium text-gray-900 truncate cursor-pointer hover:text-gray-700"
                              onClick={() => navigate(`/product/${fav.product?.slug || fav.product_id}`)}
                            >
                              {fav.product?.name}
                            </h4>
                            <p className="text-lg font-bold text-gray-900 mt-1">${fav.product?.price}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                                </svg>
                                {fav.product?.likes_count || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                                </svg>
                                {fav.product?.shares_count || 0}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold">Account Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Username</label>
                      <input
                        type="text"
                        value={user?.username}
                        disabled
                        className="w-full px-4 py-2 border rounded-lg bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        value={user?.email}
                        disabled
                        className="w-full px-4 py-2 border rounded-lg bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAddressModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">{editingAddress ? 'Edit Address' : 'Add Address'}</h3>
                <button onClick={() => setShowAddressModal(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveAddress} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    value={addressForm.name}
                    onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City/Province</label>
                  <AddressSelector
                    value={{
                      province: addressForm.province,
                      city: addressForm.city,
                      district: addressForm.district
                    }}
                    onChange={(value) => setAddressForm({
                      ...addressForm,
                      province: value.province,
                      city: value.city,
                      district: value.district
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Detailed Address</label>
                  <textarea
                    value={addressForm.detail_address}
                    onChange={(e) => setAddressForm({ ...addressForm, detail_address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={2}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={addressForm.is_default}
                    onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label className="text-sm">Set as Default</label>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showOrderModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Order Details</h3>
                <button onClick={() => setShowOrderModal(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Order Number</span>
                    <span className="font-medium">{selectedOrder.order_number}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Order Date</span>
                    <span>{new Date(selectedOrder.created_at).toLocaleString('en-US')}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Status</span>
                    <span className={`px-2 py-0.5 rounded text-sm ${
                      selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      selectedOrder.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {getStatusText(selectedOrder.status)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Status</span>
                    <span>{getPaymentStatusText(selectedOrder.payment_status)}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Shipping Info</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium">{selectedOrder.customer_name} {selectedOrder.customer_phone}</p>
                    <p className="text-gray-500 mt-1">{selectedOrder.shipping_address}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Items</h4>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-gray-500">x{item.quantity}</p>
                        </div>
                        <span className="font-medium">${item.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Payment Method</span>
                    <span>{selectedOrder.payment_method || 'Not Selected'}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-lg font-bold">
                    <span>Order Total</span>
                    <span>${selectedOrder.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
