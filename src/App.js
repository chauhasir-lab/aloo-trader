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

  return [data, { addItem, refresh: fetchData }];
};

const uid = () => Math.random().toString(36).slice(2, 9).toUpperCase();
const fmt = (n) => (isNaN(n) || n === null || n === undefined ? "0" : Number(n).toLocaleString("en-IN"));
const today = () => new Date().toISOString().slice(0, 10);

const clr = { bg: "#0f1117", card: "#1a1d26", card2: "#22263a", accent: "#f5a623", green: "#22c55e", red: "#ef4444", blue: "#3b82f6", border: "#2d3148", text: "#f1f5f9", muted: "#6b7280" };

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

// DOWNLOAD CSV ENGINE
const convertAndDownloadCSV = (title, headers, rows) => {
  const content = [headers, ...rows].map(e => e.join(",")).join("\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${title}_${today()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 1. DASHBOARD SCREEN
const DashboardScreen = ({ purchases }) => {
  const totalBoughtBags = purchases.reduce((sum, p) => sum + (parseInt(p.manual_bags) || 0), 0);
  const activeLots = purchases.filter(p => p.status !== 'closed').length;
  const closedLots = purchases.filter(p => p.status === 'closed').length;

  return (
    <div style={s.content}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
        <div style={{ ...s.card2, background: clr.blue + "15" }}><div style={s.label}>Total Bought Bags (Normal)</div><div style={{ fontSize: 20, fontWeight: 800, color: clr.blue }}>{fmt(totalBoughtBags)}</div></div>
        <div style={{ ...s.card2, background: clr.accent + "15" }}><div style={s.label}>Active Lots</div><div style={{ fontSize: 20, fontWeight: 800, color: clr.accent }}>{activeLots}</div></div>
        <div style={{ ...s.card2, background: clr.red + "15" }}><div style={s.label}>Closed Lots</div><div style={{ fontSize: 20, fontWeight: 800, color: clr.red }}>{closedLots}</div></div>
      </div>
    </div>
  );
};

// 2. PURCHASE SCREEN
const PurchaseScreen = ({ purchases, ops }) => {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ lot_id: "", farmer_name: "", manual_bags: "", total_weight: "", rate_per_bag: "", date: today() });

  const save = async () => {
    if (!form.lot_id || !form.manual_bags) return alert("Please fill details");
    await ops.purchases.addItem({ ...form, status: "open", manual_bags: parseInt(form.manual_bags), rate_per_bag: parseFloat(form.rate_per_bag) });
    setShow(false);
    setForm({ lot_id: "", farmer_name: "", manual_bags: "", total_weight: "", rate_per_bag: "", date: today() });
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}><span style={{ fontWeight: 700 }}>Purchase Lots</span><button onClick={() => setShow(true)} style={{ ...s.btn(), width: "auto" }}>+ Add Lot</button></div>
      {purchases.map(p => (
        <div key={p.id} style={s.card}>
          <div style={s.rowBetween}><strong>Lot: {p.lot_id}</strong><span style={{ fontSize: 11, color: p.status === 'closed' ? clr.red : clr.green }}>{p.status?.toUpperCase()}</span></div>
          <div style={{ fontSize: 12, marginTop: 4, color: clr.muted }}>Farmer: {p.farmer_name} | Normal Bags: {p.manual_bags} | Rate: ₹{p.rate_per_bag}</div>
        </div>
      ))}
      {show && (
        <div style={{ position: "fixed", inset: 0, background: "#000c", zIndex: 1000, display: "flex", alignItems: "flex-end" }}><div style={{ background: clr.card, width: "100%", padding: 12, borderRadius: "12px 12px 0 0" }}>
          <div style={{ marginBottom: 8 }}><div style={s.label}>Lot ID</div><input style={s.input} value={form.lot_id} onChange={e => setForm({ ...form, lot_id: e.target.value })} /></div>
          <div style={{ marginBottom: 8 }}><div style={s.label}>Farmer Name</div><input style={s.input} value={form.farmer_name} onChange={e => setForm({ ...form, farmer_name: e.target.value })} /></div>
          <div style={{ marginBottom: 8 }}><div style={s.label}>Normal Bags Counting</div><input type="number" style={s.input} value={form.manual_bags} onChange={e => setForm({ ...form, manual_bags: e.target.value })} /></div>
          <div style={{ marginBottom: 8 }}><div style={s.label}>Total Weight (kg)</div><input type="number" style={s.input} value={form.total_weight} onChange={e => setForm({ ...form, total_weight: e.target.value })} /></div>
          <div style={{ marginBottom: 8 }}><div style={s.label}>Rate Arranged Per Std Bag</div><input type="number" style={s.input} value={form.rate_per_bag} onChange={e => setForm({ ...form, rate_per_bag: e.target.value })} /></div>
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}><button onClick={() => setShow(false)} style={s.btnSm()}>Cancel</button><button onClick={save} style={s.btn()}>Save Purchase</button></div>
        </div></div>
      )}
    </div>
  );
};

// 3. DISPATCH SCREEN
const DispatchScreen = ({ dispatches, purchases, ops }) => {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ gatepass_id: "", vehicle_number: "", items: [] });
  const [item, setItem] = useState({ lot_id: "", manual_bags: "", weight: "" });

  const selectedLot = purchases.find(p => p.lot_id === item.lot_id);
  const currentCostValue = selectedLot && item.weight ? ((parseFloat(item.weight) / 52.5) * selectedLot.rate_per_bag) : 0;

  const addItemToGP = () => {
    if (!item.lot_id || !item.manual_bags || !item.weight) return alert("Fill all lot metrics");
    setForm(p => ({
      ...p,
      items: [...p.items, {
        lot_id: item.lot_id,
        manual_bags: parseInt(item.manual_bags),
        weight: parseFloat(item.weight),
        variety: selectedLot?.variety_id || "Potato",
        grading: selectedLot?.grading_id || "AGrade",
        cost_value: currentCostValue
      }]
    }));
    setItem({ lot_id: "", manual_bags: "", weight: "" });
  };

  const saveDispatch = async () => {
    if (!form.gatepass_id || form.items.length === 0) return alert("Add items first");
    await ops.dispatches.addItem({ ...form, date: today(), id: uid() });

    // Deduct & auto close status change logic
    for (const shipped of form.items) {
      const match = purchases.find(p => p.lot_id === shipped.lot_id);
      if (match) {
        const remaining = match.manual_bags - shipped.manual_bags;
        await supabase.from("purchases").update({ 
          manual_bags: remaining <= 0 ? 0 : remaining,
          status: remaining <= 0 ? "closed" : "open" 
        }).eq("id", match.id);
      }
    }
    ops.purchases.refresh();
    setShow(false);
    setForm({ gatepass_id: "", vehicle_number: "", items: [] });
  };

  const getWhatsAppLink = (d) => {
    let text = `*Dispatch Details*\nVehicle No: ${d.vehicle_number}\nGatepass: ${d.gatepass_id}\n\n`;
    d.items?.forEach(i => {
      text += `Lot: ${i.lot_id}\nBags: ${i.manual_bags}\nVariety: ${i.variety}\nGrading: ${i.grading}\nWeight: ${i.weight} kg\n\n`;
    });
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const downloadReport = () => {
    const rows = [];
    dispatches.forEach(d => d.items?.forEach(i => rows.push([d.gatepass_id, d.vehicle_number, d.date, i.lot_id, i.manual_bags, i.weight, i.variety, i.grading])));
    convertAndDownloadCSV("Dispatch_Report", ["Gatepass", "Vehicle", "Date", "LotID", "Bags", "Weight", "Variety", "Grading"], rows);
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}><span style={{ fontWeight: 700 }}>Dispatch Desk (Gatepass)</span><div style={s.row}><button onClick={downloadReport} style={s.btnSm(clr.blue)}>Download</button><button onClick={() => setShow(true)} style={{ ...s.btn(), width: "auto" }}>+ New GP</button></div></div>
      {dispatches.map(d => (
        <div key={d.id} style={s.card}>
          <div style={s.rowBetween}><strong>GP: {d.gatepass_id}</strong><a href={getWhatsAppLink(d)} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: clr.green, textDecoration: "none" }}>Share WhatsApp</a></div>
          <div style={{ fontSize: 12, color: clr.muted }}>Vehicle No: {d.vehicle_number}</div>
          {d.items?.map((i, idx) => (
            <div key={idx} style={{ fontSize: 11, background: clr.card2, padding: 4, marginTop: 4, borderRadius: 4 }}>
              Lot: {i.lot_id} | Bags: {i.manual_bags} | Weight: {i.weight} kg | {i.variety} ({i.grading})
            </div>
          ))}
        </div>
      ))}
      {show && (
        <div style={{ position: "fixed", inset: 0, background: "#000c", zIndex: 1000, display: "flex", alignItems: "flex-end" }}><div style={{ background: clr.card, width: "100%", padding: 12, borderRadius: "12px 12px 0 0", maxHeight: "85vh", overflowY: "auto" }}>
          <div style={{ marginBottom: 6 }}><div style={s.label}>Gatepass ID (Manual)</div><input style={s.input} value={form.gatepass_id} onChange={e => setForm({ ...form, gatepass_id: e.target.value })} /></div>
          <div style={{ marginBottom: 6 }}><div style={s.label}>Vehicle Number</div><input style={s.input} value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} /></div>
          <div style={{ ...s.card2, background: clr.bg, padding: 8, marginTop: 8 }}>
            <div style={s.label}>Add Loaded Lot metrics</div>
            <select style={{ ...s.select, marginBottom: 4 }} value={item.lot_id} onChange={e => setItem({ ...item, lot_id: e.target.value })}><option value="">Select Lot</option>{purchases.filter(p => p.status !== 'closed').map(p => <option key={p.id} value={p.lot_id}>{p.lot_id}</option>)}</select>
            {selectedLot && <div style={{ fontSize: 11, color: clr.accent, marginBottom: 4 }}>Variety: {selectedLot.variety_id || "Potato"} | Grading: {selectedLot.grading_id || "AGrade"}</div>}
            <input type="number" style={{ ...s.input, marginBottom: 4 }} placeholder="Bags Count (Normal)" value={item.manual_bags} onChange={e => setItem({ ...item, manual_bags: e.target.value })} />
            <input type="number" style={{ ...s.input, marginBottom: 4 }} placeholder="Loaded Weight (kg)" value={item.weight} onChange={e => setItem({ ...item, weight: e.target.value })} />
            {item.weight && <div style={{ fontSize: 11, color: clr.green, marginBottom: 4 }}>Live Loaded Cost Value: ₹{fmt(currentCostValue)}</div>}
            <button onClick={addItemToGP} style={s.btnSm(clr.accent, "#000")}>+ Push Lot In GP</button>
          </div>
          {form.items.map((i, idx) => <div key={idx} style={{ fontSize: 11, marginTop: 4 }}>Lot {i.lot_id} Added (Value: ₹{fmt(i.cost_value)})</div>)}
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}><button onClick={() => setShow(false)} style={s.btnSm()}>Cancel</button><button onClick={saveDispatch} style={s.btn(clr.green, "#fff")}>Complete Dispatch</button></div>
        </div></div>
      )}
    </div>
  );
};

// 4. SALE SCREEN
const SaleScreen = ({ sales, dispatches, purchases, ops }) => {
  const [show, setShow] = useState(false);
  const [gpId, setGpId] = useState("");
  const [lots, setLots] = useState([]);
  const [exp, setExp] = useState({ transport: "", commission: "", hamali: "", gatepass: "", other: "" });
  const [rates, setRates] = useState({});
  const [weights, setWeights] = useState({});

  const handleFetchGP = () => {
    const match = dispatches.find(d => d.gatepass_id === gpId);
    if (!match) return alert("Gatepass Not Found");
    setLots(match.items || []);
  };

  const saveSale = async () => {
    if (lots.length === 0) return;
    
    const totalBagsInGP = lots.reduce((s, l) => s + l.manual_bags, 0);
    const totalCashExpenses = (parseFloat(exp.transport) || 0) + (parseFloat(exp.other) || 0);
    const perBagExpenses = ((parseFloat(exp.hamali) || 0) + (parseFloat(exp.gatepass) || 0)) * totalBagsInGP;
    const directExpensesSum = totalCashExpenses + perBagExpenses;
    const splitExpensePerLot = directExpensesSum / lots.length;

    const calculatedSales = lots.map(l => {
      const pLot = purchases.find(p => p.lot_id === l.lot_id);
      const originalRatePerKg = pLot ? (pLot.rate_per_bag / 52.5) : 0;
      const finalWeight = parseFloat(weights[l.lot_id]) || l.weight;
      const finalPrice = parseFloat(rates[l.lot_id]) || 0;

      const weightLoss = l.weight - finalWeight;
      const weightLossCost = weightLoss * originalRatePerKg;

      const grossSale = finalWeight * finalPrice;
      const commDeduction = (grossSale * (parseFloat(exp.commission) || 0)) / 100;
      const netSale = grossSale - commDeduction;

      const profitLoss = netSale - l.cost_value - splitExpensePerLot - weightLossCost;

      return {
        lot_id: l.lot_id,
        loaded_bags: l.manual_bags,
        loaded_weight: l.weight,
        new_weight: finalWeight,
        weight_loss: weightLoss,
        weight_loss_cost: weightLossCost,
        allocated_expense: splitExpensePerLot,
        profit_loss: profitLoss
      };
    });

    await ops.sales.addItem({ gatepass_id: gpId, lot_sales: calculatedSales, date: today(), id: uid() });
    setShow(false);
    setLots([]);
    setGpId("");
  };

  const downloadReport = () => {
    const rows = [];
    sales.forEach(s => s.lot_sales?.forEach(l => rows.push([s.gatepass_id, l.lot_id, l.loaded_bags, l.loaded_weight, l.new_weight, l.weight_loss, l.allocated_expense, l.profit_loss])));
    convertAndDownloadCSV("Sales_Report", ["Gatepass", "LotID", "Bags", "SentWeight", "NewWeight", "WeightLoss", "ExpenseSplit", "ProfitLoss"], rows);
  };

  return (
    <div style={s.content}>
      <div style={{ ...s.rowBetween, marginBottom: 12 }}><span style={{ fontWeight: 700 }}>Mandi Sales Screen</span><div style={s.row}><button onClick={downloadReport} style={s.btnSm(clr.blue)}>Download</button><button onClick={() => setShow(true)} style={{ ...s.btn(), width: "auto", background: clr.green, color: "#fff" }}>Punch Gatepass</button></div></div>
      {sales.map(s => (
        <div key={s.id} style={s.card}>
          <div style={{ fontWeight: 700, color: clr.green }}>GP ID: {s.gatepass_id}</div>
          {s.lot_sales?.map((l, idx) => (
            <div key={idx} style={{ fontSize: 12, marginTop: 4, borderBottom: `1px dashed ${clr.border}`, paddingBottom: 4 }}>
              Lot <strong>{l.lot_id}</strong> | Loss: {l.weight_loss} kg | Net P&L: <span style={{ color: l.profit_loss >= 0 ? clr.green : clr.red }}>₹{fmt(l.profit_loss.toFixed(2))}</span>
            </div>
          ))}
        </div>
      ))}
      {show && (
        <div style={{ position: "fixed", inset: 0, background: "#000c", zIndex: 1000, display: "flex", alignItems: "flex-end" }}><div style={{ background: clr.card, width: "100%", padding: 12, borderRadius: "12px 12px 0 0", maxHeight: "90vh", overflowY: "auto" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}><input style={s.input} placeholder="Punch Gatepass Unique ID" value={gpId} onChange={e => setGpId(e.target.value)} /><button onClick={handleFetchGP} style={{ ...s.btn(), width: "auto" }}>Fetch</button></div>
          {lots.map((l, idx) => (
            <div key={idx} style={{ ...s.card2, background: clr.bg, marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>Lot: {l.lot_id} (Bags: {l.manual_bags} | W: {l.weight} kg)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 6 }}>
                <div><div style={s.label}>New Arrived Weight</div><input type="number" style={s.input} placeholder="Manual kg" onChange={e => setWeights({ ...weights, [l.lot_id]: e.target.value })} /></div>
                <div><div style={s.label}>Sale Price / kg</div><input type="number" style={s.input} placeholder="Rs" onChange={e => setRates({ ...rates, [l.lot_id]: e.target.value })} /></div>
              </div>
            </div>
          ))}
          {lots.length > 0 && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
                <div><div style={s.label}>Transport Charges (Rs)</div><input type="number" style={s.input} onChange={e => setExp({ ...exp, transport: e.target.value })} /></div>
                <div><div style={s.label}>Mandi Commission (%)</div><input type="number" style={s.input} onChange={e => setExp({ ...exp, commission: e.target.value })} /></div>
                <div><div style={s.label}>Hamali / Bag (Rs)</div><input type="number" style={s.input} onChange={e => setExp({ ...exp, hamali: e.target.value })} /></div>
                <div><div style={s.label}>Gatepass Fee / Bag (Rs)</div><input type="number" style={s.input} onChange={e => setExp({ ...exp, gatepass: e.target.value })} /></div>
              </div>
              <div style={{ marginTop: 6 }}><div style={s.label}>Other Mandi Expenses (Rs)</div><input type="number" style={s.input} onChange={e => setExp({ ...exp, other: e.target.value })} /></div>
              <button onClick={saveSale} style={{ ...s.btn(clr.green, "#fff"), marginTop: 12 }}>Deduct Expenses & Calculate P&L</button>
            </>
          )}
        </div></div>
      )}
    </div>
  );
};

// 5. STOCK SCREEN
const StockScreen = ({ purchases, dispatches }) => {
  const totalBoughtBags = purchases.reduce((sum, p) => sum + (parseInt(p.manual_bags) || 0), 0);
  const totalDispatchedBags = dispatches.flatMap(d => d.items || []).reduce((sum, i) => sum + (parseInt(i.manual_bags) || 0), 0);
  const balanceNormalBags = totalBoughtBags - totalDispatchedBags;

  return (
    <div style={s.content}>
      <div style={s.card}>
        <strong style={{ color: clr.accent }}>Normal Bags Inventory Book</strong>
        <div style={{ ...s.rowBetween, fontSize: 13, marginTop: 8 }}><span>Total Bought Counting:</span><span>{fmt(totalBoughtBags)} Bags</span></div>
        <div style={{ ...s.rowBetween, fontSize: 13, marginTop: 4 }}><span>Total Dispatched Out:</span><span>{fmt(totalDispatchedBags)} Bags</span></div>
        <div style={{ ...s.rowBetween, fontSize: 13, marginTop: 4, color: clr.green }}><span>Live Available Stock:</span><strong>{fmt(balanceNormalBags)} Bags</strong></div>
      </div>
    </div>
  );
};

// CONTAINER
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [purchases, opsPurchases] = useSupabaseTable("purchases");
  const [dispatches, opsDispatches] = useSupabaseTable("dispatches");
  const [sales, opsSales] = useSupabaseTable("sales");

  const ops = { purchases: opsPurchases, dispatches: opsDispatches, sales: opsSales };

  return (
    <div style={s.screen}>
      <div style={s.header}><span style={{ fontWeight: 800, color: clr.accent }}>Mandi Management System</span></div>
      {tab === "dashboard" && <DashboardScreen purchases={purchases} />}
      {tab === "purchase" && <PurchaseScreen purchases={purchases} ops={ops} />}
      {tab === "dispatch" && <DispatchScreen dispatches={dispatches} purchases={purchases} ops={ops} />}
      {tab === "sale" && <SaleScreen sales={sales} dispatches={dispatches} purchases={purchases} ops={ops} />}
      {tab === "stock" && <StockScreen purchases={purchases} dispatches={dispatches} />}
      <div style={s.navBar}>
        <button onClick={() => setTab("dashboard")} style={s.navItem(tab === "dashboard")}>Home</button>
        <button onClick={() => setTab("purchase")} style={s.navItem(tab === "purchase")}>Purchase</button>
        <button onClick={() => setTab("dispatch")} style={s.navItem(tab === "dispatch")}>Dispatch</button>
        <button onClick={() => setTab("sale")} style={s.navItem(tab === "sale")}>Sales</button>
        <button onClick={() => setTab("stock")} style={s.navItem(tab === "stock")}>Stock</button>
      </div>
    </div>
  );
}
