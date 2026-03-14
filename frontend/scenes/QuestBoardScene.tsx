"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { Quest, UserData, RANK_NAMES } from "@/lib/types";
import HUD from "@/components/HUD";

const BACKEND_CORE_URL =
    process.env.NEXT_PUBLIC_BACKEND_CORE_URL || "http://localhost:3001";

interface QuestBoardSceneProps {
    user: UserData;
    onTakeQuest: (quest: Quest) => void;
    onClose: () => void;
}

function StarRating({ count }: { count: number }) {
    return (
        <span>
            {Array.from({ length: 5 }).map((_, i) => (
                <span
                    key={i}
                    style={{
                        color: i < count ? "#f5c842" : "#333",
                        fontSize: "16px",
                    }}
                >
                    ★
                </span>
            ))}
        </span>
    );
}

export default function QuestBoardScene({
    user,
    onTakeQuest,
    onClose,
}: QuestBoardSceneProps) {
    const [quests, setQuests] = useState<Quest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rankFilter, setRankFilter] = useState<number>(user.rank);

    useEffect(() => {
        const fetchQuests = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${BACKEND_CORE_URL}/api/quests`);
                if (!res.ok) throw new Error("Failed to fetch quests");
                const data: Quest[] = await res.json();
                setQuests(data);
            } catch (err) {
                setError("Could not load quests. Check your connection.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchQuests();
    }, []);

    const filteredQuests =
        rankFilter > 0
            ? quests.filter((q) => q.requiredRank <= rankFilter)
            : quests;

    const allRanks = [1, 2, 3, 4, 5].filter((r) => r <= user.rank);

    return (
        <div
            style={{
                width: "100vw",
                minHeight: "100vh",
                background: "#2c1a0e",
                backgroundImage:
                    "repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(245,200,66,0.04) 32px), repeating-linear-gradient(90deg, transparent, transparent 31px, rgba(245,200,66,0.04) 32px)",
                overflow: "auto",
                paddingBottom: "40px",
            }}
        >
            {/* Board header */}
            <div
                style={{
                    background: "linear-gradient(180deg, #5c3317 0%, #3a1f0a 100%)",
                    borderBottom: "4px solid #f5c842",
                    padding: "24px 40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "16px",
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <button
                        className="pixel-btn"
                        onClick={onClose}
                        style={{ fontSize: "10px", padding: "10px 16px" }}
                    >
                        ← Back
                    </button>
                    <div>
                        <h1
                            style={{
                                fontFamily: "var(--font-pixel), monospace",
                                fontSize: "20px",
                                color: "#f5c842",
                                margin: "0 0 6px",
                                textShadow: "3px 3px 0 #3a1f0a",
                            }}
                        >
                            ⚔ Quest Board
                        </h1>
                        <p
                            style={{
                                fontFamily: "var(--font-pixel), monospace",
                                fontSize: "11px",
                                color: "#a88b6a",
                                margin: 0,
                            }}
                        >
                            Take a quest, submit code, earn EXP
                        </p>
                    </div>
                </div>

                {/* Rank filter */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <label
                        style={{
                            fontFamily: "var(--font-pixel), monospace",
                            fontSize: "11px",
                            color: "#f5c842",
                        }}
                    >
                        Filter by Rank:
                    </label>
                    <select
                        value={rankFilter}
                        onChange={(e) => setRankFilter(Number(e.target.value))}
                        style={{
                            fontFamily: "var(--font-pixel), monospace",
                            fontSize: "12px",
                            background: "#1a1008",
                            color: "#f5c842",
                            border: "2px solid #f5c842",
                            padding: "6px 10px",
                            cursor: "pointer",
                            outline: "none",
                        }}
                    >
                        {allRanks.map((r) => (
                            <option key={r} value={r}>
                                {RANK_NAMES[r]}
                            </option>
                        ))}
                        <option value={5}>All Quests</option>
                    </select>
                </div>
            </div>

            {/* Board content */}
            <div style={{ padding: "32px 40px" }}>
                {loading && (
                    <div style={{ textAlign: "center", paddingTop: "80px" }}>
                        <p
                            style={{
                                fontFamily: "var(--font-pixel), monospace",
                                fontSize: "14px",
                                color: "#f5c842",
                            }}
                        >
                            Loading quests...
                        </p>
                    </div>
                )}

                {error && (
                    <div style={{ textAlign: "center", paddingTop: "80px" }}>
                        <p
                            style={{
                                fontFamily: "var(--font-pixel), monospace",
                                fontSize: "13px",
                                color: "#c0392b",
                            }}
                        >
                            ⚠ {error}
                        </p>
                    </div>
                )}

                {!loading && !error && (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                            gap: "24px",
                        }}
                    >
                        {quests.map((quest) => {
                            const locked = quest.requiredRank > user.rank;
                            const hiddenByFilter = quest.requiredRank > rankFilter;
                            if (hiddenByFilter) return null;

                            return (
                                <div
                                    key={quest.id}
                                    style={{
                                        background: locked
                                            ? "rgba(26, 16, 8, 0.6)"
                                            : "rgba(26, 16, 8, 0.92)",
                                        border: `3px solid ${locked ? "#444" : "#f5c842"}`,
                                        boxShadow: locked
                                            ? "none"
                                            : "6px 6px 0 #5c3317",
                                        padding: "20px",
                                        opacity: locked ? 0.55 : 1,
                                        position: "relative",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "12px",
                                    }}
                                >
                                    {/* Lock icon */}
                                    {locked && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: "12px",
                                                right: "12px",
                                                fontSize: "24px",
                                            }}
                                        >
                                            🔒
                                        </div>
                                    )}

                                    {/* Quest title */}
                                    <h2
                                        style={{
                                            fontFamily: "var(--font-pixel), monospace",
                                            fontSize: "14px",
                                            color: locked ? "#888" : "#f5c842",
                                            margin: 0,
                                            lineHeight: 1.6,
                                            paddingRight: locked ? "30px" : "0",
                                        }}
                                    >
                                        {quest.title}
                                    </h2>

                                    {/* Description */}
                                    <p
                                        style={{
                                            fontFamily: "var(--font-pixel), monospace",
                                            fontSize: "10px",
                                            color: locked ? "#666" : "#c4a882",
                                            margin: 0,
                                            lineHeight: 2,
                                            flexGrow: 1,
                                        }}
                                    >
                                        {quest.description.slice(0, 120)}
                                        {quest.description.length > 120 ? "..." : ""}
                                    </p>

                                    {/* Stars & rank */}
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <StarRating count={quest.difficulty} />
                                        <span
                                            style={{
                                                fontFamily: "var(--font-pixel), monospace",
                                                fontSize: "10px",
                                                color: locked ? "#666" : "#a88b6a",
                                            }}
                                        >
                                            Rank {quest.requiredRank} Required
                                        </span>
                                    </div>

                                    {/* EXP reward */}
                                    <div
                                        style={{
                                            background: locked ? "#111" : "#0d2010",
                                            border: `1px solid ${locked ? "#333" : "#4ade80"}`,
                                            padding: "6px 10px",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        <span style={{ fontSize: "16px" }}>⚡</span>
                                        <span
                                            style={{
                                                fontFamily: "var(--font-pixel), monospace",
                                                fontSize: "11px",
                                                color: locked ? "#555" : "#4ade80",
                                            }}
                                        >
                                            {quest.expReward} EXP
                                        </span>
                                    </div>

                                    {/* Button / locked state */}
                                    {locked ? (
                                        <div
                                            style={{
                                                fontFamily: "var(--font-pixel), monospace",
                                                fontSize: "11px",
                                                color: "#666",
                                                textAlign: "center",
                                                padding: "10px",
                                                border: "2px solid #444",
                                            }}
                                        >
                                            🔒 Rank {quest.requiredRank} Required
                                        </div>
                                    ) : (
                                        <button
                                            className="pixel-btn"
                                            onClick={() => onTakeQuest(quest)}
                                            style={{ fontSize: "12px", padding: "10px 16px", width: "100%" }}
                                        >
                                            Take Quest →
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <HUD user={user} />
        </div>
    );
}
