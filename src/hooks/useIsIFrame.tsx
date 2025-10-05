import { useState, useEffect } from 'react';

/**
 * Hook to detect if the current component is running inside an iframe
 * This is useful for security measures to prevent certain actions in embedded contexts
 */
export function useIsIFrame(): boolean {
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    // Check if window is defined (for SSR)
    if (typeof window !== 'undefined') {
      try {
        setIsIframe(window.self !== window.top);
      } catch (e) {
        // If we can't access window.top due to same-origin policy,
        // we're definitely in an iframe
        setIsIframe(true);
      }
    }
  }, []);

  return isIframe;
}