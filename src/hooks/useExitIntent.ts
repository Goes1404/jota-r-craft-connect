import { useState, useEffect } from 'react';

export const useExitIntent = (hasItemsInCart: boolean) => {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Only set up the listener if the cart has items and we haven't shown it yet this session
    const hasShownPopup = sessionStorage.getItem('exit_intent_shown');
    
    if (!hasItemsInCart || hasShownPopup === 'true') {
      return;
    }

    const handleMouseLeave = (e: MouseEvent) => {
      // Check if the mouse is moving towards the top of the browser window (typical exit behavior)
      if (e.clientY <= 0 || e.clientX <= 0 || (e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)) {
        setShowPopup(true);
        sessionStorage.setItem('exit_intent_shown', 'true');
        // Remove listener after triggering once
        document.removeEventListener('mouseleave', handleMouseLeave);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasItemsInCart]);

  return { showPopup, setShowPopup };
};
