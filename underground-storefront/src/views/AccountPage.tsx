'use client'

import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  ChevronLeft,
  Loader2,
  LogOut,
  MapPin,
  Package,
  Plus,
  Trash2,
  User as UserIcon,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { formatPrice } from '@/lib/hooks'
import {
  CustomerAddress,
  createCustomerAddress,
  deleteCustomerAddress,
  listCustomerAddresses,
  listCustomerOrders,
  updateCurrentCustomer,
} from '@/lib/auth'
import type { HttpTypes } from '@medusajs/types'

type Tab = 'profile' | 'orders' | 'addresses'

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: 'Aguardando',
  completed: 'Concluído',
  canceled: 'Cancelado',
  archived: 'Arquivado',
  requires_action: 'Ação necessária',
  not_fulfilled: 'Preparando',
  partially_fulfilled: 'Parcial',
  fulfilled: 'Enviado',
  partially_shipped: 'Parcial',
  shipped: 'A caminho',
  delivered: 'Entregue',
}

const maskCEP = (value: string): string => {
  const d = value.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

const maskPhone = (value: string): string => {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

const Field: React.FC<{
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  disabled?: boolean
  maxLength?: number
}> = ({ label, value, onChange, type = 'text', placeholder, disabled, maxLength }) => (
  <div className="space-y-3">
    <label className="text-[8px] font-bold uppercase tracking-widest text-zinc-600">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      className="w-full bg-transparent border-b py-4 text-sm font-medium text-white placeholder:text-zinc-800 border-zinc-800 focus:border-[#e34717] focus:outline-none transition-all disabled:text-zinc-500"
    />
  </div>
)

// --- Auth (login/register) view ---

const AuthView: React.FC = () => {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        await register({
          email: form.email,
          password: form.password,
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone.replace(/\D/g, '') || undefined,
        })
      }
    } catch (err: any) {
      setError(
        err?.message ||
          (mode === 'login'
            ? 'E-mail ou senha inválidos.'
            : 'Não foi possível criar sua conta.')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#0a0a0a] min-h-[80vh] text-white pt-12 pb-24">
      <div className="container mx-auto px-6 max-w-md">
        <div className="flex items-center gap-4 mb-12">
          <Link
            to="/"
            className="w-10 h-10 border border-white/10 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <ChevronLeft size={18} />
          </Link>
          <h1 className="text-4xl font-light tracking-tighter">
            {mode === 'login' ? 'Entrar' : 'Cadastrar'}
          </h1>
        </div>

        <div className="flex gap-0 mb-10 border border-white/10">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-all ${
              mode === 'login'
                ? 'bg-white text-black'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            Já tenho conta
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-all ${
              mode === 'register'
                ? 'bg-white text-black'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={submit} className="space-y-8">
          <AnimatePresence mode="wait">
            {mode === 'register' && (
              <motion.div
                key="reg-fields"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-2 gap-6">
                  <Field
                    label="Nome"
                    value={form.first_name}
                    onChange={(v) => setForm({ ...form, first_name: v })}
                    placeholder="João"
                  />
                  <Field
                    label="Sobrenome"
                    value={form.last_name}
                    onChange={(v) => setForm({ ...form, last_name: v })}
                    placeholder="Silva"
                  />
                </div>
                <Field
                  label="Telefone"
                  value={form.phone}
                  onChange={(v) => setForm({ ...form, phone: maskPhone(v) })}
                  type="tel"
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <Field
            label="E-mail"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
            type="email"
            placeholder="usuario@underground.net"
          />
          <Field
            label="Senha"
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
            type="password"
            placeholder="••••••••"
          />

          {error && (
            <div className="flex items-center gap-3 bg-[#e34717]/10 border border-[#e34717]/20 p-4 text-[#e34717] text-xs font-medium">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#e34717] text-white py-6 text-[10px] font-bold uppercase tracking-[0.5em] hover:bg-white hover:text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {mode === 'login' ? 'Entrar' : 'Criar minha conta'}
          </button>
        </form>
      </div>
    </div>
  )
}

// --- Profile tab ---

const ProfileTab: React.FC = () => {
  const { customer, refresh } = useAuth()
  const [firstName, setFirstName] = useState(customer?.first_name ?? '')
  const [lastName, setLastName] = useState(customer?.last_name ?? '')
  const [phone, setPhone] = useState(
    customer?.phone ? maskPhone(customer.phone) : ''
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setFirstName(customer?.first_name ?? '')
    setLastName(customer?.last_name ?? '')
    setPhone(customer?.phone ? maskPhone(customer.phone) : '')
  }, [customer])

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await updateCurrentCustomer({
        first_name: firstName,
        last_name: lastName,
        phone: phone.replace(/\D/g, '') || undefined,
      })
      await refresh()
      setMessage('Dados atualizados.')
    } catch (e: any) {
      setMessage(e?.message || 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-light tracking-tighter mb-2">Dados pessoais</h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
          {customer?.email}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Field
          label="Nome"
          value={firstName}
          onChange={setFirstName}
          placeholder="João"
        />
        <Field
          label="Sobrenome"
          value={lastName}
          onChange={setLastName}
          placeholder="Silva"
        />
        <Field
          label="Telefone"
          value={phone}
          onChange={(v) => setPhone(maskPhone(v))}
          type="tel"
          placeholder="(11) 99999-9999"
          maxLength={15}
        />
      </div>

      {message && (
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#e34717]">
          {message}
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="bg-white text-black px-12 py-5 text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-[#e34717] hover:text-white transition-all disabled:opacity-40 flex items-center gap-3"
      >
        {saving && <Loader2 size={14} className="animate-spin" />}
        Salvar alterações
      </button>
    </div>
  )
}

// --- Orders tab ---

const OrdersTab: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<HttpTypes.StoreOrder[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { orders } = await listCustomerOrders()
        setOrders(orders)
      } catch (e: any) {
        setError(e?.message || 'Falha ao carregar pedidos')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-zinc-500">
        <Loader2 size={14} className="animate-spin text-[#e34717]" />
        <span className="text-[10px] font-bold uppercase tracking-widest">
          Carregando pedidos…
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 text-[#e34717]">
        <AlertCircle size={14} />
        <span>{error}</span>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        <Package size={28} className="text-zinc-700" />
        <h2 className="text-2xl font-light tracking-tighter">
          Você ainda não tem pedidos
        </h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
          Quando comprar seu primeiro drop, ele aparece aqui.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-3 px-12 py-5 bg-white text-black text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-[#e34717] hover:text-white transition-all"
        >
          Explorar peças
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-light tracking-tighter mb-6">
        Meus pedidos <span className="text-zinc-700 text-lg ml-2">({orders.length})</span>
      </h2>
      {orders.map((order) => {
        const currency = order.currency_code ?? 'brl'
        const status =
          ORDER_STATUS_LABEL[order.status as any] ||
          order.status ||
          '—'
        const created = order.created_at
          ? new Date(order.created_at).toLocaleDateString('pt-BR')
          : ''
        return (
          <Link
            key={order.id}
            to={`/pedido/${order.id}`}
            className="block bg-zinc-950 border border-white/10 hover:border-[#e34717]/40 transition-all p-6"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-600">
                  #{order.display_id ?? order.id.slice(0, 8)}
                </div>
                <div className="text-xl font-light tracking-tighter text-white mt-1">
                  {created}
                </div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-2">
                  {order.items?.length ?? 0} item(ns)
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-bold uppercase tracking-widest text-[#e34717] mb-2">
                  {status}
                </div>
                <div className="text-2xl font-light tracking-tighter">
                  {formatPrice(order.total ?? 0, currency)}
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

// --- Addresses tab ---

const AddressesTab: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    postal_code: '',
    address_1: '',
    number: '',
    complement: '',
    district: '',
    city: '',
    province: '',
  })

  const load = async () => {
    setLoading(true)
    try {
      const list = await listCustomerAddresses()
      setAddresses(list)
    } catch (e: any) {
      setError(e?.message || 'Falha ao carregar endereços')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const resetForm = () => {
    setForm({
      first_name: '',
      last_name: '',
      phone: '',
      postal_code: '',
      address_1: '',
      number: '',
      complement: '',
      district: '',
      city: '',
      province: '',
    })
  }

  const save = async () => {
    setSaving(true)
    try {
      const addressLine = [form.address_1, form.number, form.complement]
        .filter(Boolean)
        .join(', ')
      await createCustomerAddress({
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone.replace(/\D/g, '') || undefined,
        address_1: addressLine,
        postal_code: form.postal_code.replace(/\D/g, ''),
        city: form.city,
        province: form.province.toUpperCase(),
        country_code: 'br',
        metadata: {
          district: form.district,
          number: form.number,
        },
      } as any)
      resetForm()
      setShowForm(false)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    await deleteCustomerAddress(id)
    await load()
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-zinc-500">
        <Loader2 size={14} className="animate-spin text-[#e34717]" />
        <span className="text-[10px] font-bold uppercase tracking-widest">
          Carregando endereços…
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-light tracking-tighter">
          Endereços salvos{' '}
          <span className="text-zinc-700 text-lg ml-2">({addresses.length})</span>
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#e34717] hover:text-white transition-colors"
        >
          <Plus size={14} />
          {showForm ? 'Cancelar' : 'Novo endereço'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 text-[#e34717]">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-zinc-950 border border-white/10 p-8 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field
                label="Nome"
                value={form.first_name}
                onChange={(v) => setForm({ ...form, first_name: v })}
              />
              <Field
                label="Sobrenome"
                value={form.last_name}
                onChange={(v) => setForm({ ...form, last_name: v })}
              />
              <Field
                label="Telefone"
                type="tel"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: maskPhone(v) })}
                maxLength={15}
              />
              <Field
                label="CEP"
                value={form.postal_code}
                onChange={(v) => setForm({ ...form, postal_code: maskCEP(v) })}
                maxLength={9}
              />
              <Field
                label="Endereço"
                value={form.address_1}
                onChange={(v) => setForm({ ...form, address_1: v })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Número"
                  value={form.number}
                  onChange={(v) => setForm({ ...form, number: v })}
                />
                <Field
                  label="Complemento"
                  value={form.complement}
                  onChange={(v) => setForm({ ...form, complement: v })}
                />
              </div>
              <Field
                label="Bairro"
                value={form.district}
                onChange={(v) => setForm({ ...form, district: v })}
              />
              <Field
                label="Cidade"
                value={form.city}
                onChange={(v) => setForm({ ...form, city: v })}
              />
              <Field
                label="Estado (UF)"
                value={form.province}
                onChange={(v) => setForm({ ...form, province: v.toUpperCase().slice(0, 2) })}
                maxLength={2}
              />
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="bg-white text-black px-12 py-5 text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-[#e34717] hover:text-white transition-all disabled:opacity-40 flex items-center gap-3"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Salvar endereço
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addresses.length === 0 && !showForm && (
          <div className="md:col-span-2 text-center py-16 border border-dashed border-white/10">
            <MapPin size={24} className="text-zinc-700 mx-auto mb-4" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              Nenhum endereço salvo ainda
            </p>
          </div>
        )}
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className="bg-zinc-950 border border-white/10 p-6 relative group"
          >
            <button
              onClick={() => remove(addr.id)}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-zinc-600 hover:text-[#e34717] hover:bg-[#e34717]/10 rounded-full transition-all"
              aria-label="Remover endereço"
            >
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
            <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-600 mb-3">
              {addr.first_name} {addr.last_name}
            </div>
            <div className="text-sm text-white font-medium leading-relaxed">
              {addr.address_1}
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-3">
              {addr.city} · {addr.province} · {addr.postal_code}
            </div>
            {addr.phone && (
              <div className="text-[10px] text-zinc-600 mt-2">{addr.phone}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Main page ---

const AccountPage: React.FC = () => {
  const { customer, isAuthenticated, loading, logout } = useAuth()
  const [tab, setTab] = useState<Tab>('profile')
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 size={32} className="animate-spin text-[#e34717]" />
      </div>
    )
  }

  if (!isAuthenticated || !customer) {
    return <AuthView />
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: 'profile', label: 'Perfil', icon: <UserIcon size={14} /> },
    { id: 'orders', label: 'Pedidos', icon: <Package size={14} /> },
    { id: 'addresses', label: 'Endereços', icon: <MapPin size={14} /> },
  ]

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white pt-10 pb-24">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex items-center justify-between gap-4 mb-12 flex-wrap">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="w-10 h-10 border border-white/10 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
            >
              <ChevronLeft size={18} />
            </Link>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-600">
                Minha conta
              </div>
              <h1 className="text-4xl md:text-5xl font-light tracking-tighter">
                {customer.first_name || 'Você'}
              </h1>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-6 py-3 text-[10px] font-bold uppercase tracking-widest border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all"
          >
            <LogOut size={12} />
            Sair
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <aside className="lg:col-span-3">
            <div className="flex lg:flex-col gap-2 lg:gap-1 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-3 px-5 py-4 text-[10px] font-bold uppercase tracking-[0.3em] transition-all shrink-0 lg:w-full lg:justify-start ${
                    tab === t.id
                      ? 'bg-white text-black'
                      : 'border border-white/10 text-zinc-500 hover:text-white hover:border-white/20'
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </aside>

          <main className="lg:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {tab === 'profile' && <ProfileTab />}
                {tab === 'orders' && <OrdersTab />}
                {tab === 'addresses' && <AddressesTab />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  )
}

export default AccountPage
