import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useProduct, useAppSettings } from '@/hooks/useProducts';
import { useAnalytics } from '@/hooks/useAnalytics';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { usePageVisit } = useAnalytics();

  usePageVisit('product-details');

  const { data: product, isLoading } = useProduct(id!);
  const { data: settings } = useAppSettings();

  const handleWhatsAppContact = () => {
    if (!product || !settings?.whatsapp_number) return;
    
    const message = encodeURIComponent(`Olá! Gostaria de saber mais sobre o produto: ${product.name}`);
    const whatsappUrl = `https://wa.me/${settings.whatsapp_number}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
      toast({
        title: "Produto adicionado!",
        description: `${product.name} foi adicionado ao carrinho.`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-32 mb-6"></div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="aspect-square bg-muted rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
                <div className="h-20 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
            <p className="text-muted-foreground">O produto que você está procurando não existe.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Galeria de Imagens do Produto */}
          <div className="space-y-4">
            {/* Imagem Principal com Carousel */}
            <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
              {product.images && product.images.length > 0 ? (
                <Carousel className="w-full h-full">
                  <CarouselContent className="h-full">
                    {product.images.map((image, index) => (
                      <CarouselItem key={index} className="h-full">
                        <img
                          src={image}
                          alt={`${product.name} - Imagem ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {product.images.length > 1 && (
                    <>
                      <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2" />
                      <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2" />
                    </>
                  )}
                </Carousel>
              ) : (
                <img
                  src={product.image || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Miniaturas */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <div key={index} className="aspect-square overflow-hidden rounded border cursor-pointer hover:opacity-80 transition-opacity">
                    <img
                      src={image}
                      alt={`${product.name} - Miniatura ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Informações do Produto */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
                {product.name}
              </h1>
              {product.category && (
                <Badge variant="secondary" className="mb-4">
                  {product.category}
                </Badge>
              )}
              <div className="text-3xl font-bold text-primary mb-4">
                R$ {product.price.toFixed(2).replace('.', ',')}
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3">Descrição</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {product.description}
                </p>
                {product.detailed_description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {product.detailed_description}
                  </p>
                )}
              </CardContent>
            </Card>

            {product.stock !== undefined && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3">Disponibilidade</h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-muted-foreground">
                      {product.stock > 0 ? `${product.stock} unidades em estoque` : 'Produto esgotado'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-6 text-lg"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {product.stock === 0 ? 'Produto Esgotado' : 'Adicionar ao Carrinho'}
              </Button>
              
              {settings?.whatsapp_number && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleWhatsAppContact}
                  className="w-full border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Dúvidas? Fale no WhatsApp
                </Button>
              )}
              
              <Button
                variant="outline"
                size="lg"
                asChild
                className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <a 
                  href="https://www.instagram.com/jota.r_acessorios?igsh=dzNxZGVkMGg0c2Rs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Ver no Instagram
                </a>
              </Button>
              
              <div className="grid grid-cols-3 gap-4 text-center text-sm text-muted-foreground">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mb-2">
                    🚚
                  </div>
                  <span>Envio para todo o Brasil</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mb-2">
                    🔒
                  </div>
                  <span>Compra 100% Segura</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mb-2">
                    🎁
                  </div>
                  <span>Embalagem de Presente</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetails;