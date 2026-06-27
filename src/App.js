import { useState, useCallback, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cxjmwjljjnuthcrmnbqb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4am13amxqam51dGhjcm1uYnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTYzMzUsImV4cCI6MjA5MjY3MjMzNX0.ynRaceAT1uWcsPOJ_5vY_8NKolM3EaWKQajUEk4sLz8";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const useSupabaseTable = (tableName, defaultValue = []) => {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: rows, error } = await supabase.from(tableName).select("*").order("created_at", { ascending: true });
      if (!error && rows) {
        const parsed = rows.map(row => {
          const r = { ...row };
          if (r.items && typeof r.items === 'string') try { r.items = JSON.parse(r.items); } catch { r.items = []; }
          if (r.lot_sales && typeof r.lot_sales === 'string') try { r.lot_sales = JSON.parse(r.lot_sales); } catch { r.lot_sales = []; }
          return r;
        });
        setData(parsed);
      }
      setLoading(false);
    };
    fetchData();
  }, [tableName]);

  const addItem = useCallback(async (item) => {
    const { created_at, ...rest } = item;
    const { data: inserted, error } = await supabase.from(tableName).insert([{ ...rest }]).select();
    if (!error && inserted) setData(p => [...p, inserted[0]]);
  }, [tableName]);

  const editItem = useCallback(async (item) => {
    const { id, created_at, ...rest } = item;
    const { error } = await supabase.from(tableName).update(rest).eq("id", id);
    if (!error) setData(p => p.map(x => x.id === id ? { ...x, ...item } : x));
  }, [tableName]);

  const deleteItem = useCallback(async (id) => {
    const { error } = await supabase.from(tableName).delete().eq("id", id);
    if (!error) setData(p => p.filter(x => x.id !== id));
  }, [tableName]);

  return [data, { addItem, editItem, deleteItem, loading }];
};

const uid = () => Math.random().toString(36).slice(2, 7).toUpperCase();
const fmt = (n, d = 0) => (isNaN(n) ? "0" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d }));
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "-";
const today = () => new Date().toISOString().slice(0, 10);

const clr = { bg: "#0f1117", card: "#1a1d26", card2: "#22263a", accent: "#f5a623", green: "#22c55e", red: "#ef4444", blue: "#3b82f6", purple: "#a855f7", muted: "#6b7280", border: "#2d3148", text: "#f1f5f9" };

const getLotStatus = (lot, dispatches = [], sales = []) => {
  const totalDispatched = dispatches.flatMap(d => d.items || []).filter(i => i.lot_id === lot.lot_id).reduce((sum, i) => sum + parseFloat(i.bags || 0), 0);
  const totalSold = sales.flatMap(s => s.lot_sales || []).filter(l => l.lot_id === lot.lot_id).reduce((sum, l) => sum + parseFloat(l.bags || 0), 0);
  const effectiveBags = lot.pricing_type === "STD" ? parseFloat(lot.std_bags) : parseFloat(lot.manual_bags);
  const remaining = effectiveBags - totalDispatched;
  const soldValue = sales.flatMap(s => s.lot_sales || []).filter(l => l.lot_id === lot.lot_id).reduce((sum, l) => sum + (parseFloat(l.bags || 0) * parseFloat(l.rate || 0)), 0);
  const expense = sales.flatMap(s => s.lot_sales || []).filter(l => l.lot_id === lot.lot_id).reduce((sum, l) => {
    const saleForLot = sales.find(sx => sx.lot_sales?.some(lx => lx.lot_id === lot.lot_id));
    return sum + (parseFloat(l.bags || 0) * (parseFloat(saleForLot?.labor_per_bag || 0)));
  }, 0);
  const profitLoss = soldValue - (parseFloat(lot.total_amount) || 0) - expense;
  return { totalDispatched, totalSold, remaining, isClosed: remaining <= 0 && totalDispatched > 0, soldValue, profitLoss };
};

const Icon = ({ name, size = 18, color = clr.text }) => {
  const icons = {
    purchase: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    dispatch: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
    sale: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    payment: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    master: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
    add: "M12 4v16m8-8H4", x: "M6 18L18 6M6 6l12 12", search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16", edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icons[name]} /></svg>;
};

const s = {
  screen: { minHeight: "100vh", background: clr.bg, color: clr.text, fontFamily: "system-ui, sans-serif", maxWidth: 480, margin: "0 auto", position: "relative" },
  header: { background: clr.card, padding: "14px 16px", borderBottom: `1px solid ${clr.border}`, position: "sticky", top: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center" },
  card: { background: clr.card, borderRadius: 12, padding: 14, marginBottom: 10, border: `1px solid ${clr.border}` },
  card2: { background: clr.card2, borderRadius: 10, padding: 12, marginBottom: 8, border: `1px solid ${clr.border}` },
  rowBetween: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  row: { display: "flex", alignItems: "center", gap: 8 },
  input: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 8, padding: "10px 12px", color: clr.text, fontSize: 14, boxSizing: "border-box", outline: "none" },
  select: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 8, padding: "10px 12px", color: clr.text, fontSize: 14, boxSizing: "border-box", outline: "none" },
  label: { fontSize: 11, color: clr.muted, marginBottom: 3, fontWeight: 600, textTransform: "uppercase" },
  btn: (bg = clr.accent, txt = "#000") => ({ background: bg, color: txt, border: "none", borderRadius: 8, padding: "11px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }),
  btnSm: (bg = clr.card2, txt = clr.text) => ({ background: bg, color: txt, border: `1px solid ${clr.border}`, borderRadius: 6, padding: "6px 10px", fontWeight: 600, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }),
  tag: (bg = clr.accent + "22", txt = clr.accent) => ({ background: bg, color: txt, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }),
  content: { padding: 16, paddingBottom: 90 },
  navBar: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: clr.card, borderTop: `1px solid ${clr.border}`, display: "flex", zIndex: 200 },
  navItem: (active) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 4px", gap: 3, background: "none", border: "none", color: active ? clr.accent : clr.muted, fontSize: 10, cursor: "pointer" }),
  divider: { height: 1, background: clr.border, margin: "10px 0" }
};

const Field = ({ label, children }) => <div style={{ marginBottom: 12 }}><div style={s.label}>{label}</div>{children}</div>;
const Modal = ({ open, onClose, title, children }) => !open ? null : <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 1000, display: "flex", alignItems: "flex-end" }}><div style={{ background: clr.card, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "85vh", display: "flex", flexDirection: "column", border: `1px solid ${clr.border}`, margin: "0 auto" }}><div style={{ ...s.rowBetween, padding: 16 }}><span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span><button onClick={onClose} style={s.btnSm()}><Icon name="x" size={14} /></button></div><div style={{ overflowY: "auto", padding: "0 16px 24px" }}>{children}</div></div></div>;
const Badge = ({ v, color = clr.accent }) => <span style={s.tag(color + "22", color)}>{v}</span>;

// --- MASTER SCREEN ---
const MasterSection = ({ title, items, fields, onAdd, onEdit, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});

  const save = async () => {
    if (!form[fields[0].key]?.trim()) return;
    if (editItem) await onEdit({ ...editItem, ...form });
    else await onAdd({ id: uid(), ...form });
    setShowForm(false); setForm({}); setEditItem(null);
  };

  return (
    <div style={s.card}>
      <div style={{ ...s.rowBetween, marginBottom: 10 }}><span style={{ fontWeight: 700 }}>{title}</span><button onClick={() => { setEditItem(null); setForm({}); setShowForm(true); }} style={s.btnSm(clr.accent + "22", clr.accent)}><Icon name="add" size={14} color={clr.accent} /></button></div>
      {items.length === 0 && <div style={{ color: clr.muted, fontSize: 13, textAlign: "center", padding: 8 }}>कोई डेटा नहीं</div>}
      {items.map(item => (
        <div key={item.id} style={{ ...s.card2, ...s.rowBetween }}>
          <div><div style={{ fontWeight: 600, fontSize: 14 }}>{item[fields[0].key]}</div>{fields.slice(1).map(f => item[f.key] && <div key={f.key} style={{ fontSize: 12, color: clr.muted }}>{f.label}: {item[f.key]}</div>)}</div>
          <div style={s.row}><button onClick={() => { setEditItem(item); setForm({ ...item }); setShowForm(true); }} style={{ ...s.btnSm(), padding: 6 }}><Icon name="edit" size={14} color={clr.blue} /></button><button onClick={() => onDelete(item.id)} style={{ ...s.btnSm(), padding: 6 }}><Icon name="trash" size={14} color={clr.red} /></button></div>
        </div>
      ))}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Edit" : "Add"}>
        {fields.map(f => <Field key={f.key} label={f.label}><input style={s.input} value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder || f.label} /></Field>)}
        <button onClick={save} style={{ ...s.btn(), width: "100%" }}>Save</button>
      </Modal>
    </div>
  );
};

const MasterScreen = ({ varieties, gradings, coldStorages, mandis, parties, ops }) => (
  <div style={s.content}>
    <MasterSection title="🌾 किस्म" items={varieties} fields={[{ key: "name", label: "Variety Name" }]} onAdd={item => ops.varieties.addItem(item)} onEdit={item => ops.varieties.editItem(item)} onDelete={id => ops.varieties.deleteItem(id)} />
    <MasterSection title="📊 ग्रेडिंग" items={gradings} fields={[{ key: "name", label: "Grade Name" }]} onAdd={item => ops.gradings.addItem(item)} onEdit={item => ops.gradings.editItem(item)} onDelete={id => ops.gradings.deleteItem(id)} />
    <MasterSection title="🏭 कोल्ड स्टोरेज" items={coldStorages} fields={[{ key: "name", label: "Storage Name" }, { key: "location", label: "Location" }]} onAdd={item => ops.cold_storages.addItem(item)} onEdit={item => ops.cold_storages.editItem(item)} onDelete={id => ops.cold_storages.deleteItem(id)} />
    <MasterSection title="🏪 मंडी" items={mandis} fields={[{ key: "name", label: "Mandi Name" }, { key: "location", label: "Location" }]} onAdd={item => ops.mandis.addItem(item)} onEdit={item => ops.mandis.editItem(item)} onDelete={id => ops.mandis.deleteItem(id)} />
    <MasterSection title="👤 पार्टी/व्यापारी" items={parties} fields={[{ key: "name", label: "Party Name" }, { key: "phone", label: "Phone" }]} onAdd={item => ops.parties.addItem(item)} onEdit={item => ops.parties.editItem(item)} onDelete={id => ops.parties.deleteItem(id)} />
  </div>
);

// --- DASHBOARD ---
const DashboardScreen = ({ purchases, dispatches, sales }) => {
  const activeLots = purchases.filter(p => !getLotStatus(p, dispatches, sales).isClosed).length;
  const closedLots = purchases.filter(p => getLotStatus(p, dispatches, sales).isClosed).length;
  const totalBalance = purchases.reduce((sum, p) => sum + (getLotStatus(p, dispatches, sales).remaining * 52.5), 0);
  const totalProfitLoss = purchases.reduce((sum, p) => sum + getLotStatus(p, dispatches, sales).profitLoss, 0);

  return (
    <div style={s.content}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        <div style={{ ...s.card2, background: clr.blue + "15" }}><div style={s.label}>सक्रिय लॉट्स</div><div style={{ fontSize: 20, fontWeight: 800, color: clr.blue }}>{activeLots}</div></div>
        <div style={{ ...s.card2, background: clr.red + "15" }}><div style={s.label}>बंद लॉट्स</div><div style={{ fontSize: 20, fontWeight: 800, color: clr.red }}>{closedLots}</div></div>
        <div style={{ ...s.card2, background: clr.green + "15" }}><div style={s.label}>कुल बैलेंस (kg)</div><div style={{ fontSize: 20, fontWeight: 800, color: clr.green }}>{fmt(totalBalance)}</div></div>
        <div style={{ ...s.card2, background: (totalProfitLoss >= 0 ? clr.green : clr.red) + "15" }}><div style={s.label}>Profit/Loss</div><div style={{ fontSize: 20, fontWeight: 800, color: totalProfitLoss >= 0 ? clr.green : clr.red }}>₹{fmt(totalProfitLoss)}</div></div>
      </div>
    </div>
  );
};

// --- PURCHASE SCREEN ---
const PurchaseScreen = ({ purchases, varieties, coldStorages, dispatches, sales, ops }) => {
  const [form, setForm] = useState({ lot_id: "", kisan_name: "", cold_storage_id: "", date: today(), variety_id: "", manual_bags: "", total_weight: "", rate: "", notes: "", pricing_type: "STD" });
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  const stdBags = form.total_weight ? (parseFloat(form.total_weight) / 52.5).toFixed(2) : 0;
  const effectiveBags = form.pricing_type === "STD" ? parseFloat(stdBags) : parseFloat(form.manual_bags);
  const totalAmt = effectiveBags * (parseFloat(form.rate) || 0);

  const save = async () => {
    if (!form.lot_id || !form.kisan_name || !form.total_weight || !form.rate) return;
    await ops.purchases.addItem({ ...form, std_bags: parseFloat(stdBags), total_amount: totalAmt, id: uid() });
    setShowForm(false); setForm({ lot_id: "", kisan_name: "", cold_storage_id: "", date: today(), variety_id: "", manual_bags: "", total_weight: "", rate: "", notes: "", pricing_type: "STD" });
  };

  const handleSearch = () => {
    const lot = purchases.find(p => p.lot_id.toLowerCase() === search.toLowerCase());
    if (lot) {
      const status = getLotStatus(lot, dispatches, sales);
      const dispatchInfo = dispatches.filter(d => d.items?.some(i => i.lot_id === lot.lot_id));
      const saleInfo = sales.filter(s => s.lot_sales?.some(l => l.lot_id === lot.lot_id));
      setSearchResult({ lot, status, dispatchInfo, saleInfo });
    }
  };

  const filtered = purchases.filter(p => p.lot_id.toLowerCase().includes(search.toLowerCase()) || p.kisan_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <input style={{ ...s.input, flex: 1 }} placeholder="लॉट या किसान खोजें..." value={search} onChange={e => setSearch(e.target.value)} onKeyPress={e => e.key === "Enter" && handleSearch()} />
        <button onClick={() => setShowForm(true)} style={{ ...s.btn(), marginLeft: 8 }}><Icon name="add" size={14} /></button>
      </div>

      {searchResult && (
        <div style={s.card}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>🔍 खोज परिणाम</div>
          <div style={s.divider} />
          <div><strong>लॉट ID:</strong> {searchResult.lot.lot_id}</div>
          <div><strong>किसान:</strong> {searchResult.lot.kisan_name}</div>
          <div><strong>कुल वजन:</strong> {fmt(searchResult.lot.total_weight)} kg ({fmt(searchResult.lot.std_bags, 1)} STD bags)</div>
          <div><strong>रेट:</strong> ₹{searchResult.lot.rate}/bag</div>
          <div><strong>स्थिति:</strong> {searchResult.status.isClosed ? "CLOSED" : "ACTIVE"}</div>
          <div><strong>डिस्पैच:</strong> {searchResult.status.totalDispatched} bags</div>
          {searchResult.dispatchInfo.length > 0 && <div style={s.divider} />}
          {searchResult.dispatchInfo.map((d, i) => <div key={i} style={{ fontSize: 12, color: clr.muted }}>📤 गेटपास: {d.gatepass_id} → {d.mandi_id}</div>)}
          {searchResult.saleInfo.length > 0 && (
            <>
              <div style={s.divider} />
              {searchResult.saleInfo.map((s, i) => <div key={i} style={{ fontSize: 12, color: clr.green }}>💰 बिक्रय: ₹{fmt(s.total_amount)}</div>)}
            </>
          )}
          <button onClick={() => setSearchResult(null)} style={{ ...s.btn(clr.card2, clr.text), width: "100%", marginTop: 8 }}>बंद करें</button>
        </div>
      )}

      {filtered.reverse().map(p => {
        const status = getLotStatus(p, dispatches, sales);
        return (
          <div key={p.id} style={{ ...s.card, opacity: status.isClosed ? 0.6 : 1 }}>
            <div style={s.rowBetween}><Badge v={`LOT: ${p.lot_id}`} color={clr.accent} /><span style={{ fontSize: 12, color: clr.muted }}>{fmtDate(p.date)}</span></div>
            <div style={{ fontWeight: 700, marginTop: 6 }}>{p.kisan_name}</div>
            <div style={{ fontSize: 12, color: clr.muted }}>{coldStorages.find(c => c.id === p.cold_storage_id)?.name}</div>
            <div style={s.divider} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div><span style={s.label}>वजन</span><div style={{ fontWeight: 700, color: clr.purple }}>{fmt(p.total_weight)} kg</div></div>
              <div><span style={s.label}>STD Bags</span><div style={{ fontWeight: 700, color: clr.accent }}>{fmt(p.std_bags, 1)}</div></div>
            </div>
            <div style={{ ...s.rowBetween, background: clr.card2, padding: 8, borderRadius: 6 }}><span>₹{p.rate}/bag</span><strong style={{ color: clr.green }}>₹{fmt(p.total_amount)}</strong></div>
            <div style={{ ...s.rowBetween, marginTop: 8, fontSize: 12, color: clr.muted }}><span>Dispatch: {status.totalDispatched} bags</span><span>Remaining: {fmt(status.remaining, 1)}</span></div>
            {status.isClosed && <Badge v="CLOSED" color={clr.red} />}
          </div>
        );
      })}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="नया खरीद लॉट">
        <Field label="लॉट नंबर"><input style={s.input} value={form.lot_id} onChange={e => setForm({ ...form, lot_id: e.target.value })} /></Field>
        <Field label="किसान का नाम"><input style={s.input} value={form.kisan_name} onChange={e => setForm({ ...form, kisan_name: e.target.value })} /></Field>
        <Field label="कुल वजन (kg)"><input type="number" style={s.input} value={form.total_weight} onChange={e => setForm({ ...form, total_weight: e.target.value })} /></Field>
        <Field label="रेट (₹/bag)"><input type="number" style={s.input} value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} /></Field>
        <Field label="कोल्ड स्टोरेज">
          <select style={s.select} value={form.cold_storage_id} onChange={e => setForm({ ...form, cold_storage_id: e.target.value })}>
            <option value="">चुनें...</option>
            {coldStorages.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="किस्म">
          <select style={s.select} value={form.variety_id} onChange={e => setForm({ ...form, variety_id: e.target.value })}>
            <option value="">चुनें...</option>
            {varieties.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </Field>
        <div style={{ marginBottom: 12 }}>
          <span style={s.label}>गणना का प्रकार</span>
          <div style={{ ...s.row, marginTop: 4 }}>
            <label><input type="radio" checked={form.pricing_type === "STD"} onChange={() => setForm({ ...form, pricing_type: "STD" })} /> 52.5kg STD</label>
            <label><input type="radio" checked={form.pricing_type === "MANUAL"} onChange={() => setForm({ ...form, pricing_type: "MANUAL" })} /> मैनुअल कट्टे</label>
          </div>
        </div>
        {form.pricing_type === "MANUAL" && (
          <Field label="कट्टों की संख्या"><input type="number" style={s.input} value={form.manual_bags} onChange={e => setForm({ ...form, manual_bags: e.target.value })} /></Field>
        )}
        <div style={{ ...s.card2, margin: "12px 0", background: clr.card }}>
          <div style={s.rowBetween}><span>अनुमानित कट्टे:</span><strong>{fmt(effectiveBags, 1)}</strong></div>
          <div style={s.rowBetween}><span>कुल देय राशि:</span><strong style={{ color: clr.green }}>₹{fmt(totalAmt)}</strong></div>
        </div>
        <button onClick={save} style={{ ...s.btn(), width: "100%" }}>लॉट सुरक्षित करें</button>
      </Modal>
    </div>
  );
};

// --- APP CONTAINER ---
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
        <span style={{ fontWeight: 800, fontSize: 18, color: clr.accent }}>Aloo-Trader v2</span>
        <Badge v={activeTab.toUpperCase()} color={clr.blue} />
      </div>

      {activeTab === "dashboard" && <DashboardScreen purchases={purchases} dispatches={dispatches} sales={sales} />}
      {activeTab === "purchase" && <PurchaseScreen purchases={purchases} varieties={varieties} coldStorages={coldStorages} dispatches={dispatches} sales={sales} ops={ops} />}
      {activeTab === "master" && <MasterScreen varieties={varieties} gradings={gradings} coldStorages={coldStorages} mandis={mandis} parties={parties} ops={ops} />}

      <div style={s.navBar}>
        <button onClick={() => setActiveTab("dashboard")} style={s.navItem(activeTab === "dashboard")}><Icon name="sale" color={activeTab === "dashboard" ? clr.accent : clr.muted} />डैशबोर्ड</button>
        <button onClick={() => setActiveTab("purchase")} style={s.navItem(activeTab === "purchase")}><Icon name="purchase" color={activeTab === "purchase" ? clr.accent : clr.muted} />खरीद</button>
        <button onClick={() => setActiveTab("master")} style={s.navItem(activeTab === "master")}><Icon name="master" color={activeTab === "master" ? clr.accent : clr.muted} />मास्टर</button>
      </div>
    </div>
  );
}
