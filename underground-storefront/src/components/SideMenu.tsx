'use client'

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  ChevronDown,
  FileText,
  Lock,
  LogOut,
  Package,
  ScrollText,
  ShieldCheck,
  ShoppingBag,
  Truck,
  User,
} from 'lucide-react'
import { useCategories } from '@/lib/hooks'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'

interface SideMenuProps {
  isOpen: boolean
  onClose: () => void
}

const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
  const { categories } = useCategories()
  const { totalItems } = useCart()
  const { customer, isAuthenticated, logout } = useAuth()
  const [openCat, setOpenCat] = useState<string | null>(null)

  const closeAndNavigate = () => onClose()

  const handleLogout = async () => {
    await logout()
    onClose()
  }

  return (
    <div
      className={`fixed inset-0 z-[150] transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      <div
        className="absolute inset-0 bg-black/95 backdrop-blur-xl"
        onClick={onClose}
        role="button"
        aria-label="Fechar menu"
        tabIndex={-1}
      />

      <aside
        className={`absolute top-0 left-0 h-full w-[90%] max-w-md bg-black border-r border-white/5 transform transition-transform duration-500 overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-8 pt-10 pb-16 space-y-12">
          {/* Account block */}
          <div className="pb-10 border-b border-white/5">
            {isAuthenticated && customer ? (
              <div className="space-y-4">
                <Link
                  to="/conta"
                  onClick={closeAndNavigate}
                  className="block group"
                >
                  <div className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-600 mb-2">
                    Conta
                  </div>
                  <div className="text-2xl font-black uppercase tracking-tighter text-white group-hover:text-[#e34717] transition-colors">
                    {customer.first_name || 'Você'}
                  </div>
                  <div className="text-[10px] font-medium text-zinc-500 mt-1 normal-case tracking-normal">
                    {customer.email}
                  </div>
                </Link>
                <div className="flex gap-3">
                  <Link
                    to="/conta"
                    onClick={closeAndNavigate}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-[9px] font-bold uppercase tracking-widest bg-white text-black hover:bg-[#e34717] hover:text-white transition-all"
                  >
                    <User size={12} />
                    Minha conta
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-3 text-[9px] font-bold uppercase tracking-widest border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all"
                    aria-label="Sair"
                  >
                    <LogOut size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-600">
                  Acesso
                </div>
                <div className="text-xl font-black uppercase tracking-tighter text-white">
                  Entre ou cadastre-se
                </div>
                <div className="text-[10px] font-medium text-zinc-500 normal-case tracking-normal leading-relaxed">
                  Salve endereços, acompanhe seus drops e repita compras rapidinho.
                </div>
                <Link
                  to="/conta"
                  onClick={closeAndNavigate}
                  className="w-full inline-flex items-center justify-center gap-2 py-4 bg-[#e34717] text-white text-[9px] font-bold uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all"
                >
                  <User size={12} />
                  Entrar / Cadastrar
                </Link>
              </div>
            )}
          </div>

          {/* Categories */}
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-600 mb-6">
              Categorias
            </div>
            <div className="space-y-6">
              {categories.length === 0 && (
                <Link
                  to="/"
                  onClick={closeAndNavigate}
                  className="text-2xl font-black uppercase tracking-tighter text-white hover:text-[#e34717] transition-colors"
                >
                  Todos os produtos
                </Link>
              )}
              {categories.map((cat) => {
                const hasChildren =
                  cat.category_children && cat.category_children.length > 0
                const isOpen = openCat === cat.id
                return (
                  <div key={cat.id} className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <Link
                        to={`/categoria/${cat.handle}`}
                        onClick={closeAndNavigate}
                        className="text-2xl font-black uppercase tracking-tighter text-white hover:text-[#e34717] transition-colors flex-1"
                      >
                        {cat.name}
                      </Link>
                      {hasChildren && (
                        <button
                          onClick={() => setOpenCat(isOpen ? null : cat.id)}
                          className="p-2 text-zinc-600 hover:text-white transition-colors"
                          aria-label={`Alternar subcategorias de ${cat.name}`}
                        >
                          <ChevronDown
                            size={16}
                            className={`transition-transform duration-300 ${
                              isOpen ? 'rotate-180 text-[#e34717]' : ''
                            }`}
                          />
                        </button>
                      )}
                    </div>
                    <AnimatePresence>
                      {isOpen && hasChildren && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col gap-3 pl-4 border-l-2 border-[#e34717]/30">
                            {cat.category_children!.map((sub) => (
                              <Link
                                key={sub.id}
                                to={`/categoria/${sub.handle}`}
                                onClick={closeAndNavigate}
                                className="text-sm font-black uppercase tracking-tighter text-zinc-500 hover:text-white flex items-center justify-between"
                              >
                                {sub.name}
                                <ArrowRight size={12} className="text-[#e34717]/40" />
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Utilities */}
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-600 mb-6">
              Suporte
            </div>
            <div className="space-y-4">
              <Link
                to="/cart"
                onClick={closeAndNavigate}
                className="flex items-center justify-between text-sm font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors"
              >
                <span className="flex items-center gap-4">
                  <ShoppingBag size={14} />
                  Sacola
                </span>
                <span className="text-[#e34717]">{totalItems}</span>
              </Link>
              <Link
                to="/rastrear"
                onClick={closeAndNavigate}
                className="flex items-center gap-4 text-sm font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors"
              >
                <Package size={14} />
                Rastrear pedido
              </Link>
              <Link
                to="/entrega"
                onClick={closeAndNavigate}
                className="flex items-center gap-4 text-sm font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors"
              >
                <Truck size={14} />
                Prazos e envios
              </Link>
              <Link
                to="/trocas-e-devolucoes"
                onClick={closeAndNavigate}
                className="flex items-center gap-4 text-sm font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors"
              >
                <ScrollText size={14} />
                Trocas e devoluções
              </Link>
            </div>
          </div>

          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-600 mb-6">
              Legal
            </div>
            <div className="space-y-4">
              <Link
                to="/politica-de-privacidade"
                onClick={closeAndNavigate}
                className="flex items-center gap-4 text-sm font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors"
              >
                <Lock size={14} />
                Política de privacidade
              </Link>
              <Link
                to="/termos-de-uso"
                onClick={closeAndNavigate}
                className="flex items-center gap-4 text-sm font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors"
              >
                <FileText size={14} />
                Termos de uso
              </Link>
              <Link
                to="/sobre"
                onClick={closeAndNavigate}
                className="flex items-center gap-4 text-sm font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors"
              >
                <ShieldCheck size={14} />
                Sobre a marca
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default SideMenu
