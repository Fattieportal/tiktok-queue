import { useEffect, useState } from "react";
import { useRouter } from "next/router";

type StreamerStat = {
  id: string;
  name: string;
  shop_id: string;
  shop_name: string;
  total_orders: number;
  completed_orders: number;
  waiting_orders: number;
  active_orders: number;
  first_order_at: string | null;
  last_order_at: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  is_active: boolean;
};

type Shop = {
  id: string;
  name: string;
  domain?: string;
};

export default function StreamerStats() {
  const router = useRouter();
  const [adminKey, setAdminKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [streamers, setStreamers] = useState<StreamerStat[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check of admin key geldig is
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const r = await fetch(`/api/shops/list?key=${encodeURIComponent(adminKey)}`);
      if (r.ok) {
        const data = await r.json();
        setShops(data.shops || []);
        setIsAuthenticated(true);
        if (data.shops && data.shops.length > 0) {
          setSelectedShop(data.shops[0]);
        }
      } else {
        alert("Ongeldige admin key!");
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
          `/api/streamers/list?key=${encodeURIComponent(adminKey)}&shopId=${selectedShop.id}`
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
  }, [isAuthenticated, selectedShop, adminKey]);

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
            Alleen toegankelijk met admin key
          </p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Admin Key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
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
            <h2 style={{ margin: 0 }}>Streamer Overzicht</h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
                  <th style={{ padding: "16px", textAlign: "left", fontWeight: "600" }}>Status</th>
                  <th style={{ padding: "16px", textAlign: "left", fontWeight: "600" }}>Naam</th>
                  <th style={{ padding: "16px", textAlign: "right", fontWeight: "600" }}>
                    Totaal Orders
                  </th>
                  <th style={{ padding: "16px", textAlign: "right", fontWeight: "600" }}>
                    Voltooid
                  </th>
                  <th style={{ padding: "16px", textAlign: "right", fontWeight: "600" }}>
                    Wachtend
                  </th>
                  <th style={{ padding: "16px", textAlign: "left", fontWeight: "600" }}>
                    Ingecheckt
                  </th>
                  <th style={{ padding: "16px", textAlign: "left", fontWeight: "600" }}>
                    Uitgecheckt
                  </th>
                </tr>
              </thead>
              <tbody>
                {streamers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#666" }}>
                      Nog geen streamers ingecheckt voor deze shop
                    </td>
                  </tr>
                ) : (
                  streamers.map((streamer) => (
                    <tr
                      key={streamer.id}
                      style={{
                        borderBottom: "1px solid #f0f0f0",
                        background: streamer.is_active ? "#f0fdf4" : "white",
                      }}
                    >
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
                      <td style={{ padding: "16px", fontSize: "14px" }}>
                        {formatDate(streamer.checked_in_at)}
                      </td>
                      <td style={{ padding: "16px", fontSize: "14px" }}>
                        {formatDate(streamer.checked_out_at)}
                      </td>
                    </tr>
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
