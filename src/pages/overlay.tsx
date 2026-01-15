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
          color: "#FFD400", // geel (pas aan naar hun exact geel)
          fontWeight: 800,
          fontSize: 52,
          lineHeight: 1.05,
          textShadow: "0 2px 8px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ marginBottom: 18 }}>Wachtrij:</div>

        {names.length === 0 ? (
          <div style={{ fontWeight: 700, fontSize: 44 }}>Geen openstaande</div>
        ) : (
          <>
            {shown.map((n, i) => (
              <div key={i} style={{ fontWeight: 700, fontSize: 44, marginBottom: 8 }}>
                {n}
              </div>
            ))}
            {remaining > 0 && (
              <div style={{ fontWeight: 700, fontSize: 40, marginTop: 10 }}>
                En nog {remaining} meer...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
