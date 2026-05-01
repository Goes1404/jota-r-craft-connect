import { supabase } from "@/integrations/supabase/client";
import { Sale, SalesSummary } from "@/types/database";

export interface SaleFilter {
  date?: string;
  productId?: string;
  category?: string;
  saleType?: 'all' | 'manual' | 'automatic';
}

export const salesService = {
  async getSales(filter: SaleFilter = {}) {
    let query = supabase
      .from('sales')
      .select(`
        *,
        product:products(name, category, cost)
      `)
      .order('sale_date', { ascending: false });

    if (filter.date) {
      const filterDate = new Date(filter.date);
      const startOfDay = new Date(filterDate.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(filterDate.setHours(23, 59, 59, 999)).toISOString();
      query = query.gte('sale_date', startOfDay).lte('sale_date', endOfDay);
    }

    if (filter.productId) {
      query = query.eq('product_id', filter.productId);
    }

    if (filter.category) {
      query = query.eq('category', filter.category);
    }

    if (filter.saleType && filter.saleType !== 'all') {
      query = query.eq('sale_type', filter.saleType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Sale[];
  },

  async getSalesSummary(filter: SaleFilter = {}) {
    const { data, error } = await supabase.rpc('get_sales_summary', {
      start_date: filter.date ? new Date(filter.date).toISOString() : null,
      end_date: filter.date ? new Date(new Date(filter.date).setHours(23, 59, 59, 999)).toISOString() : null,
      product_filter: filter.productId || null,
      category_filter: filter.category || null,
      sale_type_filter: filter.saleType && filter.saleType !== 'all' ? filter.saleType : null,
    });
    
    if (error) throw error;
    return (data?.[0] || {}) as SalesSummary;
  },

  async createSale(saleData: Omit<Sale, 'id' | 'sale_date' | 'product'>) {
    const { data, error } = await supabase
      .from('sales')
      .insert([saleData])
      .select()
      .single();
    
    if (error) throw error;
    return data as Sale;
  },

  async deleteSale(id: string) {
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
