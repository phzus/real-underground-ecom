export type SuperfreteEnvironment = "sandbox" | "production"

export const SUPERFRETE_BASE_URL: Record<SuperfreteEnvironment, string> = {
  sandbox: "https://sandbox.superfrete.com",
  production: "https://api.superfrete.com",
}

export const SERVICE_CATALOG: Record<number, { name: string; carrier: string }> = {
  1: { name: "PAC", carrier: "Correios" },
  2: { name: "SEDEX", carrier: "Correios" },
  17: { name: "Mini Envios", carrier: "Correios" },
  3: { name: "Jadlog Package", carrier: "Jadlog" },
  31: { name: "Loggi Econômico", carrier: "Loggi" },
}

export const DEFAULT_ENABLED_SERVICES = [1, 2, 17]

export type SuperfretePackage = {
  height: number
  width: number
  length: number
  weight: number
}

export type SuperfreteProduct = {
  quantity: number
  height: number
  width: number
  length: number
  weight: number
  unitary_value?: number
  name?: string
}

export type QuoteOptions = {
  insurance_value?: number
  use_insurance_value?: boolean
  receipt?: boolean
  own_hand?: boolean
}

export type QuoteRequest = {
  from_postal_code: string
  to_postal_code: string
  services?: number[]
  products?: SuperfreteProduct[]
  package?: SuperfretePackage
  options?: QuoteOptions
}

export type QuoteOption = {
  id: number
  name: string
  price: number
  discount: number
  currency: string
  delivery_time: number
  delivery_range: { min: number; max: number }
  company: { id: number; name: string; picture: string }
  has_error: boolean
  error?: string
}

export type Address = {
  name: string
  address: string
  number?: string
  complement?: string
  district: string
  city: string
  state_abbr: string
  postal_code: string
  email?: string
  document?: string
  phone?: string
}

export type CreateShipmentRequest = {
  from: Address
  to: Address
  service: number
  products: Array<{ name: string; quantity: number; unitary_value: number }>
  volumes: SuperfretePackage
  options?: QuoteOptions & {
    non_commercial?: boolean
    invoice?: { number: string; key?: string }
  }
  platform?: string
}

export type CreateShipmentResponse = {
  id: string
  price: number
  status: string
  protocol?: string
}

export type CheckoutResponse = {
  success: boolean
  purchase: {
    status: string
    orders: Array<{
      id: string
      price: number
      discount?: number
      service_id: number
      tracking: string | null
      print?: { url?: string }
    }>
  }
}

export type OrderInfoResponse = {
  id: string
  protocol: string
  status: string
  tracking: string | null
  service_id: number
  delivery?: number
  delivery_min?: number
  delivery_max?: number
  format?: string
  height?: string
  width?: string
  length?: string
  weight?: string
  price?: number
  discount?: number
  insurance_value?: number | null
  from?: Record<string, any>
  to?: Record<string, any>
  invoice?: any
  own_hand?: boolean
  receipt?: boolean
  products?: any[]
  generated_at?: string
  posted_at?: string
  created_at?: string
  updated_at?: string
  print?: { url?: string }
}

export type TagPrintResponse = {
  url: string
}

export type WebhookEvent =
  | "order.created"
  | "order.released"
  | "order.generated"
  | "order.posted"
  | "order.delivered"
  | "order.cancelled"

export type SuperfreteClientConfig = {
  token: string
  environment: SuperfreteEnvironment
  userAgent: string
  timeoutMs?: number
}
