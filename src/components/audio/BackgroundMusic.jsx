import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Volume2, VolumeX, playBgm, toggleMuteBgm } from '../../lib/sounds';

const BackgroundMusic = () => {
  const location = useLocation();
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (location.pathname === '/battle') {
      playBgm('battle');
    } else {
      playBgm('menu');
    }
  }, [location.pathname]);

  const handleToggleMute = () => {
    const muted = toggleMuteBgm();
    setIsMuted(muted);
  };

  return (
    <button 
      onClick={handleToggleMute}
      className="fixed bottom-4 left-4 z-50 p-3 bg-black/60 border border-white/20 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white group flex items-center justify-center cursor-pointer"
      title="Toggle Background Music"
    >
      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
    </button>
  );
};

export default BackgroundMusic;
