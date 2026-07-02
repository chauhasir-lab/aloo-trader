import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cxjmwjljjnuthcrmnbqb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4am13amxqam51dGhjcm1uYnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTYzMzUsImV4cCI6MjA5MjY3MjMzNX0.ynRaceAT1uWcsPOJ_5vY_8NKolM3EaWKQajUEk4sLz8";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// CUSTOM HOOK WITH EDIT & DELETE
// ==========================================
const useSupabaseTable = (tableName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: rows, error: err } = await supabase.from(tableName).select("*").order("created_at", { ascending: false });
      if (err) { setError(err.message); return; }
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
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [tableName]);

  const addItem = async (item) => {
    try {
      const payload = { ...item, created_at: new Date().toISOString() };
      if (payload.items && typeof payload.items !== "string") payload.items = JSON.stringify(payload.items);
      if (payload.lot_sales && typeof payload.lot_sales !== "string") payload.lot_sales = JSON.stringify(payload.lot_sales);

      const { data: d, error: err } = await supabase.from(tableName).insert([payload]).select();
      if (err) { alert(`Error saving: ${err.message}`); return null; }
      fetchData();
      return d[0];
    } catch (e) { alert(`Error: ${e.message}`); return null; }
  };

  const updateItem = async (id, updatedFields) => {
    try {
      const payload = { ...updatedFields };
      if (payload.items && typeof payload.items !== "string") payload.items = JSON.stringify(payload.items);
      if (payload.lot_sales && typeof payload.lot_sales !== "string") payload.lot_sales = JSON.stringify(payload.lot_sales);

      const { error: err } = await supabase.from(tableName).update(payload).eq("id", id);
      if (err) { alert(`Error updating: ${err.message}`); return false; }
      fetchData();
      return true;
    } catch (e) { alert(`Error: ${e.message}`); return false; }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Kya aap sach me is entry ko delete karna chahte hain?")) return false;
    try {
      const { error: err } = await supabase.from(tableName).delete().eq("id", id);
      if (err) { alert(`Error deleting: ${err.message}`); return false; }
      fetchData();
      return true;
    } catch (e) { alert(`Error: ${e.message}`); return false; }
  };

  return { data, loading, error, addItem, updateItem, deleteItem, refresh: fetchData };
};

// UTILITIES
const uid = () => Math.random().toString(36).slice(2, 9).toUpperCase();
const fmt = (n, d = 0) => (isNaN(n) || n === null || n === undefined ? "0" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d }));
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
    <div style={{ fontSize: 10, color: clr.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
    {children}
  </div>
);

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
      <div style={{ background: clr.card, border: `1px solid ${clr.border}`, borderRadius: 12, width: "100%", maxWidth: 420, padding: 16, boxSizing: "border-box", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <strong style={{ fontSize: 15, color: clr.accent }}>{title}</strong>
          <button onClick={onClose} style={{ background: "none", border: "none", color: clr.red, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};

// GLOBAL REMAINING BAGS FINDER
const getRemainingBags = (purchase, dispatches = []) => {
  const dispatchedBags = dispatches
    .flatMap(d => d.items || [])
    .filter(i => i.lot_id === purchase.lot_id)
    .reduce((sum, i) => sum + (parseFloat(i.loaded_bags) || 0), 0);
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
  btn: (bg = clr.accent, txt = "#000") => ({ width: "100%", background: bg, color: txt, border: "none", borderRadius: 6, padding: "10px", fontWeight: 700, fontSize: 13, cursor: "pointer" }),
  btnSm: (bg = clr.card2, txt = clr.text) => ({ background: bg, color: txt, border: `1px solid ${clr.border}`, borderRadius: 5, padding: "5px 10px", fontWeight: 600, fontSize: 11, cursor: "pointer" }),
  content: { padding: 12, paddingBottom: 80 },
  navBar: { position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", background: clr.card, borderTop: `1px solid ${clr.border}`, display: "flex", zIndex: 200 },
  navItem: (active) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 4px", gap: 2, background: "none", border: "none", color: active ? clr.accent : clr.muted, fontSize: 16, cursor: "pointer" }),
  divider: { height: 1, background: clr.border, margin: "6px 0" }
};

// ==========================================
// WHATSAPP POPUP COMPONENT
// ==========================================
const WhatsappPopup = ({ msg, onClose }) => {
  if (!msg) return null;
  const copyText = () => {
    navigator.clipboard.writeText(msg);
    alert("Message Copy ho gaya hai! Ab aap WhatsApp par share kar sakte hain.");
  };
  return (
    <Modal open={!!msg} onClose={onClose} title="🚀 Dispatch WhatsApp Summary">
      <pre style={{ background: clr.bg, padding: 10, borderRadius: 6, color: "#fff", fontSize: 11, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{msg}</pre>
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        <button onClick={copyText} style={s.btn(clr.green, "#fff")}>📋 Copy Message</button>
        <button onClick={onClose} style={s.btn(clr.card2, clr.text)}>Close</button>
      </div>
    </Modal>
  );
};

// ==========================================
// 1. DASHBOARD SCREEN
// ==========================================
const DashboardScreen = ({ purchases, dispatches, sales, payments }) => {
  const activeLots = purchases.filter(p => getRemainingBags(p, dispatches) > 0).length;
  const closedLots = purchases.filter(p => getRemainingBags(p, dispatches) <= 0).length;
  
  const totalBagsPurchased = purchases.reduce((sum, p) => sum + (parseFloat(p.manual_bags) || 0), 0);
  const totalDispatchedBags = dispatches.flatMap(d => d.items || []).reduce((sum, i) => sum + (parseFloat(i.loaded_bags) || 0), 0);
  const remainingBags = totalBagsPurchased - totalDispatchedBags;

  const totalSales = sales.reduce((sum, s) => {
    const subTot = (s.lot_sales || []).reduce((sm, l) => sm + ((parseFloat(l.received_weight) || 0) * (parseFloat(l.rate_per_kg) || 0)), 0);
    return sum + subTot;
  }, 0);

  const totalPaymentsReceived = payments.filter(p => p.type === "PARTY_RECEIPT").reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const pending = totalSales - totalPaymentsReceived;

  return (
    <div style={s.content}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
        <div style={{ ...s.card2, background: clr.blue + "15" }}>
          <div style={{ fontSize: 10, color: clr.muted, fontWeight: 700 }}>ACTIVE LOTS</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: clr.blue }}>{activeLots}</div>
        </div>
        <div style={{ ...s.card2, background: clr.red + "15" }}>
          <div style={{ fontSize: 10, color: clr.muted, fontWeight: 700 }}>CLOSED LOTS</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: clr.red }}>{closedLots}</div>
        </div>
        <div style={{ ...s.card2, background: clr.green + "15" }}>
          <div style={{ fontSize: 10, color: clr.muted, fontWeight: 700 }}>DISPATCHED</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: clr.green }}>{totalDispatchedBags} bags</div>
        </div>
        <div style={{ ...s.card2, background: clr.orange + "15" }}>
          <div style={{ fontSize: 10, color: clr.muted, fontWeight: 700 }}>STOCK REMAINING</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: clr.orange }}>{remainingBags} bags</div>
        </div>
      </div>

      <div style={s.card}>
        <div style={{ fontSize: 10, color: clr.muted, fontWeight: 700, marginBottom: 8 }}>PARTY OUTSTANDINGS</div>
        <div style={s.divider} />
        <div style={{ fontSize: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span>Total Sales Value:</span>
            <strong style={{ color: clr.green }}>₹{fmt(totalSales)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span>Received from Parties:</span>
            <strong>₹{fmt(totalPaymentsReceived)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Net Pending Due:</span>
            <strong style={{ color: clr.orange }}>₹{fmt(pending)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. PURCHASE SCREEN (WITH EDIT & DELETE)
// ==========================================
const PurchaseScreen = ({ purchases, dispatches, opsP, coldStorages, gradings, varieties }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ lot_id: "", farmer_name: "", manual_bags: "", total_weight: "", rate_per_bag: "", cold_storage_id: "", grading: "", variety: "", date: today() });

  const openEdit = (p) => {
    setEditingId(p.id);
    setForm({ ...p });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.lot_id || !form.farmer_name || !form.manual_bags || !form.rate_per_bag) return alert("Fill all fields!");
    const stdBags = form.total_weight ? (parseFloat(form.total_weight) / 52.5).toFixed(2) : "0";
    const totalCost = (parseFloat(form.manual_bags) || 0) * (parseFloat(form.rate_per_bag) || 0);
    
    const dataPayload = { ...form, std_bags: stdBags, total_cost: totalCost };

    if (editingId) {
      await opsP.updateItem(editingId, dataPayload);
    } else {
      await opsP.addItem({ id: uid(), ...dataPayload });
    }
    
    setForm({ lot_id: "", farmer_name: "", manual_bags: "", total_weight: "", rate_per_bag: "", cold_storage_id: "", grading: "", variety: "", date: today() });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div style={s.content}>
      <div style={s.rowBetween}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Purchases</div>
        <button onClick={() => { setEditingId(null); setShowForm(true); }} style={{ ...s.btnSm(clr.accent, "#000") }}>+ New</button>
      </div>

      {purchases.map(p => {
        const rem = getRemainingBags(p, dispatches);
        const closed = rem <= 0;
        return (
          <div key={p.id} style={{ ...s.card, borderLeft: `3px solid ${closed ? clr.red : clr.green}` }}>
            <div style={s.rowBetween}>
              <Badge v={p.lot_id} color={closed ? clr.red : clr.accent} />
              <div style={s.row}>
                <button onClick={() => openEdit(p)} style={s.btnSm(clr.card2, clr.text)}>Edit</button>
                <button onClick={() => opsP.deleteItem(p.id)} style={s.btnSm(clr.red + "22", clr.red)}>Del</button>
              </div>
            </div>
            <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>{p.farmer_name} <span style={{fontSize:10, color:clr.muted}}>({p.variety} | {p.grading})</span></div>
            <div style={s.divider} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11 }}>
              <div><span style={{ fontSize: 10, color: clr.muted }}>BAGS</span><div style={{ fontWeight: 700 }}>{p.manual_bags}</div></div>
              <div><span style={{ fontSize: 10, color: clr.muted }}>RATE</span><div style={{ fontWeight: 700 }}>₹{p.rate_per_bag}</div></div>
              <div><span style={{ fontSize: 10, color: clr.muted }}>COST</span><div style={{ fontWeight: 700, color: clr.accent }}>₹{fmt(p.total_cost)}</div></div>
              <div><span style={{ fontSize: 10, color: clr.muted }}>STOCK</span><div style={{ fontWeight: 700, color: closed ? clr.red : clr.green }}>{rem}</div></div>
            </div>
          </div>
        );
      })}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingId ? "Edit Purchase" : "Add Purchase"}>
        <Field label="Lot ID"><input style={s.input} value={form.lot_id} onChange={e => setForm({ ...form, lot_id: e.target.value })} placeholder="LOT001" /></Field>
        <Field label="Farmer Name"><input style={s.input} value={form.farmer_name} onChange={e => setForm({ ...form, farmer_name: e.target.value })} /></Field>
        <Field label="Bags"><input type="number" style={s.input} value={form.manual_bags} onChange={e => setForm({ ...form, manual_bags: e.target.value })} /></Field>
        <Field label="Weight (kg)"><input type="number" style={s.input} value={form.total_weight} onChange={e => setForm({ ...form, total_weight: e.target.value })} /></Field>
        <Field label="Rate/Bag"><input type="number" style={s.input} value={form.rate_per_bag} onChange={e => setForm({ ...form, rate_per_bag: e.target.value })} /></Field>
        <Field label="Cold Storage"><select style={s.select} value={form.cold_storage_id} onChange={e => setForm({ ...form, cold_storage_id: e.target.value })}><option value="">Select</option>{coldStorages.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Variety"><select style={s.select} value={form.variety} onChange={e => setForm({ ...form, variety: e.target.value })}><option value="">Select</option>{varieties.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}</select></Field>
        <Field label="Grading"><select style={s.select} value={form.grading} onChange={e => setForm({ ...form, grading: e.target.value })}><option value="">Select</option>{gradings.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}</select></Field>
        <button onClick={save} style={s.btn()}>Save</button>
      </Modal>
    </div>
  );
};

// ==========================================
// 3. DISPATCH SCREEN (WITH AUTO VALUE & WS SUMMARY)
// ==========================================
const DispatchScreen = ({ dispatches, purchases, opsD, parties, mandis }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [wsMsg, setWsMsg] = useState("");
  const [form, setForm] = useState({ gatepass_id: "", vehicle_number: "", driver_name: "", items: [], date: today(), destination_party_id: "", mandi_id: "" });
  const [itemForm, setItemForm] = useState({ lot_id: "", loaded_bags: "", loaded_weight: "", rate_per_bag: 0, value: 0, variety: "", grading: "" });

  const activeLots = purchases.filter(p => getRemainingBags(p, dispatches) > 0 || (editingId && p.lot_id));

  const handleLotSelect = (lotId) => {
    const lot = purchases.find(p => p.lot_id === lotId);
    if (lot) {
      setItemForm({
        ...itemForm,
        lot_id: lotId,
        rate_per_bag: lot.rate_per_bag,
        variety: lot.variety || "N/A",
        grading: lot.grading || "N/A"
      });
    }
  };

  const handleBagsChange = (bags) => {
    const calculatedValue = (parseFloat(bags) || 0) * (parseFloat(itemForm.rate_per_bag) || 0);
    setItemForm({ ...itemForm, loaded_bags: bags, value: calculatedValue });
  };

  const addItem = () => {
    if (!itemForm.lot_id || !itemForm.loaded_bags || !itemForm.loaded_weight) return alert("Sari fields bharein!");
    setForm(p => ({ ...p, items: [...p.items, { ...itemForm }] }));
    setItemForm({ lot_id: "", loaded_bags: "", loaded_weight: "", rate_per_bag: 0, value: 0, variety: "", grading: "" });
  };

  const openEdit = (d) => {
    setEditingId(d.id);
    setForm({ ...d });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.gatepass_id || form.items.length === 0) return alert("Gatepass aur items zaroori hain!");
    
    let success = false;
    if (editingId) {
      success = await opsD.updateItem(editingId, form);
    } else {
      const res = await opsD.addItem({ id: uid(), ...form });
      success = !!res;
    }

    if (success) {
      // Create WhatsApp summary format
      let summary = `📝 *DISPATCH GATEPASS SUMMARY*\n\n`;
      summary += `*GP No:* ${form.gatepass_id}\n`;
      summary += `*Vehicle:* ${form.vehicle_number}\n`;
      summary += `*Driver:* ${form.driver_name}\n`;
      summary += `-------------------------\n`;
      form.items.forEach((i, index) => {
        summary += `${index + 1}) *Lot:* ${i.lot_id}\n`;
        summary += `   *Bags:* ${i.loaded_bags} Bags\n`;
        summary += `   *Weight:* ${i.loaded_weight} Kg\n`;
        summary += `   *Variety:* ${i.variety} | *Grading:* ${i.grading}\n\n`;
      });
      summary += `*Total Loaded Bags:* ${form.items.reduce((s, i) => s + (parseFloat(i.loaded_bags) || 0), 0)}`;
      
      setShowForm(false);
      setEditingId(null);
      setWsMsg(summary);
    }
  };

  return (
    <div style={s.content}>
      <div style={s.rowBetween}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Dispatches</div>
        <button onClick={() => { setEditingId(null); setForm({ gatepass_id: "", vehicle_number: "", driver_name: "", items: [], date: today(), destination_party_id: "", mandi_id: "" }); setShowForm(true); }} style={{ ...s.btnSm(clr.blue, "#fff") }}>+ New</button>
      </div>

      {dispatches.map(d => (
        <div key={d.id} style={s.card}>
          <div style={s.rowBetween}>
            <Badge v={`GP: ${d.gatepass_id}`} color={clr.blue} />
            <div style={s.row}>
              <button onClick={() => openEdit(d)} style={s.btnSm(clr.card2, clr.text)}>Edit</button>
              <button onClick={() => opsD.deleteItem(d.id)} style={s.btnSm(clr.red + "22", clr.red)}>Del</button>
            </div>
          </div>
          <div style={{ fontSize: 11, color: clr.muted, marginTop: 4 }}>
            {d.vehicle_number} • {d.items?.length || 0} Lots • {d.items?.reduce((s, i) => s + (parseFloat(i.loaded_bags) || 0), 0) || 0} Bags
          </div>
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingId ? "Edit Dispatch" : "Create Dispatch"}>
        <Field label="Gatepass ID"><input style={s.input} value={form.gatepass_id} onChange={e => setForm({ ...form, gatepass_id: e.target.value })} /></Field>
        <Field label="Vehicle"><input style={s.input} value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} /></Field>
        <Field label="Driver"><input style={s.input} value={form.driver_name} onChange={e => setForm({ ...form, driver_name: e.target.value })} /></Field>
        <Field label="Party"><select style={s.select} value={form.destination_party_id} onChange={e => setForm({ ...form, destination_party_id: e.target.value })}><option value="">Select Party</option>{parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Mandi"><select style={s.select} value={form.mandi_id} onChange={e => setForm({ ...form, mandi_id: e.target.value })}><option value="">Select Mandi</option>{mandis.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
        
        <div style={{ ...s.card2, background: clr.card, padding: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: clr.accent, marginBottom: 6 }}>ADD/APPEND LOT</div>
          <select style={{ ...s.select, marginBottom: 6 }} value={itemForm.lot_id} onChange={e => handleLotSelect(e.target.value)}><option value="">Select Lot</option>{activeLots.map(l => <option key={l.id} value={l.lot_id}>{l.lot_id}</option>)}</select>
          <input type="number" placeholder="Bags" style={{ ...s.input, marginBottom: 6 }} value={itemForm.loaded_bags} onChange={e => handleBagsChange(e.target.value)} />
          <input type="number" placeholder="Weight (kg)" style={{ ...s.input, marginBottom: 6 }} value={itemForm.loaded_weight} onChange={e => setItemForm({ ...itemForm, loaded_weight: e.target.value })} />
          
          {itemForm.lot_id && (
            <div style={{ fontSize: 11, marginBottom: 6, color: clr.green }}>
              Auto Cost: ₹{fmt(itemForm.value)} ({itemForm.variety} | {itemForm.grading})
            </div>
          )}
          <button onClick={addItem} style={{ ...s.btnSm(clr.accent + "22", clr.accent), width: "100%" }}>+ Add Lot to Dispatch</button>
        </div>

        {form.items.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: clr.muted, marginBottom: 4 }}>LOTS ATTACHED</div>
            {form.items.map((i, idx) => (
              <div key={idx} style={{ ...s.card2, marginBottom: 4, fontSize: 11, display:'flex', justifyContent:'space-between' }}>
                <div>{i.lot_id} • {i.loaded_bags} Bags • {i.loaded_weight}kg • Value: ₹{fmt(i.value)}</div>
                <button onClick={() => setForm(p => ({ ...p, items: p.items.filter((_, gId) => gId !== idx) }))} style={{ background:'none', border:'none', color:clr.red }}>✕</button>
              </div>
            ))}
          </div>
        )}

        <button onClick={save} style={s.btn(clr.blue, "#fff")}>Confirm & Save</button>
      </Modal>

      <WhatsappPopup msg={wsMsg} onClose={() => setWsMsg("")} />
    </div>
  );
};

// ==========================================
// 4. SALE SCREEN (EXPENSES & EQUAL SPLIT)
// ==========================================
const SaleScreen = ({ sales, dispatches, opsSales }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ gatepass_id: "", date: today(), lot_sales: [], commission_pct: 0, hamali_per_bag: 0, gatepass_expense: 0, transport_expense: 0 });

  const loadGatepass = (gpId) => {
    const d = dispatches.find(x => x.gatepass_id === gpId);
    if (d) {
      const lotSales = d.items?.map(i => ({
        lot_id: i.lot_id,
        loaded_bags: i.loaded_bags,
        loaded_weight: i.loaded_weight,
        received_weight: i.loaded_weight, 
        rate_per_kg: 0,
        original_value: i.value || 0
      })) || [];
      setForm(p => ({ ...p, gatepass_id: gpId, lot_sales: lotSales }));
    }
  };

  const updateLot = (idx, updates) => {
    const updated = [...form.lot_sales];
    updated[idx] = { ...updated[idx], ...updates };
    setForm(p => ({ ...p, lot_sales: updated }));
  };

  const openEdit = (sale) => {
    setEditingId(sale.id);
    setForm({ ...sale });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.gatepass_id || form.lot_sales.length === 0) return alert("Fill mandatory fields!");
    
    // Equal split calculations
    const totalLots = form.lot_sales.length;
    const splitGatepass = (parseFloat(form.gatepass_expense) || 0) / totalLots;
    const splitTransport = (parseFloat(form.transport_expense) || 0) / totalLots;

    const finalLotSales = form.lot_sales.map(lot => {
      const saleVal = (parseFloat(lot.received_weight) || 0) * (parseFloat(lot.rate_per_kg) || 0);
      const weightLoss = (parseFloat(lot.loaded_weight) || 0) - (parseFloat(lot.received_weight) || 0);
      
      const commVal = saleVal * ((parseFloat(form.commission_pct) || 0) / 100);
      const hamaliVal = (parseFloat(lot.loaded_bags) || 0) * (parseFloat(form.hamali_per_bag) || 0);
      
      const totalAllocatedExpense = commVal + hamaliVal + splitGatepass + splitTransport;
      const netEarnings = saleVal - totalAllocatedExpense;
      const netProfitLoss = netEarnings - (parseFloat(lot.original_value) || 0);

      return {
        ...lot,
        sale_value: saleVal,
        weight_loss: weightLoss,
        allocated_expense: totalAllocatedExpense,
        profit_loss: netProfitLoss
      };
    });

    const payload = { ...form, lot_sales: finalLotSales };

    if (editingId) {
      await opsSales.updateItem(editingId, payload);
    } else {
      await opsSales.addItem({ id: uid(), ...payload });
    }

    setForm({ gatepass_id: "", date: today(), lot_sales: [], commission_pct: 0, hamali_per_bag: 0, gatepass_expense: 0, transport_expense: 0 });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div style={s.content}>
      <div style={s.rowBetween}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Mandi Sales</div>
        <button onClick={() => { setEditingId(null); setShowForm(true); }} style={{ ...s.btnSm(clr.purple, "#fff") }}>+ New Sale</button>
      </div>

      {sales.map(sal => (
        <div key={sal.id} style={s.card}>
          <div style={s.rowBetween}>
            <Badge v={`GP Reference: ${sal.gatepass_id}`} color={clr.purple} />
            <div style={s.row}>
              <button onClick={() => openEdit(sal)} style={s.btnSm(clr.card2, clr.text)}>Edit</button>
              <button onClick={() => opsSales.deleteItem(sal.id)} style={s.btnSm(clr.red + "22", clr.red)}>Del</button>
            </div>
          </div>
          {sal.lot_sales?.map((l, idx) => (
            <div key={idx} style={{ fontSize: 11, marginTop: 4, background: clr.card2, padding: 6, borderRadius: 4 }}>
              <div><strong>Lot {l.lot_id}</strong> | Profit/Loss: <span style={{ color: l.profit_loss >= 0 ? clr.green : clr.red, fontWeight:'bold' }}>₹{fmt(l.profit_loss)}</span></div>
              <div style={{ color: clr.muted, fontSize: 10 }}>Loss Wt: {l.weight_loss} kg | Total Allocated Exp: ₹{fmt(l.allocated_expense)}</div>
            </div>
          ))}
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Mandi Billing Entry">
        <Field label="Load Gatepass"><select style={s.select} value={form.gatepass_id} onChange={e => loadGatepass(e.target.value)}><option value="">Select Dispatch</option>{dispatches.map(d => <option key={d.id} value={d.gatepass_id}>{d.gatepass_id}</option>)}</select></Field>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <Field label="Commission %"><input type="number" style={s.input} value={form.commission_pct} onChange={e => setForm({ ...form, commission_pct: e.target.value })} /></Field>
          <Field label="Hamali / Bag"><input type="number" style={s.input} value={form.hamali_per_bag} onChange={e => setForm({ ...form, hamali_per_bag: e.target.value })} /></Field>
          <Field label="Mandi Gatepass (₹)"><input type="number" style={s.input} value={form.gatepass_expense} onChange={e => setForm({ ...form, gatepass_expense: e.target.value })} /></Field>
          <Field label="Transport (₹)"><input type="number" style={s.input} value={form.transport_expense} onChange={e => setForm({ ...form, transport_expense: e.target.value })} /></Field>
        </div>

        {form.lot_sales.map((lot, idx) => (
          <div key={idx} style={{ ...s.card2, padding: 8, marginTop: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: clr.accent }}>LOT: {lot.lot_id} (Load Wt: {lot.loaded_weight}kg)</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:4 }}>
              <Field label="Recd Wt (kg)"><input type="number" style={s.input} value={lot.received_weight} onChange={e => updateLot(idx, { received_weight: e.target.value })} /></Field>
              <Field label="Sale Rate/kg"><input type="number" style={s.input} value={lot.rate_per_kg} onChange={e => updateLot(idx, { rate_per_kg: e.target.value })} /></Field>
            </div>
          </div>
        ))}

        <button onClick={save} style={{ ...s.btn(clr.purple, "#fff"), marginTop: 10 }}>Process & Calculate Split</button>
      </Modal>
    </div>
  );
};

// ==========================================
// 5. MASTER UTILITIES MANAGEMENT SCREEN
// ==========================================
const MasterScreen = ({ coldStorages, parties, mandis, gradings, varieties, opsCs, opsParties, opsMandis, opsG, opsV }) => {
  const [activeTab, setActiveTab] = useState("COLD");
  const [name, setName] = useState("");

  const handleAdd = async () => {
    if (!name) return;
    const payload = { id: uid(), name };
    if (activeTab === "COLD") await opsCs.addItem(payload);
    if (activeTab === "PARTY") await opsParties.addItem(payload);
    if (activeTab === "MANDI") await opsMandis.addItem(payload);
    if (activeTab === "GRADING") await opsG.addItem(payload);
    if (activeTab === "VARIETY") await opsV.addItem(payload);
    setName("");
  };

  const getList = () => {
    if (activeTab === "COLD") return { data: coldStorages, ops: opsCs };
    if (activeTab === "PARTY") return { data: parties, ops: opsParties };
    if (activeTab === "MANDI") return { data: mandis, ops: opsMandis };
    if (activeTab === "GRADING") return { data: gradings, ops: opsG };
    return { data: varieties, ops: opsV };
  };

  const current = getList();

  return (
    <div style={s.content}>
      <div style={{ display: "flex", gap: 4, overflowX: "auto", marginBottom: 10 }}>
        {["COLD", "PARTY", "MANDI", "GRADING", "VARIETY"].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={s.btnSm(activeTab === t ? clr.accent : clr.card2, activeTab === t ? "#000" : clr.text)}>{t}</button>
        ))}
      </div>

      <div style={s.row}>
        <input style={s.input} placeholder={`Add New ${activeTab}`} value={name} onChange={e => setName(e.target.value)} />
        <button onClick={handleAdd} style={{ ...s.btnSm(clr.green, "#fff"), padding: "8px 14px" }}>+</button>
      </div>

      <div style={{ marginTop: 10 }}>
        {current.data.map(item => (
          <div key={item.id} style={{ ...s.card2, ...s.rowBetween }}>
            <span>{item.name}</span>
            <button onClick={() => current.ops.deleteItem(item.id)} style={{ background: 'none', border: 'none', color: clr.red, cursor: 'pointer' }}>✕ Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 6. PAYMENTS & ACCOUNTS LEDGER SCREEN
// ==========================================
const PaymentsScreen = ({ payments, coldStorages, parties, opsPayments }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "COLD_PAYMENT", entity_id: "", amount: "", mode: "UPI", date: today() });

  const save = async () => {
    if (!form.entity_id || !form.amount) return alert("Sari details bharein!");
    await opsPayments.addItem({ id: uid(), ...form });
    setForm({ type: "COLD_PAYMENT", entity_id: "", amount: "", mode: "UPI", date: today() });
    setShowForm(false);
  };

  return (
    <div style={s.content}>
      <div style={s.rowBetween}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Ledger Accounts & Payments</div>
        <button onClick={() => setShowForm(true)} style={{ ...s.btnSm(clr.green, "#fff") }}>+ New Entry</button>
      </div>

      <div style={{ marginTop: 10 }}>
        {payments.map(p => {
          const entityName = p.type === "COLD_PAYMENT" 
            ? coldStorages.find(c => c.id === p.entity_id)?.name || "Cold Storage"
            : parties.find(pt => pt.id === p.entity_id)?.name || "Party";

          return (
            <div key={p.id} style={s.card2}>
              <div style={s.rowBetween}>
                <strong>{entityName}</strong>
                <Badge v={p.type} color={p.type === "COLD_PAYMENT" ? clr.red : clr.green} />
              </div>
              <div style={{ ...s.rowBetween, fontSize: 11, marginTop: 4, color: clr.muted }}>
                <span>Paid via: {p.mode} ({p.date})</span>
                <strong style={{ color: clr.text, fontSize: 13 }}>₹{fmt(p.amount)}</strong>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Record Payment Transaction">
        <Field label="Transaction Type">
          <select style={s.select} value={form.type} onChange={e => setForm({ ...form, type: e.target.value, entity_id: "" })}>
            <option value="COLD_PAYMENT">Cold Storage ko Paisa Diya (Debit)</option>
            <option value="PARTY_RECEIPT">Party se Paisa Aya (Credit)</option>
          </select>
        </Field>

        <Field label="Select Account Entity">
          <select style={s.select} value={form.entity_id} onChange={e => setForm({ ...form, entity_id: e.target.value })}>
            <option value="">Select Target Account</option>
            {form.type === "COLD_PAYMENT" 
              ? coldStorages.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
              : parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
            }
          </select>
        </Field>

        <Field label="Amount (₹)"><input type="number" style={s.input} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></Field>
        
        <Field label="Payment Mode">
          <select style={s.select} value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })}>
            <option value="UPI">UPI / PhonePe / GPay</option>
            <option value="CASH">Cash</option>
            <option value="NET_BANKING">IMPS / NEFT / Bank Transfer</option>
          </select>
        </Field>

        <button onClick={save} style={s.btn(clr.green, "#fff")}>Submit Ledger Voucher</button>
      </Modal>
    </div>
  );
};

// ==========================================
// MAIN CONTAINER ROOT APPLICATION
// ==========================================
export default function App() {
  const [screen, setScreen] = useState("DASHBOARD");

  const opsP = useSupabaseTable("purchases");
  const opsD = useSupabaseTable("dispatches");
  const opsSales = useSupabaseTable("sales");
  const opsPayments = useSupabaseTable("payments");
  const opsCs = useSupabaseTable("cold_storages");
  const opsParties = useSupabaseTable("parties");
  const opsMandis = useSupabaseTable("mandis");
  const opsG = useSupabaseTable("gradings");
  const opsV = useSupabaseTable("varieties");

  return (
    <div style={s.screen}>
      <div style={s.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: clr.accent }} />
          <strong style={{ fontSize: 14, letterSpacing: 0.5 }}>POTATO ERP v2</strong>
        </div>
        <Badge v={today()} color={clr.muted} />
      </div>

      {screen === "DASHBOARD" && <DashboardScreen purchases={opsP.data} dispatches={opsD.data} sales={opsSales.data} payments={opsPayments.data} />}
      {screen === "PURCHASE" && <PurchaseScreen purchases={opsP.data} dispatches={opsD.data} opsP={opsP} coldStorages={opsCs.data} gradings={opsG.data} varieties={opsV.data} />}
      {screen === "DISPATCH" && <DispatchScreen dispatches={opsD.data} purchases={opsP.data} opsD={opsD} parties={opsParties.data} mandis={opsMandis.data} />}
      {screen === "SALE" && <SaleScreen sales={opsSales.data} dispatches={opsD.data} opsSales={opsSales} />}
      {screen === "PAYMENT" && <PaymentsScreen payments={opsPayments.data} coldStorages={opsCs.data} parties={opsParties.data} opsPayments={opsPayments} />}
      {screen === "MASTER" && <MasterScreen coldStorages={opsCs.data} parties={opsParties.data} mandis={opsMandis.data} gradings={opsG.data} varieties={opsV.data} opsCs={opsCs} opsParties={opsParties} opsMandis={opsMandis} opsG={opsG} opsV={opsV} />}

      <div style={s.navBar}>
        <button onClick={() => setScreen("DASHBOARD")} style={s.navItem(screen === "DASHBOARD")}>📊<span>Dash</span></button>
        <button onClick={() => setScreen("PURCHASE")} style={s.navItem(screen === "PURCHASE")}>🚜<span>Buy</span></button>
        <button onClick={() => setScreen("DISPATCH")} style={s.navItem(screen === "DISPATCH")}>🚛<span>Disp</span></button>
        <button onClick={() => setScreen("SALE")} style={s.navItem(screen === "SALE")}>⚖️<span>Mandi</span></button>
        <button onClick={() => setScreen("PAYMENT")} style={s.navItem(screen === "PAYMENT")}>💳<span>Cash</span></button>
        <button onClick={() => setScreen("MASTER")} style={s.navItem(screen === "MASTER")}>⚙️<span>Setup</span></button>
      </div>
    </div>
  );
}
