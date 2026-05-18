import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ReactGA from 'react-ga4';

let isGAInitialized = false;

export const initGA = () => {
  if (isGAInitialized) return;
  const consentData = localStorage.getItem('jr_cookie_consent_prefs');
  if (consentData) {
    try {
      const prefs = JSON.parse(consentData);
      if (prefs.analytics && import.meta.env.VITE_GA4_ID) {
        ReactGA.initialize(import.meta.env.VITE_GA4_ID);
        isGAInitialized = true;

        import('web-vitals').then(({ onCLS, onFID, onLCP }) => {
          const sendToGA = ({ name, delta, id }: any) => {
            ReactGA.event({
              category: 'Web Vitals',
              action: name,
              value: Math.round(name === 'CLS' ? delta * 1000 : delta),
              label: id,
              nonInteraction: true,
            });
          };
          onCLS(sendToGA);
          onFID(sendToGA);
          onLCP(sendToGA);
        });
      }
    } catch (e) {}
  }
};

export const useAnalytics = () => {
  useEffect(() => {
    initGA();
  }, []);

  const trackVisit = useCallback(async (page: string) => {
    try {
      await supabase.from('site_visits').insert({
        visitor_ip: 'anonymous',
        page_visited: page,
      });
      if (isGAInitialized) {
        ReactGA.send({ hitType: 'pageview', page });
      }
    } catch (error) {
      console.error('Error tracking visit:', error);
    }
  }, []);

  const trackProductView = useCallback(async (productId: string) => {
    try {
      await supabase.from('product_views').insert({ product_id: productId });
      if (isGAInitialized) {
        ReactGA.event({
          category: 'Ecommerce',
          action: 'view_item',
          label: productId
        });
      }
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
