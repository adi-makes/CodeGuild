"use client";

import { useState, useEffect } from "react";
import { UserData, Room } from "@/lib/types";
import HUD from "@/components/HUD";

const BACKEND_CORE_URL = process.env.NEXT_PUBLIC_BACKEND_CORE_URL || "http://localhost:3001";

interface OneVOneSceneProps {
    user: UserData;
    onStartGame: (room: Room) => void;
    onCancel: () => void;
}

export default function OneVOneScene({ user, onStartGame, onCancel }: OneVOneSceneProps) {
    const [mode, setMode] = useState<"initial" | "create" | "join">("initial");
    const [roomCode, setRoomCode] = useState("");
    const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Poll for room updates if we are the creator and waiting for a joiner
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (currentRoom && currentRoom.status === "waiting" && currentRoom.creatorId === user.userId) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`${BACKEND_CORE_URL}/api/rooms/status/${currentRoom.id}`);
                    if (res.ok) {
                        const updatedRoom: Room = await res.json();
                        if (updatedRoom.status === "started") {
                            onStartGame(updatedRoom);
                        }
                    }
                } catch (err) {
                    console.error("Polling error:", err);
                }
            }, 3000);
        }

        return () => clearInterval(interval);
    }, [currentRoom, user.userId, onStartGame]);

    const handleCreateRoom = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${BACKEND_CORE_URL}/api/rooms/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.userId }),
            });
            if (!res.ok) throw new Error("Failed to create room");
            const data = await res.json();
            setCurrentRoom({
                ...data,
                status: "waiting",
                creatorId: user.userId
            });
            setMode("create");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = async () => {
        if (!roomCode) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${BACKEND_CORE_URL}/api/rooms/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.userId, code: roomCode.toUpperCase() }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to join room");
            }
            const data: Room = await res.json();
            onStartGame(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ width: "100vw", height: "100vh", background: "#1a1008", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "rgba(26, 16, 8, 0.95)", border: "4px solid #f5c842", padding: "40px", maxWidth: "500px", width: "100%", textAlign: "center", boxShadow: "0 0 30px rgba(0,0,0,0.8)" }}>
                <h1 style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "28px", color: "#f5c842", marginBottom: "30px", textShadow: "4px 4px 0 #3a1f0a" }}>
                    ⚔ 1v1 CODE BATTLE
                </h1>

                {error && <p style={{ color: "#ff4d4d", fontFamily: "var(--font-pixel), monospace", fontSize: "14px", marginBottom: "20px" }}>⚠ {error}</p>}

                {mode === "initial" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <button className="pixel-btn" onClick={handleCreateRoom} disabled={loading} style={{ fontSize: "18px", padding: "15px" }}>
                            {loading ? "Creating..." : "Create Battle Room"}
                        </button>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ flex: 1, height: "1px", background: "#3a1f0a" }} />
                            <span style={{ color: "#a88b6a", fontFamily: "var(--font-pixel), monospace", fontSize: "12px" }}>OR</span>
                            <div style={{ flex: 1, height: "1px", background: "#3a1f0a" }} />
                        </div>
                        <button className="pixel-btn" onClick={() => setMode("join")} style={{ fontSize: "18px", padding: "15px", background: "#111", borderColor: "#4ade80", color: "#4ade80" }}>
                            Join Battle
                        </button>
                    </div>
                )}

                {mode === "create" && currentRoom && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px", alignItems: "center" }}>
                        <p style={{ color: "#a88b6a", fontFamily: "var(--font-pixel), monospace", fontSize: "14px" }}>
                            Share this code with your opponent:
                        </p>
                        <div style={{ background: "#000", border: "2px dashed #f5c842", padding: "20px 40px", fontSize: "42px", color: "#f5c842", fontFamily: "var(--font-pixel), monospace", letterSpacing: "8px" }}>
                            {currentRoom.code}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                            <div className="spinner" style={{ width: "20px", height: "20px", border: "3px solid rgba(245,200,66,0.2)", borderTopColor: "#f5c842", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                            <p style={{ color: "#4ade80", fontFamily: "var(--font-pixel), monospace", fontSize: "12px" }}>
                                Waiting for opponent to join...
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setMode("initial");
                                setCurrentRoom(null);
                            }}
                            style={{ background: "none", border: "none", color: "#a88b6a", cursor: "pointer", fontFamily: "var(--font-pixel), monospace", fontSize: "12px", marginTop: "10px" }}
                        >
                            ← Cancel Room
                        </button>
                    </div>
                )}

                {mode === "join" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        <p style={{ color: "#a88b6a", fontFamily: "var(--font-pixel), monospace", fontSize: "14px" }}>
                            Enter the 6-digit Battle Code:
                        </p>
                        <input
                            type="text"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            maxLength={6}
                            placeholder="CODE"
                            style={{ background: "#000", border: "3px solid #f5c842", padding: "15px", fontSize: "24px", color: "#f5c842", fontFamily: "var(--font-pixel), monospace", textAlign: "center", outline: "none" }}
                        />
                        <button className="pixel-btn" onClick={handleJoinRoom} disabled={loading || roomCode.length !== 6} style={{ fontSize: "18px", padding: "15px" }}>
                            {loading ? "Joining..." : "Enter Battle →"}
                        </button>
                        <button onClick={() => setMode("initial")} style={{ background: "none", border: "none", color: "#a88b6a", cursor: "pointer", fontFamily: "var(--font-pixel), monospace", fontSize: "12px" }}>
                            Cancel
                        </button>
                    </div>
                )}

                <div style={{ marginTop: "40px", borderTop: "2px solid #3a1f0a", paddingTop: "20px" }}>
                    <button onClick={onCancel} style={{ color: "#ff4d4d", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-pixel), monospace", fontSize: "12px" }}>
                        Return to Quest Board
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .spinner { display: inline-block; }
            `}</style>

            <HUD user={user} />
        </div>
    );
}
