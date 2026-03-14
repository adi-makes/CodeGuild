"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { Quest, UserData, EvalResult, RANK_NAMES, Room } from "@/lib/types";
import HUD from "@/components/HUD";

const BACKEND_CORE_URL =
    process.env.NEXT_PUBLIC_BACKEND_CORE_URL || "http://localhost:3001";

interface SubmissionSceneProps {
    user: UserData;
    quest: Quest;
    room?: Room | null;
    onUpdateUser: (updated: UserData) => void;
    onBackToQuestBoard: () => void;
}

export default function SubmissionScene({
    user,
    quest,
    room,
    onUpdateUser,
    onBackToQuestBoard,
}: SubmissionSceneProps) {
    const [currentRoom, setCurrentRoom] = useState<Room | null>(room || null);
    const [isWaitingForOpponent, setIsWaitingForOpponent] = useState(false);
    const [battleSummary, setBattleSummary] = useState<Room | null>(null);

    const [code, setCode] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<EvalResult | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Updated user state for HUD real-time updates after submission
    const [currentUser, setCurrentUser] = useState<UserData>(user);

    // Poll for battle end if we finished but opponent hasn't
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isWaitingForOpponent && currentRoom) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`${BACKEND_CORE_URL}/api/rooms/status/${currentRoom.id}`);
                    if (res.ok) {
                        const updated: Room = await res.json();
                        setCurrentRoom(updated);
                        if (updated.status === "finished") {
                            setBattleSummary(updated);
                            setIsWaitingForOpponent(false);
                        } else if (updated.status === "cancelled") {
                            setIsWaitingForOpponent(false);
                            onBackToQuestBoard();
                        }
                    }
                } catch (err) {
                    console.error("Poll error", err);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isWaitingForOpponent, currentRoom, onBackToQuestBoard]);

    const handleSubmit = async () => {
        if (!code.trim()) {
            setSubmitError("Please paste your code before submitting.");
            return;
        }
        setSubmitting(true);
        setSubmitError(null);
        setResult(null);

        try {
            // If in a room, use specialized battle submission endpoint
            if (currentRoom) {
                const res = await fetch(`${BACKEND_CORE_URL}/api/rooms/submit-code`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        roomId: currentRoom.id,
                        userId: user.userId,
                        code: code
                    })
                });
                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || "Failed to sync code.");
                }
                setIsWaitingForOpponent(true);
            } else {
                // NORMAL SINGLE PLAYER FLOW
                const firebaseUser = auth.currentUser;
                if (!firebaseUser) throw new Error("Not logged in");
                const idToken = await firebaseUser.getIdToken();

                const res = await fetch(`${BACKEND_CORE_URL}/api/submit`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({
                        userId: user.userId,
                        questId: quest.id,
                        code,
                        isDaily: quest.isDaily,
                    }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Submission failed");

                const evalResult: EvalResult = data;
                setResult(evalResult);

                // Update user state for HUD
                const updatedUser: UserData = {
                    ...currentUser,
                    totalExp: evalResult.newTotalExp,
                    rank: evalResult.newRank,
                };
                setCurrentUser(updatedUser);
                onUpdateUser(updatedUser);
            }
        } catch (err: any) {
            console.error("Submit error:", err);
            setSubmitError(err.message || "Submission failed. Try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleQuitBattle = async () => {
        if (!currentRoom) return;
        try {
            await fetch(`${BACKEND_CORE_URL}/api/rooms/quit-battle`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roomId: currentRoom.id, userId: user.userId })
            });
            onBackToQuestBoard();
        } catch (err) {
            console.error("Quit error", err);
            onBackToQuestBoard();
        }
    };

    const scoreColor =
        result !== null
            ? result.score >= 90
                ? "#4ade80"
                : result.score >= 75
                    ? "#84cc16"
                    : result.score >= 60
                        ? "#eab308"
                        : "#c0392b"
            : "#fff";

    return (
        <div
            style={{
                width: "100vw",
                minHeight: "100vh",
                background: "#1a1008",
                backgroundImage:
                    "repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(245,200,66,0.03) 32px)",
                overflow: "auto",
                paddingBottom: "60px",
            }}
        >
            {/* Header */}
            <div
                style={{
                    background: "linear-gradient(180deg, #5c3317 0%, #3a1f0a 100%)",
                    borderBottom: "4px solid #f5c842",
                    padding: "20px 40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                    <button
                        className="pixel-btn"
                        onClick={onBackToQuestBoard}
                        style={{ fontSize: "10px", padding: "10px 16px" }}
                    >
                        ← BACK
                    </button>
                    <div>
                        <h1
                            style={{
                                fontFamily: "var(--font-pixel), monospace",
                                fontSize: "18px",
                                color: "#f5c842",
                                margin: "0 0 4px",
                            }}
                        >
                            {quest.requiredRank}.Quest 2: {quest.title}
                        </h1>
                        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                            <span
                                style={{
                                    fontFamily: "var(--font-pixel), monospace",
                                    fontSize: "11px",
                                    color: "#a88b6a",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                }}
                            >
                                ⚡ {quest.expReward} EXP
                            </span>
                            <span style={{ color: "#555" }}>•</span>
                            <span
                                style={{
                                    fontFamily: "var(--font-pixel), monospace",
                                    fontSize: "11px",
                                    color: "#a88b6a",
                                }}
                            >
                                Rank {quest.requiredRank} Quest
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: "900px", margin: "40px auto", padding: "0 20px" }}>
                {/* Description card */}
                <div
                    style={{
                        background: "rgba(26, 16, 8, 0.6)",
                        border: "1px solid #5c3317",
                        padding: "30px",
                        marginBottom: "30px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            marginBottom: "16px",
                        }}
                    >
                        <span style={{ fontSize: "20px" }}>📜</span>
                        <h2
                            style={{
                                fontFamily: "var(--font-pixel), monospace",
                                fontSize: "16px",
                                color: "#f5c842",
                                margin: 0,
                            }}
                        >
                            Quest Description
                        </h2>
                    </div>
                    <p
                        style={{
                            fontFamily: "var(--font-pixel), monospace",
                            fontSize: "13px",
                            color: "#c4a882",
                            lineHeight: 1.8,
                            margin: 0,
                        }}
                    >
                        {quest.description}
                    </p>
                </div>

                {/* Main area: Editor or Results */}
                {!result ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                color: "#a88b6a",
                                fontFamily: "var(--font-pixel), monospace",
                                fontSize: "12px",
                            }}
                        >
                            <span style={{ fontSize: "16px" }}>💻</span>
                            Your Solution:
                        </div>

                        <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="// Paste your code here..."
                            style={{
                                width: "100%",
                                height: "300px",
                                background: "#000",
                                border: "4px solid #f5c842",
                                color: "#4ade80",
                                fontFamily: "monospace",
                                fontSize: "14px",
                                padding: "20px",
                                outline: "none",
                                resize: "none",
                            }}
                        />

                        {submitError && (
                            <p
                                style={{
                                    fontFamily: "var(--font-pixel), monospace",
                                    fontSize: "12px",
                                    color: "#c0392b",
                                    margin: 0,
                                }}
                            >
                                ⚠ {submitError}
                            </p>
                        )}

                        <button
                            className="pixel-btn"
                            disabled={submitting}
                            onClick={handleSubmit}
                            style={{
                                fontSize: "14px",
                                padding: "16px 32px",
                                width: "fit-content",
                                opacity: submitting ? 0.7 : 1,
                            }}
                        >
                            {submitting ? "EVALUATING..." : "SUBMIT FOR EVALUATION ⚔"}
                        </button>

                        {user.rank < quest.requiredRank && (
                            <p
                                style={{
                                    fontFamily: "var(--font-pixel), monospace",
                                    fontSize: "11px",
                                    color: "#c0392b",
                                    margin: 0,
                                }}
                            >
                                ⚠ This quest requires Rank {quest.requiredRank}. You are Rank{" "}
                                {user.rank}.
                            </p>
                        )}
                    </div>
                ) : (
                    /* Evaluation results view */
                    <div
                        style={{
                            background: "rgba(26, 16, 8, 0.9)",
                            border: "4px solid #f5c842",
                            padding: "40px",
                            boxShadow: "10px 10px 0 #3a1f0a",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                marginBottom: "30px",
                            }}
                        >
                            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                                <span
                                    style={{
                                        fontFamily: "var(--font-pixel), monospace",
                                        fontSize: "48px",
                                        color: scoreColor,
                                        lineHeight: 1,
                                    }}
                                >
                                    {result.score}
                                </span>
                                <span
                                    style={{
                                        fontFamily: "var(--font-pixel), monospace",
                                        fontSize: "11px",
                                        color: "#888",
                                        marginTop: "4px",
                                    }}
                                >
                                    / 100
                                </span>
                            </div>

                            <div>
                                <p
                                    style={{
                                        fontFamily: "var(--font-pixel), monospace",
                                        fontSize: "16px",
                                        color: result.accepted ? "#4ade80" : "#c0392b",
                                        margin: "0 0 8px",
                                    }}
                                >
                                    {result.accepted ? "✓ Submission Accepted!" : "✗ Submission Rejected"}
                                </p>
                                <p
                                    style={{
                                        fontFamily: "var(--font-pixel), monospace",
                                        fontSize: "12px",
                                        color: result.accepted ? "#4ade80" : "#888",
                                        margin: "0 0 4px",
                                    }}
                                >
                                    {result.accepted
                                        ? `+${result.expEarned} EXP earned!`
                                        : "Score below 60 — no EXP awarded"}
                                </p>
                                {result.newRank > user.rank && (
                                    <p
                                        style={{
                                            fontFamily: "var(--font-pixel), monospace",
                                            fontSize: "13px",
                                            color: "#f5c842",
                                            margin: "8px 0 0",
                                        }}
                                    >
                                        🎉 RANK UP! You are now {RANK_NAMES[result.newRank]}!
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Divider */}
                        <div
                            style={{
                                height: "2px",
                                background:
                                    "linear-gradient(90deg, transparent, #f5c842, transparent)",
                                marginBottom: "20px",
                            }}
                        />

                        {/* Feedback */}
                        <div style={{ marginBottom: "20px" }}>
                            <h3
                                style={{
                                    fontFamily: "var(--font-pixel), monospace",
                                    fontSize: "12px",
                                    color: "#f5c842",
                                    margin: "0 0 10px",
                                }}
                            >
                                📋 Evaluator Feedback:
                            </h3>
                            <p
                                style={{
                                    fontFamily: "var(--font-pixel), monospace",
                                    fontSize: "11px",
                                    color: "#c4a882",
                                    lineHeight: 2.2,
                                    margin: 0,
                                    background: "rgba(0,0,0,0.3)",
                                    padding: "12px 16px",
                                    border: "1px solid #5c3317",
                                }}
                            >
                                {result.feedback}
                            </p>
                        </div>

                        {/* Flags */}
                        {result.flags && result.flags.length > 0 && (
                            <div style={{ marginBottom: "24px" }}>
                                <h3
                                    style={{
                                        fontFamily: "var(--font-pixel), monospace",
                                        fontSize: "12px",
                                        color: "#eab308",
                                        margin: "0 0 10px",
                                    }}
                                >
                                    ⚠ Issues Found:
                                </h3>
                                <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
                                    {result.flags.map((flag, i) => (
                                        <li
                                            key={i}
                                            style={{
                                                fontFamily: "var(--font-pixel), monospace",
                                                fontSize: "10px",
                                                color: "#eab308",
                                                lineHeight: 2.5,
                                                marginBottom: "4px",
                                            }}
                                        >
                                            {flag}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Return button */}
                        <div style={{ display: "flex", gap: "15px" }}>
                            <button
                                className="pixel-btn"
                                onClick={onBackToQuestBoard}
                                style={{ fontSize: "12px", padding: "12px 24px" }}
                            >
                                ← Return to Quest Board
                            </button>
                            {!room && (
                                <button
                                    className="pixel-btn"
                                    onClick={() => setResult(null)}
                                    style={{ fontSize: "12px", padding: "12px 24px", background: "#3a1f0a" }}
                                >
                                    Try Again
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Battle Waiting Overlay */}
            {isWaitingForOpponent && !battleSummary && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                    <div className="spinner" style={{ width: "40px", height: "40px", border: "4px solid rgba(245,200,66,0.1)", borderTopColor: "#f5c842", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "20px" }} />
                    <p style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "16px", color: "#f5c842", marginBottom: "30px" }}>Waiting for opponent to finish...</p>
                    <button
                        className="pixel-btn"
                        onClick={handleQuitBattle}
                        style={{ background: "#8b0000", borderColor: "#ff4d4d", fontSize: "12px" }}
                    >
                        Quit Battle
                    </button>
                </div>
            )}

            {/* Battle Summary Overlay */}
            {battleSummary && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(10,10,10,0.98)", zIndex: 200, overflowY: "auto", padding: "40px 20px" }}>
                    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                        <h1 style={{ textAlign: "center", color: "#f5c842", fontSize: "32px", marginBottom: "40px", textShadow: "4px 4px 0 #000" }}>
                            {battleSummary.winnerId === user.userId ? "🏆 VICTORY!" : battleSummary.winnerId ? "💀 DEFEAT" : "⚖ DRAW"}
                        </h1>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
                            {/* Creator Side */}
                            <div style={{ background: "rgba(26,16,8,0.8)", border: "3px solid #f5c842", padding: "20px" }}>
                                <h2 style={{ color: "#f5c842", fontSize: "18px", marginBottom: "10px" }}>
                                    {battleSummary.creatorId === user.userId ? "YOU (Creator)" : "OPPONENT (Creator)"}
                                </h2>
                                <div style={{ background: "#000", padding: "15px", height: "300px", overflow: "auto", border: "1px solid #333", marginBottom: "15px" }}>
                                    <pre style={{ color: "#4ade80", fontSize: "12px", margin: 0 }}>{battleSummary.creatorCode}</pre>
                                </div>
                                <p style={{ color: "#888" }}>Score: <span style={{ color: "#fff" }}>{battleSummary.creatorResult?.score}</span></p>
                                <p style={{ color: "#888" }}>EXP: <span style={{ color: "#4ade80" }}>+{battleSummary.creatorResult?.expEarned}</span></p>
                                <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px", marginTop: "10px", border: "1px solid #5c3317" }}>
                                    <p style={{ color: "#f5c842", fontSize: "11px", margin: "0 0 5px" }}>Review:</p>
                                    <p style={{ color: "#c4a882", fontSize: "10px", margin: 0, lineHeight: 1.5 }}>{battleSummary.creatorResult?.feedback}</p>
                                </div>
                            </div>

                            {/* Joiner Side */}
                            <div style={{ background: "rgba(26,16,8,0.8)", border: "3px solid #f5c842", padding: "20px" }}>
                                <h2 style={{ color: "#f5c842", fontSize: "18px", marginBottom: "10px" }}>
                                    {battleSummary.joinerId === user.userId ? "YOU (Joiner)" : "OPPONENT (Joiner)"}
                                </h2>
                                <div style={{ background: "#000", padding: "15px", height: "300px", overflow: "auto", border: "1px solid #333", marginBottom: "15px" }}>
                                    <pre style={{ color: "#4ade80", fontSize: "12px", margin: 0 }}>{battleSummary.joinerCode}</pre>
                                </div>
                                <p style={{ color: "#888" }}>Score: <span style={{ color: "#fff" }}>{battleSummary.joinerResult?.score}</span></p>
                                <p style={{ color: "#888" }}>EXP: <span style={{ color: "#4ade80" }}>+{battleSummary.joinerResult?.expEarned}</span></p>
                                <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px", marginTop: "10px", border: "1px solid #5c3317" }}>
                                    <p style={{ color: "#f5c842", fontSize: "11px", margin: "0 0 5px" }}>Review:</p>
                                    <p style={{ color: "#c4a882", fontSize: "10px", margin: 0, lineHeight: 1.5 }}>{battleSummary.joinerResult?.feedback}</p>
                                </div>
                            </div>
                        </div>

                        <div style={{ textAlign: "center", marginTop: "40px" }}>
                            <button className="pixel-btn" onClick={onBackToQuestBoard}>Return to Town</button>
                        </div>
                    </div>
                </div>
            )}

            <HUD user={currentUser} />
        </div>
    );
}
