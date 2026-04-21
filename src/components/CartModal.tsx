import React from 'react';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { WHATSAPP_LINK } from '@/config/constants';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose }) => {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice } = useCart();

  const handleWhatsAppCheckout = () => {
    if (cartItems.length === 0) return;

    const items = cartItems.map(item => 
      `- ${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}`
    ).join('\n');
    
    const total = getTotalPrice().toFixed(2).replace('.', ',');
    const message = `Olá! Gostaria de fazer o pedido:\n\n${items}\n\nTotal: R$ ${total}`;
    
    const whatsappUrl = `${WHATSAPP_LINK}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-background rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg sm:mx-4 max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-serif font-semibold">Carrinho</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-lg text-muted-foreground mb-2">Seu carrinho está vazio</p>
              <p className="text-sm text-muted-foreground">
                Adicione alguns acessórios únicos à sua coleção!
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 bg-card rounded-lg border border-border">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">
                      {item.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      R$ {item.price.toFixed(2).replace('.', ',')}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <span className="w-8 text-center font-medium text-sm">
                      {item.quantity}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive p-1"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-border p-6 space-y-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total:</span>
              <span className="text-primary">
                R$ {getTotalPrice().toFixed(2).replace('.', ',')}
              </span>
            </div>
            
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3"
              onClick={handleWhatsAppCheckout}
            >
              Finalizar Compra via WhatsApp
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};