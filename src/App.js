import { useState, useCallback, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cxjmwjljjnuthcrmnbqb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4am13amxqam51dGhjcm1uYnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTYzMzUsImV4cCI6MjA5MjY3MjMzNX0.ynRaceAT1uWcsPOJ_5vY_8NKolM3EaWKQajUEk4sLz8";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const useSupabaseTable = (tableName, defaultValue = []) => {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from(tableName).select("*").order("created_at", { ascending: true });
    if (!error && rows) {
      const parsed = rows.map(row => {
        const r = { ...row };
        if (r.items && typeof r.items === 'string') { try { r.items = JSON.parse(r.items); } catch { r.items = []; } }
        if (r.lot_sales && typeof r.lot_sales === 'string') { try { r.lot_sales = JSON.parse(r.lot_sales); } catch { r.lot_sales = []; } }
        return r;
      });
      setData(parsed);
    }
    setLoading(false);
  }, [tableName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addItem = useCallback(async (item) => {
    const { created_at, ...rest } = item;
    const { data: inserted, error } = await supabase.from(tableName).insert([{ ...rest }]).select();
    if (!error && inserted) {
      await fetchData();
    }
  }, [tableName, fetchData]);

  const deleteItem = useCallback(async (id) => {
    const { error } = await supabase.from(tableName).delete().eq("id", id);
    if (!error) setData(p => p.filter(x => x.id !== id));
  }, [tableName]);

  return [data, { addItem, deleteItem, loading }];
};

const uid = () => Math.random().toString(36).slice(2, 7).toUpperCase();
const fmt = (n, d = 0) => (isNaN(n) ? "0" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d }));
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "-";
const today = () => new Date().toISOString().slice(0, 10);

const clr = { bg: "#0f1117", card: "#1a1d26", card2: "#22263a", accent: "#f5a623", green: "#22c55e", red: "#ef4444", blue: "#3b82f6", purple: "#a855f7", muted: "#6b7280", border: "#2d3148", text: "#f1f5f9" };

const Icon = ({ name, size = 18, color = clr.text }) => {
  const icons = {
    purchase: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    dispatch: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
    sale: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    payment: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    master: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
    add: "M12 4v16m8-8H4", x: "M6 18L18 6M6 6l12 12", search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icons[name]} /></svg>;
};

const s = {
  screen: { minHeight: "100vh", background: clr.bg, color: clr.text, fontFamily: "system-ui, sans-serif", maxWidth: 480, margin: "0 auto", position: "relative" },
  header: { background: clr.card, padding: "14px 16px", borderBottom: `1px solid ${clr.border}`, position: "sticky", top: 0, zIndex: 100 },
  card: { background: clr.card, borderRadius: 12, padding: 14, marginBottom: 10, border: `1px solid ${clr.border}` },
  card2: { background: clr.card2, borderRadius: 10, padding: 12, marginBottom: 8, border: `1px solid ${clr.border}` },
  rowBetween: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  row: { display: "flex", alignItems: "center", gap: 8 },
  input: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 8, padding: "10px 12px", color: clr.text, fontSize: 14, boxSizing: "border-box", outline: "none" },
  select: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 8, padding: "10px 12px", color: clr.text, fontSize: 14, boxSizing: "border-box", outline: "none" },
  label: { fontSize: 11, color: clr.muted, marginBottom: 3, fontWeight: 600, textTransform: "uppercase" },
  btn: (bg = clr.accent, txt = "#000") => ({ background: bg, color: txt, border: "none", borderRadius: 8, padding: "11px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }),
  btnSm: (bg = clr.card2, txt = clr.text) => ({ background: bg, color: txt, border: `1px solid ${clr.border}`, borderRadius: 6, padding: "6px 10px", fontWeight: 600, fontSize: 12, cursor: "pointer" }),
  tag: (bg = clr.accent + "22", txt = clr.accent) => ({ background: bg, color: txt, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }),
  content: { padding: 16, paddingBottom: 110 },
  navBar: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: clr.card, borderTop: `1px solid ${clr.border}`, display: "flex", zIndex: 200 },
  navItem: (active) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 4px", gap: 3, background: "none", border: "none", color: active ? clr.accent : clr.muted, fontSize: 10, cursor: "pointer" }),
  divider: { height: 1, background: clr.border, margin: "10px 0" }
};

const Field = ({ label, children }) => <div style={{ marginBottom: 12 }}><div style={s.label}>{label}</div>{children}</div>;

const Modal = ({ open, onClose, title, children }) => !open ? null : (
  <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 1000, display: "flex", alignItems: "flex-end" }}>
    <div style={{ background: clr.card, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "85vh", display: "flex", flexDirection: "column", border: `1px solid ${clr.border}`, margin: "0 auto" }}>
      <div style={{ ...s.rowBetween, padding: 16 }}><span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span><button onClick={onClose} style={s.btnSm()}><Icon name="x" size={14} /></button></div>
      <div style={{ overflowY: "auto", padding: "0 16px 24px" }}>{children}</div>
    </div>
  </div>
);

// --- DEDICATED GENERAL DASHBOARD VIEW ---
const DedicatedDashboard = ({ purchases, dispatches, sales, payments, coldStorages, parties }) => {
  const calculations = useMemo(() => {
    let purchaseTotal = purchases.reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0);
    let grossMandiSales = sales.reduce((sum, s) => sum + parseFloat(s.gross_amount || 0), 0);
    let netMandiSales = sales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
    
    let totalStdBags = purchases.reduce((sum, p) => sum + parseFloat(p.std_bags || 0), 0);
    let totalDispBags = dispatches.flatMap(d => d.items || []).reduce((sum, i) => sum + parseFloat(i.bags || 0), 0);
    let remainingBags = totalStdBags - totalDispBags;

    let activeLotsCount = 0;
    let closedLotsCount = 0;

    purchases.forEach(p => {
      let dispatchedForLot = dispatches.flatMap(d => d.items || []).filter(i => i.lot_id === p.lot_id).reduce((s, i) => s + parseFloat(i.bags || 0), 0);
      if (dispatchedForLot >= p.std_bags) closedLotsCount++;
      else activeLotsCount++;
    });

    let totalPaidToCold = payments.filter(p => p.type === "payable").reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    let totalRecFromParties = payments.filter(p => p.type === "receivable").reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    let currentColdDues = purchaseTotal - totalPaidToCold;
    let currentPartyDues = netMandiSales - totalRecFromParties;
    let netProfitLoss = netMandiSales - purchaseTotal;

    return {
      purchaseTotal, grossMandiSales, netMandiSales, remainingBags, activeLotsCount,
      closedLotsCount, currentColdDues, currentPartyDues, netProfitLoss
    };
  }, [purchases, dispatches, sales, payments]);

  return (
    <div>
      <div style={{ ...s.card, background: "linear-gradient(135deg, #1a1d26 0%, #22263a 100%)", borderLeft: `4px solid ${calculations.netProfitLoss >= 0 ? clr.green : clr.red}` }}>
        <div style={s.label}>कुल व्यापारिक लाभ / हानि (Net P&L)</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: calculations.netProfitLoss >= 0 ? clr.green : clr.red }}>
          ₹{fmt(calculations.netProfitLoss)}
        </div>
        <div style={{ fontSize: 11, color: clr.muted, marginTop: 4 }}>सकल बिक्री से कुल खरीद लागत घटाकर</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div style={s.card2}>
          <div style={s.label}>सक्रिय लॉट (Active)</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: clr.accent }}>{calculations.activeLotsCount} Lots</div>
        </div>
        <div style={s.card2}>
          <div style={s.label}>बंद लॉt (Closed)</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: clr.muted }}>{calculations.closedLotsCount} Lots</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div style={{ ...s.card2, borderLeft: `3px solid ${clr.red}` }}>
          <div style={s.label}>कोल्ड स्टोरेज देना (Dues)</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: clr.red }}>₹{fmt(calculations.currentColdDues)}</div>
        </div>
        <div style={{ ...s.card2, borderLeft: `3px solid ${clr.green}` }}>
          <div style={s.label}>आढ़ती से लेना (Receivable)</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: clr.green }}>₹{fmt(calculations.currentPartyDues)}</div>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.label}>मंडी स्टॉक बैलेंस स्टेटस</div>
        <div style={s.divider} />
        <div style={{ ...s.rowBetween, fontSize: 13 }}>
          <span>बचा हुआ स्टॉक:</span>
          <strong style={{ color: clr.purple, fontSize: 16 }}>{fmt(calculations.remainingBags, 1)} Bags</strong>
        </div>
        <div style={{ fontSize: 11, color: clr.muted, marginTop: 2, textAlign: "right" }}>
          ~{fmt(calculations.remainingBags * 52.5)} KG Inventory
        </div>
      </div>
    </div>
  );
};

// --- ADVANCED SEARCH PROTOCOL ENGINE ---
const AdvancedSearchEngine = ({ purchases, dispatches, sales, mandis, parties }) => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);

  const executeSearch = () => {
    if (!query.trim()) return;
    const cleanQuery = query.toLowerCase().trim();

    // Find linked Lot
    const matchedLot = purchases.find(p => p.lot_id.toLowerCase() === cleanQuery);
    // Find linked Gatepass
    const matchedDispatch = dispatches.find(d => d.gatepass_id.toLowerCase() === cleanQuery);

    let targetLot = matchedLot;
    let connectedDispatches = [];

    if (matchedDispatch) {
      connectedDispatches = [matchedDispatch];
      const primaryLotId = matchedDispatch.items?.[0]?.lot_id;
      if (primaryLotId) {
        targetLot = purchases.find(p => p.lot_id === primaryLotId);
      }
    } else if (targetLot) {
      connectedDispatches = dispatches.filter(d => d.items?.some(it => it.lot_id === targetLot.lot_id));
    }

    if (!targetLot && connectedDispatches.length === 0) {
      setResult({ found: false });
      return;
    }

    const linkedSales = sales.filter(s => s.gp_id && connectedDispatches.some(d => d.id === s.gp_id));
    
    let totalSaleRevenue = linkedSales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
    let totalLotCost = targetLot ? parseFloat(targetLot.total_amount || 0) : 0;
    let computedPnL = totalSaleRevenue - totalLotCost;

    setResult({
      found: true,
      lot: targetLot,
      dispatches: connectedDispatches,
      sales: linkedSales,
      pnl: computedPnL
    });
  };

  return (
    <div style={{ ...s.card, background: "#1c2030" }}>
      <div style={s.label}>Advanced Tracking Matrix</div>
      <div style={{ display: "flex", gap: 6, marginTop: 6, marginBottom: 10 }}>
        <input style={s.input} placeholder="Lot Number या Gatepass ID दर्ज करें..." value={query} onChange={e => setQuery(e.target.value)} />
        <button onClick={executeSearch} style={s.btn(clr.blue, "#fff")}><Icon name="search" size={14} /></button>
      </div>

      {result && !result.found && <div style={{ color: clr.red, fontSize: 12 }}>कोई रिकॉर्ड मैच नहीं हुआ। कृपया सही ID डालें।</div>}
      
      {result && result.found && (
        <div style={{ background: clr.bg, padding: 10, borderRadius: 8, border: `1px solid ${clr.border}` }}>
          {result.lot && (
            <div>
              <div style={s.rowBetween}><span style={{ color: clr.accent, fontWeight: 700 }}>{result.lot.lot_id}</span><span>{result.lot.kisan_name}</span></div>
              <div style={{ fontSize: 11, color: clr.muted }}>मूल खरीद मूल्य: ₹{fmt(result.lot.total_amount)} | {fmt(result.lot.total_weight)} KG</div>
            </div>
          )}
          <div style={s.divider} />
          <div style={s.label}>लॉजिस्टिक्स एवं रूट विवरण:</div>
          {result.dispatches.map((d, i) => (
            <div key={i} style={{ fontSize: 12, marginTop: 4, background: clr.card2, padding: 6, borderRadius: 4 }}>
              🚚 GP: <strong>{d.gatepass_id}</strong> | गाड़ी: {d.vehicle_number}<br/>
              मंडी: {mandis.find(m => m.id === d.mandi_id)?.name} | आढ़ती: {parties.find(p => p.id === d.party_id)?.name}
            </div>
          ))}
          <div style={s.divider} />
          <div style={s.rowBetween}>
            <span style={{ fontSize: 12 }}>Calculated Thread P&L:</span>
            <strong style={{ color: result.pnl >= 0 ? clr.green : clr.red }}>₹{fmt(result.pnl)}</strong>
          </div>
        </div>
      )}
    </div>
  );
};

// --- PURCHASE SCREEN ---
const PurchaseScreen = ({ purchases, coldStorages, varieties, ops, dispatches, sales }) => {
  const blank = { lot_id: "", kisan_name: "", cold_storage_id: "", date: today(), variety_id: "", total_weight: "", manual_bags: "", rate: "", notes: "" };
  const [form, setForm] = useState(blank);
  const [showForm, setShowForm] = useState(false);

  const stdBags = form.total_weight ? parseFloat(form.total_weight) / 52.5 : 0;
  const computedTotalCost = stdBags * (parseFloat(form.rate) || 0);

  const save = async () => {
    if (!form.lot_id || !form.kisan_name || !form.total_weight || !form.rate) return;
    await ops.purchases.addItem({
      ...form,
      std_bags: stdBags,
      total_amount: computedTotalCost,
      id: uid()
    });
    setShowForm(false);
    setForm(blank);
  };

  return (
    <div>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 800, fontSize: 15 }}>आवक खरीद रजिस्टर (Lots inward)</span>
        <button onClick={() => setShowForm(true)} style={s.btn()}><Icon name="add" size={14} /> New Purchase</button>
      </div>

      {purchases.map(p => (
        <div key={p.id} style={s.card}>
          <div style={s.rowBetween}>
            <strong style={{ color: clr.accent }}>LOT ID: {p.lot_id}</strong>
            <span style={{ fontSize: 11, color: clr.muted }}>{fmtDate(p.date)}</span>
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, marginTop: 4 }}>किसान: {p.kisan_name}</div>
          <div style={{ fontSize: 12, color: clr.blue }}>कोल्ड: {coldStorages.find(c => c.id === p.cold_storage_id)?.name || "N/A Warehouse"}</div>
          <div style={{ fontSize: 12, color: clr.muted }}>वैरायटी: {varieties.find(v => v.id === p.variety_id)?.name || "Potato"}</div>
          <div style={s.divider} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, fontSize: 12 }}>
            <div><div style={s.label}>वजन (KG)</div><strong>{fmt(p.total_weight)} kg</strong></div>
            <div><div style={s.label}>मैम्युअल बैग</div><strong>{p.manual_bags || 0} Bag</strong></div>
            <div><div style={s.label}>STD बैग</div><strong style={{ color: clr.purple }}>{fmt(p.std_bags, 1)}</strong></div>
          </div>
          <div style={{ ...s.rowBetween, marginTop: 8, background: clr.card2, padding: 8, borderRadius: 6 }}>
            <span>रेट: ₹{p.rate}/Bag</span>
            <strong style={{ color: clr.red }}>₹{fmt(p.total_amount)} (Dues Posted)</strong>
          </div>
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="नया आवक परचेज दर्ज करें">
        <Field label="लॉट नंबर (Manual Entry)"><input style={s.input} value={form.lot_id} onChange={e => setForm({ ...form, lot_id: e.target.value })} placeholder="Ex: LOT-501" /></Field>
        <Field label="किसान का नाम"><input style={s.input} value={form.kisan_name} onChange={e => setForm({ ...form, kisan_name: e.target.value })} /></Field>
        <Field label="कोल्ड storage"><select style={s.select} value={form.cold_storage_id} onChange={e => setForm({ ...form, cold_storage_id: e.target.value })}><option value="">चुनें</option>{coldStorages.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="आलू वैरायटी"><select style={s.select} value={form.variety_id} onChange={e => setForm({ ...form, variety_id: e.target.value })}><option value="">वैरायटी चुनें</option>{varieties.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></Field>
        <div style={{ display: "flex", gap: 6 }}>
          <Field label="कुल वजन (KG)"><input type="number" style={s.input} value={form.total_weight} onChange={e => setForm({ ...form, total_weight: e.target.value })} /></Field>
          <Field label="मैन्युअल बैग काउंट"><input type="number" style={s.input} value={form.manual_bags} onChange={e => setForm({ ...form, manual_bags: e.target.value })} /></Field>
        </div>
        <Field label="रेट प्रति standard बैग"><input type="number" style={s.input} value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} /></Field>
        
        <div style={{ ...s.card2, background: "rgba(245,166,35,0.08)" }}>
          <div style={s.rowBetween}><span>स्वचालित STD बैग (52.5kg):</span> <strong>{fmt(stdBags, 2)}</strong></div>
          <div style={s.rowBetween}><span>कोल्ड ड्यूस लायबिलिटी:</span> <strong style={{ color: clr.red }}>₹{fmt(computedTotalCost)}</strong></div>
        </div>
        <button onClick={save} style={{ ...s.btn(), width: "100%", marginTop: 8 }}>परचेज लॉट फाइनल सेव करें</button>
      </Modal>
    </div>
  );
};

// --- DISPATCH SCREEN (MULTI LOT SELECTION MAP) ---
const DispatchScreen = ({ purchases, dispatches, mandis, parties, ops }) => {
  const [form, setForm] = useState({ gatepass_id: "", vehicle_number: "", mandi_id: "", party_id: "", date: today(), items: [{ lot_id: "", bags: "", loaded_weight: "", bag_price: "" }] });
  const [showForm, setShowForm] = useState(false);

  const openNew = () => {
    setForm({ gatepass_id: "GP-" + uid(), vehicle_number: "", mandi_id: "", party_id: "", date: today(), items: [{ lot_id: "", bags: "", loaded_weight: "", bag_price: "" }] });
    setShowForm(true);
  };

  const addLotRow = () => {
    setForm({ ...form, items: [...form.items, { lot_id: "", bags: "", loaded_weight: "", bag_price: "" }] });
  };

  const totalBags = form.items.reduce((sum, i) => sum + parseFloat(i.bags || 0), 0);
  const totalWeight = form.items.reduce((sum, i) => sum + parseFloat(i.loaded_weight || 0), 0);
  const totalEstimatedValue = form.items.reduce((sum, i) => sum + (parseFloat(i.bags || 0) * parseFloat(i.bag_price || 0)), 0);

  const save = async () => {
    if (!form.vehicle_number || !form.mandi_id || !form.party_id) return;
    await ops.dispatches.addItem({
      ...form,
      total_bags: totalBags,
      total_weight: totalWeight,
      estimated_value: totalEstimatedValue,
      id: uid()
    });
    setShowForm(false);
  };

  return (
    <div>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700 }}>मल्टी-लॉट निकासी गेटपास</span>
        <button onClick={openNew} style={s.btn()}><Icon name="add" size={14} /> Multi-Lot Load</button>
      </div>

      {dispatches.map(d => (
        <div key={d.id} style={s.card}>
          <div style={s.rowBetween}>
            <span style={s.tag(clr.blue + "22", clr.blue)}>{d.gatepass_id}</span>
            <span>{fmtDate(d.date)}</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>🚚 गाड़ी: {d.vehicle_number}</div>
          <div style={{ fontSize: 12, color: clr.muted }}>मंडी: {mandis.find(m => m.id === d.mandi_id)?.name} | आढ़ती: {parties.find(p => p.id === d.party_id)?.name}</div>
          <div style={s.divider} />
          {d.items?.map((it, idx) => (
            <div key={idx} style={{ fontSize: 12, background: clr.card2, padding: 6, borderRadius: 4, marginBottom: 4 }}>
              📦 Lot: <strong>{it.lot_id}</strong> | {it.bags} बैग (~{it.loaded_weight} KG) @ ₹{it.bag_price}/Bag
            </div>
          ))}
          <div style={{ ...s.rowBetween, marginTop: 6, fontSize: 13, fontWeight: 700, color: clr.accent }}>
            <span>Total: {d.total_bags} Bags ({fmt(d.total_weight)} KG)</span>
            <span>Value: ₹{fmt(d.estimated_value)}</span>
          </div>
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="नया मल्टी-लॉट गेटपास अलॉटमेंट">
        <Field label="गेटपास नंबर (Auto)"><input style={s.input} value={form.gatepass_id} readOnly /></Field>
        <Field label="गाड़ी नंबर"><input style={s.input} placeholder="UP83TXXXX" value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} /></Field>
        <Field label="गंतव्य मंडी"><select style={s.select} value={form.mandi_id} onChange={e => setForm({ ...form, mandi_id: e.target.value })}><option value="">चुनें</option>{mandis.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
        <Field label="टारगेट आढ़ती पार्टी"><select style={s.select} value={form.party_id} onChange={e => setForm({ ...form, party_id: e.target.value })}><option value="">चुनें</option>{parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        
        <div style={s.card2}>
          <div style={s.rowBetween}><span style={s.label}>मल्टी-लॉट लोड ब्रेकडाउन matrix</span><button onClick={addLotRow} style={s.btnSm(clr.blue, "#fff")}>+ Add Lot</button></div>
          {form.items.map((it, idx) => (
            <div key={idx} style={{ borderBottom: `1px solid ${clr.border}`, paddingBottom: 8, marginTop: 6 }}>
              <select style={s.select} value={it.lot_id} onChange={e => setForm({ ...form, items: form.items.map((ix, i) => i === idx ? { ...ix, lot_id: e.target.value } : ix) })}><option value="">लॉट चुनें</option>{purchases.map(p => <option key={p.id} value={p.lot_id}>{p.lot_id}</option>)}</select>
              <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                <input type="number" placeholder="Bags" style={s.input} value={it.bags} onChange={e => setForm({ ...form, items: form.items.map((ix, i) => i === idx ? { ...ix, bags: e.target.value } : ix) })} />
                <input type="number" placeholder="Weight KG" style={s.input} value={it.loaded_weight} onChange={e => setForm({ ...form, items: form.items.map((ix, i) => i === idx ? { ...ix, loaded_weight: e.target.value } : ix) })} />
                <input type="number" placeholder="Price/Bag" style={s.input} value={it.bag_price} onChange={e => setForm({ ...form, items: form.items.map((ix, i) => i === idx ? { ...ix, bag_price: e.target.value } : ix) })} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ ...s.card2, background: clr.bg, fontSize: 12 }}>
          <div>कुल लोडेड बोरे: <strong>{totalBags} Bags</strong></div>
          <div>कुल अनुमानित भार: <strong>{totalWeight} KG</strong></div>
          <div>कुल माल मूल्य: <strong style={{ color: clr.green }}>₹{fmt(totalEstimatedValue)}</strong></div>
        </div>

        <button onClick={save} style={{ ...s.btn(), width: "100%" }}>Authorize Route Dispatch</button>
      </Modal>
    </div>
  );
};

// --- SALES SCREEN (LOTWISE MANUAL WEIGHT ENTRY & ACCOUNTING) ---
const SalesScreen = ({ dispatches, sales, parties, mandis, ops }) => {
  const [form, setForm] = useState({ gp_id: "", party_id: "", mandi_id: "", date: today(), lot_sales: [], comm_pct: "4", labor_per_bag: "5", transport_expense: "0" });
  const [showForm, setShowForm] = useState(false);

  const handleGPChange = (gpId) => {
    const gp = dispatches.find(d => d.id === gpId);
    if (gp) {
      const parsedLots = gp.items?.map(it => ({ lot_id: it.lot_id, bags: it.bags, manual_sold_weight: (parseFloat(it.bags) * 50).toString(), rate_per_bag: it.bag_price || "" })) || [];
      setForm({ ...form, gp_id: gpId, party_id: gp.party_id, mandi_id: gp.mandi_id, lot_sales: parsedLots });
    }
  };

  const grossSales = form.lot_sales.reduce((sum, l) => sum + (parseFloat(l.bags || 0) * parseFloat(l.rate_per_bag || 0)), 0);
  const totalBags = form.lot_sales.reduce((sum, l) => sum + parseFloat(l.bags || 0), 0);
  const commAmt = (grossSales * parseFloat(form.comm_pct || 0)) / 100;
  const laborAmt = totalBags * parseFloat(form.labor_per_bag || 0);
  const finalNetAmt = grossSales - commAmt - laborAmt - parseFloat(form.transport_expense || 0);

  const save = async () => {
    if (!form.gp_id) return;
    await ops.sales.addItem({ ...form, total_amount: finalNetAmt, gross_amount: grossSales, id: uid() });
    setShowForm(false);
  };

  return (
    <div>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700 }}>मंडी बिक्री पर्ची (Sales Ledger)</span>
        <button onClick={() => setShowForm(true)} style={s.btn(clr.green, "#fff")}><Icon name="add" size={14} /> New Sale Patti</button>
      </div>

      {sales.map(s => (
        <div key={s.id} style={s.card}>
          <div style={s.rowBetween}>
            <span style={s.tag(clr.green + "22", clr.green)}>👤 {parties.find(p => p.id === s.party_id)?.name}</span>
            <span style={{ fontSize: 11 }}>{fmtDate(s.date)}</span>
          </div>
          <div style={s.divider} />
          {s.lot_sales?.map((l, i) => (
            <div key={i} style={{ fontSize: 13, background: clr.card2, padding: 6, borderRadius: 4, marginBottom: 4 }}>
              Lot Reference: <strong>{l.lot_id}</strong> <br/>
              विका बोरे: {l.bags} Bag | <span style={{ color: clr.accent }}>मैन्युअल वजन: {l.manual_sold_weight} KG</span> | Rate: ₹{l.rate_per_bag}
            </div>
          ))}
          <div style={s.divider} />
          <div style={{ ...s.rowBetween, fontSize: 14 }}>
            <span>Net Financial Collection Credited:</span>
            <strong style={{ color: clr.green }}>₹{fmt(s.total_amount)}</strong>
          </div>
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="मंडी अंतिम बिक्री पट्टी रजिस्टर">
        <Field label="संबंधित गेटपास चालान चुनें"><select style={s.select} value={form.gp_id} onChange={e => handleGPChange(e.target.value)}><option value="">चुनें</option>{dispatches.map(d => <option key={d.id} value={d.id}>{d.gatepass_id} ({d.vehicle_number})</option>)}</select></Field>
        
        {form.lot_sales.map((l, idx) => (
          <div key={idx} style={s.card2}>
            <div style={{ fontWeight: 700, color: clr.accent, fontSize: 13 }}>Lot Profile: {l.lot_id} ({l.bags} Bags)</div>
            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
              <Field label="मैन्युअल कांटा वजन (KG)"><input type="number" style={s.input} value={l.manual_sold_weight} onChange={e => setForm({ ...form, lot_sales: form.lot_sales.map((lx, i) => i === idx ? { ...lx, manual_sold_weight: e.target.value } : lx) })} /></Field>
              <Field label="बिक्री रेट"><input type="number" style={s.input} value={l.rate_per_bag} onChange={e => setForm({ ...form, lot_sales: form.lot_sales.map((lx, i) => i === idx ? { ...lx, rate_per_bag: e.target.value } : lx) })} /></Field>
            </div>
          </div>
        ))}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          <Field label="आढ़त कमीशन %"><input type="number" style={s.input} value={form.comm_pct} onChange={e => setForm({ ...form, comm_pct: e.target.value })} /></Field>
          <Field label="मंडी पल्लेदारी/बोरा"><input type="number" style={s.input} value={form.labor_per_bag} onChange={e => setForm({ ...form, labor_per_bag: e.target.value })} /></Field>
        </div>
        <Field label="कुल काटा गया भाड़ा (Freight)"><input type="number" style={s.input} value={form.transport_expense} onChange={e => setForm({ ...form, transport_expense: e.target.value })} /></Field>

        <div style={{ ...s.card2, background: clr.bg }}>
          <div style={s.rowBetween}><span>सकल मूल्य:</span> <strong>₹{fmt(grossSales)}</strong></div>
          <div style={s.rowBetween}><span>खर्चे काटकर नेट लेजर क्रेडिट:</span> <strong style={{ color: clr.green }}>₹{fmt(finalNetAmt)}</strong></div>
        </div>

        <button onClick={save} style={{ ...s.btn(clr.green, "#fff"), width: "100%" }}>लॉन्च बिक्री अकाउंट बिल</button>
      </Modal>
    </div>
  );
};

// --- LEGER / PAYMENT MANAGEMENT SCREEN ---
const PaymentScreen = ({ parties, payments, coldStorages, ops }) => {
  const [form, setForm] = useState({ entity_id: "", type: "receivable", amount: "", date: today(), notes: "" });
  const [showForm, setShowForm] = useState(false);

  const save = async () => {
    if (!form.entity_id || !form.amount) return;
    await ops.payments.addItem({ ...form, amount: parseFloat(form.amount), id: uid() });
    setShowForm(false);
  };

  return (
    <div>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700 }}>कैश / बैंक वाउचर बुक</span>
        <button onClick={() => setShowForm(true)} style={s.btn()}><Icon name="add" size={14} /> Post Entry</button>
      </div>

      {payments.map(p => {
        let name = p.type === "payable" ? coldStorages.find(c => c.id === p.entity_id)?.name : parties.find(pa => pa.id === p.entity_id)?.name;
        return (
          <div key={p.id} style={s.card}>
            <div style={s.rowBetween}>
              <strong>{name || "Unknown Profile Account"}</strong>
              <span style={{ fontSize: 11 }}>{fmtDate(p.date)}</span>
            </div>
            <div style={{ ...s.rowBetween, marginTop: 6 }}>
              <span style={s.tag(p.type === "receivable" ? clr.green + "22" : clr.red + "22", p.type === "receivable" ? clr.green : clr.red)}>
                {p.type === "receivable" ? "पेमेंट आवक मिला (+)" : "कोल्ड भुगतान आउट (-)"}
              </span>
              <strong style={{ color: p.type === "receivable" ? clr.green : clr.red, fontSize: 16 }}>₹{fmt(p.amount)}</strong>
            </div>
          </div>
        );
      })}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="लेजर जर्नल एकाउंटिंग पोस्टिंग">
        <Field label="लेनदेन वर्गीकरण प्रकार">
          <select style={s.select} value={form.type} onChange={e => setForm({ ...form, type: e.target.value, entity_id: "" })}>
            <option value="receivable">पेमेंट मिला (From Mandi Party)</option>
            <option value="payable">पेमेंट दिया (To Cold Storage Ledger)</option>
          </select>
        </Field>
        
        <Field label="लक्षित खाता Ledger">
          <select style={s.select} value={form.entity_id} onChange={e => setForm({ ...form, entity_id: e.target.value })}>
            <option value="">सिलेक्ट करें</option>
            {form.type === "payable" ? coldStorages.map(c => <option key={c.id} value={c.id}>{c.name}</option>) : parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>

        <Field label="भुगतान राशि (₹ Amount)"><input type="number" style={s.input} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></Field>
        <Field label="नरेशन विवरण"><input style={s.input} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Ex: Account Settlement" /></Field>
        
        <button onClick={save} style={{ ...s.btn(), width: "100%" }}>खाते में पोस्ट करें</button>
      </Modal>
    </div>
  );
};

// --- MASTERS COMPONENT CONTROLLER ---
const MastersScreen = ({ ops, parties, coldStorages, mandis, varieties }) => {
  const [activeSubTab, setActiveSubTab] = useState("parties");
  const [nameInput, setNameInput] = useState("");

  const commitMaster = async () => {
    if (!nameInput.trim()) return;
    const item = { id: "MST-" + uid(), name: nameInput.trim() };
    if (activeSubTab === "parties") await ops.parties.addItem(item);
    if (activeSubTab === "cold") await ops.cold_storages.addItem(item);
    if (activeSubTab === "mandi") await ops.mandis.addItem(item);
    if (activeSubTab === "variety") await ops.varieties.addItem(item);
    setNameInput("");
  };

  const getActiveArray = () => {
    if (activeSubTab === "parties") return parties;
    if (activeSubTab === "cold") return coldStorages;
    if (activeSubTab === "mandi") return mandis;
    return varieties;
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 4, overflowX: "auto", marginBottom: 12, paddingBottom: 4 }}>
        {["parties", "cold", "mandi", "variety"].map(t => (
          <button key={t} onClick={() => setActiveSubTab(t)} style={s.btnSm(activeSubTab === t ? clr.accent : clr.card2, activeSubTab === t ? "#000" : clr.text)}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <input style={s.input} placeholder={`Add element inside ${activeSubTab}`} value={nameInput} onChange={e => setNameInput(e.target.value)} />
        <button onClick={commitMaster} style={s.btn()}>+</button>
      </div>

      <div>
        {getActiveArray().map(item => (
          <div key={item.id} style={{ ...s.rowBetween, ...s.card2 }}>
            <span>{item.name}</span>
            <span style={{ fontSize: 10, color: clr.muted }}>{item.id}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- CORE FRAMEWORK ---
export default function App() {
  const [purchases, opsP] = useSupabaseTable("purchases");
  const [dispatches, opsD] = useSupabaseTable("dispatches");
  const [sales, opsS] = useSupabaseTable("sales");
  const [payments, opsM] = useSupabaseTable("payments");
  const [varieties, opsV] = useSupabaseTable("varieties");
  const [coldStorages, opsC] = useSupabaseTable("cold_storages");
  const [mandis, opsMA] = useSupabaseTable("mandis");
  const [parties, opsPA] = useSupabaseTable("parties");
  const [currentTab, setCurrentTab] = useState("dashboard");

  const ops = { purchases: opsP, dispatches: opsD, sales: opsS, payments: opsM, varieties: opsV, cold_storages: opsC, mandis: opsMA, parties: opsPA };

  return (
    <div style={s.screen}>
      <div style={s.header}><h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: clr.accent }}>🥔 ALOO TRADING OS Pro v3.0</h2></div>
      
      <div style={s.content}>
        {currentTab === "dashboard" && (
          <>
            <DedicatedDashboard purchases={purchases} dispatches={dispatches} sales={sales} payments={payments} coldStorages={coldStorages} parties={parties} />
            <div style={{ height: 16 }} />
            <AdvancedSearchEngine purchases={purchases} dispatches={dispatches} sales={sales} mandis={mandis} parties={parties} />
          </>
        )}
        {currentTab === "purchase" && <PurchaseScreen purchases={purchases}
