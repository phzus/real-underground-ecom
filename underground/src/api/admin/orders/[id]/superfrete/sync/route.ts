import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SUPERFRETE_MODULE } from "../../../../../../modules/superfrete"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const superfrete: any = req.scope.resolve(SUPERFRETE_MODULE)
  const shipment = await superfrete.findShipmentByOrderId(req.params.id)
  if (!shipment) {
    return res.status(404).json({ message: "No shipment for this order" })
  }
  try {
    const updated = await superfrete.syncShipmentStatus(shipment.id)
    res.json({ shipment: updated })
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}
