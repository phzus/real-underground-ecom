import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SUPERFRETE_MODULE } from "../../../../modules/superfrete"

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
  res.json({ config: updated })
}
