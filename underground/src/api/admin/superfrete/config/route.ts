import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SUPERFRETE_MODULE } from "../../../../modules/superfrete"
import { invalidateDirectConfigCache } from "../../../../modules/superfrete/lib/direct-config"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const superfrete: any = req.scope.resolve(SUPERFRETE_MODULE)
  const cfg = await superfrete.getPublicConfig()
  res.json({ config: cfg })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const superfrete: any = req.scope.resolve(SUPERFRETE_MODULE)
  const body = req.body as any
  const updated = await superfrete.updatePublicConfig({
    environment: body?.environment,
    token: body?.token,
    sender: body?.sender,
    defaults: body?.defaults,
    enabled_services: body?.enabled_services,
  })
  // Invalidate the fulfillment provider's direct-DB cache so the next
  // calculatePrice call sees the updated config immediately.
  invalidateDirectConfigCache()
  res.json({ config: updated })
}
