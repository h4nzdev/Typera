import React from 'react';
import { useNavigate } from 'react-router-dom';
import ArcadeText from '../components/arcade/ArcadeText';
import ArcadePanel from '../components/arcade/ArcadePanel';
import ArcadeButton from '../components/arcade/ArcadeButton';

const LeaderboardPage = () => {
  const navigate = useNavigate();
  
  const players = [
    { rank: 1, name: "CYBERFOX", wpm: 112 },
    { rank: 2, name: "H4NZ", wpm: 108 },
    { rank: 3, name: "CODEWIZ", wpm: 104 },
    { rank: 4, name: "PIXEL", wpm: 98 },
    { rank: 5, name: "NEO", wpm: 95 },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-black/50 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(176,38,255,0.05)_0%,transparent_60%)] pointer-events-none"></div>
      
      <ArcadeText as="h1" color="purple" glow className="text-4xl md:text-5xl mb-8 z-10 flex items-center gap-4">
        🏆 TOP PLAYERS
      </ArcadeText>
      
      <ArcadePanel color="purple" className="w-full max-w-2xl z-10 p-8 flex flex-col gap-4">
        {players.map((p, i) => (
          <div key={p.name} className={`flex justify-between items-center p-4 border-b border-white/10 ${i < 3 ? 'bg-white/5' : ''}`}>
            <div className="flex gap-6 items-center">
              <ArcadeText color={i === 0 ? 'yellow' : i === 1 ? 'white' : i === 2 ? 'pink' : 'cyan'} className="text-2xl">
                #{p.rank}
              </ArcadeText>
              <ArcadeText color="white" glow={i < 3} className="text-2xl">{p.name}</ArcadeText>
            </div>
            <ArcadeText color="green" glow className="text-xl">{p.wpm} WPM</ArcadeText>
          </div>
        ))}
      </ArcadePanel>
      
      <div className="mt-12 z-10">
        <ArcadeButton color="cyan" onClick={() => navigate('/')}>
          MAIN MENU
        </ArcadeButton>
      </div>
    </div>
  );
};

export default LeaderboardPage;
