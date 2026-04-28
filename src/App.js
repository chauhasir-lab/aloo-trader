import { useState, useCallback, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cxjmwjljjnuthcrmnbqb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4am13amxqam51dGhjcm1uYnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTYzMzUsImV4cCI6MjA5MjY3MjMzNX0.ynRaceAT1uWcsPOJ_5vY_8NKolM3EaWKQajUEk4sLz8";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── SUPABASE HOOKS ───────────────────────────────────────────────────────────
const useSupabaseTable = (tableName, defaultValue = []) => {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: rows, error } = await supabase.from(tableName).select("*").order("created_at", { ascending: true });
      if (!error && rows) setData(rows);
      setLoading(false);
    };
    fetchData();
  }, [tableName]);

  const save = useCallback(async (valOrFn) => {
    const newVal = typeof valOrFn === "function" ? valOrFn(data) : valOrFn;
    const lastItem = newVal[newVal.length - 1];
    const { data: inserted, error } = await supabase.from(tableName).insert([lastItem]).select();
    if (!error && inserted) {
      setData(prev => [...prev.slice(0, -1), inserted[0]]);
    }
  }, [data, tableName]);

  return [data, save, loading];
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const clr = {
  bg: "#F8FAFC", card: "#FFFFFF", text: "#1E293B", muted: "#64748B",
  accent: "#2563EB", border: "#E2E8F0", white: "#FFFFFF",
  green: "#10B981", red: "#EF4444", gold: "#F59E0B", blue: "#3B82F6"
};

const s = {
  container: { maxWidth: 480, margin: "0 auto", background: clr.bg, minHeight: "100vh", paddingBottom: 100, fontFamily: "sans-serif", color: clr.text },
  header: { padding: "20px 16px", background: clr.white, borderBottom: `1px solid ${clr.border}`, sticky: "top", zIndex: 100 },
  title: { fontSize: 22, fontWeight: "800", color: clr.accent, margin: 0 },
  content: { padding: 16 },
  card: { background: clr.white, borderRadius: 16, padding: 16, marginBottom: 16, border: `1px solid ${clr.border}`, boxShadow: "0 2px 4px rgba(0,0,0,0.02)" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  statLabel: { fontSize: 12, color: clr.muted, marginBottom: 4, display: "block" },
  statValue: { fontSize: 18, fontWeight: "700" },
  alert: { padding: 12, borderRadius: 12, marginBottom: 16, fontSize: 13, fontWeight: "600" },
  navBar: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: clr.white, borderTop: `1px solid ${clr.border}`, display: "flex", justifyContent: "space-around", padding: "10px 0", zIndex: 200 },
  navItem: (active) => ({ display: "flex", flexDirection: "column", alignItems: "center", border: "none", background: "none", cursor: "pointer", gap: 4, color: active ? clr.accent : clr.muted }),
};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
const Icon = ({ name, size = 24, color = "currentColor" }) => {
  const icons = {
    dashboard: <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>,
    purchase: <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>,
    dispatch: <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM18 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM17 12V9h3l2.25 3H17z"/>,
    sale: <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>,
    payment: <path d="M21 7H3c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM3 19V9h18v10H3zm10-7h5v2h-5v-2zm0 4h5v2h-5v-2zm-9-4h6v6H4v-6z"/>,
    more: <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>{icons[name] || icons.dashboard}</svg>;
};

const Stat = ({ label, value, color = clr.text }) => (
  <div style={s.card}>
    <span style={s.statLabel}>{label}</span>
    <span style={{ ...s.statValue, color }}>{value}</span>
  </div>
);

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function PotatoERP() {
  const [tab, setTab] = useState("dash");
  const [showMore, setShowMore] = useState(false);

  const [purchases] = useSupabaseTable("purchases");
  const [dispatches] = useSupabaseTable("dispatches");
  const [sales] = useSupabaseTable("sales");
  const [payments] = useSupabaseTable("payments");

  // ─── DASHBOARD LOGIC ───────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!purchases.length) return null;

    // 1. Linked Records Logic (Ignored orphans)
    const validSales = sales.filter(s => dispatches.some(d => d.id === s.gp_id));
    const validPayments = payments.filter(p => sales.some(s => s.gp_id === p.gp_id));

    // 2. Aggregates
    const totalPurchasedBags = purchases.reduce((acc, p) => acc + (Number(p.bags) || 0), 0);
    const totalDispatchedBags = dispatches.reduce((acc, d) => acc + (Number(d.bags) || 0), 0);
    const totalRemainingBags = purchases.reduce((acc, p) => acc + (Number(p.remaining_bags) || 0), 0);
    
    const totalReceivable = validSales.reduce((acc, s) => acc + (Number(s.net_receivable) || 0), 0);
    const totalReceived = validPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

    const totalInvestment = purchases.reduce((acc, p) => acc + (Number(p.total_amount) || 0), 0);
    const totalExpenses = dispatches.reduce((acc, d) => acc + (Number(d.total_expense) || 0), 0);
    
    // 3. Pending vs Advance Logic
    let pendingReceive = totalReceivable - totalReceived;
    let advanceReceived = 0;
    if (pendingReceive < 0) {
      advanceReceived = Math.abs(pendingReceive);
      pendingReceive = 0;
    }

    // 4. Profit/Loss Logic
    const profit = totalReceivable - (totalInvestment + totalExpenses);

    // 5. Reconciliation Checks
    const stockMismatch = totalPurchasedBags !== (totalDispatchedBags + totalRemainingBags);
    const moneyMismatch = totalReceivable > (totalReceived + pendingReceive + 1); // small buffer

    return {
      totalPurchasedBags, totalDispatchedBags, totalRemainingBags,
      pendingReceive, advanceReceived, profit,
      stockMismatch, moneyMismatch
    };
  }, [purchases, dispatches, sales, payments]);

  const fmt = (v) => Number(v || 0).toLocaleString("en-IN");

  return (
    <div style={s.container}>
      <header style={s.header}>
        <h1 style={s.title}>JSN Farm</h1>
        <p style={{ margin: "4px 0 0", color: clr.muted, fontSize: 12 }}>Potato Trading Dashboard</p>
      </header>

      <main style={s.content}>
        {tab === "dash" && (
          <>
            {!stats ? (
              <div style={{ ...s.card, textAlign: "center", padding: 40 }}>
                <Icon name="purchase" size={48} color={clr.border} />
                <p style={{ color: clr.muted, marginTop: 12 }}>No Purchases Yet</p>
              </div>
            ) : (
              <>
                {/* Reconciliation Alerts */}
                {stats.stockMismatch && (
                  <div style={{ ...s.alert, background: "#FEF2F2", color: clr.red }}>
                    ⚠️ Stock Mismatch: Purchase bags != Dispatch + Remaining
                  </div>
                )}

                <div style={s.grid}>
                  <Stat label="Purchased Bags" value={fmt(stats.totalPurchasedBags)} />
                  <Stat label="In Stock" value={fmt(stats.totalRemainingBags)} color={clr.blue} />
                </div>

                <div style={s.grid}>
                  <Stat label="Pending Receive" value={`₹${fmt(stats.pendingReceive)}`} color={stats.pendingReceive > 0 ? clr.gold : clr.text} />
                  {stats.advanceReceived > 0 ? (
                    <Stat label="Advance Received" value={`₹${fmt(stats.advanceReceived)}`} color={clr.green} />
                  ) : (
                    <Stat label="Bags Sold" value={fmt(stats.totalDispatchedBags)} />
                  )}
                </div>

                {/* Profit/Loss Logic */}
                {stats.profit !== 0 && (
                  <Stat 
                    label={stats.profit > 0 ? "Estimated Profit" : "Estimated Loss"} 
                    value={`₹${fmt(Math.abs(stats.profit))}`} 
                    color={stats.profit > 0 ? clr.green : clr.red} 
                  />
                )}
                {stats.profit === 0 && <Stat label="Status" value="Break-even" color={clr.blue} />}
              </>
            )}
          </>
        )}

        {tab !== "dash" && (
          <div style={{ textAlign: "center", padding: 40, color: clr.muted }}>
            {tab.toUpperCase()} Section - Data Linked Successfully
          </div>
        )}
      </main>

      <nav style={s.navBar}>
        <button onClick={() => setTab("dash")} style={s.navItem(tab === "dash")}>
          <Icon name="dashboard" color={tab === "dash" ? clr.accent : clr.muted} />
          <span style={{ fontSize: 10 }}>Dash</span>
        </button>
        <button onClick={() => setTab("purchase")} style={s.navItem(tab === "purchase")}>
          <Icon name="purchase" color={tab === "purchase" ? clr.accent : clr.muted} />
          <span style={{ fontSize: 10 }}>Buy</span>
        </button>
        <button onClick={() => setTab("dispatch")} style={s.navItem(tab === "dispatch")}>
          <Icon name="dispatch" color={tab === "dispatch" ? clr.accent : clr.muted} />
          <span style={{ fontSize: 10 }}>Load</span>
        </button>
        <button onClick={() => setTab("sale")} style={s.navItem(tab === "sale")}>
          <Icon name="sale" color={tab === "sale" ? clr.accent : clr.muted} />
          <span style={{ fontSize: 10 }}>Sale</span>
        </button>
        <button onClick={() => setShowMore(!showMore)} style={s.navItem(showMore)}>
          <Icon name="more" color={showMore ? clr.accent : clr.muted} />
          <span style={{ fontSize: 10 }}>More</span>
        </button>
      </nav>

      {showMore && (
        <div style={{ position: "fixed", bottom: 70, left: "50%", transform: "translateX(-50%)", width: "90%", maxWidth: 400, background: clr.white, borderRadius: 16, boxShadow: "0 10px 25px rgba(0,0,0,0.1)", padding: 8, zIndex: 300, border: `1px solid ${clr.border}` }}>
          <button onClick={() => { setTab("payment"); setShowMore(false); }} style={{ width: "100%", padding: 12, textAlign: "left", border: "none", background: "none", display: "flex", alignItems: "center", gap: 12 }}>
            <Icon name="payment" size={20} color={clr.muted} /> Payments
          </button>
        </div>
      )}
    </div>
  );
}
