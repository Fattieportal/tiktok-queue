import { useEffect, useState } from "react";

type Row = { id: number; first_name: string };
type State = { active: Row | null; waiting: Row[]; totalWaiting: number };

export default function Admin() {
  const [state, setState] = useState<State>({ active: null, waiting: [], totalWaiting: 0 });
  const [key, setKey] = useState("");

  useEffect(() => {
    const k = new URLSearchParams(window.location.search).get("key") ?? "";
    setKey(k);
  }, []);

  const load = async () => {
    const r = await fetch("/api/queue/state");
    const j = await r.json();
    setState({
      active: j.active ?? null,
      waiting: j.waiting ?? [],
      totalWaiting: j.totalWaiting ?? 0,
    });
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 1500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const post = async (path: string) => {
    const r = await fetch(`${path}?key=${encodeURIComponent(key)}`, { method: "POST" });
    if (!r.ok) {
      const t = await r.text();
      alert(`Error (${r.status}): ${t}`);
    }
    await load();
  };

  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>Queue Admin</h1>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => post("/api/queue/next")} style={{ marginRight: 12 }}>
          Next
        </button>
        <button onClick={() => post("/api/queue/skip")}>Skip</button>
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
