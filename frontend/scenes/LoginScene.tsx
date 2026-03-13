"use client";

import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { UserData } from "@/lib/types";
import Image from "next/image";

const BACKEND_CORE_URL =
    process.env.NEXT_PUBLIC_BACKEND_CORE_URL || "http://localhost:3001";

interface LoginSceneProps {
    onLogin: (user: UserData) => void;
}

export default function LoginScene({ onLogin }: LoginSceneProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();

            // Initialize user in backend
            const res = await fetch(`${BACKEND_CORE_URL}/api/users/init`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to initialize account");
            }

            const userData: UserData = await res.json();
            onLogin(userData);
        } catch (err: unknown) {
            console.error("Login error:", err);
            if (err instanceof Error) {
                setError(err.message || "Sign-in failed. Please try again.");
            } else {
                setError("Sign-in failed. Please try again.");
            }
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                position: "relative",
                width: "100vw",
                height: "100vh",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#0a0a0a",
            }}
        >
            {/* Background — town map image */}
            <Image
                src="/town.jpeg"
                alt="Town of CodeGuild"
                fill
                style={{ objectFit: "cover", imageRendering: "pixelated", opacity: 0.35 }}
                priority
            />

            {/* Dark vignette overlay */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.75) 100%)",
                }}
            />

            {/* Login card */}
            <div
                style={{
                    position: "relative",
                    zIndex: 10,
                    background: "rgba(26, 16, 8, 0.97)",
                    border: "4px solid #f5c842",
                    boxShadow: "8px 8px 0 #5c3317, 0 0 60px rgba(245, 200, 66, 0.15)",
                    padding: "48px 40px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "32px",
                    minWidth: "340px",
                    maxWidth: "400px",
                    width: "90vw",
                }}
            >
                {/* Guild emblem */}
                <div
                    style={{
                        width: "80px",
                        height: "80px",
                        background: "#f5c842",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "48px",
                        border: "3px solid #5c3317",
                        boxShadow: "4px 4px 0 #5c3317",
                    }}
                >
                    ⚔️
                </div>

                {/* Title */}
                <div style={{ textAlign: "center" }}>
                    <h1
                        style={{
                            fontFamily: "var(--font-pixel), monospace",
                            fontSize: "22px",
                            color: "#f5c842",
                            margin: "0 0 8px",
                            textShadow: "3px 3px 0 #5c3317",
                            letterSpacing: "2px",
                        }}
                    >
                        CodeGuild
                    </h1>
                    <p
                        style={{
                            fontFamily: "var(--font-pixel), monospace",
                            fontSize: "7px",
                            color: "#a88b6a",
                            margin: 0,
                            lineHeight: 2,
                            letterSpacing: "1px",
                        }}
                    >
                        Where coders become legends
                    </p>
                </div>

                {/* Decorative divider */}
                <div
                    style={{
                        width: "100%",
                        height: "2px",
                        background: "linear-gradient(90deg, transparent, #f5c842, transparent)",
                    }}
                />

                {/* Google Sign-In button */}
                <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="pixel-btn"
                    style={{
                        width: "100%",
                        fontSize: "9px",
                        padding: "16px 24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "12px",
                    }}
                >
                    {loading ? (
                        <>
                            <span>Entering guild</span>
                            <span className="loading-dot" style={{ marginLeft: "4px" }} />
                        </>
                    ) : (
                        <>
                            <span
                                style={{
                                    fontSize: "18px",
                                    display: "inline-block",
                                    background: "white",
                                    borderRadius: "50%",
                                    width: "24px",
                                    height: "24px",
                                    lineHeight: "24px",
                                    textAlign: "center",
                                }}
                            >
                                G
                            </span>
                            <span>Sign in with Google</span>
                        </>
                    )}
                </button>

                {/* Error message */}
                {error && (
                    <p
                        style={{
                            fontFamily: "var(--font-pixel), monospace",
                            fontSize: "7px",
                            color: "#c0392b",
                            margin: 0,
                            textAlign: "center",
                            lineHeight: 2,
                        }}
                    >
                        ⚠ {error}
                    </p>
                )}

                <p
                    style={{
                        fontFamily: "var(--font-pixel), monospace",
                        fontSize: "6px",
                        color: "#555",
                        margin: 0,
                        textAlign: "center",
                        lineHeight: 2,
                    }}
                >
                    Complete quests · Earn EXP · Rank up
                </p>
            </div>
        </div>
    );
}
