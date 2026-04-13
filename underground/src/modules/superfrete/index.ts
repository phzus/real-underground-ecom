import { Module } from "@medusajs/framework/utils"
import SuperfreteModuleService from "./service"

export const SUPERFRETE_MODULE = "superfrete"

export default Module(SUPERFRETE_MODULE, {
  service: SuperfreteModuleService,
})

export { default as SuperfreteModuleService } from "./service"
export * from "./lib/types"
