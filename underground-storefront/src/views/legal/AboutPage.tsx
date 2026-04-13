'use client'

import React from 'react'
import LegalLayout, { LegalSection } from './LegalLayout'

const AboutPage: React.FC = () => (
  <LegalLayout eyebrow="Manifesto" title="Drive It Like Stole It">
    <LegalSection title="O movimento">
      <p>
        Não seguimos tendências. Nós as roubamos, desconstruímos e devolvemos às
        ruas em forma de arte. A marca nasceu da frustração com um cenário onde
        streetwear virou mercadoria e a autenticidade virou pose.
      </p>
      <p>
        Cada drop é pensado como uma peça única: tiragem limitada, processo
        artesanal, nada de esteira de fábrica. O que você veste é o que você
        defende.
      </p>
    </LegalSection>

    <LegalSection title="Como a gente opera">
      <p>
        Somos uma marca independente. Trabalhamos direto com fornecedores
        brasileiros, cortando intermediários. Cada peso gasto aqui volta pra
        produção do próximo drop e pra quem faz parte do movimento.
      </p>
    </LegalSection>

    <LegalSection title="Onde encontrar">
      <ul className="list-disc pl-6 space-y-2">
        <li>
          Instagram:{' '}
          <a
            href="https://instagram.com/driveitlikestoleit"
            target="_blank"
            rel="noreferrer"
            className="text-[#e34717] hover:underline"
          >
            @driveitlikestoleit
          </a>
        </li>
        <li>
          YouTube:{' '}
          <a
            href="https://youtube.com/@driveitlikestoleit"
            target="_blank"
            rel="noreferrer"
            className="text-[#e34717] hover:underline"
          >
            @driveitlikestoleit
          </a>
        </li>
        <li>
          TikTok:{' '}
          <a
            href="https://tiktok.com/@driveitlikestoleit"
            target="_blank"
            rel="noreferrer"
            className="text-[#e34717] hover:underline"
          >
            @driveitlikestoleit
          </a>
        </li>
      </ul>
    </LegalSection>
  </LegalLayout>
)

export default AboutPage
