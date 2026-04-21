import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/use-toast';
import { useAnalytics } from '@/hooks/useAnalytics';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const Contact: React.FC = () => {
  const { usePageVisit } = useAnalytics();
  usePageVisit('contact');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactFormData>();

  const onSubmit = async (data: ContactFormData) => {
    // Simular envio do formulário
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Gerar mensagem do WhatsApp
    const whatsappMessage = encodeURIComponent(
      `Olá! Meu nome é ${data.name}.
      
📧 Email: ${data.email}
📱 Telefone: ${data.phone}

📝 Mensagem: ${data.message}`
    );

    const whatsappURL = `https://wa.me/5511954129039?text=${whatsappMessage}`;
    
    toast({
      title: "Redirecionando para WhatsApp",
      description: "Você será redirecionado para enviar sua mensagem via WhatsApp.",
    });

    // Abrir WhatsApp em nova aba
    window.open(whatsappURL, '_blank');
    
    // Limpar formulário
    reset();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-8 sm:py-12 lg:py-16">
        <div className="container mx-auto px-4">
          {/* Cabeçalho */}
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-4">
              Entre em Contato
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Estamos aqui para ajudar! Entre em contato conosco para dúvidas, pedidos personalizados ou informações sobre nossos produtos.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
            {/* Informações de Contato */}
            <div className="space-y-6">
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Phone className="h-5 w-5 text-primary" />
                    <span>Telefone</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-2">WhatsApp</p>
                  <div className="space-y-2">
                    <a 
                      href="https://wa.me/5511954129039" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-lg font-semibold text-primary hover:text-primary/80 transition-colors block"
                    >
                      (11) 95412-9039
                    </a>
                    <a 
                      href="https://www.instagram.com/jota.r_acessorios?igsh=dzNxZGVkMGg0c2Rs" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:text-primary/80 transition-colors block"
                    >
                      @jota.r_acessorios
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <span>Email</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-2">Contato geral</p>
                  <a 
                    href="mailto:contato@jotar.com.br"
                    className="text-lg font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    contato@jotar.com.br
                  </a>
                </CardContent>
              </Card>

              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>Horário de Atendimento</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><span className="font-medium">Segunda - Sexta:</span> 9h às 18h</p>
                  <p><span className="font-medium">Sábado:</span> 9h às 14h</p>
                  <p><span className="font-medium">Domingo:</span> Fechado</p>
                </CardContent>
              </Card>

              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span>Localização</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-2">Atendemos todo o Brasil</p>
                  <p className="text-sm text-muted-foreground">
                    Envio via Correios e transportadoras com rastreamento completo.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Formulário de Contato */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl sm:text-2xl font-serif">Envie sua Mensagem</CardTitle>
                  <p className="text-muted-foreground">
                    Preencha o formulário abaixo e entraremos em contato via WhatsApp.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-foreground">
                          Nome completo *
                        </label>
                        <Input
                          id="name"
                          {...register('name', { required: 'Nome é obrigatório' })}
                          placeholder="Seu nome completo"
                          className="w-full"
                        />
                        {errors.name && (
                          <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-foreground">
                          Email *
                        </label>
                        <Input
                          id="email"
                          type="email"
                          {...register('email', { 
                            required: 'Email é obrigatório',
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: 'Email inválido'
                            }
                          })}
                          placeholder="seu@email.com"
                          className="w-full"
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium text-foreground">
                        Telefone/WhatsApp *
                      </label>
                      <Input
                        id="phone"
                        {...register('phone', { required: 'Telefone é obrigatório' })}
                        placeholder="(11) 99999-9999"
                        className="w-full"
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive">{errors.phone.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-medium text-foreground">
                        Mensagem *
                      </label>
                      <Textarea
                        id="message"
                        {...register('message', { required: 'Mensagem é obrigatória' })}
                        placeholder="Como podemos ajudar você? Conte sobre seu interesse em nossos produtos ou tire suas dúvidas."
                        rows={6}
                        className="w-full resize-none"
                      />
                      {errors.message && (
                        <p className="text-sm text-destructive">{errors.message.message}</p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Enviando...' : 'Enviar via WhatsApp'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQ Rápido */}
          <div className="mt-12 lg:mt-16">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-center text-foreground mb-8">
              Perguntas Frequentes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Como faço um pedido?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Navegue pelos nossos produtos, adicione ao carrinho e entre em contato via WhatsApp para finalizar o pedido.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Qual o prazo de entrega?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    O prazo varia de 7 a 15 dias úteis, dependendo da sua localização. Todas as entregas são rastreáveis.
                  </p>
                </CardContent>
              </Card>

              <Card className="md:col-span-2 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Aceita encomendas personalizadas?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Sim! Entre em contato para discutirmos sua ideia personalizada. Fazemos peças únicas sob medida.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;