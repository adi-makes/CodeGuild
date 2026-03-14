"use client";

import { useState, useEffect } from "react";
import { UserData, RANK_NAMES, MAX_RANK } from "@/lib/types";
import HUD from "@/components/HUD";

const BACKEND_CORE_URL =
    process.env.NEXT_PUBLIC_BACKEND_CORE_URL || "http://localhost:3001";

const RANK_BADGES: Record<number, string> = {
    1: "🟤",
    2: "🔵",
    3: "🟣",
    4: "🟡",
    5: "🔴",
};

const RANK_COLORS: Record<number, string> = {
    1: "#a88b6a",
    2: "#60a5fa",
    3: "#c084fc",
    4: "#fbbf24",
    5: "#f87171",
};

interface LeaderboardUser {
    userId: string;
    displayName: string;
    rank: number;
    totalExp: number;
    completedQuests: string[];
}

interface LeaderboardSceneProps {
    user: UserData;
    onGoBack: () => void;
}

export default function LeaderboardScene({ user, onGoBack }: LeaderboardSceneProps) {
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterRank, setFilterRank] = useState<number | null>(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            setError(null);
            try {
                let url = `${BACKEND_CORE_URL}/api/users/leaderboard`;
                if (filterRank !== null) {
                    url += `?rank=${filterRank}`;
                }
                const res = await fetch(url);
                if (!res.ok) throw new Error(`Server returned ${res.status}`);
                const data: LeaderboardUser[] = await res.json();
                setLeaderboard(data);
            } catch (err) {
                setError("Could not load leaderboard. Make sure backend is running.");
                console.error("[LeaderboardScene]", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [filterRank]);

    const tabs = [
        { label: "🌐 Global", value: null },
        ...Array.from({ length: MAX_RANK }, (_, i) => ({
            label: `${RANK_BADGES[i + 1]} ${RANK_NAMES[i + 1]}`,
            value: i + 1,
        })),
    ];

    const getPositionLabel = (index: number) => {
        if (index === 0) return { text: "🥇", color: "#fbbf24" };
        if (index === 1) return { text: "🥈", color: "#94a3b8" };
        if (index === 2) return { text: "🥉", color: "#b45309" };
        return { text: `#${index + 1}`, color: "#aaa" };
    };

    return (
        <div
            style={{
                width: "100vw",
                minHeight: "100vh",
                background: "#080808",
                backgroundImage:
                    "linear-gradient(rgba(8,8,8,0.92), rgba(8,8,8,0.92)), url('/guild-interior.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                imageRendering: "pixelated",
                overflow: "auto",
                paddingBottom: "80px",
            }}
        >
            {/* Sticky Header */}
            <div
                style={{
                    background: "rgba(0,0,0,0.9)",
                    borderBottom: "4px solid #4ade80",
                    padding: "20px 40px",
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "16px",
                }}
            >
                <div>
                    <button
                        onClick={onGoBack}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "#888",
                            cursor: "pointer",
                            fontFamily: "var(--font-pixel), monospace",
                            fontSize: "8px",
                            padding: "0 0 10px 0",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#4ade80")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
                    >
                        ← Back to Guild Hall
                    </button>
                    <h1
                        style={{
                            fontFamily: "var(--font-pixel), monospace",
                            fontSize: "18px",
                            color: "#4ade80",
                            margin: 0,
                            textShadow: "3px 3px 0 #000",
                        }}
                    >
                        🏆 Hall of Legends
                    </h1>
                    <p style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "7px", color: "#aaa", margin: "6px 0 0" }}>
                        Top adventurers ranked by total EXP earned
                    </p>
                </div>

                {/* Rank Filter Tabs */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {tabs.map((tab) => {
                        const isActive = filterRank === tab.value;
                        return (
                            <button
                                key={tab.label}
                                onClick={() => setFilterRank(tab.value)}
                                style={{
                                    fontFamily: "var(--font-pixel), monospace",
                                    fontSize: "6px",
                                    padding: "8px 14px",
                                    background: isActive ? "#4ade80" : "rgba(255,255,255,0.07)",
                                    color: isActive ? "#000" : "#ddd",
                                    border: isActive ? "2px solid #22c55e" : "2px solid #333",
                                    cursor: "pointer",
                                    transition: "all 0.15s",
                                }}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div style={{ padding: "32px 40px", maxWidth: "900px", margin: "0 auto" }}>
                {error && (
                    <div
                        style={{
                            background: "rgba(220,38,38,0.15)",
                            border: "2px solid #ef4444",
                            padding: "16px",
                            marginBottom: "24px",
                            color: "#fca5a5",
                            fontFamily: "var(--font-pixel), monospace",
                            fontSize: "8px",
                        }}
                    >
                        ⚠ {error}
                    </div>
                )}

                {/* Table */}
                <div
                    style={{
                        background: "rgba(20, 12, 4, 0.97)",
                        border: "4px solid #4ade80",
                        boxShadow: "8px 8px 0 #000",
                    }}
                >
                    {/* Header Row */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "70px 1fr 140px 110px 100px",
                            gap: "12px",
                            padding: "14px 20px",
                            borderBottom: "2px solid #1a3a1a",
                            background: "rgba(0,0,0,0.5)",
                        }}
                    >
                        {["#", "Adventurer", "Guild Rank", "EXP", "Quests"].map((h) => (
                            <div key={h} style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "7px", color: "#4ade80", textTransform: "uppercase" }}>
                                {h}
                            </div>
                        ))}
                    </div>

                    {/* Rows */}
                    {loading ? (
                        <div style={{ padding: "60px 20px", textAlign: "center" }}>
                            <p style={{ fontFamily: "var(--font-pixel)", color: "#4ade80" }}>📜 Reading the scrolls...</p>
                        </div>
                    ) : leaderboard.length === 0 ? (
                        <div style={{ padding: "60px 20px", textAlign: "center" }}>
                            <p style={{ fontFamily: "var(--font-pixel)", color: "#555", fontSize: "8px" }}>No adventurers found for this rank.</p>
                        </div>
                    ) : (
                        leaderboard.map((lbUser, index) => {
                            const isCurrentUser = lbUser.userId === user.userId;
                            const { text: posLabel, color: posColor } = getPositionLabel(index);
                            const rankColor = RANK_COLORS[lbUser.rank] || "#aaa";
                            const questsDone = lbUser.completedQuests?.length ?? 0;

                            return (
                                <div
                                    key={lbUser.userId}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "70px 1fr 140px 110px 100px",
                                        gap: "12px",
                                        padding: "16px 20px",
                                        borderBottom: "1px solid #111",
                                        background: isCurrentUser
                                            ? "rgba(74,222,128,0.08)"
                                            : index % 2 === 0
                                                ? "rgba(255,255,255,0.02)"
                                                : "transparent",
                                        outline: isCurrentUser ? "2px solid #4ade80" : "none",
                                        alignItems: "center",
                                        transition: "background 0.15s",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isCurrentUser)
                                            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isCurrentUser)
                                            e.currentTarget.style.background =
                                                index % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent";
                                    }}
                                >
                                    {/* Position */}
                                    <div
                                        style={{
                                            fontFamily: "var(--font-pixel), monospace",
                                            fontSize: index < 3 ? "18px" : "12px",
                                            color: posColor,
                                        }}
                                    >
                                        {posLabel}
                                    </div>

                                    {/* Name */}
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <span
                                                style={{
                                                    fontFamily: "var(--font-pixel), monospace",
                                                    fontSize: "10px",
                                                    color: isCurrentUser ? "#4ade80" : "#fff",
                                                }}
                                            >
                                                {lbUser.displayName}
                                            </span>
                                            {isCurrentUser && (
                                                <span
                                                    style={{
                                                        fontFamily: "var(--font-pixel), monospace",
                                                        fontSize: "6px",
                                                        color: "#4ade80",
                                                        background: "rgba(74,222,128,0.2)",
                                                        padding: "2px 6px",
                                                        border: "1px solid #4ade80",
                                                    }}
                                                >
                                                    YOU
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Guild Rank */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <span style={{ fontSize: "12px" }}>{RANK_BADGES[lbUser.rank] || "⚪"}</span>
                                        <span
                                            style={{
                                                fontFamily: "var(--font-pixel), monospace",
                                                fontSize: "7px",
                                                color: rankColor,
                                            }}
                                        >
                                            {RANK_NAMES[lbUser.rank] || `Rank ${lbUser.rank}`}
                                        </span>
                                    </div>

                                    {/* EXP */}
                                    <div
                                        style={{
                                            fontFamily: "var(--font-pixel), monospace",
                                            fontSize: "11px",
                                            color: "#4ade80",
                                        }}
                                    >
                                        {lbUser.totalExp.toLocaleString()} ✨
                                    </div>

                                    {/* Quests Done */}
                                    <div
                                        style={{
                                            fontFamily: "var(--font-pixel), monospace",
                                            fontSize: "10px",
                                            color: "#f5c842",
                                        }}
                                    >
                                        {questsDone} 📜
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <HUD user={user} />
        </div>
    );
}
