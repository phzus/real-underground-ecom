import { decryptSecret } from "./crypto"
import { DEFAULT_ENABLED_SERVICES, SuperfreteEnvironment } from "./types"

// `pg` ships as a transitive dependency of @mikro-orm/knex and is always
// available at runtime inside the Medusa process. We require it dynamically
// to avoid adding a direct dependency + type resolution.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Client } = require("pg") as {
  Client: new (config: {
    connectionString?: string
    ssl?: boolean | Record<string, unknown>
  }) => {
    connect(): Promise<void>
    query(text: string): Promise<{ rows: any[] }>
    end(): Promise<void>
  }
}

export type DirectConfig = {
  environment: SuperfreteEnvironment
  token: string | null
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
}

const CACHE_TTL_MS = 60_000
let cachedConfig: DirectConfig | null = null
let cachedAt = 0
let inflight: Promise<DirectConfig> | null = null

function emptyConfig(): DirectConfig {
  return {
    environment:
      (process.env.SUPERFRETE_ENV as SuperfreteEnvironment) || "sandbox",
    token: process.env.SUPERFRETE_TOKEN || null,
    token_source: process.env.SUPERFRETE_TOKEN ? "env" : "none",
    sender: {
      name: null,
      document: null,
      email: null,
      phone: null,
      postal_code: process.env.SUPERFRETE_FROM_CEP || null,
      address: null,
      number: null,
      complement: null,
      district: null,
      city: null,
      state_abbr: null,
    },
    defaults: {
      weight_kg: Number(process.env.SUPERFRETE_DEFAULT_WEIGHT ?? "0.3"),
      height_cm: Number(process.env.SUPERFRETE_DEFAULT_HEIGHT ?? "4"),
      width_cm: Number(process.env.SUPERFRETE_DEFAULT_WIDTH ?? "16"),
      length_cm: Number(process.env.SUPERFRETE_DEFAULT_LENGTH ?? "24"),
    },
    enabled_services: DEFAULT_ENABLED_SERVICES,
  }
}

async function fetchFromDb(): Promise<DirectConfig> {
  const databaseUrl = process.env.DATABASE_URL
  const cookieSecret = process.env.COOKIE_SECRET || process.env.JWT_SECRET
  if (!databaseUrl) return emptyConfig()

  const client = new Client({
    connectionString: databaseUrl,
    ssl: false,
  })

  try {
    await client.connect()
    const { rows } = await client.query(
      `SELECT environment, api_token_cipher, api_token_iv, api_token_tag,
              sender_name, sender_document, sender_email, sender_phone,
              sender_postal_code, sender_address, sender_number, sender_complement,
              sender_district, sender_city, sender_state_abbr,
              default_weight_kg, default_height_cm, default_width_cm, default_length_cm,
              enabled_services
         FROM superfrete_config
        WHERE id = 'default' AND deleted_at IS NULL
        LIMIT 1`
    )
    const row = rows[0]
    const base = emptyConfig()
    if (!row) return base

    let token: string | null = base.token
    let tokenSource: "db" | "env" | "none" = base.token_source
    if (row.api_token_cipher && row.api_token_iv && row.api_token_tag) {
      if (cookieSecret) {
        try {
          token = decryptSecret(
            {
              cipher: row.api_token_cipher,
              iv: row.api_token_iv,
              tag: row.api_token_tag,
            },
            cookieSecret
          )
          tokenSource = "db"
        } catch {
          // fall back to env token
        }
      }
    }

    const enabled = Array.isArray(row.enabled_services)
      ? (row.enabled_services as number[])
      : base.enabled_services

    return {
      environment: (row.environment || base.environment) as SuperfreteEnvironment,
      token,
      token_source: tokenSource,
      sender: {
        name: row.sender_name ?? null,
        document: row.sender_document ?? null,
        email: row.sender_email ?? null,
        phone: row.sender_phone ?? null,
        postal_code: row.sender_postal_code ?? base.sender.postal_code,
        address: row.sender_address ?? null,
        number: row.sender_number ?? null,
        complement: row.sender_complement ?? null,
        district: row.sender_district ?? null,
        city: row.sender_city ?? null,
        state_abbr: row.sender_state_abbr ?? null,
      },
      defaults: {
        weight_kg: Number(row.default_weight_kg ?? base.defaults.weight_kg),
        height_cm: Number(row.default_height_cm ?? base.defaults.height_cm),
        width_cm: Number(row.default_width_cm ?? base.defaults.width_cm),
        length_cm: Number(row.default_length_cm ?? base.defaults.length_cm),
      },
      enabled_services: enabled,
    }
  } catch {
    return emptyConfig()
  } finally {
    try {
      await client.end()
    } catch {
      // ignore
    }
  }
}

export async function getDirectConfig(force = false): Promise<DirectConfig> {
  const now = Date.now()
  if (!force && cachedConfig && now - cachedAt < CACHE_TTL_MS) {
    return cachedConfig
  }
  if (inflight) return inflight
  inflight = fetchFromDb()
    .then((cfg) => {
      cachedConfig = cfg
      cachedAt = Date.now()
      return cfg
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

export function invalidateDirectConfigCache() {
  cachedConfig = null
  cachedAt = 0
}
