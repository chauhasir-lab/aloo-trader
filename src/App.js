import React, { useState, useCallback, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// --- CONFIG & SUPABASE CLIENT ---
const SUPABASE_URL = "https://cxjmwjljjnuthcrmnbqb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4am13amxqam51dGhjcm1uYnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTYzMzUsImV4cCI6MjA5MjY3MjMzNX0.ynRaceAT1uWcsPOJ_5vY_8NKolM3EaWKQajUEk4sLz8";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- CUSTOM HOOK ---
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
    const { id, created_at, ...rest } = item;
    const formatted = { ...rest };
    if (formatted.items && typeof formatted.items !== 'string') formatted.items = JSON.stringify(formatted.items);
    if (formatted.lot_sales && typeof formatted.lot_sales !== 'string') formatted.lot_sales = JSON.stringify(formatted.lot_sales);
    
    const { data: inserted, error } = await supabase.from(tableName).insert([formatted]).select();
    if (!error && inserted) {
      const resp = { ...inserted[0] };
      if (resp.items && typeof resp.items === 'string') try { resp.items = JSON.parse(resp.items); } catch { resp.items = []; }
      if (resp.lot_sales && typeof resp.lot_sales === 'string') try { resp.lot_sales = JSON.parse(resp.lot_sales); } catch { resp.lot_sales = []; }
      setData(p => [resp, ...p]);
    }
  }, [tableName]);

  const editItem = useCallback(async (item) => {
    const { id, created_at, ...rest } = item;
    const formatted = { ...rest };
    if (formatted.items && typeof formatted.items !== 'string') formatted.items = JSON.stringify(formatted.items);
    if (formatted.lot_sales && typeof formatted.lot_sales !== 'string') formatted.lot_sales = JSON.stringify(formatted.lot_sales);

    const { error } = await supabase.from(tableName).update(formatted).eq("id", id);
    if (!error) setData(p => p.map(x => x.id === id ? { ...x, ...item } : x));
  }, [tableName]);

  const deleteItem = useCallback(async (id) => {
    const { error } = await supabase.from(tableName).delete().eq("id", id);
    if (!error) setData(p => p.filter(x => x.id !== id));
  }, [tableName]);

  return [data, { addItem, editItem, deleteItem, loading, refresh: fetchData }];
};

// --- HELPER UTILS ---
const uid = () => Math.random().toString(36).slice(2, 7).toUpperCase();
const fmt = (n, d = 0) => (isNaN(n) || n === null || n === undefined ? "0" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d }));
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "-";
const today = () => new Date().toISOString().slice(0, 10);

// --- DESIGN SYSTEM UI COLORS ---
const clr = { bg: "#0f1117", card: "#1a1d26", card2: "#22263a", accent: "#f5a623", green: "#22c55e", red: "#ef4444", blue: "#3b82f6", purple: "#a855f7", muted: "#6b7280", border: "#2d3148", text: "#f1f5f9" };

// --- CORE CALCULATIONS BUSINESS LOGIC ---
const getLotStatus = (lot, dispatches = [], sales = []) => {
  const totalDispatched = dispatches.flatMap(d => d.items || []).filter(i => i.lot_id === lot.lot_id).reduce((sum, i) => sum + parseFloat(i.bags || 0), 0);
  const totalSold = sales.flatMap(s => s.lot_sales || []).filter(l => l.lot_id === lot.lot_id).reduce((sum, l) => sum + parseFloat(l.bags || 0), 0);
  
  const effectiveBags = lot.pricing_type === "STD" ? parseFloat(lot.std_bags || 0) : parseFloat(lot.manual_bags || 0);
  const remaining = Math.max(0, effectiveBags - totalDispatched);
  
  const isSold = totalSold > 0;
  let profitLoss = 0;
  let totalSoldValue = 0;
  let expense = 0;

  if (isSold) {
    totalSoldValue = sales.flatMap(s => s.lot_sales || []).filter(l => l.lot_id === lot.lot_id).reduce((sum, l) => sum + (parseFloat(l.bags || 0) * parseFloat(l.rate || 0)), 0);
    
    expense = sales.reduce((sum, s) => {
      const matchLotSale = s.lot_sales?.find(l => l.lot_id === lot.lot_id);
      if (matchLotSale) {
        return sum + (parseFloat(matchLotSale.bags || 0) * parseFloat(s.labor_per_bag || 0));
      }
      return sum;
    }, 0);
    
    profitLoss = totalSoldValue - (parseFloat(lot.total_amount) || 0) - expense;
  }

  return { 
    totalDispatched, 
    totalSold, 
    remaining, 
    isClosed: remaining <= 0 && totalDispatched > 0, 
    isSold,
    profitLoss,
    totalSoldValue
  };
};

const getLotJourney = (lot, dispatches = [], sales = []) => {
  const status = getLotStatus(lot, dispatches, sales);
  const dispatchInfo = dispatches.find(d => d.items?.some(i => i.lot_id === lot.lot_id));
  const saleInfo = sales.find(s => s.lot_sales?.some(l => l.lot_id === lot.lot_id));
  
  return {
    lotId: lot.lot_id,
    farmerName: lot.kisan_name,
    buyDate: lot.date,
    manualBags: lot.manual_bags,
    stdBags: lot.std_bags,
    totalWeight: lot.total_weight,
    purchaseRate: lot.rate,
    purchaseAmount: lot.total_amount,
    dispatchedBags: status.totalDispatched,
    gatepassId: dispatchInfo?.gatepass_id || "-",
    vehicleNo: dispatchInfo?.truck_no || "-",
    dispatchDate: dispatchInfo?.date || "-",
    soldBags: status.totalSold,
    saleRate: saleInfo?.lot_sales?.find(l => l.lot_id === lot.lot_id)?.rate || "-",
    bijakId: saleInfo?.bijak_id || "-",
    saleDate: saleInfo?.date || "-",
    totalSoldValue: status.totalSoldValue,
    laborExpense: saleInfo ? status.totalDispatched * (parseFloat(saleInfo.labor_per_bag) || 0) : 0,
    profitLoss: status.profitLoss,
    status: status.isClosed ? "CLOSED" : (status.isSold ? "SOLD" : "ACTIVE")
  };
};

// --- ICON PACK ---
const Icon = ({ name, size = 18, color = clr.text }) => {
  const icons = {
    purchase: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    dispatch: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
    sale: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    master: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
    add: "M12 4v16m8-8H4", x: "M6 18L18 6M6 6l12 12", trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16", edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icons[name]} /></svg>;
};

// --- GENERAL STYLES ---
const s = {
  screen: { minHeight: "100vh", background: clr.bg, color: clr.text, fontFamily: "system-ui, -apple-system, sans-serif", maxWidth: 480, margin: "0 auto", position: "relative", paddingBottom: 80 },
  header: { background: clr.card, padding: "14px 16px", borderBottom: `1px solid ${clr.border}`, position: "sticky", top: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center" },
  card: { background: clr.card, borderRadius: 12, padding: 14, marginBottom: 10, border: `1px solid ${clr.border}` },
  card2: { background: clr.card2, borderRadius: 10, padding: 12, marginBottom: 8, border: `1px solid ${clr.border}` },
  rowBetween: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  row: { display: "flex", alignItems: "center", gap: 8 },
  input: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 8, padding: "10px 12px", color: clr.text, fontSize: 14, boxSizing: "border-box", outline: "none" },
  select: { width: "100%", background: clr.card2, border: `1px solid ${clr.border}`, borderRadius: 8, padding: "10px 12px", color: clr.text, fontSize: 14, boxSizing: "border-box", outline: "none" },
  label: { fontSize: 11, color: clr.muted, marginBottom: 3, fontWeight: 600, textTransform: "uppercase" },
  btn: (bg = clr.accent, txt = "#000") => ({ width: "100%", background: bg, color: txt, border: "none", borderRadius: 8, padding: "11px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }),
  btnSm: (bg = clr.card2, txt = clr.text) => ({ background: bg, color: txt, border: `1px solid ${clr.border}`, borderRadius: 6, padding: "6px 10px", fontWeight: 600, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }),
  tag: (bg = clr.accent + "22", txt = clr.accent) => ({ background: bg, color: txt, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }),
  content: { padding: 16 },
  navBar: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: clr.card, borderTop: `1px solid ${clr.border}`, display: "flex", zIndex: 200 },
  navItem: (active) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 4px", gap: 3, background: "none", border: "none", color: active ? clr.accent : clr.muted, fontSize: 10, cursor: "pointer" }),
  divider: { height: 1, background: clr.border, margin: "10px 0" }
};

const Field = ({ label, children }) => <div style={{ marginBottom: 12 }}><div style={s.label}>{label}</div>{children}</div>;
const Modal = ({ open, onClose, title, children }) => !open ? null : <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 1000, display: "flex", alignItems: "flex-end" }}><div style={{ background: clr.card, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "85vh", display: "flex", flexDirection: "column", border: `1px solid ${clr.border}`, margin: "0 auto" }}><div style={{ ...s.rowBetween, padding: 16 }}><span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span><button onClick={onClose} style={s.btnSm()}><Icon name="x" size={14} /></button></div><div style={{ overflowY: "auto", padding: "0 16px 24px" }}>{children}</div></div></div>;

// --- DASHBOARD COMPONENT ---
const DashboardScreen = ({ purchases, dispatches, sales }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  const activeLots = purchases.filter(p => !getLotStatus(p, dispatches, sales).isClosed).length;
  const soldLots = purchases.filter(p => getLotStatus(p, dispatches, sales).isSold).length;
  
  const totalBalanceKg = purchases.reduce((sum, p) => {
    const status = getLotStatus(p, dispatches, sales);
    return sum + (status.remaining * (p.pricing_type === "STD" ? 52.5 : (p.total_weight / p.manual_bags)));
  }, 0);
  
  const totalProfitLoss = purchases.reduce((sum, p) => {
    const status = getLotStatus(p, dispatches, sales);
    return sum + (status.isSold ? status.profitLoss : 0);
  }, 0);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const query = searchQuery.toLowerCase();
    let foundLot = purchases.find(p => p.lot_id.toLowerCase() === query);
    
    if (!foundLot) {
      const foundDispatch = dispatches.find(d => d.gatepass_id.toLowerCase() === query || d.truck_no?.toLowerCase() === query);
      if (foundDispatch && foundDispatch.items?.length > 0) {
        foundLot = purchases.find(p => p.lot_id === foundDispatch.items[0].lot_id);
      }
    }
    
    if (foundLot) {
      setSearchResult(getLotJourney(foundLot, dispatches, sales));
    } else {
      alert("कोई रिकॉर्ड नहीं मिला!");
      setSearchResult(null);
    }
  };

  return (
    <div style={s.content}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div style={s.card}>
          <div style={s.label}>एक्टिव लॉट्स</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: clr.blue }}>{activeLots}</div>
        </div>
        <div style={s.card}>
          <div style={s.label}>बिक्री हुए लॉट्स</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: clr.green }}>{soldLots}</div>
        </div>
        <div style={s.card}>
          <div style={s.label}>बचा हुआ स्टॉक (KG)</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: clr.purple }}>{fmt(totalBalanceKg)} kg</div>
        </div>
        <div style={s.card}>
          <div style={s.label}>कुल शुद्ध लाभ/हानि</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: totalProfitLoss >= 0 ? clr.green : clr.red }}>
            ₹{fmt(totalProfitLoss)}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={s.label}>🔍 लॉट / गेटपास / गाड़ी नंबर खोजें</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...s.input, flex: 1 }} placeholder="LOT-XYZ or GP-100" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          <button onClick={handleSearch} style={{ ...s.btn(clr.accent, "#000"), width: "auto", padding: "0 16px" }}><Icon name="search" size={16} /></button>
        </div>
      </div>

      {searchResult && (
        <div style={{ ...s.card, background: clr.card2 }}>
          <div style={s.rowBetween}>
            <span style={{ fontWeight: 700, color: clr.accent }}>📋 लॉट ट्रैकिंग: {searchResult.lotId}</span>
            <span style={s.tag(searchResult.status === "CLOSED" ? clr.red + "22" : clr.green + "22", searchResult.status === "CLOSED" ? clr.red : clr.green)}>{searchResult.status}</span>
          </div>
          <div style={s.divider} />
          <div style={{ fontSize: 13, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 4px" }}>
            <div>किसान: <b>{searchResult.farmerName}</b></div>
            <div>तारीख: {fmtDate(searchResult.buyDate)}</div>
            <div>टोटल वजन: {fmt(searchResult.totalWeight)} kg</div>
            <div>लागत: ₹{fmt(searchResult.purchaseAmount)}</div>
            <div>गेटपास: {searchResult.gatepassId} ({searchResult.vehicleNo})</div>
            <div>भेजे कट्टे: {searchResult.dispatchedBags}</div>
            <div>बिक्री बीजक: {searchResult.bijakId}</div>
            <div>बिक्री रकम: ₹{fmt(searchResult.totalSoldValue)}</div>
          </div>
          <div style={s.divider} />
          <div style={{ ...s.rowBetween, fontWeight: 700, color: searchResult.profitLoss >= 0 ? clr.green : clr.red }}>
            <span>शुद्ध लाभ/हानि:</span>
            <span>₹{fmt(searchResult.profitLoss)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// --- PURCHASES COMPONENT ---
const PurchaseScreen = ({ purchases, varieties, ops, dispatches, sales }) => {
  const [open, setOpen] = useState(false);
  const [w, setW] = useState("");
  const [rate, setRate] = useState("");
  const [type, setType] = useState("STD");
  const [manBags, setManBags] = useState("");
  const [kisan, setKisan] = useState("");
  const [v, setV] = useState("");

  const stdBags = w ? (parseFloat(w) / 52.5).toFixed(2) : 0;
  const totalAmount = type === "STD" ? (stdBags * parseFloat(rate || 0)).toFixed(0) : (parseFloat(manBags || 0) * parseFloat(rate || 0)).toFixed(0);

  const save = async () => {
    if (!kisan || !w || !rate) return alert("सभी जानकारी भरें!");
    await ops.purchases.addItem({
      lot_id: "LOT-" + uid(),
      date: today(),
      kisan_name: kisan,
      variety: v,
      total_weight: parseFloat(w),
      pricing_type: type,
      std_bags: parseFloat(stdBags),
      manual_bags: type === "MAN" ? parseFloat(manBags) : null,
      rate: parseFloat(rate),
      total_amount: parseFloat(totalAmount)
    });
    setOpen(false); setKisan(""); setW(""); setRate(""); setManBags("");
  };

  return (
    <div style={s.content}>
      <button onClick={() => setOpen(true)} style={{ ...s.btn(), marginBottom: 12 }}>+ नया लॉट खरीदें</button>
      {purchases.map(p => {
        const stat = getLotStatus(p, dispatches, sales);
        return (
          <div key={p.id} style={s.card}>
            <div style={s.rowBetween}>
              <strong>{p.lot_id} - {p.kisan_name}</strong>
              <span style={s.tag(clr.accent + "22", clr.accent)}>₹{fmt(p.total_amount)}</span>
            </div>
            <div style={{ fontSize: 13, color: clr.muted, marginTop: 4 }}>
              {p.total_weight} kg ({p.pricing_type === "STD" ? `${p.std_bags} STD कट्टे` : `${p.manual_bags} कट्टे`}) @ ₹{p.rate}
            </div>
            <div style={s.divider} />
            <div style={{ ...s.rowBetween, fontSize: 12 }}>
              <span style={{ color: clr.blue }}>भेजे: {stat.totalDispatched} कट्टे</span>
              <span style={{ color: clr.green }}>बचे: {stat.remaining} कट्टे</span>
            </div>
          </div>
        );
      })}

      <Modal open={open} onClose={() => setOpen(false)} title="नयी खरीद एंट्री">
        <Field label="किसान का नाम"><input style={s.input} value={kisan} onChange={e => setKisan(e.target.value)} /></Field>
        <Field label="किस्म / Variety">
          <select style={s.select} value={v} onChange={e => setV(e.target.value)}>
            <option value="">चुनें</option>
            {varieties.map(x => <option key={x.id} value={x.name}>{x.name}</option>)}
          </select>
        </Field>
        <Field label="कुल वजन (KG)"><input type="number" style={s.input} value={w} onChange={e => setW(e.target.value)} /></Field>
        <Field label="कैलकुलेशन मोड">
          <select style={s.select} value={type} onChange={e => setType(e.target.value)}>
            <option value="STD">STD (52.5 kg = 1 कट्टा)</option>
            <option value="MAN">MANUAL</option>
          </select>
        </Field>
        {type === "MAN" && <Field label="मैनुअल कट्टे संख्या"><input type="number" style={s.input} value={manBags} onChange={e => setManBags(e.target.value)} /></Field>}
        <Field label="दर (Rate)"><input type="number" style={s.input} value={rate} onChange={e => setRate(e.target.value)} /></Field>
        
        <div style={{ background: clr.card2, padding: 10, borderRadius: 8, marginBottom: 12 }}>
          <div style={s.label}>लाइव प्रीव्यू कैलकुलेशन:</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: clr.green }}>
            {type === "STD" ? `${stdBags} STD कट्टे` : `${manBags || 0} कट्टे`} × ₹{rate || 0} = ₹{fmt(totalAmount)}
          </div>
        </div>
        <button onClick={save} style={s.btn()}>लॉट सुरक्षित करें</button>
      </Modal>
    </div>
  );
};

// --- DISPATCH COMPONENT ---
const DispatchScreen = ({ dispatches, purchases, coldStorages, mandis, ops, sales }) => {
  const [open, setOpen] = useState(false);
  const [truck, setTruck] = useState("");
  const [storage, setStorage] = useState("");
  const [mandi, setMandi] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [curLot, setCurLot] = useState("");
  const [curBags, setCurBags] = useState("");

  const activeLots = purchases.filter(p => getLotStatus(p, dispatches, sales).remaining > 0);

  const handleAddLot = () => {
    if (!curLot || !curBags) return;
    const lotObj = purchases.find(p => p.lot_id === curLot);
    const stat = getLotStatus(lotObj, dispatches, sales);
    if (parseFloat(curBags) > stat.remaining) return alert(`त्रुटि: केवल ${stat.remaining} कट्टे बचे हैं!`);

    setSelectedItems([...selectedItems, { lot_id: curLot, kisan: lotObj.kisan_name, bags: parseFloat(curBags) }]);
    setCurLot(""); setCurBags("");
  };

  const save = async () => {
    if (selectedItems.length === 0 || !truck) return alert("गाड़ी नंबर और लॉट्स जोड़ें!");
    await ops.dispatches.addItem({
      gatepass_id: "GP-" + uid(),
      date: today(),
      truck_no: truck,
      cold_storage: storage,
      mandi: mandi,
      items: selectedItems
    });
    setOpen(false); setSelectedItems([]); setTruck("");
  };

  return (
    <div style={s.content}>
      <button onClick={() => setOpen(true)} style={{ ...s.btn(), marginBottom: 12 }}>+ नया गेटपास / चालान</button>
      {dispatches.map(d => (
        <div key={d.id} style={s.card}>
          <div style={s.rowBetween}>
            <strong>{d.gatepass_id} ({d.truck_no})</strong>
            <span style={{ fontSize: 12, color: clr.muted }}>{fmtDate(d.date)}</span>
          </div>
          <div style={{ fontSize: 12, color: clr.accent, margin: "4px 0" }}>{d.cold_storage} ➔ {d.mandi}</div>
          {d.items?.map((i, idx) => (
            <div key={idx} style={{ fontSize: 13, background: clr.bg, padding: "4px 8px", borderRadius: 4, marginTop: 4 }}>
              📦 {i.lot_id} ({i.kisan}) — <b>{i.bags} कट्टे</b>
            </div>
          ))}
        </div>
      ))}

      <Modal open={open} onClose={() => setOpen(false)} title="निकासी गेटपास बनाएं">
        <Field label="गाड़ी नंबर"><input style={s.input} value={truck} onChange={e => setTruck(e.target.value)} placeholder="UP-81-X-1234" /></Field>
        <Field label="कोल्ड स्टोरेज">
          <select style={s.select} value={storage} onChange={e => setStorage(e.target.value)}>
            <option value="">चुनें</option>
            {coldStorages.map(x => <option key={x.id} value={x.name}>{x.name}</option>)}
          </select>
        </Field>
        <Field label="मंडी">
          <select style={s.select} value={mandi} onChange={e => setMandi(e.target.value)}>
            <option value="">चुनें</option>
            {mandis.map(x => <option key={x.id} value={x.name}>{x.name}</option>)}
          </select>
        </Field>

        <div style={{ ...s.card, background: clr.card2, padding: 8 }}>
          <div style={s.label}>लॉट्स लोड करें</div>
          <select style={{ ...s.select, marginBottom: 8 }} value={curLot} onChange={e => setCurLot(e.target.value)}>
            <option value="">लॉट चुनें</option>
            {activeLots.map(p => {
              const rem = getLotStatus(p, dispatches, sales).remaining;
              return <option key={p.id} value={p.lot_id}>{p.lot_id} ({p.kisan_name}) - {rem} कट्टे बाकी</option>;
            })}
          </select>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="number" style={{ ...s.input, flex: 1 }} placeholder="कट्टे संख्या" value={curBags} onChange={e => setCurBags(e.target.value)} />
            <button onClick={handleAddLot} style={{ ...s.btn(clr.blue, "#fff"), width: "auto" }}>+ एड</button>
          </div>
        </div>

        {selectedItems.map((item, index) => (
          <div key={index} style={{ ...s.rowBetween, background: clr.card2, padding: "6px 12px", borderRadius: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 13 }}>{item.lot_id} - {item.bags} कट्टे</span>
            <button onClick={() => setSelectedItems(selectedItems.filter((_, i) => i !== index))} style={{ background: "none", border: "none", color: clr.red }}>X</button>
          </div>
        ))}
        <button onClick={save} style={{ ...s.btn(), marginTop: 12 }}>गेटपास जेनरेट करें</button>
      </Modal>
    </div>
  );
};

// --- SALES COMPONENT ---
const SalesScreen = ({ sales, dispatches, purchases, parties, ops }) => {
  const [open, setOpen] = useState(false);
  const [party, setParty] = useState("");
  const [labor, setLabor] = useState("");
  const [saleLot, setSaleLot] = useState("");
  const [saleBags, setSaleBags] = useState("");
  const [saleRate, setSaleRate] = useState("");
  const [lotSalesList, setLotSalesList] = useState([]);

  const handleAddSaleItem = () => {
    if (!saleLot || !saleBags || !saleRate) return;
    setLotSalesList([...lotSalesList, { lot_id: saleLot, bags: parseFloat(saleBags), rate: parseFloat(saleRate) }]);
    setSaleLot(""); setSaleBags(""); setSaleRate("");
  };

  const totalBijakAmt = lotSalesList.reduce((sum, x) => sum + (x.bags * x.rate), 0);

  const save = async () => {
    if (lotSalesList.length === 0 || !party) return alert("व्यापारी और बिक्री विवरण जोड़ें!");
    await ops.sales.addItem({
      bijak_id: "BJ-" + uid(),
      date: today(),
      party_name: party,
      labor_per_bag: parseFloat(labor || 0),
      lot_sales: lotSalesList
    });
    setOpen(false); setLotSalesList([]); setParty(""); setLabor("");
  };

  return (
    <div style={s.content}>
      <button onClick={() => setOpen(true)} style={{ ...s.btn(), marginBottom: 12 }}>+ नया बिक्री बीजक / Bijak</button>
      {sales.map(s => (
        <div key={s.id} style={s.card}>
          <div style={s.rowBetween}>
            <strong>{s.bijak_id} - {s.party_name}</strong>
            <span style={{ fontSize: 14, fontWeight: 700, color: clr.green }}>
              ₹{fmt(s.lot_sales?.reduce((sum, x) => sum + (x.bags * x.rate), 0))}
            </span>
          </div>
          <div style={{ fontSize: 11, color: clr.muted }}>मजदूरी खर्च: ₹{s.labor_per_bag}/कट्टा</div>
          {s.lot_sales?.map((l, idx) => (
            <div key={idx} style={{ fontSize: 12, background: clr.bg, padding: 6, borderRadius: 4, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
              <span>लॉट: <b>{l.lot_id}</b></span>
              <span>{l.bags} कट्टे @ ₹{l.rate}</span>
            </div>
          ))}
        </div>
      ))}

      <Modal open={open} onClose={() => setOpen(false)} title="नया मंडी बिक्री बीजक">
        <Field label="व्यापारी / पार्टी">
          <select style={s.select} value={party} onChange={e => setParty(e.target.value)}>
            <option value="">चुनें</option>
            {parties.map(x => <option key={x.id} value={x.name}>{x.name}</option>)}
          </select>
        </Field>
        <Field label="मजदूरी प्रति कट्टा खर्च (₹)"><input type="number" style={s.input} value={labor} onChange={e => setLabor(e.target.value)} placeholder="₹5" /></Field>

        <div style={{ ...s.card, background: clr.card2, padding: 8 }}>
          <div style={s.label}>बिक्री लॉट एंट्री</div>
          <select style={{ ...s.select, marginBottom: 6 }} value={saleLot} onChange={e => setSaleLot(e.target.value)}>
            <option value="">लॉट चुनें</option>
            {purchases.map(p => <option key={p.id} value={p.lot_id}>{p.lot_id} ({p.kisan_name})</option>)}
          </select>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
            <input type="number" style={s.input} placeholder="कट्टे संख्या" value={saleBags} onChange={e => setSaleBags(e.target.value)} />
            <input type="number" style={s.input} placeholder="बिक्री दर (₹)" value={saleRate} onChange={e => setSaleRate(e.target.value)} />
          </div>
          <button onClick={handleAddSaleItem} style={s.btn(clr.blue, "#fff")}>+ बीजक में जोड़ें</button>
        </div>

        {lotSalesList.map((x, i) => (
          <div key={i} style={{ ...s.rowBetween, background: clr.card2, padding: 8, borderRadius: 6, fontSize: 13, marginBottom: 4 }}>
            <span>{x.lot_id} ➔ {x.bags} कट्टे @ ₹{x.rate}</span>
            <span style={{ fontWeight: 600 }}>₹{x.bags * x.rate}</span>
          </div>
        ))}
        <div style={{ fontSize: 15, fontWeight: 700, margin: "10px 0", color: clr.accent }}>कुल बीजक मूल्य: ₹{fmt(totalBijakAmt)}</div>
        <button onClick={save} style={s.btn()}>बीजक फाइनल करें</button>
      </Modal>
    </div>
  );
};

// --- MAIN WRAPPER CONTAINER APP ---
export default function App() {
  const [screen, setScreen] = useState("dash");

  const [purchases, purchaseOps] = useSupabaseTable("purchases");
  const [dispatches, dispatchOps] = useSupabaseTable("dispatches");
  const [sales, saleOps] = useSupabaseTable("sales");
  const [varieties, varietyOps] = useSupabaseTable("varieties");
  const [gradings, gradingOps] = useSupabaseTable("gradings");
  const [coldStorages, storageOps] = useSupabaseTable("cold_storages");
  const [mandis, mandiOps] = useSupabaseTable("mandis");
  const [parties, partyOps] = useSupabaseTable("parties");

  const ops = { purchases: purchaseOps, dispatches: dispatchOps, sales: saleOps, varieties: varietyOps, gradings: gradingOps, cold_storages: storageOps, mandis: mandiOps, parties: partyOps };

  return (
    <div style={s.screen}>
      <div style={s.header}>
        <span style={{ fontSize: 18, fontWeight: 800, color: clr.accent }}>AlooTrader v2 🔥</span>
        <span style={s.tag(clr.card2, clr.text)}>Mandi-App</span>
      </div>

      {screen === "dash" && <DashboardScreen purchases={purchases} dispatches={dispatches} sales={sales} />}
      {screen === "purch" && <PurchaseScreen purchases={purchases} varieties={varieties} ops={ops} dispatches={dispatches} sales={sales} />}
      {screen === "disp" && <DispatchScreen dispatches={dispatches} purchases={purchases} coldStorages={coldStorages} mandis={mandis} ops={ops} sales={sales} />}
      {screen === "sale" && <SalesScreen sales={sales} dispatches={dispatches} purchases={purchases} parties={parties} ops={ops} />}
      {screen === "mast" && <MasterScreen varieties={varieties} gradings={gradings} coldStorages={coldStorages} mandis={mandis} parties={parties} ops={ops} />}

      <div style={s.navBar}>
        <button onClick={() => setScreen("dash")} style={s.navItem(screen === "dash")}><Icon name="search" size={18} color={screen === "dash" ? clr.accent : clr.muted} />Dashboard</button>
        <button onClick={() => setScreen("purch")} style={s.navItem(screen === "purch")}><Icon name="purchase" size={18} color={screen === "purch" ? clr.accent : clr.muted} />Purchase</button>
        <button onClick={() => setScreen("disp")} style={s.navItem(screen === "disp")}><Icon name="dispatch" size={18} color={screen === "disp" ? clr.accent : clr.muted} />Dispatch</button>
        <button onClick={() => setScreen("sale")} style={s.navItem(screen === "sale")}><Icon name="sale" size={18} color={screen === "sale" ? clr.accent : clr.muted} />Sales</button>
        <button onClick={() => setScreen("mast")} style={s.navItem(screen === "mast")}><Icon name="master" size={18} color={screen === "mast" ? clr.accent : clr.muted} />Masters</button>
      </div>
    </div>
  );
}
