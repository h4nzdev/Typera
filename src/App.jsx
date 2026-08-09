import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainMenu from "./pages/MainMenu";
import CreateMatchPage from "./pages/CreateMatchPage";
import JoinMatchPage from "./pages/JoinMatchPage";
import MatchLobbyPage from "./pages/MatchLobbyPage";
import BattlePage from "./pages/BattlePage";
import SoloPracticePage from "./pages/SoloPracticePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import MatchResultPage from "./pages/MatchResultPage";
import BackgroundMusic from "./components/audio/BackgroundMusic";
import ArcadeText from "./components/arcade/ArcadeText";

const DesktopOnlyOverlay = () => (
  <div className="fixed inset-0 z-[9999] bg-black flex lg:hidden flex-col items-center justify-center p-8 text-center backdrop-blur-xl">
    <ArcadeText color="red" glow className="text-4xl md:text-5xl mb-6 leading-tight animate-pulse">
      DESKTOP REQUIRED
    </ArcadeText>
    <ArcadeText color="pink" className="text-lg md:text-xl tracking-widest leading-relaxed max-w-md">
      TYPE//BATTLE REQUIRES A PHYSICAL KEYBOARD AND A FULL DESKTOP SCREEN TO PLAY.
    </ArcadeText>
    <ArcadeText color="white" className="mt-12 text-sm opacity-50 tracking-widest">
      PLEASE SWITCH TO A COMPUTER
    </ArcadeText>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <DesktopOnlyOverlay />
      <BackgroundMusic />
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/create" element={<CreateMatchPage />} />
        <Route path="/join" element={<JoinMatchPage />} />
        <Route path="/lobby" element={<MatchLobbyPage />} />
        <Route path="/battle" element={<BattlePage />} />
        <Route path="/practice" element={<SoloPracticePage />} />
        <Route path="/result" element={<MatchResultPage isVictory={true} />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
