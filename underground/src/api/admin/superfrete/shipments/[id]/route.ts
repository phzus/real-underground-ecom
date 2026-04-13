import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SUPERFRETE_MODULE } from "../../../../../modules/superfrete"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const superfrete: any = req.scope.resolve(SUPERFRETE_MODULE)
  const shipments = await superfrete.listSuperfreteShipments({
    id: req.params.id,
  })
  if (shipments.length === 0) {
    return res.status(404).json({ message: "Shipment not found" })
  }
  res.json({ shipment: shipments[0] })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const superfrete: any = req.scope.resolve(SUPERFRETE_MODULE)
  const action = (req.body as any)?.action
  try {
    if (action === "sync") {
      const shipment = await superfrete.syncShipmentStatus(req.params.id)
      return res.json({ shipment })
    }
    if (action === "cancel") {
      const reason = (req.body as any)?.reason || "Cancelled by admin"
      const shipment = await superfrete.cancelShipment(req.params.id, reason)
      return res.json({ shipment })
    }
    res.status(400).json({ message: `Unknown action: ${action}` })
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}
