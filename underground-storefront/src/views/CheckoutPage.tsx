'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Lock, Loader2, AlertCircle, ChevronDown, ChevronUp, ShieldCheck, MapPin } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/hooks';
import { sdk } from '@/lib/medusa';
import type { HttpTypes } from '@medusajs/types';
import ShippingQuote, { QuoteOption, ShippingQuoteItem } from '@/components/ShippingQuote';
import {
  CustomerAddress,
  createCustomerAddress,
  listCustomerAddresses,
} from '@/lib/auth';
import { Save } from 'lucide-react';

const SHIPPING_PREVIEW_KEY = 'superfrete_preview';
const CHECKOUT_FORM_KEY = 'checkout_form_draft';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PK || '');

type Step = 'shipping' | 'payment' | 'success';

// --- Masks ---

const maskCEP = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const maskPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

// --- Validators ---

type FieldErrors = Record<string, string>;

const validateEmail = (email: string): string | null => {
  if (!email.trim()) return 'E-mail é obrigatório';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'E-mail inválido';
  return null;
};

const validatePhone = (phone: string): string | null => {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return 'Telefone é obrigatório';
  if (digits.length < 10 || digits.length > 11) return 'Telefone deve ter 10 ou 11 dígitos';
  return null;
};

const validateName = (name: string, label: string): string | null => {
  if (!name.trim()) return `${label} é obrigatório`;
  if (name.trim().length < 2) return `${label} deve ter pelo menos 2 caracteres`;
  return null;
};

const validateCEP = (cep: string): string | null => {
  const digits = cep.replace(/\D/g, '');
  if (!digits) return 'CEP é obrigatório';
  if (digits.length !== 8) return 'CEP deve ter 8 dígitos';
  return null;
};

const validateRequired = (value: string, label: string): string | null => {
  if (!value.trim()) return `${label} é obrigatório`;
  return null;
};

const validateAllFields = (form: ShippingForm): FieldErrors => {
  const errors: FieldErrors = {};
  const emailErr = validateEmail(form.email);
  if (emailErr) errors.email = emailErr;
  const phoneErr = validatePhone(form.phone);
  if (phoneErr) errors.phone = phoneErr;
  const firstNameErr = validateName(form.firstName, 'Nome');
  if (firstNameErr) errors.firstName = firstNameErr;
  const lastNameErr = validateName(form.lastName, 'Sobrenome');
  if (lastNameErr) errors.lastName = lastNameErr;
  const cepErr = validateCEP(form.postalCode);
  if (cepErr) errors.postalCode = cepErr;
  const addressErr = validateRequired(form.address1, 'Rua');
  if (addressErr) errors.address1 = addressErr;
  const numberErr = validateRequired(form.number, 'Número');
  if (numberErr) errors.number = numberErr;
  const neighborhoodErr = validateRequired(form.neighborhood, 'Bairro');
  if (neighborhoodErr) errors.neighborhood = neighborhoodErr;
  const cityErr = validateRequired(form.city, 'Cidade');
  if (cityErr) errors.city = cityErr;
  const stateErr = validateRequired(form.state, 'Estado');
  if (stateErr) errors.state = stateErr;
  return errors;
};

// --- ViaCEP ---

interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

const fetchAddressByCEP = async (cep: string): Promise<ViaCEPResponse | null> => {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    const data: ViaCEPResponse = await response.json();
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
};

// --- Types ---

interface ShippingForm {
  email: string;
  firstName: string;
  lastName: string;
  address1: string;
  number: string;
  complement: string;
  neighborhood: string;
  postalCode: string;
  city: string;
  state: string;
  countryCode: string;
  phone: string;
}

// --- Components ---

const InputField = ({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  onBlur,
  autoComplete,
  error,
  disabled = false,
  loading = false,
  maxLength,
  inputRef,
}: {
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  autoComplete?: string;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
  maxLength?: number;
  inputRef?: React.Ref<HTMLInputElement>;
}) => (
  <div className="space-y-3 relative group">
    <label className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest group-focus-within:text-[#e34717] transition-colors">{label}</label>
    <div className="relative">
      <input
        ref={inputRef}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        autoComplete={autoComplete}
        disabled={disabled}
        maxLength={maxLength}
        className={`w-full bg-transparent border-b py-4 pr-8 text-sm font-medium focus:outline-none transition-all placeholder:text-zinc-800 text-white disabled:text-zinc-500 disabled:cursor-not-allowed ${
          error ? 'border-[#e34717]' : 'border-zinc-800 focus:border-[#e34717]'
        }`}
        aria-label={label}
        aria-invalid={!!error}
      />
      <div className="absolute right-0 top-1/2 -translate-y-1/2">
        {loading && <Loader2 size={16} className="text-[#e34717] animate-spin" />}
        {!loading && value && !error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[#e34717]"
          >
            <CheckCircle2 size={16} />
          </motion.div>
        )}
      </div>
    </div>
    {error && (
      <motion.p
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-[9px] font-medium text-[#e34717] tracking-wide"
      >
        {error}
      </motion.p>
    )}
  </div>
);

const StepProgress = ({ step }: { step: Step }) => {
  const steps = ['shipping', 'payment'];
  const currentIndex = steps.indexOf(step);

  return (
    <div className="max-w-xl mx-auto mb-16 px-4">
      <div className="flex justify-between mb-4">
        {['Endereço', 'Pagar'].map((label, idx) => (
          <div key={label} className="flex flex-col items-center">
            <span className={`text-[9px] font-bold uppercase tracking-[0.3em] transition-colors ${idx <= currentIndex ? 'text-white' : 'text-zinc-700'}`}>
              {label}
            </span>
            <span className={`text-[8px] mt-1 transition-colors ${idx === currentIndex ? 'text-[#e34717]' : 'text-transparent'}`}>
              Etapa {idx + 1} de 2
            </span>
          </div>
        ))}
      </div>
      <div className="h-[2px] w-full bg-zinc-900 relative overflow-hidden rounded-full">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(currentIndex + 1) * 50}%` }}
          className="absolute top-0 left-0 h-full bg-[#e34717] transition-all duration-500"
        />
      </div>
    </div>
  );
};

const StripeForm = ({
  clientSecret,
  onSuccess,
  orderTotal,
}: {
  clientSecret: string;
  onSuccess: () => void;
  orderTotal?: number;
}) => {
  const { cart, refreshCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stripe = useStripe();
  const elements = useElements();

  const handleCompleteOrder = async () => {
    if (!cart) return;

    const result = await sdk.store.cart.complete(cart.id);

    if (result.type === 'order') {
      await refreshCart();
      onSuccess();
    } else if (result.type === 'cart') {
      setError('Pedido não pôde ser concluído. Tente novamente.');
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !cart) return;

    setLoading(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'Erro na validação do pagamento');
        setLoading(false);
        return;
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/#/checkout`,
          payment_method_data: {
            billing_details: {
              name: [cart.billing_address?.first_name, cart.billing_address?.last_name].filter(Boolean).join(' ') || undefined,
              email: cart.email || undefined,
              phone: cart.billing_address?.phone || undefined,
              address: {
                city: cart.billing_address?.city || undefined,
                country: cart.billing_address?.country_code || undefined,
                line1: cart.billing_address?.address_1 || undefined,
                line2: cart.billing_address?.address_2 || undefined,
                postal_code: cart.billing_address?.postal_code || undefined,
              },
            },
          },
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        const pi = confirmError.payment_intent;
        if (pi && (pi.status === 'requires_capture' || pi.status === 'succeeded')) {
          await handleCompleteOrder();
          return;
        }
        setError(confirmError.message ?? 'Pagamento falhou');
        return;
      }

      if (paymentIntent && (paymentIntent.status === 'requires_capture' || paymentIntent.status === 'succeeded')) {
        await handleCompleteOrder();
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePayment} className="space-y-8">
      <div className="bg-zinc-950 border border-white/10 rounded-sm p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#e34717] to-transparent opacity-50"></div>
        <div className="flex justify-between items-center mb-6">
          <label className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest block">Dados do Pagamento</label>
          <div className="flex gap-2">
            <ShieldCheck size={16} className="text-zinc-500" />
            <Lock size={16} className="text-zinc-500" />
          </div>
        </div>
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-[#e34717]/10 border border-[#e34717]/20 p-4 text-[#e34717] text-xs font-medium rounded-sm"
        >
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      <div>
        <button
          type="submit"
          disabled={loading || !stripe || !elements}
          className="w-full bg-[#e34717] text-white py-6 text-[10px] font-bold uppercase tracking-[0.5em] hover:bg-white hover:text-black transition-all shadow-2xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group"
          aria-label="Finalizar pagamento"
          tabIndex={0}
        >
          <span className="absolute inset-0 w-full h-full bg-white -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></span>
          <span className="relative flex items-center gap-3 group-hover:text-black transition-colors">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
            {loading ? 'Processando...' : `Pagar ${formatPrice(orderTotal ?? cart?.total ?? 0, cart?.currency_code ?? 'brl')}`}
          </span>
        </button>
        <div className="mt-6 flex flex-col items-center justify-center gap-2 text-zinc-500">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Pagamento 100% Seguro</span>
          </div>
          <span className="text-[8px] uppercase tracking-widest text-zinc-600">Processado via Stripe</span>
        </div>
      </div>
    </form>
  );
};

// --- Main Page ---

const CheckoutPage: React.FC = () => {
  const [step, setStep] = useState<Step>('shipping');
  const { cart, updateCart } = useCart();
  const { customer, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<HttpTypes.StoreCartShippingOption[]>([]);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [confirmedTotal, setConfirmedTotal] = useState<number | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepFetched, setCepFetched] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const numberInputRef = useRef<HTMLInputElement>(null);

  // Saved addresses (only loaded for authenticated customers)
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [saveAddress, setSaveAddress] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [shippingForm, setShippingForm] = useState<ShippingForm>(() => {
    const empty: ShippingForm = {
      email: '',
      firstName: '',
      lastName: '',
      address1: '',
      number: '',
      complement: '',
      neighborhood: '',
      postalCode: '',
      city: '',
      state: '',
      countryCode: 'br',
      phone: '',
    };
    if (typeof window === 'undefined') return empty;
    // 1. Restore the persisted draft (if any)
    try {
      const raw = window.localStorage.getItem(CHECKOUT_FORM_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ShippingForm>;
        Object.assign(empty, parsed);
      }
    } catch {
      // ignore
    }
    // 2. Seed the CEP from the cart preview if the draft still doesn't have one
    if (!empty.postalCode) {
      try {
        const raw = window.localStorage.getItem(SHIPPING_PREVIEW_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.cep) empty.postalCode = maskCEP(parsed.cep);
        }
      } catch {
        // ignore
      }
    }
    return empty;
  });
  // Tracks whether the user has actually interacted with the form in
  // this session. Used to avoid auto-scrolling/auto-focusing when the
  // form is hydrated from persisted state on mount.
  const userInteractedRef = useRef(false);
  const [selectedQuote, setSelectedQuote] = useState<QuoteOption | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(SHIPPING_PREVIEW_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.service_code) return null;
      return {
        service_code: parsed.service_code,
        name: parsed.service_name || '',
        price: parsed.price || 0,
        currency: 'R$',
        delivery_min: 0,
        delivery_max: 0,
      } as QuoteOption;
    } catch {
      return null;
    }
  });

  const currencyCode = cart?.currency_code ?? 'brl';

  useEffect(() => {
    if (!cart?.id) return;

    const fetchShippingOptions = async () => {
      try {
        const { shipping_options } = await sdk.store.fulfillment.listCartOptions({ cart_id: cart.id });
        setShippingOptions(shipping_options ?? []);
      } catch (err) {
        console.error("Failed to fetch shipping options:", err);
      }
    };

    fetchShippingOptions();
  }, [cart?.id]);

  // Prefill email and load saved addresses when logged in
  useEffect(() => {
    if (!isAuthenticated || !customer) return;
    setShippingForm((prev) => ({
      ...prev,
      email: prev.email || customer.email || '',
      firstName: prev.firstName || customer.first_name || '',
      lastName: prev.lastName || customer.last_name || '',
      phone: prev.phone || (customer.phone ? maskPhone(customer.phone) : ''),
    }));
    listCustomerAddresses()
      .then((addrs) => setSavedAddresses(addrs))
      .catch((err) => console.error('Failed to load addresses', err));
  }, [isAuthenticated, customer]);

  const applySavedAddress = (addrId: string) => {
    const addr = savedAddresses.find((a) => a.id === addrId);
    if (!addr) return;
    setSelectedAddressId(addrId);
    const meta = (addr.metadata ?? {}) as Record<string, any>;
    const addrParts = (addr.address_1 ?? '').split(',').map((s) => s.trim());
    setShippingForm((prev) => ({
      ...prev,
      firstName: addr.first_name || prev.firstName,
      lastName: addr.last_name || prev.lastName,
      phone: addr.phone ? maskPhone(addr.phone) : prev.phone,
      postalCode: addr.postal_code ? maskCEP(addr.postal_code) : prev.postalCode,
      address1: addrParts[0] || prev.address1,
      number: meta.number || addrParts[1] || prev.number,
      complement: addrParts[2] || prev.complement,
      neighborhood: meta.district || prev.neighborhood,
      city: addr.city || prev.city,
      state: (addr.province || '').toUpperCase() || prev.state,
      countryCode: addr.country_code || 'br',
    }));
    setCepFetched(true);
    setFieldErrors({});
  };

  // Persist form draft whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        CHECKOUT_FORM_KEY,
        JSON.stringify(shippingForm)
      );
    } catch {
      // ignore quota errors
    }
  }, [shippingForm]);

  // ViaCEP auto-fill
  useEffect(() => {
    const digits = shippingForm.postalCode.replace(/\D/g, '');
    if (digits.length !== 8) {
      if (cepFetched) setCepFetched(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setCepLoading(true);
      const data = await fetchAddressByCEP(digits);
      setCepLoading(false);

      if (data) {
        setCepFetched(true);
        setShippingForm((prev) => ({
          ...prev,
          address1: data.logradouro || prev.address1,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
          complement: data.complemento || prev.complement,
        }));
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next.address1;
          delete next.neighborhood;
          delete next.city;
          delete next.state;
          delete next.postalCode;
          return next;
        });
        // Only auto-focus the "number" field if the user actually typed
        // the CEP in this session — otherwise we'd yank the page up when
        // they're already scrolled to the shipping-method step.
        if (userInteractedRef.current) {
          numberInputRef.current?.focus({ preventScroll: true });
        }
      } else {
        setCepFetched(false);
        setFieldErrors((prev) => ({ ...prev, postalCode: 'CEP não encontrado' }));
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [shippingForm.postalCode]);

  const handleShippingChange = (field: keyof ShippingForm, value: string) => {
    userInteractedRef.current = true;
    let maskedValue = value;

    if (field === 'postalCode') maskedValue = maskCEP(value);
    if (field === 'phone') maskedValue = maskPhone(value);

    setShippingForm((prev) => ({ ...prev, [field]: maskedValue }));

    if (touched[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleBlur = (field: keyof ShippingForm) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    const form = shippingForm;
    let error: string | null = null;

    switch (field) {
      case 'email': error = validateEmail(form.email); break;
      case 'phone': error = validatePhone(form.phone); break;
      case 'firstName': error = validateName(form.firstName, 'Nome'); break;
      case 'lastName': error = validateName(form.lastName, 'Sobrenome'); break;
      case 'postalCode': error = validateCEP(form.postalCode); break;
      case 'address1': error = validateRequired(form.address1, 'Rua'); break;
      case 'number': error = validateRequired(form.number, 'Número'); break;
      case 'neighborhood': error = validateRequired(form.neighborhood, 'Bairro'); break;
      case 'city': error = validateRequired(form.city, 'Cidade'); break;
      case 'state': error = validateRequired(form.state, 'Estado'); break;
      default: break;
    }

    setFieldErrors((prev) => {
      if (error) return { ...prev, [field]: error };
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmitShipping = async () => {
    if (!cart) return;

    const errors = validateAllFields(shippingForm);
    setFieldErrors(errors);

    const allTouched: Record<string, boolean> = {};
    Object.keys(shippingForm).forEach((key) => { allTouched[key] = true; });
    setTouched(allTouched);

    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const fullAddress = [
      shippingForm.address1,
      shippingForm.number,
      shippingForm.complement,
      shippingForm.neighborhood,
    ].filter(Boolean).join(', ');

    try {
      await updateCart({
        email: shippingForm.email,
        shipping_address: {
          first_name: shippingForm.firstName,
          last_name: shippingForm.lastName,
          address_1: fullAddress,
          postal_code: shippingForm.postalCode.replace(/\D/g, ''),
          city: shippingForm.city,
          province: shippingForm.state,
          country_code: shippingForm.countryCode,
          phone: shippingForm.phone,
        },
        billing_address: {
          first_name: shippingForm.firstName,
          last_name: shippingForm.lastName,
          address_1: fullAddress,
          postal_code: shippingForm.postalCode.replace(/\D/g, ''),
          city: shippingForm.city,
          province: shippingForm.state,
          country_code: shippingForm.countryCode,
          phone: shippingForm.phone,
        },
      });

      // Save address to customer's address book if requested
      if (isAuthenticated && saveAddress && !selectedAddressId) {
        try {
          await createCustomerAddress({
            first_name: shippingForm.firstName,
            last_name: shippingForm.lastName,
            phone: shippingForm.phone.replace(/\D/g, '') || undefined,
            address_1: fullAddress,
            postal_code: shippingForm.postalCode.replace(/\D/g, ''),
            city: shippingForm.city,
            province: shippingForm.state,
            country_code: shippingForm.countryCode,
            metadata: {
              district: shippingForm.neighborhood,
              number: shippingForm.number,
            },
          } as any);
        } catch (err) {
          console.error('Failed to save address:', err);
          // non-blocking: don't stop the checkout if save fails
        }
      }

      const refreshed = await sdk.store.fulfillment.listCartOptions({
        cart_id: cart.id,
      });
      const availableOptions = refreshed.shipping_options ?? [];
      console.log('[checkout] shipping options returned:', availableOptions);
      setShippingOptions(availableOptions);

      const matchOption = (() => {
        if (!selectedQuote) return null;
        return (
          availableOptions.find((o: any) => {
            const code =
              o?.data?.service_code ??
              (typeof o?.data?.id === 'string'
                ? Number(o.data.id.replace(/\D/g, ''))
                : null);
            return code === selectedQuote.service_code;
          }) || null
        );
      })();

      const chosen = matchOption || availableOptions[0] || null;

      if (!chosen) {
        throw new Error(
          'Nenhuma opção de frete SuperFrete configurada para este endereço. Confirme o CEP ou entre em contato.'
        );
      }

      console.log('[checkout] chosen shipping option:', chosen);

      try {
        await sdk.store.cart.addShippingMethod(cart.id, {
          option_id: chosen.id,
        });
      } catch (shipErr: any) {
        console.error('[checkout] addShippingMethod failed:', shipErr);
        const detail =
          shipErr?.response?.data?.message ||
          shipErr?.message ||
          'Erro ao aplicar o frete';
        throw new Error(`Frete: ${detail}`);
      }

      const updatedCartRes = await sdk.store.cart.retrieve(cart.id);
      const updatedCart = updatedCartRes.cart;
      setConfirmedTotal(updatedCart.total);
      console.log('[checkout] cart after addShippingMethod:', {
        total: updatedCart.total,
        shipping_total: updatedCart.shipping_total,
        shipping_methods: updatedCart.shipping_methods,
      });

      if (!updatedCart.shipping_methods || updatedCart.shipping_methods.length === 0) {
        throw new Error(
          'O frete não foi aplicado ao carrinho. Tente recarregar a página.'
        );
      }

      try {
        const { payment_collection } = await sdk.store.payment.initiatePaymentSession(
          updatedCart,
          {
            provider_id: 'pp_stripe_stripe',
          }
        );

        const secret = payment_collection?.payment_sessions?.[0]?.data
          ?.client_secret as string | undefined;

        if (secret) {
          setClientSecret(secret);
          setStep('payment');
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          document.documentElement.scrollTop = 0;
        } else {
          throw new Error('Stripe não retornou chave de pagamento.');
        }
      } catch (payErr: any) {
        console.error('[checkout] initiatePaymentSession failed:', payErr);
        const detail =
          payErr?.response?.data?.message ||
          payErr?.message ||
          'Erro ao iniciar pagamento';
        throw new Error(`Pagamento: ${detail}`);
      }
    } catch (err: any) {
      console.error('[checkout] Failed to proceed to payment:', err);
      setSubmitError(
        err?.response?.data?.message || err?.message || 'Ocorreu um erro inesperado.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = useCallback(() => {
    setStep('success');
    // Clear the persisted form draft and the shipping preview now that
    // the purchase is complete — the next order starts from scratch.
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(CHECKOUT_FORM_KEY);
      window.localStorage.removeItem(SHIPPING_PREVIEW_KEY);
    }
  }, []);

  const isFormValid = Object.keys(validateAllFields(shippingForm)).length === 0;

  if (step === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-[#0a0a0a]"
      >
        <div className="w-20 h-20 border border-[#e34717] flex items-center justify-center mb-10 shadow-[0_0_50px_rgba(220,38,38,0.15)]">
          <CheckCircle2 size={32} className="text-[#e34717]" />
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 italic text-white">CONFIRMADO.</h1>
        <p className="max-w-xs mx-auto text-zinc-500 text-xs font-medium uppercase tracking-[0.3em] leading-relaxed mb-12">
          Seu drop está garantido. Bem-vindo à rede underground.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-16 py-5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all text-white"
          aria-label="Voltar à loja"
          tabIndex={0}
        >
          Voltar à Base
        </button>
      </motion.div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white pt-10 pb-20">
      <div className="container mx-auto px-6">
        <StepProgress step={step} />

        {/* Mobile Summary */}
        <div className="lg:hidden mb-12">
          <button
            onClick={() => setIsSummaryOpen(!isSummaryOpen)}
            className="w-full flex items-center justify-between bg-zinc-900/50 border border-white/10 p-5 rounded-sm"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              {isSummaryOpen ? 'Ocultar Resumo' : 'Ver Resumo do Pedido'}
              {isSummaryOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
            <span className="text-lg font-light tracking-tighter">
              {formatPrice(cart?.total ?? 0, currencyCode)}
            </span>
          </button>

          <AnimatePresence>
            {isSummaryOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-zinc-900/30 border-x border-b border-white/10 p-5 rounded-b-sm space-y-5">
                  {cart?.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs font-medium">
                      <div className="flex flex-col">
                        <span className="text-zinc-300">{item.product_title || item.title}</span>
                        <span className="text-[9px] text-zinc-600 uppercase mt-1">
                          {item.variant_title && `${item.variant_title} · `}Qtd: {item.quantity}
                        </span>
                      </div>
                      <span className="tracking-tighter text-sm">
                        {formatPrice((item.unit_price ?? 0) * item.quantity, currencyCode)}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 max-w-6xl mx-auto">
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: "circOut" }}
                className="space-y-16"
              >
                {step === 'shipping' && (
                  <div className="space-y-16">
                    {/* Saved addresses (logged in) */}
                    {isAuthenticated && savedAddresses.length > 0 && (
                      <div>
                        <h2 className="text-3xl font-light tracking-tighter mb-4">Endereços salvos</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-6">
                          Selecione um endereço ou preencha um novo abaixo
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {savedAddresses.map((addr) => {
                            const selected = selectedAddressId === addr.id
                            return (
                              <button
                                key={addr.id}
                                type="button"
                                onClick={() => applySavedAddress(addr.id)}
                                className={`text-left p-5 border transition-all ${
                                  selected
                                    ? 'border-[#e34717] bg-[#e34717]/5'
                                    : 'border-white/10 hover:border-white/20 bg-zinc-950'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <MapPin size={12} className="text-[#e34717]" />
                                  <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-500">
                                    {addr.first_name} {addr.last_name}
                                  </span>
                                </div>
                                <div className="text-sm font-medium text-white leading-relaxed">
                                  {addr.address_1}
                                </div>
                                <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-2">
                                  {addr.city} · {addr.province} · {addr.postal_code}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Contact Info */}
                    <div>
                      <h2 className="text-3xl font-light tracking-tighter mb-8">Informações de Contato</h2>
                      <div className="space-y-8">
                        <InputField
                          label="E-mail"
                          placeholder="usuario@underground.net"
                          type="email"
                          value={shippingForm.email}
                          onChange={(val) => handleShippingChange('email', val)}
                          onBlur={() => handleBlur('email')}
                          autoComplete="email"
                          error={touched.email ? fieldErrors.email : undefined}
                        />
                        <InputField
                          label="Telefone"
                          placeholder="(11) 99999-9999"
                          type="tel"
                          value={shippingForm.phone}
                          onChange={(val) => handleShippingChange('phone', val)}
                          onBlur={() => handleBlur('phone')}
                          autoComplete="tel"
                          error={touched.phone ? fieldErrors.phone : undefined}
                          maxLength={15}
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <h2 className="text-3xl font-light tracking-tighter mb-8">Endereço de Entrega</h2>
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                          <InputField
                            label="Nome"
                            placeholder="João"
                            value={shippingForm.firstName}
                            onChange={(val) => handleShippingChange('firstName', val)}
                            onBlur={() => handleBlur('firstName')}
                            autoComplete="given-name"
                            error={touched.firstName ? fieldErrors.firstName : undefined}
                          />
                          <InputField
                            label="Sobrenome"
                            placeholder="Silva"
                            value={shippingForm.lastName}
                            onChange={(val) => handleShippingChange('lastName', val)}
                            onBlur={() => handleBlur('lastName')}
                            autoComplete="family-name"
                            error={touched.lastName ? fieldErrors.lastName : undefined}
                          />
                        </div>

                        <div className="relative">
                          <InputField
                            label="CEP"
                            placeholder="00000-000"
                            value={shippingForm.postalCode}
                            onChange={(val) => handleShippingChange('postalCode', val)}
                            onBlur={() => handleBlur('postalCode')}
                            autoComplete="postal-code"
                            error={touched.postalCode ? fieldErrors.postalCode : undefined}
                            loading={cepLoading}
                            maxLength={9}
                          />
                          {cepFetched && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-2 mt-2"
                            >
                              <MapPin size={12} className="text-emerald-500" />
                              <span className="text-[9px] font-medium text-emerald-500 tracking-wide">
                                Endereço preenchido automaticamente
                              </span>
                            </motion.div>
                          )}
                        </div>

                        <InputField
                          label="Rua"
                          placeholder="Rua das Flores"
                          value={shippingForm.address1}
                          onChange={(val) => handleShippingChange('address1', val)}
                          onBlur={() => handleBlur('address1')}
                          autoComplete="street-address"
                          error={touched.address1 ? fieldErrors.address1 : undefined}
                          disabled={cepFetched && !!shippingForm.address1}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-8">
                          <InputField
                            label="Número"
                            placeholder="123"
                            value={shippingForm.number}
                            onChange={(val) => handleShippingChange('number', val)}
                            onBlur={() => handleBlur('number')}
                            error={touched.number ? fieldErrors.number : undefined}
                            inputRef={numberInputRef}
                          />
                          <InputField
                            label="Complemento"
                            placeholder="Apto 42 (opcional)"
                            value={shippingForm.complement}
                            onChange={(val) => handleShippingChange('complement', val)}
                          />
                          <InputField
                            label="Bairro"
                            placeholder="Centro"
                            value={shippingForm.neighborhood}
                            onChange={(val) => handleShippingChange('neighborhood', val)}
                            onBlur={() => handleBlur('neighborhood')}
                            error={touched.neighborhood ? fieldErrors.neighborhood : undefined}
                            disabled={cepFetched && !!shippingForm.neighborhood}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                          <InputField
                            label="Cidade"
                            placeholder="São Paulo"
                            value={shippingForm.city}
                            onChange={(val) => handleShippingChange('city', val)}
                            onBlur={() => handleBlur('city')}
                            autoComplete="address-level2"
                            error={touched.city ? fieldErrors.city : undefined}
                            disabled={cepFetched && !!shippingForm.city}
                          />
                          <InputField
                            label="Estado"
                            placeholder="SP"
                            value={shippingForm.state}
                            onChange={(val) => handleShippingChange('state', val.toUpperCase().slice(0, 2))}
                            onBlur={() => handleBlur('state')}
                            autoComplete="address-level1"
                            error={touched.state ? fieldErrors.state : undefined}
                            disabled={cepFetched && !!shippingForm.state}
                            maxLength={2}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Shipping method */}
                    <div>
                      <h2 className="text-3xl font-light tracking-tighter mb-8">Método de Envio</h2>
                      <ShippingQuote
                        items={(cart?.items ?? []).map((it): ShippingQuoteItem => ({
                          name: it.product_title || it.title,
                          quantity: it.quantity,
                          unit_price: it.unit_price ?? 0,
                          weight: (it.variant as any)?.weight ?? null,
                          height: (it.variant as any)?.height ?? null,
                          width: (it.variant as any)?.width ?? null,
                          length: (it.variant as any)?.length ?? null,
                        }))}
                        cartId={cart?.id}
                        initialCep={shippingForm.postalCode}
                        selectedServiceCode={selectedQuote?.service_code ?? null}
                        onSelect={(opt, cep) => {
                          setSelectedQuote(opt);
                          if (opt) {
                            try {
                              window.localStorage.setItem(
                                SHIPPING_PREVIEW_KEY,
                                JSON.stringify({
                                  cep: cep || shippingForm.postalCode.replace(/\D/g, ''),
                                  service_code: opt.service_code,
                                  service_name: opt.name,
                                  price: opt.price,
                                })
                              );
                            } catch {
                              // ignore
                            }
                          }
                        }}
                        showCepInput={false}
                        label="Escolha a transportadora"
                      />
                    </div>

                    {/* Save address option */}
                    {isAuthenticated && !selectedAddressId && (
                      <div className="pt-4">
                        <label className="flex items-start gap-4 cursor-pointer group">
                          <div className="relative mt-1">
                            <input
                              type="checkbox"
                              checked={saveAddress}
                              onChange={(e) => setSaveAddress(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-4 h-4 border border-white/20 peer-checked:bg-[#e34717] peer-checked:border-[#e34717] transition-all flex items-center justify-center">
                              {saveAddress && (
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                  <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white group-hover:text-[#e34717] transition-colors">
                              <Save size={12} />
                              Salvar endereço para próximas compras
                            </div>
                            <div className="text-[9px] text-zinc-600 uppercase tracking-widest mt-1">
                              Você poderá selecioná-lo rapidamente em futuras compras
                            </div>
                          </div>
                        </label>
                      </div>
                    )}

                    {submitError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3 bg-[#e34717]/10 border border-[#e34717]/20 p-4 text-[#e34717] text-xs font-medium rounded-sm"
                      >
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>{submitError}</span>
                      </motion.div>
                    )}

                    {/* Submit */}
                    <div className="pt-8">
                      <button
                        onClick={handleSubmitShipping}
                        disabled={isSubmitting || !isFormValid || !selectedQuote}
                        className="w-full bg-white text-black py-6 text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-[#e34717] hover:text-white transition-all shadow-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group"
                        aria-label="Confirmar endereço de entrega"
                        tabIndex={0}
                      >
                        <span className="absolute inset-0 w-full h-full bg-[#e34717] -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></span>
                        <span className="relative flex items-center gap-3">
                          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                          Continuar para Pagamento
                        </span>
                      </button>
                      <div className="mt-6 flex items-center justify-center gap-2 text-zinc-500">
                        <ShieldCheck size={14} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Informações criptografadas e seguras</span>
                      </div>
                    </div>
                  </div>
                )}

                {step === 'payment' && clientSecret && (
                  <div className="space-y-12">
                    <h2 className="text-4xl font-light tracking-tighter">Pagamento</h2>
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret,
                        appearance: {
                          theme: 'night',
                          variables: {
                            colorPrimary: '#dc2626',
                            colorBackground: '#0a0a0a',
                            colorText: '#ffffff',
                            fontFamily: 'Inter, system-ui, sans-serif',
                          },
                        },
                      }}
                    >
                      <StripeForm clientSecret={clientSecret} onSuccess={handlePaymentSuccess} orderTotal={confirmedTotal ?? undefined} />
                    </Elements>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-5">
            <div className="glass p-10 sticky top-40 premium-shadow rounded-sm">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-600 mb-10">RESUMO DO PEDIDO</h3>
              <div className="space-y-6 mb-12">
                {cart?.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs font-medium">
                    <div className="flex flex-col">
                      <span className="text-zinc-300">{item.product_title || item.title}</span>
                      <span className="text-[9px] text-zinc-600 uppercase">
                        {item.variant_title && `${item.variant_title} · `}Qtd: {item.quantity}
                      </span>
                    </div>
                    <span className="tracking-tighter">
                      {formatPrice((item.unit_price ?? 0) * item.quantity, currencyCode)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-8 border-t border-zinc-900 flex justify-between items-end">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Valor Total</span>
                <span className="text-3xl font-light tracking-tighter">
                  {formatPrice(confirmedTotal ?? cart?.total ?? 0, currencyCode)}
                </span>
              </div>

              <div className="mt-12 flex items-center gap-3 text-zinc-700">
                <Lock size={12} />
                <span className="text-[8px] font-bold uppercase tracking-widest">Checkout Seguro Stripe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
