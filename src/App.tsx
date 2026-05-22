import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminTrafficStats from './pages/admin/TrafficStats';
import ProductPublish from './pages/admin/ProductPublish';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminCategories from './pages/admin/Categories';
import AdminBanners from './pages/admin/Banners';
import AdminReviews from './pages/admin/Reviews';
import UserStats from './pages/admin/UserStats';
import TrafficStats from './pages/admin/TrafficStats';
import ProductDetailPages from './pages/admin/ProductDetailPages';
import PaymentGateways from './pages/admin/PaymentGateways';
import Login from './pages/Login';
import Register from './pages/Register';
import Users from './pages/admin/Users';
import AdminAdmins from './pages/admin/Admins';
import ProductEdit from './pages/admin/ProductEdit';
import Profile from './pages/Profile';
import './styles/index.css';

function App() {
  return (
    <LanguageProvider>
    <AuthProvider>
      <UserProvider>
        <CartProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="products" element={<Products />} />
              <Route path="products/:slug" element={<ProductDetail />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="payment" element={<Payment />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/product-publish" element={<ProductPublish />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/products/:id/edit" element={<ProductEdit />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/banners" element={<AdminBanners />} />
            <Route path="/admin/reviews" element={<AdminReviews />} />
            <Route path="/admin/user-stats" element={<UserStats />} />
            <Route path="/admin/traffic-stats" element={<AdminTrafficStats />} />
            <Route path="/admin/product-detail-pages" element={<ProductDetailPages />} />
            <Route path="/admin/payment-gateways" element={<PaymentGateways />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/admins" element={<AdminAdmins />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </HashRouter>
      </CartProvider>
      </UserProvider>
    </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
