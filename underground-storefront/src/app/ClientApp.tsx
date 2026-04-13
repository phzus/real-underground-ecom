'use client';

import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ReactLenis, useLenis } from 'lenis/react';
import Header from '@/components/Header';
import Navbar from '@/components/Navbar';
import ProductListPage from '@/views/ProductListPage';
import ProductDetailPage from '@/views/ProductDetailPage';
import CartPage from '@/views/CartPage';
import CheckoutPage from '@/views/CheckoutPage';
import TrackingPage from '@/views/TrackingPage';
import Footer from '@/components/Footer';
import { useMedusaCart } from '@/lib/hooks';
import { CartContext } from '@/context/CartContext';
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
        <Route path="/cart" element={<PageTransition><CartPage /></PageTransition>} />
        <Route path="/checkout" element={<PageTransition><CheckoutPage /></PageTransition>} />
        <Route path="/rastrear" element={<PageTransition><TrackingPage /></PageTransition>} />
        <Route path="/rastrear/:code" element={<PageTransition><TrackingPage /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const ClientApp = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const medusaCart = useMedusaCart();

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
      <CartContext.Provider value={cartContextValue}>
        <Router>
          <ScrollToTop />
          <div className={`flex flex-col min-h-screen ${isMenuOpen ? 'overflow-hidden h-screen' : ''}`}>
            <div className="sticky top-0 left-0 w-full z-100">
              <Header onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} isMenuOpen={isMenuOpen} />
              {/* <Navbar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} /> */}
            </div>
            <main className="grow">
              <AnimatedRoutes />
            </main>
            <Footer />
          </div>
        </Router>
      </CartContext.Provider>
    </ReactLenis>
  );
};

export default ClientApp;
