import React from 'react';

const COLOR_MAP = {
  cyan:   { hex: '#00f3ff', muted: 'rgba(0,243,255,0.2)'   },
  pink:   { hex: '#ff007f', muted: 'rgba(255,0,127,0.2)'   },
  purple: { hex: '#b026ff', muted: 'rgba(176,38,255,0.2)'  },
  green:  { hex: '#39ff14', muted: 'rgba(57,255,20,0.2)'   },
  yellow: { hex: '#fffb00', muted: 'rgba(255,251,0,0.2)'   },
  red:    { hex: '#ff003c', muted: 'rgba(255,0,60,0.2)'    },
};

const ArcadePanel = ({ children, color = 'cyan', className = '' }) => {
  const c = COLOR_MAP[color] || COLOR_MAP.cyan;

  return (
    <div className={`relative border-4 p-1 ${className}`} style={{
      borderColor: c.hex,
      boxShadow: `0 0 0 2px #000, 0 0 20px ${c.hex}50, 0 0 50px ${c.hex}15, inset 0 0 20px rgba(0,0,0,0.8)`,
      imageRendering: 'pixelated',
    }}>
      {/* Pixel corner squares */}
      <div className="absolute -top-2 -left-2 w-4 h-4" style={{ background: c.hex, boxShadow: `0 0 8px ${c.hex}` }} />
      <div className="absolute -top-2 -right-2 w-4 h-4" style={{ background: c.hex, boxShadow: `0 0 8px ${c.hex}` }} />
      <div className="absolute -bottom-2 -left-2 w-4 h-4" style={{ background: c.hex, boxShadow: `0 0 8px ${c.hex}` }} />
      <div className="absolute -bottom-2 -right-2 w-4 h-4" style={{ background: c.hex, boxShadow: `0 0 8px ${c.hex}` }} />

      <div className="border-2 border-black/50 bg-black/80 w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default ArcadePanel;
