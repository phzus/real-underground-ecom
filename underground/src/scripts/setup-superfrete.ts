import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import {
  createRegionsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createTaxRegionsWorkflow,
} from "@medusajs/medusa/core-flows"

const PROVIDER_ID = "superfrete_superfrete"

const SERVICES = [
  { code: 1, name: "PAC", description: "Correios PAC — econômico" },
  { code: 2, name: "SEDEX", description: "Correios SEDEX — rápido" },
  { code: 17, name: "Mini Envios", description: "Correios Mini Envios" },
  { code: 3, name: "Jadlog Package", description: "Jadlog Package" },
  { code: 31, name: "Loggi Econômico", description: "Loggi Econômico" },
]

export default async function setupSuperfrete({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const fulfillmentService = container.resolve(Modules.FULFILLMENT)
  const regionService = container.resolve(Modules.REGION)

  logger.info("[superfrete] verificando região Brasil…")

  const existingRegions = await regionService.listRegions({
    currency_code: "brl",
  })
  let region = existingRegions.find((r: any) =>
    (r.countries || []).some((c: any) => c.iso_2 === "br")
  )

  if (!region) {
    logger.info("[superfrete] criando região Brasil (BRL)…")
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Brasil",
            currency_code: "brl",
            countries: ["br"],
            payment_providers: ["pp_stripe_stripe"],
          },
        ],
      },
    })
    region = result[0]
  } else {
    logger.info("[superfrete] região Brasil já existe.")
  }

  const taxRegions = await (async () => {
    try {
      return await (fulfillmentService as any).listTaxRegions?.({
        country_code: "br",
      })
    } catch {
      return []
    }
  })()
  if (!taxRegions || taxRegions.length === 0) {
    try {
      await createTaxRegionsWorkflow(container).run({
        input: [{ country_code: "br", provider_id: "tp_system" }],
      })
      logger.info("[superfrete] tax region BR criada.")
    } catch (e) {
      logger.info(
        `[superfrete] skip tax region BR (${(e as Error).message})`
      )
    }
  }

  const profiles = await fulfillmentService.listShippingProfiles({
    type: "default",
  })
  let profile = profiles[0]
  if (!profile) {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: {
        data: [{ name: "Default Shipping Profile", type: "default" }],
      },
    })
    profile = result[0]
  }

  const existingSets = await fulfillmentService.listFulfillmentSets({
    name: "SuperFrete Brasil",
  })
  let fset = existingSets[0]
  if (!fset) {
    logger.info("[superfrete] criando fulfillment set Brasil…")
    fset = await fulfillmentService.createFulfillmentSets({
      name: "SuperFrete Brasil",
      type: "shipping",
      service_zones: [
        {
          name: "Brasil — Nacional",
          geo_zones: [{ type: "country", country_code: "br" }],
        },
      ],
    })
  } else {
    logger.info("[superfrete] fulfillment set Brasil já existe.")
  }

  const fullSet = await fulfillmentService.retrieveFulfillmentSet(fset.id, {
    relations: ["service_zones"],
  })
  const zone = (fullSet as any).service_zones?.[0]
  if (!zone) {
    logger.error("[superfrete] service zone Brasil não foi criada — abortando.")
    return
  }

  const existingOptions = await fulfillmentService.listShippingOptions({
    service_zone_id: zone.id,
    provider_id: PROVIDER_ID,
  })

  const existingByName = new Map<string, any>(
    (existingOptions || []).map((o: any) => [o.name, o])
  )

  const toCreate = SERVICES.filter((s) => !existingByName.has(s.name)).map(
    (s) => ({
      name: s.name,
      price_type: "calculated" as const,
      service_zone_id: zone.id,
      shipping_profile_id: profile.id,
      provider_id: PROVIDER_ID,
      type: {
        label: s.name,
        description: s.description,
        code: `superfrete-${s.code}`,
      },
      data: {
        id: `superfrete-${s.code}`,
        service_code: s.code,
        name: s.name,
      },
      prices: [{ region_id: region!.id, amount: 0 }],
      rules: [
        { attribute: "enabled_in_store", value: "true", operator: "eq" },
        { attribute: "is_return", value: "false", operator: "eq" },
      ],
    })
  )

  if (toCreate.length > 0) {
    logger.info(
      `[superfrete] criando ${toCreate.length} shipping options novos…`
    )
    await createShippingOptionsWorkflow(container).run({
      input: toCreate as any,
    })
  } else {
    logger.info(
      "[superfrete] todos os shipping options já existem — nada a fazer."
    )
  }

  logger.info("[superfrete] setup concluído com sucesso.")
}
