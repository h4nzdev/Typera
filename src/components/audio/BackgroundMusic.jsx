import React, { useEffect, useRef, useState } from 'react';
import bgMusicFile from '../../assets/music/bg-music.mp3';
import { Volume2, VolumeX } from 'lucide-react';

const BackgroundMusic = () => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.2; // Keep background music subtle

    const handleFirstInteraction = () => {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.log("Autoplay blocked:", err);
      });
      // Remove listeners once interaction occurs
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    // Browsers block autoplay until user interacts
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <>
      <audio ref={audioRef} src={bgMusicFile} loop />
      
      {/* Floating Mute Button */}
      <button 
        onClick={toggleMute}
        className="fixed bottom-4 left-4 z-50 p-3 bg-black/60 border border-white/20 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white group flex items-center justify-center cursor-pointer"
        title="Toggle Music"
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
    </>
  );
};

export default BackgroundMusic;
