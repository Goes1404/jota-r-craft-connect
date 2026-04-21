import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAnalytics = () => {
  const trackVisit = async (page: string) => {
    try {
      // Get visitor IP (simplified approach)
      const visitorIP = 'anonymous';
      
      await supabase
        .from('site_visits')
        .insert({
          visitor_ip: visitorIP,
          page_visited: page,
        });
    } catch (error) {
      console.error('Error tracking visit:', error);
    }
  };

  const usePageVisit = (pageName: string) => {
    useEffect(() => {
      trackVisit(pageName);
    }, [pageName]);
  };

  return { trackVisit, usePageVisit };
};