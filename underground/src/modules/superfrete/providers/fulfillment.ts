import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils"
import {
  SuperfreteClient,
  buildUserAgent,
  normalizeCep,
} from "../lib/client"
import {
  SERVICE_CATALOG,
  SuperfreteEnvironment,
} from "../lib/types"
import { SUPERFRETE_MODULE } from "../index"

type ProviderOptions = {
  envFallbackToken?: string
  appName?: string
  contactEmail?: string
}

type FulfillmentOptionData = {
  id: string
  service_code: number
  name: string
  carrier: string
}

type CalculatePriceContext = {
  from_location?: {
    address?: { postal_code?: string }
  }
  shipping_address?: {
    postal_code?: string
  }
  items?: Array<{
    quantity: number
    variant?: {
      weight?: number | null
      height?: number | null
      width?: number | null
      length?: number | null
    }
  }>
}

class SuperfreteFulfillmentProvider extends AbstractFulfillmentProviderService {
  static identifier = "superfrete"

  protected readonly container_: any
  protected readonly options_: ProviderOptions

  constructor(container: any, options: ProviderOptions = {}) {
    // @ts-expect-error — base class is loose
    super(...arguments)
    this.container_ = container
    this.options_ = options
  }

  getIdentifier(): string {
    return SuperfreteFulfillmentProvider.identifier
  }

  private tryResolveModuleService(): any | null {
    try {
      if (this.container_ && typeof this.container_.resolve === "function") {
        return this.container_.resolve(SUPERFRETE_MODULE)
      }
    } catch {
      // ignore
    }
    return null
  }

  private async buildStandaloneClient(): Promise<SuperfreteClient | null> {
    const token =
      this.options_.envFallbackToken || process.env.SUPERFRETE_TOKEN
    if (!token) return null
    const env: SuperfreteEnvironment =
      (process.env.SUPERFRETE_ENV as SuperfreteEnvironment) || "sandbox"
    return new SuperfreteClient({
      token,
      environment: env,
      userAgent: buildUserAgent(this.options_.appName, this.options_.contactEmail),
    })
  }

  private async getClientAndFromCep(): Promise<{
    client: SuperfreteClient
    fromCep: string
    defaults: { weight_kg: number; height_cm: number; width_cm: number; length_cm: number }
    enabled_services: number[]
  } | null> {
    const svc = this.tryResolveModuleService()
    if (svc) {
      try {
        const client = await svc.getClient()
        const cfg = await svc.getPublicConfig()
        if (!cfg.sender.postal_code) return null
        return {
          client,
          fromCep: cfg.sender.postal_code,
          defaults: cfg.defaults,
          enabled_services: cfg.enabled_services,
        }
      } catch {
        // fall through
      }
    }
    const client = await this.buildStandaloneClient()
    if (!client) return null
    const fromCep = process.env.SUPERFRETE_FROM_CEP
    if (!fromCep) return null
    return {
      client,
      fromCep: normalizeCep(fromCep),
      defaults: {
        weight_kg: Number(process.env.SUPERFRETE_DEFAULT_WEIGHT ?? "0.3"),
        height_cm: Number(process.env.SUPERFRETE_DEFAULT_HEIGHT ?? "4"),
        width_cm: Number(process.env.SUPERFRETE_DEFAULT_WIDTH ?? "16"),
        length_cm: Number(process.env.SUPERFRETE_DEFAULT_LENGTH ?? "24"),
      },
      enabled_services: [1, 2, 17],
    }
  }

  async getFulfillmentOptions(): Promise<FulfillmentOptionData[]> {
    return Object.entries(SERVICE_CATALOG).map(([code, info]) => ({
      id: `superfrete-${code}`,
      service_code: Number(code),
      name: info.name,
      carrier: info.carrier,
    }))
  }

  async validateFulfillmentData(
    optionData: FulfillmentOptionData,
    data: Record<string, unknown>,
    _context: unknown
  ): Promise<Record<string, unknown>> {
    return { ...data, service_code: optionData.service_code }
  }

  async validateOption(data: FulfillmentOptionData): Promise<boolean> {
    return Boolean(data?.service_code)
  }

  canCalculate(_data: FulfillmentOptionData): boolean {
    return true
  }

  async calculatePrice(
    optionData: FulfillmentOptionData,
    _data: Record<string, unknown>,
    context: CalculatePriceContext
  ): Promise<number> {
    const toCep = context?.shipping_address?.postal_code
    if (!toCep) {
      throw new Error(
        "SuperFrete: shipping address postal_code is required to calculate price"
      )
    }
    const setup = await this.getClientAndFromCep()
    if (!setup) {
      throw new Error(
        "SuperFrete: provider not configured — set token and sender CEP"
      )
    }
    const { client, fromCep, defaults } = setup

    const items = context?.items ?? []
    const products = items.length
      ? items.map((it) => ({
          quantity: it.quantity,
          weight:
            Number(it.variant?.weight ?? defaults.weight_kg) ||
            defaults.weight_kg,
          height:
            Number(it.variant?.height ?? defaults.height_cm) ||
            defaults.height_cm,
          width:
            Number(it.variant?.width ?? defaults.width_cm) ||
            defaults.width_cm,
          length:
            Number(it.variant?.length ?? defaults.length_cm) ||
            defaults.length_cm,
        }))
      : [
          {
            quantity: 1,
            weight: defaults.weight_kg,
            height: defaults.height_cm,
            width: defaults.width_cm,
            length: defaults.length_cm,
          },
        ]

    const quotes = await client.calculate({
      from_postal_code: fromCep,
      to_postal_code: normalizeCep(toCep),
      services: [optionData.service_code],
      products,
    })

    const match = quotes.find(
      (q) => !q.has_error && q.id === optionData.service_code
    )
    if (!match) {
      throw new Error(
        `SuperFrete: no valid quote returned for service ${optionData.service_code}`
      )
    }
    return Math.round(Number(match.price) * 100)
  }

  async createFulfillment(
    _data: unknown,
    _items: unknown,
    _order: unknown,
    _fulfillment: unknown
  ): Promise<Record<string, unknown>> {
    return {}
  }

  async cancelFulfillment(_fulfillment: unknown): Promise<Record<string, unknown>> {
    return {}
  }

  async createReturnFulfillment(
    _fulfillment: unknown
  ): Promise<Record<string, unknown>> {
    return {}
  }

  async getFulfillmentDocuments(_data: unknown): Promise<never[]> {
    return []
  }

  async getReturnDocuments(_data: unknown): Promise<never[]> {
    return []
  }

  async getShipmentDocuments(_data: unknown): Promise<never[]> {
    return []
  }
}

export default SuperfreteFulfillmentProvider
