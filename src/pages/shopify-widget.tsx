import { useEffect, useState } from "react";
import { useRouter } from "next/router";

type ActiveEntry = {
  id: number;
  first_name: string;
  product_info?: string | null;
  created_at: string;
};

type State = {
  active: ActiveEntry | null;
  queueClosed?: boolean;
  colors?: {
    primary: string;
    text: string;
    background: string;
  };
};

function formatElapsedTime(createdAt: string): string {
  const start = new Date(createdAt).getTime();
  const now = Date.now();
  const diff = now - start;

  const totalMinutes = Math.floor(diff / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${Math.floor((diff % 60000) / 1000).toString().padStart(2, "0")}`;
}

export default function ShopifyWidget() {
  const router = useRouter();
  const [state, setState] = useState<State>({ active: null, queueClosed: false });
  const [currentTime, setCurrentTime] = useState<string>("");

  // Default colors (oranje theme)
  const primaryColor = state.colors?.primary || "#FF9500";
  const textColor = state.colors?.text || "#FFFFFF";
  const backgroundColor = state.colors?.background || "rgba(0, 0, 0, 0.8)";

  // Update timer every second
  useEffect(() => {
    if (!state.active) return;

    const updateTimer = () => {
      setCurrentTime(formatElapsedTime(state.active!.created_at));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [state.active]);

  // Fetch queue state
  useEffect(() => {
    if (!router.isReady) return;

    const shopId = router.query.shopId as string | undefined;
    if (!shopId) return;

    const fetchState = async () => {
      try {
        const r = await fetch(`/api/queue/public-state?shopId=${encodeURIComponent(shopId)}`);
        if (!r.ok) return;
        const j = await r.json();
        setState({
          active: j.active ?? null,
          queueClosed: j.queueClosed ?? false,
          colors: j.colors,
        });
      } catch {
        // Ignore network errors
      }
    };

    fetchState();
    const id = setInterval(fetchState, 5000); // Poll every 5 seconds
    return () => clearInterval(id);
  }, [router.isReady, router.query.shopId]);

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          background: "#1f1f1f",
          borderRadius: "24px",
          padding: "40px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: primaryColor,
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: textColor,
              margin: 0,
              letterSpacing: "0.5px",
            }}
          >
            🟠 LIVE WACHTRIJ
          </h1>
        </div>

        {/* Content */}
        {state.queueClosed ? (
          <div
            style={{
              background: "rgba(255, 68, 68, 0.1)",
              border: "2px solid #FF4444",
              borderRadius: "16px",
              padding: "32px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#FF4444",
              }}
            >
              Wachtrij is gesloten
            </div>
          </div>
        ) : !state.active ? (
          <div
            style={{
              background: backgroundColor,
              borderRadius: "16px",
              padding: "32px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: "bold",
                color: textColor,
                opacity: 0.8,
              }}
            >
              Geen actieve bestelling
            </div>
            <div
              style={{
                fontSize: "16px",
                color: textColor,
                opacity: 0.6,
                marginTop: "8px",
              }}
            >
              Wacht op de volgende live unboxing...
            </div>
          </div>
        ) : (
          <div
            style={{
              background: `linear-gradient(135deg, ${backgroundColor} 0%, rgba(255, 149, 0, 0.1) 100%)`,
              border: `3px solid ${primaryColor}`,
              borderRadius: "20px",
              padding: "32px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Position Badge */}
            <div
              style={{
                position: "absolute",
                top: "16px",
                left: "16px",
                background: primaryColor,
                color: "#000000",
                fontSize: "48px",
                fontWeight: "bold",
                width: "80px",
                height: "80px",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(255, 149, 0, 0.4)",
              }}
            >
              #1
            </div>

            {/* Timer */}
            <div
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(0, 0, 0, 0.6)",
                padding: "12px 20px",
                borderRadius: "12px",
              }}
            >
              <span style={{ fontSize: "24px" }}>⏱️</span>
              <span
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: primaryColor,
                  fontFamily: "monospace",
                }}
              >
                {currentTime}
              </span>
            </div>

            {/* Content */}
            <div style={{ marginTop: "80px" }}>
              {/* Name */}
              <div
                style={{
                  fontSize: "48px",
                  fontWeight: "bold",
                  color: primaryColor,
                  marginBottom: "16px",
                  textShadow: "0 4px 12px rgba(255, 149, 0, 0.3)",
                  wordBreak: "break-word",
                }}
              >
                {state.active.first_name}
              </div>

              {/* Product Info */}
              {state.active.product_info && (
                <div
                  style={{
                    fontSize: "22px",
                    color: textColor,
                    opacity: 0.9,
                    background: "rgba(255, 255, 255, 0.05)",
                    padding: "16px 20px",
                    borderRadius: "12px",
                    marginTop: "20px",
                  }}
                >
                  📦 {state.active.product_info}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: "24px",
            textAlign: "center",
            fontSize: "14px",
            color: textColor,
            opacity: 0.5,
          }}
        >
          Live updates • Automatisch ververst
        </div>
      </div>

      {/* Pulse Animation */}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}
