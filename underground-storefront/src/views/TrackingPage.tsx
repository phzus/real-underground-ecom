'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, Loader2, AlertCircle, CheckCircle2, Truck } from 'lucide-react';

const MEDUSA_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '';

type TrackingResult = {
  status: string;
  tracking_code: string | null;
  carrier: string | null;
  service_name: string;
  delivery_min_days: number | null;
  delivery_max_days: number | null;
  last_synced_at: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho',
  pending: 'Aguardando pagamento',
  released: 'Etiqueta gerada',
  posted: 'Em trânsito',
  delivered: 'Entregue',
  canceled: 'Cancelado',
  error: 'Erro',
};

const STATUS_STEP: Record<string, number> = {
  draft: 0,
  pending: 0,
  released: 1,
  posted: 2,
  delivered: 3,
};

const STEPS = [
  { label: 'Pedido', description: 'Pedido recebido' },
  { label: 'Etiqueta', description: 'Etiqueta emitida' },
  { label: 'Trânsito', description: 'A caminho' },
  { label: 'Entregue', description: 'Entregue ao destinatário' },
];

async function lookup(code: string): Promise<TrackingResult> {
  const clean = code.trim();
  if (!clean) throw new Error('Informe o código do pedido ou de rastreio.');
  const res = await fetch(
    `${MEDUSA_URL}/store/tracking/${encodeURIComponent(clean)}`,
    {
      headers: PUBLISHABLE_KEY
        ? { 'x-publishable-api-key': PUBLISHABLE_KEY }
        : undefined,
      credentials: 'include',
    }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || 'Envio não encontrado.');
  }
  const body = await res.json();
  return body.tracking as TrackingResult;
}

const TrackingPage: React.FC = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackingResult | null>(null);

  const onSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await lookup(code);
      setResult(r);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const activeStep = result ? STATUS_STEP[result.status] ?? 0 : -1;

  return (
    <div className="bg-[#0a0a0a] min-h-[80vh] text-white pt-12 pb-24">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-10 h-10 border border-white/10 flex items-center justify-center rounded-full text-[#e34717]">
            <Package size={18} />
          </div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tighter">
            Rastrear pedido
          </h1>
        </div>

        <form onSubmit={onSearch} className="mb-12">
          <label className="text-[8px] font-bold uppercase tracking-widest text-zinc-600 block mb-3">
            Código do pedido ou de rastreio
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex: BR123456789BR ou o ID do pedido"
              className="flex-1 bg-transparent border-b py-4 text-sm font-medium text-white placeholder:text-zinc-800 border-zinc-800 focus:border-[#e34717] focus:outline-none transition-all"
              aria-label="Código de rastreio"
            />
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="px-8 py-4 bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-[#e34717] hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Search size={14} />
              )}
              Buscar
            </button>
          </div>
        </form>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 bg-[#e34717]/10 border border-[#e34717]/20 p-5 text-[#e34717] rounded-sm"
            >
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-10"
            >
              <div className="bg-zinc-950 border border-white/10 p-8 rounded-sm">
                <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-600 mb-2">
                      Status atual
                    </div>
                    <div className="text-3xl font-light tracking-tighter">
                      {STATUS_LABEL[result.status] || result.status}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-600 mb-2">
                      Serviço
                    </div>
                    <div className="text-sm text-zinc-300">
                      {result.service_name}
                      {result.carrier ? ` · ${result.carrier}` : ''}
                    </div>
                  </div>
                </div>

                {result.tracking_code && (
                  <div className="mb-8">
                    <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-600 mb-2">
                      Código de rastreio dos Correios
                    </div>
                    <code className="text-sm text-white font-mono">
                      {result.tracking_code}
                    </code>
                  </div>
                )}

                <div className="relative pt-4">
                  <div className="absolute top-[30px] left-4 right-4 h-[2px] bg-zinc-900">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: activeStep > 0 ? `${(activeStep / 3) * 100}%` : '0%',
                      }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-[#e34717]"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2 relative">
                    {STEPS.map((s, idx) => {
                      const reached = idx <= activeStep
                      return (
                        <div key={s.label} className="flex flex-col items-center">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mb-3 transition-colors ${
                              reached
                                ? 'border-[#e34717] bg-[#e34717]'
                                : 'border-zinc-800 bg-[#0a0a0a]'
                            }`}
                          >
                            {reached &&
                              (idx === 3 ? (
                                <CheckCircle2 size={10} className="text-white" />
                              ) : idx === 2 ? (
                                <Truck size={10} className="text-white" />
                              ) : (
                                <span className="w-1.5 h-1.5 bg-white rounded-full" />
                              ))}
                          </div>
                          <span
                            className={`text-[8px] font-bold uppercase tracking-widest ${
                              reached ? 'text-white' : 'text-zinc-700'
                            }`}
                          >
                            {s.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {result.last_synced_at && (
                <div className="text-[9px] text-zinc-600 uppercase tracking-widest text-center">
                  Última atualização:{' '}
                  {new Date(result.last_synced_at).toLocaleString('pt-BR')}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TrackingPage;
