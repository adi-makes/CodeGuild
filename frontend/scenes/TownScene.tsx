"use client";

import Image from "next/image";
import { UserData } from "@/lib/types";
import HUD from "@/components/HUD";

interface TownSceneProps {
    user: UserData;
    onEnterGuild: () => void;
}

export default function TownScene({ user, onEnterGuild }: TownSceneProps) {
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
            {/* Background — town map */}
            <Image
                src="/town.jpeg"
                alt="Town of CodeGuild"
                fill
                style={{ objectFit: "cover", imageRendering: "pixelated" }}
                priority
            />

            {/* Subtle dark overlay at edges */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "radial-gradient(ellipse at 50% 40%, transparent 30%, rgba(0,0,0,0.5) 100%)",
                    pointerEvents: "none",
                    zIndex: 1,
                }}
            />

            {/* Guild Hall Building —positioned as an overlay, centered/slightly upper area */}
            {/* The guild_final.png is the pixel guild hall building, shown prominently */}
            <div
                style={{
                    position: "absolute",
                    /* Center the building horizontally, place in upper-center of scene */
                    left: "50%",
                    top: "30%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 2,
                    /* The building image itself: THIS IS WHAT YOU ADJUST */
                    width: "clamp(200px, 30vw, 380px)",
                    height: "auto",
                }}
            >
                <Image
                    src="/guild-hall.png"
                    alt="Guild Hall"
                    width={380}
                    height={380}
                    style={{
                        imageRendering: "pixelated",
                        width: "100%",
                        height: "auto",
                        display: "block",
                    }}
                />
            </div>

            {/* Invisible clickable hotspot over guild building door area */}
            <div
                className="hotspot"
                onClick={onEnterGuild}
                title="Enter Guild Hall"
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "38%",
                    transform: "translateX(-50%)",
                    width: "clamp(80px, 10vw, 120px)",
                    height: "clamp(60px, 8vh, 100px)",
                    zIndex: 3,
                    /* Subtle visible outline in dev — remove in prod */
                    border: "2px dashed rgba(245, 200, 66, 0.4)",
                    borderRadius: "4px",
                    cursor: "pointer",
                }}
            />

            {/* "Enter Guild" hint label */}
            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "calc(38% + clamp(70px, 9vh, 110px))",
                    transform: "translateX(-50%)",
                    zIndex: 3,
                    background: "rgba(26, 16, 8, 0.9)",
                    border: "2px solid #f5c842",
                    padding: "6px 12px",
                    pointerEvents: "none",
                }}
            >
                <p
                    style={{
                        fontFamily: "var(--font-pixel), monospace",
                        fontSize: "7px",
                        color: "#f5c842",
                        margin: 0,
                        letterSpacing: "1px",
                        whiteSpace: "nowrap",
                    }}
                >
                    ▲ Click to enter
                </p>
            </div>

            {/* HUD */}
            <HUD user={user} />
        </div>
    );
}
