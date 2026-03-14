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
        background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
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
          maxWidth: "450px",
          background: "#ffffff",
          borderRadius: "16px",
          padding: "20px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          border: "1px solid #e9ecef",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: primaryColor,
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
          <h4
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#1a1a1a",
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            LIVE WACHTRIJ
          </h4>
        </div>

        {/* Content */}
        {state.queueClosed ? (
          <div
            style={{
              background: "rgba(255, 68, 68, 0.1)",
              border: "1px solid #FF4444",
              borderRadius: "12px",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔒</div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#FF4444",
              }}
            >
              Wachtrij is gesloten
            </div>
          </div>
        ) : !state.active ? (
          <div
            style={{
              background: "#f8f9fa",
              border: "1px solid #e9ecef",
              borderRadius: "12px",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>⏳</div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#495057",
              }}
            >
              Geen actieve bestelling
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#6c757d",
                marginTop: "4px",
              }}
            >
              Wacht op de volgende live unboxing...
            </div>
          </div>
        ) : (
          <div
            style={{
              background: "#ffffff",
              border: `2px solid ${primaryColor}`,
              borderRadius: "12px",
              padding: "16px",
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            {/* Position Badge */}
            <div
              style={{
                background: primaryColor,
                color: "#000000",
                fontSize: "20px",
                fontWeight: "bold",
                width: "50px",
                height: "50px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              #1
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Name */}
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#1a1a1a",
                  marginBottom: "4px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {state.active.first_name}
              </div>

              {/* Product Info */}
              {state.active.product_info && (
                <div
                  style={{
                    fontSize: "13px",
                    color: "#6c757d",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {state.active.product_info}
                </div>
              )}
            </div>

            {/* Timer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "#f8f9fa",
                padding: "6px 10px",
                borderRadius: "6px",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: "14px" }}>⏱️</span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#1a1a1a",
                  fontFamily: "monospace",
                }}
              >
                {currentTime}
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: "12px",
            textAlign: "center",
            fontSize: "11px",
            color: "#6c757d",
            opacity: 0.7,
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
