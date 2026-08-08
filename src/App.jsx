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

const App = () => {
  return (
    <BrowserRouter>
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
