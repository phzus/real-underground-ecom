'use client';

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowRight, User, ShoppingBag, Zap } from 'lucide-react';
import { useCategories } from '@/lib/hooks';
import { useCart } from '@/context/CartContext';

interface NavbarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isOpen, onClose }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { categories } = useCategories();
  const { totalItems } = useCart();

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden lg:block bg-black/80 backdrop-blur-md border-b border-white/5 relative z-40">
        <div className="container mx-auto px-6">
          <ul className="flex items-center justify-center space-x-16 h-14">
            {categories.map((cat, catIdx) => (
              <li
                key={cat.id}
                className="relative h-full flex items-center"
                onMouseEnter={() => setActiveMenu(cat.id)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button
                  className="text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3 text-zinc-400 hover:text-white transition-all h-full group"
                  aria-label={`Category: ${cat.name}`}
                  tabIndex={0}
                >
                  <span className={`w-1 h-1 bg-[#e34717] rounded-full transition-opacity duration-300 ${activeMenu === cat.id ? 'opacity-100' : 'opacity-0'}`} />
                  {cat.name}
                  {cat.category_children && cat.category_children.length > 0 && (
                    <ChevronDown size={10} className={`transition-transform duration-500 ${activeMenu === cat.id ? 'rotate-180 text-[#e34717]' : 'text-zinc-800'}`} />
                  )}
                </button>

                <AnimatePresence>
                  {activeMenu === cat.id && cat.category_children && cat.category_children.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.98 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50"
                    >
                      <div className="bg-zinc-950 border border-white/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] p-10 min-w-[320px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                          <Zap size={120} className="text-white" />
                        </div>

                        <div className="relative z-10">
                          <h4 className="text-[8px] font-black uppercase tracking-[0.6em] text-[#e34717] mb-8 pb-3 border-b border-white/5 flex items-center justify-between">
                            Índice_Arquivo <span>0{catIdx + 1}</span>
                          </h4>

                          <div className="grid grid-cols-1 gap-y-5">
                            {cat.category_children.map((sub, idx) => (
                              <motion.div
                                key={sub.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                              >
                                <Link
                                  to={`/?cat=${cat.handle}&sub=${sub.handle}`}
                                  className="text-[13px] font-black italic uppercase tracking-tighter text-zinc-400 hover:text-white hover:pl-4 transition-all flex items-center group/item"
                                  tabIndex={0}
                                  aria-label={sub.name}
                                >
                                  <ArrowRight size={12} className="mr-3 text-[#e34717] opacity-0 -ml-4 group-hover/item:opacity-100 group-hover/item:ml-0 transition-all" />
                                  {sub.name}
                                </Link>
                              </motion.div>
                            ))}
                          </div>

                          <div className="mt-10 pt-6 border-t border-white/5">
                            <Link
                              to="/"
                              className="block w-full text-center py-4 bg-white text-black text-[9px] font-black uppercase tracking-[0.4em] hover:bg-[#e34717] hover:text-white transition-all shadow-xl"
                              tabIndex={0}
                              aria-label="Explorar todos os produtos"
                            >
                              Explorar Tudo
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            ))}
            <li className="h-full flex items-center">
              <Link to="/" className="text-[10px] font-black uppercase tracking-[0.4em] text-[#e34717] hover:scale-110 transition-transform flex items-center gap-2" tabIndex={0} aria-label="Drops limitados">
                <span className="w-2 h-2 bg-[#e34717] animate-pulse rounded-full" />
                Drop Limitado
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div className={`lg:hidden fixed inset-0 z-[150] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} role="button" aria-label="Fechar menu" tabIndex={-1} />

        <div className={`absolute top-0 left-0 h-full w-[85%] max-w-sm bg-black border-r border-white/5 transform transition-transform duration-500 p-10 pt-24 overflow-y-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col space-y-12">
            {categories.map((cat) => (
              <div key={cat.id} className="space-y-6">
                <button
                  onClick={() => setActiveMenu(activeMenu === cat.id ? null : cat.id)}
                  className="w-full flex items-center justify-between group"
                  aria-label={`Alternar subcategorias de ${cat.name}`}
                  tabIndex={0}
                >
                  <span className={`text-2xl font-black italic uppercase tracking-tighter transition-colors ${activeMenu === cat.id ? 'text-[#e34717]' : 'text-white'}`}>
                    {cat.name}
                  </span>
                  {cat.category_children && cat.category_children.length > 0 && (
                    <ChevronDown size={20} className={`text-zinc-800 transition-transform duration-500 ${activeMenu === cat.id ? 'rotate-180 text-[#e34717]' : ''}`} />
                  )}
                </button>

                <AnimatePresence>
                  {activeMenu === cat.id && cat.category_children && cat.category_children.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col space-y-5 pl-4 border-l-2 border-[#e34717]/30 py-2">
                        {cat.category_children.map((sub) => (
                          <Link
                            key={sub.id}
                            to={`/?cat=${cat.handle}&sub=${sub.handle}`}
                            onClick={onClose}
                            className="text-sm font-black italic uppercase tracking-tighter text-zinc-500 hover:text-white flex items-center justify-between"
                            tabIndex={0}
                            aria-label={sub.name}
                          >
                            {sub.name}
                            <ArrowRight size={14} className="text-[#e34717]/30" />
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            <Link
              to="/"
              onClick={onClose}
              className="text-2xl font-black italic uppercase tracking-tighter text-[#e34717] animate-pulse"
              tabIndex={0}
              aria-label="Drops limitados"
            >
              DROPS LIMITADOS
            </Link>

            <div className="pt-12 mt-12 border-t border-white/5 space-y-8">
              <button className="flex items-center gap-5 text-xs font-black uppercase tracking-[0.4em] text-zinc-600 hover:text-white transition-colors" aria-label="Conta" tabIndex={0}>
                <User size={18} /> Conta
              </button>
              <Link to="/cart" onClick={onClose} className="flex items-center gap-5 text-xs font-black uppercase tracking-[0.4em] text-zinc-600 hover:text-white transition-colors" aria-label="Sacola" tabIndex={0}>
                <ShoppingBag size={18} /> Sacola ({totalItems})
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
