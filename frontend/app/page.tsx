"use client";

import { useState, useCallback } from "react";
import { Quest, Scene, UserData } from "@/lib/types";
import LoadingScreen from "@/components/LoadingScreen";
import LoginScene from "@/scenes/LoginScene";
import TownScene from "@/scenes/TownScene";
import GuildInteriorScene from "@/scenes/GuildInteriorScene";
import QuestBoardScene from "@/scenes/QuestBoardScene";
import SubmissionScene from "@/scenes/SubmissionScene";

const LOADING_DURATION_MS = 1500;

export default function Home() {
  const [scene, setScene] = useState<Scene>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);

  // Navigate between scenes with a loading screen transition
  const navigateTo = useCallback((target: Scene, message = "Loading...") => {
    setLoadingMessage(message);
    setIsLoading(true);
    setTimeout(() => {
      setScene(target);
      setIsLoading(false);
    }, LOADING_DURATION_MS);
  }, []);

  const handleLogin = useCallback(
    (user: UserData) => {
      setUserData(user);
      navigateTo("town", "Entering the guild town...");
    },
    [navigateTo]
  );

  const handleEnterGuild = useCallback(() => {
    navigateTo("guild-interior", "Entering guild hall...");
  }, [navigateTo]);

  const handleGoToQuestBoard = useCallback(() => {
    navigateTo("quest-board", "Loading quest board...");
  }, [navigateTo]);

  const handleTakeQuest = useCallback(
    (quest: Quest) => {
      setSelectedQuest(quest);
      navigateTo("submission", `Loading quest: ${quest.title}...`);
    },
    [navigateTo]
  );

  const handleBackToQuestBoard = useCallback(() => {
    setSelectedQuest(null);
    navigateTo("quest-board", "Returning to quest board...");
  }, [navigateTo]);

  const handleUpdateUser = useCallback((updated: UserData) => {
    setUserData(updated);
  }, []);

  // Show loading screen during transitions
  if (isLoading) {
    return <LoadingScreen message={loadingMessage} />;
  }

  // Render current scene
  switch (scene) {
    case "login":
      return <LoginScene onLogin={handleLogin} />;

    case "town":
      if (!userData) return <LoginScene onLogin={handleLogin} />;
      return <TownScene user={userData} onEnterGuild={handleEnterGuild} />;

    case "guild-interior":
      if (!userData) return <LoginScene onLogin={handleLogin} />;
      return (
        <GuildInteriorScene
          user={userData}
          onGoToQuestBoard={handleGoToQuestBoard}
        />
      );

    case "quest-board":
      if (!userData) return <LoginScene onLogin={handleLogin} />;
      return (
        <QuestBoardScene
          user={userData}
          onTakeQuest={handleTakeQuest}
        />
      );

    case "submission":
      if (!userData || !selectedQuest)
        return <QuestBoardScene user={userData!} onTakeQuest={handleTakeQuest} />;
      return (
        <SubmissionScene
          user={userData}
          quest={selectedQuest}
          onUpdateUser={handleUpdateUser}
          onBackToQuestBoard={handleBackToQuestBoard}
        />
      );

    default:
      return <LoginScene onLogin={handleLogin} />;
  }
}
