import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cxjmwjljjnuthcrmnbqb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4am13amxqam51dGhjcm1uYnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTYzMzUsImV4cCI6MjA5MjY3MjMzNX0.ynRaceAT1uWcsPOJ_5vY_8NKolM3EaWKQajUEk4sLz8";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  navBar: { position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", background: clr.card, borderTop: `1px solid ${clr.border}`, display: "flex", zIndex: 200 },
  navItem: (active) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 2px", gap: 2, background: "none", border: "none", color: active ? clr.accent : clr.muted, fontSize: "15px", cursor: "pointer" }),
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

// ===== DISPATCH ANALYTICS & PARTYWISE / COLD BREAKDOWN WITH NET PROFIT & BIKRI =====
const DispatchAnalyticsScreen = ({ dispatches = [], parties = [], coldStorages = [], purchases = [], payments = [], coldPayments = [] }) => {
  
  // 1. Calculate Party-wise Dispatches, Loaded Bags, Bikri, Profit & Due
  const partyWiseSummary = parties.map(party => {
    const partyDispatches = dispatches.filter(d => d.destination_party_id === party.id);
    
    // Total Dispatched Loaded Bags
    const totalDispatchedBags = partyDispatches.reduce((sum, d) => {
      const bags = (d.lot_details || []).reduce((s, item) => s + (parseFloat(item.purchase_bags) || 0), 0);
      return sum + bags;
    }, 0);

    // Total Dispatched Cost Value (Purchase Base)
    const totalDispatchValue = partyDispatches.reduce((sum, d) => {
      const dispatchCost = (d.lot_details || []).reduce((s, item) => s + (parseFloat(item.purchase_lot_value) || 0), 0);
      return sum + dispatchCost;
    }, 0);

    // Total Mandi Sale / Bikri Amount
    const totalSaleReceived = partyDispatches.reduce((sum, d) => sum + (parseFloat(d.total_mandi_sale_amount) || 0), 0);

    // Total Expenses incurred on this party's dispatches
    const totalMandiExpenses = partyDispatches.reduce((sum, d) => sum + (parseFloat(d.total_expenses) || 0), 0);

    // Total Payments Received from this party
    const partyGps = partyDispatches.map(d => d.gatepass_id);
    const totalPaymentsRec = payments.filter(p => partyGps.includes(p.gatepass_id)).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    // Dynamic Net Profit & Dues Formula
    const partyNetProfit = totalSaleReceived - totalDispatchValue - totalMandiExpenses;
    const pendingDue = totalSaleReceived - totalPaymentsRec;

    return {
      partyId: party.id,
      partyName: party.name,
      totalDispatchedBags,
      totalDispatchValue,
      totalSaleReceived,
      totalMandiExpenses,
      partyNetProfit,
      totalPaymentsRec,
      pendingDue,
      dispatchCount: partyDispatches.length
    };
  }).filter(p => p.dispatchCount > 0 || p.totalDispatchValue > 0 || p.totalSaleReceived > 0);

  // 2. Calculate Cold Storage-wise Dispatches, GP Details, Amount Paid Back & Due
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
        dispatchedGPs.push({
          gatepass_id: d.gatepass_id,
          vehicle_number: d.vehicle_number,
          date: d.date,
          bags: gpColdBags,
          gp_loaded_value: gpColdValue
        });
      }
    });

    const coldPaidLogs = coldPayments.filter(cp => cp.cold_storage_id === cs.id);
    const totalPaidBack = coldPaidLogs.reduce((sum, cp) => sum + (parseFloat(cp.amount) || 0), 0);
    const duePayable = totalColdDispatchValue - totalPaidBack;

    return {
      coldId: cs.id,
      coldName: cs.name,
      totalColdDispatchValue,
      totalBagsDispatched,
      dispatchedGPs,
      coldPaidLogs,
      totalPaidBack,
      duePayable
    };
  }).filter(c => c.totalColdDispatchValue > 0 || c.totalPaidBack > 0 || c.dispatchedGPs.length > 0);

  const grandDispatchValue = partyWiseSummary.reduce((sum, p) => sum + p.totalDispatchValue, 0);
  const grandSaleReceived = partyWiseSummary.reduce((sum, p) => sum + p.totalSaleReceived, 0);
  const grandTotalProfit = partyWiseSummary.reduce((sum, p) => sum + p.partyNetProfit, 0);

  return (
    <div style={s.content}>
      <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 12, color: clr.accent }}>
        🚚 Party-Wise Bikri, Profit & Dues Summary
      </div>

      {/* OVERALL TOP METRICS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        <div style={{ ...s.card2, background: clr.blue + "18", border: `1px solid ${clr.blue}` }}>
          <div style={s.label}>Total GP Dispatch Value</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: clr.blue }}>₹{fmt(grandDispatchValue)}</div>
        </div>
        <div style={{ ...s.card2, background: clr.green + "18", border: `1px solid ${clr.green}` }}>
          <div style={s.label}>Total Bikri (Sale)</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: clr.green }}>₹{fmt(grandSaleReceived)}</div>
        </div>
        <div style={{ ...s.card2, gridColumn: "1 / span 2", background: grandTotalProfit >= 0 ? clr.green + "18" : clr.red + "18", border: `1px solid ${grandTotalProfit >= 0 ? clr.green : clr.red}` }}>
          <div style={s.rowBetween}>
            <span style={s.label}>Overall Generated Net Profit</span>
            <strong style={{ color: grandTotalProfit >= 0 ? clr.green : clr.red, fontSize: 18 }}>₹{fmt(grandTotalProfit)}</strong>
          </div>
        </div>
      </div>

      {/* 1. PARTY-WISE DISPATCH, BIKRI, PROFIT & DUE BREAKDOWN */}
      <div style={{ ...s.label, fontSize: "13px", color: clr.text, marginBottom: 8, textTransform: "none" }}>
        🏢 Party-Wise Complete Performance
      </div>

      {partyWiseSummary.length === 0 ? (
        <div style={{ ...s.card, color: clr.muted, textAlign: "center", padding: 16 }}>
          Koi party dispatch record nahi mila.
        </div>
      ) : (
        partyWiseSummary.map(p => (
          <div key={p.partyId} style={{ ...s.card, borderLeft: `4px solid ${clr.purple}` }}>
            <div style={s.rowBetween}>
              <span style={{ fontWeight: 800, fontSize: 16, color: clr.text }}>{p.partyName}</span>
              <Badge v={`${p.totalDispatchedBags} Bags (${p.dispatchCount} Trucks)`} color={clr.purple} />
            </div>
            <div style={s.divider} />
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
              <div>
                <span style={{ color: clr.muted, fontSize: 11 }}>LOADED COST VALUE</span>
                <div style={{ fontWeight: 700, color: clr.blue, fontSize: 15 }}>₹{fmt(p.totalDispatchValue)}</div>
              </div>
              <div>
                <span style={{ color: clr.muted, fontSize: 11 }}>TOTAL BIKRI / SALE</span>
                <div style={{ fontWeight: 700, color: clr.green, fontSize: 15 }}>₹{fmt(p.totalSaleReceived)}</div>
              </div>

              <div>
                <span style={{ color: clr.muted, fontSize: 11 }}>CASH RECEIVED</span>
                <div style={{ fontWeight: 600, color: clr.text }}>₹{fmt(p.totalPaymentsRec)}</div>
              </div>
              <div>
                <span style={{ color: clr.muted, fontSize: 11 }}>PENDING / DUE PAYMENT</span>
                <div style={{ fontWeight: 800, color: p.pendingDue > 0 ? clr.red : clr.green }}>₹{fmt(p.pendingDue)}</div>
              </div>

              {/* NET PROFIT BAR */}
              <div style={{ gridColumn: "1 / span 2", background: clr.card2, padding: 8, borderRadius: 6, marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: clr.muted, fontWeight: 700 }}>NET PROFIT FROM PARTY:</span>
                <span style={{ fontSize: 15, fontWeight: 900, color: p.partyNetProfit >= 0 ? clr.green : clr.red }}>
                  {p.partyNetProfit >= 0 ? "+" : ""}₹{fmt(p.partyNetProfit)}
                </span>
              </div>
            </div>
          </div>
        ))
      )}

      {/* 2. COLD STORAGE-WISE DISPATCH & PAYBACK LEDGER */}
      <div style={{ ...s.label, fontSize: "13px", color: clr.text, margin: "16px 0 8px 0", textTransform: "none" }}>
        ❄️ Cold Storage-Wise GP Dispatch & Payback Ledger
      </div>

      {coldWiseSummary.length === 0 ? (
        <div style={{ ...s.card, color: clr.muted, textAlign: "center", padding: 16 }}>
          Cold storage dispatch records nahi hain.
        </div>
      ) : (
        coldWiseSummary.map(c => (
          <div key={c.coldId} style={{ ...s.card, borderLeft: `4px solid ${clr.orange}` }}>
            <div style={s.rowBetween}>
              <span style={{ fontWeight: 800, fontSize: 15, color: clr.text }}>{c.coldName}</span>
              <span style={{ fontSize: 12, color: clr.muted }}>{c.totalBagsDispatched} Bags Out</span>
            </div>
            <div style={s.divider} />
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13, marginBottom: 10 }}>
              <div>
                <span style={{ color: clr.muted, fontSize: 11 }}>COLD DISPATCH LOADED VALUE</span>
                <div style={{ fontWeight: 700, color: clr.orange, fontSize: 15 }}>₹{fmt(c.totalColdDispatchValue)}</div>
              </div>
              <div>
                <span style={{ color: clr.muted, fontSize: 11 }}>PAID BACK TO COLD</span>
                <div style={{ fontWeight: 700, color: clr.green, fontSize: 15 }}>₹{fmt(c.totalPaidBack)}</div>
              </div>
              <div style={{ gridColumn: "1 / span 2", borderTop: `1px dashed ${clr.border}`, paddingTop: 6, marginTop: 2 }}>
                <div style={{ ...s.rowBetween }}>
                  <span style={{ color: clr.muted, fontSize: 12 }}>REMAINING DUE TO PAY:</span>
                  <strong style={{ fontSize: 15, color: c.duePayable > 0 ? clr.red : clr.green }}>₹{fmt(c.duePayable)}</strong>
                </div>
              </div>
            </div>

            {/* GP & VEHICLE DISPATCH HISTORY FOR COLD */}
            {c.dispatchedGPs.length > 0 && (
              <div style={{ background: clr.card2, borderRadius: 8, padding: 8, marginTop: 6 }}>
                <div style={{ ...s.label, fontSize: "11px", color: clr.accent, marginBottom: 4 }}>🚚 Gatepass (GP) Dispatch History</div>
                {c.dispatchedGPs.map((gp, gIdx) => (
                  <div key={gIdx} style={{ fontSize: 12, borderBottom: gIdx !== c.dispatchedGPs.length - 1 ? `1px solid ${clr.border}` : "none", padding: "4px 0" }}>
                    <div style={s.rowBetween}>
                      <span><strong>GP: {gp.gatepass_id}</strong> ({gp.vehicle_number})</span>
                      <span style={{ color: clr.orange, fontWeight: 700 }}>₹{fmt(gp.gp_loaded_value)}</span>
                    </div>
                    <div style={{ color: clr.muted, fontSize: 11 }}>Date: {gp.date} | Loaded: {gp.bags} Bags</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

// ===== DASHBOARD SCREEN WITH FULL LIFECYCLE SEARCH =====
const DashboardScreen = ({ purchases = [], dispatches = [], payments = [], mandis = [], parties = [], varieties = [], gradings = [], coldStorages = [] }) => {
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
  
  const filteredPurchases = q === "" ? [] : purchases.filter(p => 
    p.lot_id?.toLowerCase().includes(q) || p.farmer_name?.toLowerCase().includes(q)
  );

  const filteredDispatches = q === "" ? [] : dispatches.filter(d => 
    d.gatepass_id?.toLowerCase().includes(q) || 
    (d.lot_details || []).some(l => l.lot_number?.toLowerCase().includes(q))
  );

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
      {/* NET PROFIT METRIC CARD */}
      <div style={{ ...s.card, background: dynamicNetProfit >= 0 ? clr.green + "1a" : clr.red + "1a", borderColor: dynamicNetProfit >= 0 ? clr.green : clr.red, marginBottom: 14 }}>
        <div style={s.rowBetween}>
          <span style={{ ...s.label, fontSize: "13px", color: dynamicNetProfit >= 0 ? clr.green : clr.red }}>📊 Realized Profit & Loss (Live)</span>
          <Badge v={dynamicNetProfit >= 0 ? "PROFIT" : "LOSS"} color={dynamicNetProfit >= 0 ? clr.green : clr.red} />
        </div>
        <div style={s.divider} />
        <div style={s.rowBetween}>
          <div>
            <div style={{ fontSize: 12, color: clr.muted }}>Net Realized Profit</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: dynamicNetProfit >= 0 ? clr.green : clr.red }}>₹{fmt(dynamicNetProfit)}</div>
          </div>
          <div style={{ textAlign: "right", fontSize: 12, color: clr.muted }}>
            <div>Bikri: <strong style={{ color: clr.text }}>₹{fmt(totalMandiRevenue)}</strong></div>
            <div>Cost: <strong style={{ color: clr.text }}>₹{fmt(totalSoldPurchaseCost)}</strong></div>
          </div>
        </div>
      </div>

      {/* QUICK INVENTORY STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        <div style={s.card2}>
          <div style={s.label}>Total Purchased Bags</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{fmt(totalBagsPurchased)}</div>
          <div style={{ fontSize: 11, color: clr.muted, marginTop: 2 }}>In Stock: {fmt(totalBagsRemaining)}</div>
        </div>
        <div style={s.card2}>
          <div style={s.label}>Dispatched Bags</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: clr.orange }}>{fmt(totalBagsDispatched)}</div>
          <div style={{ fontSize: 11, color: clr.muted, marginTop: 2 }}>Active Lots: {activeLots} | Closed: {closedLots}</div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div style={{ marginBottom: 14 }}>
        <div style={s.label}>🔍 Search Lot ID or Gatepass</div>
        <input 
          style={s.input} 
          placeholder="Type Lot ID (e.g., LOT-101) or Gatepass ID..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
      </div>

      {/* SEARCH RESULTS LIST */}
      {q !== "" && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ ...s.label, color: clr.accent, marginBottom: 6 }}>Search Results ({filteredPurchases.length + filteredDispatches.length})</div>
          {filteredPurchases.map(p => (
            <div key={p.id} onClick={() => openFullLifecycle("purchase", p)} style={{ ...s.card, cursor: "pointer", borderLeft: `4px solid ${clr.blue}` }}>
              <div style={s.rowBetween}>
                <strong>Lot ID: {p.lot_id}</strong>
                <Badge v={`${p.manual_bags} Bags`} color={clr.blue} />
              </div>
              <div style={{ fontSize: 12, color: clr.muted, marginTop: 4 }}>Farmer: {p.farmer_name || "N/A"}</div>
            </div>
          ))}
          {filteredDispatches.map(d => (
            <div key={d.id} onClick={() => openFullLifecycle("dispatch", d)} style={{ ...s.card, cursor: "pointer", borderLeft: `4px solid ${clr.purple}` }}>
              <div style={s.rowBetween}>
                <strong>Gatepass: {d.gatepass_id}</strong>
                <Badge v={`${d.vehicle_number}`} color={clr.purple} />
              </div>
              <div style={{ fontSize: 12, color: clr.muted, marginTop: 4 }}>Date: {d.date}</div>
            </div>
          ))}
        </div>
      )}

      {/* FULL LIFECYCLE MODAL */}
      <Modal open={!!selectedDetail} onClose={() => setSelectedDetail(null)} title="🔄 Full Lifecycle View">
        {selectedDetail && (
          <div>
            <div style={{ ...s.label, color: clr.accent }}>Primary Selected Record</div>
            <div style={s.card2}>
              <pre style={{ margin: 0, fontSize: 12, color: clr.text, whiteSpace: "pre-wrap" }}>
                {JSON.stringify(selectedDetail.primary, null, 2)}
              </pre>
            </div>

            <div style={{ ...s.label, color: clr.blue, marginTop: 10 }}>Associated Purchases ({selectedDetail.purchases.length})</div>
            {selectedDetail.purchases.map(p => (
              <div key={p.id} style={{ ...s.card, fontSize: 12 }}>
                <div><strong>Lot: {p.lot_id}</strong> | Bags: {p.manual_bags} | Rate: ₹{p.rate_per_bag}</div>
                <div style={{ color: clr.muted }}>Farmer: {p.farmer_name}</div>
              </div>
            ))}

            <div style={{ ...s.label, color: clr.purple, marginTop: 10 }}>Associated Dispatches ({selectedDetail.dispatches.length})</div>
            {selectedDetail.dispatches.map(d => (
              <div key={d.id} style={{ ...s.card, fontSize: 12 }}>
                <div><strong>GP: {d.gatepass_id}</strong> | Truck: {d.vehicle_number}</div>
                <div style={{ color: clr.muted }}>Sale Amt: ₹{fmt(d.total_mandi_sale_amount)}</div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

// ===== MAIN ROOT COMPONENT WITH NAVIGATION =====
export default function App() {
  const [activeTab, setActiveTab] = useState("analytics");

  const purchasesState = useSupabaseTable("purchases");
  const dispatchesState = useSupabaseTable("dispatches");
  const paymentsState = useSupabaseTable("payments");
  const partiesState = useSupabaseTable("parties");
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
          parties={partiesState.data}
          coldStorages={coldStoragesState.data}
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

      {/* BOTTOM NAVIGATION BAR */}
      <div style={s.navBar}>
        <button style={s.navItem(activeTab === "dashboard")} onClick={() => setActiveTab("dashboard")}>
          📊 <span>Dashboard</span>
        </button>
        <button style={s.navItem(activeTab === "analytics")} onClick={() => setActiveTab("analytics")}>
          🚚 <span>Analytics & Profit</span>
        </button>
      </div>
    </div>
  );
}
