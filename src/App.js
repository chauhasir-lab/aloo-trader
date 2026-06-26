import { useState, useCallback, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cxjmwjljjnuthcrmnbqb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4am13amxqam51dGhjcm1uYnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTYzMzUsImV4cCI6MjA5MjY3MjMzNX0.ynRaceAT1uWcsPOJ_5vY_8NKolM3EaWKQajUEk4sLz8";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const useSupabaseTable = (tableName, defaultValue = []) => {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: rows, error } = await supabase.from(tableName).select("*").order("created_at", { ascending: true });
      if (!error && rows) {
        const parsed = rows.map(row => {
          const r = { ...row };
          if (r.items && typeof r.items === 'string') {
            try { r.items = JSON.parse(r.items); } catch { r.items = []; }
          }
          if (r.lot_sales && typeof r.lot_sales === 'string') {
            try { r.lot_sales = JSON.parse(r.lot_sales); } catch { r.lot_sales = []; }
          }
          return r;
        });
        setData(parsed);
      }
      setLoading(false);
    };
    fetchData();
  }, [tableName]);

  const addItem = useCallback(async (item) => {
    const { created_at, ...rest } = item;
    const { data: inserted, error } = await supabase.from(tableName).insert([{ ...rest }]).select();
    if (!error && inserted) setData(p => [...p, inserted[0]]);
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

  return [data, { addItem, editItem, deleteItem, loading }];
};

const uid = () => crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const fmt = (n, d = 0) => (isNaN(n) ? "0" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d }));
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "-";
const today = () => new Date().toISOString().slice(0, 10);
const clr = { bg: "#0f1117", card: "#1a1d26", card2: "#22263a", accent: "#f5a623", green: "#22c55e", red: "#ef4444", blue: "#3b82f6", purple: "#a855f7", muted: "#6b7280", border: "#2d3148", text: "#f1f5f9" };

const getLotStatus = (lot, dispatches, sales) => {
  const totalDispatched = dispatches.flatMap(d => d.items || []).filter(i => i.lot_id === lot.lot_id).reduce((sum, i) => sum + parseFloat(i.bags || 0), 0);
  const effectiveBags = lot.pricing_type === "STD" ? parseFloat(lot.std_bags) : parseFloat(lot.manual_bags);
  const remaining = effectiveBags - totalDispatched;
  return { totalDispatched, remaining, isClosed: remaining <= 0 && totalDispatched > 0, status: remaining <= 0 && totalDispatched > 0 ? "CLOSED" : "ACTIVE" };
};

const Icon = ({ name, size = 18, color = clr.text }) => {
  const icons = {
    purchase: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    dispatch: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
    sale: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    payment: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    master: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
    add: "M12 4v16m8-8H4",
    edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    x: "M6 18L18 6M6 6l12 12",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icons[name] || icons.search} /></svg>;
};

const s = {
  screen: { minHeight: "100vh", background: clr.bg, color: clr.text, fontFamily: "'Segoe UI', system-ui, sans-serif", maxWidth: 480, margin: "0 auto", position: "relative" },
  header: { background: clr.card, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${clr.border}`, position: "sticky", top: 0, zIndex: 100 },
  card: { background: clr.card, borderRadius: 12, padding: 14, marginBottom: 10, border: `1px solid ${clr.border}` },
  card2: { background: clr.card2, borderRadius: 10, padding: 12, marginBottom: 8, border: `1px solid ${clr.border}` },
  row: { display: "flex", alignItems: "center", gap: 8 },
  rowBetween: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  col: { display: "flex", flexDirection: "column", gap: 4 },
  input: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 8, padding: "10px 12px", color: clr.text, fontSize: 14, outline: "none", boxSizing: "border-box" },
  select: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 8, padding: "10px 12px", color: clr.text, fontSize: 14, outline: "none", boxSizing: "border-box" },
  label: { fontSize: 11, color: clr.muted, marginBottom: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" },
  btn: (bg = clr.accent, txt = "#000") => ({ background: bg, color: txt, border: "none", borderRadius: 8, padding: "11px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }),
  btnSm: (bg = clr.card2, txt = clr.text) => ({ background: bg, color: txt, border: `1px solid ${clr.border}`, borderRadius: 6, padding: "6px 10px", fontWeight: 600, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }),
  tag: (bg = clr.accent + "22", txt = clr.accent) => ({ background: bg, color: txt, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }),
  divider: { height: 1, background: clr.border, margin: "10px 0" },
  content: { padding: 16, paddingBottom: 90 },
  statCard: (col) => ({ background: col + "18", border: `1px solid ${col}44`, borderRadius: 12, padding: "12px 14px", flex: 1 }),
  navBar: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: clr.card, borderTop: `1px solid ${clr.border}`, display: "flex", zIndex: 200 },
  navItem: (active) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 4px", gap: 3, cursor: "pointer", borderTop: active ? `2px solid ${clr.accent}` : "2px solid transparent", background: "none", border: "none", color: active ? clr.accent : clr.muted }),
};

const Badge = ({ v, color = clr.accent }) => <span style={s.tag(color + "22", color)}>{v}</span>;
const Stat = ({ label, value, color = clr.accent }) => <div style={s.statCard(color)}><div style={{ fontSize: 11, color: clr.muted, fontWeight: 600 }}>{label}</div><div style={{ fontSize: 17, fontWeight: 800, color }}>{value}</div></div>;

export default function App() {
  const [purchases, opsP] = useSupabaseTable("purchases");
  const [dispatches, opsD] = useSupabaseTable("dispatches");
  const [sales, opsS] = useSupabaseTable("sales");
  const [payments, opsM] = useSupabaseTable("payments");
  const [varieties, opsV] = useSupabaseTable("varieties");
  const [gradings, opsG] = useSupabaseTable("gradings");
  const [coldStorages, opsC] = useSupabaseTable("cold_storages");
  const [mandis, opsMA] = useSupabaseTable("mandis");
  const [parties, opsPA] = useSupabaseTable("parties");
  const [currentTab, setCurrentTab] = useState("purchase");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);

  const getName = (arr, id) => arr.find(x => x.id === id)?.name || "-";

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    const lot = purchases.find(p => p.lot_id?.toLowerCase() === q);
    if (lot) {
      const status = getLotStatus(lot, dispatches, sales);
      setSearchResults({ type: "lot", data: { ...lot, ...status } });
    }
  };

  return (
    <div style={s.screen}>
      <div style={s.header}>
        <h2 style={{ margin: 0, flex: 1, fontSize: 18 }}>🏪 खाद्य प्रबंधन</h2>
        <button onClick={() => setShowSearch(!showSearch)} style={s.btnSm()}><Icon name="search" size={16} /></button>
      </div>

      {showSearch && (
        <div style={{ ...s.card, margin: 16, marginBottom: 8 }}>
          <input style={s.input} placeholder="लॉट नंबर खोजें..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleSearch()} />
          <button onClick={handleSearch} style={{ ...s.btn(), width: "100%", marginTop: 8 }}>खोजें</button>
          {searchResults && (
            <div style={{ ...s.card2, marginTop: 12 }}>
              <div style={{ fontWeight: 700 }}>🥔 {searchResults.data.lot_id}</div>
              <div style={{ fontSize: 12, color: clr.muted }}>किसान: {searchResults.data.kisan_name}</div>
              <div style={s.divider} />
              <div style={s.rowBetween}>
                <span>डिस्पैच:</span>
                <span style={{ fontWeight: 700 }}>{searchResults.data.totalDispatched} बैग</span>
              </div>
              <div style={s.rowBetween}>
                <span>शेष:</span>
                <span style={{ fontWeight: 700, color: searchResults.data.isClosed ? clr.red : clr.green }}>{searchResults.data.remaining} बैग</span>
              </div>
              {searchResults.data.isClosed && <Badge v="CLOSED" color={clr.red} />}
            </div>
          )}
        </div>
      )}

      {currentTab === "purchase" && (
        <div style={s.content}>
          {purchases.length === 0 ? (
            <div style={{ ...s.card, textAlign: "center", color: clr.muted }}>कोई लॉट नहीं</div>
          ) : (
            purchases.reverse().map(p => {
              const status = getLotStatus(p, dispatches, sales);
              return (
                <div key={p.id} style={{ ...s.card, opacity: status.isClosed ? 0.6 : 1 }}>
                  <div style={s.rowBetween}>
                    <Badge v={`LOT: ${p.lot_id}`} color={clr.accent} />
                    {status.isClosed && <Badge v="CLOSED" color={clr.red} />}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontWeight: 700 }}>{p.kisan_name}</div>
                    <div style={{ fontSize: 12, color: clr.muted }}>{getName(coldStorages, p.cold_storage_id)}</div>
                  </div>
                  <div style={s.divider} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    <Stat label="Bags" value={fmt(p.manual_bags)} color={clr.blue} />
                    <Stat label="Weight" value={fmt(p.total_weight)} color={clr.purple} />
                    <Stat label="Remaining" value={fmt(status.remaining, 1)} color={status.remaining > 0 ? clr.green : clr.red} />
                  </div>
                  <div style={{ ...s.rowBetween, marginTop: 8, background: clr.accent + "18", borderRadius: 8, padding: "8px 12px" }}>
                    <span style={{ fontSize: 12 }}>₹{fmt(p.rate)}/bag</span>
                    <span style={{ fontWeight: 800, color: clr.accent }}>₹{fmt(p.total_amount)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <div style={s.navBar}>
        <button onClick={() => setCurrentTab("purchase")} style={s.navItem(currentTab === "purchase")}><Icon name="purchase" size={20} color={currentTab === "purchase" ? clr.accent : clr.muted} /></button>
        <button onClick={() => setCurrentTab("dispatch")} style={s.navItem(currentTab === "dispatch")}><Icon name="dispatch" size={20} color={currentTab === "dispatch" ? clr.accent : clr.muted} /></button>
        <button onClick={() => setCurrentTab("sales")} style={s.navItem(currentTab === "sales")}><Icon name="sale" size={20} color={currentTab === "sales" ? clr.accent : clr.muted} /></button>
        <button onClick={() => setCurrentTab("payment")} style={s.navItem(currentTab === "payment")}><Icon name="payment" size={20} color={currentTab === "payment" ? clr.accent : clr.muted} /></button>
        <button onClick={() => setCurrentTab("master")} style={s.navItem(currentTab === "master")}><Icon name="master" size={20} color={currentTab === "master" ? clr.accent : clr.muted} /></button>
      </div>
    </div>
  );
}