'use client';

import React from 'react';
import { MunicipalityFooter } from './MunicipalityFooter';

export const MRFooter: React.FC = () => {
  return (
    <MunicipalityFooter
      healthLabel="Material Quality"
      wasteLabel="Waste"
      scoreLabel="Score"
    />
  );
};