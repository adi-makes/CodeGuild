"use client";

import { useState, useCallback, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Quest, Scene, UserData } from "@/lib/types";
import LoadingScreen from "@/components/LoadingScreen";
import LoginScene from "@/scenes/LoginScene";
import TownScene from "@/scenes/TownScene";
import GuildInteriorScene from "@/scenes/GuildInteriorScene";
import QuestBoardScene from "@/scenes/QuestBoardScene";
import SubmissionScene from "@/scenes/SubmissionScene";
import LeaderboardScene from "@/scenes/LeaderboardScene";

const LOADING_DURATION_MS = 1500;
const BACKEND_CORE_URL =
  process.env.NEXT_PUBLIC_BACKEND_CORE_URL || "http://localhost:3001";

export default function Home() {
  const [scene, setScene] = useState<Scene>("login");
  const [isLoading, setIsLoading] = useState(true); // START TRUE to check auth state first
  const [loadingMessage, setLoadingMessage] = useState("Checking guild records...");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);

  // Check Firebase Auth state on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setLoadingMessage("Restoring your session...");
        try {
          const idToken = await firebaseUser.getIdToken();
          const res = await fetch(`${BACKEND_CORE_URL}/api/users/init`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
          });
          if (res.ok) {
            const data: UserData = await res.json();
            setUserData(data);
            setScene("town");
          } else {
            // Token might be invalid or something else
            setUserData(null);
            setScene("login");
          }
        } catch (err) {
          console.error("Failed to restore session:", err);
          setUserData(null);
          setScene("login");
        }
      } else {
        setUserData(null);
        setScene("login");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
      return (
        <TownScene
          user={userData}
          onEnterGuild={handleEnterGuild}
          onLogout={() => {
            auth.signOut();
            navigateTo("login", "Logging out...");
          }}
        />
      );

    case "guild-interior":
      if (!userData) return <LoginScene onLogin={handleLogin} />;
      return (
        <GuildInteriorScene
          user={userData}
          onGoToQuestBoard={handleGoToQuestBoard}
          onGoToLeaderboard={() => navigateTo("leaderboard", "Loading Hall of Legends...")}
          onLeaveGuild={() => navigateTo("town", "Returning to town...")}
        />
      );

    case "leaderboard":
      if (!userData) return <LoginScene onLogin={handleLogin} />;
      return (
        <LeaderboardScene
          user={userData}
          onGoBack={() => navigateTo("guild-interior", "Returning to guild hall...")}
        />
      );

    case "quest-board":
      if (!userData) return <LoginScene onLogin={handleLogin} />;
      return (
        <QuestBoardScene
          user={userData}
          onTakeQuest={handleTakeQuest}
          onClose={() => navigateTo("guild-interior", "Returning to guild hall...")}
        />
      );

    case "submission":
      if (!userData || !selectedQuest)
        return <QuestBoardScene user={userData!} onTakeQuest={handleTakeQuest} onClose={() => navigateTo("guild-interior", "Returning...")} />;
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
