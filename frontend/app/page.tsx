"use client";

import { useState, useCallback, useEffect } from "react";
<<<<<<< HEAD
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Quest, Scene, UserData } from "@/lib/types";
=======
import { Quest, Scene, UserData, Room } from "@/lib/types";
>>>>>>> 4584dfc (1V1,AND LEAderboard done)
import LoadingScreen from "@/components/LoadingScreen";
import LoginScene from "@/scenes/LoginScene";
import TownScene from "@/scenes/TownScene";
import GuildInteriorScene from "@/scenes/GuildInteriorScene";
import QuestBoardScene from "@/scenes/QuestBoardScene";
import SubmissionScene from "@/scenes/SubmissionScene";
import LeaderboardScene from "@/scenes/LeaderboardScene";
import OneVOneScene from "@/scenes/OneVOneScene";

const LOADING_DURATION_MS = 1500;
const BACKEND_CORE_URL =
  process.env.NEXT_PUBLIC_BACKEND_CORE_URL || "http://localhost:3001";

export default function Home() {
  const [scene, setScene] = useState<Scene>("login");
  const [isLoading, setIsLoading] = useState(true); // START TRUE to check auth state first
  const [loadingMessage, setLoadingMessage] = useState("Checking guild records...");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [allQuests, setAllQuests] = useState<Quest[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_CORE_URL || "http://localhost:3001"}/api/quests`)
      .then(res => res.json())
      .then(data => setAllQuests(data))
      .catch(err => console.error("Failed to pre-fetch quests", err));
  }, []);

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
    setActiveRoom(null);
    navigateTo("quest-board", "Returning to quest board...");
  }, [navigateTo]);

  const handleStartOneVOne = useCallback((room: Room) => {
    const quest = allQuests.find(q => q.id === room.questId);
    setActiveRoom(room);
    if (quest) {
      setSelectedQuest(quest);
      navigateTo("submission", "Battle starting! Prepare your code...");
    } else {
      navigateTo("quest-board", "Error loading quest...");
    }
  }, [allQuests, navigateTo]);

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
          onGoToOneVOne={() => navigateTo("one-v-one", "Entering 1v1 lobby...")}
          onClose={() => navigateTo("guild-interior", "Returning to guild hall...")}
        />
      );

    case "one-v-one":
      if (!userData) return <LoginScene onLogin={handleLogin} />;
      return (
        <OneVOneScene
          user={userData}
          onStartGame={handleStartOneVOne}
          onCancel={() => navigateTo("quest-board", "Returning to quest board...")}
        />
      );

    case "submission":
      if (!userData || !selectedQuest)
        return <QuestBoardScene user={userData!} onTakeQuest={handleTakeQuest} onGoToOneVOne={() => navigateTo("one-v-one", "Entering lobby...")} onClose={() => navigateTo("guild-interior", "Returning...")} />;
      return (
        <SubmissionScene
          user={userData}
          quest={selectedQuest}
          room={activeRoom}
          onUpdateUser={handleUpdateUser}
          onBackToQuestBoard={handleBackToQuestBoard}
        />
      );

    default:
      return <LoginScene onLogin={handleLogin} />;
  }
}
