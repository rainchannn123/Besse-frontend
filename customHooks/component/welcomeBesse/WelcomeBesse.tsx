'use client';

import React from 'react';

export const WelcomeBesse: React.FC = () => {
  return (
    <div className="mb-6 md:mb-8 w-full flex justify-center px-2 md:px-0">
      <h1 className="relative overflow-hidden w-full max-w-[1200px] text-center lg:text-[44px] md:text-[34px] sm:text-[28px] text-[20px] font-extrabold py-3 md:px-16 px-6 m-0 border border-emerald-200/35 text-emerald-50 bg-gradient-to-r from-[#1f2d25]/90 via-[#22372a]/90 to-[#18241d]/90 rounded-2xl tracking-wide shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_60%)] pointer-events-none" />
        <span className="relative z-10">
        Clash of the Cities - Mission Net Zero
        </span>
      </h1>
    </div>
  );
};
