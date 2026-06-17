'use client';

import React from 'react';
import { Clock, Truck, Zap } from 'lucide-react';

interface TransportItem {
  id: string;
  mode: 'fast' | 'slow';
  wasteBatch: {
    mass: number;
    origin: string;
  };
  endTime: number;
}

interface TransportProgressListProps {
  transports: TransportItem[];
}

const TransportProgressList: React.FC<TransportProgressListProps> = ({ transports }) => {
  const [timeRemaining, setTimeRemaining] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    const updateTimes = () => {
      const now = Date.now();
      const newTimes: Record<string, number> = {};
      transports.forEach(transport => {
        const remaining = Math.max(0, Math.ceil((transport.endTime - now) / 1000));
        newTimes[transport.id] = remaining;
      });
      setTimeRemaining(newTimes);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, [transports]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (transports.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border-2 border-[#b18c5a] rounded-lg p-4 mb-4 shadow-md">
      <div className="flex items-center gap-2 mb-3">
        <Truck className="h-5 w-5 text-[#50704C]" />
        <h3 className="font-bold text-[#33552C] text-lg">Active Transports ({transports.length})</h3>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {transports.map((transport) => {
          const remaining = timeRemaining[transport.id] || 0;
          const isFast = transport.mode === 'fast';
          const totalDuration = isFast ? 30 : 60;
          const progress = totalDuration > 0 ? ((totalDuration - remaining) / totalDuration) * 100 : 0;
          
          return (
            <div key={transport.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  {isFast ? (
                    <Zap className="h-4 w-4 text-orange-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-green-500" />
                  )}
                  <span className={`font-semibold text-sm ${isFast ? 'text-orange-600' : 'text-green-600'}`}>
                    {isFast ? 'Fast Transport' : 'Slow Transport'}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {transport.wasteBatch.origin} Waste
                </span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Mass: {transport.wasteBatch.mass.toFixed(1)} tons</span>
                <span className="font-mono font-bold text-blue-600">{formatTime(remaining)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-1000 ${isFast ? 'bg-orange-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TransportProgressList;