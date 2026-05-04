import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ChevronDown, ArrowLeft, Shield, Database, Eye, Lock, UserCheck, Mail, Trash2 } from 'lucide-react';
import SEO from '@/components/SEO';

const SECTIONS = [
  {
    id: 'coleta',
    icon: Database,
    title: '1. Dados que Coletamos',
    content: `Coletamos apenas os dados estritamente necessários para a prestação de nossos serviços:

DADOS DE CADASTRO: Nome completo, e-mail, telefone/WhatsApp e senha (armazenada de forma criptografada via Supabase Auth).

DADOS DE COMPRA: Endereço de entrega, CPF (para emissão de nota fiscal), método de pagamento (nunca armazenamos dados completos de cartão — isso é gerenciado pelo Stripe/Mercado Pago).

DADOS DE NAVEGAÇÃO: IP de acesso, tipo de dispositivo e navegador, páginas visitadas e tempo de sessão, coletados via cookies técnicos e de análise.

DADOS OPCIONAIS: Preferências de produto, lista de favoritos e histórico de pedidos para personalização da experiência.`,
  },
  {
    id: 'uso',
    icon: Eye,
    title: '2. Como Usamos seus Dados',
    content: `Utilizamos seus dados pessoais para as seguintes finalidades:

• Processar pedidos e gerenciar entregas;
• Enviar confirmações de pedido, código de rastreio e atualizações de status por e-mail e WhatsApp;
• Personalizar sua experiência na Plataforma (recomendações da IA Lumina);
• Cumprir obrigações legais e fiscais (emissão de nota fiscal);
• Análise de comportamento agregado para melhoria dos nossos serviços;
• Prevenção de fraudes e garantia de segurança da Plataforma.

NUNCA utilizaremos seus dados para vender a terceiros ou enviar spam não solicitado.`,
  },
  {
    id: 'compartilhamento',
    icon: UserCheck,
    title: '3. Compartilhamento de Dados',
    content: `Seus dados poderão ser compartilhados apenas com:

PROCESSADORES DE PAGAMENTO: Stripe e Mercado Pago, para processamento seguro de transações. Ambos são certificados PCI-DSS.

TRANSPORTADORAS: Código postal e endereço de entrega para viabilizar a logística de entrega.

INFRAESTRUTURA TÉCNICA: Supabase (banco de dados e autenticação), Vercel (hospedagem), todos processadores de dados sob conformidade com LGPD e GDPR.

OBRIGAÇÃO LEGAL: Órgãos governamentais e autoridades fiscais, quando exigido por lei.

Nunca compartilharemos seus dados com anunciantes, corretoras ou qualquer outra empresa para fins comerciais sem seu consentimento explícito.`,
  },
  {
    id: 'cookies',
    icon: Lock,
    title: '4. Cookies e Tecnologias de Rastreio',
    content: `Utilizamos cookies para melhorar sua experiência:

COOKIES ESSENCIAIS (obrigatórios): Necessários para funcionamento básico da Plataforma — autenticação, carrinho de compras e preferências de sessão.

COOKIES ANALÍTICOS (opcionais): Nos ajudam a entender como você utiliza a Plataforma para melhorar continuamente nossos serviços.

COOKIES DE PERSONALIZAÇÃO (opcionais): Permitem que a IA Lumina memorize suas preferências e ofereça recomendações mais relevantes.

Você pode gerenciar suas preferências de cookies a qualquer momento através do banner de cookies ou nas configurações do seu navegador. Recusar cookies analíticos e de personalização não afetará o funcionamento essencial da Plataforma.`,
  },
  {
    id: 'direitos',
    icon: Shield,
    title: '5. Seus Direitos (LGPD — Lei 13.709/2018)',
    content: `De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:

• ACESSO: Solicitar uma cópia de todos os seus dados pessoais que mantemos;
• CORREÇÃO: Corrigir dados incompletos, inexatos ou desatualizados;
• EXCLUSÃO: Solicitar a exclusão de seus dados ("direito ao esquecimento"), respeitadas obrigações legais;
• PORTABILIDADE: Receber seus dados em formato estruturado para migração a outro serviço;
• REVOGAÇÃO: Retirar o consentimento para tratamento de dados a qualquer momento;
• OPOSIÇÃO: Opor-se ao tratamento de dados em determinadas hipóteses;
• INFORMAÇÃO: Saber com quem compartilhamos seus dados.

Para exercer estes direitos, entre em contato através do e-mail privacidade@jracessorios.com.br. Responderemos em até 15 dias úteis.`,
  },
  {
    id: 'retencao',
    icon: Trash2,
    title: '6. Retenção e Exclusão de Dados',
    content: `Manteremos seus dados pelo tempo necessário para:

• Manutenção do histórico de pedidos (mínimo 5 anos por obrigação fiscal — Lei 8.212/91);
• Defesa em eventuais processos legais, enquanto não prescritos;
• Cumprimento de obrigações regulatórias aplicáveis.

Após o encerramento da conta, dados desnecessários são anonimizados ou excluídos em até 30 dias, exceto aqueles sujeitos a obrigação legal de retenção.

Para solicitar a exclusão antecipada de seus dados, entre em contato através dos canais disponíveis na seção de Contato.`,
  },
  {
    id: 'contato-dpo',
    icon: Mail,
    title: '7. Encarregado de Dados (DPO)',
    content: `Nossa empresa designou um Encarregado de Proteção de Dados (DPO) conforme exigido pela LGPD:

Nome do Encarregado: Equipe JR Acessórios
E-mail: privacidade@jracessorios.com.br
WhatsApp: (11) 95412-9039

A Autoridade Nacional de Proteção de Dados (ANPD) pode ser contatada pelo site: https://www.gov.br/anpd

Nos reservamos o direito de atualizar esta Política periodicamente. Alterações significativas serão comunicadas via e-mail cadastrado. A versão mais recente estará sempre disponível nesta página.`,
  },
];

const AccordionItem: React.FC<{ section: typeof SECTIONS[0]; defaultOpen?: boolean }> = ({ section, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const Icon = section.icon;

  return (
    <div className="border border-white/[0.07] rounded-2xl overflow-hidden bg-white/[0.02] backdrop-blur-sm">
      <button
        onClick={() => setIsOpen(v => !v)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-4 p-5 md:p-6 text-left group hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center shrink-0 group-hover:bg-[#D4AF37]/15 transition-colors">
            <Icon className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <h2 className="text-sm md:text-base font-bold text-white/90">{section.title}</h2>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="w-5 h-5 text-white/30 shrink-0" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 md:px-6 pb-6 pt-1 border-t border-white/[0.05]">
              <p className="text-sm text-white/50 leading-relaxed whitespace-pre-line pl-14">
                {section.content}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Privacidade: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#e2e2e2] font-sans">
      <SEO
        title="Política de Privacidade — JR Acessórios"
        description="Saiba como a JR Acessórios coleta, usa e protege seus dados pessoais. Conformidade total com a LGPD — Lei Geral de Proteção de Dados (Lei 13.709/2018)."
      />
      <Header />

      <main className="pt-24 pb-32">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/[0.05] pb-16">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[#D4AF37]/5 blur-[120px] rounded-full" />
          </div>
          <div className="relative max-w-4xl mx-auto px-6 pt-12">
            <Link to="/register" className="inline-flex items-center gap-2 text-white/30 hover:text-[#D4AF37] transition-colors text-xs font-bold uppercase tracking-widest mb-8 group">
              <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
              Voltar ao Cadastro
            </Link>

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-6">
                <Shield className="w-3 h-3" />
                LGPD Compliant
              </span>
              <h1 className="font-serif text-4xl md:text-6xl font-black text-white leading-tight mb-4">
                Política de <span className="italic text-[#D4AF37]">Privacidade</span>
              </h1>
              <p className="text-white/40 text-lg max-w-xl leading-relaxed">
                Seus dados são tratados com total transparência e responsabilidade, em conformidade com a Lei 13.709/2018 (LGPD).
              </p>
              <p className="mt-4 text-xs text-white/20 uppercase tracking-widest">
                Última atualização: 03 de Maio de 2025
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-4xl mx-auto px-6 pt-12 space-y-3">
          {SECTIONS.map((section, i) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
            >
              <AccordionItem section={section} defaultOpen={i === 0} />
            </motion.div>
          ))}

          {/* Footer note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-10 p-6 rounded-2xl bg-emerald-400/5 border border-emerald-400/15 flex flex-col sm:flex-row gap-4 items-start"
          >
            <Shield className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-white/80 mb-1">Comprometidos com a sua privacidade</p>
              <p className="text-xs text-white/40 leading-relaxed">
                Somos totalmente conformes com a <strong className="text-white/60">LGPD (Lei 13.709/2018)</strong> e adotamos as melhores práticas de segurança de dados.
                Para exercer seus direitos ou reportar qualquer preocupação, entre em contato conosco.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <Link to="/termos" className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] hover:text-[#f2ca50] transition-colors underline underline-offset-4">
                  Termos de Uso →
                </Link>
                <Link to="/contato" className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors underline underline-offset-4">
                  Falar com Suporte →
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Privacidade;
