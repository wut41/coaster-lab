# Coaster Lab V10.9 — Developer upgrade report

> Converted to Markdown on 2026-11-27 from `Coaster_Lab_V10_9_Developer_Report.docx` (original kept next to this file). Wording unchanged.

*Release candidate planning  |  Baseline: V10.8  |  Target soft launch: December 1, 2026*

**Mission.** Turn the existing feature-rich simulator into a reliable, polished, mobile-friendly theme park experience. Preserve existing rides, custom tracks, park saves and user preferences. Do not replace working systems merely to increase feature count.


## Executive assessment

Holiday mode is a strong seasonal addition. The POV recorder, park simulation, track sharing and builder are valuable differentiators. The next release should prioritize security, save integrity, performance and onboarding. Feature ratings are subjective design assessments, not measured gameplay results.

| Priority | Release policy |
|---|---|
| **P0** | Block public release of affected online features until verified. |
| **P1** | Resolve or safely disable before launch. |
| **P2** | Schedule after launch gates; fix earlier when low-risk. |
| **P3** | Defer until core stability is demonstrated. |

### Recommended engineering allocation

40% bug fixes and security • 25% performance • 20% graphics and UI polish • 15% new features.


### Evidence and limitations

Sources: coaster_lab_v10_8.bin (HTML source) and Coaster_Lab_V10_8_Review.xlsx (four worksheets). The 11 audit items include static findings, risks, known limitations and tests still required. No live browser, device FPS, payment transaction or backend authorization test was performed. Source line references refer to the original V10.8 file.


## Ranked bug register


**01 · P0 · Owner / cloud authorization**

- *Evidence:* Security risk. Client-only owner/mod locks explicitly documented; server policies not supplied.
- *Implementation:* Verify Supabase RLS and server-side entitlement checks; never trust browser roles.
- *Acceptance:* Unauthorized account cannot read/write another account or grant paid access.
- *Source:* lines 5190–5223; 7192; 10545+.

**02 · P1 · Save recovery**

- *Evidence:* Test required. Local/cloud saves and recovery code exist; reliability not established.
- *Implementation:* Test quota errors, offline edits, conflict resolution and restore.
- *Acceptance:* No lost park after reload, offline sync or failed save.
- *Source:* lines 12938+; 10545+.

**03 · P1 · Holiday FPS**

- *Evidence:* Performance risk. Scene scan every 0.8s; shader recompiles when coating materials.
- *Implementation:* Profile on iPhone; batch scans and adapt effects to frame budget.
- *Acceptance:* Stable 30 FPS target on supported phones with busy park.
- *Source:* lines 14805–14845; 15048.

**04 · P1 · Recorder cleanup**

- *Evidence:* Static finding. Failed recorder construction returns without stopping captured video track; fallback may replace an earlier stream.
- *Implementation:* Stop all tracks on every failure and restore prior camera/seat.
- *Acceptance:* Repeated failed/cancelled recordings leave no live tracks.
- *Source:* lines 16113–16125; 16148–16155.

**05 · P2 · Holiday train skin**

- *Evidence:* Static finding. Holiday wrapper only substitutes when dz is falsy; refresh passes assigned design.
- *Implementation:* Define explicit custom-skin precedence; test assigned designs.
- *Acceptance:* Toggle restores exact original skin; intended festive override works.
- *Source:* lines 14970–14974.

**06 · P2 · Season dates**

- *Evidence:* Static finding. Winter Festival starts Dec 10; holiday visuals start Dec 1.
- *Implementation:* Align dates or clearly label separate events.
- *Acceptance:* Calendar and UI show intended dates consistently.
- *Source:* lines 4327; 14799.

**07 · P2 · Holiday auto rollover**

- *Evidence:* Static risk. Frame hook ticks effects but does not visibly re-evaluate calendar in holTick108.
- *Implementation:* Recheck date on focus and midnight.
- *Acceptance:* Open session changes correctly at Dec 1 / Jan 7.
- *Source:* lines 14799; 15033–15053.

**08 · P2 · Track code import**

- *Evidence:* Test required. Track code import/export module present.
- *Implementation:* Fuzz invalid, oversized and old-version codes; reject safely.
- *Acceptance:* Invalid import leaves existing track unchanged.
- *Source:* lines 15352–15541.

**09 · P2 · Holiday hats**

- *Evidence:* Known limitation. Flying trains explicitly skip hats.
- *Implementation:* Keep intentional exclusion or design compatible hats.
- *Acceptance:* No clipping on supported train styles.
- *Source:* lines 14980.

**10 · P2 · Simulation timing**

- *Evidence:* Static risk. Park stepping capped at six 0.1s steps.
- *Implementation:* Test long frames/background resume; define catch-up policy.
- *Acceptance:* No runaway economy or unexplained time loss.
- *Source:* lines 9917.

**11 · P2 · Shader compatibility**

- *Evidence:* Test required. Global Three.js shader chunks modified for snow.
- *Implementation:* Test all quality tiers, weather and custom materials.
- *Acceptance:* No shader compile errors or black surfaces.
- *Source:* lines 14803–14815.

## Feature scorecard

| Feature | Score / 10 | Direction | Next improvement |
|---|---|---|---|
| Holiday mode | 9 | Keep / improve | Add festive quest and quality control. |
| POV recorder | 9 | Keep / improve | Fix cleanup; test iOS export. |
| My Park simulation | 9 | Keep / improve | Improve feedback and balance. |
| Track Builder | 8.5 | Keep / improve | Guided first build and clear validation. |
| Track codes | 8.5 | Keep / improve | Preview before import; version checks. |
| Graphics / HD | 8 | Improve | Prioritize distinct scenery and stable FPS. |
| Staff / NPCs | 8 | Improve | Add varied animations and meaningful reactions. |
| Cloud saves | 8 | Improve | Verify recovery and security before launch. |
| Park construction | 8 | Keep / improve | Improve touch controls and onboarding. |
| Trailer / streaks | 6.5 | Simplify | Make trailer skippable; avoid intrusive prompts. |

Keep the existing feature set intact unless a release-blocking defect requires a temporary feature flag. Scores follow the spreadsheet, which uses slightly more conservative ratings than the earlier informal chat.


## Holiday mode: seasonal upgrade


### Preserve existing behavior

Keep snow, snow-coated scenery, twinkling lights, festive trees, presents, snowmen, candy-cane rails, Holiday Express, Santa hats and seasonal audio. Auto mode is December 1–January 6; retain manual on/off and auto settings. The source explicitly preserves assigned Train Studio designs and excludes flying trains from hats. Treat those as intended behavior unless the product owner chooses otherwise.


### Add a holiday quest and exclusive rewards

Proposal: complete three festive rides or reach a park visitor milestone to unlock a cosmetic decoration. Show progress and reward status in a compact seasonal panel. Persist rewards independently of the seasonal visual toggle; do not delete earned items when the event ends. No paid requirement.


### Add independent effect controls

Provide snow, lights and music toggles plus a low/medium/high preset. Low should reduce particle count, light density and update frequency. Keep user preferences across reloads. Use measured frame time to adjust costly effects rather than changing simulation speed.


### Unify seasonal messaging

Either align Winter Festival with December 1 or explicitly announce that the festival begins December 10 while winter visuals begin December 1. Re-evaluate auto mode on midnight and tab focus; manual choices must remain authoritative.


### Optional New Year event

Add an opt-in fireworks show and countdown based on local time, with reduced-motion and mute controls. Defer if performance or launch readiness is at risk.


## New features and product improvements


### Interactive tutorial — P1

Teach first ride, camera switching, building a short track, validation and saving in under two minutes. Allow skip, replay and touch-friendly guidance. Test with a first-time player.


### Themed scenery and stations — P2

Give each ride a recognizable silhouette, station, terrain and prop palette. Replace repetitive primitive shapes with optimized meshes, instancing and reusable assets. Compare screenshots and FPS before/after.


### Visitor satisfaction — P2

Expose queue time, price, cleanliness and ride excitement as understandable factors. Add varied NPC reactions and animations linked to actual park conditions; avoid random feedback unrelated to simulation.


### Track sharing — P2

Preview imported track metadata and geometry before replacing anything. Validate version, size, numeric bounds and track continuity. Invalid imports must never overwrite a working track.


### Park construction — P2

Improve mobile placement, rotation, copying, selection and undo. Add clear previews and confirmation for destructive actions. Preserve advanced tools without cluttering the beginner workflow.


### POV recording — P1

Preserve 10/15/30-second clips and portrait/landscape options. Detect supported formats, show actionable errors, release all media tracks and restore camera/seat state. Verify export on iOS Safari and desktop.


## Roadmap and scope control

| Priority | Item | When · effort and note |
|---|---|---|
| P0 | Fix: Cloud authorization and paid access | Before launch · Effort: High. Verify server rules; disable unverified paid flows. |
| P1 | Fix: Save and recorder reliability | Before launch · Effort: High. Run recovery and failure tests. |
| P1 | Improve: Mobile performance / low graphics | Before launch · Effort: High. Measure FPS with full park and snow. |
| P1 | Add: Interactive first-ride / first-build tutorial | Before launch · Effort: Medium. Teach controls in under two minutes. |
| P2 | Add: Holiday quest + exclusive cosmetic | December update · Effort: Medium. Reward a festive ride or park milestone. |
| P2 | Add: Holiday lighting quality slider | December update · Effort: Low. Separate snow, lights and music toggles. |
| P2 | Improve: Distinct ride scenery and stations | December update · Effort: High. Replace repetitive shapes with themed assets. |
| P2 | Add: Park visitor satisfaction breakdown | December update · Effort: Medium. Explain queues, price and cleanliness. |
| P2 | Remove / simplify: Repeated prompts and crowded menus | Before launch · Effort: Medium. Consolidate settings; keep advanced tools accessible. |
| P2 | Remove / defer: Unverified purchase or cloud sharing UI | Before launch · Effort: Low. Hide only if backend tests fail. |
| P3 | Defer: Multiplayer and huge new ride systems | After launch · Effort: High. Avoid scope creep until stability proven. |
| P3 | Add: New Year fireworks show | Later · Effort: Medium. Optional spectacle with reduced-motion setting. |

## Release QA and developer handoff


### Required test matrix

| Area | Required scenarios |
|---|---|
| Security | Two separate accounts; anonymous access; direct API attempts; owner and paid entitlement checks. |
| Save integrity | Offline edits, reload, quota failure, cloud conflicts, restore and migration from V10.8. |
| Holiday | Auto/manual toggles, Dec 1 / Jan 7 rollover, assigned skins, flying trains, weather and all graphics tiers. |
| Performance | iPhone Safari and desktop; busy park, snow, NPCs, recorder; target 30 FPS on supported phones. Record actual device and frame times. |
| Recorder | Unsupported browser, constructor failure, cancellation, repeated recordings, audio cleanup and playable export. |
| Regression | All existing rides, cameras, track builder, imports, park placement, undo, settings and saved data. |

### Implementation workflow

Create a V10.8 backup and a separate V10.9 branch. Assign each ranked item to one developer or agent. Make small reviewable changes; avoid simultaneous edits to the same module. Require independent QA before merging. Report each item as fixed, reproduced, not reproduced, deferred or blocked, with evidence and remaining risks.


### Release decision

Ship only when P0 authorization is verified or affected online flows are disabled, P1 reliability tests pass or affected features are safely disabled, and core ride/park regressions pass. Do not claim that a static review proves production security or performance. If the December 1 date conflicts with safety or stability, reduce scope rather than skip testing.

