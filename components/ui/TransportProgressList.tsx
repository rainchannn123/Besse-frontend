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
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (transports.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {transports.map((transport) => {
        const isFast = transport.mode === 'fast';
        const modeLabel = isFast ? 'Fast Transport' : 'Slow Transport';
        const totalDuration = isFast ? 30 : 60;
        const remaining = Math.max(0, Math.ceil((transport.endTime - now) / 1000));

        // Countdown-style bar: starts full, then shrinks right-to-left.
        const progress = totalDuration > 0 ? (remaining / totalDuration) * 100 : 0;

        return (
          <div key={transport.id} className="flex items-center gap-2 h-6">
            {/* Type icon */}
            {isFast ? (
              <Zap className="h-3.5 w-3.5 text-orange-500 shrink-0" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-green-600 shrink-0" />
            )}

            <span
              className={`text-[10px] font-semibold uppercase tracking-wide shrink-0 ${
                isFast ? 'text-orange-600' : 'text-green-700'
              }`}
            >
              {modeLabel}
            </span>

            {/* Single slim animated progress bar */}
            <div className="relative flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div
                className={`ml-auto h-full rounded-full transition-all duration-1000 ease-linear ${
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