window.__ModuleLoader__.load({
  id: "@feiyang666/dsh-usage-plugin",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    var React = require("react");
    var el = React.createElement;
    // react-dom 是平台种子模块：用于把弹窗 Portal 到 document.body，
    // 避免对话树祖先的 transform/contain 破坏 position:fixed（弹窗不可见）。
    var ReactDOM = null;
    try { ReactDOM = require("react-dom"); } catch (e2) {}
    // 隐藏弹窗卡片滚动条外观（仍可滚轮滚动），并在小屏下贴近视口
    try {
      if (typeof document !== "undefined" && document.head && !document.getElementById("dsh-usage-tok-style")) {
        var __tokStyle = document.createElement("style");
        __tokStyle.id = "dsh-usage-tok-style";
        __tokStyle.textContent = "[data-dsh-usage-tok]{scrollbar-width:none;-ms-overflow-style:none}[data-dsh-usage-tok]::-webkit-scrollbar{width:0;height:0;display:none}";
        document.head.appendChild(__tokStyle);
      }
    } catch (e3) {}

    // ── i18n: zh keys → en dictionary (community addition) ──
    var __T_EN = {"本期无消耗（所有用量为 0）":"No usage this turn (all zeros)","按模型":"By model","…及另外 ":"…plus "," 个模型（完整列表见「用量与消耗」页签）":" more models (full list in the Usage & Cost tab)","对话累计":"Conversation total","本轮明细":"This turn","本轮 token":"Turn tokens","本轮消耗":"Turn cost","本轮缓存命中率":"Turn hit rate","本轮耗时":"Turn duration","本轮无记录":"No records this turn","工具调用（内部）":"Tool calls (internal)"," 条内部调用":" internal calls","展开":"Expand","收起":"Collapse","详细记录请在「用量与消耗」页签查看":"Full details are in the Usage & Cost tab","获取中…":"Loading…","总 token":"Total tokens","Token 明细":"Token details","本次输出":"This output","总消耗":"Total cost","耗时":"Run time","缓存命中率":"Cache hit rate","关闭":"Close","V4.1 调价":"V4.1 price change"," 2026-09-10 12:00（北京时间）起 deepseek-flash 按新版峰谷价计费（deepseek-v4-pro 不变）":" from 2026-09-10 12:00 Beijing time deepseek-flash uses the new peak/off-peak prices (deepseek-v4-pro unchanged)","官方来源与价格依据":"Official sources & price references","价格由 DeepSeek 官方公布，本插件只做本地计算、不修改也不代理官方价格；点下面的链接可直接核对官方原文。":"Prices are published by DeepSeek; this plugin only computes locally and neither changes nor proxies official pricing. Use the links below to verify against the official source.","DeepSeek 官方价格页（模型与价格、峰谷时段定义）":"DeepSeek official pricing page (models, prices, peak/off-peak hours)","DeepSeek V4.1 Flash 发布公告":"DeepSeek V4.1 Flash announcement","DeepSeek 开放平台用量页（官方账单，用于对账）":"DeepSeek platform usage page (official billing, for reconciliation)","DeepSeek 官方 API 文档":"DeepSeek official API documentation","DeepSeek Harness 官方仓库":"DeepSeek Harness official repository","为什么显示这个价格？":"Why is this the price shown?","① 官方价格表按生效时间分段：2026-08-17 00:00 起为第一版峰谷价；2026-09-10 12:00（北京时间）起为 DeepSeek V4.1 Flash 调价后的新版（deepseek-flash 单价下调，deepseek-v4-pro 不变）。每次调用按其发生时刻对应的版本计费，历史金额不会因后续调价而改变。":"① The official price table is split by effective date: the first peak/off-peak version applies from 2026-08-17 00:00, and the post-V4.1-Flash version from 2026-09-10 12:00 Beijing time (deepseek-flash prices are lowered; deepseek-v4-pro is unchanged). Every call is billed with the version in force at its own time, so past amounts never change when prices are adjusted later.","② 模型档位按官方新命名归并：旧名 deepseek-v4-flash、deepseek-v4-flash-vision-exp 仍可调用（官方已路由到 DeepSeek-V4.1-Flash 并按 Flash 单价计费），计费时与 deepseek-flash 合并为同一档位。":"② Model tiers follow the new official naming: the legacy ids deepseek-v4-flash and deepseek-v4-flash-vision-exp stay callable (DeepSeek routes them to DeepSeek-V4.1-Flash and bills them at the Flash price) and are merged into the same deepseek-flash tier for billing.","③ 峰谷规则：工作日 9:00–12:00、14:00–18:00（北京时间）为高峰，其余时间（含周末全天）为空闲；空闲价 = 高峰价的一半。":"③ Peak/off-peak rule: weekdays 9:00–12:00 and 14:00–18:00 Beijing time are peak; all other times (including the whole weekend) are off-peak; the off-peak price is half the peak price.","④ 只有能与记录中 provider / model 可靠匹配的价格才参与计费，其余按 ¥0 统计（避免用相近模型的价格误算）。":"④ Only prices that reliably match the recorded provider / model are billed; everything else counts as ¥0, so a similar model name never causes a wrong estimate.","⑤ 本插件按官方公布价格在本地计算，结果仅供参考，最终以 DeepSeek 官方账单为准；产品价格可能变动，请以官方价格页为准。":"⑤ This plugin computes locally from published prices; the result is for reference only and the official DeepSeek bill prevails. Prices may change, so always check the official pricing page.","建议：若新模型（如 deepseek-flash）的消耗显示为 ¥0，通常是本插件版本过旧——请升级到 1.17.0 或更高版本。":"Tip: if a new model (such as deepseek-flash) shows ¥0 cost, this plugin is usually out of date — please upgrade to 1.17.0 or later.","DeepSeek V4.1 Flash 调价将于 ":"The DeepSeek V4.1 Flash price change takes effect on ","（北京时间）生效：deepseek-flash 改用新版峰谷价（空闲 缓存命中 0.02 / 输入 1 / 输出 4 元，高峰为其两倍），deepseek-v4-pro 价格不变。":" (Beijing time): deepseek-flash switches to the new peak/off-peak prices (off-peak cache hit 0.02 / input 1 / output 4 CNY; peak is twice that), while deepseek-v4-pro stays unchanged.","DeepSeek V4.1 Flash 调价已生效（自 ":"The DeepSeek V4.1 Flash price change is in effect (since "," 起）：deepseek-flash 按新版峰谷价计费，deepseek-v4-pro 价格不变。":"): deepseek-flash is billed at the new peak/off-peak prices; deepseek-v4-pro is unchanged.","峰谷价表按生效时间分段：2026-08-17 00:00 起为第一版峰谷价；2026-09-10 12:00 起为 DeepSeek V4.1 Flash 调价后的新版（deepseek-flash 空闲价下调为 缓存命中 0.02 / 输入 1 / 输出 4 元，高峰为其两倍；deepseek-v4-pro 价格不变）。上方「峰谷价」展示的是当前生效的一版，历史调用始终按其发生时刻对应的版本计费。":"The peak/off-peak tables are split by effective date: the first version applies from 2026-08-17 00:00, and the post-V4.1-Flash version applies from 2026-09-10 12:00 (deepseek-flash off-peak prices are lowered to cache hit 0.02 / input 1 / output 4 CNY, with peak at twice that; deepseek-v4-pro is unchanged). The Peak/Off-peak tab shows the currently effective version; past calls are always billed with the version in force at their own time.","旧模型名 deepseek-v4-flash 与 deepseek-v4-flash-vision-exp 仍可调用（官方已将其路由到 DeepSeek-V4.1-Flash、按 Flash 单价计费），在本价格表中与 deepseek-flash 合并为同一档位。":"The legacy model ids deepseek-v4-flash and deepseek-v4-flash-vision-exp remain callable (they are routed to DeepSeek-V4.1-Flash and billed at the Flash price) and are merged into the deepseek-flash row in this table.","无 Token 数据":"No token data","当前 · ":"Current · ","工作日高峰时段":"Weekday peak hours","工作日空闲时段":"Weekday off-peak hours","周末高峰时段":"Weekend peak hours","周末空闲时段":"Weekend off-peak hours","周一至周五 9:00–12:00、14:00–18:00":"Mon–Fri 9:00–12:00 & 14:00–18:00","工作日其余时间":"Other weekday hours","周末（周六、周日）全天按空闲价计费":"All weekend (Sat & Sun) billed at the off-peak rate","2026-08-23 前仍按原规则分峰谷":"Before 2026-08-23 the old peak/valley split still applies","高峰 / 空闲时段说明":"Peak / off-peak hours","工作日高峰":"Weekday peak","空闲时段":"Off-peak hours"," 周一至周五 9:00–12:00、14:00–18:00":" Mon–Fri 9:00–12:00 & 14:00–18:00"," 工作日其余时间，以及周末（周六、周日）全天（自 2026-08-23 起；此前仍按原规则分峰谷）":" Weekday off-peak hours, plus all weekend (Sat & Sun) since 2026-08-23 (before that, the old peak/valley split still applies)","工作日高峰 9:00–12:00、14:00–18:00 · 周末全天空闲价":"Weekday peak 9:00–12:00 & 14:00–18:00 · all-weekend off-peak rate","\n调用 ":"\ncalls ","）\n输入·未命中 ":")\ninput·miss ","\n高峰消耗 ":"\npeak cost ","\n无记录":"\nno records","自动模式：按调用时间自动选择计费档位——新价格表生效前的调用按基础价（旧价格表），生效后的调用按峰谷价（工作日高峰时段 9:00–12:00、14:00–18:00 用高峰价，其余时间——含周末全天——用空闲价）。当前显示：":"Auto mode: the billing tier is chosen automatically by call time — calls made before the new price schedule took effect are billed at base (old) prices; calls after it use peak/valley prices (weekday peak hours 9:00–12:00 & 14:00–18:00 at the peak price, all other times — including all weekend — at the off-peak price). Currently shown:","单位：元 / 百万 tokens。工作日高峰时段（北京时间 9:00–12:00、14:00–18:00）用高峰价，其余时间用空闲价（空闲价 = 高峰价的一半）；自 2026-08-23 起周末（周六、周日）全天按空闲价计费，新规则生效前仍按原规则。概览、用量日历、缓存命中列表中的消耗均已按高峰 / 空闲分列统计。":"Unit: CNY per million tokens. Weekday peak hours (Beijing time 9:00–12:00 & 14:00–18:00) use the peak price; all other times use the off-peak price (off-peak = half of peak). Since 2026-08-23, weekends (Sat & Sun) are billed at the off-peak rate all day; calls before the new rule still follow the old split. Costs in Overview, Usage Calendar and the Cache Hit List are split into peak / off-peak accordingly.","未知模型":"Unknown model","未知服务商":"Unknown provider","完成":"Done","工具调用":"Tool call","超长":"Overlong","错误":"Error","已中断":"Interrupted","超时":"Timeout","中断":"Interrupted"," · 中断 ":" · interrupted ","（未计费）":" (not billed)","本地统计与官方后台的差异":"Local stats vs official console","本面板统计的是插件在本地捕获的模型调用（按官方价格与峰谷时段计费）。与官方后台（platform.deepseek.com 用量页）相比，金额可能更低，常见原因：":"This panel shows calls captured locally by the plugin (billed at official prices with peak/off-peak rates). Compared with the official console (platform.deepseek.com usage page), the amount may be lower — common reasons:","① 中断/出错/超时的调用：官方仍按实际 token 计费，插件无法获取其用量，按 0 记录（明细中标「中断」）；":"① Interrupted/failed/timed-out calls: the console still bills their actual tokens, but the plugin cannot obtain their usage, so they are recorded as 0 (marked \"Interrupted\" in details);","② 账号下其他 API Key（如其它应用/脚本）的调用不经过 DeepSeek Harness，官方统计包含它们，本插件不包含；":"② Calls from other API keys on your account (e.g. other apps/scripts) do not pass through DeepSeek Harness — the console includes them, this plugin does not;","③ 如需精确对账，可在官方用量页导出月度账单 CSV 与本插件对比。":"③ For exact reconciliation, export the monthly billing CSV from the official usage page and compare it with this plugin.","当前记录中有 ":"Current records include "," 次中断调用（未计费）——对应官方后台已计费的部分。":" interrupted call(s) (not billed) — corresponding to the part already billed by the official console.","范围内调用":"Calls in range","范围内消耗":"Cost in range","该范围内暂无记录。":"No records in this range.","自动（生效前基础价 · 生效后峰谷价）":"Auto (base price before effective date · peak/valley after)","基础价格":"Base price","峰谷价格":"Peak/valley price","自动":"Auto","canvas 2d 不可用":"canvas 2D unavailable","用量与消耗报告":"Usage & Cost Report","生成时间 ":"Generated ","（北京） · 共 ":" (Beijing) · total "," 条调用 · 缓存命中率 ":" calls · cache-hit rate "," · 高峰价消耗 ":" · peak-rate cost "," · 空闲价消耗 ":" · off-peak cost "," · 合计 ":" · total "," · 报告仅含最近 ":" · report limited to the latest "," 条":" records","调用次数":"Calls","输入 · 未命中":"Input · miss","输入 · 缓存命中":"Input · cache hit","输出":"Output","高峰消耗":"Peak cost","空闲消耗":"Off-peak cost","总消耗 (峰谷价)":"Total cost (peak/valley)","缓存命中列表（共 ":"Cache hit list ("," 条）":" records)","时间(北京)":"Time (Beijing)","模型":"Model","输入·未命中":"Input·miss","缓存命中":"Cache hit","缓存写入":"Cache write","推理":"Reasoning","命中率":"Hit rate","时段":"Period","结束":"End","消耗(峰谷)":"Cost (peak/valley)","峰":"Peak","谷":"Valley","消耗表（按模型 · 峰谷价 · 高峰/空闲分列）":"Cost table (by model · peak/valley prices)","调用":"Calls","总消耗":"Total cost","合计":"Total","消耗表（按 API 服务商 × 模型 · 峰谷价）":"Cost table (by API provider × model · peak/valley)","API 服务商 / 模型":"API provider / model"," 个模型）":" models)","总费用合计":"Total cost overall","计价按请求的 API 服务商分别应用已核验价格；DigitalOcean 美元价按 USD/CNY 汇率折算；无法可靠映射的第三方价格按 ¥0。":"Billing applies verified prices per requesting API provider; DigitalOcean USD prices are converted at the USD/CNY rate; third-party prices that cannot be mapped reliably are counted as ¥0."," 个服务商":" providers","今天":"Today","近7天":"Last 7 days","近30天":"Last 30 days","全部":"All","自定义区间：":"Custom range:","至":"to","清除筛选":"Clear filters","当前范围：共 ":"Current range: ","（全部记录）":"(all records)"," · 总消耗 ":" · total cost ","高峰 ":"Peak "," · 空闲 ":" · off-peak ","命中率 ":"hit rate ","高峰时段 9:00–12:00、14:00–18:00":"Peak hours 9:00–12:00 & 14:00–18:00","其余空闲时段":"other hours are off-peak","高峰 + 空闲 · ":"Peak + off-peak · ","消耗表（按模型）":"Cost table (by model)","API 服务商":"API provider","高峰/空闲":"Peak/Off-peak","消耗明细（按 API 服务商 × 模型）":"Cost breakdown (by API provider × model)","DeepSeek 官方请求按官方峰谷价；SiliconFlow 按自身人民币公开价；DigitalOcean 按美元公开价 × USD/CNY 汇率折算人民币；千问暂不计费；AMD GPU Cloud DeepSeek V4 Flash 免费按 ¥0。模型名与 API 服务商均以请求参数为准。":"DeepSeek official requests use official peak/valley prices; SiliconFlow uses its own public CNY prices; DigitalOcean uses public USD prices converted to CNY at the USD/CNY rate; Qwen is not billed yet; AMD GPU Cloud DeepSeek V4 Flash is free at ¥0. Model names and API providers follow the actual request parameters."," 次（高峰 ":" calls (peak "," / 空闲 ":" / off-peak "," · 缓存命中 ":" · cache hit "," · 输出 ":" · output "," · 推理 ":" · reasoning "," · 空闲消耗 ":" · off-peak cost ","‹ 上月":"‹ Prev month","下月 ›":"Next month ›","按消耗":"By cost","按调用数":"By calls","热力：":"Heatmap: ","低 → 高（":"low → high (","当日消耗":"Day cost","当日调用数":"Day calls","· 悬停查看详情，点击某天查看当日调用":"· hover for details, click a day for that day's calls","本月调用":"Calls this month","本月消耗":"Cost this month","本月暂无记录。":"No records this month.","日期":"Date","总消耗(自动)":"Total cost (auto)"," 调用明细":" call details"," 条 · ":" records · ","　｜　空闲 ":"　|　off-peak ","　｜　合计 ":"　|　total ","该日无记录。":"No records for this day.","消耗":"Cost","清除区间":"Clear range"," 条 · 输入·未命中 ":" records · input·miss "," · 缓存写入 ":" · cache write "," · 高峰消耗 ":" · peak cost ","该时间范围内没有记录。":"No records in this range.","‹ 上一页":"‹ Prev page","第 ":"Page "," 页 · 每页 ":" page · per page "," 条 · 共 ":" records · total ","下一页 ›":"Next page ›","新价格表生效时间未知":"New price schedule effective date unknown","新价格表（峰谷价）将于 ":"The new peak/valley price schedule takes effect ","（北京时间）生效，当前按旧价格表（基础价）计费":" (Beijing time); currently billing on the old base-price schedule","新价格表（峰谷价）已生效（自 ":"New peak/valley schedule in effect (since "," 起）":")","今日 $ / ¥ 汇率":"Today's $/¥ rate","暂不可用":"Temporarily unavailable","汇率日期 ":"Rate date ","等待获取":"Pending fetch","汇率状态":"Rate status","缓存汇率":"Cached rate","最新可用":"Latest available","获取失败":"Fetch failed","刷新汇率":"Refresh rate","美元计价的 DigitalOcean 消耗按该 USD/CNY 汇率换算成人民币；人民币定价不受汇率影响。":"USD-denominated DigitalOcean costs are converted to CNY at this rate; CNY pricing is unaffected by it.","DeepSeek 官方 API 价格表":"DeepSeek Official API Price Table","本表仅用于 DeepSeek 官方 Provider；第三方 Provider 按下方已核验的自身价格计费，无法可靠匹配价格的模型按 0 统计。价格按官方公布固定，不可编辑。":"This table applies only to the official DeepSeek provider; third-party providers bill at their own verified prices below, and models without a reliable price match are counted as 0. Prices are fixed as officially published and are not editable.","峰谷价":"Peak/valley","基础价":"Base","自动模式：按调用时间自动选择计费档位——新价格表生效前的调用按基础价（旧价格表），生效后的调用按峰谷价（高峰时段 9:00–12:00、14:00–18:00 用高峰价，其余空闲时段用空闲价）。当前显示：":"Auto mode: the billing tier is chosen automatically by call time — calls made before the new schedule took effect use base (old) prices, calls after it use peak/valley prices (peak hours 9:00–12:00 & 14:00–18:00 at peak price, other hours at off-peak). Currently shown:","基础价表（旧价格表，新价格生效前）":"Base price table (old schedule, before new prices take effect)","峰谷价表（新价格表）":"Peak/valley table (new schedule)","。价格按官方公布固定，不可编辑。":". Prices are fixed as officially published and are not editable.","缓存命中（输入）":"Cache hit (input)","空闲 · 缓存命中":"Off-peak · cache hit","空闲 · 输入":"Off-peak · input","空闲 · 输出":"Off-peak · output","高峰 · 缓存命中":"Peak · cache hit","高峰 · 输入":"Peak · input","高峰 · 输出":"Peak · output","单位：元 / 百万 tokens。高峰时段（北京时间 9:00–12:00、14:00–18:00）用高峰价，其余空闲时段用空闲价（空闲价 = 高峰价的一半）。概览、用量日历、缓存命中列表中的消耗均已按高峰 / 空闲分列统计。":"Unit: CNY per million tokens. Peak hours (Beijing 9:00–12:00 & 14:00–18:00) use peak prices; other hours use off-peak (= half of peak). Costs in Overview, Usage Calendar and Cache Hit List are split into peak / off-peak accordingly.","第三方平台价格与覆盖状态（2026-08-19 核验）":"Third-party platform prices & coverage (verified 2026-08-19)","只把能与记录中的 provider/model 可靠匹配的价格用于自动计费；美元价格先按 USD 计算，再乘 USD/CNY 汇率统一折算成人民币。":"Only prices that reliably match a record's provider/model are used for automatic billing; USD prices are computed in USD first, then converted to CNY at the USD/CNY rate.","模型 / 状态":"Model / status","输入":"Input","说明":"Notes","已用于自动计费":"Used for auto billing","缓存命中价按 2026-08-03 起生效公告":"Cache-hit price per the notice effective 2026-08-03","按输入价":"Billed at input price","公告未单列缓存命中价":"The notice lists no separate cache-hit price","自动按 USD/CNY 汇率换算人民币并计费":"Auto-converted to CNY at the USD/CNY rate and billed","Alibaba / 千问":"Alibaba / Qwen","暂不计费":"Not billed yet","调用与 token 正常统计；费用暂按 ¥0":"Calls and tokens tracked normally; cost counted as ¥0 for now","免费；费用固定按 ¥0":"Free; cost fixed at ¥0","DigitalOcean 使用美元官方价并按最新可用 USD/CNY 汇率折算人民币；千问暂不计费；AMD GPU Cloud 的 DeepSeek V4 Flash 免费按 ¥0。":"DigitalOcean bills at official USD prices converted via the latest available USD/CNY rate; Qwen is not billed yet; AMD GPU Cloud DeepSeek V4 Flash is free at ¥0.","概览":"Overview","用量日历":"Usage Calendar","缓存命中列表":"Cache Hit List","价格表":"Price Table","已导出：":"Exported: ","导出失败：":"Export failed: ","未知错误":"unknown error","导出中…":"Exporting…","生成图片中…":"Rendering image…","画布不可用":"Canvas unavailable","生成图片失败：":"Image rendering failed: ","打开目录选择…":"Open directory picker…","导出目标：":"Export destination:","选择目录失败：":"Failed to pick directory: ","打开文件夹失败：":"Failed to open folder: ","读取文件…":"Reading file…","导入成功：新增 ":"Import OK: added "," 条，跳过重复 ":", skipped duplicates "," 条，忽略无效 ":", ignored invalid "," 条，现有共 ":", total now ","导入失败：":"Import failed: ","读取文件失败":"Failed to read file","用量与消耗":"Usage & Cost","记录插件激活后的每一次模型调用":"Logs every model call since the plugin was activated","当前 · 高峰时段":"Current · peak hours","当前 · 空闲时段":"Current · off-peak hours","新价格已生效":"New prices in effect","新价格未生效":"New prices not yet in effect","刷新":"Refresh","清空":"Clear","计价说明：DeepSeek 官方与 SiliconFlow 按人民币价格；DigitalOcean 按美元官方价 × USD/CNY 汇率折算人民币；千问暂不计费；AMD GPU Cloud DeepSeek V4 Flash 免费按 ¥0。":"Billing notes: DeepSeek official and SiliconFlow bill in CNY; DigitalOcean bills at official USD prices × USD/CNY rate; Qwen is not billed yet; AMD GPU Cloud DeepSeek V4 Flash is free at ¥0.","导出 CSV":"Export CSV","导出 JSON":"Export JSON","导出图片 (PNG)":"Export image (PNG)","打开目录":"Open folder","导出目标目录（留空 = 默认数据目录）":"Export target directory (empty = default data dir)","选择目录…":"Choose directory…","已恢复默认数据目录":"Restored default data directory","重置":"Reset","选择文件导入":"Choose a file to import","数据持久化：":"Data persistence:","（每次调用实时落盘，插件重启后自动恢复，最多保留 100000 条）":"(every call is written to disk live, restored automatically after restart, up to 100000 records)","持久化未启用：":"Persistence disabled:","未知原因":"unknown reason","DEEPSEEK_API_KEY（推理 Key）":"DEEPSEEK_API_KEY (inference key)","模型设置中 Provider ID 或显示名为 siliconflow 的提供商 API Key":"API key of the provider whose Provider ID or display name is siliconflow in model settings","打开 SiliconFlow API 密钥":"Open SiliconFlow API keys","账户级 dop_v1_ Personal Access Token；Read Only（api:read）或 billing:read":"Account-level dop_v1_ Personal Access Token; Read Only (api:read) or billing:read","创建 DigitalOcean Account API Token":"Create a DigitalOcean account API token","暂无公开余额 API，仅支持控制台查看":"No public balance API yet — console only","打开 AMD Developer Cloud":"Open AMD Developer Cloud","查询失败":"Query failed","无法读取凭据状态":"Cannot read credential status","请输入以 dop_v1_ 开头的 DigitalOcean 账户 PAT。":"Enter a DigitalOcean account PAT starting with dop_v1_.","保存失败":"Save failed","使用凭据 ":"Using credential ","来源 ":"source ","模型提供商 ":"Model provider ","端点 ":"Endpoint "," · 账户余额":" · account balance","USD · 预付款/信用余额":"USD · prepaid/credit balance","USD · 待结算金额":"USD · pending amount","USD · 当前无余额":"USD · no balance"," · 账户可用":" · account available"," · 账户不可用":" · account unavailable"," · 查询成功":" · query succeeded","剩余余额查询":"Remaining balance query","查询 DeepSeek、SiliconFlow 与 DigitalOcean 账户余额":"Query DeepSeek, SiliconFlow and DigitalOcean account balances","打开控制台":"Open console","查询中…":"Querying…","查询账单":"Query billing","查询余额":"Query balance","所需凭据：":"Required credentials:","仅支持控制台查看":"Console only","插件不会尝试未经公开文档确认的端点，也不会把 AMD 推理 Key 当作账单凭据。":"The plugin never probes endpoints unconfirmed by public docs, and never uses AMD inference keys as billing credentials.","请确认凭据类型正确、权限包含余额/账单读取，且网络可访问服务商官方 API。":"Please verify the credential type is correct, its permissions include balance/billing read, and the provider's official API is reachable from this network.","打开服务商凭据页面":"Open provider credentials page","正在查询余额…":"Querying balance…","可用":"Available","不可用":"Unavailable","账单更新时间":"Billing updated","查询时间":"Queried at","北京时间":"Beijing time","请创建账户级 Personal Access Token。可选 Read Only（api:read，包含 billing:read），或自定义 billing:read；不要使用 Gradient AI 推理 Key。":"Please create an account-level Personal Access Token. Choose Read Only (api:read incl. billing:read) or a custom scope with billing:read; do not use a Gradient AI inference key.","正在检查已保存的 Token…":"Checking saved token…","已保存：":"Saved: ","（来源：":" (source: ","无法读取 Token 状态：":"Cannot read token status: ","尚未保存 DIGITALOCEAN_TOKEN。":"DIGITALOCEAN_TOKEN is not saved yet.","输入新的 dop_v1_ Token 可替换（当前值已隐藏）":"Enter a new dop_v1_ token to replace it (current value hidden)","保存中…":"Saving…","保存并查询":"Save & query","当前 Token 来自只读环境变量；请在原来源中修改，页面不会覆盖它。":"The current token comes from a read-only environment variable; edit it at its source — this panel will not overwrite it.","Token 已安全保存；页面和 API 响应不会回传明文。":"Token stored securely; neither the page nor API responses echo it back.","SiliconFlow 查询说明":"SiliconFlow query notes","公开 API 已成功返回 ¥0.00。SiliconFlow 的 /v1/user/info 当前不返回代金券或历史用量；控制台可用总额可能非零。这里忠实展示 API 原始余额字段，不把它等同于控制台完整额度。":"The public API returned ¥0.00 successfully. SiliconFlow's /v1/user/info currently returns no vouchers or historical usage; the console total may still be non-zero. The raw balance field from the API is shown faithfully here and should not be read as the full console credit.","余额卡片展示 SiliconFlow /v1/user/info 公开 API 返回的原始余额字段。":"The balance card shows the raw balance field returned by SiliconFlow's public /v1/user/info API.","返回字段":"Returned fields","凭据读取规则":"Credential lookup rules","插件只检查“设置 → 模型”中 Provider ID 或显示名为 siliconflow 的提供商，并读取其 apiKeyEnv 对应的已保存 API Key。":"The plugin only checks providers in Settings → Models whose Provider ID or display name is siliconflow, and reads the saved API key referenced by their apiKeyEnv.","如果未找到提供商、未填写 API Key 或凭据引用失效，插件会停止查询并说明需要修复的配置；不会回退到其他服务商的 Key。":"If no such provider exists, the key is empty, or the credential reference is broken, the plugin stops querying and explains what needs fixing; it never falls back to another provider's key.","DigitalOcean 查询的是主账户 Billing API；DigitalOcean AI 推理 Key 与 AMD GPU Cloud 推理 Key 均不能直接查询账单。":"DigitalOcean queries the main account Billing API; DigitalOcean AI inference keys and AMD GPU Cloud inference keys cannot query billing directly.","\n调用 ":"\ncalls ","）\n输入·未命中 ":")\ninput·miss ","\n高峰消耗 ":"\npeak cost ","\n无记录":"\nno records","查询 DeepSeek、SiliconFlow、DigitalOcean 与百炼 Token Plan":"Query DeepSeek, SiliconFlow, DigitalOcean & Bailian Token Plan balances","百炼 Token Plan · 1 周配额":"Bailian Token Plan · 1-week quota","百炼 Token Plan 配额用量":"Bailian Token Plan quota usage","百炼 Token Plan":"Bailian Token Plan","本周配额":"This week's quota","开始":"Start","结束":"End","已用 ":"Used ","百炼 Token Plan 查询说明":"Bailian Token Plan query notes","本查询复用百炼 CLI（bl）的“控制台登录”OAuth token，不需要阿里云 AccessKey，权限面很小。":"This query reuses the console-login OAuth token from the Bailian CLI (bl); no Alibaba Cloud AccessKey is needed and the permission scope is minimal.","如尚未登录，请先在终端执行：bl auth login --console，然后回到本页点“查询余额”。":"If you haven't logged in yet, run: bl auth login --console, then come back and click 'Query balance'.","打开百炼 CLI 登录说明":"Open Bailian CLI login docs","百炼控制台 OAuth 登录（~/.bailian/config.json 的 access_token，用 bl auth login --console 生成）":"Bailian console OAuth login (access_token in ~/.bailian/config.json, created by bl auth login --console)","数据来自阿里云百炼控制台内部门户网关（zeldaHttp.apikeyMgr./tokenplan/personal/api/v2/usage），展示的是 1 周配额已用进度与周期。":"Data from Alibaba Cloud Bailian console portal gateway (zeldaHttp.apikeyMgr./tokenplan/personal/api/v2/usage), showing 1-week quota usage progress and period.","帮助与说明":"Help & info","本月已消耗":"Spent this month","剩余 ":"left ","超支 ":"over budget by ","月度预算":"Monthly budget","当前预算：":"Current budget: ","设置每月消费上限，概览页会显示进度与超支预警。":"Set a monthly spending cap; the overview shows progress and an over-budget warning.","；概览页会按当月消耗显示进度与超支预警。":"; the overview shows monthly progress and over-budget warnings.","预算金额（元）":"Budget amount (CNY)","保存预算":"Save budget","清除预算":"Clear budget","请输入预算金额":"Please enter a budget amount","预算金额必须是非负数字":"Budget must be a non-negative number","消耗趋势（近 30 天）":"Cost trend (last 30 days)","模型消耗占比":"Model cost share","会话消耗排行":"Top conversations by cost","按模型 / 服务商 / 会话搜索…":"Search by model / provider / session…","没有符合条件的记录。":"No records match the current filters.","暂无数据":"No data","清除":"Clear","总消耗 ":"Total cost ","调用 ":"calls ","空闲 ":"off-peak "," 次":" calls","较上月":"vs last month","日均 ":"daily avg ","峰值日 ":"peak day ","天":"d","收起帮助":"Collapse help","模型消耗明细":"Model cost breakdown","按模型分组":"Grouped by model"," 个模型":" models","服务商×模型明细":"Provider × model breakdown","展开每个服务商下的模型分布":"Each provider's model breakdown","每个模型的调用次数、token 用量（输入·未命中 / 缓存命中 / 输出 / 推理）与高峰/空闲分列的消耗。合计行高亮汇总所有模型的总量。":"Per-model call count, token usage (input miss / cache hit / output / reasoning) and peak/off-peak costs. The highlighted total row sums everything above.","先按服务商（DeepSeek 官方 / SiliconFlow / DigitalOcean …）分组，组内按消耗降序列出该服务商下的每个模型及对应消耗。":"Grouped by provider (DeepSeek official / SiliconFlow / DigitalOcean …); within each group, models are listed by cost.","统计口径：web_search 搜索后端未纳入精确统计":"Scope: web_search backend calls are not precisely metered","DeepSeek 搜索后端调用由 Harness 用原生请求直连官方接口，响应用量未持久化到会话日志，插件无法取到实际 token。此处只记录次数，并按请求体给出输入侧下限估算：共 ":"DeepSeek search-backend calls go straight to the official endpoint via a native request inside the Harness, and the response usage is never persisted to the session log, so the plugin cannot obtain the real token counts. Only the call count is recorded here, together with a lower-bound estimate of the input side derived from the request body: "," 次，估算消耗 ≥ ":" calls, estimated cost ≥ ","。搜索在服务端注入检索结果并可能多轮生成，输入与输出都会高于此值，官方账单必然更高。":". Search results are injected server-side and generation may run multiple rounds, so both input and output exceed this bound — the official bill will always be higher.","该部分为估算下限，请以 DeepSeek 官方后台账单为准。":"This part is a lower-bound estimate; always refer to your DeepSeek console bill.","历史价格提示":"Historical pricing notice","有 ":"There are "," 条记录没有冻结单价（旧版本写入或手工导入），它们的费用按当前价格表计算，改动价格表后会跟着变化；新记录已冻结写入时生效的单价，不受后续改价影响。":" record(s) have no frozen unit price (written by an older version or imported by hand); their cost is computed with the current price table and will change when you edit prices. New records freeze the prices in effect at write time and are unaffected by later edits.","历史价格与重算":"Historical pricing & repricing"," 条记录没有冻结单价（旧版本写入或手工导入），其费用按当前价格表计算，改动价格后会跟着变化。":" record(s) have no frozen unit price (written by an older version or imported by hand); their cost uses the current price table and follows later price edits.","所有记录都已冻结写入时生效的单价：改动价格表只影响之后产生的记录，历史费用不会被改写。":"Every record has frozen the prices in effect when it was written: editing the price table only affects future records, past costs are never rewritten.","用当前价格表重算全部历史":"Reprice all history with the current table","已提交，正在用当前价格表重算全部历史…":"Submitted — repricing all history with the current table…","当前宿主不支持重算":"This host does not support repricing"};

    function __detectLang() {
      // 语言完全跟随宿主设置（通用设置 → 语言）：不再读 localStorage，避免旧选择覆盖系统语言
      try { var nav = (typeof navigator !== "undefined" && navigator.language) || "en"; return nav.toLowerCase().indexOf("zh") === 0 ? "zh" : "en"; } catch (e2) { return "en"; }
    }
    var __LANG = __detectLang();
    var t = function (s) { if (__LANG !== "en") return s; return __T_EN[s] || s; };
    // 1.19.0 新增文案（DeepSeek 多币种余额、百炼按量付费）。合并进主表而不是去改
    // 上面那一整行巨型 JSON，改动即可在 diff 里逐条看到。
    Object.assign(__T_EN, {
      " · 总计": " · total",
      "充值 ": "Top-up ",
      " · 赠送 ": " · granted ",
      "查询 DeepSeek、SiliconFlow、DigitalOcean、百炼 Token Plan 与百炼按量付费": "Query DeepSeek, SiliconFlow, DigitalOcean, Bailian Token Plan and Bailian pay-as-you-go",
      "百炼按量付费余额需在阿里云费用中心查看；百炼模型 API Key 无法查询按量付费余额": "Pay-as-you-go balance lives in the Alibaba Cloud billing console; Bailian model API keys cannot query it",
      "插件不会尝试未经公开文档确认的端点，也不会把推理 Key 当作账单凭据。": "The plugin does not probe endpoints that are not publicly documented, and never treats an inference key as a billing credential.",
      "价格来源与快照": "Price source & snapshots",
      "官方价目页核对日期：": "Official pricing page checked on: ",
      "新增 Search / Fetch 按次计费 ¥5 / 1000 次成功请求：本插件拿不到该调用次数，未计入费用。": "New per-request billing for Search / Fetch (¥5 per 1,000 successful requests): the plugin cannot see that call count, so it is not included in the cost.",
      "法定节假日已纳入峰谷判定（自 ": "Legal holidays are now part of the peak/off-peak rule (effective from ",
      " 起生效）。": ").",
      "历史价格记录（": "Price snapshots (",
      " 条）": ")",
      "核对官方价格页": "Verify on the official pricing page",
      "暂无历史快照；首次改价后会自动记录。": "No snapshots yet; one is recorded automatically the first time prices change.",
      "当前运行的插件版本": "Currently running plugin version",
      "插件版本 ": "Plugin version ",
      " · 数据目录 ": " · Data directory ",
      // 1.21.0 UI 瘦身新增的文案
      "口径与版本": "Scope & version",
      "收起说明": "Hide details",
      "导出与数据": "Export & data",
      "收起数据": "Hide data",
      " 次中断": " interrupted",
      "统计口径提示": "Metering notice",
      " 次估算": " estimated",
      " 条无冻结单价": " without frozen unit price",
      "金额以 DeepSeek 官方后台账单为准": "Amounts follow the official DeepSeek billing console",
      "未命中 ": "Miss ",
      " 个服务商": " providers",
      "消耗明细": "Cost breakdown",
      "按服务商": "By provider",
      "用量": "Usage",
      "日历": "Calendar",
      "明细": "Details",
      "设置": "Settings",
      "缓存命中明细": "Cache-hit details",
      "价格口径与第三方价格": "Pricing rules & third-party prices",
      "计价规则与官方价格依据见「价格表」页；费用以 DeepSeek 官方后台账单为准。": "Pricing rules and official references live on the Price table tab; amounts follow the official DeepSeek billing console.",
      " · flash 空闲价 ": " · flash off-peak "
    });
    // host sends semantic keys for balance presentation text; both locales live client-side
    var __BAL_ZH = {
      "hint.deepseek": "DEEPSEEK_API_KEY（推理 Key）",
      "hint.siliconflow": "模型设置中名为 siliconflow 的提供商所引用的 API Key",
      "hint.digitalocean": "DIGITALOCEAN_TOKEN（账户级 Personal Access Token，不是 DO AI 推理 Key）",
      "hint.amd": "AMD GPU Cloud 当前未公开余额查询端点",
      "hint.bailianPayg": "百炼按量付费余额需在阿里云费用中心查看；百炼模型 API Key 无法查询按量付费余额",
      "toppedUp": "充值余额",
      "granted": "赠送余额",
      "grantedLegacy": "赠送/旧免费余额",
      "actualTopUp": "实际充值",
      "platformGift": "平台赠送",
      "field.chargeBalance": "chargeBalance · 用户充值余额",
      "field.balance": "balance · 旧版赠送余额字段",
      "field.monthToDateUsage": "month_to_date_usage · 当前账期使用金额",
      "meaning.totalBalance": "公开 API 返回的总余额，通常为 balance 与 chargeBalance 的合计",
      "meaning.chargeBalance": "用户充值形成的余额",
      "meaning.balance": "赠送或旧版免费余额字段",
      "bal.credit": "可用信用余额",
      "bal.due": "待结算账户余额",
      "bal.settled": "账户余额",
      "monthToDateUsage": "本月至今使用",
      "note.deepseek": "数据来自 DeepSeek 官方 /user/balance 接口。",
      "note.siliconflow": "数据来自 SiliconFlow 官方 /v1/user/info 接口；该接口未公开代金券或历史用量字段，数值可能与控制台可用总额不同。",
      "note.digitalocean": "数据来自 DigitalOcean 账户级 Billing API；负数账户余额按可用信用额取绝对值展示，DO AI 推理 Key 不能用于此查询。"
    };
    var __BAL_EN = {
      "hint.deepseek": "DEEPSEEK_API_KEY (inference key)",
      "hint.siliconflow": "API key referenced by the provider named siliconflow in model settings",
      "hint.digitalocean": "DIGITALOCEAN_TOKEN (account-level Personal Access Token, not a DO AI inference key)",
      "hint.amd": "AMD GPU Cloud has no public balance endpoint yet",
      "hint.bailianPayg": "Pay-as-you-go balance lives in the Alibaba Cloud billing console; Bailian model API keys cannot query it",
      "toppedUp": "Topped-up balance",
      "granted": "Granted balance",
      "grantedLegacy": "Granted (legacy free) balance",
      "actualTopUp": "Actual top-up amount",
      "platformGift": "Granted by the platform",
      "field.chargeBalance": "chargeBalance · user topped-up balance",
      "field.balance": "balance · legacy granted/free-balance field",
      "field.monthToDateUsage": "month_to_date_usage · usage this billing period",
      "meaning.totalBalance": "Total balance returned by the public API; usually balance plus chargeBalance",
      "meaning.chargeBalance": "Balance formed by user top-ups",
      "meaning.balance": "Granted or legacy free-balance field",
      "bal.credit": "Available credit balance",
      "bal.due": "Outstanding account balance",
      "bal.settled": "Account balance",
      "monthToDateUsage": "Month-to-date usage",
      "note.deepseek": "Data from the official DeepSeek /user/balance endpoint.",
      "note.siliconflow": "Data from the official SiliconFlow /v1/user/info endpoint; it exposes no voucher or historical-usage fields, so values may differ from the console total.",
      "note.digitalocean": "Data from the DigitalOcean account-level Billing API; a negative account balance is shown as available credit, and DO AI inference keys cannot be used for this query."
    };
    var tb = function (k) { var pack = __LANG === "en" ? __BAL_EN : __BAL_ZH; return pack[k] || k; };
    var __msgText = function (m) {
      if (!m) return "";
      if (typeof m === "string") return m;
      if (m.seq) {
        var acc = "";
        for (var si = 0; si < m.seq.length; si++) {
          var part = m.seq[si];
          acc += (part && typeof part === "object" && part.k !== undefined) ? t(part.k) : String(part);
        }
        return acc;
      }
      var base = m.k ? t(m.k) : (m.raw || "");
      if (m.tail !== undefined && m.tail !== null) base += String(m.tail);
      return base;
    };
    var __msgText = function (m) {
      if (!m) return "";
      if (typeof m === "string") return m;
      if (m.seq) {
        var acc = "";
        for (var si = 0; si < m.seq.length; si++) {
          var part = m.seq[si];
          acc += (part && typeof part === "object" && part.k !== undefined) ? t(part.k) : String(part);
        }
        return acc;
      }
      var base = m.k ? t(m.k) : (m.raw || "");
      if (m.tail !== undefined && m.tail !== null) base += String(m.tail);
      return base;
    };
    var __langListeners = [];
    var setLang = function (lang) {
      var next = lang === "zh" ? "zh" : "en";
      if (next === __LANG) return __LANG;
      __LANG = next;
      // 仅内存生效：不再写 localStorage，语言始终以宿主设置为准
      for (var i = 0; i < __langListeners.length; i++) { try { __langListeners[i](__LANG); } catch (e2) {} }
      return __LANG;
    };
    // 跟随宿主语言服务（通用设置 → 语言）：读取当前语言并订阅变化，切换后即时生效
    var syncWithSystemLocale = function (locale) {
      if (!locale || typeof locale.getLocale !== "function") return;
      var sync = function () {
        var snap = locale.getLocale();
        setLang(snap && snap.active === "zh" ? "zh" : "en");
      };
      sync();
      if (typeof locale.subscribe === "function") locale.subscribe(sync);
    };
    function useLang() {
      var st = React.useState(__LANG);
      React.useEffect(function () {
        var fn = function () { st[1](__LANG); };
        __langListeners.push(fn);
        return function () { var idx = __langListeners.indexOf(fn); if (idx >= 0) __langListeners.splice(idx, 1); };
      }, []);
      return st[0];
    }

    // ── inline styles (replaces a stylesheet; portable across client plugins) ──
    // 字号用 em 表示，随宿主“显示大小”设置的字体基准自动缩放（继承应用字号）；
    // 间距保持 px，仅微调以适配更大的字号。标注的 px 是默认 13px 基准下的设计值。
    var BASE_FS = 13;
    var fs = function (n) { return (Math.round(n / BASE_FS * 100) / 100).toFixed(2) + "em"; };

    // ── 设计令牌 ────────────────────────────────────────────────────────────
    // 组件层只允许引用这里的 token，不再散落 #3a7bd5 / rgba(90,140,255,.18) 这类裸值：
    // 同一个"蓝"此前有 4 个色号、同一个"红"有 3 个，深浅色主题下对比度也不一致。
    // 语义收敛为四类：ok（成功 / 缓存命中）、warn（需要注意 / 高峰）、
    // danger（错误 / 超支）、accent（主操作 / 链接 / 中性强调）。
    var C = {
      ok: "#22a45d",
      okBg: "rgba(34,164,93,.16)",
      warn: "#c2760b",
      warnBg: "rgba(194,118,11,.10)",
      warnLine: "rgba(194,118,11,.38)",
      danger: "#e5484d",
      dangerBg: "rgba(229,72,77,.09)",
      dangerLine: "rgba(229,72,77,.40)",
      accent: "#4b7bec",
      accentText: "#3d6bd6",
      accentBg: "rgba(75,123,236,.16)",
      accentSoft: "rgba(75,123,236,.06)",
      accentLine: "rgba(75,123,236,.40)",
      line: "rgba(128,128,128,.22)",
      lineSoft: "rgba(128,128,128,.15)",
      lineStrong: "rgba(128,128,128,.35)",
      fill: "rgba(128,128,128,.06)",
      fillStrong: "rgba(128,128,128,.09)"
    };
    // 字号阶梯：只保留 6 档（10 / 11 / 12 / 13 / 15 / 20 + 32 展示值），
    // 不再出现 10.5、14、18、22、26 这类随手写的中间值。
    var FS = { xs: 10, sm: 11, md: 12, lg: 13, xl: 15, xxl: 20, display: 32 };
    // 渐变与"叠加在品牌色上的白色元素"：这些不是语义色，但同样不该散落成裸字符串。
    var G = {
      brand: "linear-gradient(135deg," + C.accentText + ",#00d2ff)",
      onAccent: "linear-gradient(90deg,#ffffff,#d7ecff)",
      budgetWarn: "linear-gradient(90deg,#ffe08a,#ffb347)",
      budgetDanger: "linear-gradient(90deg,#ff9a8b," + C.danger + ")",
      inkOnAccent: "#ffffff",
      chipDark: "#15171c"
    };

    var st = {
      root: { display: "flex", flexDirection: "column", gap: 14, padding: "4px 0", width: "100%", maxWidth: "100%", minWidth: 0, boxSizing: "border-box" },
      tab: { padding: "16px 20px", maxWidth: "min(1200px, calc(100vw - 24px))", margin: "0 auto", width: "100%", minWidth: 0, boxSizing: "border-box" },
      head: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
      headleft: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
      title: { fontSize: fs(FS.xl), fontWeight: 600, display: "flex", alignItems: "center", gap: 8 },
      titleVer: { fontSize: fs(FS.xs), fontWeight: 500, opacity: 0.5, letterSpacing: 0, padding: "1px 6px", border: "1px solid rgba(128,128,128,.35)", borderRadius: 999, whiteSpace: "nowrap" },
      sub: { fontSize: fs(FS.sm), opacity: 0.55 },
      actions: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
      btn: { border: "1px solid rgba(128,128,128,.35)", background: "transparent", borderRadius: 6, padding: "4px 10px", fontSize: fs(FS.md), cursor: "pointer", color: "inherit" },
      btnPrimary: { border: "1px solid rgba(90,140,255,.6)", background: "rgba(90,140,255,.22)", borderRadius: 6, padding: "4px 10px", fontSize: fs(FS.md), cursor: "pointer", color: "inherit" },
      btnDisabled: { border: "1px solid rgba(128,128,128,.35)", background: "transparent", borderRadius: 6, padding: "4px 10px", fontSize: fs(FS.md), cursor: "default", color: "inherit", opacity: 0.5 },
      input: { border: "1px solid rgba(128,128,128,.35)", background: "transparent", borderRadius: 6, padding: "4px 10px", fontSize: fs(FS.md), color: "inherit", minWidth: 280 },
      dateInput: { border: "1px solid rgba(128,128,128,.35)", background: "transparent", borderRadius: 6, padding: "3px 8px", fontSize: fs(FS.md), color: "inherit" },
      seg: { display: "inline-flex", border: "1px solid rgba(128,128,128,.35)", borderRadius: 6, overflow: "hidden", flexWrap: "wrap" },
      segBtn: { border: 0, background: "transparent", padding: "4px 10px", fontSize: fs(FS.md), cursor: "pointer", color: "inherit" },
      segBtnOn: { border: 0, background: "rgba(90,140,255,.22)", padding: "4px 10px", fontSize: fs(FS.md), cursor: "pointer", color: "inherit", fontWeight: 600 },
      cards: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 10 },
      card: { border: "1px solid rgba(128,128,128,.35)", borderRadius: 8, padding: "10px 12px", minWidth: 0 },
      cardL: { fontSize: fs(FS.sm), opacity: 0.6, marginBottom: 4 },
      cardV: { fontSize: fs(FS.xxl), fontWeight: 600, overflowWrap: "anywhere" },
      cardH: { fontSize: fs(FS.xs), opacity: 0.5, marginTop: 2, overflowWrap: "anywhere" },
      sec: { fontSize: fs(FS.lg), fontWeight: 600, marginTop: 6 },
      subtabBar: { display: "flex", gap: 6, borderBottom: "1px solid rgba(128,128,128,.2)", paddingBottom: 8, flexWrap: "wrap" },
      subtab: { border: "1px solid rgba(128,128,128,.35)", background: "transparent", borderRadius: 6, padding: "5px 14px", fontSize: fs(FS.md), cursor: "pointer", color: "inherit" },
      subtabOn: { border: "1px solid rgba(90,140,255,.5)", background: "rgba(90,140,255,.22)", borderRadius: 6, padding: "5px 14px", fontSize: fs(FS.md), cursor: "pointer", color: "inherit", fontWeight: 600 },
      scroll: { overflowX: "auto", overflowY: "hidden", width: "100%", maxWidth: "100%", minWidth: 0 },
      // 表格按内容撑开（width:max-content），列不被压缩，数值不会换行/重叠；
      // 外层 st.scroll（overflow-x:auto）在窗口不够宽时横向滚动。minWidth:720 兜底极窄屏。
      tbl: { width: "max-content", minWidth: 720, borderCollapse: "collapse", fontSize: fs(FS.md) },
      th: { textAlign: "right", padding: "7px 8px", borderBottom: "1px solid rgba(128,128,128,.2)", whiteSpace: "normal", wordBreak: "break-word", opacity: 0.55, fontWeight: 500, lineHeight: 1.5 },
      thFirst: { textAlign: "left", padding: "7px 8px", borderBottom: "1px solid rgba(128,128,128,.2)", whiteSpace: "normal", wordBreak: "break-word", opacity: 0.55, fontWeight: 500, lineHeight: 1.5 },
      td: { textAlign: "right", padding: "7px 8px", borderBottom: "1px solid rgba(128,128,128,.2)", whiteSpace: "normal", wordBreak: "break-word" },
      tdFirst: { textAlign: "left", padding: "7px 8px", borderBottom: "1px solid rgba(128,128,128,.2)", whiteSpace: "normal", wordBreak: "break-word" },
      tdWrap: { textAlign: "left", padding: "7px 8px", borderBottom: "1px solid rgba(128,128,128,.2)", whiteSpace: "normal", wordBreak: "break-word" },
      // tdTotal / tdTotalFirst 在下方统一重新定义（合计行用更醒目的强调色），
      // 这里不再重复声明——同名键重复会让"改了却不生效"变成常见坑。
      tdClick: { textAlign: "left", padding: "7px 8px", borderBottom: "1px solid rgba(128,128,128,.2)", whiteSpace: "normal", wordBreak: "break-word", cursor: "pointer" },
      tdClickSel: { textAlign: "left", padding: "7px 8px", borderBottom: "1px solid " + C.line, whiteSpace: "normal", wordBreak: "break-word", cursor: "pointer", color: C.accent, fontWeight: 600 },
      tdGroup: { textAlign: "left", padding: "7px 8px", fontWeight: 600, background: C.fillStrong, borderBottom: "1px solid " + C.line, whiteSpace: "normal", wordBreak: "break-word" },
      tdGroupR: { textAlign: "right", padding: "7px 8px", fontWeight: 600, background: C.fillStrong, borderBottom: "1px solid " + C.line, whiteSpace: "normal", wordBreak: "break-word" },
      badgeHit: { display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: fs(FS.sm), fontWeight: 500, background: C.okBg, color: C.ok, whiteSpace: "nowrap" },
      badgePeak: { display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: fs(FS.sm), fontWeight: 500, background: C.warnBg, color: C.warn, whiteSpace: "nowrap" },
      badgeValley: { display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: fs(FS.sm), fontWeight: 500, background: C.accentBg, color: C.accent, whiteSpace: "nowrap" },
      // 概览顶部「一行摘要」：替代原先占半屏的蓝色 hero 卡
      summaryStrip: { display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginTop: 10, padding: "9px 12px", borderRadius: 10, border: "1px solid rgba(128,128,128,.18)", background: "rgba(128,128,128,.05)" },
      summaryMain: { display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" },
      summaryLabel: { fontSize: fs(FS.sm), opacity: 0.6 },
      summaryValue: { fontSize: fs(FS.xxl), fontWeight: 700, letterSpacing: ".2px" },
      summarySub: { fontSize: fs(FS.sm), opacity: 0.6 },
      summaryBudget: { display: "flex", alignItems: "center", gap: 8, minWidth: 220 },
      scopeBar: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 10 },
      badgeWarn: { display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: fs(FS.sm), fontWeight: 500, background: C.dangerBg, color: C.danger, whiteSpace: "nowrap" },
      costPeak: { color: C.warn, fontWeight: 600, whiteSpace: "nowrap" },
      costOff: { color: C.accentText, fontWeight: 600, whiteSpace: "nowrap" },
      err: { color: C.danger, fontSize: fs(FS.md) },
      empty: { fontSize: fs(FS.md), opacity: 0.6, padding: "16px 0" },
      note: { fontSize: fs(FS.sm), opacity: 0.55 },
      errbox: { border: "1px solid " + C.dangerLine, background: C.dangerBg, borderRadius: 8, padding: 12, fontSize: fs(FS.md) },
      errboxTitle: { fontWeight: 600, marginBottom: 4, color: C.danger },
      diffbox: { border: "1px solid " + C.warnLine, background: C.warnBg, borderRadius: 8, padding: "8px 12px", marginTop: 10, fontSize: fs(FS.sm), lineHeight: 1.6, color: "inherit" },
      diffboxTitle: { fontWeight: 600, marginBottom: 4, color: C.warn },
      diffboxText: { opacity: 0.85, marginBottom: 2 },
      diffboxWarn: { marginTop: 6, color: C.danger, fontWeight: 600 },
      infobox: { border: "1px solid " + C.accentLine, background: C.accentSoft, borderRadius: 8, padding: 12, marginTop: 18, fontSize: fs(FS.md) },
      infoboxTitle: { fontWeight: 600, marginBottom: 4, color: C.accent },
      actionLink: { display: "inline-block", marginTop: 8, color: C.accentText, textDecoration: "underline", fontSize: fs(FS.md) },
      // 官方来源 / 价格依据 / 「为什么显示这个价格」说明块
      officialLinks: { marginTop: 10, paddingTop: 8, borderTop: "1px solid " + C.line },
      officialLinksTitle: { fontWeight: 600, marginBottom: 2 },
      officialLinksHint: { fontSize: fs(FS.sm), opacity: 0.7, marginBottom: 4 },
      officialLinkRow: { lineHeight: 1.95 },
      officialLink: { color: C.accentText, textDecoration: "underline", fontSize: fs(FS.md) },
      whybox: { border: "1px solid " + C.accentLine, background: C.accentSoft, borderRadius: 8, padding: "10px 12px", marginTop: 10, fontSize: fs(FS.sm), lineHeight: 1.7, color: "inherit" },
      whyboxTitle: { fontWeight: 600, marginBottom: 4, color: C.accent },
      whyboxText: { opacity: 0.9, marginBottom: 4 },
      whyboxTip: { opacity: 0.95, marginTop: 2, fontWeight: 600, color: C.accent },
      hero: { borderRadius: 12, padding: 20, color: G.inkOnAccent, background: G.brand, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 },
      heroLabel: { fontSize: fs(FS.md), opacity: 0.85 },
      heroValue: { fontSize: fs(FS.display), fontWeight: 700, letterSpacing: 0.5 },
      heroCurrency: { fontSize: fs(FS.md), opacity: 0.9 },
      // ── 百炼 Token Plan 纯进度条样式（白色填充，蓝色 hero 高对比）──
      qwenHero: { display: "flex", flexDirection: "column", alignItems: "stretch", gap: 10, width: "100%" },
      qwenBarWrap: { width: "100%" },
      qwenBar: { width: "100%", height: 16, borderRadius: 999, background: "rgba(0,0,0,.22)", overflow: "hidden", position: "relative", boxShadow: "inset 0 1px 2px rgba(0,0,0,.25)" },
      qwenBarFill: { height: "100%", borderRadius: 999, background: G.onAccent, transition: "width .4s ease", boxShadow: "0 0 6px rgba(255,255,255,.35)" },
      qwenHeroTitle: { fontSize: fs(FS.xl), fontWeight: 600, opacity: 0.95 },
      qwenHeroUsed: { fontSize: fs(FS.xl), fontWeight: 700, textAlign: "center", letterSpacing: 0.5 },
      // ── 本周配额卡片：连续线段 + 今天节点 ──
      qwenWeekCard: { border: "1px solid rgba(90,140,255,.25)", background: "rgba(90,140,255,.06)", borderRadius: 10, padding: "14px 16px", marginTop: 14 },
      qwenWeekLabel: { fontSize: fs(FS.sm), opacity: 0.6, marginBottom: 8, fontWeight: 600 },
      qwenWeekRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "nowrap" },
      qwenWeekItem: { display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 },
      qwenWeekItemR: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0 },
      qwenWeekHint: { fontSize: fs(FS.xs), opacity: 0.55 },
      qwenWeekVal: { fontSize: fs(FS.lg), fontWeight: 600 },
      qwenWeekLine: { position: "relative", flex: "1 1 auto", minWidth: 80, height: 24, display: "flex", alignItems: "center", margin: "0 4px" },
      qwenWeekTrack: { position: "relative", width: "100%", height: 5, borderRadius: 999, background: C.accentBg },
      qwenWeekProgress: { position: "absolute", left: 0, top: 0, bottom: 0, width: "0%", borderRadius: 999, background: "linear-gradient(90deg," + C.accentText + "," + C.accent + ")", boxShadow: "0 0 6px " + C.accentLine, transition: "width .4s ease" },
      // 「今天」节点：固定深色小胶囊，与宿主图表底色无关，故不走主题色
      qwenWeekToday: { position: "absolute", top: "50%", transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: G.chipDark, padding: "3px 8px", borderRadius: 999, border: "1px solid " + C.accentLine, whiteSpace: "nowrap", zIndex: 2, transition: "left .4s ease" },
      qwenWeekTodayDot: { width: 7, height: 7, borderRadius: "50%", background: C.accent, boxShadow: "0 0 6px " + C.accentLine },
      qwenWeekTodayDate: { fontSize: fs(FS.sm), fontWeight: 600, color: C.accent, lineHeight: 1 },
      calBar: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 10 },
      calGrid: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginTop: 6 },
      calWk: { textAlign: "center", fontSize: fs(FS.sm), opacity: 0.5, padding: "2px 0" },
      calCell: { border: "1px solid rgba(128,128,128,.15)", borderRadius: 6, padding: "6px 2px", textAlign: "center", fontSize: fs(FS.md), cursor: "pointer", minHeight: 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 },
      calCellBlank: { border: "1px solid transparent", padding: "6px 2px", minHeight: 40 },
      calCellOn: { outline: "2px solid " + C.accent, outlineOffset: -2 },
      calCellVal: { fontSize: fs(FS.xs), opacity: 0.8, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
      legend: { display: "flex", alignItems: "center", gap: 6, fontSize: fs(FS.sm), opacity: 0.65, marginTop: 8, flexWrap: "wrap" },
      legendBar: { display: "inline-block", width: 100, height: 8, borderRadius: 4, background: "linear-gradient(90deg,rgba(128,128,128,.12),rgba(46,134,222,.3),rgba(46,134,222,.85))" },
      numInput: { border: "1px solid rgba(128,128,128,.35)", background: "transparent", borderRadius: 4, padding: "3px 6px", fontSize: fs(FS.md), color: "inherit", width: 78, textAlign: "right" },
      selDayTitle: { fontSize: fs(FS.lg), fontWeight: 600, marginTop: 14 },
      billHint: { border: "1px solid " + C.accentLine, background: C.accentSoft, borderRadius: 8, padding: "10px 14px", marginTop: 10, fontSize: fs(FS.md), lineHeight: 1.9 },
      billHintTitle: { fontWeight: 600, marginBottom: 4, color: C.accent },
      nowPeriod: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 10, fontSize: fs(FS.md) },
      loading: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "48px 0", color: "inherit" },
      spinner: { width: 28, height: 28, borderRadius: "50%", border: "3px solid " + C.accentBg, borderTopColor: C.accent, animation: "dshUsageSpin .8s linear infinite", flexShrink: 0 },
      loadText: { fontSize: fs(FS.md), opacity: 0.65 },
      // 预算进度条（摘要条内使用）
      budgetHero: { flex: "1 1 220px", minWidth: 200 },
      budgetHeroLabel: { fontSize: fs(FS.sm), opacity: 0.9, marginBottom: 4, display: "flex", justifyContent: "space-between", gap: 8 },
      budgetHeroBar: { width: "100%", height: 10, borderRadius: 999, background: "rgba(0,0,0,.22)", overflow: "hidden", position: "relative", boxShadow: "inset 0 1px 2px rgba(0,0,0,.25)" },
      budgetHeroFill: { height: "100%", borderRadius: 999, background: G.onAccent, transition: "width .4s ease" },
      budgetHeroFillWarn: { height: "100%", borderRadius: 999, background: G.budgetWarn, transition: "width .4s ease" },
      budgetHeroFillDanger: { height: "100%", borderRadius: 999, background: G.budgetDanger, transition: "width .4s ease" },
      budgetHeroText: { fontSize: fs(FS.xs), opacity: 0.95, marginTop: 4 },
      // 卡片分两级：普通卡（次要指标）与主卡（关键结论，蓝色边框 + 淡底）
      cardPrimary: { border: "1px solid " + C.accentLine, background: C.accentSoft, borderRadius: 8, padding: "10px 12px", minWidth: 0 },
      // 图表区
      chartGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 12, marginTop: 12 },
      chartPanel: { border: "1px solid rgba(128,128,128,.18)", borderRadius: 10, padding: "10px 12px", minWidth: 0 },
      chartPanelTitle: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: fs(FS.md), fontWeight: 600, marginBottom: 6 },
      chartCanvas: { width: "100%", display: "block" },
      legendRow: { display: "flex", alignItems: "center", gap: 8, fontSize: fs(FS.sm), opacity: 0.8, flexWrap: "wrap", marginTop: 6 },
      legendDot: { display: "inline-block", width: 10, height: 10, borderRadius: 3 },
      // 环比徽章（涨/跌）：涨用 danger、跌用 ok，与"变差/变好"的语义一致
      badgeUp: { display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: fs(FS.sm), fontWeight: 500, background: C.dangerBg, color: C.danger, whiteSpace: "nowrap" },
      badgeDown: { display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: fs(FS.sm), fontWeight: 500, background: C.okBg, color: C.ok, whiteSpace: "nowrap" },
      // 会话排行
      sessionCard: { border: "1px solid rgba(128,128,128,.18)", borderRadius: 10, padding: "10px 12px", marginTop: 12 },
      sessionRow: { display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid rgba(128,128,128,.12)", fontSize: fs(FS.md) },
      sessionName: { flex: "1 1 0", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
      sessionBar: { flex: "1 1 120px", height: 8, borderRadius: 999, background: "rgba(128,128,128,.15)", overflow: "hidden", minWidth: 80 },
      sessionBarFill: { height: "100%", borderRadius: 999, background: "linear-gradient(90deg," + C.accentText + "," + C.accent + ")" },
      sessionCost: { textAlign: "right", whiteSpace: "nowrap", fontWeight: 600, minWidth: 74 },
      sessionSub: { fontSize: fs(FS.xs), opacity: 0.55, whiteSpace: "nowrap" },
      // 详细数据区（分组标题，更醒目 + 副标题说明）
      dataSection: { marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(128,128,128,.18)" },
      dataSectionTitle: { display: "flex", alignItems: "baseline", gap: 8, fontSize: fs(FS.lg), fontWeight: 700, marginBottom: 2, color: "inherit" },
      dataSectionHint: { fontSize: fs(FS.sm), opacity: 0.55, marginBottom: 8 },
      // 表格行：合计行更突出
      tdTotal: { textAlign: "right", padding: "8px 8px", fontWeight: 700, borderTop: "2px solid " + C.accentLine, background: C.accentSoft, whiteSpace: "normal", wordBreak: "break-word" },
      tdTotalFirst: { textAlign: "left", padding: "8px 8px", fontWeight: 700, borderTop: "2px solid " + C.accentLine, background: C.accentSoft, whiteSpace: "normal", wordBreak: "break-word" },
      // 模型名 / API 服务商列：更宽 + 优雅换行
      tdModelName: { textAlign: "left", padding: "7px 10px", borderBottom: "1px solid rgba(128,128,128,.18)", whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.45, minWidth: 180, maxWidth: 260 },
      tdModelProvider: { textAlign: "left", padding: "7px 10px", borderBottom: "1px solid rgba(128,128,128,.18)", whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.45, minWidth: 160, maxWidth: 220, opacity: 0.85, fontSize: fs(FS.sm) }
    };

    // 注入全局样式（幂等，仅一次）：加载动画关键帧等
    if (typeof document !== "undefined" && document.head && !document.getElementById("dsh-usage-plugin-style")) {
      var styleSheetEl = document.createElement("style");
      styleSheetEl.id = "dsh-usage-plugin-style";
      styleSheetEl.textContent = "@keyframes dshUsageSpin{to{transform:rotate(360deg)}}" +
        // 关键修复：本面板常被停靠在很窄的侧栏里（实测约 590px），而宿主窗口可能
        // 有 1100px+。此前的适配用的是媒体查询（按**窗口**宽度），于是窗口够宽、
        // 面板很窄时一条都不生效——明细表 11 列被直接裁掉，「总消耗」看不见。
        // 现在改用**容器查询**，按面板自身宽度逐级折叠次要列。
        ".dsh-usage-scope{container-type:inline-size}" +
        ".dsh-usage-scope *::-webkit-scrollbar{height:8px;width:8px}" +
        ".dsh-usage-scope *::-webkit-scrollbar-thumb{background:rgba(128,128,128,.35);border-radius:4px}" +
        ".dsh-usage-table{min-width:720px}" +
        // 面板 < 860：先去掉「推理」（信息量最低、且是 outputTokens 的子集）
        "@container (max-width:860px){.dsh-usage-table.collapse-mobile tr>*:nth-child(8){display:none!important}}" +
        // 面板 < 720：再去掉「高峰消耗 / 空闲消耗」，只保留「总消耗」；表格贴合容器宽度
        "@container (max-width:720px){.dsh-usage-table.collapse-mobile tr>*:nth-child(9),.dsh-usage-table.collapse-mobile tr>*:nth-child(10){display:none!important}.dsh-usage-table{min-width:0!important;width:100%!important;max-width:100%!important}}" +
        // 面板 < 560：只保留前 3 个标识列 + 最后合计列（模型/服务商/调用/总消耗）
        "@container (max-width:560px){.dsh-usage-table.collapse-mobile tr>*:not(:nth-child(-n+3)):not(:last-child){display:none!important}}" +
        // 老引擎兜底（不支持容器查询时按窗口宽度折叠）
        "@media (max-width:900px){.dsh-usage-table{min-width:0!important;width:100%!important;max-width:100%!important}}" +
        "@media (max-width:540px){.dsh-usage-table.collapse-mobile tr>*:not(:nth-child(-n+3)):not(:last-child){display:none!important}}";
      document.head.appendChild(styleSheetEl);
    }

    // ── helpers ──
    // canvas 图表颜色适配宿主主题：读取一个隐藏 probe 元素的继承文字颜色，
    // 判断当前是浅色还是深色背景，从而选择可读的文字/网格颜色。
    var isLightBackground = function () {
      try {
        var probe = document.createElement("span");
        probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;font-size:10px";
        probe.textContent = "x";
        if (document.body) document.body.appendChild(probe);
        var c = document.body ? window.getComputedStyle(probe).color : "";
        if (document.body && probe.parentNode) probe.parentNode.removeChild(probe);
        var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c || "");
        if (m) {
          var luma = 0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3];
          return luma < 128;
        }
      } catch (e) {}
      try { return !(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches); } catch (e2) {}
      return true;
    };
    var pad2 = function (n) { return (n < 10 ? "0" : "") + n; };
    var fmtInt = function (n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); };
    var fmtTime = function (ts) { var d = new Date(ts + 8 * 3600 * 1000); return pad2(d.getUTCMonth() + 1) + "-" + pad2(d.getUTCDate()) + " " + pad2(d.getUTCHours()) + ":" + pad2(d.getUTCMinutes()) + ":" + pad2(d.getUTCSeconds()); };
    var fmtMoney = function (n) { if (!n) return "¥0.0000"; if (n < 0.0001) return "¥" + n.toExponential(2); if (n < 1) return "¥" + n.toFixed(4); return "¥" + n.toFixed(2); };
    var fmtPrice = function (n) { if (n == null || isNaN(n)) return "—"; return String(parseFloat(Number(n).toFixed(4))); };
    var modelLabel = function (mk) { if (mk === "deepseek-flash") return "deepseek-flash"; if (mk === "deepseek-v4-pro") return "deepseek-v4-pro"; return t("未知模型"); };
    // 模型显示名：以请求参数里的真实模型名为准（非 DeepSeek 模型也如实显示），
    // 空模型名时退回已知档位名 / provider / 未知。
    var modelName = function (r) {
      var m = String((r && r.model) || "").trim();
      if (m) return m;
      var mv = r && r.modelKey;
      if (mv && mv !== "unknown") return modelLabel(mv);
      var p = String((r && r.provider) || "").trim();
      return p ? p : t("未知模型");
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
      return s || t("未知服务商");
    };
    var providerGroupKey = function (p) {
      var s = String(p == null ? "" : p).trim();
      return s ? s.toLowerCase() : "unknown";
    };
    var finishLabel = function (f) { if (f === "stop") return t("完成"); if (f === "tool-calls") return t("工具调用"); if (f === "max-tokens") return t("超长"); if (f === "error") return t("错误"); if (f === "aborted") return t("已中断"); if (f === "timeout") return t("超时"); return f || "—"; };
    var pct = function (a, b) { return b > 0 ? (a / b * 100).toFixed(1) + "%" : "—"; };
    // 周末统一按空闲价规则生效时间：北京时间 2026-08-23 00:00（周日）。此前（含周末）仍按原峰谷分段。
    var WEEKEND_FLAT_AT = Date.parse("2026-08-23T00:00:00+08:00");
    var isPeakNow = function (ts) {
      var d = new Date(ts + 8 * 3600 * 1000);
      var wd = d.getUTCDay(); // 0=周日 1=周一 … 6=周六
      if (ts >= WEEKEND_FLAT_AT && (wd === 0 || wd === 6)) return false;
      var t = d.getUTCHours() * 60 + d.getUTCMinutes();
      return (t >= 9 * 60 && t < 12 * 60) || (t >= 14 * 60 && t < 18 * 60);
    };
    // 返回当前计费时段 { peak, label, desc }，区分：工作日高峰 / 工作日空闲 / 周末空闲（周末自 2026-08-23 起全天按空闲价）
    var periodNow = function (ts) {
      ts = ts || Date.now();
      var d = new Date(ts + 8 * 3600 * 1000);
      var wd = d.getUTCDay(); // 0=周日 1=周一 … 6=周六
      var isWeekend = wd === 0 || wd === 6;
      var t = d.getUTCHours() * 60 + d.getUTCMinutes();
      var inPeakHours = (t >= 9 * 60 && t < 12 * 60) || (t >= 14 * 60 && t < 18 * 60);
      if (isWeekend) {
        if (ts >= WEEKEND_FLAT_AT) return { peak: false, label: "周末空闲时段", desc: "周末（周六、周日）全天按空闲价计费" };
        return inPeakHours
          ? { peak: true, label: "周末高峰时段", desc: "2026-08-23 前仍按原规则分峰谷" }
          : { peak: false, label: "周末空闲时段", desc: "2026-08-23 前仍按原规则分峰谷" };
      }
      return inPeakHours
        ? { peak: true, label: "工作日高峰时段", desc: "周一至周五 9:00–12:00、14:00–18:00" }
        : { peak: false, label: "工作日空闲时段", desc: "工作日其余时间" };
    };
    // 计费档位选择：auto 用 autoCost（按生效日期自动切换），base 用 baseCost，其余用 peakValleyCost
    // 计费档位显示文案
    var regimeLabel = function (regime) {
      if (regime === "auto") return t("自动（生效前基础价 · 生效后峰谷价）");
      if (regime === "base") return t("基础价格");
      return t("峰谷价格");
    };
    var costHint = function (regime) {
      if (regime === "auto") return t("自动");
      if (regime === "base") return t("基础价格");
      return t("峰谷价格");
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
    var __MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var __MONTHS_FULL_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var __WD_ZH = ["一", "二", "三", "四", "五", "六", "日"];
    var __WD_EN = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
    var weekdayLabels = function () { return __LANG === "en" ? __WD_EN : __WD_ZH; };
    var fmtMonthLabel = function (y, m1) { return __LANG === "en" ? __MONTHS_FULL_EN[m1 - 1] + " " + y : y + "年" + m1 + "月"; };
    var dayLabel = function (key) {
      var p = String(key).split("-");
      if (__LANG === "en") return __MONTHS_EN[(+p[1]) - 1] + " " + (+p[2]) + ", " + p[0];
      return p[0] + "年" + (+p[1]) + "月" + (+p[2]) + "日";
    };
    var dailyStatsTitle = function (y, m1) { return __LANG === "en" ? "Daily stats (" + __MONTHS_FULL_EN[m1 - 1] + " " + y + ")" : "每日统计（" + y + "年" + m1 + "月）"; };
    var monthDays = function (y, m) { return new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); };
    // 每月 1 号在「周一起始」的日历里占第几格。
    // 旧实现用 bjStartMs() 取北京零点对应的**时刻**、再 getUTCDay() 读星期：
    // 那个时刻在 UTC 上已经退回到前一天 16:00，于是读出来的是前一天的星期，
    // 整月日期因此集体左移一列（2026-11：1 号是周日，却画在“周六”列）。
    // 星期几属于**日历日期**，直接用 UTC 日期算，不做任何时区平移。
    var monthOffset = function (y, m) { return (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7; };
    var fmtBalance = function (s) {
      var str = String(s == null ? "0" : s);
      var num = parseFloat(str);
      if (isNaN(num)) return str;
      var parts = str.split(".");
      var dec = parts[1] ? parts[1].slice(0, 2) : "00";
      return fmtInt(parseInt(parts[0], 10)) + "." + (dec.length === 1 ? dec + "0" : dec);
    };
    var currencySymbol = function (currency) { return currency === "CNY" ? "¥" : currency === "USD" ? "$" : (currency || ""); };
      var fmtShortDate = function (iso) {
        if (!iso) return "—";
        var p = String(iso).split("-");
        return (p[1] || "") + "." + (p[2] || "");
      };
var api = function (payload) {
      return fetch("/usage/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(function (r) { return r.json(); });
    };
    var PRICE_MODELS = ["deepseek-flash", "deepseek-v4-pro"];

    // ── Card ──
    // 卡片两级：默认是次要卡；`primary` 用于整页最关键的那一个数字（如总消耗）。
    function Card(props) {
      return el("div", { style: props.primary ? st.cardPrimary : st.card },
        el("div", { style: st.cardL }, props.label),
        el("div", { style: props.primary ? Object.assign({}, st.cardV, { color: C.accentText }) : st.cardV }, props.value),
        props.hint ? el("div", { style: st.cardH }, props.hint) : null
      );
    }

    // ── 计费时段说明（区分工作日高峰 / 工作日空闲 / 周末全天空闲）──
    function BillingHint(props) {
      return el("div", { style: st.billHint },
        el("div", { style: st.billHintTitle }, t("高峰 / 空闲时段说明")),
        el("div", null,
          el("span", { style: st.badgePeak }, t("工作日高峰")), t(" 周一至周五 9:00–12:00、14:00–18:00")
        ),
        el("div", null,
          el("span", { style: st.badgeValley }, t("空闲时段")), t(" 工作日其余时间，以及周末（周六、周日）全天（自 2026-08-23 起；此前仍按原规则分峰谷）")
        ),
        el("div", null,
          el("span", { style: st.badgePeak }, t("V4.1 调价")), t(" 2026-09-10 12:00（北京时间）起 deepseek-flash 按新版峰谷价计费（deepseek-v4-pro 不变）")
        )
      );
    }

    // ── 官方来源与价格依据（说明 + 官方外链）────────────────────────────
    // 用户需要知道「价格为什么是这样」，以及去哪里核对官方原文。
    // 全部为官方链接，统一在新标签页打开；本插件不改价、不代理官方计费。
    var OFFICIAL_LINKS = [
      { href: "https://api-docs.deepseek.com/zh-cn/quick_start/pricing", label: "DeepSeek 官方价格页（模型与价格、峰谷时段定义）" },
      { href: "https://mp.weixin.qq.com/s/qg0NU3NNUbp1co2PdkAPAg", label: "DeepSeek V4.1 Flash 发布公告" },
      { href: "https://platform.deepseek.com/usage", label: "DeepSeek 开放平台用量页（官方账单，用于对账）" },
      { href: "https://api-docs.deepseek.com/zh-cn/", label: "DeepSeek 官方 API 文档" },
      { href: "https://github.com/deepseek-ai/deepseek-harness", label: "DeepSeek Harness 官方仓库" }
    ];

    function OfficialLinks() {
      return el("div", { style: st.officialLinks },
        el("div", { style: st.officialLinksTitle }, t("官方来源与价格依据")),
        el("div", { style: st.officialLinksHint }, t("价格由 DeepSeek 官方公布，本插件只做本地计算、不修改也不代理官方价格；点下面的链接可直接核对官方原文。")),
        OFFICIAL_LINKS.map(function (l, i) {
          return el("div", { key: "official-link-" + i, style: st.officialLinkRow },
            el("a", { style: st.officialLink, href: l.href, target: "_blank", rel: "noreferrer" }, t(l.label))
          );
        })
      );
    }

    // ── 「为什么显示这个价格」说明（价格表页与帮助抽屉共用）──
    function WhyThisPrice() {
      return el("div", { style: st.whybox },
        el("div", { style: st.whyboxTitle }, t("为什么显示这个价格？")),
        el("div", { style: st.whyboxText }, t("① 官方价格表按生效时间分段：2026-08-17 00:00 起为第一版峰谷价；2026-09-10 12:00（北京时间）起为 DeepSeek V4.1 Flash 调价后的新版（deepseek-flash 单价下调，deepseek-v4-pro 不变）。每次调用按其发生时刻对应的版本计费，历史金额不会因后续调价而改变。")),
        el("div", { style: st.whyboxText }, t("② 模型档位按官方新命名归并：旧名 deepseek-v4-flash、deepseek-v4-flash-vision-exp 仍可调用（官方已路由到 DeepSeek-V4.1-Flash 并按 Flash 单价计费），计费时与 deepseek-flash 合并为同一档位。")),
        el("div", { style: st.whyboxText }, t("③ 峰谷规则：工作日 9:00–12:00、14:00–18:00（北京时间）为高峰，其余时间（含周末全天）为空闲；空闲价 = 高峰价的一半。")),
        el("div", { style: st.whyboxText }, t("④ 只有能与记录中 provider / model 可靠匹配的价格才参与计费，其余按 ¥0 统计（避免用相近模型的价格误算）。")),
        el("div", { style: st.whyboxText }, t("⑤ 本插件按官方公布价格在本地计算，结果仅供参考，最终以 DeepSeek 官方账单为准；产品价格可能变动，请以官方价格页为准。")),
        el("div", { style: st.whyboxTip }, t("建议：若新模型（如 deepseek-flash）的消耗显示为 ¥0，通常是本插件版本过旧——请升级到 1.17.0 或更高版本。")),
        el(OfficialLinks, null)
      );
    }

    // ── 数据加载动画 ──
    function LoadingView(props) {
      return el("div", { style: st.loading },
        el("div", { style: st.spinner }),
        el("div", { style: st.loadText }, props.text || "正在加载用量数据…")
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
      if (!ctx) throw new Error(t("canvas 2d 不可用"));
      ctx.scale(scale, scale);
      ctx.textBaseline = "alphabetic";
      var font = function (size, weight) { ctx.font = (weight || "400") + " " + size + 'px "Segoe UI","Microsoft YaHei",sans-serif'; };

      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#3a7bd5"; ctx.fillRect(0, 0, W, 64);
      ctx.fillStyle = "#ffffff"; ctx.textAlign = "left"; font(20, "700");
      ctx.fillText(t("用量与消耗报告"), P, 40);
      ctx.fillStyle = "#7a8699"; font(13, "400");
      ctx.fillText(t("生成时间 ") + fmtTime(Date.now()) + t("（北京） · 共 ") + count + t(" 条调用 · 缓存命中率 ") + hitRate +
        t(" · 高峰价消耗 ") + fmtMoney(totalPeakCost) + t(" · 空闲价消耗 ") + fmtMoney(totalOffCost) + t(" · 合计 ") + fmtMoney(totalCost) +
        (totalIn > count ? t(" · 报告仅含最近 ") + count + t(" 条") : ""), P, 92);

      var cardW = (W - 2 * P - 6 * 10) / 7;
      var cards = [
        { l: t("调用次数"), v: fmtInt(count) }, { l: t("输入 · 未命中"), v: fmtInt(totalMiss) },
        { l: t("输入 · 缓存命中"), v: fmtInt(totalHit) }, { l: t("输出"), v: fmtInt(totalOut) },
        { l: t("高峰消耗"), v: fmtMoney(totalPeakCost) }, { l: t("空闲消耗"), v: fmtMoney(totalOffCost) },
        { l: t("总消耗 (峰谷价)"), v: fmtMoney(totalCost) }
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
      ctx.fillStyle = "#1c2733"; font(15, "600"); ctx.fillText(t("缓存命中列表（共 ") + count + t(" 条）"), P, y);
      y = 244;
      ctx.fillStyle = "#eef1f5"; ctx.fillRect(P, y, W - 2 * P, headH);
      ctx.fillStyle = "#55617a"; font(fBase + 1, "600");
      var hty = y + Math.round(headH * 0.65);
      ctx.textAlign = "left"; ctx.fillText(t("时间(北京)"), c1.time, hty); ctx.fillText(t("模型"), c1.model, hty);
      ctx.textAlign = "right";
      ctx.fillText(t("输入·未命中"), c1.missR, hty); ctx.fillText(t("缓存命中"), c1.hitR, hty); ctx.fillText(t("缓存写入"), c1.writeR, hty);
      ctx.fillText(t("输出"), c1.outR, hty); ctx.fillText(t("推理"), c1.reasonR, hty); ctx.fillText(t("命中率"), c1.rateR, hty);
      ctx.fillText(t("时段"), c1.periodR, hty); ctx.fillText(t("结束"), c1.endR, hty); ctx.fillText(t("消耗(峰谷)"), c1.costR, hty);
      y += headH;
      for (var r3 = 0; r3 < count; r3++) {
        var rec = records[r3];
        var hit = rec.cacheReadTokens || 0, miss = rec.inputTokens || 0, cost = rec.peakValleyCost || 0;
        var intR = !!rec.interrupted;
        ctx.fillStyle = r3 % 2 === 1 ? "#fafbfc" : "#ffffff"; ctx.fillRect(P, y, W - 2 * P, rowH);
        var ty = y + Math.round(rowH * 0.68);
        ctx.textAlign = "left"; ctx.fillStyle = "#1c2733"; font(fBase, "400");
        ctx.fillText(fmtTime(rec.time), c1.time, ty); ctx.fillText(modelName(rec), c1.model, ty);
        if (intR) { ctx.fillStyle = "#e74c3c"; ctx.fillText(t("中断"), c1.model + ctx.measureText(modelName(rec)).width + 12, ty); ctx.fillStyle = "#1c2733"; }
        ctx.textAlign = "right";
        ctx.fillText(fmtInt(miss), c1.missR, ty);
        ctx.fillStyle = "#22a45d"; ctx.fillText(fmtInt(hit), c1.hitR, ty);
        ctx.fillStyle = "#1c2733";
        // DeepSeek 系 provider 不上报 cacheWriteTokens（官方计费里"缓存写入"本就
        // 按未命中价计、不单列），所以这一列显示 —。此前用 inputTokens 兜底展示，
        // 等于在图上凭空虚增一笔与未命中相等的写入，反而让数字对不上。
        ctx.fillText(rec.cacheWriteTokens ? fmtInt(rec.cacheWriteTokens) : "—", c1.writeR, ty);
        ctx.fillText(fmtInt(rec.outputTokens || 0), c1.outR, ty);
        ctx.fillText(rec.reasoningTokens ? fmtInt(rec.reasoningTokens) : "—", c1.reasonR, ty);
        ctx.fillStyle = "#55617a"; ctx.fillText(pct(hit, hit + miss), c1.rateR, ty);
        ctx.fillStyle = rec.peak ? C.warn : C.accentText; ctx.fillText(rec.peak ? t("峰") : t("谷"), c1.periodR, ty);
        ctx.fillStyle = intR ? "#e74c3c" : "#55617a"; ctx.fillText(finishLabel(rec.finishReason), c1.endR, ty);
        ctx.fillStyle = rec.peak ? C.warn : C.accentText; ctx.fillText(intR ? "—" : fmtMoney(cost), c1.costR, ty);
        y += rowH;
      }

      y += 24;
      ctx.textAlign = "left"; ctx.fillStyle = "#1c2733"; font(15, "600");
      ctx.fillText(t("消耗表（按模型 · 峰谷价 · 高峰/空闲分列）"), P, y);
      y += 18;
      var c2 = { model: P, callsR: P + 330, missR: P + 470, hitR: P + 590, outR: P + 710, reasonR: P + 840, peakR: P + 1010, offR: P + 1140, costR: P + 1440 };
      ctx.fillStyle = "#eef1f5"; ctx.fillRect(P, y, W - 2 * P, headH);
      ctx.fillStyle = "#55617a"; font(fBase + 1, "600");
      var hty2 = y + Math.round(headH * 0.65);
      ctx.textAlign = "left"; ctx.fillText(t("模型"), c2.model, hty2);
      ctx.textAlign = "right";
      ctx.fillText(t("调用"), c2.callsR, hty2); ctx.fillText(t("输入·未命中"), c2.missR, hty2); ctx.fillText(t("缓存命中"), c2.hitR, hty2);
      ctx.fillText(t("输出"), c2.outR, hty2); ctx.fillText(t("推理"), c2.reasonR, hty2);
      ctx.fillText(t("高峰消耗"), c2.peakR, hty2); ctx.fillText(t("空闲消耗"), c2.offR, hty2); ctx.fillText(t("总消耗"), c2.costR, hty2);
      y += headH;
      var t2rows = modelRows.concat([{ key: "合计", name: t("合计"), calls: count, miss: totalMiss, hit: totalHit, out: totalOut, reason: totalReason, cost: totalCost, peakCost: totalPeakCost, offCost: totalOffCost }]);
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
        ctx.fillStyle = C.accentText; ctx.fillText(fmtMoney(row.offCost), c2.offR, ty2);
        ctx.fillStyle = "#1c2733"; ctx.fillText(fmtMoney(row.cost), c2.costR, ty2);
        y += rowH;
      }
      y += 24;
      ctx.textAlign = "left"; ctx.fillStyle = "#1c2733"; font(15, "600");
      ctx.fillText(t("消耗表（按 API 服务商 × 模型 · 峰谷价）"), P, y);
      y += 18;
      ctx.fillStyle = "#eef1f5"; ctx.fillRect(P, y, W - 2 * P, headH);
      ctx.fillStyle = "#55617a"; font(fBase + 1, "600");
      var hty3 = y + Math.round(headH * 0.65);
      ctx.textAlign = "left"; ctx.fillText(t("API 服务商 / 模型"), c2.model, hty3);
      ctx.textAlign = "right";
      ctx.fillText(t("调用"), c2.callsR, hty3);
      ctx.fillText(t("高峰消耗"), c2.peakR, hty3); ctx.fillText(t("空闲消耗"), c2.offR, hty3); ctx.fillText(t("总消耗"), c2.costR, hty3);
      y += headH;
      var p3n = 0;
      for (var p3g = 0; p3g < providerGroups.length; p3g++) {
        var pgrp = providerGroups[p3g];
        var gpr = pgrp.provider;
        ctx.fillStyle = "#e8edf5"; ctx.fillRect(P, y, W - 2 * P, rowH);
        var ty3 = y + Math.round(rowH * 0.68);
        ctx.textAlign = "left"; ctx.fillStyle = "#1c2733"; font(fBase, "600");
        ctx.fillText(gpr.name + "（" + pgrp.models.length + t(" 个模型）"), c2.model, ty3);
        ctx.textAlign = "right"; ctx.fillStyle = "#1c2733"; font(fBase, "600");
        ctx.fillText(fmtInt(gpr.calls), c2.callsR, ty3);
        ctx.fillStyle = "#e08700"; ctx.fillText(fmtMoney(gpr.peakCost), c2.peakR, ty3);
        ctx.fillStyle = C.accentText; ctx.fillText(fmtMoney(gpr.offCost), c2.offR, ty3);
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
          ctx.fillStyle = C.accentText; ctx.fillText(fmtMoney(pmd.offCost), c2.offR, ty4);
          ctx.fillStyle = "#1c2733"; ctx.fillText(fmtMoney(pmd.cost), c2.costR, ty4);
          y += rowH;
        }
      }
      ctx.fillStyle = "#eef1f5"; ctx.fillRect(P, y, W - 2 * P, rowH);
      var ty5 = y + Math.round(rowH * 0.68);
      ctx.textAlign = "left"; ctx.fillStyle = "#1c2733"; font(fBase, "600");
      ctx.fillText(t("总费用合计"), c2.model, ty5);
      ctx.textAlign = "right"; ctx.fillStyle = "#1c2733"; font(fBase, "600");
      ctx.fillText(fmtInt(count), c2.callsR, ty5);
      ctx.fillStyle = "#e08700"; ctx.fillText(fmtMoney(totalPeakCost), c2.peakR, ty5);
      ctx.fillStyle = C.accentText; ctx.fillText(fmtMoney(totalOffCost), c2.offR, ty5);
      ctx.fillStyle = "#1c2733"; ctx.fillText(fmtMoney(totalCost), c2.costR, ty5);
      y += rowH;
      y += 26;
      ctx.textAlign = "left"; ctx.fillStyle = "#98a2b3"; font(11, "400");
      ctx.fillText(t("计价按请求的 API 服务商分别应用已核验价格；DigitalOcean 美元价按 USD/CNY 汇率折算；无法可靠映射的第三方价格按 ¥0。"), P, y);
    }

    /**
     * 趋势图 X 轴日期刻度排布（采纳自 PR #18，@vb2250158）。
     *
     * 旧实现按固定步长 `ceil(series.length / 8)` 取日期，只看数量、不看文字宽度：
     * 30 天视图在窄面板里最后两个日期会叠在一起（实测 10/6 与 10/7 重叠约 16px）。
     * 现在按 canvas 实测文本宽度做贪心排布，并优先保证**首尾两个日期**可见；
     * 两者确实放不下时只保留最近的日期。
     *
     * @param series - 时间正序的系列（每项含 key: 'YYYY-MM-DD'）。
     * @param x0 - 第一根柱子的左边缘。
     * @param gap - 柱间距（柱宽 + 空隙）。
     * @param bw - 柱宽。
     * @param left - 绘图区左边界。
     * @param right - 绘图区右边界。
     * @param measure - 文本宽度测量函数（通常 `ctx.measureText(t).width`）。
     * @returns 需要绘制的刻度数组（按 x 升序）。
     */
    function trendDateTicks(series, x0, gap, bw, left, right, measure) {
      var n = series.length;
      if (!n) return [];
      var SPACING = 8;
      function labelAt(i) {
        var dp = String(series[i].key).split("-");
        return (+dp[1]) + "/" + (+dp[2]);
      }
      function tickAt(i) {
        var text = labelAt(i);
        var w = measure(text);
        var cx = x0 + i * gap + bw / 2;
        var x = Math.min(Math.max(cx, left + w / 2), right - w / 2);
        return { index: i, text: text, x: x, left: x - w / 2, right: x + w / 2 };
      }
      if (n === 1) return [tickAt(0)];
      var first = tickAt(0);
      var last = tickAt(n - 1);
      // 首尾都放不下：只保留最近的日期，避免画出一团重叠文字
      if (last.left - first.right < SPACING) return [last];
      var stride = Math.max(1, Math.ceil(n / 8));
      var out = [first];
      var prevRight = first.right;
      for (var i = stride; i < n - 1; i += stride) {
        var cand = tickAt(i);
        if (cand.right + SPACING > last.left) break; // 不能压到最后一个日期
        if (cand.left < prevRight + SPACING) continue; // 与上一个太近
        out.push(cand);
        prevRight = cand.right;
      }
      out.push(last);
      return out;
    }

    // ── 近 30 天消耗趋势图（canvas 堆叠柱状：高峰橙 + 空闲蓝）──
    var TREND_COLORS = { peak: C.warn, off: C.accent };
    function TrendChart(props) {
      var days = props.days || [];
      var canvasRef = React.useRef(null);
      var wrapRef = React.useRef(null);
      var tipState = React.useState(null);
      var tip = tipState[0], setTip = tipState[1];
      var rangeState = React.useState(props.range || 30);
      var range = rangeState[0], setRange = rangeState[1];
      // 组装最近 N 天（含无记录日），时间正序
      function buildSeries() {
        var N = range, map = {}, out = [];
        for (var i = 0; i < days.length; i++) map[days[i].day] = days[i];
        var nowKey = bjKey(Date.now());
        var p = nowKey.split("-");
        var base = Date.UTC(+p[0], +p[1] - 1, +p[2]) - 8 * 3600 * 1000;
        for (var k = N - 1; k >= 0; k--) {
          var ms = base - k * 86400000;
          var d = new Date(ms + 8 * 3600 * 1000);
          var key = d.getUTCFullYear() + "-" + pad2(d.getUTCMonth() + 1) + "-" + pad2(d.getUTCDate());
          var rec = map[key];
          var split = daySplit(rec, props.regime || "auto");
          out.push({ key: key, peak: split.peak, off: split.off, total: split.peak + split.off, calls: rec ? (rec.calls || 0) : 0 });
        }
        return out;
      }
      function redraw() {
        var node = canvasRef.current, wrap = wrapRef.current;
        if (!node || !wrap) return;
        var series = buildSeries();
        var cssW = wrap.clientWidth || 600, cssH = 190;
        var dpr = (typeof window !== "undefined" && window.devicePixelRatio) || 1;
        node.width = Math.round(cssW * dpr);
        node.height = Math.round(cssH * dpr);
        node.style.width = cssW + "px";
        node.style.height = cssH + "px";
        var ctx = node.getContext("2d");
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssW, cssH);
        var lightBg = isLightBackground();
        var inkMuted = lightBg ? "rgba(128,128,128,.6)" : "rgba(215,222,232,.6)";
        var gridColor = lightBg ? "rgba(128,128,128,.15)" : "rgba(255,255,255,.15)";
        var emptyColor = lightBg ? "rgba(128,128,128,.5)" : "rgba(215,222,232,.55)";
        var padL = 54, padR = 10, padT = 18, padB = 24;
        var chartW = cssW - padL - padR, chartH = cssH - padT - padB;
        var maxV = 0;
        for (var i = 0; i < series.length; i++) if (series[i].total > maxV) maxV = series[i].total;
        if (maxV <= 0) {
          ctx.fillStyle = emptyColor;
          ctx.font = "12px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(t("暂无数据"), cssW / 2, cssH / 2);
          node.__series = null;
          return;
        }
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.fillStyle = inkMuted;
        ctx.font = "10px sans-serif";
        ctx.textAlign = "right";
        for (var g = 0; g <= 4; g++) {
          var gy = padT + chartH - (chartH * g / 4);
          ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(cssW - padR, gy); ctx.stroke();
          ctx.fillText(fmtMoney(maxV * g / 4).replace("¥", ""), padL - 6, gy + 3);
        }
        var bw = Math.max(1, Math.min(14, (chartW - 6) / series.length - 2));
        var gap = bw + 2, totalW = gap * series.length - 2, x0 = padL + (chartW - totalW) / 2;
        for (var s = 0; s < series.length; s++) {
          var it = series[s], x = x0 + s * gap;
          var offH = it.off > 0 ? (it.off / maxV * chartH) : 0;
          var peakH = it.peak > 0 ? (it.peak / maxV * chartH) : 0;
          var yBottom = padT + chartH;
          if (offH > 0) { ctx.fillStyle = TREND_COLORS.off; ctx.fillRect(x, yBottom - offH, bw, offH); }
          if (peakH > 0) { ctx.fillStyle = TREND_COLORS.peak; ctx.fillRect(x, yBottom - offH - peakH, bw, peakH); }
        }
        // 日期刻度：按实测文字宽度排布，避免窄图下最后两个日期重叠
        ctx.font = "10px sans-serif";
        var ticks = trendDateTicks(series, x0, gap, bw, padL, cssW - padR, function (text) { return ctx.measureText(text).width; });
        ctx.fillStyle = inkMuted;
        ctx.textAlign = "center";
        for (var ti = 0; ti < ticks.length; ti++) ctx.fillText(ticks[ti].text, ticks[ti].x, cssH - 6);
        node.__series = series; node.__x0 = x0; node.__gap = gap; node.__bw = bw; node.__padT = padT; node.__chartH = chartH;
      }
      React.useEffect(function () {
        redraw();
        function onResize() { redraw(); }
        if (typeof window !== "undefined") window.addEventListener("resize", onResize);
        return function () { if (typeof window !== "undefined") window.removeEventListener("resize", onResize); };
      }, [days, props.regime, range]);
      function onMove(e) {
        var node = canvasRef.current;
        if (!node || !node.__series) return;
        var rect = node.getBoundingClientRect();
        var idx = Math.floor((e.clientX - rect.left - node.__x0) / node.__gap);
        if (idx < 0 || idx >= node.__series.length) { setTip(null); return; }
        var it = node.__series[idx];
        setTip({ left: node.__x0 + idx * node.__gap + node.__bw / 2, text: dayLabel(it.key) + "\n" + t("总消耗 ") + fmtMoney(it.total) + "（" + t("高峰 ") + fmtMoney(it.peak) + " · " + t("空闲 ") + fmtMoney(it.off) + "）\n" + t("调用 ") + it.calls + t(" 次") });
      }
      return el("div", { style: { minWidth: 0 } },
        el("div", { style: st.calBar, marginTop: 0 },
          el("div", { style: st.seg },
            [7, 30, 90].map(function (n) {
              return el("button", { key: n, style: range === n ? st.segBtnOn : st.segBtn, onClick: function () { setRange(n); } }, n + t("天"));
            })
          )
        ),
        el("div", { style: { position: "relative", minWidth: 0 }, ref: wrapRef },
          el("canvas", { ref: canvasRef, style: st.chartCanvas, onMouseMove: onMove, onMouseLeave: function () { setTip(null); } }),
          tip ? el("div", { style: { position: "absolute", top: 4, left: Math.max(0, Math.min(tip.left - 90, (wrapRef.current ? wrapRef.current.clientWidth - 220 : 220))), background: "rgba(20,24,32,.92)", color: "#fff", borderRadius: 6, padding: "6px 10px", fontSize: fs(FS.sm), lineHeight: 1.6, whiteSpace: "pre", pointerEvents: "none", zIndex: 5, maxWidth: "92%" } }, tip.text) : null
        )
      );
    }

    // ── 模型消耗占比环形图（canvas 环形 + HTML 图例）──
    var DONUT_COLORS = [C.accent, C.warn, C.ok, C.danger, "#9b59b6", "#00d2ff", "#e84393", "#fdcb6e", "#6c5ce7", "#00b894"];
    function DonutChart(props) {
      var rows = props.rows || [];
      var canvasRef = React.useRef(null);
      var modeState = React.useState("cost");
      var mode = modeState[0], setMode = modeState[1];
      function totalVal() { var s = 0; for (var i = 0; i < rows.length; i++) s += (mode === "calls" ? (rows[i].calls || 0) : rows[i].cost); return s; }
      function draw() {
        var node = canvasRef.current;
        if (!node) return;
        var total = totalVal();
        var cssW = 176, cssH = 176;
        var dpr = (typeof window !== "undefined" && window.devicePixelRatio) || 1;
        node.width = Math.round(cssW * dpr);
        node.height = Math.round(cssH * dpr);
        node.style.width = cssW + "px";
        node.style.height = cssH + "px";
        var ctx = node.getContext("2d");
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssW, cssH);
        var cx = cssW / 2, cy = cssH / 2, r = 68, inner = 44;
        var start = -Math.PI / 2;
        for (var i2 = 0; i2 < rows.length; i2++) {
          var v = mode === "calls" ? (rows[i2].calls || 0) : rows[i2].cost;
          var slice = total > 0 ? (v / total * Math.PI * 2) : (2 * Math.PI / Math.max(rows.length, 1));
          ctx.beginPath();
          ctx.arc(cx, cy, r, start, start + slice);
          ctx.arc(cx, cy, inner, start + slice, start, true);
          ctx.closePath();
          ctx.fillStyle = DONUT_COLORS[i2 % DONUT_COLORS.length];
          ctx.fill();
          start += slice;
        }
        var lightBg = isLightBackground();
        var inkMain = lightBg ? "#1c2733" : "#e6ebf2";
        var inkMuted = lightBg ? "rgba(28,39,51,.6)" : "rgba(225,231,240,.6)";
        if (total <= 0) {
          ctx.strokeStyle = lightBg ? "rgba(128,128,128,.2)" : "rgba(255,255,255,.22)";
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(cx, cy, (r + inner) / 2, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.fillStyle = inkMain; ctx.font = "700 15px sans-serif"; ctx.textAlign = "center";
        ctx.fillText(total > 0 ? (mode === "calls" ? fmtInt(total) : fmtMoney(total)) : "—", cx, cy - 2);
        ctx.fillStyle = inkMuted; ctx.font = "10px sans-serif";
        ctx.fillText(mode === "calls" ? t("调用次数") : t("总消耗"), cx, cy + 13);
      }
      React.useEffect(function () {
        draw();
        function onResize() { draw(); }
        if (typeof window !== "undefined") window.addEventListener("resize", onResize);
        return function () { if (typeof window !== "undefined") window.removeEventListener("resize", onResize); };
      }, [rows, mode]);
      var tot = totalVal();
      return el("div", { style: { minWidth: 0 } },
        el("div", { style: Object.assign({}, st.calBar, { marginTop: 0, justifyContent: "center" }) },
          el("div", { style: st.seg },
            el("button", { style: mode === "cost" ? st.segBtnOn : st.segBtn, onClick: function () { setMode("cost"); } }, t("按消耗")),
            el("button", { style: mode === "calls" ? st.segBtnOn : st.segBtn, onClick: function () { setMode("calls"); } }, t("按调用数"))
          )
        ),
        el("div", { style: { display: "flex", justifyContent: "center" } },
          el("canvas", { ref: canvasRef, style: { width: 176, height: 176, display: "block" } })
        ),
        rows.length ? el("div", { style: st.legendRow },
          rows.slice(0, 10).map(function (r, idx) {
            var v = mode === "calls" ? (r.calls || 0) : r.cost;
            var p = tot > 0 ? Math.round(v / tot * 100) : 0;
            var nm = r.name || r.key || "—";
            return el("span", { key: "d-" + idx, title: nm, style: { display: "inline-flex", alignItems: "center", gap: 5, maxWidth: "100%" } },
              el("span", { style: Object.assign({}, st.legendDot, { background: DONUT_COLORS[idx % DONUT_COLORS.length] }) }),
              el("span", { style: { overflowWrap: "anywhere" } }, nm + " " + p + "%")
            );
          }),
          rows.length > 10 ? el("span", null, "…") : null
        ) : null
      );
    }

    // ── 会话消耗排行 Top 10 ──
    function SessionRank(props) {
      var records = props.records || [], regime = props.regime || "auto";
      var bySid = {};
      for (var si = 0; si < records.length; si++) {
        var r = records[si];
        var sid = String(r.sessionId || "").trim();
        if (!sid) continue;
        var c = costOf(r, regime);
        var g = bySid[sid];
        if (!g) { g = bySid[sid] = { sid: sid, cost: 0, calls: 0, last: 0, tokens: 0 }; }
        g.cost += c; g.calls += 1; if (r.time > g.last) g.last = r.time;
        // 四桶互斥求和：不含 reasoningTokens —— 宿主 outputTokens 就是上游的
        // completion_tokens，reasoning 是它的子集，再加一遍等于凭空多算一笔。
        g.tokens += (r.inputTokens || 0) + (r.outputTokens || 0) + (r.cacheReadTokens || 0) + (r.cacheWriteTokens || 0);
      }
      var rows = [];
      for (var k in bySid) rows.push(bySid[k]);
      rows.sort(function (a, b) { return b.cost - a.cost || b.last - a.last; });
      rows = rows.slice(0, 10);
      if (rows.length === 0) return null;
      var maxCost = rows[0].cost;
      return el("div", { style: st.sessionCard },
        el("div", { style: st.chartPanelTitle }, t("会话消耗排行") + " · Top " + rows.length),
        rows.map(function (row, idx) {
          var pctv = maxCost > 0 ? Math.round(row.cost / maxCost * 100) : 0;
          var label = row.sid;
          if (label.length > 26) label = label.slice(0, 26) + "…";
          return el("div", { key: row.sid, style: st.sessionRow },
            el("span", { style: st.sessionName, title: row.sid }, (idx + 1) + ". " + label),
            el("div", { style: st.sessionBar },
              el("div", { style: Object.assign({}, st.sessionBarFill, { width: pctv + "%" }) })
            ),
            el("span", { style: st.sessionSub, title: t("总 token") + ": " + fmtInt(row.tokens) }, fmtInt(row.calls) + t(" 次 · ") + fmtInt(row.tokens) + " tok"),
            el("span", { style: st.sessionCost }, fmtMoney(row.cost))
          );
        })
      );
    }

    // ── 共享聚合：概览页与明细页都按"同一次筛选结果"统计，避免各算一遍 ──
    function aggregateRecords(records, regime) {
      var totalCalls = records.length;
      var totalInterrupted = 0;
      var totalHit = 0, totalMiss = 0, totalWrite = 0, totalOut = 0, totalReason = 0, totalCost = 0, peakTotal = 0, offTotal = 0, peakCalls = 0, offCalls = 0;
      var byModel = {}, byProvider = {}, byProviderModel = {};
      for (var i = 0; i < records.length; i++) {
        var r = records[i];
        if (r.interrupted) totalInterrupted += 1;
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
      // 环形图：按消耗降序
      var donutRows = [];
      for (var dr = 0; dr < modelRows.length; dr++) donutRows.push({ key: modelRows[dr].key, name: modelRows[dr].name, cost: modelRows[dr].cost, calls: modelRows[dr].calls });
      donutRows.sort(function (a, b) { return b.cost - a.cost || (a.key < b.key ? -1 : 1); });
      for (var mr = 0; mr < modelRows.length; mr++) {
        var pset = {};
        for (var rr = 0; rr < records.length; rr++) {
          if (modelGroupKey(records[rr]) === modelRows[mr].key) pset[providerName(records[rr].provider)] = true;
        }
        modelRows[mr].providerText = Object.keys(pset).sort().join(" / ") || t("未知服务商");
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
      return {
        totalCalls: totalCalls, totalInterrupted: totalInterrupted,
        totalHit: totalHit, totalMiss: totalMiss, totalWrite: totalWrite, totalOut: totalOut,
        totalReason: totalReason, totalCost: totalCost,
        peakTotal: peakTotal, offTotal: offTotal, peakCalls: peakCalls, offCalls: offCalls,
        hitRate: hitRate, modelRows: modelRows, donutRows: donutRows,
        providerRows: providerRows, providerGroups: providerGroups
      };
    }

    // ── 明细视图（按模型 / 按服务商）──
    // 表格原本长在概览页里，与"今天花了多少"混在一起；现在独立成"明细"页签。
    function BreakdownView(props) {
      var records = props.records || [], regime = props.regime;
      var modeState = React.useState("model");
      var mode = modeState[0], setMode = modeState[1];
      // 切换「按模型 / 按服务商」时不必重新聚合整份记录
      var agg = React.useMemo(function () {
        return aggregateRecords(records, regime);
      }, [props.records, regime]);
      var modelRows = agg.modelRows, providerRows = agg.providerRows;
      var totalCalls = agg.totalCalls, totalMiss = agg.totalMiss, totalHit = agg.totalHit;
      var totalOut = agg.totalOut, totalReason = agg.totalReason, totalCost = agg.totalCost;
      var peakTotal = agg.peakTotal, offTotal = agg.offTotal, peakCalls = agg.peakCalls, offCalls = agg.offCalls;

      var pmRows = [];
      for (var gi = 0; gi < agg.providerGroups.length; gi++) {
        var g = agg.providerGroups[gi];
        var gprov2 = g.provider;
        pmRows.push(el("tr", { key: "g-" + gprov2.key },
          el("td", { style: st.tdGroup }, gprov2.name),
          el("td", { style: st.tdGroup }, "（" + g.models.length + t(" 个模型）")),
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
        el("td", { style: st.tdTotalFirst }, t("总费用合计")),
        el("td", { style: st.tdTotal }, fmtInt(providerRows.length) + t(" 个服务商")),
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
        el("div", { style: st.calBar },
          el("div", { style: st.seg },
            el("button", { style: mode === "model" ? st.segBtnOn : st.segBtn, onClick: function () { setMode("model"); } }, t("按模型")),
            el("button", { style: mode === "provider" ? st.segBtnOn : st.segBtn, onClick: function () { setMode("provider"); } }, t("按服务商"))
          ),
          el("span", { style: st.note }, fmtInt(modelRows.length) + t(" 个模型") + " · " + fmtInt(providerRows.length) + t(" 个服务商") + " · " + fmtInt(totalCalls) + t(" 条记录"))
        ),
        mode === "model"
          ? el("div", { style: st.scroll },
              el("table", { className: "dsh-usage-table collapse-mobile", style: st.tbl },
                el("thead", null, el("tr", null,
                  el("th", { style: st.thFirst }, t("模型")), el("th", { style: st.thFirst }, t("API 服务商")), el("th", { style: st.th }, t("调用")), el("th", { style: st.th }, t("高峰/空闲")),
                  el("th", { style: st.th }, t("输入·未命中")), el("th", { style: st.th }, t("缓存命中")), el("th", { style: st.th }, t("输出")), el("th", { style: st.th }, t("推理")),
                  el("th", { style: st.th }, t("高峰消耗")), el("th", { style: st.th }, t("空闲消耗")), el("th", { style: st.th }, t("总消耗"))
                )),
                el("tbody", null,
                  modelRows.map(function (m) {
                    return el("tr", { key: m.key },
                      el("td", { style: st.tdModelName, title: m.name }, m.name),
                      el("td", { style: st.tdModelProvider, title: m.providerText }, m.providerText),
                      el("td", { style: st.td }, fmtInt(m.calls)),
                      el("td", { style: st.td }, el("span", { style: st.badgePeak }, fmtInt(m.peakCalls)), " / ", el("span", { style: st.badgeValley }, fmtInt(m.offCalls))),
                      el("td", { style: st.td }, fmtInt(m.miss)),
                      el("td", { style: st.td }, el("span", { style: st.badgeHit }, fmtInt(m.hit))),
                      el("td", { style: st.td }, fmtInt(m.out)),
                      el("td", { style: st.td }, m.reason ? fmtInt(m.reason) : "—"),
                      el("td", { style: st.td }, fmtMoney(m.peakCost)),
                      el("td", { style: st.td }, fmtMoney(m.offCost)),
                      el("td", { style: Object.assign({}, st.td, { fontWeight: 600, color: C.accentText }) }, fmtMoney(m.cost))
                    );
                  }),
                  el("tr", null,
                    el("td", { style: st.tdTotalFirst }, t("合计")),
                    el("td", { style: st.tdTotalFirst }, fmtInt(providerRows.length) + t(" 个服务商")),
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
            )
          : el("div", { style: st.scroll },
              el("table", { className: "dsh-usage-table collapse-mobile", style: st.tbl },
                el("thead", null, el("tr", null,
                  el("th", { style: st.thFirst }, t("API 服务商")), el("th", { style: st.thFirst }, t("模型")), el("th", { style: st.th }, t("调用")), el("th", { style: st.th }, t("高峰/空闲")),
                  el("th", { style: st.th }, t("输入·未命中")), el("th", { style: st.th }, t("缓存命中")), el("th", { style: st.th }, t("输出")), el("th", { style: st.th }, t("推理")),
                  el("th", { style: st.th }, t("高峰消耗")), el("th", { style: st.th }, t("空闲消耗")), el("th", { style: st.th }, t("总消耗"))
                )),
                el("tbody", null, pmRows)
              )
            )
      );
    }

    // ── Overview view ──
    function OverviewView(props) {
      var allRecords = props.records, regime = props.regime;
      var days = props.days || [], budget = props.budget || null;
      var toolCalls = props.toolCalls || [];
      var toolOpenState = React.useState(false);
      var toolOpen = toolOpenState[0], setToolOpen = toolOpenState[1];
      var presetState = React.useState("all");
      var preset = presetState[0], setPreset = presetState[1];
      var fromState = React.useState("");
      var fromDate = fromState[0], setFromDate = fromState[1];
      var toState = React.useState("");
      var toDate = toState[0], setToDate = toState[1];
      // 口径提示默认收起：只有存在估算记录或旧记录时才出现
      var scopeState = React.useState(false);
      var scopeOpen = scopeState[0], setScopeOpen = scopeState[1];

      var nowPeriod = periodNow(Date.now());
      // 本月（北京时间自然月）已消耗 / 调用 / 日均 / 峰值日：不受概览日期筛选影响
      var monthCost = 0, monthCalls = 0, monthDayMap = {};
      var nowB = new Date(Date.now() + 8 * 3600 * 1000);
      var ymPrefix = nowB.getUTCFullYear() + "-" + pad2(nowB.getUTCMonth() + 1);
      var monthStartMs = Date.UTC(nowB.getUTCFullYear(), nowB.getUTCMonth(), 1) - 8 * 3600 * 1000;
      var prevMonthStartMs = Date.UTC(nowB.getUTCFullYear(), nowB.getUTCMonth() - 1, 1) - 8 * 3600 * 1000;
      var prevMonthCost = 0;
      for (var mi = 0; mi < allRecords.length; mi++) {
        var mr = allRecords[mi];
        var mk2 = bjKey(mr.time);
        if (mk2.indexOf(ymPrefix) === 0) {
          var mc = costOf(mr, "auto");
          monthCost += mc;
          monthCalls += 1;
          if (!monthDayMap[mk2]) monthDayMap[mk2] = 0;
          monthDayMap[mk2] += mc;
        } else if (mr.time >= prevMonthStartMs && mr.time < monthStartMs) {
          prevMonthCost += costOf(mr, "auto");
        }
      }
      var moDelta = prevMonthCost > 0 ? (monthCost - prevMonthCost) / prevMonthCost * 100 : null;
      var peakDayKey = "", peakDayCost = 0;
      for (var pdk in monthDayMap) { if (monthDayMap[pdk] > peakDayCost) { peakDayCost = monthDayMap[pdk]; peakDayKey = pdk; } }
      var monthAvgCost = nowB.getUTCDate() > 0 ? monthCost / nowB.getUTCDate() : 0;
      var budgetPct = budget && budget.monthly > 0 ? Math.min(100, monthCost / budget.monthly * 100) : 0;
      function budgetStyle() {
        if (budgetPct >= 100) return st.budgetHeroFillDanger;
        if (budgetPct >= 80) return st.budgetHeroFillWarn;
        return st.budgetHeroFill;
      }
      function budgetText() {
        if (budgetPct >= 100) return t("超支 ") + fmtMoney(monthCost - budget.monthly);
        return t("已用 ") + budgetPct.toFixed(0) + "% · " + t("剩余 ") + fmtMoney(budget.monthly - monthCost);
      }

      var nowKey = bjKey(Date.now());
      var fromMs = null, toMs = null;
      if (preset === "today") { fromMs = bjStartMs(nowKey); toMs = Date.now(); }
      else if (preset === "7d") { fromMs = bjStartMs(nowKey) - 6 * 86400000; toMs = Date.now(); }
      else if (preset === "30d") { fromMs = bjStartMs(nowKey) - 29 * 86400000; toMs = Date.now(); }
      else if (preset === "custom") {
        if (fromDate) fromMs = bjStartMs(fromDate);
        if (toDate) toMs = bjStartMs(toDate) + 86400000 - 1;
      }
      var records = [];
      for (var fi = 0; fi < allRecords.length; fi++) {
        var fr = allRecords[fi];
        if (fromMs != null && fr.time < fromMs) continue;
        if (toMs != null && fr.time > toMs) continue;
        records.push(fr);
      }
      // 聚合统一走 aggregateRecords()：概览页与明细页用的是同一套口径，
      // 不再各自复制一遍这个分组循环。用 useMemo 绑定"真正影响结果"的输入，
      // 展开抽屉、切换显示模式等本页 state 变化时不再重算上万条记录。
      var agg = React.useMemo(function () {
        return aggregateRecords(records, regime);
      }, [allRecords, preset, fromDate, toDate, regime]);
      var totalCalls = agg.totalCalls, totalInterrupted = agg.totalInterrupted;
      var totalHit = agg.totalHit, totalMiss = agg.totalMiss, totalWrite = agg.totalWrite;
      var totalOut = agg.totalOut, totalReason = agg.totalReason, totalCost = agg.totalCost;
      var peakTotal = agg.peakTotal, offTotal = agg.offTotal, peakCalls = agg.peakCalls, offCalls = agg.offCalls;
      var hitRate = agg.hitRate, modelRows = agg.modelRows, donutRows = agg.donutRows;
      var providerRows = agg.providerRows;
      // 估算记录（DeepSeek 搜索后端）：token 与费用都只是下限估算，不是上游实测值。
      // 必须与实测记录分开点名说明，否则用户会把估算当成账单。
      var estCalls = 0, estCost = 0;
      for (var esti = 0; esti < records.length; esti++) {
        var estr = records[esti];
        if (!estr.estimated) continue;
        estCalls += 1;
        estCost += costOf(estr, regime);
      }
      // 内部工具/占位调用（单独一个可折叠分组）
      var toolAgg = {};
      for (var ti = 0; ti < toolCalls.length; ti++) {
        var tr = toolCalls[ti];
        var tk = (tr.provider || '') + '|' + (tr.model || '');
        var tg = toolAgg[tk];
        if (!tg) { tg = toolAgg[tk] = { provider: tr.provider || '—', model: tr.model || '—', calls: 0, cost: 0 }; }
        tg.calls += 1; tg.cost += tr.autoCost || 0;
      }
      var toolRows = [];
      for (var tki in toolAgg) toolRows.push(toolAgg[tki]);
      toolRows.sort(function (a, b) { return b.calls - a.calls || (a.provider < b.provider ? -1 : 1); });
      function presetBtn(k, label) {
        return el("button", { style: preset === k ? st.segBtnOn : st.segBtn, onClick: function () { setPreset(k); } }, label);
      }
      function setCustomFrom(v) { setFromDate(v); setPreset("custom"); }
      function setCustomTo(v) { setToDate(v); setPreset("custom"); }

      return el("div", null,
        el("div", { style: st.calBar },
          el("div", { style: st.seg },
            presetBtn("today", t("今天")), presetBtn("7d", t("近7天")), presetBtn("30d", t("近30天")), presetBtn("all", t("全部"))
          ),
          el("span", { style: st.note }, t("自定义区间：")),
          el("input", { type: "date", style: st.dateInput, value: fromDate, onChange: function (e) { setCustomFrom(e.target.value); } }),
          el("span", { style: st.note }, t("至")),
          el("input", { type: "date", style: st.dateInput, value: toDate, onChange: function (e) { setCustomTo(e.target.value); } }),
          (fromDate || toDate || preset !== "all") ? el("button", { style: st.btn, onClick: function () { setFromDate(""); setToDate(""); setPreset("all"); } }, t("清除筛选")) : null
        ),
        el("div", { style: st.note, marginTop: 8 },
          t("当前范围：共 ") + fmtInt(records.length) + t(" 条") + (preset === "all" && !fromDate && !toDate ? t("（全部记录）") : "") + t(" · 总消耗 ") + fmtMoney(totalCost) + "（" + costHint(regime) + "）"
        ),
        // 一行摘要：本月已消耗 + 预算进度 + 当前时段。
        // 原先这里是一块高饱和蓝色 hero 卡（月初几乎恒显示 ¥0.0000）+ 独立预算卡，
        // 视觉权重过高却信息量很低。
        el("div", { style: st.summaryStrip },
          el("div", { style: st.summaryMain },
            el("span", { style: st.summaryLabel }, t("本月已消耗")),
            el("span", { style: st.summaryValue }, fmtMoney(monthCost)),
            monthCalls ? el("span", { style: st.summarySub }, fmtInt(monthCalls) + t(" 次")) : null,
            moDelta != null ? el("span", { style: moDelta > 0 ? st.badgeUp : st.badgeDown }, (moDelta > 0 ? "▲ " : "▼ ") + Math.abs(moDelta).toFixed(1) + "% " + t("较上月")) : null
          ),
          budget && budget.monthly > 0
            ? el("div", { style: st.summaryBudget },
                el("div", { style: Object.assign({}, st.budgetHeroBar, { flex: 1 }) },
                  el("div", { style: Object.assign({}, budgetStyle(), { width: Math.max(budgetPct > 0 ? 4 : 0, budgetPct) + "%" }) })
                ),
                el("span", { style: st.summarySub }, budgetText())
              )
            : null,
          el("span", { style: nowPeriod.peak ? st.badgePeak : st.badgeValley }, t("当前 · ") + t(nowPeriod.label))
        ),
        // 关键指标：只保留 4 张卡。原先这里是「3 张大卡 + 4 张卡 + 5 格 token 条」，
        // 同一批数字铺了三层；高峰/空闲、未命中/输出/推理都收进对应的 hint。
        el("div", { style: st.cards, marginTop: 10 },
          el(Card, {
            primary: true,
            label: t("总消耗"),
            value: fmtMoney(totalCost),
            hint: t("高峰 ") + fmtMoney(peakTotal) + t(" · 空闲 ") + fmtMoney(offTotal)
          }),
          el(Card, {
            label: t("调用次数"),
            value: fmtInt(totalCalls),
            hint: t("高峰 ") + fmtInt(peakCalls) + t(" · 空闲 ") + fmtInt(offCalls) + (totalInterrupted > 0 ? t(" · 中断 ") + fmtInt(totalInterrupted) + t("（未计费）") : "")
          }),
          el(Card, { label: t("缓存命中率"), value: hitRate, hint: t("输入 · 缓存命中 ") + fmtInt(totalHit) }),
          el(Card, {
            label: t("总 token"),
            value: fmtInt(totalMiss + totalHit + totalWrite + totalOut),
            hint: t("未命中 ") + fmtInt(totalMiss) + t(" · 输出 ") + fmtInt(totalOut) + (totalReason ? t(" · 推理 ") + fmtInt(totalReason) : "")
          })
        ),
        // 口径提示：只有"确实需要说明"时才出现（估算记录 / 旧记录缺冻结单价），
        // 两条合并进同一个抽屉、默认收起，不再各占一块橙色告警框。
        (estCalls > 0 || props.legacyPricingCount > 0)
          ? el("div", { style: st.scopeBar },
              el("button", { style: scopeOpen ? st.btnPrimary : st.btn, onClick: function () { setScopeOpen(!scopeOpen); } },
                t("统计口径提示")
                + (estCalls > 0 ? " · " + fmtInt(estCalls) + t(" 次估算") : "")
                + (props.legacyPricingCount > 0 ? " · " + fmtInt(props.legacyPricingCount) + t(" 条无冻结单价") : "")),
              el("span", { style: st.note }, t("金额以 DeepSeek 官方后台账单为准"))
            )
          : null,
        (estCalls > 0 || props.legacyPricingCount > 0) && scopeOpen
          ? el("div", { style: Object.assign({}, st.diffbox, { marginTop: 8 }) },
              estCalls > 0
                ? el("div", null,
                    el("div", { style: st.diffboxTitle }, t("统计口径：web_search 搜索后端未纳入精确统计")),
                    el("div", { style: st.diffboxText },
                      t("DeepSeek 搜索后端调用由 Harness 用原生请求直连官方接口，响应用量未持久化到会话日志，插件无法取到实际 token。此处只记录次数，并按请求体给出输入侧下限估算：共 ")
                        + fmtInt(estCalls) + t(" 次，估算消耗 ≥ ") + fmtMoney(estCost)
                        + t("。搜索在服务端注入检索结果并可能多轮生成，输入与输出都会高于此值，官方账单必然更高。")),
                    el("div", { style: st.diffboxWarn }, t("该部分为估算下限，请以 DeepSeek 官方后台账单为准。")))
                : null,
              props.legacyPricingCount > 0
                ? el("div", { style: { marginTop: estCalls > 0 ? 8 : 0 } },
                    el("div", { style: st.diffboxTitle }, t("历史价格提示")),
                    el("div", { style: st.diffboxText },
                      t("有 ") + fmtInt(props.legacyPricingCount) + t(" 条记录没有冻结单价（旧版本写入或手工导入），它们的费用按当前价格表计算，改动价格表后会跟着变化；新记录已冻结写入时生效的单价，不受后续改价影响。")))
                : null,
              el("div", { style: st.diffboxText, marginTop: 8 },
                t("计价说明：DeepSeek 官方请求按官方峰谷价；SiliconFlow 按自身人民币公开价；DigitalOcean 按美元公开价 × USD/CNY 汇率折算人民币；千问暂不计费；AMD GPU Cloud DeepSeek V4 Flash 免费按 ¥0。"))
            )
          : null,
        el("div", { style: st.chartGrid },
          el("div", { style: st.chartPanel },
            el("div", { style: st.chartPanelTitle }, t("消耗趋势（近 30 天）")),
            el(TrendChart, { days: days, regime: regime })
          ),
          el("div", { style: st.chartPanel },
            el("div", { style: st.chartPanelTitle }, t("模型消耗占比")),
            el(DonutChart, { rows: donutRows })
          )
        ),
        // 明细表格已移到「明细」页签（BreakdownView）——概览页只留"看趋势 + 看结论"。
        el(SessionRank, { records: records, regime: regime }),
        toolCalls.length ? el("div", { style: st.sec, marginTop: 14 },
          el("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
            el("span", { style: { fontSize: fs(FS.lg), fontWeight: 600 } }, t("工具调用（内部）") + " · " + fmtInt(toolCalls.length) + t(" 条内部调用")),
            el("button", { style: st.btn, onClick: function () { setToolOpen(!toolOpen); } }, toolOpen ? t("收起") : t("展开"))
          ),
          toolOpen ? el("div", { style: st.scroll },
            el("table", { className: "dsh-usage-table collapse-mobile", style: st.tbl },
              el("thead", null, el("tr", null,
                el("th", { style: st.thFirst }, t("API 服务商 / 模型")),
                el("th", { style: st.th }, t("调用")),
                el("th", { style: st.th }, t("总消耗"))
              )),
              el("tbody", null, toolRows.map(function (tg, idx) {
                return el("tr", { key: String(idx) },
                  el("td", { style: st.tdFirst }, tg.model + " · " + tg.provider),
                  el("td", { style: st.td }, fmtInt(tg.calls)),
                  el("td", { style: st.td }, fmtMoney(tg.cost))
                );
              }))
            )
          ) : null
        ) : null
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
      var presetState = React.useState("all");
      var preset = presetState[0], setPreset = presetState[1];
      var fromState = React.useState("");
      var fromDate = fromState[0], setFromDate = fromState[1];
      var toState = React.useState("");
      var toDate = toState[0], setToDate = toState[1];

      // 日期范围筛选：预设（今天/近7天/近30天/全部）+ 自定义起止，影响每日统计表与顶部卡片。
      var nowKey = bjKey(Date.now());
      var fromMs = null, toMs = null;
      if (preset === "today") { fromMs = bjStartMs(nowKey); toMs = Date.now(); }
      else if (preset === "7d") { fromMs = bjStartMs(nowKey) - 6 * 86400000; toMs = Date.now(); }
      else if (preset === "30d") { fromMs = bjStartMs(nowKey) - 29 * 86400000; toMs = Date.now(); }
      else if (preset === "custom") {
        if (fromDate) fromMs = bjStartMs(fromDate);
        if (toDate) toMs = bjStartMs(toDate) + 86400000 - 1;
      }
      var rangeActive = preset !== "all" || fromDate || toDate;
      function inRangeKey(key) {
        if (!rangeActive) return true;
        var ms = bjStartMs(key);
        if (fromMs != null && ms < fromMs) return false;
        if (toMs != null && ms > toMs) return false;
        return true;
      }

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
        var inR2 = inRangeKey(key2);
        var v2 = r2 && inR2 ? dayVal(r2) : 0;
        if (v2 > maxV) maxV = v2;
        if (r2 && inR2) {
          monthCalls += r2.calls; monthMiss += r2.miss; monthHit += r2.hit; monthOut += r2.out;
          monthPeakCalls += r2.peakCalls || 0; monthOffCalls += r2.offPeakCalls || 0;
          var ds2 = daySplit(r2, regime, splitMap[key2]);
          monthPeak += ds2.peak; monthOff += ds2.off;
        }
      }
      monthCost = monthPeak + monthOff;

      var weeks = weekdayLabels();
      var cells = [];
      for (var b = 0; b < offset; b++) cells.push(el("div", { key: "b" + b, style: st.calCellBlank }, ""));
      for (var d3 = 1; d3 <= nDays; d3++) {
        var key3 = y + "-" + pad2(m + 1) + "-" + pad2(d3);
        var r3 = dayMap[key3];
        var inR3 = inRangeKey(key3);
        var v3 = r3 && inR3 ? dayVal(r3) : 0;
        var inten = maxV > 0 ? v3 / maxV : 0;
        var bg = r3 && inR3 && v3 > 0 ? "rgba(46,134,222," + (0.12 + 0.66 * inten).toFixed(2) + ")" : "rgba(128,128,128,.06)";
        var fg = inten > 0.5 ? "#fff" : "inherit";
        var tip = r3 && inR3
          ? (function () {
              var ds3 = daySplit(r3, regime, splitMap[key3]);
              return dayLabel(key3) + t("\n调用 ") + r3.calls + t(" 次（高峰 ") + r3.peakCalls + t(" / 空闲 ") + r3.offPeakCalls + t("）\n输入·未命中 ") + fmtInt(r3.miss) + t(" · 缓存命中 ") + fmtInt(r3.hit) + t(" · 输出 ") + fmtInt(r3.out) + t(" · 推理 ") + fmtInt(r3.reason) + t("\n高峰消耗 ") + fmtMoney(ds3.peak) + t(" · 空闲消耗 ") + fmtMoney(ds3.off) + t(" · 合计 ") + fmtMoney(ds3.peak + ds3.off) + "（" + costHint(regime) + "）";
            })()
          : dayLabel(key3) + t("\n无记录");
        var isSel = selectedDay === key3;
        cells.push(el("div", {
          key: key3,
          title: tip,
          onClick: (function (k) { return function () { setSelectedDay(selectedDay === k ? null : k); }; })(key3),
          style: Object.assign({ background: bg, color: fg }, st.calCell, isSel ? st.calCellOn : null)
        },
          el("div", null, String(d3)),
          r3 && inR3 ? el("div", { style: st.calCellVal }, dimMode === "cost" ? fmtMoney(dayCost(r3)) : fmtInt(r3.calls)) : el("div", { style: st.calCellVal }, "—")
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

      // month daily stats (desc). 范围筛选激活时：跨月取范围内所有天数；否则取当前月。
      var monthRows = [];
      if (rangeActive) {
        for (var dk in dayMap) {
          var dv = dayMap[dk];
          if (dv && inRangeKey(dv.day)) monthRows.push(dv);
        }
      } else {
        for (var dd = 1; dd <= nDays; dd++) {
          var kd = y + "-" + pad2(m + 1) + "-" + pad2(dd);
          if (dayMap[kd]) monthRows.push(dayMap[kd]);
        }
      }
      monthRows.sort(function (a, b) { return a.day < b.day ? 1 : a.day > b.day ? -1 : 0; });
      // 范围激活时：顶部卡片汇总也按范围内所有天重新计算（覆盖当前月汇总）
      if (rangeActive) {
        monthCalls = 0; monthMiss = 0; monthHit = 0; monthOut = 0; monthPeak = 0; monthOff = 0; monthPeakCalls = 0; monthOffCalls = 0;
        for (var dk2 = 0; dk2 < monthRows.length; dk2++) {
          var dv2 = monthRows[dk2];
          monthCalls += dv2.calls; monthMiss += dv2.miss; monthHit += dv2.hit; monthOut += dv2.out;
          monthPeakCalls += dv2.peakCalls || 0; monthOffCalls += dv2.offPeakCalls || 0;
          var dsx = daySplit(dv2, regime, splitMap[dv2.day]);
          monthPeak += dsx.peak; monthOff += dsx.off;
        }
        monthCost = monthPeak + monthOff;
      }

      function prevMonth() { setYm({ y: m === 0 ? y - 1 : y, m: m === 0 ? 11 : m - 1 }); setSelectedDay(null); }
      function nextMonth() { setYm({ y: m === 11 ? y + 1 : y, m: m === 11 ? 0 : m + 1 }); setSelectedDay(null); }
      function goToday() { setYm({ y: nowY, m: nowM }); setSelectedDay(bjKey(Date.now())); }

      function presetBtn(k, label) {
        return el("button", { style: preset === k ? st.segBtnOn : st.segBtn, onClick: function () { setPreset(k); if (k !== "custom") { setFromDate(""); setToDate(""); } } }, label);
      }
      function setCustomFrom(v) { setFromDate(v); setPreset("custom"); }
      function setCustomTo(v) { setToDate(v); setPreset("custom"); }
      function rangeHintText() {
        var from = fromDate, to = toDate;
        if (preset === "today") { from = nowKey; to = nowKey; }
        else if (preset === "7d") { from = bjKey(bjStartMs(nowKey) - 6 * 86400000); to = nowKey; }
        else if (preset === "30d") { from = bjKey(bjStartMs(nowKey) - 29 * 86400000); to = nowKey; }
        return (from ? dayLabel(from) : "…") + " – " + (to ? dayLabel(to) : "…");
      }

      return el("div", null,
        el("div", { style: st.calBar },
          el("button", { style: st.btn, onClick: prevMonth }, t("‹ 上月")),
          el("span", { style: { fontSize: fs(FS.lg), fontWeight: 600, minWidth: 120, textAlign: "center" } }, fmtMonthLabel(y, m + 1)),
          el("button", { style: st.btn, onClick: nextMonth }, t("下月 ›")),
          el("button", { style: st.btn, onClick: goToday }, t("今天")),
          el("div", { style: st.seg, marginLeft: 8 },
            el("button", { style: dimMode === "cost" ? st.segBtnOn : st.segBtn, onClick: function () { setDim("cost"); } }, t("按消耗")),
            el("button", { style: dimMode === "calls" ? st.segBtnOn : st.segBtn, onClick: function () { setDim("calls"); } }, t("按调用数"))
          )
        ),
        el("div", { style: st.calBar },
          el("div", { style: st.seg },
            presetBtn("today", t("今天")), presetBtn("7d", t("近7天")), presetBtn("30d", t("近30天")), presetBtn("all", t("全部"))
          ),
          el("span", { style: st.note }, t("自定义区间：")),
          el("input", { type: "date", style: st.dateInput, value: fromDate, onChange: function (e) { setCustomFrom(e.target.value); } }),
          el("span", { style: st.note }, t("至")),
          el("input", { type: "date", style: st.dateInput, value: toDate, onChange: function (e) { setCustomTo(e.target.value); } }),
          (fromDate || toDate || preset !== "all") ? el("button", { style: st.btn, onClick: function () { setFromDate(""); setToDate(""); setPreset("all"); } }, t("清除筛选")) : null
        ),
        el("div", { style: st.calGrid },
          weeks.map(function (w) { return el("div", { key: w, style: st.calWk }, w); }),
          cells
        ),
        el("div", { style: st.legend },
          el("span", null, t("热力：")),
          el("span", { style: st.legendBar }),
          el("span", null, t("低 → 高（") + (dimMode === "cost" ? t("当日消耗") : t("当日调用数")) + "）"),
          el("span", null, t("· 悬停查看详情，点击某天查看当日调用"))
        ),
        el("div", { style: st.cards, marginTop: 12 },
          el(Card, { label: rangeActive ? t("范围内调用") : t("本月调用"), value: fmtInt(monthCalls), hint: t("高峰 ") + fmtInt(monthPeakCalls) + t(" · 空闲 ") + fmtInt(monthOffCalls) + (rangeActive ? " · " + rangeHintText() : " · " + fmtMonthLabel(y, m + 1)) }),
          el(Card, { label: t("输入 · 未命中"), value: fmtInt(monthMiss), hint: "token" }),
          el(Card, { label: t("输入 · 缓存命中"), value: fmtInt(monthHit), hint: "token" }),
          el(Card, { label: t("输出"), value: fmtInt(monthOut), hint: "token" }),
          el(Card, { label: t("高峰消耗"), value: fmtMoney(monthPeak), hint: t("工作日高峰 9:00–12:00、14:00–18:00 · 周末全天空闲价") }),
          el(Card, { label: t("空闲消耗"), value: fmtMoney(monthOff), hint: t("其余空闲时段") }),
          el(Card, { label: rangeActive ? t("范围内消耗") : t("本月消耗"), value: fmtMoney(monthCost), hint: t("高峰 + 空闲 · ") + costHint(regime) })
        ),
        el("div", { style: st.sec }, rangeActive
          ? (__LANG === "en" ? "Daily stats (" + rangeHintText() + ")" : t("每日统计（") + rangeHintText() + t("）"))
          : dailyStatsTitle(y, m + 1)),
        monthRows.length === 0
          ? el("div", { style: st.empty }, rangeActive ? t("该范围内暂无记录。") : t("本月暂无记录。"))
          : el("div", { style: st.scroll },
              el("table", { className: "dsh-usage-table collapse-mobile", style: st.tbl },
                el("thead", null, el("tr", null,
                  el("th", { style: st.thFirst }, t("日期")), el("th", { style: st.th }, t("调用")), el("th", { style: st.th }, t("高峰/空闲")), el("th", { style: st.th }, t("输入·未命中")), el("th", { style: st.th }, t("缓存命中")), el("th", { style: st.th }, t("输出")), el("th", { style: st.th }, t("高峰消耗")), el("th", { style: st.th }, t("空闲消耗")), el("th", { style: st.th }, t("总消耗(自动)"))
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
              el("div", { style: st.selDayTitle }, dayLabel(selectedDay) + t(" 调用明细")),
              el("div", { style: st.note, marginTop: 6 },
                t("高峰 ") + selPeakCalls + t(" 条 · ") + fmtMoney(selPeakCost) +
                t("　｜　空闲 ") + selOffCalls + t(" 条 · ") + fmtMoney(selOffCost) +
                t("　｜　合计 ") + fmtMoney(selPeakCost + selOffCost) + "（" + costHint(regime) + "）"),
              selRecords.length === 0
                ? el("div", { style: st.empty }, t("该日无记录。"))
                : el("div", { style: st.scroll },
                    el("table", { className: "dsh-usage-table collapse-mobile", style: st.tbl },
                      el("thead", null, el("tr", null,
                        el("th", { style: st.thFirst }, t("时间(北京)")), el("th", { style: st.thFirst }, t("模型")), el("th", { style: st.th }, t("输入·未命中")), el("th", { style: st.th }, t("缓存命中")), el("th", { style: st.th }, t("输出")), el("th", { style: st.th }, t("推理")), el("th", { style: st.th }, t("时段")), el("th", { style: st.th }, t("结束")), el("th", { style: st.th }, t("消耗"))
                      )),
                      el("tbody", null, selRecords.map(function (rr) {
                        var hit2 = rr.cacheReadTokens || 0, miss2 = rr.inputTokens || 0;
                        var cost2 = costOf(rr, regime);
                        var int2 = !!rr.interrupted;
                        return el("tr", { key: rr.time },
                          el("td", { style: st.tdFirst }, fmtTime(rr.time)),
                          el("td", { style: st.tdWrap },
                            el("div", null, modelName(rr), int2 ? el("span", { style: st.badgeWarn, marginLeft: 6 }, t("中断")) : null),
                            el("div", { style: st.sub }, providerName(rr.provider))
                          ),
                          el("td", { style: st.td }, fmtInt(miss2)),
                          el("td", { style: st.td }, el("span", { style: st.badgeHit }, fmtInt(hit2))),
                          el("td", { style: st.td }, fmtInt(rr.outputTokens || 0)),
                          el("td", { style: st.td }, rr.reasoningTokens ? fmtInt(rr.reasoningTokens) : "—"),
                          el("td", { style: st.td }, rr.peak ? el("span", { style: st.badgePeak }, t("峰")) : el("span", { style: st.badgeValley }, t("谷"))),
                          el("td", { style: st.td }, int2 ? el("span", { style: st.badgeWarn }, finishLabel(rr.finishReason)) : finishLabel(rr.finishReason)),
                          el("td", { style: st.td }, int2 ? el("span", { style: st.costOff }, "—") : el("span", { style: rr.peak ? st.costPeak : st.costOff }, fmtMoney(cost2)))
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
      var queryState = React.useState("");
      var query = queryState[0], setQuery = queryState[1];

      var nowKey = bjKey(Date.now());
      var fromMs = null, toMs = null;
      if (preset === "today") { fromMs = bjStartMs(nowKey); toMs = Date.now(); }
      else if (preset === "7d") { fromMs = bjStartMs(nowKey) - 6 * 86400000; toMs = Date.now(); }
      else if (preset === "30d") { fromMs = bjStartMs(nowKey) - 29 * 86400000; toMs = Date.now(); }
      else if (preset === "custom") {
        if (fromDate) fromMs = bjStartMs(fromDate);
        if (toDate) toMs = bjStartMs(toDate) + 86400000 - 1;
      }

      var q = String(query || "").trim().toLowerCase();
      var filtered = [];
      for (var i = 0; i < records.length; i++) {
        var r = records[i];
        if (fromMs != null && r.time < fromMs) continue;
        if (toMs != null && r.time > toMs) continue;
        if (q && String(r.model || "").toLowerCase().indexOf(q) < 0
          && String(r.provider || "").toLowerCase().indexOf(q) < 0
          && String(r.sessionId || "").toLowerCase().indexOf(q) < 0
          && String(r.purpose || "").toLowerCase().indexOf(q) < 0) continue;
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
      // 分页切换条：顶部与底部各渲染一份，便于长列表翻页。
      function pagerBar() {
        return el("div", { style: st.calBar },
          pageBtn("prev", t("‹ 上一页"), curPage <= 1, function () { setPage(curPage - 1); }),
          el("span", { style: st.note }, t("第 ") + curPage + " / " + totalPages + t(" 页 · 每页 ") + PAGE_SIZE + t(" 条 · 共 ") + fmtInt(filtered.length) + t(" 条")),
          pageBtn("next", t("下一页 ›"), curPage >= totalPages, function () { setPage(curPage + 1); })
        );
      }
      var sums = splitTotals(filtered, regime);

      return el("div", null,
        el("div", { style: st.calBar },
          el("div", { style: st.seg },
            presetBtn("today", t("今天")), presetBtn("7d", t("近7天")), presetBtn("30d", t("近30天")), presetBtn("all", t("全部"))
          ),
          el("span", { style: st.note }, t("自定义区间：")),
          el("input", { type: "date", style: st.dateInput, value: fromDate, onChange: function (e) { setCustomFrom(e.target.value); } }),
          el("span", { style: st.note }, t("至")),
          el("input", { type: "date", style: st.dateInput, value: toDate, onChange: function (e) { setCustomTo(e.target.value); } }),
          (fromDate || toDate) ? el("button", { style: st.btn, onClick: function () { setFromDate(""); setToDate(""); setPreset("all"); setPage(1); } }, t("清除区间")) : null
        ),
        el("div", { style: st.calBar },
          el("input", { style: Object.assign({}, st.input, { minWidth: 220, flex: "1 1 220px" }), placeholder: t("按模型 / 服务商 / 会话搜索…"), value: query, onChange: function (e) { setQuery(e.target.value); setPage(1); } }),
          query ? el("button", { style: st.btn, onClick: function () { setQuery(""); setPage(1); } }, t("清除")) : null
        ),
        el("div", { style: st.note, marginTop: 8 },
          t("当前范围：共 ") + fmtInt(filtered.length) + t(" 条 · 输入·未命中 ") + fmtInt(sumMiss) + t(" · 缓存命中 ") + fmtInt(sumHit) + t(" · 缓存写入 ") + fmtInt(sumWrite) + t(" · 输出 ") + fmtInt(sumOut) +
          t(" · 高峰消耗 ") + fmtMoney(sums.peak) + t(" · 空闲消耗 ") + fmtMoney(sums.off) + t(" · 总消耗 ") + fmtMoney(sumCost) + "（" + costHint(regime) + "）"
        ),
        filtered.length === 0
          ? el("div", { style: st.empty }, query || (fromDate || toDate || preset !== "all") ? t("没有符合条件的记录。") : t("该时间范围内没有记录。"))
          : el("div", null,
              pagerBar(),
              el("div", { style: st.scroll },
                el("table", { className: "dsh-usage-table collapse-mobile", style: st.tbl },
                  el("thead", null, el("tr", null,
                    el("th", { style: st.thFirst }, t("时间(北京)")), el("th", { style: st.thFirst }, t("模型")), el("th", { style: st.th }, t("输入·未命中")), el("th", { style: st.th }, t("缓存命中")), el("th", { style: st.th }, t("缓存写入")), el("th", { style: st.th }, t("输出")), el("th", { style: st.th }, t("推理")), el("th", { style: st.th }, t("命中率")), el("th", { style: st.th }, t("时段")), el("th", { style: st.th }, t("结束")), el("th", { style: st.th }, t("消耗"))
                  )),
                  el("tbody", null,
                    pageRows.map(function (rr3, idx) {
                      var hit3 = rr3.cacheReadTokens || 0, miss3 = rr3.inputTokens || 0;
                      var cost3 = costOf(rr3, regime);
                      var int3 = !!rr3.interrupted;
                      return el("tr", { key: rr3.time + "-" + idx },
                        el("td", { style: st.tdFirst }, fmtTime(rr3.time)),
                        el("td", { style: st.tdWrap },
                          el("div", null, modelName(rr3), int3 ? el("span", { style: st.badgeWarn, marginLeft: 6 }, t("中断")) : null),
                          el("div", { style: st.sub }, (rr3.provider || "") + (rr3.purpose ? " · " + rr3.purpose : ""))
                        ),
                        el("td", { style: st.td }, fmtInt(miss3)),
                        el("td", { style: st.td }, el("span", { style: st.badgeHit }, fmtInt(hit3))),
                        el("td", { style: st.td }, rr3.cacheWriteTokens ? fmtInt(rr3.cacheWriteTokens) : "—"),
                        el("td", { style: st.td }, fmtInt(rr3.outputTokens || 0)),
                        el("td", { style: st.td }, rr3.reasoningTokens ? fmtInt(rr3.reasoningTokens) : "—"),
                        el("td", { style: st.td }, pct(hit3, hit3 + miss3)),
                        el("td", { style: st.td }, rr3.peak ? el("span", { style: st.badgePeak }, t("峰")) : el("span", { style: st.badgeValley }, t("谷"))),
                        el("td", { style: st.td }, int3 ? el("span", { style: st.badgeWarn }, finishLabel(rr3.finishReason)) : finishLabel(rr3.finishReason)),
                        el("td", { style: st.td }, int3 ? el("span", { style: st.costOff }, "—") : el("span", { style: rr3.peak ? st.costPeak : st.costOff }, fmtMoney(cost3)))
                      );
                    }),
                    el("tr", null,
                      el("td", { style: st.tdTotalFirst }, t("总费用合计")),
                      el("td", { style: st.tdTotal }, fmtInt(filtered.length) + t(" 条")),
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
              ),
              pagerBar()
            )
      );
    }

    // ── Price table view ──
    // 价格表按官方固定，不可编辑。顶部可切换查看「自动 / 峰谷价 / 基础价」三档；
    // 自动档展示当前生效价格（生效前=基础价，生效后=当前峰谷价表）；
    // 峰谷价表本身也按官方调价分段（2026-08-17 第一版 → 2026-09-10 12:00 V4.1 新版）。
    function PriceView(props) {
      var pricing = props.pricing || { base: {}, peakValley: {}, peakValleyV41: {} };
      var effectiveAt = props.effectiveAt || 0;
      var effectiveV41At = props.effectiveV41At || 0;
      var fx = props.fx || {};
      var regimeState = React.useState("auto");
      var regime = regimeState[0], setRegime = regimeState[1];
      // 当前生效的峰谷价表：DeepSeek V4.1 Flash 调价（2026-09-10 12:00 北京时间）前
      // 为第一版峰谷价，调价后为新版（deepseek-flash 单价下调，deepseek-v4-pro 不变）。
      var currentPvTable = function () {
        return (effectiveV41At && Date.now() >= effectiveV41At ? pricing.peakValleyV41 : pricing.peakValley) || {};
      };
      var effectiveIn = function () {
        if (!effectiveAt) return t("新价格表生效时间未知");
        var now = Date.now();
        var s = now < effectiveAt
          ? t("新价格表（峰谷价）将于 ") + fmtTime(effectiveAt) + t("（北京时间）生效，当前按旧价格表（基础价）计费")
          : t("新价格表（峰谷价）已生效（自 ") + fmtTime(effectiveAt) + t(" 起）");
        if (effectiveV41At) {
          s += " " + (now < effectiveV41At
            ? t("DeepSeek V4.1 Flash 调价将于 ") + fmtTime(effectiveV41At) + t("（北京时间）生效：deepseek-flash 改用新版峰谷价（空闲 缓存命中 0.02 / 输入 1 / 输出 4 元，高峰为其两倍），deepseek-v4-pro 价格不变。")
            : t("DeepSeek V4.1 Flash 调价已生效（自 ") + fmtTime(effectiveV41At) + t(" 起）：deepseek-flash 按新版峰谷价计费，deepseek-v4-pro 价格不变。"));
        }
        return s;
      };
      var showRegime = function (r) {
        if (r === "auto") return Date.now() < effectiveAt ? "base" : "peakValley";
        return r;
      };
      var shown = showRegime(regime);
      // auto 档：显示当前生效的价格表（生效前=基础价 base，生效后=当前峰谷价表）
      var table = shown === "base" ? (pricing.base || {}) : currentPvTable();
      var cell = function (mk, a, b) {
        var row = table && table[mk];
        if (!row) return "—";
        if (shown === "base") return fmtPrice(row[a]);
        var sub = row[a];
        return sub ? fmtPrice(sub[b]) : "—";
      };
      var rows = PRICE_MODELS.map(function (mk) {
        if (shown === "base") {
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

      var budget = props.budget || null;
      var budgetInputState = React.useState("");
      var budgetInput = budgetInputState[0], setBudgetInput = budgetInputState[1];
      var budgetMsgState = React.useState("");
      var budgetMsg = budgetMsgState[0], setBudgetMsg = budgetMsgState[1];
      function doSaveBudget() {
        var v = String(budgetInput || "").trim();
        if (!v) { setBudgetMsg(t("请输入预算金额")); return; }
        var n = Number(v);
        if (!Number.isFinite(n) || n < 0) { setBudgetMsg(t("预算金额必须是非负数字")); return; }
        setBudgetMsg(""); setBudgetInput("");
        if (props.onBudgetChange) props.onBudgetChange(n);
      }
      function doClearBudget() {
        setBudgetInput(""); setBudgetMsg("");
        if (props.onBudgetChange) props.onBudgetChange(null);
      }
      var repriceMsgState = React.useState("");
      var repriceMsg = repriceMsgState[0], setRepriceMsg = repriceMsgState[1];
      var histState = React.useState(false);
      var histOpen = histState[0], setHistOpen = histState[1];
      // 价格口径说明 + 第三方价格表：查证时才看，默认折叠
      var calState = React.useState(false);
      var caliberOpen = calState[0], setCaliberOpen = calState[1];
      var pricingHistory = props.pricingHistory || [];
      var pricingMeta = props.pricingMeta || null;
      function doRepriceAll() {
        if (!props.onRepriceAll) { setRepriceMsg(t("当前宿主不支持重算")); return; }
        setRepriceMsg(t("已提交，正在用当前价格表重算全部历史…"));
        props.onRepriceAll();
      }
      return el("div", null,
        el("div", { style: Object.assign({}, st.infobox, { marginTop: 0 }) },
          el("div", { style: st.infoboxTitle }, t("月度预算")),
          el("div", { style: st.note }, budget && budget.monthly > 0
            ? t("当前预算：") + fmtMoney(budget.monthly) + t("；概览页会按当月消耗显示进度与超支预警。")
            : t("设置每月消费上限，概览页会显示进度与超支预警。")),
          el("div", { style: st.actions, marginTop: 8 },
            el("input", { style: Object.assign({}, st.numInput, { width: 130, textAlign: "left" }), placeholder: t("预算金额（元）"), value: budgetInput, onChange: function (e) { setBudgetInput(e.target.value); } }),
            el("button", { style: st.btnPrimary, onClick: doSaveBudget }, t("保存预算")),
            budget && budget.monthly > 0 ? el("button", { style: st.btn, onClick: doClearBudget }, t("清除预算")) : null,
            budgetMsg ? el("span", { style: st.err }, budgetMsg) : null
          )
        ),
        el("div", { style: st.infobox },
          el("div", { style: st.infoboxTitle }, t("历史价格与重算")),
          el("div", { style: st.note }, props.legacyPricingCount > 0
            ? t("有 ") + fmtInt(props.legacyPricingCount) + t(" 条记录没有冻结单价（旧版本写入或手工导入），其费用按当前价格表计算，改动价格后会跟着变化。")
            : t("所有记录都已冻结写入时生效的单价：改动价格表只影响之后产生的记录，历史费用不会被改写。")),
          el("div", { style: st.actions, marginTop: 8 },
            el("button", { style: st.btn, onClick: doRepriceAll }, t("用当前价格表重算全部历史")),
            repriceMsg ? el("span", { style: st.sub }, repriceMsg) : null
          )
        ),
        // 价格来源与历史快照：官方页面每次核对后把结论落在这里，避免"价格为什么变了"
        // 只能靠猜。历史快照折叠展示，默认不占版面。
        el("div", { style: st.infobox },
          el("div", { style: st.infoboxTitle }, t("价格来源与快照")),
          el("div", { style: st.note }, t("官方价目页核对日期：") + (pricingMeta && pricingMeta.checkedAt ? pricingMeta.checkedAt : "—")),
          pricingMeta
            ? el("div", { style: st.note }, t("新增 Search / Fetch 按次计费 ¥5 / 1000 次成功请求：本插件拿不到该调用次数，未计入费用。"))
            : null,
          pricingMeta
            ? el("div", { style: st.note }, t("法定节假日已纳入峰谷判定（自 ") + fmtTime(pricingMeta.holidayRuleAt) + t(" 起生效）。"))
            : null,
          el("div", { style: st.actions, marginTop: 8 },
            el("button", {
              style: st.btn,
              onClick: function () { setHistOpen(!histOpen); }
            }, (histOpen ? t("收起") : t("展开")) + t("历史价格记录（") + fmtInt(pricingHistory.length) + t(" 条）")),
            pricingMeta && pricingMeta.sourceUrl
              ? el("a", { style: st.actionLink, href: pricingMeta.sourceUrl, target: "_blank", rel: "noreferrer" }, t("核对官方价格页"))
              : null
          ),
          histOpen
            ? el("div", { style: { marginTop: 8 } },
                pricingHistory.length === 0
                  ? el("div", { style: st.note }, t("暂无历史快照；首次改价后会自动记录。"))
                  : pricingHistory.slice().reverse().map(function (h, i) {
                      var table = h && h.table ? h.table : {};
                      var row = table.peakValleyV41 && table.peakValleyV41["deepseek-flash"] ? table.peakValleyV41["deepseek-flash"].offPeak : null;
                      return el("div", { key: "hist" + String(i), style: st.note },
                        fmtTime(h.at) + t(" · ") + String(h.label || h.kind || "")
                        + (row ? t(" · flash 空闲价 ") + fmtMoney(row.cacheHit) + " / " + fmtMoney(row.cacheMiss) + " / " + fmtMoney(row.output) : ""));
                    })
              )
            : null
        ),
        el("div", { style: st.nowPeriod },
          el("span", { style: periodNow().peak ? st.badgePeak : st.badgeValley }, t("当前 · ") + t(periodNow().label)),
          el("span", { style: st.sub }, t(periodNow().desc))
        ),
        el("div", { style: st.sec }, t("今日 $ / ¥ 汇率")),
        el("div", { style: st.cards, marginTop: 8 },
          el(Card, { label: "$ → ¥", value: fx.rate ? ("$1 = ¥" + Number(fx.rate).toFixed(4)) : t("暂不可用"), hint: fx.date ? (t("汇率日期 ") + fx.date) : t("等待获取") }),
          el(Card, { label: "¥ → $", value: fx.inverse ? ("¥1 = $" + Number(fx.inverse).toFixed(6)) : t("暂不可用"), hint: fx.source || "Frankfurter" }),
          el(Card, { label: t("汇率状态"), value: fx.stale ? t("缓存汇率") : (fx.rate ? t("最新可用") : t("获取失败")), hint: fx.error || "Frankfurter · central-bank reference rates" })
        ),
        el("div", { style: st.actions, marginTop: 8 },
          el("button", { style: st.btn, onClick: props.onFxRefresh }, t("刷新汇率")),
          el("span", { style: st.note }, t("美元计价的 DigitalOcean 消耗按该 USD/CNY 汇率换算成人民币；人民币定价不受汇率影响。"))
        ),
        el("div", { style: st.sec, marginTop: 18 }, t("DeepSeek 官方 API 价格表")),
        el("div", { style: st.note, marginTop: 6 },
          t("本表仅用于 DeepSeek 官方 Provider；第三方 Provider 按下方已核验的自身价格计费，无法可靠匹配价格的模型按 0 统计。价格按官方公布固定，不可编辑。")),
        el("div", { style: st.calBar },
          el("div", { style: st.seg },
            el("button", { style: regime === "auto" ? st.segBtnOn : st.segBtn, onClick: function () { setRegime("auto"); } }, t("自动")),
            el("button", { style: regime === "peakValley" ? st.segBtnOn : st.segBtn, onClick: function () { setRegime("peakValley"); } }, t("峰谷价")),
            el("button", { style: regime === "base" ? st.segBtnOn : st.segBtn, onClick: function () { setRegime("base"); } }, t("基础价"))
          )
        ),
        el("div", { style: st.note, marginTop: 6 }, effectiveIn()),
        regime === "auto"
          ? el("div", { style: st.note, marginTop: 6 },
              t("自动模式：按调用时间自动选择计费档位——新价格表生效前的调用按基础价（旧价格表），生效后的调用按峰谷价（工作日高峰时段 9:00–12:00、14:00–18:00 用高峰价，其余时间——含周末全天——用空闲价）。当前显示："),
              el("strong", null, shown === "base" ? t("基础价表（旧价格表，新价格生效前）") : t("峰谷价表（新价格表）")),
              t("。价格按官方公布固定，不可编辑。")
            )
          : null,
        shown === "base"
          ? el("div", { style: st.scroll },
              el("table", { className: "dsh-usage-table", style: st.tbl },
                el("thead", null, el("tr", null,
                  el("th", { style: st.thFirst }, t("模型")), el("th", { style: st.th }, t("缓存命中（输入）")), el("th", { style: st.th }, t("输入 · 未命中")), el("th", { style: st.th }, t("输出"))
                )),
                el("tbody", null, rows)
              )
            )
          : el("div", { style: st.scroll },
              el("table", { className: "dsh-usage-table", style: st.tbl },
                el("thead", null, el("tr", null,
                  el("th", { style: st.thFirst }, t("模型")),
                  el("th", { style: st.th }, t("空闲 · 缓存命中")), el("th", { style: st.th }, t("空闲 · 输入")), el("th", { style: st.th }, t("空闲 · 输出")),
                  el("th", { style: st.th }, t("高峰 · 缓存命中")), el("th", { style: st.th }, t("高峰 · 输入")), el("th", { style: st.th }, t("高峰 · 输出"))
                )),
                el("tbody", null, rows)
              )
            ),
        // 价格口径 + 第三方价格表：都是"查证时才看"的长文案，默认折叠成一行。
        // 另外原来这里 WhyThisPrice 已经内含 OfficialLinks，却又单独渲染了一遍，
        // 导致同一组外链出现两次（已去掉重复的那次）。
        el("div", { style: st.calBar, marginTop: 10 },
          el("button", { style: caliberOpen ? st.btnPrimary : st.btn, onClick: function () { setCaliberOpen(!caliberOpen); } },
            caliberOpen ? t("收起说明") : t("价格口径与第三方价格")),
          el("span", { style: st.note }, t("单位：元 / 百万 tokens"))
        ),
        caliberOpen ? el("div", { style: Object.assign({}, st.infobox, { marginTop: 8 }) },
        el("div", { style: st.note },
          t("单位：元 / 百万 tokens。工作日高峰时段（北京时间 9:00–12:00、14:00–18:00）用高峰价，其余时间用空闲价（空闲价 = 高峰价的一半）；自 2026-08-23 起周末（周六、周日）全天按空闲价计费，新规则生效前仍按原规则。概览、用量日历、缓存命中列表中的消耗均已按高峰 / 空闲分列统计。")
        ),
        el("div", { style: st.note, marginTop: 6 },
          t("峰谷价表按生效时间分段：2026-08-17 00:00 起为第一版峰谷价；2026-09-10 12:00 起为 DeepSeek V4.1 Flash 调价后的新版（deepseek-flash 空闲价下调为 缓存命中 0.02 / 输入 1 / 输出 4 元，高峰为其两倍；deepseek-v4-pro 价格不变）。上方「峰谷价」展示的是当前生效的一版，历史调用始终按其发生时刻对应的版本计费。")
        ),
        el("div", { style: st.note, marginTop: 6 },
          t("旧模型名 deepseek-v4-flash 与 deepseek-v4-flash-vision-exp 仍可调用（官方已将其路由到 DeepSeek-V4.1-Flash、按 Flash 单价计费），在本价格表中与 deepseek-flash 合并为同一档位。")
        ),
        el(WhyThisPrice, null),
        el("div", { style: st.sec, marginTop: 18 }, t("第三方平台价格与覆盖状态（2026-08-19 核验）")),
        el("div", { style: st.note, marginTop: 6 }, t("只把能与记录中的 provider/model 可靠匹配的价格用于自动计费；美元价格先按 USD 计算，再乘 USD/CNY 汇率统一折算成人民币。")),
        el("div", { style: st.scroll, marginTop: 8 },
          el("table", { className: "dsh-usage-table", style: st.tbl },
            el("thead", null, el("tr", null,
              el("th", { style: st.thFirst }, t("API 服务商")), el("th", { style: st.thFirst }, t("模型 / 状态")),
              el("th", { style: st.th }, t("缓存命中")), el("th", { style: st.th }, t("输入")), el("th", { style: st.th }, t("输出")), el("th", { style: st.thFirst }, t("说明"))
            )),
            el("tbody", null, [
              ["SiliconFlow", "DeepSeek-V4-Flash", "¥0.02", "¥1.00", "¥2.00", t("已用于自动计费")],
              ["SiliconFlow", "DeepSeek-V4-Pro", "¥1.00", "¥12.00", "¥24.00", t("缓存命中价按 2026-08-03 起生效公告")],
              ["SiliconFlow", "DeepSeek-V3.2", "¥0.40", "¥4.00", "¥6.00", t("已用于自动计费")],
              ["SiliconFlow", "Qwen3.6-27B", t("按输入价"), "¥3.00", "¥18.00", t("公告未单列缓存命中价")],
              ["DigitalOcean", "DeepSeek V4 Flash", "$0.028", "$0.112", "$0.224", t("自动按 USD/CNY 汇率换算人民币并计费")],
              ["DigitalOcean", "DeepSeek V4 Pro", "$0.348", "$1.392", "$2.784", t("自动按 USD/CNY 汇率换算人民币并计费")],
              ["DigitalOcean", "DeepSeek V3.2", "$0.15", "$0.425", "$1.36", t("自动按 USD/CNY 汇率换算人民币并计费")],
              [t("Alibaba / 千问"), t("暂不计费"), "—", "—", "—", t("调用与 token 正常统计；费用暂按 ¥0")],
              ["AMD GPU Cloud", "DeepSeek V4 Flash", "¥0", "¥0", "¥0", t("免费；费用固定按 ¥0")]
            ].map(function (row, idx) {
              return el("tr", { key: "provider-price-" + idx },
                el("td", { style: st.tdFirst }, row[0]), el("td", { style: st.tdWrap }, row[1]),
                el("td", { style: st.td }, row[2]), el("td", { style: st.td }, row[3]), el("td", { style: st.td }, row[4]), el("td", { style: st.tdWrap }, row[5])
              );
            }))
          )
        ),
        el("div", { style: st.note, marginTop: 8 }, t("DigitalOcean 使用美元官方价并按最新可用 USD/CNY 汇率折算人民币；千问暂不计费；AMD GPU Cloud 的 DeepSeek V4 Flash 免费按 ¥0。"))
        ) : null
      );
    }
    // ── Usage panel ──
    // 新的信息架构：看结论（用量）→ 看时间分布（日历）→ 查明细（明细）→ 改配置（设置）。
    // 原来的「概览 / 用量日历 / 缓存命中列表 / 价格表」把数据和配置混在同一层，
    // 且"缓存命中列表"既是明细又是独立页签，职责重叠。
    var SUBTABS = [
      { k: "overview", z: "用量" },
      { k: "calendar", z: "日历" },
      { k: "detail", z: "明细" },
      { k: "settings", z: "设置" }
    ];

    function UsagePanel(props) {
      var lang = useLang(); // 订阅语言变化：宿主切换语言时触发本面板重渲染（值本身仅作触发用）
      var state = React.useState({ records: [], count: 0, dataPath: "", persistOk: false, persistError: "", pricing: null, days: [], budget: null });
      var data = state[0], setData = state[1];
      var tabState = React.useState("overview");
      var tab = tabState[0], setTab = tabState[1];
      var infoState = React.useState(false);
      var infoOpen = infoState[0], setInfoOpen = infoState[1];
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
      // 初始加载中标记：首次请求完成/失败后置 false（后续定时刷新静默进行，避免闪烁）
      var loadingState = React.useState(true);
      var loading = loadingState[0], setLoading = loadingState[1];
      // 上一次已知的数据指纹（记录数 / 最新时刻 / 价格版本）。轮询先比这个，
      // 没变化就不拉全量 list —— 见 poll()。
      var statRef = React.useRef(null);
      if (!statRef.current) statRef.current = { count: -1, latest: 0, pricingVersion: -1 };

      function refresh() {
        api({ action: "list" }).then(function (res) {
          var next = res || { records: [], count: 0, dataPath: "", persistOk: false, persistError: "", pricing: null, days: [], budget: null };
          setData(next);
          setError("");
          setLoading(false);
          statRef.current = { count: next.total, latest: next.latest, pricingVersion: next.pricingVersion };
        }).catch(function (e) { setError(String((e && e.message) || e)); setLoading(false); });
      }

      /**
       * 轮询：先问 `stat`（几十字节），只有记录数 / 最新时刻 / 价格版本变了才拉全量。
       *
       * 旧实现每 10 秒直接调 `list`：等于每 10 秒把上万条记录重新投影、序列化、
       * JSON.parse、再全量重渲染一次面板——这是"用完这个插件就卡"的主因，
       * 而且数据没变化时也在白跑。
       */
      function poll() {
        try {
          if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
        } catch (e) {}
        api({ action: "stat" }).then(function (res) {
          if (!res || !res.ok) return;
          var prev = statRef.current || {};
          if (prev.count === res.count && prev.latest === res.latest && prev.pricingVersion === res.pricingVersion) return;
          refresh();
        }).catch(function () {});
      }

      function saveBudget(monthly) {
        api({ action: "setBudget", monthly: monthly }).then(function (res) {
          if (res && res.ok) setData(function (prev) { return Object.assign({}, prev, { budget: res.budget }); });
        }).catch(function () {});
      }

      React.useEffect(function () {
        refresh();
        // 10 秒探测一次"有没有新数据"，只有变化时才真正拉全量（poll 内部判断）
        if (timer && timer.interval) return timer.interval(poll, 10000);
        return undefined;
      }, []);

      function showExport(res) {
        if (res && res.ok) {
          setExportMsg({ k: "已导出：", tail: res.path });
          if (res.dir) api({ action: "reveal", dir: res.dir }).catch(function () {});
        } else {
          setExportMsg({ k: "导出失败：", tail: (res && res.error) || t("未知错误") });
        }
      }

      function doExport(kind) {
        setExportMsg({ k: "导出中…" });
        api({ action: "export", kind: kind, dir: destDir || undefined }).then(showExport).catch(function (e) { setExportMsg({ k: "导出失败：", tail: String((e && e.message) || e) }); });
      }

      function doExportImage() {
        setExportMsg({ k: "生成图片中…" });
        if (!canvasNode) { setExportMsg({ k: "画布不可用" }); return; }
        try {
          drawReport(canvasNode, (data.records || []).slice());
          var dataUrl = canvasNode.toDataURL("image/png");
          api({ action: "exportPng", dataUrl: dataUrl, dir: destDir || undefined }).then(showExport).catch(function (e) { setExportMsg({ k: "导出失败：", tail: String((e && e.message) || e) }); });
        } catch (e) {
          setExportMsg({ k: "生成图片失败：", tail: String((e && e.message) || e) });
        }
      }

      function pickDestDir() {
        setExportMsg({ k: "打开目录选择…" });
        api({ action: "pickDir" }).then(function (res) {
          if (res && res.ok) { setDestDir(res.path); setExportMsg({ k: "导出目标：", tail: res.path }); }
          else if (res && res.cancelled) { setExportMsg(""); }
          else { setExportMsg({ k: "选择目录失败：", tail: (res && res.error) || "" }); }
        }).catch(function (e) { setExportMsg({ k: "选择目录失败：", tail: String((e && e.message) || e) }); });
      }

      function doReveal() {
        api({ action: "reveal", dir: destDir || "data" }).then(function (res) {
          if (!res || !res.ok) setExportMsg({ k: "打开文件夹失败：", tail: (res && res.error) || "" });
        }).catch(function (e) { setExportMsg({ k: "打开文件夹失败：", tail: String((e && e.message) || e) }); });
      }

      function doClear() {
        api({ action: "clear" }).then(refresh).catch(function (e) { setError(String((e && e.message) || e)); });
      }

      function pickFile() { if (fileInputNode) fileInputNode.click(); }

      function onFileChange(e) {
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        setImportMsg({ k: "读取文件…" });
        var readPromise = typeof f.text === "function"
          ? f.text()
          : new Promise(function (resolve, reject) { var r = new FileReader(); r.onload = function () { resolve(r.result); }; r.onerror = reject; r.readAsText(f); });
        readPromise.then(function (content) {
          try { e.target.value = ""; } catch (err) {}
          api({ action: "import", content: String(content), filename: f.name }).then(function (res) {
            if (res && res.ok) {
              setImportMsg({ seq: [{ k: "导入成功：新增 " }, res.imported, { k: " 条，跳过重复 " }, res.skipped, { k: " 条，忽略无效 " }, res.invalid, { k: " 条，现有共 " }, res.total, { k: " 条" }] });
              refresh();
            } else {
              setImportMsg({ k: "导入失败：", tail: (res && res.error) || t("未知错误") });
            }
          }).catch(function (err) { setImportMsg({ k: "导入失败：", tail: String((err && err.message) || err) }); });
        }).catch(function () { setImportMsg({ k: "读取文件失败" }); });
      }

      var records = data.records || [];
      var interruptedTotal = 0;
      for (var ixi = 0; ixi < records.length; ixi++) { if (records[ixi].interrupted) interruptedTotal += 1; }
      var dataPath = data.dataPath || "";
      var nowPeriod = periodNow(Date.now());
      var effectiveAt = data.effectiveAt || 0;
      var nowEffective = effectiveAt ? (Date.now() >= effectiveAt) : true;
      // dsh-usage-scope：容器查询的锚点，让表格按"面板宽度"而不是"窗口宽度"折叠
      return el("div", { className: "dsh-usage-scope", style: st.root },
        el("canvas", { ref: function (n) { canvasNode = n; }, style: { display: "none" } }),
        el("div", { style: st.head },
          el("div", { style: st.headleft },
            el("div", null,
              el("div", { style: st.title },
                t("用量与消耗"),
                // 版本号直接来自宿主读到的 package.json（data.version），不在前端写死，
                // 避免"面板显示旧版本号、实际跑新版本"这种排查事故。
                el("span", { style: st.titleVer, title: t("当前运行的插件版本") }, "v" + (data.version || "?"))
              ),
              el("div", { style: st.sub }, t("记录插件激活后的每一次模型调用"))
            ),
            el("span", { style: nowPeriod.peak ? st.badgePeak : st.badgeValley }, t("当前 · ") + t(nowPeriod.label)),
              el("span", { style: nowEffective ? st.badgeHit : st.badgeValley }, nowEffective ? t("新价格已生效") : t("新价格未生效"))
          ),
          el("div", { style: st.actions },
            el("button", { style: st.btn, onClick: refresh }, t("刷新")),
            el("button", { style: st.btn, onClick: doClear }, t("清空"))
          )
        ),
        el("div", { style: st.subtabBar },
          SUBTABS.map(function (sub) {
            return el("button", {
              key: sub.k,
              style: tab === sub.k ? st.subtabOn : st.subtab,
              onClick: function () { setTab(sub.k); }
            }, t(sub.z));
          })
        ),
        // 工具条：说明只在需要时展开（导出/导入已归到「设置」页签）
        el("div", { style: st.calBar, marginTop: 8 },
          el("button", { style: infoOpen ? st.btnPrimary : st.btn, onClick: function () { setInfoOpen(!infoOpen); } },
            (infoOpen ? t("收起说明") : t("口径与版本")) + (interruptedTotal > 0 ? " · " + fmtInt(interruptedTotal) + t(" 次中断") : ""))
        ),
        infoOpen
          ? el("div", { style: st.diffbox },
              el("div", { style: st.diffboxTitle }, t("本地统计与官方后台的差异")),
              el("div", { style: st.diffboxText }, t("本面板统计的是插件在本地捕获的模型调用（按官方价格与峰谷时段计费）。与官方后台（platform.deepseek.com 用量页）相比，金额可能更低，常见原因：")),
              el("div", { style: st.diffboxText }, t("① 中断/出错/超时的调用：官方仍按实际 token 计费，插件无法获取其用量，按 0 记录（明细中标「中断」）；")),
              el("div", { style: st.diffboxText }, t("② 账号下其他 API Key（如其它应用/脚本）的调用不经过 DeepSeek Harness，官方统计包含它们，本插件不包含；")),
              el("div", { style: st.diffboxText }, t("③ 如需精确对账，可在官方用量页导出月度账单 CSV 与本插件对比。")),
              interruptedTotal > 0
                ? el("div", { style: st.diffboxWarn }, t("当前记录中有 ") + fmtInt(interruptedTotal) + t(" 次中断调用（未计费）——对应官方后台已计费的部分。"))
                : null,
              // 价格分段 / 计价规则统一在「价格表」页的「价格来源与口径」里讲一次，
              // 这里不再重复（原先本抽屉、价格页、概览各有一份同样的说明文字）。
              el("div", { style: st.diffboxText, marginTop: 6 },
                t("计价规则与官方价格依据见「价格表」页；费用以 DeepSeek 官方后台账单为准。")),
              // 反馈问题时最先要确认的两条信息：版本号 + 数据目录。
              el("div", { style: st.diffboxText, marginTop: 6 },
                t("插件版本 ") + "v" + (data.version || "?") + t(" · 数据目录 ") + (dataPath || "—"))
            )
          : null,
        loading
          ? el(LoadingView, null)
          : el("div", null,
            tab === "overview" ? el(OverviewView, { records: records, regime: "auto", toolCalls: data.toolCalls || [], days: data.days || [], budget: data.budget, legacyPricingCount: data.legacyPricingCount || 0 }) : null,
            tab === "calendar" ? el(CalendarView, { records: records, regime: "auto", days: data.days || [] }) : null,
            tab === "detail" ? el("div", null,
              el(BreakdownView, { records: records, regime: "auto" }),
              el("div", { style: Object.assign({}, st.sec, { marginTop: 16 }) }, t("缓存命中明细")),
              el(CacheListView, { records: records, regime: "auto" })
            ) : null,
            tab === "settings" ? el("div", null,
              el(PriceView, { pricingHistory: data.pricingHistory || [], pricingMeta: data.pricingMeta || null, pricing: data.pricing, effectiveAt: data.effectiveAt, effectiveV41At: data.effectiveV41At, fx: data.fx || {}, budget: data.budget, legacyPricingCount: data.legacyPricingCount || 0, onBudgetChange: saveBudget, onFxRefresh: function () { api({ action: "fxRefresh" }).then(refresh).catch(function () {}); }, onRepriceAll: function () { return api({ action: "repriceAll" }).then(refresh).catch(function () {}); }, onChanged: refresh }),
              // 导出 / 导入 / 目标目录 / 数据路径：属于"配置与运维"，统一落在设置页，
              // 不再在每个子页签底部常驻。
              el("div", { style: Object.assign({}, st.diffbox, { marginTop: 12 }) },
                el("div", { style: st.diffboxTitle }, t("导出与数据")),
                el("div", { style: st.actions, marginTop: 8 },
                  el("button", { style: st.btn, onClick: function () { doExport("csv"); } }, t("导出 CSV")),
                  el("button", { style: st.btn, onClick: function () { doExport("json"); } }, t("导出 JSON")),
                  el("button", { style: st.btn, onClick: doExportImage }, t("导出图片 (PNG)")),
                  el("button", { style: st.btn, onClick: doReveal }, t("打开目录")),
                  el("button", { style: st.btn, onClick: pickFile }, t("选择文件导入"))
                ),
                exportMsg ? el("div", { style: st.note, marginTop: 6 }, __msgText(exportMsg)) : null,
                importMsg ? el("div", { style: st.note, marginTop: 6 }, __msgText(importMsg)) : null,
                el("div", { style: st.actions, marginTop: 8 },
                  el("input", { style: st.input, placeholder: t("导出目标目录（留空 = 默认数据目录）"), value: destDir, onChange: function (e) { setDestDir(e.target.value); } }),
                  el("button", { style: st.btn, onClick: pickDestDir }, t("选择目录…")),
                  destDir ? el("button", { style: st.btn, onClick: function () { setDestDir(""); setExportMsg({ k: "已恢复默认数据目录" }); } }, t("重置")) : null
                ),
                dataPath
                  ? el("div", { style: st.note, marginTop: 8 }, t("数据持久化：") + dataPath + t("（每次调用实时落盘，插件重启后自动恢复，最多保留 100000 条）"))
                  : el("div", { style: st.note, color: C.danger, opacity: 1, marginTop: 8 }, t("持久化未启用：") + (data.persistError || t("未知原因")))
              )
            ) : null
          ),
        error ? el("div", { style: st.err }, error) : null,
        // 持久化失败必须始终可见（导出/导入已归到「设置」页签）。
        dataPath ? null : el("div", { style: st.note, color: C.danger, opacity: 1 }, t("持久化未启用：") + (data.persistError || t("未知原因")))
      );
    }

    // ── Balance panel ──
    function BalancePanel() {
      var lang = useLang(); // 订阅语言变化：宿主切换语言时触发本面板重渲染（值本身仅作触发用）
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
        { id: "deepseek", name: "DeepSeek", hint: t("DEEPSEEK_API_KEY（推理 Key）") },
        { id: "siliconflow", name: "SiliconFlow", hint: t("模型设置中 Provider ID 或显示名为 siliconflow 的提供商 API Key"), actionUrl: "https://cloud.siliconflow.cn/account/ak", actionLabel: t("打开 SiliconFlow API 密钥") },
        { id: "digitalocean", name: "DigitalOcean", hint: t("账户级 dop_v1_ Personal Access Token；Read Only（api:read）或 billing:read"), actionUrl: "https://cloud.digitalocean.com/account/api/tokens", actionLabel: t("创建 DigitalOcean Account API Token") },
        { id: "amd-gpu-cloud", name: "AMD GPU Cloud", hint: t("暂无公开余额 API，仅支持控制台查看"), unsupported: true, actionUrl: "https://www.amd.com/en/developer/resources/cloud-access/amd-developer-cloud.html", actionLabel: t("打开 AMD Developer Cloud") },
        { id: "qwen-token-plan", name: "百炼 Token Plan", hint: t("百炼控制台 OAuth 登录（~/.bailian/config.json 的 access_token，用 bl auth login --console 生成）"), actionUrl: "https://bailian.console.aliyun.com/cli", actionLabel: t("打开百炼 CLI 登录说明") },
        // 按量付费与 Token Plan 是两条通道（issue #15）：余额在阿里云费用中心，
        // API Key 查不到，所以这里只给入口与说明，不做"假装查询"。
        { id: "bailian-payg", name: "百炼按量付费", hint: t("百炼按量付费余额需在阿里云费用中心查看；百炼模型 API Key 无法查询按量付费余额"), unsupported: true, actionUrl: "https://billing-cost.console.aliyun.com/", actionLabel: t("打开阿里云费用中心") }
      ];
      var selected = providers[0];
      for (var pi = 0; pi < providers.length; pi++) if (providers[pi].id === provider) selected = providers[pi];

      function query(nextProvider) {
        var target = typeof nextProvider === "string" ? nextProvider : provider;
        setS({ status: "loading", data: null, error: "" });
        api({ action: "balance", provider: target }).then(function (res) {
          if (res && res.ok) setS({ status: "done", data: res, error: "" });
          else setS({ status: "error", data: res, error: (res && res.error) || t("查询失败") });
        }).catch(function (e) {
          setS({ status: "error", data: null, error: String((e && e.message) || e) });
        });
      }

      function loadDigitalOceanCredential(shouldQuery) {
        setCredential({ status: "loading", configured: false, source: "", writable: true, masked: "" });
        api({ action: "balanceCredentialStatus", provider: "digitalocean" }).then(function (res) {
          if (!res || !res.ok) {
            setCredential({ status: "error", configured: false, source: "", writable: false, masked: "", error: (res && res.error) || t("无法读取凭据状态") });
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
          setSaving({ status: "error", errorKey: "请输入以 dop_v1_ 开头的 DigitalOcean 账户 PAT。" });
          return;
        }
        setSaving({ status: "saving", error: "" });
        api({ action: "saveBalanceCredential", provider: "digitalocean", value: value }).then(function (res) {
          if (!res || !res.ok) {
            setSaving({ status: "error", error: (res && res.error) || t("保存失败") });
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
      // DeepSeek 多币种账户（issue #17）：/user/balance 会按币种各返回一条，
      // 人民币赠送余额与美元充值余额可能同时在。只有一条时保持原来的单卡展示。
      var balanceInfos = d && d.ok && Array.isArray(d.infos) ? d.infos : [];
      var multiCurrency = balanceInfos.length > 1;
      var actionUrl = d && d.credentialHelpUrl || selected.actionUrl || "";
      var credentialMeta = [];
      if (d && d.credentialName) credentialMeta.push(t("使用凭据 ") + d.credentialName);
      if (d && d.credentialSource) credentialMeta.push(t("来源 ") + d.credentialSource);
      if (d && d.modelProviderRoute) credentialMeta.push(t("模型提供商 ") + d.modelProviderRoute);
      if (d && d.endpoint) credentialMeta.push(t("端点 ") + d.endpoint);
      var isQwen = d && d.provider === "qwen-token-plan";
      var heroLabel = d && d.balanceLabelKey ? tb(d.balanceLabelKey) : (d && d.balanceLabel ? t(d.balanceLabel) : ((d && d.providerName) || selected.name) + t(" · 账户余额"));
      var heroStatus = d && d.provider === "digitalocean"
        ? (d.balanceKind === "credit" ? t("USD · 预付款/信用余额") : d.balanceKind === "due" ? t("USD · 待结算金额") : t("USD · 当前无余额"))
        : isQwen
          ? t("百炼 Token Plan · 1 周配额")
          : (d && d.currency) + (d && d.isAvailable === true ? t(" · 账户可用") : d && d.isAvailable === false ? t(" · 账户不可用") : t(" · 查询成功"));
      var qwenQuota = isQwen ? (d && d.qwenQuota) : null;
      var qwenRatio = qwenQuota && qwenQuota.ratio != null ? Math.round(qwenQuota.ratio * 1000) / 10 : 0;
      var qwenPctText = qwenQuota && qwenQuota.usedPercent ? qwenQuota.usedPercent : "0%";
      // 本周配额：计算今天在开始~结束周期中的位置（北京时间）
      var weekPos = 0;
      var todayText = "—";
      if (isQwen && qwenQuota && qwenQuota.weekStart && qwenQuota.weekEnd) {
        var startMs = Date.parse(qwenQuota.weekStart + "T00:00:00+08:00");
        var endMs = Date.parse(qwenQuota.weekEnd + "T00:00:00+08:00");
        var bjNow = new Date(Date.now() + 8 * 3600 * 1000);
        var todayMs = Date.UTC(bjNow.getUTCFullYear(), bjNow.getUTCMonth(), bjNow.getUTCDate()) - 8 * 3600 * 1000;
        if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs) {
          weekPos = Math.max(2, Math.min(98, ((todayMs - startMs) / (endMs - startMs)) * 100));
          var mm = String(bjNow.getUTCMonth() + 1).padStart(2, "0");
          var dd = String(bjNow.getUTCDate()).padStart(2, "0");
          todayText = mm + "." + dd;
        }
      }

      // 明细卡片：多币种时按币种逐行（每种币种一张卡），单币种沿用原来的
      // 「充值 / 赠送」两张卡。multiCurrency 由 lib/balance.js 判定。
      var balanceCards = null;
      if (d && d.ok && !isQwen) {
        if (multiCurrency) {
          balanceCards = el("div", { style: st.cards },
            balanceInfos.map(function (info, idx) {
              var sym = currencySymbol(info.currency);
              return el(Card, {
                key: "currency" + String(idx),
                label: String(info.currency || "") + t(" · 总计"),
                value: sym + " " + fmtBalance(info.totalBalance),
                hint: t("充值 ") + sym + fmtBalance(info.toppedUpBalance) + t(" · 赠送 ") + sym + fmtBalance(info.grantedBalance)
              });
            }),
            d.generatedAt ? el(Card, { label: t("账单更新时间"), value: fmtTime(Date.parse(d.generatedAt)), hint: d.generatedAt }) : null,
            el(Card, { label: t("查询时间"), value: fmtTime(d.queriedAt), hint: t("北京时间") })
          );
        } else {
          balanceCards = el("div", { style: st.cards },
            (d.details || []).map(function (item, idx) {
              return el(Card, { key: String(idx), label: tb(item.labelKey), value: symbol + " " + fmtBalance(item.value), hint: tb(item.hintKey) });
            }),
            d.generatedAt ? el(Card, { label: t("账单更新时间"), value: fmtTime(Date.parse(d.generatedAt)), hint: d.generatedAt }) : null,
            el(Card, { label: t("查询时间"), value: fmtTime(d.queriedAt), hint: t("北京时间") })
          );
        }
      }

      return el("div", { style: st.root },
        el("div", { style: st.head },
          el("div", null,
            el("div", { style: st.title }, t("剩余余额查询")),
            el("div", { style: st.sub }, t("查询 DeepSeek、SiliconFlow、DigitalOcean、百炼 Token Plan 与百炼按量付费"))
          ),
          el("div", { style: st.actions },
            selected.unsupported
              ? el("a", { style: Object.assign({}, st.btn, { textDecoration: "none" }), href: selected.actionUrl, target: "_blank", rel: "noreferrer" }, t("打开控制台"))
              : provider === "digitalocean" && !credential.configured
                ? null
                : el("button", { style: s.status === "loading" ? st.btnDisabled : st.btn, disabled: s.status === "loading", onClick: query }, s.status === "loading" ? t("查询中…") : provider === "digitalocean" ? t("查询账单") : t("查询余额"))
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
        el("div", { style: st.note }, selected.unsupported ? selected.hint : t("所需凭据：") + selected.hint),
        s.status === "error"
          ? el("div", { style: d && d.unsupported ? st.infobox : st.errbox },
              el("div", { style: d && d.unsupported ? st.infoboxTitle : st.errboxTitle }, d && d.unsupported ? t("仅支持控制台查看") : t("查询失败")),
              el("div", null, s.error),
              el("div", { style: st.note, marginTop: 6 }, selected.unsupported
                ? t("插件不会尝试未经公开文档确认的端点，也不会把推理 Key 当作账单凭据。")
                : t("请确认凭据类型正确、权限包含余额/账单读取，且网络可访问服务商官方 API。")),
              actionUrl ? el("a", { style: st.actionLink, href: actionUrl, target: "_blank", rel: "noreferrer" }, selected.actionLabel || t("打开服务商凭据页面")) : null
            )
          : null,
        s.status === "loading" && !d ? el(LoadingView, { text: t("正在查询余额…") }) : null,
        d && d.ok && isQwen
          ? el("div", { style: st.hero },
              el("div", { style: st.qwenHero },
                el("div", { style: st.qwenHeroTitle }, t("百炼 Token Plan")),
                el("div", { style: st.qwenBarWrap },
                  el("div", { style: st.qwenBar },
                    el("div", { style: Object.assign({}, st.qwenBarFill, { width: qwenRatio + "%" }) })
                  )
                ),
                el("div", { style: st.qwenHeroUsed }, t("已用 ") + qwenPctText)
              )
            )
          : d && d.ok
            ? el("div", { style: st.hero },
                el("div", { style: st.heroLabel }, heroLabel),
                el("div", { style: st.heroValue }, symbol + " " + fmtBalance(d.totalBalance)),
                el("div", { style: st.heroCurrency }, heroStatus),
                d.isAvailable == null ? null : el("span", { style: d.isAvailable ? st.badgeHit : st.badgePeak }, d.isAvailable ? t("可用") : t("不可用"))
              )
            : null,
        d && d.ok && isQwen
          ? el("div", { style: st.qwenWeekCard },
              el("div", { style: st.qwenWeekLabel }, t("本周配额")),
              el("div", { style: st.qwenWeekRow },
                el("div", { style: st.qwenWeekItem },
                  el("span", { style: st.qwenWeekHint }, t("开始")),
                  el("span", { style: st.qwenWeekVal }, qwenQuota && qwenQuota.weekStart ? fmtShortDate(qwenQuota.weekStart) : "—")
                ),
                el("div", { style: st.qwenWeekLine },
                  el("div", { style: st.qwenWeekTrack },
                    el("div", { style: Object.assign({}, st.qwenWeekProgress, { width: weekPos + "%" }) })
                  ),
                  el("div", { style: Object.assign({}, st.qwenWeekToday, { left: weekPos + "%" }) },
                    el("span", { style: st.qwenWeekTodayDot }),
                    el("span", { style: st.qwenWeekTodayDate }, todayText)
                  )
                ),
                el("div", { style: st.qwenWeekItemR },
                  el("span", { style: st.qwenWeekHint }, t("结束")),
                  el("span", { style: st.qwenWeekVal }, qwenQuota && qwenQuota.weekEnd ? fmtShortDate(qwenQuota.weekEnd) : "—")
                )
              )
            )
          : null,
        balanceCards,
        provider === "digitalocean"
          ? el("div", { style: Object.assign({}, st.infobox, { marginTop: 18 }) },
              el("div", { style: st.infoboxTitle }, "DigitalOcean Account API"),
              el("div", null, t("请创建账户级 Personal Access Token。可选 Read Only（api:read，包含 billing:read），或自定义 billing:read；不要使用 Gradient AI 推理 Key。")),
              el("a", { style: st.actionLink, href: selected.actionUrl, target: "_blank", rel: "noreferrer" }, selected.actionLabel),
              el("div", { style: st.note, marginTop: 8 }, credential.status === "loading"
                ? t("正在检查已保存的 Token…")
                : credential.configured
                  ? t("已保存：") + (credential.masked || "••••••••••••") + (credential.source ? t("（来源：") + credential.source + "）" : "")
                  : credential.status === "error"
                    ? t("无法读取 Token 状态：") + (credential.error || t("未知错误"))
                    : t("尚未保存 DIGITALOCEAN_TOKEN。")),
              el("div", { style: st.actions, marginTop: 8 },
                el("input", {
                  type: "password",
                  autoComplete: "new-password",
                  spellCheck: false,
                  style: st.input,
                  placeholder: credential.configured ? t("输入新的 dop_v1_ Token 可替换（当前值已隐藏）") : "dop_v1_…",
                  value: digitalOceanToken,
                  disabled: saving.status === "saving" || (credential.configured && !credential.writable),
                  onChange: function (e) { setDigitalOceanToken(e.target.value); }
                }),
                el("button", {
                  style: saving.status === "saving" || (credential.configured && !credential.writable) ? st.btnDisabled : st.btnPrimary,
                  disabled: saving.status === "saving" || (credential.configured && !credential.writable),
                  onClick: saveDigitalOceanCredential
                }, saving.status === "saving" ? t("保存中…") : t("保存并查询"))
              ),
              credential.configured && !credential.writable
                ? el("div", { style: st.note, marginTop: 6 }, t("当前 Token 来自只读环境变量；请在原来源中修改，页面不会覆盖它。"))
                : null,
              saving.status === "done" ? el("div", { style: st.note, marginTop: 6, color: C.ok, opacity: 1 }, t("Token 已安全保存；页面和 API 响应不会回传明文。")) : null,
              saving.status === "error" ? el("div", { style: st.err, marginTop: 6 }, (saving.errorKey ? t(saving.errorKey) : saving.error)) : null
            )
          : null,
        d && d.ok && d.provider === "siliconflow"
          ? el("div", { style: Object.assign({}, st.infobox, { marginTop: 22 }) },
              el("div", { style: st.infoboxTitle }, t("SiliconFlow 查询说明")),
              d.zeroBalance
                ? el("div", null,
                    el("div", null, t("公开 API 已成功返回 ¥0.00。SiliconFlow 的 /v1/user/info 当前不返回代金券或历史用量；控制台可用总额可能非零。这里忠实展示 API 原始余额字段，不把它等同于控制台完整额度。")),
                    el("a", { style: st.actionLink, href: selected.actionUrl, target: "_blank", rel: "noreferrer" }, selected.actionLabel)
                  )
                : el("div", null, t("余额卡片展示 SiliconFlow /v1/user/info 公开 API 返回的原始余额字段。")),
              el("div", { style: { marginTop: 12, fontWeight: 600 } }, t("返回字段")),
              (d.fieldDefinitions || []).map(function (item) {
                return el("div", { key: item.name, style: { marginTop: 4 } }, item.name + "：" + tb(item.meaningKey));
              })
            )
          : null,
        provider === "siliconflow"
          ? el("div", { style: Object.assign({}, st.infobox, { marginTop: 14 }) },
              el("div", { style: st.infoboxTitle }, t("凭据读取规则")),
              el("div", null, t("插件只检查“设置 → 模型”中 Provider ID 或显示名为 siliconflow 的提供商，并读取其 apiKeyEnv 对应的已保存 API Key。")),
              el("div", { style: st.note, marginTop: 6 }, t("如果未找到提供商、未填写 API Key 或凭据引用失效，插件会停止查询并说明需要修复的配置；不会回退到其他服务商的 Key。"))
            )
          : null,
        provider === "qwen-token-plan"
          ? el("div", { style: Object.assign({}, st.infobox, { marginTop: 14 }) },
              el("div", { style: st.infoboxTitle }, t("百炼 Token Plan 查询说明")),
              el("div", null, t("本查询复用百炼 CLI（bl）的“控制台登录”OAuth token，不需要阿里云 AccessKey，权限面很小。")),
              el("div", { style: st.note, marginTop: 6 }, t("如尚未登录，请先在终端执行：bl auth login --console，然后回到本页点“查询余额”。")),
              el("a", { style: st.actionLink, href: selected.actionUrl, target: "_blank", rel: "noreferrer" }, selected.actionLabel || t("打开百炼 CLI 登录说明"))
            )
          : null,
        d && d.ok ? el("div", { style: st.note }, (d.sourceNoteKey ? tb(d.sourceNoteKey) : (d.sourceNote ? t(d.sourceNote) : "")) + (credentialMeta.length ? " " + credentialMeta.join(__LANG === "en" ? "; " : "；") + (__LANG === "en" ? "." : "。") : "")) : null,
        el("div", { style: st.note }, t("DigitalOcean 查询的是主账户 Billing API；DigitalOcean AI 推理 Key 与 AMD GPU Cloud 推理 Key 均不能直接查询账单。"))
      );
    }

    // ── 消息底部 token 入口（conversation.chat.assistant-actions）──
    // 时长格式化为「Xm Ys」/「X分Y秒」
    var fmtDur = function (ms) {
      if (!ms || ms <= 0) return "0s";
      var secs = Math.round(ms / 1000);
      var m = Math.floor(secs / 60), r = secs % 60;
      if (m > 0) return __LANG === "en" ? (m + "m" + r + "s") : (m + "分" + r + "秒");
      return __LANG === "en" ? (r + "s") : (r + "秒");
    };

    var __tok = {
      overlay: { position: "fixed", inset: 0, zIndex: 2147483000, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
      card: { background: "#ffffff", color: "#1c2733", borderRadius: 12, maxWidth: "min(680px, 94vw)", width: "100%", maxHeight: "calc(100vh - 40px)", overflowY: "auto", scrollbarWidth: "none", msOverflowStyle: "none", boxShadow: "0 14px 44px rgba(0,0,0,.4)", padding: "14px 16px", fontSize: fs(FS.md) },
      title: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: fs(FS.lg), fontWeight: 600, marginBottom: 10 },
      hint: { fontSize: fs(FS.sm), opacity: 0.6, marginBottom: 10 },
      row: { display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid #eef1f5", fontSize: fs(FS.md) },
      cellModel: { flex: "0 0 32%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
      cellTime: { flex: "0 0 14%", opacity: 0.7, fontSize: fs(FS.sm) },
      cellT: { flex: "0 0 11%", textAlign: "right", whiteSpace: "nowrap" },
      cellPeriod: { flex: "0 0 6%", textAlign: "center", fontWeight: 600 },
      cellCost: { flex: "0 0 16%", textAlign: "right", whiteSpace: "nowrap", fontWeight: 600 },
      title2: { fontSize: fs(FS.lg), fontWeight: 600, margin: "12px 0 6px" },
      statRow: { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 },
      stat: { flex: "1 1 0", minWidth: 96, background: "#f5f7fa", borderRadius: 8, padding: "8px 10px" },
      statLabel: { fontSize: fs(FS.sm), opacity: 0.6, marginBottom: 2 },
      statValue: { fontSize: fs(FS.xl), fontWeight: 700 },
      barWrap: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
      barTrack: { flex: 1, height: 12, borderRadius: 999, background: "#eef1f5", overflow: "hidden" },
      barFill: { height: "100%", borderRadius: 999, background: "#22a45d", transition: "width .3s ease" },
      barLabel: { fontSize: fs(FS.sm), whiteSpace: "nowrap", opacity: 0.85 },
      mCard: { background: "#f7f8fa", borderRadius: 8, padding: "8px 10px", marginBottom: 8 },
      mHead: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 4 },
      mName: { fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: fs(FS.md), flex: "1 1 0", minWidth: 0 },
      mCost: { color: "#1c2733", fontWeight: 700, whiteSpace: "nowrap" },
      mLine: { fontSize: fs(FS.sm), opacity: 0.85, overflowWrap: "anywhere" },
      close: Object.assign({}, st.btn, { marginLeft: "auto" })
    };

    function MessageTokenAction(props) {
      var messageId = props.messageId;
      var sessionId = props.sessionId;
      var openState = React.useState(false);
      var open = openState[0], setOpen = openState[1];
      var dataState = React.useState({ status: "idle", data: null });
      var s1 = dataState[0], setData = dataState[1];
      // 从会话快照读取该消息的完成时间与所在步骤开始时间，用作“本轮”时间窗
      var msgTime = 0, stepStart = 0;
      if (props.useSession && typeof props.useSession === "function") {
        try {
          var pick = function (f) {
            return props.useSession(function (snap) {
              if (!snap || !snap.chat || !snap.chat.nodes) return 0;
              var arr = typeof snap.chat.nodes.values === "function" ? snap.chat.nodes.values() : null;
              if (!arr) return 0;
              for (var ni = 0; ni < arr.length; ni++) {
                var vh = arr[ni];
                if (!vh || !vh.data) continue;
                var fin = vh.data.finalNode || (vh.data.closing && vh.data.closing.finalNode) || null;
                if (fin && fin.messageId === messageId) return f(fin);
              }
              return 0;
            }) || 0;
          };
          msgTime = pick(function (fin) { return fin.time || 0; });
          stepStart = pick(function (fin) { return (fin.timing && fin.timing.stepStartTime) || 0; });
        } catch (e) {}
      }

      React.useEffect(function () {
        var from = stepStart || (msgTime ? (msgTime - 5 * 60 * 1000) : 0);
        var to = msgTime || 0;
        if (!sessionId) { setData({ status: "idle", data: null }); return; }
        setData({ status: "loading", data: s1.data });
        api({ action: "tokenForMessage", sessionId: sessionId, from: from, to: to }).then(function (res) {
          setData({ status: res && res.ok ? "done" : "error", data: res });
        }).catch(function () { setData({ status: "error", data: null }); });
      }, [messageId, sessionId, msgTime, stepStart]);

      var convo = s1.status === "done" && s1.data && s1.data.conversation ? s1.data.conversation : null;
      var agg2 = s1.status === "done" && s1.data && s1.data.aggregate ? s1.data.aggregate : null;
      var recs = s1.status === "done" && s1.data && s1.data.records ? s1.data.records : [];
      // 四桶互斥求和，不含 reasoning（它是 output 的子集，宿主语义如此）。
      var convoTokens = convo ? (convo.input + convo.cacheRead + convo.cacheWrite + convo.output) : 0;
      var turnTokens = agg2 ? (agg2.input + agg2.cacheRead + agg2.cacheWrite + agg2.output) : 0;
      var label = t("获取中…");
      if (s1.status === "error") label = "—";
      if (s1.status === "done") {
        if (agg2) label = t("本轮 token") + " " + fmtInt(turnTokens);
        else if (convo) label = t("本轮 token") + " " + fmtInt(convoTokens);
        else label = "—";
      }

      // 按本轮记录聚合模型
      var byModel = {};
      for (var bi = 0; bi < recs.length; bi++) {
        var br = recs[bi];
        var mk = br.model || br.modelKey || "unknown";
        var m = byModel[mk];
        if (!m) { m = byModel[mk] = { model: mk, calls: 0, input: 0, cacheRead: 0, cacheWrite: 0, output: 0, reasoning: 0, peakCost: 0, offCost: 0, totalCost: 0 }; }
        m.calls++;
        m.input += br.inputTokens; m.cacheRead += br.cacheReadTokens; m.cacheWrite += br.cacheWriteTokens;
        m.output += br.outputTokens; m.reasoning += br.reasoningTokens;
        if (br.peak) m.peakCost += br.autoCost; else m.offCost += br.autoCost;
        m.totalCost += br.autoCost;
      }
      var modelRows = [];
      for (var mk2 in byModel) modelRows.push(byModel[mk2]);

      function stat(label2, value2) {
        return el("div", { style: __tok.stat },
          el("div", { style: __tok.statLabel }, label2),
          el("div", { style: __tok.statValue }, value2)
        );
      }

      function cacheBar() {
        if (!agg2) return null;
        var pct = Math.min(100, Math.max(0, agg2.hitRate));
        return el("div", { style: __tok.barWrap },
          el("div", { style: __tok.barTrack },
            el("div", { style: Object.assign({}, __tok.barFill, { width: pct + "%" }) })
          ),
          el("span", { style: __tok.barLabel }, t("缓存命中率") + " " + (pct ? pct.toFixed(1) : "0") + "%")
        );
      }

      function models() {
        if (!recs.length) return null;
        modelRows.sort(function (x, y) { return (y.totalCost - x.totalCost) || (y.calls - x.calls); });
        var MAX_MODELS = 6;
        var shown = modelRows.slice(0, MAX_MODELS);
        var extra = modelRows.length - shown.length;
        var cards = shown.map(function (m, idx) {
          return el("div", { key: String(idx), style: __tok.mCard },
            el("div", { style: __tok.mHead },
              el("span", { style: __tok.mName, title: m.model }, m.model),
              el("span", { style: __tok.mCost }, fmtMoney(m.totalCost))
            ),
            el("div", { style: __tok.mLine },
              t("输入·未命中") + " " + fmtInt(m.input) + " · " + t("缓存命中") + " " + fmtInt(m.cacheRead) + " · " + t("输出") + " " + fmtInt(m.output) + (m.reasoning ? " · " + t("推理") + " " + fmtInt(m.reasoning) : "")
            ),
            (m.peakCost > 0 || m.offCost > 0) ? el("div", { style: __tok.mLine },
              el("span", { style: { color: C.warn } }, t("峰") + " " + fmtMoney(m.peakCost)),
              " · ",
              el("span", { style: { color: "#3d6bd6" } }, t("谷") + " " + fmtMoney(m.offCost))
            ) : null
          );
        });
        if (extra > 0) cards.push(el("div", { key: "more-models", style: __tok.hint }, t("…及另外 ") + fmtInt(extra) + t(" 个模型（完整列表见「用量与消耗」页签）")));
        return el("div", null, cards);
      }
      function turnStats() {
        if (!agg2) return null;
        // 记录只存开始时间，单条调用时 min/max 相同会算成 0；本轮耗时直接用
        // 该消息所在 step 的起止（完成时间 − step 开始时间），才是真实耗时。
        var span = (msgTime && stepStart) ? (msgTime - stepStart) : ((agg2.time && agg2.time.end) ? Math.max(0, agg2.time.end - agg2.time.start) : 0);
        return el("div", { style: __tok.statRow },
          stat(t("本次输出"), fmtInt(agg2.output)),
          stat(t("本轮 token"), fmtInt(turnTokens)),
          stat(t("本轮消耗"), fmtMoney(agg2.totalCost)),
          stat(t("本轮耗时"), fmtDur(span)),
          stat(t("本轮缓存命中率"), (agg2.hitRate ? agg2.hitRate.toFixed(1) : "0") + "%")
        );
      }

      function summary() {
        if (!convo) return null;
        var span = (convo.time && convo.time.end) ? Math.max(0, convo.time.end - convo.time.start) : 0;
        return el("div", { style: __tok.statRow },
          stat(t("总 token"), fmtInt(convoTokens)),
          stat(t("总消耗"), fmtMoney(convo.totalCost)),
          stat(t("耗时"), fmtDur(span)),
          stat(t("缓存命中率"), (convo.hitRate ? convo.hitRate.toFixed(1) : "0") + "%")
        );
      }

      function body() {
        if (s1.status === "loading") return el("div", { style: __tok.hint }, t("获取中…"));
        if (s1.status === "error") return el("div", { style: __tok.hint }, t("查询失败"));
        if (!convo && !agg2) return el("div", { style: __tok.hint }, t("无 Token 数据"));
        var zero = convo ? (convoTokens === 0 && convo.totalCost === 0) : (turnTokens === 0 && agg2.totalCost === 0);
        if (zero) return el("div", { style: __tok.hint }, t("本期无消耗（所有用量为 0）"));
        return el("div", null,
          convo ? el("div", null,
            el("div", { style: __tok.title2 }, t("对话累计")),
            summary()
          ) : null,
          el("div", { style: __tok.title2 }, t("本轮明细")),
          turnStats(),
          cacheBar(),
          recs.length ? el("div", null,
            el("div", { style: __tok.title2 }, t("按模型")),
            models()
          ) : el("div", { style: __tok.hint }, t("本轮无记录")),
          el("div", { style: __tok.hint }, t("详细记录请在「用量与消耗」页签查看"))
        );
      }

      var overlayEl = open ? el("div", { key: "usage-tok-overlay", style: __tok.overlay, onClick: function () { setOpen(false); } },
        el("div", { style: __tok.card, "data-dsh-usage-tok": "1", onClick: function (e) { e.stopPropagation(); } },
          el("div", { style: __tok.title },
            el("span", null, t("Token 明细")),
            el("button", { style: __tok.close, onClick: function () { setOpen(false); } }, t("关闭"))
          ),
          body()
        )
      ) : null;
      if (overlayEl && ReactDOM && typeof ReactDOM.createPortal === "function" && typeof document !== "undefined" && document.body) {
        overlayEl = ReactDOM.createPortal(overlayEl, document.body);
      }
      return el("div", { style: { display: "inline-flex", alignItems: "center", gap: 4 } },
        el("button", { type: "button", key: "usage-tok",
          style: Object.assign({}, st.btn, { padding: "0 6px", minWidth: 0, fontSize: fs(FS.sm) }),
          title: t("Token 明细"),
          onClick: function () { setOpen(true); }
        }, label),
        overlayEl
      );
    }

    // ── plugin ──
    var inject = ["slots"];

    function apply(ctx) {
      var slots = ctx.get("slots");
      if (slots === undefined) return;
      var timer = ctx.get("timer");
      // 语言跟随宿主设置（通用设置 → 语言）：读取当前语言并订阅变化，切换后即时生效
      var locale = ctx.get("locale");
      if (locale) syncWithSystemLocale(locale);
      if (ctx.on) ctx.on("locale/change", function (snap) { setLang(snap && snap.active === "zh" ? "zh" : "en"); });

      slots.inject("conversation.view", function () {
        return slots.register(
          { name: "conversation.view", id: "usage-cost-view", order: 20, label: function () { return t("用量与消耗"); } },
          function () { return el("div", { style: st.tab }, el(UsagePanel, { timer: timer })); }
        );
      });

      slots.inject("conversation.view", function () {
        return slots.register(
          { name: "conversation.view", id: "balance-view", order: 30, label: function () { return t("剩余余额查询"); } },
          function () { return el("div", { style: st.tab }, el(BalancePanel, null)); }
        );
      });

      slots.inject("settings.section", function () {
        return slots.register(
          { name: "settings.section", id: "usage-cost", order: 30, label: function () { return t("用量与消耗"); } },
          function () { return el(UsagePanel, { timer: timer }); }
        );
      });

      slots.inject("settings.section", function () {
        return slots.register(
          { name: "settings.section", id: "balance", order: 31, label: function () { return t("剩余余额查询"); } },
          function () { return el(BalancePanel, null); }
        );
      });

      slots.inject("conversation.chat.assistant-actions", function () {
        return slots.register(
          { name: "conversation.chat.assistant-actions", id: "usage-token", order: 8 },
          MessageTokenAction
        );
      });
    }

    // test/debug surface: instant-switch guarantees, locale formatters, peak/off-peak
    // judgment, and the calendar grid layout (which column the 1st falls into).
    // （此前这里把同一个对象赋值了两遍，属于重复代码，一并去掉。）
    exports.__i18n = {
      t: t,
      tb: tb,
      msgText: __msgText,
      setLang: setLang,
      dayLabel: dayLabel,
      fmtMonthLabel: fmtMonthLabel,
      dailyStatsTitle: dailyStatsTitle,
      weekdayLabels: weekdayLabels,
      isPeakNow: isPeakNow,
      periodNow: periodNow,
      monthOffset: monthOffset,
      monthDays: monthDays
    };
    // test/debug surface: 视图组件本身，供渲染冒烟测试直接调用
    // （只做"能否渲染出树"的检查，不涉及宿主 slot 注册）。
    exports.__views = {
      OverviewView: OverviewView,
      CalendarView: CalendarView,
      PriceView: PriceView,
      CacheListView: CacheListView,
      BreakdownView: BreakdownView
    };
    // test/debug surface: 图表刻度排布（纯函数，便于直接验证不重叠）
    exports.__charts = { trendDateTicks: trendDateTicks };
    exports.inject = inject;
    exports.apply = apply;
    return module.exports;
  }
});