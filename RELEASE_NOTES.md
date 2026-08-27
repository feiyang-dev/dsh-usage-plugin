# Release Notes (English)

The authoritative **English** release notes for `@feiyang666/dsh-usage-plugin`.

Each new version's notes are added at the **top** of this file; the **[Version index](#version-index)** at the **bottom** is the default entry point for jumping to any release.

---

## v1.14.0 (2026-08-27)

This release focuses on **per-message token insights**, cleaner cost breakdowns, **system-level language sync**, and **mobile adaptation**.

### Per-message "Turn tokens" popup

After a turn finishes, the assistant message's footer action row gains a **"Turn tokens"** button. Clicking it opens a `Token Details` popup with two layers:

- **Conversation total** — the whole session's total tokens, total cost, run time and cache-hit rate;
- **This turn** — this output's tokens, turn tokens, turn cost, turn duration, turn cache-hit rate, a cache-hit bar, and per-model cards (each model's input·miss / cache hit / output (+ reasoning) plus its peak/off-peak cost split).

Durations are shown as `Xm Ys`. Every usage record is tagged with the conversation (`sessionId`), so per-turn and per-conversation stats are computed independently.

### Internal/tool calls grouped separately

Internal/placeholder calls (e.g. `dsh2shell-*` with model `fake`) no longer clutter the model cost tables; they are collected in a collapsible **"Tool calls (internal)"** group below the cost breakdown, so only real model calls count in the cost tables.

### Language follows the harness setting

The in-panel language toggle is removed; the plugin now follows the harness's own language setting (General Settings → Language) instantly, with no `localStorage` override — this also fixes the "still English after switching back" bug.

### Mobile adaptation

Tables fit the screen width on ≤900px (no horizontal scrollbar), wide tables collapse the middle columns, and the popup adapts to the viewport.

### Also fixed

- The popup previously rendered off-screen inside transformed ancestors — now portaled to `document.body`;
- Per-message windowing now reads the message's real step boundaries, so "this turn" and "conversation total" stats are truly independent;
- Wide tables no longer wrap numbers into unreadable lines.

---

## Version index

| Version | Date | English notes |
| --- | --- | --- |
| v1.14.0 | 2026-08-27 | [What's New in v1.14.0](#v1140-2026-08-27) |
