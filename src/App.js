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
          if (r.items && typeof r.items === 'string') {
            try { r.items = JSON.parse(r.items); } catch { r.items = []; }
          }
          if (r.lot_sales && typeof r.lot_sales === 'string') {
            try { r.lot_sales = JSON.parse(r.lot_sales); } catch { r.lot_sales = []; }
          }
          return r;
        });
        setData(parsed);
      }
      setLoading(false);
    };
    fetchData();
  }, [tableName]);

  const save = useCallback(async (valOrFn) => {
    const newData = typeof valOrFn === "function" ? valOrFn(data) : valOrFn;
    setData(newData);
  }, [data]);

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

  const setAll = useCallback((newData) => {
    setData(newData);
  }, []);

  return [data, { save, addItem, editItem, deleteItem, setAll, loading }];
};

const uid = () => crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const fmt = (n, d = 0) => (isNaN(n) ? "0" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d }));
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "-";
const today = () => new Date().toISOString().slice(0, 10);
const clr = { bg: "#0f1117", card: "#1a1d26", card2: "#22263a", accent: "#f5a623", green: "#22c55e", red: "#ef4444", blue: "#3b82f6", purple: "#a855f7", muted: "#6b7280", border: "#2d3148", text: "#f1f5f9" };
const PMODES = ["Cash", "UPI", "NEFT/RTGS", "Cheque"];

const Icon = ({ name, size = 18, color = clr.text }) => {
  const icons = {
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    purchase: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    dispatch: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
    sale: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    stock: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    payment: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    master: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
    add: "M12 4v16m8-8H4",
    edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    x: "M6 18L18 6M6 6l12 12",
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    download: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={icons[name] || icons.info} />
    </svg>
  );
};

const s = {
  screen: { minHeight: "100vh", background: clr.bg, color: clr.text, fontFamily: "'Segoe UI', system-ui, sans-serif", maxWidth: 480, margin: "0 auto", position: "relative" },
  header: { background: clr.card, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${clr.border}`, position: "sticky", top: 0, zIndex: 100 },
  card: { background: clr.card, borderRadius: 12, padding: 14, marginBottom: 10, border: `1px solid ${clr.border}` },
  card2: { background: clr.card2, borderRadius: 10, padding: 12, marginBottom: 8, border: `1px solid ${clr.border}` },
  row: { display: "flex", alignItems: "center", gap: 8 },
  rowBetween: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  col: { display: "flex", flexDirection: "column", gap: 4 },
  input: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 8, padding: "10px 12px", color: clr.text, fontSize: 14, outline: "none", boxSizing: "border-box" },
  select: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 8, padding: "10px 12px", color: clr.text, fontSize: 14, outline: "none", boxSizing: "border-box" },
  label: { fontSize: 11, color: clr.muted, marginBottom: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" },
  btn: (bg = clr.accent, txt = "#000") => ({ background: bg, color: txt, border: "none", borderRadius: 8, padding: "11px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }),
  btnSm: (bg = clr.card2, txt = clr.text) => ({ background: bg, color: txt, border: `1px solid ${clr.border}`, borderRadius: 6, padding: "6px 10px", fontWeight: 600, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }),
  tag: (bg = clr.accent + "22", txt = clr.accent) => ({ background: bg, color: txt, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }),
  divider: { height: 1, background: clr.border, margin: "10px 0" },
  content: { padding: 16, paddingBottom: 90 },
  statCard: (col) => ({ background: col + "18", border: `1px solid ${col}44`, borderRadius: 12, padding: "12px 14px", flex: 1 }),
  navBar: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: clr.card, borderTop: `1px solid ${clr.border}`, display: "flex", zIndex: 200 },
  navItem: (active) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 4px", gap: 3, cursor: "pointer", borderTop: active ? `2px solid ${clr.accent}` : "2px solid transparent", background: "none", border: "none", color: active ? clr.accent : clr.muted }),
};

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={s.label}>{label}</div>
    {children}
  </div>
);

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: clr.card, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "92vh", display: "flex", flexDirection: "column", border: `1px solid ${clr.border}` }}>
        <div style={{ ...s.rowBetween, padding: "16px 16px 12px", flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span>
          <button onClick={onClose} style={{ ...s.btnSm(), padding: 6 }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ overflowY: "auto", padding: "0 16px 32px" }}>{children}</div>
      </div>
    </div>
  );
};

const Badge = ({ v, color = clr.accent }) => <span style={s.tag(color + "22", color)}>{v}</span>;
const Alert = ({ msg, type = "info" }) => {
  const c = type === "error" ? clr.red : type === "success" ? clr.green : clr.blue;
  return <div style={{ background: c + "20", border: `1px solid ${c}44`, borderRadius: 8, padding: "10px 12px", color: c, fontSize: 13, marginBottom: 10 }}>{msg}</div>;
};
const Stat = ({ label, value, color = clr.accent, sub }) => (
  <div style={s.statCard(color)}>
    <div style={{ fontSize: 11, color: clr.muted, fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 17, fontWeight: 800, color }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: clr.muted }}>{sub}</div>}
  </div>
);

// ─── MASTER ───────────────────────────────────────────────────────────────────
const MasterSection = ({ title, items, onAdd, onEdit, onDelete, fields }) => {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});
  const open = (item = null) => { setEditItem(item); setForm(item ? { ...item } : {}); setShowForm(true); };
  const close = () => { setShowForm(false); setEditItem(null); setForm({}); };
  const save = () => {
    if (!form[fields[0].key]?.trim()) return;
    if (editItem) onEdit({ ...editItem, ...form });
    else onAdd({ id: uid(), ...form });
    close();
  };
  return (
    <div style={s.card}>
      <div style={{ ...s.rowBetween, marginBottom: 10 }}>
        <span style={{ fontWeight: 700 }}>{title}</span>
        <button onClick={() => open()} style={s.btnSm(clr.accent + "22", clr.accent)}><Icon name="add" size={14} color={clr.accent} /> Add</button>
      </div>
      {items.length === 0 && <div style={{ color: clr.muted, fontSize: 13, textAlign: "center", padding: 8 }}>No items</div>}
      {items.map(item => (
        <div key={item.id} style={{ ...s.card2, ...s.rowBetween }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{item[fields[0].key]}</div>
            {fields.slice(1).map(f => item[f.key] && <div key={f.key} style={{ fontSize: 12, color: clr.muted }}>{f.label}: {item[f.key]}</div>)}
          </div>
          <div style={s.row}>
            <button onClick={() => open(item)} style={{ ...s.btnSm(), padding: 6 }}><Icon name="edit" size={14} color={clr.blue} /></button>
            <button onClick={() => onDelete(item.id)} style={{ ...s.btnSm(), padding: 6 }}><Icon name="trash" size={14} color={clr.red} /></button>
          </div>
        </div>
      ))}
      <Modal open={showForm} onClose={close} title={editItem ? "Edit" : "Add"}>
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

const MasterScreen = ({ varieties, gradings, coldStorages, mandis, parties, ops }) => {
  const crud = (table) => ({
    onAdd: (item) => ops[table].addItem(item),
    onEdit: (item) => ops[table].editItem(item),
    onDelete: (id) => ops[table].deleteItem(id),
  });
  return (
    <div style={s.content}>
      <MasterSection title="🌾 Variety (किस्म)" items={varieties} fields={[{ key: "name", label: "Variety Name" }]} {...crud("varieties")} />
      <MasterSection title="📊 Grading" items={gradings} fields={[{ key: "name", label: "Grade Name" }]} {...crud("gradings")} />
      <MasterSection title="🏭 Cold Storage" items={coldStorages} fields={[{ key: "name", label: "Storage Name" }, { key: "location", label: "Location" }, { key: "phone", label: "Phone" }]} {...crud("cold_storages")} />
      <MasterSection title="🏪 Mandi" items={mandis} fields={[{ key: "name", label: "Mandi Name" }, { key: "location", label: "Location" }]} {...crud("mandis")} />
      <MasterSection title="👤 Party (Buyer)" items={parties} fields={[{ key: "name", label: "Party Name" }, { key: "phone", label: "Phone" }, { key: "address", label: "Address" }, { key: "credit_days", label: "Credit Days" }]} {...crud("parties")} />
    </div>
  );
};

// ─── PURCHASE ─────────────────────────────────────────────────────────────────
const PurchaseScreen = ({ purchases, varieties, gradings, coldStorages, dispatches, sales, payments, ops }) => {
  const blank = { lot_id: "", kisan_name: "", cold_storage_id: "", date: today(), variety_id: "", grading_id: "", manual_bags: "", total_weight: "", std_bag_weight: "52.5", pricing_type: "STD", rate: "", notes: "" };
  const [form, setForm] = useState(blank);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [err, setErr] = useState("");
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const stdBags = form.total_weight && form.std_bag_weight ? (parseFloat(form.total_weight) / parseFloat(form.std_bag_weight)).toFixed(2) : 0;
  const effectiveBags = form.pricing_type === "STD" ? parseFloat(stdBags) || 0 : parseFloat(form.manual_bags) || 0;
  const totalAmt = effectiveBags * (parseFloat(form.rate) || 0);
  const getName = (arr, id) => arr.find(x => x.id === id)?.name || "-";

  const save = async () => {
    if (!form.lot_id.trim()) { setErr("Lot ID required!"); return; }
    if (purchases.find(p => p.lot_id === form.lot_id.trim() && p.id !== editId)) { setErr("Lot ID already exists!"); return; }
    if (!form.kisan_name.trim()) { setErr("Kisan name required"); return; }
    const item = { ...form, id: editId || uid(), lot_id: form.lot_id.trim(), std_bags: parseFloat(stdBags), total_amount: totalAmt };
    if (editId) await ops.purchases.editItem(item);
    else await ops.purchases.addItem(item);
    setShowForm(false); setEditId(null); setForm(blank); setErr("");
  };

  const openEdit = (item) => { setForm({ ...item }); setEditId(item.id); setShowForm(true); };

  // ── CASCADE DELETE: purchase → dispatches → sales → payments (payable) ──
  const del = async (id) => {
    const lot = purchases.find(x => x.id === id);
    if (!lot) return;

    // 1. Delete linked payable payments for this cold storage lot
    const linkedPayments = payments.filter(
      pm => pm.type === "payable" && pm.cold_id === lot.cold_storage_id
    );
    // Only delete if this is the only lot for that cold storage
    const otherLotsForSameCold = purchases.filter(
      p => p.id !== id && p.cold_storage_id === lot.cold_storage_id
    );
    if (otherLotsForSameCold.length === 0) {
      for (const pm of linkedPayments) {
        await ops.payments.deleteItem(pm.id);
      }
    }

    // 2. Delete the purchase
    await ops.purchases.deleteItem(id);

    // 3. Handle dispatches that had this lot
    for (const d of dispatches) {
      const hasLot = (d.items || []).some(i => i.lot_id === lot.lot_id);
      if (!hasLot) continue;
      const newItems = (d.items || []).filter(i => i.lot_id !== lot.lot_id);
      if (newItems.length === 0) {
        await ops.dispatches.deleteItem(d.id);
        const linkedSale = sales.find(s => s.gp_id === d.id);
        if (linkedSale) await ops.sales.deleteItem(linkedSale.id);
      } else {
        await ops.dispatches.editItem({ ...d, items: newItems });
        const linkedSale = sales.find(s => s.gp_id === d.id);
        if (linkedSale) {
          const newLotSales = (linkedSale.lot_sales || []).filter(ls => ls.lot_id !== lot.lot_id);
          if (newLotSales.length === 0) {
            await ops.sales.deleteItem(linkedSale.id);
          } else {
            await ops.sales.editItem({ ...linkedSale, lot_sales: newLotSales });
          }
        }
      }
    }
  };

  return (
    <div>
      <div style={{ ...s.rowBetween, padding: "12px 16px 0" }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>🥔 Purchase (खरीद)</span>
        <button onClick={() => { setForm(blank); setEditId(null); setErr(""); setShowForm(true); }} style={s.btn()}><Icon name="add" size={16} color="#000" /> New Lot</button>
      </div>
      <div style={s.content}>
        {purchases.length === 0 && <div style={{ ...s.card, textAlign: "center", color: clr.muted, padding: 32 }}>No purchases yet.</div>}
        {[...purchases].reverse().map(p => (
          <div key={p.id} style={s.card}>
            <div style={s.rowBetween}>
              <div style={{ ...s.row, flexWrap: "wrap", gap: 4 }}>
                <Badge v={`LOT: ${p.lot_id}`} color={clr.accent} />
                <Badge v={getName(varieties, p.variety_id)} color={clr.purple} />
                <Badge v={getName(gradings, p.grading_id)} color={clr.blue} />
              </div>
              <div style={s.row}>
                <button onClick={() => openEdit(p)} style={{ ...s.btnSm(), padding: 6 }}><Icon name="edit" size={14} color={clr.blue} /></button>
                <button onClick={() => del(p.id)} style={{ ...s.btnSm(), padding: 6 }}><Icon name="trash" size={14} color={clr.red} /></button>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{p.kisan_name}</div>
              <div style={{ fontSize: 12, color: clr.muted }}>{getName(coldStorages, p.cold_storage_id)} · {fmtDate(p.date)}</div>
            </div>
            <div style={s.divider} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div style={s.col}><span style={s.label}>Bags</span><span style={{ fontWeight: 700 }}>{fmt(p.manual_bags)}</span></div>
              <div style={s.col}><span style={s.label}>Weight kg</span><span style={{ fontWeight: 700 }}>{fmt(p.total_weight)}</span></div>
              <div style={s.col}><span style={s.label}>STD Bags</span><span style={{ fontWeight: 700 }}>{fmt(p.std_bags, 1)}</span></div>
            </div>
            <div style={{ ...s.rowBetween, marginTop: 8, background: clr.accent + "18", borderRadius: 8, padding: "8px 12px" }}>
              <span style={{ fontSize: 12, color: clr.muted }}>₹{fmt(p.rate)}/bag × {p.pricing_type === "STD" ? fmt(p.std_bags, 1) : fmt(p.manual_bags)} bags</span>
              <span style={{ fontWeight: 800, color: clr.accent, fontSize: 16 }}>₹{fmt(p.total_amount)}</span>
            </div>
          </div>
        ))}
      </div>
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? "Edit Purchase" : "New Purchase"}>
        {err && <Alert msg={err} type="error" />}
        <Field label="Lot ID *"><input style={s.input} value={form.lot_id} onChange={e => f("lot_id", e.target.value)} placeholder="e.g. L001" disabled={!!editId} /></Field>
        <Field label="Kisan Name *"><inp
