"use client";

import { UserData, RANK_NAMES, RANK_EXP, MAX_RANK } from "@/lib/types";
import Image from "next/image";

interface HUDProps {
    user: UserData;
}

export default function HUD({ user }: HUDProps) {
    const currentRankName = RANK_NAMES[user.rank] || "Novice";
    const currentRankMin = RANK_EXP[user.rank] || 0;
    const nextRankMin = user.rank < MAX_RANK ? RANK_EXP[user.rank + 1] : null;

    const expInThisRank = user.totalExp - currentRankMin;
    const expNeededForNext = nextRankMin ? nextRankMin - currentRankMin : 1;
    const progress =
        nextRankMin !== null
            ? Math.min(100, Math.floor((expInThisRank / expNeededForNext) * 100))
            : 100;

    return (
        <div
            style={{
                position: "fixed",
                top: "16px",
                right: "16px",
                zIndex: 100,
                background: "rgba(26, 16, 8, 0.95)",
                border: "3px solid #f5c842",
                boxShadow: "4px 4px 0 #5c3317",
                padding: "12px 16px",
                minWidth: "220px",
                maxWidth: "260px",
            }}
        >
            {/* Avatar + Name row */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <div
                    style={{
                        width: "40px",
                        height: "40px",
                        background: "#1a1008",
                        border: "2px solid #f5c842",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        overflow: "hidden",
                    }}
                >
                    <Image
                        src="/char.png"
                        alt="avatar"
                        width={36}
                        height={36}
                        style={{ imageRendering: "pixelated" }}
                    />
                </div>
                <div>
                    <p
                        style={{
                            fontFamily: "var(--font-pixel), monospace",
                            fontSize: "7px",
                            color: "#f5c842",
                            margin: 0,
                            lineHeight: 1.6,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "140px",
                        }}
                    >
                        {user.displayName.length > 14
                            ? user.displayName.slice(0, 11) + "..."
                            : user.displayName}
                    </p>
                    <p
                        style={{
                            fontFamily: "var(--font-pixel), monospace",
                            fontSize: "7px",
                            color: "#aaa",
                            margin: 0,
                            lineHeight: 1.6,
                        }}
                    >
                        Rank {user.rank} — {currentRankName}
                    </p>
                </div>
            </div>

            {/* EXP numbers */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "4px",
                }}
            >
                <span
                    style={{
                        fontFamily: "var(--font-pixel), monospace",
                        fontSize: "7px",
                        color: "#4ade80",
                    }}
                >
                    EXP: {user.totalExp}
                </span>
                {nextRankMin !== null && (
                    <span
                        style={{
                            fontFamily: "var(--font-pixel), monospace",
                            fontSize: "7px",
                            color: "#888",
                        }}
                    >
                        / {nextRankMin}
                    </span>
                )}
                {nextRankMin === null && (
                    <span
                        style={{
                            fontFamily: "var(--font-pixel), monospace",
                            fontSize: "7px",
                            color: "#f5c842",
                        }}
                    >
                        MAX
                    </span>
                )}
            </div>

            {/* EXP Progress Bar */}
            <div
                style={{
                    height: "8px",
                    background: "#1a2e1a",
                    border: "1px solid #4ade80",
                    overflow: "hidden",
                }}
            >
                <div
                    className="exp-bar-fill"
                    style={{
                        height: "100%",
                        width: `${progress}%`,
                        transition: "width 0.8s ease-out",
                    }}
                />
            </div>
            {nextRankMin !== null && (
                <p
                    style={{
                        fontFamily: "var(--font-pixel), monospace",
                        fontSize: "6px",
                        color: "#888",
                        margin: "4px 0 0",
                        textAlign: "right",
                    }}
                >
                    {nextRankMin - user.totalExp} to {RANK_NAMES[user.rank + 1]}
                </p>
            )}
        </div>
    );
}
