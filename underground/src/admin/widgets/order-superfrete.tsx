import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { HandTruck } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
  toast,
} from "@medusajs/ui"
import { useEffect, useState } from "react"

type Shipment = {
  id: string
  order_id: string
  superfrete_order_id: string | null
  service_id: number
  service_name: string
  carrier: string | null
  status: string
  tracking_code: string | null
  label_url: string | null
  price: number
  last_error: string | null
}

const STATUS_COLORS: Record<string, "grey" | "blue" | "green" | "orange" | "red"> =
  {
    draft: "grey",
    pending: "orange",
    released: "blue",
    posted: "blue",
    delivered: "green",
    canceled: "red",
    error: "red",
  }

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  pending: "Aguardando pagamento",
  released: "Etiqueta gerada",
  posted: "Postado",
  delivered: "Entregue",
  canceled: "Cancelado",
  error: "Erro",
}

type OrderService = {
  service_code: number
  name: string
  carrier: string | null
}

const OrderSuperfreteWidget = ({
  data,
}: {
  data: { id: string }
}) => {
  const orderId = data.id
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [orderService, setOrderService] = useState<OrderService | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [showCancel, setShowCancel] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/admin/orders/${orderId}/superfrete`, {
        credentials: "include",
      })
      if (!res.ok) throw new Error("Falha ao carregar envio")
      const body = await res.json()
      setShipment(body.shipment ?? null)
      setOrderService(body.order_service ?? null)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [orderId])

  const generateLabel = async () => {
    setWorking(true)
    try {
      const res = await fetch(`/admin/orders/${orderId}/superfrete/label`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.message || "Falha ao gerar etiqueta")
      setShipment(body.shipment)
      toast.success("Etiqueta gerada com sucesso.")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setWorking(false)
    }
  }

  const sync = async () => {
    setWorking(true)
    try {
      const res = await fetch(`/admin/orders/${orderId}/superfrete/sync`, {
        method: "POST",
        credentials: "include",
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.message || "Falha ao sincronizar")
      setShipment(body.shipment)
      toast.success("Status atualizado.")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setWorking(false)
    }
  }

  const cancel = async () => {
    setWorking(true)
    try {
      const res = await fetch(`/admin/orders/${orderId}/superfrete/cancel`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason || "Cancelado pelo admin" }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.message || "Falha ao cancelar")
      setShipment(body.shipment)
      setShowCancel(false)
      setCancelReason("")
      toast.success("Envio cancelado.")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setWorking(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <HandTruck />
          <Heading level="h2">SuperFrete</Heading>
        </div>
        {shipment && (
          <Badge color={STATUS_COLORS[shipment.status] || "grey"}>
            {STATUS_LABEL[shipment.status] || shipment.status}
          </Badge>
        )}
      </div>

      <div className="px-6 py-4 space-y-4">
        {loading && <Text className="text-ui-fg-subtle">Carregando…</Text>}

        {!loading && !shipment && (
          <div className="space-y-4">
            {orderService ? (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <Text className="text-ui-fg-subtle">
                    Serviço escolhido pelo cliente
                  </Text>
                  <Text>
                    {orderService.name}
                    {orderService.carrier ? ` · ${orderService.carrier}` : ""}
                  </Text>
                </div>
                <Button
                  variant="primary"
                  isLoading={working}
                  onClick={generateLabel}
                >
                  Gerar etiqueta
                </Button>
                <Text size="small" className="text-ui-fg-subtle">
                  A etiqueta será emitida para o serviço que o cliente
                  selecionou no checkout. Certifique-se de ter saldo na
                  carteira SuperFrete.
                </Text>
              </>
            ) : (
              <div className="space-y-2 rounded-md border border-ui-border-base p-3">
                <Text size="small">
                  Este pedido não tem serviço SuperFrete definido no método
                  de envio — provavelmente foi criado antes da integração ou
                  usa um método de envio manual. Não é possível emitir uma
                  etiqueta automaticamente.
                </Text>
              </div>
            )}
          </div>
        )}

        {!loading && shipment && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <Text className="text-ui-fg-subtle">Serviço</Text>
              <Text>
                {shipment.service_name}
                {shipment.carrier ? ` · ${shipment.carrier}` : ""}
              </Text>
              <Text className="text-ui-fg-subtle">Preço</Text>
              <Text>R$ {Number(shipment.price).toFixed(2).replace(".", ",")}</Text>
              <Text className="text-ui-fg-subtle">ID SuperFrete</Text>
              <Text>
                <code>{shipment.superfrete_order_id ?? "—"}</code>
              </Text>
              <Text className="text-ui-fg-subtle">Rastreio</Text>
              <Text>
                {shipment.tracking_code ? (
                  <code>{shipment.tracking_code}</code>
                ) : (
                  "—"
                )}
              </Text>
            </div>

            {shipment.last_error && (
              <div className="rounded-md border border-ui-border-error bg-ui-bg-base p-3">
                <Text className="text-ui-fg-error" size="small">
                  Erro: {shipment.last_error}
                </Text>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {shipment.label_url && (
                <a href={shipment.label_url} target="_blank" rel="noreferrer">
                  <Button variant="primary">Baixar etiqueta (PDF)</Button>
                </a>
              )}
              {shipment.status === "error" && (
                <Button variant="primary" isLoading={working} onClick={generateLabel}>
                  Tentar novamente
                </Button>
              )}
              {shipment.status !== "canceled" && shipment.status !== "delivered" && (
                <Button variant="secondary" isLoading={working} onClick={sync}>
                  Sincronizar status
                </Button>
              )}
              {shipment.status !== "canceled" &&
                shipment.status !== "posted" &&
                shipment.status !== "delivered" && (
                  <Button
                    variant="danger"
                    onClick={() => setShowCancel(!showCancel)}
                  >
                    Cancelar envio
                  </Button>
                )}
            </div>

            {showCancel && (
              <div className="space-y-2 rounded-md border border-ui-border-base p-3">
                <Label>Motivo do cancelamento</Label>
                <Input
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ex: cliente desistiu"
                />
                <div className="flex gap-2">
                  <Button variant="danger" isLoading={working} onClick={cancel}>
                    Confirmar cancelamento
                  </Button>
                  <Button variant="secondary" onClick={() => setShowCancel(false)}>
                    Voltar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.after",
})

export default OrderSuperfreteWidget
