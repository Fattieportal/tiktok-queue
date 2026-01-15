import { useCallback, useEffect, useMemo, useState } from "react";

type Row = { id: number; first_name: string };
type State = { active: Row | null; waiting: Row[]; totalWaiting: number };

export default function Admin() {
  const [state, setState] = useState<State>({ active: null, waiting: [], totalWaiting: 0 });
  const [manualName, setManualName] = useState<string>("");

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
    const t = window.setTimeout(() => void load(), 0);
    const id = window.setInterval(() => void load(), 1500);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(id);
    };
  }, [load]);

  const post = useCallback(
    async (path: string, body?: unknown) => {
      if (!adminKey) {
        alert("Admin key ontbreekt. Open: /admin?key=JOUW_ADMIN_KEY");
        return;
      }

      const r = await fetch(`${path}?key=${encodeURIComponent(adminKey)}`, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!r.ok) {
        const t = await r.text();
        alert(`Error (${r.status}): ${t}`);
        return;
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
        <button onClick={() => void post("/api/queue/next")} style={{ marginRight: 10 }} disabled={!adminKey}>
          Next
        </button>
        <button onClick={() => void post("/api/queue/skip")} style={{ marginRight: 10 }} disabled={!adminKey}>
          Skip
        </button>

        <button
          onClick={() => {
            const ok = window.confirm("Weet je zeker dat je de hele wachtrij wilt resetten?");
            if (ok) void post("/api/queue/reset");
          }}
          style={{ marginRight: 10 }}
          disabled={!adminKey}
        >
          Reset
        </button>

        <button onClick={() => void post("/api/queue/undo")} disabled={!adminKey}>
          Undo
        </button>
      </div>

      <div style={{ marginBottom: 18 }}>
        <strong>Handmatig toevoegen:</strong>
        <div style={{ marginTop: 8 }}>
          <input
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="Voornaam (bijv. Piet)"
            style={{ padding: 8, width: 260, marginRight: 10 }}
          />
          <button
            onClick={() => {
              const name = manualName.trim();
              if (!name) return;
              setManualName("");
              void post("/api/queue/add", { firstName: name });
            }}
            disabled={!adminKey}
          >
            Add
          </button>
        </div>
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
