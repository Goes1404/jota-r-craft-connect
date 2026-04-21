import { describe, it, expect, vi } from 'vitest';
import { salesService } from '@/services/salesService';
import { productService } from '@/services/productService';
import { supabase } from '@/integrations/supabase/client';

describe('Sales Service', () => {
  it('should fetch sales with correct filters', async () => {
    const mockSales = [{ id: '1', total_price: 100 }];
    (supabase.from as any).mockImplementation(() => {
      const qb = (supabase as any)._getQueryBuilder();
      qb._data = mockSales;
      return qb;
    });

    const result = await salesService.getSales({ productId: 'prod-1' });
    expect(result).toEqual(mockSales);
  });

  it('should handle errors when fetching sales', async () => {
    (supabase.from as any).mockImplementation(() => {
      const qb = (supabase as any)._getQueryBuilder();
      qb._error = { message: 'Api Error' };
      return qb;
    });

    await expect(salesService.getSales({})).rejects.toMatchObject({ message: 'Api Error' });
  });
});

describe('Product Service', () => {
  it('should fetch all products', async () => {
    const mockProducts = [{ id: 'p1', name: 'Product 1' }];
    (supabase.from as any).mockImplementation(() => {
      const qb = (supabase as any)._getQueryBuilder();
      qb._data = mockProducts;
      return qb;
    });

    const result = await productService.getProducts();
    expect(result).toEqual(mockProducts);
  });
});
