'use client';

import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ReactLenis, useLenis } from 'lenis/react';
import Header from '@/components/Header';
import SideMenu from '@/components/SideMenu';
import ProductListPage from '@/views/ProductListPage';
import ProductDetailPage from '@/views/ProductDetailPage';
import CartPage from '@/views/CartPage';
import CheckoutPage from '@/views/CheckoutPage';
import TrackingPage from '@/views/TrackingPage';
import AccountPage from '@/views/AccountPage';
import CategoryPage from '@/views/CategoryPage';
import OrderDetailPage from '@/views/OrderDetailPage';
import PrivacyPage from '@/views/legal/PrivacyPage';
import TermsPage from '@/views/legal/TermsPage';
import ShippingPage from '@/views/legal/ShippingPage';
import ReturnsPage from '@/views/legal/ReturnsPage';
import AboutPage from '@/views/legal/AboutPage';
import Footer from '@/components/Footer';
import { useMedusaCart } from '@/lib/hooks';
import { useAuthState } from '@/lib/useAuth';
import { CartContext } from '@/context/CartContext';
import { AuthContext } from '@/context/AuthContext';
import type { CartContextType } from '@/types/types';

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

const ScrollToTop = () => {
  const location = useLocation();
  const lenis = useLenis();
  React.useEffect(() => {
    // Stop Lenis, reset scroll, restart Lenis
    if (lenis) {
      lenis.stop();
      lenis.scrollTo(0, { immediate: true, force: true });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (lenis) {
      requestAnimationFrame(() => lenis.start());
    }
  }, [location.pathname, location.key]);
  return null;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><ProductListPage /></PageTransition>} />
        <Route path="/product/:id" element={<PageTransition><ProductDetailPage /></PageTransition>} />
        <Route path="/categoria/:handle" element={<PageTransition><CategoryPage /></PageTransition>} />
        <Route path="/cart" element={<PageTransition><CartPage /></PageTransition>} />
        <Route path="/checkout" element={<PageTransition><CheckoutPage /></PageTransition>} />
        <Route path="/conta" element={<PageTransition><AccountPage /></PageTransition>} />
        <Route path="/pedido/:id" element={<PageTransition><OrderDetailPage /></PageTransition>} />
        <Route path="/rastrear" element={<PageTransition><TrackingPage /></PageTransition>} />
        <Route path="/rastrear/:code" element={<PageTransition><TrackingPage /></PageTransition>} />
        <Route path="/politica-de-privacidade" element={<PageTransition><PrivacyPage /></PageTransition>} />
        <Route path="/termos-de-uso" element={<PageTransition><TermsPage /></PageTransition>} />
        <Route path="/entrega" element={<PageTransition><ShippingPage /></PageTransition>} />
        <Route path="/trocas-e-devolucoes" element={<PageTransition><ReturnsPage /></PageTransition>} />
        <Route path="/sobre" element={<PageTransition><AboutPage /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const ClientApp = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const medusaCart = useMedusaCart();
  const authState = useAuthState();

  const cartContextValue: CartContextType = {
    cart: medusaCart.cart,
    loading: medusaCart.loading,
    totalItems: medusaCart.totalItems,
    addItem: medusaCart.addItem,
    updateItem: medusaCart.updateItem,
    removeItem: medusaCart.removeItem,
    updateCart: medusaCart.updateCart,
    completeCart: medusaCart.completeCart,
    refreshCart: medusaCart.refreshCart,
  };

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
      <AuthContext.Provider value={authState}>
        <CartContext.Provider value={cartContextValue}>
          <Router>
            <ScrollToTop />
            <div className={`flex flex-col min-h-screen ${isMenuOpen ? 'overflow-hidden h-screen' : ''}`}>
              <div className="sticky top-0 left-0 w-full z-100">
                <Header onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} isMenuOpen={isMenuOpen} />
              </div>
              <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
              <main className="grow">
                <AnimatedRoutes />
              </main>
              <Footer />
            </div>
          </Router>
        </CartContext.Provider>
      </AuthContext.Provider>
    </ReactLenis>
  );
};

export default ClientApp;
