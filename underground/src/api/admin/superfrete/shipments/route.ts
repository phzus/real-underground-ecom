import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SUPERFRETE_MODULE } from "../../../../modules/superfrete"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const superfrete: any = req.scope.resolve(SUPERFRETE_MODULE)
  const limit = Number(req.query.limit ?? 50)
  const offset = Number(req.query.offset ?? 0)
  const status = req.query.status as string | undefined
  const filters: Record<string, unknown> = {}
  if (status) filters.status = status
  const shipments = await superfrete.listSuperfreteShipments(filters, {
    take: limit,
    skip: offset,
    order: { created_at: "DESC" },
  })
  res.json({ shipments, count: shipments.length, limit, offset })
}
