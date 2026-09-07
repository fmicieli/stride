import { useEffect, useState } from 'react';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean>(true);

  useEffect(() => {
    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => setIsConnected(false);

    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return { isConnected };
}
