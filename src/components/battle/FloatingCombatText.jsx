import React, { useEffect, useState } from 'react';

const FloatingCombatText = ({ stats, color = 'pink' }) => {
  const [particles, setParticles] = useState([]);
  const prevStats = React.useRef(stats);

  useEffect(() => {
    if (!stats) return;

    const prev = prevStats.current || {};
    const newItems = [];
    const now = Date.now();

    // Progress increase
    if (stats.progress > (prev.progress || 0)) {
      const diff = stats.progress - (prev.progress || 0);
      newItems.push({
        id: `prog-${now}-${Math.random()}`,
        text: `⚡ +${diff}% PROGRESS`,
        color: color === 'pink' ? 'text-pink-400' : 'text-cyan-400',
        x: Math.floor(Math.random() * 60) - 30
      });
    }

    // Combo streak milestone
    if (stats.combo > 0 && stats.combo % 10 === 0 && stats.combo !== prev.combo) {
      newItems.push({
        id: `combo-${now}-${Math.random()}`,
        text: `🔥 ${stats.combo}X COMBO!`,
        color: 'text-amber-300 font-extrabold',
        x: Math.floor(Math.random() * 40) - 20
      });
    }

    // Damage dealt
    if (stats.damageDealt > (prev.damageDealt || 0)) {
      const dmgDiff = stats.damageDealt - (prev.damageDealt || 0);
      newItems.push({
        id: `dmg-${now}-${Math.random()}`,
        text: `⚔️ -${dmgDiff} HP`,
        color: 'text-red-400 font-black',
        x: Math.floor(Math.random() * 60) - 30
      });
    }

    if (newItems.length > 0) {
      setParticles(prevList => [...prevList.slice(-6), ...newItems]);
    }

    prevStats.current = stats;
  }, [stats, color]);

  useEffect(() => {
    if (particles.length === 0) return;
    const timer = setInterval(() => {
      setParticles(prev => prev.filter(p => Date.now() - parseInt(p.id.split('-')[1], 10) < 1200));
    }, 200);
    return () => clearInterval(timer);
  }, [particles]);

  return (
    <div className="absolute -top-12 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex flex-col items-center select-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`font-[family-name:var(--font-arcade)] text-xs md:text-sm tracking-wider uppercase font-bold animate-float-combat drop-shadow-[0_0_8px_rgba(0,0,0,0.9)] ${p.color}`}
          style={{
            transform: `translateX(${p.x}px)`
          }}
        >
          {p.text}
        </div>
      ))}
    </div>
  );
};

export default FloatingCombatText;
