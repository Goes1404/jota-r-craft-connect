import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ShieldCheck } from 'lucide-react';
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

// ─── Right card ───────────────────────────────────────────────────────────────

function Right({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
      <span className="mt-0.5 shrink-0 text-[#d4af37]">{icon}</span>
      <div>
        <p className="text-xs font-bold text-white/60">{title}</p>
        <p className="text-[10px] text-white/30 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const Privacy: React.FC = () => (
  <div className="min-h-screen bg-black text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
    <SEO title="Política de Privacidade" description={`Consulte a Política de Privacidade da ${STORE.name} para saber como tratamos e protegemos seus dados pessoais de acordo com a LGPD.`} url={`${STORE.domain}/privacidade`} />
    <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
      <div className="absolute top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-[#f2ca50] opacity-[0.02] blur-[120px]" />
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
          <ShieldCheck className="w-6 h-6 text-[#d4af37]" />
        </div>
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-white leading-tight">Política de Privacidade</h1>
          <p className="text-xs text-white/30 mt-1">
            {STORE.name} · Última atualização: 01 de maio de 2025 · Em conformidade com a LGPD
          </p>
        </div>
      </div>

      <p className="text-sm text-white/40 leading-relaxed mb-6 bg-white/[0.02] border border-white/5 rounded-2xl p-5">
        Esta Política descreve como a <strong className="text-white/60">{STORE.name}</strong> coleta, usa, armazena e protege seus dados pessoais, em conformidade com a{' '}
        <strong className="text-white/60">Lei Geral de Proteção de Dados — LGPD (Lei 13.709/2018)</strong> e demais normas aplicáveis.
      </p>

      {/* Seus direitos — destaque */}
      <div className="mb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d4af37] mb-3">Seus Direitos (Art. 18 da LGPD)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { title: 'Acesso', desc: 'Solicitar cópia de todos os seus dados' },
            { title: 'Correção', desc: 'Corrigir dados incompletos ou desatualizados' },
            { title: 'Exclusão', desc: 'Pedir a remoção dos seus dados' },
            { title: 'Portabilidade', desc: 'Receber seus dados em formato estruturado' },
            { title: 'Oposição', desc: 'Opor-se a tratamentos baseados em legítimo interesse' },
            { title: 'Revogação', desc: 'Retirar seu consentimento a qualquer momento' },
          ].map(r => (
            <Right key={r.title} icon={<ShieldCheck className="w-3.5 h-3.5" />} title={r.title} desc={r.desc} />
          ))}
        </div>
        <p className="text-xs text-white/30 mt-3">
          Para exercer seus direitos, envie e-mail para{' '}
          <a href={`mailto:${STORE.contact.emailPrivacidade}`} className="text-[#d4af37] hover:underline">
            {STORE.contact.emailPrivacidade}
          </a>{' '}
          com o assunto "Direitos LGPD". Responderemos em até 15 dias úteis.
        </p>
      </div>

      {/* Sections */}
      <div className="bg-[#0f0f0f]/60 backdrop-blur-2xl border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6">

          <Section number="01" title="Controlador dos Dados">
            <p><strong className="text-white/60">{STORE.name}</strong> é o controlador responsável pelo tratamento dos dados pessoais coletados neste site.</p>
            <p>Encarregado de Proteção de Dados (DPO):{' '}
              <a href={`mailto:${STORE.contact.emailPrivacidade}`} className="text-[#d4af37]">{STORE.contact.emailPrivacidade}</a>
            </p>
          </Section>

          <Section number="02" title="Quais Dados Coletamos">
            <p><strong className="text-white/60">Dados fornecidos por você:</strong></p>
            <ul className="list-none space-y-1 ml-2">
              <li>· Nome completo, CPF, e-mail, telefone/WhatsApp</li>
              <li>· Endereço de entrega (logradouro, número, CEP, cidade, estado)</li>
              <li>· Senha (armazenada com hash Bcrypt — nunca em texto claro)</li>
            </ul>
            <p className="mt-2"><strong className="text-white/60">Dados gerados automaticamente:</strong></p>
            <ul className="list-none space-y-1 ml-2">
              <li>· Endereço IP, tipo de navegador, sistema operacional</li>
              <li>· Páginas visitadas, produtos visualizados e tempo de sessão</li>
              <li>· Cookies de funcionamento e analytics (veja seção 07)</li>
            </ul>
            <p className="mt-2"><strong className="text-white/60">Dados de terceiros:</strong> não adquirimos listas de dados de terceiros.</p>
          </Section>

          <Section number="03" title="Para Que Usamos Seus Dados">
            <ul className="list-none space-y-2 ml-2">
              <li>· <strong className="text-white/60">Processar pedidos</strong> — emitir NF-e, processar pagamento, organizar entrega</li>
              <li>· <strong className="text-white/60">Comunicações transacionais</strong> — confirmação de pedido, atualização de status</li>
              <li>· <strong className="text-white/60">Suporte ao cliente</strong> — atender solicitações via chat, e-mail e WhatsApp</li>
              <li>· <strong className="text-white/60">Personalização</strong> — curadoria inteligente de produtos (Lumina AI)</li>
              <li>· <strong className="text-white/60">Analytics</strong> — melhorar a experiência do site (dados agregados e anonimizados)</li>
              <li>· <strong className="text-white/60">Cumprimento legal</strong> — obrigações fiscais, contábeis e regulatórias</li>
            </ul>
          </Section>

          <Section number="04" title="Base Legal para o Tratamento">
            <ul className="list-none space-y-2 ml-2">
              <li>· <strong className="text-white/60">Execução de contrato</strong> (Art. 7º, V) — processar seu pedido</li>
              <li>· <strong className="text-white/60">Consentimento</strong> (Art. 7º, I) — cookies não essenciais, marketing</li>
              <li>· <strong className="text-white/60">Legítimo interesse</strong> (Art. 7º, IX) — prevenção de fraudes, segurança</li>
              <li>· <strong className="text-white/60">Obrigação legal</strong> (Art. 7º, II) — emissão de nota fiscal, retenções fiscais</li>
            </ul>
          </Section>

          <Section number="05" title="Compartilhamento de Dados">
            <p>Compartilhamos seus dados apenas com:</p>
            <ul className="list-none space-y-1 ml-2 mt-1">
              <li>· <strong className="text-white/60">Stripe</strong> — processamento de pagamentos (PCI-DSS Level 1)</li>
              <li>· <strong className="text-white/60">Supabase</strong> — banco de dados e autenticação (servidores na AWS)</li>
              <li>· <strong className="text-white/60">Correios / transportadoras</strong> — somente nome e endereço de entrega</li>
              <li>· <strong className="text-white/60">Autoridades públicas</strong> — quando exigido por lei ou ordem judicial</li>
            </ul>
            <p className="mt-2">Nunca vendemos seus dados a terceiros.</p>
          </Section>

          <Section number="06" title="Retenção de Dados">
            <ul className="list-none space-y-1 ml-2">
              <li>· Dados de conta: enquanto a conta estiver ativa + 5 anos (obrigação fiscal)</li>
              <li>· Dados de pedidos: 5 anos (Código Civil, Art. 206)</li>
              <li>· Logs de acesso: 6 meses (Marco Civil da Internet, Art. 15)</li>
              <li>· Cookies de sessão: expiram ao fechar o navegador</li>
            </ul>
          </Section>

          <Section number="07" title="Cookies e Tecnologias de Rastreamento">
            <p><strong className="text-white/60">Cookies essenciais</strong> — necessários para o funcionamento do site (sessão, carrinho). Não requerem consentimento.</p>
            <p><strong className="text-white/60">Cookies analíticos</strong> — coletam dados anônimos sobre uso do site para melhorias. Requerem consentimento.</p>
            <p><strong className="text-white/60">Cookies de marketing</strong> — atualmente não utilizamos redes de anúncios.</p>
            <p>Você pode gerenciar ou revogar o consentimento a qualquer momento pelo banner de cookies do site ou nas configurações do seu navegador.</p>
          </Section>

          <Section number="08" title="Segurança dos Dados">
            <p>Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo:</p>
            <ul className="list-none space-y-1 ml-2 mt-1">
              <li>· Criptografia TLS 1.3 em todas as comunicações</li>
              <li>· Senhas com hash Bcrypt (nunca armazenadas em texto claro)</li>
              <li>· Autenticação de dois fatores disponível para contas administrativas</li>
              <li>· Controle de acesso baseado em funções (RBAC) via Supabase RLS</li>
              <li>· Monitoramento contínuo de acessos suspeitos</li>
            </ul>
            <p className="mt-2">Em caso de incidente de segurança que afete seus dados, notificaremos a ANPD e os titulares afetados em até 72 horas, conforme exigido pela LGPD.</p>
          </Section>

          <Section number="09" title="Transferência Internacional">
            <p>Seus dados podem ser processados fora do Brasil pelos nossos prestadores de serviço (Supabase/AWS, Stripe). Garantimos que essas transferências seguem as salvaguardas exigidas pela LGPD (cláusulas contratuais padrão e certificações de adequação).</p>
          </Section>

          <Section number="10" title="Alterações nesta Política">
            <p>Esta Política pode ser atualizada periodicamente. A data da última atualização está indicada no topo. Para alterações substanciais, notificaremos por e-mail os titulares de dados cadastrados.</p>
          </Section>

        </div>
      </div>

      {/* Footer legal */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-white/20 uppercase tracking-widest">
        <span>© {new Date().getFullYear()} {STORE.name} · LGPD (Lei 13.709/2018)</span>
        <Link to="/termos" className="text-[#d4af37]/40 hover:text-[#d4af37] transition-colors">
          Termos de Uso →
        </Link>
      </div>

    </main>

    <Footer />
  </div>
);

export default Privacy;
