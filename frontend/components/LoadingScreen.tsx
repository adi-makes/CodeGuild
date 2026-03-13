"use client";

interface LoadingScreenProps {
    message?: string;
}

export default function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
            {/* Pixel art decorative border */}
            <div
                style={{
                    border: "4px solid #f5c842",
                    boxShadow: "8px 8px 0 #5c3317",
                    padding: "48px 64px",
                    background: "#1a1008",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "32px",
                }}
            >
                {/* Animated pixel sprite — simple 8-bit spinner */}
                <div style={{ fontSize: "48px", lineHeight: 1 }}>⚔️</div>

                {/* Loading text */}
                <p
                    style={{
                        fontFamily: "var(--font-pixel), monospace",
                        fontSize: "14px",
                        color: "#f5c842",
                        letterSpacing: "2px",
                        margin: 0,
                    }}
                >
                    {message}
                </p>

                {/* Animated dots */}
                <div style={{ display: "flex", gap: "8px" }}>
                    <span className="loading-dot" />
                    <span className="loading-dot" />
                    <span className="loading-dot" />
                </div>
            </div>
        </div>
    );
}
