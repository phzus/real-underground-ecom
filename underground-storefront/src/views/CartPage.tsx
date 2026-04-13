'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ChevronLeft, Loader2, ShieldCheck, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/hooks';
import { sdk } from '@/lib/medusa';
import ShippingQuote, { QuoteOption, ShippingQuoteItem } from '@/components/ShippingQuote';

const SHIPPING_PREVIEW_KEY = 'superfrete_preview';

type ShippingPreview = {
  cep: string;
  service_code: number;
  service_name: string;
  price: number;
};

const CartPage: React.FC = () => {
  const { cart, loading, removeItem, updateItem } = useCart();
  const [thumbnailMap, setThumbnailMap] = useState<Record<string, string>>({});
  const [shippingPreview, setShippingPreview] = useState<ShippingPreview | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(SHIPPING_PREVIEW_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ShippingPreview;
      // Drop stale entries without a CEP (left over from an older build).
      const cepDigits = (parsed?.cep || '').replace(/\D/g, '');
      if (cepDigits.length !== 8) {
        window.localStorage.removeItem(SHIPPING_PREVIEW_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const quoteItems: ShippingQuoteItem[] = useMemo(
    () =>
      (cart?.items ?? []).map((it) => ({
        name: it.product_title || it.title,
        quantity: it.quantity,
        unit_price: it.unit_price ?? 0,
        weight: (it.variant as any)?.weight ?? null,
        height: (it.variant as any)?.height ?? null,
        width: (it.variant as any)?.width ?? null,
        length: (it.variant as any)?.length ?? null,
      })),
    [cart?.items]
  );

  const onShippingSelect = (opt: QuoteOption | null, cep: string) => {
    if (!opt) {
      setShippingPreview(null);
      window.localStorage.removeItem(SHIPPING_PREVIEW_KEY);
      return;
    }
    const next: ShippingPreview = {
      cep: cep || shippingPreview?.cep || '',
      service_code: opt.service_code,
      service_name: opt.name,
      price: opt.price,
    };
    setShippingPreview(next);
    try {
      window.localStorage.setItem(SHIPPING_PREVIEW_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const items = cart?.items ?? [];
    const productIds = [
      ...new Set(items.map((i) => i.product_id).filter((id): id is string => !!id)),
    ];
    if (productIds.length === 0) return;
    Promise.all(
      productIds.map((id) =>
        sdk.store.product.retrieve(id, { fields: '+thumbnail,*images' }).catch(() => null)
      )
    ).then((results) => {
      const map: Record<string, string> = {};
      results.forEach((res) => {
        const product = res?.product;
        if (!product?.id) return;
        const url = product.thumbnail || product.images?.[0]?.url || '';
        if (url) map[product.id] = url;
      });
      setThumbnailMap(map);
    });
  }, [cart?.items?.length]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 size={32} className="animate-spin text-[#e34717]" />
        <span className="ml-4 text-zinc-500 text-xs uppercase tracking-widest font-bold">Carregando Sacola...</span>
      </div>
    );
  }

  const items = cart?.items ?? [];
  const currencyCode = cart?.currency_code ?? 'eur';

  if (items.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 bg-[#0a0a0a] text-white">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-24 h-24 border border-white/10 rounded-full flex items-center justify-center mb-8 bg-zinc-900/30"
        >
          <ShoppingBag size={32} className="text-zinc-600" />
        </motion.div>
        <h1 className="text-5xl md:text-6xl font-light tracking-tighter mb-6">Sua sacola está vazia</h1>
        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-12 max-w-md leading-relaxed">
          O submundo aguarda. Descubra peças exclusivas e garanta seu drop antes que acabe.
        </p>
        <Link
          to="/"
          className="px-12 py-5 bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-[#e34717] hover:text-white transition-all shadow-xl group relative overflow-hidden"
          tabIndex={0}
          aria-label="Explore products"
        >
          <span className="absolute inset-0 w-full h-full bg-[#e34717] -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></span>
          <span className="relative flex items-center gap-3">
            Explorar Peças <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>
      </div>
    );
  }

  const handleUpdateQuantity = async (lineItemId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    await updateItem(lineItemId, newQty);
  };

  const handleRemoveItem = async (lineItemId: string) => {
    await removeItem(lineItemId);
  };

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white pt-5 pb-20">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex items-center gap-4 mb-16">
          <Link to="/" className="w-10 h-10 border border-white/10 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/5 transition-all" tabIndex={0} aria-label="Back to home">
            <ChevronLeft size={18} />
          </Link>
          <h1 className="text-4xl md:text-5xl font-light tracking-tighter">Sacola <span className="text-zinc-700 text-2xl ml-2">({items.length})</span></h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="divide-y divide-white/5 border-t border-white/5">
              {items.map((item) => {
                const thumbnail = item.thumbnail || (item.product_id ? thumbnailMap[item.product_id] : '') || '';
                const title = item.product_title || item.title;
                const subtitle = item.variant_title || '';

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={item.id}
                    className="flex flex-row gap-4 sm:gap-8 py-10 group"
                  >
                    <div className="w-30 h-30 lg:w-28 lg:h-28 sm:aspect-[1/1] sm:h-auto flex-shrink-0 bg-zinc-950 border border-white/5 overflow-hidden relative">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={title}
                          className="w-full h-full object-cover transition-all duration-700 scale-105 group-hover:scale-100"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-zinc-700 text-[8px] uppercase tracking-widest">Sem Imagem</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-grow flex flex-col justify-between">
                      <div className="flex justify-between items-start gap-2 lg:gap-4">
                        <div>
                          <h3 className="text-base md:text-xl font-light mb-2 tracking-tight">{title}</h3>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-2">{subtitle}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="w-6 h-6 flex items-center justify-center rounded-full text-zinc-600 hover:text-[#e34717] hover:bg-[#e34717]/10 transition-all shrink-0"
                          aria-label={`Remove ${title} from cart`}
                          tabIndex={0}
                        >
                          <Trash2 size={16} strokeWidth={1.5} />
                        </button>
                      </div>

                      <div className="flex flex-wrap justify-between items-end gap-6">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center bg-zinc-900/50 border border-white/10 rounded-sm">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                              className="p-2 text-zinc-500 hover:text-white transition-colors"
                              aria-label="Diminuir quantidade"
                              tabIndex={0}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                              className="p-2 text-zinc-500 hover:text-white transition-colors"
                              aria-label="Aumentar quantidade"
                              tabIndex={0}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className="text-xl font-light tracking-tighter">
                            {formatPrice((item.unit_price ?? 0) * item.quantity, currencyCode)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 xl:col-span-4">
            <div className="bg-zinc-950 border border-white/10 p-8 md:p-10 sticky top-32 rounded-sm">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500 mb-10 flex items-center gap-3">
                <ShoppingBag size={14} /> Resumo do Pedido
              </h2>

              <div className="space-y-6 mb-8">
                <div className="flex justify-between text-sm font-light text-zinc-400">
                  <span>Subtotal</span>
                  <span className="text-white">{formatPrice(cart?.item_subtotal ?? 0, currencyCode)}</span>
                </div>
                <div className="flex justify-between text-sm font-light text-zinc-400">
                  <span>Frete</span>
                  <span>
                    {shippingPreview ? (
                      <span className="text-white">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(shippingPreview.price)}
                      </span>
                    ) : (
                      <span className="text-[#e34717] uppercase text-[10px] font-bold tracking-widest">
                        Calcular abaixo
                      </span>
                    )}
                  </span>
                </div>
                {(cart?.discount_total ?? 0) > 0 && (
                  <div className="flex justify-between text-sm font-light text-green-500">
                    <span>Desconto</span>
                    <span>-{formatPrice(cart?.discount_total ?? 0, currencyCode)}</span>
                  </div>
                )}
                <div className="pt-8 border-t border-white/10 flex justify-between items-end">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total Estimado</span>
                  <span className="text-4xl font-light tracking-tighter text-white">
                    {formatPrice(
                      (cart?.total ?? 0) + (shippingPreview ? shippingPreview.price : 0),
                      currencyCode
                    )}
                  </span>
                </div>
              </div>

              <div className="mb-10">
                <ShippingQuote
                  items={quoteItems}
                  cartId={cart?.id}
                  initialCep={shippingPreview?.cep}
                  selectedServiceCode={shippingPreview?.service_code ?? null}
                  onSelect={onShippingSelect}
                  label="Calcular frete"
                />
              </div>

              <Link
                to="/checkout"
                className="block w-full bg-white text-black py-6 text-center text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-[#e34717] hover:text-white transition-all shadow-xl relative overflow-hidden group"
                tabIndex={0}
                aria-label="Finalizar compra"
              >
                <span className="absolute inset-0 w-full h-full bg-[#e34717] -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></span>
                <span className="relative flex items-center justify-center gap-3">
                  Finalizar Compra <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-zinc-500 bg-zinc-900/50 p-4 rounded-sm border border-white/5">
                  <ShieldCheck size={16} className="text-[#e34717]" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Checkout 100% Seguro</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-500 bg-zinc-900/50 p-4 rounded-sm border border-white/5">
                  <CreditCard size={16} />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Aceitamos todos os cartões</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
