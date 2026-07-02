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
        setError(null);
        const { data: rows, error: err } = await supabase.from(tableName).select("*").order("created_at", { ascending: false });
        if (err) {
          console.error(`❌ FETCH ERROR (${tableName}):`, err);
          setError(err.message);
          return;
        }
        if (rows) {
          console.log(`✅ FETCHED ${tableName}:`, rows.length, "records");
          // Handle JSON parsing for nested items safely
          const processedRows = rows.map(row => {
            if (row.items && typeof row.items === "string") {
              try { row.items = JSON.parse(row.items); } catch(e) { console.error(e); }
            }
            if (row.lot_sales && typeof row.lot_sales === "string") {
              try { row.lot_sales = JSON.parse(row.lot_sales); } catch(e) { console.error(e); }
            }
            return row;
          });
          setData(processedRows);
        }
      } catch (e) {
        console.error(`❌ EXCEPTION (${tableName}):`, e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tableName]);

  const addItem = async (item) => {
    try {
      console.log(`📝 ADDING to ${tableName}:`, item);
      // Stringify structural arrays for database safety
      const payload = { ...item, created_at: new Date().toISOString() };
      if (payload.items && typeof payload.items !== "string") payload.items = JSON.stringify(payload.items);
      if (payload.lot_sales && typeof payload.lot_sales !== "string") payload.lot_sales = JSON.stringify(payload.lot_sales);

      const { data: d, error: err } = await supabase.from(tableName).insert([payload]).select();
      if (err) {
        console.error(`❌ INSERT ERROR (${tableName}):`, err);
        alert(`Error saving: ${err.message}`);
        return null;
      }
      if (d && d.length > 0) {
        const returnedData = d[0];
        if (returnedData.items && typeof returnedData.items === "string") returnedData.items = JSON.parse(returnedData.items);
        if (returnedData.lot_sales && typeof returnedData.lot_sales === "string") returnedData.lot_sales = JSON.parse(returnedData.lot_sales);
        
        console.log(`✅ SAVED ${tableName}:`, returnedData);
        setData([returnedData, ...data]);
        return returnedData;
      }
    } catch (e) {
      console.error(`❌ ADD EXCEPTION (${tableName}):`, e);
      alert(`Error: ${e.message}`);
      return null;
    }
  };

  const editItem = async (id, updates) => {
    try {
      console.log(`✏️ UPDATING ${tableName} ID:`, id, updates);
      const payload = { ...updates };
      if (payload.items && typeof payload.items !== "string") payload.items = JSON.stringify(payload.items);
      if (payload.lot_sales && typeof payload.lot_sales !== "string") payload.lot_sales = JSON.stringify(payload.lot_sales);

      const { error: err } = await supabase.from(tableName).update(payload).eq("id", id);
      if (err) {
        console.error(`❌ UPDATE ERROR (${tableName}):`, err);
        alert(`Error updating: ${err.message}`);
        return false;
      }
      console.log(`✅ UPDATED ${tableName}`);
      setData(data.map(x => x.id === id ? { ...x, ...updates } : x));
      return true;
    } catch (e) {
      console.error(`❌ EDIT EXCEPTION (${tableName}):`, e);
      alert(`Error: ${e.message}`);
      return false;
    }
  };

  const deleteItem = async (id) => {
    try {
      console.log(`🗑️ DELETING ${tableName} ID:`, id);
      const { error: err } = await supabase.from(tableName).delete().eq("id", id);
      if (err) {
        console.error(`❌ DELETE ERROR (${tableName}):`, err);
        alert(`Error deleting: ${err.message}`);
        return false;
      }
      console.log(`✅ DELETED ${tableName}`);
      setData(data.filter(x => x.id !== id));
      return true;
    } catch (e) {
      console.error(`❌ DELETE EXCEPTION (${tableName}):`, e);
      alert(`Error: ${e.message}`);
      return false;
    }
  };

  return { data, loading, error, addItem, editItem, deleteItem };
};

// UTILITIES
const uid = () => Math.random().toString(36).slice(2, 9).toUpperCase();
const fmt = (n, d = 0) => (isNaN(n) ? "0" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d }));
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "-";
const today = () => new Date().toISOString().slice(0, 10);

const clr = { 
  bg: "#0f1117", card: "#1a1d26", card2: "#22263a", accent: "#f5a623", green: "#22c55e", 
  red: "#ef4444", blue: "#3b82f6", purple: "#a855f7", muted: "#6b7280", border: "#2d3148", text: "#f1f5f9", orange: "#f97316"
};

const getRemainingBags = (purchase, dispatches = []) => {
  const dispatchedBags = dispatches.flatMap(d => d.items || []).filter(i => i.lot_id === purchase.lot_id).reduce((sum, i) => sum + (parseFloat(i.loaded_bags) || 0), 0);
  return (parseFloat(purchase.manual_bags) || 0) - dispatchedBags;
};

const calculateWeightLoss = (sentWeight, receivedWeight) => {
  const loss = sentWeight - receivedWeight;
  const lossPercent = sentWeight > 0 ? (loss / sentWeight * 100).toFixed(2) : 0;
  return { loss, lossPercent };
};

const s = {
  screen: { minHeight: "100vh", background: clr.bg, color: clr.text, fontFamily: "system-ui, sans-serif", maxWidth: 480, margin: "0 auto", position: "relative" },
  header: { background: clr.card, padding: "12px 14px", borderBottom: `1px solid ${clr.border}`, position: "sticky", top: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center" },
  card: { background: clr.card, borderRadius: 10, padding: 12, marginBottom: 8, border: `1px solid ${clr.border}` },
  card2: { background: clr.card2, borderRadius: 8, padding: 10, marginBottom: 6, border: `1px solid ${clr.border}` },
  rowBetween: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  row: { display: "flex", alignItems: "center", gap: 6 },
  input: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 6, padding: "8px 10px", color: clr.text, fontSize: 13, boxSizing: "border-box", outline: "none" },
  select: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 6, padding: "8px 10px", color: clr.text, fontSize: 13, boxSizing: "border-box", outline: "none" },
  label: { fontSize: 10, color: clr.muted, marginBottom: 2, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 },
  btn: (bg = clr.accent, txt = "#000") => ({ background: bg, color: txt, border: "none", borderRadius: 6, padding: "9px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }),
  btnSm: (bg = clr.card2, txt = clr.text) => ({ background: bg, color: txt, border: `1px solid ${clr.border}`, borderRadius: 5, padding: "5px 8px", fontWeight: 600, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }),
  tag: (bg = clr.accent + "22", txt = clr.accent) => ({ background: bg, color: txt, borderRadius: 4, padding: "2px 6px", fontSize: 10, fontWeight: 700 }),
  content: { padding: 12, paddingBottom: 80 },
  navBar: { position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", background: clr.card, borderTop: `1px solid ${clr.border}`, display: "flex", zIndex: 200 },
  navItem: (active) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 4px", gap: 2, background: "none", border: "none", color: active ? clr.accent : clr.muted, fontSize: 9, cursor: "pointer" }),
  divider: { height: 1, background: clr.border, margin: "6px 0" }
};

const Icon = ({ name, size = 16, color = clr.text }) => {
  const icons = {
    dashboard: "M3 3h2v2H3V3zm4 0h2v2H7V3zm4 0h2v2h-2V3zm4 0h2v2h-2V3zM3 7h2v2H3V7zm4 0h2v2H7V7zm4 0h2v2h-2V7zm4 0h2v2h-2V7zM3 11h2v2H3v-2zm4 0h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z",
    purchase: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    dispatch: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
    sale: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    add: "M12 4v16m8-8H4", x: "M6 18L18 6M6 6l12 12", trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    download: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
    report: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icons[name]} /></svg>;
};

const Field = ({ label, children }) => <div style={{ marginBottom: 10 }}><div style={s.label}>{label}</div>{children}</div>;
const Modal = ({ open, onClose, title, children }) => !open ? null : <div style={{ position: "fixed", inset: 0, background: "#000c", zIndex: 1000, display: "flex", alignItems: "flex-end" }}><div style={{ background: clr.card, borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 480, maxHeight: "90vh", display: "flex", flexDirection: "column", border: `1px solid ${clr.border}` }}><div style={{ ...s.rowBetween, padding: 12, borderBottom: `1px solid ${clr.border}` }}><span style={{ fontWeight: 700, fontSize: 14 }}>{title}</span><button onClick={onClose} style={s.btnSm()}><Icon name="x" size={12} /></button></div><div style={{ overflowY: "auto", padding: "0 12px 16px" }}>{children}</div></div></div>;
const Badge = ({ v, color = clr.accent }) => <span style={s.tag(color + "22", color)}>{v}</span>;

// DASHBOARD
const DashboardScreen = ({ purchases, dispatches, sales }) => {
  const today_str = today();
  const purchasedBags = purchases.reduce((sum, p) => sum + (parseFloat(p.manual_bags) || 0), 0);
  const dispatchedBags = dispatches.flatMap(d => d.items || []).reduce((sum, i) => sum + (parseFloat(i.loaded_bags) || 0), 0);
  const remainingBags = purchasedBags - dispatchedBags;
  const activeLots = purchases.filter(p => getRemainingBags(p, dispatches) > 0).length;
  const closedLots = purchases.filter(p => getRemainingBags(p, dispatches) === 0).length;
  const todayDispatches = dispatches.filter(d => d.date === today_str).length;
  const todaySales = sales.filter(s => s.date === today_str).length;
  const totalPurchaseValue = purchases.reduce((sum, p) => sum + (parseFloat(p.total_cost) || 0), 0);
  const totalSaleValue = sales.reduce((sum, s) => sum + (parseFloat(s.total_sale_value) || 0), 0);
  const totalExpenses = sales.reduce((sum, s) => sum + (parseFloat(s.total_expenses) || 0), 0);
  const totalProfit = totalSaleValue - totalPurchaseValue - totalExpenses;

  return (
    <div style={s.content}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
        <div style={{ ...s.card2, background: clr.blue + "15" }}><div style={s.label}>Active Lots</div><div style={{ fontSize: 18, fontWeight: 800, color: clr.blue }}>{activeLots}</div></div>
        <div style={{ ...s.card2, background: clr.red + "15" }}><div style={s.label}>Closed Lots</div><div style={{ fontSize: 18, fontWeight: 800, color: clr.red }}>{closedLots}</div></div>
      </div>
      <div style={{ ...s.card }}>
        <div style={s.label}>Stock (Manual Bags)</div>
        <div style={s.divider} />
        <div style={{ fontSize: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Purchased:</span><strong>{fmt(purchasedBags)}</strong></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Dispatched:</span><strong style={{ color: clr.blue }}>{fmt(dispatchedBags)}</strong></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Remaining:</span><strong style={{ color: clr.green }}>{fmt(remainingBags)}</strong></div>
        </div>
      </div>
      <div style={{ ...s.card }}>
        <div style={s.label}>Today's Activity</div>
        <div style={s.divider} />
        <div style={{ fontSize: 12 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Dispatches:</span><strong>{todayDispatches}</strong></div><div style={{ display: "flex", justifyContent: "space-between" }}><span>Sales:</span><strong>{todaySales}</strong></div></div>
      </div>
      <div style={{ ...s.card, background: (totalProfit >= 0 ? clr.green : clr.red) + "15" }}>
        <div style={s.label}>Financial Summary</div>
        <div style={s.divider} />
        <div style={{ fontSize: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Purchase Value:</span><strong>₹{fmt(totalPurchaseValue)}</strong></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Sale Value:</span><strong style={{ color: clr.green }}>₹{fmt(totalSaleValue)}</strong></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Expenses:</span><strong style={{ color: clr.orange }}>₹{fmt(totalExpenses)}</strong></div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${clr.border}`, paddingTop: 6 }}><span style={{ fontWeight: 600 }}>Total Profit:</span><strong style={{ color: totalProfit >= 0 ? clr.green : clr.red, fontSize: 14 }}>₹{fmt(totalProfit)}</strong></div>
        </div>
      </div>
    </div>
  );
};

// PURCHASE
const PurchaseScreen = ({ purchases, dispatches, opsP, varieties, gradings }) => {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ lot_id: "", farmer_name: "", manual_bags: "", total_weight: "", rate_per_bag: "", variety_id: "", grading_id: "", date: today() });
  
  const stdBags = form.total_weight ? (parseFloat(form.total_weight) / 52.5).toFixed(2) : "0.00";
  const totalCost = (parseFloat(form.manual_bags) || 0) * (parseFloat(form.rate_per_bag) || 0);

  const save = async () => {
    if (!form.lot_id || !form.farmer_name || !form.manual_bags || !form.rate_per_bag) return alert("❌ Fill all required fields!");
    const currentStdBags = form.total_weight ? (parseFloat(form.total_weight) / 52.5).toFixed(2) : "0.00";
    const currentTotalCost = (parseFloat(form.manual_bags) || 0) * (parseFloat(form.rate_per_bag) || 0);
    
    if (editItem) {
      const success = await opsP.editItem(editItem.id, { ...form, std_bags: currentStdBags, total_cost: currentTotalCost });
      if (success) {
        alert("✅ Purchase updated successfully!");
        setShowForm(false);
        setForm({ lot_id: "", farmer_name: "", manual_bags: "", total_weight: "", rate_per_bag: "", variety_id: "", grading_id: "", date: today() });
        setEditItem(null);
      }
    } else {
      const result = await opsP.addItem({ id: uid(), ...form, std_bags: currentStdBags, total_cost: currentTotalCost });
      if (result) {
        alert("✅ Purchase saved successfully!");
        setShowForm(false);
        setForm({ lot_id: "", farmer_name: "", manual_bags: "", total_weight: "", rate_per_bag: "", variety_id: "", grading_id: "", date: today() });
        setEditItem(null);
      }
    }
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Purchases</span>
        <button onClick={() => { setEditItem(null); setForm({ lot_id: "", farmer_name: "", manual_bags: "", total_weight: "", rate_per_bag: "", variety_id: "", grading_id: "", date: today() }); setShowForm(true); }} style={s.btn()}><Icon name="add" size={12} /> New</button>
      </div>

      {purchases.map(p => {
        const remaining = getRemainingBags(p, dispatches);
        const isFullyDispatched = remaining === 0;
        const variety = varieties.find(v => v.id === p.variety_id);
        const grading = gradings.find(g => g.id === p.grading_id);
        
        return (
          <div key={p.id} style={{ ...s.card, opacity: isFullyDispatched ? 0.5 : 1, borderLeft: `3px solid ${isFullyDispatched ? clr.red : clr.green}` }}>
            <div style={s.rowBetween}><Badge v={p.lot_id} color={isFullyDispatched ? clr.red : clr.accent} /><span style={{ fontSize: 10, color: clr.muted }}>{fmtDate(p.date)}</span></div>
            <div style={{ fontWeight: 600, fontSize: 12, marginTop: 4 }}>{p.farmer_name}</div>
            {variety && <div style={{ fontSize: 10, color: clr.muted }}>{variety.name} {grading ? `- ${grading.name}` : ""}</div>}
            <div style={s.divider} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11, marginBottom: 8 }}>
              <div><span style={s.label}>Bags</span><div style={{ fontWeight: 700 }}>{p.manual_bags}</div></div>
              <div><span style={s.label}>Weight</span><div style={{ fontWeight: 700 }}>{p.total_weight} kg</div></div>
              <div><span style={s.label}>Std Bags</span><div style={{ fontWeight: 700 }}>{fmt(p.std_bags, 2)}</div></div>
              <div><span style={s.label}>Rate</span><div style={{ fontWeight: 700 }}>₹{p.rate_per_bag}/bag</div></div>
            </div>
            <div style={{ ...s.card2, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}><span style={s.label}>Cost</span><div style={{ fontWeight: 700, color: clr.accent }}>₹{fmt(p.total_cost)}</div></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}><span style={s.label}>Remaining</span><div style={{ fontWeight: 700, color: remaining > 0 ? clr.green : clr.red }}>{fmt(remaining)} bags</div></div>
            </div>
            {isFullyDispatched && <div style={{ background: clr.red + "22", padding: 6, borderRadius: 4, textAlign: "center", fontSize: 10, color: clr.red, fontWeight: 700, marginBottom: 8 }}>✓ CLOSED</div>}
            <div style={s.row}>
              <button onClick={() => { setEditItem(p); setForm({ ...p }); setShowForm(true); }} style={{ ...s.btnSm(), flex: 1 }}><Icon name="edit" size={10} color={clr.blue} /> Edit</button>
              <button onClick={() => { if(window.confirm("Delete?")) opsP.deleteItem(p.id); }} style={{ ...s.btnSm(), flex: 1, color: clr.red }}><Icon name="trash" size={10} color={clr.red} /> Delete</button>
            </div>
          </div>
        );
      })}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Edit Purchase" : "New Purchase"}>
        <Field label="Lot ID"><input style={s.input} value={form.lot_id} onChange={e => setForm({ ...form, lot_id: e.target.value })} placeholder="LOT001" disabled={editItem} /></Field>
        <Field label="Farmer Name"><input style={s.input} value={form.farmer_name} onChange={e => setForm({ ...form, farmer_name: e.target.value })} /></Field>
        <Field label="Manual Bags"><input type="number" style={s.input} value={form.manual_bags} onChange={e => setForm({ ...form, manual_bags: e.target.value })} /></Field>
        <Field label="Total Weight (kg)"><input type="number" style={s.input} value={form.total_weight} onChange={e => setForm({ ...form, total_weight: e.target.value })} /></Field>
        <div style={{ ...s.card2, marginBottom: 10 }}><div style={s.label}>Std Bags (Auto)</div><div style={{ fontWeight: 700, color: clr.accent }}>{stdBags}</div></div>
        <Field label="Rate per Bag (₹)"><input type="number" step="0.01" style={s.input} value={form.rate_per_bag} onChange={e => setForm({ ...form, rate_per_bag: e.target.value })} /></Field>
        <div style={{ ...s.card2, marginBottom: 10, background: clr.accent + "15" }}><div style={s.label}>Total Cost</div><div style={{ fontWeight: 700, fontSize: 14, color: clr.accent }}>₹{fmt(totalCost)}</div></div>
        <button onClick={save} style={{ ...s.btn(), width: "100%" }}>{editItem ? "Update" : "Save"} Purchase</button>
      </Modal>
    </div>
  );
};

// DISPATCH
const DispatchScreen = ({ dispatches, purchases, opsD, varieties }) => {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ gatepass_id: "", vehicle_number: "", driver_name: "", items: [], date: today() });
  const [itemForm, setItemForm] = useState({ lot_id: "", loaded_bags: "", loaded_weight: "" });

  const availableLots = purchases.filter(p => getRemainingBags(p, dispatches) > 0);

  const addItem = () => {
    if (!itemForm.lot_id || !itemForm.loaded_bags || !itemForm.loaded_weight) return alert("Fill all lot details");
    const lot = purchases.find(p => p.lot_id === itemForm.lot_id);
    const remaining = getRemainingBags(lot, dispatches);
    if (parseFloat(itemForm.loaded_bags) > remaining) return alert(`Only ${remaining} bags remaining!`);
    const stdBags = (parseFloat(itemForm.loaded_weight) / 52.5).toFixed(2);
    const loadedCost = stdBags * (parseFloat(lot.rate_per_bag) || 0);
    setForm(p => ({ ...p, items: [...p.items, { ...itemForm, std_bags: stdBags, loaded_cost: loadedCost, variety_id: lot.variety_id, grading_id: lot.grading_id }] }));
    setItemForm({ lot_id: "", loaded_bags: "", loaded_weight: "" });
  };

  const removeItem = (idx) => {
    setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
  };

  const totalLoadedBags = form.items.reduce((sum, i) => sum + (parseFloat(i.loaded_bags) || 0), 0);
  const totalLoadedWeight = form.items.reduce((sum, i) => sum + (parseFloat(i.loaded_weight) || 0), 0);
  const totalLoadedCost = form.items.reduce((sum, i) => sum + (parseFloat(i.loaded_cost) || 0), 0);

  const save = async () => {
    if (!form.gatepass_id || form.items.length === 0) return alert("❌ Fill gatepass ID and add at least one lot!");
    if (editItem) {
      const success = await opsD.editItem(editItem.id, form);
      if (success) {
        alert("✅ Dispatch updated successfully!");
        setShowForm(false);
        setForm({ gatepass_id: "", vehicle_number: "", driver_name: "", items: [], date: today() });
        setEditItem(null);
      }
    } else {
      const result = await opsD.addItem({ ...form, id: uid() });
      if (result) {
        alert("✅ Dispatch saved successfully!");
        setShowForm(false);
        setForm({ gatepass_id: "", vehicle_number: "", driver_name: "", items: [], date: today() });
        setEditItem(null);
      }
    }
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Dispatch</span>
        <button onClick={() => { setEditItem(null); setForm({ gatepass_id: "", vehicle_number: "", driver_name: "", items: [], date: today() }); setShowForm(true); }} style={s.btn()}><Icon name="add" size={12} /> New</button>
      </div>

      {dispatches.map(d => {
        const totalBags = d.items?.reduce((sum, i) => sum + (parseFloat(i.loaded_bags) || 0), 0) || 0;
        const totalWeight = d.items?.reduce((sum, i) => sum + (parseFloat(i.loaded_weight) || 0), 0) || 0;
        const totalCost = d.items?.reduce((sum, i) => sum + (parseFloat(i.loaded_cost) || 0), 0) || 0;
        
        return (
          <div key={d.id} style={s.card}>
            <div style={s.rowBetween}><Badge v={`GP: ${d.gatepass_id}`} color={clr.blue} /><span style={{ fontSize: 10, color: clr.muted }}>{fmtDate(d.date)}</span></div>
            <div style={{ fontSize: 11, color: clr.muted, marginTop: 4 }}>🚗 {d.vehicle_number}</div>
            <div style={s.divider} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, fontSize: 10, marginBottom: 8 }}>
              <div><span style={s.label}>Bags</span><div style={{ fontWeight: 700 }}>{totalBags}</div></div>
              <div><span style={s.label}>Weight</span><div style={{ fontWeight: 700 }}>{fmt(totalWeight)} kg</div></div>
              <div><span style={s.label}>Cost</span><div style={{ fontWeight: 700, color: clr.accent }}>₹{fmt(totalCost)}</div></div>
            </div>
            <div style={{ ...s.row, marginTop: 8 }}>
              <button onClick={() => { setEditItem(d); setForm({ ...d }); setShowForm(true); }} style={{ ...s.btnSm(), flex: 1 }}><Icon name="edit" size={10} color={clr.blue} /> Edit</button>
              <button onClick={() => { if(window.confirm("Delete?")) opsD.deleteItem(d.id); }} style={{ ...s.btnSm(), flex: 1, color: clr.red }}><Icon name="trash" size={10} color={clr.red} /> Delete</button>
            </div>
          </div>
        );
      })}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Edit Dispatch" : "New Dispatch"}>
        <Field label="Gatepass ID"><input style={s.input} value={form.gatepass_id} onChange={e => setForm({ ...form, gatepass_id: e.target.value })} placeholder="GP-001" disabled={editItem} /></Field>
        <Field label="Vehicle Number"><input style={s.input} value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} placeholder="UP80AB1234" /></Field>
        <Field label="Driver Name"><input style={s.input} value={form.driver_name} onChange={e => setForm({ ...form, driver_name: e.target.value })} /></Field>

        <div style={{ ...s.card2, background: clr.card, marginBottom: 10, padding: 8 }}>
          <div style={s.label}>Add Lots</div>
          <select style={{ ...s.select, marginBottom: 6 }} value={itemForm.lot_id} onChange={e => setItemForm({ ...itemForm, lot_id: e.target.value })}>
            <option value="">Select Lot</option>
            {availableLots.map(p => {
              const remaining = getRemainingBags(p, dispatches);
              const v = varieties.find(v => v.id === p.variety_id);
              return <option key={p.id} value={p.lot_id}>{p.lot_id} - {v?.name} ({remaining} bags)</option>;
            })}
          </select>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
            <input type="number" style={s.input} placeholder="Bags" value={itemForm.loaded_bags} onChange={e => setItemForm({ ...itemForm, loaded_bags: e.target.value })} />
            <input type="number" style={s.input} placeholder="Weight (kg)" value={itemForm.loaded_weight} onChange={e => setItemForm({ ...itemForm, loaded_weight: e.target.value })} />
          </div>
          {itemForm.loaded_weight && <div style={{ ...s.card2, padding: 6, marginBottom: 6, background: clr.card }}><div style={{ fontSize: 10, marginBottom: 3 }}>Std: {(parseFloat(itemForm.loaded_weight) / 52.5).toFixed(2)}</div><div style={{ fontSize: 10, color: clr.accent }}>Cost: ₹{fmt((parseFloat(itemForm.loaded_weight) / 52.5) * (purchases.find(p => p.lot_id === itemForm.lot_id)?.rate_per_bag || 0))}</div></div>}
          <button onClick={addItem} style={{ ...s.btnSm(clr.accent + "22", clr.accent), width: "100%" }}>Add Lot</button>
        </div>

        {form.items.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={s.label}>Dispatch Summary</div>
            {form.items.map((i, idx) => {
              const v = varieties.find(v => v.id === i.variety_id);
              return (
                <div key={idx} style={{ ...s.card2, marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div><strong>{i.lot_id}</strong> {v?.name}</div>
                    <button onClick={() => removeItem(idx)} style={s.btnSm()}><Icon name="trash" size={10} color={clr.red} /></button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4, fontSize: 10 }}>
                    <div><span style={s.label}>Bags</span><strong>{i.loaded_bags}</strong></div>
                    <div><span style={s.label}>Wt</span><strong>{i.loaded_weight}kg</strong></div>
                    <div><span style={s.label}>Std</span><strong>{i.std_bags}</strong></div>
                    <div><span style={s.label}>Cost</span><strong style={{ color: clr.accent }}>₹{fmt(i.loaded_cost)}</strong></div>
                  </div>
                </div>
              );
            })}
            <div style={{ ...s.card2, background: clr.accent + "15", marginTop: 8, padding: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, fontSize: 11 }}>
                <div><span style={s.label}>Total Bags</span><div style={{ fontWeight: 700 }}>{totalLoadedBags}</div></div>
                <div><span style={s.label}>Total Weight</span><div style={{ fontWeight: 700 }}>{fmt(totalLoadedWeight)}kg</div></div>
                <div><span style={s.label}>Total Cost</span><div style={{ fontWeight: 700, color: clr.accent }}>₹{fmt(totalLoadedCost)}</div></div>
              </div>
            </div>
          </div>
        )}

        <button onClick={save} style={{ ...s.btn(), width: "100%" }}>{editItem ? "Update" : "Save"} Dispatch</button>
      </Modal>
    </div>
  );
};

// SALE
const SaleScreen = ({ sales, dispatches, purchases, opsSales }) => {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedGatepass, setSelectedGatepass] = useState("");
  const [form, setForm] = useState({ gatepass_id: "", date: today(), lot_sales: [], transport: 0, commission_percent: 0, hamali_per_bag: 0, other_expenses: 0 });
  const [saleItems, setSaleItems] = useState([]);

  const loadGatepassLots = (gpId) => {
    setSelectedGatepass(gpId);
    const dispatch = dispatches.find(d => d.gatepass_id === gpId);
    if (dispatch) {
      const items = dispatch.items?.map(i => {
        const lot = purchases.find(p => p.lot_id === i.lot_id);
        return {
          lot_id: i.lot_id,
          loaded_bags: i.loaded_bags,
          loaded_weight: i.loaded_weight,
          received_weight: i.loaded_weight,
          sale_rate_per_kg: 0,
          variety_id: lot?.variety_id,
          grading_id: lot?.grading_id
        };
      }) || [];
      setSaleItems(items);
      setForm(prev => ({ ...prev, gatepass_id: gpId, lot_sales: items }));
    }
  };

  const updateSaleItem = (idx, updates) => {
    const updated = [...saleItems];
    updated[idx] = { ...updated[idx], ...updates };
    setSaleItems(updated);
    setForm(prev => ({ ...prev, lot_sales: updated }));
  };

  const calculateExpenseSplit = () => {
    const totalWeight = form.lot_sales.reduce((sum, i) => sum + (parseFloat(i.loaded_weight) || 0), 0);
    if (totalWeight === 0) return {};
    
    const totalExpense = (parseFloat(form.transport) || 0) + (parseFloat(form.other_expenses) || 0);
    const split = {};
    form.lot_sales.forEach((i, idx) => {
      const weightPercent = (parseFloat(i.loaded_weight) || 0) / totalWeight;
      split[idx] = {
        transport: totalExpense * weightPercent,
        hamali: (parseFloat(i.loaded_bags) || 0) * (parseFloat(form.hamali_per_bag) || 0),
        commission: (parseFloat(i.received_weight) || 0) * (parseFloat(i.sale_rate_per_kg) || 0) * (parseFloat(form.commission_percent) || 0) / 100
      };
    });
    return split;
  };

  const expenseSplit = calculateExpenseSplit();
  const totalSaleValue = form.lot_sales.reduce((sum, i) => sum + ((parseFloat(i.received_weight) || 0) * (parseFloat(i.sale_rate_per_kg) || 0)), 0);
  const totalExpenses = Object.values(expenseSplit).reduce((sum, e) => sum + (e.transport + e.hamali + e.commission), 0);
  const totalPurchaseCost = form.lot_sales.reduce((sum, i) => {
    const lot = purchases.find(p => p.lot_id === i.lot_id);
    return sum + ((parseFloat(i.loaded_bags) || 0) * (parseFloat(lot?.rate_per_bag || 0)));
  }, 0);
  const netProfit = totalSaleValue - totalPurchaseCost - totalExpenses;

  const save = async () => {
    if (!form.gatepass_id || form.lot_sales.length === 0) return alert("❌ Fill gatepass ID and select lots!");
    const finalData = { ...form, total_sale_value: totalSaleValue, total_expenses: totalExpenses, net_profit: netProfit };
    if (editItem) {
      const success = await opsSales.editItem(editItem.id, finalData);
      if (success) {
        alert("✅ Sale updated successfully!");
        setShowForm(false);
        setSaleItems([]);
        setSelectedGatepass("");
        setForm({ gatepass_id: "", date: today(), lot_sales: [], transport: 0, commission_percent: 0, hamali_per_bag: 0, other_expenses: 0 });
        setEditItem(null);
      }
    } else {
      const result = await opsSales.addItem({ ...finalData, id: uid() });
      if (result) {
        alert("✅ Sale saved successfully!");
        setShowForm(false);
        setSaleItems([]);
        setSelectedGatepass("");
        setForm({ gatepass_id: "", date: today(), lot_sales: [], transport: 0, commission_percent: 0, hamali_per_bag: 0, other_expenses: 0 });
        setEditItem(null);
      }
    }
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Sales</span>
        <button onClick={() => { setEditItem(null); setSelectedGatepass(""); setSaleItems([]); setForm({ gatepass_id: "", date: today(), lot_sales: [], transport: 0, commission_percent: 0, hamali_per_bag: 0, other_expenses: 0 }); setShowForm(true); }} style={s.btn(clr.green, "#fff")}><Icon name="add" size={12} color="#fff" /> New</button>
      </div>

      {sales.map(sx => {
        const profit = sx.net_profit;
        return (
          <div key={sx.id} style={{ ...s.card, background: (profit >= 0 ? clr.green : clr.red) + "08" }}>
            <div style={s.rowBetween}><Badge v={`GP: ${sx.gatepass_id}`} color={clr.green} /><span style={{ fontSize: 10, color: clr.muted }}>{fmtDate(sx.date)}</span></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11, marginTop: 8, marginBottom: 8 }}>
              <div><span style={s.label}>Sale Value</span><div style={{ fontWeight: 700, color: clr.green }}>₹{fmt(sx.total_sale_value)}</div></div>
              <div><span style={s.label}>Profit</span><div style={{ fontWeight: 700, color: profit >= 0 ? clr.green : clr.red }}>₹{fmt(profit)}</div></div>
            </div>
            <div style={{ ...s.row }}>
              <button onClick={() => { setEditItem(sx); setForm({ ...sx }); setSaleItems(sx.lot_sales || []); setSelectedGatepass(sx.gatepass_id); setShowForm(true); }} style={{ ...s.btnSm(), flex: 1 }}><Icon name="edit" size={10} color={clr.blue} /> Edit</button>
              <button onClick={() => { if(window.confirm("Delete?")) opsSales.deleteItem(sx.id); }} style={{ ...s.btnSm(), flex: 1, color: clr.red }}><Icon name="trash" size={10} color={clr.red} /> Delete</button>
            </div>
          </div>
        );
      })}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Edit Sale" : "New Sale"}>
        <Field label="Select Gatepass"><select style={s.select} value={selectedGatepass} onChange={e => loadGatepassLots(e.target.value)}><option value="">Select GP</option>{dispatches.map(d => <option key={d.id} value={d.gatepass_id}>{d.gatepass_id}</option>)}</select></Field>

        {form.lot_sales.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={s.label}>Lot Details</div>
            {form.lot_sales.map((item, idx) => {
              const { loss, lossPercent } = calculateWeightLoss(parseFloat(item.loaded_weight) || 0, parseFloat(item.received_weight) || 0);
              return (
                <div key={idx} style={{ ...s.card2, marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 6 }}>{item.lot_id}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 10, marginBottom: 6 }}>
                    <div><span style={s.label}>Loaded</span><div>{item.loaded_bags} bags | {item.loaded_weight}kg</div></div>
                    <div><span style={s.label}>Received Weight</span><input type="number" style={{ ...s.input, padding: "4px", fontSize: 11 }} value={item.received_weight} onChange={e => updateSaleItem(idx, { received_weight: e.target.value })} /></div>
                  </div>
                  {loss > 0 && <div style={{ ...s.card2, background: clr.card, padding: 6, marginBottom: 6, fontSize: 10 }}><div style={{ display: "flex", justifyContent: "space-between" }}><span>Loss: {loss.toFixed(2)}kg ({lossPercent}%)</span><span style={{ color: clr.orange }}>₹{fmt(loss * (parseFloat(item.sale_rate_per_kg) || 0))}</span></div></div>}
                  <div><span style={s.label}>Sale Rate (₹/kg)</span><input type="number" step="0.01" style={{ ...s.input, padding: "4px", fontSize: 11 }} value={item.sale_rate_per_kg} onChange={e => updateSaleItem(idx, { sale_rate_per_kg: e.target.value })} /></div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ ...s.label, marginBottom: 6 }}>Expenses</div>
        <Field label="Transport (₹)"><input type="number" step="0.01" style={s.input} value={form.transport} onChange={e => setForm(prev => ({ ...prev, transport: e.target.value }))} /></Field>
        <Field label="Commission (%)"><input type="number" step="0.01" style={s.input} value={form.commission_percent} onChange={e => setForm(prev => ({ ...prev, commission_percent: e.target.value }))} /></Field>
        <Field label="Hamali per Bag (₹)"><input type="number" step="0.01" style={s.input} value={form.hamali_per_bag} onChange={e => setForm(prev => ({ ...prev, hamali_per_bag: e.target.value }))} /></Field>
        <Field label="Other Expenses (₹)"><input type="number" step="0.01" style={s.input} value={form.other_expenses} onChange={e => setForm(prev => ({ ...prev, other_expenses: e.target.value }))} /></Field>

        {form.lot_sales.length > 0 && (
          <div style={{ ...s.card, background: clr.green + "08", marginTop: 12, marginBottom: 12 }}>
            <div style={s.label}>Sale Summary</div>
            <div style={s.divider} />
            <div style={{ fontSize: 11 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Purchase Cost:</span><strong>₹{fmt(totalPurchaseCost)}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Sale Value:</span><strong style={{ color: clr.green }}>₹{fmt(totalSaleValue)}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Total Expenses:</span><strong style={{ color: clr.orange }}>₹{fmt(totalExpenses)}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${clr.border}`, paddingTop: 4 }}><span style={{ fontWeight: 600 }}>Net Profit:</span><strong style={{ color: netProfit >= 0 ? clr.green : clr.red, fontSize: 12 }}>₹{fmt(netProfit)}</strong></div>
            </div>
          </div>
        )}

        <button onClick={save} style={{ ...s.btn(clr.green, "#fff"), width: "100%" }}>{editItem ? "Update" : "Save"} Sale</button>
      </Modal>
    </div>
  );
};

// P&L REPORT
const PnLScreen = ({ sales, purchases, dispatches }) => {
  const lotProfits = purchases.map(purchase => {
    const dispatchItem = dispatches.flatMap(d => d.items || []).find(i => i.lot_id === purchase.lot_id);
    const saleItem = sales.flatMap(s => s.lot_sales || []).find(i => i.lot_id === purchase.lot_id);
    
    if (!dispatchItem || !saleItem) return null;
    
    const purchaseCost = (parseFloat(dispatchItem.loaded_bags) || 0) * (parseFloat(purchase.rate_per_bag) || 0);
    const saleValue = (parseFloat(saleItem.received_weight) || 0) * (parseFloat(saleItem.sale_rate_per_kg) || 0);
    const profit = saleValue - purchaseCost;
    
    return {
      lot_id: purchase.lot_id,
      farmer: purchase.farmer_name,
      purchaseCost,
      saleValue,
      profit
    };
  }).filter(Boolean);

  const totalCost = lotProfits.reduce((sum, l) => sum + l.purchaseCost, 0);
  const totalSale = lotProfits.reduce((sum, l) => sum + l.saleValue, 0);
  const totalProfit = lotProfits.reduce((sum, l) => sum + l.profit, 0);

  return (
    <div style={s.content}>
      <div style={{ ...s.card }}>
        <div style={s.label}>LOT-WISE P&L SUMMARY</div>
        <div style={s.divider} />
        {lotProfits.map((lot, i) => (
          <div key={i} style={{ ...s.card2, marginBottom: 6 }}>
            <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6 }}>{lot.lot_id} - {lot.farmer}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11, marginBottom: 6 }}>
              <div><span style={s.label}>Purchase Cost</span><div style={{ fontWeight: 700 }}>₹{fmt(lot.purchaseCost)}</div></div>
              <div><span style={s.label}>Sale Value</span><div style={{ fontWeight: 700, color: clr.green }}>₹{fmt(lot.saleValue)}</div></div>
            </div>
            <div style={{ background: (lot.profit >= 0 ? clr.green : clr.red) + "15", padding: 6, borderRadius: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span style={s.label}>Profit</span>
                <div style={{ fontWeight: 700, color: lot.profit >= 0 ? clr.green : clr.red }}>₹{fmt(lot.profit)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...s.card, background: clr.green + "15", marginTop: 12 }}>
        <div style={s.label}>OVERALL P&L</div>
        <div style={s.divider} />
        <div style={{ fontSize: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span>Total Purchase Cost:</span><strong>₹{fmt(totalCost)}</strong></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span>Total Sale Value:</span><strong style={{ color: clr.green }}>₹{fmt(totalSale)}</strong></div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${clr.border}`, paddingTop: 6 }}>
            <span style={{ fontWeight: 600 }}>Total Profit:</span>
            <strong style={{ color: totalProfit >= 0 ? clr.green : clr.red, fontSize: 14 }}>₹{fmt(totalProfit)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

// DUE TRACKING
const DueTrackingScreen = ({ sales, purchases, dispatches, coldStorages, parties }) => {
  const coldStorageDues = coldStorages.map(cs => {
    const purchasesAtCs = purchases.filter(p => p.cold_storage_id === cs.id);
    const totalValue = purchasesAtCs.reduce((sum, p) => sum + (parseFloat(p.total_cost) || 0), 0);
    const dispatchedValue = dispatches.flatMap(d => d.items || []).filter(i => purchasesAtCs.some(p => p.lot_id === i.lot_id)).reduce((sum, i) => sum + (parseFloat(i.loaded_cost) || 0), 0);
    const remaining = totalValue - dispatchedValue;
    return { name: cs.name, remaining, total: totalValue };
  }).filter(c => c.remaining > 0);

  const partyDues = parties.map(p => {
    const partyDispatch = dispatches.filter(d => d.destination_party_id === p.id);
    const dispatchValue = partyDispatch.flatMap(d => d.items || []).reduce((sum, i) => sum + (parseFloat(i.loaded_cost) || 0), 0);
    const saleBySales = sales.filter(s => s.lot_sales?.some(l => partyDispatch.some(pd => pd.items?.some(pdi => pdi.lot_id === l.lot_id)))).reduce((sum, s) => sum + (parseFloat(s.total_sale_value) || 0), 0);
    const paid = sales.filter(s => s.lot_sales?.some(l => partyDispatch.some(pd => pd.items?.some(pdi => pdi.lot_id === l.lot_id)))).reduce((sum, s) => sum + (parseFloat(s.total_expenses) || 0), 0);
    const due = saleBySales - paid;
    return { name: p.name, phone: p.phone, due };
  }).filter(p => p.due > 0);

  return (
    <div style={s.content}>
      <div style={{ ...s.card }}>
        <div style={s.label}>❄️ Cold Storage Dues</div>
        <div style={s.divider} />
        {coldStorageDues.length === 0 ? <div style={{ color: clr.muted, fontSize: 12 }}>No pending dues</div> : coldStorageDues.map((cs, i) => (
          <div key={i} style={{ ...s.card2, marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 12 }}>{cs.name}</span>
              <div style={{ fontWeight: 700, color: clr.orange }}>₹{fmt(cs.remaining)}</div>
            </div>
            <div style={{ fontSize: 10, color: clr.muted }}>Total: ₹{fmt(cs.total)}</div>
          </div>
        ))}
      </div>

      <div style={{ ...s.card }}>
        <div style={s.label}>👥 Party Dues</div>
        <div style={s.divider} />
        {partyDues.length === 0 ? <div style={{ color: clr.muted, fontSize: 12 }}>No pending dues</div> : partyDues.map((p, i) => (
          <div key={i} style={{ ...s.card2, marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div><span style={{ fontWeight: 600, fontSize: 12 }}>{p.name}</span><div style={{ fontSize: 10, color: clr.muted }}>{p.phone}</div></div>
              <div style={{ fontWeight: 700, color: clr.red }}>₹{fmt(p.due)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// MASTER SUB-SECTION COMPONENT (To enforce React rule of hooks top-level declaration)
const MasterSection = ({ title, items, fields, ops }) => {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});

  const save = async () => {
    if (!form[fields[0].key]?.trim()) return alert("Fill required field");
    if (editItem) {
      await ops.editItem(editItem.id, form);
    } else {
      await ops.addItem({ id: uid(), ...form });
    }
    setShowForm(false);
    setForm({});
    setEditItem(null);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ ...s.rowBetween, marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{title}</span>
        <button onClick={() => { setEditItem(null); setForm({}); setShowForm(true); }} style={s.btnSm(clr.accent + "22", clr.accent)}>Add</button>
      </div>
      {items.length === 0 && <div style={{ color: clr.muted, fontSize: 12, textAlign: "center", padding: 6, marginBottom: 12 }}>No data</div>}
      {items.map(item => (
        <div key={item.id} style={{ ...s.card2, ...s.rowBetween, marginBottom: 6 }}>
          <div><div style={{ fontWeight: 600, fontSize: 12 }}>{item[fields[0].key]}</div></div>
          <div style={s.row}>
            <button onClick={() => { setEditItem(item); setForm({ ...item }); setShowForm(true); }} style={{ ...s.btnSm(), padding: "4px 6px" }}><Icon name="edit" size={11} color={clr.blue} /></button>
            <button onClick={() => { if (window.confirm("Delete?")) ops.deleteItem(item.id); }} style={{ ...s.btnSm(), padding: "4px 6px" }}><Icon name="trash" size={11} color={clr.red} /></button>
          </div>
        </div>
      ))}
      {showForm && (
        <Modal open={true} onClose={() => setShowForm(false)} title={editItem ? "Edit" : "Add"}>
          {fields.map(f => <Field key={f.key} label={f.label}><input style={s.input} value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.label} /></Field>)}
          <button onClick={save} style={{ ...s.btn(), width: "100%" }}>Save</button>
        </Modal>
      )}
    </div>
  );
};

// MASTER MAIN SCREEN
const MasterScreen = ({ varieties, gradings, coldStorages, mandis, parties, opsV, opsG, opsCS, opsM, opsPA }) => {
  return (
    <div style={s.content}>
      <MasterSection title="Varieties" items={varieties} fields={[{ key: "name", label: "Variety Name" }]} ops={opsV} />
      <MasterSection title="Gradings" items={gradings} fields={[{ key: "name", label: "Grade Name" }]} ops={opsG} />
      <MasterSection title="Cold Storages" items={coldStorages} fields={[{ key: "name", label: "Name" }]} ops={opsCS} />
      <MasterSection title="Mandis" items={mandis} fields={[{ key: "name", label: "Name" }]} ops={opsM} />
      <MasterSection title="Parties" items={parties} fields={[{ key: "name", label: "Name" }, { key: "phone", label: "Phone" }]} ops={opsPA} />
    </div>
  );
};

// MAIN APP
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

  return (
    <div style={s.screen}>
      <div style={s.header}>
        <span style={{ fontWeight: 800, fontSize: 16, color: clr.accent }}>🥔 AlooTrader v4.1</span>
        <Badge v={activeTab.toUpperCase()} color={clr.blue} />
      </div>

      {activeTab === "dashboard" && <DashboardScreen purchases={purchases.data} dispatches={dispatches.data} sales={sales.data} />}
      {activeTab === "purchase" && <PurchaseScreen purchases={purchases.data} dispatches={dispatches.data} opsP={purchases} varieties={varieties.data} gradings={gradings.data} />}
      {activeTab === "dispatch" && <DispatchScreen dispatches={dispatches.data} purchases={purchases.data} opsD={dispatches} varieties={varieties.data} />}
      {activeTab === "sale" && <SaleScreen sales={sales.data} dispatches={dispatches.data} purchases={purchases.data} opsSales={sales} />}
      {activeTab === "pnl" && <PnLScreen sales={sales.data} purchases={purchases.data} dispatches={dispatches.data} />}
      {activeTab === "due" && <DueTrackingScreen sales={sales.data} purchases={purchases.data} dispatches={dispatches.data} coldStorages={coldStorages.data} parties={parties.data} />}
      {activeTab === "master" && <MasterScreen varieties={varieties.data} gradings={gradings.data} coldStorages={coldStorages.data} mandis={mandis.data} parties={parties.data} opsV={varieties} opsG={gradings} opsCS={coldStorages} opsM={mandis} opsPA={parties} />}

      <div style={s.navBar}>
        <button onClick={() => setActiveTab("dashboard")} style={s.navItem(activeTab === "dashboard")}>📊</button>
        <button onClick={() => setActiveTab("purchase")} style={s.navItem(activeTab === "purchase")}>📥</button>
        <button onClick={() => setActiveTab("dispatch")} style={s.navItem(activeTab === "dispatch")}>📤</button>
        <button onClick={() => setActiveTab("sale")} style={s.navItem(activeTab === "sale")}>💰</button>
        <button onClick={() => setActiveTab("pnl")} style={s.navItem(activeTab === "pnl")}>📊</button>
        <button onClick={() => setActiveTab("due")} style={s.navItem(activeTab === "due")}>💳</button>
        <button onClick={() => setActiveTab("master")} style={s.navItem(activeTab === "master")}>⚙️</button>
      </div>
    </div>
  );
}
