import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ArcadeText from '../components/arcade/ArcadeText';
import ArcadePanel from '../components/arcade/ArcadePanel';
import ArcadeButton from '../components/arcade/ArcadeButton';
import { supabase } from '../lib/supabase';

const LeaderboardPage = () => {
  const navigate = useNavigate();
  
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase
          .from('leaderboard')
          .select('*')
          .order('wpm', { ascending: false })
          .limit(10);
          
        if (error) {
          console.error("Error fetching leaderboard:", error);
        } else {
          setPlayers(data || []);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-black/50 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(176,38,255,0.05)_0%,transparent_60%)] pointer-events-none"></div>
      
      <ArcadeText as="h1" color="purple" glow className="text-4xl md:text-5xl mb-8 z-10 flex items-center gap-4">
        🏆 TOP PLAYERS
      </ArcadeText>
      
      <ArcadePanel color="purple" className="w-full max-w-2xl z-10 p-8 flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center p-8">
            <ArcadeText color="cyan" className="animate-pulse">LOADING...</ArcadeText>
          </div>
        ) : players.length === 0 ? (
          <div className="flex justify-center p-8">
            <ArcadeText color="pink">NO SCORES YET.</ArcadeText>
          </div>
        ) : (
          players.map((p, i) => (
            <div key={p.id} className={`flex justify-between items-center p-4 border-b border-white/10 ${i < 3 ? 'bg-white/5' : ''}`}>
              <div className="flex gap-6 items-center">
                <ArcadeText color={i === 0 ? 'yellow' : i === 1 ? 'white' : i === 2 ? 'pink' : 'cyan'} className="text-2xl">
                  #{i + 1}
                </ArcadeText>
                <ArcadeText color="white" glow={i < 3} className="text-2xl uppercase">{p.name}</ArcadeText>
              </div>
              <div className="flex flex-col items-end">
                <ArcadeText color="green" glow className="text-xl">{p.wpm} WPM</ArcadeText>
                <ArcadeText color="pink" className="text-[10px] tracking-widest">{p.accuracy}% ACC | MAX ×{p.max_combo}</ArcadeText>
              </div>
            </div>
          ))
        )}
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
