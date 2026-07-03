import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cxjmwjljjnuthcrmnbqb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4am13amxqam51dGhjcm1uYnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTYzMzUsImV4cCI6MjA5MjY3MjMzNX0.ynRaceAT1uWcsPOJ_5vY_8NKolM3EaWKQajUEk4sLz8";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const useSupabaseTable = (tableName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: rows, error: err } = await supabase.from(tableName).select("*").order("created_at", { ascending: false });
        if (err) { console.error(`❌ FETCH (${tableName}):`, err); return; }
        if (rows) setData(rows);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [tableName]);

  const addItem = async (item) => {
    try {
      const { data: d, error: err } = await supabase.from(tableName).insert([{ ...item, created_at: new Date().toISOString() }]).select();
      if (err) { alert(`❌ Error: ${err.message}`); return null; }
      if (d && d.length > 0) {
        setData([d[0], ...data]);
        alert("✅ Saved!");
        return d[0];
      }
    } catch (e) { alert(`Error: ${e.message}`); }
  };

  const editItem = async (id, updates) => {
    try {
      const { error: err } = await supabase.from(tableName).update(updates).eq("id", id);
      if (err) { alert(`Error: ${err.message}`); return false; }
      setData(data.map(x => x.id === id ? { ...x, ...updates } : x));
      alert("✅ Updated!");
      return true;
    } catch (e) { alert(`Error: ${e.message}`); }
  };

  const deleteItem = async (id) => {
    try {
      const { error: err } = await supabase.from(tableName).delete().eq("id", id);
      if (err) { alert(`Error: ${err.message}`); return false; }
      setData(data.filter(x => x.id !== id));
      return true;
    } catch (e) { alert(`Error: ${e.message}`); }
  };

  return { data, loading, error, addItem, editItem, deleteItem };
};

const uid = () => Math.random().toString(36).slice(2, 9).toUpperCase();
const fmt = (n, d = 0) => (isNaN(n) ? "0" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d }));
const today = () => new Date().toISOString().slice(0, 10);

const clr = { 
  bg: "#0f1117", card: "#1a1d26", card2: "#22263a", accent: "#f5a623", green: "#22c55e", 
  red: "#ef4444", blue: "#3b82f6", purple: "#a855f7", muted: "#a0aec0", border: "#2d3148", text: "#f1f5f9", orange: "#f97316"
};

const Badge = ({ v, color = clr.accent }) => (
  <span style={{ background: color + "22", color, borderRadius: 4, padding: "4px 10px", fontSize: 13, fontWeight: 700, display: "inline-block" }}>
    {v}
  </span>
);

const getRemainingBags = (purchase, dispatches = []) => {
  const dispatchedBags = dispatches.flatMap(d => d.items || []).filter(i => i.lot_id === purchase.lot_id).reduce((sum, i) => sum + (parseFloat(i.loaded_bags) || 0), 0);
  return (parseFloat(purchase.manual_bags) || 0) - dispatchedBags;
};

// Global Font Adjustments (Big fonts for mobile readability)
const s = {
  screen: { minHeight: "100vh", background: clr.bg, color: clr.text, fontFamily: "system-ui, sans-serif", maxWidth: 480, margin: "0 auto", position: "relative", fontSize: "15px" },
  header: { background: clr.card, padding: "14px 16px", borderBottom: `1px solid ${clr.border}`, position: "sticky", top: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center" },
  card: { background: clr.card, borderRadius: 12, padding: 14, marginBottom: 10, border: `1px solid ${clr.border}` },
  card2: { background: clr.card2, borderRadius: 10, padding: 12, marginBottom: 8, border: `1px solid ${clr.border}` },
  rowBetween: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  row: { display: "flex", alignItems: "center", gap: 8 },
  input: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 8, padding: "10px 12px", color: clr.text, fontSize: "15px", boxSizing: "border-box", outline: "none" },
  select: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 8, padding: "10px 12px", color: clr.text, fontSize: "15px", boxSizing: "border-box", outline: "none" },
  label: { fontSize: "12px", color: clr.muted, marginBottom: 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 },
  btn: (bg = clr.accent, txt = "#000") => ({ background: bg, color: txt, border: "none", borderRadius: 8, padding: "12px 16px", fontWeight: 700, fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, justifyContent: "center", width: "100%" }),
  btnSm: (bg = clr.card2, txt = clr.text) => ({ background: bg, color: txt, border: `1px solid ${clr.border}`, borderRadius: 6, padding: "6px 10px", fontWeight: 600, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }),
  content: { padding: 14, paddingBottom: 90 },
  navBar: { position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", background: clr.card, borderTop: `1px solid ${clr.border}`, display: "flex", zIndex: 200 },
  navItem: (active) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 4px", gap: 4, background: "none", border: "none", color: active ? clr.accent : clr.muted, fontSize: "16px", cursor: "pointer" }),
  divider: { height: 1, background: clr.border, margin: "10px 0" }
};

const Icon = ({ name, size = 18, color = clr.text }) => {
  const icons = {
    dashboard: "M3 3h2v2H3V3zm4 0h2v2H7V3zm4 0h2v2h-2V3zm4 0h2v2h-2V3zM3 7h2v2H3V7zm4 0h2v2H7V7zm4 0h2v2h-2V7zm4 0h2v2h-2V7zM3 11h2v2H3v-2zm4 0h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z",
    purchase: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    dispatch: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
    sale: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    add: "M12 4v16m8-8H4", x: "M6 18L18 6M6 6l12 12", trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    download: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icons[name]} /></svg>;
};

const Field = ({ label, children }) => <div style={{ marginBottom: 12 }}><div style={s.label}>{label}</div>{children}</div>;
const Modal = ({ open, onClose, title, children }) => !open ? null : <div style={{ position: "fixed", inset: 0, background: "#000c", zIndex: 1000, display: "flex", alignItems: "flex-end" }}><div style={{ background: clr.card, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "92vh", display: "flex", flexDirection: "column", border: `1px solid ${clr.border}` }}><div style={{ ...s.rowBetween, padding: 14, borderBottom: `1px solid ${clr.border}` }}><span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span><button onClick={onClose} style={s.btnSm()}><Icon name="x" size={14} /></button></div><div style={{ overflowY: "auto", padding: "0 14px 20px" }}>{children}</div></div></div>;

// ===== DASHBOARD =====
const DashboardScreen = ({ purchases, dispatches, sales, payments, parties, mandis }) => {
  const [searchKey, setSearchKey] = useState("");
  const activeLots = purchases.filter(p => getRemainingBags(p, dispatches) > 0).length;
  const closedLots = purchases.filter(p => getRemainingBags(p, dispatches) <= 0).length;

  const totalSaleValue = sales.reduce((sum, s) => sum + (parseFloat(s.total_sale_value) || 0), 0);
  const totalExpenses = sales.reduce((sum, s) => sum + (parseFloat(s.total_expenses) || 0), 0);
  const totalPaymentsReceived = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const pendingDue = totalSaleValue - totalPaymentsReceived;

  const activeDispatchedPurchaseCost = sales.reduce((sum, sl) => {
    return sum + (sl.lot_sales?.reduce((lotSum, ls) => {
      const origPurchase = purchases.find(p => p.lot_id === ls.lot_id);
      const ratePerBag = parseFloat(origPurchase?.rate_per_bag) || 0;
      const loadedBags = parseFloat(ls.loaded_bags) || 0;
      return lotSum + (loadedBags * ratePerBag);
    }, 0) || 0);
  }, 0);

  const realizedProfit = totalSaleValue - activeDispatchedPurchaseCost - totalExpenses;

  return (
    <div style={s.content}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <div style={{ ...s.card2, background: clr.blue + "15" }}><div style={s.label}>Active Lots</div><div style={{ fontSize: 22, fontWeight: 800, color: clr.blue }}>{activeLots}</div></div>
        <div style={{ ...s.card2, background: clr.red + "15" }}><div style={s.label}>Closed Lots</div><div style={{ fontSize: 22, fontWeight: 800, color: clr.red }}>{closedLots}</div></div>
      </div>

      <div style={{ ...s.card, background: clr.green + "15" }}>
        <div style={s.label}>✅ Sales & Payments</div>
        <div style={s.divider} />
        <div style={{ fontSize: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span>Total Sales:</span><strong style={{ color: clr.green }}>₹{fmt(totalSaleValue)}</strong></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span>Received:</span><strong>₹{fmt(totalPaymentsReceived)}</strong></div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${clr.border}`, paddingTop: 6 }}><span style={{ fontWeight: 600 }}>Pending Due:</span><strong style={{ color: clr.orange }}>₹{fmt(pendingDue)}</strong></div>
        </div>
      </div>

      <div style={{ ...s.card, background: (realizedProfit >= 0 ? clr.green : clr.red) + "15" }}>
        <div style={s.label}>Realized Net P&L</div>
        <div style={s.divider} />
        <div style={{ fontSize: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span>Stock Cost:</span><strong>₹{fmt(activeDispatchedPurchaseCost)}</strong></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span>Gross Revenue:</span><strong style={{ color: clr.green }}>₹{fmt(totalSaleValue)}</strong></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span>Expenses:</span><strong style={{ color: clr.orange }}>₹{fmt(totalExpenses)}</strong></div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${clr.border}`, paddingTop: 6 }}><span style={{ fontWeight: 600 }}>Net Profit:</span><strong style={{ color: realizedProfit >= 0 ? clr.green : clr.red, fontSize: 16 }}>₹{fmt(realizedProfit)}</strong></div>
        </div>
      </div>
    </div>
  );
};

// ===== PURCHASE SCREEN =====
const PurchaseScreen = ({ purchases, dispatches, opsP, varieties, gradings, coldStorages }) => {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ lot_id: "", farmer_name: "", manual_bags: "", total_weight: "", rate_per_bag: "", variety_id: "", grading_id: "", cold_storage_id: "", date: today() });
  
  const save = async () => {
    if (!form.lot_id || !form.farmer_name || !form.manual_bags || !form.rate_per_bag || !form.total_weight) {
      return alert("❌ Fill all required fields!");
    }
    
    // Standard 52.5 kg Bag Formula logic
    const stdBags = (parseFloat(form.total_weight) / 52.5).toFixed(2);
    // Cost always calculated using standard 52.5 kg bags formula
    const currentTotalCost = parseFloat(stdBags) * (parseFloat(form.rate_per_bag) || 0);
    
    const payload = { ...form, std_bags: stdBags, total_cost: currentTotalCost };

    if (editItem) {
      const success = await opsP.editItem(editItem.id, payload);
      if (success) { setShowForm(false); setEditItem(null); }
    } else {
      const result = await opsP.addItem({ id: uid(), ...payload });
      if (result) { setShowForm(false); }
    }
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 14 }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>Purchase Book</span>
        <button onClick={() => { setEditItem(null); setForm({ lot_id: "", farmer_name: "", manual_bags: "", total_weight: "", rate_per_bag: "", variety_id: "", grading_id: "", cold_storage_id: "", date: today() }); setShowForm(true); }} style={s.btn(clr.accent, "#000")}><Icon name="add" size={14} /> Add New</button>
      </div>

      {purchases.map(p => {
        const remaining = getRemainingBags(p, dispatches);
        const isClosed = remaining <= 0;
        return (
          <div key={p.id} style={{ ...s.card, borderLeft: `4px solid ${isClosed ? clr.red : clr.green}` }}>
            <div style={s.rowBetween}>
              <Badge v={p.lot_id} color={isClosed ? clr.red : clr.accent} />
              <span style={{ fontSize: 12, color: clr.muted }}>{p.date}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, marginTop: 6 }}>{p.farmer_name}</div>
            
            <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: clr.accent }}>Var: {varieties.find(v => v.id === p.variety_id)?.name || "N/A"}</span>
              <span style={{ fontSize: 12, color: clr.purple }}>Grade: {gradings.find(g => g.id === p.grading_id)?.name || "N/A"}</span>
            </div>

            <div style={s.divider} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 13 }}>
              <div>Manual Bags: <strong>{p.manual_bags}</strong></div>
              <div>Std Bags (52.5k): <strong style={{ color: clr.blue }}>{p.std_bags}</strong></div>
              <div>Rate/Bag: <strong>₹{p.rate_per_bag}</strong></div>
              <div>Total Val: <strong style={{ color: clr.green }}>₹{fmt(p.total_cost)}</strong></div>
            </div>
            <div style={{ ...s.row, marginTop: 10 }}>
              <button onClick={() => { setEditItem(p); setForm({ ...p }); setShowForm(true); }} style={{ ...s.btnSm(), flex: 1 }}><Icon name="edit" size={12} /> Edit</button>
              <button onClick={() => { if(window.confirm("Delete?")) opsP.deleteItem(p.id); }} style={{ ...s.btnSm(), flex: 1, color: clr.red }}><Icon name="trash" size={12} color={clr.red} /> Delete</button>
            </div>
          </div>
        );
      })}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Purchase Entry Form">
        <Field label="Lot ID"><input style={s.input} value={form.lot_id} onChange={e => setForm({ ...form, lot_id: e.target.value })} disabled={editItem} /></Field>
        <Field label="Farmer Name"><input style={s.input} value={form.farmer_name} onChange={e => setForm({ ...form, farmer_name: e.target.value })} /></Field>
        <Field label="Variety"><select style={s.select} value={form.variety_id} onChange={e => setForm({ ...form, variety_id: e.target.value })}><option value="">Select Variety</option>{varieties.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></Field>
        <Field label="Grading"><select style={s.select} value={form.grading_id} onChange={e => setForm({ ...form, grading_id: e.target.value })}><option value="">Select Grading</option>{gradings.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></Field>
        <Field label="Manual Weight Total (kg)"><input type="number" style={s.input} value={form.total_weight} onChange={e => setForm({ ...form, total_weight: e.target.value })} /></Field>
        <Field label="Manual Bags Count"><input type="number" style={s.input} value={form.manual_bags} onChange={e => setForm({ ...form, manual_bags: e.target.value })} /></Field>
        <Field label="Rate per Bag (₹)"><input type="number" style={s.input} value={form.rate_per_bag} onChange={e => setForm({ ...form, rate_per_bag: e.target.value })} /></Field>
        <Field label="Cold Storage Location"><select style={s.select} value={form.cold_storage_id} onChange={e => setForm({ ...form, cold_storage_id: e.target.value })}><option value="">Select Storage</option>{coldStorages.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Date"><input type="date" style={s.input} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>
        <button onClick={save} style={s.btn()}>Save Purchase Entry</button>
      </Modal>
    </div>
  );
};

// ===== DISPATCH LOGISTICS =====
const DispatchScreen = ({ dispatches, purchases, opsD, parties, mandis, coldStorages }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ gatepass_id: "", vehicle_number: "", driver_name: "", items: [], date: today(), destination_party_id: "", mandi_id: "", cold_storage_id: "" });
  const [itemForm, setItemForm] = useState({ lot_id: "", loaded_bags: "", loaded_weight: "" });

  const availableLots = purchases.filter(p => getRemainingBags(p, dispatches) > 0);

  const addItemToTruck = () => {
    if (!itemForm.lot_id || !itemForm.loaded_bags || !itemForm.loaded_weight) return alert("Fill details");
    const lot = purchases.find(p => p.lot_id === itemForm.lot_id);
    const remaining = getRemainingBags(lot, dispatches);
    if (parseFloat(itemForm.loaded_bags) > remaining) return alert(`Only ${remaining} available`);
    
    const stdBags = (parseFloat(itemForm.loaded_weight) / 52.5).toFixed(2);
    setForm(p => ({ 
      ...p, 
      items: [...p.items, { ...itemForm, std_bags: stdBags, loaded_cost: parseFloat(stdBags) * (lot.rate_per_bag || 0) }] 
    }));
    setItemForm({ lot_id: "", loaded_bags: "", loaded_weight: "" });
  };

  const save = async () => {
    if (!form.gatepass_id || !form.destination_party_id || !form.mandi_id || form.items.length === 0) {
      return alert("❌ Fill fields completely!");
    }
    await opsD.addItem({ ...form, id: uid() });
    setShowForm(false);
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 14 }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>Dispatches</span>
        <button onClick={() => { setForm({ gatepass_id: "", vehicle_number: "", driver_name: "", items: [], date: today(), destination_party_id: "", mandi_id: "", cold_storage_id: "" }); setShowForm(true); }} style={s.btn()}><Icon name="add" size={14} /> New Truck</button>
      </div>

      {dispatches.map(d => (
        <div key={d.id} style={s.card}>
          <div style={s.rowBetween}><Badge v={`GP: ${d.gatepass_id}`} color={clr.blue} /><strong>{d.vehicle_number}</strong></div>
          <div style={{ fontSize: 13, marginTop: 6, color: clr.muted }}>
            To: <strong>{parties.find(p => p.id === d.destination_party_id)?.name || "N/A"}</strong> | Mandi: {mandis.find(m => m.id === d.mandi_id)?.name || "N/A"}
          </div>
          <div style={{ ...s.row, marginTop: 10 }}>
            <button onClick={() => { if(window.confirm("Delete?")) opsD.deleteItem(d.id); }} style={{ ...s.btnSm(), width: "100%", color: clr.red }}><Icon name="trash" size={12} color={clr.red} /> Remove</button>
          </div>
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Dispatch Entry">
        <Field label="Gatepass ID"><input style={s.input} value={form.gatepass_id} onChange={e => setForm({ ...form, gatepass_id: e.target.value })} /></Field>
        <Field label="Vehicle Number"><input style={s.input} value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} /></Field>
        <Field label="Destination Party"><select style={s.select} value={form.destination_party_id} onChange={e => setForm({ ...form, destination_party_id: e.target.value })}><option value="">Select Party</option>{parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Target Mandi"><select style={s.select} value={form.mandi_id} onChange={e => setForm({ ...form, mandi_id: e.target.value })}><option value="">Select Mandi</option>{mandis.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
        
        <div style={{ ...s.card2, background: clr.card, padding: 10, marginBottom: 12 }}>
          <div style={s.label}>Load Lots into Truck</div>
          <select style={{ ...s.select, marginBottom: 6 }} value={itemForm.lot_id} onChange={e => setItemForm({ ...itemForm, lot_id: e.target.value })}><option value="">Select Available Lot</option>{availableLots.map(l => <option key={l.id} value={l.lot_id}>{l.lot_id}</option>)}</select>
          <input type="number" style={{ ...s.input, marginBottom: 6 }} placeholder="Manual Bags" value={itemForm.loaded_bags} onChange={e => setItemForm({ ...itemForm, loaded_bags: e.target.value })} />
          <input type="number" style={{ ...s.input, marginBottom: 6 }} placeholder="Weight (kg)" value={itemForm.loaded_weight} onChange={e => setItemForm({ ...itemForm, loaded_weight: e.target.value })} />
          <button onClick={addItemToTruck} style={{ ...s.btnSm(clr.accent, "#000"), width: "100%" }}>Add Lot Item</button>
        </div>
        <button onClick={save} style={{ ...s.btn() }}>Submit Dispatches</button>
      </Modal>
    </div>
  );
};

// ===== MANDI SALE SCREEN (EXPENSES SPLIT EQUALLY) =====
const SaleScreen = ({ sales, dispatches, purchases, opsSales }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedGatepass, setSelectedGatepass] = useState("");
  const [form, setForm] = useState({ gatepass_id: "", date: today(), lot_sales: [], transport: "", commission_percent: "", hamali_per_bag: "", other_expenses: "" });

  const loadGatepassLots = (gpId) => {
    setSelectedGatepass(gpId);
    const dispatch = dispatches.find(d => d.gatepass_id === gpId);
    if (dispatch) {
      const items = dispatch.items?.map(i => ({
        lot_id: i.lot_id, loaded_bags: i.loaded_bags, loaded_weight: i.loaded_weight, received_weight: i.loaded_weight, sale_rate_per_kg: ""
      })) || [];
      setForm(prev => ({ ...prev, gatepass_id: gpId, lot_sales: items }));
    }
  };

  const updateSaleItem = (idx, updates) => {
    const updated = [...form.lot_sales];
    updated[idx] = { ...updated[idx], ...updates };
    setForm(prev => ({ ...prev, lot_sales: updated }));
  };

  // Calculations
  const grossSaleValue = form.lot_sales.reduce((sum, i) => sum + ((parseFloat(i.received_weight) || 0) * (parseFloat(i.sale_rate_per_kg) || 0)), 0);
  const calculatedCommission = grossSaleValue * ((parseFloat(form.commission_percent) || 0) / 100);
  const totalHamali = form.lot_sales.reduce((sum, i) => sum + ((parseFloat(i.loaded_bags) || 0) * (parseFloat(form.hamali_per_bag) || 0)), 0);
  const totalCombinedExpenses = (parseFloat(form.transport) || 0) + calculatedCommission + totalHamali + (parseFloat(form.other_expenses) || 0);

  const save = async () => {
    if (!form.gatepass_id || form.lot_sales.length === 0) return alert("❌ Setup transaction completely!");
    
    // Split total expenses equally among all lots included in this gatepass sale record
    const linkedLotsCount = form.lot_sales.length;
    const splitExpensePerLot = totalCombinedExpenses / (linkedLotsCount || 1);

    const finalizedLotSales = form.lot_sales.map(ls => ({
      ...ls,
      allocated_expense: splitExpensePerLot
    }));

    const result = await opsSales.addItem({ 
      ...form, 
      lot_sales: finalizedLotSales,
      total_sale_value: grossSaleValue, 
      total_expenses: totalCombinedExpenses, 
      net_profit: grossSaleValue - totalCombinedExpenses 
    });
    if (result) { setShowForm(false); setSelectedGatepass(""); }
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 14 }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>Mandi Sales Invoice</span>
        <button onClick={() => { setSelectedGatepass(""); setForm({ gatepass_id: "", date: today(), lot_sales: [], transport: "", commission_percent: "", hamali_per_bag: "", other_expenses: "" }); setShowForm(true); }} style={s.btn(clr.green, "#fff")}>New Mandi Sale</button>
      </div>

      {sales.map(sx => (
        <div key={sx.id} style={s.card}>
          <div style={s.rowBetween}><Badge v={`GP Link: ${sx.gatepass_id}`} color={clr.green} /><strong>₹{fmt(sx.total_sale_value)}</strong></div>
          <div style={{ fontSize: 13, color: clr.muted, marginTop: 4 }}>Total Expenses Split: ₹{fmt(sx.total_expenses)}</div>
          <div style={{ ...s.row, marginTop: 10 }}>
            <button onClick={() => { if(window.confirm("Delete?")) opsSales.deleteItem(sx.id); }} style={{ ...s.btnSm(), width: "100%", color: clr.red }}>Delete</button>
          </div>
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Record Mandi Sale Metrics">
        <Field label="Select Target Gatepass Track"><select style={s.select} value={selectedGatepass} onChange={e => loadGatepassLots(e.target.value)}><option value="">Select GP Link</option>{dispatches.map(d => <option key={d.id} value={d.gatepass_id}>{d.gatepass_id}</option>)}</select></Field>
        
        {form.lot_sales.map((item, idx) => (
          <div key={idx} style={s.card2}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: clr.accent }}>Lot: {item.lot_id}</div>
            <Field label="Received Mandi Weight (kg)"><input type="number" style={s.input} value={item.received_weight} onChange={e => updateSaleItem(idx, { received_weight: e.target.value })} /></Field>
            <Field label="Sale Rate (₹ per kg)"><input type="number" step="0.01" style={s.input} value={item.sale_rate_per_kg} onChange={e => updateSaleItem(idx, { sale_rate_per_kg: e.target.value })} /></Field>
          </div>
        ))}
        
        <div style={s.divider} />
        <Field label="Transport Expenses (₹)"><input type="number" style={s.input} value={form.transport} onChange={e => setForm({ ...form, transport: e.target.value })} /></Field>
        <Field label="Mandi Commission Percent (%)"><input type="number" placeholder="e.g. 6%" style={s.input} value={form.commission_percent} onChange={e => setForm({ ...form, commission_percent: e.target.value })} /></Field>
        <Field label="Hamali Fee Per Bag (₹)"><input type="number" style={s.input} value={form.hamali_per_bag} onChange={e => setForm({ ...form, hamali_per_bag: e.target.value })} /></Field>
        <Field label="Other Expenses (₹)"><input type="number" style={s.input} value={form.other_expenses} onChange={e => setForm({ ...form, other_expenses: e.target.value })} /></Field>
        
        <div style={{ padding: 10, background: clr.card2, borderRadius: 8, marginTop: 10, fontSize: 14 }}>
          <div>Gross Revenue: <strong style={{ color: clr.green }}>₹{fmt(grossSaleValue)}</strong></div>
          <div>Combined Expenses: <strong style={{ color: clr.orange }}>₹{fmt(totalCombinedExpenses)}</strong></div>
        </div>
        <button onClick={save} style={{ ...s.btn(clr.green, "#fff"), marginTop: 12 }}>Save & Equally Split Expenses</button>
      </Modal>
    </div>
  );
};

// ===== FINANCIAL PAYMENTS MANAGEMENT =====
const PaymentScreen = ({ sales, dispatches, purchases, payments, opsPayment, parties }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ gatepass_id: "", amount: "", payment_mode: "cash", date: today(), notes: "" });

  const save = async () => {
    if (!form.gatepass_id || !form.amount) return alert("❌ Fill values fields!");
    const dispatch = dispatches.find(d => d.gatepass_id === form.gatepass_id);
    const sale = sales.find(s => s.gatepass_id === form.gatepass_id);
    const party = parties.find(p => p.id === dispatch?.destination_party_id);
    
    await opsPayment.addItem({ 
      id: uid(), ...form, party_name: party?.name || "Unknown", sale_value: sale?.total_sale_value || 0
    });
    setShowForm(false);
  };

  const partyDues = parties.map(p => {
    const dispatchesToParty = dispatches.filter(d => d.destination_party_id === p.id);
    const gpsToParty = dispatchesToParty.map(d => d.gatepass_id);
    const salesToParty = sales.filter(s => gpsToParty.includes(s.gatepass_id));
    const totalSale = salesToParty.reduce((sum, s) => sum + (parseFloat(s.total_sale_value) || 0), 0);
    const paidAmount = payments.filter(py => gpsToParty.includes(py.gatepass_id)).reduce((sum, py) => sum + (parseFloat(py.amount) || 0), 0);
    return { id: p.id, name: p.name, phone: p.phone, due: totalSale - paidAmount };
  }).filter(p => p.due > 0);

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 14 }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>Party Outstanding Dues</span>
        <button onClick={() => setShowForm(true)} style={s.btn(clr.orange, "#000")}>+ Record Cash</button>
      </div>

      {partyDues.map(p => (
        <div key={p.id} style={s.card2}>
          <div style={s.rowBetween}>
            <div><div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div></div>
            <strong style={{ color: clr.red, fontSize: 16 }}>₹{fmt(p.due)}</strong>
          </div>
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Record Payment Receipt">
        <Field label="Link Gatepass Code"><select style={s.select} value={form.gatepass_id} onChange={e => setForm({ ...form, gatepass_id: e.target.value })}><option value="">Select GP Track</option>{sales.map(s => <option key={s.id} value={s.gatepass_id}>{s.gatepass_id}</option>)}</select></Field>
        <Field label="Amount Received (₹)"><input type="number" style={s.input} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></Field>
        <Field label="Payment Gateway Mode"><select style={s.select} value={form.payment_mode} onChange={e => setForm({ ...form, payment_mode: e.target.value })}><option value="cash">Cash</option><option value="upi">UPI/Online</option></select></Field>
        <button onClick={save} style={s.btn(clr.orange, "#000")}>Log Payment Receipt</button>
      </Modal>
    </div>
  );
};

// ===== COLD STORAGE DUE SCREEN =====
const ColdStorageDueScreen = ({ purchases, coldStorages }) => {
  const coldStorageDues = coldStorages.map(cs => {
    const lotsAtCS = purchases.filter(p => p.cold_storage_id === cs.id);
    const totalPurchasedValue = lotsAtCS.reduce((sum, p) => sum + (parseFloat(p.total_cost) || 0), 0);
    return { id: cs.id, name: cs.name, totalPurchased: totalPurchasedValue };
  }).filter(c => c.totalPurchased > 0);

  return (
    <div style={s.content}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>❄️ Cold Storage Outstandings</div>
      {coldStorageDues.map(cs => (
        <div key={cs.id} style={s.card}>
          <div style={s.rowBetween}>
            <span style={{ fontWeight: 700 }}>{cs.name}</span>
            <strong style={{ color: clr.orange, fontSize: 16 }}>₹{fmt(cs.totalPurchased)}</strong>
          </div>
        </div>
      ))}
    </div>
  );
};

// ===== DETAILED PROFIT REALIZATION REPORT =====
const PnLScreen = ({ sales, purchases, dispatches, parties, mandis }) => {
  return (
    <div style={s.content}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>Realized Profit Statements</div>
      {sales.map(sale => {
        const matchingDispatch = dispatches.find(d => d.gatepass_id === sale.gatepass_id);
        const partyName = parties.find(p => p.id === matchingDispatch?.destination_party_id)?.name || "Unknown";
        const mandiName = mandis.find(m => m.id === matchingDispatch?.mandi_id)?.name || "Unknown";
        let totalGatepassPurchaseCost = 0;

        return (
          <div key={sale.id} style={{ ...s.card, borderLeft: `4px solid ${clr.blue}` }}>
            <div style={s.rowBetween}>
              <Badge v={`GP: ${sale.gatepass_id}`} color={clr.blue} />
              <strong style={{ color: clr.green, fontSize: 14 }}>{mandiName}</strong>
            </div>
            <div style={{ fontSize: 13, color: clr.muted, marginTop: 4 }}>Party Reference: <strong>{partyName}</strong></div>
            <div style={s.divider} />

            {sale.lot_sales?.map((ls, idx) => {
              const originalPurchase = purchases.find(p => p.lot_id === ls.lot_id);
              const ratePerBag = parseFloat(originalPurchase?.rate_per_bag) || 0;
              const loadedBags = parseFloat(ls.loaded_bags) || 0;
              
              const cost = loadedBags * ratePerBag;
              totalGatepassPurchaseCost += cost;

              const revenue = (parseFloat(ls.received_weight) || 0) * (parseFloat(ls.sale_rate_per_kg) || 0);
              // Split expense allocated equally from earlier processing
              const expenseAllocated = parseFloat(ls.allocated_expense) || 0;
              const netLotProfit = revenue - cost - expenseAllocated;

              return (
                <div key={idx} style={{ ...s.card2, background: "#0002", padding: 8, fontSize: 13 }}>
                  <div style={s.rowBetween}>
                    <span><strong>{ls.lot_id}</strong> ({ls.loaded_bags} Bags)</span>
                    <span style={{ color: netLotProfit >= 0 ? clr.green : clr.red, fontWeight: 700 }}>P&L: ₹{fmt(netLotProfit)}</span>
                  </div>
                </div>
              );
            })}

            <div style={s.divider} />
            <div style={{ fontSize: 13, background: clr.card2, padding: 8, borderRadius: 8 }}>
              <div>Stock Purchase Cost: <strong>₹{fmt(totalGatepassPurchaseCost)}</strong></div>
              <div>Gross Sale Revenue: <strong style={{ color: clr.green }}>₹{fmt(sale.total_sale_value)}</strong></div>
              <div>Combined Expenses (Split): <strong style={{ color: clr.orange }}>₹{fmt(sale.total_expenses)}</strong></div>
              <div style={{ borderTop: `1px solid ${clr.border}`, paddingTop: 6, marginTop: 6 }}>
                Net Net Margin: <strong style={{ fontSize: 15, color: (sale.total_sale_value - totalGatepassPurchaseCost - sale.total_expenses) >= 0 ? clr.green : clr.red }}>₹{fmt(sale.total_sale_value - totalGatepassPurchaseCost - sale.total_expenses)}</strong>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ===== ADMINISTRATIVE SETUP MASTER =====
const MasterSection = ({ title, items, fields, ops }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});

  const save = async () => {
    if (!form[fields[0].key]?.trim()) return alert("Fill value");
    await ops.addItem({ id: uid(), ...form });
    setShowForm(false);
    setForm({});
  };

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={s.rowBetween}><span style={{ fontWeight: 700, fontSize: 15 }}>{title} Registry</span><button onClick={() => setShowForm(true)} style={s.btnSm()}>+ Add</button></div>
      {items.map(item => (
        <div key={item.id} style={{ ...s.card2, margin: "6px 0", fontSize: 14 }}>{item[fields[0].key]}</div>
      ))}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={`Configure ${title}`}>
        {fields.map(f => <Field key={f.key} label={f.label}><input style={s.input} value={form[f.key] || ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })} /></Field>)}
        <button onClick={save} style={s.btn()}>Submit Master Setup</button>
      </Modal>
    </div>
  );
};

const MasterScreen = ({ varieties, gradings, coldStorages, mandis, parties, opsV, opsG, opsCS, opsM, opsPA }) => (
  <div style={s.content}>
    <MasterSection title="Potato Varieties" items={varieties} fields={[{ key: "name", label: "Variety Name" }]} ops={opsV} />
    <MasterSection title="Gradings Category" items={gradings} fields={[{ key: "name", label: "Grading Name" }]} ops={opsG} />
    <MasterSection title="Cold Storages Facility" items={coldStorages} fields={[{ key: "name", label: "Facility Name" }]} ops={opsCS} />
    <MasterSection title="Mandi Locations" items={mandis} fields={[{ key: "name", label: "Mandi Location" }]} ops={opsM} />
    <MasterSection title="Trading Parties" items={parties} fields={[{ key: "name", label: "Party Corporate Name" }]} ops={opsPA} />
  </div>
);

// ===== CORE APP ARCHITECTURE =====
export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const varieties = useSupabaseTable("varieties");
  const gradings = useSupabaseTable("gradings");
  const coldStorages = useSupabaseTable("cold_storages");
  const mandis = useSupabaseTable("mandis");
  const parties = useSupabaseTable("parties");
  const purchases = useSupabaseTable("purchases");
  const dispatches = useSupabaseTable("dispatches");
  const sales = useSupabaseTable("sales");
  const payments = useSupabaseTable("payments");

  return (
    <div style={s.screen}>
      <div style={s.header}>
        <span style={{ street: "normal", fontWeight: 900, fontSize: 18, color: clr.accent }}>🥔 AlooTrader v4.5</span>
        <Badge v={activeTab.toUpperCase()} color={clr.blue} />
      </div>

      {activeTab === "dashboard" && <DashboardScreen purchases={purchases.data} dispatches={dispatches.data} sales={sales.data} payments={payments.data} parties={parties.data} mandis={mandis.data} />}
      {activeTab === "purchase" && <PurchaseScreen purchases={purchases.data} dispatches={dispatches.data} opsP={purchases} varieties={varieties.data} gradings={gradings.data} coldStorages={coldStorages.data} />}
      {activeTab === "dispatch" && <DispatchScreen dispatches={dispatches.data} purchases={purchases.data} opsD={dispatches} parties={parties.data} mandis={mandis.data} coldStorages={coldStorages.data} />}
      {activeTab === "sale" && <SaleScreen sales={sales.data} dispatches={dispatches.data} purchases={purchases.data} opsSales={sales} />}
      {activeTab === "payment" && <PaymentScreen sales={sales.data} dispatches={dispatches.data} purchases={purchases.data} payments={payments.data} opsPayment={payments} parties={parties.data} />}
      {activeTab === "colddue" && <ColdStorageDueScreen purchases={purchases.data} coldStorages={coldStorages.data} />}
      {activeTab === "pnl" && <PnLScreen sales={sales.data} purchases={purchases.data} dispatches={dispatches.data} parties={parties.data} mandis={mandis.data} />}
      {activeTab === "master" && <MasterScreen varieties={varieties.data} gradings={gradings.data} coldStorages={coldStorages.data} mandis={mandis.data} parties={parties.data} opsV={varieties} opsG={gradings} opsCS={coldStorages} opsM={mandis} opsPA={parties} />}

      <div style={s.navBar}>
        <button onClick={() => setActiveTab("dashboard")} style={s.navItem(activeTab === "dashboard")}>📊</button>
        <button onClick={() => setActiveTab("purchase")} style={s.navItem(activeTab === "purchase")}>📥</button>
        <button onClick={() => setActiveTab("dispatch")} style={s.navItem(activeTab === "dispatch")}>📤</button>
        <button onClick={() => setActiveTab("sale")} style={s.navItem(activeTab === "sale")}>💰</button>
        <button onClick={() => setActiveTab("payment")} style={s.navItem(activeTab === "payment")}>💳</button>
        <button onClick={() => setActiveTab("colddue")} style={s.navItem(activeTab === "colddue")}>❄️</button>
        <button onClick={() => setActiveTab("pnl")} style={s.navItem(activeTab === "pnl")}>📈</button>
        <button onClick={() => setActiveTab("master")} style={s.navItem(activeTab === "master")}>⚙️</button>
      </div>
    </div>
  );
}
