import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SUPERFRETE_MODULE } from "../../../../../modules/superfrete"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const superfrete: any = req.scope.resolve(SUPERFRETE_MODULE)
  const shipment = await superfrete.findShipmentByOrderId(req.params.id)
  res.json({ shipment: shipment ?? null })
}
