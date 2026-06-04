import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductRating {
  avg_rating: number;
  review_count: number;
}

export type RatingsMap = Record<string, ProductRating>;

// Busca os agregados de avaliação de TODOS os produtos numa única chamada.
// React Query deduplica, então vários ProductCards compartilham 1 fetch.
export const useProductRatings = () => {
  return useQuery<RatingsMap>({
    queryKey: ["product-ratings"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_product_ratings" as any);
      if (error || !data) return {};
      const map: RatingsMap = {};
      for (const row of data as any[]) {
        map[row.product_id] = {
          avg_rating: Number(row.avg_rating) || 0,
          review_count: Number(row.review_count) || 0,
        };
      }
      return map;
    },
    staleTime: 1000 * 60 * 5, // 5 min — ratings mudam pouco
  });
};
