'use client';
import React, { useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Loader2 } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useProducts, useCategories } from '@/lib/hooks';
import type { HttpTypes } from '@medusajs/types';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  highlighted?: boolean;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, highlighted = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className={highlighted ? 'mb-8 md:mb-12' : 'mb-12 md:mb-16'}
  >
    {highlighted && (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="inline-flex items-center gap-2 bg-[#e34717]/10 border border-[#e34717]/20 rounded-full px-4 py-1.5 mb-5"
      >
        <span className="w-2 h-2 rounded-full bg-[#e34717] animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#e34717]">
          Compre agora
        </span>
      </motion.div>
    )}
    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#e34717] mb-3">
      {subtitle}
    </p>
    <h2 className={`font-black uppercase tracking-tight text-white leading-none ${highlighted ? 'text-4xl md:text-6xl' : 'text-3xl md:text-5xl'}`}>
      {title}
    </h2>
    <div className={`mt-4 h-px bg-[#e34717]/40 ${highlighted ? 'w-24' : 'w-16'}`} />
    {highlighted && (
      <p className="mt-4 text-xs md:text-sm text-zinc-500 max-w-lg">
        Stickers exclusivos da Underground — edição limitada, qualidade premium.
      </p>
    )}
  </motion.div>
);

interface CategoryGroup {
  category: HttpTypes.StoreProductCategory;
  products: HttpTypes.StoreProduct[];
}

const StickerSection: React.FC<{ category: HttpTypes.StoreProductCategory, categoryProducts: HttpTypes.StoreProduct[], groupIdx: number }> = ({ category, categoryProducts, groupIdx }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' });

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <section id={`category-${category.handle}`} className="relative">
      <div className="absolute -inset-x-4 -inset-y-8 md:-inset-x-6 md:-inset-y-12 bg-linear-to-b from-[#e34717]/3 via-transparent to-transparent rounded-3xl pointer-events-none" />
      <div className="relative">
        <SectionHeader
          title={category.name}
          subtitle={`Drop ${String(groupIdx + 1).padStart(2, '0')} — Disponível`}
          highlighted
        />

        {/* Mobile Carousel */}
        <div className="block md:hidden relative -mx-4">
          <div className="overflow-hidden px-4" ref={emblaRef}>
            <div className="flex">
              {categoryProducts.map((product, idx) => (
                <div className="flex-[0_0_100%] min-w-0 pr-4" key={product.id}>
                  <ProductCard product={product} index={idx} featured />
                </div>
              ))}
            </div>
          </div>

          {categoryProducts.length > 1 && (
            <>
              <button
                onClick={scrollPrev}
                className="absolute left-2 top-[40%] -translate-y-1/2 bg-black/50 backdrop-blur-md p-2 rounded-full border border-white/10 text-white hover:bg-[#e34717] transition-colors z-10"
                aria-label="Anterior"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={scrollNext}
                className="absolute right-2 top-[40%] -translate-y-1/2 bg-black/50 backdrop-blur-md p-2 rounded-full border border-white/10 text-white hover:bg-[#e34717] transition-colors z-10"
                aria-label="Próximo"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {categoryProducts.map((product, idx) => (
            <ProductCard key={product.id} product={product} index={idx} featured />
          ))}
        </div>
      </div>
    </section>
  );
};

const ProductListPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const graffitiTextRef = useRef<HTMLHeadingElement>(null);
  const { products, loading, error } = useProducts();
  const { categories, loading: categoriesLoading } = useCategories();

  const { groups, uncategorized } = useMemo(() => {
    if (!products.length || !categories.length) {
      return { groups: [] as CategoryGroup[], uncategorized: products };
    }

    const parentCategories = categories.filter(
      (cat) => !cat.parent_category_id
    );

    const groups: CategoryGroup[] = [];
    const categorizedProductIds = new Set<string>();

    for (const parentCat of parentCategories) {
      const categoryIds = new Set<string>([parentCat.id]);
      if (parentCat.category_children) {
        for (const child of parentCat.category_children) {
          categoryIds.add(child.id);
        }
      }

      const categoryProducts = products.filter((product) =>
        product.categories?.some((pc) => categoryIds.has(pc.id))
      );

      if (categoryProducts.length > 0) {
        groups.push({ category: parentCat, products: categoryProducts });
        categoryProducts.forEach((p) => categorizedProductIds.add(p.id));
      }
    }

    const PRIORITY_HANDLES = ['stickers', 'sticker', 'adesivos', 'adesivo'];

    groups.sort((a, b) => {
      const aHandle = a.category.handle?.toLowerCase() ?? '';
      const bHandle = b.category.handle?.toLowerCase() ?? '';
      const aPriority = PRIORITY_HANDLES.includes(aHandle) ? 0 : 1;
      const bPriority = PRIORITY_HANDLES.includes(bHandle) ? 0 : 1;
      return aPriority - bPriority;
    });

    const uncategorized = products.filter(
      (p) => !categorizedProductIds.has(p.id)
    );

    return { groups, uncategorized };
  }, [products, categories]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: "#hero-section",
          start: "top top",
          end: "bottom top",
          scrub: true,
        }
      });

      heroTl.to(videoRef.current, {
        scale: 1.1,
        filter: 'brightness(0.2) blur(20px)',
        y: 100
      }, 0)
        .to(graffitiTextRef.current, {
          y: -100,
          scale: 0.9,
          opacity: 0,
          letterSpacing: "2em"
        }, 0);

      gsap.to(graffitiTextRef.current, {
        filter: 'drop-shadow(0 0 20px rgba(227, 71, 23, 0.15))',
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {});

      const forcePlay = setInterval(() => {
        if (video.paused) {
          video.play().catch(() => {});
        }
      }, 1000);

      return () => clearInterval(forcePlay);
    }
  }, []);

  return (
    <div ref={containerRef} className="bg-[#050505] min-h-screen text-white carbon-pattern overflow-x-hidden">
      <div className="bg-flash fixed inset-0 opacity-0 pointer-events-none z-999" />

      <div className="relative">
        <section id="hero-section" className="relative h-[calc(100vh-200px)] lg:h-[80vh] w-full flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              disableRemotePlayback
              onCanPlay={(e) => {
                const video = e.currentTarget;
                video.play().catch(() => {});
              }}
              onPause={(e) => {
                const video = e.currentTarget;
                video.play().catch(() => {});
              }}
              className="w-full h-full object-cover grayscale brightness-[0.7] contrast-180 pointer-events-none select-none"
            >
              <source src="/banner.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 bg-linear-to-t from-[#050505] via-transparent to-black/60" />
          </div>

          <div className="container mx-auto px-6 relative z-20 flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] md:text-xs font-bold uppercase mb-6 md:mb-10 text-[#e34717] tracking-[0.4em]"
            >
              PREMIUM STREETWEAR
            </motion.div>

            <h1
              ref={graffitiTextRef}
              className="bg-linear-to-b from-white/60 via-white/40 to-transparent bg-clip-text text-transparent text-[30vw] sm:text-[18vw] md:text-[15vw] lg:text-[12vw] font-black italic tracking-tighter leading-[0.75] uppercase relative transition-all duration-300 select-none -rotate-2 drop-shadow-[0_0_20px_rgba(255,255,255,0.25)] pr-[0.2em]"
            >
              DROP<br />#001
            </h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 1.2 }}
              className="mt-10 lg:mt-14 flex flex-col items-center"
            >
              <div className="h-12 lg:h-16 w-px bg-linear-to-b from-[#e34717] to-transparent mb-4" />
              <p className="text-[9px] font-mono tracking-[.5em] uppercase text-zinc-600">Role para baixo para ver mais</p>
            </motion.div>
          </div>
        </section>

        <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 relative z-10 space-y-16 md:space-y-24">
          {(loading || categoriesLoading) && (
            <div className="flex items-center justify-center py-32">
              <Loader2 size={32} className="animate-spin text-[#e34717]" />
              <span className="ml-4 text-zinc-500 text-xs uppercase tracking-widest font-bold">Carregando Arquivo...</span>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <p className="text-[#e34717] text-sm font-bold uppercase tracking-widest mb-4">Erro do Sistema</p>
              <p className="text-zinc-600 text-xs">{error}</p>
            </div>
          )}

          {!loading && !categoriesLoading && !error && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Nenhum produto no arquivo ainda</p>
            </div>
          )}

          {!loading && !categoriesLoading && !error && groups.map(({ category, products: categoryProducts }, groupIdx) => {
            const STICKER_HANDLES = ['stickers', 'sticker', 'adesivos', 'adesivo'];
            const isSticker = STICKER_HANDLES.includes(category.handle?.toLowerCase() ?? '');

            if (isSticker) {
              return (
                <StickerSection
                  key={category.id}
                  category={category}
                  categoryProducts={categoryProducts}
                  groupIdx={groupIdx}
                />
              );
            }

            return (
              <section key={category.id} id={`category-${category.handle}`}>
                <SectionHeader
                  title={category.name}
                  subtitle={`Coleção ${String(groupIdx + 1).padStart(2, '0')}`}
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-10 md:gap-y-14">
                  {categoryProducts.map((product, idx) => (
                    <ProductCard key={product.id} product={product} index={idx} />
                  ))}
                </div>
              </section>
            );
          })}

          {!loading && !categoriesLoading && !error && uncategorized.length > 0 && (
            <section id="uncategorized-section">
              <SectionHeader title="Outros" subtitle="Arquivo" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-10 md:gap-y-14">
                {uncategorized.map((product, idx) => (
                  <ProductCard key={product.id} product={product} index={idx} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;
