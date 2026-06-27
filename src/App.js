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
          if (r.items && typeof r.items === 'string') { try { r.items = JSON.parse(r.items); } catch { r.items = []; } }
          if (r.lot_sales && typeof r.lot_sales === 'string') { try { r.lot_sales = JSON.parse(r.lot_sales); } catch { r.lot_sales = []; } }
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

  const deleteItem = useCallback(async (id) => {
    const { error } = await supabase.from(tableName).delete().eq("id", id);
    if (!error) setData(p => p.filter(x => x.id !== id));
  }, [tableName]);

  return [data, { addItem, deleteItem, loading }];
};

const uid = () => Math.random().toString(36).slice(2, 7).toUpperCase();
const fmt = (n, d = 0) => (isNaN(n) ? "0" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d }));
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "-";
const today = () => new Date().toISOString().slice(0, 10);

const clr = { bg: "#0f1117", card: "#1a1d26", card2: "#22263a", accent: "#f5a623", green: "#22c55e", red: "#ef4444", blue: "#3b82f6", purple: "#a855f7", muted: "#6b7280", border: "#2d3148", text: "#f1f5f9" };

const getLotStatus = (lot, dispatches = [], sales = []) => {
  const totalDispatched = dispatches.flatMap(d => d.items || []).filter(i => i.lot_id === lot.lot_id).reduce((sum, i) => sum + parseFloat(i.bags || 0), 0);
  const totalSales = sales.flatMap(s => s.lot_sales || []).filter(l => l.lot_id === lot.lot_id).reduce((sum, l) => sum + parseFloat(l.bags || 0), 0);
  const stdBags = lot.total_weight ? parseFloat(lot.total_weight) / 52.5 : 0;
  const remaining = stdBags - totalDispatched;
  return { totalDispatched, totalSales, remaining, isClosed: remaining <= 0 && totalDispatched > 0 };
};

const Icon = ({ name, size = 18, color = clr.text }) => {
  const icons = {
    purchase: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    dispatch: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
    sale: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    payment: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    master: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
    add: "M12 4v16m8-8H4", x: "M6 18L18 6M6 6l12 12", search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icons[name]} /></svg>;
};

const s = {
  screen: { minHeight: "100vh", background: clr.bg, color: clr.text, fontFamily: "system-ui, sans-serif", maxWidth: 480, margin: "0 auto", position: "relative" },
  header: { background: clr.card, padding: "14px 16px", borderBottom: `1px solid ${clr.border}`, position: "sticky", top: 0, zIndex: 100 },
  card: { background: clr.card, borderRadius: 12, padding: 14, marginBottom: 10, border: `1px solid ${clr.border}` },
  card2: { background: clr.card2, borderRadius: 10, padding: 12, marginBottom: 8, border: `1px solid ${clr.border}` },
  rowBetween: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  row: { display: "flex", alignItems: "center", gap: 8 },
  input: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 8, padding: "10px 12px", color: clr.text, fontSize: 14, boxSizing: "border-box", outline: "none" },
  select: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 8, padding: "10px 12px", color: clr.text, fontSize: 14, boxSizing: "border-box", outline: "none" },
  label: { fontSize: 11, color: clr.muted, marginBottom: 3, fontWeight: 600, textTransform: "uppercase" },
  btn: (bg = clr.accent, txt = "#000") => ({ background: bg, color: txt, border: "none", borderRadius: 8, padding: "11px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }),
  btnSm: (bg = clr.card2, txt = clr.text) => ({ background: bg, color: txt, border: `1px solid ${clr.border}`, borderRadius: 6, padding: "6px 10px", fontWeight: 600, fontSize: 12, cursor: "pointer" }),
  tag: (bg = clr.accent + "22", txt = clr.accent) => ({ background: bg, color: txt, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }),
  content: { padding: 16, paddingBottom: 90 },
  navBar: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: clr.card, borderTop: `1px solid ${clr.border}`, display: "flex", zIndex: 200 },
  navItem: (active) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 4px", gap: 3, background: "none", border: "none", color: active ? clr.accent : clr.muted, fontSize: 10, cursor: "pointer" }),
  divider: { height: 1, background: clr.border, margin: "10px 0" }
};

const Field = ({ label, children }) => <div style={{ marginBottom: 12 }}><div style={s.label}>{label}</div>{children}</div>;

const Modal = ({ open, onClose, title, children }) => !open ? null : (
  <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 1000, display: "flex", alignItems: "flex-end" }}>
    <div style={{ background: clr.card, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "85vh", display: "flex", flexDirection: "column", border: `1px solid ${clr.border}`, margin: "0 auto" }}>
      <div style={{ ...s.rowBetween, padding: 16 }}><span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span><button onClick={onClose} style={s.btnSm()}><Icon name="x" size={14} /></button></div>
      <div style={{ overflowY: "auto", padding: "0 16px 24px" }}>{children}</div>
    </div>
  </div>
);

// --- DASHBOARD TOOL ---
const DashboardComponent = ({ purchases, dispatches, sales }) => {
  const totalBagsPurchased = purchases.reduce((sum, p) => sum + (parseFloat(p.total_weight || 0) / 52.5), 0);
  const totalWeightBags = purchases.reduce((sum, p) => sum + parseFloat(p.total_weight || 0), 0);
  const totalDispatchedBags = dispatches.flatMap(d => d.items || []).reduce((sum, i) => sum + parseFloat(i.bags || 0), 0);
  const stockRemaining = totalBagsPurchased - totalDispatchedBags;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
      <div style={{ ...s.card2, background: clr.purple + "15", borderColor: clr.purple + "44" }}>
        <div style={s.label}>कुल स्टॉक (STD Bags)</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: clr.purple }}>{fmt(totalBagsPurchased)} Bag</div>
        <div style={{ fontSize: 11, color: clr.muted }}>({fmt(totalWeightBags)} KG)</div>
      </div>
      <div style={{ ...s.card2, background: clr.green + "15", borderColor: clr.green + "44" }}>
        <div style={s.label}>बैलेंस स्टॉक मंडी हेतु</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: clr.green }}>{fmt(stockRemaining, 1)} Bag</div>
        <div style={{ fontSize: 11, color: clr.muted }}>({fmt(stockRemaining * 52.5)} KG)</div>
      </div>
    </div>
  );
};

// --- PURCHASE SCREEN ---
const PurchaseScreen = ({ purchases, varieties, coldStorages, ops, dispatches, sales }) => {
  const blank = { lot_id: "", kisan_name: "", cold_storage_id: "", date: today(), variety_id: "", total_weight: "", rate: "", notes: "" };
  const [form, setForm] = useState(blank);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const stdBags = form.total_weight ? (parseFloat(form.total_weight) / 52.5).toFixed(2) : 0;
  // FIX: Rate calculation based on standard 52.5kg counting rule
  const totalAmt = stdBags * (parseFloat(form.rate) || 0);

  const save = async () => {
    if (!form.lot_id || !form.kisan_name || !form.total_weight || !form.rate) return;
    await ops.purchases.addItem({ ...form, std_bags: parseFloat(stdBags), total_amount: totalAmt, id: uid() });
    setShowForm(false); setForm(blank);
  };

  const filtered = purchases.filter(p => p.lot_id.toLowerCase().includes(search.toLowerCase()) || p.kisan_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <DashboardComponent purchases={purchases} dispatches={dispatches} sales={sales} />
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <input style={{ ...s.input, width: "70%" }} placeholder="🔍 खोजें (लॉट/किसान)..." value={search} onChange={e => setSearch(e.target.value)} />
        <button onClick={() => setShowForm(true)} style={s.btn()}><Icon name="add" size={14} /> New Lot</button>
      </div>

      {filtered.reverse().map(p => {
        const status = getLotStatus(p, dispatches, sales);
        return (
          <div key={p.id} style={s.card}>
            <div style={s.rowBetween}>
              <span style={s.tag()}>LOT: {p.lot_id}</span>
              <span style={{ fontSize: 12, color: clr.muted }}>{fmtDate(p.date)}</span>
            </div>
            <div style={{ fontWeight: 700, marginTop: 6, fontSize: 15 }}>{p.kisan_name}</div>
            <div style={{ fontSize: 12, color: clr.muted }}>{coldStorages.find(c => c.id === p.cold_storage_id)?.name || "Cold Storage"}</div>
            <div style={s.divider} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div><span style={s.label}>कुल वजन (KG):</span> <strong style={{ color: clr.purple }}>{fmt(p.total_weight)} kg</strong></div>
              <div><span style={s.label}>STD बैग (52.5kg):</span> <strong style={{ color: clr.accent }}>{fmt(p.std_bags, 1)}</strong></div>
            </div>
            <div style={{ ...s.rowBetween, marginTop: 8, background: clr.card2, padding: 8, borderRadius: 6 }}>
              <span style={{ fontSize: 12 }}>Rate: ₹{p.rate}/Bag</span>
              <span style={{ fontWeight: 700, color: clr.green }}>₹{fmt(p.total_amount)}</span>
            </div>
            <div style={{ ...s.rowBetween, marginTop: 6, fontSize: 11, color: clr.muted }}>
              <span>Dispatch: {status.totalDispatched} Bag</span>
              <span>Balance: {fmt(status.remaining, 1)} Bag</span>
            </div>
          </div>
        );
      })}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="नया परचेज लॉट">
        <Field label="लॉट नंबर (Lot ID)"><input style={s.input} value={form.lot_id} onChange={e => setForm({ ...form, lot_id: e.target.value })} /></Field>
        <Field label="किसान का नाम"><input style={s.input} value={form.kisan_name} onChange={e => setForm({ ...form, kisan_name: e.target.value })} /></Field>
        <Field label="कुल वजन (टोटल वेट - KG)"><input type="number" style={s.input} value={form.total_weight} onChange={e => setForm({ ...form, total_weight: e.target.value })} /></Field>
        <Field label="रेट (प्रति 52.5 KG बैग)"><input type="number" style={s.input} value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} /></Field>
        <Field label="कोल्ड स्टोरेज"><select style={s.select} value={form.cold_storage_id} onChange={e => setForm({ ...form, cold_storage_id: e.target.value })}><option value="">चुनें</option>{coldStorages.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <div style={{ ...s.card2, background: clr.accent + "11" }}>
          <div style={s.rowBetween}><span style={{ fontSize: 12 }}>बनने वाले STD बैग:</span> <strong>{stdBags}</strong></div>
          <div style={s.rowBetween}><span style={{ fontSize: 12 }}>अनुमानित कुल रकम:</span> <strong style={{ color: clr.accent }}>₹{fmt(totalAmt)}</strong></div>
        </div>
        <button onClick={save} style={{ ...s.btn(), width: "100%", marginTop: 10 }}>लॉट सेव करें</button>
      </Modal>
    </div>
  );
};

// --- DISPATCH SCREEN ---
const DispatchScreen = ({ purchases, dispatches, mandis, parties, ops }) => {
  const [form, setForm] = useState({ gatepass_id: "", vehicle_number: "", mandi_id: "", party_id: "", date: today(), items: [{ lot_id: "", bags: "" }] });
  const [showForm, setShowForm] = useState(false);

  const openNew = () => {
    // FIX: Unique Gatepass Automatically generate ho raha hai aur party mapping connected hai
    setForm({ gatepass_id: "GP-" + uid(), vehicle_number: "", mandi_id: "", party_id: "", date: today(), items: [{ lot_id: "", bags: "" }] });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.vehicle_number || !form.mandi_id || !form.party_id) return;
    await ops.dispatches.addItem({ ...form, id: uid() });
    setShowForm(false);
  };

  return (
    <div>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700 }}>चालान / गेटपास रिकॉर्ड</span>
        <button onClick={openNew} style={s.btn()}><Icon name="add" size={14} /> New Dispatch</button>
      </div>

      {dispatches.map(d => (
        <div key={d.id} style={s.card}>
          <div style={s.rowBetween}>
            <span style={s.tag(clr.blue + "22", clr.blue)}>{d.gatepass_id}</span>
            <span style={{ fontSize: 12, color: clr.muted }}>{fmtDate(d.date)}</span>
          </div>
          <div style={{ fontWeight: 700, marginTop: 6 }}>गाड़ी नंबर: {d.vehicle_number}</div>
          <div style={{ fontSize: 13, color: clr.accent }}>मंडी: {mandis.find(m => m.id === d.mandi_id)?.name} | आढ़ती/पार्टी: {parties.find(p => p.id === d.party_id)?.name}</div>
          <div style={s.divider} />
          {d.items?.map((it, i) => <div key={i} style={{ fontSize: 13 }}>• लॉट नंबर <strong>{it.lot_id}</strong> से <strong>{it.bags} बैग</strong> dispatched.</div>)}
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="नया डिस्पैच / गेटपास जनरेट करें">
        <Field label="गेटपास नंबर (Auto)"><input style={{ ...s.input, color: clr.muted }} value={form.gatepass_id} readOnly /></Field>
        <Field label="गाड़ी नंबर (Vehicle Number)"><input style={s.input} placeholder="UP86XXXXXX" value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} /></Field>
        <Field label="भेजी जाने वाली मंडी"><select style={s.select} value={form.mandi_id} onChange={e => setForm({ ...form, mandi_id: e.target.value })}><option value="">मंडी चुनें</option>{mandis.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
        <Field label="आढ़ती / पार्टी (Mandi Party)"><select style={s.select} value={form.party_id} onChange={e => setForm({ ...form, party_id: e.target.value })}><option value="">पार्टी चुनें</option>{parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        
        <div style={s.card2}>
          <span style={s.label}>लॉट ब्रेकडाउन माल लोड</span>
          {form.items.map((it, idx) => (
            <div key={idx} style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <select style={{ ...s.select, flex: 2 }} value={it.lot_id} onChange={e => setForm({ ...form, items: form.items.map((itx, i) => i === idx ? { ...itx, lot_id: e.target.value } : itx) })}><option value="">लॉट चुनें</option>{purchases.map(p => <option key={p.id} value={p.lot_id}>{p.lot_id} ({p.kisan_name})</option>)}</select>
              <input type="number" style={{ ...s.input, flex: 1 }} placeholder="Bags" value={it.bags} onChange={e => setForm({ ...form, items: form.items.map((itx, i) => i === idx ? { ...itx, bags: e.target.value } : itx) })} />
            </div>
          ))}
        </div>
        <button onClick={save} style={{ ...s.btn(), width: "100%" }}>गेटपास और माल रवाना करें</button>
      </Modal>
    </div>
  );
};

// --- SALES SCREEN WITH KHARCHA ---
const SalesScreen = ({ dispatches, sales, parties, mandis, ops }) => {
  const [form, setForm] = useState({ gp_id: "", party_id: "", mandi_id: "", date: today(), lot_sales: [{ lot_id: "", bags: "", total_kg: "", rate: "" }], comm_pct: "4", labor_per_bag: "5", transport_expense: "0", other_expense: "0" });
  const [showForm, setShowForm] = useState(false);

  // Auto load data when Gatepass is selected
  const handleGPChange = (gpId) => {
    const gp = dispatches.find(d => d.id === gpId);
    if (gp) {
      const mappedLots = gp.items?.map(it => ({ lot_id: it.lot_id, bags: it.bags, total_kg: (parseFloat(it.bags) * 50).toString(), rate: "" })) || [];
      setForm({ ...form, gp_id: gpId, party_id: gp.party_id, mandi_id: gp.mandi_id, lot_sales: mappedLots });
    }
  };

  // FIX: Proper calculation for gross sales, commissions (%), and expenses per bag
  const grossSales = form.lot_sales.reduce((sum, l) => sum + (parseFloat(l.bags || 0) * parseFloat(l.rate || 0)), 0);
  const totalBags = form.lot_sales.reduce((sum, l) => sum + parseFloat(l.bags || 0), 0);
  const totalKg = form.lot_sales.reduce((sum, l) => sum + parseFloat(l.total_kg || 0), 0);
  
  const commAmt = (grossSales * parseFloat(form.comm_pct || 0)) / 100;
  const laborAmt = totalBags * parseFloat(form.labor_per_bag || 0);
  const finalNetAmt = grossSales - commAmt - laborAmt - parseFloat(form.transport_expense || 0) - parseFloat(form.other_expense || 0);

  const save = async () => {
    if (!form.gp_id || !form.party_id) return;
    await ops.sales.addItem({ ...form, total_amount: finalNetAmt, gross_amount: grossSales, id: uid() });
    setShowForm(false);
  };

  return (
    <div>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700 }}>बिक्री पट्टी / Mandi Sales</span>
        <button onClick={() => setShowForm(true)} style={s.btn()}><Icon name="add" size={14} /> New Sale Entry</button>
      </div>

      {sales.map(s => (
        <div key={s.id} style={s.card}>
          <div style={s.rowBetween}>
            <span style={{ fontWeight: 700 }}>👤 {parties.find(p => p.id === s.party_id)?.name}</span>
            <span style={{ fontSize: 12, color: clr.muted }}>{fmtDate(s.date)}</span>
          </div>
          <div style={{ fontSize: 12, color: clr.muted }}>मंडी: {mandis.find(m => m.id === s.mandi_id)?.name}</div>
          <div style={s.divider} />
          {s.lot_sales?.map((l, i) => (
            <div key={i} style={{ ...s.rowBetween, fontSize: 13, marginBottom: 4 }}>
              <span>Lot: {l.lot_id} (<strong>{l.bags} Bag</strong> / {fmt(l.total_kg)} KG)</span>
              <span>Rate: ₹{l.rate}/Bag</span>
            </div>
          ))}
          <div style={s.divider} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11, color: clr.muted }}>
            <div>सकल बिक्री: ₹{fmt(s.gross_amount)}</div>
            <div>मंडी कमीशन (%): ₹{fmt((s.gross_amount * parseFloat(s.comm_pct || 0)) / 100)}</div>
            <div>लेबर खर्चा: ₹{fmt(s.lot_sales?.reduce((sum,l)=>sum+parseFloat(l.bags||0),0)*parseFloat(s.labor_per_bag||0))}</div>
            <div>भाड़ा / अन्य: ₹{fmt(parseFloat(s.transport_expense||0)+parseFloat(s.other_expense||0))}</div>
          </div>
          <div style={{ ...s.rowBetween, marginTop: 8, background: clr.green + "18", padding: 8, borderRadius: 6 }}>
            <span>शुद्ध आमदनी (Net Receivables):</span>
            <strong style={{ color: clr.green }}>₹{fmt(s.total_amount)}</strong>
          </div>
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="मंडी बिक्री पट्टी (Sales Out)">
        <Field label="गेटपास / गाड़ी सिलेक्ट करें"><select style={s.select} value={form.gp_id} onChange={e => handleGPChange(e.target.value)}><option value="">गेटपास चुनें</option>{dispatches.map(d => <option key={d.id} value={d.id}>{d.gatepass_id} ({d.vehicle_number})</option>)}</select></Field>
        <Field label="आढ़ती / पार्टी (Auto Link)"><select style={s.select} value={form.party_id} disabled><option value="">पार्टी ऑटो-लिंक</option>{parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        
        {form.lot_sales.map((l, idx) => (
          <div key={idx} style={{ ...s.card2, marginTop: 6 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>लॉट: {l.lot_id} ({l.bags} बैग)</div>
            <div style={{ display: "flex", gap: 6 }}>
              <input type="number" style={{ ...s.input, flex: 1 }} placeholder="वजन (KG)" value={l.total_kg} onChange={e => setForm({ ...form, lot_sales: form.lot_sales.map((lx, i) => i === idx ? { ...lx, total_kg: e.target.value } : lx) })} />
              <input type="number" style={{ ...s.input, flex: 1 }} placeholder="बिक्री रेट/बग" value={l.rate} onChange={e => setForm({ ...form, lot_sales: form.lot_sales.map((lx, i) => i === idx ? { ...lx, rate: e.target.value } : lx) })} />
            </div>
          </div>
        ))}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10 }}>
          <Field label="मंडी आढ़त (%)"><input type="number" style={s.input} value={form.comm_pct} onChange={e => setForm({ ...form, comm_pct: e.target.value })} /></Field>
          <Field label="लेबर / पल्लेदारी (Per Bag)"><input type="number" style={s.input} value={form.labor_per_bag} onChange={e => setForm({ ...form, labor_per_bag: e.target.value })} /></Field>
          <Field label="भाड़ा (Transport Expense)"><input type="number" style={s.input} value={form.transport_expense} onChange={e => setForm({ ...form, transport_expense: e.target.value })} /></Field>
          <Field label="अन्य खर्चे (Other Expenses)"><input type="number" style={s.input} value={form.other_expense} onChange={e => setForm({ ...form, other_expense: e.target.value })} /></Field>
        </div>

        <div style={{ ...s.card2, background: clr.green + "11", marginTop: 8 }}>
          <div style={s.rowBetween}><span style={{ fontSize: 12 }}>कुल वजन बिका:</span> <strong>{totalKg} KG</strong></div>
          <div style={s.rowBetween}><span style={{ fontSize: 12 }}>सकल बिक्री मूल्य:</span> <strong>₹{fmt(grossSales)}</strong></div>
          <div style={s.rowBetween}><span style={{ fontSize: 12 }}>कुल खर्चे काटकर नेट लेजर:</span> <strong style={{ color: clr.green }}>₹{fmt(finalNetAmt)}</strong></div>
        </div>

        <button onClick={save} style={{ ...s.btn(), width: "100%", marginTop: 8 }}>बिक्री वाउचर सेव करें</button>
      </Modal>
    </div>
  );
};

// --- LEGER / PAYMENT SCREEN ---
const PaymentScreen = ({ parties, payments, ops }) => {
  const [form, setForm] = useState({ party_id: "", type: "receivable", amount: "", date: today(), mode: "Cash", notes: "" });
  const [showForm, setShowForm] = useState(false);

  const save = async () => {
    if (!form.party_id || !form.amount) return;
    await ops.payments.addItem({ ...form, amount: parseFloat(form.amount), id: uid() });
    setShowForm(false);
  };

  return (
    <div>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700 }}>लेजर / भुगतान एंट्री</span>
        <button onClick={() => setShowForm(true)} style={s.btn()}><Icon name="add" size={14} /> New Transaction</button>
      </div>

      {payments.map(p => (
        <div key={p.id} style={s.card}>
          <div style={s.rowBetween}>
            <span style={{ fontWeight: 700 }}>{parties.find(pa => pa.id === p.party_id)?.name || "Unknown Party"}</span>
            <span style={{ fontSize: 12, color: clr.muted }}>{fmtDate(p.date)}</span>
          </div>
          <div style={{ ...s.rowBetween, marginTop: 6 }}>
            <span style={s.tag(p.type === "receivable" ? clr.green + "22" : clr.red + "22", p.type === "receivable" ? clr.green : clr.red)}>{p.type === "receivable" ? "पेमेंट मिला (+)" : "पेमेंट दिया (-)"}</span>
            <strong style={{ color: p.type === "receivable" ? clr.green : clr.red, fontSize: 16 }}>₹{fmt(p.amount)}</strong>
          </div>
          {p.notes && <div style={{ fontSize: 12, color: clr.muted, marginTop: 4 }}>Note: {p.notes}</div>}
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="पेमेंट लेजर एंट्री वाउचर">
        <Field label="पार्टी / आढ़ती चुनें"><select style={s.select} value={form.party_id} onChange={e => setForm({ ...form, party_id: e.target.value })}><option value="">पार्टी चुनें</option>{parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="लेनदेन का प्रकार (Type)"><select style={s.select} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="receivable">पेमेंट मिला (Received from Party)</option><option value="payable">पेमेंट दिया (Paid to Kisan/Broker)</option></select></Field>
        <Field label="रकम (Amount)"><input type="number" style={s.input} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></Field>
        <Field label="पेमेंट मोड"><select style={s.select} value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })}><option value="Cash">Cash</option><option value="UPI">UPI / Bank Transfer</option></select></Field>
        <Field label="टिप्पणी (Notes)"><input style={s.input} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field>
        <button onClick={save} style={{ ...s.btn(), width: "100%" }}>एंट्री पोस्ट करें</button>
      </Modal>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [purchases, opsP] = useSupabaseTable("purchases");
  const [dispatches, opsD] = useSupabaseTable("dispatches");
  const [sales, opsS] = useSupabaseTable("sales");
  const [payments, opsM] = useSupabaseTable("payments");
  const [varieties, opsV] = useSupabaseTable("varieties");
  const [coldStorages, opsC] = useSupabaseTable("cold_storages");
  const [mandis, opsMA] = useSupabaseTable("mandis");
  const [parties, opsPA] = useSupabaseTable("parties");
  const [currentTab, setCurrentTab] = useState("purchase");

  const ops = { purchases: opsP, dispatches: opsD, sales: opsS, payments: opsM, varieties: opsV, cold_storages: opsC, mandis: opsMA, parties: opsPA };

  return (
    <div style={s.screen}>
      <div style={s.header}><h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: clr.accent }}>🥔 Aloo Trading Management OS</h2></div>
      
      <div style={s.content}>
        {currentTab === "purchase" && <PurchaseScreen purchases={purchases} varieties={varieties} coldStorages={coldStorages} dispatches={dispatches} sales={sales} ops={ops} />}
        {currentTab === "dispatch" && <DispatchScreen purchases={purchases} dispatches={dispatches} mandis={mandis} parties={parties} ops={ops} />}
        {currentTab === "sales" && <SalesScreen dispatches={dispatches} sales={sales} parties={parties} mandis={mandis} ops={ops} />}
        {currentTab === "payment" && <PaymentScreen parties={parties} payments={payments} ops={ops} />}
      </div>

      <div style={s.navBar}>
        <button onClick={() => setCurrentTab("purchase")} style={s.navItem(currentTab === "purchase")}><Icon name="purchase" color={currentTab === "purchase" ? clr.accent : clr.muted} /><span>खरीद</span></button>
        <button onClick={() => setCurrentTab("dispatch")} style={s.navItem(currentTab === "dispatch")}><Icon name="dispatch" color={currentTab === "dispatch" ? clr.accent : clr.muted} /><span>गेटपास</span></button>
        <button onClick={() => setCurrentTab("sales")} style={s.navItem(currentTab === "sales")}><Icon name="sale" color={currentTab === "sales" ? clr.accent : clr.muted} /><span>बिक्री</span></button>
        <button onClick={() => setCurrentTab("payment")} style={s.navItem(currentTab === "payment")}><Icon name="payment" color={currentTab === "payment" ? clr.accent : clr.muted} /><span>लेजर</span></button>
      </div>
    </div>
  );
}
