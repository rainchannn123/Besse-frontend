'use client';

import React from 'react';
import { Clock, Zap } from 'lucide-react';

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

      transports.forEach((transport) => {
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

  if (transports.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {transports.map((transport) => {
        const remaining = timeRemaining[transport.id] || 0;
        const isFast = transport.mode === 'fast';
        const totalDuration = isFast ? 30 : 60;
        const progress = totalDuration > 0 ? ((totalDuration - remaining) / totalDuration) * 100 : 0;

        return (
          <div key={transport.id} className="flex items-center gap-2 h-6">
            {/* Type icon */}
            {isFast ? (
              <Zap className="h-3.5 w-3.5 text-orange-500 shrink-0" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-green-600 shrink-0" />
            )}

            {/* Single slim animated progress bar */}
            <div className="relative flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                  isFast ? 'bg-orange-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>

            {/* Compact timer */}
            <span className="font-mono text-[11px] font-semibold text-blue-700 w-10 text-right shrink-0">
              {formatTime(remaining)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default TransportProgressList;