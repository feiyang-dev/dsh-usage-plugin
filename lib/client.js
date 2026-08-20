window.__ModuleLoader__.load({
  id: "@feiyang666/dsh-usage-plugin",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    var React = require("react");
    var el = React.createElement;

    // ── inline styles (replaces a stylesheet; portable across client plugins) ──
    // 字号用 em 表示，随宿主“显示大小”设置的字体基准自动缩放（继承应用字号）；
    // 间距保持 px，仅微调以适配更大的字号。标注的 px 是默认 13px 基准下的设计值。
    var BASE_FS = 13;
    var fs = function (n) { return (Math.round(n / BASE_FS * 100) / 100).toFixed(2) + "em"; };
    var st = {
      root: { display: "flex", flexDirection: "column", gap: 14, padding: "4px 0", width: "100%", maxWidth: "100%", minWidth: 0, boxSizing: "border-box" },
      tab: { padding: "16px 20px", maxWidth: "min(1200px, calc(100vw - 24px))", margin: "0 auto", width: "100%", minWidth: 0, boxSizing: "border-box" },
      head: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
      headleft: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
      title: { fontSize: fs(15), fontWeight: 600 },
      sub: { fontSize: fs(11), opacity: 0.55 },
      actions: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
      btn: { border: "1px solid rgba(128,128,128,.35)", background: "transparent", borderRadius: 6, padding: "4px 10px", fontSize: fs(12), cursor: "pointer", color: "inherit" },
      btnPrimary: { border: "1px solid rgba(90,140,255,.6)", background: "rgba(90,140,255,.22)", borderRadius: 6, padding: "4px 10px", fontSize: fs(12), cursor: "pointer", color: "inherit" },
      btnDisabled: { border: "1px solid rgba(128,128,128,.35)", background: "transparent", borderRadius: 6, padding: "4px 10px", fontSize: fs(12), cursor: "default", color: "inherit", opacity: 0.5 },
      input: { border: "1px solid rgba(128,128,128,.35)", background: "transparent", borderRadius: 6, padding: "4px 10px", fontSize: fs(12), color: "inherit", minWidth: 280 },
      dateInput: { border: "1px solid rgba(128,128,128,.35)", background: "transparent", borderRadius: 6, padding: "3px 8px", fontSize: fs(12), color: "inherit" },
      seg: { display: "inline-flex", border: "1px solid rgba(128,128,128,.35)", borderRadius: 6, overflow: "hidden", flexWrap: "wrap" },
      segBtn: { border: 0, background: "transparent", padding: "4px 10px", fontSize: fs(12), cursor: "pointer", color: "inherit" },
      segBtnOn: { border: 0, background: "rgba(90,140,255,.22)", padding: "4px 10px", fontSize: fs(12), cursor: "pointer", color: "inherit", fontWeight: 600 },
      cards: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 10 },
      card: { border: "1px solid rgba(128,128,128,.35)", borderRadius: 8, padding: "10px 12px", minWidth: 0 },
      cardL: { fontSize: fs(11), opacity: 0.6, marginBottom: 4 },
      cardV: { fontSize: fs(18), fontWeight: 600, overflowWrap: "anywhere" },
      cardH: { fontSize: fs(10), opacity: 0.5, marginTop: 2, overflowWrap: "anywhere" },
      sec: { fontSize: fs(13), fontWeight: 600, marginTop: 6 },
      subtabBar: { display: "flex", gap: 6, borderBottom: "1px solid rgba(128,128,128,.2)", paddingBottom: 8, flexWrap: "wrap" },
      subtab: { border: "1px solid rgba(128,128,128,.35)", background: "transparent", borderRadius: 6, padding: "5px 14px", fontSize: fs(12), cursor: "pointer", color: "inherit" },
      subtabOn: { border: "1px solid rgba(90,140,255,.5)", background: "rgba(90,140,255,.22)", borderRadius: 6, padding: "5px 14px", fontSize: fs(12), cursor: "pointer", color: "inherit", fontWeight: 600 },
      scroll: { overflowX: "auto", overflowY: "hidden", width: "100%", maxWidth: "100%", minWidth: 0 },
      // 表格宽度用 max-content：内容多宽表就有多宽，容器窄时出现横向滚动条而不是裁剪右侧列
      tbl: { width: "max-content", minWidth: "100%", borderCollapse: "collapse", fontSize: fs(12) },
      th: { textAlign: "right", padding: "7px 10px", borderBottom: "1px solid rgba(128,128,128,.2)", whiteSpace: "nowrap", opacity: 0.55, fontWeight: 500 },
      thFirst: { textAlign: "left", padding: "7px 10px", borderBottom: "1px solid rgba(128,128,128,.2)", whiteSpace: "nowrap", opacity: 0.55, fontWeight: 500 },
      td: { textAlign: "right", padding: "7px 10px", borderBottom: "1px solid rgba(128,128,128,.2)", whiteSpace: "nowrap" },
      tdFirst: { textAlign: "left", padding: "7px 10px", borderBottom: "1px solid rgba(128,128,128,.2)", whiteSpace: "nowrap" },
      tdWrap: { textAlign: "left", padding: "7px 10px", borderBottom: "1px solid rgba(128,128,128,.2)", whiteSpace: "normal", wordBreak: "break-word", minWidth: 120, maxWidth: 220 },
      tdTotal: { textAlign: "right", padding: "7px 10px", fontWeight: 600, borderTop: "1px solid rgba(128,128,128,.35)" },
      tdTotalFirst: { textAlign: "left", padding: "7px 10px", fontWeight: 600, borderTop: "1px solid rgba(128,128,128,.35)" },
      tdClick: { textAlign: "left", padding: "7px 10px", borderBottom: "1px solid rgba(128,128,128,.2)", whiteSpace: "nowrap", cursor: "pointer" },
      tdClickSel: { textAlign: "left", padding: "7px 10px", borderBottom: "1px solid rgba(128,128,128,.2)", whiteSpace: "nowrap", cursor: "pointer", color: "#5a8cff", fontWeight: 600 },
      tdGroup: { textAlign: "left", padding: "7px 10px", fontWeight: 600, background: "rgba(128,128,128,.09)", borderBottom: "1px solid rgba(128,128,128,.2)", whiteSpace: "nowrap" },
      tdGroupR: { textAlign: "right", padding: "7px 10px", fontWeight: 600, background: "rgba(128,128,128,.09)", borderBottom: "1px solid rgba(128,128,128,.2)", whiteSpace: "nowrap" },
      badgeHit: { display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: fs(11), fontWeight: 500, background: "rgba(46,204,113,.18)", color: "#2ecc71", whiteSpace: "nowrap" },
      badgePeak: { display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: fs(11), fontWeight: 500, background: "rgba(255,152,0,.18)", color: "#ff9800", whiteSpace: "nowrap" },
      badgeValley: { display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: fs(11), fontWeight: 500, background: "rgba(90,140,255,.18)", color: "#5a8cff", whiteSpace: "nowrap" },
      costPeak: { color: "#e08700", fontWeight: 600, whiteSpace: "nowrap" },
      costOff: { color: "#3d6bd6", fontWeight: 600, whiteSpace: "nowrap" },
      err: { color: "#ff6b6b", fontSize: fs(12) },
      empty: { fontSize: fs(12), opacity: 0.6, padding: "16px 0" },
      note: { fontSize: fs(11), opacity: 0.55 },
      errbox: { border: "1px solid rgba(255,107,107,.4)", background: "rgba(255,107,107,.08)", borderRadius: 8, padding: 12, fontSize: fs(12) },
      errboxTitle: { fontWeight: 600, marginBottom: 4, color: "#ff6b6b" },
      infobox: { border: "1px solid rgba(90,140,255,.35)", background: "rgba(90,140,255,.08)", borderRadius: 8, padding: 12, marginTop: 18, fontSize: fs(12) },
      infoboxTitle: { fontWeight: 600, marginBottom: 4, color: "#5a8cff" },
      actionLink: { display: "inline-block", marginTop: 8, color: "#3d6bd6", textDecoration: "underline", fontSize: fs(12) },
      hero: { borderRadius: 12, padding: 20, color: "#fff", background: "linear-gradient(135deg,#3a7bd5,#00d2ff)", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 },
      heroLabel: { fontSize: fs(12), opacity: 0.85 },
      heroValue: { fontSize: fs(32), fontWeight: 700, letterSpacing: 0.5 },
      heroCurrency: { fontSize: fs(12), opacity: 0.9 },
      calBar: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 10 },
      calGrid: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginTop: 6 },
      calWk: { textAlign: "center", fontSize: fs(11), opacity: 0.5, padding: "2px 0" },
      calCell: { border: "1px solid rgba(128,128,128,.15)", borderRadius: 6, padding: "6px 2px", textAlign: "center", fontSize: fs(12), cursor: "pointer", minHeight: 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 },
      calCellBlank: { border: "1px solid transparent", padding: "6px 2px", minHeight: 40 },
      calCellOn: { outline: "2px solid #5a8cff", outlineOffset: -2 },
      calCellVal: { fontSize: fs(10), opacity: 0.8, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
      legend: { display: "flex", alignItems: "center", gap: 6, fontSize: fs(11), opacity: 0.65, marginTop: 8, flexWrap: "wrap" },
      legendBar: { display: "inline-block", width: 100, height: 8, borderRadius: 4, background: "linear-gradient(90deg,rgba(128,128,128,.12),rgba(46,134,222,.3),rgba(46,134,222,.85))" },
      numInput: { border: "1px solid rgba(128,128,128,.35)", background: "transparent", borderRadius: 4, padding: "3px 6px", fontSize: fs(12), color: "inherit", width: 78, textAlign: "right" },
      selDayTitle: { fontSize: fs(13), fontWeight: 600, marginTop: 14 }
    };

    // ── helpers ──
    var pad2 = function (n) { return (n < 10 ? "0" : "") + n; };
    var fmtInt = function (n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); };
    var fmtTime = function (ts) { var d = new Date(ts + 8 * 3600 * 1000); return pad2(d.getUTCMonth() + 1) + "-" + pad2(d.getUTCDate()) + " " + pad2(d.getUTCHours()) + ":" + pad2(d.getUTCMinutes()) + ":" + pad2(d.getUTCSeconds()); };
    var fmtMoney = function (n) { if (!n) return "¥0.0000"; if (n < 0.0001) return "¥" + n.toExponential(2); if (n < 1) return "¥" + n.toFixed(4); return "¥" + n.toFixed(2); };
    var fmtPrice = function (n) { if (n == null || isNaN(n)) return "—"; return String(parseFloat(Number(n).toFixed(4))); };
    var modelLabel = function (mk) { if (mk === "deepseek-v4-flash") return "deepseek-v4-flash"; if (mk === "deepseek-v4-pro") return "deepseek-v4-pro"; return "未知模型"; };
    // 模型显示名：以请求参数里的真实模型名为准（非 DeepSeek 模型也如实显示），
    // 空模型名时退回已知档位名 / provider / 未知。
    var modelName = function (r) {
      var m = String((r && r.model) || "").trim();
      if (m) return m;
      var mv = r && r.modelKey;
      if (mv && mv !== "unknown") return modelLabel(mv);
      var p = String((r && r.provider) || "").trim();
      return p ? p : "未知模型";
    };
    // 模型分组键：真实模型名小写（用于把同名的记录归为一组展示）
    var modelGroupKey = function (r) {
      var m = String((r && r.model) || "").trim();
      if (m) return m.toLowerCase();
      var mv = r && r.modelKey;
      if (mv && mv !== "unknown") return mv;
      var p = String((r && r.provider) || "").trim();
      return p ? p.toLowerCase() : "unknown";
    };
    // API 服务商显示名 / 分组键
    var providerName = function (p) {
      var s = String(p == null ? "" : p).trim();
      return s || "未知服务商";
    };
    var providerGroupKey = function (p) {
      var s = String(p == null ? "" : p).trim();
      return s ? s.toLowerCase() : "unknown";
    };
    var finishLabel = function (f) { if (f === "stop") return "完成"; if (f === "tool-calls") return "工具调用"; if (f === "max-tokens") return "超长"; if (f === "error") return "错误"; return f || "—"; };
    var pct = function (a, b) { return b > 0 ? (a / b * 100).toFixed(1) + "%" : "—"; };
    var isPeakNow = function (ts) { var d = new Date(ts + 8 * 3600 * 1000); var t = d.getUTCHours() * 60 + d.getUTCMinutes(); return (t >= 9 * 60 && t < 12 * 60) || (t >= 14 * 60 && t < 18 * 60); };
    // 计费档位选择：auto 用 autoCost（按生效日期自动切换），base 用 baseCost，其余用 peakValleyCost
    // 计费档位显示文案
    var regimeLabel = function (regime) {
      if (regime === "auto") return "自动（生效前基础价 · 生效后峰谷价）";
      if (regime === "base") return "基础价格";
      return "峰谷价格";
    };
    var costHint = function (regime) {
      if (regime === "auto") return "自动";
      if (regime === "base") return "基础价格";
      return "峰谷价格";
    };
    var costOf = function (r, regime) {
      if (!r) return 0;
      if (regime === "base") return r.baseCost || 0;
      if (regime === "auto") return r.autoCost != null ? r.autoCost : (r.baseCost || 0);
      return r.peakValleyCost || 0;
    };
    // 一组记录的消耗按高峰/空闲时段拆分（regime 决定用哪个档位的 cost）
    var splitTotals = function (list, regime) {
      var peak = 0, off = 0;
      for (var i = 0; i < list.length; i++) {
        var c = costOf(list[i], regime);
        if (list[i].peak) peak += c; else off += c;
      }
      return { peak: peak, off: off };
    };
    // 单日高峰/空闲消耗：优先取 host 汇总的 days 字段；缺失（旧 host）时用按记录算好的 fallback
    var daySplit = function (d, regime, fallback) {
      var peak, off;
      if (d) {
        if (regime === "base") { peak = d.basePeakCost; off = d.baseOffPeakCost; }
        else if (regime === "peakValley") { peak = d.pvPeakCost; off = d.pvOffPeakCost; }
        else { peak = d.autoPeakCost; off = d.autoOffPeakCost; }
        if (peak != null && off != null) return { peak: peak, off: off };
      }
      if (fallback) return fallback;
      return { peak: 0, off: 0 };
    };
    var bjKey = function (ts) { var d = new Date(ts + 8 * 3600 * 1000); return d.getUTCFullYear() + "-" + pad2(d.getUTCMonth() + 1) + "-" + pad2(d.getUTCDate()); };
    var bjStartMs = function (key) { var p = String(key).split("-"); return Date.UTC(+p[0], +p[1] - 1, +p[2]) - 8 * 3600 * 1000; };
    var dayLabel = function (key) { var p = String(key).split("-"); return p[0] + "年" + (+p[1]) + "月" + (+p[2]) + "日"; };
    var monthDays = function (y, m) { return new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); };
    var monthOffset = function (y, m) { var ms = bjStartMs(y + "-" + pad2(m + 1) + "-01"); var wd = new Date(ms).getUTCDay(); return (wd + 6) % 7; };
    var fmtBalance = function (s) {
      var str = String(s == null ? "0" : s);
      var num = parseFloat(str);
      if (isNaN(num)) return str;
      var parts = str.split(".");
      var dec = parts[1] ? parts[1].slice(0, 2) : "00";
      return fmtInt(parseInt(parts[0], 10)) + "." + (dec.length === 1 ? dec + "0" : dec);
    };
    var currencySymbol = function (currency) { return currency === "CNY" ? "¥" : currency === "USD" ? "$" : (currency || ""); };
    var api = function (payload) {
      return fetch("/usage/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(function (r) { return r.json(); });
    };
    var PRICE_MODELS = ["deepseek-v4-flash", "deepseek-v4-pro"];

    // ── Card ──
    function Card(props) {
      return el("div", { style: st.card },
        el("div", { style: st.cardL }, props.label),
        el("div", { style: st.cardV }, props.value),
        props.hint ? el("div", { style: st.cardH }, props.hint) : null
      );
    }

    // ── long-image report ──
    function drawReport(canvas, records) {
      records = records.slice();
      records.sort(function (a, b) { return b.time - a.time; }); // newest first
      var totalIn = records.length;
      if (records.length > 2000) records = records.slice(0, 2000); // canvas height guard
      var W = 1520, P = 40, count = records.length;
      var scale = count <= 200 ? 2 : 1;
      var rowH = count <= 200 ? 28 : count <= 800 ? 20 : 14;
      var fBase = count <= 200 ? 12 : count <= 800 ? 11 : 10;
      var headH = count <= 200 ? 26 : count <= 800 ? 20 : 16;

      var totalHit = 0, totalMiss = 0, totalWrite = 0, totalOut = 0, totalReason = 0, totalCost = 0, totalPeakCost = 0, totalOffCost = 0;
      for (var i = 0; i < count; i++) {
        var r = records[i];
        totalHit += r.cacheReadTokens || 0; totalMiss += r.inputTokens || 0; totalWrite += r.cacheWriteTokens || 0;
        totalOut += r.outputTokens || 0; totalReason += r.reasoningTokens || 0;
        var cst = r.peakValleyCost || 0;
        totalCost += cst;
        if (r.peak) totalPeakCost += cst; else totalOffCost += cst;
      }
      var hitRate = (totalHit + totalMiss + totalWrite) > 0 ? (totalHit / (totalHit + totalMiss + totalWrite) * 100).toFixed(1) + "%" : "—";
      var byModel = {}, byProvider = {}, byProviderModel = {};
      for (var i2 = 0; i2 < count; i2++) {
        var r2 = records[i2];
        var gk2 = modelGroupKey(r2);
        if (!byModel[gk2]) byModel[gk2] = { key: gk2, name: modelName(r2), calls: 0, hit: 0, miss: 0, out: 0, reason: 0, cost: 0, peakCost: 0, offCost: 0, peakCalls: 0, offCalls: 0 };
        var c2v = r2.peakValleyCost || 0;
        byModel[gk2].calls += 1; byModel[gk2].hit += r2.cacheReadTokens || 0; byModel[gk2].miss += r2.inputTokens || 0;
        byModel[gk2].out += r2.outputTokens || 0; byModel[gk2].reason += r2.reasoningTokens || 0; byModel[gk2].cost += c2v;
        var pk2 = providerGroupKey(r2.provider);
        if (!byProvider[pk2]) byProvider[pk2] = { key: pk2, name: providerName(r2.provider), calls: 0, cost: 0, peakCost: 0, offCost: 0, peakCalls: 0, offCalls: 0 };
        byProvider[pk2].calls += 1; byProvider[pk2].cost += c2v;
        var pmk2 = pk2 + "||" + gk2;
        if (!byProviderModel[pmk2]) byProviderModel[pmk2] = { key: pmk2, providerKey: pk2, providerName: providerName(r2.provider), modelKey: gk2, modelName: modelName(r2), calls: 0, cost: 0, peakCost: 0, offCost: 0, peakCalls: 0, offCalls: 0 };
        byProviderModel[pmk2].calls += 1; byProviderModel[pmk2].cost += c2v;
        if (r2.peak) {
          byModel[gk2].peakCost += c2v; byModel[gk2].peakCalls += 1;
          byProvider[pk2].peakCost += c2v; byProvider[pk2].peakCalls += 1;
          byProviderModel[pmk2].peakCost += c2v; byProviderModel[pmk2].peakCalls += 1;
        } else {
          byModel[gk2].offCost += c2v; byModel[gk2].offCalls += 1;
          byProvider[pk2].offCost += c2v; byProvider[pk2].offCalls += 1;
          byProviderModel[pmk2].offCost += c2v; byProviderModel[pmk2].offCalls += 1;
        }
      }
      var modelRows = [];
      for (var k in byModel) modelRows.push(byModel[k]);
      modelRows.sort(function (a, b) { return a.key < b.key ? -1 : a.key > b.key ? 1 : 0; });
      var providerRows = [];
      for (var kp in byProvider) providerRows.push(byProvider[kp]);
      providerRows.sort(function (a, b) { return b.cost - a.cost || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0); });
      var providerGroups = [];
      for (var pg = 0; pg < providerRows.length; pg++) {
        var gprov = providerRows[pg];
        var gmodels = [];
        for (var kgm in byProviderModel) {
          if (byProviderModel[kgm].providerKey === gprov.key) gmodels.push(byProviderModel[kgm]);
        }
        gmodels.sort(function (a, b) { return b.cost - a.cost || (a.modelKey < b.modelKey ? -1 : 1); });
        providerGroups.push({ provider: gprov, models: gmodels });
      }
      // 服务商×模型明细的总行数（组头 + 组内模型 + 合计行）
      var pmRowTotal = 1;
      for (var pgt = 0; pgt < providerGroups.length; pgt++) pmRowTotal += 1 + providerGroups[pgt].models.length;

      var H = 244 + headH + count * rowH + 24 + 18 + headH + (modelRows.length + 1) * rowH + 24 + 18 + headH + pmRowTotal * rowH + 26 + 44;
      if (H > 30000 && rowH > 12) { rowH = 12; fBase = 10; headH = 14; H = 244 + headH + count * rowH + 24 + 18 + headH + (modelRows.length + 1) * rowH + 24 + 18 + headH + pmRowTotal * rowH + 26 + 44; }
      canvas.width = W * scale;
      canvas.height = H * scale;
      var ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas 2d 不可用");
      ctx.scale(scale, scale);
      ctx.textBaseline = "alphabetic";
      var font = function (size, weight) { ctx.font = (weight || "400") + " " + size + 'px "Segoe UI","Microsoft YaHei",sans-serif'; };

      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#3a7bd5"; ctx.fillRect(0, 0, W, 64);
      ctx.fillStyle = "#ffffff"; ctx.textAlign = "left"; font(20, "700");
      ctx.fillText("用量与消耗报告", P, 40);
      ctx.fillStyle = "#7a8699"; font(13, "400");
      ctx.fillText("生成时间 " + fmtTime(Date.now()) + "（北京） · 共 " + count + " 条调用 · 缓存命中率 " + hitRate +
        " · 高峰价消耗 " + fmtMoney(totalPeakCost) + " · 空闲价消耗 " + fmtMoney(totalOffCost) + " · 合计 " + fmtMoney(totalCost) +
        (totalIn > count ? " · 报告仅含最近 " + count + " 条" : ""), P, 92);

      var cardW = (W - 2 * P - 6 * 10) / 7;
      var cards = [
        { l: "调用次数", v: fmtInt(count) }, { l: "输入 · 未命中", v: fmtInt(totalMiss) },
        { l: "输入 · 缓存命中", v: fmtInt(totalHit) }, { l: "输出", v: fmtInt(totalOut) },
        { l: "高峰消耗", v: fmtMoney(totalPeakCost) }, { l: "空闲消耗", v: fmtMoney(totalOffCost) },
        { l: "总消耗 (峰谷价)", v: fmtMoney(totalCost) }
      ];
      for (var c = 0; c < cards.length; c++) {
        var x = P + c * (cardW + 10);
        ctx.fillStyle = "#f5f7fa"; ctx.fillRect(x, 112, cardW, 70);
        ctx.strokeStyle = "#e4e8ee"; ctx.strokeRect(x, 112, cardW, 70);
        ctx.fillStyle = "#7a8699"; font(12, "400"); ctx.fillText(cards[c].l, x + 14, 138);
        ctx.fillStyle = "#1c2733"; font(19, "600"); ctx.fillText(cards[c].v, x + 14, 166);
      }

      var c1 = { time: P, model: P + 150, missR: P + 440, hitR: P + 540, writeR: P + 630, outR: P + 720, reasonR: P + 810, rateR: P + 900, periodR: P + 990, endR: P + 1080, costR: P + 1440 };
      var y = 226;
      ctx.fillStyle = "#1c2733"; font(15, "600"); ctx.fillText("缓存命中列表（共 " + count + " 条）", P, y);
      y = 244;
      ctx.fillStyle = "#eef1f5"; ctx.fillRect(P, y, W - 2 * P, headH);
      ctx.fillStyle = "#55617a"; font(fBase + 1, "600");
      var hty = y + Math.round(headH * 0.65);
      ctx.textAlign = "left"; ctx.fillText("时间(北京)", c1.time, hty); ctx.fillText("模型", c1.model, hty);
      ctx.textAlign = "right";
      ctx.fillText("输入·未命中", c1.missR, hty); ctx.fillText("缓存命中", c1.hitR, hty); ctx.fillText("缓存写入", c1.writeR, hty);
      ctx.fillText("输出", c1.outR, hty); ctx.fillText("推理", c1.reasonR, hty); ctx.fillText("命中率", c1.rateR, hty);
      ctx.fillText("时段", c1.periodR, hty); ctx.fillText("结束", c1.endR, hty); ctx.fillText("消耗(峰谷)", c1.costR, hty);
      y += headH;
      for (var r3 = 0; r3 < count; r3++) {
        var rec = records[r3];
        var hit = rec.cacheReadTokens || 0, miss = rec.inputTokens || 0, cost = rec.peakValleyCost || 0;
        ctx.fillStyle = r3 % 2 === 1 ? "#fafbfc" : "#ffffff"; ctx.fillRect(P, y, W - 2 * P, rowH);
        var ty = y + Math.round(rowH * 0.68);
        ctx.textAlign = "left"; ctx.fillStyle = "#1c2733"; font(fBase, "400");
        ctx.fillText(fmtTime(rec.time), c1.time, ty); ctx.fillText(modelName(rec), c1.model, ty);
        ctx.textAlign = "right";
        ctx.fillText(fmtInt(miss), c1.missR, ty);
        ctx.fillStyle = "#22a45d"; ctx.fillText(fmtInt(hit), c1.hitR, ty);
        ctx.fillStyle = "#1c2733";
        ctx.fillText(rec.cacheWriteTokens ? fmtInt(rec.cacheWriteTokens) : "—", c1.writeR, ty);
        ctx.fillText(fmtInt(rec.outputTokens || 0), c1.outR, ty);
        ctx.fillText(rec.reasoningTokens ? fmtInt(rec.reasoningTokens) : "—", c1.reasonR, ty);
        ctx.fillStyle = "#55617a"; ctx.fillText(pct(hit, hit + miss), c1.rateR, ty);
        ctx.fillStyle = rec.peak ? "#e08700" : "#3d6bd6"; ctx.fillText(rec.peak ? "峰" : "谷", c1.periodR, ty);
        ctx.fillStyle = "#55617a"; ctx.fillText(finishLabel(rec.finishReason), c1.endR, ty);
        ctx.fillStyle = rec.peak ? "#e08700" : "#3d6bd6"; ctx.fillText(fmtMoney(cost), c1.costR, ty);
        y += rowH;
      }

      y += 24;
      ctx.textAlign = "left"; ctx.fillStyle = "#1c2733"; font(15, "600");
      ctx.fillText("消耗表（按模型 · 峰谷价 · 高峰/空闲分列）", P, y);
      y += 18;
      var c2 = { model: P, callsR: P + 330, missR: P + 470, hitR: P + 590, outR: P + 710, reasonR: P + 840, peakR: P + 1010, offR: P + 1140, costR: P + 1440 };
      ctx.fillStyle = "#eef1f5"; ctx.fillRect(P, y, W - 2 * P, headH);
      ctx.fillStyle = "#55617a"; font(fBase + 1, "600");
      var hty2 = y + Math.round(headH * 0.65);
      ctx.textAlign = "left"; ctx.fillText("模型", c2.model, hty2);
      ctx.textAlign = "right";
      ctx.fillText("调用", c2.callsR, hty2); ctx.fillText("输入·未命中", c2.missR, hty2); ctx.fillText("缓存命中", c2.hitR, hty2);
      ctx.fillText("输出", c2.outR, hty2); ctx.fillText("推理", c2.reasonR, hty2);
      ctx.fillText("高峰消耗", c2.peakR, hty2); ctx.fillText("空闲消耗", c2.offR, hty2); ctx.fillText("总消耗", c2.costR, hty2);
      y += headH;
      var t2rows = modelRows.concat([{ key: "合计", name: "合计", calls: count, miss: totalMiss, hit: totalHit, out: totalOut, reason: totalReason, cost: totalCost, peakCost: totalPeakCost, offCost: totalOffCost }]);
      for (var m = 0; m < t2rows.length; m++) {
        var row = t2rows[m];
        var isTotal = row.key === "合计";
        ctx.fillStyle = isTotal ? "#eef1f5" : (m % 2 === 1 ? "#fafbfc" : "#ffffff"); ctx.fillRect(P, y, W - 2 * P, rowH);
        var ty2 = y + Math.round(rowH * 0.68);
        ctx.textAlign = "left"; ctx.fillStyle = "#1c2733"; font(fBase, isTotal ? "600" : "400");
        ctx.fillText(row.name || row.key, c2.model, ty2);
        ctx.textAlign = "right";
        ctx.fillText(fmtInt(row.calls), c2.callsR, ty2); ctx.fillText(fmtInt(row.miss), c2.missR, ty2);
        ctx.fillStyle = "#22a45d"; ctx.fillText(fmtInt(row.hit), c2.hitR, ty2);
        ctx.fillStyle = "#1c2733"; font(fBase, isTotal ? "600" : "400");
        ctx.fillText(fmtInt(row.out), c2.outR, ty2); ctx.fillText(row.reason ? fmtInt(row.reason) : "—", c2.reasonR, ty2);
        ctx.fillStyle = "#e08700"; ctx.fillText(fmtMoney(row.peakCost), c2.peakR, ty2);
        ctx.fillStyle = "#3d6bd6"; ctx.fillText(fmtMoney(row.offCost), c2.offR, ty2);
        ctx.fillStyle = "#1c2733"; ctx.fillText(fmtMoney(row.cost), c2.costR, ty2);
        y += rowH;
      }
      y += 24;
      ctx.textAlign = "left"; ctx.fillStyle = "#1c2733"; font(15, "600");
      ctx.fillText("消耗表（按 API 服务商 × 模型 · 峰谷价）", P, y);
      y += 18;
      ctx.fillStyle = "#eef1f5"; ctx.fillRect(P, y, W - 2 * P, headH);
      ctx.fillStyle = "#55617a"; font(fBase + 1, "600");
      var hty3 = y + Math.round(headH * 0.65);
      ctx.textAlign = "left"; ctx.fillText("API 服务商 / 模型", c2.model, hty3);
      ctx.textAlign = "right";
      ctx.fillText("调用", c2.callsR, hty3);
      ctx.fillText("高峰消耗", c2.peakR, hty3); ctx.fillText("空闲消耗", c2.offR, hty3); ctx.fillText("总消耗", c2.costR, hty3);
      y += headH;
      var p3n = 0;
      for (var p3g = 0; p3g < providerGroups.length; p3g++) {
        var pgrp = providerGroups[p3g];
        var gpr = pgrp.provider;
        ctx.fillStyle = "#e8edf5"; ctx.fillRect(P, y, W - 2 * P, rowH);
        var ty3 = y + Math.round(rowH * 0.68);
        ctx.textAlign = "left"; ctx.fillStyle = "#1c2733"; font(fBase, "600");
        ctx.fillText(gpr.name + "（" + pgrp.models.length + " 个模型）", c2.model, ty3);
        ctx.textAlign = "right"; ctx.fillStyle = "#1c2733"; font(fBase, "600");
        ctx.fillText(fmtInt(gpr.calls), c2.callsR, ty3);
        ctx.fillStyle = "#e08700"; ctx.fillText(fmtMoney(gpr.peakCost), c2.peakR, ty3);
        ctx.fillStyle = "#3d6bd6"; ctx.fillText(fmtMoney(gpr.offCost), c2.offR, ty3);
        ctx.fillStyle = "#1c2733"; ctx.fillText(fmtMoney(gpr.cost), c2.costR, ty3);
        y += rowH;
        for (var p3m = 0; p3m < pgrp.models.length; p3m++) {
          var pmd = pgrp.models[p3m];
          ctx.fillStyle = (p3n++ % 2 === 1) ? "#fafbfc" : "#ffffff"; ctx.fillRect(P, y, W - 2 * P, rowH);
          var ty4 = y + Math.round(rowH * 0.68);
          ctx.textAlign = "left"; ctx.fillStyle = "#1c2733"; font(fBase, "400");
          ctx.fillText("    " + pmd.modelName, c2.model, ty4);
          ctx.textAlign = "right"; ctx.fillStyle = "#1c2733"; font(fBase, "400");
          ctx.fillText(fmtInt(pmd.calls), c2.callsR, ty4);
          ctx.fillStyle = "#e08700"; ctx.fillText(fmtMoney(pmd.peakCost), c2.peakR, ty4);
          ctx.fillStyle = "#3d6bd6"; ctx.fillText(fmtMoney(pmd.offCost), c2.offR, ty4);
          ctx.fillStyle = "#1c2733"; ctx.fillText(fmtMoney(pmd.cost), c2.costR, ty4);
          y += rowH;
        }
      }
      ctx.fillStyle = "#eef1f5"; ctx.fillRect(P, y, W - 2 * P, rowH);
      var ty5 = y + Math.round(rowH * 0.68);
      ctx.textAlign = "left"; ctx.fillStyle = "#1c2733"; font(fBase, "600");
      ctx.fillText("总费用合计", c2.model, ty5);
      ctx.textAlign = "right"; ctx.fillStyle = "#1c2733"; font(fBase, "600");
      ctx.fillText(fmtInt(count), c2.callsR, ty5);
      ctx.fillStyle = "#e08700"; ctx.fillText(fmtMoney(totalPeakCost), c2.peakR, ty5);
      ctx.fillStyle = "#3d6bd6"; ctx.fillText(fmtMoney(totalOffCost), c2.offR, ty5);
      ctx.fillStyle = "#1c2733"; ctx.fillText(fmtMoney(totalCost), c2.costR, ty5);
      y += rowH;
      y += 26;
      ctx.textAlign = "left"; ctx.fillStyle = "#98a2b3"; font(11, "400");
      ctx.fillText("计价按请求的 API 服务商分别应用已核验价格；DigitalOcean 美元价按 USD/CNY 汇率折算；无法可靠映射的第三方价格按 ¥0。", P, y);
    }

    // ── Overview view ──
    function OverviewView(props) {
      var records = props.records, regime = props.regime;
      var totalCalls = records.length;
      var totalHit = 0, totalMiss = 0, totalWrite = 0, totalOut = 0, totalReason = 0, totalCost = 0, peakTotal = 0, offTotal = 0, peakCalls = 0, offCalls = 0;
      var byModel = {}, byProvider = {}, byProviderModel = {};
      for (var i = 0; i < records.length; i++) {
        var r = records[i];
        totalHit += r.cacheReadTokens || 0; totalMiss += r.inputTokens || 0; totalWrite += r.cacheWriteTokens || 0;
        totalOut += r.outputTokens || 0; totalReason += r.reasoningTokens || 0;
        var cost = costOf(r, regime);
        totalCost += cost;
        var gk = modelGroupKey(r);
        if (!byModel[gk]) byModel[gk] = { key: gk, name: modelName(r), calls: 0, hit: 0, miss: 0, out: 0, reason: 0, cost: 0, peakCost: 0, offCost: 0, peakCalls: 0, offCalls: 0 };
        byModel[gk].calls += 1; byModel[gk].hit += r.cacheReadTokens || 0; byModel[gk].miss += r.inputTokens || 0;
        byModel[gk].out += r.outputTokens || 0; byModel[gk].reason += r.reasoningTokens || 0; byModel[gk].cost += cost;
        var pk = providerGroupKey(r.provider);
        if (!byProvider[pk]) byProvider[pk] = { key: pk, name: providerName(r.provider), calls: 0, cost: 0, peakCost: 0, offCost: 0, peakCalls: 0, offCalls: 0, miss: 0, hit: 0, out: 0, reason: 0 };
        byProvider[pk].calls += 1; byProvider[pk].cost += cost;
        byProvider[pk].miss += r.inputTokens || 0; byProvider[pk].hit += r.cacheReadTokens || 0;
        byProvider[pk].out += r.outputTokens || 0; byProvider[pk].reason += r.reasoningTokens || 0;
        var pmKey = pk + "||" + gk;
        if (!byProviderModel[pmKey]) byProviderModel[pmKey] = { key: pmKey, providerKey: pk, providerName: providerName(r.provider), modelKey: gk, modelName: modelName(r), calls: 0, cost: 0, peakCost: 0, offCost: 0, peakCalls: 0, offCalls: 0, miss: 0, hit: 0, out: 0, reason: 0 };
        byProviderModel[pmKey].calls += 1; byProviderModel[pmKey].cost += cost;
        byProviderModel[pmKey].miss += r.inputTokens || 0; byProviderModel[pmKey].hit += r.cacheReadTokens || 0;
        byProviderModel[pmKey].out += r.outputTokens || 0; byProviderModel[pmKey].reason += r.reasoningTokens || 0;
        if (r.peak) {
          byModel[gk].peakCost += cost; byModel[gk].peakCalls += 1;
          byProvider[pk].peakCost += cost; byProvider[pk].peakCalls += 1;
          byProviderModel[pmKey].peakCost += cost; byProviderModel[pmKey].peakCalls += 1;
          peakTotal += cost; peakCalls += 1;
        } else {
          byModel[gk].offCost += cost; byModel[gk].offCalls += 1;
          byProvider[pk].offCost += cost; byProvider[pk].offCalls += 1;
          byProviderModel[pmKey].offCost += cost; byProviderModel[pmKey].offCalls += 1;
          offTotal += cost; offCalls += 1;
        }
      }
      var hitRate = (totalHit + totalMiss + totalWrite) > 0 ? (totalHit / (totalHit + totalMiss + totalWrite) * 100).toFixed(1) + "%" : "—";
      var modelRows = [];
      for (var k in byModel) modelRows.push(byModel[k]);
      modelRows.sort(function (a, b) { return a.key < b.key ? -1 : a.key > b.key ? 1 : 0; });
      for (var mr = 0; mr < modelRows.length; mr++) {
        var pset = {};
        for (var rr = 0; rr < records.length; rr++) {
          if (modelGroupKey(records[rr]) === modelRows[mr].key) pset[providerName(records[rr].provider)] = true;
        }
        modelRows[mr].providerText = Object.keys(pset).sort().join(" / ") || "未知服务商";
      }
      var providerRows = [];
      for (var kp in byProvider) providerRows.push(byProvider[kp]);
      providerRows.sort(function (a, b) { return b.cost - a.cost || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0); });
      // 服务商 × 模型分组：每个服务商一组，组内按消耗排序
      var providerGroups = [];
      for (var pg = 0; pg < providerRows.length; pg++) {
        var gprov = providerRows[pg];
        var models = [];
        for (var km in byProviderModel) {
          if (byProviderModel[km].providerKey === gprov.key) models.push(byProviderModel[km]);
        }
        models.sort(function (a, b) { return b.cost - a.cost || (a.modelKey < b.modelKey ? -1 : 1); });
        providerGroups.push({ provider: gprov, models: models });
      }
      // 服务商 × 模型明细行（组头行 + 组内模型行）
      var pmRows = [];
      for (var gi = 0; gi < providerGroups.length; gi++) {
        var g = providerGroups[gi];
        var gprov2 = g.provider;
        pmRows.push(el("tr", { key: "g-" + gprov2.key },
          el("td", { style: st.tdGroup }, gprov2.name),
          el("td", { style: st.tdGroup }, "（" + g.models.length + " 个模型）"),
          el("td", { style: st.tdGroupR }, fmtInt(gprov2.calls)),
          el("td", { style: st.tdGroupR }, el("span", { style: st.badgePeak }, fmtInt(gprov2.peakCalls)), " / ", el("span", { style: st.badgeValley }, fmtInt(gprov2.offCalls))),
          el("td", { style: st.tdGroupR }, fmtInt(gprov2.miss)),
          el("td", { style: st.tdGroupR }, fmtInt(gprov2.hit)),
          el("td", { style: st.tdGroupR }, fmtInt(gprov2.out)),
          el("td", { style: st.tdGroupR }, gprov2.reason ? fmtInt(gprov2.reason) : "—"),
          el("td", { style: st.tdGroupR }, fmtMoney(gprov2.peakCost)),
          el("td", { style: st.tdGroupR }, fmtMoney(gprov2.offCost)),
          el("td", { style: st.tdGroupR }, fmtMoney(gprov2.cost))
        ));
        for (var mi = 0; mi < g.models.length; mi++) {
          var md = g.models[mi];
          pmRows.push(el("tr", { key: "pm-" + md.key },
            el("td", { style: st.tdFirst }, ""),
            el("td", { style: st.tdWrap }, md.modelName),
            el("td", { style: st.td }, fmtInt(md.calls)),
            el("td", { style: st.td }, el("span", { style: st.badgePeak }, fmtInt(md.peakCalls)), " / ", el("span", { style: st.badgeValley }, fmtInt(md.offCalls))),
            el("td", { style: st.td }, fmtInt(md.miss)),
            el("td", { style: st.td }, el("span", { style: st.badgeHit }, fmtInt(md.hit))),
            el("td", { style: st.td }, fmtInt(md.out)),
            el("td", { style: st.td }, md.reason ? fmtInt(md.reason) : "—"),
            el("td", { style: st.td }, fmtMoney(md.peakCost)),
            el("td", { style: st.td }, fmtMoney(md.offCost)),
            el("td", { style: st.td }, fmtMoney(md.cost))
          ));
        }
      }
      pmRows.push(el("tr", { key: "g-total" },
        el("td", { style: st.tdTotalFirst }, "总费用合计"),
        el("td", { style: st.tdTotal }, fmtInt(providerRows.length) + " 个服务商"),
        el("td", { style: st.tdTotal }, fmtInt(totalCalls)),
        el("td", { style: st.tdTotal }, el("span", { style: st.badgePeak }, fmtInt(peakCalls)), " / ", el("span", { style: st.badgeValley }, fmtInt(offCalls))),
        el("td", { style: st.tdTotal }, fmtInt(totalMiss)),
        el("td", { style: st.tdTotal }, fmtInt(totalHit)),
        el("td", { style: st.tdTotal }, fmtInt(totalOut)),
        el("td", { style: st.tdTotal }, totalReason ? fmtInt(totalReason) : "—"),
        el("td", { style: st.tdTotal }, fmtMoney(peakTotal)),
        el("td", { style: st.tdTotal }, fmtMoney(offTotal)),
        el("td", { style: st.tdTotal }, fmtMoney(totalCost))
      ));

      return el("div", null,
        el("div", { style: st.cards },
          el(Card, { label: "调用次数", value: fmtInt(totalCalls), hint: "高峰 " + fmtInt(peakCalls) + " · 空闲 " + fmtInt(offCalls) }),
          el(Card, { label: "输入 · 未命中", value: fmtInt(totalMiss), hint: "token" }),
          el(Card, { label: "输入 · 缓存命中", value: fmtInt(totalHit), hint: "命中率 " + hitRate }),
          el(Card, { label: "输出", value: fmtInt(totalOut), hint: "token" }),
          el(Card, { label: "高峰消耗", value: fmtMoney(peakTotal), hint: "高峰时段 9:00–12:00、14:00–18:00" }),
          el(Card, { label: "空闲消耗", value: fmtMoney(offTotal), hint: "其余空闲时段" }),
          el(Card, { label: "总消耗", value: fmtMoney(totalCost), hint: "高峰 + 空闲 · " + regimeLabel(regime) })
        ),
        el("div", { style: st.sec }, "消耗表（按模型）"),
        el("div", { style: st.scroll },
          el("table", { style: st.tbl },
            el("thead", null, el("tr", null,
              el("th", { style: st.thFirst }, "模型"), el("th", { style: st.thFirst }, "API 服务商"), el("th", { style: st.th }, "调用"), el("th", { style: st.th }, "高峰/空闲"),
              el("th", { style: st.th }, "输入·未命中"), el("th", { style: st.th }, "缓存命中"), el("th", { style: st.th }, "输出"), el("th", { style: st.th }, "推理"),
              el("th", { style: st.th }, "高峰消耗"), el("th", { style: st.th }, "空闲消耗"), el("th", { style: st.th }, "总消耗")
            )),
            el("tbody", null,
              modelRows.map(function (m) {
                return el("tr", { key: m.key },
                  el("td", { style: st.tdWrap }, m.name),
                  el("td", { style: st.tdWrap }, m.providerText),
                  el("td", { style: st.td }, fmtInt(m.calls)),
                  el("td", { style: st.td }, el("span", { style: st.badgePeak }, fmtInt(m.peakCalls)), " / ", el("span", { style: st.badgeValley }, fmtInt(m.offCalls))),
                  el("td", { style: st.td }, fmtInt(m.miss)),
                  el("td", { style: st.td }, el("span", { style: st.badgeHit }, fmtInt(m.hit))),
                  el("td", { style: st.td }, fmtInt(m.out)),
                  el("td", { style: st.td }, m.reason ? fmtInt(m.reason) : "—"),
                  el("td", { style: st.td }, fmtMoney(m.peakCost)),
                  el("td", { style: st.td }, fmtMoney(m.offCost)),
                  el("td", { style: st.td }, fmtMoney(m.cost))
                );
              }),
              el("tr", null,
                el("td", { style: st.tdTotalFirst }, "合计"),
                el("td", { style: st.tdTotalFirst }, fmtInt(providerRows.length) + " 个服务商"),
                el("td", { style: st.tdTotal }, fmtInt(totalCalls)),
                el("td", { style: st.tdTotal }, el("span", { style: st.badgePeak }, fmtInt(peakCalls)), " / ", el("span", { style: st.badgeValley }, fmtInt(offCalls))),
                el("td", { style: st.tdTotal }, fmtInt(totalMiss)),
                el("td", { style: st.tdTotal }, fmtInt(totalHit)),
                el("td", { style: st.tdTotal }, fmtInt(totalOut)),
                el("td", { style: st.tdTotal }, totalReason ? fmtInt(totalReason) : "—"),
                el("td", { style: st.tdTotal }, fmtMoney(peakTotal)),
                el("td", { style: st.tdTotal }, fmtMoney(offTotal)),
                el("td", { style: st.tdTotal }, fmtMoney(totalCost))
              )
            )
          )
        ),
        el("div", { style: st.sec, marginTop: 14 }, "消耗明细（按 API 服务商 × 模型）"),
        el("div", { style: st.scroll },
          el("table", { style: st.tbl },
            el("thead", null, el("tr", null,
              el("th", { style: st.thFirst }, "API 服务商"), el("th", { style: st.thFirst }, "模型"), el("th", { style: st.th }, "调用"), el("th", { style: st.th }, "高峰/空闲"),
              el("th", { style: st.th }, "输入·未命中"), el("th", { style: st.th }, "缓存命中"), el("th", { style: st.th }, "输出"), el("th", { style: st.th }, "推理"),
              el("th", { style: st.th }, "高峰消耗"), el("th", { style: st.th }, "空闲消耗"), el("th", { style: st.th }, "总消耗")
            )),
            el("tbody", null, pmRows)
          )
        ),
        el("div", { style: st.note, marginTop: 8 },
          "DeepSeek 官方请求按官方峰谷价；SiliconFlow 按自身人民币公开价；DigitalOcean 按美元公开价 × USD/CNY 汇率折算人民币；千问暂不计费；AMD GPU Cloud DeepSeek V4 Flash 免费按 ¥0。模型名与 API 服务商均以请求参数为准。")
      );
    }

    // ── Calendar view ──
    function CalendarView(props) {
      var records = props.records, regime = props.regime, days = props.days || [];
      var nowB = new Date(Date.now() + 8 * 3600 * 1000);
      var nowY = nowB.getUTCFullYear(), nowM = nowB.getUTCMonth();
      var ymState = React.useState({ y: nowY, m: nowM });
      var ym = ymState[0], setYm = ymState[1];
      var selState = React.useState(null);
      var selectedDay = selState[0], setSelectedDay = selState[1];
      var dimState = React.useState("cost");
      var dimMode = dimState[0], setDim = dimState[1];

      var y = ym.y, m = ym.m;
      var nDays = monthDays(y, m);
      var offset = monthOffset(y, m);
      var dayMap = {};
      for (var di = 0; di < days.length; di++) dayMap[days[di].day] = days[di];

      // 高峰/空闲消耗拆分：优先取 host 汇总的 days 字段，字段缺失时用记录回退计算
      var splitMap = {};
      for (var sr = 0; sr < records.length; sr++) {
        var rec0 = records[sr];
        var k0 = bjKey(rec0.time);
        var c0 = costOf(rec0, regime);
        if (!splitMap[k0]) splitMap[k0] = { peak: 0, off: 0 };
        if (rec0.peak) splitMap[k0].peak += c0; else splitMap[k0].off += c0;
      }

      function dayCost(d) { return costOf(d, regime); }
      function dayVal(d) { return dimMode === "cost" ? dayCost(d) : (d ? d.calls : 0); }

      var maxV = 0, monthCalls = 0, monthMiss = 0, monthHit = 0, monthOut = 0, monthCost = 0, monthPeak = 0, monthOff = 0, monthPeakCalls = 0, monthOffCalls = 0;
      for (var d2 = 1; d2 <= nDays; d2++) {
        var key2 = y + "-" + pad2(m + 1) + "-" + pad2(d2);
        var r2 = dayMap[key2];
        var v2 = r2 ? dayVal(r2) : 0;
        if (v2 > maxV) maxV = v2;
        if (r2) {
          monthCalls += r2.calls; monthMiss += r2.miss; monthHit += r2.hit; monthOut += r2.out;
          monthPeakCalls += r2.peakCalls || 0; monthOffCalls += r2.offPeakCalls || 0;
          var ds2 = daySplit(r2, regime, splitMap[key2]);
          monthPeak += ds2.peak; monthOff += ds2.off;
        }
      }
      monthCost = monthPeak + monthOff;

      var weeks = ["一", "二", "三", "四", "五", "六", "日"];
      var cells = [];
      for (var b = 0; b < offset; b++) cells.push(el("div", { key: "b" + b, style: st.calCellBlank }, ""));
      for (var d3 = 1; d3 <= nDays; d3++) {
        var key3 = y + "-" + pad2(m + 1) + "-" + pad2(d3);
        var r3 = dayMap[key3];
        var v3 = r3 ? dayVal(r3) : 0;
        var inten = maxV > 0 ? v3 / maxV : 0;
        var bg = r3 && v3 > 0 ? "rgba(46,134,222," + (0.12 + 0.66 * inten).toFixed(2) + ")" : "rgba(128,128,128,.06)";
        var fg = inten > 0.5 ? "#fff" : "inherit";
        var tip = r3
          ? (function () {
              var ds3 = daySplit(r3, regime, splitMap[key3]);
              return dayLabel(key3) + "\n调用 " + r3.calls + " 次（高峰 " + r3.peakCalls + " / 空闲 " + r3.offPeakCalls + "）\n输入·未命中 " + fmtInt(r3.miss) + " · 缓存命中 " + fmtInt(r3.hit) + " · 输出 " + fmtInt(r3.out) + " · 推理 " + fmtInt(r3.reason) + "\n高峰消耗 " + fmtMoney(ds3.peak) + " · 空闲消耗 " + fmtMoney(ds3.off) + " · 合计 " + fmtMoney(ds3.peak + ds3.off) + "（" + costHint(regime) + "）";
            })()
          : dayLabel(key3) + "\n无记录";
        var isSel = selectedDay === key3;
        cells.push(el("div", {
          key: key3,
          title: tip,
          onClick: (function (k) { return function () { setSelectedDay(selectedDay === k ? null : k); }; })(key3),
          style: Object.assign({ background: bg, color: fg }, st.calCell, isSel ? st.calCellOn : null)
        },
          el("div", null, String(d3)),
          r3 ? el("div", { style: st.calCellVal }, dimMode === "cost" ? fmtMoney(dayCost(r3)) : fmtInt(r3.calls)) : el("div", { style: st.calCellVal }, "—")
        ));
      }

      // selected day detail (newest first)
      var selRecords = [];
      var selPeakCalls = 0, selOffCalls = 0, selPeakCost = 0, selOffCost = 0;
      if (selectedDay) {
        for (var si = 0; si < records.length; si++) {
          if (bjKey(records[si].time) === selectedDay) selRecords.push(records[si]);
        }
        selRecords.sort(function (a, b) { return b.time - a.time; });
        for (var sj = 0; sj < selRecords.length; sj++) {
          var srec = selRecords[sj];
          var scost = costOf(srec, regime);
          if (srec.peak) { selPeakCalls++; selPeakCost += scost; }
          else { selOffCalls++; selOffCost += scost; }
        }
      }

      // month daily stats (desc)
      var monthRows = [];
      for (var dd = 1; dd <= nDays; dd++) {
        var kd = y + "-" + pad2(m + 1) + "-" + pad2(dd);
        if (dayMap[kd]) monthRows.push(dayMap[kd]);
      }
      monthRows.sort(function (a, b) { return a.day < b.day ? 1 : a.day > b.day ? -1 : 0; });

      function prevMonth() { setYm({ y: m === 0 ? y - 1 : y, m: m === 0 ? 11 : m - 1 }); setSelectedDay(null); }
      function nextMonth() { setYm({ y: m === 11 ? y + 1 : y, m: m === 11 ? 0 : m + 1 }); setSelectedDay(null); }
      function goToday() { setYm({ y: nowY, m: nowM }); setSelectedDay(bjKey(Date.now())); }

      return el("div", null,
        el("div", { style: st.calBar },
          el("button", { style: st.btn, onClick: prevMonth }, "‹ 上月"),
          el("span", { style: { fontSize: fs(14), fontWeight: 600, minWidth: 120, textAlign: "center" } }, y + "年" + (m + 1) + "月"),
          el("button", { style: st.btn, onClick: nextMonth }, "下月 ›"),
          el("button", { style: st.btn, onClick: goToday }, "今天"),
          el("div", { style: st.seg, marginLeft: 8 },
            el("button", { style: dimMode === "cost" ? st.segBtnOn : st.segBtn, onClick: function () { setDim("cost"); } }, "按消耗"),
            el("button", { style: dimMode === "calls" ? st.segBtnOn : st.segBtn, onClick: function () { setDim("calls"); } }, "按调用数")
          )
        ),
        el("div", { style: st.calGrid },
          weeks.map(function (w) { return el("div", { key: w, style: st.calWk }, w); }),
          cells
        ),
        el("div", { style: st.legend },
          el("span", null, "热力："),
          el("span", { style: st.legendBar }),
          el("span", null, "低 → 高（" + (dimMode === "cost" ? "当日消耗" : "当日调用数") + "）"),
          el("span", null, "· 悬停查看详情，点击某天查看当日调用")
        ),
        el("div", { style: st.cards, marginTop: 12 },
          el(Card, { label: "本月调用", value: fmtInt(monthCalls), hint: "高峰 " + fmtInt(monthPeakCalls) + " · 空闲 " + fmtInt(monthOffCalls) + " · " + y + "年" + (m + 1) + "月" }),
          el(Card, { label: "输入 · 未命中", value: fmtInt(monthMiss), hint: "token" }),
          el(Card, { label: "输入 · 缓存命中", value: fmtInt(monthHit), hint: "token" }),
          el(Card, { label: "输出", value: fmtInt(monthOut), hint: "token" }),
          el(Card, { label: "高峰消耗", value: fmtMoney(monthPeak), hint: "高峰时段 9:00–12:00、14:00–18:00" }),
          el(Card, { label: "空闲消耗", value: fmtMoney(monthOff), hint: "其余空闲时段" }),
          el(Card, { label: "本月消耗", value: fmtMoney(monthCost), hint: "高峰 + 空闲 · " + costHint(regime) })
        ),
        el("div", { style: st.sec }, "每日统计（" + y + "年" + (m + 1) + "月）"),
        monthRows.length === 0
          ? el("div", { style: st.empty }, "本月暂无记录。")
          : el("div", { style: st.scroll },
              el("table", { style: st.tbl },
                el("thead", null, el("tr", null,
                  el("th", { style: st.thFirst }, "日期"), el("th", { style: st.th }, "调用"), el("th", { style: st.th }, "高峰/空闲"), el("th", { style: st.th }, "输入·未命中"), el("th", { style: st.th }, "缓存命中"), el("th", { style: st.th }, "输出"), el("th", { style: st.th }, "高峰消耗"), el("th", { style: st.th }, "空闲消耗"), el("th", { style: st.th }, "总消耗(自动)")
                )),
                el("tbody", null, monthRows.map(function (drow) {
                  var sel = selectedDay === drow.day;
                  var ds4 = daySplit(drow, regime, splitMap[drow.day]);
                  return el("tr", { key: drow.day },
                    el("td", { style: sel ? st.tdClickSel : st.tdClick, onClick: (function (k) { return function () { setSelectedDay(selectedDay === k ? null : k); }; })(drow.day) }, dayLabel(drow.day)),
                    el("td", { style: st.td }, fmtInt(drow.calls)),
                    el("td", { style: st.td }, el("span", { style: st.badgePeak }, drow.peakCalls) , " / ", el("span", { style: st.badgeValley }, drow.offPeakCalls)),
                    el("td", { style: st.td }, fmtInt(drow.miss)),
                    el("td", { style: st.td }, el("span", { style: st.badgeHit }, fmtInt(drow.hit))),
                    el("td", { style: st.td }, fmtInt(drow.out)),
                    el("td", { style: st.td }, fmtMoney(ds4.peak)),
                    el("td", { style: st.td }, fmtMoney(ds4.off)),
                    el("td", { style: st.td }, fmtMoney(ds4.peak + ds4.off))
                  );
                }))
              )
            ),
        selectedDay
          ? el("div", null,
              el("div", { style: st.selDayTitle }, dayLabel(selectedDay) + " 调用明细"),
              el("div", { style: st.note, marginTop: 6 },
                "高峰 " + selPeakCalls + " 条 · " + fmtMoney(selPeakCost) +
                "　｜　空闲 " + selOffCalls + " 条 · " + fmtMoney(selOffCost) +
                "　｜　合计 " + fmtMoney(selPeakCost + selOffCost) + "（" + costHint(regime) + "）"),
              selRecords.length === 0
                ? el("div", { style: st.empty }, "该日无记录。")
                : el("div", { style: st.scroll },
                    el("table", { style: st.tbl },
                      el("thead", null, el("tr", null,
                        el("th", { style: st.thFirst }, "时间(北京)"), el("th", { style: st.thFirst }, "模型"), el("th", { style: st.th }, "输入·未命中"), el("th", { style: st.th }, "缓存命中"), el("th", { style: st.th }, "输出"), el("th", { style: st.th }, "推理"), el("th", { style: st.th }, "时段"), el("th", { style: st.th }, "结束"), el("th", { style: st.th }, "消耗")
                      )),
                      el("tbody", null, selRecords.map(function (rr) {
                        var hit2 = rr.cacheReadTokens || 0, miss2 = rr.inputTokens || 0;
                        var cost2 = costOf(rr, regime);
                        return el("tr", { key: rr.time },
                          el("td", { style: st.tdFirst }, fmtTime(rr.time)),
                          el("td", { style: st.tdWrap },
                            el("div", null, modelName(rr)),
                            el("div", { style: st.sub }, providerName(rr.provider))
                          ),
                          el("td", { style: st.td }, fmtInt(miss2)),
                          el("td", { style: st.td }, el("span", { style: st.badgeHit }, fmtInt(hit2))),
                          el("td", { style: st.td }, fmtInt(rr.outputTokens || 0)),
                          el("td", { style: st.td }, rr.reasoningTokens ? fmtInt(rr.reasoningTokens) : "—"),
                          el("td", { style: st.td }, rr.peak ? el("span", { style: st.badgePeak }, "峰") : el("span", { style: st.badgeValley }, "谷")),
                          el("td", { style: st.td }, finishLabel(rr.finishReason)),
                          el("td", { style: st.td }, el("span", { style: rr.peak ? st.costPeak : st.costOff }, fmtMoney(cost2)))
                        );
                      }))
                    )
                  )
            )
          : null
      );
    }

    // ── Cache hit list view (newest first + time filters) ──
    function CacheListView(props) {
      var records = props.records, regime = props.regime;
      var presetState = React.useState("all");
      var preset = presetState[0], setPreset = presetState[1];
      var fromState = React.useState("");
      var fromDate = fromState[0], setFromDate = fromState[1];
      var toState = React.useState("");
      var toDate = toState[0], setToDate = toState[1];
      var pageState = React.useState(1);
      var page = pageState[0], setPage = pageState[1];

      var nowKey = bjKey(Date.now());
      var fromMs = null, toMs = null;
      if (preset === "today") { fromMs = bjStartMs(nowKey); toMs = Date.now(); }
      else if (preset === "7d") { fromMs = bjStartMs(nowKey) - 6 * 86400000; toMs = Date.now(); }
      else if (preset === "30d") { fromMs = bjStartMs(nowKey) - 29 * 86400000; toMs = Date.now(); }
      else if (preset === "custom") {
        if (fromDate) fromMs = bjStartMs(fromDate);
        if (toDate) toMs = bjStartMs(toDate) + 86400000 - 1;
      }

      var filtered = [];
      for (var i = 0; i < records.length; i++) {
        var r = records[i];
        if (fromMs != null && r.time < fromMs) continue;
        if (toMs != null && r.time > toMs) continue;
        filtered.push(r);
      }
      filtered.sort(function (a, b) { return b.time - a.time; }); // newest first

      var sumHit = 0, sumMiss = 0, sumOut = 0, sumCost = 0, sumWrite = 0, sumReason = 0;
      for (var s = 0; s < filtered.length; s++) {
        var rr2 = filtered[s];
        sumHit += rr2.cacheReadTokens || 0; sumMiss += rr2.inputTokens || 0; sumOut += rr2.outputTokens || 0;
        sumWrite += rr2.cacheWriteTokens || 0; sumReason += rr2.reasoningTokens || 0;
        sumCost += costOf(rr2, regime);
      }

      // 分页渲染：只渲染当前页，避免上千行 DOM 导致卡顿
      var PAGE_SIZE = 100;
      var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      var curPage = Math.min(Math.max(1, page), totalPages);
      var pageRows = filtered.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);

      function setCustomFrom(v) { setFromDate(v); setPreset("custom"); setPage(1); }
      function setCustomTo(v) { setToDate(v); setPreset("custom"); setPage(1); }
      function presetBtn(k, label) {
        return el("button", { style: preset === k ? st.segBtnOn : st.segBtn, onClick: function () { setPreset(k); setPage(1); } }, label);
      }
      function pageBtn(kind, label, disabled, onClick) {
        return el("button", { style: disabled ? st.btnDisabled : st.btn, onClick: onClick }, label);
      }
      var sums = splitTotals(filtered, regime);

      return el("div", null,
        el("div", { style: st.calBar },
          el("div", { style: st.seg },
            presetBtn("today", "今天"), presetBtn("7d", "近7天"), presetBtn("30d", "近30天"), presetBtn("all", "全部")
          ),
          el("span", { style: st.note }, "自定义区间："),
          el("input", { type: "date", style: st.dateInput, value: fromDate, onChange: function (e) { setCustomFrom(e.target.value); } }),
          el("span", { style: st.note }, "至"),
          el("input", { type: "date", style: st.dateInput, value: toDate, onChange: function (e) { setCustomTo(e.target.value); } }),
          (fromDate || toDate) ? el("button", { style: st.btn, onClick: function () { setFromDate(""); setToDate(""); setPreset("all"); setPage(1); } }, "清除区间") : null
        ),
        el("div", { style: st.note, marginTop: 8 },
          "当前范围：共 " + fmtInt(filtered.length) + " 条 · 输入·未命中 " + fmtInt(sumMiss) + " · 缓存命中 " + fmtInt(sumHit) + " · 缓存写入 " + fmtInt(sumWrite) + " · 输出 " + fmtInt(sumOut) +
          " · 高峰消耗 " + fmtMoney(sums.peak) + " · 空闲消耗 " + fmtMoney(sums.off) + " · 总消耗 " + fmtMoney(sumCost) + "（" + costHint(regime) + "）"
        ),
        filtered.length === 0
          ? el("div", { style: st.empty }, "该时间范围内没有记录。")
          : el("div", null,
              el("div", { style: st.calBar },
                pageBtn("prev", "‹ 上一页", curPage <= 1, function () { setPage(curPage - 1); }),
                el("span", { style: st.note }, "第 " + curPage + " / " + totalPages + " 页 · 每页 " + PAGE_SIZE + " 条 · 共 " + fmtInt(filtered.length) + " 条"),
                pageBtn("next", "下一页 ›", curPage >= totalPages, function () { setPage(curPage + 1); })
              ),
              el("div", { style: st.scroll },
                el("table", { style: st.tbl },
                  el("thead", null, el("tr", null,
                    el("th", { style: st.thFirst }, "时间(北京)"), el("th", { style: st.thFirst }, "模型"), el("th", { style: st.th }, "输入·未命中"), el("th", { style: st.th }, "缓存命中"), el("th", { style: st.th }, "缓存写入"), el("th", { style: st.th }, "输出"), el("th", { style: st.th }, "推理"), el("th", { style: st.th }, "命中率"), el("th", { style: st.th }, "时段"), el("th", { style: st.th }, "结束"), el("th", { style: st.th }, "消耗")
                  )),
                  el("tbody", null,
                    pageRows.map(function (rr3, idx) {
                      var hit3 = rr3.cacheReadTokens || 0, miss3 = rr3.inputTokens || 0;
                      var cost3 = costOf(rr3, regime);
                      return el("tr", { key: rr3.time + "-" + idx },
                        el("td", { style: st.tdFirst }, fmtTime(rr3.time)),
                        el("td", { style: st.tdWrap },
                          el("div", null, modelName(rr3)),
                          el("div", { style: st.sub }, (rr3.provider || "") + (rr3.purpose ? " · " + rr3.purpose : ""))
                        ),
                        el("td", { style: st.td }, fmtInt(miss3)),
                        el("td", { style: st.td }, el("span", { style: st.badgeHit }, fmtInt(hit3))),
                        el("td", { style: st.td }, rr3.cacheWriteTokens ? fmtInt(rr3.cacheWriteTokens) : "—"),
                        el("td", { style: st.td }, fmtInt(rr3.outputTokens || 0)),
                        el("td", { style: st.td }, rr3.reasoningTokens ? fmtInt(rr3.reasoningTokens) : "—"),
                        el("td", { style: st.td }, pct(hit3, hit3 + miss3)),
                        el("td", { style: st.td }, rr3.peak ? el("span", { style: st.badgePeak }, "峰") : el("span", { style: st.badgeValley }, "谷")),
                        el("td", { style: st.td }, finishLabel(rr3.finishReason)),
                        el("td", { style: st.td }, el("span", { style: rr3.peak ? st.costPeak : st.costOff }, fmtMoney(cost3)))
                      );
                    }),
                    el("tr", null,
                      el("td", { style: st.tdTotalFirst }, "总费用合计"),
                      el("td", { style: st.tdTotal }, fmtInt(filtered.length) + " 条"),
                      el("td", { style: st.tdTotal }, fmtInt(sumMiss)),
                      el("td", { style: st.tdTotal }, fmtInt(sumHit)),
                      el("td", { style: st.tdTotal }, fmtInt(sumWrite)),
                      el("td", { style: st.tdTotal }, fmtInt(sumOut)),
                      el("td", { style: st.tdTotal }, sumReason ? fmtInt(sumReason) : "—"),
                      el("td", { style: st.tdTotal }, pct(sumHit, sumHit + sumMiss)),
                      el("td", { style: st.tdTotal }, "—"),
                      el("td", { style: st.tdTotal }, "—"),
                      el("td", { style: st.tdTotal }, fmtMoney(sumCost))
                    )
                  )
                )
              )
            )
      );
    }

    // ── Price table view ──
    // 价格表按官方固定，不可编辑。顶部可切换查看「自动 / 峰谷价 / 基础价」三档；
    // 自动档展示当前生效价格（生效前=基础价，生效后=峰谷价）。
    function PriceView(props) {
      var pricing = props.pricing || { base: {}, peakValley: {} };
      var effectiveAt = props.effectiveAt || 0;
      var fx = props.fx || {};
      var regimeState = React.useState("auto");
      var regime = regimeState[0], setRegime = regimeState[1];
      var effectiveIn = function () {
        if (!effectiveAt) return "新价格表生效时间未知";
        var now = Date.now();
        return now < effectiveAt ? "新价格表（峰谷价）将于 " + fmtTime(effectiveAt) + "（北京时间）生效，当前按旧价格表（基础价）计费" : "新价格表（峰谷价）已生效（自 " + fmtTime(effectiveAt) + " 起）";
      };
      var showRegime = function (r) {
        if (r === "auto") return Date.now() < effectiveAt ? "base" : "peakValley";
        return r;
      };
      // auto 档：显示当前生效的价格表（生效前=基础价 base，生效后=峰谷价 peakValley）
      var table = pricing && pricing[showRegime(regime)] || {};
      var cell = function (mk, a, b) {
        var row = table && table[mk];
        if (!row) return "—";
        if (showRegime(regime) === "base") return fmtPrice(row[a]);
        var sub = row[a];
        return sub ? fmtPrice(sub[b]) : "—";
      };
      var rows = PRICE_MODELS.map(function (mk) {
        if (showRegime(regime) === "base") {
          return el("tr", { key: mk },
            el("td", { style: st.tdFirst }, modelLabel(mk)),
            el("td", { style: st.td }, el("span", { style: st.badgeHit }, cell(mk, "cacheHit"))),
            el("td", { style: st.td }, cell(mk, "cacheMiss")),
            el("td", { style: st.td }, cell(mk, "output"))
          );
        }
        return el("tr", { key: mk },
          el("td", { style: st.tdFirst }, modelLabel(mk)),
          el("td", { style: st.td }, el("span", { style: st.badgeValley }, cell(mk, "offPeak", "cacheHit"))),
          el("td", { style: st.td }, cell(mk, "offPeak", "cacheMiss")),
          el("td", { style: st.td }, cell(mk, "offPeak", "output")),
          el("td", { style: st.td }, el("span", { style: st.badgePeak }, cell(mk, "peak", "cacheHit"))),
          el("td", { style: st.td }, cell(mk, "peak", "cacheMiss")),
          el("td", { style: st.td }, cell(mk, "peak", "output"))
        );
      });

      return el("div", null,
        el("div", { style: st.sec }, "今日 $ / ¥ 汇率"),
        el("div", { style: st.cards, marginTop: 8 },
          el(Card, { label: "$ → ¥", value: fx.rate ? ("$1 = ¥" + Number(fx.rate).toFixed(4)) : "暂不可用", hint: fx.date ? ("汇率日期 " + fx.date) : "等待获取" }),
          el(Card, { label: "¥ → $", value: fx.inverse ? ("¥1 = $" + Number(fx.inverse).toFixed(6)) : "暂不可用", hint: fx.source || "Frankfurter" }),
          el(Card, { label: "汇率状态", value: fx.stale ? "缓存汇率" : (fx.rate ? "最新可用" : "获取失败"), hint: fx.error || "Frankfurter · central-bank reference rates" })
        ),
        el("div", { style: st.actions, marginTop: 8 },
          el("button", { style: st.btn, onClick: props.onFxRefresh }, "刷新汇率"),
          el("span", { style: st.note }, "美元计价的 DigitalOcean 消耗按该 USD/CNY 汇率换算成人民币；人民币定价不受汇率影响。")
        ),
        el("div", { style: st.sec, marginTop: 18 }, "DeepSeek 官方 API 价格表"),
        el("div", { style: st.note, marginTop: 6 },
          "本表仅用于 DeepSeek 官方 Provider；第三方 Provider 按下方已核验的自身价格计费，无法可靠匹配价格的模型按 0 统计。价格按官方公布固定，不可编辑。"),
        el("div", { style: st.calBar },
          el("div", { style: st.seg },
            el("button", { style: regime === "auto" ? st.segBtnOn : st.segBtn, onClick: function () { setRegime("auto"); } }, "自动"),
            el("button", { style: regime === "peakValley" ? st.segBtnOn : st.segBtn, onClick: function () { setRegime("peakValley"); } }, "峰谷价"),
            el("button", { style: regime === "base" ? st.segBtnOn : st.segBtn, onClick: function () { setRegime("base"); } }, "基础价")
          )
        ),
        el("div", { style: st.note, marginTop: 6 }, effectiveIn()),
        regime === "auto"
          ? el("div", { style: st.note, marginTop: 6 },
              "自动模式：按调用时间自动选择计费档位——新价格表生效前的调用按基础价（旧价格表），生效后的调用按峰谷价（高峰时段 9:00–12:00、14:00–18:00 用高峰价，其余空闲时段用空闲价）。当前显示：",
              el("strong", null, showRegime(regime) === "base" ? "基础价表（旧价格表，新价格生效前）" : "峰谷价表（新价格表）"),
              "。价格按官方公布固定，不可编辑。"
            )
          : null,
        showRegime(regime) === "base"
          ? el("div", { style: st.scroll },
              el("table", { style: st.tbl },
                el("thead", null, el("tr", null,
                  el("th", { style: st.thFirst }, "模型"), el("th", { style: st.th }, "缓存命中（输入）"), el("th", { style: st.th }, "输入 · 未命中"), el("th", { style: st.th }, "输出")
                )),
                el("tbody", null, rows)
              )
            )
          : el("div", { style: st.scroll },
              el("table", { style: st.tbl },
                el("thead", null, el("tr", null,
                  el("th", { style: st.thFirst }, "模型"),
                  el("th", { style: st.th }, "空闲 · 缓存命中"), el("th", { style: st.th }, "空闲 · 输入"), el("th", { style: st.th }, "空闲 · 输出"),
                  el("th", { style: st.th }, "高峰 · 缓存命中"), el("th", { style: st.th }, "高峰 · 输入"), el("th", { style: st.th }, "高峰 · 输出")
                )),
                el("tbody", null, rows)
              )
            ),
        el("div", { style: st.note, marginTop: 8 },
          "单位：元 / 百万 tokens。高峰时段（北京时间 9:00–12:00、14:00–18:00）用高峰价，其余空闲时段用空闲价（空闲价 = 高峰价的一半）。概览、用量日历、缓存命中列表中的消耗均已按高峰 / 空闲分列统计。"
        ),
        el("div", { style: st.sec, marginTop: 18 }, "第三方平台价格与覆盖状态（2026-08-19 核验）"),
        el("div", { style: st.note, marginTop: 6 }, "只把能与记录中的 provider/model 可靠匹配的价格用于自动计费；美元价格先按 USD 计算，再乘 USD/CNY 汇率统一折算成人民币。"),
        el("div", { style: st.scroll, marginTop: 8 },
          el("table", { style: st.tbl },
            el("thead", null, el("tr", null,
              el("th", { style: st.thFirst }, "API 服务商"), el("th", { style: st.thFirst }, "模型 / 状态"),
              el("th", { style: st.th }, "缓存命中"), el("th", { style: st.th }, "输入"), el("th", { style: st.th }, "输出"), el("th", { style: st.thFirst }, "说明")
            )),
            el("tbody", null, [
              ["SiliconFlow", "DeepSeek-V4-Flash", "¥0.02", "¥1.00", "¥2.00", "已用于自动计费"],
              ["SiliconFlow", "DeepSeek-V4-Pro", "¥1.00", "¥12.00", "¥24.00", "缓存命中价按 2026-08-03 起生效公告"],
              ["SiliconFlow", "DeepSeek-V3.2", "¥0.40", "¥4.00", "¥6.00", "已用于自动计费"],
              ["SiliconFlow", "Qwen3.6-27B", "按输入价", "¥3.00", "¥18.00", "公告未单列缓存命中价"],
              ["DigitalOcean", "DeepSeek V4 Flash", "$0.028", "$0.112", "$0.224", "自动按 USD/CNY 汇率换算人民币并计费"],
              ["DigitalOcean", "DeepSeek V4 Pro", "$0.348", "$1.392", "$2.784", "自动按 USD/CNY 汇率换算人民币并计费"],
              ["DigitalOcean", "DeepSeek V3.2", "$0.15", "$0.425", "$1.36", "自动按 USD/CNY 汇率换算人民币并计费"],
              ["Alibaba / 千问", "暂不计费", "—", "—", "—", "调用与 token 正常统计；费用暂按 ¥0"],
              ["AMD GPU Cloud", "DeepSeek V4 Flash", "¥0", "¥0", "¥0", "免费；费用固定按 ¥0"]
            ].map(function (row, idx) {
              return el("tr", { key: "provider-price-" + idx },
                el("td", { style: st.tdFirst }, row[0]), el("td", { style: st.tdWrap }, row[1]),
                el("td", { style: st.td }, row[2]), el("td", { style: st.td }, row[3]), el("td", { style: st.td }, row[4]), el("td", { style: st.tdWrap }, row[5])
              );
            }))
          )
        ),
        el("div", { style: st.note, marginTop: 8 }, "DigitalOcean 使用美元官方价并按最新可用 USD/CNY 汇率折算人民币；千问暂不计费；AMD GPU Cloud 的 DeepSeek V4 Flash 免费按 ¥0。")
      );
    }
    // ── Usage panel ──
    var SUBTABS = [
      { k: "overview", t: "概览" },
      { k: "calendar", t: "用量日历" },
      { k: "cache", t: "缓存命中列表" },
      { k: "prices", t: "价格表" }
    ];

    function UsagePanel(props) {
      var state = React.useState({ records: [], count: 0, dataPath: "", persistOk: false, persistError: "", pricing: null, days: [] });
      var data = state[0], setData = state[1];
      var tabState = React.useState("overview");
      var tab = tabState[0], setTab = tabState[1];
      var errState = React.useState("");
      var error = errState[0], setError = errState[1];
      var expState = React.useState("");
      var exportMsg = expState[0], setExportMsg = expState[1];
      var impState = React.useState("");
      var importMsg = impState[0], setImportMsg = impState[1];
      var destState = React.useState("");
      var destDir = destState[0], setDestDir = destState[1];
      var canvasNode = null, fileInputNode = null;
      var timer = props.timer;

      function refresh() {
        api({ action: "list" }).then(function (res) {
          setData(res || { records: [], count: 0, dataPath: "", persistOk: false, persistError: "", pricing: null, days: [] });
          setError("");
        }).catch(function (e) { setError(String((e && e.message) || e)); });
      }

      React.useEffect(function () {
        refresh();
        // 每 10 秒自动刷新（列表已分页渲染，避免 3 秒全量重取 + 全量重渲染导致的卡顿）
        if (timer && timer.interval) return timer.interval(refresh, 10000);
        return undefined;
      }, []);

      function showExport(res) {
        if (res && res.ok) {
          setExportMsg("已导出：" + res.path);
          if (res.dir) api({ action: "reveal", dir: res.dir }).catch(function () {});
        } else {
          setExportMsg("导出失败：" + ((res && res.error) || "未知错误"));
        }
      }

      function doExport(kind) {
        setExportMsg("导出中…");
        api({ action: "export", kind: kind, dir: destDir || undefined }).then(showExport).catch(function (e) { setExportMsg("导出失败：" + String((e && e.message) || e)); });
      }

      function doExportImage() {
        setExportMsg("生成图片中…");
        if (!canvasNode) { setExportMsg("画布不可用"); return; }
        try {
          drawReport(canvasNode, (data.records || []).slice());
          var dataUrl = canvasNode.toDataURL("image/png");
          api({ action: "exportPng", dataUrl: dataUrl, dir: destDir || undefined }).then(showExport).catch(function (e) { setExportMsg("导出失败：" + String((e && e.message) || e)); });
        } catch (e) {
          setExportMsg("生成图片失败：" + String((e && e.message) || e));
        }
      }

      function pickDestDir() {
        setExportMsg("打开目录选择…");
        api({ action: "pickDir" }).then(function (res) {
          if (res && res.ok) { setDestDir(res.path); setExportMsg("导出目标：" + res.path); }
          else if (res && res.cancelled) { setExportMsg(""); }
          else { setExportMsg("选择目录失败：" + ((res && res.error) || "")); }
        }).catch(function (e) { setExportMsg("选择目录失败：" + String((e && e.message) || e)); });
      }

      function doReveal() {
        api({ action: "reveal", dir: destDir || "data" }).then(function (res) {
          if (!res || !res.ok) setExportMsg("打开文件夹失败：" + ((res && res.error) || ""));
        }).catch(function (e) { setExportMsg("打开文件夹失败：" + String((e && e.message) || e)); });
      }

      function doClear() {
        api({ action: "clear" }).then(refresh).catch(function (e) { setError(String((e && e.message) || e)); });
      }

      function pickFile() { if (fileInputNode) fileInputNode.click(); }

      function onFileChange(e) {
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        setImportMsg("读取文件…");
        var readPromise = typeof f.text === "function"
          ? f.text()
          : new Promise(function (resolve, reject) { var r = new FileReader(); r.onload = function () { resolve(r.result); }; r.onerror = reject; r.readAsText(f); });
        readPromise.then(function (content) {
          try { e.target.value = ""; } catch (err) {}
          api({ action: "import", content: String(content), filename: f.name }).then(function (res) {
            if (res && res.ok) {
              setImportMsg("导入成功：新增 " + res.imported + " 条，跳过重复 " + res.skipped + " 条，忽略无效 " + res.invalid + " 条，现有共 " + res.total + " 条");
              refresh();
            } else {
              setImportMsg("导入失败：" + ((res && res.error) || "未知错误"));
            }
          }).catch(function (err) { setImportMsg("导入失败：" + String((err && err.message) || err)); });
        }).catch(function () { setImportMsg("读取文件失败"); });
      }

      var records = data.records || [];
      var dataPath = data.dataPath || "";
      var nowPeak = isPeakNow(Date.now());
      var effectiveAt = data.effectiveAt || 0;
      var nowEffective = effectiveAt ? (Date.now() >= effectiveAt) : true;
      return el("div", { style: st.root },
        el("canvas", { ref: function (n) { canvasNode = n; }, style: { display: "none" } }),
        el("div", { style: st.head },
          el("div", { style: st.headleft },
            el("div", null,
              el("div", { style: st.title }, "用量与消耗"),
              el("div", { style: st.sub }, "记录插件激活后的每一次模型调用")
            ),
            el("span", { style: nowPeak ? st.badgePeak : st.badgeValley }, nowPeak ? "当前 · 高峰时段" : "当前 · 空闲时段"),
              el("span", { style: nowEffective ? st.badgeHit : st.badgeValley }, nowEffective ? "新价格已生效" : "新价格未生效")
          ),
          el("div", { style: st.actions },
            el("button", { style: st.btn, onClick: refresh }, "刷新"),
            el("button", { style: st.btn, onClick: doClear }, "清空")
          )
        ),
        el("div", { style: st.subtabBar },
          SUBTABS.map(function (t) {
            return el("button", {
              key: t.k,
              style: tab === t.k ? st.subtabOn : st.subtab,
              onClick: function () { setTab(t.k); }
            }, t.t);
          })
        ),
        el("div", { style: st.note, marginTop: 6 },
          "计价说明：DeepSeek 官方与 SiliconFlow 按人民币价格；DigitalOcean 按美元官方价 × USD/CNY 汇率折算人民币；千问暂不计费；AMD GPU Cloud DeepSeek V4 Flash 免费按 ¥0。"
        ),
        tab === "overview" ? el(OverviewView, { records: records, regime: "auto" }) : null,
        tab === "calendar" ? el(CalendarView, { records: records, regime: "auto", days: data.days || [] }) : null,
        tab === "cache" ? el(CacheListView, { records: records, regime: "auto" }) : null,
        tab === "prices" ? el(PriceView, { pricing: data.pricing, effectiveAt: data.effectiveAt, fx: data.fx || {}, onFxRefresh: function () { api({ action: "fxRefresh" }).then(refresh).catch(function () {}); }, onChanged: refresh }) : null,
        el("div", { style: st.actions, marginTop: 4 },
          el("button", { style: st.btn, onClick: function () { doExport("csv"); } }, "导出 CSV"),
          el("button", { style: st.btn, onClick: function () { doExport("json"); } }, "导出 JSON"),
          el("button", { style: st.btn, onClick: doExportImage }, "导出图片 (PNG)"),
          el("button", { style: st.btn, onClick: doReveal }, "打开目录"),
          exportMsg ? el("span", { style: st.sub }, exportMsg) : null
        ),
        el("div", { style: st.actions },
          el("input", { style: st.input, placeholder: "导出目标目录（留空 = 默认数据目录）", value: destDir, onChange: function (e) { setDestDir(e.target.value); } }),
          el("button", { style: st.btn, onClick: pickDestDir }, "选择目录…"),
          destDir ? el("button", { style: st.btn, onClick: function () { setDestDir(""); setExportMsg("已恢复默认数据目录"); } }, "重置") : null
        ),
        el("div", { style: st.actions },
          el("input", { type: "file", accept: ".json,.csv", style: { display: "none" }, ref: function (n) { fileInputNode = n; }, onChange: onFileChange }),
          el("button", { style: st.btn, onClick: pickFile }, "选择文件导入"),
          importMsg ? el("span", { style: st.sub }, importMsg) : null
        ),
        error ? el("div", { style: st.err }, error) : null,
        dataPath
          ? el("div", { style: st.note }, "数据持久化：" + dataPath + "（每次调用实时落盘，插件重启后自动恢复，最多保留 100000 条）")
          : el("div", { style: st.note, color: "#ff6b6b", opacity: 1 }, "持久化未启用：" + (data.persistError || "未知原因"))
      );
    }

    // ── Balance panel ──
    function BalancePanel() {
      var state = React.useState({ status: "idle", data: null, error: "" });
      var s = state[0], setS = state[1];
      var providerState = React.useState("deepseek");
      var provider = providerState[0], setProvider = providerState[1];
      var tokenState = React.useState("");
      var digitalOceanToken = tokenState[0], setDigitalOceanToken = tokenState[1];
      var credentialState = React.useState({ status: "idle", configured: false, source: "", writable: true, masked: "" });
      var credential = credentialState[0], setCredential = credentialState[1];
      var saveState = React.useState({ status: "idle", error: "" });
      var saving = saveState[0], setSaving = saveState[1];
      var providers = [
        { id: "deepseek", name: "DeepSeek", hint: "DEEPSEEK_API_KEY（推理 Key）" },
        { id: "siliconflow", name: "SiliconFlow", hint: "模型设置中 Provider ID 或显示名为 siliconflow 的提供商 API Key", actionUrl: "https://cloud.siliconflow.cn/account/ak", actionLabel: "打开 SiliconFlow API 密钥" },
        { id: "digitalocean", name: "DigitalOcean", hint: "账户级 dop_v1_ Personal Access Token；Read Only（api:read）或 billing:read", actionUrl: "https://cloud.digitalocean.com/account/api/tokens", actionLabel: "创建 DigitalOcean Account API Token" },
        { id: "amd-gpu-cloud", name: "AMD GPU Cloud", hint: "暂无公开余额 API，仅支持控制台查看", unsupported: true, actionUrl: "https://www.amd.com/en/developer/resources/cloud-access/amd-developer-cloud.html", actionLabel: "打开 AMD Developer Cloud" }
      ];
      var selected = providers[0];
      for (var pi = 0; pi < providers.length; pi++) if (providers[pi].id === provider) selected = providers[pi];

      function query(nextProvider) {
        var target = typeof nextProvider === "string" ? nextProvider : provider;
        setS({ status: "loading", data: null, error: "" });
        api({ action: "balance", provider: target }).then(function (res) {
          if (res && res.ok) setS({ status: "done", data: res, error: "" });
          else setS({ status: "error", data: res, error: (res && res.error) || "查询失败" });
        }).catch(function (e) {
          setS({ status: "error", data: null, error: String((e && e.message) || e) });
        });
      }

      function loadDigitalOceanCredential(shouldQuery) {
        setCredential({ status: "loading", configured: false, source: "", writable: true, masked: "" });
        api({ action: "balanceCredentialStatus", provider: "digitalocean" }).then(function (res) {
          if (!res || !res.ok) {
            setCredential({ status: "error", configured: false, source: "", writable: false, masked: "", error: (res && res.error) || "无法读取凭据状态" });
            return;
          }
          setCredential({ status: "done", configured: !!res.configured, source: res.source || "", writable: res.writable !== false, masked: res.masked || "" });
          if (shouldQuery && res.configured) query("digitalocean");
        }).catch(function (e) {
          setCredential({ status: "error", configured: false, source: "", writable: false, masked: "", error: String((e && e.message) || e) });
        });
      }

      function saveDigitalOceanCredential() {
        var value = String(digitalOceanToken || "").trim();
        if (!value) {
          setSaving({ status: "error", error: "请输入以 dop_v1_ 开头的 DigitalOcean 账户 PAT。" });
          return;
        }
        setSaving({ status: "saving", error: "" });
        api({ action: "saveBalanceCredential", provider: "digitalocean", value: value }).then(function (res) {
          if (!res || !res.ok) {
            setSaving({ status: "error", error: (res && res.error) || "保存失败" });
            return;
          }
          setDigitalOceanToken("");
          setCredential({ status: "done", configured: true, source: res.source || "file", writable: res.writable !== false, masked: res.masked || "••••••••••••" });
          setSaving({ status: "done", error: "" });
          query("digitalocean");
        }).catch(function (e) {
          setSaving({ status: "error", error: String((e && e.message) || e) });
        });
      }

      function chooseProvider(id) {
        setProvider(id);
        setS({ status: "idle", data: null, error: "" });
        setSaving({ status: "idle", error: "" });
        setDigitalOceanToken("");
        if (id === "digitalocean") loadDigitalOceanCredential(true);
        else query(id);
      }

      React.useEffect(function () { query("deepseek"); }, []);
      var d = s.data;
      var symbol = currencySymbol(d && d.currency);
      var actionUrl = d && d.credentialHelpUrl || selected.actionUrl || "";
      var credentialMeta = [];
      if (d && d.credentialName) credentialMeta.push("使用凭据 " + d.credentialName);
      if (d && d.credentialSource) credentialMeta.push("来源 " + d.credentialSource);
      if (d && d.modelProviderRoute) credentialMeta.push("模型提供商 " + d.modelProviderRoute);
      if (d && d.endpoint) credentialMeta.push("端点 " + d.endpoint);
      var heroLabel = d && d.balanceLabel ? d.balanceLabel : ((d && d.providerName) || selected.name) + " · 账户余额";
      var heroStatus = d && d.provider === "digitalocean"
        ? (d.balanceKind === "credit" ? "USD · 预付款/信用余额" : d.balanceKind === "due" ? "USD · 待结算金额" : "USD · 当前无余额")
        : (d && d.currency) + (d && d.isAvailable === true ? " · 账户可用" : d && d.isAvailable === false ? " · 账户不可用" : " · 查询成功");

      return el("div", { style: st.root },
        el("div", { style: st.head },
          el("div", null,
            el("div", { style: st.title }, "剩余余额查询"),
            el("div", { style: st.sub }, "查询 DeepSeek、SiliconFlow 与 DigitalOcean 账户余额")
          ),
          el("div", { style: st.actions },
            selected.unsupported
              ? el("a", { style: Object.assign({}, st.btn, { textDecoration: "none" }), href: selected.actionUrl, target: "_blank", rel: "noreferrer" }, "打开控制台")
              : provider === "digitalocean" && !credential.configured
                ? null
                : el("button", { style: s.status === "loading" ? st.btnDisabled : st.btn, disabled: s.status === "loading", onClick: query }, s.status === "loading" ? "查询中…" : provider === "digitalocean" ? "查询账单" : "查询余额")
          )
        ),
        el("div", { style: st.subtabBar },
          providers.map(function (p) {
            return el("button", {
              key: p.id,
              style: provider === p.id ? st.subtabOn : st.subtab,
              onClick: function () { chooseProvider(p.id); }
            }, p.name);
          })
        ),
        el("div", { style: st.note }, "所需凭据：" + selected.hint),
        s.status === "error"
          ? el("div", { style: d && d.unsupported ? st.infobox : st.errbox },
              el("div", { style: d && d.unsupported ? st.infoboxTitle : st.errboxTitle }, d && d.unsupported ? "仅支持控制台查看" : "查询失败"),
              el("div", null, s.error),
              el("div", { style: st.note, marginTop: 6 }, selected.unsupported
                ? "插件不会尝试未经公开文档确认的端点，也不会把 AMD 推理 Key 当作账单凭据。"
                : "请确认凭据类型正确、权限包含余额/账单读取，且网络可访问服务商官方 API。"),
              actionUrl ? el("a", { style: st.actionLink, href: actionUrl, target: "_blank", rel: "noreferrer" }, selected.actionLabel || "打开服务商凭据页面") : null
            )
          : null,
        s.status === "loading" && !d ? el("div", { style: st.empty }, "正在查询余额…") : null,
        d && d.ok
          ? el("div", { style: st.hero },
              el("div", { style: st.heroLabel }, heroLabel),
              el("div", { style: st.heroValue }, symbol + " " + fmtBalance(d.totalBalance)),
              el("div", { style: st.heroCurrency }, heroStatus),
              d.isAvailable == null ? null : el("span", { style: d.isAvailable ? st.badgeHit : st.badgePeak }, d.isAvailable ? "可用" : "不可用")
            )
          : null,
        d && d.ok
          ? el("div", { style: st.cards },
              (d.details || []).map(function (item, idx) {
                return el(Card, { key: String(idx), label: item.label, value: symbol + " " + fmtBalance(item.value), hint: item.hint });
              }),
              d.generatedAt ? el(Card, { label: "账单更新时间", value: fmtTime(Date.parse(d.generatedAt)), hint: d.generatedAt }) : null,
              el(Card, { label: "查询时间", value: fmtTime(d.queriedAt), hint: "北京时间" })
            )
          : null,
        provider === "digitalocean"
          ? el("div", { style: Object.assign({}, st.infobox, { marginTop: 18 }) },
              el("div", { style: st.infoboxTitle }, "DigitalOcean Account API"),
              el("div", null, "请创建账户级 Personal Access Token。可选 Read Only（api:read，包含 billing:read），或自定义 billing:read；不要使用 Gradient AI 推理 Key。"),
              el("a", { style: st.actionLink, href: selected.actionUrl, target: "_blank", rel: "noreferrer" }, selected.actionLabel),
              el("div", { style: st.note, marginTop: 8 }, credential.status === "loading"
                ? "正在检查已保存的 Token…"
                : credential.configured
                  ? "已保存：" + (credential.masked || "••••••••••••") + (credential.source ? "（来源：" + credential.source + "）" : "")
                  : credential.status === "error"
                    ? "无法读取 Token 状态：" + (credential.error || "未知错误")
                    : "尚未保存 DIGITALOCEAN_TOKEN。"),
              el("div", { style: st.actions, marginTop: 8 },
                el("input", {
                  type: "password",
                  autoComplete: "new-password",
                  spellCheck: false,
                  style: st.input,
                  placeholder: credential.configured ? "输入新的 dop_v1_ Token 可替换（当前值已隐藏）" : "dop_v1_…",
                  value: digitalOceanToken,
                  disabled: saving.status === "saving" || (credential.configured && !credential.writable),
                  onChange: function (e) { setDigitalOceanToken(e.target.value); }
                }),
                el("button", {
                  style: saving.status === "saving" || (credential.configured && !credential.writable) ? st.btnDisabled : st.btnPrimary,
                  disabled: saving.status === "saving" || (credential.configured && !credential.writable),
                  onClick: saveDigitalOceanCredential
                }, saving.status === "saving" ? "保存中…" : "保存并查询")
              ),
              credential.configured && !credential.writable
                ? el("div", { style: st.note, marginTop: 6 }, "当前 Token 来自只读环境变量；请在原来源中修改，页面不会覆盖它。")
                : null,
              saving.status === "done" ? el("div", { style: st.note, marginTop: 6, color: "#2ecc71", opacity: 1 }, "Token 已安全保存；页面和 API 响应不会回传明文。") : null,
              saving.status === "error" ? el("div", { style: st.err, marginTop: 6 }, saving.error) : null
            )
          : null,
        d && d.ok && d.provider === "siliconflow"
          ? el("div", { style: Object.assign({}, st.infobox, { marginTop: 22 }) },
              el("div", { style: st.infoboxTitle }, "SiliconFlow 查询说明"),
              d.zeroBalance
                ? el("div", null,
                    el("div", null, "公开 API 已成功返回 ¥0.00。SiliconFlow 的 /v1/user/info 当前不返回代金券或历史用量；控制台可用总额可能非零。这里忠实展示 API 原始余额字段，不把它等同于控制台完整额度。"),
                    el("a", { style: st.actionLink, href: selected.actionUrl, target: "_blank", rel: "noreferrer" }, selected.actionLabel)
                  )
                : el("div", null, "余额卡片展示 SiliconFlow /v1/user/info 公开 API 返回的原始余额字段。"),
              el("div", { style: { marginTop: 12, fontWeight: 600 } }, "返回字段"),
              (d.fieldDefinitions || []).map(function (item) {
                return el("div", { key: item.name, style: { marginTop: 4 } }, item.name + "：" + item.meaning);
              })
            )
          : null,
        provider === "siliconflow"
          ? el("div", { style: Object.assign({}, st.infobox, { marginTop: 14 }) },
              el("div", { style: st.infoboxTitle }, "凭据读取规则"),
              el("div", null, "插件只检查“设置 → 模型”中 Provider ID 或显示名为 siliconflow 的提供商，并读取其 apiKeyEnv 对应的已保存 API Key。"),
              el("div", { style: st.note, marginTop: 6 }, "如果未找到提供商、未填写 API Key 或凭据引用失效，插件会停止查询并说明需要修复的配置；不会回退到其他服务商的 Key。")
            )
          : null,
        d && d.ok ? el("div", { style: st.note }, d.sourceNote + (credentialMeta.length ? " " + credentialMeta.join("；") + "。" : "")) : null,
        el("div", { style: st.note }, "DigitalOcean 查询的是主账户 Billing API；DigitalOcean AI 推理 Key 与 AMD GPU Cloud 推理 Key 均不能直接查询账单。")
      );
    }

    // ── plugin ──
    var inject = ["slots"];

    function apply(ctx) {
      var slots = ctx.get("slots");
      if (slots === undefined) return;
      var timer = ctx.get("timer");

      slots.inject("conversation.view", function () {
        return slots.register(
          { name: "conversation.view", id: "usage-cost-view", order: 20, label: "用量与消耗" },
          function () { return el("div", { style: st.tab }, el(UsagePanel, { timer: timer })); }
        );
      });

      slots.inject("conversation.view", function () {
        return slots.register(
          { name: "conversation.view", id: "balance-view", order: 30, label: "剩余余额查询" },
          function () { return el("div", { style: st.tab }, el(BalancePanel, null)); }
        );
      });

      slots.inject("settings.section", function () {
        return slots.register(
          { name: "settings.section", id: "usage-cost", order: 30, label: "用量与消耗" },
          function () { return el(UsagePanel, { timer: timer }); }
        );
      });

      slots.inject("settings.section", function () {
        return slots.register(
          { name: "settings.section", id: "balance", order: 31, label: "剩余余额查询" },
          function () { return el(BalancePanel, null); }
        );
      });
    }

    exports.inject = inject;
    exports.apply = apply;
    return module.exports;
  }
});