import { useEffect, useState } from "react";
import { useRouter } from "next/router";

type State = {
  waiting: { id: number; first_name: string }[];
  totalWaiting: number;
  colors?: {
    primary: string;
    text: string;
    background: string;
    showNameBg: boolean;
    showMoreBg: boolean;
  };
};

export default function Overlay() {
  const router = useRouter();
  const [state, setState] = useState<State>({ waiting: [], totalWaiting: 0 });

  // Default colors
  const primaryColor = state.colors?.primary || "#FFD400";
  const textColor = state.colors?.text || "#000000";
  const backgroundColor = state.colors?.background || "rgba(0, 0, 0, 0.6)";
  const showNameBg = state.colors?.showNameBg ?? true;
  const showMoreBg = state.colors?.showMoreBg ?? true;

  useEffect(() => {
    // Maak body transparant voor overlay
    document.body.style.background = "transparent";
    document.documentElement.style.background = "transparent";
  }, []);

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
          waiting: j.waiting ?? [], 
          totalWaiting: j.totalWaiting ?? 0,
          colors: j.colors,
        });
      } catch {
        // Ignore network errors
      }
    };

    fetchState();
    const id = setInterval(fetchState, 1500);
    return () => clearInterval(id);
  }, [router.isReady, router.query.shopId]);

  const maxShow = 5;
  const names = state.waiting.map((x) => x.first_name);
  const shown = names.slice(0, maxShow);
  const remaining = Math.max(0, names.length - shown.length);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "transparent",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        padding: 40,
        fontFamily: "Arial, sans-serif",
        fontWeight: "bold",
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          fontSize: 52,
          lineHeight: 1.05,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div 
          style={{ 
            marginBottom: 18,
            color: primaryColor,
            fontWeight: "bold",
            WebkitTextStroke: "3px black",
            textShadow: "4px 4px 0px rgba(0,0,0,0.8), -2px -2px 0px rgba(0,0,0,0.8), 2px -2px 0px rgba(0,0,0,0.8), -2px 2px 0px rgba(0,0,0,0.8)",
          }}
        >
          Wachtrij:
        </div>

        {names.length === 0 ? (
          <div 
            style={{ 
              fontWeight: "bold", 
              fontSize: 44,
              color: primaryColor,
              WebkitTextStroke: "3px black",
              textShadow: "4px 4px 0px rgba(0,0,0,0.8), -2px -2px 0px rgba(0,0,0,0.8), 2px -2px 0px rgba(0,0,0,0.8), -2px 2px 0px rgba(0,0,0,0.8)",
            }}
          >
            Geen openstaande
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {shown.map((n, i) => (
              <div key={i}>
                <span
                  style={{ 
                    fontWeight: "bold", 
                    fontSize: 44,
                    color: primaryColor,
                    backgroundColor: showNameBg ? backgroundColor : "transparent",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    WebkitTextStroke: "2px black",
                  }}
                >
                  {n}
                </span>
              </div>
            ))}
            {remaining > 0 && (
              <div style={{ marginTop: "8px" }}>
                <span
                  style={{ 
                    fontWeight: "bold", 
                    fontSize: 40,
                    color: textColor,
                    backgroundColor: showMoreBg ? primaryColor : "transparent",
                    padding: "10px 20px",
                    borderRadius: "8px",
                  }}
                >
                  En nog {remaining} meer...
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
