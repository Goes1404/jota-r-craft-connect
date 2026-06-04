import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, MessageSquare, Send, User, Calendar, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user: {
    full_name: string;
    avatar_url: string;
  };
}

interface ProductReviewsProps {
  productId: string;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({ productId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*, user:profiles(full_name, avatar_url)')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      
      if (error) return [];
      return data as any[];
    }
  });

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Faça login para deixar uma avaliação.');
      return;
    }
    if (!comment.trim()) {
      toast.error('Por favor, escreva um comentário.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          rating,
          comment
        });

      if (error) throw error;

      toast.success('Avaliação enviada com sucesso! ✨');
      setComment('');
      setRating(5);
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
    } catch (error: any) {
      toast.error('Erro ao enviar avaliação: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
    : 0;

  return (
    <section className="mt-24 space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-white/5 pb-12">
        <div className="space-y-4">
          <h2 className="text-4xl font-serif font-bold text-white tracking-tight">Experiência do <span className="text-[#d4af37] italic">Cliente</span></h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-5 h-5 ${s <= Math.round(averageRating) ? 'text-[#d4af37] fill-[#d4af37]' : 'text-white/10'}`} />
              ))}
            </div>
            <span className="text-sm font-bold text-white/40 uppercase tracking-widest">{reviews.length} Avaliações</span>
          </div>
        </div>
        
        {user && (
          <div className="hidden md:block">
            <div className="text-[10px] font-black uppercase tracking-widest text-[#d4af37] mb-2 text-right">Sua opinião importa</div>
            <p className="text-xs text-white/30 text-right max-w-[200px]">Compartilhe sua experiência com esta peça exclusiva.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Review Form — second on mobile so reviews are read first */}
        <div className="lg:col-span-5 order-2 lg:order-1">
          {user ? (
            <form onSubmit={submitReview} className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 md:p-10 space-y-8 sticky top-32">
              <div className="space-y-4 text-center">
                <h3 className="text-xl font-serif font-bold text-white">Deixe sua Impressão</h3>
                <div className="flex items-center justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button 
                      key={s} 
                      type="button"
                      onClick={() => setRating(s)}
                      className="transition-all hover:scale-125 focus:outline-none"
                    >
                      <Star className={`w-8 h-8 ${s <= rating ? 'text-[#d4af37] fill-[#d4af37]' : 'text-white/10 hover:text-[#d4af37]/40'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Textarea 
                  placeholder="Como foi sua experiência com este acessório?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="bg-black/60 border-white/10 rounded-3xl min-h-[150px] p-6 text-white focus:border-[#d4af37]/40 transition-all resize-none"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-[#d4af37] text-black hover:bg-[#f2ca50] h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3"
              >
                {isSubmitting ? 'Enviando...' : 'Publicar Avaliação'}
                <Send className="w-4 h-4" />
              </Button>
            </form>
          ) : (
            <div className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[40px] p-12 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/10 mx-auto">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-serif font-bold text-white">Compartilhe sua Opinião</h3>
              <p className="text-sm text-white/30">Apenas clientes autenticados podem deixar avaliações sobre nossos produtos exclusivos.</p>
              <Button 
                variant="outline" 
                className="border-white/10 text-white rounded-full px-8 h-12 uppercase text-[10px] font-black tracking-widest"
                onClick={() => window.location.href = '/login'}
              >
                Fazer Login
              </Button>
            </div>
          )}
        </div>

        {/* Reviews List — first on mobile */}
        <div className="lg:col-span-7 space-y-8 order-1 lg:order-2">
          
          {isLoading ? (
            [1, 2].map(i => <div key={i} className="h-40 bg-white/5 rounded-3xl animate-pulse"></div>)
          ) : reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 space-y-6 transition-all hover:bg-white/[0.04]">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] border border-[#d4af37]/20 overflow-hidden">
                      {review.user?.avatar_url ? (
                        <img src={review.user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm uppercase tracking-tight flex items-center gap-2">
                        {review.user?.full_name || 'Cliente Premium'}
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37]" />
                      </h4>
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-widest flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(review.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-[#d4af37] fill-[#d4af37]' : 'text-white/10'}`} />
                    ))}
                  </div>
                </div>
                
                <p className="text-white/60 text-sm leading-relaxed italic">
                  "{review.comment}"
                </p>
              </div>
            ))
          ) : (
            <div className="py-24 text-center space-y-6 bg-white/[0.01] border border-dashed border-white/5 rounded-[40px]">
              <p className="text-white/20 text-sm italic">Seja o primeiro a avaliar este item da coleção.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
