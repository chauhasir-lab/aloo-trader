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

  return [data, { addItem, loading }];
};

const uid = () => Math.random().toString(36).slice(2, 7).toUpperCase();
const fmt = (n, d = 0) => (isNaN(n) ? "0" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d }));
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "-";
const today = () => new Date().toISOString().slice(0, 10);

const clr = { bg: "#0b0d13", card: "#131722", card2: "#1c2030", accent: "#ffd700", green: "#00e676", red: "#ff5252", blue: "#29b6f6", purple: "#b388ff", muted: "#848e9c", border: "#232838", text: "#eaecef" };

const getLotCalculations = (lot, dispatches = [], sales = []) => {
  const totalDispatched = dispatches.flatMap(d => d.items || []).filter(i => i.lot_id === lot.lot_id).reduce((sum, i) => sum + parseFloat(i.bags || 0), 0);
  const totalSales = sales.flatMap(s => s.lot_sales || []).filter(l => l.lot_id === lot.lot_id).reduce((sum, l) => sum + parseFloat(l.bags || 0), 0);
  const stdBags = lot.total_weight ? parseFloat(lot.total_weight) / 52.5 : 0;
  const remaining = stdBags - totalDispatched;
  return { totalDispatched, totalSales, remaining, isClosed: remaining <= 0 && totalDispatched > 0 };
};

const s = {
  screen: { minHeight: "100vh", background: clr.bg, color: clr.text, fontFamily: "system-ui, sans-serif", maxWidth: 480, margin: "0 auto", position: "relative" },
  header: { background: clr.card, padding: "16px", borderBottom: `1px solid ${clr.border}`, position: "sticky", top: 0, zIndex: 100 },
  card: { background: clr.card, borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${clr.border}` },
  card2: { background: clr.card2, borderRadius: 10, padding: 12, marginBottom: 8, border: `1px solid ${clr.border}` },
  rowBetween: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  input: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 8, padding: "12px", color: clr.text, fontSize: 14, boxSizing: "border-box", outline: "none" },
  select: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 8, padding: "12px", color: clr.text, fontSize: 14, boxSizing: "border-box", outline: "none" },
  label: { fontSize: 11, color: clr.muted, marginBottom: 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" },
  btn: (bg = clr.accent, txt = "#000") => ({ background: bg, color: txt, border: "none", borderRadius: 8, padding: "12px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }),
  btnSm: (bg = clr.card2, txt = clr.text) => ({ background: bg, color: txt, border: `1px solid ${clr.border}`, borderRadius: 6, padding: "6px 12px", fontWeight: 600, fontSize: 12 }),
  tag: (bg = clr.accent + "15", txt = clr.accent) => ({ background: bg, color: txt, borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700 }),
  content: { padding: 16, paddingBottom: 100 },
  navBar: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: clr.card, borderTop: `1px solid ${clr.border}`, display: "flex", zIndex: 200 },
  navItem: (active) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 4px", gap: 4, background: "none", border: "none", color: active ? clr.accent : clr.muted, fontSize: 11, fontWeight: active ? 700 : 500, cursor: "pointer" }),
  divider: { height: 1, background: clr.border, margin: "12px 0" }
};

const Modal = ({ open, onClose, title, children }) => !open ? null : (
  <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 1000, display: "flex", alignItems: "flex-end" }}>
    <div style={{ background: clr.card, borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 480, maxHeight: "85vh", display: "flex", flexDirection: "column", borderTop: `1px solid ${clr.border}`, margin: "0 auto" }}>
      <div style={{ ...s.rowBetween, padding: 16, borderBottom: `1px solid ${clr.border}` }}><span style={{ fontWeight: 800, fontSize: 16 }}>{title}</span><button onClick={onClose} style={s.btnSm()}>Close</button></div>
      <div style={{ overflowY: "auto", padding: "16px 16px 32px" }}>{children}</div>
    </div>
  </div>
);

// --- 1. Dedicated Dashboard Screen ---
const IntelligenceDashboard = ({ purchases, dispatches, sales, payments, coldStorages, parties }) => {
  let activeLots = 0; let closedLots = 0; let totalPurAmt = 0; let totalSaleAmt = 0;

  purchases.forEach(p => {
    const calc = getLotCalculations(p, dispatches, sales);
    if (calc.isClosed) closedLots++; else activeLots++;
    totalPurAmt += parseFloat(p.total_amount || 0);
  });

  sales.forEach(s => { totalSaleAmt += parseFloat(s.total_amount || 0); });

  const totalPaid = payments.filter(p => p.type === "payable").reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const totalRecv = payments.filter(p => p.type === "receivable").reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const payableDues = totalPurAmt - totalPaid;
  const receivableDues = totalSaleAmt - totalRecv;
  const netProfitLoss = totalSaleAmt - totalPurAmt;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ ...s.card, margin: 0, background: "linear-gradient(135deg, #1c2030, #131722)" }}>
          <div style={s.label}>Active Lots</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: clr.accent }}>{activeLots} <span style={{ fontSize: 12, color: clr.muted }}>Live</span></div>
        </div>
        <div style={{ ...s.card, margin: 0, background: "linear-gradient(135deg, #1c2030, #131722)" }}>
          <div style={s.label}>Closed Lots</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: clr.muted }}>{closedLots} <span style={{ fontSize: 12 }}>Loaded</span></div>
        </div>
      </div>

      <div style={{ ...s.card, background: netProfitLoss >= 0 ? "rgba(0, 230, 118, 0.06)" : "rgba(255, 82, 82, 0.06)", borderColor: netProfitLoss >= 0 ? clr.green + "33" : clr.red + "33" }}>
        <div style={s.label}>Net Profit / Loss Engine</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: netProfitLoss >= 0 ? clr.green : clr.red }}>
          ₹{fmt(netProfitLoss)}
        </div>
        <div style={{ fontSize: 12, color: clr.muted, marginTop: 4 }}>Based on Gross Sales vs Primary Purchase Cost</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ ...s.card, margin: 0, borderLeft: `4px solid ${clr.red}` }}>
          <div style={s.label}>Payable Dues (Cold)</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: clr.red }}>₹{fmt(payableDues)}</div>
        </div>
        <div style={{ ...s.card, margin: 0, borderLeft: `4px solid ${clr.green}` }}>
          <div style={s.label}>Receivable (Mandi)</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: clr.green }}>₹{fmt(receivableDues)}</div>
        </div>
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 800, margin: "8px 0 2px" }}>Cold Storage Live Balance Profiles</h3>
      {coldStorages.map(c => {
        const coldPurchases = purchases.filter(p => p.cold_storage_id === c.id).reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0);
        const coldPayments = payments.filter(p => p.party_id === c.id).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const due = coldPurchases - coldPayments;
        return (
          <div key={c.id} style={{ ...s.rowBetween, ...s.card2, margin: 0 }}>
            <span style={{ fontWeight: 600 }}>{c.name}</span>
            <span style={{ fontWeight: 700, color: due > 0 ? clr.red : clr.text }}>₹{fmt(due)}</span>
          </div>
        );
      })}
    </div>
  );
};

// --- 2. Purchase Screen ---
const PurchaseScreen = ({ purchases, coldStorages, ops, dispatches, sales }) => {
  const blank = { lot_id: "", kisan_name: "", cold_storage_id: "", date: today(), total_weight: "", rate: "" };
  const [form, setForm] = useState(blank);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const stdBags = form.total_weight ? parseFloat(form.total_weight) / 52.5 : 0;
  const totalAmt = stdBags * (parseFloat(form.rate) || 0);

  const save = async () => {
    if (!form.lot_id || !form.cold_storage_id || !form.total_weight || !form.rate) return;
    await ops.purchases.addItem({ ...form, std_bags: stdBags, total_amount: totalAmt, id: uid() });
    setShowForm(false); setForm(blank);
  };

  const filtered = purchases.filter(p => p.lot_id.toLowerCase().includes(search.toLowerCase()) || p.kisan_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ ...s.rowBetween, marginBottom: 14, gap: 10 }}>
        <input style={s.input} placeholder="🔍 Smart Search Lot or Farmer..." value={search} onChange={e => setSearch(e.target.value)} />
        <button onClick={() => setShowForm(true)} style={s.btn()}><span style={{ fontSize: 18 }}>+</span> Lot</button>
      </div>

      {filtered.reverse().map(p => {
        const calc = getLotCalculations(p, dispatches, sales);
        return (
          <div key={p.id} style={s.card}>
            <div style={s.rowBetween}>
              <span style={s.tag()}>LOT: {p.lot_id}</span>
              <span style={s.tag(calc.isClosed ? clr.muted + "22" : clr.green + "22", calc.isClosed ? clr.muted : clr.green)}>
                {calc.isClosed ? "CLOSED" : "ACTIVE"}
              </span>
            </div>
            <div style={{ fontWeight: 700, marginTop: 8, fontSize: 15 }}>{p.kisan_name || "Direct Purchase"}</div>
            <div style={{ fontSize: 12, color: clr.accent, fontWeight: 500, marginTop: 2 }}>
              Creditor: {coldStorages.find(c => c.id === p.cold_storage_id)?.name || "Cold Storage Owner"}
            </div>
            <div style={s.divider} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
              <div><span style={s.label}>Total Wt:</span> <strong>{fmt(p.total_weight)} KG</strong></div>
              <div><span style={s.label}>Calculated Bags:</span> <strong>{fmt(p.std_bags, 2)} Bag</strong></div>
            </div>
            <div style={{ ...s.rowBetween, marginTop: 10, background: clr.card2, padding: 10, borderRadius: 8 }}>
              <span style={{ fontSize: 12, color: clr.muted }}>Rate: ₹{p.rate}/52.5kg</span>
              <span style={{ fontWeight: 800, color: clr.red }}>₹{fmt(p.total_amount)} (Bill to Cold)</span>
            </div>
          </div>
        );
      })}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Lot Inward Booking">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div><div style={s.label}>Lot ID / Marka</div><input style={s.input} value={form.lot_id} onChange={e => setForm({ ...form, lot_id: e.target.value })} /></div>
          <div><div style={s.label}>Farmer Name</div><input style={s.input} value={form.kisan_name} onChange={e => setForm({ ...form, kisan_name: e.target.value })} /></div>
          <div><div style={s.label}>Total Raw Weight (KG)</div><input type="number" style={s.input} value={form.total_weight} onChange={e => setForm({ ...form, total_weight: e.target.value })} /></div>
          <div><div style={s.label}>Rate per Standard Bag (52.5 KG Rule)</div><input type="number" style={s.input} value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} /></div>
          <div>
            <div style={s.label}>Cold Storage Profile (Account Holder)</div>
            <select style={s.select} value={form.cold_storage_id} onChange={e => setForm({ ...form, cold_storage_id: e.target.value })}><option value="">Select Cold Storage</option>{coldStorages.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </div>
          <div style={{ ...s.card2, background: clr.accent + "09", margin: "4px 0 0" }}>
            <div style={s.rowBetween}><span style={{ fontSize: 12 }}>Standard Bag Count:</span> <strong>{fmt(stdBags, 2)}</strong></div>
            <div style={s.rowBetween}><span style={{ fontSize: 12 }}>Cold Ledger Addition:</span> <strong style={{ color: clr.red }}>₹{fmt(totalAmt)}</strong></div>
          </div>
          <button onClick={save} style={{ ...s.btn(), width: "100%", marginTop: 4 }}>Execute Purchase Order</button>
        </div>
      </Modal>
    </div>
  );
};

// --- 3. Dispatch Screen ---
const DispatchScreen = ({ purchases, dispatches, mandis, parties, ops }) => {
  const [form, setForm] = useState({ gatepass_id: "", vehicle_number: "", mandi_id: "", party_id: "", date: today(), items: [{ lot_id: "", bags: "" }] });
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const save = async () => {
    if (!form.gatepass_id || !form.vehicle_number || !form.mandi_id || !form.party_id) return;
    await ops.dispatches.addItem({ ...form, id: uid() });
    setShowForm(false);
  };

  const filtered = dispatches.filter(d => d.gatepass_id.toLowerCase().includes(search.toLowerCase()) || d.vehicle_number.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ ...s.rowBetween, marginBottom: 14, gap: 10 }}>
        <input style={s.input} placeholder="🔍 Smart Search Gatepass / Vehicle..." value={search} onChange={e => setSearch(e.target.value)} />
        <button onClick={() => { setForm({ gatepass_id: "", vehicle_number: "", mandi_id: "", party_id: "", date: today(), items: [{ lot_id: "", bags: "" }] }); setShowForm(true); }} style={s.btn()}>+ GP</button>
      </div>

      {filtered.reverse().map(d => (
        <div key={d.id} style={s.card}>
          <div style={s.rowBetween}>
            <span style={s.tag(clr.blue + "15", clr.blue)}>GP: {d.gatepass_id}</span>
            <span style={{ fontSize: 12, color: clr.muted }}>{fmtDate(d.date)}</span>
          </div>
          <div style={{ fontWeight: 700, marginTop: 8 }}>Truck/Vehicle: {d.vehicle_number}</div>
          <div style={{ fontSize: 13, color: clr.muted, marginTop: 2 }}>Mandi: {mandis.find(m => m.id === d.mandi_id)?.name} | Party: {parties.find(p => p.id === d.party_id)?.name}</div>
          <div style={s.divider} />
          {d.items?.map((it, i) => <div key={i} style={{ fontSize: 13, color: clr.text }}>• Loaded Lot <strong>{it.lot_id}</strong> → <strong>{it.bags} Bags</strong></div>)}
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Create Dispatch Memo">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div><div style={s.label}>Manual Gatepass / Chalan Number</div><input style={s.input} placeholder="Enter Physical GP Code" value={form.gatepass_id} onChange={e => setForm({ ...form, gatepass_id: e.target.value })} /></div>
          <div><div style={s.label}>Vehicle Number</div><input style={s.input} placeholder="e.g. UP86T1234" value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} /></div>
          <div><div style={s.label}>Destination Mandi</div><select style={s.select} value={form.mandi_id} onChange={e => setForm({ ...form, mandi_id: e.target.value })}><option value="">Select Mandi</option>{mandis.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
          <div><div style={s.label}>Target Mandi Party / Arhtiya</div><select style={s.select} value={form.party_id} onChange={e => setForm({ ...form, party_id: e.target.value })}><option value="">Select Party</option>{parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          
          <div style={s.card2}>
            <div style={s.label}>Lot Load Allocation Matrix</div>
            {form.items.map((it, idx) => (
              <div key={idx} style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <select style={{ ...s.select, flex: 2 }} value={it.lot_id} onChange={e => setForm({ ...form, items: form.items.map((itx, i) => i === idx ? { ...itx, lot_id: e.target.value } : itx) })}><option value="">Select Lot</option>{purchases.filter(p => !getLotCalculations(p, dispatches, []).isClosed).map(p => <option key={p.id} value={p.lot_id}>{p.lot_id} ({fmt(getLotCalculations(p, dispatches, []).remaining, 1)} left)</option>)}</select>
                <input type="number" style={{ ...s.input, flex: 1 }} placeholder="Bags" value={it.bags} onChange={e => setForm({ ...form, items: form.items.map((itx, i) => i === idx ? { ...itx, bags: e.target.value } : itx) })} />
              </div>
            ))}
          </div>
          <button onClick={save} style={{ ...s.btn(), width: "100%" }}>Save Memo & Release Vehicle</button>
        </div>
      </Modal>
    </div>
  );
};

// --- 4. Sales Screen ---
const SalesScreen = ({ dispatches, sales, parties, mandis, ops }) => {
  const [form, setForm] = useState({ gp_id: "", party_id: "", mandi_id: "", date: today(), lot_sales: [{ lot_id: "", bags: "", total_kg: "", rate: "" }], comm_pct: "4", labor_per_bag: "5", transport_expense: "0", other_expense: "0" });
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const handleGPChange = (gpId) => {
    const gp = dispatches.find(d => d.id === gpId);
    if (gp) {
      const mappedLots = gp.items?.map(it => ({ lot_id: it.lot_id, bags: it.bags, total_kg: (parseFloat(it.bags) * 50).toString(), rate: "" })) || [];
      setForm({ ...form, gp_id: gpId, party_id: gp.party_id, mandi_id: gp.mandi_id, lot_sales: mappedLots });
    }
  };

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

  const filtered = sales.filter(s => parties.find(p => p.id === s.party_id)?.name.toLowerCase().includes(search.toLowerCase()) || s.gp_id.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ ...s.rowBetween, marginBottom: 14, gap: 10 }}>
        <input style={s.input} placeholder="🔍 Smart Search Party / Gatepass..." value={search} onChange={e => setSearch(e.target.value)} />
        <button onClick={() => setShowForm(true)} style={s.btn()}>+ Sale</button>
      </div>

      {filtered.reverse().map(s => (
        <div key={s.id} style={s.card}>
          <div style={s.rowBetween}>
            <span style={{ fontWeight: 800, color: clr.accent }}>👤 {parties.find(p => p.id === s.party_id)?.name}</span>
            <span style={{ fontSize: 12, color: clr.muted }}>{fmtDate(s.date)}</span>
          </div>
          <div style={{ fontSize: 12, color: clr.muted, marginTop: 2 }}>Mandi Hub: {mandis.find(m => m.id === s.mandi_id)?.name}</div>
          <div style={s.divider} />
          {s.lot_sales?.map((l, i) => (
            <div key={i} style={{ ...s.rowBetween, fontSize: 13, marginBottom: 4 }}>
              <span>Lot {l.lot_id} ({l.bags} Bag / <strong style={{ color: clr.blue }}>{fmt(l.total_kg)} KG</strong>)</span>
              <strong>₹{l.rate}/Bag</strong>
            </div>
          ))}
          <div style={s.divider} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", fontSize: 11, color: clr.muted }}>
            <div>Gross Total: ₹{fmt(s.gross_amount)}</div>
            <div>Mandi Comm: ₹{fmt((s.gross_amount * parseFloat(s.comm_pct || 0)) / 100)}</div>
            <div>Labour Cost: ₹{fmt(s.lot_sales?.reduce((sum,l)=>sum+parseFloat(l.bags||0),0)*parseFloat(s.labor_per_bag||0))}</div>
            <div>Freight/Other: ₹{fmt(parseFloat(s.transport_expense||0)+parseFloat(s.other_expense||0))}</div>
          </div>
          <div style={{ ...s.rowBetween, marginTop: 10, background: "rgba(0,230,118,0.1)", padding: 10, borderRadius: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Net Account Receivable:</span>
            <strong style={{ color: clr.green, fontSize: 15 }}>₹{fmt(s.total_amount)}</strong>
          </div>
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Mandi Outward Settlement">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div><div style={s.label}>Link Gatepass File</div><select style={s.select} value={form.gp_id} onChange={e => handleGPChange(e.target.value)}><option value="">Select Document</option>{dispatches.map(d => <option key={d.id} value={d.id}>{d.gatepass_id} ({d.vehicle_number})</option>)}</select></div>
          
          {form.lot_sales.map((l, idx) => (
            <div key={idx} style={s.card2}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Lot Index: {l.lot_id} ({l.bags} Bags Loaded)</div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}><div style={s.label}>Actual Weight (KG)</div><input type="number" style={s.input} value={l.total_kg} onChange={e => setForm({ ...form, lot_sales: form.lot_sales.map((lx, i) => i === idx ? { ...lx, total_kg: e.target.value } : lx) })} /></div>
                <div style={{ flex: 1 }}><div style={s.label}>Selling Rate / Bag</div><input type="number" style={s.input} value={l.rate} onChange={e => setForm({ ...form, lot_sales: form.lot_sales.map((lx, i) => i === idx ? { ...lx, rate: e.target.value } : lx) })} /></div>
              </div>
            </div>
          ))}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div><div style={s.label}>Mandi Comm (%)</div><input type="number" style={s.input} value={form.comm_pct} onChange={e => setForm({ ...form, comm_pct: e.target.value })} /></div>
            <div><div style={s.label}>Labour / Bag</div><input type="number" style={s.input} value={form.labor_per_bag} onChange={e => setForm({ ...form, labor_per_bag: e.target.value })} /></div>
            <div><div style={s.label}>Transport Freight</div><input type="number" style={s.input} value={form.transport_expense} onChange={e => setForm({ ...form, transport_expense: e.target.value })} /></div>
            <div><div style={s.label}>Other Extra Cost</div><input type="number" style={s.input} value={form.other_expense} onChange={e => setForm({ ...form, other_expense: e.target.value })} /></div>
          </div>

          <div style={{ ...s.card2, background: clr.green + "09", marginTop: 4 }}>
            <div style={s.rowBetween}><span style={{ fontSize: 12 }}>Total Sold Weight:</span> <strong>{fmt(totalKg)} KG</strong></div>
            <div style={s.rowBetween}><span style={{ fontSize: 12 }}>Gross Value:</span> <strong>₹{fmt(grossSales)}</strong></div>
            <div style={s.rowBetween}><span style={{ fontSize: 12 }}>Net Ledger Credit:</span> <strong style={{ color: clr.green }}>₹{fmt(finalNetAmt)}</strong></div>
          </div>
          <button onClick={save} style={{ ...s.btn(), width: "100%" }}>Publish Sales Slip</button>
        </div>
      </Modal>
    </div>
  );
};

// --- 5. Payment Screen ---
const PaymentScreen = ({ parties, coldStorages, payments, ops }) => {
  const [form, setForm] = useState({ party_id: "", type: "receivable", amount: "", date: today(), mode: "Cash", notes: "" });
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const save = async () => {
    if (!form.party_id || !form.amount) return;
    await ops.payments.addItem({ ...form, amount: parseFloat(form.amount), id: uid() });
    setShowForm(false);
  };

  const filtered = payments.filter(p => {
    const targetName = parties.find(pa => pa.id === p.party_id)?.name || coldStorages.find(c => c.id === p.party_id)?.name || "";
    return targetName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <div style={{ ...s.rowBetween, marginBottom: 14, gap: 10 }}>
        <input style={s.input} placeholder="🔍 Smart Search Account Ledger..." value={search} onChange={e => setSearch(e.target.value)} />
        <button onClick={() => { setForm({ party_id: "", type: "receivable", amount: "", date: today(), mode: "Cash", notes: "" }); setShowForm(true); }} style={s.btn()}>+ Vouch</button>
      </div>

      {filtered.reverse().map(p => {
        const entityName = parties.find(pa => pa.id === p.party_id)?.name || coldStorages.find(c => c.id === p.party_id)?.name || "Unknown Profile";
        return (
          <div key={p.id} style={s.card}>
            <div style={s.rowBetween}>
              <span style={{ fontWeight: 700 }}>{entityName}</span>
              <span style={{ fontSize: 12, color: clr.muted }}>{fmtDate(p.date)}</span>
            </div>
            <div style={{ ...s.rowBetween, marginTop: 8 }}>
              <span style={s.tag(p.type === "receivable" ? clr.green + "15" : clr.red + "15", p.type === "receivable" ? clr.green : clr.red)}>
                {p.type === "receivable" ? "Inflow (+)" : "Outflow (-)"}
              </span>
              <strong style={{ color: p.type === "receivable" ? clr.green : clr.red, fontSize: 16 }}>₹{fmt(p.amount)}</strong>
            </div>
            {p.notes && <div style={{ fontSize: 12, color: clr.muted, marginTop: 6, background: clr.card2, padding: 6, borderRadius: 4 }}>Memo: {p.notes}</div>}
          </div>
        );
      })}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Post Transaction Cashflow">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={s.label}>Transaction Mode</div>
            <select style={s.select} value={form.type} onChange={e => setForm({ ...form, type: e.target.value, party_id: "" })}><option value="receivable">Received Cash (From Mandi Party)</option><option value="payable">Paid Cash (To Cold Storage Profile)</option></select>
          </div>
          <div>
            <div style={s.label}>Select Ledger Target Account</div>
            <select style={s.select} value={form.party_id} onChange={e => setForm({ ...form, party_id: e.target.value })}><option value="">Select Profile</option>
              {form.type === "receivable" ? parties.map(p => <option key={p.id} value={p.id}>{p.name} (Mandi)</option>) : coldStorages.map(c => <option key={c.id} value={c.id}>{c.name} (Cold Storage)</option>)}
            </select>
          </div>
          <div><div style={s.label}>Transaction Amount (₹)</div><input type="number" style={s.input} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
          <div><div style={s.label}>Payment Medium</div><select style={s.select} value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })}><option value="Cash">Cash</option><option value="Bank/UPI">Bank/UPI</option></select></div>
          <div><div style={s.label}>Narration / Remarks</div><input style={s.input} placeholder="e.g. Cleared bill block" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          <button onClick={save} style={{ ...s.btn(), width: "100%", marginTop: 4 }}>Commit Transaction</button>
        </div>
      </Modal>
    </div>
  );
};

// --- Main Engine ---
export default function App() {
  const [purchases, opsP] = useSupabaseTable("purchases");
  const [dispatches, opsD] = useSupabaseTable("dispatches");
  const [sales, opsS] = useSupabaseTable("sales");
  const [payments, opsM] = useSupabaseTable("payments");
  const [coldStorages] = useSupabaseTable("cold_storages");
  const [mandis] = useSupabaseTable("mandis");
  const [parties] = useSupabaseTable("parties");
  const [currentTab, setCurrentTab] = useState("dashboard");

  const ops = { purchases: opsP, dispatches: opsD, sales: opsS, payments: opsM };

  return (
    <div style={s.screen}>
      <div style={s.header}><h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: clr.accent, letterSpacing: "0.3px" }}>🥔 JSN FARM OS</h2></div>
      
      <div style={s.content}>
        {currentTab === "dashboard" && <IntelligenceDashboard purchases={purchases} dispatches={dispatches} sales={sales} payments={payments} coldStorages={coldStorages} parties={parties} />}
        {currentTab === "purchase" && <PurchaseScreen purchases={purchases} coldStorages={coldStorages} dispatches={dispatches} sales={sales} ops={ops} />}
        {currentTab === "dispatch" && <DispatchScreen purchases={purchases} dispatches={dispatches} mandis={mandis} parties={parties} ops={ops} />}
        {currentTab === "sales" && <SalesScreen dispatches={dispatches} sales={sales} parties={parties} mandis={mandis} ops={ops} />}
        {currentTab === "payment" && <PaymentScreen parties={parties} coldStorages={coldStorages} payments={payments} ops={ops} />}
      </div>

      <div style={s.navBar}>
        <button onClick={() => setCurrentTab("dashboard")} style={s.navItem(currentTab === "dashboard")}><span>Dashboard</span></button>
        <button onClick={() => setCurrentTab("purchase")} style={s.navItem(currentTab === "purchase")}><span>Purchase</span></button>
        <button onClick={() => setCurrentTab("dispatch")} style={s.navItem(currentTab === "dispatch")}><span>Gatepass</span></button>
        <button onClick={() => setCurrentTab("sales")} style={s.navItem(currentTab === "sales")}><span>Sales</span></button>
        <button onClick={() => setCurrentTab("payment")} style={s.navItem(currentTab === "payment")}><span>Ledger</span></button>
      </div>
    </div>
  );
}
