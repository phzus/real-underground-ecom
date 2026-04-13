import { defineMiddlewares } from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/hooks/superfrete",
      method: "POST",
      bodyParser: { sizeLimit: "1mb", preserveRawBody: true },
    },
  ],
})
