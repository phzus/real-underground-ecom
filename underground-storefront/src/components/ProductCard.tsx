import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Flame, Sparkles, Clock, Package, Eye, ShoppingBag } from 'lucide-react';
import type { MedusaProduct } from '@/types/types';
import { getProductPrice, formatPrice } from '@/lib/hooks';

interface ProductCardProps {
  product: MedusaProduct;
  index: number;
  locked?: boolean;
  featured?: boolean;
}

type TagType = 'bestseller' | 'new' | 'lowStock' | 'lastUnits' | 'available';

interface ProductTag {
  type: TagType;
  label: string;
  icon: React.ReactNode;
  className: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, index, locked = false, featured = false }) => {
  const price = getProductPrice(product);
  const thumbnail = product.thumbnail || product.images?.[0]?.url;

  const productInfo = useMemo(() => {
    const variants = product.variants ?? [];
    const totalStock = variants.reduce((acc, v) => {
      const qty = (v as { inventory_quantity?: number }).inventory_quantity;
      return acc + (typeof qty === 'number' ? qty : 0);
    }, 0);

    const firstVariant = variants[0];
    const calculatedPrice = firstVariant?.calculated_price;
    const originalPrice = calculatedPrice?.original_amount;
    const currentPrice = calculatedPrice?.calculated_amount;
    const hasDiscount = originalPrice && currentPrice && originalPrice > currentPrice;
    const discountPercent = hasDiscount 
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0;

    const createdAt = product.created_at ? new Date(product.created_at) : null;
    const isNew = createdAt && (Date.now() - createdAt.getTime()) < 7 * 24 * 60 * 60 * 1000;

    const isBestseller = index < 2 && featured;
    const isLowStock = totalStock > 0 && totalStock <= 5;
    const isLastUnits = totalStock > 0 && totalStock <= 2;

    return {
      totalStock,
      hasDiscount,
      discountPercent,
      originalPrice,
      currentPrice,
      currencyCode: calculatedPrice?.currency_code ?? 'BRL',
      isNew,
      isBestseller,
      isLowStock,
      isLastUnits,
    };
  }, [product, index, featured]);

  const tags = useMemo((): ProductTag[] => {
    const result: ProductTag[] = [];

    if (productInfo.isBestseller) {
      result.push({
        type: 'bestseller',
        label: 'Mais Pedido',
        icon: <Flame size={12} />,
        className: 'bg-gradient-to-r from-orange-500 to-red-500 text-white',
      });
    }

    if (productInfo.isNew && !productInfo.isBestseller) {
      result.push({
        type: 'new',
        label: 'Novidade',
        icon: <Sparkles size={12} />,
        className: 'bg-gradient-to-r from-violet-500 to-purple-500 text-white',
      });
    }

    if (productInfo.isLastUnits) {
      result.push({
        type: 'lastUnits',
        label: `Últimas ${productInfo.totalStock}`,
        icon: <Clock size={12} />,
        className: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white animate-pulse',
      });
    } else if (productInfo.isLowStock) {
      result.push({
        type: 'lowStock',
        label: `${productInfo.totalStock} un.`,
        icon: <Package size={12} />,
        className: 'bg-zinc-800/90 text-amber-400 border border-amber-500/30',
      });
    }

    return result;
  }, [productInfo]);

  const cardContent = (
    <>
      <div className={`relative overflow-hidden bg-[#0a0a0a] rounded-lg ${featured ? 'aspect-square' : 'aspect-3/4'}`}>
        {thumbnail ? (
          <img
            loading="lazy"
            src={thumbnail}
            alt={product.title}
            className={`w-full h-full object-cover transition-all duration-700 ease-out ${locked ? 'grayscale brightness-[0.3] blur-[2px]' : 'group-hover:scale-110'}`}
          />
        ) : (
          <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
            <span className="text-zinc-700 text-[10px] uppercase tracking-widest">Sem Imagem</span>
          </div>
        )}

        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

        {locked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.04 + 0.2 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-[#e34717]/20 blur-xl scale-150" />
                <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full border border-[#e34717]/30 bg-black/60 flex items-center justify-center">
                  <Lock size={24} className="text-[#e34717]/80" strokeWidth={2.5} />
                </div>
              </div>
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
                Em breve
              </span>
            </motion.div>
          </div>
        )}

        {!locked && tags.length > 0 && (
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
            {tags.map((tag) => (
              <motion.span
                key={tag.type}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`inline-flex items-center gap-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg ${tag.className}`}
              >
                {tag.icon}
                {tag.label}
              </motion.span>
            ))}
          </div>
        )}

        {!locked && productInfo.hasDiscount && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center bg-[#e34717] text-white text-[10px] md:text-xs font-black px-2 py-1 rounded-md shadow-lg">
              -{productInfo.discountPercent}%
            </span>
          </div>
        )}

        {!locked && (
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
            <div className="flex gap-2">
              <span className="flex-1 inline-flex items-center justify-center gap-2 bg-[#e34717] hover:bg-[#c73d13] text-white text-[10px] md:text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-md transition-colors">
                <Eye size={14} />
                Ver Detalhes
              </span>
            </div>
          </div>
        )}
      </div>

      <div className={`${featured ? 'p-4' : 'pt-4 pb-2'} flex flex-col gap-3`}>
        <div className="space-y-1.5">
          <h3 className={`font-bold uppercase tracking-wide leading-tight transition-colors duration-300 line-clamp-2 ${locked ? 'text-zinc-600 text-sm' : ''} ${featured && !locked ? 'text-sm md:text-base text-white group-hover:text-[#e34717]' : ''} ${!featured && !locked ? 'text-sm text-zinc-200 group-hover:text-[#e34717]' : ''}`}>
            {product.title}
          </h3>
          
          {product.subtitle && !locked && (
            <p className="text-[10px] md:text-xs text-zinc-500 line-clamp-1">
              {product.subtitle}
            </p>
          )}
        </div>

        <div className="flex items-end justify-between gap-2">
          <div className="flex flex-col">
            {!locked && productInfo.hasDiscount && productInfo.originalPrice && (
              <span className="text-xs text-zinc-500 line-through">
                {formatPrice(productInfo.originalPrice, productInfo.currencyCode)}
              </span>
            )}
            {price && (
              <p className={`font-black tracking-tight ${locked ? 'text-lg text-zinc-700' : ''} ${featured && !locked ? 'text-xl md:text-2xl text-white' : ''} ${!featured && !locked ? 'text-lg md:text-xl text-white' : ''}`}>
                {locked ? '---' : formatPrice(price.amount, price.currencyCode)}
              </p>
            )}
          </div>

          {!locked && productInfo.totalStock > 0 && !productInfo.isLowStock && (
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
              <Package size={12} className="text-emerald-500" />
              <span>Em estoque</span>
            </div>
          )}
        </div>

        {featured && !locked && (
          <div className="flex items-center gap-4 pt-2 border-t border-zinc-800/50">
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full border border-zinc-800 ${i < 4 ? 'bg-[#e34717]' : 'bg-zinc-700'}`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-zinc-500 ml-1">4.8</span>
            </div>
            <span className="text-[10px] text-zinc-600">|</span>
            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
              <ShoppingBag size={10} />
              +50 vendidos
            </span>
          </div>
        )}
      </div>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.5, delay: index * 0.04 }}
      className={`relative flex flex-col h-full ${locked ? 'cursor-not-allowed' : 'group cursor-pointer'} ${featured && !locked ? 'bg-zinc-900/30 rounded-xl ring-1 ring-white/5 hover:ring-[#e34717]/40 hover:bg-zinc-900/50 transition-all duration-500 overflow-hidden' : ''}`}
    >
      {locked ? (
        <div className="block select-none" aria-label={`${product.title} — locked`}>
          {cardContent}
        </div>
      ) : (
        <Link
          to={`/product/${product.id}`}
          className="block h-full"
          aria-label={`Ver ${product.title}`}
          tabIndex={0}
        >
          {cardContent}
        </Link>
      )}
    </motion.div>
  );
};

export default ProductCard;
