import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SUPERFRETE_MODULE } from "../../../../modules/superfrete"

type Item = {
  quantity: number
  weight?: number | null
  height?: number | null
  width?: number | null
  length?: number | null
  unit_price?: number
  name?: string
}

type Body = {
  cart_id?: string
  to_postal_code?: string
  items?: Item[]
  insurance_value?: number
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const superfrete: any = req.scope.resolve(SUPERFRETE_MODULE)
  const body = (req.body || {}) as Body

  let toCep = body.to_postal_code
  let items: Item[] = body.items || []
  let insurance = body.insurance_value ?? 0

  if (body.cart_id && (!toCep || items.length === 0)) {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data: carts } = await query.graph({
      entity: "cart",
      filters: { id: body.cart_id },
      fields: [
        "id",
        "shipping_address.postal_code",
        "items.id",
        "items.title",
        "items.quantity",
        "items.unit_price",
        "items.variant.weight",
        "items.variant.height",
        "items.variant.width",
        "items.variant.length",
      ],
    })
    const cart = carts?.[0]
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" })
    }
    if (!toCep) toCep = cart.shipping_address?.postal_code ?? undefined
    if (items.length === 0) {
      items = (cart.items || []).map((it: any) => ({
        name: it.title,
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price),
        weight: it.variant?.weight ?? null,
        height: it.variant?.height ?? null,
        width: it.variant?.width ?? null,
        length: it.variant?.length ?? null,
      }))
    }
    if (!insurance && cart.items) {
      insurance = (cart.items || []).reduce(
        (s: number, it: any) =>
          s + Number(it.unit_price) * Number(it.quantity),
        0
      )
    }
  }

  if (!toCep) {
    return res.status(400).json({ message: "to_postal_code is required" })
  }
  if (!items || items.length === 0) {
    return res.status(400).json({ message: "items are required" })
  }

  try {
    const quotes = await superfrete.quoteForCart({
      to_postal_code: toCep,
      items,
      options: { insurance_value: insurance },
    })
    res.json({
      options: quotes.map((q: any) => ({
        service_code: q.service_code,
        name: q.name,
        company: q.company?.name,
        logo: q.company?.picture,
        price: Number(q.price),
        currency: q.currency || "R$",
        delivery_min: q.delivery_range?.min ?? q.delivery_time,
        delivery_max: q.delivery_range?.max ?? q.delivery_time,
      })),
    })
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}
