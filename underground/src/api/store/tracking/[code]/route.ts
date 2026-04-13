import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SUPERFRETE_MODULE } from "../../../../modules/superfrete"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const superfrete: any = req.scope.resolve(SUPERFRETE_MODULE)
  const code = req.params.code
  let shipment =
    (await superfrete.findShipmentByTracking(code)) ??
    (await superfrete.findShipmentBySuperfreteId(code)) ??
    (await superfrete.findShipmentByOrderId(code))
  if (!shipment) {
    return res.status(404).json({ message: "Envio não encontrado" })
  }
  try {
    shipment = await superfrete.syncShipmentStatus(shipment.id)
  } catch {
    // return stale if sync fails
  }
  res.json({
    tracking: {
      status: shipment.status,
      tracking_code: shipment.tracking_code,
      carrier: shipment.carrier,
      service_name: shipment.service_name,
      delivery_min_days: shipment.delivery_min_days,
      delivery_max_days: shipment.delivery_max_days,
      last_synced_at: shipment.last_synced_at,
    },
  })
}
