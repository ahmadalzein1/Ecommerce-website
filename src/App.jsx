import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import CartDrawer from './components/UI/CartDrawer';
import AnnouncementBar from './components/Layout/AnnouncementBar';
import { initializeExchangeRate } from './lib/constants';
import useLanguageStore from './stores/languageStore';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

import useAuthStore from './stores/authStore';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const { isAdmin, loading, initialize } = useAuthStore();
  
  useEffect(() => {
    initialize();
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  
  return children;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PageLoader() {
  return (
    <div className="page-loader">
      <div className="spinner" />
    </div>
  );
}

export default function App() {
  const { language } = useLanguageStore();

  useEffect(() => {
    initializeExchangeRate();
    // Re-apply language attributes on start
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <AnnouncementBar />
      <Navbar />
      <CartDrawer />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Suspense>

      <Footer />
    </BrowserRouter>
  );
}
