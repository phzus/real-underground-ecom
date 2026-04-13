import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import SuperfreteFulfillmentProvider from "./fulfillment"

export default ModuleProvider(Modules.FULFILLMENT, {
  services: [SuperfreteFulfillmentProvider],
})
