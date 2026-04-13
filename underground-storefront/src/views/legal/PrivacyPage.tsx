'use client'

import React from 'react'
import LegalLayout, { LegalSection } from './LegalLayout'

const PrivacyPage: React.FC = () => (
  <LegalLayout
    eyebrow="Legal"
    title="Política de Privacidade"
    updatedAt="abril de 2026"
  >
    <LegalSection title="Quem somos">
      <p>
        A <strong>Drive It Like Stole It</strong> (driveitlikestoleit) é uma marca
        brasileira de streetwear. Esta política descreve como coletamos, usamos e
        protegemos os seus dados quando você navega e compra em{' '}
        <code>driveitlikestoleit.com</code>, em conformidade com a LGPD (Lei
        13.709/2018).
      </p>
    </LegalSection>

    <LegalSection title="Dados que coletamos">
      <p>Quando você cria uma conta, faz uma compra ou navega na loja, podemos coletar:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Dados pessoais (nome, e-mail, telefone, CPF)</li>
        <li>Endereço de entrega e cobrança</li>
        <li>Histórico de pedidos e interações com nosso atendimento</li>
        <li>Dados técnicos (endereço IP, navegador, páginas visitadas)</li>
        <li>
          Dados de pagamento processados exclusivamente pela Stripe — não
          armazenamos números de cartão nos nossos servidores
        </li>
      </ul>
    </LegalSection>

    <LegalSection title="Como usamos">
      <ul className="list-disc pl-6 space-y-2">
        <li>Processar pedidos, pagamentos e entregas</li>
        <li>Enviar confirmação de compra e atualizações de envio</li>
        <li>Oferecer suporte ao cliente</li>
        <li>Prevenir fraudes e garantir a segurança da loja</li>
        <li>Cumprir obrigações legais e fiscais</li>
      </ul>
    </LegalSection>

    <LegalSection title="Compartilhamento">
      <p>
        Compartilhamos dados somente com parceiros estritamente necessários para
        entregar seu pedido: SuperFrete / transportadoras para cálculo de frete e
        emissão de etiquetas, Stripe para processamento de pagamento, e serviços
        de infraestrutura. Nunca vendemos dados pessoais.
      </p>
    </LegalSection>

    <LegalSection title="Seus direitos">
      <p>Você pode, a qualquer momento, solicitar:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Acesso aos seus dados</li>
        <li>Correção ou atualização</li>
        <li>Exclusão da conta e dados associados</li>
        <li>Portabilidade</li>
        <li>Revogação de consentimento</li>
      </ul>
      <p>
        Para exercer esses direitos, entre em contato pelo Instagram{' '}
        <a
          href="https://instagram.com/driveitlikestoleit"
          target="_blank"
          rel="noreferrer"
          className="text-[#e34717] hover:underline"
        >
          @driveitlikestoleit
        </a>
        .
      </p>
    </LegalSection>

    <LegalSection title="Cookies">
      <p>
        Usamos cookies essenciais para manter seu carrinho, autenticação e
        preferências funcionando. Não utilizamos cookies de terceiros para
        publicidade direcionada.
      </p>
    </LegalSection>

    <LegalSection title="Retenção">
      <p>
        Mantemos seus dados enquanto sua conta estiver ativa e pelos prazos
        legais exigidos pela legislação fiscal e civil brasileira. Após isso, os
        dados são excluídos ou anonimizados.
      </p>
    </LegalSection>
  </LegalLayout>
)

export default PrivacyPage
