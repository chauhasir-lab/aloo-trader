import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cxjmwjljjnuthcrmnbqb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4am13amxqam51dGhjcm1uYnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTYzMzUsImV4cCI6MjA5MjY3MjMzNX0.ynRaceAT1uWcsPOJ_5vY_8NKolM3EaWKQajUEk4sLz8";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const useSupabaseTable = (tableName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    fetchData();
  }, [tableName]);

  const addItem = async (item) => {
    try {
      const payload = { ...item, created_at: new Date().toISOString() };
      if (payload.items && typeof payload.items !== "string") payload.items = JSON.stringify(payload.items);
      if (payload.lot_sales && typeof payload.lot_sales !== "string") payload.lot_sales = JSON.stringify(payload.lot_sales);

      const { data: d, error: err } = await supabase.from(tableName).insert([payload]).select();
      if (err) { alert(`Error saving: ${err.message}`); return null; }
      if (d && d.length > 0) {
        fetchData();
        return d[0];
      }
    } catch (e) { alert(`Error: ${e.message}`); return null; }
  };

  const editItem = async (id, updates) => {
    try {
      const payload = { ...updates };
      if (payload.items && typeof payload.items !== "string") payload.items = JSON.stringify(payload.items);
      if (payload.lot_sales && typeof payload.lot_sales !== "string") payload.lot_sales = JSON.stringify(payload.lot_sales);

      const { error: err } = await supabase.from(tableName).update(payload).eq("id", id);
      if (err) { alert(`Error updating: ${err.message}`); return false; }
      fetchData();
      return true;
    } catch (e) { alert(`Error: ${e.message}`); return false; }
  };

  const deleteItem = async (id) => {
    try {
      const { error: err } = await supabase.from(tableName).delete().eq("id", id);
      if (err) { alert(`Error deleting: ${err.message}`); return false; }
      fetchData();
      return true;
    } catch (e) { alert(`Error: ${e.message}`); return false; }
  };

  return { data, loading, error, addItem, editItem, deleteItem };
};

// UTILITIES
const uid = () => Math.random().toString(36).slice(2, 9).toUpperCase();
const fmt = (n, d = 0) => (isNaN(n) ? "0" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d }));
const today = () => new Date().toISOString().slice(0, 10);

const clr = { 
  bg: "#0f1117", card: "#1a1d26", card2: "#22263a", accent: "#f5a623", green: "#22c55e", 
  red: "#ef4444", blue: "#3b82f6", purple: "#a855f7", muted: "#6b7280", border: "#2d3148", text: "#f1f5f9", orange: "#f97316"
};

const Badge = ({ v, color = clr.accent }) => (
  <span style={{ background: color + "22", color: color, borderRadius: 4, padding: "3px 8px", fontSize: 11, fontWeight: 700, display: "inline-block" }}>
    {v}
  </span>
);

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={s.label}>{label}</div>
    {children}
  </div>
);

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
      <div style={{ background: clr.card, border: `1px solid ${clr.border}`, borderRadius: 12, width: "100%", maxWidth: 420, padding: 16, boxSizing: "border-box", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ ...s.rowBetween, marginBottom: 14 }}>
          <strong style={{ fontSize: 15, color: clr.accent }}>{title}</strong>
          <button onClick={onClose} style={{ background: "none", border: "none", color: clr.red, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};

const getRemainingBags = (purchase, dispatches = []) => {
  const dispatchedBags = dispatches.flatMap(d => d.items || []).filter(i => i.lot_id === purchase.lot_id).reduce((sum, i) => sum + (parseFloat(i.loaded_bags) || 0), 0);
  return (parseFloat(purchase.manual_bags) || 0) - dispatchedBags;
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
  btn: (bg = clr.accent, txt = "#000") => ({ width: "100%", background: bg, color: txt, border: "none", borderRadius: 6, padding: "10px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }),
  btnSm: (bg = clr.card2, txt = clr.text) => ({ background: bg, color: txt, border: `1px solid ${clr.border}`, borderRadius: 5, padding: "5px 10px", fontWeight: 600, fontSize: 11, cursor: "pointer" }),
  content: { padding: 12, paddingBottom: 80 },
  navBar: { position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", background: clr.card, borderTop: `1px solid ${clr.border}`, display: "flex", zIndex: 200 },
  navItem: (active) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 4px", gap: 2, background: "none", border: "none", color: active ? clr.accent : clr.muted, fontSize: 16, cursor: "pointer" }),
  divider: { height: 1, background: clr.border, margin: "6px 0" }
};

// ==========================================
// 1. DASHBOARD SCREEN
// ==========================================
const DashboardScreen = ({ purchases, dispatches, sales }) => {
  const activeLots = purchases.filter(p => getRemainingBags(p, dispatches) > 0).length;
  const closedLots = purchases.filter(p => getRemainingBags(p, dispatches) <= 0).length;

  const totalBagsPurchased = purchases.reduce((sum, p) => sum + (parseFloat(p.manual_bags) || 0), 0);
  const totalDispatchedBags = dispatches.flatMap(d => d.items || []).reduce((sum, i) => sum + (parseFloat(i.loaded_bags) || 0), 0);
  const remainingBags = totalBagsPurchased - totalDispatchedBags;

  return (
    <div style={s.content}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
        <div style={{ ...s.card2, background: clr.blue + "15" }}><div style={s.label}>Active Lots</div><div style={{ fontSize: 18, fontWeight: 800, color: clr.blue }}>{activeLots}</div></div>
        <div style={{ ...s.card2, background: clr.green + "15" }}><div style={s.label}>Closed Lots</div><div style={{ fontSize: 18, fontWeight: 800, color: clr.green }}>{closedLots}</div></div>
        <div style={{ ...s.card2, background: clr.purple + "15" }}><div style={s.label}>Total Dispatched</div><div style={{ fontSize: 16, fontWeight: 800, color: clr.purple }}>{totalDispatchedBags} Bags</div></div>
        <div style={{ ...s.card2, background: clr.orange + "15" }}><div style={s.label}>Total Remaining</div><div style={{ fontSize: 16, fontWeight: 800, color: clr.orange }}>{remainingBags} Bags</div></div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={s.label}>Recent Purchases (Last 3)</div>
        {purchases.slice(0, 3).map(p => (
          <div key={p.id} style={{ ...s.card2, fontSize: 12, display: "flex", justifyContent: "space-between" }}>
            <span>Lot {p.lot_id} ({p.farmer_name})</span><strong>{p.manual_bags} Bags</strong>
          </div>
        ))}

        <div style={{ ...s.label, marginTop: 10 }}>Recent Dispatches (Last 3)</div>
        {dispatches.slice(0, 3).map(d => (
          <div key={d.id} style={{ ...s.card2, fontSize: 12, display: "flex", justifyContent: "space-between" }}>
            <span>GP: {d.gatepass_id} ({d.vehicle_number})</span><span style={{ color: clr.blue }}>Sent</span>
          </div>
        ))}

        <div style={{ ...s.label, marginTop: 10 }}>Recent Sales (Last 3)</div>
        {sales.slice(0, 3).map(sl => (
          <div key={sl.id} style={{ ...s.card2, fontSize: 12, display: "flex", justifyContent: "space-between" }}>
            <span>GP Ref: {sl.gatepass_id}</span><span style={{ color: clr.green }}>₹{fmt(sl.total_sale_value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 2. PURCHASE SCREEN
// ==========================================
const PurchaseScreen = ({ purchases, dispatches, opsP, coldStorages }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ lot_id: "", farmer_name: "", manual_bags: "", total_weight: "", rate_per_bag: "", cold_storage_id: "", date: today() });
  
  const save = async () => {
    if (!form.lot_id || !form.farmer_name || !form.manual_bags || !form.rate_per_bag) return alert("Fill required fields!");
    const currentStdBags = form.total_weight ? (parseFloat(form.total_weight) / 52.5).toFixed(2) : "0.00";
    const currentTotalCost = (parseFloat(form.manual_bags) || 0) * (parseFloat(form.rate_per_bag) || 0);
    
    await opsP.addItem({ id: uid(), ...form, std_bags: currentStdBags, total_cost: currentTotalCost, is_closed: false });
    setShowForm(false);
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Purchases & Lots</span>
        <button onClick={() => { setForm({ lot_id: "", farmer_name: "", manual_bags: "", total_weight: "", rate_per_bag: "", cold_storage_id: "", date: today() }); setShowForm(true); }} style={{ ...s.btnSm(clr.accent, "#000") }}>+ New Entry</button>
      </div>

      {purchases.map(p => {
        const remaining = getRemainingBags(p, dispatches);
        const isClosed = remaining <= 0;
        return (
          <div key={p.id} style={{ ...s.card, borderLeft: `3px solid ${isClosed ? clr.red : clr.green}` }}>
            <div style={s.rowBetween}>
              <div style={s.row}>
                <Badge v={`Lot: ${p.lot_id}`} color={isClosed ? clr.red : clr.accent} />
                {isClosed && <span style={{ fontSize: 10, color: clr.red, fontWeight: "bold" }}>[CLOSED]</span>}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{p.farmer_name}</span>
            </div>
            <div style={s.divider} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span>Total: <strong>{p.manual_bags} Bags</strong></span>
              <span>Rate: <strong>₹{p.rate_per_bag}</strong></span>
              <span style={{ color: isClosed ? clr.red : clr.green }}>Remaining: <strong>{remaining}</strong></span>
            </div>
          </div>
        );
      })}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Purchase Record">
        <Field label="Lot ID"><input style={s.input} value={form.lot_id} onChange={e => setForm({ ...form, lot_id: e.target.value })} /></Field>
        <Field label="Farmer Name"><input style={s.input} value={form.farmer_name} onChange={e => setForm({ ...form, farmer_name: e.target.value })} /></Field>
        <Field label="Bags Count"><input type="number" style={s.input} value={form.manual_bags} onChange={e => setForm({ ...form, manual_bags: e.target.value })} /></Field>
        <Field label="Total Weight (Kg)"><input type="number" style={s.input} value={form.total_weight} onChange={e => setForm({ ...form, total_weight: e.target.value })} /></Field>
        <Field label="Rate Per Bag"><input type="number" style={s.input} value={form.rate_per_bag} onChange={e => setForm({ ...form, rate_per_bag: e.target.value })} /></Field>
        <Field label="Cold Storage Source"><select style={s.select} value={form.cold_storage_id} onChange={e => setForm({ ...form, cold_storage_id: e.target.value })}><option value="">Select Cold Storage</option>{coldStorages.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <button onClick={save} style={s.btn(clr.accent, "#000")}>Save Data</button>
      </Modal>
    </div>
  );
};

// ==========================================
// 3. DISPATCH SCREEN
// ==========================================
const DispatchScreen = ({ dispatches, purchases, opsD, parties, mandis, coldStorages }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ gatepass_id: "", vehicle_number: "", items: [], date: today(), destination_party_id: "", mandi_id: "", cold_storage_id: "" });
  const [itemForm, setItemForm] = useState({ lot_id: "", loaded_bags: "", loaded_weight: "" });

  const activeLots = purchases.filter(p => getRemainingBags(p, dispatches) > 0);

  const addItemSlot = () => {
    if (!itemForm.lot_id || !itemForm.loaded_bags || !itemForm.loaded_weight) return alert("Fill item mapping elements!");
    const matchedLot = purchases.find(p => p.lot_id === itemForm.lot_id);
    const remaining = getRemainingBags(matchedLot, dispatches);
    if (parseFloat(itemForm.loaded_bags) > remaining) return alert(`Only ${remaining} bags remaining in lot!`);
    
    setForm(prev => ({ ...prev, items: [...prev.items, { ...itemForm }] }));
    setItemForm({ lot_id: "", loaded_bags: "", loaded_weight: "" });
  };

  const save = async () => {
    if (!form.gatepass_id || !form.destination_party_id || form.items.length === 0) return alert("Fill form values completely!");
    await opsD.addItem({ ...form });
    setShowForm(false);
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Dispatch Logs</span>
        <button onClick={() => { setForm({ gatepass_id: "", vehicle_number: "", items: [], date: today(), destination_party_id: "", mandi_id: "", cold_storage_id: "" }); setShowForm(true); }} style={{ ...s.btnSm(clr.blue, "#fff") }}>+ Log Truck</button>
      </div>

      {dispatches.map(d => (
        <div key={d.id} style={s.card}>
          <div style={s.rowBetween}><Badge v={`GP: ${d.gatepass_id}`} color={clr.blue} /><span>{d.vehicle_number}</span></div>
          <div style={{ fontSize: 11, marginTop: 4, color: clr.muted }}>
            To Party: <strong>{parties.find(p => p.id === d.destination_party_id)?.name || "Direct Vendor"}</strong>
          </div>
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Create Dispatch Pass">
        <Field label="Gatepass ID"><input style={s.input} value={form.gatepass_id} onChange={e => setForm({ ...form, gatepass_id: e.target.value })} /></Field>
        <Field label="Vehicle Number"><input style={s.input} value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} /></Field>
        <Field label="Link Target Party"><select style={s.select} value={form.destination_party_id} onChange={e => setForm({ ...form, destination_party_id: e.target.value })}><option value="">Select Party Account</option>{parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Link Cold Storage Source"><select style={s.select} value={form.cold_storage_id} onChange={e => setForm({ ...form, cold_storage_id: e.target.value })}><option value="">Select Storage Space</option>{coldStorages.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        
        <div style={{ ...s.card2, background: clr.card, padding: 8 }}>
          <div style={s.label}>Append Active Inventory Lots</div>
          <select style={{ ...s.select, marginBottom: 4 }} value={itemForm.lot_id} onChange={e => setItemForm({ ...itemForm, lot_id: e.target.value })}><option value="">Select Lot</option>{activeLots.map(l => <option key={l.id} value={l.lot_id}>{l.lot_id}</option>)}</select>
          <input type="number" placeholder="Loaded Bags" style={{ ...s.input, marginBottom: 4 }} value={itemForm.loaded_bags} onChange={e => setItemForm({ ...itemForm, loaded_bags: e.target.value })} />
          <input type="number" placeholder="Weight (Kg)" style={{ ...s.input, marginBottom: 4 }} value={itemForm.loaded_weight} onChange={e => setItemForm({ ...itemForm, loaded_weight: e.target.value })} />
          <button onClick={addItemSlot} style={{ ...s.btnSm(clr.accent, "#000"), width: "100%" }}>Push Lot Item</button>
        </div>
        <button onClick={save} style={s.btn(clr.blue, "#fff")}>Save Outbound Logistics</button>
      </Modal>
    </div>
  );
};

// ==========================================
// 4. MANDI SALE SCREEN
// ==========================================
const SaleScreen = ({ sales, dispatches, opsSales }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ gatepass_id: "", date: today(), lot_sales: [] });

  const mapGatepassWeights = (gpId) => {
    const activeGp = dispatches.find(d => d.gatepass_id === gpId);
    if (activeGp) {
      const parsedItems = activeGp.items?.map(i => ({
        lot_id: i.lot_id, loaded_bags: i.loaded_bags, received_weight: i.loaded_weight, sale_rate_per_kg: 0
      })) || [];
      setForm(prev => ({ ...prev, gatepass_id: gpId, lot_sales: parsedItems }));
    }
  };

  const updateWeightRate = (idx, fields) => {
    const updatedArr = [...form.lot_sales];
    updatedArr[idx] = { ...updatedArr[idx], ...fields };
    setForm(prev => ({ ...prev, lot_sales: updatedArr }));
  };

  const computeTotals = () => {
    return form.lot_sales.reduce((sum, item) => sum + ((parseFloat(item.received_weight) || 0) * (parseFloat(item.sale_rate_per_kg) || 0)), 0);
  };

  const save = async () => {
    if (!form.gatepass_id || form.lot_sales.length === 0) return alert("Map parameters correctly!");
    const grossVal = computeTotals();
    await opsSales.addItem({ ...form, total_sale_value: grossVal, total_expenses: 0, net_profit: grossVal });
    setShowForm(false);
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Sales Ledger</span>
        <button onClick={() => { setForm({ gatepass_id: "", date: today(), lot_sales: [] }); setShowForm(true); }} style={{ ...s.btnSm(clr.green, "#fff") }}>+ File Sale</button>
      </div>

      {sales.map(sRec => (
        <div key={sRec.id} style={s.card}>
          <div style={s.rowBetween}><Badge v={`GP Link: ${sRec.gatepass_id}`} color={clr.green} /><strong>₹{fmt(sRec.total_sale_value)}</strong></div>
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Mandi Bill Mapping">
        <Field label="Link Dispatched Gatepass"><select style={s.select} value={form.gatepass_id} onChange={e => mapGatepassWeights(e.target.value)}><option value="">Select Dispatched Code</option>{dispatches.map(d => <option key={d.id} value={d.gatepass_id}>{d.gatepass_id}</option>)}</select></Field>
        {form.lot_sales.map((slot, idx) => (
          <div key={idx} style={{ ...s.card2, background: clr.card }}>
            <div>Lot Ref: {slot.lot_id} ({slot.loaded_bags} Bags)</div>
            <input type="number" placeholder="Sold Weight (Kg)" style={{ ...s.input, marginTop: 4, marginBottom: 4 }} value={slot.received_weight} onChange={e => updateWeightRate(idx, { received_weight: e.target.value })} />
            <input type="number" placeholder="Rate Per Kg" style={{ ...s.input }} value={slot.sale_rate_per_kg} onChange={e => updateWeightRate(idx, { sale_rate_per_kg: e.target.value })} />
          </div>
        ))}
        <button onClick={save} style={s.btn(clr.green, "#fff")}>Commit Sale Matrix</button>
      </Modal>
    </div>
  );
};

// ==========================================
// 5. LIVE PAYMENTS & DUES SCREEN
// ==========================================
const DueTrackingScreen = ({ sales, purchases, dispatches, coldStorages, parties, opsPayments, paymentLogs }) => {
  const [showModal, setShowModal] = useState(false);
  const [payForm, setPayForm] = useState({ entity_id: "", type: "party", amount: "", method: "UPI", remarks: "" });

  const computedParties = parties.map(p => {
    // Total cost when we purchase from farmer/party
    const buyCost = purchases.filter(pr => pr.farmer_name === p.name).reduce((sum, pr) => sum + (parseFloat(pr.total_cost) || 0), 0);
    // Sales tracked against dispatches assigned to this party
    const partyGps = dispatches.filter(d => d.destination_party_id === p.id).map(d => d.gatepass_id);
    const saleRevenue = sales.filter(s => partyGps.includes(s.gatepass_id)).reduce((sum, s) => sum + (parseFloat(s.total_sale_value) || 0), 0);
    
    const operationalDue = saleRevenue - buyCost;
    const paidSum = paymentLogs.filter(pl => pl.entity_id === p.id && pl.type === "party").reduce((sum, pl) => sum + (parseFloat(pl.amount) || 0), 0);
    return { ...p, finalDue: operationalDue - paidSum };
  });

  const computedColdStorages = coldStorages.map(cs => {
    const csBags = dispatches.filter(d => d.cold_storage_id === cs.id).flatMap(d => d.items || []).reduce((sum, i) => sum + (parseFloat(i.loaded_bags) || 0), 0);
    const baselineDue = csBags * 2.5; 
    const paidSum = paymentLogs.filter(pl => pl.entity_id === cs.id && pl.type === "cold").reduce((sum, pl) => sum + (parseFloat(pl.amount) || 0), 0);
    return { ...cs, finalDue: baselineDue - paidSum };
  });

  const savePaymentLog = async () => {
    if (!payForm.entity_id || !payForm.amount) return alert("Provide valid input limits!");
    await opsPayments.addItem({ id: uid(), ...payForm, date: today() });
    setShowModal(false);
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Automated Financials</span>
        <button onClick={() => { setPayForm({ entity_id: "", type: "party", amount: "", method: "UPI", remarks: "" }); setShowModal(true); }} style={{ ...s.btnSm(clr.purple, "#fff") }}>💸 Record Payment</button>
      </div>

      <div style={s.label}>Live Party Receivables & Payables</div>
      {computedParties.map(p => (
        <div key={p.id} style={s.card2}>
          <div style={s.rowBetween}><span>{p.name}</span><strong style={{ color: p.finalDue >= 0 ? clr.green : clr.red }}>₹{fmt(p.finalDue)}</strong></div>
        </div>
      ))}

      <div style={{ ...s.label, marginTop: 14 }}>Cold Storage Outstandings</div>
      {computedColdStorages.map(cs => (
        <div key={cs.id} style={s.card2}>
          <div style={s.rowBetween}><span>{cs.name}</span><strong style={{ color: clr.orange }}>₹{fmt(cs.finalDue)}</strong></div>
        </div>
      ))}

      <div style={{ ...s.label, marginTop: 14 }}>Recent Transaction Entries</div>
      {paymentLogs.map(pm => (
        <div key={pm.id} style={{ ...s.card2, fontSize: 11 }}>
          <div style={s.rowBetween}>
            <span>{pm.method} - {pm.remarks || "Direct Entry"}</span>
            <strong style={{ color: clr.accent }}>₹{fmt(pm.amount)}</strong>
          </div>
        </div>
      ))}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Log Payment Transaction">
        <Field label="Ledger Filter Type"><select style={s.select} value={payForm.type} onChange={e => setPayForm({ ...payForm, type: e.target.value, entity_id: "" })}><option value="party">Party Ledger</option><option value="cold">Cold Storage Unit</option></select></Field>
        <Field label="Select Target Account"><select style={s.select} value={payForm.entity_id} onChange={e => setPayForm({ ...payForm, entity_id: e.target.value })}><option value="">Select Identity</option>{payForm.type === "party" ? computedParties.map(p => <option key={p.id} value={p.id}>{p.name}</option>) : computedColdStorages.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Payment Methodology Options"><select style={s.select} value={payForm.method} onChange={e => setPayForm({ ...payForm, method: e.target.value })}><option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Cheque">Cheque</option><option value="RTGS/IMPS">RTGS/IMPS</option></select></Field>
        <Field label="Amount"><input type="number" style={s.input} value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} /></Field>
        <Field label="Remarks"><input style={s.input} value={payForm.remarks} onChange={e => setPayForm({ ...payForm, remarks: e.target.value })} /></Field>
        <button onClick={savePaymentLog} style={s.btn(clr.purple, "#fff")}>Commit Transaction</button>
      </Modal>
    </div>
  );
};

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Custom Hook Instances
  const coldStorages = useSupabaseTable("cold_storages");
  const parties = useSupabaseTable("parties");
  const purchases = useSupabaseTable("purchases");
  const dispatches = useSupabaseTable("dispatches");
  const sales = useSupabaseTable("sales");
  const payments = useSupabaseTable("payments");
  const mandis = useSupabaseTable("mandis");

  return (
    <div style={s.screen}>
      <div style={s.header}>
        <span style={{ fontWeight: 800, fontSize: 16, color: clr.accent }}>🥔 AlooTrader v4.5</span>
        <Badge v={activeTab.toUpperCase()} color={clr.blue} />
      </div>

      {activeTab === "dashboard" && <DashboardScreen purchases={purchases.data} dispatches={dispatches.data} sales={sales.data} />}
      {activeTab === "purchase" && <PurchaseScreen purchases={purchases.data} dispatches={dispatches.data} opsP={purchases} coldStorages={coldStorages.data} />}
      {activeTab === "dispatch" && <DispatchScreen dispatches={dispatches.data} purchases={purchases.data} opsD={dispatches} parties={parties.data} mandis={mandis.data} coldStorages={coldStorages.data} />}
      {activeTab === "sale" && <SaleScreen sales={sales.data} dispatches={dispatches.data} opsSales={sales} />}
      {activeTab === "due" && <DueTrackingScreen sales={sales.data} purchases={purchases.data} dispatches={dispatches.data} coldStorages={coldStorages.data} parties={parties.data} opsPayments={payments} paymentLogs={payments.data} />}

      <div style={s.navBar}>
        <button onClick={() => setActiveTab("dashboard")} style={s.navItem(activeTab === "dashboard")}>📊<span style={{fontSize:9, display:'block'}}>Dash</span></button>
        <button onClick={() => setActiveTab("purchase")} style={s.navItem(activeTab === "purchase")}>📥<span style={{fontSize:9, display:'block'}}>Buy</span></button>
        <button onClick={() => setActiveTab("dispatch")} style={s.navItem(activeTab === "dispatch")}>📤<span style={{fontSize:9, display:'block'}}>Ship</span></button>
        <button onClick={() => setActiveTab("sale")} style={s.navItem(activeTab === "sale")}>💰<span style={{fontSize:9, display:'block'}}>Sale</span></button>
        <button onClick={() => setActiveTab("due")} style={s.navItem(activeTab === "due")}>💳<span style={{fontSize:9, display:'block'}}>Pay</span></button>
      </div>
    </div>
  );
}
