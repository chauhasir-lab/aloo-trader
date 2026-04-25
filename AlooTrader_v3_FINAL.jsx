import { useState, useCallback } from "react";

const DB = {
  get: (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const useStore = (key, init = []) => {
  const [data, setData] = useState(() => DB.get(key) ?? init);
  const save = useCallback((val) => { const v = typeof val === "function" ? val(DB.get(key) ?? init) : val; DB.set(key, v); setData(v); }, [key]);
  return [data, save];
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
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
      <Modal open={showForm} onClose={close} title={editItem ? `Edit` : `Add`}>
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

const MasterScreen = ({ varieties, setVarieties, gradings, setGradings, coldStorages, setColdStorages, mandis, setMandis, parties, setParties }) => {
  const crud = (setter) => ({
    onAdd: (item) => setter(p => [...p, item]),
    onEdit: (item) => setter(p => p.map(x => x.id === item.id ? item : x)),
    onDelete: (id) => setter(p => p.filter(x => x.id !== id)),
  });
  return (
    <div style={s.content}>
      <MasterSection title="🌾 Variety (किस्म)" items={varieties} fields={[{ key: "name", label: "Variety Name" }]} {...crud(setVarieties)} />
      <MasterSection title="📊 Grading" items={gradings} fields={[{ key: "name", label: "Grade Name" }]} {...crud(setGradings)} />
      <MasterSection title="🏭 Cold Storage" items={coldStorages} fields={[{ key: "name", label: "Storage Name" }, { key: "location", label: "Location" }, { key: "phone", label: "Phone" }]} {...crud(setColdStorages)} />
      <MasterSection title="🏪 Mandi" items={mandis} fields={[{ key: "name", label: "Mandi Name" }, { key: "location", label: "Location" }]} {...crud(setMandis)} />
      <MasterSection title="👤 Party (Buyer)" items={parties} fields={[{ key: "name", label: "Party Name" }, { key: "phone", label: "Phone" }, { key: "address", label: "Address" }, { key: "creditDays", label: "Credit Days" }]} {...crud(setParties)} />
    </div>
  );
};

// ─── PURCHASE ─────────────────────────────────────────────────────────────────
const PurchaseScreen = ({ purchases, setPurchases, varieties, gradings, coldStorages, dispatches, setDispatches, sales, setSales, payments, setPayments }) => {
  const blank = { lotId: "", kisanName: "", coldStorageId: "", date: today(), varietyId: "", gradingId: "", manualBags: "", totalWeight: "", stdBagWeight: "52.5", pricingType: "STD", rate: "", notes: "" };
  const [form, setForm] = useState(blank);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [err, setErr] = useState("");
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const stdBags = form.totalWeight && form.stdBagWeight ? (parseFloat(form.totalWeight) / parseFloat(form.stdBagWeight)).toFixed(2) : 0;
  const effectiveBags = form.pricingType === "STD" ? parseFloat(stdBags) || 0 : parseFloat(form.manualBags) || 0;
  const totalAmt = effectiveBags * (parseFloat(form.rate) || 0);
  const getName = (arr, id) => arr.find(x => x.id === id)?.name || "-";

  const save = () => {
    if (!form.lotId.trim()) { setErr("Lot ID required!"); return; }
    if (!editId && purchases.find(p => p.lotId === form.lotId.trim())) { setErr("Lot ID already exists!"); return; }
    if (!form.kisanName.trim()) { setErr("Kisan name required"); return; }
    const item = { ...form, id: editId || uid(), lotId: form.lotId.trim(), stdBags: parseFloat(stdBags), totalAmount: totalAmt, createdAt: editId ? undefined : Date.now() };
    if (editId) setPurchases(p => p.map(x => x.id === editId ? { ...x, ...item } : x));
    else setPurchases(p => [...p, item]);
    setShowForm(false); setEditId(null); setForm(blank); setErr("");
  };

  const openEdit = (item) => { setForm({ ...item }); setEditId(item.id); setShowForm(true); };

  // CASCADE DELETE
  const del = (id) => {
    const lot = purchases.find(x => x.id === id);
    if (!lot) return;
    const lotId = lot.lotId;
    setPurchases(p => p.filter(x => x.id !== id));
    setDispatches(p => p.map(d => ({ ...d, items: d.items.filter(i => i.lotId !== lotId) })).filter(d => d.items.length > 0));
    setSales(p => p.map(s => ({ ...s, lotSales: s.lotSales.filter(ls => ls.lotId !== lotId) })).filter(s => s.lotSales.length > 0));
    setPayments(p => p.filter(pm => !(pm.type === "payable" && pm.lotId === lotId)));
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
                <Badge v={`LOT: ${p.lotId}`} color={clr.accent} />
                <Badge v={getName(varieties, p.varietyId)} color={clr.purple} />
                <Badge v={getName(gradings, p.gradingId)} color={clr.blue} />
              </div>
              <div style={s.row}>
                <button onClick={() => openEdit(p)} style={{ ...s.btnSm(), padding: 6 }}><Icon name="edit" size={14} color={clr.blue} /></button>
                <button onClick={() => del(p.id)} style={{ ...s.btnSm(), padding: 6 }}><Icon name="trash" size={14} color={clr.red} /></button>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{p.kisanName}</div>
              <div style={{ fontSize: 12, color: clr.muted }}>{getName(coldStorages, p.coldStorageId)} · {fmtDate(p.date)}</div>
            </div>
            <div style={s.divider} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div style={s.col}><span style={s.label}>Bags</span><span style={{ fontWeight: 700 }}>{fmt(p.manualBags)}</span></div>
              <div style={s.col}><span style={s.label}>Weight kg</span><span style={{ fontWeight: 700 }}>{fmt(p.totalWeight)}</span></div>
              <div style={s.col}><span style={s.label}>STD Bags</span><span style={{ fontWeight: 700 }}>{fmt(p.stdBags, 1)}</span></div>
            </div>
            <div style={{ ...s.rowBetween, marginTop: 8, background: clr.accent + "18", borderRadius: 8, padding: "8px 12px" }}>
              <span style={{ fontSize: 12, color: clr.muted }}>₹{fmt(p.rate)}/bag × {p.pricingType === "STD" ? fmt(p.stdBags, 1) : fmt(p.manualBags)} bags</span>
              <span style={{ fontWeight: 800, color: clr.accent, fontSize: 16 }}>₹{fmt(p.totalAmount)}</span>
            </div>
          </div>
        ))}
      </div>
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? "Edit Purchase" : "New Purchase"}>
        {err && <Alert msg={err} type="error" />}
        <Field label="Lot ID *"><input style={s.input} value={form.lotId} onChange={e => f("lotId", e.target.value)} placeholder="e.g. L001" disabled={!!editId} /></Field>
        <Field label="Kisan Name *"><input style={s.input} value={form.kisanName} onChange={e => f("kisanName", e.target.value)} /></Field>
        <Field label="Cold Storage">
          <select style={s.select} value={form.coldStorageId} onChange={e => f("coldStorageId", e.target.value)}>
            <option value="">-- Select --</option>
            {coldStorages.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Date"><input type="date" style={s.input} value={form.date} onChange={e => f("date", e.target.value)} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="Variety">
            <select style={s.select} value={form.varietyId} onChange={e => f("varietyId", e.target.value)}>
              <option value="">-- Select --</option>
              {varieties.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </Field>
          <Field label="Grading">
            <select style={s.select} value={form.gradingId} onChange={e => f("gradingId", e.target.value)}>
              <option value="">-- Select --</option>
              {gradings.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="Manual Bags"><input type="number" style={s.input} value={form.manualBags} onChange={e => f("manualBags", e.target.value)} /></Field>
          <Field label="Total Weight kg"><input type="number" style={s.input} value={form.totalWeight} onChange={e => f("totalWeight", e.target.value)} /></Field>
        </div>
        <Field label="Std Bag Weight kg"><input type="number" style={s.input} value={form.stdBagWeight} onChange={e => f("stdBagWeight", e.target.value)} /></Field>
        <div style={{ ...s.card2, ...s.rowBetween, marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: clr.muted }}>STD Bags (Auto)</span>
          <span style={{ fontWeight: 800, color: clr.green, fontSize: 16 }}>{stdBags}</span>
        </div>
        <Field label="Pricing Type">
          <div style={s.row}>
            {["STD", "Manual"].map(t => (
              <button key={t} onClick={() => f("pricingType", t)} style={{ ...s.btn(form.pricingType === t ? clr.accent : clr.card2, form.pricingType === t ? "#000" : clr.text), flex: 1 }}>{t}</button>
            ))}
          </div>
        </Field>
        <Field label={`Rate ₹ per Bag — ${form.pricingType === "STD" ? `STD Bags: ${stdBags}` : `Manual Bags: ${form.manualBags || 0}`}`}>
          <input type="number" style={s.input} value={form.rate} onChange={e => f("rate", e.target.value)} placeholder="e.g. 800" />
        </Field>
        <div style={{ ...s.card2, ...s.rowBetween, marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: clr.muted }}>Total = {fmt(effectiveBags, 1)} × ₹{form.rate || 0}</span>
          <span style={{ fontWeight: 800, color: clr.accent, fontSize: 18 }}>₹{fmt(totalAmt)}</span>
        </div>
        <Field label="Notes"><input style={s.input} value={form.notes} onChange={e => f("notes", e.target.value)} /></Field>
        <button onClick={save} style={{ ...s.btn(), width: "100%", marginTop: 4 }}>Save Purchase</button>
      </Modal>
    </div>
  );
};

// ─── DISPATCH ─────────────────────────────────────────────────────────────────
const DispatchScreen = ({ dispatches, setDispatches, purchases, mandis, parties }) => {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [gpNum, setGpNum] = useState(""); const [vehicle, setVehicle] = useState(""); const [date, setDate] = useState(today());
  const [mandiId, setMandiId] = useState(""); const [partyId, setPartyId] = useState("");
  const [items, setItems] = useState([{ id: uid(), lotId: "", bagsLoaded: "", weightLoaded: "" }]);
  const [err, setErr] = useState("");
  const getName = (arr, id) => arr.find(x => x.id === id)?.name || "-";

  const getAvailableBags = (lotId, excludeGpId = null) => {
    const lot = purchases.find(p => p.lotId === lotId);
    if (!lot) return 0;
    const dispatched = dispatches.filter(d => d.id !== excludeGpId).flatMap(d => d.items).filter(i => i.lotId === lotId).reduce((s, i) => s + (parseFloat(i.bagsLoaded) || 0), 0);
    return (parseFloat(lot.manualBags) || 0) - dispatched;
  };

  const updateItem = (idx, key, val) => {
    setItems(p => p.map((it, i) => {
      if (i !== idx) return it;
      const updated = { ...it, [key]: val };
      const lot = purchases.find(p => p.lotId === updated.lotId);
      if (key === "bagsLoaded") updated.weightLoaded = lot ? (parseFloat(val) * parseFloat(lot.stdBagWeight || 52.5)).toFixed(1) : val;
      if (key === "weightLoaded") updated.bagsLoaded = lot ? (parseFloat(val) / parseFloat(lot.stdBagWeight || 52.5)).toFixed(2) : val;
      return updated;
    }));
  };

  const reset = () => { setGpNum(""); setVehicle(""); setDate(today()); setMandiId(""); setPartyId(""); setItems([{ id: uid(), lotId: "", bagsLoaded: "", weightLoaded: "" }]); setEditId(null); setErr(""); };

  const save = () => {
    if (!gpNum.trim()) { setErr("Gate Pass number required!"); return; }
    if (!editId && dispatches.find(d => d.gpNum === gpNum.trim())) { setErr("Gate Pass already exists!"); return; }
    if (!mandiId || !partyId) { setErr("Mandi and Party required!"); return; }
    for (const it of items) {
      if (!it.lotId) { setErr("Select lot for all rows"); return; }
    }
    const gp = { id: editId || uid(), gpNum: gpNum.trim(), vehicle, date, mandiId, partyId, items, createdAt: editId ? undefined : Date.now() };
    if (editId) setDispatches(p => p.map(x => x.id === editId ? { ...x, ...gp } : x));
    else setDispatches(p => [...p, gp]);
    setShowForm(false); reset();
  };

  const openEdit = (d) => { setGpNum(d.gpNum); setVehicle(d.vehicle || ""); setDate(d.date); setMandiId(d.mandiId); setPartyId(d.partyId); setItems(d.items); setEditId(d.id); setShowForm(true); };
  const del = (id) => setDispatches(p => p.filter(x => x.id !== id));

  return (
    <div>
      <div style={{ ...s.rowBetween, padding: "12px 16px 0" }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>🚛 Dispatch (लोडिंग)</span>
        <button onClick={() => { reset(); setShowForm(true); }} style={s.btn()}><Icon name="add" size={16} color="#000" /> New GP</button>
      </div>
      <div style={s.content}>
        {dispatches.length === 0 && <div style={{ ...s.card, textAlign: "center", color: clr.muted, padding: 32 }}>No gate passes yet.</div>}
        {[...dispatches].reverse().map(d => {
          const totalBags = d.items.reduce((s, i) => s + (parseFloat(i.bagsLoaded) || 0), 0);
          const totalWt = d.items.reduce((s, i) => s + (parseFloat(i.weightLoaded) || 0), 0);
          return (
            <div key={d.id} style={s.card}>
              <div style={s.rowBetween}>
                <div style={s.row}><Badge v={`GP: ${d.gpNum}`} color={clr.green} /><Badge v={`${d.items.length} lots`} color={clr.blue} /></div>
                <div style={s.row}>
                  <button onClick={() => openEdit(d)} style={{ ...s.btnSm(), padding: 6 }}><Icon name="edit" size={14} color={clr.blue} /></button>
                  <button onClick={() => del(d.id)} style={{ ...s.btnSm(), padding: 6 }}><Icon name="trash" size={14} color={clr.red} /></button>
                </div>
              </div>
              <div style={{ marginTop: 6 }}>
                <div style={{ fontWeight: 700 }}>🚗 {d.vehicle || "No vehicle"}</div>
                <div style={{ fontSize: 12, color: clr.muted }}>{getName(mandis, d.mandiId)} · {getName(parties, d.partyId)} · {fmtDate(d.date)}</div>
              </div>
              <div style={s.divider} />
              {d.items.map((it, idx) => (
                <div key={idx} style={{ ...s.rowBetween, marginBottom: 4, fontSize: 13 }}>
                  <span style={{ color: clr.accent }}>LOT: {it.lotId}</span>
                  <span>{fmt(it.bagsLoaded)} bags · {fmt(it.weightLoaded, 1)} kg</span>
                </div>
              ))}
              <div style={{ ...s.rowBetween, marginTop: 8, background: clr.green + "18", borderRadius: 8, padding: "8px 12px" }}>
                <span style={{ fontSize: 12, color: clr.muted }}>Total</span>
                <span style={{ fontWeight: 800, color: clr.green }}>{fmt(totalBags)} bags · {fmt(totalWt, 1)} kg</span>
              </div>
            </div>
          );
        })}
      </div>
      <Modal open={showForm} onClose={() => { setShowForm(false); reset(); }} title={editId ? "Edit Gate Pass" : "New Gate Pass"}>
        {err && <Alert msg={err} type="error" />}
        <Field label="Gate Pass No. *"><input style={s.input} value={gpNum} onChange={e => setGpNum(e.target.value)} disabled={!!editId} /></Field>
        <Field label="Vehicle Number"><input style={s.input} value={vehicle} onChange={e => setVehicle(e.target.value)} /></Field>
        <Field label="Date"><input type="date" style={s.input} value={date} onChange={e => setDate(e.target.value)} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="Mandi">
            <select style={s.select} value={mandiId} onChange={e => setMandiId(e.target.value)}>
              <option value="">-- Select --</option>
              {mandis.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </Field>
          <Field label="Party">
            <select style={s.select} value={partyId} onChange={e => setPartyId(e.target.value)}>
              <option value="">-- Select --</option>
              {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ ...s.rowBetween, marginBottom: 8 }}>
          <span style={{ fontWeight: 700 }}>Lot Items</span>
          <button onClick={() => setItems(p => [...p, { id: uid(), lotId: "", bagsLoaded: "", weightLoaded: "" }])} style={s.btnSm(clr.green + "22", clr.green)}><Icon name="add" size={13} color={clr.green} /> Add Lot</button>
        </div>
        {items.map((it, idx) => {
          const avail = getAvailableBags(it.lotId, editId);
          return (
            <div key={it.id} style={{ ...s.card2, marginBottom: 8 }}>
              <div style={s.rowBetween}>
                <span style={{ fontSize: 12, fontWeight: 700, color: clr.muted }}>Lot #{idx + 1}</span>
                {items.length > 1 && <button onClick={() => setItems(p => p.filter((_, i) => i !== idx))} style={{ ...s.btnSm(), padding: 4 }}><Icon name="x" size={12} color={clr.red} /></button>}
              </div>
              <Field label="Lot ID">
                <select style={s.select} value={it.lotId} onChange={e => updateItem(idx, "lotId", e.target.value)}>
                  <option value="">-- Select Lot --</option>
                  {purchases.map(p => <option key={p.lotId} value={p.lotId}>{p.lotId} – {p.kisanName}</option>)}
                </select>
              </Field>
              {it.lotId && <div style={{ fontSize: 12, color: clr.green, marginBottom: 8 }}>Available: {fmt(avail)} bags</div>}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Field label="Bags"><input type="number" style={s.input} value={it.bagsLoaded} onChange={e => updateItem(idx, "bagsLoaded", e.target.value)} /></Field>
                <Field label="Weight kg"><input type="number" style={s.input} value={it.weightLoaded} onChange={e => updateItem(idx, "weightLoaded", e.target.value)} /></Field>
              </div>
            </div>
          );
        })}
        <button onClick={save} style={{ ...s.btn(), width: "100%", marginTop: 4 }}>Save Gate Pass</button>
      </Modal>
    </div>
  );
};

// ─── SALE ─────────────────────────────────────────────────────────────────────
const SaleScreen = ({ sales, setSales, dispatches, purchases, parties, mandis }) => {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [gpId, setGpId] = useState(""); const [saleDate, setSaleDate] = useState(today());
  const [lotSales, setLotSales] = useState([]);
  const [commission, setCommission] = useState("2"); const [labour, setLabour] = useState(""); const [transport, setTransport] = useState(""); const [otherDeductions, setOtherDeductions] = useState("");
  const [err, setErr] = useState("");
  const getName = (arr, id) => arr.find(x => x.id === id)?.name || "-";

  const selectGp = (id) => {
    setGpId(id);
    const gp = dispatches.find(d => d.id === id);
    if (gp) setLotSales(gp.items.map(it => ({ lotId: it.lotId, bagsLoaded: it.bagsLoaded, weightLoaded: it.weightLoaded, saleRate: "", saleWeight: it.weightLoaded })));
  };

  const updateLotSale = (idx, key, val) => setLotSales(p => p.map((it, i) => i === idx ? { ...it, [key]: val } : it));

  const calcLot = (it) => {
    const lot = purchases.find(p => p.lotId === it.lotId);
    const grossSale = (parseFloat(it.saleRate) || 0) * (parseFloat(it.saleWeight) || 0);
    const commAmt = grossSale * (parseFloat(commission) || 0) / 100;
    const labAmt = parseFloat(labour) || 0;
    const tranAmt = parseFloat(transport) || 0;
    const othAmt = parseFloat(otherDeductions) || 0;
    const netSale = grossSale - commAmt - labAmt - tranAmt - othAmt;
    const dispBags = parseFloat(it.bagsLoaded) || 0;
    const totalLotBags = parseFloat(lot?.manualBags) || 1;
    const purchaseCost = (dispBags / totalLotBags) * (lot?.totalAmount || 0);
    const weightLoss = (parseFloat(it.weightLoaded) || 0) - (parseFloat(it.saleWeight) || 0);
    return { grossSale, commAmt, netSale, purchaseCost, weightLoss, profitLoss: netSale - purchaseCost };
  };

  const openEdit = (sale) => {
    setEditId(sale.id);
    setGpId(sale.gpId);
    setSaleDate(sale.date);
    setCommission(sale.commission || "2");
    setLabour(sale.labour || "");
    setTransport(sale.transport || "");
    setOtherDeductions(sale.otherDeductions || "");
    setLotSales(sale.lotSales.map(ls => ({ lotId: ls.lotId, bagsLoaded: ls.bagsLoaded, weightLoaded: ls.weightLoaded, saleRate: ls.saleRate, saleWeight: ls.saleWeight })));
    setShowForm(true);
  };

  const save = () => {
    if (!gpId) { setErr("Select Gate Pass"); return; }
    for (const it of lotSales) { if (!it.saleRate) { setErr("Fill sale rate for all lots"); return; } }
    const gp = dispatches.find(d => d.id === gpId);
    const saleData = { id: editId || uid(), gpId, gpNum: gp?.gpNum, partyId: gp?.partyId, mandiId: gp?.mandiId, date: saleDate, commission, labour, transport, otherDeductions, lotSales: lotSales.map(it => ({ ...it, ...calcLot(it) })), createdAt: Date.now() };
    if (editId) setSales(p => p.map(x => x.id === editId ? { ...x, ...saleData } : x));
    else setSales(p => [...p, saleData]);
    setShowForm(false); setEditId(null); setGpId(""); setLotSales([]); setErr("");
  };

  const del = (id) => setSales(p => p.filter(x => x.id !== id));

  // All GPs - for edit show current gp too
  const availableGPs = editId
    ? dispatches.filter(d => !sales.find(s => s.gpId === d.id && s.id !== editId))
    : dispatches.filter(d => !sales.find(s => s.gpId === d.id));

  return (
    <div>
      <div style={{ ...s.rowBetween, padding: "12px 16px 0" }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>💰 Sale (बिक्री)</span>
        <button onClick={() => { setShowForm(true); setEditId(null); setGpId(""); setLotSales([]); setErr(""); setSaleDate(today()); setCommission("2"); setLabour(""); setTransport(""); setOtherDeductions(""); }} style={s.btn()}><Icon name="add" size={16} color="#000" /> New Sale</button>
      </div>
      <div style={s.content}>
        {sales.length === 0 && <div style={{ ...s.card, textAlign: "center", color: clr.muted, padding: 32 }}>No sales yet.</div>}
        {[...sales].reverse().map(sale => {
          const totalNet = sale.lotSales.reduce((s, l) => s + (l.netSale || 0), 0);
          const totalPL = sale.lotSales.reduce((s, l) => s + (l.profitLoss || 0), 0);
          return (
            <div key={sale.id} style={s.card}>
              <div style={s.rowBetween}>
                <div style={s.row}><Badge v={`GP: ${sale.gpNum}`} color={clr.green} /><Badge v={`${sale.lotSales.length} lots`} color={clr.blue} /></div>
                <div style={s.row}>
                  <button onClick={() => openEdit(sale)} style={{ ...s.btnSm(), padding: 6 }}><Icon name="edit" size={14} color={clr.blue} /></button>
                  <button onClick={() => del(sale.id)} style={{ ...s.btnSm(), padding: 6 }}><Icon name="trash" size={14} color={clr.red} /></button>
                </div>
              </div>
              <div style={{ fontSize: 12, color: clr.muted, marginTop: 4 }}>{getName(parties, sale.partyId)} · {getName(mandis, sale.mandiId)} · {fmtDate(sale.date)}</div>
              <div style={s.divider} />
              {sale.lotSales.map((ls, i) => (
                <div key={i} style={{ ...s.card2, marginBottom: 6 }}>
                  <div style={s.rowBetween}>
                    <span style={{ color: clr.accent, fontWeight: 700 }}>LOT: {ls.lotId}</span>
                    <span style={{ color: ls.profitLoss >= 0 ? clr.green : clr.red, fontWeight: 700 }}>₹{fmt(ls.profitLoss)} {ls.profitLoss >= 0 ? "✅" : "🔴"}</span>
                  </div>
                  <div style={{ fontSize: 12, color: clr.muted, marginTop: 4 }}>Rate: ₹{ls.saleRate}/kg · Wt Loss: {fmt(ls.weightLoss, 1)}kg · Net: ₹{fmt(ls.netSale)}</div>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <Stat label="Net Sale" value={`₹${fmt(totalNet)}`} color={clr.blue} />
                <Stat label="P&L" value={`₹${fmt(Math.abs(totalPL))}`} color={totalPL >= 0 ? clr.green : clr.red} sub={totalPL >= 0 ? "Profit ✅" : "Loss 🔴"} />
              </div>
            </div>
          );
        })}
      </div>
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? "Edit Sale" : "New Sale"}>
        {err && <Alert msg={err} type="error" />}
        <Field label="Gate Pass">
          <select style={s.select} value={gpId} onChange={e => selectGp(e.target.value)} disabled={!!editId}>
            <option value="">-- Select Gate Pass --</option>
            {availableGPs.map(d => <option key={d.id} value={d.id}>GP: {d.gpNum} – {getName(parties, d.partyId)}</option>)}
          </select>
        </Field>
        <Field label="Sale Date"><input type="date" style={s.input} value={saleDate} onChange={e => setSaleDate(e.target.value)} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="Commission %"><input type="number" style={s.input} value={commission} onChange={e => setCommission(e.target.value)} /></Field>
          <Field label="Labour ₹"><input type="number" style={s.input} value={labour} onChange={e => setLabour(e.target.value)} /></Field>
          <Field label="Transport ₹"><input type="number" style={s.input} value={transport} onChange={e => setTransport(e.target.value)} /></Field>
          <Field label="Other Deductions ₹"><input type="number" style={s.input} value={otherDeductions} onChange={e => setOtherDeductions(e.target.value)} /></Field>
        </div>
        {lotSales.map((it, idx) => {
          const calc = it.saleRate ? calcLot(it) : null;
          return (
            <div key={idx} style={{ ...s.card2, marginBottom: 8 }}>
              <div style={{ fontWeight: 700, color: clr.accent, marginBottom: 6 }}>LOT: {it.lotId}</div>
              <div style={{ fontSize: 12, color: clr.muted, marginBottom: 8 }}>Dispatched: {fmt(it.bagsLoaded)} bags · {fmt(it.weightLoaded, 1)} kg</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Field label="Sale Rate ₹/kg"><input type="number" style={s.input} value={it.saleRate} onChange={e => updateLotSale(idx, "saleRate", e.target.value)} /></Field>
                <Field label="Sale Weight kg"><input type="number" style={s.input} value={it.saleWeight} onChange={e => updateLotSale(idx, "saleWeight", e.target.value)} /></Field>
              </div>
              {calc && (
                <div style={{ background: clr.bg, borderRadius: 8, padding: 8, fontSize: 12 }}>
                  <div style={s.rowBetween}><span style={{ color: clr.muted }}>Gross Sale</span><span>₹{fmt(calc.grossSale)}</span></div>
                  <div style={s.rowBetween}><span style={{ color: clr.muted }}>Commission</span><span>-₹{fmt(calc.commAmt)}</span></div>
                  <div style={s.rowBetween}><span style={{ color: clr.muted }}>Purchase Cost</span><span>₹{fmt(calc.purchaseCost)}</span></div>
                  <div style={s.rowBetween}><span style={{ color: clr.muted }}>Weight Loss</span><span>{fmt(calc.weightLoss, 1)} kg</span></div>
                  <div style={{ ...s.rowBetween, marginTop: 4, fontWeight: 800 }}>
                    <span>P&L</span>
                    <span style={{ color: calc.profitLoss >= 0 ? clr.green : clr.red }}>₹{fmt(calc.profitLoss)} {calc.profitLoss >= 0 ? "✅" : "🔴"}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {lotSales.length === 0 && <Alert msg="Select a Gate Pass to load lot details" />}
        <button onClick={save} style={{ ...s.btn(), width: "100%", marginTop: 4 }}>{editId ? "Update Sale" : "Save Sale"}</button>
      </Modal>
    </div>
  );
};

// ─── STOCK ────────────────────────────────────────────────────────────────────
const StockScreen = ({ purchases, dispatches, sales }) => {
  const [expandedLot, setExpandedLot] = useState(null);
  const getDispatchedItems = (lotId) => dispatches.flatMap(d => d.items.filter(i => i.lotId === lotId).map(i => ({ ...i, gpNum: d.gpNum, date: d.date, vehicle: d.vehicle })));
  const getSaleItems = (lotId) => sales.flatMap(s => s.lotSales.filter(ls => ls.lotId === lotId).map(ls => ({ ...ls, gpNum: s.gpNum, date: s.date })));

  return (
    <div style={s.content}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>📦 Stock & History</div>
      {purchases.length === 0 && <div style={{ ...s.card, textAlign: "center", color: clr.muted, padding: 32 }}>No stock data.</div>}
      {purchases.map(p => {
        const dispItems = getDispatchedItems(p.lotId);
        const saleItems = getSaleItems(p.lotId);
        const dispatched = dispItems.reduce((s, i) => s + (parseFloat(i.bagsLoaded) || 0), 0);
        const remaining = (parseFloat(p.manualBags) || 0) - dispatched;
        const pct = p.manualBags > 0 ? (dispatched / p.manualBags) * 100 : 0;
        const isExpanded = expandedLot === p.lotId;
        return (
          <div key={p.id} style={s.card}>
            <div style={s.rowBetween} onClick={() => setExpandedLot(isExpanded ? null : p.lotId)}>
              <div>
                <div style={s.row}><Badge v={`LOT: ${p.lotId}`} color={clr.accent} /><Badge v={remaining > 0 ? `${fmt(remaining)} left` : "Done"} color={remaining > 0 ? clr.green : clr.muted} /></div>
                <div style={{ fontWeight: 600, marginTop: 4 }}>{p.kisanName}</div>
              </div>
              <span style={{ color: clr.muted, fontSize: 18 }}>{isExpanded ? "▲" : "▼"}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 10 }}>
              <div style={s.col}><span style={s.label}>Purchased</span><span style={{ fontWeight: 700 }}>{fmt(p.manualBags)}</span></div>
              <div style={s.col}><span style={s.label}>Dispatched</span><span style={{ fontWeight: 700, color: clr.blue }}>{fmt(dispatched)}</span></div>
              <div style={s.col}><span style={s.label}>Remaining</span><span style={{ fontWeight: 700, color: remaining > 0 ? clr.green : clr.muted }}>{fmt(remaining)}</span></div>
            </div>
            <div style={{ marginTop: 8, height: 6, background: clr.border, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: pct >= 100 ? clr.muted : clr.blue, borderRadius: 3 }} />
            </div>
            {isExpanded && (
              <div style={{ marginTop: 10 }}>
                {/* Purchase */}
                <div style={{ fontWeight: 700, fontSize: 12, color: clr.accent, marginBottom: 6 }}>📥 PURCHASE</div>
                <div style={{ ...s.card2, fontSize: 12 }}>
                  <div style={s.rowBetween}><span style={{ color: clr.muted }}>{fmtDate(p.date)}</span><span>₹{fmt(p.totalAmount)}</span></div>
                  <div style={{ color: clr.muted }}>{p.manualBags} bags · {p.totalWeight}kg · Rate ₹{p.rate}/bag</div>
                </div>
                {/* Dispatches */}
                {dispItems.length > 0 && <>
                  <div style={{ fontWeight: 700, fontSize: 12, color: clr.green, margin: "8px 0 6px" }}>🚛 DISPATCHES</div>
                  {dispItems.map((di, i) => (
                    <div key={i} style={{ ...s.card2, fontSize: 12 }}>
                      <div style={s.rowBetween}><span style={{ color: clr.green }}>GP: {di.gpNum}</span><span>{fmt(di.bagsLoaded)} bags</span></div>
                      <div style={{ color: clr.muted }}>{fmtDate(di.date)} · {di.vehicle || "No vehicle"} · {fmt(di.weightLoaded, 1)}kg</div>
                    </div>
                  ))}
                </>}
                {/* Sales */}
                {saleItems.length > 0 && <>
                  <div style={{ fontWeight: 700, fontSize: 12, color: clr.blue, margin: "8px 0 6px" }}>💰 SALES</div>
                  {saleItems.map((si, i) => (
                    <div key={i} style={{ ...s.card2, fontSize: 12 }}>
                      <div style={s.rowBetween}><span style={{ color: clr.blue }}>GP: {si.gpNum}</span><span style={{ color: si.profitLoss >= 0 ? clr.green : clr.red }}>P&L: ₹{fmt(si.profitLoss)}</span></div>
                      <div style={{ color: clr.muted }}>{fmtDate(si.date)} · Rate ₹{si.saleRate}/kg · Net ₹{fmt(si.netSale)}</div>
                      <div style={{ color: clr.muted }}>Wt Loss: {fmt(si.weightLoss, 1)}kg</div>
                    </div>
                  ))}
                </>}
                {dispItems.length === 0 && saleItems.length === 0 && <div style={{ color: clr.muted, fontSize: 12, textAlign: "center", padding: 8 }}>No movement yet</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── PAYMENT ──────────────────────────────────────────────────────────────────
const PaymentScreen = ({ payments, setPayments, purchases, sales, parties, coldStorages, dispatches }) => {
  const [tab, setTab] = useState("receivable");
  const [showForm, setShowForm] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null); // for ledger view
  const [form, setForm] = useState({ type: "receivable", partyId: "", coldId: "", amount: "", date: today(), notes: "", payMode: "Cash" });
  const getName = (arr, id) => arr.find(x => x.id === id)?.name || "-";
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // RECEIVABLE: party ne kitna dena hai
  const getReceivable = (partyId) => {
    const totalSale = sales.filter(s => s.partyId === partyId).flatMap(s => s.lotSales).reduce((t, l) => t + (l.netSale || 0), 0);
    const paid = payments.filter(p => p.type === "receivable" && p.partyId === partyId).reduce((t, p) => t + (parseFloat(p.amount) || 0), 0);
    return { totalSale, paid, pending: totalSale - paid };
  };

  // PAYABLE: cold storage ko kitna dena hai (bulk - not per lot)
  const getPayable = (coldId) => {
    const coldLots = purchases.filter(p => p.coldStorageId === coldId);
    const total = coldLots.reduce((t, l) => t + (l.totalAmount || 0), 0);
    const paid = payments.filter(p => p.type === "payable" && p.coldId === coldId).reduce((t, p) => t + (parseFloat(p.amount) || 0), 0);
    return { total, paid, pending: total - paid, lots: coldLots };
  };

  const save = () => {
    if (!form.amount) return;
    if (form.type === "receivable" && !form.partyId) return;
    if (form.type === "payable" && !form.coldId) return;
    setPayments(p => [...p, { id: uid(), ...form, amount: parseFloat(form.amount), createdAt: Date.now() }]);
    setShowForm(false);
    setForm({ type: "receivable", partyId: "", coldId: "", amount: "", date: today(), notes: "", payMode: "Cash" });
  };

  // LEDGER VIEW for a party or cold
  if (selectedProfile) {
    const isParty = selectedProfile.type === "party";
    const entity = isParty ? parties.find(p => p.id === selectedProfile.id) : coldStorages.find(c => c.id === selectedProfile.id);
    if (!entity) { setSelectedProfile(null); return null; }

    if (isParty) {
      const r = getReceivable(entity.id);
      const partySales = sales.filter(s => s.partyId === entity.id);
      const partyPayments = payments.filter(p => p.type === "receivable" && p.partyId === entity.id);
      // Build ledger: sales as debit, payments as credit
      const ledger = [
        ...partySales.flatMap(s => s.lotSales.map(ls => ({ date: s.date, type: "sale", label: `GP: ${s.gpNum} · LOT: ${ls.lotId}`, amount: ls.netSale || 0, gpNum: s.gpNum }))),
        ...partyPayments.map(pm => ({ date: pm.date, type: "payment", label: `Received · ${pm.payMode || "Cash"} · ${pm.notes || ""}`, amount: pm.amount }))
      ].sort((a, b) => new Date(a.date) - new Date(b.date));
      let running = 0;
      return (
        <div>
          <div style={s.header}>
            <button onClick={() => setSelectedProfile(null)} style={{ ...s.btnSm(), padding: 6 }}><Icon name="back" size={16} /></button>
            <span style={{ fontWeight: 700, fontSize: 15 }}>👤 {entity.name}</span>
          </div>
          <div style={s.content}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <Stat label="Total Sale" value={`₹${fmt(r.totalSale)}`} color={clr.blue} />
              <Stat label="Received" value={`₹${fmt(r.paid)}`} color={clr.green} />
              <Stat label="Pending" value={`₹${fmt(r.pending)}`} color={r.pending > 0 ? clr.red : clr.muted} />
            </div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>📒 Ledger</div>
            {ledger.map((entry, i) => {
              if (entry.type === "sale") running += entry.amount;
              else running -= entry.amount;
              return (
                <div key={i} style={{ ...s.card2, marginBottom: 6 }}>
                  <div style={s.rowBetween}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{entry.label}</div>
                      <div style={{ fontSize: 11, color: clr.muted }}>{fmtDate(entry.date)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color: entry.type === "sale" ? clr.red : clr.green, fontSize: 13 }}>
                        {entry.type === "sale" ? `+₹${fmt(entry.amount)}` : `-₹${fmt(entry.amount)}`}
                      </div>
                      <div style={{ fontSize: 11, color: clr.muted }}>Bal: ₹{fmt(running)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Per GP breakdown */}
            <div style={{ fontWeight: 700, margin: "12px 0 8px" }}>📋 Gate Pass Wise</div>
            {partySales.map(s => {
              const gpTotal = s.lotSales.reduce((t, l) => t + (l.netSale || 0), 0);
              const gpPL = s.lotSales.reduce((t, l) => t + (l.profitLoss || 0), 0);
              return (
                <div key={s.id} style={s.card2}>
                  <div style={s.rowBetween}><span style={{ color: clr.green, fontWeight: 700 }}>GP: {s.gpNum}</span><span style={{ color: clr.blue }}>₹{fmt(gpTotal)}</span></div>
                  <div style={{ fontSize: 12, color: clr.muted }}>{fmtDate(s.date)} · {s.lotSales.length} lots · P&L: <span style={{ color: gpPL >= 0 ? clr.green : clr.red }}>₹{fmt(gpPL)}</span></div>
                  {s.lotSales.map((ls, i) => (
                    <div key={i} style={{ fontSize: 12, marginTop: 4, paddingTop: 4, borderTop: `1px solid ${clr.border}` }}>
                      <div style={s.rowBetween}><span style={{ color: clr.accent }}>LOT: {ls.lotId}</span><span>Net: ₹{fmt(ls.netSale)}</span></div>
                      <div style={{ color: clr.muted }}>Rate ₹{ls.saleRate}/kg · Wt Loss {fmt(ls.weightLoss, 1)}kg</div>
                    </div>
                  ))}
                </div>
              );
            })}
            <button onClick={() => { setForm(p => ({ ...p, type: "receivable", partyId: entity.id })); setShowForm(true); }} style={{ ...s.btn(), width: "100%", marginTop: 8 }}>+ Add Payment</button>
          </div>
        </div>
      );
    } else {
      // Cold storage ledger
      const r = getPayable(entity.id);
      const coldPayments = payments.filter(p => p.type === "payable" && p.coldId === entity.id);
      let running = 0;
      const ledger = [
        ...r.lots.map(l => ({ date: l.date, type: "purchase", label: `LOT: ${l.lotId} · ${l.kisanName}`, amount: l.totalAmount || 0 })),
        ...coldPayments.map(pm => ({ date: pm.date, type: "payment", label: `Paid · ${pm.payMode || "Cash"} · ${pm.notes || ""}`, amount: pm.amount }))
      ].sort((a, b) => new Date(a.date) - new Date(b.date));
      return (
        <div>
          <div style={s.header}>
            <button onClick={() => setSelectedProfile(null)} style={{ ...s.btnSm(), padding: 6 }}><Icon name="back" size={16} /></button>
            <span style={{ fontWeight: 700, fontSize: 15 }}>🏭 {entity.name}</span>
          </div>
          <div style={s.content}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <Stat label="Total Purchase" value={`₹${fmt(r.total)}`} color={clr.accent} />
              <Stat label="Paid" value={`₹${fmt(r.paid)}`} color={clr.green} />
              <Stat label="Pending" value={`₹${fmt(r.pending)}`} color={r.pending > 0 ? clr.red : clr.muted} />
            </div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>📒 Ledger</div>
            {ledger.map((entry, i) => {
              if (entry.type === "purchase") running += entry.amount;
              else running -= entry.amount;
              return (
                <div key={i} style={{ ...s.card2, marginBottom: 6 }}>
                  <div style={s.rowBetween}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{entry.label}</div>
                      <div style={{ fontSize: 11, color: clr.muted }}>{fmtDate(entry.date)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color: entry.type === "purchase" ? clr.red : clr.green, fontSize: 13 }}>
                        {entry.type === "purchase" ? `+₹${fmt(entry.amount)}` : `-₹${fmt(entry.amount)}`}
                      </div>
                      <div style={{ fontSize: 11, color: clr.muted }}>Bal: ₹{fmt(running)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Lot breakdown */}
            <div style={{ fontWeight: 700, margin: "12px 0 8px" }}>📦 Lot Wise</div>
            {r.lots.map(lot => (
              <div key={lot.id} style={s.card2}>
                <div style={s.rowBetween}><Badge v={`LOT: ${lot.lotId}`} color={clr.accent} /><span style={{ fontWeight: 700 }}>₹{fmt(lot.totalAmount)}</span></div>
                <div style={{ fontSize: 12, color: clr.muted }}>{lot.kisanName} · {fmtDate(lot.date)} · {lot.manualBags} bags</div>
              </div>
            ))}
            <button onClick={() => { setForm(p => ({ ...p, type: "payable", coldId: entity.id })); setShowForm(true); }} style={{ ...s.btn(), width: "100%", marginTop: 8 }}>+ Add Payment</button>
          </div>
        </div>
      );
    }
  }

  return (
    <div>
      <div style={{ padding: "12px 16px 0", ...s.rowBetween }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>💳 Payments</span>
        <button onClick={() => setShowForm(true)} style={s.btn()}><Icon name="add" size={16} color="#000" /> Add</button>
      </div>
      <div style={{ display: "flex", margin: "12px 16px 0" }}>
        {["receivable", "payable"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "10px 0", background: tab === t ? clr.accent : clr.card2, color: tab === t ? "#000" : clr.text, border: `1px solid ${clr.border}`, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
            {t === "receivable" ? "💰 From Traders" : "💸 To Cold Storage"}
          </button>
        ))}
      </div>
      <div style={s.content}>
        {tab === "receivable" && (
          <>
            <div style={{ fontSize: 12, color: clr.muted, marginBottom: 8 }}>Tap on party to see full ledger</div>
            {parties.map(party => {
              const r = getReceivable(party.id);
              if (r.totalSale === 0) return null;
              return (
                <div key={party.id} style={{ ...s.card, cursor: "pointer" }} onClick={() => setSelectedProfile({ type: "party", id: party.id })}>
                  <div style={s.rowBetween}>
                    <div style={s.row}><Icon name="user" size={16} color={clr.blue} /><span style={{ fontWeight: 700 }}>{party.name}</span></div>
                    <Badge v={r.pending > 0 ? "Pending" : "Clear"} color={r.pending > 0 ? clr.red : clr.green} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 10 }}>
                    <div style={s.col}><span style={s.label}>Total Sale</span><span style={{ fontWeight: 700 }}>₹{fmt(r.totalSale)}</span></div>
                    <div style={s.col}><span style={s.label}>Received</span><span style={{ fontWeight: 700, color: clr.green }}>₹{fmt(r.paid)}</span></div>
                    <div style={s.col}><span style={s.label}>Pending</span><span style={{ fontWeight: 700, color: r.pending > 0 ? clr.red : clr.muted }}>₹{fmt(r.pending)}</span></div>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    {payments.filter(p => p.type === "receivable" && p.partyId === party.id).slice(-3).map(pm => (
                      <div key={pm.id} style={{ ...s.rowBetween, fontSize: 12, padding: "3px 0", borderTop: `1px solid ${clr.border}` }}>
                        <span style={{ color: clr.muted }}>{fmtDate(pm.date)} · {pm.payMode || "Cash"}</span>
                        <span style={{ color: clr.green }}>+₹{fmt(pm.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
        {tab === "payable" && (
          <>
            <div style={{ fontSize: 12, color: clr.muted, marginBottom: 8 }}>Tap on cold storage to see full ledger</div>
            {coldStorages.map(cs => {
              const r = getPayable(cs.id);
              if (r.total === 0) return null;
              return (
                <div key={cs.id} style={{ ...s.card, cursor: "pointer" }} onClick={() => setSelectedProfile({ type: "cold", id: cs.id })}>
                  <div style={s.rowBetween}>
                    <div style={s.row}><span style={{ fontWeight: 700 }}>🏭 {cs.name}</span></div>
                    <Badge v={r.pending > 0 ? "Pending" : "Clear"} color={r.pending > 0 ? clr.red : clr.green} />
                  </div>
                  <div style={{ fontSize: 12, color: clr.muted, marginBottom: 8 }}>{r.lots.length} lots purchased</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    <div style={s.col}><span style={s.label}>Total</span><span style={{ fontWeight: 700 }}>₹{fmt(r.total)}</span></div>
                    <div style={s.col}><span style={s.label}>Paid</span><span style={{ fontWeight: 700, color: clr.green }}>₹{fmt(r.paid)}</span></div>
                    <div style={s.col}><span style={s.label}>Pending</span><span style={{ fontWeight: 700, color: r.pending > 0 ? clr.red : clr.muted }}>₹{fmt(r.pending)}</span></div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Payment">
        <Field label="Type">
          <div style={s.row}>
            {["receivable", "payable"].map(t => (
              <button key={t} onClick={() => f("type", t)} style={{ ...s.btn(form.type === t ? clr.accent : clr.card2, form.type === t ? "#000" : clr.text), flex: 1, fontSize: 12 }}>
                {t === "receivable" ? "💰 Received" : "💸 Paid to Cold"}
              </button>
            ))}
          </div>
        </Field>
        {form.type === "receivable" ? (
          <Field label="Party (Trader)">
            <select style={s.select} value={form.partyId} onChange={e => f("partyId", e.target.value)}>
              <option value="">-- Select Party --</option>
              {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
        ) : (
          <Field label="Cold Storage">
            <select style={s.select} value={form.coldId} onChange={e => f("coldId", e.target.value)}>
              <option value="">-- Select Cold Storage --</option>
              {coldStorages.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="Payment Mode">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {PMODES.map(m => (
              <button key={m} onClick={() => f("payMode", m)} style={{ ...s.btnSm(form.payMode === m ? clr.accent + "33" : clr.card2, form.payMode === m ? clr.accent : clr.text), flex: "none" }}>{m}</button>
            ))}
          </div>
        </Field>
        <Field label="Amount ₹"><input type="number" style={s.input} value={form.amount} onChange={e => f("amount", e.target.value)} /></Field>
        <Field label="Date"><input type="date" style={s.input} value={form.date} onChange={e => f("date", e.target.value)} /></Field>
        <Field label="Notes / Reference No."><input style={s.input} value={form.notes} onChange={e => f("notes", e.target.value)} placeholder="Cheque no / UTR / Optional" /></Field>
        <button onClick={save} style={{ ...s.btn(), width: "100%", marginTop: 4 }}>Save Payment</button>
      </Modal>
    </div>
  );
};

// ─── SEARCH ───────────────────────────────────────────────────────────────────
const SearchScreen = ({ purchases, dispatches, sales, payments, parties, mandis, coldStorages }) => {
  const [query, setQuery] = useState(""); const [filterType, setFilterType] = useState("lot"); const [result, setResult] = useState(null);
  const getName = (arr, id) => arr.find(x => x.id === id)?.name || "-";
  const search = () => {
    const q = query.trim().toLowerCase(); if (!q) return;
    if (filterType === "lot") {
      const lot = purchases.find(p => p.lotId.toLowerCase() === q);
      if (!lot) { setResult({ type: "not_found" }); return; }
      const lotDispatches = dispatches.filter(d => d.items.some(i => i.lotId === lot.lotId));
      const lotSalesAll = sales.flatMap(s => s.lotSales.map(ls => ({ ...ls, saleDate: s.date, partyId: s.partyId, gpNum: s.gpNum }))).filter(ls => ls.lotId === lot.lotId);
      const totalRevenue = lotSalesAll.reduce((t, ls) => t + (ls.netSale || 0), 0);
      const paidToKisan = payments.filter(p => p.type === "payable" && p.lotId === lot.lotId).reduce((t, p) => t + (p.amount || 0), 0);
      setResult({ type: "lot", lot, lotDispatches, lotSalesAll, totalRevenue, totalCost: lot.totalAmount || 0, profitLoss: totalRevenue - (lot.totalAmount || 0), paidToKisan });
    } else if (filterType === "gp") {
      const gp = dispatches.find(d => d.gpNum.toLowerCase() === q);
      if (!gp) { setResult({ type: "not_found" }); return; }
      const gpSale = sales.find(s => s.gpId === gp.id);
      const totalLoad = gp.items.reduce((t, i) => t + (parseFloat(i.bagsLoaded) || 0), 0);
      const totalPL = gpSale ? gpSale.lotSales.reduce((t, l) => t + (l.profitLoss || 0), 0) : 0;
      setResult({ type: "gp", gp, gpSale, totalLoad, totalPL });
    } else if (filterType === "party") {
      const party = parties.find(p => p.name.toLowerCase().includes(q));
      if (!party) { setResult({ type: "not_found" }); return; }
      const partySales = sales.filter(s => s.partyId === party.id);
      const totalSale = partySales.flatMap(s => s.lotSales).reduce((t, l) => t + (l.netSale || 0), 0);
      const totalPL = partySales.flatMap(s => s.lotSales).reduce((t, l) => t + (l.profitLoss || 0), 0);
      const received = payments.filter(p => p.type === "receivable" && p.partyId === party.id).reduce((t, p) => t + (p.amount || 0), 0);
      setResult({ type: "party", party, partySales, totalSale, totalPL, received, pending: totalSale - received });
    } else if (filterType === "cold") {
      const cs = coldStorages.find(c => c.name.toLowerCase().includes(q));
      if (!cs) { setResult({ type: "not_found" }); return; }
      const csLots = purchases.filter(p => p.coldStorageId === cs.id);
      const totalPurchase = csLots.reduce((t, l) => t + (l.totalAmount || 0), 0);
      const csLotIds = csLots.map(l => l.lotId);
      const csLotSales = sales.flatMap(s => s.lotSales).filter(ls => csLotIds.includes(ls.lotId));
      const totalSale = csLotSales.reduce((t, l) => t + (l.netSale || 0), 0);
      const totalPL = csLotSales.reduce((t, l) => t + (l.profitLoss || 0), 0);
      setResult({ type: "cold", cs, csLots, totalPurchase, totalSale, totalPL });
    } else if (filterType === "mandi") {
      const mandi = mandis.find(m => m.name.toLowerCase().includes(q));
      if (!mandi) { setResult({ type: "not_found" }); return; }
      const mandiDispatches = dispatches.filter(d => d.mandiId === mandi.id);
      const mandiSales = sales.filter(s => s.mandiId === mandi.id);
      const totalLoad = mandiDispatches.flatMap(d => d.items).reduce((t, i) => t + (parseFloat(i.bagsLoaded) || 0), 0);
      const totalPL = mandiSales.flatMap(s => s.lotSales).reduce((t, l) => t + (l.profitLoss || 0), 0);
      setResult({ type: "mandi", mandi, mandiDispatches, mandiSales, totalLoad, totalPL });
    }
  };
  return (
    <div style={s.content}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>🔍 Search</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {[["lot", "LOT ID"], ["gp", "Gate Pass"], ["party", "Party"], ["cold", "Cold Storage"], ["mandi", "Mandi"]].map(([k, l]) => (
          <button key={k} onClick={() => { setFilterType(k); setResult(null); }} style={{ ...s.btnSm(filterType === k ? clr.accent + "33" : clr.card2, filterType === k ? clr.accent : clr.text) }}>{l}</button>
        ))}
      </div>
      <div style={{ ...s.row, marginBottom: 16 }}>
        <input style={{ ...s.input, flex: 1 }} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && search()} placeholder={`Search by ${filterType}...`} />
        <button onClick={search} style={{ ...s.btn(), padding: "10px 14px" }}><Icon name="search" size={18} color="#000" /></button>
      </div>
      {result?.type === "not_found" && <Alert msg="No results found." type="error" />}
      {result?.type === "lot" && (
        <div>
          <div style={{ fontWeight: 700, marginBottom: 8, color: clr.accent }}>LOT: {result.lot.lotId}</div>
          <div style={s.card}><div style={{ fontWeight: 600, marginBottom: 6 }}>Purchase</div>
            <div style={{ fontSize: 13, color: clr.muted }}>{result.lot.kisanName} · {fmtDate(result.lot.date)}</div>
            <div style={{ fontSize: 13 }}>{result.lot.manualBags} bags · {result.lot.totalWeight}kg · ₹{fmt(result.lot.totalAmount)}</div>
          </div>
          <div style={s.card}><div style={{ fontWeight: 600, marginBottom: 6 }}>Dispatches ({result.lotDispatches.length})</div>
            {result.lotDispatches.length === 0 && <div style={{ color: clr.muted, fontSize: 13 }}>None</div>}
            {result.lotDispatches.map(d => <div key={d.id} style={{ fontSize: 13, marginTop: 4, color: clr.muted }}>GP: {d.gpNum} · {getName(mandis, d.mandiId)} · {fmtDate(d.date)}</div>)}
          </div>
          <div style={s.card}><div style={{ fontWeight: 600, marginBottom: 6 }}>Sales ({result.lotSalesAll.length})</div>
            {result.lotSalesAll.length === 0 && <div style={{ color: clr.muted, fontSize: 13 }}>None</div>}
            {result.lotSalesAll.map((ls, i) => <div key={i} style={{ fontSize: 13, marginTop: 4 }}>GP:{ls.gpNum} · ₹{ls.saleRate}/kg · Net:₹{fmt(ls.netSale)} · <span style={{ color: ls.profitLoss >= 0 ? clr.green : clr.red }}>P&L:₹{fmt(ls.profitLoss)}</span></div>)}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Stat label="Revenue" value={`₹${fmt(result.totalRevenue)}`} color={clr.blue} />
            <Stat label="Cost" value={`₹${fmt(result.totalCost)}`} color={clr.muted} />
            <Stat label="P&L" value={`₹${fmt(Math.abs(result.profitLoss))}`} color={result.profitLoss >= 0 ? clr.green : clr.red} sub={result.profitLoss >= 0 ? "Profit ✅" : "Loss 🔴"} />
          </div>
        </div>
      )}
      {result?.type === "gp" && (
        <div>
          <div style={{ fontWeight: 700, marginBottom: 8, color: clr.green }}>GP: {result.gp.gpNum}</div>
          <div style={s.card}>
            <div>{getName(parties, result.gp.partyId)} · {getName(mandis, result.gp.mandiId)} · {fmtDate(result.gp.date)}</div>
            <div style={s.divider} />
            {result.gp.items.map((it, i) => <div key={i} style={{ fontSize: 13 }}>LOT: {it.lotId} · {fmt(it.bagsLoaded)} bags · {fmt(it.weightLoaded, 1)} kg</div>)}
            <div style={{ ...s.rowBetween, marginTop: 8, fontWeight: 700 }}><span>Total</span><span style={{ color: clr.green }}>{fmt(result.totalLoad)} bags</span></div>
          </div>
          {result.gpSale && <div style={s.card}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Sale</div>
            {result.gpSale.lotSales.map((ls, i) => <div key={i} style={{ fontSize: 13 }}>LOT: {ls.lotId} · ₹{ls.saleRate}/kg · P&L: <span style={{ color: ls.profitLoss >= 0 ? clr.green : clr.red }}>₹{fmt(ls.profitLoss)}</span></div>)}
            <div style={{ ...s.rowBetween, marginTop: 8, fontWeight: 800 }}><span>Total P&L</span><span style={{ color: result.totalPL >= 0 ? clr.green : clr.red }}>₹{fmt(result.totalPL)}</span></div>
          </div>}
        </div>
      )}
      {result?.type === "party" && (
        <div>
          <div style={{ fontWeight: 700, marginBottom: 8, color: clr.blue }}>{result.party.name}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <Stat label="Total Sales" value={`₹${fmt(result.totalSale)}`} color={clr.blue} />
            <Stat label="Received" value={`₹${fmt(result.received)}`} color={clr.green} />
            <Stat label="Pending" value={`₹${fmt(result.pending)}`} color={clr.red} />
            <Stat label="P&L" value={`₹${fmt(Math.abs(result.totalPL))}`} color={result.totalPL >= 0 ? clr.green : clr.red} />
          </div>
        </div>
      )}
      {result?.type === "cold" && (
        <div>
          <div style={{ fontWeight: 700, marginBottom: 8, color: clr.purple }}>{result.cs.name}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <Stat label="Lots" value={result.csLots.length} color={clr.accent} />
            <Stat label="Purchase" value={`₹${fmt(result.totalPurchase)}`} color={clr.blue} />
            <Stat label="Sale" value={`₹${fmt(result.totalSale)}`} color={clr.green} />
            <Stat label="P&L" value={`₹${fmt(Math.abs(result.totalPL))}`} color={result.totalPL >= 0 ? clr.green : clr.red} />
          </div>
          {result.csLots.map(lot => <div key={lot.id} style={s.card2}><div style={s.rowBetween}><span><Badge v={`LOT: ${lot.lotId}`} color={clr.accent} /> {lot.kisanName}</span><span>₹{fmt(lot.totalAmount)}</span></div></div>)}
        </div>
      )}
      {result?.type === "mandi" && (
        <div>
          <div style={{ fontWeight: 700, marginBottom: 8, color: clr.accent }}>{result.mandi.name}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <Stat label="GPs" value={result.mandiDispatches.length} color={clr.blue} />
            <Stat label="Total Bags" value={fmt(result.totalLoad)} color={clr.accent} />
            <Stat label="P&L" value={`₹${fmt(Math.abs(result.totalPL))}`} color={result.totalPL >= 0 ? clr.green : clr.red} />
          </div>
        </div>
      )}
    </div>
  );
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const Dashboard = ({ purchases, dispatches, sales, payments, parties }) => {
  const totalPurchaseCost = purchases.reduce((t, p) => t + (p.totalAmount || 0), 0);
  const totalNetSale = sales.flatMap(s => s.lotSales).reduce((t, l) => t + (l.netSale || 0), 0);
  const totalPL = sales.flatMap(s => s.lotSales).reduce((t, l) => t + (l.profitLoss || 0), 0);
  const totalReceivable = parties.reduce((t, p) => {
    const sale = sales.filter(s => s.partyId === p.id).flatMap(s => s.lotSales).reduce((a, l) => a + (l.netSale || 0), 0);
    const paid = payments.filter(pm => pm.type === "receivable" && pm.partyId === p.id).reduce((a, pm) => a + (pm.amount || 0), 0);
    return t + (sale - paid);
  }, 0);
  const getDispatched = (lotId) => dispatches.flatMap(d => d.items).filter(i => i.lotId === lotId).reduce((s, i) => s + (parseFloat(i.bagsLoaded) || 0), 0);
  const totalStock = purchases.reduce((t, p) => t + Math.max(0, (parseFloat(p.manualBags) || 0) - getDispatched(p.lotId)), 0);
  const activeLots = purchases.filter(p => getDispatched(p.lotId) < (parseFloat(p.manualBags) || 0)).length;
  const todayDispatches = dispatches.filter(d => d.date === today()).length;

  const exportBackup = () => {
    const data = { purchases: DB.get("purchases"), dispatches: DB.get("dispatches"), sales: DB.get("sales"), payments: DB.get("payments"), varieties: DB.get("varieties"), gradings: DB.get("gradings"), coldStorages: DB.get("coldStorages"), mandis: DB.get("mandis"), parties: DB.get("parties") };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `AlooTrader_${today()}.json`; a.click();
  };
  const importBackup = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { try { const data = JSON.parse(ev.target.result); Object.entries(data).forEach(([k, v]) => DB.set(k, v)); alert("Restored! Refreshing..."); window.location.reload(); } catch { alert("Invalid file"); } };
    reader.readAsText(file);
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 16 }}>
        <div><div style={{ fontSize: 22, fontWeight: 900, color: clr.accent }}>🥔 AlooTrader</div><div style={{ fontSize: 12, color: clr.muted }}>आलू व्यापार प्रबंधन</div></div>
        <div style={{ textAlign: "right" }}><div style={{ fontSize: 12, color: clr.muted }}>Today</div><div style={{ fontSize: 13, fontWeight: 600 }}>{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <Stat label="Stock (bags)" value={fmt(totalStock)} color={clr.accent} sub="Remaining" />
        <Stat label="Active Lots" value={activeLots} color={clr.blue} />
        <Stat label="Profit / Loss" value={`₹${fmt(Math.abs(totalPL))}`} color={totalPL >= 0 ? clr.green : clr.red} sub={totalPL >= 0 ? "Profit ✅" : "Loss 🔴"} />
        <Stat label="Pending Receive" value={`₹${fmt(totalReceivable)}`} color={clr.red} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        <div style={s.statCard(clr.accent)}><div style={{ fontSize: 11, color: clr.muted }}>Purchases</div><div style={{ fontWeight: 800, color: clr.accent }}>{purchases.length}</div><div style={{ fontSize: 11, color: clr.muted }}>₹{fmt(totalPurchaseCost)}</div></div>
        <div style={s.statCard(clr.green)}><div style={{ fontSize: 11, color: clr.muted }}>Dispatches</div><div style={{ fontWeight: 800, color: clr.green }}>{dispatches.length}</div><div style={{ fontSize: 11, color: clr.muted }}>Today: {todayDispatches}</div></div>
        <div style={s.statCard(clr.blue)}><div style={{ fontSize: 11, color: clr.muted }}>Sales</div><div style={{ fontWeight: 800, color: clr.blue }}>{sales.length}</div><div style={{ fontSize: 11, color: clr.muted }}>₹{fmt(totalNetSale)}</div></div>
      </div>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Recent Purchases</div>
      {purchases.slice(-3).reverse().map(p => (
        <div key={p.id} style={{ ...s.card2, ...s.rowBetween }}>
          <div><Badge v={`LOT: ${p.lotId}`} color={clr.accent} /><span style={{ marginLeft: 8, fontSize: 13 }}>{p.kisanName}</span></div>
          <span style={{ color: clr.accent, fontWeight: 700 }}>₹{fmt(p.totalAmount)}</span>
        </div>
      ))}
      <div style={s.divider} />
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Backup & Restore</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={exportBackup} style={{ ...s.btn(clr.green + "22", clr.green), flex: 1, border: `1px solid ${clr.green}44` }}><Icon name="download" size={15} color={clr.green} /> Export</button>
        <label style={{ ...s.btn(clr.blue + "22", clr.blue), flex: 1, border: `1px solid ${clr.blue}44`, cursor: "pointer" }}>
          <Icon name="download" size={15} color={clr.blue} /> Restore
          <input type="file" accept=".json" style={{ display: "none" }} onChange={importBackup} />
        </label>
      </div>
    </div>
  );
};

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
const NAV = [
  { key: "dashboard", label: "Home", icon: "home" },
  { key: "master", label: "Master", icon: "master" },
  { key: "purchase", label: "Purchase", icon: "purchase" },
  { key: "dispatch", label: "Dispatch", icon: "dispatch" },
  { key: "sale", label: "Sale", icon: "sale" },
  { key: "stock", label: "Stock", icon: "stock" },
  { key: "search", label: "Search", icon: "search" },
  { key: "payment", label: "Payment", icon: "payment" },
];

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [varieties, setVarieties] = useStore("varieties", [{ id: "var1", name: "Chipsona" }, { id: "var2", name: "Jyoti" }, { id: "var3", name: "Kufri Pukhraj" }]);
  const [gradings, setGradings] = useStore("gradings", [{ id: "gr1", name: "A Grade" }, { id: "gr2", name: "B Grade" }, { id: "gr3", name: "Export" }]);
  const [coldStorages, setColdStorages] = useStore("coldStorages", [{ id: "cs1", name: "Sharma Cold Storage", location: "Agra" }]);
  const [mandis, setMandis] = useStore("mandis", [{ id: "mn1", name: "Agra Mandi" }, { id: "mn2", name: "Delhi Mandi" }]);
  const [parties, setParties] = useStore("parties", [{ id: "pt1", name: "Ramesh Traders", phone: "9876543210", creditDays: "30" }]);
  const [purchases, setPurchases] = useStore("purchases", []);
  const [dispatches, setDispatches] = useStore("dispatches", []);
  const [sales, setSales] = useStore("sales", []);
  const [payments, setPayments] = useStore("payments", []);
  const [showMore, setShowMore] = useState(false);

  const sharedProps = { varieties, setVarieties, gradings, setGradings, coldStorages, setColdStorages, mandis, setMandis, parties, setParties, purchases, setPurchases, dispatches, setDispatches, sales, setSales, payments, setPayments };
  const tabLabels = { dashboard: "🥔 AlooTrader", master: "📋 Master Data", purchase: "🛒 Purchase (खरीद)", dispatch: "🚛 Dispatch (लोडिंग)", sale: "💰 Sale (बिक्री)", stock: "📦 Stock & History", search: "🔍 Search", payment: "💳 Payments & Ledger" };
  const navBottom = NAV.slice(0, 5);
  const navMore = NAV.slice(5);

  return (
    <div style={s.screen}>
      <div style={s.header}>
        <span style={{ fontWeight: 800, fontSize: 16, color: clr.accent }}>{tabLabels[tab]}</span>
      </div>
      <div style={{ minHeight: "calc(100vh - 56px - 60px)", overflowY: "auto" }}>
        {tab === "dashboard" && <Dashboard {...sharedProps} />}
        {tab === "master" && <MasterScreen {...sharedProps} />}
        {tab === "purchase" && <PurchaseScreen {...sharedProps} />}
        {tab === "dispatch" && <DispatchScreen {...sharedProps} />}
        {tab === "sale" && <SaleScreen {...sharedProps} />}
        {tab === "stock" && <StockScreen {...sharedProps} />}
        {tab === "search" && <SearchScreen {...sharedProps} />}
        {tab === "payment" && <PaymentScreen {...sharedProps} />}
      </div>
      {showMore && (
        <div style={{ position: "fixed", bottom: 60, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: clr.card, borderTop: `1px solid ${clr.border}`, zIndex: 150, display: "flex", justifyContent: "space-around", padding: "8px 0" }}>
          {navMore.map(n => (
            <button key={n.key} onClick={() => { setTab(n.key); setShowMore(false); }} style={s.navItem(tab === n.key)}>
              <Icon name={n.icon} size={20} color={tab === n.key ? clr.accent : clr.muted} />
              <span style={{ fontSize: 9 }}>{n.label}</span>
            </button>
          ))}
        </div>
      )}
      <nav style={s.navBar}>
        {navBottom.map(n => (
          <button key={n.key} onClick={() => { setTab(n.key); setShowMore(false); }} style={s.navItem(tab === n.key && !showMore)}>
            <Icon name={n.icon} size={20} color={tab === n.key && !showMore ? clr.accent : clr.muted} />
            <span style={{ fontSize: 9 }}>{n.label}</span>
          </button>
        ))}
        <button onClick={() => setShowMore(p => !p)} style={s.navItem(showMore || ["stock", "search", "payment"].includes(tab))}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={showMore || ["stock", "search", "payment"].includes(tab) ? clr.accent : clr.muted} strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
          <span style={{ fontSize: 9 }}>More</span>
        </button>
      </nav>
    </div>
  );
}
