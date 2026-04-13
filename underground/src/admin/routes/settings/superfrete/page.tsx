import { defineRouteConfig } from "@medusajs/admin-sdk"
import { HandTruck } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Switch,
  Text,
  toast,
} from "@medusajs/ui"
import { useEffect, useState } from "react"

type ConfigView = {
  configured: boolean
  environment: "sandbox" | "production"
  token_masked: string
  token_source: "db" | "env" | "none"
  sender: {
    name: string | null
    document: string | null
    email: string | null
    phone: string | null
    postal_code: string | null
    address: string | null
    number: string | null
    complement: string | null
    district: string | null
    city: string | null
    state_abbr: string | null
  }
  defaults: {
    weight_kg: number
    height_cm: number
    width_cm: number
    length_cm: number
  }
  enabled_services: number[]
  webhook: { registered: boolean; id: string | null }
}

const SERVICE_OPTIONS = [
  { code: 1, label: "PAC (Correios)" },
  { code: 2, label: "SEDEX (Correios)" },
  { code: 17, label: "Mini Envios (Correios)" },
  { code: 3, label: "Jadlog Package" },
  { code: 31, label: "Loggi Econômico" },
]

async function fetchConfig(): Promise<ConfigView> {
  const res = await fetch("/admin/superfrete/config", { credentials: "include" })
  if (!res.ok) throw new Error("Failed to load config")
  const body = await res.json()
  return body.config
}

async function saveConfig(patch: any): Promise<ConfigView> {
  const res = await fetch("/admin/superfrete/config", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || "Failed to save config")
  }
  const body = await res.json()
  return body.config
}

const SuperfreteSettingsPage = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cfg, setCfg] = useState<ConfigView | null>(null)
  const [replaceToken, setReplaceToken] = useState(false)
  const [tokenDraft, setTokenDraft] = useState("")

  useEffect(() => {
    fetchConfig()
      .then((c) => setCfg(c))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !cfg) {
    return (
      <Container className="p-6">
        <Text>Carregando…</Text>
      </Container>
    )
  }

  const updateSender = (key: keyof ConfigView["sender"], value: string) => {
    setCfg({ ...cfg, sender: { ...cfg.sender, [key]: value } })
  }
  const updateDefaults = (key: keyof ConfigView["defaults"], value: string) => {
    setCfg({
      ...cfg,
      defaults: { ...cfg.defaults, [key]: Number(value) || 0 },
    })
  }
  const toggleService = (code: number) => {
    const set = new Set(cfg.enabled_services)
    if (set.has(code)) set.delete(code)
    else set.add(code)
    setCfg({ ...cfg, enabled_services: Array.from(set).sort((a, b) => a - b) })
  }

  const onSave = async () => {
    setSaving(true)
    try {
      const patch: any = {
        environment: cfg.environment,
        sender: cfg.sender,
        defaults: cfg.defaults,
        enabled_services: cfg.enabled_services,
      }
      if (replaceToken && tokenDraft.trim()) {
        patch.token = tokenDraft.trim()
      }
      const saved = await saveConfig(patch)
      setCfg(saved)
      setReplaceToken(false)
      setTokenDraft("")
      toast.success("Configuração do SuperFrete salva.")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">SuperFrete</Heading>
          <Text className="text-ui-fg-subtle">
            Integração com a API da SuperFrete — cálculo de frete, emissão de etiqueta e rastreio.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          {cfg.configured ? (
            <Badge color="green">Conectado</Badge>
          ) : (
            <Badge color="red">Não configurado</Badge>
          )}
          <Badge color={cfg.environment === "production" ? "orange" : "blue"}>
            {cfg.environment}
          </Badge>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <Heading level="h2">Conta e ambiente</Heading>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Ambiente</Label>
            <Select
              value={cfg.environment}
              onValueChange={(v) =>
                setCfg({ ...cfg, environment: v as "sandbox" | "production" })
              }
            >
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="sandbox">Sandbox (testes)</Select.Item>
                <Select.Item value="production">Produção</Select.Item>
              </Select.Content>
            </Select>
          </div>
          <div>
            <Label>Token da API</Label>
            {!replaceToken ? (
              <div className="flex items-center gap-2">
                <Input
                  value={cfg.token_masked || "—"}
                  disabled
                  readOnly
                />
                <Button
                  variant="secondary"
                  onClick={() => setReplaceToken(true)}
                >
                  Substituir
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="password"
                  placeholder="Cole o novo token"
                  value={tokenDraft}
                  onChange={(e) => setTokenDraft(e.target.value)}
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    setReplaceToken(false)
                    setTokenDraft("")
                  }}
                >
                  Cancelar
                </Button>
              </div>
            )}
            <Text size="small" className="text-ui-fg-subtle mt-1">
              Fonte atual: {cfg.token_source === "db" ? "Banco (cifrado)" : cfg.token_source === "env" ? "Variável de ambiente" : "Nenhum"}
            </Text>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <Heading level="h2">Dados do remetente</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Esses dados vão na etiqueta. Use os dados de quem posta as encomendas.
        </Text>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Nome completo</Label>
            <Input
              value={cfg.sender.name ?? ""}
              onChange={(e) => updateSender("name", e.target.value)}
            />
          </div>
          <div>
            <Label>CPF / CNPJ</Label>
            <Input
              value={cfg.sender.document ?? ""}
              onChange={(e) => updateSender("document", e.target.value)}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={cfg.sender.email ?? ""}
              onChange={(e) => updateSender("email", e.target.value)}
            />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input
              value={cfg.sender.phone ?? ""}
              onChange={(e) => updateSender("phone", e.target.value)}
            />
          </div>
          <div>
            <Label>CEP</Label>
            <Input
              value={cfg.sender.postal_code ?? ""}
              onChange={(e) => updateSender("postal_code", e.target.value)}
            />
          </div>
          <div>
            <Label>UF</Label>
            <Input
              maxLength={2}
              value={cfg.sender.state_abbr ?? ""}
              onChange={(e) =>
                updateSender("state_abbr", e.target.value.toUpperCase())
              }
            />
          </div>
          <div>
            <Label>Cidade</Label>
            <Input
              value={cfg.sender.city ?? ""}
              onChange={(e) => updateSender("city", e.target.value)}
            />
          </div>
          <div>
            <Label>Bairro</Label>
            <Input
              value={cfg.sender.district ?? ""}
              onChange={(e) => updateSender("district", e.target.value)}
            />
          </div>
          <div>
            <Label>Endereço (rua)</Label>
            <Input
              value={cfg.sender.address ?? ""}
              onChange={(e) => updateSender("address", e.target.value)}
            />
          </div>
          <div>
            <Label>Número</Label>
            <Input
              value={cfg.sender.number ?? ""}
              onChange={(e) => updateSender("number", e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <Label>Complemento</Label>
            <Input
              value={cfg.sender.complement ?? ""}
              onChange={(e) => updateSender("complement", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <Heading level="h2">Dimensões padrão</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Usado como fallback quando o produto não tem peso/dimensões cadastradas. Mínimo PAC/SEDEX: 0.3 kg, 16×4×24 cm.
        </Text>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label>Peso (kg)</Label>
            <Input
              type="number"
              step="0.01"
              value={cfg.defaults.weight_kg}
              onChange={(e) => updateDefaults("weight_kg", e.target.value)}
            />
          </div>
          <div>
            <Label>Altura (cm)</Label>
            <Input
              type="number"
              value={cfg.defaults.height_cm}
              onChange={(e) => updateDefaults("height_cm", e.target.value)}
            />
          </div>
          <div>
            <Label>Largura (cm)</Label>
            <Input
              type="number"
              value={cfg.defaults.width_cm}
              onChange={(e) => updateDefaults("width_cm", e.target.value)}
            />
          </div>
          <div>
            <Label>Comprimento (cm)</Label>
            <Input
              type="number"
              value={cfg.defaults.length_cm}
              onChange={(e) => updateDefaults("length_cm", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <Heading level="h2">Serviços habilitados</Heading>
        <div className="grid grid-cols-2 gap-3">
          {SERVICE_OPTIONS.map((s) => (
            <div
              key={s.code}
              className="flex items-center justify-between rounded-md border border-ui-border-base px-3 py-2"
            >
              <Text>{s.label}</Text>
              <Switch
                checked={cfg.enabled_services.includes(s.code)}
                onCheckedChange={() => toggleService(s.code)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 px-6 py-4">
        <Button variant="primary" isLoading={saving} onClick={onSave}>
          Salvar configuração
        </Button>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "SuperFrete",
  icon: HandTruck,
})

export default SuperfreteSettingsPage
