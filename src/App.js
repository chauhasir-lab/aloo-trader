import { useState, useCallback, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cxjmwjljjnuthcrmnbqb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4am13amxqam51dGhjcm1uYnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTYzMzUsImV4cCI6MjA5MjY3MjMzNX0.ynRaceAT1uWcsPOJ_5vY_8NKolM3EaWKQajUEk4sLz8";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const useSupabaseTable = (tableName, defaultValue = []) => {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: rows, error: err } = await supabase.from(tableName).select("*").order("created_at", { ascending: false });
        if (err) throw err;
        if (rows) {
          const parsed = rows.map(row => {
            const r = { ...row };
            if (r.items && typeof r.items === 'string') try { r.items = JSON.parse(r.items); } catch { r.items = []; }
            if (r.lot_sales && typeof r.lot_sales === 'string') try { r.lot_sales = JSON.parse(r.lot_sales); } catch { r.lot_sales = []; }
            return r;
          });
          setData(parsed);
        }
      } catch (e) {
        console.error(`Error fetching ${tableName}:`, e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tableName]);

  const addItem = useCallback(async (item) => {
    try {
      const formatted = { ...item, created_at: new Date().toISOString() };
      if (formatted.items && typeof formatted.items !== 'string') formatted.items = JSON.stringify(formatted.items);
      if (formatted.lot_sales && typeof formatted.lot_sales !== 'string') formatted.lot_sales = JSON.stringify(formatted.lot_sales);
      
      const { data: inserted, error: err } = await supabase.from(tableName).insert([formatted]).select();
      if (err) throw err;
      if (inserted) setData(p => [inserted[0], ...p]);
      return { success: true };
    } catch (e) {
      console.error(`Error adding to ${tableName}:`, e);
      return { success: false, error: e.message };
    }
  }, [tableName]);

  const editItem = useCallback(async (item) => {
    try {
      const { id, created_at, ...rest } = item;
      const formatted = { ...rest };
      if (formatted.items && typeof formatted.items !== 'string') formatted.items = JSON.stringify(formatted.items);
      if (formatted.lot_sales && typeof formatted.lot_sales !== 'string') formatted.lot_sales = JSON.stringify(formatted.lot_sales);

      const { error: err } = await supabase.from(tableName).update(formatted).eq("id", id);
      if (err) throw err;
      setData(p => p.map(x => x.id === id ? { ...x, ...item } : x));
      return { success: true };
    } catch (e) {
      console.error(`Error editing ${tableName}:`, e);
      return { success: false, error: e.message };
    }
  }, [tableName]);

  const deleteItem = useCallback(async (id) => {
    try {
      const { error: err } = await supabase.from(tableName).delete().eq("id", id);
      if (err) throw err;
      setData(p => p.filter(x => x.id !== id));
      return { success: true };
    } catch (e) {
      console.error(`Error deleting from ${tableName}:`, e);
      return { success: false, error: e.message };
    }
  }, [tableName]);

  return [data, { addItem, editItem, deleteItem, loading, error }];
};

const uid = () => Math.random().toString(36).slice(2, 9).toUpperCase();
const fmt = (n, d = 0) => (isNaN(n) ? "0" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d }));
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
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icons[name]} /></svg>;
};

const Field = ({ label, children }) => <div style={{ marginBottom: 10 }}><div style={s.label}>{label}</div>{children}</div>;
const Modal = ({ open, onClose, title, children }) => !open ? null : <div style={{ position: "fixed", inset: 0, background: "#000c", zIndex: 1000, display: "flex", alignItems: "flex-end" }}><div style={{ background: clr.card, borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 480, maxHeight: "90vh", display: "flex", flexDirection: "column", border: `1px solid ${clr.border}` }}><div style={{ ...s.rowBetween, padding: 12, borderBottom: `1px solid ${clr.border}` }}><span style={{ fontWeight: 700, fontSize: 14 }}>{title}</span><button onClick={onClose} style={s.btnSm()}><Icon name="x" size={12} /></button></div><div style={{ overflowY: "auto", padding: "0 12px 16px" }}>{children}</div></div></div>;
const Badge = ({ v, color = clr.accent }) => <span style={s.tag(color + "22", color)}>{v}</span>;

// MASTER SCREEN
const MasterForm = ({ title, items, fields, onAdd, onEdit, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});

  const save = async () => {
    if (!form[fields[0].key]?.trim()) return alert("Fill required field");
    if (editItem) {
      await onEdit({ ...editItem, ...form });
    } else {
      await onAdd({ id: uid(), ...form, created_at: new Date().toISOString() });
    }
    setShowForm(false);
    setForm({});
    setEditItem(null);
  };

  return (
    <div>
      <div style={{ ...s.rowBetween, marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{title}</span>
        <button onClick={() => { setEditItem(null); setForm({}); setShowForm(true); }} style={s.btnSm(clr.accent + "22", clr.accent)}>
          <Icon name="add" size={12} color={clr.accent} /> Add
        </button>
      </div>
      {items.length === 0 && <div style={{ color: clr.muted, fontSize: 12, textAlign: "center", padding: 6 }}>No data</div>}
      {items.map(item => (
        <div key={item.id} style={{ ...s.card2, ...s.rowBetween }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 12 }}>{item[fields[0].key]}</div>
            {fields.slice(1, 2).map(f => item[f.key] && <div key={f.key} style={{ fontSize: 11, color: clr.muted }}>{item[f.key]}</div>)}
          </div>
          <div style={s.row}>
            <button onClick={() => { setEditItem(item); setForm({ ...item }); setShowForm(true); }} style={{ ...s.btnSm(), padding: "4px 6px" }}>
              <Icon name="edit" size={11} color={clr.blue} />
            </button>
            <button onClick={() => { if (window.confirm("Delete?")) onDelete(item.id); }} style={{ ...s.btnSm(), padding: "4px 6px" }}>
              <Icon name="trash" size={11} color={clr.red} />
            </button>
          </div>
        </div>
      ))}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Edit" : "Add"}>
        {fields.map(f => (
          <Field key={f.key} label={f.label}>
            <input style={s.input} value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder || f.label} />
          </Field>
        ))}
        <button onClick={save} style={{ ...s.btn(), width: "100%" }}>Save</button>
      </Modal>
    </div>
  );
};

const MasterScreen = ({ varieties, gradings, coldStorages, mandis, parties, ops }) => (
  <div style={s.content}>
    <MasterForm title="Varieties" items={varieties} fields={[{ key: "name", label: "Variety Name" }]} onAdd={item => ops.varieties.addItem(item)} onEdit={item => ops.varieties.editItem(item)} onDelete={id => ops.varieties.deleteItem(id)} />
    <MasterForm title="Gradings" items={gradings} fields={[{ key: "name", label: "Grade Name" }]} onAdd={item => ops.gradings.addItem(item)} onEdit={item => ops.gradings.editItem(item)} onDelete={id => ops.gradings.deleteItem(id)} />
    <MasterForm title="Cold Storages" items={coldStorages} fields={[{ key: "name", label: "Name" }, { key: "phone", label: "Phone" }, { key: "address", label: "Address" }]} onAdd={item => ops.cold_storages.addItem(item)} onEdit={item => ops.cold_storages.editItem(item)} onDelete={id => ops.cold_storages.deleteItem(id)} />
    <MasterForm title="Mandis" items={mandis} fields={[{ key: "name", label: "Name" }, { key: "phone", label: "Phone" }, { key: "address", label: "Address" }]} onAdd={item => ops.mandis.addItem(item)} onEdit={item => ops.mandis.editItem(item)} onDelete={id => ops.mandis.deleteItem(id)} />
    <MasterForm title="Parties" items={parties} fields={[{ key: "name", label: "Name" }, { key: "phone", label: "Phone" }, { key: "address", label: "Address" }, { key: "credit_days", label: "Credit Days" }]} onAdd={item => ops.parties.addItem(item)} onEdit={item => ops.parties.editItem(item)} onDelete={id => ops.parties.deleteItem(id)} />
  </div>
);

// DASHBOARD SCREEN
const DashboardScreen = ({ purchases, dispatches, sales }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  const activeLots = purchases.filter(p => {
    const dispatched = dispatches.filter(d => d.items?.some(i => i.lot_id === p.lot_id));
    return dispatched.length === 0;
  }).length;

  const closedLots = purchases.filter(p => {
    const saleInfo = sales.find(s => s.lot_sales?.some(l => l.lot_id === p.lot_id));
    return saleInfo;
  }).length;

  const totalStock = purchases.reduce((sum, p) => sum + (parseFloat(p.manual_bags) || 0), 0);
  const totalWeight = purchases.reduce((sum, p) => sum + (parseFloat(p.total_weight) || 0), 0);
  const totalValue = purchases.reduce((sum, p) => sum + (parseFloat(p.total_cost) || 0), 0);

  const handleSearch = () => {
    const query = searchQuery.toLowerCase();
    const found = purchases.find(p => p.lot_id.toLowerCase() === query) || 
                 dispatches.find(d => d.gatepass_id.toLowerCase() === query || d.vehicle_number?.toLowerCase() === query);
    setSearchResult(found);
  };

  return (
    <div style={s.content}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <input style={{ ...s.input, flex: 1 }} placeholder="Search Lot/GP/Vehicle" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyPress={e => e.key === "Enter" && handleSearch()} />
          <button onClick={handleSearch} style={{ ...s.btn(), padding: "8px 10px" }}><Icon name="search" size={12} /></button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
        <div style={{ ...s.card2, background: clr.blue + "15" }}><div style={s.label}>Active Lots</div><div style={{ fontSize: 18, fontWeight: 800, color: clr.blue }}>{activeLots}</div></div>
        <div style={{ ...s.card2, background: clr.red + "15" }}><div style={s.label}>Closed Lots</div><div style={{ fontSize: 18, fontWeight: 800, color: clr.red }}>{closedLots}</div></div>
        <div style={{ ...s.card2, background: clr.purple + "15" }}><div style={s.label}>Total Bags</div><div style={{ fontSize: 18, fontWeight: 800, color: clr.purple }}>{fmt(totalStock)}</div></div>
        <div style={{ ...s.card2, background: clr.accent + "15" }}><div style={s.label}>Stock Value</div><div style={{ fontSize: 16, fontWeight: 800, color: clr.accent }}>₹{fmt(totalValue)}</div></div>
      </div>

      <div style={{ ...s.card, marginBottom: 12 }}>
        <div style={s.label}>Stock Summary</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 6 }}>
          <span>Weight: <strong>{fmt(totalWeight)} kg</strong></span>
          <span>Bags: <strong>{fmt(totalStock)}</strong></span>
        </div>
      </div>

      {searchResult && (
        <div style={{ ...s.card, background: clr.card2, marginBottom: 12 }}>
          <div style={{ fontWeight: 600, color: clr.accent, marginBottom: 6 }}>Search Result: {searchResult.lot_id || searchResult.gatepass_id}</div>
          <div style={s.divider} />
          <div style={{ fontSize: 11, color: clr.muted }}>
            {searchResult.lot_id ? `Lot Date: ${fmtDate(searchResult.date)}` : `Gatepass: ${fmtDate(searchResult.date)}`}
          </div>
          <button onClick={() => setSearchResult(null)} style={{ ...s.btn(clr.red, "#fff"), width: "100%", marginTop: 8 }}>Close</button>
        </div>
      )}

      <div style={s.label}>Recent Purchases</div>
      {purchases.slice(0, 3).map(p => (
        <div key={p.id} style={s.card2}>
          <div style={s.rowBetween}><strong style={{ fontSize: 12 }}>{p.lot_id}</strong><span style={{ fontSize: 10, color: clr.muted }}>{fmtDate(p.date)}</span></div>
          <div style={{ fontSize: 11, color: clr.muted }}>{p.farmer_name}</div>
        </div>
      ))}

      <div style={{ ...s.label, marginTop: 12 }}>Recent Dispatches</div>
      {dispatches.slice(0, 3).map(d => (
        <div key={d.id} style={s.card2}>
          <div style={s.rowBetween}><strong style={{ fontSize: 12 }}>GP: {d.gatepass_id}</strong><span style={{ fontSize: 10, color: clr.muted }}>{fmtDate(d.date)}</span></div>
          <div style={{ fontSize: 11, color: clr.muted }}>Vehicle: {d.vehicle_number}</div>
        </div>
      ))}
    </div>
  );
};

// PURCHASE SCREEN
const PurchaseScreen = ({ purchases, varieties, gradings, coldStorages, mandis, ops }) => {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ lot_id: "", farmer_name: "", manual_bags: "", total_weight: "", rate_per_bag: "", total_cost: "", variety_id: "", grading_id: "", cold_storage_id: "", mandi_id: "", date: today() });

  const stdBags = form.total_weight ? (parseFloat(form.total_weight) / 52.5).toFixed(2) : "0.00";
  const totalCost = (parseFloat(form.manual_bags) || 0) * (parseFloat(form.rate_per_bag) || 0);

  const save = async () => {
    if (!form.lot_id || !form.farmer_name || !form.manual_bags || !form.rate_per_bag) return alert("Fill required fields");
    const data = { ...form, std_bags: stdBags, total_cost: totalCost };
    if (editItem) {
      await ops.purchases.editItem({ ...editItem, ...data });
    } else {
      await ops.purchases.addItem({ id: uid(), ...data });
    }
    setShowForm(false);
    setForm({ lot_id: "", farmer_name: "", manual_bags: "", total_weight: "", rate_per_bag: "", total_cost: "", variety_id: "", grading_id: "", cold_storage_id: "", mandi_id: "", date: today() });
    setEditItem(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this purchase?")) {
      await ops.purchases.deleteItem(id);
    }
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Purchases</span>
        <button onClick={() => { setEditItem(null); setForm({ lot_id: "", farmer_name: "", manual_bags: "", total_weight: "", rate_per_bag: "", total_cost: "", variety_id: "", grading_id: "", cold_storage_id: "", mandi_id: "", date: today() }); setShowForm(true); }} style={s.btn()}><Icon name="add" size={12} /> New</button>
      </div>

      {purchases.map(p => (
        <div key={p.id} style={s.card}>
          <div style={s.rowBetween}><Badge v={p.lot_id} color={clr.accent} /><span style={{ fontSize: 10, color: clr.muted }}>{fmtDate(p.date)}</span></div>
          <div style={{ fontWeight: 600, fontSize: 12, marginTop: 4 }}>{p.farmer_name}</div>
          <div style={s.divider} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11, marginBottom: 6 }}>
            <div><span style={s.label}>Manual Bags</span><div style={{ fontWeight: 600 }}>{p.manual_bags}</div></div>
            <div><span style={s.label}>Std Bags</span><div style={{ fontWeight: 600 }}>{fmt(p.std_bags, 2)}</div></div>
            <div><span style={s.label}>Weight</span><div style={{ fontWeight: 600 }}>{p.total_weight} kg</div></div>
            <div><span style={s.label}>Rate</span><div style={{ fontWeight: 600 }}>₹{p.rate_per_bag}</div></div>
          </div>
          <div style={{ background: clr.card2, padding: 6, borderRadius: 4, fontSize: 11, marginBottom: 8 }}>
            <span style={s.label}>Total Cost</span>
            <div style={{ fontWeight: 700, color: clr.accent }}>₹{fmt(p.total_cost)}</div>
          </div>
          <div style={s.row}>
            <button onClick={() => { setEditItem(p); setForm({ ...p }); setShowForm(true); }} style={{ ...s.btnSm(), flex: 1 }}>
              <Icon name="edit" size={10} color={clr.blue} /> Edit
            </button>
            <button onClick={() => handleDelete(p.id)} style={{ ...s.btnSm(), flex: 1, color: clr.red }}>
              <Icon name="trash" size={10} color={clr.red} /> Delete
            </button>
          </div>
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Edit Purchase" : "New Purchase"}>
        <Field label="Lot ID (Unique)"><input style={s.input} value={form.lot_id} onChange={e => setForm({ ...form, lot_id: e.target.value })} placeholder="LOT001" disabled={editItem} /></Field>
        <Field label="Farmer Name"><input style={s.input} value={form.farmer_name} onChange={e => setForm({ ...form, farmer_name: e.target.value })} /></Field>
        <Field label="Manual Bags"><input type="number" style={s.input} value={form.manual_bags} onChange={e => setForm({ ...form, manual_bags: e.target.value })} /></Field>
        <Field label="Total Weight (kg)"><input type="number" style={s.input} value={form.total_weight} onChange={e => setForm({ ...form, total_weight: e.target.value })} /></Field>
        <div style={{ ...s.card2, padding: 8, marginBottom: 10 }}>
          <div style={s.label}>Std Bags (Auto) - 52.5kg</div>
          <div style={{ fontWeight: 700, color: clr.accent }}>{stdBags}</div>
        </div>
        <Field label="Rate per Bag"><input type="number" step="0.01" style={s.input} value={form.rate_per_bag} onChange={e => setForm({ ...form, rate_per_bag: e.target.value })} /></Field>
        <div style={{ ...s.card2, padding: 8, marginBottom: 10, background: clr.accent + "15" }}>
          <div style={s.label}>Total Cost</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: clr.accent }}>₹{fmt(totalCost)}</div>
        </div>
        <Field label="Variety"><select style={s.select} value={form.variety_id} onChange={e => setForm({ ...form, variety_id: e.target.value })}><option value="">Select</option>{varieties.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></Field>
        <Field label="Grading"><select style={s.select} value={form.grading_id} onChange={e => setForm({ ...form, grading_id: e.target.value })}><option value="">Select</option>{gradings.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></Field>
        <Field label="Cold Storage"><select style={s.select} value={form.cold_storage_id} onChange={e => setForm({ ...form, cold_storage_id: e.target.value })}><option value="">Select</option>{coldStorages.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Mandi (Reference)"><select style={s.select} value={form.mandi_id} onChange={e => setForm({ ...form, mandi_id: e.target.value })}><option value="">Select</option>{mandis.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
        <button onClick={save} style={{ ...s.btn(), width: "100%" }}>{editItem ? "Update" : "Save"} Purchase</button>
      </Modal>
    </div>
  );
};

// DISPATCH SCREEN
const DispatchScreen = ({ dispatches, purchases, mandis, parties, ops }) => {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ gatepass_id: "", vehicle_number: "", driver_name: "", destination_party_id: "", destination_mandi_id: "", items: [], date: today() });
  const [itemForm, setItemForm] = useState({ lot_id: "", manual_bags: "", weight: "" });

  const addItem = () => {
    if (!itemForm.lot_id || !itemForm.manual_bags) return alert("Fill lot details");
    setForm(p => ({ ...p, items: [...p.items, itemForm] }));
    setItemForm({ lot_id: "", manual_bags: "", weight: "" });
  };

  const removeItem = (idx) => {
    setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
  };

  const save = async () => {
    if (!form.gatepass_id || form.items.length === 0) return alert("Add lots to dispatch");
    if (editItem) {
      await ops.dispatches.editItem({ ...editItem, ...form });
    } else {
      await ops.dispatches.addItem({ ...form, id: uid() });
    }
    setShowForm(false);
    setForm({ gatepass_id: "", vehicle_number: "", driver_name: "", destination_party_id: "", destination_mandi_id: "", items: [], date: today() });
    setEditItem(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this dispatch?")) {
      await ops.dispatches.deleteItem(id);
    }
  };

  const generateWhatsAppMessage = () => {
    const lotList = form.items.map(i => `${i.lot_id}: ${i.manual_bags} bags`).join("\n");
    return `Dispatch Details\nGatepass: ${form.gatepass_id}\nVehicle: ${form.vehicle_number}\nLots:\n${lotList}`;
  };

  const handleWhatsApp = () => {
    const msg = generateWhatsAppMessage();
    alert(`Message ready to send:\n\n${msg}\n\nClick OK to copy and share on WhatsApp`);
    navigator.clipboard.writeText(msg);
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Dispatch</span>
        <button onClick={() => { setEditItem(null); setForm({ gatepass_id: "", vehicle_number: "", driver_name: "", destination_party_id: "", destination_mandi_id: "", items: [], date: today() }); setShowForm(true); }} style={s.btn()}><Icon name="add" size={12} /> New</button>
      </div>

      {dispatches.map(d => (
        <div key={d.id} style={s.card}>
          <div style={s.rowBetween}><Badge v={`GP: ${d.gatepass_id}`} color={clr.blue} /><span style={{ fontSize: 10, color: clr.muted }}>{fmtDate(d.date)}</span></div>
          <div style={{ fontSize: 11, color: clr.muted, marginTop: 4 }}>Vehicle: {d.vehicle_number}</div>
          <div style={s.divider} />
          {d.items?.map((i, idx) => <div key={idx} style={{ fontSize: 11, ...s.rowBetween, marginBottom: 4 }}><span>{i.lot_id}</span><strong>{i.manual_bags} bags</strong></div>)}
          <div style={{ ...s.row, marginTop: 8 }}>
            <button onClick={() => { setEditItem(d); setForm({ ...d }); setShowForm(true); }} style={{ ...s.btnSm(), flex: 1 }}>
              <Icon name="edit" size={10} color={clr.blue} /> Edit
            </button>
            <button onClick={() => handleDelete(d.id)} style={{ ...s.btnSm(), flex: 1, color: clr.red }}>
              <Icon name="trash" size={10} color={clr.red} /> Delete
            </button>
          </div>
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Edit Dispatch" : "New Dispatch"}>
        <Field label="Gatepass ID"><input style={s.input} value={form.gatepass_id} onChange={e => setForm({ ...form, gatepass_id: e.target.value })} placeholder="GP-001" disabled={editItem} /></Field>
        <Field label="Vehicle Number"><input style={s.input} value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} placeholder="MH-12-AB-1234" /></Field>
        <Field label="Driver Name"><input style={s.input} value={form.driver_name} onChange={e => setForm({ ...form, driver_name: e.target.value })} /></Field>
        <Field label="Destination - Party"><select style={s.select} value={form.destination_party_id} onChange={e => setForm({ ...form, destination_party_id: e.target.value })}><option value="">Select</option>{parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Destination - Mandi"><select style={s.select} value={form.destination_mandi_id} onChange={e => setForm({ ...form, destination_mandi_id: e.target.value })}><option value="">Select</option>{mandis.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>

        <div style={{ ...s.card2, background: clr.card, marginBottom: 10, padding: 8 }}>
          <div style={s.label}>Add Lots</div>
          <select style={{ ...s.select, marginBottom: 6 }} value={itemForm.lot_id} onChange={e => { const lot = purchases.find(p => p.lot_id === e.target.value); setItemForm({ lot_id: e.target.value, manual_bags: lot?.manual_bags || "", weight: lot?.total_weight || "" }); }}>
            <option value="">Select Lot</option>
            {purchases.map(p => <option key={p.id} value={p.lot_id}>{p.lot_id} - {p.farmer_name}</option>)}
          </select>
          <input type="number" style={{ ...s.input, marginBottom: 6 }} placeholder="Manual Bags" value={itemForm.manual_bags} onChange={e => setItemForm({ ...itemForm, manual_bags: e.target.value })} />
          <button onClick={addItem} style={{ ...s.btnSm(clr.accent + "22", clr.accent), width: "100%" }}>Add Lot</button>
        </div>

        {form.items.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={s.label}>Selected Lots</div>
            {form.items.map((i, idx) => (
              <div key={idx} style={{ ...s.card2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11 }}>{i.lot_id} - {i.manual_bags} bags</span>
                <button onClick={() => removeItem(idx)} style={s.btnSm()}>
                  <Icon name="trash" size={10} color={clr.red} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button onClick={save} style={{ ...s.btn(), width: "100%", marginBottom: 8 }}>{editItem ? "Update" : "Save"} Dispatch</button>
        {form.items.length > 0 && <button onClick={handleWhatsApp} style={{ ...s.btn(clr.green, "#fff"), width: "100%" }}>WhatsApp Message</button>}
      </Modal>
    </div>
  );
};

// SALE SCREEN
const SaleScreen = ({ sales, dispatches, purchases, mandis, parties, ops }) => {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ gatepass_id: "", date: today(), lot_sales: [], transport: 0, mandi_commission: 0, labor_per_bag: 0, other_expenses: 0 });
  const [saleItem, setSaleItem] = useState({ lot_id: "", rate_per_kg: "", weight_loss: 0 });

  const addSaleItem = () => {
    if (!saleItem.lot_id || !saleItem.rate_per_kg) return alert("Fill lot details");
    setForm(p => ({ ...p, lot_sales: [...p.lot_sales, saleItem] }));
    setSaleItem({ lot_id: "", rate_per_kg: "", weight_loss: 0 });
  };

  const removeSaleItem = (idx) => {
    setForm(p => ({ ...p, lot_sales: p.lot_sales.filter((_, i) => i !== idx) }));
  };

  const save = async () => {
    if (!form.gatepass_id || form.lot_sales.length === 0) return alert("Add lots to sale");
    if (editItem) {
      await ops.sales.editItem({ ...editItem, ...form });
    } else {
      await ops.sales.addItem({ ...form, id: uid() });
    }
    setShowForm(false);
    setForm({ gatepass_id: "", date: today(), lot_sales: [], transport: 0, mandi_commission: 0, labor_per_bag: 0, other_expenses: 0 });
    setEditItem(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this sale?")) {
      await ops.sales.deleteItem(id);
    }
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Sales</span>
        <button onClick={() => { setEditItem(null); setForm({ gatepass_id: "", date: today(), lot_sales: [], transport: 0, mandi_commission: 0, labor_per_bag: 0, other_expenses: 0 }); setShowForm(true); }} style={s.btn(clr.green, "#fff")}><Icon name="add" size={12} color="#fff" /> New</button>
      </div>

      {sales.map(sx => (
        <div key={sx.id} style={s.card}>
          <div style={s.rowBetween}><Badge v={`GP: ${sx.gatepass_id}`} color={clr.green} /><span style={{ fontSize: 10, color: clr.muted }}>{fmtDate(sx.date)}</span></div>
          <div style={s.divider} />
          {sx.lot_sales?.slice(0, 2).map((l, idx) => <div key={idx} style={{ fontSize: 11, marginBottom: 4 }}>{l.lot_id} @ ₹{l.rate_per_kg}/kg</div>)}
          <div style={{ ...s.row, marginTop: 8 }}>
            <button onClick={() => { setEditItem(sx); setForm({ ...sx }); setShowForm(true); }} style={{ ...s.btnSm(), flex: 1 }}>
              <Icon name="edit" size={10} color={clr.blue} /> Edit
            </button>
            <button onClick={() => handleDelete(sx.id)} style={{ ...s.btnSm(), flex: 1, color: clr.red }}>
              <Icon name="trash" size={10} color={clr.red} /> Delete
            </button>
          </div>
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Edit Sale" : "New Sale"}>
        <Field label="Gatepass ID"><input style={s.input} value={form.gatepass_id} onChange={e => setForm({ ...form, gatepass_id: e.target.value })} placeholder="GP-001" disabled={editItem} /></Field>

        <div style={{ ...s.card2, background: clr.card, marginBottom: 10, padding: 8 }}>
          <div style={s.label}>Add Lot Sale</div>
          <select style={{ ...s.select, marginBottom: 6 }} value={saleItem.lot_id} onChange={e => setSaleItem({ ...saleItem, lot_id: e.target.value })}>
            <option value="">Select Lot</option>
            {purchases.map(p => <option key={p.id} value={p.lot_id}>{p.lot_id}</option>)}
          </select>
          <input type="number" step="0.01" style={{ ...s.input, marginBottom: 6 }} placeholder="Rate per kg" value={saleItem.rate_per_kg} onChange={e => setSaleItem({ ...saleItem, rate_per_kg: e.target.value })} />
          <input type="number" step="0.01" style={{ ...s.input, marginBottom: 6 }} placeholder="Weight Loss (kg)" value={saleItem.weight_loss} onChange={e => setSaleItem({ ...saleItem, weight_loss: e.target.value })} />
          <button onClick={addSaleItem} style={{ ...s.btnSm(clr.green + "22", clr.green), width: "100%" }}>Add</button>
        </div>

        {form.lot_sales.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={s.label}>Sales Summary</div>
            {form.lot_sales.map((l, idx) => (
              <div key={idx} style={{ ...s.card2, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11 }}>{l.lot_id} @ ₹{l.rate_per_kg}</span>
                <button onClick={() => removeSaleItem(idx)} style={s.btnSm()}><Icon name="trash" size={10} color={clr.red} /></button>
              </div>
            ))}
          </div>
        )}

        <Field label="Transport Charges"><input type="number" step="0.01" style={s.input} value={form.transport} onChange={e => setForm({ ...form, transport: e.target.value })} /></Field>
        <Field label="Mandi Commission %"><input type="number" step="0.01" style={s.input} value={form.mandi_commission} onChange={e => setForm({ ...form, mandi_commission: e.target.value })} /></Field>
        <Field label="Labor per Bag"><input type="number" step="0.01" style={s.input} value={form.labor_per_bag} onChange={e => setForm({ ...form, labor_per_bag: e.target.value })} /></Field>
        <Field label="Other Expenses"><input type="number" step="0.01" style={s.input} value={form.other_expenses} onChange={e => setForm({ ...form, other_expenses: e.target.value })} /></Field>

        <button onClick={save} style={{ ...s.btn(clr.green, "#fff"), width: "100%" }}>{editItem ? "Update" : "Save"} Sale</button>
      </Modal>
    </div>
  );
};

// PAYMENT SCREEN
const PaymentScreen = ({ purchases, dispatches, sales, coldStorages, parties, ops }) => {
  const [payments, paymentsOps] = useSupabaseTable("payments");
  const [paymentType, setPaymentType] = useState("cold");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ gatepass_id: "", amount: "", payment_method: "cash", date: today(), notes: "", type: "cold" });

  const save = async () => {
    if (!form.gatepass_id || !form.amount) return alert("Fill required fields");
    if (editItem) {
      await paymentsOps.editItem({ ...editItem, ...form });
    } else {
      await paymentsOps.addItem({ id: uid(), ...form, type: paymentType });
    }
    setShowForm(false);
    setForm({ gatepass_id: "", amount: "", payment_method: "cash", date: today(), notes: "", type: paymentType });
    setEditItem(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this payment?")) {
      await paymentsOps.deleteItem(id);
    }
  };

  const filteredPayments = payments.filter(p => p.type === paymentType);

  return (
    <div style={s.content}>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <button onClick={() => setPaymentType("cold")} style={{ ...s.btn(paymentType === "cold" ? clr.accent : clr.card2, paymentType === "cold" ? "#000" : clr.text), flex: 1 }}>Pay to Cold</button>
        <button onClick={() => setPaymentType("party")} style={{ ...s.btn(paymentType === "party" ? clr.accent : clr.card2, paymentType === "party" ? "#000" : clr.text), flex: 1 }}>Receive from Party</button>
      </div>

      <button onClick={() => { setEditItem(null); setForm({ gatepass_id: "", amount: "", payment_method: "cash", date: today(), notes: "", type: paymentType }); setShowForm(true); }} style={{ ...s.btn(), width: "100%", marginBottom: 12 }}>Record Payment</button>

      {filteredPayments.map(p => (
        <div key={p.id} style={s.card}>
          <div style={s.rowBetween}><Badge v={p.type === "cold" ? "PAY" : "RECEIVE"} color={p.type === "cold" ? clr.red : clr.green} /><span style={{ fontSize: 10, color: clr.muted }}>{fmtDate(p.date)}</span></div>
          <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>₹{fmt(p.amount)}</div>
          <div style={{ fontSize: 11, color: clr.muted }}>GP: {p.gatepass_id} | {p.payment_method}</div>
          <div style={{ ...s.row, marginTop: 8 }}>
            <button onClick={() => { setEditItem(p); setForm({ ...p }); setShowForm(true); }} style={{ ...s.btnSm(), flex: 1 }}>
              <Icon name="edit" size={10} color={clr.blue} /> Edit
            </button>
            <button onClick={() => handleDelete(p.id)} style={{ ...s.btnSm(), flex: 1, color: clr.red }}>
              <Icon name="trash" size={10} color={clr.red} /> Delete
            </button>
          </div>
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Edit Payment" : "Record Payment"}>
        <Field label="Gatepass ID"><input style={s.input} value={form.gatepass_id} onChange={e => setForm({ ...form, gatepass_id: e.target.value })} disabled={editItem} /></Field>
        <Field label="Amount"><input type="number" step="0.01" style={s.input} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></Field>
        <Field label="Payment Method">
          <select style={s.select} value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>
            <option value="cash">Cash</option>
            <option value="online">Online</option>
            <option value="bank">Bank</option>
            <option value="upi">UPI</option>
            <option value="cheque">Cheque</option>
          </select>
        </Field>
        <Field label="Notes"><input style={s.input} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field>
        <button onClick={save} style={{ ...s.btn(), width: "100%" }}>{editItem ? "Update" : "Save"} Payment</button>
      </Modal>
    </div>
  );
};

// STOCK SCREEN
const StockScreen = ({ purchases, dispatches, sales }) => {
  const totalStock = purchases.reduce((sum, p) => sum + (parseFloat(p.manual_bags) || 0), 0);
  const dispatchedBags = dispatches.flatMap(d => d.items || []).reduce((sum, i) => sum + (parseFloat(i.manual_bags) || 0), 0);
  const remainingBags = totalStock - dispatchedBags;

  const totalValue = purchases.reduce((sum, p) => sum + (parseFloat(p.total_cost) || 0), 0);
  const soldValue = sales.flatMap(s => s.lot_sales || []).reduce((sum, l) => sum + (parseFloat(l.rate_per_kg) || 0), 0);
  const totalProfit = soldValue - totalValue;

  return (
    <div style={s.content}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
        <div style={{ ...s.card, background: clr.blue + "15" }}>
          <div style={s.label}>Total Bags</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: clr.blue }}>{fmt(totalStock)}</div>
        </div>
        <div style={{ ...s.card, background: clr.purple + "15" }}>
          <div style={s.label}>Remaining</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: clr.purple }}>{fmt(remainingBags)}</div>
        </div>
      </div>

      <div style={{ ...s.card, marginBottom: 12 }}>
        <div style={s.label}>Value Summary</div>
        <div style={s.divider} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
          <span>Purchase Value:</span>
          <strong>₹{fmt(totalValue)}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
          <span>Sale Value:</span>
          <strong style={{ color: clr.green }}>₹{fmt(soldValue)}</strong>
        </div>
      </div>

      <div style={{ ...s.card, background: (totalProfit >= 0 ? clr.green : clr.red) + "15" }}>
        <div style={s.label}>Total Profit/Loss</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: totalProfit >= 0 ? clr.green : clr.red }}>
          {totalProfit >= 0 ? "+" : ""}₹{fmt(totalProfit)}
        </div>
      </div>

      <div style={{ ...s.label, marginTop: 16 }}>Stock Details</div>
      <div style={s.card}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12 }}>Total Purchased:</span>
          <strong>{fmt(totalStock)} bags</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12 }}>Dispatched:</span>
          <strong style={{ color: clr.blue }}>{fmt(dispatchedBags)} bags</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12 }}>Still in Stock:</span>
          <strong style={{ color: clr.green }}>{fmt(remainingBags)} bags</strong>
        </div>
      </div>
    </div>
  );
};

// APP
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
        <span style={{ fontWeight: 800, fontSize: 16, color: clr.accent }}>AlooTrader v3</span>
        <Badge v={activeTab.toUpperCase()} color={clr.blue} />
      </div>

      {activeTab === "dashboard" && <DashboardScreen purchases={purchases} dispatches={dispatches} sales={sales} />}
      {activeTab === "purchase" && <PurchaseScreen purchases={purchases} varieties={varieties} gradings={gradings} coldStorages={coldStorages} mandis={mandis} ops={ops} />}
      {activeTab === "dispatch" && <DispatchScreen dispatches={dispatches} purchases={purchases} mandis={mandis} parties={parties} ops={ops} />}
      {activeTab === "sale" && <SaleScreen sales={sales} dispatches={dispatches} purchases={purchases} mandis={mandis} parties={parties} ops={ops} />}
      {activeTab === "payment" && <PaymentScreen purchases={purchases} dispatches={dispatches} sales={sales} coldStorages={coldStorages} parties={parties} ops={ops} />}
      {activeTab === "stock" && <StockScreen purchases={purchases} dispatches={dispatches} sales={sales} />}
      {activeTab === "settings" && <MasterScreen varieties={varieties} gradings={gradings} coldStorages={coldStorages} mandis={mandis} parties={parties} ops={ops} />}

      <div style={s.navBar}>
        <button onClick={() => setActiveTab("dashboard")} style={s.navItem(activeTab === "dashboard")}><Icon name="dashboard" size={12} color={activeTab === "dashboard" ? clr.accent : clr.muted} />Dashboard</button>
        <button onClick={() => setActiveTab("purchase")} style={s.navItem(activeTab === "purchase")}><Icon name="purchase" size={12} color={activeTab === "purchase" ? clr.accent : clr.muted} />Purchase</button>
        <button onClick={() => setActiveTab("dispatch")} style={s.navItem(activeTab === "dispatch")}><Icon name="dispatch" size={12} color={activeTab === "dispatch" ? clr.accent : clr.muted} />Dispatch</button>
        <button onClick={() => setActiveTab("sale")} style={s.navItem(activeTab === "sale")}><Icon name="sale" size={12} color={activeTab === "sale" ? clr.accent : clr.muted} />Sale</button>
        <button onClick={() => setActiveTab("payment")} style={s.navItem(activeTab === "payment")}><Icon name="payment" size={12} color={activeTab === "payment" ? clr.accent : clr.muted} />Payment</button>
        <button onClick={() => setActiveTab("stock")} style={s.navItem(activeTab === "stock")}><Icon name="stock" size={12} color={activeTab === "stock" ? clr.accent : clr.muted} />Stock</button>
        <button onClick={() => setActiveTab("settings")} style={s.navItem(activeTab === "settings")}><Icon name="settings" size={12} color={activeTab === "settings" ? clr.accent : clr.muted} />Master</button>
      </div>
    </div>
  );
}
