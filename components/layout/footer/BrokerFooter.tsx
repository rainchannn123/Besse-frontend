'use client';

import React from 'react';
import { MunicipalityFooter } from './MunicipalityFooter';

export const BrokerFooter: React.FC = () => {
  return (
    <MunicipalityFooter
      healthLabel="Relationship"
      wasteLabel="Waste"
      scoreLabel="Score"
    />
  );
};