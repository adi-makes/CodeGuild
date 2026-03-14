"use client";

import Image from "next/image";
import { UserData } from "@/lib/types";
import HUD from "@/components/HUD";

interface TownSceneProps {
    user: UserData;
    onEnterGuild: () => void;
    onLogout: () => void;
}

export default function TownScene({ user, onEnterGuild, onLogout }: TownSceneProps) {
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
            <style>{`
                @keyframes pulse-glow {
                    0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(245, 200, 66, 0.6); }
                    50% { opacity: 0.6; box-shadow: 0 0 24px rgba(245, 200, 66, 1); }
                }
                @keyframes bounce-arrow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
                .guild-enter-btn:hover {
                    background: rgba(245, 200, 66, 0.2) !important;
                    border-color: #f5c842 !important;
                }
            `}</style>

            {/* Background — town map */}
            <Image
                src="/town.jpeg"
                alt="Town of CodeGuild"
                fill
                style={{ objectFit: "cover", imageRendering: "pixelated" }}
                priority
            />

            {/* Logout Button */}
            <div style={{ position: "absolute", top: "24px", left: "40px", zIndex: 10 }}>
                <button
                    className="pixel-btn"
                    onClick={onLogout}
                    style={{ fontSize: "10px", padding: "10px 16px", background: "#8b0000", borderColor: "#ff4d4d" }}
                >
                    ← Logout
                </button>
            </div>

            {/* Dark overlay */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "radial-gradient(ellipse at 50% 40%, transparent 30%, rgba(0,0,0,0.5) 100%)",
                    pointerEvents: "none",
                    zIndex: 1,
                }}
            />

            {/* Guild Hall Building */}
            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "16%",
                    transform: "translateX(-50%)",
                    zIndex: 2,
                    width: "clamp(200px, 32vw, 400px)",
                    height: "clamp(180px, 28vh, 320px)",
                }}
            >
                <img
                    src="/guild-hall.png"
                    alt="Guild Hall"
                    style={{
                        imageRendering: "pixelated",
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        display: "block",
                    }}
                />
            </div>

            {/* Large clickable hotspot — covers the whole building */}
            <div
                className="hotspot guild-enter-btn"
                onClick={onEnterGuild}
                title="Enter Guild Hall"
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "16%",
                    transform: "translateX(-50%)",
                    width: "clamp(200px, 32vw, 400px)",
                    height: "clamp(180px, 28vh, 320px)",
                    zIndex: 3,
                    border: "3px dashed rgba(245, 200, 66, 0.6)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    background: "transparent",
                    transition: "background 0.2s, border-color 0.2s",
                }}
            />

            {/* Pulsing "Enter Guild Hall" CTA */}
            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "48%",
                    transform: "translateX(-50%)",
                    zIndex: 4,
                    pointerEvents: "none",
                    textAlign: "center",
                }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                    }}
                >
                    <span
                        style={{
                            fontFamily: "var(--font-pixel), monospace",
                            fontSize: "12px",
                            color: "#fbbf24",
                            animation: "bounce-arrow 1.2s ease-in-out infinite",
                            display: "block",
                        }}
                    >
                        ▲
                    </span>
                    <div
                        style={{
                            background: "rgba(26, 16, 8, 0.95)",
                            border: "3px solid #f5c842",
                            padding: "8px 20px",
                            animation: "pulse-glow 2s ease-in-out infinite",
                        }}
                    >
                        <p
                            style={{
                                fontFamily: "var(--font-pixel), monospace",
                                fontSize: "12px",
                                color: "#f5c842",
                                margin: 0,
                                letterSpacing: "1px",
                                whiteSpace: "nowrap",
                            }}
                        >
                            🏰 ENTER GUILD HALL
                        </p>
                    </div>
                </div>
            </div>

            {/* HUD */}
            <HUD user={user} />
        </div>
    );
}
