import { MedusaService } from "@medusajs/framework/utils"
import {
  SuperfreteClient,
  SuperfreteApiError,
  buildUserAgent,
  normalizeCep,
} from "./lib/client"
import {
  decryptSecret,
  encryptSecret,
  maskToken,
} from "./lib/crypto"
import {
  Address,
  CreateShipmentRequest,
  DEFAULT_ENABLED_SERVICES,
  QuoteOption,
  SERVICE_CATALOG,
  SuperfreteEnvironment,
  SuperfretePackage,
  SuperfreteProduct,
} from "./lib/types"
import { SuperfreteConfig, SuperfreteShipment } from "./models"

const CONFIG_ID = "default"
const MIN_PAC_SEDEX_WEIGHT = 0.3
const MIN_PAC_SEDEX_HEIGHT = 4
const MIN_PAC_SEDEX_WIDTH = 16
const MIN_PAC_SEDEX_LENGTH = 24

type ModuleOptions = {
  cookieSecret?: string
  envToken?: string
  envEnvironment?: SuperfreteEnvironment
  appName?: string
  contactEmail?: string
}

type PublicConfigView = {
  configured: boolean
  environment: SuperfreteEnvironment
  token_masked: string
  token_source: "db" | "env" | "none"
  sender: {
    name: string | null
    document: string | null
    email: string | null
    phone: string | null
    postal_code: string | null
    address: string | null
    number: string | null
    complement: string | null
    district: string | null
    city: string | null
    state_abbr: string | null
  }
  defaults: {
    weight_kg: number
    height_cm: number
    width_cm: number
    length_cm: number
  }
  enabled_services: number[]
  webhook: {
    registered: boolean
    id: string | null
  }
}

type CartLineInput = {
  name?: string
  quantity: number
  unit_price?: number
  weight?: number | null
  height?: number | null
  width?: number | null
  length?: number | null
}

type QuoteInput = {
  to_postal_code: string
  items: CartLineInput[]
  options?: {
    insurance_value?: number
    receipt?: boolean
    own_hand?: boolean
  }
}

class SuperfreteModuleService extends MedusaService({
  SuperfreteConfig,
  SuperfreteShipment,
}) {
  protected moduleOptions_: ModuleOptions

  constructor(container: unknown, options?: ModuleOptions) {
    super(...(arguments as any))
    this.moduleOptions_ = options || {}
  }

  private getCookieSecret(): string {
    const s =
      this.moduleOptions_.cookieSecret ||
      process.env.COOKIE_SECRET ||
      process.env.JWT_SECRET ||
      ""
    if (!s) {
      throw new Error(
        "SuperFrete: COOKIE_SECRET is not set — cannot encrypt/decrypt token"
      )
    }
    return s
  }

  private userAgent(): string {
    return buildUserAgent(
      this.moduleOptions_.appName,
      this.moduleOptions_.contactEmail
    )
  }

  private async loadConfigRow(): Promise<any | null> {
    const rows = await this.listSuperfreteConfigs({ id: CONFIG_ID })
    return rows[0] ?? null
  }

  private async upsertConfigRow(patch: Record<string, unknown>): Promise<any> {
    const existing = await this.loadConfigRow()
    if (existing) {
      const result: any = await this.updateSuperfreteConfigs([
        { id: CONFIG_ID, ...patch },
      ] as any)
      return Array.isArray(result) ? result[0] : result
    }
    const created: any = await this.createSuperfreteConfigs({
      id: CONFIG_ID,
      ...patch,
    } as any)
    return Array.isArray(created) ? created[0] : created
  }

  async resolveToken(): Promise<{ token: string; source: "db" | "env" }> {
    const row = await this.loadConfigRow()
    if (row?.api_token_cipher && row.api_token_iv && row.api_token_tag) {
      const token = decryptSecret(
        {
          cipher: row.api_token_cipher,
          iv: row.api_token_iv,
          tag: row.api_token_tag,
        },
        this.getCookieSecret()
      )
      return { token, source: "db" }
    }
    const envToken =
      this.moduleOptions_.envToken || process.env.SUPERFRETE_TOKEN
    if (envToken) {
      return { token: envToken, source: "env" }
    }
    throw new Error(
      "SuperFrete: no token configured. Set it from admin or via SUPERFRETE_TOKEN env var."
    )
  }

  async resolveEnvironment(): Promise<SuperfreteEnvironment> {
    const row = await this.loadConfigRow()
    if (row?.environment) return row.environment as SuperfreteEnvironment
    const envEnv =
      this.moduleOptions_.envEnvironment ||
      (process.env.SUPERFRETE_ENV as SuperfreteEnvironment | undefined)
    return envEnv || "sandbox"
  }

  async getClient(): Promise<SuperfreteClient> {
    const { token } = await this.resolveToken()
    const env = await this.resolveEnvironment()
    return new SuperfreteClient({
      token,
      environment: env,
      userAgent: this.userAgent(),
    })
  }

  async getPublicConfig(): Promise<PublicConfigView> {
    const row = await this.loadConfigRow()
    const env = await this.resolveEnvironment()
    let tokenSource: "db" | "env" | "none" = "none"
    let tokenMasked = ""
    try {
      const { token, source } = await this.resolveToken()
      tokenSource = source
      tokenMasked = maskToken(token)
    } catch {
      tokenSource = "none"
    }
    return {
      configured: tokenSource !== "none",
      environment: env,
      token_masked: tokenMasked,
      token_source: tokenSource,
      sender: {
        name: row?.sender_name ?? null,
        document: row?.sender_document ?? null,
        email: row?.sender_email ?? null,
        phone: row?.sender_phone ?? null,
        postal_code: row?.sender_postal_code ?? null,
        address: row?.sender_address ?? null,
        number: row?.sender_number ?? null,
        complement: row?.sender_complement ?? null,
        district: row?.sender_district ?? null,
        city: row?.sender_city ?? null,
        state_abbr: row?.sender_state_abbr ?? null,
      },
      defaults: {
        weight_kg: row?.default_weight_kg ?? 0.3,
        height_cm: row?.default_height_cm ?? 4,
        width_cm: row?.default_width_cm ?? 16,
        length_cm: row?.default_length_cm ?? 24,
      },
      enabled_services:
        (row?.enabled_services as number[] | null) ?? DEFAULT_ENABLED_SERVICES,
      webhook: {
        registered: Boolean(row?.webhook_id),
        id: row?.webhook_id ?? null,
      },
    }
  }

  async updatePublicConfig(input: {
    environment?: SuperfreteEnvironment
    token?: string | null
    sender?: Partial<PublicConfigView["sender"]>
    defaults?: Partial<PublicConfigView["defaults"]>
    enabled_services?: number[]
  }): Promise<PublicConfigView> {
    const patch: Record<string, unknown> = {}
    if (input.environment) patch.environment = input.environment
    if (typeof input.token === "string" && input.token.length > 0) {
      const blob = encryptSecret(input.token.trim(), this.getCookieSecret())
      patch.api_token_cipher = blob.cipher
      patch.api_token_iv = blob.iv
      patch.api_token_tag = blob.tag
      patch.api_token_fingerprint = input.token.trim().slice(-6)
    } else if (input.token === null) {
      patch.api_token_cipher = null
      patch.api_token_iv = null
      patch.api_token_tag = null
      patch.api_token_fingerprint = null
    }
    if (input.sender) {
      const s = input.sender
      if (s.name !== undefined) patch.sender_name = s.name
      if (s.document !== undefined) patch.sender_document = s.document
      if (s.email !== undefined) patch.sender_email = s.email
      if (s.phone !== undefined) patch.sender_phone = s.phone
      if (s.postal_code !== undefined)
        patch.sender_postal_code = s.postal_code
          ? normalizeCep(s.postal_code)
          : null
      if (s.address !== undefined) patch.sender_address = s.address
      if (s.number !== undefined) patch.sender_number = s.number
      if (s.complement !== undefined) patch.sender_complement = s.complement
      if (s.district !== undefined) patch.sender_district = s.district
      if (s.city !== undefined) patch.sender_city = s.city
      if (s.state_abbr !== undefined)
        patch.sender_state_abbr = s.state_abbr
          ? s.state_abbr.toUpperCase()
          : null
    }
    if (input.defaults) {
      const d = input.defaults
      if (d.weight_kg !== undefined) patch.default_weight_kg = d.weight_kg
      if (d.height_cm !== undefined) patch.default_height_cm = d.height_cm
      if (d.width_cm !== undefined) patch.default_width_cm = d.width_cm
      if (d.length_cm !== undefined) patch.default_length_cm = d.length_cm
    }
    if (input.enabled_services) patch.enabled_services = input.enabled_services
    await this.upsertConfigRow(patch)
    return this.getPublicConfig()
  }

  private resolveItemDims(
    item: CartLineInput,
    defaults: PublicConfigView["defaults"]
  ): SuperfreteProduct {
    return {
      quantity: item.quantity,
      weight: Number(item.weight ?? defaults.weight_kg) || defaults.weight_kg,
      height: Number(item.height ?? defaults.height_cm) || defaults.height_cm,
      width: Number(item.width ?? defaults.width_cm) || defaults.width_cm,
      length: Number(item.length ?? defaults.length_cm) || defaults.length_cm,
      unitary_value: item.unit_price,
      name: item.name,
    }
  }

  private aggregateVolumes(products: SuperfreteProduct[]): SuperfretePackage {
    const totalWeight = products.reduce(
      (s, p) => s + Number(p.weight) * Number(p.quantity),
      0
    )
    const maxHeight = products.reduce(
      (m, p) => Math.max(m, Number(p.height) || 0),
      0
    )
    const maxWidth = products.reduce(
      (m, p) => Math.max(m, Number(p.width) || 0),
      0
    )
    const maxLength = products.reduce(
      (m, p) => Math.max(m, Number(p.length) || 0),
      0
    )
    return {
      weight: Math.max(totalWeight, MIN_PAC_SEDEX_WEIGHT),
      height: Math.max(maxHeight, MIN_PAC_SEDEX_HEIGHT),
      width: Math.max(maxWidth, MIN_PAC_SEDEX_WIDTH),
      length: Math.max(maxLength, MIN_PAC_SEDEX_LENGTH),
    }
  }

  async quoteForCart(
    input: QuoteInput
  ): Promise<Array<QuoteOption & { service_code: number }>> {
    const cfg = await this.getPublicConfig()
    if (!cfg.sender.postal_code) {
      throw new Error(
        "SuperFrete: sender postal_code not configured — set it in admin"
      )
    }
    if (!input.items || input.items.length === 0) {
      throw new Error("SuperFrete quote: items array is empty")
    }
    const products = input.items.map((i) => this.resolveItemDims(i, cfg.defaults))
    const client = await this.getClient()
    const options = await client.calculate({
      from_postal_code: cfg.sender.postal_code,
      to_postal_code: input.to_postal_code,
      services: cfg.enabled_services,
      products,
      options: input.options,
    })
    return options
      .filter((o) => !o.has_error)
      .map((o) => ({ ...o, service_code: o.id }))
  }

  async createShipmentForOrder(params: {
    order_id: string
    service_id: number
    recipient: Address
    items: CartLineInput[]
    insurance_value?: number
    non_commercial?: boolean
  }): Promise<any> {
    const cfg = await this.getPublicConfig()
    if (!cfg.sender.postal_code || !cfg.sender.name || !cfg.sender.address) {
      throw new Error(
        "SuperFrete: incomplete sender data — configure in admin first"
      )
    }
    const products = params.items.map((i) => this.resolveItemDims(i, cfg.defaults))
    const volumes = this.aggregateVolumes(products)

    const from: Address = {
      name: cfg.sender.name,
      address: cfg.sender.address,
      number: cfg.sender.number ?? "",
      complement: cfg.sender.complement ?? "",
      district: cfg.sender.district ?? "NA",
      city: cfg.sender.city ?? "",
      state_abbr: cfg.sender.state_abbr ?? "",
      postal_code: cfg.sender.postal_code,
      document: cfg.sender.document ?? undefined,
      email: cfg.sender.email ?? undefined,
      phone: cfg.sender.phone ?? undefined,
    }

    const req: CreateShipmentRequest = {
      from,
      to: params.recipient,
      service: params.service_id,
      products: params.items.map((i) => ({
        name: i.name ?? "Item",
        quantity: i.quantity,
        unitary_value: Number(i.unit_price ?? 0),
      })),
      volumes,
      options: {
        insurance_value: params.insurance_value,
        receipt: false,
        own_hand: false,
        non_commercial: params.non_commercial ?? true,
      },
      platform: "Drive It Like Stole It",
    }

    const client = await this.getClient()
    try {
      const res = await client.createCartShipment(req)
      const catalog = SERVICE_CATALOG[params.service_id]
      const created: any = await this.createSuperfreteShipments([
        {
          order_id: params.order_id,
          superfrete_order_id: res.id,
          service_id: params.service_id,
          service_name: catalog?.name ?? `service-${params.service_id}`,
          carrier: catalog?.carrier ?? null,
          status: (res.status as any) || "pending",
          price: res.price,
          from_snapshot: from as any,
          to_snapshot: params.recipient as any,
          volumes_snapshot: volumes as any,
          products_snapshot: req.products as any,
        },
      ] as any)
      return Array.isArray(created) ? created[0] : created
    } catch (e) {
      const err = e instanceof SuperfreteApiError ? e : null
      const created: any = await this.createSuperfreteShipments([
        {
          order_id: params.order_id,
          service_id: params.service_id,
          service_name:
            SERVICE_CATALOG[params.service_id]?.name ?? `service-${params.service_id}`,
          carrier: SERVICE_CATALOG[params.service_id]?.carrier ?? null,
          status: "error",
          price: 0,
          last_error: err
            ? `${err.message} — ${JSON.stringify(err.body)}`
            : String(e),
        },
      ] as any)
      return Array.isArray(created) ? created[0] : created
    }
  }

  async generateLabelForShipment(shipmentId: string): Promise<any> {
    const rows = await this.listSuperfreteShipments({ id: shipmentId })
    const shipment = rows[0]
    if (!shipment) throw new Error(`Shipment ${shipmentId} not found`)
    if (!shipment.superfrete_order_id) {
      throw new Error(
        "Shipment has no superfrete_order_id — create it in SuperFrete first"
      )
    }
    const client = await this.getClient()
    if (shipment.status === "pending") {
      await client.checkout([shipment.superfrete_order_id])
    }
    const tag = await client.printTag([shipment.superfrete_order_id])
    const info = await client.getOrderInfo(shipment.superfrete_order_id)
    const updated: any = await this.updateSuperfreteShipments([
      {
        id: shipment.id,
        label_url: tag.url,
        status: (info.status as any) || "released",
        tracking_code: info.tracking ?? shipment.tracking_code,
        last_synced_at: new Date(),
        last_error: null,
      },
    ] as any)
    return Array.isArray(updated) ? updated[0] : updated
  }

  async cancelShipment(shipmentId: string, reason: string): Promise<any> {
    const rows = await this.listSuperfreteShipments({ id: shipmentId })
    const shipment = rows[0]
    if (!shipment) throw new Error(`Shipment ${shipmentId} not found`)
    if (!shipment.superfrete_order_id) {
      const u: any = await this.updateSuperfreteShipments([
        { id: shipment.id, status: "canceled", cancelled_reason: reason },
      ] as any)
      return Array.isArray(u) ? u[0] : u
    }
    const client = await this.getClient()
    await client.cancelOrder(shipment.superfrete_order_id, reason)
    const u: any = await this.updateSuperfreteShipments([
      {
        id: shipment.id,
        status: "canceled",
        cancelled_reason: reason,
        last_synced_at: new Date(),
      },
    ] as any)
    return Array.isArray(u) ? u[0] : u
  }

  async syncShipmentStatus(shipmentId: string): Promise<any> {
    const rows = await this.listSuperfreteShipments({ id: shipmentId })
    const shipment = rows[0]
    if (!shipment) throw new Error(`Shipment ${shipmentId} not found`)
    if (!shipment.superfrete_order_id) return shipment
    const client = await this.getClient()
    const info = await client.getOrderInfo(shipment.superfrete_order_id)
    const u: any = await this.updateSuperfreteShipments([
      {
        id: shipment.id,
        status: (info.status as any) || shipment.status,
        tracking_code: info.tracking ?? shipment.tracking_code,
        label_url: info.print?.url ?? shipment.label_url,
        last_synced_at: new Date(),
      },
    ] as any)
    return Array.isArray(u) ? u[0] : u
  }

  async findShipmentByOrderId(order_id: string): Promise<any | null> {
    const rows = await this.listSuperfreteShipments({ order_id })
    return rows[0] ?? null
  }

  async findShipmentByTracking(tracking: string): Promise<any | null> {
    const rows = await this.listSuperfreteShipments({ tracking_code: tracking })
    return rows[0] ?? null
  }

  async findShipmentBySuperfreteId(id: string): Promise<any | null> {
    const rows = await this.listSuperfreteShipments({
      superfrete_order_id: id,
    })
    return rows[0] ?? null
  }

  async applyWebhookEvent(event: string, data: any): Promise<void> {
    const sfId: string | undefined = data?.id || data?.order_id
    if (!sfId) return
    const shipment = await this.findShipmentBySuperfreteId(sfId)
    if (!shipment) return
    const statusMap: Record<string, string> = {
      "order.created": "pending",
      "order.released": "released",
      "order.generated": "released",
      "order.posted": "posted",
      "order.delivered": "delivered",
      "order.cancelled": "canceled",
    }
    const nextStatus = statusMap[event]
    if (!nextStatus) return
    await this.updateSuperfreteShipments([
      {
        id: shipment.id,
        status: nextStatus as any,
        tracking_code: data?.tracking ?? shipment.tracking_code,
        last_synced_at: new Date(),
      },
    ] as any)
  }
}

export default SuperfreteModuleService
