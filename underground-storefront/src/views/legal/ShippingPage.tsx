'use client'

import React from 'react'
import LegalLayout, { LegalSection } from './LegalLayout'

const ShippingPage: React.FC = () => (
  <LegalLayout
    eyebrow="Atendimento"
    title="Prazos e Envios"
    updatedAt="abril de 2026"
  >
    <LegalSection title="Transportadoras">
      <p>
        Trabalhamos com Correios (PAC, SEDEX, Mini Envios), Jadlog e Loggi,
        integradas via SuperFrete. Durante o checkout você escolhe entre as
        opções disponíveis para o seu CEP, com prazo e valor cotados em tempo
        real.
      </p>
    </LegalSection>

    <LegalSection title="Prazo de postagem">
      <p>
        Pedidos pagos até 14h em dias úteis são postados em até 2 dias úteis.
        Pedidos pagos após esse horário ou em finais de semana/feriados são
        processados no próximo dia útil.
      </p>
    </LegalSection>

    <LegalSection title="Prazo de entrega">
      <p>
        O prazo de entrega aparece na hora do checkout e depende da
        transportadora escolhida e da distância até o destino. Após a postagem,
        o prazo começa a contar.
      </p>
    </LegalSection>

    <LegalSection title="Rastreamento">
      <p>
        Assim que sua etiqueta for gerada, você recebe o código de rastreio por
        e-mail e pode acompanhar o status em tempo real na nossa página de
        rastreio, que sincroniza direto com a transportadora.
      </p>
    </LegalSection>

    <LegalSection title="Frete grátis">
      <p>
        Promoções de frete grátis, quando disponíveis, são comunicadas via
        Instagram{' '}
        <a
          href="https://instagram.com/driveitlikestoleit"
          target="_blank"
          rel="noreferrer"
          className="text-[#e34717] hover:underline"
        >
          @driveitlikestoleit
        </a>{' '}
        e aplicadas automaticamente no carrinho.
      </p>
    </LegalSection>

    <LegalSection title="Endereço incorreto ou recusa">
      <p>
        Se o pedido voltar por endereço incorreto ou recusa do destinatário, o
        comprador é responsável pelo custo de reenvio. Caso não seja possível
        reenviar, é feito o reembolso do valor do produto (o frete original não
        é reembolsado).
      </p>
    </LegalSection>
  </LegalLayout>
)

export default ShippingPage
