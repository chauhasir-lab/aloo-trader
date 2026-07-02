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
      const payload = { ...item, created_at: new Date().toISOString() };
      if (payload.items && typeof payload.items !== "string") payload.items = JSON.stringify(payload.items);
      if (payload.lot_sales && typeof payload.lot_sales !== "string") payload.lot_sales = JSON.stringify(payload.lot_sales);

      const { data: d, error: err } = await supabase.from(tableName).insert([payload]).select();
      if (err) { alert(`Error saving: ${err.message}`); return null; }
      if (d && d.length > 0) {
        const returnedData = d[0];
        if (returnedData.items && typeof returnedData.items === "string") returnedData.items = JSON.parse(returnedData.items);
        if (returnedData.lot_sales && typeof returnedData.lot_sales === "string") returnedData.lot_sales = JSON.parse(returnedData.lot_sales);
        setData([returnedData, ...data]);
        return returnedData;
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
      setData(data.map(x => x.id === id ? { ...x, ...updates } : x));
      return true;
    } catch (e) { alert(`Error: ${e.message}`); return false; }
  };

  const deleteItem = async (id) => {
    try {
      const { error: err } = await supabase.from(tableName).delete().eq("id", id);
      if (err) { alert(`Error deleting: ${err.message}`); return false; }
      setData(data.filter(x => x.id !== id));
      return true;
    } catch (e) { alert(`Error: ${e.message}`); return false; }
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

const Badge = ({ v, color = clr.accent }) => (
  <span style={{ background: color + "22", color: color, borderRadius: 4, padding: "3px 8px", fontSize: 11, fontWeight: 700, display: "inline-block" }}>
    {v}
  </span>
);

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
  btn: (bg = clr.accent, txt = "#000") => ({ background: bg, color: txt, border: "none", borderRadius: 6, padding: "9px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }),
  btnSm: (bg = clr.card2, txt = clr.text) => ({ background: bg, color: txt, border: `1px solid ${clr.border}`, borderRadius: 5, padding: "5px 8px", fontWeight: 600, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }),
  tag: (bg = clr.accent + "22", txt = clr.accent) => ({ background: bg, color: txt, borderRadius: 4, padding: "2px 6px", fontSize: 10, fontWeight: 700 }),
  content: { padding: 12, paddingBottom: 80 },
  navBar: { position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", background: clr.card, borderTop: `1px solid ${clr.border}`, display: "flex", zIndex: 200 },
  navItem: (active) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 4px", gap: 2, background: "none", border: "none", color: active ? clr.accent : clr.muted, fontSize: 9, cursor: "pointer" }),
  divider: { height: 1, background: clr.border, margin: "6px 0" }
};

// DASHBOARD
const DashboardScreen = ({ purchases, dispatches, sales, parties, mandis }) => {
  const [searchKey, setSearchKey] = useState("");
  
  const activeLots = purchases.filter(p => getRemainingBags(p, dispatches) > 0).length;
  const closedLots = purchases.filter(p => getRemainingBags(p, dispatches) <= 0).length;

  const totalBagsPurchased = purchases.reduce((sum, p) => sum + (parseFloat(p.manual_bags) || 0), 0);
  const totalDispatchedBags = dispatches.flatMap(d => d.items || []).reduce((sum, i) => sum + (parseFloat(i.loaded_bags) || 0), 0);
  const remainingBags = totalBagsPurchased - totalDispatchedBags;

  const totalSaleValue = sales.reduce((sum, s) => sum + (parseFloat(s.total_sale_value) || 0), 0);
  const totalExpenses = sales.reduce((sum, s) => sum + (parseFloat(s.total_expenses) || 0), 0);
  
  const activeDispatchedPurchaseCost = sales.reduce((sum, s) => {
    return sum + (s.lot_sales?.reduce((lotSum, ls) => {
      const origPurchase = purchases.find(p => p.lot_id === ls.lot_id);
      return lotSum + ((parseFloat(ls.loaded_bags) || 0) * (parseFloat(origPurchase?.rate_per_bag) || 0));
    }, 0) || 0);
  }, 0);

  const realizedProfit = totalSaleValue - activeDispatchedPurchaseCost - totalExpenses;

  return (
    <div style={s.content}>
      {/* Realized Metrics Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
        <div style={{ ...s.card2, background: clr.blue + "15" }}><div style={s.label}>Active Lots</div><div style={{ fontSize: 18, fontWeight: 800, color: clr.blue }}>{activeLots}</div></div>
        <div style={{ ...s.card2, background: clr.green + "15" }}><div style={s.label}>Closed Lots</div><div style={{ fontSize: 18, fontWeight: 800, color: clr.green }}>{closedLots}</div></div>
        <div style={{ ...s.card2, background: clr.purple + "15" }}><div style={s.label}>Total Dispatched</div><div style={{ fontSize: 16, fontWeight: 800, color: clr.purple }}>{totalDispatchedBags} Bags</div></div>
        <div style={{ ...s.card2, background: clr.orange + "15" }}><div style={s.label}>Total Remaining</div><div style={{ fontSize: 16, fontWeight: 800, color: clr.orange }}>{remainingBags} Bags</div></div>
      </div>

      {/* P&L Performance */}
      <div style={{ ...s.card, background: (realizedProfit >= 0 ? clr.green : clr.red) + "15" }}>
        <div style={s.label}>Realized Operational P&L</div>
        <div style={s.divider} />
        <div style={{ fontSize: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Dispatched Stock Cost:</span><strong>₹{fmt(activeDispatchedPurchaseCost)}</strong></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Gross Sales Value:</span><strong style={{ color: clr.green }}>₹{fmt(totalSaleValue)}</strong></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Mandi/Transport Expenses:</span><strong style={{ color: clr.orange }}>₹{fmt(totalExpenses)}</strong></div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${clr.border}`, paddingTop: 6 }}><span style={{ fontWeight: 600 }}>Net Actual Profit:</span><strong style={{ color: realizedProfit >= 0 ? clr.green : clr.red, fontSize: 14 }}>₹{fmt(realizedProfit)}</strong></div>
        </div>
      </div>

      {/* RECENT ENTRIES WIDGETS */}
      <div style={{ marginTop: 14 }}>
        <div style={s.label}>Recent Purchases (Last 3)</div>
        {purchases.slice(0, 3).map(p => (
          <div key={p.id} style={{ ...s.card2, fontSize: 12, display: "flex", justifyContent: "space-between" }}>
            <span>Lot *{p.lot_id}* ({p.farmer_name})</span><strong>{p.manual_bags} Bags</strong>
          </div>
        ))}

        <div style={{ ...s.label, marginTop: 10 }}>Recent Dispatches (Last 3)</div>
        {dispatches.slice(0, 3).map(d => (
          <div key={d.id} style={{ ...s.card2, fontSize: 12, display: "flex", justifyContent: "space-between" }}>
            <span>GP: *{d.gatepass_id}* ({d.vehicle_number})</span><span style={{ color: clr.blue }}>Sent</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// PURCHASE SCREEN WITH STATUS TRACKING
const PurchaseScreen = ({ purchases, dispatches, opsP, varieties, gradings, coldStorages }) => {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ lot_id: "", farmer_name: "", manual_bags: "", total_weight: "", rate_per_bag: "", variety_id: "", grading_id: "", cold_storage_id: "", date: today() });
  
  const save = async () => {
    if (!form.lot_id || !form.farmer_name || !form.manual_bags || !form.rate_per_bag) return alert("❌ Fill all required fields!");
    const currentStdBags = form.total_weight ? (parseFloat(form.total_weight) / 52.5).toFixed(2) : "0.00";
    const currentTotalCost = (parseFloat(form.manual_bags) || 0) * (parseFloat(form.rate_per_bag) || 0);
    
    if (editItem) {
      await opsP.editItem(editItem.id, { ...form, std_bags: currentStdBags, total_cost: currentTotalCost });
    } else {
      await opsP.addItem({ id: uid(), ...form, std_bags: currentStdBags, total_cost: currentTotalCost, is_closed: false });
    }
    setShowForm(false); setEditItem(null);
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Purchases & Inventory</span>
        <button onClick={() => { setEditItem(null); setForm({ lot_id: "", farmer_name: "", manual_bags: "", total_weight: "", rate_per_bag: "", variety_id: "", grading_id: "", cold_storage_id: "", date: today() }); setShowForm(true); }} style={s.btn()}><Icon name="add" size={12} /> New</button>
      </div>

      {purchases.map(p => {
        const remaining = getRemainingBags(p, dispatches);
        const isClosed = remaining <= 0;
        return (
          <div key={p.id} style={{ ...s.card, borderLeft: `3px solid ${isClosed ? clr.red : clr.green}` }}>
            <div style={s.rowBetween}>
              <div style={s.row}>
                <Badge v={p.lot_id} color={isClosed ? clr.red : clr.accent} />
                {isClosed && <span style={{ fontSize: 10, color: clr.red, fontWeight: "bold" }}>[CLOSED]</span>}
              </div>
              <span>{p.farmer_name}</span>
            </div>
            <div style={{ fontSize: 11, color: clr.muted, marginTop: 4 }}>Storage: {coldStorages.find(c => c.id === p.cold_storage_id)?.name || "Direct"}</div>
            <div style={s.divider} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <span>Total Bags: <strong>{p.manual_bags}</strong></span>
              <span style={{ color: isClosed ? clr.red : clr.green }}>Remaining: <strong>{remaining}</strong></span>
            </div>
            <div style={{ ...s.row, marginTop: 8 }}>
              <button onClick={() => { setEditItem(p); setForm({ ...p }); setShowForm(true); }} style={{ ...s.btnSm(), flex: 1 }}><Icon name="edit" size={10} /></button>
              <button onClick={() => { if(window.confirm("Delete?")) opsP.deleteItem(p.id); }} style={{ ...s.btnSm(), flex: 1 }}><Icon name="trash" size={10} color={clr.red} /></button>
            </div>
          </div>
        );
      })}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Purchase Form">
        <Field label="Lot ID"><input style={s.input} value={form.lot_id} onChange={e => setForm({ ...form, lot_id: e.target.value })} /></Field>
        <Field label="Farmer Name"><input style={s.input} value={form.farmer_name} onChange={e => setForm({ ...form, farmer_name: e.target.value })} /></Field>
        <Field label="Bags"><input type="number" style={s.input} value={form.manual_bags} onChange={e => setForm({ ...form, manual_bags: e.target.value })} /></Field>
        <Field label="Weight"><input type="number" style={s.input} value={form.total_weight} onChange={e => setForm({ ...form, total_weight: e.target.value })} /></Field>
        <Field label="Rate"><input type="number" style={s.input} value={form.rate_per_bag} onChange={e => setForm({ ...form, rate_per_bag: e.target.value })} /></Field>
        <Field label="Cold Storage"><select style={s.select} value={form.cold_storage_id} onChange={e => setForm({ ...form, cold_storage_id: e.target.value })}><option value="">Select Storage</option>{coldStorages.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <button onClick={save} style={{ ...s.btn(), width: "100%" }}>Save</button>
      </Modal>
    </div>
  );
};

// DISPATCH SCREEN
const DispatchScreen = ({ dispatches, purchases, opsD, parties, mandis, coldStorages }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ gatepass_id: "", vehicle_number: "", driver_name: "", items: [], date: today(), destination_party_id: "", mandi_id: "", cold_storage_id: "" });
  const [itemForm, setItemForm] = useState({ lot_id: "", loaded_bags: "", loaded_weight: "" });

  const availableLots = purchases.filter(p => getRemainingBags(p, dispatches) > 0);

  const addItem = () => {
    if (!itemForm.lot_id || !itemForm.loaded_bags || !itemForm.loaded_weight) return alert("Fill lot details");
    const lot = purchases.find(p => p.lot_id === itemForm.lot_id);
    const remaining = getRemainingBags(lot, dispatches);
    if (parseFloat(itemForm.loaded_bags) > remaining) return alert(`Only ${remaining} available`);
    const stdBags = (parseFloat(itemForm.loaded_weight) / 52.5).toFixed(2);
    setForm(p => ({ ...p, items: [...p.items, { ...itemForm, std_bags: stdBags, loaded_cost: stdBags * (lot.rate_per_bag || 0), variety_id: lot.variety_id }] }));
    setItemForm({ lot_id: "", loaded_bags: "", loaded_weight: "" });
  };

  const save = async () => {
    if (!form.gatepass_id || !form.destination_party_id || !form.mandi_id || form.items.length === 0) return alert("❌ Fill values!");
    await opsD.addItem({ ...form, id: uid() });
    setShowForm(false);
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Logistics Log</span>
        <button onClick={() => { setForm({ gatepass_id: "", vehicle_number: "", driver_name: "", items: [], date: today(), destination_party_id: "", mandi_id: "", cold_storage_id: "" }); setShowForm(true); }} style={s.btn()}><Icon name="add" size={12} /> New</button>
      </div>

      {dispatches.map(d => (
        <div key={d.id} style={s.card}>
          <div style={s.rowBetween}><Badge v={`GP: ${d.gatepass_id}`} color={clr.blue} /><span>{d.vehicle_number}</span></div>
          <div style={{ fontSize: 11, marginTop: 4, color: clr.muted }}>
            Party: <strong>{parties.find(p => p.id === d.destination_party_id)?.name || "N/A"}</strong> | Storage: <strong>{coldStorages.find(c => c.id === d.cold_storage_id)?.name || "Direct"}</strong>
          </div>
          <button onClick={() => { if(window.confirm("Delete?")) opsD.deleteItem(d.id); }} style={{ ...s.btnSm(), marginTop: 6, color: clr.red }}><Icon name="trash" size={10} color={clr.red} /> Delete</button>
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Dispatch">
        <Field label="Gatepass ID"><input style={s.input} value={form.gatepass_id} onChange={e => setForm({ ...form, gatepass_id: e.target.value })} /></Field>
        <Field label="Vehicle Number"><input style={s.input} value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} /></Field>
        <Field label="Party Link"><select style={s.select} value={form.destination_party_id} onChange={e => setForm({ ...form, destination_party_id: e.target.value })}><option value="">Select Party</option>{parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Mandi Link"><select style={s.select} value={form.mandi_id} onChange={e => setForm({ ...form, mandi_id: e.target.value })}><option value="">Select Mandi</option>{mandis.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
        <Field label="Cold Storage Source"><select style={s.select} value={form.cold_storage_id} onChange={e => setForm({ ...form, cold_storage_id: e.target.value })}><option value="">Select Cold Storage</option>{coldStorages.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        
        <div style={{ ...s.card2, background: clr.card, padding: 8 }}>
          <select style={{ ...s.select, marginBottom: 4 }} value={itemForm.lot_id} onChange={e => setItemForm({ ...itemForm, lot_id: e.target.value })}><option value="">Select Lot</option>{availableLots.map(l => <option key={l.id} value={l.lot_id}>{l.lot_id}</option>)}</select>
          <input type="number" style={{ ...s.input, marginBottom: 4 }} placeholder="Bags" value={itemForm.loaded_bags} onChange={e => setItemForm({ ...itemForm, loaded_bags: e.target.value })} />
          <input type="number" style={{ ...s.input, marginBottom: 4 }} placeholder="Weight (kg)" value={itemForm.loaded_weight} onChange={e => setItemForm({ ...itemForm, loaded_weight: e.target.value })} />
          <button onClick={addItem} style={{ ...s.btnSm(clr.accent, "#000"), width: "100%" }}>Add Lot Item</button>
        </div>
        <button onClick={save} style={{ ...s.btn(), width: "100%", marginTop: 10 }}>Save Dispatch</button>
      </Modal>
    </div>
  );
};

// SALE SCREEN
const SaleScreen = ({ sales, dispatches, opsSales }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedGatepass, setSelectedGatepass] = useState("");
  const [form, setForm] = useState({ gatepass_id: "", date: today(), lot_sales: [], transport: 0, hamali_per_bag: 0, other_expenses: 0 });

  const loadGatepassLots = (gpId) => {
    setSelectedGatepass(gpId);
    const dispatch = dispatches.find(d => d.gatepass_id === gpId);
    if (dispatch) {
      const items = dispatch.items?.map(i => ({
        lot_id: i.lot_id, loaded_bags: i.loaded_bags, loaded_weight: i.loaded_weight, received_weight: i.loaded_weight, sale_rate_per_kg: 0
      })) || [];
      setForm(prev => ({ ...prev, gatepass_id: gpId, lot_sales: items }));
    }
  };

  const updateSaleItem = (idx, updates) => {
    const updated = [...form.lot_sales];
    updated[idx] = { ...updated[idx], ...updates };
    setForm(prev => ({ ...prev, lot_sales: updated }));
  };

  const totalSaleValue = form.lot_sales.reduce((sum, i) => sum + ((parseFloat(i.received_weight) || 0) * (parseFloat(i.sale_rate_per_kg) || 0)), 0);
  const totalExpenses = (parseFloat(form.transport) || 0) + (parseFloat(form.other_expenses) || 0) + (form.lot_sales.reduce((sum, i) => sum + ((parseFloat(i.loaded_bags) || 0) * (parseFloat(form.hamali_per_bag) || 0)), 0));

  const save = async () => {
    if (!form.gatepass_id || form.lot_sales.length === 0) return alert("❌ Data Missing!");
    await opsSales.addItem({ ...form, total_sale_value: totalSaleValue, total_expenses: totalExpenses, net_profit: totalSaleValue - totalExpenses });
    setShowForm(false); setSelectedGatepass("");
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Mandi Sales</span>
        <button onClick={() => { setSelectedGatepass(""); setForm({ gatepass_id: "", date: today(), lot_sales: [], transport: 0, hamali_per_bag: 0, other_expenses: 0 }); setShowForm(true); }} style={s.btn(clr.green, "#fff")}>New Sale Out</button>
      </div>

      {sales.map(sx => (
        <div key={sx.id} style={s.card}>
          <div style={s.rowBetween}><Badge v={`GP: ${sx.gatepass_id}`} color={clr.green} /><span>₹{fmt(sx.total_sale_value)}</span></div>
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="File Sale Record">
        <Field label="Link Gatepass"><select style={s.select} value={selectedGatepass} onChange={e => loadGatepassLots(e.target.value)}><option value="">Select GP Track</option>{dispatches.map(d => <option key={d.id} value={d.gatepass_id}>{d.gatepass_id}</option>)}</select></Field>
        {form.lot_sales.map((item, idx) => (
          <div key={idx} style={s.card2}>
            <div>Lot: {item.lot_id}</div>
            <input type="number" placeholder="Sale Rate/kg" style={{ ...s.input, marginTop: 4 }} value={item.sale_rate_per_kg} onChange={e => updateSaleItem(idx, { sale_rate_per_kg: e.target.value })} />
          </div>
        ))}
        <button onClick={save} style={{ ...s.btn(clr.green, "#fff"), width: "100%", marginTop: 8 }}>Save Data</button>
      </Modal>
    </div>
  );
};

// FULLY REFACTORED LIVE PAYMENT & AUTOMATED DUE SCREEN
const DueTrackingScreen = ({ sales, purchases, dispatches, coldStorages, parties }) => {
  const [payments, setPayments] = useState([]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ entity_id: "", type: "party", amount: "", method: "UPI", remarks: "" });

  // Calculate live party dues fetched from sale and purchases
  const partyLedger = parties.map(p => {
    const totalPurchaseCost = purchases.filter(pr => pr.farmer_name === p.name).reduce((sum, pr) => sum + (parseFloat(pr.total_cost) || 0), 0);
    const relatedDispatches = dispatches.filter(d => d.destination_party_id === p.id);
    const totalSaleValue = sales.filter(s => relatedDispatches.some(rd => rd.gatepass_id === s.gatepass_id)).reduce((sum, s) => sum + (parseFloat(s.total_sale_value) || 0), 0);
    
    const paid = payments.filter(pm => pm.entity_id === p.id && pm.type === "party").reduce((sum, pm) => sum + parseFloat(pm.amount || 0), 0);
    return { ...p, currentDue: (totalSaleValue + totalPurchaseCost) - paid };
  });

  // Calculate live storage dues automatically from dispatch links
  const coldStorageLedger = coldStorages.map(cs => {
    const dispatchedBags = dispatches.filter(d => d.cold_storage_id === cs.id).flatMap(d => d.items || []).reduce((sum, i) => sum + (parseFloat(i.loaded_bags) || 0), 0);
    const calculatedDue = dispatchedBags * 2.5; // Custom standard logistics layout proxy
    const paid = payments.filter(pm => pm.entity_id === cs.id && pm.type === "cold").reduce((sum, pm) => sum + parseFloat(pm.amount || 0), 0);
    return { ...cs, currentDue: calculatedDue - paid };
  });

  const handlePayment = () => {
    if (!payForm.entity_id || !payForm.amount) return alert("Fill entry layout details.");
    setPayments([...payments, { ...payForm, id: uid(), date: today() }]);
    setShowPayModal(false); setPayForm({ entity_id: "", type: "party", amount: "", method: "UPI", remarks: "" });
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Dues & Payment Logs</span>
        <button onClick={() => setShowPayModal(true)} style={s.btn(clr.purple, "#fff")}>💸 Record Payment</button>
      </div>

      {/* PARTY LIVE BOXES */}
      <div style={s.label}>Live Party Receivables & Payables</div>
      {partyLedger.map(p => (
        <div key={p.id} style={s.card2}>
          <div style={s.rowBetween}><span>{p.name}</span><strong style={{ color: p.currentDue >= 0 ? clr.green : clr.red }}>₹{fmt(p.currentDue)}</strong></div>
        </div>
      ))}

      {/* COLD STORAGE LIVE BOXES */}
      <div style={{ ...s.label, marginTop: 14 }}>Cold Storage Outstanding Dues</div>
      {coldStorageLedger.map(cs => (
        <div key={cs.id} style={s.card2}>
          <div style={s.rowBetween}><span>{cs.name}</span><strong style={{ color: clr.orange }}>₹{fmt(cs.currentDue)}</strong></div>
        </div>
      ))}

      {/* RECENT TRANSACTION LAYOUT SUMMARY */}
      <div style={{ ...s.label, marginTop: 14 }}>Transaction Payment Logs</div>
      {payments.map(pm => (
        <div key={pm.id} style={{ ...s.card2, fontSize: 11 }}>
          <div style={s.rowBetween}>
            <span>{pm.method} - {pm.remarks || "No Comments"}</span>
            <strong style={{ color: clr.accent }}>₹{pm.amount}</strong>
          </div>
        </div>
      ))}

      {/* PAYMENT DISPATCH FORM MODAL */}
      <Modal open={showPayModal} onClose={() => setShowPayModal(false)} title="Add Transaction Detail">
        <Field label="Target Type"><select style={s.select} value={payForm.type} onChange={e => setPayForm({ ...payForm, type: e.target.value, entity_id: "" })}><option value="party">Party Ledger Link</option><option value="cold">Cold Storage Account</option></select></Field>
        <Field label="Choose Entity"><select style={s.select} value={payForm.entity_id} onChange={e => setForm({ ...payForm, entity_id: e.target.value })}><option value="">Select Accounts</option>{payForm.type === "party" ? partyLedger.map(p => <option key={p.id} value={p.id}>{p.name}</option>) : coldStorageLedger.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Payment Mode"><select style={s.select} value={payForm.method} onChange={e => setPayForm({ ...payForm, method: e.target.value })}><option value="Cash">Cash</option><option value="UPI">UPI Transfer</option><option value="Cheque">Cheque</option><option value="RTGS/IMPS">RTGS / IMPS</option></select></Field>
        <Field label="Amount Paid/Received"><input type="number" style={s.input} value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} /></Field>
        <Field label="Remarks/Reference"><input style={s.input} value={payForm.remarks} onChange={e => setPayForm({ ...payForm, remarks: e.target.value })} /></Field>
        <button onClick={handlePayment} style={{ ...s.btn(clr.purple, "#fff"), width: "100%" }}>Commit Payment Entry</button>
      </Modal>
    </div>
  );
};

// DUMMY BLOCKS FOR PNL & MASTER RETAINED FOR INTEGRATION
const PnLScreen = ({ sales, purchases, dispatches, parties, mandis }) => <div style={s.content}><h4>PnL Metrics Functional</h4></div>;
const MasterScreen = ({ varieties, gradings, coldStorages, mandis, parties, opsV, opsG, opsCS, opsM, opsPA }) => <div style={s.content}><h4>Configurations Panel Open</h4></div>;

// MAIN APP CONTAINER
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
        <span style={{ fontWeight: 800, fontSize: 16, color: clr.accent }}>🥔 AlooTrader v4.2</span>
        <Badge v={activeTab.toUpperCase()} color={clr.blue} />
      </div>

      {activeTab === "dashboard" && <DashboardScreen purchases={purchases.data} dispatches={dispatches.data} sales={sales.data} parties={parties.data} mandis={mandis.data} />}
      {activeTab === "purchase" && <PurchaseScreen purchases={purchases.data} dispatches={dispatches.data} opsP={purchases} varieties={varieties.data} gradings={gradings.data} coldStorages={coldStorages.data} />}
      {activeTab === "dispatch" && <DispatchScreen dispatches={dispatches.data} purchases={purchases.data} opsD={dispatches} varieties={varieties.data} parties={parties.data} mandis={mandis.data} coldStorages={coldStorages.data} />}
      {activeTab === "sale" && <SaleScreen sales={sales.data} dispatches={dispatches.data} purchases={purchases.data} opsSales={sales} parties={parties.data} mandis={mandis.data} />}
      {activeTab === "due" && <DueTrackingScreen sales={sales.data} purchases={purchases.data} dispatches={dispatches.data} coldStorages={coldStorages.data} parties={parties.data} />}

      <div style={s.navBar}>
        <button onClick={() => setActiveTab("dashboard")} style={s.navItem(activeTab === "dashboard")}>📊</button>
        <button onClick={() => setActiveTab("purchase")} style={s.navItem(activeTab === "purchase")}>📥</button>
        <button onClick={() => setActiveTab("dispatch")} style={s.navItem(activeTab === "dispatch")}>📤</button>
        <button onClick={() => setActiveTab("sale")} style={s.navItem(activeTab === "sale")}>💰</button>
        <button onClick={() => setActiveTab("due")} style={s.navItem(activeTab === "due")}>💳</button>
      </div>
    </div>
  );
}
