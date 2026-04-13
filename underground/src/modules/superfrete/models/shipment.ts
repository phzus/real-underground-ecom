import { model } from "@medusajs/framework/utils"

const SuperfreteShipment = model.define("superfrete_shipment", {
  id: model.id().primaryKey(),
  order_id: model.text(),
  cart_id: model.text().nullable(),
  superfrete_order_id: model.text().nullable(),
  service_id: model.number(),
  service_name: model.text(),
  carrier: model.text().nullable(),
  status: model
    .enum([
      "draft",
      "pending",
      "released",
      "posted",
      "delivered",
      "canceled",
      "error",
    ])
    .default("draft"),
  tracking_code: model.text().nullable(),
  label_url: model.text().nullable(),
  price: model.number(),
  discount: model.number().default(0),
  currency: model.text().default("BRL"),
  delivery_min_days: model.number().nullable(),
  delivery_max_days: model.number().nullable(),
  from_snapshot: model.json().nullable(),
  to_snapshot: model.json().nullable(),
  volumes_snapshot: model.json().nullable(),
  products_snapshot: model.json().nullable(),
  last_synced_at: model.dateTime().nullable(),
  last_error: model.text().nullable(),
  cancelled_reason: model.text().nullable(),
})

export default SuperfreteShipment
