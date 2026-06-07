import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from '../stores/userStore';
import { useEffect } from 'react';
import React from 'react';

/**
 * Hook to ensure teams cannot proceed to gameplay until paired
 * Use this in game dashboard and other gameplay pages
 */
export const usePairingGuard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pairingStatus } = useUserStore();
  const sessionId = searchParams?.get('sessionId');

  useEffect(() => {
    // If sessionId exists and not in pairing page, check if team is paired
    if (sessionId) {
      // If pairing status is null and not loading, redirect to pairing
      if (pairingStatus === null) {
        console.warn('Team not paired. Redirecting to pairing queue...');
        router.push(`/dashboard/pairing?sessionId=${sessionId}`);
      }
    }
  }, [sessionId, pairingStatus, router]);

  return {
    isPaired: pairingStatus?.isPaired || false,
    canPlayGame: pairingStatus?.isPaired === true,
    teamRole: pairingStatus?.teamRole || null,
    partnerId: pairingStatus?.partnerSessionId || null,
  };
};

/**
 * Higher-order component to protect game pages
 * Wrap your game pages with this to ensure pairing
 */
export const withPairingGuard = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { pairingStatus } = useUserStore();
    const sessionId = searchParams?.get('sessionId');

    useEffect(() => {
      if (!sessionId) {
        router.push('/dashboard/role');
        return;
      }

      if (pairingStatus === null) {
        router.push(`/dashboard/pairing?sessionId=${sessionId}`);
      }
    }, [sessionId, pairingStatus, router]);

    // Only render if paired
    if (pairingStatus?.isPaired) {
      return <Component {...props} />;
    }

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '16px',
          fontWeight: '500',
        }}
      >
        <p>Loading game... (Teams must be paired before starting)</p>
      </div>
    );
  };
};
