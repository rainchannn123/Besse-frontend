'use client';

import { usePathname } from 'next/navigation';
import React from 'react';
import { BesseHeader } from './BesseHeader';
import { DashboardChartsHeader } from './DashboardChartsHeader';
import { LoginHeader } from './LoginHeader';
import { MemberHeader } from './MemeberHeader';

export const Header: React.FC = () => {
  const pathname = usePathname();
  switch (true) {
    case pathname.startsWith('/auth/login'):
    case pathname.startsWith('/auth/register'):
      return <LoginHeader />;

    case pathname.startsWith('/dashboard/team-member'):
    case pathname.startsWith('/dashboard/team-members'):
    case pathname.startsWith('/dashboard/role'):
      return <MemberHeader />;

    case pathname.startsWith('/dashboard/besse-group'):
      return <BesseHeader />;

    // case pathname.startsWith("/dashboard/municipality"):
    // case pathname.startsWith("/dashboard/municipality-collection"):

    // case pathname.startsWith("/dashboard/municipality-order"):
    // case pathname.startsWith("/dashboard/MRF-order"):

    // case pathname.startsWith("/dashboard/market-place"):
    // case pathname.startsWith("/dashboard/market-place-trader"):
    // case pathname.startsWith("/dashboard/MRF-collection"):

    // case pathname.startsWith("/dashboard/MRF-inventory"):
    // case pathname.startsWith("/dashboard/broker-relationship"):
    // case pathname.startsWith("/dashboard/broker-inventory"):
    // case pathname.startsWith("/dashboard/broker-order"):
    // case pathname.startsWith("/dashboard/broker-upgrade"):
    // case pathname.startsWith("/dashboard/planning-cases"):
    // case pathname.startsWith("/dashboard/game-over"):
    //   return <MunicipalityHeader />;

    // case pathname.startsWith("/dashboard/market-place"):
    // case pathname.startsWith("/dashboard/market-place-trader"):
    // case pathname.startsWith("/dashboard/MRF-collection"):
    //   return <MarketPlaceHeader />;

    case pathname.startsWith('/dashboard/leaderBoard'):
      return <></>;
    case pathname.startsWith('/dashboard/dashboard-charts'):
      return <DashboardChartsHeader></DashboardChartsHeader>;

    default:
      return null;
  }
};
