'use client'

import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { sdk } from '@/lib/medusa'
import type { HttpTypes } from '@medusajs/types'
import ProductCard from '@/components/ProductCard'

const REGION_ID_KEY = 'medusa_region_id'

const CategoryPage: React.FC = () => {
  const { handle } = useParams<{ handle: string }>()
  const [category, setCategory] = useState<HttpTypes.StoreProductCategory | null>(
    null
  )
  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!handle) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setNotFound(false)
      try {
        const { product_categories } = await sdk.store.category.list({
          handle,
          fields: '+category_children,+parent_category',
          limit: 1,
        } as any)
        const cat = product_categories?.[0]
        if (!cat) {
          if (!cancelled) {
            setNotFound(true)
            setLoading(false)
          }
          return
        }
        if (cancelled) return
        setCategory(cat)

        const regionId =
          typeof window !== 'undefined'
            ? window.localStorage.getItem(REGION_ID_KEY) ?? undefined
            : undefined
        const { products } = await sdk.store.product.list({
          category_id: [cat.id],
          fields:
            '*variants,*variants.calculated_price,+variants.inventory_quantity,*categories',
          limit: 100,
          ...(regionId ? { region_id: regionId } : {}),
        })
        if (!cancelled) setProducts(products)
      } catch (err) {
        console.error('Failed to load category', err)
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [handle])

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 size={32} className="animate-spin text-[#e34717]" />
      </div>
    )
  }

  if (notFound || !category) {
    return (
      <div className="bg-[#0a0a0a] min-h-[80vh] text-white pt-16 pb-24">
        <div className="container mx-auto px-6 max-w-2xl text-center">
          <h1 className="text-4xl font-light tracking-tighter mb-6">
            Categoria não encontrada
          </h1>
          <Link
            to="/"
            className="inline-flex items-center gap-3 px-12 py-5 bg-white text-black text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-[#e34717] hover:text-white transition-all"
          >
            Voltar à loja
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white pt-10 pb-24">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex items-center gap-4 mb-4">
          <Link
            to="/"
            className="w-10 h-10 border border-white/10 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <ChevronLeft size={18} />
          </Link>
          <div className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-600">
            Categoria
          </div>
        </div>
        <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-2">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-zinc-500 text-sm max-w-2xl mb-12">
            {category.description}
          </p>
        )}
        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-12">
          {products.length} {products.length === 1 ? 'peça' : 'peças'}
        </div>

        {products.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              Nenhum drop nesta categoria no momento.
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default CategoryPage
