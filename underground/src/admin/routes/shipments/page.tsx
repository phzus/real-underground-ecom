import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ArchiveBox } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { useEffect, useState } from "react"

type Shipment = {
  id: string
  order_id: string
  superfrete_order_id: string | null
  service_name: string
  carrier: string | null
  status: string
  tracking_code: string | null
  label_url: string | null
  price: number
  created_at: string
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

const SuperfreteShipmentsPage = () => {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<Shipment[]>([])

  const reload = async () => {
    setLoading(true)
    try {
      const res = await fetch("/admin/superfrete/shipments?limit=100", {
        credentials: "include",
      })
      if (!res.ok) throw new Error("Falha ao carregar envios")
      const body = await res.json()
      setRows(body.shipments ?? [])
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Envios SuperFrete</Heading>
          <Text className="text-ui-fg-subtle">
            Histórico de etiquetas geradas e status atual de cada envio.
          </Text>
        </div>
        <Button variant="secondary" onClick={reload} isLoading={loading}>
          Atualizar
        </Button>
      </div>

      <div className="px-6 py-4">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Pedido</Table.HeaderCell>
              <Table.HeaderCell>Serviço</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Rastreio</Table.HeaderCell>
              <Table.HeaderCell>Preço</Table.HeaderCell>
              <Table.HeaderCell>Etiqueta</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.length === 0 && !loading && (
              <Table.Row>
                <Table.Cell colSpan={6}>
                  <Text className="text-ui-fg-subtle">Nenhum envio ainda.</Text>
                </Table.Cell>
              </Table.Row>
            )}
            {rows.map((s) => (
              <Table.Row key={s.id}>
                <Table.Cell>
                  <a
                    href={`/app/orders/${s.order_id}`}
                    className="text-ui-fg-interactive"
                  >
                    {s.order_id.slice(0, 10)}…
                  </a>
                </Table.Cell>
                <Table.Cell>
                  {s.service_name}
                  {s.carrier ? ` · ${s.carrier}` : ""}
                </Table.Cell>
                <Table.Cell>
                  <Badge color={STATUS_COLORS[s.status] || "grey"}>
                    {STATUS_LABEL[s.status] || s.status}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  {s.tracking_code ? (
                    <code>{s.tracking_code}</code>
                  ) : (
                    <Text className="text-ui-fg-subtle">—</Text>
                  )}
                </Table.Cell>
                <Table.Cell>
                  R$ {Number(s.price).toFixed(2).replace(".", ",")}
                </Table.Cell>
                <Table.Cell>
                  {s.label_url ? (
                    <a
                      href={s.label_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ui-fg-interactive"
                    >
                      Baixar PDF
                    </a>
                  ) : (
                    <Text className="text-ui-fg-subtle">—</Text>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Envios",
  icon: ArchiveBox,
})

export default SuperfreteShipmentsPage
