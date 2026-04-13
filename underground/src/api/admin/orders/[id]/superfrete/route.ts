import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SUPERFRETE_MODULE } from "../../../../../modules/superfrete"
import { SERVICE_CATALOG } from "../../../../../modules/superfrete/lib/types"

function detectServiceCode(order: any): number | null {
  const method = order?.shipping_methods?.[0]
  const raw =
    method?.data?.service_code ||
    method?.data?.service_id ||
    method?.metadata?.service_code ||
    order?.metadata?.superfrete_service_id ||
    order?.metadata?.superfrete?.service_id
  return raw ? Number(raw) : null
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const superfrete: any = req.scope.resolve(SUPERFRETE_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const [shipment, orderResult] = await Promise.all([
    superfrete.findShipmentByOrderId(req.params.id),
    query.graph({
      entity: "order",
      filters: { id: req.params.id },
      fields: [
        "id",
        "metadata",
        "shipping_methods.id",
        "shipping_methods.name",
        "shipping_methods.data",
      ],
    }),
  ])

  const order = orderResult.data?.[0]
  const detected = order ? detectServiceCode(order) : null
  const catalog = detected ? SERVICE_CATALOG[detected] : null

  res.json({
    shipment: shipment ?? null,
    order_service: detected
      ? {
          service_code: detected,
          name: catalog?.name ?? `Serviço #${detected}`,
          carrier: catalog?.carrier ?? null,
        }
      : null,
  })
}
