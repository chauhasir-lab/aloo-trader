import React, { useState, useCallback } from "react";

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

const Icon = ({ name, size = 18, color = clr.text }) => {
  const icons = {
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    purchase: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    dispatch: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
    sale: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    payment: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    master: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
    add: "M12 4v16m8-8H4",
    edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    x: "M6 18L18 6M6 6l12 12",
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={icons[name] || icons.info} />
    </svg>
  );
};

const s = {
  screen: { minHeight: "100vh", background: clr.bg, color: clr.text, fontFamily: "'Segoe UI', system-ui, sans-serif", maxWidth: 480, margin: "0 auto", position: "relative" },
  header: { background: clr.card, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${clr.border}`, position: "sticky", top: 0, zIndex: 100, justifyContent: "space-between" },
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
  navItem: (active) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 4px", gap: 3, cursor: "pointer", borderTop: active ? `2px solid ${clr.accent}` : "2px solid transparent", background: "none", border: "none", color: active ? clr.accent : clr.muted, fontSize: 10 }),
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

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={s.label}>{label}</div>
    {children}
  </div>
);

// ─── UTILITIES ─────────────────────────────────────────────────────
const getLotStatus = (lot, dispatches, sales) => {
  const totalDispatched = dispatches.flatMap(d => d.items).filter(i => i.lotId === lot.lotId).reduce((sum, i) => sum + parseFloat(i.bags || 0), 0);
  const totalSales = sales.flatMap(s => s.lotSales).filter(ls => ls.lotId === lot.lotId).reduce((sum, ls) => sum + parseFloat(ls.bags || 0), 0);
  const effectiveBags = lot.pricingType === "STD" ? parseFloat(lot.stdBags) : parseFloat(lot.manualBags);
  const remaining = effectiveBags - totalDispatched;
  return { totalDispatched, totalSales, remaining, isClosed: remaining <= 0 && totalDispatched > 0, status: remaining <= 0 && totalDispatched > 0 ? "CLOSED" : "ACTIVE" };
};

const SearchResults = ({ query, purchases, dispatches, sales, varieties, gradings, coldStorages, mandis, parties, onClose }) => {
  const queryLower = query.toLowerCase().trim();
  const getName = (arr, id) => arr.find(x => x.id === id)?.name || "-";

  const searchLotNumber = () => {
    const lot = purchases.find(p => p.lotId.toLowerCase() === queryLower);
    if (!lot) return null;
    const status = getLotStatus(lot, dispatches, sales);
    const lotDispatches = dispatches.filter(d => d.items.some(i => i.lotId === lot.lotId));
    return { type: "lot", lot, status, dispatches: lotDispatches };
  };

  const searchVehicleNumber = () => {
    const dispatch = dispatches.find(d => d.vehicleNumber?.toLowerCase() === queryLower);
    if (!dispatch) return null;
    const dispatchLots = dispatch.items.map(i => {
      const lot = purchases.find(p => p.lotId === i.lotId);
      return { ...i, lot };
    });
    return { type: "vehicle", dispatch, lots: dispatchLots };
  };

  const searchFarmerOrTrader = () => {
    const results = [];
    const farmerLots = purchases.filter(p => p.kisanName?.toLowerCase().includes(queryLower));
    if (farmerLots.length > 0) {
      results.push({
        type: "farmer",
        name: farmerLots[0]?.kisanName,
        lots: farmerLots.map(lot => {
          const status = getLotStatus(lot, dispatches, sales);
          return { lot, status };
        })
      });
    }
    const partyMatch = parties.find(p => p.name?.toLowerCase().includes(queryLower));
    if (partyMatch) {
      const partySales = sales.filter(s => s.partyId === partyMatch.id);
      results.push({
        type: "trader",
        name: partyMatch.name,
        sales: partySales,
        totalSold: partySales.reduce((sum, s) => sum + parseFloat(s.totalAmount || 0), 0)
      });
    }
    return results.length > 0 ? results : null;
  };

  const searchMandi = () => {
    const mandi = mandis.find(m => m.name?.toLowerCase().includes(queryLower));
    if (!mandi) return null;
    const mandiDispatches = dispatches.filter(d => d.mandiId === mandi.id);
    const mandiSales = sales.filter(s => s.mandiId === mandi.id);
    return { type: "mandi", mandi, dispatches: mandiDispatches, sales: mandiSales };
  };

  const searchColdStorage = () => {
    const cold = coldStorages.find(c => c.name?.toLowerCase().includes(queryLower));
    if (!cold) return null;
    const coldLots = purchases.filter(p => p.coldStorageId === cold.id);
    return { type: "cold", cold, lots: coldLots };
  };

  let result = searchLotNumber() || searchVehicleNumber() || searchFarmerOrTrader() || searchMandi() || searchColdStorage();

  if (!result) {
    return <div style={{ ...s.card, textAlign: "center", color: clr.muted }}>कोई परिणाम नहीं मिला</div>;
  }

  if (Array.isArray(result)) {
    return (
      <div>
        {result.map((r, idx) => (
          <div key={idx}>
            {r.type === "farmer" && (
              <>
                <div style={{ ...s.card, marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: clr.purple, marginBottom: 12 }}>👨 किसान: {r.name}</div>
                  {r.lots.map(({ lot, status }) => (
                    <div key={lot.id} style={{ ...s.card2, marginBottom: 8 }}>
                      <div style={s.rowBetween}>
                        <Badge v={`LOT: ${lot.lotId}`} color={clr.accent} />
                        <Badge v={status.status} color={status.isClosed ? clr.red : clr.green} />
                      </div>
                      <div style={{ fontSize: 12, color: clr.muted, marginTop: 6 }}>विविधता: {getName(varieties, lot.varietyId)} | वजन: {fmt(lot.totalWeight)} kg</div>
                      <div style={{ fontSize: 12, color: clr.muted }}>कुल: ₹{fmt(lot.totalAmount)} | शेष बैग: {fmt(status.remaining, 1)}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {r.type === "trader" && (
              <div style={s.card}>
                <div style={{ fontWeight: 700, fontSize: 15, color: clr.blue, marginBottom: 8 }}>🏪 व्यापारी: {r.name}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: clr.accent, marginBottom: 8 }}>कुल बिक्रय: ₹{fmt(r.totalSold)}</div>
                {r.sales.map((sale, idx) => (
                  <div key={idx} style={{ fontSize: 12, color: clr.muted, paddingBottom: 6 }}>• {sale.lotSales?.length || 0} लॉट्स | {fmtDate(sale.date)}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {result.type === "lot" && (
        <div style={s.card}>
          <div style={{ ...s.rowBetween, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>🥔 लॉट: {result.lot.lotId}</div>
            <Badge v={result.status.status} color={result.status.isClosed ? clr.red : clr.green} />
          </div>
          <div style={s.divider} />
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: clr.muted, marginBottom: 6 }}>किसान</div>
            <div style={{ fontWeight: 600 }}>{result.lot.kisanName}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <div><div style={s.label}>विविधता</div><div style={{ fontWeight: 600 }}>{getName(varieties, result.lot.varietyId)}</div></div>
            <div><div style={s.label}>ग्रेडिंग</div><div style={{ fontWeight: 600 }}>{getName(gradings, result.lot.gradingId)}</div></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
            <Stat label="कुल बैग" value={result.lot.pricingType === "STD" ? fmt(result.lot.stdBags, 1) : fmt(result.lot.manualBags)} color={clr.blue} />
            <Stat label="डिस्पैच" value={fmt(result.status.totalDispatched)} color={clr.purple} />
            <Stat label="शेष" value={fmt(result.status.remaining, 1)} color={result.status.remaining > 0 ? clr.green : clr.red} />
          </div>
          <div style={{ ...s.card2, ...s.rowBetween }}>
            <span style={{ fontSize: 12, color: clr.muted }}>₹{fmt(result.lot.rate)}/बैग</span>
            <span style={{ fontWeight: 800, color: clr.accent, fontSize: 16 }}>₹{fmt(result.lot.totalAmount)}</span>
          </div>
          {result.dispatches.length > 0 && (
            <>
              <div style={{ marginTop: 16, fontWeight: 700, marginBottom: 8 }}>📤 डिस्पैच:</div>
              {result.dispatches.map((d, idx) => (
                <div key={idx} style={s.card2}>
                  <div style={s.rowBetween}>
                    <span style={{ fontWeight: 600 }}>वाहन: {d.vehicleNumber}</span>
                    <span style={{ fontSize: 12, color: clr.green }}>{fmtDate(d.date)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: clr.muted, marginTop: 4 }}>मंडी: {getName(mandis, d.mandiId)} | बैग: {d.items.find(i => i.lotId === result.lot.lotId)?.bags || 0}</div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
      {result.type === "vehicle" && (
        <div style={s.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>🚛 वाहन: {result.dispatch.vehicleNumber}</div>
          <div style={s.divider} />
          <div style={{ fontSize: 12, color: clr.muted, marginBottom: 12 }}>तारीख: {fmtDate(result.dispatch.date)} | मंडी: {getName(mandis, result.dispatch.mandiId)}</div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>लॉट्स:</div>
          {result.lots.map((item, idx) => (
            <div key={idx} style={s.card2}>
              <div style={s.rowBetween}>
                <span style={{ fontWeight: 600 }}>LOT: {item.lotId}</span>
                <span style={{ fontWeight: 700, color: clr.accent }}>₹{fmt(item.lot?.totalAmount)}</span>
              </div>
              <div style={{ fontSize: 12, color: clr.muted, marginTop: 4 }}>बैग: {fmt(item.bags)} | किसान: {item.lot?.kisanName}</div>
            </div>
          ))}
        </div>
      )}
      {result.type === "mandi" && (
        <div style={s.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>🏪 मंडी: {result.mandi.name}</div>
          <div style={s.divider} />
          <div style={{ fontSize: 12, color: clr.muted, marginBottom: 12 }}>स्थान: {result.mandi.location}</div>
          {result.dispatches.length > 0 && (
            <>
              <div style={{ fontWeight: 700, marginBottom: 8, color: clr.purple }}>📤 डिस्पैच ({result.dispatches.length}):</div>
              {result.dispatches.map((d, idx) => (
                <div key={idx} style={{ ...s.card2, fontSize: 12, marginBottom: 6 }}>
                  <div style={s.rowBetween}>
                    <span style={{ fontWeight: 600 }}>वाहन: {d.vehicleNumber}</span>
                    <span style={{ color: clr.green }}>{fmtDate(d.date)}</span>
                  </div>
                  <div style={{ color: clr.muted, marginTop: 3 }}>{d.items.length} लॉट्स | कुल: {d.items.reduce((sum, i) => sum + parseFloat(i.bags || 0), 0).toFixed(1)} बैग</div>
                </div>
              ))}
            </>
          )}
          {result.sales.length > 0 && (
            <>
              <div style={{ fontWeight: 700, marginBottom: 8, color: clr.blue, marginTop: 12 }}>💰 बिक्रय ({result.sales.length}):</div>
              {result.sales.map((s, idx) => (
                <div key={idx} style={{ ...s.card2, fontSize: 12 }}>
                  <div style={s.rowBetween}>
                    <span style={{ fontWeight: 600 }}>व्यापारी: {getName(parties, s.partyId)}</span>
                    <span style={{ fontWeight: 700, color: clr.accent }}>₹{fmt(s.totalAmount)}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
      {result.type === "cold" && (
        <div style={s.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>🏭 कोल्ड: {result.cold.name}</div>
          <div style={{ fontSize: 12, color: clr.muted, marginBottom: 12 }}>स्थान: {result.cold.location}</div>
          <div style={s.divider} />
          <div style={{ fontWeight: 700, marginBottom: 8 }}>लॉट्स ({result.lots.length}):</div>
          {result.lots.map((lot, idx) => {
            const status = getLotStatus(lot, dispatches, sales);
            return (
              <div key={idx} style={s.card2}>
                <div style={s.rowBetween}>
                  <Badge v={`LOT: ${lot.lotId}`} color={clr.accent} />
                  <Badge v={status.status} color={status.isClosed ? clr.red : clr.green} />
                </div>
                <div style={{ fontSize: 12, color: clr.muted, marginTop: 6 }}>किसान: {lot.kisanName} | वजन: {fmt(lot.totalWeight)} kg</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SearchModal = ({ open, onClose, purchases, dispatches, sales, varieties, gradings, coldStorages, mandis, parties }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);

  const handleSearch = () => {
    if (!query.trim()) return;
    setResults(query);
  };

  return (
    <Modal open={open} onClose={onClose} title="🔍 खोज">
      <div style={{ marginBottom: 16 }}>
        <input type="text" style={s.input} placeholder="लॉट नंबर, वाहन, किसान, मंडी..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleSearch()} />
        <button onClick={handleSearch} style={{ ...s.btn(), width: "100%", marginTop: 10 }}><Icon name="search" size={16} color="#000" /> खोजें</button>
      </div>
      {results && (
        <SearchResults query={results} purchases={purchases} dispatches={dispatches} sales={sales} varieties={varieties} gradings={gradings} coldStorages={coldStorages} mandis={mandis} parties={parties} onClose={onClose} />
      )}
    </Modal>
  );
};

// ─── MASTER DATA SCREEN ────────────────────────────────────────
const MasterScreen = ({ varieties, setVarieties, gradings, setGradings, coldStorages, setColdStorages, mandis, setMandis, parties, setParties }) => {
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

  const crud = (setter) => ({
    onAdd: (item) => setter(p => [...p, item]),
    onEdit: (item) => setter(p => p.map(x => x.id === item.id ? item : x)),
    onDelete: (id) => setter(p => p.filter(x => x.id !== id)),
  });

  return (
    <div style={s.content}>
      <MasterSection title="🌾 Variety" items={varieties} fields={[{ key: "name", label: "Variety Name" }]} {...crud(setVarieties)} />
      <MasterSection title="📊 Grading" items={gradings} fields={[{ key: "name", label: "Grade Name" }]} {...crud(setGradings)} />
      <MasterSection title="🏭 Cold Storage" items={coldStorages} fields={[{ key: "name", label: "Storage Name" }, { key: "location", label: "Location" }, { key: "phone", label: "Phone" }]} {...crud(setColdStorages)} />
      <MasterSection title="🏪 Mandi" items={mandis} fields={[{ key: "name", label: "Mandi Name" }, { key: "location", label: "Location" }]} {...crud(setMandis)} />
      <MasterSection title="👤 Party" items={parties} fields={[{ key: "name", label: "Party Name" }, { key: "phone", label: "Phone" }]} {...crud(setParties)} />
    </div>
  );
};

// ─── PURCHASE SCREEN ───────────────────────────────────────────
const PurchaseScreen = ({ purchases, setPurchases, varieties, gradings, coldStorages, dispatches, setDispatches, sales, setSales, payments, setPayments, mandis, parties }) => {
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
        <span style={{ fontWeight: 700, fontSize: 16 }}>🥔 Purchase</span>
        <button onClick={() => { setForm(blank); setEditId(null); setErr(""); setShowForm(true); }} style={s.btn()}><Icon name="add" size={16} color="#000" /> New</button>
      </div>
      <div style={s.content}>
        {purchases.length === 0 && <div style={{ ...s.card, textAlign: "center", color: clr.muted, padding: 32 }}>No purchases yet.</div>}
        {[...purchases].reverse().map(p => {
          const status = getLotStatus(p, dispatches, sales);
          return (
            <div key={p.id} style={{ ...s.card, opacity: status.isClosed ? 0.6 : 1, borderColor: status.isClosed ? clr.red + "44" : undefined }}>
              <div style={s.rowBetween}>
                <div style={{ ...s.row, flexWrap: "wrap", gap: 4 }}>
                  <Badge v={`LOT: ${p.lotId}`} color={clr.accent} />
                  {status.isClosed && <Badge v="CLOSED" color={clr.red} />}
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                <Stat label="Bags" value={fmt(p.manualBags)} color={clr.blue} />
                <Stat label="Weight" value={fmt(p.totalWeight)} color={clr.purple} />
                <Stat label="STD Bags" value={fmt(p.stdBags, 1)} color={clr.accent} />
              </div>
              <div style={{ ...s.rowBetween, background: clr.accent + "18", borderRadius: 8, padding: "8px 12px", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: clr.muted }}>₹{fmt(p.rate)}/bag</span>
                <span style={{ fontWeight: 800, color: clr.accent, fontSize: 16 }}>₹{fmt(p.totalAmount)}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                <Stat label="Dispatched" value={fmt(status.totalDispatched)} color={clr.purple} />
                <Stat label="Sold" value={fmt(status.totalSales)} color={clr.blue} />
                <Stat label="Remaining" value={fmt(status.remaining, 1)} color={status.remaining > 0 ? clr.green : clr.red} />
              </div>
            </div>
          );
        })}
      </div>
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? "Edit Purchase" : "New Purchase"}>
        {err && <Alert msg={err} type="error" />}
        <Field label="Lot ID"><input style={s.input} value={form.lotId} onChange={e => f("lotId", e.target.value)} placeholder="e.g. L001" disabled={!!editId} /></Field>
        <Field label="Kisan Name"><input style={s.input} value={form.kisanName} onChange={e => f("kisanName", e.target.value)} /></Field>
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
          <Field label="Total Weight"><input type="number" style={s.input} value={form.totalWeight} onChange={e => f("totalWeight", e.target.value)} /></Field>
        </div>
        <Field label="Std Bag Weight"><input type="number" style={s.input} value={form.stdBagWeight} onChange={e => f("stdBagWeight", e.target.value)} /></Field>
        <div style={{ ...s.card2, ...s.rowBetween, marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: clr.muted }}>STD Bags</span>
          <span style={{ fontWeight: 800, color: clr.green, fontSize: 16 }}>{stdBags}</span>
        </div>
        <Field label="Pricing Type">
          <div style={s.row}>
            {["STD", "Manual"].map(t => (
              <button key={t} onClick={() => f("pricingType", t)} style={{ ...s.btn(form.pricingType === t ? clr.accent : clr.card2, form.pricingType === t ? "#000" : clr.text), flex: 1 }}>{t}</button>
            ))}
          </div>
        </Field>
        <Field label="Rate ₹/Bag"><input type="number" style={s.input} value={form.rate} onChange={e => f("rate", e.target.value)} placeholder="e.g. 800" /></Field>
        <div style={{ ...s.card2, ...s.rowBetween, marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: clr.muted }}>Total</span>
          <span style={{ fontWeight: 800, color: clr.accent, fontSize: 18 }}>₹{fmt(totalAmt)}</span>
        </div>
        <button onClick={save} style={{ ...s.btn(), width: "100%" }}>Save</button>
      </Modal>
    </div>
  );
};

// ─── DISPATCH SCREEN ───────────────────────────────────────────
const DispatchScreen = ({ purchases, dispatches, setDispatches, mandis, setMandis }) => {
  const [form, setForm] = useState({ vehicleNumber: "", mandiId: "", date: today(), items: [{ lotId: "", bags: "", weight: "" }] });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { lotId: "", bags: "", weight: "" }] }));
  const removeItem = (idx) => setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx, field, val) => setForm(p => ({ ...p, items: p.items.map((it, i) => i === idx ? { ...it, [field]: val } : it) }));

  const save = () => {
    if (!form.vehicleNumber.trim() || !form.mandiId) return;
    if (form.items.length === 0 || form.items.some(i => !i.lotId || !i.bags)) return;
    const item = { id: editId || uid(), ...form };
    if (editId) setDispatches(p => p.map(x => x.id === editId ? item : x));
    else setDispatches(p => [...p, item]);
    setShowForm(false); setEditId(null); setForm({ vehicleNumber: "", mandiId: "", date: today(), items: [{ lotId: "", bags: "", weight: "" }] });
  };

  return (
    <div>
      <div style={{ ...s.rowBetween, padding: "12px 16px 0" }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>🚛 Dispatch</span>
        <button onClick={() => setShowForm(true)} style={s.btn()}><Icon name="add" size={16} color="#000" /> New</button>
      </div>
      <div style={s.content}>
        {dispatches.length === 0 && <div style={{ ...s.card, textAlign: "center", color: clr.muted, padding: 32 }}>No dispatches yet.</div>}
        {[...dispatches].reverse().map(d => (
          <div key={d.id} style={s.card}>
            <div style={s.rowBetween}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>🚛 {d.vehicleNumber}</div>
                <div style={{ fontSize: 12, color: clr.muted }}>{mandis.find(m => m.id === d.mandiId)?.name} · {fmtDate(d.date)}</div>
              </div>
              <button onClick={() => setDispatches(p => p.filter(x => x.id !== d.id))} style={{ ...s.btnSm(), padding: 6 }}><Icon name="trash" size={14} color={clr.red} /></button>
            </div>
            <div style={s.divider} />
            {d.items.map((it, idx) => (
              <div key={idx} style={{ ...s.card2, marginBottom: 6 }}>
                <div style={{ fontWeight: 600 }}>LOT: {it.lotId}</div>
                <div style={{ fontSize: 12, color: clr.muted }}>बैग: {it.bags} | वजन: {it.weight || "-"}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Dispatch">
        <Field label="Vehicle Number"><input style={s.input} value={form.vehicleNumber} onChange={e => setForm(p => ({ ...p, vehicleNumber: e.target.value }))} /></Field>
        <Field label="Mandi">
          <select style={s.select} value={form.mandiId} onChange={e => setForm(p => ({ ...p, mandiId: e.target.value }))}>
            <option value="">-- Select --</option>
            {mandis.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </Field>
        <Field label="Date"><input type="date" style={s.input} value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></Field>
        {form.items.map((it, idx) => (
          <div key={idx} style={{ ...s.card2, marginBottom: 12, padding: 12 }}>
            <div style={{ ...s.rowBetween, marginBottom: 8 }}>
              <span style={{ fontWeight: 600 }}>Item {idx + 1}</span>
              {form.items.length > 1 && <button onClick={() => removeItem(idx)} style={s.btnSm()}><Icon name="x" size={12} color={clr.red} /></button>}
            </div>
            <select style={s.select} value={it.lotId} onChange={e => updateItem(idx, "lotId", e.target.value)}>
              <option value="">-- Select Lot --</option>
              {purchases.map(p => <option key={p.id} value={p.lotId}>{p.lotId} - {p.kisanName}</option>)}
            </select>
            <input type="number" style={{ ...s.input, marginTop: 8 }} placeholder="Bags" value={it.bags} onChange={e => updateItem(idx, "bags", e.target.value)} />
            <input type="number" style={{ ...s.input, marginTop: 8 }} placeholder="Weight (kg)" value={it.weight} onChange={e => updateItem(idx, "weight", e.target.value)} />
          </div>
        ))}
        <button onClick={addItem} style={{ ...s.btn(clr.card2, clr.text), width: "100%", marginBottom: 12 }}>+ Add Item</button>
        <button onClick={save} style={{ ...s.btn(), width: "100%" }}>Save Dispatch</button>
      </Modal>
    </div>
  );
};

// ─── MAIN APP ──────────────────────────────────────────────────
export default function App() {
  const [purchases, setPurchases] = useStore("purchases");
  const [dispatches, setDispatches] = useStore("dispatches");
  const [sales, setSales] = useStore("sales");
  const [payments, setPayments] = useStore("payments");
  const [varieties, setVarieties] = useStore("varieties", [{ id: "v1", name: "आलू" }, { id: "v2", name: "टमाटर" }]);
  const [gradings, setGradings] = useStore("gradings", [{ id: "g1", name: "A1" }, { id: "g2", name: "A2" }]);
  const [coldStorages, setColdStorages] = useStore("coldStorages", [{ id: "c1", name: "आइस स्टोर", location: "दिल्ली", phone: "9876543210" }]);
  const [mandis, setMandis] = useStore("mandis", [{ id: "m1", name: "नई मंडी", location: "लखनऊ" }]);
  const [parties, setParties] = useStore("parties", [{ id: "p1", name: "शर्मा व्यापार", phone: "9123456789" }]);
  const [currentTab, setCurrentTab] = useState("purchase");
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div style={s.screen}>
      <div style={s.header}>
        <h2 style={{ margin: 0, flex: 1 }}>🏪 खाद्य प्रबंधन</h2>
        <button onClick={() => setShowSearch(true)} style={s.btnSm()}><Icon name="search" size={16} /></button>
      </div>

      <SearchModal open={showSearch} onClose={() => setShowSearch(false)} purchases={purchases} dispatches={dispatches} sales={sales} varieties={varieties} gradings={gradings} coldStorages={coldStorages} mandis={mandis} parties={parties} />

      {currentTab === "purchase" && <PurchaseScreen purchases={purchases} setPurchases={setPurchases} varieties={varieties} gradings={gradings} coldStorages={coldStorages} dispatches={dispatches} setDispatches={setDispatches} sales={sales} setSales={setSales} payments={payments} setPayments={setPayments} mandis={mandis} parties={parties} />}

      {currentTab === "dispatch" && <DispatchScreen purchases={purchases} dispatches={dispatches} setDispatches={setDispatches} mandis={mandis} setMandis={setMandis} />}

      {currentTab === "master" && <MasterScreen varieties={varieties} setVarieties={setVarieties} gradings={gradings} setGradings={setGradings} coldStorages={coldStorages} setColdStorages={setColdStorages} mandis={mandis} setMandis={setMandis} parties={parties} setParties={setParties} />}

      <div style={s.navBar}>
        <button onClick={() => setCurrentTab("purchase")} style={s.navItem(currentTab === "purchase")}><Icon name="purchase" size={20} color={currentTab === "purchase" ? clr.accent : clr.muted} /><span>Purchase</span></button>
        <button onClick={() => setCurrentTab("dispatch")} style={s.navItem(currentTab === "dispatch")}><Icon name="dispatch" size={20} color={currentTab === "dispatch" ? clr.accent : clr.muted} /><span>Dispatch</span></button>
        <button onClick={() => setCurrentTab("master")} style={s.navItem(currentTab === "master")}><Icon name="master" size={20} color={currentTab === "master" ? clr.accent : clr.muted} /><span>Master</span></button>
      </div>
    </div>
  );
}
