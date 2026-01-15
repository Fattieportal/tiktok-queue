import { useEffect, useState } from "react";

type State = {
  waiting: { id: number; first_name: string }[];
  totalWaiting: number;
};

export default function Overlay() {
  const [state, setState] = useState<State>({ waiting: [], totalWaiting: 0 });

  useEffect(() => {
    const fetchState = async () => {
      const r = await fetch("/api/queue/public-state");
      const j = await r.json();
      setState({ waiting: j.waiting ?? [], totalWaiting: j.totalWaiting ?? 0 });
    };

    fetchState();
    const id = setInterval(fetchState, 1500);
    return () => clearInterval(id);
  }, []);

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
      }}
    >
      <div
        style={{
          fontWeight: 800,
          fontSize: 52,
          lineHeight: 1.05,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div 
          style={{ 
            marginBottom: 18,
            color: "#FFD400",
            WebkitTextStroke: "3px black",
            textShadow: "4px 4px 0px rgba(0,0,0,0.8), -2px -2px 0px rgba(0,0,0,0.8), 2px -2px 0px rgba(0,0,0,0.8), -2px 2px 0px rgba(0,0,0,0.8)",
          }}
        >
          Wachtrij:
        </div>

        {names.length === 0 ? (
          <div 
            style={{ 
              fontWeight: 700, 
              fontSize: 44,
              color: "#FFD400",
              WebkitTextStroke: "3px black",
              textShadow: "4px 4px 0px rgba(0,0,0,0.8), -2px -2px 0px rgba(0,0,0,0.8), 2px -2px 0px rgba(0,0,0,0.8), -2px 2px 0px rgba(0,0,0,0.8)",
            }}
          >
            Geen openstaande
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {shown.map((n, i) => (
              <div key={i}>
                <span
                  style={{ 
                    fontWeight: 700, 
                    fontSize: 44,
                    color: "#FFD400",
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
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
              <div style={{ marginTop: "4px" }}>
                <span
                  style={{ 
                    fontWeight: 700, 
                    fontSize: 40,
                    color: "black",
                    backgroundColor: "#FFD400",
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
