import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ── Price-drop tracking via localStorage ─────────────────────────────────────
const PRICES_KEY = 'jr_wl_prices';

export const saveWishlistPrice = (productId: string, price: number): void => {
  try {
    const stored: Record<string, number> = JSON.parse(localStorage.getItem(PRICES_KEY) || '{}');
    stored[productId] = price;
    localStorage.setItem(PRICES_KEY, JSON.stringify(stored));
  } catch {
    // localStorage unavailable (e.g. private browsing with strict settings)
  }
};

export interface PriceDrop {
  id: string;
  name: string;
  oldPrice: number;
  newPrice: number;
  discountPct: number;
}

export const getWishlistPriceDrops = (
  products: Array<{ id: string; name: string; price: number }>
): PriceDrop[] => {
  try {
    const stored: Record<string, number> = JSON.parse(localStorage.getItem(PRICES_KEY) || '{}');
    const drops: PriceDrop[] = [];
    const updated = { ...stored };
    products.forEach(p => {
      const prev = stored[p.id];
      if (prev !== undefined && p.price < prev) {
        drops.push({
          id: p.id,
          name: p.name,
          oldPrice: prev,
          newPrice: p.price,
          discountPct: Math.round(((prev - p.price) / prev) * 100),
        });
      }
      updated[p.id] = p.price;
    });
    localStorage.setItem(PRICES_KEY, JSON.stringify(updated));
    return drops;
  } catch {
    return [];
  }
};
// ─────────────────────────────────────────────────────────────────────────────

interface WishlistContextType {
  wishlist: string[];
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

// Supabase cast needed because the `wishlist` table is not in the generated types
const db = supabase as any;

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWishlist([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    db.from('wishlist')
      .select('product_id')
      .eq('user_id', user.id)
      .then(({ data, error }: { data: Array<{ product_id: string }> | null; error: unknown }) => {
        if (error) {
          console.warn('Wishlist table not found, using local state.');
        } else if (data) {
          setWishlist(data.map((item) => item.product_id));
        }
      })
      .finally(() => setIsLoading(false));
  }, [user]);

  const toggleWishlist = useCallback(async (productId: string) => {
    if (!user) {
      toast({
        title: 'Acesso Necessário',
        description: 'Faça login para salvar seus favoritos.',
      });
      return;
    }

    const isFav = wishlist.includes(productId);
    const optimistic = isFav
      ? wishlist.filter((id) => id !== productId)
      : [...wishlist, productId];

    setWishlist(optimistic);

    try {
      if (isFav) {
        await db.from('wishlist').delete().eq('user_id', user.id).eq('product_id', productId);
        toast({ title: 'Removido dos favoritos' });
      } else {
        await db.from('wishlist').insert({ user_id: user.id, product_id: productId });
        toast({ title: 'Adicionado aos favoritos! ❤️' });
      }
    } catch (err) {
      console.error('Error updating wishlist:', err);
      setWishlist(wishlist); // revert on error
    }
  }, [user, wishlist, toast]);

  const isInWishlist = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist]
  );

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, isLoading }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
