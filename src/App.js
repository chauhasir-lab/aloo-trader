import React, { useState, useCallback, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// --- CONFIG & SUPABASE CLIENT ---
const SUPABASE_URL = "https://cxjmwjljjnuthcrmnbqb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4am13amxqam51dGhjcm1uYnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTYzMzUsImV4cCI6MjA5MjY3MjMzNX0.ynRaceAT1uWcsPOJ_5vY_8NKolM3EaWKQajUEk4sLz8";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- HOOK FOR SUPABASE TABLES ---
const useSupabaseTable = (tableName, defaultValue = []) => {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from(tableName).select("*").order("created_at", { ascending: false });
    if (!error && rows) {
      const parsed = rows.map(row => {
        const r = { ...row };
        if (r.items && typeof r.items === 'string') try { r.items = JSON.parse(r.items); } catch { r.items = []; }
        if (r.lot_sales && typeof r.lot_sales === 'string') try { r.lot_sales = JSON.parse(r.lot_sales); } catch { r.lot_sales = []; }
        return r;
      });
      setData(parsed);
    }
    setLoading(false);
  }, [tableName]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addItem = useCallback(async (item) => {
    const { id, created_at, ...rest } = item;
    const formatted = { ...rest };
    if (formatted.items && typeof formatted.items !== 'string') formatted.items = JSON.stringify(formatted.items);
    if (formatted.lot_sales && typeof formatted.lot_sales !== 'string') formatted.lot_sales = JSON.stringify(formatted.lot_sales);
    
    const { data: inserted, error } = await supabase.from(tableName).insert([formatted]).select();
    if (!error && inserted) {
      const resp = { ...inserted[0] };
      if (resp.items && typeof resp.items === 'string') try { resp.items = JSON.parse(resp.items); } catch { resp.items = []; }
      if (resp.lot_sales && typeof resp.lot_sales === 'string') try { resp.lot_sales = JSON.parse(resp.lot_sales); } catch { resp.lot_sales = []; }
      setData(p => [resp, ...p]);
    }
  }, [tableName]);

  const editItem = useCallback(async (item) => {
    const { id, created_at, ...rest } = item;
    const formatted = { ...rest };
    if (formatted.items && typeof formatted.items !== 'string') formatted.items = JSON.stringify(formatted.items);
    if (formatted.lot_sales && typeof formatted.lot_sales !== 'string') formatted.lot_sales = JSON.stringify(formatted.lot_sales);

    const { error } = await supabase.from(tableName).update(formatted).eq("id", id);
    if (!error) setData(p => p.map(x => x.id === id ? { ...x, ...item } : x));
  }, [tableName]);

  const deleteItem = useCallback(async (id) => {
    const { error } = await supabase.from(tableName).delete().eq("id", id);
    if (!error) setData(p => p.filter(x => x.id !== id));
  }, [tableName]);

  return [data, { addItem, editItem, deleteItem, loading, refresh: fetchData }];
};

// --- CORE ANALYTICAL LOGIC UTILS ---
const STD_WEIGHT_FACTOR = 52.2;

const fmt = (n, d = 0) => (isNaN(n) || n === null || n === undefined ? "0" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d }));
const today = () => new Date().toISOString().slice(0, 10);

const clr = { bg: "#0f1117", card: "#1a1d26", card2: "#22263a", accent: "#f5a623", green: "#22c55e", red: "#ef4444", blue: "#3b82f6", purple: "#a855f7", muted: "#6b7280", border: "#2d3148", text: "#f1f5f9" };

const getGlobalAnalytics = (purchases, dispatches, sales, payments = []) => {
  let activeLotsCount = 0;
  let closedLotsCount = 0;
  let totalStockBags = 0;
  let totalStockWeight = 0;
  let totalGoodsValue = 0;
  let totalProfitLoss = 0;

  purchases.forEach(p => {
    const totalDispatched = dispatches.flatMap(d => d.items || []).filter(i => i.lot_id === p.lot_id).reduce((sum, i) => sum + parseFloat(i.bags || 0), 0);
    const initialBags = parseFloat(p.manual_bags || 0);
    const remainingBags = Math.max(0, initialBags - totalDispatched);
    const calculatedAvgWeight = initialBags > 0 ? (p.total_weight / initialBags) : 0;
    const remainingWeight = remainingBags * calculatedAvgWeight;

    if (remainingBags > 0) {
      activeLotsCount++;
      totalStockBags += remainingBags;
      totalStockWeight += remainingWeight;
      totalGoodsValue += remainingBags * p.rate;
    } else {
      closedLotsCount++;
    }

    const saleMatches = sales.flatMap(s => s.lot_sales || []).filter(l => l.lot_id === p.lot_id);
    if (saleMatches.length > 0) {
      const soldValue = saleMatches.reduce((sum, sm) => sum + (sm.weight * sm.rate_per_kg), 0);
      const parentBijaks = sales.filter(s => s.lot_sales?.some(l => l.lot_id === p.lot_id));
      
      let allocatedExpenses = 0;
      parentBijaks.forEach(bj => {
        const totalLotsInBijak = bj.lot_sales?.length || 1;
        const totalLaborCost = (bj.lot_sales?.reduce((s, l) => s + (l.bags || 0), 0) || 0) * (bj.labor_per_bag || 0);
        const commissionCost = (bj.lot_sales?.reduce((s, l) => s + (l.weight * l.rate_per_kg), 0) || 0) * ((bj.mandi_commission_percent || 0) / 100);
        const totalInvoiceOverhead = (bj.transport_expense || 0) + (bj.other_expenses || 0) + totalLaborCost + commissionCost;
        allocatedExpenses += (totalInvoiceOverhead / totalLotsInBijak);
      });

      totalProfitLoss += (soldValue - p.total_cost - allocatedExpenses);
    }
  });

  // Financial Dues
  let partyDues = {};
  let coldDues = {};

  sales.forEach(s => {
    const saleTotal = s.lot_sales?.reduce((sum, x) => sum + (x.weight * x.rate_per_kg), 0) || 0;
    partyDues[s.party_name] = (partyDues[s.party_name] || 0) + saleTotal;
  });

  dispatches.forEach(d => {
    const totalGatepassBags = d.items?.reduce((sum, x) => sum + (x.bags || 0), 0) || 0;
    coldDues[d.cold_storage] = (coldDues[d.cold_storage] || 0) + (totalGatepassBags * 2); // Nominal storage tracking representation
  });

  payments.forEach(pay => {
    if (pay.flow_type === "PARTY_RECEIVE") {
      partyDues[pay.entity_name] = (partyDues[pay.entity_name] || 0) - pay.amount;
    } else if (pay.flow_type === "COLD_GIVE") {
      coldDues[pay.entity_name] = (coldDues[pay.entity_name] || 0) - pay.amount;
    }
  });

  const aggregatePartyDues = Object.values(partyDues).reduce((a, b) => a + (b > 0 ? b : 0), 0);
  const aggregateColdDues = Object.values(coldDues).reduce((a, b) => a + (b > 0 ? b : 0), 0);

  return { activeLotsCount, closedLotsCount, totalStockBags, totalStockWeight, totalGoodsValue, totalProfitLoss, aggregatePartyDues, aggregateColdDues, partyDues, coldDues };
};

// --- ICON INFRASTRUCTURE ---
const Icon = ({ name, size = 18, color = clr.text }) => {
  const icons = {
    purchase: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    dispatch: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
    sale: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    master: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
    stock: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m8 4v10M4 7v10l8 4",
    payment: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", x: "M6 18L18 6M6 6l12 12", trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icons[name]} /></svg>;
};

const Field = ({ label, children }) => <div style={{ marginBottom: 10 }}><div style={s.label}>{label}</div>{children}</div>;
const Modal = ({ open, onClose, title, children }) => !open ? null : <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 1000, display: "flex", alignItems: "flex-end" }}><div style={{ background: clr.card, borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 480, maxHeight: "90vh", display: "flex", flexDirection: "column", border: `1px solid ${clr.border}`, margin: "0 auto" }}><div style={{ ...s.rowBetween, padding: 14 }}><span style={{ fontWeight: 700, fontSize: 15 }}>{title}</span><button onClick={onClose} style={s.btnSm()}><Icon name="x" size={14} /></button></div><div style={{ overflowY: "auto", padding: "0 14px 20px" }}>{children}</div></div></div>;

// --- DYNAMIC MODULE COMPONENT SCREENS ---

const DashboardScreen = ({ purchases, dispatches, sales, payments }) => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);

  const stats = getGlobalAnalytics(purchases, dispatches, sales, payments);

  const executeSearch = () => {
    if (!query.trim()) return;
    const key = query.toLowerCase();
    
    let matchedLot = purchases.find(p => p.lot_id.toLowerCase() === key);
    let matchedDispatch = dispatches.find(d => d.gatepass_id.toLowerCase() === key || d.truck_no?.toLowerCase() === key);
    
    if (!matchedLot && matchedDispatch && matchedDispatch.items?.length > 0) {
      matchedLot = purchases.find(p => p.lot_id === matchedDispatch.items[0].lot_id);
    }

    if (matchedLot) {
      const associatedDispatch = dispatches.find(d => d.items?.some(i => i.lot_id === matchedLot.lot_id));
      const associatedSale = sales.find(s => s.lot_sales?.some(l => l.lot_id === matchedLot.lot_id));
      setResult({ lot: matchedLot, dispatch: associatedDispatch, sale: associatedSale });
    } else {
      alert("No Lot, Gatepass or Vehicle profile records found.");
      setResult(null);
    }
  };

  return (
    <div style={s.content}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <div style={s.card}><div style={s.label}>Active Lots</div><div style={{ fontSize: 18, fontWeight: 700, color: clr.blue }}>{stats.activeLotsCount}</div></div>
        <div style={s.card}><div style={s.label}>Closed Lots</div><div style={{ fontSize: 18, fontWeight: 700, color: clr.muted }}>{stats.closedLotsCount}</div></div>
        <div style={s.card}><div style={s.label}>Available Stock</div><div style={{ fontSize: 14, fontWeight: 700 }}>{fmt(stats.totalStockBags)} Bags<br/><span style={{ fontSize: 11, color: clr.purple }}>{fmt(stats.totalStockWeight)} kg</span></div></div>
        <div style={s.card}><div style={s.label}>Goods Value Valuation</div><div style={{ fontSize: 15, fontWeight: 700, color: clr.accent }}> can calculated dynamically: ₹{fmt(stats.totalGoodsValue)}</div></div>
        <div style={s.card}><div style={s.label}>Party Pending Dues</div><div style={{ fontSize: 16, fontWeight: 700, color: clr.green }}>₹{fmt(stats.aggregatePartyDues)}</div></div>
        <div style={s.card}><div style={s.label}>Cold Storage Dues</div><div style={{ fontSize: 16, fontWeight: 700, color: clr.red }}>₹{fmt(stats.aggregateColdDues)}</div></div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <input style={{ ...s.input, flex: 1 }} placeholder="Search Lot Number / Gatepass / Vehicle..." value={query} onChange={e => setQuery(e.target.value)} />
          <button onClick={executeSearch} style={{ ...s.btn(clr.accent, "#000"), width: "auto", padding: "0 12px" }}><Icon name="search" size={14} /></button>
        </div>
      </div>

      {result && (
        <div style={{ ...s.card, background: clr.card2 }}>
          <div style={{ fontWeight: 700, color: clr.accent, marginBottom: 6 }}>Search Inspection Stream</div>
          <div style={{ fontSize: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            <div>Lot ID: <b>{result.lot.lot_id}</b></div>
            <div>Farmer: {result.lot.kisan_name}</div>
            <div>Bags: {result.lot.manual_bags} | {fmt(result.lot.total_weight)} kg</div>
            <div>Vehicle: {result.dispatch?.truck_no || "-"}</div>
            <div>Gatepass: {result.dispatch?.gatepass_id || "-"}</div>
            <div>Mandi Match: {result.lot.referred_mandi || "-"}</div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 10 }}>
        <h4 style={{ margin: "0 0 6px 0", fontSize: 12, textTransform: "uppercase", color: clr.muted }}>Recent 3 Purchases</h4>
        {purchases.slice(0, 3).map(p => (
          <div key={p.id} style={{ ...s.card2, margin: "2px 0", fontSize: 12, display: "flex", justifyContent: "space-between" }}>
            <span><b>{p.lot_id}</b> - {p.kisan_name}</span>
            <span>{p.manual_bags} Bags / ₹{fmt(p.total_cost)}</span>
          </div>
        ))}

        <h4 style={{ margin: "10px 0 6px 0", fontSize: 12, textTransform: "uppercase", color: clr.muted }}>Recent 3 Dispatches</h4>
        {dispatches.slice(0, 3).map(d => (
          <div key={d.id} style={{ ...s.card2, margin: "2px 0", fontSize: 12, display: "flex", justifyContent: "space-between" }}>
            <span><b>{d.gatepass_id}</b> ({d.truck_no})</span>
            <span>{d.items?.length || 0} Lots Load</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const PurchaseScreen = ({ purchases, coldStorages, varieties, gradings, mandis, ops }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ lot_id: "", kisan_name: "", manual_bags: "", total_weight: "", rate: "", variety: "", grading: "", cold_storage: "", referred_mandi: "" });

  const calculatedStdBags = form.total_weight ? (parseFloat(form.total_weight) / STD_WEIGHT_FACTOR).toFixed(2) : 0;
  const calculatedTotalCost = form.manual_bags && form.rate ? parseFloat(form.manual_bags) * parseFloat(form.rate) : 0;

  const save = async () => {
    if (!form.lot_id || !form.kisan_name || !form.total_weight || !form.rate) return alert("Fill mandatory indicators");
    await ops.purchases.addItem({
      ...form,
      date: today(),
      std_bags: parseFloat(calculatedStdBags),
      total_cost: calculatedTotalCost
    });
    setOpen(false);
    setForm({ lot_id: "", kisan_name: "", manual_bags: "", total_weight: "", rate: "", variety: "", grading: "", cold_storage: "", referred_mandi: "" });
  };

  return (
    <div style={s.content}>
      <button onClick={() => setOpen(true)} style={{ ...s.btn(), marginBottom: 12 }}>+ Record Purchase</button>
      {purchases.map(p => (
        <div key={p.id} style={s.card}>
          <div style={s.rowBetween}>
            <span style={{ fontWeight: 700 }}>{p.lot_id} - {p.kisan_name}</span>
            <span style={{ color: clr.accent, fontWeight: 700 }}>₹{fmt(p.total_cost)}</span>
          </div>
          <div style={{ fontSize: 12, color: clr.muted, margin: "4px 0" }}>
            {p.manual_bags} Bags ({fmt(p.total_weight)} kg) @ ₹{p.rate}/Bag | Std: {p.std_bags}
          </div>
          <div style={{ fontSize: 11, background: clr.card2, padding: "2px 6px", borderRadius: 4, inlineSize: "fit-content" }}>
            {p.variety} | {p.grading} | Cold: {p.cold_storage} | Suitability: {p.referred_mandi}
          </div>
        </div>
      ))}

      <Modal open={open} onClose={() => setOpen(false)} title="New Purchase Ledger Entry">
        <Field label="Unique Lot Identifier Number"><input style={s.input} value={form.lot_id} onChange={e => setForm({ ...form, lot_id: e.target.value })} placeholder="e.g. LOT-101A" /></Field>
        <Field label="Farmer Name"><input style={s.input} value={form.kisan_name} onChange={e => setForm({ ...form, kisan_name: e.target.value })} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <Field label="Manual Bag Count"><input type="number" style={s.input} value={form.manual_bags} onChange={e => setForm({ ...form, manual_bags: e.target.value })} /></Field>
          <Field label="Total Weight (kg)"><input type="number" style={s.input} value={form.total_weight} onChange={e => setForm({ ...form, total_weight: e.target.value })} /></Field>
        </div>
        <Field label="Rate per Bag (₹)"><input type="number" style={s.input} value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} /></Field>
        
        <Field label="Cold Storage Location">
          <select style={s.select} value={form.cold_storage} onChange={e => setForm({ ...form, cold_storage: e.target.value })}>
            <option value="">Select Cold</option>
            {coldStorages.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Variety Classification">
          <select style={s.select} value={form.variety} onChange={e => setForm({ ...form, variety: e.target.value })}>
            <option value="">Select Variety</option>
            {varieties.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
          </select>
        </Field>
        <Field label="Grading Assessment">
          <select style={s.select} value={form.grading} onChange={e => setForm({ ...form, grading: e.target.value })}>
            <option value="">Select Grade</option>
            {gradings.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
          </select>
        </Field>
        <Field label="Mandi Reference Suitability">
          <select style={s.select} value={form.referred_mandi} onChange={e => setForm({ ...form, referred_mandi: e.target.value })}>
            <option value="">Select Suitability</option>
            {mandis.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
          </select>
        </Field>

        <div style={{ background: clr.card2, padding: 8, borderRadius: 6, margin: "8px 0" }}>
          <div style={{ fontSize: 12 }}>Auto Computed Std Bags: <b>{calculatedStdBags}</b></div>
          <div style={{ fontSize: 13, fontWeight: 700, color: clr.green, marginTop: 2 }}>Est Total Cost: ₹{fmt(calculatedTotalCost)}</div>
        </div>
        <button onClick={save} style={s.btn()}>Finalize Purchase</button>
      </Modal>
    </div>
  );
};

const DispatchScreen = ({ dispatches, purchases, mandis, parties, ops }) => {
  const [open, setOpen] = useState(false);
  const [truckNo, setTruckNo] = useState("");
  const [gatepass, setGatepass] = useState("");
  const [targetMandi, setTargetMandi] = useState("");
  const [targetParty, setTargetParty] = useState("");
  const [loadItems, setLoadItems] = useState([]);

  const [activeLotId, setActiveLotId] = useState("");
  const [activeBags, setActiveBags] = useState("");
  const [activeWeight, setActiveWeight] = useState("");

  const appendLotToVehicle = () => {
    if (!activeLotId || !activeBags || !activeWeight) return;
    setLoadItems([...loadItems, { lot_id: activeLotId, bags: parseFloat(activeBags), weight: parseFloat(activeWeight) }]);
    setActiveLotId(""); setActiveBags(""); setActiveWeight("");
  };

  const executeDispatch = async () => {
    if (!truckNo || !gatepass || loadItems.length === 0) return alert("Verify parameters missing");
    
    await ops.dispatches.addItem({
      gatepass_id: gatepass,
      date: today(),
      truck_no: truckNo,
      mandi: targetMandi,
      party: targetParty,
      items: loadItems
    });

    // WhatsApp Message Compilation Generation
    let textSummary = `Gatepass: ${gatepass}\nVehicle: ${truckNo}\n`;
    loadItems.forEach(i => { textSummary += `- Lot: ${i.lot_id} | ${i.bags} Bags | ${i.weight} kg\n`; });
    
    alert(`⚡ WhatsApp Message Prepared! Click OK to format string popup:\n\n${textSummary}`);
    window.open(`https://wa.me/?text=${encodeURIComponent(textSummary)}`, "_blank");

    setOpen(false); setTruckNo(""); setGatepass(""); setLoadItems([]);
  };

  return (
    <div style={s.content}>
      <button onClick={() => setOpen(true)} style={{ ...s.btn(), marginBottom: 12 }}>+ Create Gatepass Dispatch</button>
      {dispatches.map(d => (
        <div key={d.id} style={s.card}>
          <div style={s.rowBetween}>
            <strong>GP: {d.gatepass_id} ({d.truck_no})</strong>
            <span style={{ fontSize: 11, color: clr.muted }}>{d.date}</span>
          </div>
          <div style={{ fontSize: 12, color: clr.blue }}>Dest: {d.party} @ {d.mandi}</div>
          {d.items?.map((item, idx) => (
            <div key={idx} style={{ fontSize: 12, background: clr.bg, padding: 4, borderRadius: 4, marginTop: 2 }}>
              📦 Lot {item.lot_id} | Load: {item.bags} Bags / {item.weight} kg
            </div>
          ))}
        </div>
      ))}

      <Modal open={open} onClose={() => setOpen(false)} title="Gatepass Multi-Lot Vehicle Loading">
        <Field label="Manual Gatepass ID Number"><input style={s.input} value={gatepass} onChange={e => setGatepass(e.target.value)} /></Field>
        <Field label="Vehicle Plate Number"><input style={s.input} value={truckNo} onChange={e => setTruckNo(e.target.value)} /></Field>
        <Field label="Target Mandi Dest"><select style={s.select} value={targetMandi} onChange={e => setTargetMandi(e.target.value)}>{mandis.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}</select></Field>
        <Field label="Target Party Receiver"><select style={s.select} value={targetParty} onChange={e => setTargetParty(e.target.value)}>{parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></Field>

        <div style={{ background: clr.card2, padding: 8, borderRadius: 6 }}>
          <div style={s.label}>Append Lot Data Entry</div>
          <select style={{ ...s.select, marginBottom: 4 }} value={activeLotId} onChange={e => setActiveLotId(e.target.value)}>
            <option value="">Select Purchase Lot</option>
            {purchases.map(p => <option key={p.id} value={p.lot_id}>{p.lot_id} ({p.kisan_name})</option>)}
          </select>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            <input type="number" placeholder="Load Bags" style={s.input} value={activeBags} onChange={e => setActiveBags(e.target.value)} />
            <input type="number" placeholder="Load Weight (kg)" style={s.input} value={activeWeight} onChange={e => setActiveWeight(e.target.value)} />
          </div>
          <button onClick={appendLotToVehicle} style={{ ...s.btn(clr.purple, "#fff"), height: 32, padding: 0, marginTop: 4, fontSize: 12 }}>+ Add Into Manifest</button>
        </div>

        {loadItems.map((it, idx) => (
          <div key={idx} style={{ ...s.rowBetween, background: clr.card2, padding: 6, marginTop: 4, borderRadius: 4 }}>
            <span style={{ fontSize: 12 }}>{it.lot_id}: {it.bags} B / {it.weight} kg</span>
            <button onClick={() => setLoadItems(loadItems.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: clr.red }}>Remove</button>
          </div>
        ))}

        <button onClick={executeDispatch} style={{ ...s.btn(), marginTop: 10 }}>Submit & Pop Message Manifest</button>
      </Modal>
    </div>
  );
};

const SalesScreen = ({ sales, dispatches, ops }) => {
  const [open, setOpen] = useState(false);
  const [gpLookup, setGpLookup] = useState("");
  const [transport, setTransport] = useState("");
  const [commission, setCommission] = useState("");
  const [labor, setLabor] = useState("");
  const [other, setOther] = useState("");
  const [lotSalesData, setLotSalesData] = useState([]);

  const loadGatepassManifest = () => {
    const gp = dispatches.find(d => d.gatepass_id === gpLookup);
    if (!gp) return alert("Gatepass reference registry matching error");
    
    const preparedLots = gp.items?.map(i => ({
      lot_id: i.lot_id,
      bags: i.bags,
      weight: i.weight,
      rate_per_kg: "",
      weight_loss_kg: "0"
    })) || [];
    setLotSalesData(preparedLots);
  };

  const processInvoiceBijak = async () => {
    const matchingGp = dispatches.find(d => d.gatepass_id === gpLookup);
    await ops.sales.addItem({
      bijak_id: "BJ-" + uid(),
      date: today(),
      gatepass_id: gpLookup,
      party_name: matchingGp?.party || "Mandi Merchant",
      transport_expense: parseFloat(transport || 0),
      mandi_commission_percent: parseFloat(commission || 0),
      labor_per_bag: parseFloat(labor || 0),
      other_expenses: parseFloat(other || 0),
      lot_sales: lotSalesData
    });
    setOpen(false);
  };

  return (
    <div style={s.content}>
      <button onClick={() => setOpen(true)} style={{ ...s.btn(), marginBottom: 12 }}>+ Execute Bill Bijak</button>
      {sales.map(s => (
        <div key={s.id} style={s.card}>
          <div style={s.rowBetween}>
            <strong>Bijak ID: {s.bijak_id} (GP: {s.gatepass_id})</strong>
            <span style={{ color: clr.green, fontWeight: 700 }}>Party: {s.party_name}</span>
          </div>
          {s.lot_sales?.map((ls, idx) => (
            <div key={idx} style={{ fontSize: 12, background: clr.bg, padding: 4, marginTop: 2, borderRadius: 4 }}>
              Lot {ls.lot_id} | Sold {ls.weight} kg @ ₹{ls.rate_per_kg}/kg (Loss: {ls.weight_loss_kg} kg)
            </div>
          ))}
        </div>
      ))}

      <Modal open={open} onClose={() => setOpen(false)} title="Record Sales & Dynamic Cost Dispersion Split">
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          <input style={s.input} placeholder="Type Gatepass ID..." value={gpLookup} onChange={e => setGpLookup(e.target.value)} />
          <button onClick={loadGatepassManifest} style={{ ...s.btn(clr.blue, "#fff"), width: "auto" }}>Pull</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          <Field label="Transport Cost"><input type="number" style={s.input} value={transport} onChange={e => setTransport(e.target.value)} /></Field>
          <Field label="Mandi Commission %"><input type="number" style={s.input} value={commission} onChange={e => setCommission(e.target.value)} /></Field>
          <Field label="Labor Cost per Bag"><input type="number" style={s.input} value={labor} onChange={e => setLabor(e.target.value)} /></Field>
          <Field label="Other Expenses"><input type="number" style={s.input} value={other} onChange={e => setOther(e.target.value)} /></Field>
        </div>

        {lotSalesData.map((ls, idx) => (
          <div key={idx} style={{ background: clr.card2, padding: 6, borderRadius: 4, marginTop: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: clr.accent }}>Config Lot Sales Metrics: {ls.lot_id}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 2 }}>
              <input type="number" placeholder="Rate/kg (₹)" style={s.input} value={ls.rate_per_kg} 
                onChange={e => {
                  const copy = [...lotSalesData];
                  copy[idx].rate_per_kg = e.target.value;
                  setLotSalesData(copy);
                }} 
              />
              <input type="number" placeholder="Weight Loss (kg)" style={s.input} value={ls.weight_loss_kg} 
                onChange={e => {
                  const copy = [...lotSalesData];
                  copy[idx].weight_loss_kg = e.target.value;
                  setLotSalesData(copy);
                }} 
              />
            </div>
          </div>
        ))}

        <button onClick={processInvoiceBijak} style={{ ...s.btn(), marginTop: 10 }}>Finalize & Disperse Ledger Breakdown</button>
      </Modal>
    </div>
  );
};

const PaymentScreen = ({ payments, dispatches, sales, ops }) => {
  const [open, setOpen] = useState(false);
  const [flow, setFlow] = useState("PARTY_RECEIVE");
  const [entity, setEntity] = useState("");
  const [gpId, setGpId] = useState("");
  const [amt, setAmt] = useState("");
  const [mode, setMode] = useState("UPI");

  const savePaymentRecord = async () => {
    if (!entity || !amt) return alert("Verify numeric bounds parameters");
    await ops.payments.addItem({
      date: today(),
      flow_type: flow,
      entity_name: entity,
      gatepass_id: gpId,
      amount: parseFloat(amt),
      payment_mode: mode
    });
    setOpen(false); setEntity(""); setAmt("");
  };

  return (
    <div style={s.content}>
      <button onClick={() => setOpen(true)} style={{ ...s.btn(), marginBottom: 12 }}>+ Record Payment Flow Ledger</button>
      {payments.map(p => (
        <div key={p.id} style={s.card}>
          <div style={s.rowBetween}>
            <span style={{ fontWeight: 700, color: p.flow_type === "PARTY_RECEIVE" ? clr.green : clr.red }}>
              {p.flow_type} — {p.entity_name}
            </span>
            <strong>₹{fmt(p.amount)}</strong>
          </div>
          <div style={{ fontSize: 11, color: clr.muted }}>
            Mode: {p.payment_mode} | GP Ref: {p.gatepass_id || "Global Profile"} | {p.date}
          </div>
        </div>
      ))}

      <Modal open={open} onClose={() => setOpen(false)} title="Post Double Entry Financial Transaction Ledger">
        <Field label="Payment Registry Class">
          <select style={s.select} value={flow} onChange={e => setFlow(e.target.value)}>
            <option value="PARTY_RECEIVE">Receive from Mandi Party Merchant</option>
            <option value="COLD_GIVE">Disburse Remittance to Cold Storage Account</option>
          </select>
        </Field>
        <Field label="Entity Profile Name"><input style={s.input} value={entity} onChange={e => setEntity(e.target.value)} placeholder="Merchant Name or Storage Title" /></Field>
        <Field label="Associated Gatepass ID Ref (Optional)"><input style={s.input} value={gpId} onChange={e => setGpId(e.target.value)} /></Field>
        <Field label="Amount Statement Balance Value (₹)"><input type="number" style={s.input} value={amt} onChange={e => setAmt(e.target.value)} /></Field>
        <Field label="Payment Mode Instrument">
          <select style={s.select} value={mode} onChange={e => setMode(e.target.value)}>
            <option value="UPI">UPI Digital Engine</option>
            <option value="CASH">Liquid Cash Transaction</option>
            <option value="BANK">Direct Core Bank Wire Transfer</option>
            <option value="CHEQUE">Bank Instruments Cheque Verification</option>
          </select>
        </Field>
        <button onClick={savePaymentRecord} style={s.btn()}>Authorize Financial Posting Transaction</button>
      </Modal>
    </div>
  );
};

const StockScreen = ({ purchases, dispatches, sales }) => {
  return (
    <div style={s.content}>
      <h3 style={{ fontSize: 14, textTransform: "uppercase", color: clr.accent, margin: "0 0 10px 0" }}>Inventory Balance Analytics Sheet</h3>
      {purchases.map(p => {
        const totalDispatched = dispatches.flatMap(d => d.items || []).filter(i => i.lot_id === p.lot_id).reduce((sum, i) => sum + parseFloat(i.bags || 0), 0);
        const remBags = Math.max(0, p.manual_bags - totalDispatched);
        return (
          <div key={p.id} style={s.card}>
            <div style={s.rowBetween}>
              <strong>{p.lot_id} ({p.variety})</strong>
              <span style={s.tag(remBags > 0 ? clr.blue + "22" : clr.muted + "22", remBags > 0 ? clr.blue : clr.muted)}>
                {remBags > 0 ? `${remBags} Bags Left` : "Depleted"}
              </span>
            </div>
            <div style={{ fontSize: 12, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
              <span>Initial: {p.manual_bags} Bags</span>
              <span>Dispatched: {totalDispatched} Bags</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const MasterSection = ({ title, items, fields, onAdd, onDelete }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});

  return (
    <div style={{ ...s.card, marginBottom: 12 }}>
      <div style={s.rowBetween}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{title}</span>
        <button onClick={() => setOpen(true)} style={s.btnSm(clr.accent + "22", clr.accent)}>+ Add</button>
      </div>
      <div style={{ marginTop: 6 }}>
        {items.map(i => (
          <div key={i.id} style={{ ...s.card2, margin: "3px 0", ...s.rowBetween, padding: "6px 10px" }}>
            <span style={{ fontSize: 13 }}>{i.name} {i.phone ? `(${i.phone})` : ""}</span>
            <button onClick={() => onDelete(i.id)} style={{ background: "none", border: "none", color: clr.red, fontSize: 11 }}>Delete</button>
          </div>
        ))}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={`Create ${title}`}>
        {fields.map(f => (
          <Field key={f.key} label={f.label}>
            <input style={s.input} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
          </Field>
        ))}
        <button onClick={() => { onAdd({ ...form, id: Math.random().toString(36).slice(2, 7) }); setOpen(false); }} style={s.btn()}>Save</button>
      </Modal>
    </div>
  );
};

const MasterScreen = ({ varieties, gradings, coldStorages, mandis, parties, ops }) => (
  <div style={s.content}>
    <MasterSection title="Parties & Merchants Profiles" items={parties} fields={[{ key: "name", label: "Name" }, { key: "phone", label: "Mobile" }, { key: "address", label: "Address" }, { key: "credit_days", label: "Credit Window Days" }]} onAdd={item => ops.parties.addItem(item)} onDelete={id => ops.parties.deleteItem(id)} />
    <MasterSection title="Cold Storage Infrastructure" items={coldStorages} fields={[{ key: "name", label: "Name" }, { key: "phone", label: "Mobile Phone" }, { key: "address", label: "Address" }]} onAdd={item => ops.cold_storages.addItem(item)} onDelete={id => ops.cold_storages.deleteItem(id)} />
    <MasterSection title="Potato Varieties" items={varieties} fields={[{ key: "name", label: "Variety Metric Name" }]} onAdd={item => ops.varieties.addItem(item)} onDelete={id => ops.varieties.deleteItem(id)} />
    <MasterSection title="Grading Specifications" items={gradings} fields={[{ key: "name", label: "Grade Code" }]} onAdd={item => ops.gradings.addItem(item)} onDelete={id => ops.gradings.deleteItem(id)} />
    <MasterSection title="Target Mandis Matrix" items={mandis} fields={[{ key: "name", label: "Mandi Location Terminal Name" }]} onAdd={item => ops.mandis.addItem(item)} onDelete={id => ops.mandis.deleteItem(id)} />
  </div>
);

// --- MAIN RUNTIME CONTAINER LAYOUT APPLICATION ---
export default function App() {
  const [screen, setScreen] = useState("dash");

  const [purchases, purchaseOps] = useSupabaseTable("purchases");
  const [dispatches, dispatchOps] = useSupabaseTable("dispatches");
  const [sales, saleOps] = useSupabaseTable("sales");
  const [payments, paymentOps] = useSupabaseTable("payments");
  const [varieties, varietyOps] = useSupabaseTable("varieties");
  const [gradings, gradingOps] = useSupabaseTable("gradings");
  const [coldStorages, storageOps] = useSupabaseTable("cold_storages");
  const [mandis, mandiOps] = useSupabaseTable("mandis");
  const [parties, partyOps] = useSupabaseTable("parties");

  const ops = { purchases: purchaseOps, dispatches: dispatchOps, sales: saleOps, payments: paymentOps, varieties: varietyOps, gradings: gradingOps, cold_storages: storageOps, mandis: mandiOps, parties: partyOps };

  return (
    <div style={s.screen}>
      <div style={s.header}>
        <span style={{ fontSize: 16, fontWeight: 800, color: clr.accent }}>AlooTrader Terminal v3</span>
        <span style={s.tag(clr.card2, clr.text)}>2026 Engine</span>
      </div>

      {screen === "dash" && <DashboardScreen purchases={purchases} dispatches={dispatches} sales={sales} payments={payments} />}
      {screen === "purch" && <PurchaseScreen purchases={purchases} coldStorages={coldStorages} varieties={varieties} gradings={gradings} mandis={mandis} ops={ops} />}
      {screen === "disp" && <DispatchScreen dispatches={dispatches} purchases={purchases} mandis={mandis} parties={parties} ops={ops} />}
      {screen === "sale" && <SalesScreen sales={sales} dispatches={dispatches} ops={ops} />}
      {screen === "pay" && <PaymentScreen payments={payments} dispatches={dispatches} sales={sales} ops={ops} />}
      {screen === "stock" && <StockScreen purchases={purchases} dispatches={dispatches} sales={sales} />}
      {screen === "mast" && <MasterScreen varieties={varieties} gradings={gradings} coldStorages={coldStorages} mandis={mandis} parties={parties} ops={ops} />}

      <div style={s.navBar}>
        <button onClick={() => setScreen("dash")} style={s.navItem(screen === "dash")}><Icon name="search" active={screen === "dash"} />Dash</button>
        <button onClick={() => setScreen("purch")} style={s.navItem(screen === "purch")}><Icon name="purchase" active={screen === "purch"} />Buy</button>
        <button onClick={() => setScreen("disp")} style={s.navItem(screen === "disp")}><Icon name="dispatch" active={screen === "disp"} />Load</button>
        <button onClick={() => setScreen("sale")} style={s.navItem(screen === "sale")}><Icon name="sale" active={screen === "sale"} />Sell</button>
        <button onClick={() => setScreen("pay")} style={s.navItem(screen === "payment")}><Icon name="payment" active={screen === "pay"} />Pay</button>
        <button onClick={() => setScreen("stock")} style={s.navItem(screen === "stock")}><Icon name="stock" active={screen === "stock"} />Stock</button>
        <button onClick={() => setScreen("mast")} style={s.navItem(screen === "mast")}><Icon name="master" active={screen === "mast"} />Setup</button>
      </div>
    </div>
  );
}
