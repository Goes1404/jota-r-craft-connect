import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ChevronDown, ArrowLeft, FileText, Shield, ShoppingBag, AlertTriangle, Scale, Mail } from 'lucide-react';
import SEO from '@/components/SEO';

const SECTIONS = [
  {
    id: 'aceitacao',
    icon: FileText,
    title: '1. Aceitação dos Termos',
    content: `Ao acessar e utilizar o site da JR Acessórios ("Plataforma"), você declara ter lido, compreendido e concordado com estes Termos de Uso em sua totalidade.

Caso não concorde com qualquer disposição aqui contida, recomendamos que não utilize nossos serviços. O uso continuado da Plataforma após alterações nos Termos constitui sua aceitação das novas disposições.

A JR Acessórios reserva-se o direito de modificar estes Termos a qualquer momento, sendo a versão mais recente sempre disponibilizada nesta página com a data de atualização.`,
  },
  {
    id: 'cadastro',
    icon: Shield,
    title: '2. Cadastro e Conta do Usuário',
    content: `Para realizar compras em nossa Plataforma, é necessário criar uma conta. Ao fazê-lo, você se compromete a:

• Fornecer informações verdadeiras, precisas e completas durante o cadastro;
• Manter seus dados cadastrais atualizados;
• Manter a confidencialidade de sua senha, sendo responsável por todas as atividades realizadas em sua conta;
• Notificar-nos imediatamente em caso de uso não autorizado de sua conta;
• Ter idade igual ou superior a 18 anos, ou contar com autorização dos responsáveis legais.

A JR Acessórios reserva-se o direito de encerrar contas que violem estes Termos, sem aviso prévio.`,
  },
  {
    id: 'compras',
    icon: ShoppingBag,
    title: '3. Compras, Pagamentos e Entregas',
    content: `Todos os preços exibidos em nossa Plataforma estão em Reais (BRL) e incluem impostos aplicáveis, salvo indicação contrária.

PAGAMENTOS: Aceitamos PIX e cartão de crédito via Stripe e Mercado Pago. O pedido só é confirmado após a aprovação do pagamento.

PRAZO DE ENTREGA: Os prazos são estimados e contados em dias úteis após a confirmação do pagamento. Eventuais atrasos por parte das transportadoras estão fora de nosso controle.

CÓDIGO DE RASTREIO: Será enviado ao e-mail cadastrado após a postagem do pedido.

TROCA EM 7 DIAS: Garantimos troca ou devolução de produtos com defeito de fabricação em até 7 dias corridos após o recebimento, conforme o Código de Defesa do Consumidor (Lei 8.078/90).`,
  },
  {
    id: 'proibicoes',
    icon: AlertTriangle,
    title: '4. Uso Proibido da Plataforma',
    content: `É expressamente proibido utilizar a Plataforma para:

• Qualquer atividade ilegal ou fraudulenta;
• Transmissão de vírus ou qualquer código malicioso;
• Tentativas de acesso não autorizado a sistemas ou dados;
• Reprodução, cópia ou distribuição de nosso conteúdo sem autorização expressa;
• Uso de bots, scrapers ou qualquer ferramenta automatizada para acessar a Plataforma;
• Praticar atos que possam prejudicar outros usuários ou a própria JR Acessórios.

A violação dessas regras poderá resultar no cancelamento imediato da conta e, se aplicável, em medidas legais cabíveis.`,
  },
  {
    id: 'responsabilidade',
    icon: Scale,
    title: '5. Limitação de Responsabilidade',
    content: `A JR Acessórios não se responsabiliza por:

• Danos indiretos, incidentais, especiais ou consequentes decorrentes do uso da Plataforma;
• Interrupções temporárias do serviço por manutenção ou fatores externos;
• Problemas de conectividade de internet fora de nosso controle;
• Informações de produtos fornecidas por fabricantes.

Nossa responsabilidade máxima em qualquer circunstância estará limitada ao valor total pago pelo produto que originou a reclamação.

Esta Plataforma é regida pelas leis do Brasil, com foro eleito na comarca de Osasco/SP para dirimir quaisquer controvérsias.`,
  },
  {
    id: 'contato',
    icon: Mail,
    title: '6. Contato e Suporte',
    content: `Em caso de dúvidas sobre estes Termos de Uso, entre em contato conosco:

• E-mail: contato@jracessorios.com.br
• WhatsApp: (11) 95412-9039
• Horário de Atendimento: Segunda a Sábado, das 9h às 18h

Nossa equipe de suporte e o Concierge Virtual Lumina estão à disposição para esclarecer quaisquer questões sobre suas compras e direitos como consumidor.`,
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

const Termos: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#e2e2e2] font-sans">
      <SEO
        title="Termos de Uso — JR Acessórios"
        description="Leia os Termos de Uso da JR Acessórios. Saiba seus direitos e deveres ao utilizar nossa plataforma de e-commerce de tecnologia premium."
      />
      <Header />

      <main className="pt-24 pb-32">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/[0.05] pb-16">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#D4AF37]/5 blur-[100px] rounded-full" />
          </div>
          <div className="relative max-w-4xl mx-auto px-6 pt-12">
            <Link to="/register" className="inline-flex items-center gap-2 text-white/30 hover:text-[#D4AF37] transition-colors text-xs font-bold uppercase tracking-widest mb-8 group">
              <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
              Voltar ao Cadastro
            </Link>

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest mb-6">
                <FileText className="w-3 h-3" />
                Documento Legal
              </span>
              <h1 className="font-serif text-4xl md:text-6xl font-black text-white leading-tight mb-4">
                Termos de <span className="italic text-[#D4AF37]">Uso</span>
              </h1>
              <p className="text-white/40 text-lg max-w-xl leading-relaxed">
                Ao utilizar nossa plataforma, você concorda com as condições descritas abaixo. Leia com atenção.
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
            transition={{ delay: 0.6 }}
            className="mt-10 p-6 rounded-2xl bg-[#D4AF37]/5 border border-[#D4AF37]/15 flex flex-col sm:flex-row gap-4 items-start"
          >
            <Scale className="w-6 h-6 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-white/80 mb-1">Seus direitos como consumidor</p>
              <p className="text-xs text-white/40 leading-relaxed">
                Estes Termos não excluem ou limitam os direitos garantidos pelo <strong className="text-white/60">Código de Defesa do Consumidor (Lei 8.078/90)</strong> e demais legislações brasileiras aplicáveis.
                Em caso de conflito, prevalecerão as disposições legais mais favoráveis ao consumidor.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <Link to="/privacidade" className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] hover:text-[#f2ca50] transition-colors underline underline-offset-4">
                  Política de Privacidade →
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

export default Termos;
