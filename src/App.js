import { useState, useCallback, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cxjmwjljjnuthcrmnbqb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4am13amxqam51dGhjcm1uYnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTYzMzUsImV4cCI6MjA5MjY3MjMzNX0.ynRaceAT1uWcsPOJ_5vY_8NKolM3EaWKQajUEk4sLz8";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
        if (r.expenses && typeof r.expenses === 'string') try { r.expenses = JSON.parse(r.expenses); } catch { r.expenses = {}; }
        return r;
      });
      setData(parsed);
    }
    setLoading(false);
  }, [tableName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addItem = useCallback(async (item) => {
    const formatted = { ...item, created_at: new Date().toISOString() };
    if (formatted.items && typeof formatted.items !== 'string') formatted.items = JSON.stringify(formatted.items);
    if (formatted.lot_sales && typeof formatted.lot_sales !== 'string') formatted.lot_sales = JSON.stringify(formatted.lot_sales);
    
    const { data: inserted, error } = await supabase.from(tableName).insert([formatted]).select();
    if (!error) {
      fetchData();
    } else {
      console.error("Supabase Save Error:", error);
      alert(`Save Failed: ${error.message}`);
    }
  }, [tableName, fetchData]);

  const editItem = useCallback(async (item) => {
    const { created_at, ...rest } = item;
    const formatted = { ...rest };
    if (formatted.items && typeof formatted.items !== 'string') formatted.items = JSON.stringify(formatted.items);
    if (formatted.lot_sales && typeof formatted.lot_sales !== 'string') formatted.lot_sales = JSON.stringify(formatted.lot_sales);

    const { error } = await supabase.from(tableName).update(formatted).eq("id", item.id);
    if (!error) {
      fetchData();
    } else {
      console.error("Supabase Update Error:", error);
      alert(`Update Failed: ${error.message}`);
    }
  }, [tableName, fetchData]);

  const deleteItem = useCallback(async (id) => {
    if (!window.confirm("Kya aap sach me delete karna chahte hain?")) return;
    const { error } = await supabase.from(tableName).delete().eq("id", id);
    if (!error) {
      setData(p => p.filter(x => x.id !== id));
    } else {
      console.error("Supabase Delete Error:", error);
    }
  }, [tableName]);

  return [data, { addItem, editItem, deleteItem, loading, refresh: fetchData }];
};

const uid = () => Math.random().toString(36).slice(2, 9).toUpperCase();
const fmt = (n, d = 0) => (isNaN(n) || n === null || n === undefined ? "0" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d }));
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "-";
const today = () => new Date().toISOString().slice(0, 10);

const clr = { bg: "#0f1117", card: "#1a1d26", card2: "#22263a", accent: "#f5a623", green: "#22c55e", red: "#ef4444", blue: "#3b82f6", purple: "#a855f7", muted: "#6b7280", border: "#2d3148", text: "#f1f5f9" };

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
    payment: "M3 10h18M7 15h.01M11 15h.01M15 15h.01M7 19h.01M11 19h.01M15 19h.01M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z",
    stock: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    settings: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
    add: "M12 4v16m8-8H4",
    x: "M6 18L18 6M6 6l12 12",
    trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    download: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icons[name]} /></svg>;
};

const Field = ({ label, children }) => <div style={{ marginBottom: 10 }}><div style={s.label}>{label}</div>{children}</div>;
const Modal = ({ open, onClose, title, children }) => !open ? null : <div style={{ position: "fixed", inset: 0, background: "#000c", zIndex: 1000, display: "flex", alignItems: "flex-end" }}><div style={{ background: clr.card, borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 480, maxHeight: "90vh", display: "flex", flexDirection: "column", border: `1px solid ${clr.border}` }}><div style={{ ...s.rowBetween, padding: 12, borderBottom: `1px solid ${clr.border}` }}><span style={{ fontWeight: 700, fontSize: 14 }}>{title}</span><button onClick={onClose} style={s.btnSm()}><Icon name="x" size={12} /></button></div><div style={{ overflowY: "auto", padding: "0 12px 16px" }}>{children}</div></div></div>;
const Badge = ({ v, color = clr.accent }) => <span style={s.tag(color + "22", color)}>{v}</span>;

// REPORT DOWNLOAD UTILITY
const downloadCSV = (filename, data) => {
  const csvContent = "data:text/csv;charset=utf-8," + data.map(e => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// DASHBOARD SCREEN
const DashboardScreen = ({ purchases, dispatches }) => {
  const activeLots = purchases.filter(p => p.status !== 'closed').length;
  const closedLots = purchases.filter(p => p.status === 'closed').length;

  // Normal / Bought bags calculation
  const totalBoughtBags = purchases.reduce((sum, p) => sum + (parseInt(p.manual_bags) || 0), 0);
  const totalDispatchedBags = dispatches.flatMap(d => d.items || []).reduce((sum, i) => sum + (parseInt(i.manual_bags) || 0), 0);
  const activeBags = totalBoughtBags - totalDispatchedBags;

  return (
    <div style={s.content}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
        <div style={{ ...s.card2, background: clr.blue + "15" }}><div style={s.label}>Active Lots</div><div style={{ fontSize: 18, fontWeight: 800, color: clr.blue }}>{activeLots}</div></div>
        <div style={{ ...s.card2, background: clr.red + "15" }}><div style={s.label}>Closed Lots</div><div style={{ fontSize: 18, fontWeight: 800, color: clr.red }}>{closedLots}</div></div>
        <div style={{ ...s.card2, background: clr.purple + "15" }}><div style={s.label}>Total Bought Bags (Normal)</div><div style={{ fontSize: 18, fontWeight: 800, color: clr.purple }}>{fmt(totalBoughtBags)}</div></div>
        <div style={{ ...s.card2, background: clr.accent + "15" }}><div style={s.label}>Active Normal Bags In Stock</div><div style={{ fontSize: 18, fontWeight: 800, color: clr.accent }}>{fmt(activeBags)}</div></div>
      </div>
    </div>
  );
};

// PURCHASE SCREEN
const PurchaseScreen = ({ purchases, varieties, gradings, coldStorages, mandis, ops }) => {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ lot_id: "", farmer_name: "", manual_bags: "", total_weight: "", rate_per_bag: "", total_cost: "", variety_id: "", grading_id: "", cold_storage_id: "", mandi_id: "", date: today(), status: "open" });

  const stdBags = form.total_weight ? (parseFloat(form.total_weight) / 52.5).toFixed(2) : "0.00";
  const totalCost = (parseFloat(form.manual_bags) || 0) * (parseFloat(form.rate_per_bag) || 0);

  const handleEdit = (p) => { setEditItem(p); setForm({ ...p }); setShowForm(true); };

  const save = async () => {
    if (!form.lot_id || !form.farmer_name) return alert("Fill required fields");
    const payload = { ...form, std_bags: parseFloat(stdBags), total_cost: parseFloat(totalCost) };
    if (editItem) await ops.purchases.editItem({ ...payload, id: editItem.id });
    else await ops.purchases.addItem({ ...payload, id: uid() });
    setShowForm(false);
    setEditItem(null);
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Purchases (Normal Bags)</span>
        <button onClick={() => { setEditItem(null); setShowForm(true); }} style={s.btn()}><Icon name="add" size={12} /> New</button>
      </div>

      {purchases.map(p => (
        <div key={p.id} style={s.card}>
          <div style={s.rowBetween}>
            <Badge v={p.lot_id} color={p.status === 'closed' ? clr.red : clr.accent} />
            <div style={s.row}>
              <button onClick={() => handleEdit(p)} style={s.btnSm()}><Icon name="edit" size={12} color={clr.blue} /></button>
              <span style={{ fontSize: 10, color: clr.muted }}>{fmtDate(p.date)}</span>
            </div>
          </div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Farmer: <strong>{p.farmer_name}</strong> | Bags: <strong>{p.manual_bags}</strong></div>
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Purchase">
        <Field label="Lot ID"><input style={s.input} value={form.lot_id} onChange={e => setForm({ ...form, lot_id: e.target.value })} /></Field>
        <Field label="Farmer Name"><input style={s.input} value={form.farmer_name} onChange={e => setForm({ ...form, farmer_name: e.target.value })} /></Field>
        <Field label="Normal Bags"><input type="number" style={s.input} value={form.manual_bags} onChange={e => setForm({ ...form, manual_bags: e.target.value })} /></Field>
        <Field label="Total Weight (kg)"><input type="number" style={s.input} value={form.total_weight} onChange={e => setForm({ ...form, total_weight: e.target.value })} /></Field>
        <Field label="Rate Per Bag"><input type="number" style={s.input} value={form.rate_per_bag} onChange={e => setForm({ ...form, rate_per_bag: e.target.value })} /></Field>
        <Field label="Variety"><select style={s.select} value={form.variety_id} onChange={e => setForm({ ...form, variety_id: e.target.value })}><option value="">Select</option>{varieties.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></Field>
        <Field label="Grading"><select style={s.select} value={form.grading_id} onChange={e => setForm({ ...form, grading_id: e.target.value })}><option value="">Select</option>{gradings.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></Field>
        <button onClick={save} style={{ ...s.btn(), width: "100%" }}>Save</button>
      </Modal>
    </div>
  );
};

// DISPATCH SCREEN
const DispatchScreen = ({ dispatches, purchases, varieties, gradings, mandis, parties, ops }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ gatepass_id: "", vehicle_number: "", destination_party_id: "", items: [], date: today() });
  const [itemForm, setItemForm] = useState({ lot_id: "", manual_bags: "", weight: "" });

  const currentLotDetails = purchases.find(p => p.lot_id === itemForm.lot_id);
  const currentVariety = varieties.find(v => v.id === currentLotDetails?.variety_id)?.name || "-";
  const currentGrading = gradings.find(g => g.id === currentLotDetails?.grading_id)?.name || "-";

  // Rate arrangement according to std bags
  const stdBagsCalculated = itemForm.weight ? (parseFloat(itemForm.weight) / 52.5) : 0;
  const calculatedCostValue = currentLotDetails ? (stdBagsCalculated * (parseFloat(currentLotDetails.rate_per_bag) || 0)) : 0;

  const addItem = () => {
    if (!itemForm.lot_id || !itemForm.manual_bags || !itemForm.weight) return alert("Fill lot metrics completely");
    setForm(p => ({
      ...p,
      items: [...p.items, {
        ...itemForm,
        variety: currentVariety,
        grading: currentGrading,
        manual_bags: parseInt(itemForm.manual_bags),
        weight: parseFloat(itemForm.weight),
        cost_value: calculatedCostValue
      }]
    }));
    setItemForm({ lot_id: "", manual_bags: "", weight: "" });
  };

  const getWhatsAppText = (d) => {
    let msg = `Gatepass: ${d.gatepass_id}\nVehicle: ${d.vehicle_number}\n\n`;
    d.items?.forEach(i => {
      msg += `Lot: ${i.lot_id}\nBags: ${i.manual_bags}\nVariety: ${i.variety}\nGrading: ${i.grading}\nWeight: ${i.weight} kg\n\n`;
    });
    return encodeURIComponent(msg);
  };

  const save = async () => {
    if (!form.gatepass_id || form.items.length === 0) return alert("Add items first");
    await ops.dispatches.addItem({ ...form, id: uid() });

    // Deduct & Full Load Closing Check Logic
    for (const item of form.items) {
      const targetLot = purchases.find(p => p.lot_id === item.lot_id);
      if (targetLot) {
        const totalDispatched = dispatches.flatMap(d => d.items || []).filter(i => i.lot_id === item.lot_id).reduce((sum, i) => sum + i.manual_bags, 0) + item.manual_bags;
        if (totalDispatched >= targetLot.manual_bags) {
          await supabase.from("purchases").update({ status: "closed" }).eq("id", targetLot.id);
        }
      }
    }
    ops.purchases.refresh();
    setShowForm(false);
  };

  const downloadReport = () => {
    const headers = [["Gatepass ID", "Vehicle Number", "Date", "Lot ID", "Loaded Bags", "Weight (kg)", "Variety", "Grading"]];
    dispatches.forEach(d => {
      d.items?.forEach(i => {
        headers.push([d.gatepass_id, d.vehicle_number, d.date, i.lot_id, i.manual_bags, i.weight, i.variety, i.grading]);
      });
    });
    downloadCSV("Dispatch_Report.csv", headers);
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Dispatch Control</span>
        <div style={s.row}>
          <button onClick={downloadReport} style={s.btnSm(clr.blue, "#fff")}><Icon name="download" size={11} color="#fff" /> Report</button>
          <button onClick={() => setShowForm(true)} style={s.btn()}><Icon name="add" size={12} /> New GP</button>
        </div>
      </div>

      {dispatches.map(d => (
        <div key={d.id} style={s.card}>
          <div style={s.rowBetween}>
            <Badge v={`GP: ${d.gatepass_id}`} color={clr.blue} />
            <a href={`https://wa.me/?text=${getWhatsAppText(d)}`} target="_blank" rel="noreferrer" style={s.btnSm(clr.green, "#fff")}>Share WhatsApp</a>
          </div>
          <div style={{ fontSize: 12, marginTop: 4, color: clr.muted }}>Vehicle: <strong>{d.vehicle_number}</strong></div>
          {d.items?.map((i, idx) => (
            <div key={idx} style={{ ...s.card2, marginTop: 4, fontSize: 11 }}>
              <div>Lot: <strong>{i.lot_id}</strong> | Bags: {i.manual_bags} | W: {i.weight} kg</div>
              <div style={{ color: clr.muted }}>Variety: {i.variety} | Grading: {i.grading}</div>
            </div>
          ))}
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Dispatch Gatepass">
        <Field label="Gatepass ID"><input style={s.input} value={form.gatepass_id} onChange={e => setForm({ ...form, gatepass_id: e.target.value })} /></Field>
        <Field label="Vehicle Number"><input style={s.input} value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} /></Field>
        
        <div style={{ ...s.card2, padding: 8 }}>
          <div style={s.label}>Load Active Lot</div>
          <select style={{ ...s.select, marginBottom: 6 }} value={itemForm.lot_id} onChange={e => setItemForm({ ...itemForm, lot_id: e.target.value })}>
            <option value="">Select Lot</option>
            {purchases.filter(p => p.status !== 'closed').map(p => <option key={p.id} value={p.lot_id}>{p.lot_id}</option>)}
          </select>
          {itemForm.lot_id && <div style={{ fontSize: 11, marginBottom: 6, color: clr.accent }}>Variety: {currentVariety} | Grading: {currentGrading}</div>}
          <input type="number" style={{ ...s.input, marginBottom: 6 }} placeholder="Bags (Normal)" value={itemForm.manual_bags} onChange={e => setItemForm({ ...itemForm, manual_bags: e.target.value })} />
          <input type="number" style={{ ...s.input, marginBottom: 6 }} placeholder="Manual Weight (kg)" value={itemForm.weight} onChange={e => setItemForm({ ...itemForm, weight: e.target.value })} />
          {itemForm.weight && <div style={{ fontSize: 11, color: clr.green, marginBottom: 6 }}>Live Loaded Cost Value: ₹{fmt(calculatedCostValue)}</div>}
          <button onClick={addItem} style={{ ...s.btnSm(clr.accent, "#000"), width: "100%" }}>Add Lot</button>
        </div>

        {form.items.map((i, idx) => (
          <div key={idx} style={{ fontSize: 11, background: clr.card, padding: 6, marginTop: 4, borderRadius: 4 }}>
            Lot: {i.lot_id} | Bags: {i.manual_bags} | Cost Value: ₹{fmt(i.cost_value)}
          </div>
        ))}
        <button onClick={save} style={{ ...s.btn(), width: "100%", marginTop: 8 }}>Complete Dispatch</button>
      </Modal>
    </div>
  );
};

// SALE SCREEN
const SaleScreen = ({ sales, dispatches, purchases, ops }) => {
  const [showForm, setShowForm] = useState(false);
  const [punchGP, setPunchGP] = useState("");
  const [fetchedItems, setFetchedItems] = useState([]);
  
  // Expenses configuration states
  const [expenses, setExpenses] = useState({ transport: "", mandi_commission: "", hamali: "", gatepass_fee: "", other: "" });
  const [salePrices, setSalePrices] = useState({});
  const [newWeights, setNewWeights] = useState({});

  const handlePunch = () => {
    const gp = dispatches.find(d => d.gatepass_id === punchGP);
    if (!gp) return alert("Gatepass ID not found!");
    setFetchedItems(gp.items || []);
  };

  const saveSale = async () => {
    if (fetchedItems.length === 0) return;
    
    const totalExpenses = (parseFloat(expenses.transport) || 0) + (parseFloat(expenses.hamali) || 0) + (parseFloat(expenses.gatepass_fee) || 0) + (parseFloat(expenses.other) || 0);
    const splitExpensePerLot = totalExpenses / fetchedItems.length;

    const lotSalesPayload = fetchedItems.map(item => {
      const matchPurchase = purchases.find(p => p.lot_id === item.lot_id);
      const purchaseRatePerKg = matchPurchase ? (matchPurchase.rate_per_bag / 52.5) : 0;
      
      const newW = parseFloat(newWeights[item.lot_id]) || item.weight;
      const sPrice = parseFloat(salePrices[item.lot_id]) || 0;
      
      const weightLoss = item.weight - newW;
      const weightLossCost = weightLoss * purchaseRatePerKg;
      
      const rawSaleAmount = newW * sPrice;
      const commissionDeduction = (rawSaleAmount * (parseFloat(expenses.mandi_commission) || 0)) / 100;
      const netSaleAmount = rawSaleAmount - commissionDeduction;

      const lotProfitLoss = netSaleAmount - item.cost_value - splitExpensePerLot - weightLossCost;

      return {
        lot_id: item.lot_id,
        loaded_bags: item.manual_bags,
        loaded_weight: item.weight,
        new_weight: newW,
        weight_loss: weightLoss,
        weight_loss_cost: weightLossCost,
        sale_price_per_kg: sPrice,
        allocated_expense: splitExpensePerLot,
        profit_loss: lotProfitLoss
      };
    });

    await ops.sales.addItem({ gatepass_id: punchGP, lot_sales: lotSalesPayload, date: today(), id: uid() });
    setShowForm(false);
    setFetchedItems([]);
  };

  const downloadReport = () => {
    const headers = [["Gatepass ID", "Lot ID", "Loaded Bags", "Loaded Weight", "New Weight", "Weight Loss", "Expense Split", "Net Profit/Loss"]];
    sales.forEach(s => {
      s.lot_sales?.forEach(l => {
        headers.push([s.gatepass_id, l.lot_id, l.loaded_bags, l.loaded_weight, l.new_weight, l.weight_loss, l.allocated_expense, l.profit_loss]);
      });
    });
    downloadCSV("Sales_Report.csv", headers);
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Mandi Sales Desk</span>
        <div style={s.row}>
          <button onClick={downloadReport} style={s.btnSm(clr.blue, "#fff")}><Icon name="download" size={11} color="#fff" /> Report</button>
          <button onClick={() => setShowForm(true)} style={s.btn(clr.green, "#fff")}><Icon name="add" size={12} color="#fff" /> Punch Sale</button>
        </div>
      </div>

      {sales.map(s => (
        <div key={s.id} style={s.card}>
          <Badge v={`GP Linked: ${s.gatepass_id}`} color={clr.green} />
          {s.lot_sales?.map((l, idx) => (
            <div key={idx} style={{ fontSize: 11, marginTop: 4 }}>
              Lot: <strong>{l.lot_id}</strong> | P&L: <strong style={{ color: l.profit_loss >= 0 ? clr.green : clr.red }}>₹{fmt(l.profit_loss)}</strong>
            </div>
          ))}
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Punch Gatepass For Sale Verification">
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <input style={s.input} placeholder="Enter Unique Gatepass ID" value={punchGP} onChange={e => setPunchGP(e.target.value)} />
          <button onClick={handleSearch = handlePunch} style={s.btn()}>Fetch</button>
        </div>

        {fetchedItems.map((item, idx) => (
          <div key={idx} style={{ ...s.card2, background: clr.card }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: clr.accent }}>Lot Details: {item.lot_id}</div>
            <div style={{ fontSize: 11, color: clr.muted }}>Sent Bags: {item.manual_bags} | Sent W: {item.weight} kg</div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 6 }}>
              <input type="number" style={s.input} placeholder="New Arrived Weight" onChange={e => setNewWeights({ ...newWeights, [item.lot_id]: e.target.value })} />
              <input type="number" style={s.input} placeholder="Sale Price / kg" onChange={e => setSalePrices({ ...salePrices, [item.lot_id]: e.target.value })} />
            </div>
          </div>
        ))}

        {fetchedItems.length > 0 && (
          <>
            <div style={s.label} { ...s.divider }>Mandi Processing & Expenses Entry</div>
            <Field label="Transport Charges (Rs)"><input type="number" style={s.input} onChange={e => setExpenses({ ...expenses, transport: e.target.value })} /></Field>
            <Field label="Mandi Commission (%)"><input type="number" style={s.input} onChange={e => setExpenses({ ...expenses, mandi_commission: e.target.value })} /></Field>
            <Field label="Hamali per Bag"><input type="number" style={s.input} onChange={e => setExpenses({ ...expenses, hamali: e.target.value })} /></Field>
            <Field label="Gatepass Expense per Bag"><input type="number" style={s.input} onChange={e => setExpenses({ ...expenses, gatepass_fee: e.target.value })} /></Field>
            <Field label="Other Mandi Expenses (Rs)"><input type="number" style={s.input} onChange={e => setExpenses({ ...expenses, other: e.target.value })} /></Field>
            
            <button onClick={saveSale} style={{ ...s.btn(clr.green, "#fff"), width: "100%", marginTop: 8 }}>Calculate Metrics & Save</button>
          </>
        )}
      </Modal>
    </div>
  );
};

// STOCK SCREEN
const StockScreen = ({ purchases, dispatches }) => {
  const totalBoughtBags = purchases.reduce((sum, p) => sum + (parseInt(p.manual_bags) || 0), 0);
  const totalDispatchedBags = dispatches.flatMap(d => d.items || []).reduce((sum, i) => sum + (parseInt(i.manual_bags) || 0), 0);
  const remainingStockBags = totalBoughtBags - totalDispatchedBags;

  return (
    <div style={s.content}>
      <div style={s.card}>
        <div style={s.label}>Stock Book (Normal Bags Counting Only)</div>
        <div style={s.divider} />
        <div style={{ ...s.rowBetween, fontSize: 13, marginBottom: 4 }}><span>Total Bought Inventory:</span><strong>{fmt(totalBoughtBags)} Bags</strong></div>
        <div style={{ ...s.rowBetween, fontSize: 13, marginBottom: 4 }}><span>Total Dispatched Out:</span><strong>{fmt(totalDispatchedBags)} Bags</strong></div>
        <div style={{ ...s.rowBetween, fontSize: 13, color: clr.accent }}><span>Current Balanced Stock:</span><strong>{fmt(remainingStockBags)} Bags</strong></div>
      </div>
    </div>
  );
};

// APP CONTAINER
export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [varieties] = useSupabaseTable("varieties");
  const [gradings] = useSupabaseTable("gradings");
  const [coldStorages] = useSupabaseTable("cold_storages");
  const [mandis] = useSupabaseTable("mandis");
  const [parties] = useSupabaseTable("parties");
  const [purchases, opsPurchases] = useSupabaseTable("purchases");
  const [dispatches, opsDispatches] = useSupabaseTable("dispatches");
  const [sales, opsSales] = useSupabaseTable("sales");
  const [payments, opsPayments] = useSupabaseTable("payments");

  const ops = { purchases: opsPurchases, dispatches: opsDispatches, sales: opsSales, payments: opsPayments };

  return (
    <div style={s.screen}>
      <div style={s.header}>
        <span style={{ fontWeight: 800, color: clr.accent }}>Mandi Trader System</span>
        <Badge v={activeTab.toUpperCase()} color={clr.blue} />
      </div>

      {activeTab === "dashboard" && <DashboardScreen purchases={purchases} dispatches={dispatches} />}
      {activeTab === "purchase" && <PurchaseScreen purchases={purchases} varieties={varieties} gradings={gradings} coldStorages={coldStorages} mandis={mandis} ops={ops} />}
      {activeTab === "dispatch" && <DispatchScreen dispatches={dispatches} purchases={purchases} varieties={varieties} gradings={gradings} mandis={mandis} parties={parties} ops={ops} />}
      {activeTab === "sale" && <SaleScreen sales={sales} dispatches={dispatches} purchases={purchases} ops={ops} />}
      {activeTab === "stock" && <StockScreen purchases={purchases} dispatches={dispatches} />}

      <div style={s.navBar}>
        <button onClick={() => setActiveTab("dashboard")} style={s.navItem(activeTab === "dashboard")}><Icon name="dashboard" size={12} color={activeTab === "dashboard" ? clr.accent : clr.muted} />Home</button>
        <button onClick={() => setActiveTab("purchase")} style={s.navItem(activeTab === "purchase")}><Icon name="purchase" size={12} color={activeTab === "purchase" ? clr.accent : clr.muted} />Purchase</button>
        <button onClick={() => setActiveTab("dispatch")} style={s.navItem(activeTab === "dispatch")}><Icon name="dispatch" size={12} color={activeTab === "dispatch" ? clr.accent : clr.muted} />Dispatch</button>
        <button onClick={() => setActiveTab("sale")} style={s.navItem(activeTab === "sale")}><Icon name="sale" size={12} color={activeTab === "sale" ? clr.accent : clr.muted} />Sale Desk</button>
        <button onClick={() => setActiveTab("stock")} style={s.navItem(activeTab === "stock")}><Icon name="stock" size={12} color={activeTab === "stock" ? clr.accent : clr.muted} />Stock</button>
      </div>
    </div>
  );
}
