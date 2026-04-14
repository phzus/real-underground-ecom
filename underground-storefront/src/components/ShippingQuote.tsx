'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Truck, AlertCircle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type QuoteOption = {
  service_code: number;
  name: string;
  company?: string;
  logo?: string;
  price: number;
  currency: string;
  delivery_min: number;
  delivery_max: number;
};

export type ShippingQuoteItem = {
  name?: string;
  quantity: number;
  unit_price?: number;
  weight?: number | null;
  height?: number | null;
  width?: number | null;
  length?: number | null;
};

type Props = {
  items: ShippingQuoteItem[];
  cartId?: string;
  initialCep?: string;
  selectedServiceCode?: number | null;
  onSelect?: (option: QuoteOption | null, cep: string) => void;
  onCepChange?: (cep: string) => void;
  showCepInput?: boolean;
  label?: string;
};

const MEDUSA_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '';

const maskCEP = (value: string): string => {
  const d = value.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
};

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

async function fetchQuote(
  cep: string,
  items: ShippingQuoteItem[],
  cartId?: string
): Promise<QuoteOption[]> {
  const res = await fetch(`${MEDUSA_URL}/store/shipping/quote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(PUBLISHABLE_KEY ? { 'x-publishable-api-key': PUBLISHABLE_KEY } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({
      to_postal_code: cep.replace(/\D/g, ''),
      items,
      cart_id: cartId,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || 'Falha ao calcular frete');
  }
  const body = await res.json();
  return (body.options || []) as QuoteOption[];
}

const ShippingQuote: React.FC<Props> = ({
  items,
  cartId,
  initialCep = '',
  selectedServiceCode = null,
  onSelect,
  onCepChange,
  showCepInput = true,
  label = 'Frete',
}) => {
  const [cep, setCep] = useState(() => (initialCep ? maskCEP(initialCep) : ''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<QuoteOption[]>([]);
  const [touched, setTouched] = useState(false);

  const run = useCallback(
    async (rawCep: string) => {
      const digits = rawCep.replace(/\D/g, '');
      if (digits.length !== 8) return;
      if (!items || items.length === 0) return;
      setLoading(true);
      setError(null);
      try {
        const list = await fetchQuote(digits, items, cartId);
        setOptions(list);
        if (list.length > 0 && selectedServiceCode == null && onSelect) {
          const cheapest = [...list].sort((a, b) => a.price - b.price)[0];
          onSelect(cheapest, digits);
        }
      } catch (e) {
        setError((e as Error).message);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [items, cartId, selectedServiceCode, onSelect]
  );

  useEffect(() => {
    if (initialCep && initialCep.replace(/\D/g, '').length === 8) {
      setCep(maskCEP(initialCep));
      run(initialCep);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCep, items.length]);

  const handleCepInput = (v: string) => {
    const masked = maskCEP(v);
    setCep(masked);
    setTouched(true);
    if (onCepChange) onCepChange(masked.replace(/\D/g, ''));
    if (masked.replace(/\D/g, '').length === 8) {
      run(masked);
    } else {
      setOptions([]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Truck size={14} className="text-[#e34717]" />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">
          {label}
        </span>
      </div>

      {showCepInput && (
        <div className="space-y-10">
          <label className="text-[8px] font-bold uppercase tracking-widest text-zinc-600">
            CEP de entrega
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={cep}
              onChange={(e) => handleCepInput(e.target.value)}
              maxLength={9}
              placeholder="00000-000"
              className="w-full bg-transparent border-b py-3 pr-8 text-sm font-medium text-white placeholder:text-zinc-800 border-zinc-800 focus:border-[#e34717] focus:outline-none transition-all"
              aria-label="CEP de entrega"
            />
            {loading && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                <Loader2 size={14} className="text-[#e34717] animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-[#e34717] text-[10px] font-medium">
          <AlertCircle size={12} />
          {error}
        </div>
      )}

      {options.length === 0 && !loading && !error && touched && (
        <p className="text-[9px] text-zinc-600 uppercase tracking-widest">
          Digite um CEP válido para ver as opções
        </p>
      )}

      <AnimatePresence>
        {options.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-2"
          >
            {options.map((opt) => {
              const selected = selectedServiceCode === opt.service_code;
              return (
                <button
                  key={opt.service_code}
                  type="button"
                  onClick={() => onSelect && onSelect(opt, cep.replace(/\D/g, ''))}
                  className={`w-full text-left px-4 py-3 border transition-all rounded-sm flex items-center justify-between gap-4 ${
                    selected
                      ? 'border-[#e34717] bg-[#e34717]/5'
                      : 'border-white/10 hover:border-white/20 bg-zinc-950'
                  }`}
                  aria-pressed={selected}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        selected
                          ? 'border-[#e34717] bg-[#e34717]'
                          : 'border-zinc-700'
                      }`}
                    >
                      {selected && <Check size={10} className="text-white" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {opt.name}
                      </div>
                      <div className="text-[9px] uppercase tracking-widest text-zinc-500">
                        {opt.company ? `${opt.company} · ` : ''}
                        {opt.delivery_min === opt.delivery_max
                          ? `${opt.delivery_max} dias úteis`
                          : `${opt.delivery_min}–${opt.delivery_max} dias úteis`}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-light tracking-tighter text-white shrink-0">
                    {formatBRL(opt.price)}
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShippingQuote;
