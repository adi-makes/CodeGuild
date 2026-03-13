"use client";

import { useState } from "react";
import Image from "next/image";
import { UserData } from "@/lib/types";
import HUD from "@/components/HUD";

interface GuildInteriorSceneProps {
    user: UserData;
    onGoToQuestBoard: () => void;
}

export default function GuildInteriorScene({
    user,
    onGoToQuestBoard,
}: GuildInteriorSceneProps) {
    const [showModal, setShowModal] = useState(false);

    return (
        <div
            style={{
                position: "relative",
                width: "100vw",
                height: "100vh",
                overflow: "hidden",
                background: "#0a0a0a",
            }}
        >
            {/* Background — guild interior */}
            <Image
                src="/guild-interior.jpg"
                alt="Guild Interior"
                fill
                style={{ objectFit: "cover", imageRendering: "pixelated" }}
                priority
            />

            {/* Dark vignette */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "radial-gradient(ellipse at 50% 30%, transparent 40%, rgba(0,0,0,0.55) 100%)",
                    pointerEvents: "none",
                    zIndex: 1,
                }}
            />

            {/* === Hotspot 1 — Receptionist Desk (top-center) === */}
            <div
                className="hotspot"
                onClick={() => setShowModal(true)}
                title="Talk to receptionist"
                style={{
                    position: "absolute",
                    /* The receptionist is in the top-center of interior1.jpg */
                    top: "25%",
                    left: "42%",
                    width: "16%",
                    height: "22%",
                    zIndex: 3,
                    border: "2px dashed rgba(245, 200, 66, 0.45)",
                    borderRadius: "4px",
                    cursor: "pointer",
                }}
            />

            {/* === Hotspot 2 — Right Quest Board === */}
            <div
                className="hotspot"
                onClick={onGoToQuestBoard}
                title="View Quest Board"
                style={{
                    position: "absolute",
                    /* The right noticeboard is in upper-right area */
                    top: "12%",
                    right: "12%",
                    width: "18%",
                    height: "30%",
                    zIndex: 3,
                    border: "2px dashed rgba(245, 200, 66, 0.45)",
                    borderRadius: "4px",
                    cursor: "pointer",
                }}
            />

            {/* Labels for hotspots */}
            <div
                style={{
                    position: "absolute",
                    top: "49%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 4,
                    pointerEvents: "none",
                }}
            >
                <div
                    style={{
                        background: "rgba(26, 16, 8, 0.88)",
                        border: "1px solid #f5c842",
                        padding: "4px 8px",
                        marginBottom: "4px",
                        textAlign: "center",
                    }}
                >
                    <p
                        style={{
                            fontFamily: "var(--font-pixel), monospace",
                            fontSize: "6px",
                            color: "#f5c842",
                            margin: 0,
                        }}
                    >
                        ▲ Receptionist
                    </p>
                </div>
            </div>

            <div
                style={{
                    position: "absolute",
                    top: "44%",
                    right: "13%",
                    zIndex: 4,
                    pointerEvents: "none",
                }}
            >
                <div
                    style={{
                        background: "rgba(26, 16, 8, 0.88)",
                        border: "1px solid #f5c842",
                        padding: "4px 8px",
                        textAlign: "center",
                    }}
                >
                    <p
                        style={{
                            fontFamily: "var(--font-pixel), monospace",
                            fontSize: "6px",
                            color: "#f5c842",
                            margin: 0,
                        }}
                    >
                        ▲ Quest Board
                    </p>
                </div>
            </div>

            {/* HUD */}
            <HUD user={user} />

            {/* Receptionist Modal */}
            {showModal && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.75)",
                        zIndex: 50,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    onClick={() => setShowModal(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: "#1a1008",
                            border: "4px solid #f5c842",
                            boxShadow: "8px 8px 0 #5c3317",
                            padding: "40px",
                            maxWidth: "500px",
                            width: "90vw",
                        }}
                    >
                        {/* NPC portrait */}
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", marginBottom: "24px" }}>
                            <div
                                style={{
                                    width: "60px",
                                    height: "60px",
                                    background: "#5c3317",
                                    border: "3px solid #f5c842",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "32px",
                                    flexShrink: 0,
                                }}
                            >
                                🧙
                            </div>
                            <div>
                                <p
                                    style={{
                                        fontFamily: "var(--font-pixel), monospace",
                                        fontSize: "10px",
                                        color: "#f5c842",
                                        margin: "0 0 8px",
                                    }}
                                >
                                    Guild Receptionist
                                </p>
                                <p
                                    style={{
                                        fontFamily: "var(--font-pixel), monospace",
                                        fontSize: "6px",
                                        color: "#a88b6a",
                                        margin: 0,
                                        lineHeight: 2,
                                    }}
                                >
                                    &quot;Welcome, adventurer!&quot;
                                </p>
                            </div>
                        </div>

                        <p
                            style={{
                                fontFamily: "var(--font-pixel), monospace",
                                fontSize: "7px",
                                color: "#e8d5a3",
                                lineHeight: 2.2,
                                margin: "0 0 20px",
                            }}
                        >
                            CodeGuild is a platform where developers embark on coding quests
                            and earn experience points. Submit your solutions and receive
                            instant AI-powered feedback. Complete harder quests to rank up
                            from Novice all the way to Master!
                        </p>

                        <p
                            style={{
                                fontFamily: "var(--font-pixel), monospace",
                                fontSize: "7px",
                                color: "#4ade80",
                                lineHeight: 2.2,
                                margin: "0 0 24px",
                            }}
                        >
                            Click the Quest Board on your right to browse available quests.
                            Good luck on your journey! ⚔️
                        </p>

                        <button
                            className="pixel-btn"
                            onClick={() => setShowModal(false)}
                            style={{ fontSize: "8px", padding: "10px 20px" }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
