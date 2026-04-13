'use client'

import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, Loader2, Package, Truck } from 'lucide-react'
import { motion } from 'framer-motion'
import { retrieveCustomerOrder } from '@/lib/auth'
import { formatPrice } from '@/lib/hooks'
import type { HttpTypes } from '@medusajs/types'
import { useAuth } from '@/context/AuthContext'

const MEDUSA_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''

type TrackingResult = {
  status: string
  tracking_code: string | null
  carrier: string | null
  service_name: string
  delivery_min_days: number | null
  delivery_max_days: number | null
  last_synced_at: string | null
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho',
  pending: 'Aguardando pagamento',
  released: 'Etiqueta gerada',
  posted: 'Em trânsito',
  delivered: 'Entregue',
  canceled: 'Cancelado',
}

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: 'Aguardando',
  completed: 'Concluído',
  canceled: 'Cancelado',
  archived: 'Arquivado',
  requires_action: 'Ação necessária',
}

async function fetchTracking(orderId: string): Promise<TrackingResult | null> {
  try {
    const res = await fetch(
      `${MEDUSA_URL}/store/tracking/${encodeURIComponent(orderId)}`,
      {
        headers: PUBLISHABLE_KEY
          ? { 'x-publishable-api-key': PUBLISHABLE_KEY }
          : undefined,
        credentials: 'include',
      }
    )
    if (!res.ok) return null
    const body = await res.json()
    return body.tracking
  } catch {
    return null
  }
}

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [order, setOrder] = useState<HttpTypes.StoreOrder | null>(null)
  const [tracking, setTracking] = useState<TrackingResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id || authLoading) return
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    const load = async () => {
      const [o, t] = await Promise.all([
        retrieveCustomerOrder(id),
        fetchTracking(id),
      ])
      setOrder(o)
      setTracking(t)
      setLoading(false)
    }
    load()
  }, [id, isAuthenticated, authLoading])

  if (loading || authLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 size={32} className="animate-spin text-[#e34717]" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-[#0a0a0a] min-h-[80vh] text-white pt-16 pb-24 text-center">
        <div className="container mx-auto px-6 max-w-md">
          <h1 className="text-4xl font-light tracking-tighter mb-6">
            Acesso restrito
          </h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-10">
            Entre na sua conta para ver os detalhes do pedido.
          </p>
          <Link
            to="/conta"
            className="inline-flex items-center gap-3 px-12 py-5 bg-white text-black text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-[#e34717] hover:text-white transition-all"
          >
            Entrar
          </Link>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="bg-[#0a0a0a] min-h-[80vh] text-white pt-16 pb-24 text-center">
        <div className="container mx-auto px-6 max-w-md">
          <h1 className="text-4xl font-light tracking-tighter mb-6">
            Pedido não encontrado
          </h1>
          <Link
            to="/conta"
            className="inline-flex items-center gap-3 px-12 py-5 bg-white text-black text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-[#e34717] hover:text-white transition-all"
          >
            Voltar à conta
          </Link>
        </div>
      </div>
    )
  }

  const currency = order.currency_code ?? 'brl'
  const trackingStatusLabel = tracking
    ? STATUS_LABEL[tracking.status] || tracking.status
    : null

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white pt-10 pb-24">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-12">
          <Link
            to="/conta"
            className="w-10 h-10 border border-white/10 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <ChevronLeft size={18} />
          </Link>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-600">
              Pedido #{order.display_id ?? order.id.slice(0, 8)}
            </div>
            <h1 className="text-4xl font-light tracking-tighter">
              {order.created_at
                ? new Date(order.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })
                : ''}
            </h1>
          </div>
        </div>

        {tracking && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-950 border border-white/10 p-8 mb-10"
          >
            <div className="flex items-center gap-3 mb-6">
              <Truck size={16} className="text-[#e34717]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">
                Envio
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-600 mb-1">
                  Status
                </div>
                <div className="text-lg font-light tracking-tight">
                  {trackingStatusLabel}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-600 mb-1">
                  Transportadora
                </div>
                <div className="text-sm text-zinc-300">
                  {tracking.service_name}
                  {tracking.carrier ? ` · ${tracking.carrier}` : ''}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-600 mb-1">
                  Código
                </div>
                <div className="text-sm">
                  {tracking.tracking_code ? (
                    <code className="text-white">{tracking.tracking_code}</code>
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </div>
              </div>
            </div>
            <Link
              to={`/rastrear/${order.id}`}
              className="mt-6 inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#e34717] hover:text-white transition-colors"
            >
              <Package size={12} />
              Ver rastreio detalhado
            </Link>
          </motion.div>
        )}

        <div className="bg-zinc-950 border border-white/10 p-8 mb-10">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 mb-6">
            Itens do pedido
          </div>
          <div className="divide-y divide-white/5">
            {order.items?.map((item: any) => (
              <div key={item.id} className="py-5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium">{item.product_title || item.title}</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
                    {item.variant_title ? `${item.variant_title} · ` : ''}Qtd: {item.quantity}
                  </div>
                </div>
                <div className="text-sm tracking-tighter">
                  {formatPrice((item.unit_price ?? 0) * item.quantity, currency)}
                </div>
              </div>
            ))}
          </div>
          <div className="pt-6 mt-6 border-t border-white/10 space-y-3">
            <div className="flex justify-between text-sm text-zinc-400">
              <span>Subtotal</span>
              <span className="text-white">
                {formatPrice(order.item_subtotal ?? 0, currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm text-zinc-400">
              <span>Frete</span>
              <span className="text-white">
                {formatPrice(order.shipping_total ?? 0, currency)}
              </span>
            </div>
            {(order.discount_total ?? 0) > 0 && (
              <div className="flex justify-between text-sm text-green-500">
                <span>Desconto</span>
                <span>-{formatPrice(order.discount_total ?? 0, currency)}</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-4 border-t border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Total pago
              </span>
              <span className="text-3xl font-light tracking-tighter">
                {formatPrice(order.total ?? 0, currency)}
              </span>
            </div>
          </div>
        </div>

        {order.shipping_address && (
          <div className="bg-zinc-950 border border-white/10 p-8">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 mb-4">
              Endereço de entrega
            </div>
            <div className="text-sm leading-relaxed">
              {order.shipping_address.first_name} {order.shipping_address.last_name}
              <br />
              {order.shipping_address.address_1}
              <br />
              {order.shipping_address.city} · {order.shipping_address.province} ·{' '}
              {order.shipping_address.postal_code}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderDetailPage
