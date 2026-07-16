import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cxjmwjljjnuthcrmnbqb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4am13amxqam51dGhjcm1uYnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTYzMzUsImV4cCI6MjA5MjY3MjMzNX0.ynRaceAT1uWcsPOJ_5vY_8NKolM3EaWKQajUEk4sLz8";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const useSupabaseTable = (tableName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

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
        return d[0];
      }
    } catch (e) { alert(`Error: ${e.message}`); }
  };

  const editItem = async (id, updates) => {
    try {
      const { error: err } = await supabase.from(tableName).update(updates).eq("id", id);
      if (err) { alert(`Error: ${err.message}`); return false; }
      setData(data.map(x => x.id === id ? { ...x, ...updates } : x));
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

  return { data, loading, addItem, editItem, deleteItem };
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
  const dispatchedBags = dispatches.flatMap(d => d.lot_details || []).filter(i => i.lot_number === purchase.lot_id).reduce((sum, i) => sum + (parseFloat(i.purchase_bags) || 0), 0);
  return (parseFloat(purchase.manual_bags) || 0) - dispatchedBags;
};

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
    add: "M12 4v16m8-8H4", x: "M6 18L18 6M6 6l12 12", trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    info: "M12 16v-4m0-4h.01M22 12a10 10 0 11-20 0 10 10 0 0120 0z"
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icons[name]} /></svg>;
};

const Field = ({ label, children }) => <div style={{ marginBottom: 12 }}><div style={s.label}>{label}</div>{children}</div>;
const Modal = ({ open, onClose, title, children }) => !open ? null : <div style={{ position: "fixed", inset: 0, background: "#000c", zIndex: 1000, display: "flex", alignItems: "flex-end" }}><div style={{ background: clr.card, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "92vh", display: "flex", flexDirection: "column", border: `1px solid ${clr.border}` }}><div style={{ ...s.rowBetween, padding: 14, borderBottom: `1px solid ${clr.border}` }}><span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span><button onClick={onClose} style={s.btnSm()}><Icon name="x" size={14} /></button></div><div style={{ overflowY: "auto", padding: "0 14px 20px" }}>{children}</div></div></div>;

// ===== DASHBOARD SCREEN =====
const DashboardScreen = ({ purchases, dispatches, payments, mandis }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const totalBagsPurchased = purchases.reduce((sum, p) => sum + (parseInt(p.manual_bags) || 0), 0);
  const totalBagsRemaining = purchases.reduce((sum, p) => sum + getRemainingBags(p, dispatches), 0);
  const totalBagsDispatched = dispatches.flatMap(d => d.lot_details || []).reduce((sum, item) => sum + (parseInt(item.purchase_bags) || 0), 0);

  const activeLots = purchases.filter(p => getRemainingBags(p, dispatches) > 0).length;
  const closedLots = purchases.filter(p => getRemainingBags(p, dispatches) <= 0).length;

  const totalSaleValue = dispatches.reduce((sum, d) => sum + (parseFloat(d.total_mandi_sale_amount) || 0), 0);
  const totalPaymentsReceived = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const pendingDue = totalSaleValue - totalPaymentsReceived;

  const soldDispatches = dispatches.filter(d => (d.total_mandi_sale_amount || 0) > 0);
  const totalSoldPurchaseCost = soldDispatches.reduce((sum, d) => sum + (d.lot_details?.reduce((s, item) => s + (parseFloat(item.purchase_lot_value) || 0), 0) || 0), 0);
  const totalMandiRevenue = soldDispatches.reduce((sum, d) => sum + (parseFloat(d.total_mandi_sale_amount) || 0), 0);
  const totalMandiExpenses = soldDispatches.reduce((sum, d) => sum + (parseFloat(d.total_expenses) || 0), 0);
  const dynamicNetProfit = totalMandiRevenue - totalSoldPurchaseCost - totalMandiExpenses;

  const q = searchQuery.trim().toUpperCase();
  const filteredPurchases = q === "" ? [] : purchases.filter(p => p.lot_id.toUpperCase().includes(q));
  const filteredDispatches = q === "" ? [] : dispatches.filter(d => d.gatepass_id.toUpperCase().includes(q) || d.lot_details?.some(l => l.lot_number.toUpperCase().includes(q)));

  return (
    <div style={s.content}>
      <div style={{ ...s.card, background: dynamicNetProfit >= 0 ? clr.green + "1a" : clr.red + "1a", borderColor: dynamicNetProfit >= 0 ? clr.green : clr.red, marginBottom: 14 }}>
        <div style={s.rowBetween}>
          <span style={{ ...s.label, fontSize: "13px", color: dynamicNetProfit >= 0 ? clr.green : clr.red }}>📊 Realized Profit & Loss (Live)</span>
          <Badge v={dynamicNetProfit >= 0 ? "PROFIT" : "LOSS"} color={dynamicNetProfit >= 0 ? clr.green : clr.red} />
        </div>
        <div style={s.divider} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 4 }}>
          <span style={{ fontSize: "14px", color: clr.muted }}>Net Realized Margin:</span>
          <span style={{ fontSize: "26px", fontWeight: 900, color: dynamicNetProfit >= 0 ? clr.green : clr.red }}>
            {dynamicNetProfit >= 0 ? "+" : ""}₹{fmt(dynamicNetProfit)}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10, fontSize: "12px", color: clr.muted }}>
          <div>Sold Batches Cost: <strong style={{ color: clr.text }}>₹{fmt(totalSoldPurchaseCost)}</strong></div>
          <div>Mandi Gross Revenue: <strong style={{ color: clr.green }}>₹{fmt(totalMandiRevenue)}</strong></div>
          <div style={{ gridColumn: "1 / span 2" }}>Total Mandi Expenses: <strong style={{ color: clr.orange }}>₹{fmt(totalMandiExpenses)}</strong></div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
        <div style={{ ...s.card2, background: clr.accent + "15" }}><div style={s.label}>Purchased</div><div style={{ fontSize: 15, fontWeight: 800, color: clr.accent }}>{totalBagsPurchased} Bags</div></div>
        <div style={{ ...s.card2, background: clr.blue + "15" }}><div style={s.label}>Dispatched</div><div style={{ fontSize: 15, fontWeight: 800, color: clr.blue }}>{totalBagsDispatched} Bags</div></div>
        <div style={{ ...s.card2, background: clr.green + "15" }}><div style={s.label}>Remaining</div><div style={{ fontSize: 15, fontWeight: 800, color: clr.green }}>{totalBagsRemaining} Bags</div></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <div style={{ ...s.card2, background: clr.blue + "15" }}><div style={s.label}>Active Lots</div><div style={{ fontSize: 20, fontWeight: 800, color: clr.blue }}>{activeLots} Lots</div></div>
        <div style={{ ...s.card2, background: clr.red + "15" }}><div style={s.label}>Closed Lots</div><div style={{ fontSize: 20, fontWeight: 800, color: clr.red }}>{closedLots} Lots</div></div>
      </div>

      <div style={{ ...s.card, marginBottom: 12 }}>
        <div style={s.label}>🔍 Quick Search History (Lot ID / GP Number)</div>
        <input 
          style={{ ...s.input, marginTop: 6 }} 
          placeholder="Enter Lot ID or Gatepass Number..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {q !== "" && (
          <div style={{ marginTop: 10, maxHeight: 220, overflowY: "auto" }}>
            {filteredPurchases.length === 0 && filteredDispatches.length === 0 && (
              <div style={{ fontSize: 13, color: clr.muted, textAlign: "center", padding: 8 }}>No history records match query.</div>
            )}
            {filteredPurchases.map(p => (
              <div key={p.id} style={{ background: clr.card2, padding: 8, borderRadius: 6, marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: clr.accent, fontWeight: 700 }}>📥 Lot: {p.lot_id}</span> | Farmer: {p.farmer_name} | Total Bags: {p.manual_bags} | Date: {p.date}
              </div>
            ))}
            {filteredDispatches.map(d => (
              <div key={d.id} style={{ background: clr.card2, padding: 8, borderRadius: 6, marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: clr.blue, fontWeight: 700 }}>📤 GP: {d.gatepass_id}</span> | {d.vehicle_number} | Sale: ₹{fmt(d.total_mandi_sale_amount || 0)}
                {d.lot_details?.map((ld, lIdx) => (
                  <div key={lIdx} style={{ fontSize: 12, color: clr.muted, marginLeft: 8 }}>• Loaded {ld.purchase_bags} Bags from Lot {ld.lot_number}</div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ ...s.card, background: clr.blue + "10" }}>
        <div style={s.label}>✅ Sales & Payments Summary</div>
        <div style={s.divider} />
        <div style={{ fontSize: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span>Total Sales:</span><strong style={{ color: clr.green }}>₹{fmt(totalSaleValue)}</strong></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span>Received:</span><strong>₹{fmt(totalPaymentsReceived)}</strong></div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${clr.border}`, paddingTop: 6 }}><span style={{ fontWeight: 600 }}>Pending Due:</span><strong style={{ color: clr.orange }}>₹{fmt(pendingDue)}</strong></div>
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
  
  const totalBags = purchases.reduce((sum, p) => sum + (parseInt(p.manual_bags) || 0), 0);
  const totalRemaining = purchases.reduce((sum, p) => sum + getRemainingBags(p, dispatches), 0);

  const save = async () => {
    if (!form.lot_id || !form.farmer_name || !form.manual_bags || !form.rate_per_bag || !form.total_weight) {
      return alert("❌ Fill all required fields!");
    }
    const ratePerKg = parseFloat(form.rate_per_bag) / 52.5;
    const currentTotalCost = parseFloat(form.total_weight) * ratePerKg;
    const payload = { ...form, std_bags: (parseFloat(form.total_weight) / 52.5).toFixed(2), total_cost: currentTotalCost };

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
      <div style={{ ...s.card2, background: clr.card, display: "flex", justifyContent: "space-between", marginBottom: 12, padding: 10 }}>
        <div>Total Stock: <strong>{totalBags} Bags</strong></div>
        <div>Remaining Balance: <strong style={{ color: clr.green }}>{totalRemaining} Bags</strong></div>
      </div>

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
              <div style={s.row}>
                <Badge v={p.lot_id} color={isClosed ? clr.red : clr.accent} />
                <Badge v={isClosed ? "CLOSED" : "ACTIVE"} color={isClosed ? clr.red : clr.green} />
              </div>
              <span style={{ fontSize: 12, color: clr.muted }}>{p.date}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, marginTop: 6 }}>{p.farmer_name}</div>
            
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 12, color: clr.accent }}>Var: {varieties.find(v => v.id === p.variety_id)?.name || "N/A"}</span>
              <span style={{ fontSize: 12, color: clr.purple }}>Grade: {gradings.find(g => g.id === p.grading_id)?.name || "N/A"}</span>
            </div>

            <div style={s.divider} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 13 }}>
              <div>Total Bags: <strong>{p.manual_bags}</strong></div>
              <div>Remaining Bags: <strong style={{ color: remaining > 0 ? clr.green : clr.red }}>{remaining}</strong></div>
              <div>Rate/Bag (52.5k): <strong>₹{p.rate_per_bag}</strong></div>
              <div>Total Value: <strong style={{ color: clr.green }}>₹{fmt(p.total_cost)}</strong></div>
            </div>
            <div style={{ ...s.row, marginTop: 10 }}>
              <button onClick={() => { setEditItem(p); setForm({ ...p }); setShowForm(true); }} style={{ ...s.btnSm(), flex: 1 }}><Icon name="edit" size={12} /> Edit</button>
              <button onClick={() => { if(window.confirm("🚨 Kya aap sach me ye Purchase entry delete karna chahte hain?")) opsP.deleteItem(p.id); }} style={{ ...s.btnSm(), flex: 1, color: clr.red }}><Icon name="trash" size={12} color={clr.red} /> Delete</button>
            </div>
          </div>
        );
      })}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Purchase Entry Form">
        <Field label="Lot ID"><input style={s.input} value={form.lot_id} onChange={e => setForm({ ...form, lot_id: e.target.value })} disabled={editItem} /></Field>
        <Field label="Farmer Name"><input style={s.input} value={form.farmer_name} onChange={e => setForm({ ...form, farmer_name: e.target.value })} /></Field>
        <Field label="Variety"><select style={s.select} value={form.variety_id} onChange={e => setForm({ ...form, variety_id: e.target.value })}><option value="">Select Variety</option>{varieties.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></Field>
        <Field label="Grading"><select style={s.select} value={form.grading_id} onChange={e => setForm({ ...form, grading_id: e.target.value })}><option value="">Select Grading</option>{gradings.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></Field>
        <Field label="Total Weight (kg)"><input type="number" style={s.input} value={form.total_weight} onChange={e => setForm({ ...form, total_weight: e.target.value })} /></Field>
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
const DispatchScreen = ({ dispatches, purchases, opsD, parties, mandis, varieties, gradings }) => {
  const [showForm, setShowForm] = useState(false);
  const [showPopModal, setShowPopModal] = useState(false);
  const [popData, setPopData] = useState(null);
  const [form, setForm] = useState({ gatepass_id: "", vehicle_number: "", driver_name: "", lot_details: [], date: today(), destination_party_id: "", mandi_id: "", cold_storage_id: "", total_expenses: 0, total_purchase_amount: 0, total_dispatch_weight: 0 });
  const [itemForm, setItemForm] = useState({ lot_number: "", purchase_bags: "", purchase_weight_kg: "" });

  const availableLots = purchases.filter(p => getRemainingBags(p, dispatches) > 0);

  const addLotToTruck = () => {
    if (!itemForm.lot_number || !itemForm.purchase_bags || !itemForm.purchase_weight_kg) {
      return alert("❌ Please fill Lot, Bags and Weight!");
    }
    const matchedPurchase = purchases.find(p => p.lot_id === itemForm.lot_number);
    if (!matchedPurchase) return alert("❌ Lot Selection Missing!");
    
    const remaining = getRemainingBags(matchedPurchase, dispatches);
    const bagsToLoad = parseInt(itemForm.purchase_bags); 
    const manualWeight = parseFloat(itemForm.purchase_weight_kg); 

    if (bagsToLoad > remaining) return alert(`Only ${remaining} bags available in this lot!`);
    
    const stdBagsCalculated = manualWeight / 52.5; 
    const originalRatePerBag = parseFloat(matchedPurchase.rate_per_bag) || 0;
    const calculatedLotValue = stdBagsCalculated * originalRatePerBag; 
    const ratePerKg = originalRatePerBag / 52.5;

    const newLot = {
      lot_number: itemForm.lot_number,
      purchase_bags: bagsToLoad, 
      purchase_weight_kg: manualWeight,
      purchase_rate_per_kg: ratePerKg,
      purchase_lot_value: calculatedLotValue,
      variety_name: varieties.find(v => v.id === matchedPurchase.variety_id)?.name || "N/A",
      grading_name: gradings.find(g => g.id === matchedPurchase.grading_id)?.name || "N/A"
    };

    setForm(p => {
      const updatedDetails = [...p.lot_details, newLot];
      return { 
        ...p, 
        lot_details: updatedDetails,
        total_purchase_amount: updatedDetails.reduce((s, item) => s + item.purchase_lot_value, 0),
        total_dispatch_weight: updatedDetails.reduce((s, item) => s + item.purchase_weight_kg, 0)
      };
    });
    setItemForm({ lot_number: "", purchase_bags: "", purchase_weight_kg: "" });
  };

  const triggerPopMsg = (dispatchObj) => { setPopData(dispatchObj); setShowPopModal(true); };

  const save = async () => {
    if (!form.gatepass_id || !form.destination_party_id || !form.mandi_id || form.lot_details.length === 0) {
      return alert("❌ Complete the form with at least 1 Lot!");
    }
    const { total_purchase_amount, total_dispatch_weight, ...cleanPayload } = form;
    const storedObj = { ...cleanPayload, id: uid() };
    const result = await opsD.addItem(storedObj);
    if (result) {
      setShowForm(false);
      triggerPopMsg({ ...storedObj, total_purchase_amount: form.total_purchase_amount, total_dispatch_weight: form.total_dispatch_weight });
    }
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 14 }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>Dispatches (Truck Dispatch)</span>
        <button onClick={() => { setForm({ gatepass_id: "", vehicle_number: "", driver_name: "", lot_details: [], date: today(), destination_party_id: "", mandi_id: "", cold_storage_id: "", total_expenses: 0, total_purchase_amount: 0, total_dispatch_weight: 0 }); setShowForm(true); }} style={s.btn()}><Icon name="add" size={14} /> New Truck</button>
      </div>

      {dispatches.map(d => {
        const totalBagsInTruck = d.lot_details?.reduce((acc, curr) => acc + (parseInt(curr.purchase_bags) || 0), 0) || 0;
        const totalWeightInTruck = d.lot_details?.reduce((acc, curr) => acc + (parseFloat(curr.purchase_weight_kg) || 0), 0) || 0;
        const totalValueInTruck = d.lot_details?.reduce((acc, curr) => acc + (parseFloat(curr.purchase_lot_value) || 0), 0) || 0;

        return (
          <div key={d.id} style={s.card}>
            <div style={s.rowBetween}><Badge v={`GP: ${d.gatepass_id}`} color={clr.blue} /><strong style={{color: clr.accent}}>{d.vehicle_number}</strong></div>
            <div style={{ fontSize: 13, marginTop: 6, color: clr.muted }}>
              To: <strong>{parties.find(p => p.id === d.destination_party_id)?.name || "N/A"}</strong> | Mandi: {mandis.find(m => m.id === d.mandi_id)?.name || "N/A"}
            </div>
            <div style={s.divider} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 13, background: clr.accent + "0b", padding: 10, borderRadius: 8, border: `1px dashed ${clr.border}` }}>
              <div>Loaded Bags: <strong>{totalBagsInTruck} Bags</strong></div>
              <div>Dispatch Wt: <strong>{totalWeightInTruck} kg</strong></div>
              <div style={{ gridColumn: "1 / span 2", marginTop: 4, borderTop: `1px solid ${clr.border}`, paddingTop: 4 }}>
                Loaded Cost Value: <strong style={{ color: clr.accent, fontSize: "14px" }}>₹{fmt(totalValueInTruck)}</strong>
              </div>
            </div>
            <div style={{ ...s.row, marginTop: 10 }}>
              <button onClick={() => triggerPopMsg({ ...d, total_purchase_amount: totalValueInTruck, total_dispatch_weight: totalWeightInTruck })} style={{ ...s.btnSm(clr.blue + "22", clr.blue), flex: 1 }}><Icon name="info" size={12} color={clr.blue} /> View Details Summary</button>
              <button onClick={() => { if(window.confirm("🚨 Kya aap sach me ye Dispatch Entry delete karna chahte hain?")) opsD.deleteItem(d.id); }} style={{ ...s.btnSm(), color: clr.red }}><Icon name="trash" size={12} color={clr.red} /></button>
            </div>
          </div>
        );
      })}

      <Modal open={showPopModal} onClose={() => setShowPopModal(false)} title="📦 Loaded Dispatch Details Summary">
        {popData && (
          <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
            <div><strong>Gatepass ID:</strong> {popData.gatepass_id}</div>
            <div><strong>Vehicle Number:</strong> {popData.vehicle_number}</div>
            <div><strong>Party Destination:</strong> {parties.find(p => p.id === popData.destination_party_id)?.name || "N/A"}</div>
            <div><strong>Target Mandi:</strong> {mandis.find(m => m.id === popData.mandi_id)?.name || "N/A"}</div>
            <div style={{ background: clr.card2, padding: 8, borderRadius: 6, marginTop: 8, fontSize: "13px" }}>
              <div><strong>📦 Total Dispatch Weight:</strong> {popData.total_dispatch_weight || popData.lot_details?.reduce((s, item) => s + (parseFloat(item.purchase_weight_kg) || 0), 0)} kg</div>
              <div><strong>💰 Total Loaded Value:</strong> <span style={{ color: clr.accent, fontWeight: 700 }}>₹{fmt(popData.total_purchase_amount || popData.lot_details?.reduce((s, item) => s + (parseFloat(item.purchase_lot_value) || 0), 0))}</span></div>
            </div>
            <div style={s.divider} />
            <div style={{ fontWeight: 700, color: clr.accent, marginBottom: 6 }}>LOTS LOADED IN TRUCK:</div>
            {popData.lot_details?.map((l, i) => (
              <div key={i} style={{ background: clr.card2, padding: 8, borderRadius: 6, marginBottom: 6, fontSize: "13px" }}>
                <div>• <strong>Lot ID:</strong> {l.lot_number}</div>
                <div>• <strong>Variety:</strong> {l.variety_name || "N/A"} | <strong>Grading:</strong> {l.grading_name || "N/A"}</div>
                <div>• <strong>Bags Count:</strong> {l.purchase_bags} Bags</div>
                <div>• <strong>Weight/Value:</strong> {l.purchase_weight_kg} kg (~₹{fmt(l.purchase_lot_value)})</div>
              </div>
            ))}
            <div style={s.divider} />
            <button onClick={() => setShowPopModal(false)} style={s.btn(clr.green, "#fff")}>Acknowledge Close</button>
          </div>
        )}
      </Modal>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Dispatch Entry">
        <Field label="Gatepass ID"><input style={s.input} value={form.gatepass_id} onChange={e => setForm({ ...form, gatepass_id: e.target.value })} /></Field>
        <Field label="Vehicle Number"><input style={s.input} value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} /></Field>
        <Field label="Destination Party"><select style={s.select} value={form.destination_party_id} onChange={e => setForm({ ...form, destination_party_id: e.target.value })}><option value="">Select Party</option>{parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Target Mandi"><select style={s.select} value={form.mandi_id} onChange={e => setForm({ ...form, mandi_id: e.target.value })}><option value="">Select Mandi</option>{mandis.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
        <div style={{ ...s.card2, background: clr.card, padding: 10, marginBottom: 12 }}>
          <div style={s.label}>🚚 Load Multiple Lots into Truck</div>
          <select style={{ ...s.select, marginBottom: 6 }} value={itemForm.lot_number} onChange={e => setItemForm({ ...itemForm, lot_number: e.target.value })}><option value="">Select Available Lot</option>{availableLots.map(l => <option key={l.id} value={l.lot_id}>{l.lot_id}</option>)}</select>
          <input type="number" style={{ ...s.input, marginBottom: 6 }} placeholder="Bags Count" value={itemForm.purchase_bags} onChange={e => setItemForm({ ...itemForm, purchase_bags: e.target.value })} />
          <input type="number" style={{ ...s.input, marginBottom: 6 }} placeholder="Enter Weight (kg)" value={itemForm.purchase_weight_kg} onChange={e => setItemForm({ ...itemForm, purchase_weight_kg: e.target.value })} />
          <button onClick={addLotToTruck} style={{ ...s.btnSm(clr.accent, "#000"), width: "100%" }}>+ Add Lot & Calculate Value</button>
        </div>
        {form.lot_details.length > 0 && (
          <div style={{ marginBottom: 10, fontSize: 13, background: clr.card2, padding: 10, borderRadius: 8 }}>
            <strong>Selected Lots Queue:</strong>
            {form.lot_details.map((l, i) => (
              <div key={i} style={{ color: clr.green, marginTop: 4 }}>• Lot {l.lot_number} — {l.purchase_bags} Bags ({l.purchase_weight_kg} kg)</div>
            ))}
            <div style={{ borderTop: `1px dashed ${clr.border}`, marginTop: 6, paddingTop: 6, color: clr.accent }}>
              Current Running Load Value: <strong>₹{fmt(form.total_purchase_amount)}</strong>
            </div>
          </div>
        )}
        <button onClick={save} style={{ ...s.btn() }}>Submit Dispatches</button>
      </Modal>
    </div>
  );
};

// ===== MANDI SALE SCREEN =====
const SaleScreen = ({ dispatches, opsD }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedDispatchId, setSelectedDispatchId] = useState("");
  const [form, setForm] = useState({ id: "", gatepass_id: "", total_mandi_weight_received: "", total_mandi_sale_amount: "", total_expenses: 0, original_load_value: 0 });

  const loadDispatchData = (dispatchId) => {
    setSelectedDispatchId(dispatchId);
    const targetDispatch = dispatches.find(d => d.id === dispatchId);
    if (targetDispatch) {
      const dispatchWeight = targetDispatch.lot_details?.reduce((s, item) => s + (parseFloat(item.purchase_weight_kg) || 0), 0) || 0;
      const dispatchCostValue = targetDispatch.lot_details?.reduce((s, item) => s + (parseFloat(item.purchase_lot_value) || 0), 0) || 0;
      setForm({
        id: targetDispatch.id, gatepass_id: targetDispatch.gatepass_id,
        total_mandi_weight_received: dispatchWeight, total_mandi_sale_amount: "", total_expenses: 0, original_load_value: dispatchCostValue
      });
    }
  };

  const saveMandiInvoice = async () => {
    if (!form.gatepass_id || !form.total_mandi_sale_amount || !form.total_mandi_weight_received) {
      return alert("❌ Please fill Mandi Weight and Total Sale Amount!");
    }
    const finalPayload = {
      total_mandi_weight_received: parseFloat(form.total_mandi_weight_received) || 0,
      total_mandi_sale_amount: parseFloat(form.total_mandi_sale_amount) || 0,
      total_expenses: parseFloat(form.total_expenses) || 0
    };
    const success = await opsD.editItem(form.id, finalPayload);
    if (success) { setShowForm(false); setSelectedDispatchId(""); }
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 14 }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>Mandi Sales Book</span>
        <button onClick={() => { setSelectedDispatchId(""); setForm({ id: "", gatepass_id: "", total_mandi_weight_received: "", total_mandi_sale_amount: "", total_expenses: 0, original_load_value: 0 }); setShowForm(true); }} style={s.btn(clr.green, "#fff")}>New Mandi Sale Entry</button>
      </div>

      {dispatches.filter(d => (d.total_mandi_sale_amount || 0) > 0).map(sx => {
        const loadedValue = sx.lot_details?.reduce((s, item) => s + (parseFloat(item.purchase_lot_value) || 0), 0) || 0;
        const currentExp = parseFloat(sx.total_expenses) || 0;
        return (
          <div key={sx.id} style={s.card}>
            <div style={s.rowBetween}><Badge v={`GP Link: ${sx.gatepass_id}`} color={clr.green} /><strong>Sale: ₹{fmt(sx.total_mandi_sale_amount)}</strong></div>
            <div style={{ fontSize: 13, color: clr.muted, marginTop: 6, background: "#0001", padding: 6, borderRadius: 6 }}>
              <div>Mandi Wt Received: <strong>{sx.total_mandi_weight_received} kg</strong></div>
              <div>Expenses Registered: <strong style={{ color: clr.orange }}>₹{fmt(currentExp)}</strong></div>
              <div style={{ marginTop: 2, color: clr.accent }}>Original Truck Loaded Value: <strong>₹{fmt(loadedValue)}</strong></div>
            </div>
          </div>
        );
      })}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Record Simple Mandi Sale">
        <select style={s.select} value={selectedDispatchId} onChange={e => loadDispatchData(e.target.value)}>
          <option value="">Select Dispatched GP</option>
          {dispatches.filter(d => !d.total_mandi_sale_amount || d.total_mandi_sale_amount === 0).map(d => (
            <option key={d.id} value={d.id}>{d.gatepass_id} ({d.vehicle_number})</option>
          ))}
        </select>
        {form.gatepass_id && (
          <>
            <div style={{ background: clr.card2, padding: 10, borderRadius: 8, margin: "12px 0", fontSize: "13px", borderLeft: `3px solid ${clr.accent}` }}>
              ⚠️ **Truck History Monitor:** Is vehicle mein total **₹{fmt(form.original_load_value)}** ki cost ka maal load kiya gaya tha.
            </div>
            <Field label="Total Mandi Received Weight (kg)">
              <input type="number" style={s.input} value={form.total_mandi_weight_received} onChange={e => setForm({ ...form, total_mandi_weight_received: e.target.value })} />
            </Field>
            <Field label="Total Sale Amount (₹)">
              <input type="number" style={s.input} value={form.total_mandi_sale_amount} onChange={e => setForm({ ...form, total_mandi_sale_amount: e.target.value })} />
            </Field>
            <Field label="All Expenses (₹)">
              <input type="number" style={s.input} placeholder="Enter Mandi Expenses / Freight..." value={form.total_expenses} onChange={e => setForm({ ...form, total_expenses: e.target.value })} />
            </Field>
            <button onClick={saveMandiInvoice} style={{ ...s.btn(clr.green, "#fff"), marginTop: 12 }}>Save Mandi Sale</button>
          </>
        )}
      </Modal>
    </div>
  );
};

// ===== FINANCIAL PAYMENTS (FULLY EDITABLE & DELETABLE) =====
const PaymentScreen = ({ dispatches, payments, opsPayment, parties }) => {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ gatepass_id: "", amount: "", payment_mode: "cash", date: today(), notes: "" });

  const save = async () => {
    if (!form.gatepass_id || !form.amount) return alert("❌ Fill values fields!");
    
    if (editItem) {
      const success = await opsPayment.editItem(editItem.id, form);
      if (success) { setShowForm(false); setEditItem(null); }
    } else {
      await opsPayment.addItem({ id: uid(), ...form });
      setShowForm(false);
    }
  };

  // Safe Confirmation Popup based Entry Deletion
  const triggerDelete = async (id) => {
    const isConfirmed = window.confirm("🚨 Kya aap sach me ye party payment receipt permanent delete karna chahte hain?");
    if (isConfirmed) {
      await opsPayment.deleteItem(id);
    }
  };

  const activePartiesSummary = parties.map(p => {
    const dispatchesToParty = dispatches.filter(d => d.destination_party_id === p.id);
    const totalSale = dispatchesToParty.reduce((sum, d) => sum + (parseFloat(d.total_mandi_sale_amount) || 0), 0);
    const gpsToParty = dispatchesToParty.map(d => d.gatepass_id);
    
    const gpBreakdown = dispatchesToParty.map(d => {
      const gpSale = parseFloat(d.total_mandi_sale_amount) || 0;
      const gpPaidLogs = payments.filter(py => py.gatepass_id === d.gatepass_id);
      const gpPaid = gpPaidLogs.reduce((sum, py) => sum + (parseFloat(py.amount) || 0), 0);
      return { gatepass_id: d.gatepass_id, vehicle: d.vehicle_number, sale: gpSale, paid: gpPaid, due: gpSale - gpPaid, logs: gpPaidLogs };
    });

    const totalPaidAmount = payments.filter(py => gpsToParty.includes(py.gatepass_id)).reduce((sum, py) => sum + (parseFloat(py.amount) || 0), 0);

    return { id: p.id, name: p.name, totalSale, paidAmount: totalPaidAmount, due: totalSale - totalPaidAmount, gpBreakdown };
  }).filter(p => p.gpBreakdown.length > 0 || p.due !== 0);

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 14 }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>Party Ledgers (Active)</span>
        <button onClick={() => { setEditItem(null); setForm({ gatepass_id: "", amount: "", payment_mode: "cash", date: today(), notes: "" }); setShowForm(true); }} style={s.btn(clr.orange, "#000")}>+ Record Cash Receipts</button>
      </div>

      {activePartiesSummary.length === 0 ? (
        <div style={{ ...s.card, color: clr.muted, textAlign: "center", padding: 20 }}>Koi active party ya history transaction nahi mila.</div>
      ) : (
        activePartiesSummary.map(p => (
          <div key={p.id} style={{ ...s.card, marginBottom: 14 }}>
            <div style={s.rowBetween}>
              <span style={{ fontWeight: 800, fontSize: 16, color: clr.accent }}>{p.name}</span>
              <strong style={{ color: p.due > 0 ? clr.red : clr.green }}>Net Due: ₹{fmt(p.due)}</strong>
            </div>
            
            <div style={{ marginTop: 10, background: clr.card2, borderRadius: 8, padding: 10 }}>
              <div style={{ ...s.label, fontSize: "11px", color: clr.muted, marginBottom: 6 }}>Gatepass Payment History</div>
              {p.gpBreakdown.map((gp, idx) => (
                <div key={idx} style={{ fontSize: 13, borderBottom: idx !== p.gpBreakdown.length - 1 ? `1px solid ${clr.border}` : "none", padding: "6px 0" }}>
                  <div style={s.rowBetween}>
                    <span><strong>GP: {gp.gatepass_id}</strong> ({gp.vehicle})</span>
                    <span style={{ fontSize: 12, color: clr.muted }}>Sale: ₹{fmt(gp.sale)}</span>
                  </div>
                  
                  {gp.logs.map((l, lIdx) => (
                    <div key={lIdx} style={{ ...s.rowBetween, marginTop: 4, background: "#0002", padding: "4px 8px", borderRadius: 4 }}>
                      <span style={{ fontSize: 12, color: clr.green }}>Received: ₹{fmt(l.amount)} ({l.payment_mode})</span>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button 
                          onClick={() => { setEditItem(l); setForm({ ...l }); setShowForm(true); }} 
                          style={{ ...s.btnSm(), padding: "2px 6px", fontSize: "11px" }}>
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => triggerDelete(l.id)} 
                          style={{ ...s.btnSm(), padding: "2px 6px", fontSize: "11px", color: clr.red, borderColor: clr.red + "55" }}>
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  <div style={{ ...s.rowBetween, marginTop: 4, fontSize: 12, borderTop: `1px dashed ${clr.border}`, paddingTop: 2 }}>
                    <span>Total Paid: ₹{fmt(gp.paid)}</span>
                    <span style={{ color: gp.due > 0 ? clr.red : clr.green, fontWeight: 600 }}>Remaining: ₹{fmt(gp.due)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Edit Payment Receipt" : "Record Payment Receipt"}>
        <Field label="Link Gatepass Code">
          <select style={s.select} value={form.gatepass_id} onChange={e => setForm({ ...form, gatepass_id: e.target.value })} disabled={!!editItem}>
            <option value="">Select GP Track</option>
            {dispatches.filter(d => (d.total_mandi_sale_amount || 0) > 0).map(s => <option key={s.id} value={s.gatepass_id}>{s.gatepass_id} ({s.vehicle_number})</option>)}
          </select>
        </Field>
        <Field label="Amount Received (₹)"><input type="number" style={s.input} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></Field>
        <Field label="Payment Mode">
          <select style={s.select} value={form.payment_mode} onChange={e => setForm({ ...form, payment_mode: e.target.value })}><option value="cash">Cash</option><option value="IMPS">IMPS / NetBanking</option><option value="UPI">UPI</option></select>
        </Field>
        <Field label="Date"><input type="date" style={s.input} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>
        <button onClick={save} style={s.btn(clr.orange, "#000")}>{editItem ? "Update Receipt Log" : "Log Payment Receipt"}</button>
      </Modal>
    </div>
  );
};

// ===== COLD STORAGE DUE & HISTORY =====
const ColdStorageDueScreen = ({ purchases, coldStorages, coldPayments, opsColdPayment }) => {
  const [showPayForm, setShowPayForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [payForm, setPayForm] = useState({ cold_storage_id: "", amount: "", payment_mode: "cash", date: today() });

  const saveColdPayment = async () => {
    if (!payForm.cold_storage_id || !payForm.amount) return alert("❌ Please fill Cold Storage and Amount!");
    
    if (editItem) {
      const success = await opsColdPayment.editItem(editItem.id, payForm);
      if (success) { setShowPayForm(false); setEditItem(null); }
    } else {
      await opsColdPayment.addItem({ id: uid(), ...payForm });
      setShowPayForm(false);
    }
    setPayForm({ cold_storage_id: "", amount: "", payment_mode: "cash", date: today() });
  };

  const triggerColdDelete = async (id) => {
    if (window.confirm("🚨 Kya aap sach me ye Cold Storage payment entry delete karna chahte hain?")) {
      await opsColdPayment.deleteItem(id);
    }
  };

  const activeColdSummary = coldStorages.map(cs => {
    const lotsAtCS = purchases.filter(p => p.cold_storage_id === cs.id);
    const totalPurchasedCost = lotsAtCS.reduce((sum, p) => sum + (parseFloat(p.total_cost) || 0), 0);
    const totalPaidToCold = coldPayments.filter(cp => cp.cold_storage_id === cs.id).reduce((sum, cp) => sum + (parseFloat(cp.amount) || 0), 0);
    const historyLogs = coldPayments.filter(cp => cp.cold_storage_id === cs.id).sort((a,b) => new Date(b.date) - new Date(a.date));

    return { id: cs.id, name: cs.name, totalPurchasedCost, totalPaidToCold, remainingDue: totalPurchasedCost - totalPaidToCold, historyLogs };
  }).filter(c => c.totalPurchasedCost > 0 || c.historyLogs.length > 0 || c.remainingDue !== 0);

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 14 }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>❄️ Cold Outstandings (Active)</span>
        <button onClick={() => { setEditItem(null); setPayForm({ cold_storage_id: "", amount: "", payment_mode: "cash", date: today() }); setShowPayForm(true); }} style={s.btnSm(clr.orange + "22", clr.orange)}>+ Record Paid to Cold</button>
      </div>

      {activeColdSummary.length === 0 ? (
        <div style={{ ...s.card, color: clr.muted, textAlign: "center", padding: 20 }}>Koi active cold storage records ya stock nahi mila.</div>
      ) : (
        activeColdSummary.map(cs => (
          <div key={cs.id} style={{ ...s.card, marginBottom: 12 }}>
            <div style={s.rowBetween}>
              <span style={{ fontWeight: 800, fontSize: 15 }}>{cs.name}</span>
              <strong style={{ color: cs.remainingDue > 0 ? clr.orange : clr.green, fontSize: 16 }}>Due: ₹{fmt(cs.remainingDue)}</strong>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 12, color: clr.muted, marginTop: 4 }}>
              <div>Total Booked: <strong>Alternative Cost</strong></div>
              <div>Total Paid: <strong style={{ color: clr.green }}>₹{fmt(cs.totalPaidToCold)}</strong></div>
            </div>

            <div style={{ marginTop: 10, background: clr.card2, borderRadius: 8, padding: 10 }}>
              <div style={{ ...s.label, fontSize: "11px", color: clr.muted, marginBottom: 4 }}>Payment Ledger History</div>
              {cs.historyLogs.length === 0 ? (
                <div style={{ fontSize: 12, color: clr.muted }}>No past payments recorded.</div>
              ) : (
                cs.historyLogs.map((log, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, padding: "6px 0", borderBottom: idx !== cs.historyLogs.length - 1 ? `1px solid ${clr.border}` : "none" }}>
                    <span>📅 {log.date} — Paid <strong style={{ color: clr.green }}>₹{fmt(log.amount)}</strong> ({log.payment_mode})</span>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button 
                        onClick={() => { setEditItem(log); setPayForm({ ...log }); setShowPayForm(true); }} 
                        style={{ ...s.btnSm(), padding: "2px 6px", fontSize: "11px" }}>
                        ✏️
                      </button>
                      <button 
                        onClick={() => triggerColdDelete(log.id)} 
                        style={{ ...s.btnSm(), padding: "2px 6px", fontSize: "11px", color: clr.red }}>
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))
      )}

      <Modal open={showPayForm} onClose={() => setShowPayForm(false)} title={editItem ? "Edit Cold Storage Payment" : "Record Cold Storage Payment"}>
        <Field label="Select Cold Storage">
          <select style={s.select} value={payForm.cold_storage_id} onChange={e => setPayForm({ ...payForm, cold_storage_id: e.target.value })} disabled={!!editItem}>
            <option value="">Choose Storage Location</option>
            {coldStorages.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Amount Paid (₹)"><input type="number" style={s.input} value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} /></Field>
        <Field label="Payment Method">
          <select style={s.select} value={form.payment_mode} onChange={e => setPayForm({ ...payForm, payment_mode: e.target.value })}><option value="cash">Cash</option><option value="IMPS">IMPS / NetBanking</option><option value="UPI">UPI</option><option value="Cheque">Cheque</option></select>
        </Field>
        <Field label="Payment Date"><input type="date" style={s.input} value={payForm.date} onChange={e => setPayForm({ ...payForm, date: e.target.value })} /></Field>
        <button onClick={saveColdPayment} style={s.btn(clr.orange, "#000")}>{editItem ? "Update Storage Entry" : "Log Cold Payment Entry"}</button>
      </Modal>
    </div>
  );
};

// ===== PROFIT REALIZATION REPORT =====
const PnLScreen = ({ dispatches, parties, mandis }) => {
  return (
    <div style={s.content}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>Realized Profit & Loss Statements</div>
      {dispatches.filter(d => (d.total_mandi_sale_amount || 0) > 0).map(sale => {
        const partyName = parties.find(p => p.id === sale.destination_party_id)?.name || "Unknown";
        const mandiName = mandis.find(m => m.id === sale.mandi_id)?.name || "Unknown";
        const totalPurchaseCost = sale.lot_details?.reduce((s, item) => s + (parseFloat(item.purchase_lot_value) || 0), 0) || 0;
        const currentExp = parseFloat(sale.total_expenses) || 0;
        const netMargin = sale.total_mandi_sale_amount - totalPurchaseCost - currentExp;

        return (
          <div key={sale.id} style={{ ...s.card, borderLeft: `4px solid ${clr.blue}` }}>
            <div style={s.rowBetween}><Badge v={`GP: ${sale.gatepass_id}`} color={clr.blue} /><strong style={{ color: clr.green, fontSize: 14 }}>{mandiName}</strong></div>
            <div style={{ fontSize: 13, color: clr.muted, marginTop: 4 }}>Party Reference: <strong>{partyName}</strong></div>
            <div style={s.divider} />
            <div style={{ fontSize: 13, background: clr.card2, padding: 8, borderRadius: 8 }}>
              <div>Stock Purchase Cost: <strong>₹{fmt(totalPurchaseCost)}</strong></div>
              <div>Gross Sale Revenue: <strong style={{ color: clr.green }}>₹{fmt(sale.total_mandi_sale_amount)}</strong></div>
              <div>Mandi Expenses Registered: <strong style={{ color: clr.orange }}>₹{fmt(currentExp)}</strong></div>
              <div style={{ borderTop: `1px solid ${clr.border}`, paddingTop: 6, marginTop: 6 }}>
                Net Net GP Margin: <strong style={{ fontSize: 15, color: netMargin >= 0 ? clr.green : clr.red }}>₹{fmt(netMargin)}</strong>
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

  const triggerMasterDelete = async (id) => {
    if (window.confirm(`🚨 Kya aap sach me ye registry item delete karna chahte hain?`)) {
      await ops.deleteItem(id);
    }
  };

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={s.rowBetween}><span style={{ fontWeight: 700, fontSize: 15 }}>{title} Registry</span><button onClick={() => setShowForm(true)} style={s.btnSm()}>+ Add</button></div>
      {items.map(item => (
        <div key={item.id} style={{ ...s.card2, margin: "6px 0", fontSize: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{item[fields[0].key]}</span>
          <button onClick={() => triggerMasterDelete(item.id)} style={{ background: "none", border: "none", color: clr.red, cursor: "pointer", fontSize: "12px" }}>🗑️</button>
        </div>
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
  const payments = useSupabaseTable("payments");
  const coldPayments = useSupabaseTable("cold_payments");

  // Global Safe Loading Mechanism to Prevent Cold Screen Blanks
  const isGlobalLoading = 
    varieties.loading || gradings.loading || coldStorages.loading || 
    mandis.loading || parties.loading || purchases.loading || 
    dispatches.loading || payments.loading || coldPayments.loading;

  if (isGlobalLoading) {
    return (
      <div style={{ ...s.screen, display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column", gap: "12px" }}>
        <div style={{ fontSize: "24px" }}>🥔</div>
        <span style={{ color: clr.accent, fontWeight: 700, fontSize: "16px" }}>Loading AlooTrader Database...</span>
        <span style={{ color: clr.muted, fontSize: "13px" }}>Please wait while sync stabilizes.</span>
      </div>
    );
  }

  return (
    <div style={s.screen}>
      <div style={s.header}>
        <span style={{ fontWeight: 900, fontSize: 18, color: clr.accent }}>🥔 AlooTrader v5.5</span>
        <Badge v={activeTab.toUpperCase()} color={clr.blue} />
      </div>

      {activeTab === "dashboard" && <DashboardScreen purchases={purchases.data} dispatches={dispatches.data} payments={payments.data} mandis={mandis.data} />}
      {activeTab === "purchase" && <PurchaseScreen purchases={purchases.data} dispatches={dispatches.data} opsP={purchases} varieties={varieties.data} gradings={gradings.data} coldStorages={coldStorages.data} />}
      {activeTab === "dispatch" && <DispatchScreen dispatches={dispatches.data} purchases={purchases.data} opsD={dispatches} parties={parties.data} mandis={mandis.data} varieties={varieties.data} gradings={gradings.data} />}
      {activeTab === "sale" && <SaleScreen dispatches={dispatches.data} opsD={dispatches} />}
      {activeTab === "payment" && <PaymentScreen dispatches={dispatches.data} purchases={purchases.data} payments={payments.data} opsPayment={payments} parties={parties.data} />}
      {activeTab === "colddue" && <ColdStorageDueScreen purchases={purchases.data} coldStorages={coldStorages.data} coldPayments={coldPayments.data} opsColdPayment={coldPayments} />}
      {activeTab === "pnl" && <PnLScreen dispatches={dispatches.data} parties={parties.data} mandis={mandis.data} />}
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
