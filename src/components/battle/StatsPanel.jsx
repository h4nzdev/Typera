import React from 'react';
import ArcadeText from '../arcade/ArcadeText';
import { Gauge, Target, FileText, Zap } from 'lucide-react';

const StatItem = ({ label, value, color = 'white', icon: Icon }) => (
  <div className={`relative flex items-center justify-center border border-white/20 rounded-lg py-3 flex-1 bg-black/40 min-h-[70px]`}>
    <div className="absolute left-4 md:left-6 flex items-center">
      <Icon size={24} className={`text-[var(--color-neon-${color})] opacity-80`} />
    </div>
    <div className="flex flex-col items-center justify-center">
      <ArcadeText className="text-gray-400 text-[10px] uppercase tracking-widest mb-1 leading-none">{label}</ArcadeText>
      <ArcadeText color={color} glow className="text-2xl leading-none">{value}</ArcadeText>
    </div>
  </div>
);

const StatsPanel = ({ wpm = "78", accuracy = "98.4%", chars = "142 / 200", combo = "×27" }) => {
  return (
    <div className="flex justify-between items-center w-full gap-4 mt-2">
      <StatItem label="WPM" value={wpm} color="cyan" icon={Gauge} />
      <StatItem label="ACCURACY" value={accuracy} color="green" icon={Target} />
      <StatItem label="CHARACTERS" value={chars} color="yellow" icon={FileText} />
      <StatItem label="COMBO" value={combo} color="pink" icon={Zap} />
    </div>
  );
};

export default StatsPanel;
