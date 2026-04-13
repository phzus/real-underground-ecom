'use client'

import React from 'react'
import LegalLayout, { LegalSection } from './LegalLayout'

const ReturnsPage: React.FC = () => (
  <LegalLayout
    eyebrow="Atendimento"
    title="Trocas e Devoluções"
    updatedAt="abril de 2026"
  >
    <LegalSection title="Direito de arrependimento">
      <p>
        Conforme o Art. 49 do Código de Defesa do Consumidor, você tem{' '}
        <strong>7 dias corridos</strong> a partir do recebimento do produto para
        solicitar a devolução, sem necessidade de justificativa. O produto deve
        estar sem uso, com todas as etiquetas originais e embalagem intacta.
      </p>
    </LegalSection>

    <LegalSection title="Defeitos">
      <p>
        Se o produto apresentar defeito de fabricação, você tem até{' '}
        <strong>30 dias corridos</strong> a partir do recebimento para
        solicitar troca ou devolução. Nós cobrimos o custo do frete de retorno
        nesses casos.
      </p>
    </LegalSection>

    <LegalSection title="Trocas de tamanho">
      <p>
        Trocas de tamanho são aceitas em até 7 dias a partir do recebimento,
        desde que a peça não tenha sido usada e esteja com etiquetas. O custo do
        frete de retorno fica por conta do comprador; o reenvio do novo tamanho
        é pago pela marca (apenas 1 troca por pedido).
      </p>
    </LegalSection>

    <LegalSection title="Como solicitar">
      <ol className="list-decimal pl-6 space-y-2">
        <li>
          Entre em contato pelo Instagram{' '}
          <a
            href="https://instagram.com/driveitlikestoleit"
            target="_blank"
            rel="noreferrer"
            className="text-[#e34717] hover:underline"
          >
            @driveitlikestoleit
          </a>{' '}
          com o número do pedido
        </li>
        <li>Informe o motivo e, quando aplicável, envie fotos do produto</li>
        <li>Você recebe o código de autorização e as instruções de envio</li>
        <li>Após o recebimento e conferência, emitimos o reembolso ou reenvio</li>
      </ol>
    </LegalSection>

    <LegalSection title="Reembolso">
      <p>
        O reembolso é processado pela mesma forma de pagamento original (Stripe)
        em até 7 dias úteis após a conferência do produto devolvido. Para
        cartões de crédito, o valor aparece na próxima fatura do banco emissor.
      </p>
    </LegalSection>

    <LegalSection title="Produtos não elegíveis">
      <p>
        Produtos usados, lavados, sem etiqueta ou com sinais de uso não são
        elegíveis para troca ou devolução (exceto em caso de defeito de
        fabricação).
      </p>
    </LegalSection>
  </LegalLayout>
)

export default ReturnsPage
