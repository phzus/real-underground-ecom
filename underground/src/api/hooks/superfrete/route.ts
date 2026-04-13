import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SUPERFRETE_MODULE } from "../../../modules/superfrete"
import { verifyHmac } from "../../../modules/superfrete/lib/crypto"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const superfrete: any = req.scope.resolve(SUPERFRETE_MODULE)

  const cfg = await superfrete.getPublicConfig()
  const secret = process.env.SUPERFRETE_WEBHOOK_SECRET || ""
  const signature =
    (req.headers["x-superfrete-signature"] as string) ||
    (req.headers["x-hub-signature-256"] as string) ||
    ""

  const raw = (req as any).rawBody
    ? (req as any).rawBody.toString("utf8")
    : JSON.stringify(req.body ?? {})

  if (secret) {
    const ok = verifyHmac(raw, signature, secret)
    if (!ok) {
      return res.status(401).json({ message: "invalid signature" })
    }
  }

  const body = req.body as any
  const event: string =
    body?.event || body?.type || body?.name || "order.updated"
  const data = body?.data || body?.order || body

  try {
    await superfrete.applyWebhookEvent(event, data)
    res.status(200).json({ ok: true })
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.json({ ok: true, service: "superfrete-webhook" })
}
