import { model } from "@medusajs/framework/utils"

const SuperfreteConfig = model.define("superfrete_config", {
  id: model.id().primaryKey(),
  environment: model.enum(["sandbox", "production"]).default("sandbox"),
  api_token_cipher: model.text().nullable(),
  api_token_iv: model.text().nullable(),
  api_token_tag: model.text().nullable(),
  api_token_fingerprint: model.text().nullable(),
  sender_name: model.text().nullable(),
  sender_document: model.text().nullable(),
  sender_email: model.text().nullable(),
  sender_phone: model.text().nullable(),
  sender_postal_code: model.text().nullable(),
  sender_address: model.text().nullable(),
  sender_number: model.text().nullable(),
  sender_complement: model.text().nullable(),
  sender_district: model.text().nullable(),
  sender_city: model.text().nullable(),
  sender_state_abbr: model.text().nullable(),
  default_weight_kg: model.number().default(0.3),
  default_height_cm: model.number().default(4),
  default_width_cm: model.number().default(16),
  default_length_cm: model.number().default(24),
  enabled_services: model.json().nullable(),
  webhook_id: model.text().nullable(),
  webhook_secret_cipher: model.text().nullable(),
  webhook_secret_iv: model.text().nullable(),
  webhook_secret_tag: model.text().nullable(),
})

export default SuperfreteConfig
