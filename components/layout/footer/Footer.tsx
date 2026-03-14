'use client';

import { usePathname } from 'next/navigation';
import React from 'react';
import { BrokerFooter } from './BrokerFooter';
import { DefaultFooter } from './DefaultFooter';
import { MRFooter } from './MRFooter';
import { Places } from './Places';

export const Footer: React.FC = () => {
  const pathname = usePathname();
  switch (true) {
    case pathname.startsWith('/dashboard/team-members'):
    case pathname.startsWith('/dashboard/team-member'):
    case pathname.startsWith('/dashboard/game-over'):
    case pathname.startsWith('/dashboard/besse-group'):
    case pathname.startsWith('/dashboard/role'):
    case pathname.startsWith('/auth/login'):
    case pathname.startsWith('/auth/register'):
      return <DefaultFooter />;

    case pathname.startsWith('/dashboard/broker-relationship'):
    case pathname.startsWith('/dashboard/broker-inventory'):
    case pathname.startsWith('/dashboard/broker-order'):
    case pathname.startsWith('/dashboard/broker-depart'):
    case pathname.startsWith('/dashboard/broker-upgrade'):
    case pathname.startsWith('/dashboard/planning-cases'):
      return <BrokerFooter />;

    // case pathname.startsWith("/dashboard/municipality-city"):
    // case pathname.startsWith("/dashboard/municipality-order"):
    // case pathname.startsWith("/dashboard/municipality-collection"):
    // case pathname.startsWith("/dashboard/municipality"):
    //   return <MunicipalityFooter />;

    case pathname.startsWith('/dashboard/market-place'):
    case pathname.startsWith('/dashboard/market-place-trader'):
      return <Places />;
    case pathname.startsWith('/dashboard/MRF-collection'):
    case pathname.startsWith('/dashboard/MRF-inventory'):
    case pathname.startsWith('/dashboard/MRF-order'):
      return <MRFooter />;

    // case pathname.startsWith("/dashboard/market-place"):
    // case pathname.startsWith("/dashboard/market-place-trader"):
    // case pathname.startsWith("/dashboard/MRF-collection"):
    //   return < ></>;

    case pathname.startsWith('/dashboard/leaderBoard'):
      return <></>;
    case pathname.startsWith('/dashboard/dashboard-charts'):
      return <></>;

    default:
      return <></>;
  }
};
