import {
  CheckoutResponse,
  CreateShipmentRequest,
  CreateShipmentResponse,
  OrderInfoResponse,
  QuoteOption,
  QuoteRequest,
  SUPERFRETE_BASE_URL,
  SuperfreteClientConfig,
  TagPrintResponse,
  WebhookEvent,
} from "./types"

export class SuperfreteApiError extends Error {
  status: number
  body: unknown
  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = "SuperfreteApiError"
    this.status = status
    this.body = body
  }
}

type FetchLike = typeof fetch

export class SuperfreteClient {
  private readonly baseUrl: string
  private readonly headers: Record<string, string>
  private readonly timeoutMs: number
  private readonly fetchImpl: FetchLike

  constructor(config: SuperfreteClientConfig, fetchImpl: FetchLike = fetch) {
    if (!config.token) {
      throw new Error("SuperfreteClient: token is required")
    }
    this.baseUrl = SUPERFRETE_BASE_URL[config.environment]
    this.headers = {
      Authorization: `Bearer ${config.token}`,
      "User-Agent": config.userAgent,
      "Content-Type": "application/json",
      Accept: "application/json",
    }
    this.timeoutMs = config.timeoutMs ?? 15_000
    this.fetchImpl = fetchImpl
  }

  private async request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const res = await this.fetchImpl(url, {
        method,
        headers: this.headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })
      const text = await res.text()
      let parsed: unknown = undefined
      if (text) {
        try {
          parsed = JSON.parse(text)
        } catch {
          parsed = text
        }
      }
      if (!res.ok) {
        throw new SuperfreteApiError(
          `SuperFrete ${method} ${path} failed with ${res.status}`,
          res.status,
          parsed
        )
      }
      return parsed as T
    } finally {
      clearTimeout(timeout)
    }
  }

  async calculate(req: QuoteRequest): Promise<QuoteOption[]> {
    const services = (req.services ?? [1, 2, 17]).join(",")
    const payload: Record<string, unknown> = {
      from: { postal_code: normalizeCep(req.from_postal_code) },
      to: { postal_code: normalizeCep(req.to_postal_code) },
      services,
      options: {
        own_hand: req.options?.own_hand ?? false,
        receipt: req.options?.receipt ?? false,
        insurance_value: req.options?.insurance_value ?? 0,
        use_insurance_value: req.options?.use_insurance_value ?? false,
      },
    }
    if (req.products && req.products.length > 0) {
      payload.products = req.products.map((p) => ({
        quantity: p.quantity,
        height: p.height,
        width: p.width,
        length: p.length,
        weight: p.weight,
      }))
    } else if (req.package) {
      payload.package = req.package
    } else {
      throw new Error(
        "SuperFrete calculate: either `products` or `package` is required"
      )
    }
    return this.request<QuoteOption[]>("POST", "/api/v0/calculator", payload)
  }

  async createCartShipment(
    req: CreateShipmentRequest
  ): Promise<CreateShipmentResponse> {
    return this.request<CreateShipmentResponse>("POST", "/api/v0/cart", {
      ...req,
      from: { ...req.from, postal_code: normalizeCep(req.from.postal_code) },
      to: { ...req.to, postal_code: normalizeCep(req.to.postal_code) },
      platform: req.platform ?? "Drive It Like Stole It",
    })
  }

  async checkout(orderIds: string[]): Promise<CheckoutResponse> {
    return this.request<CheckoutResponse>("POST", "/api/v0/checkout", {
      orders: orderIds,
    })
  }

  async printTag(orderIds: string[]): Promise<TagPrintResponse> {
    return this.request<TagPrintResponse>("POST", "/api/v0/tag/print", {
      orders: orderIds,
    })
  }

  async getOrderInfo(id: string): Promise<OrderInfoResponse> {
    return this.request<OrderInfoResponse>(
      "GET",
      `/api/v0/order/info/${encodeURIComponent(id)}`
    )
  }

  async cancelOrder(
    id: string,
    description: string
  ): Promise<Record<string, { canceled: boolean }>> {
    return this.request("POST", "/api/v0/order/cancel", {
      order: { id, description },
    })
  }

  async createWebhook(params: {
    name: string
    url: string
    events: WebhookEvent[]
  }): Promise<{ id: string; secret_token: string; url: string }> {
    return this.request("POST", "/api/v0/webhook", params)
  }

  async listWebhooks(): Promise<Array<{ id: string; url: string; events: string[] }>> {
    return this.request("GET", "/api/v0/webhook")
  }

  async deleteWebhook(id: string): Promise<void> {
    await this.request("DELETE", `/api/v0/webhook/${encodeURIComponent(id)}`)
  }
}

export function normalizeCep(cep: string): string {
  return cep.replace(/\D/g, "").slice(0, 8)
}

export function buildUserAgent(
  appName = "DriveItLikeStoleIt",
  email = "contato@driveitlikestoleit.com"
): string {
  return `${appName} (${email})`
}
