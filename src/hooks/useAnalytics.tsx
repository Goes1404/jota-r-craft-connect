import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAnalytics = () => {
  const trackVisit = useCallback(async (page: string) => {
    try {
      await supabase.from('site_visits').insert({
        visitor_ip: 'anonymous',
        page_visited: page,
      });
    } catch (error) {
      console.error('Error tracking visit:', error);
    }
  }, []);

  const trackProductView = useCallback(async (productId: string) => {
    try {
      await supabase.from('product_views').insert({ product_id: productId });
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  }, []);

  const usePageVisit = (pageName: string) => {
    useEffect(() => {
      trackVisit(pageName);
    }, [pageName]);
  };

  return { trackVisit, usePageVisit, trackProductView };
};
