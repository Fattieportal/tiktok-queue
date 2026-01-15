import { useCallback, useEffect, useState } from "react";

type Row = { id: number; first_name: string };
type State = { active: Row | null; waiting: Row[]; totalWaiting: number };

export default function Admin() {
  const [state, setState] = useState<State>({ active: null, waiting: [], totalWaiting: 0 });
  const [manualName, setManualName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [adminKey, setAdminKey] = useState<string>("");
  const [keyInput, setKeyInput] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>("");

  // Check localStorage voor opgeslagen admin key bij mount
  useEffect(() => {
    const storedKey = localStorage.getItem("adminKey");
    if (storedKey) {
      // Valideer de opgeslagen key automatisch
      const validateStoredKey = async () => {
        setIsLoading(true);
        try {
          const r = await fetch(`/api/queue/state?key=${encodeURIComponent(storedKey)}`);
          if (r.ok) {
            setAdminKey(storedKey);
            setIsAuthenticated(true);
          } else {
            // Key is niet meer geldig, verwijder uit localStorage
            localStorage.removeItem("adminKey");
          }
        } catch {
          localStorage.removeItem("adminKey");
        } finally {
          setIsLoading(false);
        }
      };
      void validateStoredKey();
    }
  }, []);

  const load = useCallback(async () => {
    if (!isAuthenticated || !adminKey) return;
    const r = await fetch(`/api/queue/state?key=${encodeURIComponent(adminKey)}`);
    const j = await r.json();
    setState({
      active: j.active ?? null,
      waiting: j.waiting ?? [],
      totalWaiting: j.totalWaiting ?? 0,
    });
    setLastUpdate(new Date());
  }, [isAuthenticated, adminKey]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const t = window.setTimeout(() => void load(), 0);
    const id = window.setInterval(() => void load(), 1500);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(id);
    };
  }, [load, isAuthenticated]);

  const post = useCallback(
    async (path: string, body?: unknown) => {
      if (!adminKey) {
        setAuthError("Sessie verlopen. Log opnieuw in.");
        setIsAuthenticated(false);
        return;
      }

      setIsLoading(true);
      try {
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
      } finally {
        setIsLoading(false);
      }
    },
    [adminKey, load]
  );

  const handleLogin = async () => {
    const key = keyInput.trim();
    if (!key) {
      setAuthError("Voer een admin key in");
      return;
    }

    setIsLoading(true);
    setAuthError("");

    try {
      // Test de key door de state op te halen
      const r = await fetch(`/api/queue/state?key=${encodeURIComponent(key)}`);
      
      if (r.ok) {
        setAdminKey(key);
        setIsAuthenticated(true);
        setKeyInput("");
        // Sla key op in localStorage voor volgende sessie
        localStorage.setItem("adminKey", key);
      } else if (r.status === 401) {
        setAuthError("Ongeldige admin key");
      } else {
        setAuthError("Er ging iets mis. Probeer opnieuw.");
      }
    } catch {
      setAuthError("Kon geen verbinding maken met de server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminKey("");
    setAuthError("");
    // Verwijder key uit localStorage bij uitloggen
    localStorage.removeItem("adminKey");
  };

  // Login scherm
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -inset-[10px] opacity-50">
            <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
            <div className="absolute top-0 -right-4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
            <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
          </div>
        </div>

        {/* Login Card */}
        <div className="relative w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 shadow-2xl ring-1 ring-white/20">
            <div className="text-center mb-6 sm:mb-8">
              <div className="text-5xl sm:text-6xl mb-4">🔐</div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Queue Admin</h1>
              <p className="text-sm sm:text-base text-slate-300">Voer je admin key in om toegang te krijgen</p>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => {
                    setKeyInput(e.target.value);
                    setAuthError("");
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      void handleLogin();
                    }
                  }}
                  placeholder="Admin Key"
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>

              {authError && (
                <div className="px-4 py-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
                  {authError}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={isLoading || !keyInput.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/50 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Bezig met inloggen...
                  </span>
                ) : (
                  "Inloggen"
                )}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-xs sm:text-sm text-slate-400 text-center">
                Geen toegang? Neem contact op met de administrator.
              </p>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}</style>
      </div>
    );
  }

  // Admin Dashboard (alleen zichtbaar na login)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-[10px] opacity-50">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-0 -right-4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 tracking-tight flex flex-wrap items-center gap-2">
            <span>Queue Admin</span>
            <span className="text-xl sm:text-2xl">🎯</span>
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-4">
            <div className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
              adminKey 
                ? "bg-green-500/20 text-green-300 ring-1 ring-green-500/50" 
                : "bg-red-500/20 text-red-300 ring-1 ring-red-500/50"
            }`}>
              {adminKey ? "✓ Geautoriseerd" : "⚠ Geen admin key"}
            </div>
            <div className="text-xs sm:text-sm text-slate-400">
              Update: {lastUpdate.toLocaleTimeString("nl-NL")}
            </div>
            <button
              onClick={handleLogout}
              className="px-3 sm:px-4 py-2 bg-red-500/20 text-red-300 ring-1 ring-red-500/50 rounded-full text-xs sm:text-sm font-medium hover:bg-red-500/30 transition-all"
            >
              Uitloggen
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left column - Controls */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Queue Controls */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 shadow-2xl ring-1 ring-white/20">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <span className="text-xl sm:text-2xl">🎮</span>
                <span>Wachtrij Beheer</span>
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  onClick={() => void post("/api/queue/next")}
                  disabled={!adminKey || isLoading}
                  className="px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm sm:text-base font-semibold rounded-xl shadow-lg hover:shadow-green-500/50 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <span className="flex items-center justify-center gap-1 sm:gap-2">
                    <span className="hidden sm:inline">▶️</span> Next
                  </span>
                </button>

                <button
                  onClick={() => void post("/api/queue/skip")}
                  disabled={!adminKey || isLoading}
                  className="px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-sm sm:text-base font-semibold rounded-xl shadow-lg hover:shadow-blue-500/50 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <span className="flex items-center justify-center gap-1 sm:gap-2">
                    <span className="hidden sm:inline">⏭️</span> Skip
                  </span>
                </button>

                <button
                  onClick={() => void post("/api/queue/undo")}
                  disabled={!adminKey || isLoading}
                  className="px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm sm:text-base font-semibold rounded-xl shadow-lg hover:shadow-amber-500/50 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <span className="flex items-center justify-center gap-1 sm:gap-2">
                    <span className="hidden sm:inline">↩️</span> Undo
                  </span>
                </button>

                <button
                  onClick={() => {
                    const ok = window.confirm("Weet je zeker dat je de hele wachtrij wilt resetten?");
                    if (ok) void post("/api/queue/reset");
                  }}
                  disabled={!adminKey || isLoading}
                  className="px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm sm:text-base font-semibold rounded-xl shadow-lg hover:shadow-red-500/50 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <span className="flex items-center justify-center gap-1 sm:gap-2">
                    <span className="hidden sm:inline">🔄</span> Reset
                  </span>
                </button>
              </div>
            </div>

            {/* Manual Add */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 shadow-2xl ring-1 ring-white/20">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <span className="text-xl sm:text-2xl">➕</span>
                <span>Handmatig Toevoegen</span>
              </h2>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <input
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      const name = manualName.trim();
                      if (!name || !adminKey) return;
                      setManualName("");
                      void post("/api/queue/add", { firstName: name });
                    }
                  }}
                  placeholder="Voornaam (bijv. Piet)"
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm sm:text-base"
                />
                <button
                  onClick={() => {
                    const name = manualName.trim();
                    if (!name) return;
                    setManualName("");
                    void post("/api/queue/add", { firstName: name });
                  }}
                  disabled={!adminKey || isLoading || !manualName.trim()}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm sm:text-base font-semibold rounded-xl shadow-lg hover:shadow-purple-500/50 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap"
                >
                  Toevoegen
                </button>
              </div>
            </div>

            {/* Waiting List */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 shadow-2xl ring-1 ring-white/20">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <span className="text-xl sm:text-2xl">⏳</span>
                <span>Wachtend</span>
                <span className="ml-auto px-2 sm:px-3 py-1 bg-purple-500/30 text-purple-200 text-xs sm:text-sm font-bold rounded-full">
                  {state.totalWaiting}
                </span>
              </h2>
              <div className="max-h-64 sm:max-h-96 overflow-y-auto custom-scrollbar">
                {state.waiting.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm sm:text-base">
                    Geen wachtende personen
                  </div>
                ) : (
                  <ol className="space-y-2">
                    {state.waiting.map((person, index) => (
                      <li
                        key={person.id}
                        className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                      >
                        <span className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-purple-500/30 text-purple-200 rounded-full text-xs sm:text-sm font-bold">
                          {index + 1}
                        </span>
                        <span className="text-white font-medium text-sm sm:text-base">{person.first_name}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </div>

          {/* Right column - Status */}
          <div className="space-y-4 sm:space-y-6">
            {/* Active Person */}
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-4 sm:p-6 shadow-2xl ring-1 ring-purple-500/50">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <span className="text-xl sm:text-2xl">👤</span>
                <span>Nu Actief</span>
              </h2>
              <div className="text-center py-6 sm:py-8">
                {state.active ? (
                  <>
                    <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-2 animate-pulse break-words">
                      {state.active.first_name}
                    </div>
                    <div className="inline-block px-3 sm:px-4 py-2 bg-green-500/30 text-green-200 rounded-full text-xs sm:text-sm font-medium">
                      🟢 Actief
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-4xl sm:text-5xl lg:text-6xl mb-2">—</div>
                    <div className="inline-block px-3 sm:px-4 py-2 bg-slate-500/30 text-slate-300 rounded-full text-xs sm:text-sm font-medium">
                      Niemand actief
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 shadow-2xl ring-1 ring-white/20">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <span className="text-xl sm:text-2xl">📊</span>
                <span>Statistieken</span>
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-slate-300 text-sm sm:text-base">Totaal wachtend:</span>
                  <span className="text-xl sm:text-2xl font-bold text-white">{state.totalWaiting}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-slate-300 text-sm sm:text-base">Actief:</span>
                  <span className="text-xl sm:text-2xl font-bold text-white">{state.active ? "1" : "0"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 shadow-2xl ring-1 ring-white/20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <div className="text-white font-semibold text-sm sm:text-base">Bezig met laden...</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.7);
        }
      `}</style>
    </div>
  );
}
