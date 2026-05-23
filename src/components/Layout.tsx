import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Menu, X, Search, User, ChevronRight, LogOut } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useUser } from '../contexts/UserContext';
import useVisitTracker from '../hooks/useVisitTracker';

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const { user, isLoggedIn, logout } = useUser();
  const location = useLocation();
  useVisitTracker();

  const navLinks = [
    { name: 'DISCOVER E-Hookan', path: '/' },
    { name: 'EXPLORE FLAVORS', path: '/products' },
    { name: 'FIND US', path: '/' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path.split('?')[0]);
  };

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    if (paths.length === 0) return [{ name: 'Home', path: '/' }];

    const crumbs = [{ name: 'Home', path: '/' }];
    if (paths[0] === 'products') {
      crumbs.push({ name: 'Products', path: '/products' });
    } else if (paths[0] === 'cart') {
      crumbs.push({ name: 'Cart', path: '/cart' });
    } else if (paths[0] === 'checkout') {
      crumbs.push({ name: 'Cart', path: '/cart' });
      crumbs.push({ name: 'Checkout', path: '/checkout' });
    }
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const showBreadcrumb = location.pathname !== '/';

  return (
    <div className="min-h-screen bg-white" itemScope itemType="https://schema.org/WebSite">
      <meta itemProp="name" content="E-Hookan" />
      <meta itemProp="url" content="/" />
      
      <header className="fixed top-0 left-0 right-0 z-50 bg-black" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2" itemProp="url">
              <span className="text-2xl font-bold tracking-tight text-white" itemProp="name">E-Hookan</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-8" role="navigation" aria-label="主导航">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium tracking-wide transition-colors duration-200 ${
                    isActive(link.path)
                      ? 'text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-white/70 hover:text-white transition-colors" aria-label="搜索">
                <Search className="w-5 h-5" />
              </button>
              <Link
                to="/cart"
                className="relative p-2 text-white/70 hover:text-white transition-colors"
                aria-label={`Cart (${totalItems})`}
              >
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-xs rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
              {isLoggedIn ? (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/profile"
                    className="text-white/70 hover:text-white text-sm transition-colors"
                  >
                    {user?.username}
                  </Link>
                  <button
                    onClick={logout}
                    className="p-2 text-white/70 hover:text-white transition-colors"
                    aria-label="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="text-white/70 hover:text-white text-sm transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 py-1.5 bg-white text-black text-sm rounded-full hover:bg-gray-200 transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
                aria-label="Menu"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white pt-16 md:hidden"
          >
            <nav className="flex flex-col p-4 space-y-4" role="navigation" aria-label="移动导航">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-lg font-medium py-2 ${
                    isActive(link.path) ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {showBreadcrumb && (
        <nav className="pt-20 pb-4 bg-gray-50" aria-label="面包屑导航">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ol className="flex items-center space-x-2 text-sm" itemScope itemType="https://schema.org/BreadcrumbList">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.path} itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                  {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 mx-2 inline" />}
                  <Link
                    to={crumb.path}
                    className={`${index === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900'}`}
                    itemProp="item"
                  >
                    <span itemProp="name">{crumb.name}</span>
                  </Link>
                  <meta itemProp="position" content={`${index + 1}`} />
                </li>
              ))}
            </ol>
          </div>
        </nav>
      )}

      <main className={`${showBreadcrumb ? 'pt-4' : 'pt-16'}`} role="main">
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-white py-16" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">E-Hookan</h3>
              <p className="text-gray-400 text-sm">
                Premium Elektro-Shisha ohne Kompromisse
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Products</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/products?category=devices" className="hover:text-white">Devices</Link></li>
                <li><Link to="/products?category=pods" className="hover:text-white">Pods</Link></li>
                <li><Link to="/products?category=accessories" className="hover:text-white">Accessories</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link to="/shipping" className="hover:text-white">Shipping</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white" aria-label="Instagram">
                  <i className="fab fa-instagram text-xl"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white" aria-label="Facebook">
                  <i className="fab fa-facebook text-xl"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white" aria-label="YouTube">
                  <i className="fab fa-youtube text-xl"></i>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 E-Hookan. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
