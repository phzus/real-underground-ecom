import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260413120000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "superfrete_config" (
        "id" text NOT NULL,
        "environment" text NOT NULL DEFAULT 'sandbox',
        "api_token_cipher" text NULL,
        "api_token_iv" text NULL,
        "api_token_tag" text NULL,
        "api_token_fingerprint" text NULL,
        "sender_name" text NULL,
        "sender_document" text NULL,
        "sender_email" text NULL,
        "sender_phone" text NULL,
        "sender_postal_code" text NULL,
        "sender_address" text NULL,
        "sender_number" text NULL,
        "sender_complement" text NULL,
        "sender_district" text NULL,
        "sender_city" text NULL,
        "sender_state_abbr" text NULL,
        "default_weight_kg" real NOT NULL DEFAULT 0.3,
        "default_height_cm" real NOT NULL DEFAULT 4,
        "default_width_cm" real NOT NULL DEFAULT 16,
        "default_length_cm" real NOT NULL DEFAULT 24,
        "enabled_services" jsonb NULL,
        "webhook_id" text NULL,
        "webhook_secret_cipher" text NULL,
        "webhook_secret_iv" text NULL,
        "webhook_secret_tag" text NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "superfrete_config_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "superfrete_config_environment_check" CHECK ("environment" IN ('sandbox','production'))
      );
    `)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_superfrete_config_deleted_at" ON "superfrete_config" ("deleted_at") WHERE "deleted_at" IS NULL;`
    )

    this.addSql(`
      CREATE TABLE IF NOT EXISTS "superfrete_shipment" (
        "id" text NOT NULL,
        "order_id" text NOT NULL,
        "cart_id" text NULL,
        "superfrete_order_id" text NULL,
        "service_id" integer NOT NULL,
        "service_name" text NOT NULL,
        "carrier" text NULL,
        "status" text NOT NULL DEFAULT 'draft',
        "tracking_code" text NULL,
        "label_url" text NULL,
        "price" real NOT NULL,
        "discount" real NOT NULL DEFAULT 0,
        "currency" text NOT NULL DEFAULT 'BRL',
        "delivery_min_days" integer NULL,
        "delivery_max_days" integer NULL,
        "from_snapshot" jsonb NULL,
        "to_snapshot" jsonb NULL,
        "volumes_snapshot" jsonb NULL,
        "products_snapshot" jsonb NULL,
        "last_synced_at" timestamptz NULL,
        "last_error" text NULL,
        "cancelled_reason" text NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "superfrete_shipment_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "superfrete_shipment_status_check" CHECK ("status" IN ('draft','pending','released','posted','delivered','canceled','error'))
      );
    `)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_superfrete_shipment_order_id" ON "superfrete_shipment" ("order_id") WHERE "deleted_at" IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_superfrete_shipment_superfrete_order_id" ON "superfrete_shipment" ("superfrete_order_id") WHERE "deleted_at" IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_superfrete_shipment_tracking_code" ON "superfrete_shipment" ("tracking_code") WHERE "deleted_at" IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_superfrete_shipment_deleted_at" ON "superfrete_shipment" ("deleted_at") WHERE "deleted_at" IS NULL;`
    )
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "superfrete_shipment";`)
    this.addSql(`DROP TABLE IF EXISTS "superfrete_config";`)
  }
}
