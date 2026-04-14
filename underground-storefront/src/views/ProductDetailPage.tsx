'use client';
import React, { useState, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ShoppingCart, Zap, ShieldAlert, RefreshCw, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useProduct, getVariantPrice, formatPrice } from '@/lib/hooks';
import type { HttpTypes } from '@medusajs/types';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { product, loading, error } = useProduct(id);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isProcessingIA, setIsProcessingIA] = useState(false);
  const [iaPreviewUrl, setIaPreviewUrl] = useState<string | null>(null);

  const [isDecoding, setIsDecoding] = useState(false);
  const [lore, setLore] = useState<string | null>(null);

  const hasOnlyOneVariant = product?.variants?.length === 1;

  // Auto-select options when product has only one variant
  React.useEffect(() => {
    if (hasOnlyOneVariant && product?.variants?.[0]?.options) {
      const autoSelected: Record<string, string> = {};
      for (const opt of product.variants[0].options) {
        if (opt.option_id) autoSelected[opt.option_id] = opt.value;
      }
      setSelectedOptions(autoSelected);
    }
  }, [product, hasOnlyOneVariant]);

  const selectedVariant = useMemo(() => {
    if (!product?.variants || !product?.options) return null;

    if (hasOnlyOneVariant) return product.variants[0];

    const optionKeys = Object.keys(selectedOptions);
    if (optionKeys.length === 0) return null;

    return product.variants.find((variant) => {
      if (!variant.options) return false;
      return variant.options.every(
        (opt) => selectedOptions[opt.option_id ?? ''] === opt.value
      );
    }) ?? null;
  }, [product, selectedOptions, hasOnlyOneVariant]);

  const displayPrice = useMemo(() => {
    if (selectedVariant) {
      return getVariantPrice(selectedVariant);
    }
    if (product?.variants?.[0]) {
      return getVariantPrice(product.variants[0]);
    }
    return null;
  }, [selectedVariant, product]);

  const handleSelectOption = (optionId: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionId]: value }));
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    setIsAdding(true);
    try {
      await addItem(selectedVariant.id);
      setTimeout(() => {
        setIsAdding(false);
        navigate('/cart');
      }, 600);
    } catch {
      setIsAdding(false);
    }
  };

  const handleDecodeLore = async () => {
    setIsDecoding(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setLore("NASCIDA NAS SOMBRAS DO BECO 47. GRAFITADA SOB LUZ NEON. APENAS 12 UNIDADES ESCAPARAM DA FÁBRICA. QUEM VESTE, NÃO VOLTA.");
    } catch {
      setLore("ARQUIVO CORROMPIDO. APENAS PARA OS REAIS.");
    } finally {
      setIsDecoding(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      if (!event.target?.result) return;
      const dataUrl = event.target.result as string;
      setIsProcessingIA(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIaPreviewUrl(dataUrl);
      } catch (err) {
        console.error("IA Processing Error:", err);
      } finally {
        setIsProcessingIA(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="bg-[#050505] min-h-screen text-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#e34717]" />
        <span className="ml-4 text-zinc-500 text-xs uppercase tracking-widest font-bold">Carregando...</span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-[#050505] min-h-screen text-white flex flex-col items-center justify-center">
        <p className="text-[#e34717] text-lg font-black uppercase tracking-widest mb-6">Produto Não Encontrado</p>
        <Link to="/" className="text-zinc-500 text-xs uppercase tracking-widest hover:text-white transition-colors">
          Voltar para a stuff
        </Link>
      </div>
    );
  }

  const images = product.images ?? [];
  const currentImageUrl = iaPreviewUrl || images[selectedImage]?.url || product.thumbnail || '';

  return (
    <div className="bg-[#050505] min-h-screen text-white carbon-pattern overflow-x-hidden">
      <div className="container mx-auto px-4 md:px-20 py-6 md:py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-bold text-zinc-500 hover:text-white mb-8 md:mb-12 uppercase tracking-widest transition-colors" tabIndex={0} aria-label="Voltar ao Catálogo">
          <ChevronLeft size={14} /> Voltar ao Catálogo
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-20">
          {/* Main Visual Display */}
          <div className="lg:col-span-6 space-y-6 md:space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-[4/5] lg:aspect-square overflow-hidden bg-[#0a0a0a] border border-white/5 shadow-2xl"
            >
              {currentImageUrl ? (
                <img
                  src={currentImageUrl}
                  className="w-full h-full object-cover transition-all duration-1000"
                  alt={product.title}
                />
              ) : (
                <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                  <span className="text-zinc-700 text-xs uppercase tracking-widest">Sem Imagem</span>
                </div>
              )}

              <AnimatePresence>
                {isProcessingIA && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center text-center p-6 md:p-12"
                  >
                    <RefreshCw size={48} className="text-[#e34717] animate-spin mb-6 md:mb-8" />
                    <h3 className="text-2xl md:text-3xl font-black tracking-tighter uppercase mb-2 md:mb-4">Ajustando Nano Banana...</h3>
                    <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Aplicando texturas na sua foto</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {iaPreviewUrl && (
                <div className="absolute top-4 right-4 md:top-8 md:right-8 z-30 bg-[#e34717] px-3 py-1.5 md:px-4 md:py-2 flex items-center gap-2 shadow-xl">
                  <Zap size={12} className="fill-white" />
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Modo Pré-visualização Nano</span>
                </div>
              )}

              <AnimatePresence>
                {lore && (
                  <motion.div
                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
                    className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center p-6 md:p-12 text-center"
                  >
                    <div className="max-w-md">
                      <ShieldAlert className="mx-auto mb-6 md:mb-8 text-[#e34717]" size={32} />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#e34717] mb-4 md:mb-8">Lore Decodificado</h4>
                      <p className="text-xl md:text-2xl lg:text-3xl font-black tracking-tighter leading-tight uppercase mb-8 md:mb-12">
                        {lore}
                      </p>
                      <button
                        onClick={() => setLore(null)}
                        className="text-[10px] font-black uppercase tracking-widest border border-white/20 px-8 py-4 hover:bg-white hover:text-black transition-all"
                        aria-label="Apagar dados do lore"
                        tabIndex={0}
                      >
                        Apagar Dados
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {/* <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-28 md:w-24 md:h-32 flex-shrink-0 border border-dashed border-zinc-800 flex flex-col items-center justify-center gap-3 md:gap-4 hover:border-[#e34717] hover:bg-[#e34717]/5 transition-all group"
                  aria-label="Envie foto para provador virtual"
                  tabIndex={0}
                >
                  <span className="text-[7px] font-black uppercase text-center px-1 text-zinc-600">Provador</span>
                </button>
              </div> */}

              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => { setSelectedImage(idx); setIaPreviewUrl(null); }}
                  className={`relative w-20 h-28 md:w-24 md:h-32 flex-shrink-0 border transition-all duration-500 overflow-hidden ${selectedImage === idx && !iaPreviewUrl ? 'border-[#e34717] scale-105 z-10' : 'border-zinc-900 opacity-40 hover:opacity-100'}`}
                  aria-label={`Ver imagem ${idx + 1}`}
                  tabIndex={0}
                >
                  <img src={img.url} className="w-full h-full object-cover" alt={`${product.title} - ${idx + 1}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Product Data & Config */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="mb-8 md:mb-10">
              <span className="text-[#e34717] text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] mb-4 block">
                {product.categories?.[0]?.name ?? 'Série Arquivo'}
              </span>
              <h1 className="lg:max-w-lg text-2xl md:text-8xl lg:text-5xl font-black tracking-tighter mb-6 md:mb-8 uppercase leading-[1]">
                {product.title}
              </h1>

              <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/5 pb-6 md:pb-8 gap-6">
                {displayPrice && (
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl md:text-6xl lg:text-4xl font-black tracking-tighter text-[#e34717] leading-none">
                      {formatPrice(displayPrice.amount, displayPrice.currencyCode)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-10 md:space-y-14">
              {/* Product Options (Size, Color, etc.) — hidden when single default variant */}
              {!hasOnlyOneVariant && product.options?.map((option) => (
                <div key={option.id}>
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-6 md:mb-8">
                    {option.title}
                  </h3>
                  <div className="flex flex-wrap gap-3 md:gap-4">
                    {option.values?.map((val) => {
                      const isSelected = selectedOptions[option.id] === val.value;
                      return (
                        <button
                          key={val.id}
                          onClick={() => handleSelectOption(option.id, val.value)}
                          className={`px-5 py-3 md:px-6 md:py-4 flex items-center justify-center font-black text-xs md:text-sm border transition-all duration-300 ${isSelected
                            ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                            : 'bg-transparent border-zinc-900 text-zinc-600 hover:border-zinc-500'
                            }`}
                          aria-label={`Select ${option.title}: ${val.value}`}
                          tabIndex={0}
                        >
                          {val.value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={!selectedVariant || isAdding}
                className={`w-full py-6 md:py-8 flex items-center justify-center gap-4 md:gap-6 font-black uppercase text-[10px] md:text-xs tracking-[0.5em] md:tracking-[0.6em] transition-all duration-500 ${!selectedVariant
                  ? 'bg-zinc-900 text-zinc-700 cursor-not-allowed'
                  : isAdding
                    ? 'bg-[#e34717] text-white animate-pulse'
                    : 'bg-white text-black hover:bg-[#e34717] hover:text-white shadow-2xl scale-100 active:scale-95'
                  }`}
                aria-label={isAdding ? 'Adicionando à sacola' : 'Adicionar à sacola'}
                tabIndex={0}
              >
                {isAdding ? 'PROCESSANDO...' : selectedVariant ? 'Adquirir' : 'Selecione as Opções'}
                <ShoppingCart size={18} />
              </button>

              {/* Product Description */}
              <div className="bg-zinc-950 p-6 md:p-10 border border-white/5 space-y-6">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.5em] text-zinc-500">
                  <span>Detalhes do Produto</span>
                  <Zap size={14} className="text-[#e34717]" />
                </div>
                {product.description && (
                  <p className="text-xs text-zinc-500 leading-relaxed font-medium pt-6 border-t border-white/10">
                    {product.description}
                  </p>
                )}
                {product.material && (
                  <div className="flex items-center gap-4 text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
                    <Zap size={18} className="text-[#e34717]" />
                    <span className="text-zinc-400">{product.material}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
