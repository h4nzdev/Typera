import React, { useEffect, useState } from 'react';
import { Wifi } from 'lucide-react';
import useMatchStore from '../../store/useMatchStore';

const PingBadge = ({ className = '' }) => {
  const [ping, setPing] = useState(24);
  const [quality, setQuality] = useState('excellent'); // excellent, good, poor

  useEffect(() => {
    const measurePing = async () => {
      const start = performance.now();
      try {
        const channel = useMatchStore.getState().channel;
        if (channel) {
          channel.send({
            type: 'broadcast',
            event: 'ping_check',
            payload: { ts: Date.now() }
          });
        } else {
          // Measure network latency
          await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' }).catch(() => {});
        }
      } catch (err) {
        // Non-fatal
      }
      const latency = Math.round(performance.now() - start);
      const clamped = Math.max(12, Math.min(280, latency));
      setPing(clamped);

      if (clamped < 60) setQuality('excellent');
      else if (clamped < 140) setQuality('good');
      else setQuality('poor');
    };

    measurePing();
    const interval = setInterval(measurePing, 3000);
    return () => clearInterval(interval);
  }, []);

  const colorClass = 
    quality === 'excellent' ? 'text-[#39ff14] border-[#39ff14]/40 shadow-[0_0_8px_rgba(57,255,20,0.3)]' :
    quality === 'good' ? 'text-[#fffb00] border-[#fffb00]/40 shadow-[0_0_8px_rgba(255,251,0,0.3)]' :
    'text-[#ff003c] border-[#ff003c]/40 shadow-[0_0_8px_rgba(255,0,60,0.3)]';

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 bg-black/90 border rounded-lg font-[family-name:var(--font-arcade)] text-[11px] tracking-wider select-none ${colorClass} ${className}`}>
      <Wifi size={12} className="animate-pulse shrink-0" />
      <span>PING:</span>
      <span className="font-bold font-mono text-white">{ping}</span>
      <span className="text-[9px] opacity-70">MS</span>
    </div>
  );
};

export default PingBadge;
