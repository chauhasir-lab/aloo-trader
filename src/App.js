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

  const save = useCallback(async (valOrFn) => {
    const newData = typeof valOrFn === "function" ? valOrFn(data) : valOrFn;
    setData(newData);
  }, [data]);

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

  const setAll = useCallback((newData) => {
    setData(newData);
  }, []);

  return [data, { save, addItem, editItem, deleteItem, setAll, loading }];
};

const uid = () => crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const fmt = (n, d = 0) => (isNaN(n) ? "0" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d }));
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "-";
const today = () => new Date().toISOString().slice(0, 10);
const clr = { bg: "#0f1117", card: "#1a1d26", card2: "#22263a", accent: "#f5a623", green: "#22c55e", red: "#ef4444", blue: "#3b82f6", purple: "#a855f7", muted: "#6b7280", border: "#2d3148", text: "#f1f5f9" };
const PMODES = ["Cash", "UPI", "NEFT/RTGS", "Cheque"];

// ──── NEW FEATURE 1: LOT STATUS TRACKING ────
const getLotStatus = (lot, dispatches, sales) => {
  const totalDispatched = dispatches
    .flatMap(d => d.items || [])
    .filter(i => i.lot_id === lot.lot_id)
    .reduce((sum, i) => sum + parseFloat(i.bags || 0), 0);

  const totalSales = sales
    .flatMap(s => s.lot_sales || [])
    .filter(ls => ls.lot_id === lot.lot_id)
    .reduce((sum, ls) => sum + parseFloat(ls.bags || 0), 0);

  const effectiveBags = lot.pricing_type === "STD" 
    ? parseFloat(lot.std_bags) 
    : parseFloat(lot.manual_bags);

  const remaining = effectiveBags - totalDispatched;
  const isClosed = remaining <= 0 && totalDispatched > 0;

  return {
    totalDispatched,
    totalSales,
    remaining,
    isClosed,
    status: isClosed ? "CLOSED" : "ACTIVE"
  };
};

const Icon = ({ name, size = 18, color = clr.text }) => {
  const icons = {
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    purchase: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    dispatch: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
    sale: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    stock: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    payment: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    master: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
    add: "M12 4v16m8-8H4",
    edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    x: "M6 18L18 6M6 6l12 12",
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    download: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={icons[name] || icons.info} />
    </svg>
  );
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

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={s.label}>{label}</div>
    {children}
  </div>
);

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: clr.card, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "92vh", display: "flex", flexDirection: "column", border: `1px solid ${clr.border}` }}>
        <div style={{ ...s.rowBetween, padding: "16px 16px 12px", flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span>
          <button onClick={onClose} style={{ ...s.btnSm(), padding: 6 }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ overflowY: "auto", padding: "0 16px 32px" }}>{children}</div>
      </div>
    </div>
  );
};

const Badge = ({ v, color = clr.accent }) => <span style={s.tag(color + "22", color)}>{v}</span>;
const Alert = ({ msg, type = "info" }) => {
  const c = type === "error" ? clr.red : type === "success" ? clr.green : clr.blue;
  return <div style={{ background: c + "20", border: `1px solid ${c}44`, borderRadius: 8, padding: "10px 12px", color: c, fontSize: 13, marginBottom: 10 }}>{msg}</div>;
};
const Stat = ({ label, value, color = clr.accent, sub }) => (
  <div style={s.statCard(color)}>
    <div style={{ fontSize: 11, color: clr.muted, fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 17, fontWeight: 800, color }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: clr.muted }}>{sub}</div>}
  </div>
);

// ──── NEW FEATURE 2: SEARCH MODAL ────
const SearchModal = ({ open, onClose, purchases, dispatches, sales, varieties, gradings, coldStorages, mandis, parties }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);

  const handleSearch = () => {
    if (!query.trim()) return;
    setResults(query);
  };

  const getName = (arr, id) => arr.find(x => x.id === id)?.name || "-";

  const searchLotNumber = () => {
    const lot = purchases.find(p => p.lot_id?.toLowerCase() === query.toLowerCase().trim());
    if (!lot) return null;
    const status = getLotStatus(lot, dispatches, sales);
    const lotDispatches = dispatches.filter(d => d.items?.some(i => i.lot_id === lot.lot_id));
    return { type: "lot", lot, status, dispatches: lotDispatches };
  };

  const searchVehicle = () => {
    const dispatch = dispatches.find(d => d.vehicle_number?.toLowerCase() === query.toLowerCase().trim());
    if (!dispatch) return null;
    const dispatchLots = dispatch.items?.map(i => {
      const lot = purchases.find(p => p.lot_id === i.lot_id);
      return { ...i, lot };
    }) || [];
    return { type: "vehicle", dispatch, lots: dispatchLots };
  };

  const searchFarmer = () => {
    const farmerLots = purchases.filter(p => p.kisan_name?.toLowerCase().includes(query.toLowerCase().trim()));
    if (farmerLots.length === 0) return null;
    return {
      type: "farmer",
      name: farmerLots[0]?.kisan_name,
      lots: farmerLots.map(lot => {
        const status = getLotStatus(lot, dispatches, sales);
        return { lot, status };
      })
    };
  };

  const searchMandi = () => {
    const mandi = mandis.find(m => m.name?.toLowerCase().includes(query.toLowerCase().trim()));
    if (!mandi) return null;
    const mandiDispatches = dispatches.filter(d => d.mandi_id === mandi.id);
    const mandiSales = sales.filter(s => s.mandi_id === mandi.id);
    return { type: "mandi", mandi, dispatches: mandiDispatches, sales: mandiSales };
  };

  const searchTrader = () => {
    const party = parties.find(p => p.name?.toLowerCase().includes(query.toLowerCase().trim()));
    if (!party) return null;
    const partySales = sales.filter(s => s.party_id === party.id);
    return { type: "trader", party, sales: partySales };
  };

  const searchCold = () => {
    const cold = coldStorages.find(c => c.name?.toLowerCase().includes(query.toLowerCase().trim()));
    if (!cold) return null;
    const coldLots = purchases.filter(p => p.cold_storage_id === cold.id);
    return { type: "cold", cold, lots: coldLots };
  };

  const result = results ? (searchLotNumber() || searchVehicle() || searchFarmer() || searchMandi() || searchTrader() || searchCold()) : null;

  return (
    <Modal open={open} onClose={onClose} title="🔍 खोज">
      <div style={{ marginBottom: 16 }}>
        <input type="text" style={s.input} placeholder="लॉट नंबर, वाहन, किसान, मंडी, व्यापारी..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleSearch()} />
        <button onClick={handleSearch} style={{ ...s.btn(), width: "100%", marginTop: 10 }}><Icon name="search" size={16} color="#000" /> खोजें</button>
      </div>

      {result === null && results && <div style={{ ...s.card, textAlign: "center", color: clr.muted }}>कोई परिणाम नहीं मिला</div>}

      {result && (
        <>
          {result.type === "lot" && (
            <div style={s.card}>
              <div style={{ ...s.rowBetween, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>🥔 लॉट: {result.lot.lot_id}</div>
                <Badge v={result.status.status} color={result.status.isClosed ? clr.red : clr.green} />
              </div>
              <div style={s.divider} />
              <div style={{ marginBottom: 10 }}><div style={s.label}>किसान</div><div style={{ fontWeight: 600 }}>{result.lot.kisan_name}</div></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div><div style={s.label}>विविधता</div><div style={{ fontWeight: 600 }}>{getName(varieties, result.lot.variety_id)}</div></div>
                <div><div style={s.label}>ग्रेडिंग</div><div style={{ fontWeight: 600 }}>{getName(gradings, result.lot.grading_id)}</div></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                <Stat label="कुल बैग" value={fmt(result.lot.pricing_type === "STD" ? result.lot.std_bags : result.lot.manual_bags, 1)} color={clr.blue} />
                <Stat label="डिस्पैच" value={fmt(result.status.totalDispatched)} color={clr.purple} />
                <Stat label="शेष" value={fmt(result.status.remaining, 1)} color={result.status.remaining > 0 ? clr.green : clr.red} />
              </div>
              <div style={{ ...s.card2, ...s.rowBetween }}><span style={{ fontSize: 12, color: clr.muted }}>₹{fmt(result.lot.rate)}/बैग</span><span style={{ fontWeight: 800, color: clr.accent, fontSize: 16 }}>₹{fmt(result.lot.total_amount)}</span></div>
              {result.dispatches.length > 0 && (
                <>
                  <div style={{ marginTop: 12, fontWeight: 700, marginBottom: 8 }}>📤 डिस्पैच विवरण:</div>
                  {result.dispatches.map((d, idx) => (
                    <div key={idx} style={s.card2}>
                      <div style={s.rowBetween}><span style={{ fontWeight: 600 }}>वाहन: {d.vehicle_number}</span><span style={{ fontSize: 12, color: clr.green }}>{fmtDate(d.date)}</span></div>
                      <div style={{ fontSize: 12, color: clr.muted, marginTop: 4 }}>मंडी: {getName(mandis, d.mandi_id)} | बैग: {d.items?.find(i => i.lot_id === result.lot.lot_id)?.bags || 0}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {result.type === "vehicle" && (
            <div style={s.card}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>🚛 वाहन: {result.dispatch.vehicle_number}</div>
              <div style={s.divider} />
              <div style={{ fontSize: 12, color: clr.muted, marginBottom: 12 }}>तारीख: {fmtDate(result.dispatch.date)} | मंडी: {getName(mandis, result.dispatch.mandi_id)}</div>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>लॉट्स:</div>
              {result.lots.map((item, idx) => (
                <div key={idx} style={s.card2}>
                  <div style={s.rowBetween}><span style={{ fontWeight: 600 }}>LOT: {item.lot_id}</span><span style={{ fontWeight: 700, color: clr.accent }}>₹{fmt(item.lot?.total_amount)}</span></div>
                  <div style={{ fontSize: 12, color: clr.muted, marginTop: 4 }}>बैग: {fmt(item.bags)} | किसान: {item.lot?.kisan_name}</div>
                </div>
              ))}
            </div>
          )}

          {result.type === "farmer" && (
            <div style={s.card}>
              <div style={{ fontWeight: 700, fontSize: 15, color: clr.purple, marginBottom: 12 }}>👨 किसान: {result.name}</div>
              {result.lots.map(({ lot, status }) => (
                <div key={lot.id} style={{ ...s.card2, marginBottom: 8 }}>
                  <div style={s.rowBetween}><Badge v={`LOT: ${lot.lot_id}`} color={clr.accent} /><Badge v={status.status} color={status.isClosed ? clr.red : clr.green} /></div>
                  <div style={{ fontSize: 12, color: clr.muted, marginTop: 6 }}>विविधता: {getName(varieties, lot.variety_id)} | वजन: {fmt(lot.total_weight)} kg</div>
                  <div style={{ fontSize: 12, color: clr.muted }}>कुल: ₹{fmt(lot.total_amount)} | शेष बैग: {fmt(status.remaining, 1)}</div>
                </div>
              ))}
            </div>
          )}

          {result.type === "mandi" && (
            <div style={s.card}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>🏪 मंडी: {result.mandi.name}</div>
              <div style={s.divider} />
              <div style={{ fontSize: 12, color: clr.muted, marginBottom: 12 }}>स्थान: {result.mandi.location}</div>
              {result.dispatches.length > 0 && (
                <>
                  <div style={{ fontWeight: 700, marginBottom: 8, color: clr.purple }}>📤 डिस्पैच ({result.dispatches.length}):</div>
                  {result.dispatches.map((d, idx) => (
                    <div key={idx} style={{ ...s.card2, fontSize: 12, marginBottom: 6 }}>
                      <div style={s.rowBetween}><span style={{ fontWeight: 600 }}>वाहन: {d.vehicle_number}</span><span style={{ color: clr.green }}>{fmtDate(d.date)}</span></div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {result.type === "trader" && (
            <div style={s.card}>
              <div style={{ fontWeight: 700, fontSize: 15, color: clr.blue, marginBottom: 8 }}>🏪 व्यापारी: {result.party.name}</div>
              <div style={s.divider} />
              <div style={{ fontSize: 13, fontWeight: 600, color: clr.accent, marginBottom: 8 }}>कुल बिक्रय: {result.sales.length} transaction</div>
              {result.sales.map((s, idx) => (
                <div key={idx} style={{ ...s.card2, fontSize: 12 }}>
                  <div style={s.rowBetween}><span>लॉट्स: {s.lot_sales?.length || 0}</span><span style={{ fontWeight: 700, color: clr.accent }}>₹{fmt(s.total_amount)}</span></div>
                  <div style={{ color: clr.muted, marginTop: 3 }}>{fmtDate(s.date)}</div>
                </div>
              ))}
            </div>
          )}

          {result.type === "cold" && (
            <div style={s.card}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>🏭 कोल्ड: {result.cold.name}</div>
              <div style={{ fontSize: 12, color: clr.muted, marginBottom: 12 }}>स्थान: {result.cold.location}</div>
              <div style={s.divider} />
              <div style={{ fontWeight: 700, marginBottom: 8 }}>लॉट्स ({result.lots.length}):</div>
              {result.lots.map((lot, idx) => {
                const status = getLotStatus(lot, dispatches, sales);
                return (
                  <div key={idx} style={s.card2}>
                    <div style={s.rowBetween}><Badge v={`LOT: ${lot.lot_id}`} color={clr.accent} /><Badge v={status.status} color={status.isClosed ? clr.red : clr.green} /></div>
                    <div style={{ fontSize: 12, color: clr.muted, marginTop: 6 }}>किसान: {lot.kisan_name} | वजन: {fmt(lot.total_weight)} kg</div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </Modal>
  );
};

// ─── MASTER ───────────────────────────────────────────────────────────────────
const MasterSection = ({ title, items, onAdd, onEdit, onDelete, fields }) => {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});
  const open = (item = null) => { setEditItem(item); setForm(item ? { ...item } : {}); setShowForm(true); };
  const close = () => { setShowForm(false); setEditItem(null); setForm({}); };
  const save = () => {
    if (!form[fields[0].key]?.trim()) return;
    if (editItem) onEdit({ ...editItem, ...form });
    else onAdd({ id: uid(), ...form });
    close();
  };
  return (
    <div style={s.card}>
      <div style={{ ...s.rowBetween, marginBottom: 10 }}>
        <span style={{ fontWeight: 700 }}>{title}</span>
        <button onClick={() => open()} style={s.btnSm(clr.accent + "22", clr.accent)}><Icon name="add" size={14} color={clr.accent} /> Add</button>
      </div>
      {items.length === 0 && <div style={{ color: clr.muted, fontSize: 13, textAlign: "center", padding: 8 }}>No items</div>}
      {items.map(item => (
        <div key={item.id} style={{ ...s.card2, ...s.rowBetween }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{item[fields[0].key]}</div>
            {fields.slice(1).map(f => item[f.key] && <div key={f.key} style={{ fontSize: 12, color: clr.muted }}>{f.label}: {item[f.key]}</div>)}
          </div>
          <div style={s.row}>
            <button onClick={() => open(item)} style={{ ...s.btnSm(), padding: 6 }}><Icon name="edit" size={14} color={clr.blue} /></button>
            <button onClick={() => onDelete(item.id)} style={{ ...s.btnSm(), padding: 6 }}><Icon name="trash" size={14} color={clr.red} /></button>
          </div>
        </div>
      ))}
      <Modal open={showForm} onClose={close} title={editItem ? "Edit" : "Add"}>
        {fields.map(f => (
          <Field key={f.key} label={f.label}>
            <input style={s.input} value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder || f.label} />
          </Field>
        ))}
        <button onClick={save} style={{ ...s.btn(), width: "100%" }}>Save</button>
      </Modal>
    </div>
  );
};

const MasterScreen = ({ varieties, gradings, coldStorages, mandis, parties, ops }) => {
  const crud = (table) => ({
    onAdd: (item) => ops[table].addItem(item),
    onEdit: (item) => ops[table].editItem(item),
    onDelete: (id) => ops[table].deleteItem(id),
  });
  return (
    <div style={s.content}>
      <MasterSection title="🌾 Variety (किस्म)" items={varieties} fields={[{ key: "name", label: "Variety Name" }]} {...crud("varieties")} />
      <MasterSection title="📊 Grading" items={gradings} fields={[{ key: "name", label: "Grade Name" }]} {...crud("gradings")} />
      <MasterSection title="🏭 Cold Storage" items={coldStorages} fields={[{ key: "name", label: "Storage Name" }, { key: "location", label: "Location" }, { key: "phone", label: "Phone" }]} {...crud("cold_storages")} />
      <MasterSection title="🏪 Mandi" items={mandis} fields={[{ key: "name", label: "Mandi Name" }, { key: "location", label: "Location" }]} {...crud("mandis")} />
      <MasterSection title="👤 Party (Buyer)" items={parties} fields={[{ key: "name", label: "Party Name" }, { key: "phone", label: "Phone" }, { key: "address", label: "Address" }, { key: "credit_days", label: "Credit Days" }]} {...crud("parties")} />
    </div>
  );
};

// ─── PURCHASE ─────────────────────────────────────────────────────────────────
const PurchaseScreen = ({ purchases, varieties, gradings, coldStorages, dispatches, sales, payments, ops }) => {
  const blank = { lot_id: "", kisan_name: "", cold_storage_id: "", date: today(), variety_id: "", grading_id: "", manual_bags: "", total_weight: "", std_bag_weight: "52.5", pricing_type: "STD", rate: "", notes: "" };
  const [form, setForm] = useState(blank);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [err, setErr] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const stdBags = form.total_weight && form.std_bag_weight ? (parseFloat(form.total_weight) / parseFloat(form.std_bag_weight)).toFixed(2) : 0;
  const effectiveBags = form.pricing_type === "STD" ? parseFloat(stdBags) || 0 : parseFloat(form.manual_bags) || 0;
  const totalAmt = effectiveBags * (parseFloat(form.rate) || 0);
  const getName = (arr, id) => arr.find(x => x.id === id)?.name || "-";

  const save = async () => {
    if (!form.lot_id.trim()) { setErr("Lot ID required!"); return; }
    if (purchases.find(p => p.lot_id === form.lot_id.trim() && p.id !== editId)) { setErr("Lot ID already exists!"); return; }
    if (!form.kisan_name.trim()) { setErr("Kisan name required"); return; }
    const item = { ...form, id: editId || uid(), lot_id: form.lot_id.trim(), std_bags: parseFloat(stdBags), total_amount: totalAmt };
    if (editId) await ops.purchases.editItem(item);
    else await ops.purchases.addItem(item);
    setShowForm(false); setEditId(null); setForm(blank); setErr("");
  };

  const openEdit = (item) => { setForm({ ...item }); setEditId(item.id); setShowForm(true); };

  const del = async (id) => {
    const lot = purchases.find(x => x.id === id);
    if (!lot) return;
    const linkedPayments = payments.filter(pm => pm.type === "payable" && pm.cold_id === lot.cold_storage_id);
    const otherLotsForSameCold = purchases.filter(p => p.id !== id && p.cold_storage_id === lot.cold_storage_id);
    if (otherLotsForSameCold.length === 0) {
      for (const pm of linkedPayments) {
        await ops.payments.deleteItem(pm.id);
      }
    }
    await ops.purchases.deleteItem(id);
    for (const d of dispatches) {
      const hasLot = (d.items || []).some(i => i.lot_id === lot.lot_id);
      if (!hasLot) continue;
      const newItems = (d.items || []).filter(i => i.lot_id !== lot.lot_id);
      if (newItems.length === 0) {
        await ops.dispatches.deleteItem(d.id);
        const linkedSale = sales.find(s => s.gp_id === d.id);
        if (linkedSale) await ops.sales.deleteItem(linkedSale.id);
      } else {
        await ops.dispatches.editItem({ ...d, items: newItems });
        const linkedSale = sales.find(s => s.gp_id === d.id);
        if (linkedSale) {
          const newLotSales = (linkedSale.lot_sales || []).filter(ls => ls.lot_id !== lot.lot_id);
          if (newLotSales.length === 0) {
            await ops.sales.deleteItem(linkedSale.id);
          } else {
            await ops.sales.editItem({ ...linkedSale, lot_sales: newLotSales });
          }
        }
      }
    }
  };

  return (
    <div>
      <div style={{ ...s.rowBetween, padding: "12px 16px 0" }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>🥔 Purchase (खरीद)</span>
        <div style={s.row}>
          <button onClick={() => setShowSearch(true)} style={s.btnSm()}><Icon name="search" size={16} /></button>
          <button onClick={() => { setForm(blank); setEditId(null); setErr(""); setShowForm(true); }} style={s.btn()}><Icon name="add" size={16} color="#000" /> New Lot</button>
        </div>
      </div>

      <SearchModal open={showSearch} onClose={() => setShowSearch(false)} purchases={purchases} dispatches={dispatches} sales={sales} varieties={varieties} gradings={gradings} coldStorages={coldStorages} mandis={mandis} parties={parties} />

      <div style={s.content}>
        {purchases.length === 0 && <div style={{ ...s.card, textAlign: "center", color: clr.muted, padding: 32 }}>No purchases yet.</div>}
        {[...purchases].reverse().map(p => {
          const status = getLotStatus(p, dispatches, sales);
          return (
            <div key={p.id} style={{ ...s.card, opacity: status.isClosed ? 0.6 : 1, borderColor: status.isClosed ? clr.red + "44" : undefined }}>
              <div style={s.rowBetween}>
                <div style={{ ...s.row, flexWrap: "wrap", gap: 4 }}>
                  <Badge v={`LOT: ${p.lot_id}`} color={clr.accent} />
                  <Badge v={getName(varieties, p.variety_id)} color={clr.purple} />
                  <Badge v={getName(gradings, p.grading_id)} color={clr.blue} />
                  {status.isClosed && <Badge v="CLOSED" color={clr.red} />}
                </div>
                <div style={s.row}>
                  <button onClick={() => openEdit(p)} style={{ ...s.btnSm(), padding: 6 }}><Icon name="edit" size={14} color={clr.blue} /></button>
                  <button onClick={() => del(p.id)} style={{ ...s.btnSm(), padding: 6 }}><Icon name="trash" size={14} color={clr.red} /></button>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{p.kisan_name}</div>
                <div style={{ fontSize: 12, color: clr.muted }}>{getName(coldStorages, p.cold_storage_id)} · {fmtDate(p.date)}</div>
              </div>
              <div style={s.divider} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                <Stat label="Bags" value={fmt(p.manual_bags)} color={clr.blue} />
                <Stat label="Weight" value={fmt(p.total_weight)} color={clr.purple} />
                <Stat label="STD Bags" value={fmt(p.std_bags, 1)} color={clr.accent} />
              </div>
              <div style={{ ...s.rowBetween, background: clr.accent + "18", borderRadius: 8, padding: "8px 12px", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: clr.muted }}>₹{fmt(p.rate)}/bag</span>
                <span style={{ fontWeight: 800, color: clr.accent, fontSize: 16 }}>₹{fmt(p.total_amount)}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                <Stat label="Dispatched" value={fmt(status.totalDispatched)} color={clr.purple} />
                <Stat label="Sold" value={fmt(status.totalSales)} color={clr.blue} />
                <Stat label="Remaining" value={fmt(status.remaining, 1)} color={status.remaining > 0 ? clr.green : clr.red} />
              </div>
            </div>
          );
        })}
      </div>
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? "Edit Purchase" : "New Purchase"}>
        {err && <Alert msg={err} type="error" />}
        <Field label="Lot ID *"><input style={s.input} value={form.lot_id} onChange={e => f("lot_id", e.target.value)} placeholder="e.g. L001" disabled={!!editId} /></Field>
        <Field label="Kisan Name *"><input style={s.input} value={form.kisan_name} onChange={e => f("kisan_name", e.target.value)} /></Field>
        <Field label="Cold Storage"><select style={s.select} value={form.cold_storage_id} onChange={e => f("cold_storage_id", e.target.value)}><option value="">-- Select --</option>{coldStorages.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Date"><input type="date" style={s.input} value={form.date} onChange={e => f("date", e.target.value)} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="Variety"><select style={s.select} value={form.variety_id} onChange={e => f("variety_id", e.target.value)}><option value="">-- Select --</option>{varieties.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></Field>
          <Field label="Grading"><select style={s.select} value={form.grading_id} onChange={e => f("grading_id", e.target.value)}><option value="">-- Select --</option>{gradings.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="Manual Bags"><input type="number" style={s.input} value={form.manual_bags} onChange={e => f("manual_bags", e.target.value)} /></Field>
          <Field label="Total Weight kg"><input type="number" style={s.input} value={form.total_weight} onChange={e => f("total_weight", e.target.value)} /></Field>
        </div>
        <Field label="Std Bag Weight kg"><input type="number" style={s.input} value={form.std_bag_weight} onChange={e => f("std_bag_weight", e.target.value)} /></Field>
        <div style={{ ...s.card2, ...s.rowBetween, marginBottom: 12 }}><span style={{ fontSize: 13, color: clr.muted }}>STD Bags (Auto)</span><span style={{ fontWeight: 800, color: clr.green, fontSize: 16 }}>{stdBags}</span></div>
        <Field label="Pricing Type"><div style={s.row}>{["STD", "Manual"].map(t => (<button key={t} onClick={() => f("pricing_type", t)} style={{ ...s.btn(form.pricing_type === t ? clr.accent : clr.card2, form.pricing_type === t ? "#000" : clr.text), flex: 1 }}>{t}</button>))}</div></Field>
        <Field label={`Rate ₹ per Bag`}><input type="number" style={s.input} value={form.rate} onChange={e => f("rate", e.target.value)} placeholder="e.g. 800" /></Field>
        <div style={{ ...s.card2, ...s.rowBetween, marginBottom: 12 }}><span style={{ fontSize: 13, color: clr.muted }}>Total</span><span style={{ fontWeight: 800, color: clr.accent, fontSize: 18 }}>₹{fmt(totalAmt)}</span></div>
        <Field label="Notes"><input style={s.input} value={form.notes} onChange={e => f("notes", e.target.value)} /></Field>
        <button onClick={save} style={{ ...s.btn(), width: "100%" }}>Save</button>
      </Modal>
    </div>
  );
};

// ─── DISPATCH SCREEN ───────────────────────────────────────────────────────────
const DispatchScreen = ({ purchases, dispatches, mandis, sales, ops }) => {
  const [form, setForm] = useState({ vehicle_number: "", mandi_id: "", date: today(), items: [{ lot_id: "", bags: "", weight: "" }] });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { lot_id: "", bags: "", weight: "" }] }));
  const removeItem = (idx) => setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx, field, val) => setForm(p => ({ ...p, items: p.items.map((it, i) => i === idx ? { ...it, [field]: val } : it) }));

  const save = async () => {
    if (!form.vehicle_number.trim() || !form.mandi_id) return;
    if (form.items.length === 0 || form.items.some(i => !i.lot_id || !i.bags)) return;
    const item = { id: editId || uid(), ...form };
    if (editId) await ops.dispatches.editItem(item);
    else await ops.dispatches.addItem(item);
    setShowForm(false); setEditId(null); setForm({ vehicle_number: "", mandi_id: "", date: today(), items: [{ lot_id: "", bags: "", weight: "" }] });
  };

  return (
    <div>
      <div style={{ ...s.rowBetween, padding: "12px 16px 0" }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>🚛 Dispatch</span>
        <button onClick={() => setShowForm(true)} style={s.btn()}><Icon name="add" size={16} color="#000" /> New</button>
      </div>
      <div style={s.content}>
        {dispatches.length === 0 && <div style={{ ...s.card, textAlign: "center", color: clr.muted, padding: 32 }}>No dispatches yet.</div>}
        {[...dispatches].reverse().map(d => (
          <div key={d.id} style={s.card}>
            <div style={s.rowBetween}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>🚛 {d.vehicle_number}</div>
                <div style={{ fontSize: 12, color: clr.muted }}>{mandis.find(m => m.id === d.mandi_id)?.name} · {fmtDate(d.date)}</div>
              </div>
              <button onClick={() => ops.dispatches.deleteItem(d.id)} style={{ ...s.btnSm(), padding: 6 }}><Icon name="trash" size={14} color={clr.red} /></button>
            </div>
            <div style={s.divider} />
            {d.items?.map((it, idx) => (
              <div key={idx} style={{ ...s.card2, marginBottom: 6 }}>
                <div style={{ fontWeight: 600 }}>LOT: {it.lot_id}</div>
                <div style={{ fontSize: 12, color: clr.muted }}>बैग: {it.bags} | वजन: {it.weight || "-"}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Dispatch">
        <Field label="Vehicle Number"><input style={s.input} value={form.vehicle_number} onChange={e => setForm(p => ({ ...p, vehicle_number: e.target.value }))} /></Field>
        <Field label="Mandi"><select style={s.select} value={form.mandi_id} onChange={e => setForm(p => ({ ...p, mandi_id: e.target.value }))}><option value="">-- Select --</option>{mandis.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
        <Field label="Date"><input type="date" style={s.input} value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></Field>
        {form.items.map((it, idx) => (
          <div key={idx} style={{ ...s.card2, marginBottom: 12, padding: 12 }}>
            <div style={{ ...s.rowBetween, marginBottom: 8 }}><span style={{ fontWeight: 600 }}>Item {idx + 1}</span>{form.items.length > 1 && <button onClick={() => removeItem(idx)} style={s.btnSm()}><Icon name="x" size={12} color={clr.red} /></button>}</div>
            <select style={s.select} value={it.lot_id} onChange={e => updateItem(idx, "lot_id", e.target.value)}><option value="">-- Select Lot --</option>{purchases.map(p => <option key={p.id} value={p.lot_id}>{p.lot_id} - {p.kisan_name}</option>)}</select>
            <input type="number" style={{ ...s.input, marginTop: 8 }} placeholder="Bags" value={it.bags} onChange={e => updateItem(idx, "bags", e.target.value)} />
            <input type="number" style={{ ...s.input, marginTop: 8 }} placeholder="Weight (kg)" value={it.weight} onChange={e => updateItem(idx, "weight", e.target.value)} />
          </div>
        ))}
        <button onClick={addItem} style={{ ...s.btn(clr.card2, clr.text), width: "100%", marginBottom: 12 }}>+ Add Item</button>
        <button onClick={save} style={{ ...s.btn(), width: "100%" }}>Save Dispatch</button>
      </Modal>
    </div>
  );
};

// ─── SALES SCREEN ──────────────────────────────────────────────────────────────
const SalesScreen = ({ purchases, dispatches, sales, mandis, parties, ops }) => {
  const [form, setForm] = useState({ gp_id: "", party_id: "", mandi_id: "", date: today(), lot_sales: [{ lot_id: "", bags: "", rate: "" }], total_amount: "" });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const getName = (arr, id) => arr.find(x => x.id === id)?.name || "-";
  const addLot = () => setForm(p => ({ ...p, lot_sales: [...p.lot_sales, { lot_id: "", bags: "", rate: "" }] }));
  const removeLot = (idx) => setForm(p => ({ ...p, lot_sales: p.lot_sales.filter((_, i) => i !== idx) }));
  const updateLot = (idx, field, val) => setForm(p => ({ ...p, lot_sales: p.lot_sales.map((l, i) => i === idx ? { ...l, [field]: val } : l) }));
  const calcTotal = () => {
    const total = form.lot_sales.reduce((sum, l) => sum + (parseFloat(l.bags || 0) * parseFloat(l.rate || 0)), 0);
    setForm(p => ({ ...p, total_amount: total }));
  };

  const save = async () => {
    if (!form.gp_id || !form.party_id || !form.mandi_id) return;
    if (form.lot_sales.length === 0 || form.lot_sales.some(l => !l.lot_id || !l.bags || !l.rate)) return;
    calcTotal();
    const item = { id: editId || uid(), ...form };
    if (editId) await ops.sales.editItem(item);
    else await ops.sales.addItem(item);
    setShowForm(false); setEditId(null); setForm({ gp_id: "", party_id: "", mandi_id: "", date: today(), lot_sales: [{ lot_id: "", bags: "", rate: "" }], total_amount: "" });
  };

  return (
    <div>
      <div style={{ ...s.rowBetween, padding: "12px 16px 0" }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>💰 Sales</span>
        <button onClick={() => setShowForm(true)} style={s.btn()}><Icon name="add" size={16} color="#000" /> New Sale</button>
      </div>
      <div style={s.content}>
        {sales.length === 0 && <div style={{ ...s.card, textAlign: "center", color: clr.muted, padding: 32 }}>No sales yet.</div>}
        {[...sales].reverse().map(s => (
          <div key={s.id} style={s.card}>
            <div style={s.rowBetween}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>💰 {getName(parties, s.party_id)}</div>
                <div style={{ fontSize: 12, color: clr.muted }}>{getName(mandis, s.mandi_id)} · {fmtDate(s.date)}</div>
              </div>
              <button onClick={() => ops.sales.deleteItem(s.id)} style={{ ...s.btnSm(), padding: 6 }}><Icon name="trash" size={14} color={clr.red} /></button>
            </div>
            <div style={s.divider} />
            {s.lot_sales?.map((l, idx) => (
              <div key={idx} style={{ ...s.card2, marginBottom: 6 }}>
                <div style={s.rowBetween}><span style={{ fontWeight: 600 }}>{l.lot_id}</span><span style={{ color: clr.green }}>₹{fmt(l.rate)}</span></div>
                <div style={{ fontSize: 12, color: clr.muted }}>बैग: {l.bags} | कुल: ₹{fmt(parseFloat(l.bags) * parseFloat(l.rate))}</div>
              </div>
            ))}
            <div style={{ ...s.rowBetween, marginTop: 8, background: clr.accent + "18", borderRadius: 8, padding: "8px 12px" }}>
              <span style={{ fontSize: 12, color: clr.muted }}>Total Amount</span>
              <span style={{ fontWeight: 800, color: clr.accent, fontSize: 16 }}>₹{fmt(s.total_amount)}</span>
            </div>
          </div>
        ))}
      </div>
      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Sale">
        <Field label="Gatepass"><select style={s.select} value={form.gp_id} onChange={e => setForm(p => ({ ...p, gp_id: e.target.value }))}><option value="">-- Select Dispatch --</option>{dispatches.map(d => <option key={d.id} value={d.id}>{d.vehicle_number}</option>)}</select></Field>
        <Field label="Party"><select style={s.select} value={form.party_id} onChange={e => setForm(p => ({ ...p, party_id: e.target.value }))}><option value="">-- Select --</option>{parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Mandi"><select style={s.select} value={form.mandi_id} onChange={e => setForm(p => ({ ...p, mandi_id: e.target.value }))}><option value="">-- Select --</option>{mandis.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
        <Field label="Date"><input type="date" style={s.input} value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></Field>
        {form.lot_sales.map((l, idx) => (
          <div key={idx} style={{ ...s.card2, marginBottom: 12, padding: 12 }}>
            <div style={{ ...s.rowBetween, marginBottom: 8 }}><span style={{ fontWeight: 600 }}>Lot {idx + 1}</span>{form.lot_sales.length > 1 && <button onClick={() => removeLot(idx)} style={s.btnSm()}><Icon name="x" size={12} color={clr.red} /></button>}</div>
            <input style={s.input} value={l.lot_id} onChange={e => updateLot(idx, "lot_id", e.target.value)} placeholder="Lot ID" />
            <input type="number" style={{ ...s.input, marginTop: 8 }} placeholder="Bags" value={l.bags} onChange={e => updateLot(idx, "bags", e.target.value)} />
            <input type="number" style={{ ...s.input, marginTop: 8 }} placeholder="Rate ₹/bag" value={l.rate} onChange={e => updateLot(idx, "rate", e.target.value)} />
          </div>
        ))}
        <button onClick={addLot} style={{ ...s.btn(clr.card2, clr.text), width: "100%", marginBottom: 12 }}>+ Add Lot</button>
        <button onClick={save} style={{ ...s.btn(), width: "100%" }}>Save Sale</button>
      </Modal>
    </div>
  );
};

// ─── PAYMENT SCREEN ────────────────────────────────────────────────────────────
const PaymentScreen = ({ purchases, coldStorages, parties, sales, payments, ops }) => {
  const [form, setForm] = useState({ type: "receivable", amount: "", date: today(), mode: "Cash", notes: "", party_id: "", cold_id: "", lot_id: "" });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const getName = (arr, id) => arr.find(x => x.id === id)?.name || "-";
  const save = async () => {
    if (!form.amount || !form.party_id) return;
    const item = { id: editId || uid(), ...form, amount: parseFloat(form.amount) };
    if (editId) await ops.payments.editItem(item);
    else await ops.payments.addItem(item);
    setShowForm(false); setEditId(null); setForm({ type: "receivable", amount: "", date: today(), mode: "Cash", notes: "", party_id: "", cold_id: "", lot_id: "" });
  };

  return (
    <div>
      <div style={{ ...s.rowBetween, padding: "12px 16px 0" }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>💳 Payment</span>
        <button onClick={() => setShowForm(true)} style={s.btn()}><Icon name="add" size={16} color="#000" /> New</button>
      </div>
      <div style={s.content}>
        {payments.length === 0 && <div style={{ ...s.card, textAlign: "center", color: clr.muted, padding: 32 }}>No payments yet.</div>}
        {[...payments].reverse().map(p => (
          <div key={p.id} style={s.card}>
            <div style={s.rowBetween}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: p.type === "receivable" ? clr.green : clr.red }}>
                  {p.type === "receivable" ? "📥" : "📤"} {p.type === "receivable" ? "Received" : "Payable"}
                </div>
                <div style={{ fontSize: 12, color: clr.muted }}>{getName(parties, p.party_id)} · {fmtDate(p.date)}</div>
              </div>
              <div style={s.row}>
                <button onClick={() => ops.payments.deleteItem(p.id)} style={{ ...s.btnSm(), padding: 6 }}><Icon name="trash" size={14} color={clr.red} /></button>
              </div>
            </div>
            <div style={s.divider} />
            <div style={{ ...s.rowBetween, background: p.type === "receivable" ? clr.green + "18" : clr.red + "18", borderRadius: 8, padding: "8px 12px" }}>
              <span style={{ fontSize: 12, color: clr.muted }}>₹{fmt(p.amount)} · {p.mode}</span>
              <span style={{ fontWeight: 700, color: p.type === "receivable" ? clr.green : clr.red }}>{p.type === "receivable" ? "+" : "-"}₹{fmt(p.amount)}</span>
            </div>
          </div>
        ))}
      </div>
      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Payment">
        <Field label="Type"><div style={s.row}>{["receivable", "payable"].map(t => (<button key={t} onClick={() => setForm(p => ({ ...p, type: t }))} style={{ ...s.btn(form.type === t ? clr.accent : clr.card2, form.type === t ? "#000" : clr.text), flex: 1 }}>{t}</button>))}</div></Field>
        <Field label="Amount"><input type="number" style={s.input} value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></Field>
        <Field label="Party"><select style={s.select} value={form.party_id} onChange={e => setForm(p => ({ ...p, party_id: e.target.value }))}><option value="">-- Select --</option>{parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Mode"><select style={s.select} value={form.mode} onChange={e => setForm(p => ({ ...p, mode: e.target.value }))}>{PMODES.map(m => <option key={m} value={m}>{m}</option>)}</select></Field>
        <Field label="Date"><input type="date" style={s.input} value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></Field>
        <Field label="Notes"><input style={s.input} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></Field>
        <button onClick={save} style={{ ...s.btn(), width: "100%" }}>Save</button>
      </Modal>
    </div>
  );
};

// ─── APP ──────────────────────────────────────────────────────────────────────
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

  const ops = {
    purchases: opsP,
    dispatches: opsD,
    sales: opsS,
    payments: opsM,
    varieties: opsV,
    gradings: opsG,
    cold_storages: opsC,
    mandis: opsMA,
    parties: opsPA,
  };

  const loading = Object.values(ops).some(op => op.loading);

  return (
    <div style={s.screen}>
      <div style={s.header}>
        <h2 style={{ margin: 0, flex: 1, fontSize: 20 }}>🏪 खाद्य प्रबंधन</h2>
      </div>

      {currentTab === "purchase" && <PurchaseScreen purchases={purchases} varieties={varieties} gradings={gradings} coldStorages={coldStorages} dispatches={dispatches} sales={sales} payments={payments} ops={ops} />}

      {currentTab === "dispatch" && <DispatchScreen purchases={purchases} dispatches={dispatches} mandis={mandis} sales={sales} ops={ops} />}

      {currentTab === "sales" && <SalesScreen purchases={purchases} dispatches={dispatches} sales={sales} mandis={mandis} parties={parties} ops={ops} />}

      {currentTab === "payment" && <PaymentScreen purchases={purchases} coldStorages={coldStorages} parties={parties} sales={sales} payments={payments} ops={ops} />}

      {currentTab === "master" && <MasterScreen varieties={varieties} gradings={gradings} coldStorages={coldStorages} mandis={mandis} parties={parties} ops={ops} />}

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
