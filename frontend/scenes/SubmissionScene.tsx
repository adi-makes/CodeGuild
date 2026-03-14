"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { Quest, UserData, EvalResult, RANK_NAMES } from "@/lib/types";
import HUD from "@/components/HUD";

const BACKEND_CORE_URL =
    process.env.NEXT_PUBLIC_BACKEND_CORE_URL || "http://localhost:3001";

interface SubmissionSceneProps {
    user: UserData;
    quest: Quest;
    onUpdateUser: (updated: UserData) => void;
    onBackToQuestBoard: () => void;
}

export default function SubmissionScene({
    user,
    quest,
    onUpdateUser,
    onBackToQuestBoard,
}: SubmissionSceneProps) {
    const [code, setCode] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<EvalResult | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Updated user state for HUD real-time updates after submission
    const [currentUser, setCurrentUser] = useState<UserData>(user);

    const handleSubmit = async () => {
        if (!code.trim()) {
            setSubmitError("Please paste your code before submitting.");
            return;
        }
        setSubmitting(true);
        setSubmitError(null);
        setResult(null);

        try {
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
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Submission failed");

            const evalResult: EvalResult = data;
            setResult(evalResult);

            // Update user state in real-time
            const updatedUser: UserData = {
                ...currentUser,
                totalExp: evalResult.newTotalExp,
                rank: evalResult.newRank,
            };
            setCurrentUser(updatedUser);
            onUpdateUser(updatedUser);
        } catch (err) {
            console.error("Submit error:", err);
            setSubmitError(
                err instanceof Error ? err.message : "Submission failed. Try again."
            );
        } finally {
            setSubmitting(false);
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
                    gap: "16px",
                }}
            >
                <button
                    className="pixel-btn"
                    onClick={onBackToQuestBoard}
                    style={{ fontSize: "10px", padding: "10px 16px" }}
                >
                    ← Back
                </button>
                <div>
                    <h1
                        style={{
                            fontFamily: "var(--font-pixel), monospace",
                            fontSize: "16px",
                            color: "#f5c842",
                            margin: "0 0 4px",
                            textShadow: "2px 2px 0 #3a1f0a",
                        }}
                    >
                        {quest.title}
                    </h1>
                    <p
                        style={{
                            fontFamily: "var(--font-pixel), monospace",
                            fontSize: "11px",
                            color: "#a88b6a",
                            margin: 0,
                        }}
                    >
                        ⚡ {quest.expReward} EXP &nbsp;•&nbsp; Rank {quest.requiredRank} Quest
                    </p>
                </div>
            </div>

            <div style={{ padding: "32px 40px", maxWidth: "900px", margin: "0 auto" }}>
                {/* Quest description */}
                <div
                    style={{
                        background: "rgba(92, 51, 23, 0.25)",
                        border: "2px solid #5c3317",
                        padding: "20px 24px",
                        marginBottom: "24px",
                    }}
                >
                    <h2
                        style={{
                            fontFamily: "var(--font-pixel), monospace",
                            fontSize: "13px",
                            color: "#f5c842",
                            margin: "0 0 12px",
                        }}
                    >
                        📜 Quest Description
                    </h2>
                    <p
                        style={{
                            fontFamily: "var(--font-pixel), monospace",
                            fontSize: "11px",
                            color: "#c4a882",
                            lineHeight: 2.2,
                            margin: 0,
                        }}
                    >
                        {quest.description}
                    </p>
                </div>

                {/* Code editor */}
                <div style={{ marginBottom: "20px" }}>
                    <label
                        style={{
                            display: "block",
                            fontFamily: "var(--font-pixel), monospace",
                            fontSize: "12px",
                            color: "#f5c842",
                            marginBottom: "8px",
                        }}
                    >
                        💻 Your Solution:
                    </label>
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        disabled={submitting || result !== null}
                        placeholder="// Paste your code solution here..."
                        style={{
                            width: "100%",
                            minHeight: "280px",
                            background: "#0d0d0d",
                            border: "3px solid #333",
                            borderColor: code ? "#f5c842" : "#333",
                            color: "#e8e8e8",
                            fontFamily: "'Courier New', Courier, monospace",
                            fontSize: "17px",
                            lineHeight: 1.6,
                            padding: "16px",
                            resize: "vertical",
                            outline: "none",
                            boxSizing: "border-box",
                            transition: "border-color 0.2s",
                        }}
                    />
                </div>

                {/* Submit button */}
                {result === null && (
                    <button
                        className="pixel-btn"
                        onClick={handleSubmit}
                        disabled={submitting || !code.trim()}
                        style={{ fontSize: "13px", padding: "14px 28px" }}
                    >
                        {submitting ? "Evaluating your code..." : "Submit for Evaluation ⚔"}
                    </button>
                )}

                {/* Submitting loading state */}
                {submitting && (
                    <div
                        style={{
                            marginTop: "24px",
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                        }}
                    >
                        <div className="loading-dot" />
                        <div className="loading-dot" />
                        <div className="loading-dot" />
                        <span
                            style={{
                                fontFamily: "var(--font-pixel), monospace",
                                fontSize: "12px",
                                color: "#a88b6a",
                            }}
                        >
                            The guild scholar is reviewing your code...
                        </span>
                    </div>
                )}

                {/* Submit error */}
                {submitError && (
                    <p
                        style={{
                            fontFamily: "var(--font-pixel), monospace",
                            fontSize: "11px",
                            color: "#c0392b",
                            marginTop: "16px",
                            lineHeight: 2,
                        }}
                    >
                        ⚠ {submitError}
                    </p>
                )}

                {/* === Result Panel === */}
                {result !== null && (
                    <div
                        style={{
                            marginTop: "32px",
                            background: "rgba(26, 16, 8, 0.97)",
                            border: `4px solid ${result.accepted ? "#4ade80" : "#c0392b"}`,
                            boxShadow: `8px 8px 0 ${result.accepted ? "#166534" : "#7f1d1d"}`,
                            padding: "32px",
                        }}
                    >
                        {/* Score header */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "24px",
                                marginBottom: "24px",
                                flexWrap: "wrap",
                            }}
                        >
                            {/* Score badge */}
                            <div
                                style={{
                                    width: "100px",
                                    height: "100px",
                                    border: `4px solid ${scoreColor}`,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    background: "rgba(0,0,0,0.5)",
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: "var(--font-pixel), monospace",
                                        fontSize: "36px",
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
                        <button
                            className="pixel-btn"
                            onClick={onBackToQuestBoard}
                            style={{ fontSize: "12px", padding: "12px 24px" }}
                        >
                            ← Return to Quest Board
                        </button>
                    </div>
                )}
            </div>

            <HUD user={currentUser} />
        </div>
    );
}
