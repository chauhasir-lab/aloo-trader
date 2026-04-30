import React, { useState, useCallback, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cxjmwjljjnuthcrmnbqb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4am13amxqam51dGhjcm1uYnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTYzMzUsImV4cCI6MjA5MjY3MjMzNX0.ynRaceAT1uWcsPOJ_5vY_8NKolM3EaWKQajUEk4sLz8";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- UTILS & STYLES ---
const uid = () => crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const fmt = (n, d = 0) => (isNaN(n) ? "0" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d }));
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "-";
const today = () => new Date().toISOString().slice(0, 10);
const clr = { bg: "#0f1117", card: "#1a1d26", card2: "#22263a", accent: "#f5a623", green: "#22c55e", red: "#ef4444", blue: "#3b82f6", purple: "#a855f7", muted: "#6b7280", border: "#2d3148", text: "#f1f5f9" };

// --- HOOKS ---
const useSupabaseTable = (tableName, defaultValue = []) => {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from(tableName).select("*").order("created_at", { ascending: false });
    if (!error && rows) setData(rows);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [tableName]);

  const addItem = useCallback(async (item) => {
    const { id, created_at, ...rest } = item;
    const { data: inserted, error } = await supabase.from(tableName).insert([rest]).select();
    if (!error && inserted) setData(p => [inserted[0], ...p]);
  }, [tableName]);

  const editItem = useCallback(async (item) => {
    const { id, created_at, ...rest } = item;
    const { error } = await supabase.from(tableName).update(rest).eq("id", id);
    if (!error) setData(p => p.map(x => x.id === id ? { ...x, ...item } : x));
  }, [tableName]);

  const deleteItem = useCallback(async (id) => {
    const { error } = await supabase.from(tableName).delete().eq("id", id);
    if (!error) setData(p => p.filter(x => x.id !== id));
  }, [tableName]);

  return [data, { addItem, editItem, deleteItem, fetchAll, loading }];
};

// --- COMPONENTS (ICONS, MODALS, ETC) ---
const Icon = ({ name, size = 18, color = clr.text }) => {
  const icons = {
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    purchase: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    dispatch: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
    sale: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    master: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={icons[name] || ""} />
    </svg>
  );
};

// --- SCREENS ---

const Dashboard = ({ purchases, dispatches, sales }) => {
  const stock = purchases.reduce((s, p) => s + (parseFloat(p.manual_bags) || 0), 0) - dispatches.flatMap(d => d.items || []).reduce((s, i) => s + (parseFloat(i.bags_loaded) || 0), 0);
  const pendingReceive = sales.reduce((sum, s) => sum + (s.lot_sales?.reduce((lsSum, ls) => lsSum + (ls.netSale || 0), 0) || 0), 0);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: clr.card, padding: 16, borderRadius: 12, border: `1px solid ${clr.border}` }}>
          <div style={{ fontSize: 12, color: clr.muted }}>Stock (bags)</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: clr.accent }}>{fmt(stock)}</div>
        </div>
        <div style={{ background: clr.card, padding: 16, borderRadius: 12, border: `1px solid ${clr.border}` }}>
          <div style={{ fontSize: 12, color: clr.muted }}>Pending Receive</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: clr.red }}>₹{fmt(pendingReceive)}</div>
        </div>
      </div>
      {/* "Supabase Connected" section removed */}
    </div>
  );
};

// --- APP SHELL ---

const App = () => {
  const [tab, setTab] = useState("home");
  const [purchases, pOps] = useSupabaseTable("purchases");
  const [dispatches, dOps] = useSupabaseTable("dispatches");
  const [sales, sOps] = useSupabaseTable("sales");
  const [parties] = useSupabaseTable("parties");
  const [mandis] = useSupabaseTable("mandis");

  return (
    <div style={{ background: clr.bg, minHeight: "100vh", color: clr.text, maxWidth: 480, margin: "0 auto", position: "relative", paddingBottom: 80 }}>
      <header style={{ padding: 16, background: clr.card, borderBottom: `1px solid ${clr.border}`, position: "sticky", top: 0, zIndex: 100 }}>
        <h2 style={{ margin: 0, color: clr.accent, fontSize: 20 }}>🥔 AlooTrader</h2>
        <div style={{ fontSize: 12, color: clr.muted }}>आलू व्यापार प्रबंधन | {fmtDate(new Date())}</div>
      </header>

      {tab === "home" && <Dashboard purchases={purchases} dispatches={dispatches} sales={sales} />}
      {/* Baki screens yahan tab condition ke sath add hongi */}

      <nav style={{ position: "fixed", bottom: 0, width: "100%", maxWidth: 480, background: clr.card, display: "flex", borderTop: `1px solid ${clr.border}` }}>
        {["home", "purchase", "dispatch", "sale", "master"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: 12, background: "none", border: "none", color: tab === t ? clr.accent : clr.muted, cursor: "pointer" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <Icon name={t} color={tab === t ? clr.accent : clr.muted} />
              <span style={{ fontSize: 10, textTransform: "capitalize" }}>{t}</span>
            </div>
          </button>
        ))}
      </nav>
    </div>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);
