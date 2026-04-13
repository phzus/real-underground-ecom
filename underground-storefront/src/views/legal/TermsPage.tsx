'use client'

import React from 'react'
import LegalLayout, { LegalSection } from './LegalLayout'

const TermsPage: React.FC = () => (
  <LegalLayout
    eyebrow="Legal"
    title="Termos de Uso"
    updatedAt="abril de 2026"
  >
    <LegalSection title="Aceitação">
      <p>
        Ao acessar e usar a loja <strong>Drive It Like Stole It</strong>, você
        concorda integralmente com estes Termos de Uso. Se não concordar, pedimos
        que não utilize o site.
      </p>
    </LegalSection>

    <LegalSection title="Uso do site">
      <p>Você concorda em:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Usar o site apenas para fins legítimos e pessoais</li>
        <li>Fornecer informações verdadeiras no cadastro e checkout</li>
        <li>Não tentar burlar sistemas de segurança, pagamento ou estoque</li>
        <li>Respeitar a propriedade intelectual de todo conteúdo da marca</li>
      </ul>
    </LegalSection>

    <LegalSection title="Pedidos e pagamento">
      <p>
        Os preços exibidos estão em reais (BRL). O frete é calculado em tempo
        real via SuperFrete com base no CEP de destino e no peso/dimensões do
        pedido. O pagamento é processado pela Stripe, que opera sob padrões
        internacionais de segurança (PCI-DSS).
      </p>
      <p>
        Reservamos o direito de cancelar pedidos com suspeita de fraude ou erro
        evidente de precificação, com devolução integral do valor pago.
      </p>
    </LegalSection>

    <LegalSection title="Disponibilidade de produtos">
      <p>
        Todos os drops têm estoque limitado. A disponibilidade é atualizada em
        tempo real, mas eventualmente pode haver divergência. Nesse caso, o
        pedido será cancelado e o valor devolvido na íntegra.
      </p>
    </LegalSection>

    <LegalSection title="Propriedade intelectual">
      <p>
        Todas as imagens, nomes, logos, designs e conteúdos são propriedade da
        Drive It Like Stole It. Qualquer reprodução, cópia ou uso comercial sem
        autorização expressa é proibido.
      </p>
    </LegalSection>

    <LegalSection title="Limitação de responsabilidade">
      <p>
        A marca não se responsabiliza por atrasos causados por transportadoras,
        eventos de força maior ou informações incorretas fornecidas no
        cadastramento do pedido.
      </p>
    </LegalSection>

    <LegalSection title="Alterações">
      <p>
        Estes termos podem ser atualizados a qualquer momento. A versão vigente
        é sempre a publicada nesta página.
      </p>
    </LegalSection>

    <LegalSection title="Foro">
      <p>
        Fica eleito o foro da comarca do domicílio da Drive It Like Stole It
        para dirimir quaisquer controvérsias oriundas destes Termos.
      </p>
    </LegalSection>
  </LegalLayout>
)

export default TermsPage
