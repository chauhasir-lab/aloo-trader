import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// --- SUPABASE CLIENT SETUP ---
const SUPABASE_URL = "https://cxjmwjljjnuthcrmnbqb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4am13amxqam51dGhjcm1uYnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTYzMzUsImV4cCI6MjA5MjY3MjMzNX0.ynRaceAT1uWcsPOJ_5vY_8NKolM3EaWKQajUEk4sLz8";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- CUSTOM HOOK FOR DATABASE TABLES ---
const useSupabaseTable = (tableName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: rows, error: err } = await supabase.from(tableName).select("*").order("created_at", { ascending: false });
        if (err) { console.error(`❌ FETCH (${tableName}):`, err); return; }
        if (rows && isMounted) setData(rows);
      } catch (e) { console.error(e); }
      finally { if (isMounted) setLoading(false); }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [tableName]);

  const addItem = async (item) => {
    try {
      const { data: d, error: err } = await supabase.from(tableName).insert([{ ...item, created_at: new Date().toISOString() }]).select();
      if (err) { alert(`❌ Error: ${err.message}`); return null; }
      if (d && d.length > 0) {
        setData(prev => [d[0], ...prev]);
        return d[0];
      }
    } catch (e) { alert(`Error: ${e.message}`); }
  };

  const editItem = async (id, updates) => {
    try {
      const { error: err } = await supabase.from(tableName).update(updates).eq("id", id);
      if (err) { alert(`Error: ${err.message}`); return false; }
      setData(prev => prev.map(x => x.id === id ? { ...x, ...updates } : x));
      return true;
    } catch (e) { alert(`Error: ${e.message}`); }
  };

  const deleteItem = async (id) => {
    try {
      const { error: err } = await supabase.from(tableName).delete().eq("id", id);
      if (err) { alert(`Error: ${err.message}`); return false; }
      setData(prev => prev.filter(x => x.id !== id));
      return true;
    } catch (e) { alert(`Error: ${e.message}`); }
  };

  return { data, loading, addItem, editItem, deleteItem };
};

// --- HELPER FUNCTIONS & STYLES ---
const uid = () => Math.random().toString(36).slice(2, 9).toUpperCase();
const fmt = (n, d = 0) => (isNaN(n) || n === null || n === undefined ? "0" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d }));
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
  navBar: { position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", background: clr.card, borderTop: `1px solid ${clr.border}`, display: "flex", overflowX: "auto", zIndex: 200 },
  navItem: (active) => ({ flex: "0 0 20%", display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 2px", gap: 2, background: "none", border: "none", color: active ? clr.accent : clr.muted, fontSize: "11px", cursor: "pointer" }),
  divider: { height: 1, background: clr.border, margin: "10px 0" }
};

const Icon = ({ name, size = 18, color = clr.text }) => {
  const icons = {
    add: "M12 4v16m8-8H4", x: "M6 18L18 6M6 6l12 12", trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    info: "M12 16v-4m0-4h.01M22 12a10 10 0 11-20 0 10 10 0 0120 0z"
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icons[name] || icons.info} /></svg>;
};

const Field = ({ label, children }) => <div style={{ marginBottom: 12 }}><div style={s.label}>{label}</div>{children}</div>;
const Modal = ({ open, onClose, title, children }) => !open ? null : <div style={{ position: "fixed", inset: 0, background: "#000c", zIndex: 1000, display: "flex", alignItems: "flex-end" }}><div style={{ background: clr.card, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "92vh", display: "flex", flexDirection: "column", border: `1px solid ${clr.border}` }}><div style={{ ...s.rowBetween, padding: 14, borderBottom: `1px solid ${clr.border}` }}><span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span><button onClick={onClose} style={s.btnSm()}><Icon name="x" size={14} /></button></div><div style={{ overflowY: "auto", padding: "0 14px 20px" }}>{children}</div></div></div>;

// ===== DISPATCH ANALYTICS SCREEN =====
const DispatchAnalyticsScreen = ({ dispatches = [], parties = [], coldStorages = [], purchases = [], payments = [], coldPayments = [] }) => {
  const partyWiseSummary = parties.map(party => {
    const partyDispatches = dispatches.filter(d => d.destination_party_id === party.id);
    const totalDispatchValue = partyDispatches.reduce((sum, d) => sum + (d.lot_details || []).reduce((s, item) => s + (parseFloat(item.purchase_lot_value) || 0), 0), 0);
    const totalSaleReceived = partyDispatches.reduce((sum, d) => sum + (parseFloat(d.total_mandi_sale_amount) || 0), 0);
    const partyGps = partyDispatches.map(d => d.gatepass_id);
    const totalPaymentsRec = payments.filter(p => partyGps.includes(p.gatepass_id)).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const pendingDue = totalSaleReceived - totalPaymentsRec;

    return { partyId: party.id, partyName: party.name, totalDispatchValue, totalSaleReceived, totalPaymentsRec, pendingDue, dispatchCount: partyDispatches.length };
  }).filter(p => p.dispatchCount > 0 || p.totalDispatchValue > 0);

  const coldWiseSummary = coldStorages.map(cs => {
    let totalColdDispatchValue = 0;
    let totalBagsDispatched = 0;
    let dispatchedGPs = [];

    dispatches.forEach(d => {
      let gpColdValue = 0;
      let gpColdBags = 0;
      (d.lot_details || []).forEach(l => {
        const matchedPurchase = purchases.find(p => p.lot_id === l.lot_number);
        if (matchedPurchase && matchedPurchase.cold_storage_id === cs.id) {
          const val = parseFloat(l.purchase_lot_value) || 0;
          const bags = parseFloat(l.purchase_bags) || 0;
          gpColdValue += val;
          gpColdBags += bags;
          totalColdDispatchValue += val;
          totalBagsDispatched += bags;
        }
      });
      if (gpColdValue > 0) {
        dispatchedGPs.push({ gatepass_id: d.gatepass_id, vehicle_number: d.vehicle_number, date: d.date, bags: gpColdBags, gp_loaded_value: gpColdValue });
      }
    });

    const coldPaidLogs = coldPayments.filter(cp => cp.cold_storage_id === cs.id);
    const totalPaidBack = coldPaidLogs.reduce((sum, cp) => sum + (parseFloat(cp.amount) || 0), 0);
    const duePayable = totalColdDispatchValue - totalPaidBack;

    return { coldId: cs.id, coldName: cs.name, totalColdDispatchValue, totalBagsDispatched, dispatchedGPs, totalPaidBack, duePayable };
  }).filter(c => c.totalColdDispatchValue > 0 || c.totalPaidBack > 0 || c.dispatchedGPs.length > 0);

  const grandDispatchValue = partyWiseSummary.reduce((sum, p) => sum + p.totalDispatchValue, 0);
  const grandSaleReceived = partyWiseSummary.reduce((sum, p) => sum + p.totalSaleReceived, 0);

  return (
    <div style={s.content}>
      <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 12, color: clr.accent }}>🚚 Dispatch Value & Settlements Summary</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        <div style={{ ...s.card2, background: clr.blue + "18", border: `1px solid ${clr.blue}` }}>
          <div style={s.label}>Total GP Dispatch Value</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: clr.blue }}>₹{fmt(grandDispatchValue)}</div>
        </div>
        <div style={{ ...s.card2, background: clr.green + "18", border: `1px solid ${clr.green}` }}>
          <div style={s.label}>Total Sale Recieved</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: clr.green }}>₹{fmt(grandSaleReceived)}</div>
        </div>
      </div>

      <div style={{ ...s.label, fontSize: "13px", color: clr.text, marginBottom: 8, textTransform: "none" }}>🏢 Party-Wise Dispatch & Payment Status</div>
      {partyWiseSummary.map(p => (
        <div key={p.partyId} style={{ ...s.card, borderLeft: `4px solid ${clr.purple}` }}>
          <div style={s.rowBetween}>
            <span style={{ fontWeight: 800, fontSize: 16 }}>{p.partyName}</span>
            <Badge v={`${p.dispatchCount} Trucks`} color={clr.purple} />
          </div>
          <div style={s.divider} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
            <div><span style={{ color: clr.muted, fontSize: 11 }}>GP DISPATCHED COST VALUE</span><div style={{ fontWeight: 700, color: clr.blue }}>₹{fmt(p.totalDispatchValue)}</div></div>
            <div><span style={{ color: clr.muted, fontSize: 11 }}>TOTAL SALE RECEIVED</span><div style={{ fontWeight: 700, color: clr.green }}>₹{fmt(p.totalSaleReceived)}</div></div>
            <div><span style={{ color: clr.muted, fontSize: 11 }}>CASH RECEIVED</span><div>₹{fmt(p.totalPaymentsRec)}</div></div>
            <div><span style={{ color: clr.muted, fontSize: 11 }}>PENDING PAYMENT DUE</span><div style={{ fontWeight: 800, color: p.pendingDue > 0 ? clr.red : clr.green }}>₹{fmt(p.pendingDue)}</div></div>
          </div>
        </div>
      ))}

      <div style={{ ...s.label, fontSize: "13px", color: clr.text, margin: "16px 0 8px 0", textTransform: "none" }}>❄️ Cold Storage-Wise GP Dispatch & Payback Ledger</div>
      {coldWiseSummary.map(c => (
        <div key={c.coldId} style={{ ...s.card, borderLeft: `4px solid ${clr.orange}` }}>
          <div style={s.rowBetween}>
            <span style={{ fontWeight: 800, fontSize: 15 }}>{c.coldName}</span>
            <span style={{ fontSize: 12, color: clr.muted }}>{c.totalBagsDispatched} Bags Out</span>
          </div>
          <div style={s.divider} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
            <div><span style={{ color: clr.muted, fontSize: 11 }}>COLD DISPATCH LOADED VALUE</span><div style={{ fontWeight: 700, color: clr.orange }}>₹{fmt(c.totalColdDispatchValue)}</div></div>
            <div><span style={{ color: clr.muted, fontSize: 11 }}>PAID BACK TO COLD</span><div style={{ fontWeight: 700, color: clr.green }}>₹{fmt(c.totalPaidBack)}</div></div>
            <div style={{ gridColumn: "1 / span 2" }}>
              <span style={{ color: clr.muted, fontSize: 11 }}>REMAINING DUE TO PAY:</span>
              <strong style={{ color: c.duePayable > 0 ? clr.red : clr.green, marginLeft: 6 }}>₹{fmt(c.duePayable)}</strong>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ===== DASHBOARD SCREEN =====
const DashboardScreen = ({ purchases = [], dispatches = [], payments = [], varieties = [], gradings = [], coldStorages = [], parties = [], mandis = [] }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDetail, setSelectedDetail] = useState(null);

  const totalBagsPurchased = purchases.reduce((sum, p) => sum + (parseInt(p.manual_bags) || 0), 0);
  const totalBagsRemaining = purchases.reduce((sum, p) => sum + getRemainingBags(p, dispatches), 0);
  const totalBagsDispatched = dispatches.flatMap(d => d.lot_details || []).reduce((sum, item) => sum + (parseInt(item.purchase_bags) || 0), 0);

  const activeLots = purchases.filter(p => getRemainingBags(p, dispatches) > 0).length;
  const closedLots = purchases.filter(p => getRemainingBags(p, dispatches) <= 0).length;

  const totalSaleValue = dispatches.reduce((sum, d) => sum + (parseFloat(d.total_mandi_sale_amount) || 0), 0);
  const totalPaymentsReceived = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const pendingDue = totalSaleValue - totalPaymentsReceived;

  const soldDispatches = dispatches.filter(d => (d.total_mandi_sale_amount || 0) > 0);
  const totalSoldPurchaseCost = soldDispatches.reduce((sum, d) => sum + ((d.lot_details || []).reduce((s, item) => s + (parseFloat(item.purchase_lot_value) || 0), 0)), 0);
  const totalMandiRevenue = soldDispatches.reduce((sum, d) => sum + (parseFloat(d.total_mandi_sale_amount) || 0), 0);
  const totalMandiExpenses = soldDispatches.reduce((sum, d) => sum + (parseFloat(d.total_expenses) || 0), 0);
  const dynamicNetProfit = totalMandiRevenue - totalSoldPurchaseCost - totalMandiExpenses;

  const q = searchQuery.trim().toLowerCase();
  const filteredPurchases = q === "" ? [] : purchases.filter(p => p.lot_id?.toLowerCase().includes(q) || p.farmer_name?.toLowerCase().includes(q));
  const filteredDispatches = q === "" ? [] : dispatches.filter(d => d.gatepass_id?.toLowerCase().includes(q) || (d.lot_details || []).some(l => l.lot_number?.toLowerCase().includes(q)));

  const openFullLifecycle = (type, item) => {
    let matchedPurchases = [];
    let matchedDispatches = [];
    if (type === "purchase") {
      matchedPurchases = [item];
      matchedDispatches = dispatches.filter(d => (d.lot_details || []).some(l => l.lot_number === item.lot_id));
    } else if (type === "dispatch") {
      matchedDispatches = [item];
      const lotIdsInDispatch = (item.lot_details || []).map(l => l.lot_number);
      matchedPurchases = purchases.filter(p => lotIdsInDispatch.includes(p.lot_id));
    }
    setSelectedDetail({ type, primary: item, purchases: matchedPurchases, dispatches: matchedDispatches });
  };

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
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
        <div style={{ ...s.card2, background: clr.accent + "15" }}><div style={s.label}>Purchased</div><div style={{ fontSize: 15, fontWeight: 800, color: clr.accent }}>{totalBagsPurchased} Bags</div></div>
        <div style={{ ...s.card2, background: clr.blue + "15" }}><div style={s.label}>Dispatched</div><div style={{ fontSize: 15, fontWeight: 800, color: clr.blue }}>{totalBagsDispatched} Bags</div></div>
        <div style={{ ...s.card2, background: clr.green + "15" }}><div style={s.label}>Remaining</div><div style={{ fontSize: 15, fontWeight: 800, color: clr.green }}>{totalBagsRemaining} Bags</div></div>
      </div>

      <div style={{ ...s.card, marginBottom: 12 }}>
        <div style={s.label}>🔍 Smart Search (Lot ID / GP Number / Farmer Name)</div>
        <input style={{ ...s.input, marginTop: 6 }} placeholder="Search Lot, GP No, Farmer Name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        {q !== "" && (
          <div style={{ marginTop: 10, maxHeight: 250, overflowY: "auto" }}>
            {filteredPurchases.map(p => (
              <div key={p.id} onClick={() => openFullLifecycle("purchase", p)} style={{ background: clr.card2, padding: 10, borderRadius: 8, marginBottom: 6, fontSize: 13, cursor: "pointer" }}>
                <span style={{ color: clr.accent, fontWeight: 700 }}>📥 Lot: {p.lot_id}</span> — {p.farmer_name}
              </div>
            ))}
            {filteredDispatches.map(d => (
              <div key={d.id} onClick={() => openFullLifecycle("dispatch", d)} style={{ background: clr.card2, padding: 10, borderRadius: 8, marginBottom: 6, fontSize: 13, cursor: "pointer" }}>
                <span style={{ color: clr.blue, fontWeight: 700 }}>📤 GP: {d.gatepass_id}</span> — {d.vehicle_number}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={!!selectedDetail} onClose={() => setSelectedDetail(null)} title="🔍 Complete Batch Lifecycle Journey">
        {selectedDetail && (
          <div style={{ fontSize: 14 }}>
            <div style={{ ...s.card2, borderLeft: `4px solid ${clr.accent}`, marginBottom: 10 }}>
              <div style={{ fontWeight: 800, color: clr.accent, marginBottom: 6 }}>📥 PURCHASE DETAILS</div>
              {selectedDetail.purchases.map(p => (
                <div key={p.id} style={{ fontSize: 13 }}>• <strong>Lot ID:</strong> {p.lot_id} | <strong>Farmer:</strong> {p.farmer_name} | <strong>Cost:</strong> ₹{fmt(p.total_cost)}</div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ===== PURCHASE SCREEN =====
const PurchaseScreen = ({ purchases, dispatches, opsP, varieties, gradings, coldStorages }) => {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ lot_id: "", farmer_name: "", manual_bags: "", total_weight: "", rate_per_bag: "", variety_id: "", grading_id: "", cold_storage_id: "", date: today() });

  const save = async () => {
    if (!form.lot_id || !form.farmer_name || !form.manual_bags || !form.rate_per_bag || !form.total_weight) return alert("❌ Fill required fields!");
    const totWt = parseFloat(form.total_weight) || 0;
    const rateBag = parseFloat(form.rate_per_bag) || 0;
    const stdBags = totWt / 52.5;
    const currentTotalCost = stdBags * rateBag;
    const payload = { ...form, std_bags: stdBags.toFixed(2), total_cost: currentTotalCost };

    if (editItem) {
      if (await opsP.editItem(editItem.id, payload)) { setShowForm(false); setEditItem(null); }
    } else {
      if (await opsP.addItem({ id: uid(), ...payload })) setShowForm(false);
    }
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 14 }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>Purchase Book</span>
        <button onClick={() => { setEditItem(null); setForm({ lot_id: "", farmer_name: "", manual_bags: "", total_weight: "", rate_per_bag: "", variety_id: "", grading_id: "", cold_storage_id: "", date: today() }); setShowForm(true); }} style={s.btn(clr.accent, "#000")}><Icon name="add" size={14} /> Add New</button>
      </div>
      {purchases.map(p => (
        <div key={p.id} style={{ ...s.card, borderLeft: `4px solid ${clr.green}` }}>
          <div style={s.rowBetween}><strong>Lot: {p.lot_id}</strong><span style={{ fontSize: 12, color: clr.muted }}>{p.date}</span></div>
          <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{p.farmer_name}</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Bags: {p.manual_bags} | Total Cost: ₹{fmt(p.total_cost)}</div>
        </div>
      ))}
    </div>
  );
};

// ===== DISPATCH LOGISTICS =====
const DispatchScreen = ({ dispatches, purchases, opsD, parties, mandis, varieties, gradings }) => {
  return (
    <div style={s.content}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Dispatches</div>
      {dispatches.map(d => (
        <div key={d.id} style={s.card}>
          <div style={s.rowBetween}><Badge v={`GP: ${d.gatepass_id}`} color={clr.blue} /><strong>{d.vehicle_number}</strong></div>
        </div>
      ))}
    </div>
  );
};

// ===== MANDI SALE SCREEN =====
const SaleScreen = ({ dispatches, opsD }) => {
  return (
    <div style={s.content}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Mandi Sales Book</div>
      {dispatches.filter(d => (d.total_mandi_sale_amount || 0) > 0).map(sx => (
        <div key={sx.id} style={s.card}>
          <div style={s.rowBetween}><Badge v={`GP: ${sx.gatepass_id}`} color={clr.green} /><strong>Sale: ₹{fmt(sx.total_mandi_sale_amount)}</strong></div>
        </div>
      ))}
    </div>
  );
};

// ===== FINANCIAL PAYMENTS =====
const PaymentScreen = ({ dispatches, payments, opsPayment, parties }) => {
  return (
    <div style={s.content}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Party Payments</div>
      {payments.map(py => (
        <div key={py.id} style={s.card}>
          <div style={s.rowBetween}><span>GP: {py.gatepass_id}</span><strong style={{ color: clr.green }}>₹{fmt(py.amount)}</strong></div>
        </div>
      ))}
    </div>
  );
};

// ===== COLD STORAGE DUE & HISTORY =====
const ColdStorageDueScreen = ({ purchases, dispatches, coldStorages, coldPayments, opsColdPayment }) => {
  return (
    <div style={s.content}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Cold Storage Outstandings</div>
      {coldStorages.map(cs => (
        <div key={cs.id} style={s.card}>
          <div style={s.rowBetween}><span>{cs.name}</span></div>
        </div>
      ))}
    </div>
  );
};

// ===== PROFIT REALIZATION REPORT =====
const PnLScreen = ({ dispatches = [], parties = [], mandis = [] }) => {
  return (
    <div style={s.content}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>Realized Profit & Loss Statements</div>
      {dispatches.filter(d => (d.total_mandi_sale_amount || 0) > 0).map(sale => {
        const partyName = parties.find(p => p.id === sale.destination_party_id)?.name || "Unknown";
        const mandiName = mandis.find(m => m.id === sale.mandi_id)?.name || "Unknown";
        const totalPurchaseCost = (sale.lot_details || []).reduce((s, item) => s + (parseFloat(item.purchase_lot_value) || 0), 0);
        const currentExp = parseFloat(sale.total_expenses) || 0;
        const netMargin = sale.total_mandi_sale_amount - totalPurchaseCost - currentExp;

        return (
          <div key={sale.id} style={{ ...s.card, borderLeft: `4px solid ${clr.blue}` }}>
            <div style={s.rowBetween}>
              <Badge v={`GP: ${sale.gatepass_id}`} color={clr.blue} />
              <strong style={{ color: clr.green, fontSize: 14 }}>{mandiName}</strong>
            </div>
            <div style={{ fontSize: 13, color: clr.muted, marginTop: 4 }}>Party Reference: <strong>{partyName}</strong></div>
            <div style={s.divider} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 13 }}>
              <div>Sale Revenue: <strong style={{ color: clr.green }}>₹{fmt(sale.total_mandi_sale_amount)}</strong></div>
              <div>Purchase Cost: <strong>₹{fmt(totalPurchaseCost)}</strong></div>
              <div>Mandi Expenses: <strong style={{ color: clr.orange }}>₹{fmt(currentExp)}</strong></div>
              <div>Net Margin: <strong style={{ color: netMargin >= 0 ? clr.green : clr.red }}>₹{fmt(netMargin)}</strong></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ===== MAIN ROOT APP COMPONENT =====
export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const purchasesState = useSupabaseTable("purchases");
  const dispatchesState = useSupabaseTable("dispatches");
  const paymentsState = useSupabaseTable("payments");
  const partiesState = useSupabaseTable("parties");
  const mandisState = useSupabaseTable("mandis");
  const varietiesState = useSupabaseTable("varieties");
  const gradingsState = useSupabaseTable("gradings");
  const coldStoragesState = useSupabaseTable("cold_storages");
  const coldPaymentsState = useSupabaseTable("cold_payments");

  return (
    <div style={s.screen}>
      <div style={s.header}>
        <div style={{ fontWeight: 900, fontSize: 18, color: clr.accent }}>🥔 Cold Storage & Mandi Portal</div>
      </div>

      {activeTab === "dashboard" && (
        <DashboardScreen 
          purchases={purchasesState.data}
          dispatches={dispatchesState.data}
          payments={paymentsState.data}
          varieties={varietiesState.data}
          gradings={gradingsState.data}
          coldStorages={coldStoragesState.data}
          parties={partiesState.data}
          mandis={mandisState.data}
        />
      )}

      {activeTab === "purchases" && (
        <PurchaseScreen 
          purchases={purchasesState.data}
          dispatches={dispatchesState.data}
          opsP={purchasesState}
          varieties={varietiesState.data}
          gradings={gradingsState.data}
          coldStorages={coldStoragesState.data}
        />
      )}

      {activeTab === "dispatches" && (
        <DispatchScreen 
          dispatches={dispatchesState.data}
          purchases={purchasesState.data}
          opsD={dispatchesState}
          parties={partiesState.data}
          mandis={mandisState.data}
          varieties={varietiesState.data}
          gradings={gradingsState.data}
        />
      )}

      {activeTab === "sales" && (
        <SaleScreen 
          dispatches={dispatchesState.data}
          opsD={dispatchesState}
        />
      )}

      {activeTab === "payments" && (
        <PaymentScreen 
          dispatches={dispatchesState.data}
          payments={paymentsState.data}
          opsPayment={paymentsState}
          parties={partiesState.data}
        />
      )}

      {activeTab === "cold_due" && (
        <ColdStorageDueScreen 
          purchases={purchasesState.data}
          dispatches={dispatchesState.data}
          coldStorages={coldStoragesState.data}
          coldPayments={coldPaymentsState.data}
          opsColdPayment={coldPaymentsState}
        />
      )}

      {activeTab === "pnl" && (
        <PnLScreen 
          dispatches={dispatchesState.data}
          parties={partiesState.data}
          mandis={mandisState.data}
        />
      )}

      {activeTab === "analytics" && (
        <DispatchAnalyticsScreen 
          dispatches={dispatchesState.data}
          parties={partiesState.data}
          coldStorages={coldStoragesState.data}
          purchases={purchasesState.data}
          payments={paymentsState.data}
          coldPayments={coldPaymentsState.data}
        />
      )}

      {/* FULL NAVIGATION BAR */}
      <div style={s.navBar}>
        <button style={s.navItem(activeTab === "dashboard")} onClick={() => setActiveTab("dashboard")}>📊 <span>Dash</span></button>
        <button style={s.navItem(activeTab === "purchases")} onClick={() => setActiveTab("purchases")}>📥 <span>Buy</span></button>
        <button style={s.navItem(activeTab === "dispatches")} onClick={() => setActiveTab("dispatches")}>🚚 <span>Dispatch</span></button>
        <button style={s.navItem(activeTab === "sales")} onClick={() => setActiveTab("sales")}>💰 <span>Sale</span></button>
        <button style={s.navItem(activeTab === "payments")} onClick={() => setActiveTab("payments")}>💳 <span>Party</span></button>
        <button style={s.navItem(activeTab === "cold_due")} onClick={() => setActiveTab("cold_due")}>❄️ <span>Cold</span></button>
        <button style={s.navItem(activeTab === "pnl")} onClick={() => setActiveTab("pnl")}>📈 <span>PnL</span></button>
        <button style={s.navItem(activeTab === "analytics")} onClick={() => setActiveTab("analytics")}>🧾 <span>Analytics</span></button>
      </div>
    </div>
  );
}
