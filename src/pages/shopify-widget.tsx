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
  waiting: { id: number; first_name: string; product_info?: string | null }[];
  totalWaiting: number;
  queueClosed?: boolean;
  colors?: {
    primary: string;
    text: string;
    background: string;
  };
};

function formatOrderTime(createdAt: string): string {
  const date = new Date(createdAt);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export default function ShopifyWidget() {
  const router = useRouter();
  const [state, setState] = useState<State>({ 
    active: null, 
    waiting: [], 
    totalWaiting: 0, 
    queueClosed: false 
  });

  // Default colors (oranje theme)
  const primaryColor = state.colors?.primary || "#FF9500";
  const textColor = state.colors?.text || "#000000";

  // Calculate order time from state
  const orderTime = state.active ? formatOrderTime(state.active.created_at) : "";

  // Wachtrij logica (max 5 tonen, net als TikTok Live)
  const maxShow = 5;
  const shownWaiting = state.waiting.slice(0, maxShow);
  const remainingWaiting = Math.max(0, state.waiting.length - shownWaiting.length);

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
          waiting: j.waiting ?? [],
          totalWaiting: j.totalWaiting ?? 0,
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

  // Set minimal body styling for embedding
  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.background = "transparent";
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
  }, []);

  // Send height to parent window (Shopify iframe)
  useEffect(() => {
    const sendHeight = () => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage(
        { type: 'tiktok-queue-resize', height },
        '*'
      );
    };

    // Send height immediately and on every state change
    sendHeight();

    // Also send on window resize (e.g., font loading)
    window.addEventListener('resize', sendHeight);
    
    // Use ResizeObserver for more accurate detection
    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);

    return () => {
      window.removeEventListener('resize', sendHeight);
      observer.disconnect();
    };
  }, [state]); // Re-run when state changes

  return (
    <div
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        padding: "16px",
        maxWidth: "500px",
        margin: "0 auto",
      }}
    >
      {/* Main widget container */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Actieve bestelling card */}
        <div
          style={{
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
                {orderTime}
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

        {/* Wachtende in wachtrij - net als TikTok Live (alleen als wachtrij NIET gesloten is) */}
        {shownWaiting.length > 0 && !state.queueClosed && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "20px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
              border: "1px solid #e9ecef",
              marginTop: "16px",
            }}
          >
            <h4
              style={{
                fontSize: "14px",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "#6c757d",
                margin: "0 0 16px 0",
              }}
            >
              Wachtende in wachtrij
            </h4>

            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: "12px",
            }}>
              {shownWaiting.map((person) => (
                <div
                  key={person.id}
                  style={{
                    padding: "10px 14px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "6px",
                    borderLeft: `4px solid ${primaryColor}`,
                  }}
                >
                  <div style={{
                    fontSize: "16px",
                    color: "#1a1a1a",
                    fontWeight: "500",
                    marginBottom: person.product_info ? "4px" : "0",
                  }}>
                    {person.first_name}
                  </div>
                  {person.product_info && (
                    <div style={{
                      fontSize: "13px",
                      color: "#6c757d",
                    }}>
                      {person.product_info}
                    </div>
                  )}
                </div>
              ))}

              {remainingWaiting > 0 && (
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    padding: "8px 14px",
                    backgroundColor: primaryColor,
                    color: textColor,
                    borderRadius: "6px",
                    textAlign: "center",
                  }}
                >
                  En nog {remainingWaiting} meer...
                </div>
              )}
            </div>
          </div>
        )}
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
