'use client';

import { ActiveTransport } from '@/types/besse';
import React from 'react';
import { Clock, Zap } from 'lucide-react';

interface TransportProgressListProps {
  transports: ActiveTransport[];
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

  const getTransportMeta = (transport: ActiveTransport) => {
    const isToMuni = transport.purpose === 'mrf-to-municipality';
    const toLabel = isToMuni ? 'to Muni' : 'to MRF';
    const isFast = transport.mode === 'fast';

    if (isToMuni) {
      return {
        toLabel,
        iconClass: isFast ? 'text-orange-700' : 'text-green-700',
        textClass: isFast ? 'text-orange-800' : 'text-green-800',
        barClass: isFast ? 'bg-orange-700' : 'bg-green-700',
      };
    }

    return {
      toLabel,
      iconClass: isFast ? 'text-orange-500' : 'text-green-600',
      textClass: isFast ? 'text-orange-600' : 'text-green-700',
      barClass: isFast ? 'bg-orange-500' : 'bg-green-500',
    };
  };

  if (transports.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {transports.map((transport) => {
        const isFast = transport.mode === 'fast';
        const totalDuration = Math.max(
          1,
          Math.ceil((transport.endTime - transport.startTime) / 1000)
        );
        const remaining = Math.max(0, Math.ceil((transport.endTime - now) / 1000));

        const progress = totalDuration > 0 ? (remaining / totalDuration) * 100 : 0;
        const meta = getTransportMeta(transport);

        return (
          <div key={transport.id} className="flex items-center gap-2 h-6">
            {isFast ? (
              <Zap className={`h-3.5 w-3.5 shrink-0 ${meta.iconClass}`} />
            ) : (
              <Clock className={`h-3.5 w-3.5 shrink-0 ${meta.iconClass}`} />
            )}

            <span
              className={`text-[10px] font-semibold uppercase tracking-wide shrink-0 ${meta.textClass}`}
            >
              {`${isFast ? 'Fast' : 'Slow'} Transport (${meta.toLabel})`}
            </span>

            <div className="relative flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div
                className={`ml-auto h-full rounded-full transition-all duration-1000 ease-linear ${meta.barClass}`}
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>

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