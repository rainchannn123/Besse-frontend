'use client';

import React, { useMemo } from 'react';
import { MaterialType } from '@/types/besse';

interface ProcessedNotListedChartProps {
  data: {
    byType: Record<MaterialType, number>;
    total: number;
  };
}

const COLORS: Record<MaterialType, string> = {
  glass: '#3B82F6',   // Blue
  plastic: '#EF4444',  // Red
  metal: '#9CA3AF',    // Gray
  paper: '#8B5A2B',    // Brown
  wood: '#F97316',     // Orange
};

const MATERIAL_LABELS: Record<MaterialType, string> = {
  glass: 'Glass',
  plastic: 'Plastic',
  metal: 'Metal',
  paper: 'Paper',
  wood: 'Wood',
};

const DonutChart: React.FC<{ data: { name: string; value: number; color: string; percentage: number }[]; total: number }> = ({ data, total }) => {
  if (data.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center h-[150px]">
        <p className="text-[#8b7355] text-sm text-center">No data available</p>
      </div>
    );
  }

  let cumulativePercentage = 0;
  const gradientStops = data.map((item) => {
    const start = cumulativePercentage;
    cumulativePercentage += item.percentage;
    const end = cumulativePercentage;
    return `${item.color} ${start}% ${end}%`;
  });

  const conicGradient = `conic-gradient(${gradientStops.join(', ')})`;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[140px] h-[140px] rounded-full overflow-hidden shadow-md" style={{ background: conicGradient }}>
        <div className="absolute inset-[20%] bg-[#F8F0DD] rounded-full flex items-center justify-center shadow-inner">
          <span className="text-lg font-bold text-[#4f2d14]">{total.toFixed(1)}t</span>
        </div>
      </div>
      <div className="mt-3 w-full">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs mb-1">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="text-[#4f2d14]">{item.name}</span>
            </div>
            <span className="text-[#6d4b2a] font-medium">{item.value.toFixed(1)}t ({item.percentage.toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProcessedNotListedChart: React.FC<ProcessedNotListedChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    return Object.entries(data.byType)
      .filter(([_, value]) => value > 0)
      .map(([type, value]) => ({
        name: MATERIAL_LABELS[type as MaterialType],
        value: Number(value.toFixed(2)),
        color: COLORS[type as MaterialType],
        percentage: data.total > 0 ? (value / data.total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const hasData = chartData.length > 0 && data.total > 0;

  return (
    <div className="w-full">
      <h4 className="text-center font-semibold text-[#33552C] text-sm mb-3">
        Recycled Materials from Waste
      </h4>
      {hasData ? (
        <>
          <DonutChart data={chartData} total={data.total} />
          <div className="text-center mt-3 text-xs text-[#7a5f41]">
            Ready: {data.total.toFixed(2)} tons
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-[180px]">
          <p className="text-[#8b7355] text-sm text-center">No materials ready</p>
        </div>
      )}
    </div>
  );
};

export default ProcessedNotListedChart;