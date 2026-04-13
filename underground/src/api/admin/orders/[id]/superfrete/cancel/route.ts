import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SUPERFRETE_MODULE } from "../../../../../../modules/superfrete"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const superfrete: any = req.scope.resolve(SUPERFRETE_MODULE)
  const shipment = await superfrete.findShipmentByOrderId(req.params.id)
  if (!shipment) {
    return res.status(404).json({ message: "No shipment for this order" })
  }
  const reason = (req.body as any)?.reason || "Cancelled by admin"
  try {
    const updated = await superfrete.cancelShipment(shipment.id, reason)
    res.json({ shipment: updated })
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}
