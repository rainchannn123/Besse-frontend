// EXAMPLE INTEGRATION: Pairing System in Dashboard Layout
// This shows how to integrate pairing protection into your existing dashboard layout

import { useUserStore } from '@/stores/userStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Add this hook to your dashboard layout to protect game routes
 * It will ensure users can't access game features until paired
 */
export const useDashboardPairingProtection = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pairingStatus } = useUserStore();
  const sessionId = searchParams?.get('sessionId');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const pathname = window.location.pathname;
    const isPairingPage = pathname.includes('/pairing');

    // If on a game page (not pairing page) and sessionId exists
    if (!isPairingPage && sessionId) {
      // If pairing status loaded but not paired, redirect to pairing
      if (pairingStatus === null) {
        // User has accessed a game page but isn't paired
        // Redirect to pairing page
        router.push(`/dashboard/pairing?sessionId=${sessionId}`);
      } else {
        setIsChecking(false);
      }
    } else {
      setIsChecking(false);
    }
  }, [sessionId, pairingStatus, router]);

  return { isChecking, canAccessGame: pairingStatus?.isPaired || false };
};

/**
 * Integration example in your dashboard layout:
 *
 * export default function DashboardLayout({ children }) {
 *   const { isChecking, canAccessGame } = useDashboardPairingProtection();
 *
 *   if (isChecking) {
 *     return <LoadingScreen />;
 *   }
 *
 *   return (
 *     <div>
 *       <Header />
 *       <main>{children}</main>
 *       <Footer />
 *     </div>
 *   );
 * }
 */
