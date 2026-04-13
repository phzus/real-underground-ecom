import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils"
import {
  CalculatedShippingOptionPrice,
  CalculateShippingOptionPriceDTO,
  CreateFulfillmentResult,
  CreateShippingOptionDTO,
  FulfillmentDTO,
  FulfillmentItemDTO,
  FulfillmentOption,
  FulfillmentOrderDTO,
  ValidateFulfillmentDataContext,
} from "@medusajs/framework/types"
import {
  SuperfreteClient,
  buildUserAgent,
  normalizeCep,
} from "../lib/client"
import {
  SERVICE_CATALOG,
} from "../lib/types"
import { getDirectConfig } from "../lib/direct-config"

type ProviderOptions = {
  envFallbackToken?: string
  appName?: string
  contactEmail?: string
}

class SuperfreteFulfillmentProvider extends AbstractFulfillmentProviderService {
  static identifier = "superfrete"

  protected readonly container_: any
  protected readonly options_: ProviderOptions

  constructor(container: any, options: ProviderOptions = {}) {
    super()
    this.container_ = container
    this.options_ = options
  }

  getIdentifier(): string {
    return SuperfreteFulfillmentProvider.identifier
  }

  private async getClientAndFromCep(): Promise<{
    client: SuperfreteClient
    fromCep: string
    defaults: { weight_kg: number; height_cm: number; width_cm: number; length_cm: number }
    enabled_services: number[]
  } | null> {
    // Read the config directly from the DB (or env fallback). We can't use
    // the Medusa container here because the fulfillment provider is
    // instantiated inside the fulfillment module's own scope and doesn't
    // have cross-module resolution. The direct reader uses the same
    // DATABASE_URL + COOKIE_SECRET the Medusa process already has.
    const cfg = await getDirectConfig()
    if (!cfg.token || !cfg.sender.postal_code) return null

    const client = new SuperfreteClient({
      token: cfg.token,
      environment: cfg.environment,
      userAgent: buildUserAgent(this.options_.appName, this.options_.contactEmail),
    })

    return {
      client,
      fromCep: normalizeCep(cfg.sender.postal_code),
      defaults: cfg.defaults,
      enabled_services: cfg.enabled_services,
    }
  }

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return Object.entries(SERVICE_CATALOG).map(([code, info]) => ({
      id: `superfrete-${code}`,
      service_code: Number(code),
      name: info.name,
      carrier: info.carrier,
    }))
  }

  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    _context: ValidateFulfillmentDataContext
  ): Promise<any> {
    return { ...data, service_code: optionData.service_code }
  }

  async validateOption(data: Record<string, unknown>): Promise<boolean> {
    return Boolean((data as any)?.service_code)
  }

  async canCalculate(_data: CreateShippingOptionDTO): Promise<boolean> {
    return true
  }

  async calculatePrice(
    optionData: CalculateShippingOptionPriceDTO["optionData"],
    _data: CalculateShippingOptionPriceDTO["data"],
    context: CalculateShippingOptionPriceDTO["context"]
  ): Promise<CalculatedShippingOptionPrice> {
    const toCep = (context as any)?.shipping_address?.postal_code
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

    const serviceCode = Number(
      (optionData as any)?.service_code ??
        ((optionData as any)?.id as string | undefined)?.replace(/\D/g, "")
    )
    if (!serviceCode) {
      throw new Error("SuperFrete: missing service_code on shipping option")
    }

    const items = ((context as any)?.items ?? []) as Array<{
      quantity: number
      variant?: {
        weight?: number | null
        height?: number | null
        width?: number | null
        length?: number | null
      }
    }>

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
      services: [serviceCode],
      products,
    })

    const match = quotes.find((q) => !q.has_error && q.id === serviceCode)
    if (!match) {
      throw new Error(
        `SuperFrete: no valid quote returned for service ${serviceCode}`
      )
    }
    return {
      calculated_amount: Number(match.price),
      is_calculated_price_tax_inclusive: true,
    }
  }

  async createFulfillment(
    _data: Record<string, unknown>,
    _items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[],
    _order: Partial<FulfillmentOrderDTO> | undefined,
    _fulfillment: Partial<Omit<FulfillmentDTO, "provider_id" | "data" | "items">>
  ): Promise<CreateFulfillmentResult> {
    return { data: {}, labels: [] }
  }

  async cancelFulfillment(_data: Record<string, unknown>): Promise<any> {
    return {}
  }

  async createReturnFulfillment(
    _fulfillment: Record<string, unknown>
  ): Promise<CreateFulfillmentResult> {
    return { data: {}, labels: [] }
  }

  async getFulfillmentDocuments(_data: Record<string, unknown>): Promise<never[]> {
    return []
  }

  async getReturnDocuments(_data: Record<string, unknown>): Promise<never[]> {
    return []
  }

  async getShipmentDocuments(_data: Record<string, unknown>): Promise<never[]> {
    return []
  }
}

export default SuperfreteFulfillmentProvider
