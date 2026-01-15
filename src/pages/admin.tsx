import { useCallback, useEffect, useMemo, useState } from "react";

type Row = { id: number; first_name: string };
type State = { active: Row | null; waiting: Row[]; totalWaiting: number };

export default function Admin() {
  const [state, setState] = useState<State>({ active: null, waiting: [], totalWaiting: 0 });

  // Read admin key from URL (no setState needed)
  const adminKey = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("key") ?? "";
  }, []);

  const load = useCallback(async () => {
    const r = await fetch("/api/queue/state");
    const j = await r.json();

    setState({
      active: j.active ?? null,
      waiting: j.waiting ?? [],
      totalWaiting: j.totalWaiting ?? 0,
    });
  }, []);

  useEffect(() => {
    // Defer the first load so it's not synchronous in the effect body (satisfies strict lint rule)
    const t = window.setTimeout(() => {
      void load();
    }, 0);

    const id = window.setInterval(() => {
      void load();
    }, 1500);

    return () => {
      window.clearTimeout(t);
      window.clearInterval(id);
    };
  }, [load]);

  const post = useCallback(
    async (path: string) => {
      if (!adminKey) {
        alert("Admin key ontbreekt. Open: /admin?key=JOUW_ADMIN_KEY");
        return;
      }

      const r = await fetch(`${path}?key=${encodeURIComponent(adminKey)}`, { method: "POST" });

      if (!r.ok) {
        const t = await r.text();
        alert(`Error (${r.status}): ${t}`);
      }

      await load();
    },
    [adminKey, load]
  );

  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>Queue Admin</h1>

      <div style={{ marginBottom: 10, opacity: 0.75 }}>
        <strong>Key status:</strong> {adminKey ? "OK (key aanwezig)" : "MISSING (open /admin?key=...)"}
      </div>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => void post("/api/queue/next")} style={{ marginRight: 12 }} disabled={!adminKey}>
          Next
        </button>
        <button onClick={() => void post("/api/queue/skip")} disabled={!adminKey}>
          Skip
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <strong>Actief:</strong> {state.active?.first_name ?? "—"}
      </div>

      <div>
        <strong>Wachtend ({state.totalWaiting}):</strong>
        <ol>
          {state.waiting.map((x) => (
            <li key={x.id}>{x.first_name}</li>
          ))}
        </ol>
      </div>

      <div style={{ marginTop: 18, opacity: 0.7 }}>
        Open admin als <code>/admin?key=JOUW_ADMIN_KEY</code>
      </div>
    </div>
  );
}
