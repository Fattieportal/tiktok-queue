import { useEffect, useState } from "react";
import { useRouter } from "next/router";

type OrderDetail = {
  id: number;
  order_number: string;
  first_name: string;
  product_info: string | null;
  status: string;
  created_at: string;
  total_price: number;
  currency: string;
};

type StreamerStat = {
  id: string;
  name: string;
  shop_id: string;
  shop_name: string;
  total_orders: number;
  completed_orders: number;
  waiting_orders: number;
  active_orders: number;
  skipped_orders?: number;
  first_order_at: string | null;
  last_order_at: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  is_active: boolean;
  total_revenue: number;
  average_order_value: number;
  order_details?: OrderDetail[];
};

type Shop = {
  id: string;
  name: string;
  domain?: string;
};

export default function StreamerStats() {
  const router = useRouter();
  const [streamerKey, setStreamerKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [streamers, setStreamers] = useState<StreamerStat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedStreamer, setExpandedStreamer] = useState<string | null>(null);
  const [showAddStreamer, setShowAddStreamer] = useState(false);
  const [newStreamerName, setNewStreamerName] = useState("");

  // Check of streamer key geldig is
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const r = await fetch(`/api/shops/list?key=${encodeURIComponent(streamerKey)}`);
      if (r.ok) {
        const data = await r.json();
        setShops(data.shops || []);
        setIsAuthenticated(true);
        if (data.shops && data.shops.length > 0) {
          setSelectedShop(data.shops[0]);
        }
      } else {
        alert("Ongeldige streamer key!");
      }
    } catch {
      alert("Fout bij inloggen");
    } finally {
      setIsLoading(false);
    }
  };

  // Haal streamer stats op
  useEffect(() => {
    if (!isAuthenticated || !selectedShop) return;

    const fetchStats = async () => {
      try {
        const r = await fetch(
          `/api/streamers/list?key=${encodeURIComponent(streamerKey)}&shopId=${selectedShop.id}`
        );
        if (r.ok) {
          const data = await r.json();
          setStreamers(data.streamers || []);
        }
      } catch (err) {
        console.error("Error fetching streamer stats:", err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Update elke 10 sec
    return () => clearInterval(interval);
  }, [isAuthenticated, selectedShop, streamerKey]);

  const handleCheckOut = async (streamerId: string, streamerName: string) => {
    if (!confirm(`Weet je zeker dat je ${streamerName} wilt uitchecken?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const r = await fetch(`/api/streamers/check-out?key=${encodeURIComponent(streamerKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamerId }),
      });

      if (r.ok) {
        alert(`${streamerName} is uitgecheckt!`);
        // Refresh data
        const statsR = await fetch(
          `/api/streamers/list?key=${encodeURIComponent(streamerKey)}&shopId=${selectedShop?.id}`
        );
        if (statsR.ok) {
          const data = await statsR.json();
          setStreamers(data.streamers || []);
        }
      } else {
        const err = await r.json();
        alert(`Fout: ${err.error || "Onbekende fout"}`);
      }
    } catch {
      alert("Fout bij uitchecken streamer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStreamer = async () => {
    if (!newStreamerName.trim() || !selectedShop) {
      alert("Voer een streamer naam in!");
      return;
    }

    setIsLoading(true);
    try {
      // Maak streamer aan via create API (niet actief)
      const r = await fetch(`/api/streamers/create?key=${encodeURIComponent(streamerKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamerName: newStreamerName.trim(),
          shopId: selectedShop.id,
        }),
      });

      if (r.ok) {
        const data = await r.json();
        alert(data.message);
        setNewStreamerName("");
        setShowAddStreamer(false);
        
        // Refresh data
        const statsR = await fetch(
          `/api/streamers/list?key=${encodeURIComponent(streamerKey)}&shopId=${selectedShop.id}`
        );
        if (statsR.ok) {
          const statsData = await statsR.json();
          setStreamers(statsData.streamers || []);
        }
      } else {
        const err = await r.json();
        alert(`Fout: ${err.error || "Onbekende fout"}`);
      }
    } catch {
      alert("Fout bij toevoegen streamer");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "40px",
            borderRadius: "16px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            maxWidth: "400px",
            width: "100%",
          }}
        >
          <h1 style={{ marginBottom: "10px", color: "#1a1a1a" }}>🎯 Streamer Statistieken</h1>
          <p style={{ color: "#666", marginBottom: "30px", fontSize: "14px" }}>
            Alleen toegankelijk met streamer key
          </p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Streamer Key"
              value={streamerKey}
              onChange={(e) => setStreamerKey(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "2px solid #e0e0e0",
                fontSize: "16px",
                marginBottom: "20px",
              }}
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "12px",
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {isLoading ? "Laden..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalOrders = streamers.reduce((sum, s) => sum + s.total_orders, 0);
  const totalRevenue = streamers.reduce((sum, s) => sum + (s.total_revenue || 0), 0);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "16px",
            marginBottom: "20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ margin: 0, marginBottom: "8px", color: "#1a1a1a" }}>
                🎯 Streamer Statistieken
              </h1>
              <p style={{ margin: 0, color: "#666" }}>
                Bekijk de prestaties van elke streamer per webshop
              </p>
            </div>
            <button
              onClick={() => router.push("/admin")}
              style={{
                padding: "10px 20px",
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              ← Terug naar Admin
            </button>
          </div>
        </div>

        {/* Shop Selector */}
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "16px",
            marginBottom: "20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
            Selecteer Webshop:
          </label>
          <select
            value={selectedShop?.id || ""}
            onChange={(e) => {
              const shop = shops.find((s) => s.id === e.target.value);
              setSelectedShop(shop || null);
            }}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "2px solid #e0e0e0",
              fontSize: "16px",
            }}
          >
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name} {shop.domain ? `(${shop.domain})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Summary Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
              Totaal Streamers
            </div>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: "#667eea" }}>
              {streamers.length}
            </div>
          </div>
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
              Actieve Streamers
            </div>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: "#10b981" }}>
              {streamers.filter((s) => s.is_active).length}
            </div>
          </div>
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
              Totaal Orders
            </div>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: "#f59e0b" }}>
              {totalOrders}
            </div>
          </div>
        </div>

        {/* Add Streamer Section */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
              👥 Streamer Beheer
            </h3>
            {!showAddStreamer && (
              <button
                onClick={() => setShowAddStreamer(true)}
                style={{
                  padding: "8px 16px",
                  background: "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                + Nieuwe Streamer
              </button>
            )}
          </div>

          {showAddStreamer ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ 
                padding: "16px", 
                background: "#f8f9fa", 
                borderRadius: "8px",
                border: "2px dashed #667eea"
              }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>
                  Streamer Naam:
                </label>
                <input
                  type="text"
                  value={newStreamerName}
                  onChange={(e) => setNewStreamerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newStreamerName.trim()) {
                      handleAddStreamer();
                    }
                  }}
                  placeholder="Bijv: Emma, Lars, Sophie..."
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #e0e0e0",
                    fontSize: "14px",
                  }}
                  autoFocus
                />
                <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#666" }}>
                  💡 Deze naam verschijnt in de dropdown lijst in het admin panel
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => {
                    setShowAddStreamer(false);
                    setNewStreamerName("");
                  }}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#e5e7eb",
                    color: "#374151",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Annuleren
                </button>
                <button
                  onClick={handleAddStreamer}
                  disabled={isLoading || !newStreamerName.trim()}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#667eea",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: isLoading || !newStreamerName.trim() ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    opacity: isLoading || !newStreamerName.trim() ? 0.5 : 1,
                  }}
                >
                  {isLoading ? "Toevoegen..." : "✓ Toevoegen"}
                </button>
              </div>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
              Voeg streamers toe zodat ze eenvoudig kunnen inchecken via een dropdown lijst in het admin panel.
            </p>
          )}
        </div>

        {/* Streamers Table */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "20px", borderBottom: "2px solid #f0f0f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0 }}>Streamer Overzicht</h2>
              <div style={{ fontSize: "13px", color: "#6b7280" }}>
                💡 Klik op ▶ om orders te bekijken
              </div>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
                  <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", width: "40px" }}></th>
                  <th style={{ padding: "16px", textAlign: "left", fontWeight: "600" }}>Status</th>
                  <th style={{ padding: "16px", textAlign: "left", fontWeight: "600" }}>Naam</th>
                  <th style={{ padding: "16px", textAlign: "right", fontWeight: "600" }}>
                    Totaal
                  </th>
                  <th style={{ padding: "16px", textAlign: "right", fontWeight: "600" }}>
                    Voltooid
                  </th>
                  <th style={{ padding: "16px", textAlign: "right", fontWeight: "600" }}>
                    Wachtend
                  </th>
                  <th style={{ padding: "16px", textAlign: "right", fontWeight: "600" }}>
                    💰 Revenue
                  </th>
                  <th style={{ padding: "16px", textAlign: "right", fontWeight: "600" }}>
                    📊 Gem. Waarde
                  </th>
                  <th style={{ padding: "16px", textAlign: "left", fontWeight: "600" }}>
                    Ingecheckt
                  </th>
                  <th style={{ padding: "16px", textAlign: "left", fontWeight: "600" }}>
                    Uitgecheckt
                  </th>
                  <th style={{ padding: "16px", textAlign: "center", fontWeight: "600" }}>Acties</th>
                </tr>
              </thead>
              <tbody>
                {streamers.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ padding: "40px", textAlign: "center", color: "#666" }}>
                      Nog geen streamers ingecheckt voor deze shop
                    </td>
                  </tr>
                ) : (
                  streamers.map((streamer) => (
                    <>
                      <tr
                        key={streamer.id}
                        style={{
                          borderBottom: expandedStreamer === streamer.id ? "none" : "1px solid #f0f0f0",
                          background: streamer.is_active ? "#f0fdf4" : "white",
                        }}
                      >
                        <td style={{ padding: "16px", textAlign: "center" }}>
                          <button
                            onClick={() => setExpandedStreamer(expandedStreamer === streamer.id ? null : streamer.id)}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "18px",
                              transition: "transform 0.2s",
                              transform: expandedStreamer === streamer.id ? "rotate(90deg)" : "rotate(0deg)",
                            }}
                            title="Bekijk orders"
                          >
                            ▶
                          </button>
                        </td>
                        <td style={{ padding: "16px" }}>
                          {streamer.is_active ? (
                            <span
                              style={{
                                background: "#10b981",
                                color: "white",
                                padding: "4px 12px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              🟢 ACTIEF
                            </span>
                          ) : (
                            <span
                              style={{
                                background: "#e5e7eb",
                                color: "#6b7280",
                                padding: "4px 12px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              ⚫ Offline
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "16px", fontWeight: "600" }}>{streamer.name}</td>
                        <td style={{ padding: "16px", textAlign: "right", fontSize: "18px", fontWeight: "bold" }}>
                          {streamer.total_orders}
                        </td>
                        <td style={{ padding: "16px", textAlign: "right", color: "#10b981" }}>
                          {streamer.completed_orders}
                        </td>
                        <td style={{ padding: "16px", textAlign: "right", color: "#f59e0b" }}>
                          {streamer.waiting_orders}
                        </td>
                        <td style={{ padding: "16px", textAlign: "right", fontSize: "16px", fontWeight: "bold", color: "#059669" }}>
                          €{(streamer.total_revenue || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: "16px", textAlign: "right", fontSize: "14px", color: "#6b7280" }}>
                          €{(streamer.average_order_value || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: "16px", fontSize: "14px" }}>
                          {formatDate(streamer.checked_in_at)}
                        </td>
                        <td style={{ padding: "16px", fontSize: "14px" }}>
                          {formatDate(streamer.checked_out_at)}
                        </td>
                        <td style={{ padding: "16px", textAlign: "center" }}>
                          {streamer.is_active && (
                            <button
                              onClick={() => handleCheckOut(streamer.id, streamer.name)}
                              disabled={isLoading}
                              style={{
                                padding: "6px 12px",
                                background: "#ef4444",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: isLoading ? "not-allowed" : "pointer",
                                fontSize: "13px",
                                fontWeight: "600",
                                opacity: isLoading ? 0.5 : 1,
                              }}
                            >
                              Check-out
                            </button>
                          )}
                        </td>
                      </tr>
                      
                      {/* Expandable row met order details */}
                      {expandedStreamer === streamer.id && streamer.order_details && streamer.order_details.length > 0 && (
                        <tr key={`${streamer.id}-details`}>
                          <td colSpan={11} style={{ padding: 0, background: "#f8f9fa" }}>
                            <div style={{ padding: "16px 32px" }}>
                              <h4 style={{ margin: "0 0 12px 0", color: "#374151", fontSize: "14px", fontWeight: "600" }}>
                                📦 Orders van {streamer.name} ({streamer.order_details.length}) • Totaal: €{(streamer.total_revenue || 0).toFixed(2)}
                              </h4>
                              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                                <table style={{ width: "100%", fontSize: "13px" }}>
                                  <thead>
                                    <tr style={{ background: "#e5e7eb" }}>
                                      <th style={{ padding: "8px", textAlign: "left" }}>Order #</th>
                                      <th style={{ padding: "8px", textAlign: "left" }}>Klant</th>
                                      <th style={{ padding: "8px", textAlign: "left" }}>Producten</th>
                                      <th style={{ padding: "8px", textAlign: "right" }}>💰 Prijs</th>
                                      <th style={{ padding: "8px", textAlign: "center" }}>Status</th>
                                      <th style={{ padding: "8px", textAlign: "left" }}>Datum</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {streamer.order_details.map((order) => (
                                      <tr key={order.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                                        <td style={{ padding: "8px" }}>
                                          <span style={{ fontFamily: "monospace", fontWeight: "600" }}>
                                            {order.order_number}
                                          </span>
                                        </td>
                                        <td style={{ padding: "8px" }}>{order.first_name}</td>
                                        <td style={{ padding: "8px", maxWidth: "300px" }}>
                                          <div style={{ 
                                            whiteSpace: "nowrap", 
                                            overflow: "hidden", 
                                            textOverflow: "ellipsis",
                                            color: "#6b7280"
                                          }}>
                                            {order.product_info || "Geen product info"}
                                          </div>
                                        </td>
                                        <td style={{ padding: "8px", textAlign: "right", fontWeight: "600", color: "#059669" }}>
                                          €{(order.total_price || 0).toFixed(2)}
                                        </td>
                                        <td style={{ padding: "8px", textAlign: "center" }}>
                                          <span style={{
                                            padding: "3px 8px",
                                            borderRadius: "6px",
                                            fontSize: "11px",
                                            fontWeight: "600",
                                            background: 
                                              order.status === "completed" ? "#d1fae5" :
                                              order.status === "active" ? "#dbeafe" :
                                              order.status === "waiting" ? "#fef3c7" :
                                              "#f3f4f6",
                                            color:
                                              order.status === "completed" ? "#065f46" :
                                              order.status === "active" ? "#1e40af" :
                                              order.status === "waiting" ? "#92400e" :
                                              "#374151",
                                          }}>
                                            {order.status === "completed" ? "✓ Voltooid" :
                                             order.status === "active" ? "▶ Actief" :
                                             order.status === "waiting" ? "⏳ Wachtend" :
                                             order.status}
                                          </span>
                                        </td>
                                        <td style={{ padding: "8px", color: "#6b7280" }}>
                                          {formatDate(order.created_at)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
