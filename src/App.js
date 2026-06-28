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
          if (r.items && typeof r.items === 'string') try { r.items = JSON.parse(r.items); } catch { r.items = []; }
          if (r.lot_sales && typeof r.lot_sales === 'string') try { r.lot_sales = JSON.parse(r.lot_sales); } catch { r.lot_sales = []; }
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
    const formatted = { ...rest };
    if (formatted.items && typeof formatted.items !== 'string') formatted.items = JSON.stringify(formatted.items);
    if (formatted.lot_sales && typeof formatted.lot_sales !== 'string') formatted.lot_sales = JSON.stringify(formatted.lot_sales);
    
    const { data: inserted, error } = await supabase.from(tableName).insert([formatted]).select();
    if (!error && inserted) {
      const resp = { ...inserted[0] };
      if (resp.items && typeof resp.items === 'string') try { resp.items = JSON.parse(resp.items); } catch { resp.items = []; }
      if (resp.lot_sales && typeof resp.lot_sales === 'string') try { resp.lot_sales = JSON.parse(resp.lot_sales); } catch { resp.lot_sales = []; }
      setData(p => [...p, resp]);
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

  return [data, { addItem, editItem, deleteItem, loading }];
};

const uid = () => Math.random().toString(36).slice(2, 7).toUpperCase();
const fmt = (n, d = 0) => (isNaN(n) ? "0" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d }));
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "-";
const today = () => new Date().toISOString().slice(0, 10);

const clr = { bg: "#0f1117", card: "#1a1d26", card2: "#22263a", accent: "#f5a623", green: "#22c55e", red: "#ef4444", blue: "#3b82f6", purple: "#a855f7", muted: "#6b7280", border: "#2d3148", text: "#f1f5f9" };

// FIXED: Only calculate profit/loss for SOLD lots
const getLotStatus = (lot, dispatches = [], sales = []) => {
  const totalDispatched = dispatches.flatMap(d => d.items || []).filter(i => i.lot_id === lot.lot_id).reduce((sum, i) => sum + parseFloat(i.bags || 0), 0);
  const totalSold = sales.flatMap(s => s.lot_sales || []).filter(l => l.lot_id === lot.lot_id).reduce((sum, l) => sum + parseFloat(l.bags || 0), 0);
  const effectiveBags = lot.pricing_type === "STD" ? parseFloat(lot.std_bags) : parseFloat(lot.manual_bags);
  const remaining = effectiveBags - totalDispatched;
  
  // FIXED: Only calculate P&L if lot is actually sold
  const isSold = totalSold > 0;
  let profitLoss = 0;
  if (isSold) {
    const soldValue = sales.flatMap(s => s.lot_sales || []).filter(l => l.lot_id === lot.lot_id).reduce((sum, l) => sum + (parseFloat(l.bags || 0) * parseFloat(l.rate || 0)), 0);
    const expense = sales.flatMap(s => s.lot_sales || []).filter(l => l.lot_id === lot.lot_id).reduce((sum, l) => {
      const saleForLot = sales.find(sx => sx.lot_sales?.some(lx => lx.lot_id === lot.lot_id));
      return sum + (parseFloat(l.bags || 0) * (parseFloat(saleForLot?.labor_per_bag || 0)));
    }, 0);
    profitLoss = soldValue - (parseFloat(lot.total_amount) || 0) - expense;
  }

  return { 
    totalDispatched, 
    totalSold, 
    remaining, 
    isClosed: remaining <= 0 && totalDispatched > 0, 
    isSold,
    profitLoss,
    totalSoldValue: sales.flatMap(s => s.lot_sales || []).filter(l => l.lot_id === lot.lot_id).reduce((sum, l) => sum + (parseFloat(l.bags || 0) * parseFloat(l.rate || 0)), 0) || 0
  };
};

// NEW: Get complete lot journey
const getLotJourney = (lot, dispatches = [], sales = []) => {
  const status = getLotStatus(lot, dispatches, sales);
  const dispatchInfo = dispatches.find(d => d.items?.some(i => i.lot_id === lot.lot_id));
  const saleInfo = sales.find(s => s.lot_sales?.some(l => l.lot_id === lot.lot_id));
  
  return {
    lotId: lot.lot_id,
    farmerName: lot.kisan_name,
    buyDate: lot.date,
    manualBags: lot.manual_bags,
    stdBags: lot.std_bags,
    totalWeight: lot.total_weight,
    purchaseRate: lot.rate,
    purchaseAmount: lot.total_amount,
    dispatchedBags: status.totalDispatched,
    gatepassId: dispatchInfo?.gatepass_id || "-",
    vehicleNo: dispatchInfo?.truck_no || "-",
    dispatchDate: dispatchInfo?.date || "-",
    soldBags: status.totalSold,
    saleRate: saleInfo?.lot_sales?.find(l => l.lot_id === lot.lot_id)?.rate || "-",
    bijakId: saleInfo?.bijak_id || "-",
    saleDate: saleInfo?.date || "-",
    totalSoldValue: status.totalSoldValue,
    laborExpense: saleInfo ? status.totalDispatched * (parseFloat(saleInfo.labor_per_bag) || 0) : 0,
    profitLoss: status.profitLoss,
    status: status.isSold ? "SOLD" : "PENDING"
  };
};

const Icon = ({ name, size = 18, color = clr.text }) => {
  const icons = {
    purchase: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    dispatch: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
    sale: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    master: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
    add: "M12 4v16m8-8H4", x: "M6 18L18 6M6 6l12 12", trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16", edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icons[name]} /></svg>;
};

const s = {
  screen: { minHeight: "100vh", background: clr.bg, color: clr.text, fontFamily: "system-ui, sans-serif", maxWidth: 480, margin: "0 auto", position: "relative" },
  header: { background: clr.card, padding: "14px 16px", borderBottom: `1px solid ${clr.border}`, position: "sticky", top: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center" },
  card: { background: clr.card, borderRadius: 12, padding: 14, marginBottom: 10, border: `1px solid ${clr.border}` },
  card2: { background: clr.card2, borderRadius: 10, padding: 12, marginBottom: 8, border: `1px solid ${clr.border}` },
  rowBetween: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  row: { display: "flex", alignItems: "center", gap: 8 },
  input: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 8, padding: "10px 12px", color: clr.text, fontSize: 14, boxSizing: "border-box", outline: "none" },
  select: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 8, padding: "10px 12px", color: clr.text, fontSize: 14, boxSizing: "border-box", outline: "none" },
  label: { fontSize: 11, color: clr.muted, marginBottom: 3, fontWeight: 600, textTransform: "uppercase" },
  btn: (bg = clr.accent, txt = "#000") => ({ background: bg, color: txt, border: "none", borderRadius: 8, padding: "11px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }),
  btnSm: (bg = clr.card2, txt = clr.text) => ({ background: bg, color: txt, border: `1px solid ${clr.border}`, borderRadius: 6, padding: "6px 10px", fontWeight: 600, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }),
  tag: (bg = clr.accent + "22", txt = clr.accent) => ({ background: bg, color: txt, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }),
  content: { padding: 16, paddingBottom: 90 },
  navBar: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: clr.card, borderTop: `1px solid ${clr.border}`, display: "flex", zIndex: 200 },
  navItem: (active) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 4px", gap: 3, background: "none", border: "none", color: active ? clr.accent : clr.muted, fontSize: 10, cursor: "pointer" }),
  divider: { height: 1, background: clr.border, margin: "10px 0" }
};

const Field = ({ label, children }) => <div style={{ marginBottom: 12 }}><div style={s.label}>{label}</div>{children}</div>;
const Modal = ({ open, onClose, title, children }) => !open ? null : <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 1000, display: "flex", alignItems: "flex-end" }}><div style={{ background: clr.card, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "85vh", display: "flex", flexDirection: "column", border: `1px solid ${clr.border}`, margin: "0 auto" }}><div style={{ ...s.rowBetween, padding: 16 }}><span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span><button onClick={onClose} style={s.btnSm()}><Icon name="x" size={14} /></button></div><div style={{ overflowY: "auto", padding: "0 16px 24px" }}>{children}</div></div></div>;
const Badge = ({ v, color = clr.accent }) => <span style={s.tag(color + "22", color)}>{v}</span>;

// --- MASTER SCREEN ---
const MasterSection = ({ title, items, fields, onAdd, onEdit, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});

  const save = async () => {
    if (!form[fields[0].key]?.trim()) return;
    if (editItem) await onEdit({ ...editItem, ...form });
    else await onAdd({ id: uid(), ...form });
    setShowForm(false); setForm({}); setEditItem(null);
  };

  return (
    <div style={s.card}>
      <div style={{ ...s.rowBetween, marginBottom: 10 }}><span style={{ fontWeight: 700 }}>{title}</span><button onClick={() => { setEditItem(null); setForm({}); setShowForm(true); }} style={s.btnSm(clr.accent + "22", clr.accent)}><Icon name="add" size={14} color={clr.accent} /></button></div>
      {items.length === 0 && <div style={{ color: clr.muted, fontSize: 13, textAlign: "center", padding: 8 }}>कोई डेटा नहीं</div>}
      {items.map(item => (
        <div key={item.id} style={{ ...s.card2, ...s.rowBetween }}>
          <div><div style={{ fontWeight: 600, fontSize: 14 }}>{item[fields[0].key]}</div>{fields.slice(1).map(f => item[f.key] && <div key={f.key} style={{ fontSize: 12, color: clr.muted }}>{f.label}: {item[f.key]}</div>)}</div>
          <div style={s.row}><button onClick={() => { setEditItem(item); setForm({ ...item }); setShowForm(true); }} style={{ ...s.btnSm(), padding: 6 }}><Icon name="edit" size={14} color={clr.blue} /></button><button onClick={() => onDelete(item.id)} style={{ ...s.btnSm(), padding: 6 }}><Icon name="trash" size={14} color={clr.red} /></button></div>
        </div>
      ))}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Edit" : "Add"}>
        {fields.map(f => <Field key={f.key} label={f.label}><input style={s.input} value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder || f.label} /></Field>)}
        <button onClick={save} style={{ ...s.btn(), width: "100%" }}>Save</button>
      </Modal>
    </div>
  );
};

const MasterScreen = ({ varieties, gradings, coldStorages, mandis, parties, ops }) => (
  <div style={s.content}>
    <MasterSection title="🌾 किस्म" items={varieties} fields={[{ key: "name", label: "Variety Name" }]} onAdd={item => ops.varieties.addItem(item)} onEdit={item => ops.varieties.editItem(item)} onDelete={id => ops.varieties.deleteItem(id)} />
    <MasterSection title="📊 ग्रेडिंग" items={gradings} fields={[{ key: "name", label: "Grade Name" }]} onAdd={item => ops.gradings.addItem(item)} onEdit={item => ops.gradings.editItem(item)} onDelete={id => ops.gradings.deleteItem(id)} />
    <MasterSection title="🏭 कोल्ड स्टोरेज" items={coldStorages} fields={[{ key: "name", label: "Storage Name" }, { key: "location", label: "Location" }]} onAdd={item => ops.cold_storages.addItem(item)} onEdit={item => ops.cold_storages.editItem(item)} onDelete={id => ops.cold_storages.deleteItem(id)} />
    <MasterSection title="🏪 मंडी" items={mandis} fields={[{ key: "name", label: "Mandi Name" }, { key: "location", label: "Location" }]} onAdd={item => ops.mandis.addItem(item)} onEdit={item => ops.mandis.editItem(item)} onDelete={id => ops.mandis.deleteItem(id)} />
    <MasterSection title="👤 पार्टी/व्यापारी" items={parties} fields={[{ key: "name", label: "Party Name" }, { key: "phone", label: "Phone" }]} onAdd={item => ops.parties.addItem(item)} onEdit={item => ops.parties.editItem(item)} onDelete={id => ops.parties.deleteItem(id)} />
  </div>
);

// --- DASHBOARD (FIXED) ---
const DashboardScreen = ({ purchases, dispatches, sales, mandis }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  const activeLots = purchases.filter(p => !getLotStatus(p, dispatches, sales).isClosed).length;
  const closedLots = purchases.filter(p => getLotStatus(p, dispatches, sales).isClosed).length;
  const soldLots = purchases.filter(p => getLotStatus(p, dispatches, sales).isSold).length;
  
  const totalBalance = purchases.reduce((sum, p) => {
    const status = getLotStatus(p, dispatches, sales);
    return sum + (status.remaining * 52.5);
  }, 0);
  
  // FIXED: Only show P&L for sold lots
  const totalProfitLoss = purchases.reduce((sum, p) => {
    const status = getLotStatus(p, dispatches, sales);
    return sum + (status.isSold ? status.profitLoss : 0);
  }, 0);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const query = searchQuery.toLowerCase();
    
    // Search by lot_id, gatepass_id, or truck_no
    let foundLot = null;
    let foundDispatch = null;
    
    foundLot = purchases.find(p => p.lot_id.toLowerCase() === query);
    if (!foundLot) foundDispatch = dispatches.find(d => d.gatepass_id.toLowerCase() === query || d.truck_no?.toLowerCase() === query);
    if (!foundLot && foundDispatch) foundLot = purchases.find(p => foundDispatch.items?.some(i => i.lot_id === p.lot_id));
    
    if (foundLot) {
      const journey = getLotJourney(foundLot, dispatches, sales);
      setSearchResult(journey);
    } else {
      setSearchResult(null);
    }
  };

  return (
    <div style={s.content}>
      {/* SEARCH BAR */}
      <div style={{ marginBottom: 16 }}>
        <div style={s.label}>🔍 लॉट खोजें (Lot ID / Gatepass / Vehicle)</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...s.input, flex: 1 }} placeholder="LOT001 या GP-123 या MH-12-AB-1234" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyPress={e => e.key === "Enter" && handleSearch()} />
          <button onClick={handleSearch} style={{ ...s.btn(), padding: "10px 16px" }}><Icon name="search" size={14} /></button>
        </div>
      </div>

      {/* SEARCH RESULT */}
      {searchResult && (
        <div style={{ ...s.card, background: clr.card2 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: clr.accent, marginBottom: 10 }}>📋 लॉट विवरण - {searchResult.lotId}</div>
          <div style={s.divider} />
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12, fontSize: 12 }}>
            <div><span style={s.label}>किसान</span><div style={{ fontWeight: 600 }}>{searchResult.farmerName}</div></div>
            <div><span style={s.label}>खरीद तारीख</span><div style={{ fontWeight: 600 }}>{fmtDate(searchResult.buyDate)}</div></div>
            <div><span style={s.label}>मैनुअल कट्टे</span><div style={{ fontWeight: 600, color: clr.blue }}>{searchResult.manualBags || "-"}</div></div>
            <div><span style={s.label}>STD कट्टे</span><div style={{ fontWeight: 600, color: clr.accent }}>{fmt(searchResult.stdBags, 1)}</div></div>
            <div><span style={s.label}>कुल वजन</span><div style={{ fontWeight: 600 }}>{fmt(searchResult.totalWeight)} kg</div></div>
            <div><span style={s.label}>खरीद दर</span><div style={{ fontWeight: 600 }}>₹{fmt(searchResult.purchaseRate)}</div></div>
          </div>

          <div style={{ background: clr.card, padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 12 }}>
            <div style={s.label}>खरीद विवरण</div>
            <div style={{ fontWeight: 600 }}>कुल खरीद: ₹{fmt(searchResult.purchaseAmount)}</div>
          </div>

          {searchResult.status === "SOLD" ? (
            <>
              <div style={s.divider} />
              <div style={{ fontSize: 12 }}>
                <span style={s.label}>निकासी विवरण</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <div><strong>गेटपास:</strong> {searchResult.gatepassId}</div>
                  <div><strong>वाहन:</strong> {searchResult.vehicleNo}</div>
                  <div><strong>तारीख:</strong> {fmtDate(searchResult.dispatchDate)}</div>
                  <div><strong>भेजे गए:</strong> {searchResult.dispatchedBags} कट्टे</div>
                </div>
              </div>

              <div style={s.divider} />
              <div style={{ fontSize: 12 }}>
                <span style={s.label}>बिक्री विवरण</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <div><strong>बीजक:</strong> {searchResult.bijakId}</div>
                  <div><strong>बेचे गए:</strong> {searchResult.soldBags} कट्टे</div>
                  <div><strong>बिक्री दर:</strong> ₹{fmt(searchResult.saleRate)}</div>
                  <div><strong>तारीख:</strong> {fmtDate(searchResult.saleDate)}</div>
                </div>
              </div>

              <div style={{ background: clr.card, padding: 10, borderRadius: 8, marginTop: 8, fontSize: 12 }}>
                <div style={s.label}>आर्थिक विवरण</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>कुल बिक्री मूल्य:</span>
                  <strong style={{ color: clr.green }}>₹{fmt(searchResult.totalSoldValue)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>कुल खरीद लागत:</span>
                  <strong>₹{fmt(searchResult.purchaseAmount)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>मजदूरी/खर्च:</span>
                  <strong>₹{fmt(searchResult.laborExpense)}</strong>
                </div>
                <div style={{ ...s.divider, margin: "8px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700 }}>
                  <span>शुद्ध लाभ/हानि:</span>
                  <strong style={{ color: searchResult.profitLoss >= 0 ? clr.green : clr.red }}>
                    {searchResult.profitLoss >= 0 ? "+" : ""}₹{fmt(searchResult.profitLoss)}
                  </strong>
                </div>
              </div>
            </>
          ) : (
            <div style={{ ...s.card2, background: clr.card, padding: 10, borderRadius: 8, marginTop: 8, fontSize: 12, color: clr.muted }}>
              ⏳ यह लॉट अभी बिक्री के लिए पेंडिंग है। बिक्री के बाद P&L दिखेगा।
            </div>
          )}

          <button onClick={() => setSearchResult(null)} style={{ ...s.btn(clr.card2, clr.text), width: "100%", marginTop: 12 }}>बंद करें</button>
        </div>
      )}

      {/* KPI CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        <div style={{ ...s.card2, background: clr.blue + "15" }}>
          <div style={s.label}>सक्रिय लॉट्स</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: clr.blue }}>{activeLots}</div>
        </div>
        <div style={{ ...s.card2, background: clr.red + "15" }}>
          <div style={s.label}>बंद लॉट्स</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: clr.red }}>{closedLots}</div>
        </div>
        <div style={{ ...s.card2, background: clr.purple + "15" }}>
          <div style={s.label}>बेचे गए लॉट</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: clr.purple }}>{soldLots}</div>
        </div>
        <div style={{ ...s.card2, background: clr.green + "15" }}>
          <div style={s.label}>कुल बैलेंस (kg)</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: clr.green }}>{fmt(totalBalance)}</div>
        </div>
      </div>

      {/* P&L CARD - Only for sold lots */}
      {soldLots > 0 && (
        <div style={{ ...s.card2, background: (totalProfitLoss >= 0 ? clr.green : clr.red) + "15" }}>
          <div style={s.label}>शुद्ध P&L (केवल बेचे हुए लॉट)</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: totalProfitLoss >= 0 ? clr.green : clr.red }}>
            {totalProfitLoss >= 0 ? "+" : ""}₹{fmt(totalProfitLoss)}
          </div>
        </div>
      )}
    </div>
  );
};

// --- PURCHASE SCREEN (IMPROVED) ---
const PurchaseScreen = ({ purchases, varieties, coldStorages, dispatches, sales, ops }) => {
  const [form, setForm] = useState({ lot_id: "", kisan_name: "", cold_storage_id: "", date: today(), variety_id: "", manual_bags: "", total_weight: "", rate: "", notes: "", pricing_type: "STD" });
  const [showForm, setShowForm] = useState(false);

  const stdBags = form.total_weight ? (parseFloat(form.total_weight) / 52.5).toFixed(2) : 0;
  const effectiveBags = form.pricing_type === "STD" ? parseFloat(stdBags) : parseFloat(form.manual_bags);
  const totalAmt = effectiveBags * (parseFloat(form.rate) || 0);

  const save = async () => {
    if (!form.lot_id || !form.kisan_name || !form.total_weight || !form.rate) return;
    await ops.purchases.addItem({ ...form, std_bags: parseFloat(stdBags), total_amount: totalAmt, id: uid() });
    setShowForm(false); 
    setForm({ lot_id: "", kisan_name: "", cold_storage_id: "", date: today(), variety_id: "", manual_bags: "", total_weight: "", rate: "", notes: "", pricing_type: "STD" });
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700 }}>🛒 खरीद विवरण</span>
        <button onClick={() => setShowForm(true)} style={{ ...s.btn() }}><Icon name="add" size={14} /> नया लॉट</button>
      </div>

      {purchases.reverse().map(p => {
        const status = getLotStatus(p, dispatches, sales);
        return (
          <div key={p.id} style={{ ...s.card, opacity: status.isClosed ? 0.6 : 1 }}>
            <div style={s.rowBetween}>
              <Badge v={`LOT: ${p.lot_id}`} color={clr.accent} />
              <span style={{ fontSize: 12, color: clr.muted }}>{fmtDate(p.date)}</span>
            </div>
            <div style={{ fontWeight: 700, marginTop: 6, fontSize: 15 }}>{p.kisan_name}</div>
            <div style={{ fontSize: 12, color: clr.muted, marginBottom: 10 }}>
              {coldStorages.find(c => c.id === p.cold_storage_id)?.name}
            </div>
            
            <div style={s.divider} />
            
            {/* WEIGHT INFO */}
            <div style={{ marginBottom: 10 }}>
              <span style={s.label}>वजन विवरण</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
                <div><strong>कुल वजन:</strong> {fmt(p.total_weight)} kg</div>
                <div><strong>STD कट्टे:</strong> {fmt(p.std_bags, 2)}</div>
                {p.pricing_type === "MANUAL" && <div style={{ gridColumn: "1 / -1" }}><strong>मैनुअल कट्टे:</strong> {p.manual_bags}</div>}
              </div>
            </div>

            {/* COST INFO */}
            <div style={{ background: clr.card2, padding: 10, borderRadius: 8, marginBottom: 10, fontSize: 12 }}>
              <div style={s.label}>लागत विवरण</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span>दर (₹/{p.pricing_type === "STD" ? "STD" : "Manual"}):</span>
                <strong>₹{fmt(p.rate)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: clr.purple }}>
                <span>कुल खरीद मूल्य:</span>
                <strong>₹{fmt(p.total_amount)}</strong>
              </div>
            </div>

            {/* STATUS */}
            <div style={{ fontSize: 12, color: clr.muted }}>
              <span style={{ color: clr.blue }}>📤 भेजे गए: {status.totalDispatched} कट्टे</span>
              <span style={{ marginLeft: 12, color: clr.green }}>✓ बचा हुआ: {fmt(status.remaining, 1)} कट्टे</span>
            </div>
          </div>
        );
      })}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="नया खरीद लॉट">
        <Field label="लॉट नंबर"><input style={s.input} value={form.lot_id} onChange={e => setForm({ ...form, lot_id: e.target.value })} placeholder="LOT001" /></Field>
        <Field label="किसान का नाम"><input style={s.input} value={form.kisan_name} onChange={e => setForm({ ...form, kisan_name: e.target.value })} placeholder="राज कुमार" /></Field>
        <Field label="कुल वजन (kg)"><input type="number" style={s.input} value={form.total_weight} onChange={e => setForm({ ...form, total_weight: e.target.value })} placeholder="1050" /></Field>
        
        <div style={{ background: clr.card2, padding: 10, borderRadius: 8, marginBottom: 12 }}>
          <div style={s.label}>गणना विधि</div>
          <div style={{ marginTop: 6 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer" }}>
              <input type="radio" checked={form.pricing_type === "STD"} onChange={() => setForm({ ...form, pricing_type: "STD" })} />
              <span>STD कट्टे (52.5 kg = 1 STD)</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="radio" checked={form.pricing_type === "MANUAL"} onChange={() => setForm({ ...form, pricing_type: "MANUAL" })} />
              <span>मैनुअल कट्टे</span>
            </label>
          </div>
        </div>

        {form.pricing_type === "MANUAL" && (
          <Field label="कट्टों की संख्या"><input type="number" style={s.input} value={form.manual_bags} onChange={e => setForm({ ...form, manual_bags: e.target.value })} /></Field>
        )}

        <Field label="रेट (₹/{form.pricing_type === "STD" ? "STD" : "Manual"})"><input type="number" step="0.01" style={s.input} value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} placeholder="500" /></Field>

        {/* COST PREVIEW */}
        <div style={{ background: clr.card2, padding: 10, borderRadius: 8, marginBottom: 12 }}>
          <div style={s.label}>कुल लागत (पूर्वावलोकन)</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: clr.accent }}>₹{fmt(totalAmt)}</div>
          <div style={{ fontSize: 11, color: clr.muted, marginTop: 4 }}>
            {form.pricing_type === "STD" ? `${fmt(stdBags, 2)} STD कट्टे × ₹${fmt(form.rate)}` : `${form.manual_bags} कट्टे × ₹${fmt(form.rate)}`}
          </div>
        </div>

        <Field label="कोल्ड स्टोरेज">
          <select style={s.select} value={form.cold_storage_id} onChange={e => setForm({ ...form, cold_storage_id: e.target.value })}>
            <option value="">चुनें...</option>
            {coldStorages.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>

        <Field label="किस्म">
          <select style={s.select} value={form.variety_id} onChange={e => setForm({ ...form, variety_id: e.target.value })}>
            <option value="">चुनें...</option>
            {varieties.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </Field>

        <button onClick={save} style={{ ...s.btn(), width: "100%" }}>लॉट सुरक्षित करें</button>
      </Modal>
    </div>
  );
};

// --- DISPATCH SCREEN (IMPROVED) ---
const DispatchScreen = ({ dispatches, purchases, mandis, sales, ops }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ gatepass_id: "", date: today(), mandi_id: "", driver_name: "", truck_no: "", items: [] });
  const [itemForm, setItemForm] = useState({ lot_id: "" });

  const activeLots = purchases.filter(p => !getLotStatus(p, dispatches, sales).isClosed);

  const addItemRow = () => {
    if (!itemForm.lot_id) return;
    const lot = purchases.find(p => p.lot_id === itemForm.lot_id);
    if (!lot) return;
    
    const status = getLotStatus(lot, dispatches, sales);
    const effectiveBags = lot.pricing_type === "STD" ? parseFloat(lot.std_bags) : parseFloat(lot.manual_bags);
    
    // Auto-fill with remaining bags
    const remaining = effectiveBags - status.totalDispatched;
    
    setForm(p => ({ ...p, items: [...p.items, { lot_id: itemForm.lot_id, bags: remaining, weight: lot.total_weight }] }));
    setItemForm({ lot_id: "" });
  };

  const removeItem = (idx) => {
    setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
  };

  const save = async () => {
    if (!form.gatepass_id || form.items.length === 0) return;
    await ops.dispatches.addItem({ ...form, id: uid() });
    setShowForm(false);
    setForm({ gatepass_id: "", date: today(), mandi_id: "", driver_name: "", truck_no: "", items: [] });
  };

  const getLotDetails = (lotId) => {
    const lot = purchases.find(p => p.lot_id === lotId);
    if (!lot) return null;
    const status = getLotStatus(lot, dispatches, sales);
    return { lot, status };
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700 }}>📤 गेटपास / निकासी</span>
        <button onClick={() => setShowForm(true)} style={s.btn()}><Icon name="add" size={14} /> गेटपास</button>
      </div>

      {dispatches.reverse().map(d => (
        <div key={d.id} style={s.card}>
          <div style={s.rowBetween}><strong style={{ color: clr.blue }}>GP: {d.gatepass_id}</strong><span style={{ fontSize: 12, color: clr.muted }}>{fmtDate(d.date)}</span></div>
          <div style={{ fontSize: 13, color: clr.muted, marginTop: 4, marginBottom: 10 }}>
            मंडी: <strong>{mandis.find(m => m.id === d.mandi_id)?.name || "Direct"}</strong> | गाड़ी: <strong>{d.truck_no || "-"}</strong>
          </div>
          <div style={s.divider} />
          
          {d.items?.map((i, idx) => {
            const details = getLotDetails(i.lot_id);
            return (
              <div key={idx} style={{ ...s.card2, marginBottom: 8 }}>
                <div style={{ fontWeight: 600, color: clr.accent, marginBottom: 6 }}>📦 लॉट: {i.lot_id}</div>
                <div style={{ fontSize: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <div><span style={s.label}>भेजे गए</span><strong>{i.bags} कट्टे</strong></div>
                  <div><span style={s.label}>वजन</span><strong>{fmt(i.weight || 0)} kg</strong></div>
                  {details && <div><span style={s.label}>STD कट्टे</span><strong>{fmt(details.lot.std_bags, 2)}</strong></div>}
                  {details && <div><span style={s.label}>किसान</span><strong>{details.lot.kisan_name}</strong></div>}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="नया गेटपास जारी करें">
        <Field label="गेटपास नंबर"><input style={s.input} value={form.gatepass_id} onChange={e => setForm({ ...form, gatepass_id: e.target.value })} placeholder="GP-2024-001" /></Field>
        <Field label="वाहन नंबर"><input style={s.input} value={form.truck_no} onChange={e => setForm({ ...form, truck_no: e.target.value })} placeholder="MH-12-AB-1234" /></Field>
        <Field label="ड्राइवर का नाम"><input style={s.input} value={form.driver_name} onChange={e => setForm({ ...form, driver_name: e.target.value })} placeholder="राज सिंह" /></Field>
        <Field label="मंडी">
          <select style={s.select} value={form.mandi_id} onChange={e => setForm({ ...form, mandi_id: e.target.value })}>
            <option value="">चुनें...</option>
            {mandis.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </Field>

        {/* LOT SELECTION */}
        <div style={{ ...s.card2, background: clr.card, marginBottom: 12, padding: 12, borderRadius: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, color: clr.accent }}>📦 लॉट जोड़ें</div>
          <select style={{ ...s.select, marginBottom: 8 }} value={itemForm.lot_id} onChange={e => setItemForm({ ...itemForm, lot_id: e.target.value })}>
            <option value="">लॉट चुनें...</option>
            {activeLots.map(p => {
              const status = getLotStatus(p, dispatches, sales);
              const effectiveBags = p.pricing_type === "STD" ? parseFloat(p.std_bags) : parseFloat(p.manual_bags);
              const remaining = effectiveBags - status.totalDispatched;
              return (
                <option key={p.id} value={p.lot_id}>
                  {p.lot_id} ({p.kisan_name}) - {fmt(remaining, 1)} कट्टे बचे हुए
                </option>
              );
            })}
          </select>

          {itemForm.lot_id && (() => {
            const details = getLotDetails(itemForm.lot_id);
            if (!details) return null;
            const remaining = (details.lot.pricing_type === "STD" ? parseFloat(details.lot.std_bags) : parseFloat(details.lot.manual_bags)) - details.status.totalDispatched;
            
            return (
              <div style={{ background: clr.card2, padding: 8, borderRadius: 6, marginBottom: 8, fontSize: 11 }}>
                <div style={s.label}>लॉट विवरण</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <div><strong>कुल वजन:</strong> {fmt(details.lot.total_weight)} kg</div>
                  <div><strong>कुल कट्टे:</strong> {fmt(details.lot.std_bags, 2)}</div>
                  <div><strong>भेजा हुआ:</strong> {details.status.totalDispatched} कट्टे</div>
                  <div><strong>बचा हुआ:</strong> {fmt(remaining, 1)} कट्टे</div>
                  <div style={{ gridColumn: "1 / -1" }}><strong>किसान:</strong> {details.lot.kisan_name}</div>
                </div>
              </div>
            );
          })()}

          <button onClick={addItemRow} style={{ ...s.btnSm(), width: "100%", background: clr.accent + "22", color: clr.accent }}>लॉट जोड़ें</button>
        </div>

        {/* SELECTED ITEMS */}
        {form.items.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={s.label}>जोड़े गए लॉट्स</div>
            {form.items.map((i, idx) => (
              <div key={idx} style={{ ...s.card2, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, padding: 10 }}>
                <div style={{ fontSize: 12 }}>
                  <strong>{i.lot_id}</strong> - {i.bags} कट्टे ({fmt(i.weight || 0)} kg)
                </div>
                <button onClick={() => removeItem(idx)} style={{ ...s.btnSm(), padding: 6 }}>
                  <Icon name="trash" size={12} color={clr.red} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button onClick={save} style={{ ...s.btn(), width: "100%", marginTop: 12 }}>गेटपास फाइनल करें</button>
      </Modal>
    </div>
  );
};

// --- SALES SCREEN ---
const SalesScreen = ({ sales, purchases, dispatches, parties, ops }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ bijak_id: "", date: today(), party_id: "", labor_per_bag: 0, lot_sales: [] });
  const [saleItem, setSaleItem] = useState({ lot_id: "", bags: "", rate: "" });

  const addSaleRow = () => {
    if (!saleItem.lot_id || !saleItem.bags || !saleItem.rate) return;
    setForm(p => ({ ...p, lot_sales: [...p.lot_sales, saleItem] }));
    setSaleItem({ lot_id: "", bags: "", rate: "" });
  };

  const removeSaleItem = (idx) => {
    setForm(p => ({ ...p, lot_sales: p.lot_sales.filter((_, i) => i !== idx) }));
  };

  const save = async () => {
    if (!form.bijak_id || form.lot_sales.length === 0) return;
    const totalAmt = form.lot_sales.reduce((sum, l) => sum + (parseFloat(l.bags) * parseFloat(l.rate)), 0);
    await ops.sales.addItem({ ...form, total_amount: totalAmt, id: uid() });
    setShowForm(false);
    setForm({ bijak_id: "", date: today(), party_id: "", labor_per_bag: 0, lot_sales: [] });
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700 }}>💰 बिक्री / बीजाक</span>
        <button onClick={() => setShowForm(true)} style={s.btn(clr.green, "#fff")}><Icon name="add" size={14} color="#fff" /> बिक्री</button>
      </div>

      {sales.reverse().map(sx => (
        <div key={sx.id} style={s.card}>
          <div style={s.rowBetween}><strong style={{ color: clr.green }}>BIJAK: {sx.bijak_id}</strong><span style={{ fontSize: 12, color: clr.muted }}>{fmtDate(sx.date)}</span></div>
          <div style={{ fontSize: 13, color: clr.muted, marginBottom: 10 }}>व्यापारी: <strong>{parties.find(p => p.id === sx.party_id)?.name}</strong></div>
          <div style={s.divider} />
          
          {sx.lot_sales?.map((l, idx) => (
            <div key={idx} style={{ ...s.card2, marginBottom: 8 }}>
              <div style={s.rowBetween}><strong>{l.lot_id}</strong><span style={{ fontSize: 12 }}>{l.bags} कट्टे @ ₹{fmt(l.rate)}</span></div>
              <div style={{ fontSize: 12, color: clr.green, marginTop: 4 }}>विक्रय मूल्य: ₹{fmt(l.bags * l.rate)}</div>
            </div>
          ))}
          
          <div style={s.divider} />
          <div style={s.rowBetween}><span style={{ fontWeight: 600 }}>कुल बीजाक:</span><strong style={{ fontSize: 16, color: clr.green }}>₹{fmt(sx.total_amount)}</strong></div>
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="नई बिक्री (बीजाक)">
        <Field label="बीजाक नंबर"><input style={s.input} value={form.bijak_id} onChange={e => setForm({ ...form, bijak_id: e.target.value })} placeholder="BIJAK-001" /></Field>
        <Field label="व्यापारी / पार्टी">
          <select style={s.select} value={form.party_id} onChange={e => setForm({ ...form, party_id: e.target.value })}>
            <option value="">चुनें...</option>
            {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="मजदूरी/कट्टा (खर्च)"><input type="number" step="0.01" style={s.input} value={form.labor_per_bag} onChange={e => setForm({ ...form, labor_per_bag: e.target.value })} /></Field>

        {/* LOT WISE CLOSURE */}
        <div style={{ ...s.card2, background: clr.card, marginBottom: 12, padding: 12, borderRadius: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8 }}>📋 लॉट वाइज क्लोजर</div>
          <select style={{ ...s.select, marginBottom: 8 }} value={saleItem.lot_id} onChange={e => setSaleItem({ ...saleItem, lot_id: e.target.value })}>
            <option value="">लॉट चुनें...</option>
            {purchases.map(p => <option key={p.id} value={p.lot_id}>{p.lot_id} ({p.kisan_name})</option>)}
          </select>
          <input type="number" style={{ ...s.input, marginBottom: 8 }} placeholder="बेचे गए कट्टे" value={saleItem.bags} onChange={e => setSaleItem({ ...saleItem, bags: e.target.value })} />
          <input type="number" step="0.01" style={{ ...s.input, marginBottom: 8 }} placeholder="बिक्री दर (₹/Bag)" value={saleItem.rate} onChange={e => setSaleItem({ ...saleItem, rate: e.target.value })} />
          <button onClick={addSaleRow} style={{ ...s.btnSm(), width: "100%", background: clr.green + "22", color: clr.green }}>लॉट जोड़ें</button>
        </div>

        {/* ADDED ITEMS */}
        {form.lot_sales.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={s.label}>जोड़े गए लॉट्स</div>
            {form.lot_sales.map((l, idx) => (
              <div key={idx} style={{ ...s.card2, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, padding: 10 }}>
                <div style={{ fontSize: 12 }}>
                  <strong>{l.lot_id}</strong> - {l.bags} कट्टे @ ₹{fmt(l.rate)} = ₹{fmt(l.bags * l.rate)}
                </div>
                <button onClick={() => removeSaleItem(idx)} style={{ ...s.btnSm(), padding: 6 }}>
                  <Icon name="trash" size={12} color={clr.red} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button onClick={save} style={{ ...s.btn(clr.green, "#fff"), width: "100%", marginTop: 12 }}>बीजाक फाइनल करें</button>
      </Modal>
    </div>
  );
};

// --- APP CONTAINER ---
export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [varieties, opsVarieties] = useSupabaseTable("varieties");
  const [gradings, opsGradings] = useSupabaseTable("gradings");
  const [coldStorages, opsColdStorages] = useSupabaseTable("cold_storages");
  const [mandis, opsMandis] = useSupabaseTable("mandis");
  const [parties, opsParties] = useSupabaseTable("parties");
  const [purchases, opsPurchases] = useSupabaseTable("purchases");
  const [dispatches, opsDispatches] = useSupabaseTable("dispatches");
  const [sales, opsSales] = useSupabaseTable("sales");

  const ops = { varieties: opsVarieties, gradings: opsGradings, cold_storages: opsColdStorages, mandis: opsMandis, parties: opsParties, purchases: opsPurchases, dispatches: opsDispatches, sales: opsSales };

  return (
    <div style={s.screen}>
      <div style={s.header}>
        <span style={{ fontWeight: 800, fontSize: 18, color: clr.accent }}>🥔 Aloo-Trader v2</span>
        <Badge v={activeTab.toUpperCase()} color={clr.blue} />
      </div>

      {activeTab === "dashboard" && <DashboardScreen purchases={purchases} dispatches={dispatches} sales={sales} mandis={mandis} />}
      {activeTab === "purchase" && <PurchaseScreen purchases={purchases} varieties={varieties} coldStorages={coldStorages} dispatches={dispatches} sales={sales} ops={ops} />}
      {activeTab === "dispatch" && <DispatchScreen dispatches={dispatches} purchases={purchases} mandis={mandis} sales={sales} ops={ops} />}
      {activeTab === "sale" && <SalesScreen sales={sales} purchases={purchases} dispatches={dispatches} parties={parties} ops={ops} />}
      {activeTab === "master" && <MasterScreen varieties={varieties} gradings={gradings} coldStorages={coldStorages} mandis={mandis} parties={parties} ops={ops} />}

      <div style={s.navBar}>
        <button onClick={() => setActiveTab("dashboard")} style={s.navItem(activeTab === "dashboard")}><Icon name="sale" color={activeTab === "dashboard" ? clr.accent : clr.muted} />डैशबोर्ड</button>
        <button onClick={() => setActiveTab("purchase")} style={s.navItem(activeTab === "purchase")}><Icon name="purchase" color={activeTab === "purchase" ? clr.accent : clr.muted} />खरीद</button>
        <button onClick={() => setActiveTab("dispatch")} style={s.navItem(activeTab === "dispatch")}><Icon name="dispatch" color={activeTab === "dispatch" ? clr.accent : clr.muted} />निकासी</button>
        <button onClick={() => setActiveTab("sale")} style={s.navItem(activeTab === "sale")}><Icon name="sale" color={activeTab === "sale" ? clr.accent : clr.muted} />बिक्री</button>
        <button onClick={() => setActiveTab("master")} style={s.navItem(activeTab === "master")}><Icon name="master" color={activeTab === "master" ? clr.accent : clr.muted} />मास्टर</button>
      </div>
    </div>
  );
}
