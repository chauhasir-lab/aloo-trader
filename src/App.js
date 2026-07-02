import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cxjmwjljjnuthcrmnbqb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4am13amxqam51dGhjcm1uYnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTYzMzUsImV4cCI6MjA5MjY3MjMzNX0.ynRaceAT1uWcsPOJ_5vY_8NKolM3EaWKQajUEk4sLz8";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const useSupabaseTable = (tableName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: rows, error: err } = await supabase.from(tableName).select("*").order("created_at", { ascending: false });
      if (err) return console.error(err);
      if (rows) {
        setData(rows.map(r => {
          if (r.items && typeof r.items === "string") try { r.items = JSON.parse(r.items); } catch(e){}
          if (r.lot_sales && typeof r.lot_sales === "string") try { r.lot_sales = JSON.parse(r.lot_sales); } catch(e){}
          return r;
        }));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [tableName]);

  const addItem = async (item) => {
    try {
      const p = { ...item, created_at: new Date().toISOString() };
      if (p.items && typeof p.items !== "string") p.items = JSON.stringify(p.items);
      if (p.lot_sales && typeof p.lot_sales !== "string") p.lot_sales = JSON.stringify(p.lot_sales);
      const { error: err } = await supabase.from(tableName).insert([p]);
      if (err) alert(err.message); else fetchData();
    } catch (e) { alert(e.message); }
  };

  const editItem = async (id, updates) => {
    try {
      const p = { ...updates };
      if (p.items && typeof p.items !== "string") p.items = JSON.stringify(p.items);
      if (p.lot_sales && typeof p.lot_sales !== "string") p.lot_sales = JSON.stringify(p.lot_sales);
      const { error: err } = await supabase.from(tableName).update(p).eq("id", id);
      if (err) alert(err.message); else fetchData();
    } catch (e) { alert(e.message); }
  };

  const deleteItem = async (id) => {
    if (!confirm("Kya aap sach me is entry ko delete karna chahte hain?")) return;
    try {
      const { error: err } = await supabase.from(tableName).delete().eq("id", id);
      if (err) alert(err.message); else fetchData();
    } catch (e) { alert(e.message); }
  };

  return { data, loading, addItem, editItem, deleteItem };
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
  <span style={{ background: color + "22", color, borderRadius: 4, padding: "3px 8px", fontSize: 11, fontWeight: 700, display: "inline-block" }}>{v}</span>
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
  input: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 6, padding: "8px 10px", color: clr.text, fontSize: 13, boxSizing: "border-box", outline: "none" },
  select: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 6, padding: "8px 10px", color: clr.text, fontSize: 13, boxSizing: "border-box", outline: "none" },
  btn: (bg = clr.accent, txt = "#000") => ({ width: "100%", background: bg, color: txt, border: "none", borderRadius: 6, padding: "10px", fontWeight: 700, fontSize: 13, cursor: "pointer" }),
  btnSm: (bg = clr.card2, txt = clr.text) => ({ background: bg, color: txt, border: `1px solid ${clr.border}`, borderRadius: 5, padding: "4px 8px", fontWeight: 600, fontSize: 11, cursor: "pointer" }),
  content: { padding: 12, paddingBottom: 80 },
  navBar: { position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", background: clr.card, borderTop: `1px solid ${clr.border}`, display: "flex", zIndex: 200 },
  navItem: (active) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 4px", gap: 2, background: "none", border: "none", color: active ? clr.accent : clr.muted, fontSize: 16, cursor: "pointer" }),
  divider: { height: 1, background: clr.border, margin: "6px 0" }
};

// ==========================================
// 1. DASHBOARD SCREEN
// ==========================================
const DashboardScreen = ({ purchases, dispatches, sales, payments }) => {
  const activeLots = purchases.filter(p => getRemainingBags(p, dispatches) > 0).length;
  const closedLots = purchases.filter(p => getRemainingBags(p, dispatches) <= 0).length;
  
  const totalBagsPurchased = purchases.reduce((sum, p) => sum + (parseFloat(p.manual_bags) || 0), 0);
  const totalDispatchedBags = dispatches.flatMap(d => d.items || []).reduce((sum, i) => sum + (parseFloat(i.loaded_bags) || 0), 0);
  const stockBags = totalBagsPurchased - totalDispatchedBags;

  const totalSales = sales.reduce((sum, s) => sum + (parseFloat(s.total_sale_value) || 0), 0);
  const totalReceived = payments.filter(p => p.type === "party_receipt").reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const pendingDue = totalSales - totalReceived;

  return (
    <div style={s.content}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
        <div style={{ ...s.card2, background: clr.blue + "15" }}><div style={{ fontSize: 10, color: clr.muted }}>ACTIVE LOTS</div><div style={{ fontSize: 20, fontWeight: 800, color: clr.blue }}>{activeLots}</div></div>
        <div style={{ ...s.card2, background: clr.red + "15" }}><div style={{ fontSize: 10, color: clr.muted }}>CLOSED LOTS</div><div style={{ fontSize: 20, fontWeight: 800, color: clr.red }}>{closedLots}</div></div>
        <div style={{ ...s.card2, background: clr.purple + "15" }}><div style={{ fontSize: 10, color: clr.muted }}>CURRENT STOCK BAGS</div><div style={{ fontSize: 18, fontWeight: 800, color: clr.purple }}>{stockBags} Bags</div></div>
        <div style={{ ...s.card2, background: clr.green + "15" }}><div style={{ fontSize: 10, color: clr.muted }}>TOTAL DISPATCHED</div><div style={{ fontSize: 18, fontWeight: 800, color: clr.green }}>{totalDispatchedBags} Bags</div></div>
      </div>

      <div style={s.card}>
        <div style={{ fontSize: 10, color: clr.muted, fontWeight: 700, marginBottom: 4 }}>OVERALL LEDGER STATS</div>
        <div style={s.divider} />
        <div style={{ display: "flex", justifyContent: "space-between", margin: "4px 0" }}><span>Total Sales Value:</span><strong style={{ color: clr.green }}>₹{fmt(totalSales)}</strong></div>
        <div style={{ display: "flex", justifyContent: "space-between", margin: "4px 0" }}><span>Total Party Received:</span><strong>₹{fmt(totalReceived)}</strong></div>
        <div style={{ display: "flex", justifyContent: "space-between", margin: "4px 0" }}><span>Total Outstandings:</span><strong style={{ color: clr.orange }}>₹{fmt(pendingDue)}</strong></div>
      </div>
    </div>
  );
};

// ==========================================
// 2. PURCHASE SCREEN (WITH CRUD)
// ==========================================
const PurchaseScreen = ({ purchases, dispatches, opsP, coldStorages, masterData }) => {
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(null);
  const [form, setForm] = useState({ lot_id: "", farmer_name: "", manual_bags: "", total_weight: "", rate_per_bag: "", cold_storage_id: "", date: today(), variety: "", grading: "" });

  const save = async () => {
    if (!form.lot_id || !form.farmer_name || !form.manual_bags || !form.rate_per_bag) return alert("Zaruri fields bharein!");
    const stdBags = form.total_weight ? (parseFloat(form.total_weight) / 52.5).toFixed(2) : "0";
    const totalCost = (parseFloat(form.manual_bags) || 0) * (parseFloat(form.rate_per_bag) || 0);
    const payload = { ...form, std_bags: stdBags, total_cost: totalCost };

    if (isEdit) {
      await opsP.editItem(isEdit, payload);
    } else {
      await opsP.addItem({ id: uid(), ...payload });
    }
    setForm({ lot_id: "", farmer_name: "", manual_bags: "", total_weight: "", rate_per_bag: "", cold_storage_id: "", date: today(), variety: "", grading: "" });
    setIsEdit(null);
    setShowForm(false);
  };

  return (
    <div style={s.content}>
      <div style={s.rowBetween}><div style={{ fontWeight: 700 }}>Purchases Dashboard</div><button onClick={() => { setIsEdit(null); setShowForm(true); }} style={s.btnSm(clr.accent, "#000")}>+ New Entry</button></div>
      <div style={{ marginTop: 10 }}>
        {purchases.map(p => {
          const rem = getRemainingBags(p, dispatches);
          return (
            <div key={p.id} style={s.card}>
              <div style={s.rowBetween}>
                <Badge v={p.lot_id} />
                <div>
                  <button onClick={() => { setIsEdit(p.id); setForm(p); setShowForm(true); }} style={{ ...s.btnSm(), marginRight: 4 }}>✏️</button>
                  <button onClick={() => opsP.deleteItem(p.id)} style={s.btnSm(clr.red + "22", clr.red)}>❌</button>
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{p.farmer_name} ({p.variety || "Gen"} - {p.grading || "Mix"})</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11, color: clr.muted, marginTop: 4 }}>
                <div>Bags: <strong>{p.manual_bags}</strong> (Rem: {rem})</div>
                <div>Rate: <strong>₹{p.rate_per_bag}</strong></div>
                <div>Total Cost: <strong style={{ color: clr.accent }}>₹{fmt(p.total_cost)}</strong></div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={isEdit ? "Edit Purchase" : "Add Purchase"}>
        <Field label="Lot ID"><input style={s.input} value={form.lot_id} onChange={e => setForm({ ...form, lot_id: e.target.value })} /></Field>
        <Field label="Farmer Name"><input style={s.input} value={form.farmer_name} onChange={e => setForm({ ...form, farmer_name: e.target.value })} /></Field>
        <Field label="Variety"><select style={s.select} value={form.variety} onChange={e => setForm({ ...form, variety: e.target.value })}><option value="">Select Variety</option>{masterData.filter(m => m.type === "variety").map(v => <option key={v.id} value={v.val}>{v.val}</option>)}</select></Field>
        <Field label="Grading"><select style={s.select} value={form.grading} onChange={e => setForm({ ...form, grading: e.target.value })}><option value="">Select Grading</option>{masterData.filter(m => m.type === "grading").map(g => <option key={g.id} value={g.val}>{g.val}</option>)}</select></Field>
        <Field label="Bags"><input type="number" style={s.input} value={form.manual_bags} onChange={e => setForm({ ...form, manual_bags: e.target.value })} /></Field>
        <Field label="Total Weight (Kg)"><input type="number" style={s.input} value={form.total_weight} onChange={e => setForm({ ...form, total_weight: e.target.value })} /></Field>
        <Field label="Rate per Bag"><input type="number" style={s.input} value={form.rate_per_bag} onChange={e => setForm({ ...form, rate_per_bag: e.target.value })} /></Field>
        <Field label="Cold Storage"><select style={s.select} value={form.cold_storage_id} onChange={e => setForm({ ...form, cold_storage_id: e.target.value })}><option value="">Select Cold</option>{coldStorages.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <button onClick={save} style={s.btn()}>{isEdit ? "Update" : "Save"}</button>
      </Modal>
    </div>
  );
};

// ==========================================
// 3. DISPATCH SCREEN (EDIT, AUTO-PRICE, WHATSAPP POPUP)
// ==========================================
const DispatchScreen = ({ dispatches, purchases, opsD, parties, masterData }) => {
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(null);
  const [form, setForm] = useState({ gatepass_id: "", vehicle_number: "", driver_name: "", items: [], date: today(), destination_party_id: "", mandi_id: "" });
  const [itemForm, setItemForm] = useState({ lot_id: "", loaded_bags: "", loaded_weight: "", rate_per_bag: "0", total_value: "0", variety: "", grading: "" });
  
  const [whatsappText, setWhatsappText] = useState("");
  const [showWA, setShowWA] = useState(false);

  const handleLotChange = (lotId) => {
    const match = purchases.find(p => p.lot_id === lotId);
    if (match) {
      setItemForm({ ...itemForm, lot_id: lotId, rate_per_bag: match.rate_per_bag, variety: match.variety, grading: match.grading });
    }
  };

  const calculateItemValue = (bags) => {
    const totalval = (parseFloat(bags) || 0) * (parseFloat(itemForm.rate_per_bag) || 0);
    setItemForm({ ...itemForm, loaded_bags: bags, total_value: totalval.toString() });
  };

  const addLotToItemArray = () => {
    if (!itemForm.lot_id || !itemForm.loaded_bags) return alert("Lot info missing!");
    setForm({ ...form, items: [...form.items, { ...itemForm }] });
    setItemForm({ lot_id: "", loaded_bags: "", loaded_weight: "", rate_per_bag: "0", total_value: "0", variety: "", grading: "" });
  };

  const save = async () => {
    if (!form.gatepass_id || form.items.length === 0) return alert("Zaruri fields khali hain!");
    if (isEdit) {
      await opsD.editItem(isEdit, form);
    } else {
      await opsD.addItem({ id: uid(), ...form });
    }

    // Prepare WhatsApp Message
    let msg = `*GATEPASS DETIALS: ${form.gatepass_id}*\nVehicle: ${form.vehicle_number}\n\n*Loaded Lots:*\n`;
    let totalBags = 0;
    form.items.forEach(i => {
      totalBags += parseFloat(i.loaded_bags) || 0;
      msg += `- Lot: ${i.lot_id} | Bags: ${i.loaded_bags} | Wt: ${i.loaded_weight}kg | Variety: ${i.variety} | Grading: ${i.grading}\n`;
    });
    msg += `\n*Total Load Bags:* ${totalBags}`;
    
    setWhatsappText(msg);
    setShowWA(true);
    setShowForm(false);
    setIsEdit(null);
  };

  return (
    <div style={s.content}>
      <div style={s.rowBetween}>
        <div style={{ fontWeight: 700 }}>Dispatch & Load Records</div>
        <button onClick={() => { setIsEdit(null); setForm({ gatepass_id: "", vehicle_number: "", driver_name: "", items: [], date: today(), destination_party_id: "", mandi_id: "" }); setShowForm(true); }} style={s.btnSm(clr.blue, "#fff")}>+ Create GP</button>
      </div>

      <div style={{ marginTop: 10 }}>
        {dispatches.map(d => (
          <div key={d.id} style={s.card}>
            <div style={s.rowBetween}>
              <Badge v={`GP: ${d.gatepass_id}`} color={clr.blue} />
              <div>
                <button onClick={() => { setIsEdit(d.id); setForm(d); setShowForm(true); }} style={{ ...s.btnSm(), marginRight: 4 }}>✏️</button>
                <button onClick={() => opsD.deleteItem(d.id)} style={s.btnSm(clr.red + "22", clr.red)}>❌</button>
              </div>
            </div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Vehicle: <strong>{d.vehicle_number}</strong></div>
            <div style={{ fontSize: 11, color: clr.muted }}>Lots Loaded: {d.items?.map(i => `${i.lot_id}(${i.loaded_bags})`).join(", ")}</div>
          </div>
        ))}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Dispatch Form">
        <Field label="Gatepass ID"><input style={s.input} value={form.gatepass_id} onChange={e => setForm({ ...form, gatepass_id: e.target.value })} /></Field>
        <Field label="Vehicle No"><input style={s.input} value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} /></Field>
        <Field label="Party / Merchant"><select style={s.select} value={form.destination_party_id} onChange={e => setForm({ ...form, destination_party_id: e.target.value })}><option value="">Select Party</option>{parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Target Mandi"><select style={s.select} value={form.mandi_id} onChange={e => setForm({ ...form, mandi_id: e.target.value })}><option value="">Select Mandi</option>{masterData.filter(m => m.type === "mandi").map(m => <option key={m.id} value={m.val}>{m.val}</option>)}</select></Field>

        <div style={{ background: clr.card2, padding: 8, borderRadius: 6, marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: clr.accent, marginBottom: 4 }}>LOAD ITEM BREAKDOWN</div>
          <select style={{ ...s.select, marginBottom: 4 }} value={itemForm.lot_id} onChange={e => handleLotChange(e.target.value)}><option value="">Select Lot</option>{purchases.map(p => <option key={p.id} value={p.lot_id}>{p.lot_id}</option>)}</select>
          <input type="number" placeholder="Bags" style={{ ...s.input, marginBottom: 4 }} value={itemForm.loaded_bags} onChange={e => calculateItemValue(e.target.value)} />
          <input type="number" placeholder="Weight (kg)" style={{ ...s.input, marginBottom: 4 }} value={itemForm.loaded_weight} onChange={e => setItemForm({ ...itemForm, loaded_weight: e.target.value })} />
          <div style={{ fontSize: 11, margin: "4px 0" }}>Auto Value: <strong>₹{itemForm.total_value}</strong> ({itemForm.variety})</div>
          <button onClick={addLotToItemArray} style={{ ...s.btnSm(clr.accent, "#000"), width: "100%" }}>Add Lot Line</button>
        </div>

        {form.items.map((i, idx) => (
          <div key={idx} style={{ fontSize: 11, background: clr.bg, padding: 4, marginBottom: 4 }}>{i.lot_id} - {i.loaded_bags} Bags ({i.loaded_weight}kg)</div>
        ))}
        <button onClick={save} style={s.btn(clr.blue, "#fff")}>Save Dispatch</button>
      </Modal>

      <Modal open={showWA} onClose={() => setShowWA(false)} title="WhatsApp Sharing Text">
        <textarea readOnly style={{ width: "100%", height: 120, background: clr.card2, color: clr.text, border: `1px solid ${clr.border}`, padding: 6, fontSize: 12 }} value={whatsappText} />
        <button onClick={() => { navigator.clipboard.writeText(whatsappText); alert("Copied!"); setShowWA(false); }} style={{ ...s.btn(), marginTop: 8 }}>Copy Text</button>
      </Modal>
    </div>
  );
};

// ==========================================
// 4. SALES SCREEN (WITH COMMISSION, EXPENSES SPLIT & P&L)
// ==========================================
const SaleScreen = ({ sales, dispatches, opsSales }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ gatepass_id: "", date: today(), lot_sales: [], mandi_comm: "6", hamali_per_bag: "5", gatepass_charge: "100", transport_charge: "2000" });

  const loadGatepassData = (gpId) => {
    const d = dispatches.find(x => x.gatepass_id === gpId);
    if (d) {
      const list = d.items?.map(i => ({
        lot_id: i.lot_id, loaded_bags: i.loaded_bags, loaded_weight: i.loaded_weight, received_weight: i.loaded_weight, rate_per_kg: "0", item_cost: i.total_value
      })) || [];
      setForm({ ...form, gatepass_id: gpId, lot_sales: list });
    }
  };

  const updateLotItem = (idx, updates) => {
    const updated = [...form.lot_sales];
    updated[idx] = { ...updated[idx], ...updates };
    setForm({ ...form, lot_sales: updated });
  };

  const computePAndLStructure = () => {
    let totalGrossSale = 0;
    const itemsCount = form.lot_sales.length || 1;
    
    // Total expenses
    const totalHamali = form.lot_sales.reduce((sum, i) => sum + ((parseFloat(i.loaded_bags) || 0) * (parseFloat(form.hamali_per_bag) || 0)), 0);
    const splitFixedExpenses = ((parseFloat(form.gatepass_charge) || 0) + (parseFloat(form.transport_charge) || 0)) / itemsCount;

    const sheets = form.lot_sales.map(i => {
      const gross = (parseFloat(i.received_weight) || 0) * (parseFloat(i.rate_per_kg) || 0);
      totalGrossSale += gross;

      const weightLoss = (parseFloat(i.loaded_weight) || 0) - (parseFloat(i.received_weight) || 0);
      const commissionAmount = gross * (parseFloat(form.mandi_comm) || 0) / 100;
      const lotHamali = (parseFloat(i.loaded_bags) || 0) * (parseFloat(form.hamali_per_bag) || 0);
      
      const totalLotExpenses = commissionAmount + lotHamali + splitFixedExpenses;
      const netProfit = gross - totalLotExpenses - (parseFloat(i.item_cost) || 0);

      return { ...i, gross, weightLoss, netProfit };
    });

    return { sheets, totalGrossSale };
  };

  const save = async () => {
    const { sheets, totalGrossSale } = computePAndLStructure();
    await opsSales.addItem({ id: uid(), ...form, lot_sales: sheets, total_sale_value: totalGrossSale });
    setShowForm(false);
  };

  const { sheets, totalGrossSale } = computePAndLStructure();

  return (
    <div style={s.content}>
      <div style={s.rowBetween}>
        <div style={{ fontWeight: 700 }}>Sales Book & P&L Analysis</div>
        <button onClick={() => setShowForm(true)} style={s.btnSm(clr.green, "#fff")}>+ Record Mandi Sale</button>
      </div>

      <div style={{ marginTop: 10 }}>
        {sales.map(sl => (
          <div key={sl.id} style={s.card}>
            <div style={s.rowBetween}>
              <Badge v={`GP Reference: ${sl.gatepass_id}`} color={clr.green} />
              <strong style={{ color: clr.green }}>Gross: ₹{fmt(sl.total_sale_value)}</strong>
            </div>
            {sl.lot_sales?.map((l, i) => (
              <div key={i} style={{ fontSize: 11, background: clr.card2, padding: 6, marginTop: 4, borderRadius: 4 }}>
                <div style={s.rowBetween}><span>Lot: <strong>{l.lot_id}</strong></span> <span>Wt Loss: {l.weightLoss}kg</span></div>
                <div style={s.rowBetween}><span>Net Profit/Loss:</span> <strong style={{ color: l.netProfit >= 0 ? clr.green : clr.red }}>₹{fmt(l.netProfit)}</strong></div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Record Mandi Sale Sheet">
        <Field label="Select Gatepass"><select style={s.select} value={form.gatepass_id} onChange={e => loadGatepassData(e.target.value)}><option value="">Select GP</option>{dispatches.map(d => <option key={d.id} value={d.gatepass_id}>{d.gatepass_id}</option>)}</select></Field>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <Field label="Mandi Comm %"><input type="number" style={s.input} value={form.mandi_comm} onChange={e => setForm({...form, mandi_comm: e.target.value})} /></Field>
          <Field label="Hamali / Bag"><input type="number" style={s.input} value={form.hamali_per_bag} onChange={e => setForm({...form, hamali_per_bag: e.target.value})} /></Field>
          <Field label="Mandi Gatepass (Rs)"><input type="number" style={s.input} value={form.gatepass_charge} onChange={e => setForm({...form, gatepass_charge: e.target.value})} /></Field>
          <Field label="Transport (Rs)"><input type="number" style={s.input} value={form.transport_charge} onChange={e => setForm({...form, transport_charge: e.target.value})} /></Field>
        </div>

        {sheets.map((i, idx) => (
          <div key={idx} style={{ background: clr.card2, padding: 6, borderRadius: 6, marginBottom: 6 }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: clr.accent }}>LOT: {i.lot_id}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 4 }}>
              <input type="number" placeholder="Rec. Wt" style={s.input} value={i.received_weight} onChange={e => updateLotItem(idx, { received_weight: e.target.value })} />
              <input type="number" step="0.01" placeholder="Rate / Kg" style={s.input} value={i.rate_per_kg} onChange={e => updateLotItem(idx, { rate_per_kg: e.target.value })} />
            </div>
            <div style={{ fontSize: 10, color: clr.muted, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
              <span>Weight Loss: {i.weightLoss} kg</span>
              <span>Lot Net P&L: <strong style={{ color: i.netProfit >= 0 ? clr.green : clr.red }}>₹{fmt(i.netProfit)}</strong></span>
            </div>
          </div>
        ))}
        <button onClick={save} style={s.btn(clr.green, "#fff")}>Submit Sale</button>
      </Modal>
    </div>
  );
};

// ==========================================
// 5. PAYMENTS SINGLE ROUTE (COLD & PARTY TRANSACTIONS)
// ==========================================
const PaymentScreen = ({ purchases, sales, payments, opsPayment, coldStorages, parties }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "party_receipt", entity_id: "", amount: "", payment_mode: "UPI", date: today(), notes: "" });

  // Cold Storage Calculations
  const coldBalances = coldStorages.map(cs => {
    const purchased = purchases.filter(p => p.cold_storage_id === cs.id).reduce((sum, p) => sum + (parseFloat(p.total_cost) || 0), 0);
    const paid = payments.filter(p => p.type === "cold_payment" && p.entity_id === cs.id).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    return { ...cs, remaining: purchased - paid };
  });

  // Party Calculations
  const partyBalances = parties.map(pt => {
    const sold = sales.reduce((sum, s) => sum + (parseFloat(s.total_sale_value) || 0), 0); // Flat sample simulation logic
    const rec = payments.filter(p => p.type === "party_receipt" && p.entity_id === pt.id).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    return { ...pt, remaining: sold - rec };
  });

  const save = async () => {
    if (!form.entity_id || !form.amount) return alert("Fill data");
    await opsPayment.addItem({ id: uid(), ...form });
    setShowForm(false);
  };

  return (
    <div style={s.content}>
      <div style={s.rowBetween}>
        <div style={{ fontWeight: 700 }}>Single-Window Ledger Payments</div>
        <button onClick={() => setShowForm(true)} style={s.btnSm(clr.orange, "#fff")}>+ Record New Txn</button>
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 11, color: clr.muted, fontWeight: 700, marginBottom: 4 }}>COLD STORAGE KHATA OWD</div>
        {coldBalances.map(c => (
          <div key={c.id} style={s.card2}>
            <div style={s.rowBetween}><span>{c.name}</span> <strong style={{ color: c.remaining > 0 ? clr.orange : clr.green }}>{c.remaining > 0 ? `₹${fmt(c.remaining)}` : "CLEAR"}</strong></div>
          </div>
        ))}

        <div style={{ fontSize: 11, color: clr.muted, fontWeight: 700, marginTop: 10, marginBottom: 4 }}>PARTY BYAPARI OUTSTANDINGS</div>
        {partyBalances.map(p => (
          <div key={p.id} style={s.card2}>
            <div style={s.rowBetween}><span>{p.name}</span> <strong style={{ color: p.remaining > 0 ? clr.red : clr.green }}>{p.remaining > 0 ? `₹${fmt(p.remaining)}` : "CLEAR"}</strong></div>
          </div>
        ))}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Record Transaction Window">
        <Field label="Txn Type"><select style={s.select} value={form.type} onChange={e => setForm({...form, type: e.target.value, entity_id: ""})}><option value="party_receipt">Party Se Paisa Aaya (Receipt)</option><option value="cold_payment">Cold Storage Ko Paisa Diya (Payment)</option></select></Field>
        <Field label="Select Target Profile">
          <select style={s.select} value={form.entity_id} onChange={e => setForm({...form, entity_id: e.target.value})}>
            <option value="">Choose profile</option>
            {form.type === "party_receipt" ? parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>) : coldBalances.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Amount"><input type="number" style={s.input} value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} /></Field>
        <Field label="Payment Mode"><select style={s.select} value={form.payment_mode} onChange={e => setForm({...form, payment_mode: e.target.value})}><option value="UPI">UPI</option><option value="Cash">Cash</option><option value="Cheque">Cheque</option><option value="RTGS">RTGS</option></select></Field>
        <button onClick={save} style={s.btn(clr.orange, "#000")}>Save Transaction</button>
      </Modal>
    </div>
  );
};

// ==========================================
// 6. MASTER SCREEN (WITH EDIT, DELETE & NEW TYPES)
// ==========================================
const MasterScreen = ({ coldStorages, parties, masterData, opsCS, opsParty, opsM }) => {
  const [showForm, setShowForm] = useState(false);
  const [mType, setMType] = useState("mandi");
  const [nameVal, setNameVal] = useState("");
  const [phoneVal, setPhoneVal] = useState("");

  const save = async () => {
    if (!nameVal) return alert("Value missing!");
    if (mType === "cold") await opsCS.addItem({ id: uid(), name: nameVal, phone: phoneVal });
    else if (mType === "party") await opsParty.addItem({ id: uid(), name: nameVal, phone: phoneVal });
    else await opsM.addItem({ id: uid(), type: mType, val: nameVal });
    setNameVal(""); setPhoneVal(""); setShowForm(false);
  };

  return (
    <div style={s.content}>
      <div style={s.rowBetween}>
        <div style={{ fontWeight: 700 }}>Master Configuration Panel</div>
        <button onClick={() => setShowForm(true)} style={s.btnSm(clr.accent, "#000")}>+ Add Configuration</button>
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: clr.muted }}>COLD STORAGES</div>
        {coldStorages.map(c => (
          <div key={c.id} style={s.card2}>
            <div style={s.rowBetween}><span>{c.name} ({c.phone})</span><button onClick={() => opsCS.deleteItem(c.id)} style={s.btnSm(clr.red + "11", clr.red)}>❌</button></div>
          </div>
        ))}
        <div style={{ fontSize: 11, fontWeight: 700, color: clr.muted, marginTop: 8 }}>PARTIES</div>
        {parties.map(p => (
          <div key={p.id} style={s.card2}>
            <div style={s.rowBetween}><span>{p.name}</span><button onClick={() => opsParty.deleteItem(p.id)} style={s.btnSm(clr.red + "11", clr.red)}>❌</button></div>
          </div>
        ))}
        <div style={{ fontSize: 11, fontWeight: 700, color: clr.muted, marginTop: 8 }}>MANDIS / VARIETY / GRADING</div>
        {masterData.map(m => (
          <div key={m.id} style={s.card2}>
            <div style={s.rowBetween}><span>[{m.type.toUpperCase()}] {m.val}</span><button onClick={() => opsM.deleteItem(m.id)} style={s.btnSm(clr.red + "11", clr.red)}>❌</button></div>
          </div>
        ))}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Configuration Setup">
        <Field label="Setup Category"><select style={s.select} value={mType} onChange={e => setMType(e.target.value)}><option value="mandi">Mandi Name</option><option value="cold">Cold Storage Unit</option><option value="party">Party / Merchant Profile</option><option value="variety">Potato Variety</option><option value="grading">Grading Standard</option></select></Field>
        <Field label="Name / Value Input"><input style={s.input} value={nameVal} onChange={e => setNameVal(e.target.value)} /></Field>
        {(mType === "cold" || mType === "party") && <Field label="Phone Contact"><input style={s.input} value={phoneVal} onChange={e => setPhoneVal(e.target.value)} /></Field>}
        <button onClick={save} style={s.btn()}>Add Settings</button>
      </Modal>
    </div>
  );
};

// ==========================================
// CORE CONTROLLER APP
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const purchases = useSupabaseTable("purchases");
  const dispatches = useSupabaseTable("dispatches");
  const sales = useSupabaseTable("sales");
  const payments = useSupabaseTable("payments");
  const coldStorages = useSupabaseTable("cold_storages");
  const parties = useSupabaseTable("parties");
  const masterData = useSupabaseTable("master_configs"); // Shared table lookup for type: mandi/variety/grading

  return (
    <div style={s.screen}>
      <div style={s.header}><span style={{ fontWeight: 800, color: clr.accent }}>🥔 AlooTrader v6.1</span></div>
      
      {activeTab === "dashboard" && <DashboardScreen purchases={purchases.data} dispatches={dispatches.data} sales={sales.data} payments={payments.data} />}
      {activeTab === "purchase" && <PurchaseScreen purchases={purchases.data} dispatches={dispatches.data} opsP={purchases} coldStorages={coldStorages.data} masterData={masterData.data} />}
      {activeTab === "dispatch" && <DispatchScreen dispatches={dispatches.data} purchases={purchases.data} opsD={dispatches} parties={parties.data} masterData={masterData.data} />}
      {activeTab === "sale" && <SaleScreen sales={sales.data} dispatches={dispatches.data} opsSales={sales} />}
      {activeTab === "payment" && <PaymentScreen purchases={purchases.data} sales={sales.data} payments={payments.data} opsPayment={payments} coldStorages={coldStorages.data} parties={parties.data} />}
      {activeTab === "master" && <MasterScreen coldStorages={coldStorages.data} parties={parties.data} masterData={masterData.data} opsCS={coldStorages} opsParty={parties} opsM={masterData} />}

      <div style={s.navBar}>
        <button onClick={() => setActiveTab("dashboard")} style={s.navItem(activeTab === "dashboard")}>📊</button>
        <button onClick={() => setActiveTab("purchase")} style={s.navItem(activeTab === "purchase")}>📥</button>
        <button onClick={() => setActiveTab("dispatch")} style={s.navItem(activeTab === "dispatch")}>📤</button>
        <button onClick={() => setActiveTab("sale")} style={s.navItem(activeTab === "sale")}>💰</button>
        <button onClick={() => setActiveTab("payment")} style={s.navItem(activeTab === "payment")}>💳</button>
        <button onClick={() => setActiveTab("master")} style={s.navItem(activeTab === "master")}>⚙️</button>
      </div>
    </div>
  );
}
