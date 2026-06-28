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
    const { error } = await supabase.from(tableName).insert([formatted]);
    if (!error) fetchData();
  }, [tableName, fetchData]);

  return [data, { addItem, refresh: fetchData, loading }];
};

const uid = () => Math.random().toString(36).slice(2, 9).toUpperCase();
const fmt = (n) => (isNaN(n) || n === null || n === undefined ? "0" : Number(n).toLocaleString("en-IN"));
const today = () => new Date().toISOString().slice(0, 10);

const clr = { bg: "#0f1117", card: "#1a1d26", card2: "#22263a", accent: "#f5a623", green: "#22c55e", red: "#ef4444", blue: "#3b82f6", purple: "#a855f7", border: "#2d3148", text: "#f1f5f9", muted: "#6b7280" };

const s = {
  screen: { minHeight: "100vh", background: clr.bg, color: clr.text, fontFamily: "system-ui, sans-serif", maxWidth: 480, margin: "0 auto", position: "relative" },
  header: { background: clr.card, padding: "12px 14px", borderBottom: `1px solid ${clr.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" },
  card: { background: clr.card, borderRadius: 10, padding: 12, marginBottom: 8, border: `1px solid ${clr.border}` },
  card2: { background: clr.card2, borderRadius: 8, padding: 10, marginBottom: 6, border: `1px solid ${clr.border}` },
  rowBetween: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  row: { display: "flex", alignItems: "center", gap: 6 },
  input: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 6, padding: "8px 10px", color: clr.text, fontSize: 13, boxSizing: "border-box" },
  select: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 6, padding: "8px 10px", color: clr.text, fontSize: 13 },
  label: { fontSize: 10, color: clr.muted, marginBottom: 2, fontWeight: 700, textTransform: "uppercase" },
  btn: (bg = clr.accent, txt = "#000") => ({ background: bg, color: txt, border: "none", borderRadius: 6, padding: "9px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", width: "100%", display: "flex", justifyContent: "center", gap: 4 }),
  btnSm: (bg = clr.card2, txt = clr.text) => ({ background: bg, color: txt, border: `1px solid ${clr.border}`, borderRadius: 5, padding: "5px 8px", fontWeight: 600, fontSize: 11, cursor: "pointer" }),
  content: { padding: 12, paddingBottom: 80 },
  navBar: { position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", background: clr.card, borderTop: `1px solid ${clr.border}`, display: "flex", zIndex: 200 },
  navItem: (active) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 4px", background: "none", border: "none", color: active ? clr.accent : clr.muted, fontSize: 10, cursor: "pointer" })
};

const triggerCSVDownload = (title, headers, rows) => {
  const fileContent = [headers, ...rows].map(e => e.join(",")).join("\n");
  const blob = new Blob([fileContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${title}_${today()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 1. ADVANCED DASHBOARD MODULE
const DashboardScreen = ({ purchases, dispatches, sales }) => {
  const totalPurchasedBags = purchases.reduce((sum, p) => sum + (parseInt(p.manual_bags) || 0), 0);
  const totalDispatchedBags = dispatches.flatMap(d => d.items || []).reduce((sum, i) => sum + (parseInt(i.manual_bags) || 0), 0);
  const totalRemainingBags = purchases.filter(p => p.status !== 'closed').reduce((sum, p) => sum + (parseInt(p.manual_bags) || 0), 0);

  const activeLotsCount = purchases.filter(p => p.status !== 'closed').length;
  const closedLotsCount = purchases.filter(p => p.status === 'closed').length;

  const todayDispatchBags = dispatches.filter(d => d.date === today()).flatMap(d => d.items || []).reduce((sum, i) => sum + (parseInt(i.manual_bags) || 0), 0);
  const todaySaleGross = sales.filter(s => s.date === today()).flatMap(s => s.lot_sales || []).reduce((sum, l) => sum + (parseFloat(l.profit_loss) || 0), 0);

  return (
    <div style={s.content}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
        <div style={{ ...s.card2, background: clr.blue + "12" }}><div style={s.label}>Purchased Bags</div><div style={{ fontSize: 18, fontWeight: 800, color: clr.blue }}>{fmt(totalPurchasedBags)}</div></div>
        <div style={{ ...s.card2, background: clr.accent + "12" }}><div style={s.label}>Remaining Bags</div><div style={{ fontSize: 18, fontWeight: 800, color: clr.accent }}>{fmt(totalRemainingBags)}</div></div>
        <div style={{ ...s.card2, background: clr.green + "12" }}><div style={s.label}>Today's Dispatch</div><div style={{ fontSize: 18, fontWeight: 800, color: clr.green }}>{fmt(todayDispatchBags)} Bags</div></div>
        <div style={{ ...s.card2, background: clr.purple + "12" }}><div style={s.label}>Today's Profit Matrix</div><div style={{ fontSize: 18, fontWeight: 800, color: clr.purple }}>₹{fmt(todaySaleGross)}</div></div>
        <div style={{ ...s.card2, background: clr.bg, borderColor: clr.green }}><div style={s.label}>Active Lots Running</div><div style={{ fontSize: 18, fontWeight: 800, color: clr.green }}>{activeLotsCount}</div></div>
        <div style={{ ...s.card2, background: clr.bg, borderColor: clr.red }}><div style={s.label}>Closed Lots Storage</div><div style={{ fontSize: 18, fontWeight: 800, color: clr.red }}>{closedLotsCount}</div></div>
      </div>
    </div>
  );
};

// 2. PURCHASE MODULE
const PurchaseScreen = ({ purchases, ops }) => {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ lot_id: "", farmer_name: "", variety: "Chipsona", grading: "A", manual_bags: "", total_weight: "", rate_per_bag: "", date: today() });

  const save = async () => {
    if (!form.lot_id || !form.manual_bags) return alert("Fill data inputs");
    await ops.purchases.addItem({ ...form, status: "open", manual_bags: parseInt(form.manual_bags), rate_per_bag: parseFloat(form.rate_per_bag), total_weight: parseFloat(form.total_weight) });
    setShow(false);
    setForm({ lot_id: "", farmer_name: "", variety: "Chipsona", grading: "A", manual_bags: "", total_weight: "", rate_per_bag: "", date: today() });
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}><span style={{ fontWeight: 700 }}>Inbound Purchase Registry</span><button onClick={() => setShow(true)} style={{ ...s.btn(), width: "auto" }}>+ Add New Lot</button></div>
      {purchases.map(p => (
        <div key={p.id} style={s.card}>
          <div style={s.rowBetween}><strong>{p.lot_id}</strong><span style={{ fontSize: 11, color: p.status === 'closed' ? clr.red : clr.green, fontWeight: 700 }}>{p.status?.toUpperCase()}</span></div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Farmer: <strong>{p.farmer_name}</strong> | Variety: {p.variety} | Grading: {p.grading}</div>
          <div style={{ fontSize: 12, color: clr.muted, marginTop: 2 }}>Actual Bags: {p.manual_bags} | Total Weight: {p.total_weight}kg | Rate: ₹{p.rate_per_bag}</div>
        </div>
      ))}
      {show && (
        <div style={{ position: "fixed", inset: 0, background: "#000c", zIndex: 1000, display: "flex", alignItems: "flex-end" }}><div style={{ background: clr.card, width: "100%", padding: 12, borderRadius: "12px 12px 0 0" }}>
          <div style={{ marginBottom: 6 }}><div style={s.label}>Lot Identifier</div><input style={s.input} placeholder="e.g. LOT001" value={form.lot_id} onChange={e => setForm({ ...form, lot_id: e.target.value })} /></div>
          <div style={{ marginBottom: 6 }}><div style={s.label}>Farmer Name</div><input style={s.input} value={form.farmer_name} onChange={e => setForm({ ...form, farmer_name: e.target.value })} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
            <div><div style={s.label}>Variety</div><input style={s.input} value={form.variety} onChange={e => setForm({ ...form, variety: e.target.value })} /></div>
            <div><div style={s.label}>Grading</div><input style={s.input} value={form.grading} onChange={e => setForm({ ...form, grading: e.target.value })} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginBottom: 10 }}>
            <div><div style={s.label}>Actual Bags</div><input type="number" style={s.input} value={form.manual_bags} onChange={e => setForm({ ...form, manual_bags: e.target.value })} /></div>
            <div><div style={s.label}>Weight (kg)</div><input type="number" style={s.input} value={form.total_weight} onChange={e => setForm({ ...form, total_weight: e.target.value })} /></div>
            <div><div style={s.label}>Rate / Std Bag</div><input type="number" style={s.input} value={form.rate_per_bag} onChange={e => setForm({ ...form, rate_per_bag: e.target.value })} /></div>
          </div>
          <div style={{ display: "flex", gap: 6 }}><button onClick={() => setShow(false)} style={s.btnSm()}>Cancel</button><button onClick={save} style={s.btn()}>Register Purchase Lot</button></div>
        </div></div>
      )}
    </div>
  );
};

// 3. UPGRADED DISPATCH MODULE (GATEPASS MANIFEST)
const DispatchScreen = ({ dispatches, purchases, ops }) => {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ gatepass_id: "", vehicle_number: "", driver_name: "", mobile_number: "", transport_name: "", items: [] });
  const [item, setItem] = useState({ lot_id: "", manual_bags: "", weight: "" });

  const activeLotDetails = purchases.find(p => p.lot_id === item.lot_id);
  
  const calculatedStdBags = item.weight ? (parseFloat(item.weight) / 52.5) : 0;
  const realTimeLotCost = activeLotDetails ? (calculatedStdBags * activeLotDetails.rate_per_bag) : 0;

  const pushLotToGatepass = () => {
    if (!item.lot_id || !item.manual_bags || !item.weight) return alert("Metrics incomplete");
    setForm(p => ({
      ...p,
      items: [...p.items, {
        lot_id: item.lot_id,
        manual_bags: parseInt(item.manual_bags),
        weight: parseFloat(item.weight),
        variety: activeLotDetails?.variety || "Potato",
        grading: activeLotDetails?.grading || "A",
        cost_value: realTimeLotCost
      }]
    }));
    setItem({ lot_id: "", manual_bags: "", weight: "" });
  };

  const executeDispatchFlow = async () => {
    if (!form.gatepass_id || form.items.length === 0) return alert("Verification parameters missing");
    await ops.dispatches.addItem({ ...form, date: today(), id: uid() });

    for (const dispatchedItem of form.items) {
      const matchLot = purchases.find(p => p.lot_id === dispatchedItem.lot_id);
      if (matchLot) {
        const accurateRemainder = matchLot.manual_bags - dispatchedItem.manual_bags;
        await supabase.from("purchases").update({
          manual_bags: accurateRemainder <= 0 ? 0 : accurateRemainder,
          status: accurateRemainder <= 0 ? "closed" : "open"
        }).eq("id", matchLot.id);
      }
    }
    ops.purchases.refresh();
    setShow(false);
    setForm({ gatepass_id: "", vehicle_number: "", driver_name: "", mobile_number: "", transport_name: "", items: [] });
  };

  const generateCleanWhatsAppString = (d) => {
    let msg = `*Gatepass:* ${d.gatepass_id}\n*Vehicle:* ${d.vehicle_number}\n\n`;
    d.items?.forEach(i => {
      msg += `*Lot:* ${i.lot_id}\n${i.variety} (${i.grading})\n${i.manual_bags} Bags\n${i.weight} kg\n\n`;
    });
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  const dispatchCSV = () => {
    const rows = [];
    dispatches.forEach(d => d.items?.forEach(i => rows.push([d.gatepass_id, d.vehicle_number, d.date, i.lot_id, i.manual_bags, i.weight, i.variety, i.grading, i.cost_value])));
    triggerCSVDownload("Dispatch_Manifest_Report", ["Gatepass", "Vehicle", "Date", "LotID", "BagsCount", "WeightKG", "Variety", "Grade", "CalculatedCost"], rows);
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}><span style={{ fontWeight: 700 }}>Dispatch Deck</span><div style={s.row}><button onClick={dispatchCSV} style={s.btnSm(clr.blue)}>CSV Export</button><button onClick={() => setShow(true)} style={{ ...s.btn(), width: "auto" }}>+ Outbound GP</button></div></div>
      {dispatches.map(d => (
        <div key={d.id} style={s.card}>
          <div style={s.rowBetween}><strong>GP ID: {d.gatepass_id}</strong><a href={generateCleanWhatsAppString(d)} target="_blank" rel="noreferrer" style={{ color: clr.green, fontSize: 11, fontWeight: 700, textDecoration: "none" }}>WhatsApp Manifest</a></div>
          <div style={{ fontSize: 12, color: clr.muted }}>Vehicle: {d.vehicle_number} | Transporter: {d.transport_name}</div>
          {d.items?.map((i, index) => (
            <div key={index} style={{ ...s.card2, background: clr.card2, marginTop: 4, fontSize: 11 }}>
              Lot: <strong>{i.lot_id}</strong> | {i.variety} ({i.grading}) | {i.manual_bags} Bags | {i.weight}kg
            </div>
          ))}
        </div>
      ))}
      {show && (
        <div style={{ position: "fixed", inset: 0, background: "#000c", zIndex: 1000, display: "flex", alignItems: "flex-end" }}><div style={{ background: clr.card, width: "100%", padding: 12, borderRadius: "12px 12px 0 0", maxHeight: "90vh", overflowY: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 6 }}>
            <div><div style={s.label}>Gatepass Number</div><input style={s.input} placeholder="GP-24001" value={form.gatepass_id} onChange={e => setForm({ ...form, gatepass_id: e.target.value })} /></div>
            <div><div style={s.label}>Vehicle Plate No</div><input style={s.input} placeholder="UP80AB1234" value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginBottom: 6 }}>
            <input style={s.input} placeholder="Driver Name" value={form.driver_name} onChange={e => setForm({ ...form, driver_name: e.target.value })} />
            <input style={s.input} placeholder="Mobile" value={form.mobile_number} onChange={e => setForm({ ...form, mobile_number: e.target.value })} />
            <input style={s.input} placeholder="Transport Co." value={form.transport_name} onChange={e => setForm({ ...form, transport_name: e.target.value })} />
          </div>
          <div style={{ ...s.card2, background: clr.bg, padding: 8 }}>
            <div style={s.label}>Interactive Lot Mapping Engine</div>
            <select style={{ ...s.select, marginBottom: 4 }} value={item.lot_id} onChange={e => setItem({ ...item, lot_id: e.target.value })}><option value="">Select Target Lot</option>{purchases.filter(p => p.status !== 'closed').map(p => <option key={p.id} value={p.lot_id}>{p.lot_id} [{p.variety}]</option>)}</select>
            {activeLotDetails && (
              <div style={{ fontSize: 11, color: clr.accent, padding: "2px 0 6px" }}>
                Farmer: {activeLotDetails.farmer_name} | Variety: {activeLotDetails.variety} | Grade: {activeLotDetails.grading}<br />
                Available Inventory: {activeLotDetails.manual_bags} Bags ({activeLotDetails.total_weight}kg) | Purchase Price: ₹{activeLotDetails.rate_per_bag}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 4 }}>
              <input type="number" style={s.input} placeholder="Loaded Bags" value={item.manual_bags} onChange={e => setItem({ ...item, manual_bags: e.target.value })} />
              <input type="number" style={s.input} placeholder="Loaded Weight (kg)" value={item.weight} onChange={e => setItem({ ...item, weight: e.target.value })} />
            </div>
            {item.weight && <div style={{ fontSize: 11, color: clr.green, fontWeight: 700, marginBottom: 4 }}>Live Target Valuation: ₹{fmt(realTimeLotCost.toFixed(2))}</div>}
            <button onClick={pushLotToGatepass} style={s.btnSm(clr.accent, "#000")}>+ Bind Lot inside GP</button>
          </div>
          {form.items.map((i, idx) => <div key={idx} style={{ fontSize: 11, marginTop: 4 }}>Locked Entry: {i.lot_id} | Cost Allocation: ₹{fmt(i.cost_value)}</div>)}
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}><button onClick={() => setShow(false)} style={s.btnSm()}>Cancel</button><button onClick={executeDispatchFlow} style={s.btn(clr.green, "#fff")}>Authorize Outbound Dispatch</button></div>
        </div></div>
      )}
    </div>
  );
};

// 4. PROPORTIONAL SALE MODULE
const SaleScreen = ({ sales, dispatches, purchases, ops }) => {
  const [show, setShow] = useState(false);
  const [gatepassInput, setGatepassInput] = useState("");
  const [loadedLots, setLoadedLots] = useState([]);
  const [expenses, setExpenses] = useState({ transport: "", commission: "", hamali: "", other: "" });
  const [rates, setRates] = useState({});
  const [arrivedWeights, setArrivedWeights] = useState({});

  const extractGatepassDataset = () => {
    const match = dispatches.find(d => d.gatepass_id === gatepassInput);
    if (!match) return alert("Gatepass Manifest reference error");
    setLoadedLots(match.items || []);
  };

  const processMandiSalesLedger = async () => {
    if (loadedLots.length === 0) return;
    
    const combinedWeightMetric = loadedLots.reduce((sum, l) => sum + l.weight, 0);
    const transportVal = parseFloat(expenses.transport) || 0;
    const hamaliVal = parseFloat(expenses.hamali) || 0;
    const otherVal = parseFloat(expenses.other) || 0;
    
    const finalSalesArray = loadedLots.map(l => {
      const parentLotDetails = purchases.find(p => p.lot_id === l.lot_id);
      const purchasePricePerKg = parentLotDetails ? (parentLotDetails.rate_per_bag / 52.5) : 0;
      
      const targetArrivedWeight = parseFloat(arrivedWeights[l.lot_id]) || l.weight;
      const targetPricePerKg = parseFloat(rates[l.lot_id]) || 0;

      const calculatedWeightShortage = l.weight - targetArrivedWeight;
      const weightShortageFinancialCost = calculatedWeightShortage * purchasePricePerKg;
      const shortagePercentage = (calculatedWeightShortage / l.weight) * 100;

      const weightProportionRatio = combinedWeightMetric > 0 ? (l.weight / combinedWeightMetric) : 0;
      
      const rawGrossSaleValue = targetArrivedWeight * targetPricePerKg;
      const commissionAmountDeduction = (rawGrossSaleValue * (parseFloat(expenses.commission) || 0)) / 100;

      const totalLotCashExpenses = transportVal + (hamaliVal * l.manual_bags) + otherVal;
      const allocatedProportionalExpense = totalLotCashExpenses * weightProportionRatio;

      const netLotProfitability = rawGrossSaleValue - commissionAmountDeduction - l.cost_value - allocatedProportionalExpense - weightShortageFinancialCost;

      return {
        lot_id: l.lot_id,
        loaded_bags: l.manual_bags,
        loaded_weight: l.weight,
        new_weight: targetArrivedWeight,
        weight_loss: calculatedWeightShortage,
        weight_loss_pct: shortagePercentage,
        weight_loss_cost: weightShortageFinancialCost,
        allocated_expense: allocatedProportionalExpense,
        sale_value: rawGrossSaleValue,
        dispatch_cost: l.cost_value,
        profit_loss: netLotProfitability
      };
    });

    await ops.sales.addItem({ gatepass_id: gatepassInput, lot_sales: finalSalesArray, date: today(), id: uid() });
    setShow(false);
    setLoadedLots([]);
    setGatepassInput("");
  };

  const saleCSV = () => {
    const rows = [];
    sales.forEach(s => s.lot_sales?.forEach(l => rows.push([s.gatepass_id, l.lot_id, l.loaded_bags, l.loaded_weight, l.new_weight, l.weight_loss, l.allocated_expense, l.profit_loss])));
    triggerCSVDownload("Mandi_Sales_Report", ["Gatepass", "LotID", "Bags", "SentWeight", "RecWeight", "ShortageKG", "AllocExpense", "NetProfit"], rows);
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}><span style={{ fontWeight: 700 }}>Sales Desk Terminal</span><div style={s.row}><button onClick={saleCSV} style={s.btnSm(clr.blue)}>CSV Export</button><button onClick={() => setShow(true)} style={{ ...s.btn(), width: "auto", background: clr.green, color: "#fff" }}>Punch Gatepass</button></div></div>
      {sales.map(s => (
        <div key={s.id} style={s.card}>
          <div style={{ fontWeight: 700, color: clr.green, fontSize: 13 }}>Gatepass Registry: {s.gatepass_id}</div>
          {s.lot_sales?.map((l, idx) => (
            <div key={idx} style={{ fontSize: 12, marginTop: 4, background: clr.card2, padding: 6, borderRadius: 6 }}>
              Lot <strong>{l.lot_id}</strong> | Loss: {l.weight_loss?.toFixed(2)}kg ({l.weight_loss_pct?.toFixed(2)}%) | Net Return: <span style={{ color: l.profit_loss >= 0 ? clr.green : clr.red, fontWeight: 700 }}>₹{fmt(l.profit_loss?.toFixed(2))}</span>
            </div>
          ))}
        </div>
      ))}
      {show && (
        <div style={{ position: "fixed", inset: 0, background: "#000c", zIndex: 1000, display: "flex", alignItems: "flex-end" }}><div style={{ background: clr.card, width: "100%", padding: 12, borderRadius: "12px 12px 0 0", maxHeight: "90vh", overflowY: "auto" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}><input style={s.input} placeholder="Input Manifest Gatepass (e.g. GP1002)" value={gatepassInput} onChange={e => setGatepassInput(e.target.value)} /><button onClick={extractGatepassDataset} style={{ ...s.btn(), width: "auto" }}>Fetch</button></div>
          {loadedLots.map((l, index) => (
            <div key={index} style={{ ...s.card2, background: clr.bg }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: clr.accent }}>Lot: {l.lot_id} | Dispatch Metric: {l.manual_bags} Bags ({l.weight}kg)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 6 }}>
                <div><div style={s.label}>Received Weight (kg)</div><input type="number" style={s.input} placeholder="Arrived kg" onChange={e => setArrivedWeights({ ...arrivedWeights, [l.lot_id]: e.target.value })} /></div>
                <div><div style={s.label}>Sale Rate (₹/kg)</div><input type="number" style={s.input} placeholder="Mandi Market Rate" onChange={e => setRates({ ...rates, [l.lot_id]: e.target.value })} /></div>
              </div>
            </div>
          ))}
          {loadedLots.length > 0 && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 8 }}>
                <div><div style={s.label}>Transport Expenses (₹)</div><input type="number" style={s.input} onChange={e => setExpenses({ ...expenses, transport: e.target.value })} /></div>
                <div><div style={s.label}>Mandi Commission (%)</div><input type="number" style={s.input} onChange={e => setExpenses({ ...expenses, commission: e.target.value })} /></div>
                <div><div style={s.label}>Hamali / Bag (₹)</div><input type="number" style={s.input} onChange={e => setExpenses({ ...expenses, hamali: e.target.value })} /></div>
                <div><div style={s.label}>Other Mandi Outlays (₹)</div><input type="number" style={s.input} onChange={e => setExpenses({ ...expenses, other: e.target.value })} /></div>
              </div>
              <button onClick={processMandiSalesLedger} style={{ ...s.btn(clr.green, "#fff"), marginTop: 12 }}>Run Proportional Split Logic</button>
            </>
          )}
        </div></div>
      )}
    </div>
  );
};

// 5. IMMUTABLE STOCK MONITOR
const StockScreen = ({ purchases, dispatches }) => {
  const purchasedBagsTotal = purchases.reduce((sum, p) => sum + (parseInt(p.manual_bags) || 0), 0);
  const dispatchedBagsTotal = dispatches.flatMap(d => d.items || []).reduce((sum, i) => sum + (parseInt(i.manual_bags) || 0), 0);
  const totalWeightInbound = purchases.reduce((sum, p) => sum + (parseFloat(p.total_weight) || 0), 0);
  const totalWeightOutbound = dispatches.flatMap(d => d.items || []).reduce((sum, i) => sum + (parseFloat(i.weight) || 0), 0);

  return (
    <div style={s.content}>
      <div style={s.card}>
        <div style={{ fontWeight: 700, color: clr.accent, marginBottom: 8 }}>Mandi Inventory Analytics (Actual Counts)</div>
        <div style={s.rowBetween}><span>Purchased Bags (Normal):</span><strong>{fmt(purchasedBagsTotal)} Bags</strong></div>
        <div style={s.rowBetween}><span>Dispatched Bags:</span><strong>{fmt(dispatchedBagsTotal)} Bags</strong></div>
        <div style={s.rowBetween} style={{ color: clr.green, padding: "4px 0" }}><span>Remaining Balanced Bags:</span><strong>{fmt(purchasedBagsTotal - dispatchedBagsTotal)} Bags</strong></div>
        <div style={{ height: 1, background: clr.border, margin: "6px 0" }} />
        <div style={s.rowBetween}><span>Total Bought Weight:</span><strong>{fmt(totalWeightInbound)} kg</strong></div>
        <div style={s.rowBetween}><span>Total Dispatched Weight:</span><strong>{fmt(totalWeightOutbound)} kg</strong></div>
        <div style={s.rowBetween} style={{ color: clr.blue }}><span>Net Storage Mass:</span><strong>{fmt(totalWeightInbound - totalWeightOutbound)} kg</strong></div>
      </div>
    </div>
  );
};

// 6. SEARCH HISTORY ENGINE (COMPLETE AUDIT TRAIL)
const SearchScreen = ({ purchases, dispatches, sales }) => {
  const [query, setQuery] = useState("");
  const [trail, setTrail] = useState(null);

  const searchAuditTrail = () => {
    if (!query) return;
    const p = purchases.find(x => x.lot_id.toUpperCase() === query.toUpperCase());
    const d = dispatches.filter(x => x.items?.some(i => i.lot_id.toUpperCase() === query.toUpperCase()));
    const s = sales.filter(x => x.lot_sales?.some(l => l.lot_id.toUpperCase() === query.toUpperCase()));
    setTrail({ purchase: p, dispatches: d, sales: s });
  };

  return (
    <div style={s.content}>
      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}><input style={s.input} placeholder="Search Lot ID (e.g. LOT001)" value={query} onChange={e => setQuery(e.target.value)} /><button onClick={searchAuditTrail} style={{ ...s.btn(), width: "auto" }}>Scan</button></div>
      {trail && (
        <div>
          {trail.purchase && <div style={s.card}><div style={s.label}>Inbound Origin Trace</div><div>Lot: {trail.purchase.lot_id} | Farmer: {trail.purchase.farmer_name} | Cost Basis Rate: ₹{trail.purchase.rate_per_bag}</div></div>}
          {trail.dispatches.map((di, idx) => <div key={idx} style={s.card}><div style={s.label}>Transit Step Trace</div><div>Gatepass: {di.gatepass_id} | Vehicle: {di.vehicle_number}</div></div>)}
          {trail.sales.map((si, idx) => <div key={idx} style={s.card}><div style={s.label}>Final Settlement Trace</div><div>GP Linked: {si.gatepass_id} | Value Generated: ₹{fmt(si.lot_sales?.find(l => l.lot_id.toUpperCase() === query.toUpperCase())?.profit_loss?.toFixed(0))}</div></div>)}
        </div>
      )}
    </div>
  );
};

// GLOBAL CONTAINER
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [purchases, opsPurchases] = useSupabaseTable("purchases");
  const [dispatches, opsDispatches] = useSupabaseTable("dispatches");
  const [sales, opsSales] = useSupabaseTable("sales");

  const ops = { purchases: opsPurchases, dispatches: opsDispatches, sales: opsSales };

  return (
    <div style={s.screen}>
      <div style={s.header}><span style={{ fontWeight: 800, color: clr.accent }}>Mandi Business ERP v4</span></div>
      {tab === "dashboard" && <DashboardScreen purchases={purchases} dispatches={dispatches} sales={sales} />}
      {tab === "purchase" && <PurchaseScreen purchases={purchases} ops={ops} />}
      {tab === "dispatch" && <DispatchScreen dispatches={dispatches} purchases={purchases} ops={ops} />}
      {tab === "sale" && <SaleScreen sales={sales} dispatches={dispatches} purchases={purchases} ops={ops} />}
      {tab === "stock" && <StockScreen purchases={purchases} dispatches={dispatches} />}
      {tab === "search" && <SearchScreen purchases={purchases} dispatches={dispatches} sales={sales} />}
      
      <div style={s.navBar}>
        <button onClick={() => setTab("dashboard")} style={s.navItem(tab === "dashboard")}>Home</button>
        <button onClick={() => setTab("purchase")} style={s.navItem(tab === "purchase")}>Purchase</button>
        <button onClick={() => setTab("dispatch")} style={s.navItem(tab === "dispatch")}>Dispatch</button>
        <button onClick={() => setTab("sale")} style={s.navItem(tab === "sale")}>Sales</button>
        <button onClick={() => setTab("stock")} style={s.navItem(tab === "stock")}>Stock</button>
        <button onClick={() => setTab("search")} style={s.navItem(tab === "search")}>Track</button>
      </div>
    </div>
  );
}
