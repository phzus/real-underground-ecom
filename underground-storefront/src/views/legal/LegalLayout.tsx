'use client'

import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

interface LegalLayoutProps {
  eyebrow: string
  title: string
  updatedAt?: string
  children: React.ReactNode
}

export const LegalSection: React.FC<{
  title: string
  children: React.ReactNode
}> = ({ title, children }) => (
  <section className="space-y-4">
    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-white">
      {title}
    </h2>
    <div className="text-zinc-400 text-sm leading-relaxed space-y-4">
      {children}
    </div>
  </section>
)

const LegalLayout: React.FC<LegalLayoutProps> = ({
  eyebrow,
  title,
  updatedAt,
  children,
}) => (
  <div className="bg-[#0a0a0a] min-h-screen text-white pt-10 pb-24">
    <div className="container mx-auto px-6 max-w-3xl">
      <div className="flex items-center gap-4 mb-10">
        <Link
          to="/"
          className="w-10 h-10 border border-white/10 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <ChevronLeft size={18} />
        </Link>
        <div className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-600">
          {eyebrow}
        </div>
      </div>
      <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
        {title}
      </h1>
      {updatedAt && (
        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-12">
          Atualizada em {updatedAt}
        </div>
      )}
      <div className="space-y-12">{children}</div>
    </div>
  </div>
)

export default LegalLayout
