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
      fetchData();
      return d[0];
    } catch (e) { alert(`Error: ${e.message}`); return null; }
  };

  return { data, loading, error, addItem };
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
  row: { display: "flex", alignItems: "center", gap: 6 },
  input: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 6, padding: "8px 10px", color: clr.text, fontSize: 13, boxSizing: "border-box", outline: "none" },
  select: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 6, padding: "8px 10px", color: clr.text, fontSize: 13, boxSizing: "box-sizing", outline: "none" },
  btn: (bg = clr.accent, txt = "#000") => ({ width: "100%", background: bg, color: txt, border: "none", borderRadius: 6, padding: "10px", fontWeight: 700, fontSize: 13, cursor: "pointer" }),
  btnSm: (bg = clr.card2, txt = clr.text) => ({ background: bg, color: txt, border: `1px solid ${clr.border}`, borderRadius: 5, padding: "5px 10px", fontWeight: 600, fontSize: 11, cursor: "pointer" }),
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
  const remainingBags = totalBagsPurchased - totalDispatchedBags;

  const totalSales = sales.reduce((sum, s) => sum + (parseFloat(s.total_sale_value) || 0), 0);
  const totalPaymentsReceived = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
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
          <div style={{ fontSize: 10, color: clr.muted, fontWeight: 700 }}>REMAINING</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: clr.orange }}>{remainingBags} bags</div>
        </div>
      </div>

      <div style={s.card}>
        <div style={{ fontSize: 10, color: clr.muted, fontWeight: 700, marginBottom: 8 }}>SALES & PAYMENTS</div>
        <div style={s.divider} />
        <div style={{ fontSize: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span>Total Sales Value:</span>
            <strong style={{ color: clr.green }}>₹{fmt(totalSales)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span>Received:</span>
            <strong>₹{fmt(totalPaymentsReceived)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Pending Due:</span>
            <strong style={{ color: clr.orange }}>₹{fmt(pending)}</strong>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 10, color: clr.muted, fontWeight: 700, marginTop: 12, marginBottom: 6 }}>RECENT PURCHASES</div>
      {purchases.slice(0, 3).map(p => {
        const rem = getRemainingBags(p, dispatches);
        return (
          <div key={p.id} style={{ ...s.card2, fontSize: 11 }}>
            <div style={s.rowBetween}>
              <strong>Lot {p.lot_id}</strong>
              <Badge v={rem <= 0 ? "CLOSED" : `${rem} Bags`} color={rem <= 0 ? clr.red : clr.green} />
            </div>
            <div style={{ fontSize: 10, color: clr.muted }}>{p.farmer_name} • {p.manual_bags} bags @ ₹{p.rate_per_bag}</div>
          </div>
        );
      })}
    </div>
  );
};

// ==========================================
// 2. PURCHASE SCREEN (SAME AS PREVIOUS)
// ==========================================
const PurchaseScreen = ({ purchases, dispatches, opsP, coldStorages }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ lot_id: "", farmer_name: "", manual_bags: "", total_weight: "", rate_per_bag: "", cold_storage_id: "", date: today() });

  const save = async () => {
    if (!form.lot_id || !form.farmer_name || !form.manual_bags || !form.rate_per_bag) return alert("Fill all fields!");
    const stdBags = form.total_weight ? (parseFloat(form.total_weight) / 52.5).toFixed(2) : "0";
    const totalCost = (parseFloat(form.manual_bags) || 0) * (parseFloat(form.rate_per_bag) || 0);
    await opsP.addItem({ id: uid(), ...form, std_bags: stdBags, total_cost: totalCost });
    setForm({ lot_id: "", farmer_name: "", manual_bags: "", total_weight: "", rate_per_bag: "", cold_storage_id: "", date: today() });
    setShowForm(false);
  };

  return (
    <div style={s.content}>
      <div style={s.rowBetween}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Purchases</div>
        <button onClick={() => setShowForm(true)} style={{ ...s.btnSm(clr.accent, "#000") }}>+ New</button>
      </div>

      {purchases.map(p => {
        const rem = getRemainingBags(p, dispatches);
        const closed = rem <= 0;
        return (
          <div key={p.id} style={{ ...s.card, borderLeft: `3px solid ${closed ? clr.red : clr.green}`, opacity: closed ? 0.6 : 1 }}>
            <div style={s.rowBetween}>
              <Badge v={p.lot_id} color={closed ? clr.red : clr.accent} />
              {closed && <span style={{ fontSize: 10, fontWeight: 700, color: clr.red }}>✓ CLOSED</span>}
            </div>
            <div style={{ fontWeight: 600, fontSize: 12, marginTop: 4 }}>{p.farmer_name}</div>
            <div style={s.divider} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11 }}>
              <div><span style={{ fontSize: 10, color: clr.muted, fontWeight: 700 }}>BAGS</span><div style={{ fontWeight: 700 }}>{p.manual_bags}</div></div>
              <div><span style={{ fontSize: 10, color: clr.muted, fontWeight: 700 }}>RATE</span><div style={{ fontWeight: 700 }}>₹{p.rate_per_bag}</div></div>
              <div><span style={{ fontSize: 10, color: clr.muted, fontWeight: 700 }}>COST</span><div style={{ fontWeight: 700, color: clr.accent }}>₹{fmt(p.total_cost)}</div></div>
              <div><span style={{ fontSize: 10, color: clr.muted, fontWeight: 700 }}>REMAINING</span><div style={{ fontWeight: 700, color: closed ? clr.red : clr.green }}>{rem}</div></div>
            </div>
          </div>
        );
      })}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Purchase">
        <Field label="Lot ID"><input style={s.input} value={form.lot_id} onChange={e => setForm({ ...form, lot_id: e.target.value })} placeholder="LOT001" /></Field>
        <Field label="Farmer Name"><input style={s.input} value={form.farmer_name} onChange={e => setForm({ ...form, farmer_name: e.target.value })} /></Field>
        <Field label="Bags"><input type="number" style={s.input} value={form.manual_bags} onChange={e => setForm({ ...form, manual_bags: e.target.value })} /></Field>
        <Field label="Weight (kg)"><input type="number" style={s.input} value={form.total_weight} onChange={e => setForm({ ...form, total_weight: e.target.value })} /></Field>
        <Field label="Rate/Bag"><input type="number" style={s.input} value={form.rate_per_bag} onChange={e => setForm({ ...form, rate_per_bag: e.target.value })} /></Field>
        <Field label="Cold Storage"><select style={s.select} value={form.cold_storage_id} onChange={e => setForm({ ...form, cold_storage_id: e.target.value })}><option value="">Select</option>{coldStorages.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <button onClick={save} style={s.btn()}>Save</button>
      </Modal>
    </div>
  );
};

// ==========================================
// 3. DISPATCH SCREEN (SAME AS PREVIOUS)
// ==========================================
const DispatchScreen = ({ dispatches, purchases, opsD, parties }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ gatepass_id: "", vehicle_number: "", driver_name: "", items: [], date: today(), destination_party_id: "" });
  const [itemForm, setItemForm] = useState({ lot_id: "", loaded_bags: "", loaded_weight: "" });

  const activeLots = purchases.filter(p => getRemainingBags(p, dispatches) > 0);

  const addItem = () => {
    if (!itemForm.lot_id || !itemForm.loaded_bags || !itemForm.loaded_weight) return alert("Fill all fields!");
    const lot = purchases.find(p => p.lot_id === itemForm.lot_id);
    const remaining = getRemainingBags(lot, dispatches);
    if (parseFloat(itemForm.loaded_bags) > remaining) return alert(`Only ${remaining} bags left!`);
    setForm(p => ({ ...p, items: [...p.items, { ...itemForm }] }));
    setItemForm({ lot_id: "", loaded_bags: "", loaded_weight: "" });
  };

  const save = async () => {
    if (!form.gatepass_id || form.items.length === 0) return alert("Fill all fields!");
    await opsD.addItem({ id: uid(), ...form });
    setForm({ gatepass_id: "", vehicle_number: "", driver_name: "", items: [], date: today(), destination_party_id: "" });
    setShowForm(false);
  };

  return (
    <div style={s.content}>
      <div style={s.rowBetween}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Dispatch</div>
        <button onClick={() => setShowForm(true)} style={{ ...s.btnSm(clr.blue, "#fff") }}>+ New</button>
      </div>

      {dispatches.map(d => (
        <div key={d.id} style={s.card}>
          <div style={s.rowBetween}>
            <Badge v={`GP: ${d.gatepass_id}`} color={clr.blue} />
            <span style={{ fontSize: 11 }}>{d.vehicle_number}</span>
          </div>
          <div style={{ fontSize: 11, color: clr.muted, marginTop: 4 }}>
            {d.items?.length || 0} Lots • {d.items?.reduce((s, i) => s + (parseFloat(i.loaded_bags) || 0), 0) || 0} Bags
          </div>
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Create Dispatch">
        <Field label="Gatepass ID"><input style={s.input} value={form.gatepass_id} onChange={e => setForm({ ...form, gatepass_id: e.target.value })} placeholder="GP001" /></Field>
        <Field label="Vehicle"><input style={s.input} value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} placeholder="UP80AB1234" /></Field>
        <Field label="Driver"><input style={s.input} value={form.driver_name} onChange={e => setForm({ ...form, driver_name: e.target.value })} /></Field>
        <Field label="Party"><select style={s.select} value={form.destination_party_id} onChange={e => setForm({ ...form, destination_party_id: e.target.value })}><option value="">Select</option>{parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        
        <div style={{ ...s.card2, background: clr.card, padding: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: clr.muted, marginBottom: 6 }}>ADD LOTS</div>
          <select style={{ ...s.select, marginBottom: 6 }} value={itemForm.lot_id} onChange={e => setItemForm({ ...itemForm, lot_id: e.target.value })}><option value="">Select Lot</option>{activeLots.map(l => <option key={l.id} value={l.lot_id}>{l.lot_id}</option>)}</select>
          <input type="number" placeholder="Bags" style={{ ...s.input, marginBottom: 6 }} value={itemForm.loaded_bags} onChange={e => setItemForm({ ...itemForm, loaded_bags: e.target.value })} />
          <input type="number" placeholder="Weight (kg)" style={{ ...s.input, marginBottom: 6 }} value={itemForm.loaded_weight} onChange={e => setItemForm({ ...itemForm, loaded_weight: e.target.value })} />
          <button onClick={addItem} style={{ ...s.btnSm(clr.accent + "22", clr.accent), width: "100%" }}>Add Lot</button>
        </div>

        {form.items.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: clr.muted, marginBottom: 6 }}>LOTS ADDED</div>
            {form.items.map((i, idx) => (
              <div key={idx} style={{ ...s.card2, marginBottom: 4, fontSize: 11 }}>
                <div>{i.lot_id} • {i.loaded_bags} bags • {i.loaded_weight}kg</div>
              </div>
            ))}
          </div>
        )}

        <button onClick={save} style={s.btn(clr.blue, "#fff")}>Save</button>
      </Modal>
    </div>
  );
};

// ==========================================
// 4. MANDI SALE SCREEN (SAME AS PREVIOUS)
// ==========================================
const SaleScreen = ({ sales, dispatches, opsSales }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ gatepass_id: "", date: today(), lot_sales: [] });

  const loadGatepass = (gpId) => {
    const d = dispatches.find(x => x.gatepass_id === gpId);
    if (d) {
      const lotSales = d.items?.map(i => ({ lot_id: i.lot_id, loaded_bags: i.loaded_bags, loaded_weight: i.loaded_weight, received_weight: i.loaded_weight, rate_per_kg: 0 })) || [];
      setForm(p => ({ ...p, gatepass_id: gpId, lot_sales: lotSales }));
    }
  };

  const updateLot = (idx, updates) => {
    const updated = [...form.lot_sales];
    updated[idx] = { ...updated[idx], ...updates };
    setForm(p => ({ ...p, lot_sales: updated }));
  };

  const computeTotal = () => {
    return form.lot_sales.reduce((sum, i) => sum + ((parseFloat(i.received_weight) || 0) * (parseFloat(i.rate_per_kg) || 0)), 0);
  };

  const save = async () => {
    if (!form.gatepass_id || form.lot_sales.length === 0) return alert("Fill all fields!");
    const total = computeTotal();
    await opsSales.addItem({ id: uid(), ...form, total_sale_value: total });
    setForm({ gatepass_id: "", date: today(), lot_sales: [] });
    setShowForm(false);
  };

  return (
    <div style={s.content}>
      <div style={s.rowBetween}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Sales</div>
        <button onClick={() => setShowForm(true)} style={{ ...s.btnSm(clr.green, "#fff") }}>+ New</button>
      </div>

      {sales.map(sl => (
        <div key={sl.id} style={{ ...s.card }}>
          <div style={s.rowBetween}>
            <Badge v={`GP: ${sl.gatepass_id}`} color={clr.green} />
            <strong style={{ color: clr.green }}>₹{fmt(sl.total_sale_value)}</strong>
          </div>
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Record Sale">
        <Field label="Gatepass ID"><select style={s.select} value={form.gatepass_id} onChange={e => loadGatepass(e.target.value)}><option value="">Select</option>{dispatches.map(d => <option key={d.id} value={d.gatepass_id}>{d.gatepass_id}</option>)}</select></Field>

        {form.lot_sales.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: clr.muted, marginBottom: 6 }}>LOT DETAILS</div>
            {form.lot_sales.map((i, idx) => (
              <div key={idx} style={{ ...s.card2, marginBottom: 6 }}>
                <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 12 }}>{i.lot_id}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6, fontSize: 11 }}>
                  <div><span style={{ fontSize: 9, color: clr.muted }}>Loaded</span><div>{i.loaded_weight}kg</div></div>
                  <div><span style={{ fontSize: 9, color: clr.muted }}>Received</span><input type="number" style={{ ...s.input, padding: "4px", fontSize: 11 }} value={i.received_weight} onChange={e => updateLot(idx, { received_weight: e.target.value })} /></div>
                </div>
                <div><span style={{ fontSize: 9, color: clr.muted }}>Rate (₹/kg)</span><input type="number" step="0.1" style={{ ...s.input, padding: "4px", fontSize: 11 }} value={i.rate_per_kg} onChange={e => updateLot(idx, { rate_per_kg: e.target.value })} /></div>
              </div>
            ))}
          </div>
        )}

        <div style={{ ...s.card2, background: clr.green + "15", marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: clr.muted }}>TOTAL SALE VALUE</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: clr.green }}>₹{fmt(computeTotal())}</div>
        </div>

        <button onClick={save} style={s.btn(clr.green, "#fff")}>Save Sale</button>
      </Modal>
    </div>
  );
};

// ==========================================
// 5. NEW PAYMENTS & DUES SCREEN (UPDATED)
// ==========================================
const PaymentScreen = ({ sales, dispatches, payments, opsPayment, parties }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ gatepass_id: "", amount: "", payment_mode: "Cash", date: today(), notes: "" });

  const save = async () => {
    if (!form.gatepass_id || !form.amount) return alert("Fill all fields!");
    const dispatch = dispatches.find(d => d.gatepass_id === form.gatepass_id);
    const sale = sales.find(s => s.gatepass_id === form.gatepass_id);
    const party = parties.find(p => p.id === dispatch?.destination_party_id);
    
    await opsPayment.addItem({ 
      id: uid(), 
      ...form, 
      party_name: party?.name || "Unknown",
      sale_value: sale?.total_sale_value || 0
    });
    setForm({ gatepass_id: "", amount: "", payment_mode: "Cash", date: today(), notes: "" });
    setShowForm(false);
  };

  // Automated Party Dues Mapping logic
  const partyDues = parties.map(p => {
    const dispatchesToParty = dispatches.filter(d => d.destination_party_id === p.id);
    const gpsToParty = dispatchesToParty.map(d => d.gatepass_id);
    const salesToParty = sales.filter(s => gpsToParty.includes(s.gatepass_id));
    const totalSale = salesToParty.reduce((sum, s) => sum + (parseFloat(s.total_sale_value) || 0), 0);
    const paidAmount = payments.filter(py => gpsToParty.includes(py.gatepass_id) && py.party_name === p.name).reduce((sum, py) => sum + (parseFloat(py.amount) || 0), 0);
    const due = totalSale - paidAmount;
    return { id: p.id, name: p.name, phone: p.phone, totalSale, paid: paidAmount, due: due };
  }).filter(p => p.due > 0);

  return (
    <div style={s.content}>
      <div style={s.rowBetween}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Payments & Dues</div>
        <button onClick={() => setShowForm(true)} style={{ ...s.btnSm(clr.orange, "#fff") }}>+ Record</button>
      </div>

      <div style={{ fontSize: 10, fontWeight: 700, color: clr.muted, marginBottom: 6, marginTop: 10 }}>PARTY DUES (Pending)</div>
      {partyDues.length === 0 ? (
        <div style={{ ...s.card2, textAlign: "center", color: clr.muted }}>All dues cleared! ✓</div>
      ) : (
        partyDues.map(p => (
          <div key={p.id} style={{ ...s.card2, marginBottom: 6 }}>
            <div style={s.rowBetween}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 12 }}>{p.name}</div>
                <div style={{ fontSize: 10, color: clr.muted }}>{p.phone || "No Phone"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: clr.muted }}>Due</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: clr.red }}>₹{fmt(p.due)}</div>
              </div>
            </div>
            <div style={{ fontSize: 10, marginTop: 4, color: clr.muted }}>Sold: ₹{fmt(p.totalSale)} | Paid: ₹{fmt(p.paid)}</div>
          </div>
        ))
      )}

      <div style={{ fontSize: 10, fontWeight: 700, color: clr.muted, marginTop: 12, marginBottom: 6 }}>PAYMENT HISTORY (Last 5)</div>
      {payments.slice(0, 5).map(p => (
        <div key={p.id} style={{ ...s.card2, fontSize: 11, marginBottom: 4 }}>
          <div style={s.rowBetween}>
            <span>{p.party_name}</span>
            <strong style={{ color: clr.green }}>₹{fmt(p.amount)}</strong>
          </div>
          <div style={{ fontSize: 10, color: clr.muted }}>GP: {p.gatepass_id} • {p.payment_mode} • {p.date}</div>
          {p.notes && <div style={{ fontSize: 9, color: clr.accent, marginTop: 2 }}>Note: {p.notes}</div>}
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Record Payment">
        <Field label="Gatepass ID"><select style={s.select} value={form.gatepass_id} onChange={e => setForm({ ...form, gatepass_id: e.target.value })}><option value="">Select</option>{sales.map(s => <option key={s.id} value={s.gatepass_id}>{s.gatepass_id}</option>)}</select></Field>
        <Field label="Amount (₹)"><input type="number" style={s.input} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></Field>
        <Field label="Mode"><select style={s.select} value={form.payment_mode} onChange={e => setForm({ ...form, payment_mode: e.target.value })}><option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Cheque">Cheque</option><option value="RTGS">RTGS</option><option value="IMPS">IMPS</option></select></Field>
        <Field label="Date"><input type="date" style={s.input} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>
        <Field label="Notes"><input style={s.input} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" /></Field>
        <button onClick={save} style={s.btn(clr.orange, "#000")}>Record Payment</button>
      </Modal>
    </div>
  );
};

// ==========================================
// 6. COLD STORAGE DUES SCREEN (NEW)
// ==========================================
const ColdStorageDueScreen = ({ purchases, coldStorages }) => {
  const coldStorageDues = coldStorages.map(cs => {
    const lotsAtCS = purchases.filter(p => p.cold_storage_id === cs.id);
    const totalPurchased = lotsAtCS.reduce((sum, p) => sum + (parseFloat(p.total_cost) || 0), 0);
    return { id: cs.id, name: cs.name, phone: cs.phone, totalPurchased };
  }).filter(c => c.totalPurchased > 0);

  return (
    <div style={s.content}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>❄️ Cold Storage Owed Status</div>
      {coldStorageDues.length === 0 ? (
        <div style={{ ...s.card2, textAlign: "center", color: clr.muted }}>No outstanding cold storage purchases! ✓</div>
      ) : (
        coldStorageDues.map(cs => (
          <div key={cs.id} style={s.card}>
            <div style={s.rowBetween}>
              <div>
                <div style={{ fontWeight: 600 }}>{cs.name}</div>
                <div style={{ fontSize: 10, color: clr.muted }}>📞 {cs.phone || "No Contact info"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: clr.muted }}>Total Purchase Value</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: clr.orange }}>₹{fmt(cs.totalPurchased)}</div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// ==========================================
// 7. MASTER SCREEN (SAME AS PREVIOUS)
// ==========================================
const MasterScreen = ({ coldStorages, parties, opsCS, opsParty }) => {
  const [showCS, setShowCS] = useState(false);
  const [formCS, setFormCS] = useState({ name: "", phone: "" });
  const [showParty, setShowParty] = useState(false);
  const [formParty, setFormParty] = useState({ name: "", phone: "" });

  const saveCS = async () => {
    if (!formCS.name) return alert("Enter name!");
    await opsCS.addItem({ id: uid(), ...formCS });
    setFormCS({ name: "", phone: "" });
    setShowCS(false);
  };

  const saveParty = async () => {
    if (!formParty.name) return alert("Enter name!");
    await opsParty.addItem({ id: uid(), ...formParty });
    setFormParty({ name: "", phone: "" });
    setShowParty(false);
  };

  return (
    <div style={s.content}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>⚙️ Master Settings</div>

      <div style={{ fontSize: 10, fontWeight: 700, color: clr.muted, marginBottom: 6 }}>COLD STORAGES LIST</div>
      {coldStorages.map(cs => (
        <div key={cs.id} style={{ ...s.card2, marginBottom: 4, fontSize: 11 }}>
          <div style={s.rowBetween}>
            <div>{cs.name}</div>
            <div style={{ fontSize: 10, color: clr.muted }}>{cs.phone}</div>
          </div>
        </div>
      ))}
      <button onClick={() => setShowCS(true)} style={{ ...s.btnSm(clr.accent, "#000"), width: "100%", marginBottom: 12, marginTop: 4 }}>+ Add Cold Storage</button>

      <div style={{ fontSize: 10, fontWeight: 700, color: clr.muted, marginBottom: 6 }}>PARTIES LIST</div>
      {parties.map(p => (
        <div key={p.id} style={{ ...s.card2, marginBottom: 4, fontSize: 11 }}>
          <div style={s.rowBetween}>
            <div>{p.name}</div>
            <div style={{ fontSize: 10, color: clr.muted }}>{p.phone}</div>
          </div>
        </div>
      ))}
      <button onClick={() => setShowParty(true)} style={{ ...s.btnSm(clr.blue, "#fff"), width: "100%", marginTop: 4 }}>+ Add Party</button>

      <Modal open={showCS} onClose={() => setShowCS(false)} title="Add Cold Storage Unit">
        <Field label="Name"><input style={s.input} value={formCS.name} onChange={e => setFormCS({ ...formCS, name: e.target.value })} /></Field>
        <Field label="Phone"><input style={s.input} value={formCS.phone} onChange={e => setFormCS({ ...formCS, phone: e.target.value })} /></Field>
        <button onClick={saveCS} style={s.btn()}>Save Storage</button>
      </Modal>

      <Modal open={showParty} onClose={() => setShowParty(false)} title="Add New Party Account">
        <Field label="Name"><input style={s.input} value={formParty.name} onChange={e => setFormParty({ ...formParty, name: e.target.value })} /></Field>
        <Field label="Phone"><input style={s.input} value={formParty.phone} onChange={e => setFormParty({ ...formParty, phone: e.target.value })} /></Field>
        <button onClick={saveParty} style={s.btn()}>Save Party</button>
      </Modal>
    </div>
  );
};

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const purchases = useSupabaseTable("purchases");
  const dispatches = useSupabaseTable("dispatches");
  const sales = useSupabaseTable("sales");
  const payments = useSupabaseTable("payments");
  const coldStorages = useSupabaseTable("cold_storages");
  const parties = useSupabaseTable("parties");

  return (
    <div style={s.screen}>
      <div style={s.header}>
        <span style={{ fontWeight: 800, fontSize: 16, color: clr.accent }}>🥔 AlooTrader v6.0</span>
        <Badge v={activeTab.toUpperCase()} color={clr.blue} />
      </div>

      {activeTab === "dashboard" && <DashboardScreen purchases={purchases.data} dispatches={dispatches.data} sales={sales.data} payments={payments.data} />}
      {activeTab === "purchase" && <PurchaseScreen purchases={purchases.data} dispatches={dispatches.data} opsP={purchases} coldStorages={coldStorages.data} />}
      {activeTab === "dispatch" && <DispatchScreen dispatches={dispatches.data} purchases={purchases.data} opsD={dispatches} parties={parties.data} />}
      {activeTab === "sale" && <SaleScreen sales={sales.data} dispatches={dispatches.data} purchases={purchases.data} opsSales={sales} />}
      {activeTab === "payment" && <PaymentScreen sales={sales.data} dispatches={dispatches.data} payments={payments.data} opsPayment={payments} parties={parties.data} />}
      {activeTab === "colddue" && <ColdStorageDueScreen purchases={purchases.data} coldStorages={coldStorages.data} />}
      {activeTab === "master" && <MasterScreen coldStorages={coldStorages.data} parties={parties.data} opsCS={coldStorages} opsParty={parties} />}

      <div style={s.navBar}>
        <button onClick={() => setActiveTab("dashboard")} style={s.navItem(activeTab === "dashboard")}>📊</button>
        <button onClick={() => setActiveTab("purchase")} style={s.navItem(activeTab === "purchase")}>📥</button>
        <button onClick={() => setActiveTab("dispatch")} style={s.navItem(activeTab === "dispatch")}>📤</button>
        <button onClick={() => setActiveTab("sale")} style={s.navItem(activeTab === "sale")}>💰</button>
        <button onClick={() => setActiveTab("payment")} style={s.navItem(activeTab === "payment")}>💳</button>
        <button onClick={() => setActiveTab("colddue")} style={s.navItem(activeTab === "colddue")}>❄️</button>
        <button onClick={() => setActiveTab("master")} style={s.navItem(activeTab === "master")}>⚙️</button>
      </div>
    </div>
  );
}
