import { useCallback, useEffect, useState } from "react";

type Row = { id: number; first_name: string };
type State = { active: Row | null; waiting: Row[]; totalWaiting: number };
type Shop = { 
  id: string; 
  name: string; 
  display_name: string; 
  shopify_shop_domain: string | null; 
  is_active: boolean;
  primary_color?: string;
  text_color?: string;
  background_color?: string;
  show_name_background?: boolean;
  show_more_background?: boolean;
  queue_closed?: boolean;
  language?: string;
};

export default function Admin() {
  const [state, setState] = useState<State>({ active: null, waiting: [], totalWaiting: 0 });
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [showShopManager, setShowShopManager] = useState<boolean>(false);
  const [manualName, setManualName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [adminKey, setAdminKey] = useState<string>("");
  const [keyInput, setKeyInput] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>("");
  // Currently selected shop like-goal (shown in main admin area)
  const [selectedLikeGoal, setSelectedLikeGoal] = useState<string>("");

  // New shop form
  const [newShopName, setNewShopName] = useState<string>("");
  const [newShopDisplayName, setNewShopDisplayName] = useState<string>("");

  // Color editor
  const [editingShopColors, setEditingShopColors] = useState<Shop | null>(null);
  const [editPrimaryColor, setEditPrimaryColor] = useState<string>("#FFD400");
  const [editTextColor, setEditTextColor] = useState<string>("#000000");
  const [editBackgroundColor, setEditBackgroundColor] = useState<string>("rgba(0, 0, 0, 0.6)");
  const [editShowNameBg, setEditShowNameBg] = useState<boolean>(true);
  const [editShowMoreBg, setEditShowMoreBg] = useState<boolean>(true);
  const [editLanguage, setEditLanguage] = useState<string>("nl");

  // Streamer check-in
  const [streamerName, setStreamerName] = useState<string>("");
  const [availableStreamers, setAvailableStreamers] = useState<{ id: string; name: string }[]>([]);
  const [activeStreamer, setActiveStreamer] = useState<{ id: string; name: string; is_active: boolean } | null>(null);

  // Check localStorage voor opgeslagen admin key bij mount
  useEffect(() => {
    const storedKey = localStorage.getItem("adminKey");
    if (storedKey) {
      const validateStoredKey = async () => {
        setIsLoading(true);
        try {
          const r = await fetch(`/api/shops/list?key=${encodeURIComponent(storedKey)}`);
          if (r.ok) {
            setAdminKey(storedKey);
            setIsAuthenticated(true);
          } else {
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

  // Load shops wanneer authenticated
  const loadShops = useCallback(async () => {
    if (!adminKey) return;
    try {
      const r = await fetch(`/api/shops/list?key=${encodeURIComponent(adminKey)}`);
      if (r.ok) {
        const j = await r.json();
        const shopList = j.shops || [];
        setShops(shopList);
        
        // Select first shop if none selected
        if (!selectedShop && shopList.length > 0) {
          setSelectedShop(shopList[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load shops:", err);
    }
  }, [adminKey, selectedShop]);

  useEffect(() => {
    if (isAuthenticated) {
      void loadShops();
    }
  }, [isAuthenticated, loadShops]);
  
  // Keep selectedLikeGoal in sync with selectedShop
  useEffect(() => {
    setSelectedLikeGoal((selectedShop as any)?.like_goal || "");
  }, [selectedShop]);

  const load = useCallback(async () => {
    if (!isAuthenticated || !adminKey || !selectedShop) return;
    const r = await fetch(`/api/queue/state?key=${encodeURIComponent(adminKey)}&shopId=${selectedShop.id}`);
    if (!r.ok) return;
    const j = await r.json();
    setState({
      active: j.active ?? null,
      waiting: j.waiting ?? [],
      totalWaiting: j.totalWaiting ?? 0,
    });
    setLastUpdate(new Date());
  }, [isAuthenticated, adminKey, selectedShop]);

  useEffect(() => {
    if (!isAuthenticated || !selectedShop) return;
    const t = window.setTimeout(() => void load(), 0);
    const id = window.setInterval(() => void load(), 1500);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(id);
    };
  }, [load, isAuthenticated, selectedShop]);

  const post = useCallback(
    async (path: string, body?: unknown) => {
      if (!adminKey || !selectedShop) {
        setAuthError("Sessie verlopen. Log opnieuw in.");
        setIsAuthenticated(false);
        return;
      }

      setIsLoading(true);
      try {
        const r = await fetch(`${path}?key=${encodeURIComponent(adminKey)}&shopId=${selectedShop.id}`, {
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
    [adminKey, selectedShop, load]
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
      const r = await fetch(`/api/shops/list?key=${encodeURIComponent(key)}`);
      
      if (r.ok) {
        setAdminKey(key);
        setIsAuthenticated(true);
        setKeyInput("");
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
    setSelectedShop(null);
    setShops([]);
    localStorage.removeItem("adminKey");
  };

  // Haal actieve streamer op
  const fetchActiveStreamer = useCallback(async () => {
    if (!selectedShop || !isAuthenticated) return;
    
    try {
      const r = await fetch(`/api/streamers/active?shopId=${selectedShop.id}`);
      if (r.ok) {
        const data = await r.json();
        setActiveStreamer(data.activeStreamer);
      }
    } catch (err) {
      console.error("Error fetching active streamer:", err);
    }
  }, [selectedShop, isAuthenticated]);

  // Haal beschikbare streamers op voor dropdown
  const fetchAvailableStreamers = useCallback(async () => {
    if (!selectedShop || !isAuthenticated || !adminKey) return;
    
    try {
      const r = await fetch(`/api/streamers/list?key=${encodeURIComponent(adminKey)}&shopId=${selectedShop.id}`);
      if (r.ok) {
        const data = await r.json();
        // Haal alle unieke streamer namen op
        const uniqueStreamers = data.streamers
          .map((s: { id: string; name: string }) => ({ id: s.id, name: s.name }))
          .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));
        setAvailableStreamers(uniqueStreamers);
      }
    } catch (err) {
      console.error("Error fetching available streamers:", err);
    }
  }, [selectedShop, isAuthenticated, adminKey]);

  // Refresh actieve streamer elke 10 seconden
  useEffect(() => {
    if (!selectedShop || !isAuthenticated) return;
    
    fetchActiveStreamer();
    fetchAvailableStreamers();
    const interval = setInterval(fetchActiveStreamer, 10000);
    return () => clearInterval(interval);
  }, [selectedShop, isAuthenticated, fetchActiveStreamer, fetchAvailableStreamers]);

  const handleStreamerCheckIn = async () => {
    if (!streamerName.trim() || !selectedShop) {
      alert("Selecteer een streamer!");
      return;
    }

    setIsLoading(true);
    try {
      // Haal beschikbare queue orders op
      const ordersRes = await fetch(`/api/queue/orders?key=${encodeURIComponent(adminKey)}&shopId=${selectedShop.id}`);
      
      if (!ordersRes.ok) {
        throw new Error("Kon orders niet ophalen");
      }

      const ordersData = await ordersRes.json();
      const orders = ordersData.orders || [];

      if (orders.length === 0) {
        alert("Er zijn geen orders beschikbaar om als startorder te selecteren!");
        setIsLoading(false);
        return;
      }

      // Toon lijst met orders om uit te kiezen
      const orderList = orders.map((o: any, idx: number) => 
        `${idx + 1}. #${o.order_number} - ${o.first_name} ${o.product_info ? `(${o.product_info})` : ''}`
      ).join('\n');

      const selection = prompt(`Selecteer de START ORDER voor deze sessie:\n\n${orderList}\n\nVoer het nummer in (bijv. 1, 2, 3...):`);
      
      if (!selection) {
        setIsLoading(false);
        return;
      }

      const selectedIndex = parseInt(selection, 10) - 1;
      
      if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= orders.length) {
        alert("Ongeldige selectie!");
        setIsLoading(false);
        return;
      }

      const selectedOrder = orders[selectedIndex];

      // Check-in met selected order ID
      const r = await fetch(`/api/streamers/check-in?key=${encodeURIComponent(adminKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamerName: streamerName.trim(),
          shopId: selectedShop.id,
          startOrderId: selectedOrder.id,
        }),
      });

      if (r.ok) {
        const data = await r.json();
        alert(`${data.message}\nStart order: #${selectedOrder.order_number} - ${selectedOrder.first_name}`);
        setStreamerName("");
        await fetchActiveStreamer();
        await fetchAvailableStreamers();
      } else {
        const err = await r.json();
        alert(`Fout: ${err.error || "Onbekende fout"}`);
      }
    } catch (error) {
      console.error(error);
      alert("Fout bij inchecken streamer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStreamerCheckOut = async () => {
    if (!activeStreamer || !selectedShop) return;

    if (!confirm(`Weet je zeker dat je ${activeStreamer.name} wilt uitchecken?`)) {
      return;
    }

    setIsLoading(true);
    try {
      // Haal beschikbare queue orders op
      const ordersRes = await fetch(`/api/queue/orders?key=${encodeURIComponent(adminKey)}&shopId=${selectedShop.id}`);
      
      if (!ordersRes.ok) {
        throw new Error("Kon orders niet ophalen");
      }

      const ordersData = await ordersRes.json();
      const orders = ordersData.orders || [];

      if (orders.length === 0) {
        alert("Er zijn geen orders beschikbaar om als eindorder te selecteren!");
        setIsLoading(false);
        return;
      }

      // Toon lijst met orders om uit te kiezen
      const orderList = orders.map((o: any, idx: number) => 
        `${idx + 1}. #${o.order_number} - ${o.first_name} ${o.product_info ? `(${o.product_info})` : ''}`
      ).join('\n');

      const selection = prompt(`Selecteer de EIND ORDER voor deze sessie:\n\n${orderList}\n\nVoer het nummer in (bijv. 1, 2, 3...):`);
      
      if (!selection) {
        setIsLoading(false);
        return;
      }

      const selectedIndex = parseInt(selection, 10) - 1;
      
      if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= orders.length) {
        alert("Ongeldige selectie!");
        setIsLoading(false);
        return;
      }

      const selectedOrder = orders[selectedIndex];

      // Check-out met selected order ID
      const r = await fetch(`/api/streamers/check-out?key=${encodeURIComponent(adminKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamerId: activeStreamer.id,
          endOrderId: selectedOrder.id,
        }),
      });

      if (r.ok) {
        const data = await r.json();
        alert(`${data.message}\nEind order: #${selectedOrder.order_number} - ${selectedOrder.first_name}`);
        await fetchActiveStreamer();
      } else {
        const err = await r.json();
        alert(`Fout: ${err.error || "Onbekende fout"}`);
      }
    } catch (error) {
      console.error(error);
      alert("Fout bij uitchecken streamer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateShop = async () => {
    if (!newShopName.trim() || !newShopDisplayName.trim()) {
      alert("Naam en display naam zijn verplicht");
      return;
    }

    setIsLoading(true);
    try {
      const r = await fetch(`/api/shops/create?key=${encodeURIComponent(adminKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newShopName.trim(),
          displayName: newShopDisplayName.trim(),
        }),
      });

      if (r.ok) {
        setNewShopName("");
        setNewShopDisplayName("");
        await loadShops();
        alert("Shop succesvol aangemaakt! De Shopify domain wordt automatisch ingevuld bij de eerste webhook.");
      } else {
        const err = await r.json();
        alert(`Fout: ${err.error || "Onbekende fout"}`);
      }
    } catch {
      alert("Fout bij het aanmaken van shop");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteShop = async (shopId: string) => {
    if (!confirm("Weet je zeker dat je deze shop wilt verwijderen? Alle queue entries worden ook verwijderd.")) {
      return;
    }

    setIsLoading(true);
    try {
      const r = await fetch(`/api/shops/delete?key=${encodeURIComponent(adminKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: shopId }),
      });

      if (r.ok) {
        if (selectedShop?.id === shopId) {
          setSelectedShop(null);
        }
        await loadShops();
        alert("Shop verwijderd");
      } else {
        alert("Fout bij verwijderen");
      }
    } catch {
      alert("Fout bij verwijderen");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateColors = async () => {
    if (!editingShopColors) return;

    setIsLoading(true);
    try {
      const r = await fetch(`/api/shops/update-colors?key=${encodeURIComponent(adminKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingShopColors.id,
          primaryColor: editPrimaryColor,
          textColor: editTextColor,
          backgroundColor: editBackgroundColor,
          showNameBackground: editShowNameBg,
          showMoreBackground: editShowMoreBg,
          language: editLanguage,
        }),
      });

      if (r.ok) {
        await loadShops();
        setEditingShopColors(null);
        alert("Instellingen succesvol bijgewerkt!");
      } else {
        alert("Fout bij bijwerken instellingen");
      }
    } catch {
      alert("Fout bij bijwerken instellingen");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDomain = async (shopId: string, domain: string) => {
    setIsLoading(true);
    try {
      const r = await fetch(`/api/shops/update-domain?key=${encodeURIComponent(adminKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          domain: domain.trim(),
        }),
      });

      if (r.ok) {
        await loadShops();
        alert("Shopify domain succesvol bijgewerkt!");
      } else {
        const err = await r.json();
        alert(`Fout: ${err.error || "Onbekende fout"}`);
      }
    } catch {
      alert("Fout bij bijwerken domain");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleQueueStatus = async () => {
    if (!selectedShop) return;

    const newStatus = !selectedShop.queue_closed;
    setIsLoading(true);
    try {
      const r = await fetch(`/api/shops/toggle-queue?key=${encodeURIComponent(adminKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedShop.id,
          queueClosed: newStatus,
        }),
      });

      if (r.ok) {
        await loadShops();
        // Update selected shop
        const updatedShop = shops.find(s => s.id === selectedShop.id);
        if (updatedShop) {
          setSelectedShop({ ...updatedShop, queue_closed: newStatus });
        }
        alert(newStatus ? "Wachtrij is nu gesloten!" : "Wachtrij is nu open!");
      } else {
        alert("Fout bij wijzigen wachtrij status");
      }
    } catch {
      alert("Fout bij wijzigen wachtrij status");
    } finally {
      setIsLoading(false);
    }
  };

  // Save like goal for selected shop from main admin panel
  const saveSelectedLikeGoal = async () => {
    if (!adminKey || !selectedShop) {
      alert("Geen shop geselecteerd of admin key fehlt");
      return;
    }

    setIsLoading(true);
    try {
      const r = await fetch(`/api/shops/update-like-goal?key=${encodeURIComponent(adminKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedShop.id, likeGoal: selectedLikeGoal }),
      });

      if (!r.ok) {
        const txt = await r.text();
        throw new Error(txt || "Failed to save like goal");
      }

      await loadShops();
      alert("Like goal opgeslagen");
    } catch (err) {
      console.error(err);
      alert("Fout bij opslaan like goal");
    } finally {
      setIsLoading(false);
    }
  };

  // Login scherm
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -inset-[10px] opacity-50">
            <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
            <div className="absolute top-0 -right-4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
            <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
          </div>
        </div>

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

  // Shop Manager Modal
  if (showShopManager) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -inset-[10px] opacity-50">
            <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
            <div className="absolute top-0 -right-4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
            <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
          </div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Shop Beheer</h1>
            <button
              onClick={() => setShowShopManager(false)}
              className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
            >
              Terug naar Queue
            </button>
          </div>

          {/* Create New Shop */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl ring-1 ring-white/20 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Nieuwe Shop Toevoegen</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                value={newShopName}
                onChange={(e) => setNewShopName(e.target.value)}
                placeholder="Shop naam (bijv: mysteryboxnl)"
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="text"
                value={newShopDisplayName}
                onChange={(e) => setNewShopDisplayName(e.target.value)}
                placeholder="Display naam (bijv: MysteryBox.nl)"
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={handleCreateShop}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:scale-105 transition-all disabled:opacity-50"
            >
              Shop Toevoegen
            </button>
            <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500/50 rounded-xl text-blue-200 text-sm space-y-2">
              <div>
                <strong>Stap 1:</strong> Voeg <code className="bg-black/30 px-2 py-1 rounded">SHOPIFY_SECRET_{newShopName.toUpperCase() || "SHOPNAME"}</code> toe aan je environment variables
              </div>
              <div>
                <strong>Stap 2:</strong> De Shopify shop domain wordt <span className="text-green-300 font-semibold">automatisch ingevuld</span> bij de eerste webhook! 🎉
              </div>
            </div>
          </div>

          {/* Existing Shops */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl ring-1 ring-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Bestaande Shops</h2>
            <div className="space-y-3">
              {shops.map((shop) => (
                <div key={shop.id} className="p-4 bg-white/5 rounded-xl">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="text-white font-semibold">{shop.display_name}</div>
                      <div className="text-slate-400 text-sm">Technische naam: {shop.name}</div>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <div className="text-sm font-mono text-white/90 bg-white/5 px-2 py-1 rounded">ID: {shop.id}</div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(shop.id);
                            alert(`Shop ID gekopieerd: ${shop.id}`);
                          }}
                          className="px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 text-sm"
                        >
                          Kopieer ID
                        </button>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        {shop.shopify_shop_domain ? (
                          <div className="text-sm text-green-300 bg-green-500/20 px-2 py-1 rounded flex items-center gap-2">
                            <span>✅ Shopify: {shop.shopify_shop_domain}</span>
                          </div>
                        ) : (
                          <div className="text-sm text-yellow-300 bg-yellow-500/20 px-2 py-1 rounded flex items-center gap-2">
                            <span>⚠️ Shopify domain niet ingesteld</span>
                            <button
                              onClick={() => {
                                const domain = prompt("Voer je Shopify domain in (bijv: mijnshop.myshopify.com):");
                                if (domain) {
                                  handleUpdateDomain(shop.id, domain);
                                }
                              }}
                              className="px-2 py-0.5 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
                            >
                              Instellen
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteShop(shop.id)}
                      className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all"
                    >
                      Verwijderen
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const overlayUrl = `${window.location.origin}/overlay?shopId=${shop.id}`;
                        navigator.clipboard.writeText(overlayUrl);
                        alert(`Overlay URL gekopieerd!\n\n${overlayUrl}`);
                      }}
                      className="flex-1 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-all flex items-center justify-center gap-2"
                    >
                      <span>📋</span>
                      <span>Kopieer Overlay URL</span>
                    </button>
                    <button
                      onClick={() => {
                        window.open(`/overlay?shopId=${shop.id}`, '_blank');
                      }}
                      className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-all"
                    >
                      🔗 Open
                    </button>
                    <button
                      onClick={() => {
                        setEditingShopColors(shop);
                        setEditPrimaryColor(shop.primary_color || "#FFD400");
                        setEditTextColor(shop.text_color || "#000000");
                        setEditBackgroundColor(shop.background_color || "rgba(0, 0, 0, 0.6)");
                        setEditShowNameBg(shop.show_name_background ?? true);
                        setEditShowMoreBg(shop.show_more_background ?? true);
                        setEditLanguage(shop.language || "nl");
                      }}
                      className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-all"
                    >
                      🎨 Instellingen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Color Editor Modal */}
        {editingShopColors && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl p-6 max-w-2xl w-full shadow-2xl ring-1 ring-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">🎨 Pas Instellingen Aan - {editingShopColors.display_name}</h2>
              
              <div className="space-y-4 mb-6">
                {/* Language Selector */}
                <div>
                  <label className="block text-sm text-slate-300 mb-2">🌍 Interface Taal</label>
                  <select
                    value={editLanguage}
                    onChange={(e) => setEditLanguage(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="nl" className="bg-slate-800">🇳🇱 Nederlands</option>
                    <option value="de" className="bg-slate-800">🇩🇪 Deutsch</option>
                  </select>
                  <p className="text-xs text-slate-400 mt-1">Kies de taal voor overlays en widgets</p>
                </div>

                <div className="border-t border-white/10 my-4"></div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Primaire Kleur (namen text)</label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={editPrimaryColor}
                      onChange={(e) => setEditPrimaryColor(e.target.value)}
                      className="w-20 h-12 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editPrimaryColor}
                      onChange={(e) => setEditPrimaryColor(e.target.value)}
                      placeholder="#FFD400"
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Standaard: #FFD400 (geel)</p>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Text Kleur (En nog X meer)</label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={editTextColor}
                      onChange={(e) => setEditTextColor(e.target.value)}
                      className="w-20 h-12 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editTextColor}
                      onChange={(e) => setEditTextColor(e.target.value)}
                      placeholder="#000000"
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Standaard: #000000 (zwart)</p>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Achtergrond Kleur (naam vakjes)</label>
                  <input
                    type="text"
                    value={editBackgroundColor}
                    onChange={(e) => setEditBackgroundColor(e.target.value)}
                    placeholder="rgba(0, 0, 0, 0.6)"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">Standaard: rgba(0, 0, 0, 0.6) - Gebruik rgba() voor transparantie</p>
                </div>

                {/* Background Toggles */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editShowNameBg}
                      onChange={(e) => setEditShowNameBg(e.target.checked)}
                      className="w-5 h-5 rounded cursor-pointer"
                    />
                    <span className="text-slate-300 text-sm">Toon achtergrond bij namen</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editShowMoreBg}
                      onChange={(e) => setEditShowMoreBg(e.target.checked)}
                      className="w-5 h-5 rounded cursor-pointer"
                    />
                    <span className="text-slate-300 text-sm">Toon achtergrond bij &quot;En nog X meer&quot;</span>
                  </label>
                </div>

                {/* Preview */}
                <div className="p-4 bg-black/30 rounded-xl">
                  <p className="text-slate-300 text-sm mb-2">Voorbeeld:</p>
                  <div className="space-y-2">
                    <div>
                      <span
                        style={{
                          backgroundColor: editShowNameBg ? editBackgroundColor : "transparent",
                          color: editPrimaryColor,
                          padding: "8px 16px",
                          borderRadius: "8px",
                          fontWeight: "bold",
                          WebkitTextStroke: "2px black",
                        }}
                      >
                        Voorbeeld Naam
                      </span>
                    </div>
                    <div>
                      <span
                        style={{
                          backgroundColor: editShowMoreBg ? editPrimaryColor : "transparent",
                          color: editTextColor,
                          padding: "10px 20px",
                          borderRadius: "8px",
                          fontWeight: "bold",
                        }}
                      >
                        En nog 3 meer...
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setEditingShopColors(null)}
                  className="flex-1 px-6 py-3 bg-slate-500/20 text-slate-300 rounded-xl hover:bg-slate-500/30 transition-all font-semibold"
                >
                  Annuleren
                </button>
                <button
                  onClick={async () => {
                    if (!editingShopColors) return;
                    setIsLoading(true);
                    try {
                      // First update colors and language
                      const r1 = await fetch(`/api/shops/update-colors?key=${encodeURIComponent(adminKey)}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          id: editingShopColors.id,
                          primaryColor: editPrimaryColor,
                          textColor: editTextColor,
                          backgroundColor: editBackgroundColor,
                          showNameBackground: editShowNameBg,
                          showMoreBackground: editShowMoreBg,
                          language: editLanguage,
                        }),
                      });

                      if (!r1.ok) throw new Error("Failed to update colors");

                      await loadShops();
                      setEditingShopColors(null);
                      alert("Instellingen succesvol bijgewerkt!");
                    } catch (err) {
                      console.error(err);
                      alert("Fout bij bijwerken instellingen");
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:scale-105 transition-all font-semibold disabled:opacity-50"
                >
                  Opslaan
                </button>
              </div>
            </div>
          </div>
        )}

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

  // Admin Dashboard - zie volgende deel
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-[10px] opacity-50">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-0 -right-4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
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
              onClick={() => setShowShopManager(true)}
              className="px-3 sm:px-4 py-2 bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/50 rounded-full text-xs sm:text-sm font-medium hover:bg-blue-500/30 transition-all"
            >
              Beheer Shops
            </button>
            <button
              onClick={handleLogout}
              className="px-3 sm:px-4 py-2 bg-red-500/20 text-red-300 ring-1 ring-red-500/50 rounded-full text-xs sm:text-sm font-medium hover:bg-red-500/30 transition-all"
            >
              Uitloggen
            </button>
          </div>

          <div className="mt-4">
            <label className="block text-sm text-slate-300 mb-2">Actieve Shop:</label>
            <select
              value={selectedShop?.id || ""}
              onChange={(e) => {
                const shop = shops.find(s => s.id === e.target.value);
                setSelectedShop(shop || null);
              }}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer hover:bg-white/15 transition-all"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.5rem',
                paddingRight: '2.5rem'
              }}
            >
              <option value="" className="bg-slate-900 text-slate-400">Selecteer een shop...</option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id} className="bg-slate-900 text-white py-2">
                  {shop.display_name}
                </option>
              ))}
            </select>
          </div>

          {selectedShop && (
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const overlayUrl = `${window.location.origin}/overlay?shopId=${selectedShop.id}`;
                    navigator.clipboard.writeText(overlayUrl);
                    alert(`Overlay URL gekopieerd voor ${selectedShop.display_name}!\n\n${overlayUrl}`);
                  }}
                  className="flex-1 px-4 py-2.5 bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/50 rounded-xl hover:bg-purple-500/30 transition-all flex items-center justify-center gap-2 font-medium"
                >
                  <span>📋</span>
                  <span>Kopieer Overlay URL</span>
                </button>
                <button
                  onClick={() => {
                    window.open(`/overlay?shopId=${selectedShop.id}`, '_blank');
                  }}
                  className="px-4 py-2.5 bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/50 rounded-xl hover:bg-blue-500/30 transition-all font-medium"
                >
                  🔗 Open
                </button>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const widgetUrl = `${window.location.origin}/shopify-widget?shopId=${selectedShop.id}`;
                    navigator.clipboard.writeText(widgetUrl);
                    alert(`Shopify Widget URL gekopieerd voor ${selectedShop.display_name}!\n\n${widgetUrl}\n\nZie SHOPIFY_WIDGET_SETUP.md voor installatie instructies.`);
                  }}
                  className="flex-1 px-4 py-2.5 bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/50 rounded-xl hover:bg-orange-500/30 transition-all flex items-center justify-center gap-2 font-medium"
                >
                  <span>🛍️</span>
                  <span>Kopieer Shopify Widget URL</span>
                </button>
                <button
                  onClick={() => {
                    window.open(`/shopify-widget?shopId=${selectedShop.id}`, '_blank');
                  }}
                  className="px-4 py-2.5 bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/50 rounded-xl hover:bg-orange-500/30 transition-all font-medium"
                >
                  🔗 Open
                </button>
              </div>

              {/* New: quick Store ID + Like Goal panel */}
              <div className="mt-3 p-4 bg-white/5 rounded-2xl shadow-inner">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-slate-300">Store ID</div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-mono text-white/90 bg-white/5 px-2 py-1 rounded">{selectedShop.id}</div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedShop.id);
                        alert(`Shop ID gekopieerd: ${selectedShop.id}`);
                      }}
                      className="px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 text-sm"
                    >
                      Kopieer ID
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">🎯 Like Goal</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={selectedLikeGoal}
                      onChange={(e) => setSelectedLikeGoal(e.target.value)}
                      placeholder="Bijv: 100k likes — Win a giveaway"
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={saveSelectedLikeGoal}
                      disabled={isLoading || !adminKey}
                      className="px-4 py-2 bg-green-500/20 text-green-200 rounded-xl hover:bg-green-500/30 transition-all disabled:opacity-50"
                    >
                      Opslaan
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Zichtbaar via /api/like-goal?store=&lt;shopId&gt;</p>
                </div>

                {/* Streamer Check-in */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-slate-200">🎙️ Actieve Streamer</label>
                    <button
                      onClick={() => {
                        if (window.confirm("Bekijk gedetailleerde streamer statistieken?")) {
                          window.open("/streamer-stats", "_blank");
                        }
                      }}
                      className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-lg hover:bg-purple-500/30 transition-all"
                    >
                      📊 Statistieken
                    </button>
                  </div>
                  
                  {activeStreamer && activeStreamer.is_active ? (
                    <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-3 mb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-green-200 font-semibold flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            {activeStreamer.name}
                          </div>
                          <div className="text-xs text-green-300/70 mt-1">🟢 Momenteel live</div>
                        </div>
                        <button
                          onClick={handleStreamerCheckOut}
                          disabled={isLoading}
                          className="px-4 py-2 bg-red-500/30 text-red-200 rounded-lg hover:bg-red-500/50 transition-all text-sm font-medium disabled:opacity-50"
                        >
                          Check-out
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 mb-3 bg-slate-700/30 rounded-lg p-2 text-center">
                      Geen actieve streamer — orders worden niet toegeschreven
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Selecteer streamer:</label>
                      <select
                        value={streamerName}
                        onChange={(e) => setStreamerName(e.target.value)}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer hover:bg-white/15 transition-all"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 0.75rem center',
                          backgroundSize: '1.5rem',
                          paddingRight: '2.5rem'
                        }}
                      >
                        <option value="" className="bg-slate-900">-- Kies een streamer --</option>
                        {availableStreamers.map((s) => (
                          <option key={s.id} value={s.name} className="bg-slate-900">
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <button
                      onClick={handleStreamerCheckIn}
                      disabled={isLoading || !streamerName.trim()}
                      className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:scale-105 transition-all disabled:opacity-50 font-medium"
                    >
                      Check-in
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    💡 Check-in streamer voordat de live begint. Alle nieuwe orders worden automatisch toegeschreven.
                    {availableStreamers.length === 0 && " Voeg eerst streamers toe via de statistieken pagina."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {!selectedShop ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl ring-1 ring-white/20 text-center">
            <div className="text-6xl mb-4">🏪</div>
            <h2 className="text-2xl font-bold text-white mb-2">Selecteer een shop</h2>
            <p className="text-slate-300">Kies een shop uit het dropdown menu hierboven om te beginnen.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 shadow-2xl ring-1 ring-white/20">
                <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">🎮</span>
                  <span>Wachtrij Beheer</span>
                </h2>
                
                {/* Toggle Wachtrij Status */}
                <div className="mb-4">
                  <button
                    onClick={toggleQueueStatus}
                    disabled={!adminKey || isLoading}
                    className={`w-full px-6 py-4 text-white text-base font-semibold rounded-xl shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                      selectedShop?.queue_closed
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-green-500/50"
                        : "bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-red-500/50"
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span className="text-xl">{selectedShop?.queue_closed ? "✅" : "🔒"}</span>
                      <span>{selectedShop?.queue_closed ? "Open Wachtrij" : "Sluit Wachtrij"}</span>
                    </span>
                  </button>
                </div>

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
                        void post("/api/queue/add", { firstName: name, shopId: selectedShop.id });
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
                      void post("/api/queue/add", { firstName: name, shopId: selectedShop.id });
                    }}
                    disabled={!adminKey || isLoading || !manualName.trim()}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm sm:text-base font-semibold rounded-xl shadow-lg hover:shadow-purple-500/50 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap"
                  >
                    Toevoegen
                  </button>
                </div>
              </div>

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
                          <span className="text-white font-medium text-sm sm:text-base flex-1 min-w-0 truncate">{person.first_name}</span>
                          <button
                            onClick={() => {
                              const ok = window.confirm(`Weet je zeker dat je ${person.first_name} uit de wachtrij wilt verwijderen?`);
                              if (ok) void post("/api/queue/remove", { id: person.id });
                            }}
                            disabled={isLoading}
                            className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-red-200 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/30 hover:border-red-500/50"
                            title="Verwijder uit wachtrij"
                          >
                            <span className="text-base sm:text-lg font-bold">×</span>
                          </button>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
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
        )}

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
