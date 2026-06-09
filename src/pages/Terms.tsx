import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, FileText } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import SEO from '@/components/SEO';
import { STORE } from '@/config/store';

// ─── Accordion ────────────────────────────────────────────────────────────────

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/5">
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-5 text-left gap-4 group
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] rounded"
      >
        <div className="flex items-center gap-4">
          <span className="shrink-0 w-8 h-8 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center text-[10px] font-black text-[#d4af37]">
            {number}
          </span>
          <span className="text-sm font-bold text-white/70 group-hover:text-white transition-colors">{title}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/20 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="pb-6 pl-12 text-sm text-white/40 leading-relaxed space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const Terms: React.FC = () => (
  <div className="min-h-screen bg-black text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
    <SEO title="Termos de Uso" description={`Leia os Termos de Uso da ${STORE.name} para conhecer as regras de compra, entrega, pagamentos e garantia de produtos.`} url={`${STORE.domain}/termos`} />
    <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
      <div className="absolute top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[#f2ca50] opacity-[0.02] blur-[120px]" />
    </div>

    <Header />

    <main className="relative z-10 max-w-2xl mx-auto px-6 pt-28 pb-20">

      <Link to="/" className="inline-flex items-center gap-2 text-white/30 hover:text-[#d4af37] transition-colors mb-8 group
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] rounded text-[10px] font-black uppercase tracking-widest">
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        Início
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center shrink-0">
          <FileText className="w-6 h-6 text-[#d4af37]" />
        </div>
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-white leading-tight">Termos de Uso</h1>
          <p className="text-xs text-white/30 mt-1">
            {STORE.name} · Última atualização: 01 de maio de 2025 · Versão 1.0
          </p>
        </div>
      </div>

      <p className="text-sm text-white/40 leading-relaxed mb-8 bg-white/[0.02] border border-white/5 rounded-2xl p-5">
        Ao acessar ou utilizar o site <strong className="text-white/60">{STORE.domain.replace('https://', '')}</strong>, você concorda com os presentes Termos de Uso. Leia-os com atenção antes de realizar qualquer compra. Em caso de dúvida, entre em contato via{' '}
        <a href={`mailto:${STORE.contact.email}`} className="text-[#d4af37] hover:underline">{STORE.contact.email}</a>.
      </p>

      {/* Sections */}
      <div className="bg-[#0f0f0f]/60 backdrop-blur-2xl border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6">

          <Section number="01" title="Aceitação dos Termos">
            <p>O acesso e uso deste site estão sujeitos a estes Termos de Uso e à legislação brasileira vigente, incluindo o Código de Defesa do Consumidor (Lei 8.078/1990), o Marco Civil da Internet (Lei 12.965/2014) e a Lei Geral de Proteção de Dados — LGPD (Lei 13.709/2018).</p>
            <p>Caso não concorde com qualquer disposição destes termos, você deve cessar imediatamente o uso do site.</p>
          </Section>

          <Section number="02" title="Quem Somos">
            <p><strong className="text-white/60">{STORE.name}</strong> é uma loja especializada em {STORE.segment}, localizada em {STORE.address.city}/{STORE.address.state}. Operamos com entrega em todo o Brasil.</p>
            <p>Contato: <a href={`mailto:${STORE.contact.email}`} className="text-[#d4af37]">{STORE.contact.email}</a></p>
          </Section>

          <Section number="03" title="Cadastro e Conta de Usuário">
            <p>Para realizar compras, você pode criar uma conta fornecendo nome completo, e-mail, telefone e senha. Você é responsável pela confidencialidade de suas credenciais.</p>
            <p>É proibido criar contas com informações falsas. A {STORE.name} se reserva o direito de suspender ou encerrar contas que violem estes termos.</p>
            <p>Menores de 18 anos devem ter autorização dos pais ou responsáveis para criar conta e realizar compras.</p>
          </Section>

          <Section number="04" title="Produtos, Preços e Disponibilidade">
            <p>Os preços exibidos no site estão em Reais (BRL) e incluem os tributos aplicáveis. Reservamo-nos o direito de alterar preços sem aviso prévio, exceto para pedidos já confirmados.</p>
            <p>A disponibilidade dos produtos está sujeita ao estoque. Em caso de indisponibilidade após a confirmação do pedido, o cliente será notificado e poderá optar por aguardar reposição, substituir o produto ou receber o reembolso integral.</p>
            <p>Todos os produtos são originais e acompanham nota fiscal eletrônica (NF-e).</p>
          </Section>

          <Section number="05" title="Pagamentos">
            <p>Aceitamos pagamento via PIX (compensação imediata) e cartão de crédito (processado via Stripe com criptografia TLS/SSL). Não armazenamos dados de cartão em nossos servidores.</p>
            <p>O parcelamento sem juros está disponível em até 10x nos cartões de crédito, sujeito à aprovação da operadora.</p>
            <p>Pedidos com pagamento via PIX devem ser concluídos em até 30 minutos após a geração do QR Code.</p>
          </Section>

          <Section number="06" title="Entrega e Prazos">
            <p>Realizamos entrega em todo o território nacional via Correios (PAC e Sedex) ou motoboy próprio para pedidos na região de Osasco/SP (entrega no mesmo dia).</p>
            <p>Os prazos estimados são contados em dias úteis a partir da confirmação do pagamento. A {STORE.name} não se responsabiliza por atrasos causados por greves, forças maiores ou endereços incorretos fornecidos pelo cliente.</p>
          </Section>

          <Section number="07" title="Política de Troca e Devolução">
            <p>Em conformidade com o Art. 49 do Código de Defesa do Consumidor, o cliente tem até <strong className="text-white/60">7 dias corridos</strong> após o recebimento para desistir da compra e solicitar reembolso integral, sem necessidade de justificativa (direito de arrependimento).</p>
            <p>Produtos com defeito de fabricação têm garantia de <strong className="text-white/60">90 dias</strong> para bens não duráveis e <strong className="text-white/60">180 dias</strong> para bens duráveis, conforme o CDC.</p>
            <p>Para solicitar troca ou devolução, entre em contato pelo WhatsApp ou e-mail. O produto deve ser devolvido em sua embalagem original, sem sinais de uso indevido.</p>
          </Section>

          <Section number="08" title="Propriedade Intelectual">
            <p>Todo o conteúdo deste site — textos, imagens, logotipos, design e código — é de propriedade da {STORE.name} ou de seus licenciantes, protegido pela Lei 9.610/1998 (Lei de Direitos Autorais).</p>
            <p>É proibida a reprodução, distribuição ou uso comercial de qualquer conteúdo sem autorização prévia por escrito.</p>
          </Section>

          <Section number="09" title="Limitação de Responsabilidade">
            <p>A {STORE.name} não se responsabiliza por danos indiretos, incidentais ou consequentes decorrentes do uso do site ou dos produtos, salvo nos casos previstos em lei.</p>
            <p>Nossa responsabilidade máxima é limitada ao valor pago pelo produto objeto da reclamação.</p>
          </Section>

          <Section number="10" title="Modificações dos Termos">
            <p>Reservamo-nos o direito de atualizar estes Termos a qualquer momento. Alterações significativas serão comunicadas por e-mail ou banner no site. O uso continuado após a publicação das alterações implica na aceitação dos novos termos.</p>
          </Section>

          <Section number="11" title="Foro e Lei Aplicável">
            <p>Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da Comarca de Osasco/SP para dirimir quaisquer controvérsias decorrentes deste instrumento, com renúncia a qualquer outro, por mais privilegiado que seja.</p>
          </Section>

        </div>
      </div>

      {/* Footer legal */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-white/20 uppercase tracking-widest">
        <span>© {new Date().getFullYear()} {STORE.name} — CNPJ em processo de regularização</span>
        <Link to="/privacidade" className="text-[#d4af37]/40 hover:text-[#d4af37] transition-colors">
          Política de Privacidade →
        </Link>
      </div>

    </main>

    <Footer />
  </div>
);

export default Terms;
