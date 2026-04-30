import React, { useState, useCallback, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";

// --- CONFIGURATION ---
const SUPABASE_URL = "https://cxjmwjljjnuthcrmnbqb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4am13amxqam51dGhjcm1uYnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTYzMzUsImV4cCI6MjA5MjY3MjMzNX0.ynRaceAT1uWcsPOJ_5vY_8NKolM3EaWKQajUEk4sLz8";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- STYLES & UTILS ---
const clr = { bg: "#0f1117", card: "#1a1d26", card2: "#22263a", accent: "#f5a623", green: "#22c55e", red: "#ef4444", blue: "#3b82f6", purple: "#a855f7", muted: "#6b7280", border: "#2d3148", text: "#f1f5f9" };
const fmt = (n, d = 0) => (isNaN(n) || n === null ? "0" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d }));
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "-";
const today = () => new Date().toISOString().slice(0, 10);
const uid = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 9);

const s = {
  screen: { minHeight: "100vh", background: clr.bg, color: clr.text, fontFamily: "'Segoe UI', sans-serif", maxWidth: 480, margin: "0 auto", paddingBottom: 100 },
  header: { background: clr.card, padding: "16px", borderBottom: `1px solid ${clr.border}`, position: "sticky", top: 0, zIndex: 100 },
  card: { background: clr.card, borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${clr.border}` },
  card2: { background: clr.card2, borderRadius: 10, padding: 12, marginBottom: 8 },
  input: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 8, padding: "12px", color: clr.text, boxSizing: "border-box", marginBottom: 10 },
  btn: (bg = clr.accent, txt = "#000") => ({ background: bg, color: txt, border: "none", borderRadius: 8, padding: "12px", fontWeight: 700, width: "100%", cursor: "pointer" }),
  nav: { position: "fixed", bottom: 0, width: "100%", maxWidth: 480, background: clr.card, display: "flex", borderTop: `1px solid ${clr.border}` },
  navItem: (active) => ({ flex: 1, padding: "12px", textAlign: "center", color: active ? clr.accent : clr.muted, cursor: "pointer", fontSize: "12px", fontWeight: 600 })
};

// --- CORE HOOK ---
const useSupabaseTable = (tableName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from(tableName).select("*").order("created_at", { ascending: false });
    if (!error) setData(rows || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [tableName]);

  const addItem = async (item) => {
    const { error } = await supabase.from(tableName).insert([item]);
    if (!error) fetchAll();
    else alert("Error saving: " + error.message);
  };

  const editItem = async (item) => {
    const { id, ...updates } = item;
    const { error } = await supabase.from(tableName).update(updates).eq("id", id);
    if (!error) fetchAll();
  };

  const deleteItem = async (id) => {
    const { error } = await supabase.from(tableName).delete().eq("id", id);
    if (!error) fetchAll();
  };

  return [data, { addItem, editItem, deleteItem, refresh: fetchAll, loading }];
};

// --- UI COMPONENTS ---
const Badge = ({ v, col = clr.accent }) => <span style={{ background: col + "22", color: col, padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, marginRight: 5 }}>{v}</span>;

// --- SCREENS ---
const Dashboard = ({ purchases, dispatches, sales }) => {
  const stock = purchases.reduce((s, p) => s + (parseFloat(p.manual_bags) || 0), 0) - dispatches.flatMap(d => d.items || []).reduce((s, i) => s + (parseFloat(i.bags_loaded) || 0), 0);
  const pendingReceive = sales.reduce((sum, s) => sum + (s.lot_sales?.reduce((lsSum, ls) => lsSum + (ls.netSale || 0), 0) || 0), 0);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ ...s.card, borderColor: clr.accent }}>
          <div style={{ fontSize: 12, color: clr.muted }}>Stock (Bags)</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: clr.accent }}>{fmt(stock)}</div>
        </div>
        <div style={{ ...s.card, borderColor: clr.red }}>
          <div style={{ fontSize: 12, color: clr.muted }}>Pending Receive</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: clr.red }}>₹{fmt(pendingReceive)}</div>
        </div>
      </div>
      
      <h3 style={{ marginTop: 20 }}>Recent Activity</h3>
      {purchases.slice(0, 5).map(p => (
        <div key={p.id} style={s.card2}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{p.kisan_name}</span>
            <span style={{ color: clr.green }}>+{p.manual_bags} Bags</span>
          </div>
        </div>
      ))}
      {/* "Supabase Connected" alert removed as requested */}
    </div>
  );
};

// ... (Other Screens: PurchaseScreen, DispatchScreen, SaleScreen would go here similar to your index.js logic but using the refreshed addItem/editItem)

// --- MAIN APP ---
const App = () => {
  const [tab, setTab] = useState("home");
  const [purchases, pOps] = useSupabaseTable("purchases");
  const [dispatches, dOps] = useSupabaseTable("dispatches");
  const [sales, sOps] = useSupabaseTable("sales");
  const [parties] = useSupabaseTable("parties");
  const [mandis] = useSupabaseTable("mandis");
  const [varieties] = useSupabaseTable("varieties");
  const [gradings] = useSupabaseTable("gradings");
  const [coldStorages] = useSupabaseTable("cold_storages");

  return (
    <div style={s.screen}>
      <header style={s.header}>
        <h2 style={{ margin: 0, color: clr.accent }}>🥔 AlooTrader</h2>
        <div style={{ fontSize: 12, color: clr.muted }}>आलू व्यापार प्रबंधन | {fmtDate(new Date())}</div>
      </header>

      {tab === "home" && <Dashboard purchases={purchases} dispatches={dispatches} sales={sales} />}
      {/* Map other tabs to your existing Screen components */}

      <nav style={s.nav}>
        {["home", "purchase", "dispatch", "sale"].map(t => (
          <div key={t} onClick={() => setTab(t)} style={s.navItem(tab === t)}>
            <div style={{ textTransform: "capitalize" }}>{t}</div>
          </div>
        ))}
      </nav>
    </div>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);
