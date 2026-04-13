import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SUPERFRETE_MODULE } from "../../../../../../modules/superfrete"
import { Address } from "../../../../../../modules/superfrete/lib/types"

type Body = {
  service_id?: number
  non_commercial?: boolean
  insurance_value?: number
}

function pickServiceId(order: any, body: Body): number | null {
  // Priority 1: shipping method chosen by the customer during checkout.
  // This is the source of truth — the customer paid for THIS service.
  const method = order?.shipping_methods?.[0]
  const methodSvc =
    method?.data?.service_code ||
    method?.data?.service_id ||
    method?.metadata?.service_code
  if (methodSvc) return Number(methodSvc)
  // Priority 2: order metadata (set by subscribers or custom flows).
  const metaSvc =
    order?.metadata?.superfrete_service_id ||
    order?.metadata?.superfrete?.service_id
  if (metaSvc) return Number(metaSvc)
  // Priority 3: explicit override from the admin (escape hatch, not exposed in UI).
  if (body?.service_id) return Number(body.service_id)
  return null
}

function splitName(full?: string): { first: string; last: string } {
  const s = (full || "").trim()
  if (!s) return { first: "Cliente", last: "" }
  const parts = s.split(/\s+/)
  if (parts.length === 1) return { first: parts[0], last: "" }
  return { first: parts[0], last: parts.slice(1).join(" ") }
}

function buildRecipient(order: any): Address {
  const a = order?.shipping_address || {}
  const email = order?.email || ""
  const document =
    order?.metadata?.document ||
    order?.metadata?.cpf ||
    a?.metadata?.document ||
    ""
  const fullName = `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim() || "Cliente"
  return {
    name: fullName,
    address: a.address_1 || "",
    number: a.metadata?.number || "",
    complement: a.address_2 || "",
    district: a.metadata?.district || a.company || "NA",
    city: a.city || "",
    state_abbr: (a.province || "").toString().toUpperCase(),
    postal_code: (a.postal_code || "").replace(/\D/g, ""),
    email,
    document,
    phone: a.phone || order?.phone || undefined,
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const superfrete: any = req.scope.resolve(SUPERFRETE_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const body = (req.body || {}) as Body

  const { data: orders } = await query.graph({
    entity: "order",
    filters: { id: req.params.id },
    fields: [
      "id",
      "email",
      "metadata",
      "currency_code",
      "items.id",
      "items.title",
      "items.quantity",
      "items.unit_price",
      "items.variant.id",
      "items.variant.weight",
      "items.variant.height",
      "items.variant.width",
      "items.variant.length",
      "shipping_address.*",
      "shipping_methods.id",
      "shipping_methods.data",
    ],
  })
  const order = orders?.[0]
  if (!order) return res.status(404).json({ message: "Order not found" })

  const service_id = pickServiceId(order, body)
  if (!service_id) {
    return res.status(400).json({
      message:
        "Service ID not found on order. Pass service_id in body or set it on the shipping method.",
    })
  }

  try {
    const existing = await superfrete.findShipmentByOrderId(order.id)
    let shipment = existing
    if (!shipment || shipment.status === "error") {
      shipment = await superfrete.createShipmentForOrder({
        order_id: order.id,
        service_id,
        recipient: buildRecipient(order),
        items: (order.items || []).map((it: any) => ({
          name: it.title,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
          weight: it.variant?.weight ?? null,
          height: it.variant?.height ?? null,
          width: it.variant?.width ?? null,
          length: it.variant?.length ?? null,
        })),
        insurance_value: body.insurance_value,
        non_commercial: body.non_commercial ?? true,
      })
    }
    if (shipment.status === "error" || !shipment.superfrete_order_id) {
      return res.status(502).json({
        message: "Failed to create shipment at SuperFrete",
        shipment,
      })
    }
    const withLabel = await superfrete.generateLabelForShipment(shipment.id)
    res.json({ shipment: withLabel })
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}
