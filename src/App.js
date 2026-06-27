import { useState, useCallback, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

// --- CLIENT AUTH CONFIGURATION ---
const SUPABASE_URL = "https://cxjmwjljjnuthcrmnbqb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4am13amxqam51dGhjcm1uYnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTYzMzUsImV4cCI6MjA5MjY3MjMzNX0.ynRaceAT1uWcsPOJ_5vY_8NKolM3EaWKQajUEk4sLz8";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- REACTOR DATABASE HOOK ---
const useSupabaseTable = (tableName, defaultValue = []) => {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
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
  }, [tableName]);

  useEffect(() => { refreshData(); }, [refreshData]);

  const addItem = useCallback(async (item) => {
    const { created_at, ...rest } = item;
    const { data: inserted, error } = await supabase.from(tableName).insert([{ ...rest }]).select();
    if (!error && inserted) {
      setData(p => [...p, inserted[0]]);
      return inserted[0];
    }
    return null;
  }, [tableName]);

  return [data, { addItem, refreshData, loading }];
};

// --- SYSTEM UTILS ---
const uid = () => Math.random().toString(36).slice(2, 7).toUpperCase();
const fmt = (n) => (isNaN(n) || n === null || n === undefined ? "0" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 }));
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB") : "-";
const today = () => new Date().toISOString().slice(0, 10);

// --- DESIGN SYSTEM (DARK ENTERPRISE GRID) ---
const clr = { bg: "#090b11", card: "#111420", card2: "#191d30", accent: "#ffd700", green: "#00e676", red: "#ff5252", blue: "#29b6f6", purple: "#b388ff", muted: "#788699", border: "#22283d", text: "#f5f7fa" };

const s = {
  screen: { minHeight: "100vh", background: clr.bg, color: clr.text, fontFamily: "system-ui, sans-serif", maxWidth: 480, margin: "0 auto", position: "relative", boxSizing: "border-box" },
  header: { background: clr.card, padding: "16px", borderBottom: `1px solid ${clr.border}`, position: "sticky", top: 0, zIndex: 100 },
  card: { background: clr.card, borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${clr.border}`, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" },
  card2: { background: clr.card2, borderRadius: 8, padding: 12, marginBottom: 8, border: `1px solid ${clr.border}` },
  rowBetween: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  input: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 8, padding: "12px", color: clr.text, fontSize: 14, boxSizing: "border-box", outline: "none", transition: "border 0.2s" },
  select: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 8, padding: "12px", color: clr.text, fontSize: 14, boxSizing: "border-box", outline: "none" },
  label: { fontSize: 11, color: clr.muted, marginBottom: 5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" },
  btn: (bg = clr.accent, txt = "#000") => ({ background: bg, color: txt, border: "none", borderRadius: 8, padding: "12px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }),
  btnSm: (bg = clr.card2, txt = clr.text) => ({ background: bg, color: txt, border: `1px solid ${clr.border}`, borderRadius: 6, padding: "6px 12px", fontWeight: 600, fontSize: 12, cursor: "pointer" }),
  tag: (bg = clr.accent + "15", txt = clr.accent) => ({ background: bg, color: txt, borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700 }),
  content: { padding: 16, paddingBottom: 110 },
  navBar: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: clr.card, borderTop: `1px solid ${clr.border}`, display: "flex", zIndex: 200, paddingBottom: "env(safe-area-inset-bottom)" },
  navItem: (active) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 2px", gap: 4, background: "none", border: "none", color: active ? clr.accent : clr.muted, fontSize: 11, fontWeight: active ? 700 : 500, cursor: "pointer" }),
  divider: { height: 1, background: clr.border, margin: "12px 0" }
};

const Modal = ({ open, onClose, title, children }) => !open ? null : (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "flex-end" }}>
    <div style={{ background: clr.card, borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 480, maxHeight: "85vh", display: "flex", flexDirection: "column", borderTop: `1px solid ${clr.border}`, margin: "0 auto" }}>
      <div style={{ ...s.rowBetween, padding: 16, borderBottom: `1px solid ${clr.border}` }}><span style={{ fontWeight: 800, fontSize: 16 }}>{title}</span><button onClick={onClose} style={s.btnSm()}>Close</button></div>
      <div style={{ overflowY: "auto", padding: "16px 16px 32px", boxSizing: "border-box" }}>{children}</div>
    </div>
  </div>
);

// --- INVENTORY LOGIC PROCESSOR ---
const processLotState = (lot, dispatches = []) => {
  const totalDispatched = dispatches
    .filter(d => d.lot_id === lot.lot_number)
    .reduce((sum, d) => sum + parseFloat(d.dispatched_bags || 0), 0);
  
  const stdBags = parseFloat(lot.std_bags || 0);
  const balance = stdBags - totalDispatched;
  
  let status = "ACTIVE";
  if (balance <= 0) status = "CLOSED";
  else if (totalDispatched > 0) status = "PARTIAL";

  return { totalDispatched, balance, status };
};

// --- MODULE 1: GENUINE REVENUE DASHBOARD & GLOBAL SEARCH ---
const IntelligenceDashboard = ({ purchases, dispatches, sales, payments, coldStorages, parties, onSearchTrigger }) => {
  const [masterSearch, setMasterSearch] = useState("");

  const metrics = useMemo(() => {
    let totalPur = 0; let activeCount = 0; let closedCount = 0;
    let grossSales = 0; let totalExpenses = 0;

    purchases.forEach(p => {
      totalPur += parseFloat(p.purchase_amount || 0);
      const state = processLotState(p, dispatches);
      if (state.status === "CLOSED") closedCount++; else activeCount++;
    });

    dispatches.forEach(d => {
      grossSales += parseFloat(d.gross_sale_value || 0);
      totalExpenses += parseFloat(d.commission || 0) + 
                       parseFloat(d.labor_charges || 0) + 
                       parseFloat(d.transport_charges || 0) + 
                       parseFloat(d.mandi_charges || 0) + 
                       parseFloat(d.hamali || 0) + 
                       parseFloat(d.other_expenses || 0);
    });

    const netSales = grossSales - totalExpenses;
    const netProfit = netSales - totalPur;

    // Financial Outstanding Calculations
    const totalColdPaid = payments.filter(p => p.type === "payable").reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const totalPartyRecv = payments.filter(p => p.type === "receivable").reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    const coldPayableDues = totalPur - totalColdPaid;
    const partyReceivableDues = grossSales - totalPartyRecv;

    const totalBagsPurchased = purchases.reduce((sum, p) => sum + parseFloat(p.std_bags || 0), 0);
    const totalBagsDispatched = dispatches.reduce((sum, d) => sum + parseFloat(d.dispatched_bags || 0), 0);

    return {
      totalPur, grossSales, netProfit, coldPayableDues, partyReceivableDues,
      activeCount, closedCount, totalBagsPurchased, totalBagsDispatched,
      balanceBags: totalBagsPurchased - totalBagsDispatched
    };
  }, [purchases, dispatches, payments]);

  // Master Engine Search Handler
  const searchResults = useMemo(() => {
    if (!masterSearch.trim()) return null;
    const token = masterSearch.toLowerCase();
    const res = [];

    purchases.forEach(p => {
      if (p.lot_number.toLowerCase().includes(token) || (p.farmer_name && p.farmer_name.toLowerCase().includes(token))) {
        res.push({ type: "Lot/Farmer", label: p.lot_number, sub: `Farmer: ${p.farmer_name || "N/A"} | Val: ₹${fmt(p.purchase_amount)}` });
      }
    });

    dispatches.forEach(d => {
      if (d.gatepass_number.toLowerCase().includes(token) || d.vehicle_number.toLowerCase().includes(token)) {
        res.push({ type: "Dispatch/Vehicle", label: `GP: ${d.gatepass_number}`, sub: `Vehicle: ${d.vehicle_number} | Bags: ${d.dispatched_bags}` });
      }
    });

    coldStorages.forEach(c => {
      if (c.name.toLowerCase().includes(token)) res.push({ type: "Cold Storage", label: c.name, sub: "View Outstandings in Ledgers" });
    });

    parties.forEach(p => {
      if (p.name.toLowerCase().includes(token)) res.push({ type: "Mandi Party", label: p.name, sub: "Check outstanding pipeline" });
    });

    return res;
  }, [masterSearch, purchases, dispatches, coldStorages, parties]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <input style={s.input} placeholder="🔍 Smart Search anything (Lot, GP, Truck, Cold, Party)..." value={masterSearch} onChange={e => setMasterSearch(e.target.value)} />
        {searchResults && (
          <div style={{ background: clr.card, borderRadius: 8, padding: 8, marginTop: 6, border: `1px solid ${clr.border}`, maxHeight: 200, overflowY: "auto" }}>
            {searchResults.length === 0 ? <div style={{ padding: 6, fontSize: 13, color: clr.muted }}>No records match query string.</div> : 
              searchResults.map((r, i) => (
                <div key={i} style={{ ...s.card2, margin: "4px 0", padding: 8, cursor: "pointer" }}>
                  <div style={s.rowBetween}><span style={{ fontWeight: 700, fontSize: 13 }}>{r.label}</span><span style={s.tag(clr.blue+"15", clr.blue)}>{r.type}</span></div>
                  <div style={{ fontSize: 11, color: clr.muted, marginTop: 2 }}>{r.sub}</div>
                </div>
              ))
            }
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={s.card2}><div style={s.label}>Total Purchases</div><div style={{ fontSize: 16, fontWeight: 800 }}>₹{fmt(metrics.totalPur)}</div></div>
        <div style={s.card2}><div style={s.label}>Total Gross Sales</div><div style={{ fontSize: 16, fontWeight: 800 }}>₹{fmt(metrics.grossSales)}</div></div>
      </div>

      <div style={{ ...s.card, background: "linear-gradient(135deg, #111420, #191d30)", borderLeft: `5px solid ${metrics.netProfit >= 0 ? clr.green : clr.red}` }}>
        <div style={s.label}>Net Clean Profit Engine</div>
        <div style={{ fontSize: 26, fontWeight: 900, color: metrics.netProfit >= 0 ? clr.green : clr.red }}>₹{fmt(metrics.netProfit)}</div>
        <div style={{ fontSize: 11, color: clr.muted, marginTop: 4 }}>After deducting Mandi Comm, Labour, Freight & Surcharges</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ ...s.card2, borderLeft: `3px solid ${clr.red}` }}><div style={s.label}>Cold Storage Payable</div><div style={{ fontSize: 16, fontWeight: 800, color: clr.red }}>₹{fmt(metrics.coldPayableDues)}</div></div>
        <div style={{ ...s.card2, borderLeft: `3px solid ${clr.green}` }}><div style={s.label}>Party Receivables</div><div style={{ fontSize: 16, fontWeight: 800, color: clr.green }}>₹{fmt(metrics.partyReceivableDues)}</div></div>
      </div>

      <div style={s.card}>
        <div style={{ ...s.label, marginBottom: 8 }}>Ecosystem Lots & Stock Status</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, textAlign: "center" }}>
          <div style={{ background: clr.bg, padding: 8, borderRadius: 6 }}><div style={{ fontSize: 16, fontWeight: 800, color: clr.accent }}>{metrics.activeCount}</div><div style={{ fontSize: 10, color: clr.muted }}>Active Lots</div></div>
          <div style={{ background: clr.bg, padding: 8, borderRadius: 6 }}><div style={{ fontSize: 16, fontWeight: 800, color: clr.muted }}>{metrics.closedCount}</div><div style={{ fontSize: 10, color: clr.muted }}>Closed Lots</div></div>
        </div>
        <div style={{ ...s.rowBetween, marginTop: 12, fontSize: 12, padding: "0 4px" }}>
          <span>Total Stocks: <strong>{metrics.totalBagsPurchased} Bag</strong></span>
          <span>Dispatched: <strong>{metrics.totalBagsDispatched} Bag</strong></span>
          <span>Balance: <strong style={{ color: clr.accent }}>{metrics.balanceBags} Bag</strong></span>
        </div>
      </div>
    </div>
  );
};

// --- MODULE 2: RE-ENGINEERED PURCHASE SCREEN (ACCOUNTS TO COLD) ---
const PurchaseScreen = ({ purchases, coldStorages, ops, dispatches }) => {
  const [form, setForm] = useState({ lot_number: "", farmer_name: "", cold_storage_id: "", variety: "", total_weight_kg: "", purchase_rate_per_bag: "" });
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const calculatedBags = form.total_weight_kg ? Math.round(parseFloat(form.total_weight_kg) / 52.5) : 0;
  const totalPurchaseBill = calculatedBags * (parseFloat(form.purchase_rate_per_bag) || 0);

  const save = async () => {
    if (!form.lot_number || !form.cold_storage_id || !form.total_weight_kg || !form.purchase_rate_per_bag) return;
    await ops.purchases.addItem({
      ...form,
      std_bags: calculatedBags,
      balance_bags: calculatedBags,
      purchase_amount: totalPurchaseBill,
      status: "ACTIVE"
    });
    setShowForm(false);
    setForm({ lot_number: "", farmer_name: "", cold_storage_id: "", variety: "", total_weight_kg: "", purchase_rate_per_bag: "" });
  };

  const filtered = purchases.filter(p => p.lot_number.toLowerCase().includes(search.toLowerCase()) || (p.farmer_name && p.farmer_name.toLowerCase().includes(search.toLowerCase())));

  return (
    <div>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <input style={{ ...s.input, width: "70%" }} placeholder="🔍 Filter Lots..." value={search} onChange={e => setSearch(e.target.value)} />
        <button onClick={() => setShowForm(true)} style={s.btn()}><span style={{ fontSize: 16 }}>+</span> Buy Lot</button>
      </div>

      {filtered.reverse().map(p => {
        const liveState = processLotState(p, dispatches);
        const coldName = coldStorages.find(c => c.id === p.cold_storage_id)?.name || "Cold Storage";
        return (
          <div key={p.id} style={s.card}>
            <div style={s.rowBetween}>
              <span style={{ fontWeight: 800, fontSize: 15, color: clr.accent }}>{p.lot_number}</span>
              <span style={s.tag(liveState.status === "CLOSED" ? clr.muted+"22" : clr.green+"22", liveState.status === "CLOSED" ? clr.muted : clr.green)}>{liveState.status}</span>
            </div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Ref Farmer: <strong>{p.farmer_name || "N/A"}</strong></div>
            <div style={{ fontSize: 12, color: clr.purple, fontWeight: 600 }}>Debited Account Holder: {coldName}</div>
            <div style={s.divider} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 12 }}>
              <div>Raw Wt: <strong>{p.total_weight_kg} KG</strong></div>
              <div>Calculated Standard Bags: <strong>{p.std_bags}</strong></div>
              <div>Remaining Stocks: <strong style={{ color: clr.blue }}>{liveState.balance} Bags</strong></div>
            </div>
            <div style={{ ...s.rowBetween, marginTop: 10, background: clr.card2, padding: 8, borderRadius: 6 }}>
              <span style={{ fontSize: 12 }}>Rate: ₹{p.purchase_rate_per_bag}/Bag</span>
              <span style={{ fontWeight: 800, color: clr.red }}>₹{fmt(p.purchase_amount)}</span>
            </div>
          </div>
        );
      })}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Create Primary Inward Purchase">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div><div style={s.label}>Lot Number / Identity Mark</div><input style={s.input} value={form.lot_number} onChange={e => setForm({ ...form, lot_number: e.target.value })} /></div>
          <div><div style={s.label}>Farmer Name (Reference Only)</div><input style={s.input} value={form.farmer_name} onChange={e => setForm({ ...form, farmer_name: e.target.value })} /></div>
          <div><div style={s.label}>Potato Variety</div><input style={s.input} placeholder="E.g., 3797, Kufri" value={form.variety} onChange={e => setForm({ ...form, variety: e.target.value })} /></div>
          <div><div style={s.label}>Total Weight (KG)</div><input type="number" style={s.input} value={form.total_weight_kg} onChange={e => setForm({ ...form, total_weight_kg: e.target.value })} /></div>
          <div><div style={s.label}>Purchase Rate (Per 52.5KG Standard Bag)</div><input type="number" style={s.input} value={form.purchase_rate_per_bag} onChange={e => setForm({ ...form, purchase_rate_per_bag: e.target.value })} /></div>
          <div>
            <div style={s.label}>Creditor Cold Storage Profile</div>
            <select style={s.select} value={form.cold_storage_id} onChange={e => setForm({ ...form, cold_storage_id: e.target.value })}><option value="">Select Target Storage</option>{coldStorages.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </div>
          <div style={{ ...s.card2, background: "rgba(255,215,0,0.06)", marginTop: 6 }}>
            <div style={s.rowBetween}><span>Auto Computed Standard Bags:</span> <strong>{calculatedBags} Bag</strong></div>
            <div style={s.rowBetween}><span>Liability Addition to Cold:</span> <strong style={{ color: clr.red }}>₹{fmt(totalPurchaseBill)}</strong></div>
          </div>
          <button onClick={save} style={{ ...s.btn(), width: "100%", marginTop: 4 }}>Commit Purchase Bill</button>
        </div>
      </Modal>
    </div>
  );
};

// --- MODULE 3: DISPATCH CONTROL (MANUAL GATEPASS INTEGRATION) ---
const DispatchScreen = ({ purchases, dispatches, masterParties, masterMandis, ops }) => {
  const [form, setForm] = useState({ gatepass_number: "", vehicle_number: "", lot_id: "", party_id: "", mandi_id: "", dispatched_bags: "" });
  const [showForm, setShowForm] = useState(false);

  const save = async () => {
    if (!form.gatepass_number || !form.vehicle_number || !form.lot_id || !form.party_id || !form.dispatched_bags) return;
    // Client mock allocation mapping
    await ops.dispatches.addItem({
      ...form,
      gross_sale_value: 0, commission: 0, labor_charges: 0, transport_charges: 0, mandi_charges: 0, hamali: 0, other_expenses: 0, net_profit: 0
    });
    setShowForm(false);
  };

  return (
    <div>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700 }}>Dispatch Slips Matrix</span>
        <button onClick={() => { setForm({ gatepass_number: "", vehicle_number: "", lot_id: "", party_id: "", mandi_id: "", dispatched_bags: "" }); setShowForm(true); }} style={s.btn()}><span style={{ fontSize: 16 }}>+</span> Dispatch</button>
      </div>

      {dispatches.map(d => (
        <div key={d.id} style={s.card}>
          <div style={s.rowBetween}>
            <span style={s.tag(clr.blue+"15", clr.blue)}>GP REF: {d.gatepass_number}</span>
            <span>Vehicle: <strong>{d.vehicle_number}</strong></span>
          </div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Lot Tracker Link: <strong>{d.lot_id}</strong> ➔ Loaded Quantity: <strong style={{ color: clr.accent }}>{d.dispatched_bags} Bags</strong></div>
          <div style={{ fontSize: 12, color: clr.muted, marginTop: 2 }}>Target Merchant Account: {masterParties.find(p => p.id === d.party_id)?.name || "N/A"}</div>
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Create Dispatch Allocation">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div><div style={s.label}>Manual Gatepass Number (Physical Slip)</div><input style={s.input} placeholder="Enter Gatepass Code explicitly" value={form.gatepass_number} onChange={e => setForm({ ...form, gatepass_number: e.target.value })} /></div>
          <div><div style={s.label}>Truck / Vehicle Number</div><input style={s.input} placeholder="E.g., UP80AA1234" value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} /></div>
          <div>
            <div style={s.label}>Source From Active Lot</div>
            <select style={s.select} value={form.lot_id} onChange={e => setForm({ ...form, lot_id: e.target.value })}><option value="">Select Lot</option>{purchases.filter(p => processLotState(p, dispatches).status !== "CLOSED").map(p => <option key={p.id} value={p.lot_number}>{p.lot_number} (Avail: {processLotState(p, dispatches).balance} Bags)</option>)}</select>
          </div>
          <div>
            <div style={s.label}>Consignee Mandi Merchant / Party</div>
            <select style={s.select} value={form.party_id} onChange={e => setForm({ ...form, party_id: e.target.value })}><option value="">Select Party</option>{masterParties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          </div>
          <div>
            <div style={s.label}>Destination Mandi Market</div>
            <select style={s.select} value={form.mandi_id} onChange={e => setForm({ ...form, mandi_id: e.target.value })}><option value="">Select Mandi Location</option>{masterMandis.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
          </div>
          <div><div style={s.label}>Load Bag Count</div><input type="number" style={s.input} value={form.dispatched_bags} onChange={e => setForm({ ...form, dispatched_bags: e.target.value })} /></div>
          <button onClick={save} style={{ ...s.btn(), width: "100%", marginTop: 6 }}>Execute Dispatch Memo</button>
        </div>
      </Modal>
    </div>
  );
};

// --- MODULE 4: REAL MANI SALES OUTWARD MATRICES ---
const SalesScreen = ({ dispatches, masterParties, ops }) => {
  const [selectedGpId, setSelectedGpId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [salePrice, setSalePrice] = useState("");
  
  // Strict Real Expense Matrix Variables
  const [expenses, setExpenses] = useState({ commission: "4", labor_charges: "5", transport_charges: "0", mandi_charges: "0", hamali: "0", other_expenses: "0" });

  const targetedGpRow = useMemo(() => dispatches.find(d => d.id === selectedGpId), [selectedGpId, dispatches]);

  const computation = useMemo(() => {
    if (!targetedGpRow || !salePrice) return { gross: 0, net: 0, exTotal: 0 };
    const bags = parseFloat(targetedGpRow.dispatched_bags || 0);
    const gross = bags * parseFloat(salePrice);
    
    const comm = (gross * parseFloat(expenses.commission || 0)) / 100;
    const labor = bags * parseFloat(expenses.labor_charges || 0);
    const transport = parseFloat(expenses.transport_charges || 0);
    const mandi = (gross * parseFloat(expenses.mandi_charges || 0)) / 100;
    const hamali = bags * parseFloat(expenses.hamali || 0);
    const others = parseFloat(expenses.other_expenses || 0);

    const exTotal = comm + labor + transport + mandi + hamali + others;
    return { gross, exTotal, net: gross - exTotal };
  }, [targetedGpRow, salePrice, expenses]);

  const save = async () => {
    if (!selectedGpId || !salePrice) return;
    const bags = parseFloat(targetedGpRow.dispatched_bags || 0);
    
    // Mutate and update calculation column variables onto specific record fields
    const updatedPayload = {
      ...targetedGpRow,
      gross_sale_value: computation.gross,
      commission: (computation.gross * parseFloat(expenses.commission || 0)) / 100,
      labor_charges: bags * parseFloat(expenses.labor_charges || 0),
      transport_charges: parseFloat(expenses.transport_charges || 0),
      mandi_charges: (computation.gross * parseFloat(expenses.mandi_charges || 0)) / 100,
      hamali: bags * parseFloat(expenses.hamali || 0),
      other_expenses: parseFloat(expenses.other_expenses || 0),
      net_profit: computation.net
    };

    const { error } = await supabase.from("dispatches").update(updatedPayload).eq("id", selectedGpId);
    if (!error) ops.dispatches.refreshData();
    setShowForm(false); setSelectedGpId(""); setSalePrice("");
  };

  return (
    <div>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700 }}>Sales Outward Ledgers</span>
        <button onClick={() => setShowForm(true)} style={s.btn()}><span style={{ fontSize: 16 }}>+</span> Process P पट्टी</button>
      </div>

      {dispatches.filter(d => parseFloat(d.gross_sale_value || 0) > 0).map(sRow => (
        <div key={sRow.id} style={s.card}>
          <div style={s.rowBetween}>
            <span style={{ fontWeight: 800, color: clr.green }}>Merchant: {masterParties.find(p => p.id === sRow.party_id)?.name}</span>
            <span style={s.tag()}>GP Ref: {sRow.gatepass_number}</span>
          </div>
          <div style={{ fontSize: 12, color: clr.muted, marginTop: 2 }}>Lot Code Linked: {sRow.lot_id} | Sold Units: {sRow.dispatched_bags} Bags</div>
          <div style={s.divider} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 8px", fontSize: 11, color: clr.muted }}>
            <div>Gross Total: ₹{fmt(sRow.gross_sale_value)}</div>
            <div>Mandi Commission: ₹{fmt(sRow.commission)}</div>
            <div>Labour Surcharges: ₹{fmt(sRow.labor_charges)}</div>
            <div>Freight Cost: ₹{fmt(sRow.transport_charges)}</div>
          </div>
          <div style={{ ...s.rowBetween, marginTop: 10, background: "rgba(0,230,118,0.08)", padding: 8, borderRadius: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Net Party Outstanding Added:</span>
            <strong style={{ color: clr.green }}>₹{fmt(sRow.gross_sale_value)}</strong>
          </div>
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Process Settlement Outward P पट्टी">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div style={s.label}>Select Dispatched Gatepass Docket</div>
            <select style={s.select} value={selectedGpId} onChange={e => setSelectedGpId(e.target.value)}><option value="">Select Docket</option>{dispatches.filter(d => !d.gross_sale_value || parseFloat(d.gross_sale_value) === 0).map(d => <option key={d.id} value={d.id}>GP: {d.gatepass_number} ({d.vehicle_number})</option>)}</select>
          </div>

          {targetedGpRow && (
            <div style={{ ...s.card2, background: clr.bg }}>
              <div style={{ fontSize: 12 }}>Target Client Party: <strong>{masterParties.find(p => p.id === targetedGpRow.party_id)?.name}</strong></div>
              <div style={{ fontSize: 12, marginTop: 2 }}>Volume loaded inside docket: <strong>{targetedGpRow.dispatched_bags} Bags</strong></div>
            </div>
          )}

          <div><div style={s.label}>Selling Price per Bag (Mandi Spot Value)</div><input type="number" style={s.input} value={salePrice} onChange={e => setSalePrice(e.target.value)} /></div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div><div style={s.label}>Mandi Comm %</div><input type="number" style={s.input} value={expenses.commission} onChange={e => setExpenses({ ...expenses, commission: e.target.value })} /></div>
            <div><div style={s.label}>Labour / Bag</div><input type="number" style={s.input} value={expenses.labor_charges} onChange={e => setExpenses({ ...expenses, labor_charges: e.target.value })} /></div>
            <div><div style={s.label}>Transport Freight</div><input type="number" style={s.input} value={expenses.transport_charges} onChange={e => setExpenses({ ...expenses, transport_charges: e.target.value })} /></div>
            <div><div style={s.label}>Mandi Charges %</div><input type="number" style={s.input} value={expenses.mandi_charges} onChange={e => setExpenses({ ...expenses, mandi_charges: e.target.value })} /></div>
            <div><div style={s.label}>Hamali Per Bag</div><input type="number" style={s.input} value={expenses.hamali} onChange={e => setExpenses({ ...expenses, hamali: e.target.value })} /></div>
            <div><div style={s.label}>Other Direct Cost</div><input type="number" style={s.input} value={expenses.other_expenses} onChange={e => setExpenses({ ...expenses, other_expenses: e.target.value })} /></div>
          </div>

          <div style={{ ...s.card2, background: "rgba(0,230,118,0.05)", marginTop: 6 }}>
            <div style={s.rowBetween}><span>Gross Settlement Value:</span> <strong>₹{fmt(computation.gross)}</strong></div>
            <div style={s.rowBetween}><span style={{ color: clr.muted }}>Aggregated Expenses Block:</span> <strong style={{ color: clr.red }}>- ₹{fmt(computation.exTotal)}</strong></div>
            <div style={s.rowBetween}><span>Net Realized Profit Block:</span> <strong style={{ color: clr.green }}>₹{fmt(computation.net)}</strong></div>
          </div>
          <button onClick={save} style={{ ...s.btn(clr.green, "#000"), width: "100%", marginTop: 4 }}>Authorize & Sync Financials</button>
        </div>
      </Modal>
    </div>
  );
};

// --- MODULE 5: LEDGER DUES CASH INFLOW & OUTFLOW TRANSACTIONS ---
const PaymentScreen = ({ payments, coldStorages, masterParties, ops }) => {
  const [form, setForm] = useState({ party_id: "", type: "receivable", amount: "", notes: "" });
  const [showForm, setShowForm] = useState(false);

  const save = async () => {
    if (!form.party_id || !form.amount) return;
    await ops.payments.addItem({ ...form, amount: parseFloat(form.amount), date: today() });
    setShowForm(false);
    setForm({ party_id: "", type: "receivable", amount: "", notes: "" });
  };

  return (
    <div>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}>
        <span style={{ fontWeight: 700 }}>Double-Entry Cash Vouchers</span>
        <button onClick={() => setShowForm(true)} style={s.btn()}><span style={{ fontSize: 16 }}>+</span> Log Voucher</button>
      </div>

      {payments.map(p => {
        const title = p.type === "receivable" ? masterParties.find(pa => pa.id === p.party_id)?.name : coldStorages.find(c => c.id === p.party_id)?.name;
        return (
          <div key={p.id} style={s.card}>
            <div style={s.rowBetween}>
              <span style={{ fontWeight: 700 }}>{title || "Profile Entity Account"}</span>
              <span style={s.tag(p.type === "receivable" ? clr.green+"15" : clr.red+"15", p.type === "receivable" ? clr.green : clr.red)}>
                {p.type === "receivable" ? "Party Inflow (+)" : "Cold Outflow (-)"}
              </span>
            </div>
            <div style={{ ...s.rowBetween, marginTop: 8 }}>
              <span style={{ fontSize: 12, color: clr.muted }}>{p.notes}</span>
              <strong style={{ fontSize: 15, color: p.type === "receivable" ? clr.green : clr.red }}>₹{fmt(p.amount)}</strong>
            </div>
          </div>
        );
      })}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Create Liquidity Voucher Mapping">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div style={s.label}>Transaction Protocol</div>
            <select style={s.select} value={form.type} onChange={e => setForm({ ...form, type: e.target.value, party_id: "" })}><option value="receivable">Receive Receipts (From Mandi Party)</option><option value="payable">Execute Outflow Payment (To Cold Storage)</option></select>
          </div>
          <div>
            <div style={s.label}>Target Profile Account Ledger</div>
            <select style={s.select} value={form.party_id} onChange={e => setForm({ ...form, party_id: e.target.value })}><option value="">Select Profile</option>
              {form.type === "receivable" ? masterParties.map(p => <option key={p.id} value={p.id}>{p.name} (Mandi Merchant)</option>) : coldStorages.map(c => <option key={c.id} value={c.id}>{c.name} (Cold Owner)</option>)}
            </select>
          </div>
          <div><div style={s.label}>Transaction Value (₹)</div><input type="number" style={s.input} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
          <div><div style={s.label}>Remarks / Narration Memo</div><input style={s.input} placeholder="E.g., Cleared Lot 1098 settlement block" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          <button onClick={save} style={{ ...s.btn(), width: "100%", marginTop: 6 }}>Post Book Ledger Entry</button>
        </div>
      </Modal>
    </div>
  );
};

// --- MODULE 6: MASTER DEFINITIONS PROFILES ---
const MastersScreen = ({ coldStorages, masterParties, masterMandis }) => {
  const [activeSub, setActiveSub] = useState("cold");
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <button onClick={() => setActiveSub("cold")} style={s.btnSm(activeSub === "cold" ? clr.accent : clr.card2, activeSub === "cold" ? "#000" : clr.text)}>Cold ({coldStorages.length})</button>
        <button onClick={() => setActiveSub("party")} style={s.btnSm(activeSub === "party" ? clr.accent : clr.card2, activeSub === "party" ? "#000" : clr.text)}>Parties ({masterParties.length})</button>
      </div>

      {activeSub === "cold" && coldStorages.map(c => (
        <div key={c.id} style={{ ...s.card, padding: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: clr.accent }}>{c.name}</div>
          <div style={{ fontSize: 12, color: clr.muted, marginTop: 2 }}>📍 Location Context: {c.address || "Hathras Sector Hub"}</div>
        </div>
      ))}

      {activeSub === "party" && masterParties.map(p => (
        <div key={p.id} style={{ ...s.card, padding: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: clr.blue }}>{p.name}</div>
          <div style={{ fontSize: 12, color: clr.muted, marginTop: 2 }}>Merchant Reference Identity Grid</div>
        </div>
      ))}
    </div>
  );
};

// --- CORE SYSTEM APP FRAMEWORK ---
export default function App() {
  const [purchases, opsP] = useSupabaseTable("purchases");
  const [dispatches, opsD] = useSupabaseTable("dispatches");
  const [payments, opsM] = useSupabaseTable("payments");
  const [coldStorages] = useSupabaseTable("cold_storages");
  const [masterMandis] = useSupabaseTable("mandis");
  const [masterParties] = useSupabaseTable("parties");
  
  const [currentTab, setCurrentTab] = useState("dashboard");
  const ops = { purchases: opsP, dispatches: opsD, payments: opsM };

  return (
    <div style={s.screen}>
      <div style={s.header}><h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: clr.accent, letterSpacing: "0.4px" }}>🥔 JSN FARM OS v2.0</h2></div>
      
      <div style={s.content}>
        {currentTab === "dashboard" && <IntelligenceDashboard purchases={purchases} dispatches={dispatches} sales={null} payments={payments} coldStorages={coldStorages} parties={masterParties} />}
        {currentTab === "purchase" && <PurchaseScreen purchases={purchases} coldStorages={coldStorages} dispatches={dispatches} ops={ops} />}
        {currentTab === "dispatch" && <DispatchScreen purchases={purchases} dispatches={dispatches} masterParties={masterParties} masterMandis={masterMandis} ops={ops} />}
        {currentTab === "sales" && <SalesScreen dispatches={dispatches} masterParties={masterParties} ops={ops} />}
        {currentTab === "payment" && <PaymentScreen payments={payments} coldStorages={coldStorages} masterParties={masterParties} ops={ops} />}
        {currentTab === "masters" && <MastersScreen coldStorages={coldStorages} masterParties={masterParties} masterMandis={masterMandis} />}
      </div>

      <div style={s.navBar}>
        <button onClick={() => setCurrentTab("dashboard")} style={s.navItem(currentTab === "dashboard")}><span>Dashboard</span></button>
        <button onClick={() => setCurrentTab("purchase")} style={s.navItem(currentTab === "purchase")}><span>Purchase</span></button>
        <button onClick={() => setCurrentTab("dispatch")} style={s.navItem(currentTab === "dispatch")}><span>Dispatch</span></button>
        <button onClick={() => setCurrentTab("sales")} style={s.navItem(currentTab === "sales")}><span>Sales</span></button>
        <button onClick={() => setCurrentTab("payment")} style={s.navItem(currentTab === "payment")}><span>Ledger</span></button>
        <button onClick={() => setCurrentTab("masters")} style={s.navItem(currentTab === "masters")}><span>Masters</span></button>
      </div>
    </div>
  );
}
