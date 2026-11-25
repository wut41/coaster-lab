# Coaster Lab 8.6: phone UI/UX review

Scope: the new 8.6 screens (🪐 Gravity Lab, 💥 Disaster Mode, crash and 📋 Incident Report, 🧬 Evolve tab, 📅 Daily Challenge page, builder tab and share) and how they sit next to the older start screen, ⚙ Settings, 🎡 Park & tools and the HUD.

**Method.** I loaded `coaster_lab_v8_6.html` (7,510 lines when loaded) with `tests/harness.js` at 390×844 portrait and 844×390 landscape and opened each screen the way the tests do. Every screenshot is in `reports/design/` and has a JSON file next to it with three measurements:

* the size of every visible tap target;
* text contrast measured from pixels: the text is made transparent, the background under it is sampled, and the result is compared with the text's computed colour and opacity;
* overflow and clipped elements.

`hudcheck.js` measures how the HUD panels overlap. `fixcheck.js` injects two of the CSS fixes below into the live page and measures them before and after. Run the scripts from the repo root, for example `node reports/design/capture.js grav 390 844`.

**Limits.** Headless Chromium reports `env(safe-area-inset-*)` = 0. The developer was editing the file during the review, so line numbers are for the version I loaded.

**Overall.** The new screens reuse the 7.x/8.x visual language well: navy `#ov7` sheets, `.h7` small-caps headings, `.warn86` and `.ok86` callouts, and builder chips. They read as part of the same product. The Incident Report is the best new screen. The problems are mostly about **fit**: badges that push the HUD into the panels, panels whose main action is below the fold, a library tab bar that leaves almost no room in landscape, and a few contrast and target-size problems shared with the older components.

---

## P1: blocks or confuses players

### P1-1 · HUD: the 8.6 badges push the speed/height/G stats under the camera and side panels (portrait)
* **Where:** HUD at 390×844 with 🌙 Moon gravity and/or 💥 Disaster on. Screenshots:
  * `reports/design/hudc_moon_dz_390x844.png` (bug)
  * `reports/design/hudc_moon_390x844.png`
  * `reports/design/hudc_earth_390x844.png` (normal)
  * `reports/design/crash_390x844.png`
* **Code:**
  * `#modChip` at line 117 and `#dzChip` at line 964. The badge is created at line 7295 and is a block-level child of the `.brandT` grid (line 158), so each badge adds a new row.
  * `.camera,.side{top:calc(98px + env(safe-area-inset-top))}` is fixed at line 32.
* **Measured** (`hudcheck_390x844.json`):

  | State | Brand height | Stats bottom | Camera top | Overlap |
  |---|---|---|---|---|
  | Earth | 44 px | 100 | 104 | 0 px |
  | Moon | 58 px | | | 13 px |
  | Disaster | 58 px | | | 10 px |
  | Moon + Disaster | 72 px | | | **27 px** |

  With both on, SPEED, HEIGHT, MAX and the G "Feel" value are hidden behind the panels. Those are the readings players watch, and Gravity Lab exists to change them. Landscape is fine (`hudc_moon_dz_844x390.png`).
* **Fix:** keep the badges on the ride-name line. I injected this CSS and measured it (`fixcheck_hud.json`, screenshot `fix_hud_moon_dz_390x844.png`): the overlap drops from 27 px to 1 px, and the brand is 46 px tall even with "Glacier Hyperion".
  ```css
  @media(max-width:650px){
   .brandT{display:flex;flex-wrap:wrap;align-items:center;column-gap:6px;row-gap:0}
   .brandT>b{flex:0 0 100%}
   #rideName{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
   #modChip,#dzChip{margin-left:0;flex:none}
  }
  ```
  Optional safety net, so that future badges can never cover the panels: in JS, `new ResizeObserver(()=>document.documentElement.style.setProperty('--topB',$('.top').getBoundingClientRect().bottom+'px')).observe($('.top'))`. Then on line 32 use `.camera,.side{top:max(calc(98px + env(safe-area-inset-top)),calc(var(--topB,0px) + 4px))}`.

### P1-2 · Landscape builder: 🧬 Evolve and 📅 Daily get an 83 px window to scroll in
* **Where:** the builder library at 844×390. Screenshots:
  * `reports/design/evo_tab_844x390.png`
  * `reports/design/evo_results_844x390.png`
  * `reports/design/daily_tab_844x390.png`
* **Code:** `.lbC8{display:grid;grid-template-columns:repeat(5,1fr)}`, line 468. With 13 categories it lays out as 3 rows that are 178 px tall.
* **Measured:** the `.lbB8` content area is **83 px** tall. That is roughly one rule or one sentence. In landscape you cannot see Goal and the 🧬 Evolve button together, and you cannot see the rules and 📤 Submit together.
* **Fix:** in short viewports, make the categories a single scrolling row. Measured result (`fixcheck_lib.json`, `fix_lib_evo_844x390.png`): tabs go from 178 px to 68 px and content from 83 px to **193 px**.
  ```css
  @media(max-height:500px){#b8Lib .lbC8{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:minmax(64px,auto);overflow-x:auto;overscroll-behavior-x:contain}}
  ```
  Add this at the end of the `b8LibR` override (line 7398) so the active tab is never off-screen: `L_.querySelector('.lbC8 .on')?.scrollIntoView({inline:'nearest',block:'nearest'})`.

### P1-3 · The 8.6 overlays open part-way down the page (scroll position is never reset)
* **Where:** every page in the shared `#ov7` window. Seen in `reports/design/settings_moon_390x844.png`: Settings opened straight to GRAPHICS QUALITY because the Gravity Lab page had been scrolled. The new 🧪 Experiments block at the top was off-screen.
* **Code:** `function openOv7(k){…o.hidden=false;o.dataset.k=k;renderOv7()}`, line 2471. `.ov7In.scrollTop` is never reset.
* **Why it matters:** 8.6 sends many more trips through `#ov7`: Gravity Lab → Settings → Disaster → the automatic Incident Report → Daily. If a page opens mid-scroll, the player misses the stamp and the "Cause of failure" headline.
* **Fix:**
  ```js
  function openOv7(k){const o=$('#ov7'),c=o.querySelector('.ov7In');if(o.dataset.k!==k||o.hidden)c.scrollTop=0;o.hidden=false;o.dataset.k=k;renderOv7()}
  ```

### P1-4 · Close (✕) on every 8.6 page, and on Park & tools, is 32×35 px
* **Where:** `#ov7X` on Gravity Lab, Disaster Mode, Incident Report, Daily Challenge and Settings; `[data-hx=close]` in the hub. Screenshots: `grav_earth_390x844_p1.png`, `hub_390x844_p1.png`.
* **Code:** `.ov7H` (line 219) and `.hubH` (line 297) inherit the narrow-screen `.btn{font-size:12px;padding:9px 7px}` (line 16). Measured: **32×35** in portrait and 40×39 in landscape.
* **Why it matters:** this is the only way out of every new page, and it sits in the top corner, the hardest place to reach on an iPhone.
* **Fix:**
  ```css
  .ov7H .btn,.hubH .btn{min-width:44px;min-height:44px;font-size:16px}
  ```

---

## P2: noticeable

### P2-1 · Selected-state and primary buttons fail contrast; the colour changes per ride
* **Measured:**

  | Element | Contrast | Size |
  |---|---|---|
  | White on `var(--acc)` `#36a7ff`: selected planet (Gravity Lab), selected Graphics / Builder level / Events segments (Settings) | **2.58:1** | 13 px |
  | Planet m/s² caption, `.pl86 button small` (opacity .75, line 950) | **2.05:1** | 10.5 px |
  | `.btn.primary` / `.btn.active` gradient (line 43): 🌍 Back to Earth, ↻ Reset & ride again, 🏗 Build it now, Chase, Pause | **3.55:1** | 12 px |
  | `#dzChip`, white on `#e5484d` (line 964) | **3.91:1** | 10 px |

  `--acc` is set per ride (`setProperty('--acc',d.color)`, line 1422), so on lighter ride colours these ratios get worse.
* **Screenshots:** `grav_moon_390x844_p1.png`, `settings_390x844_p3.png`, `report_roll_390x844_p1.png` (purple primary button on Sky Serpent).
* **Fix:** darken the accent wherever white text sits on it, and use the builder's "tinted chip" style for selection, which also makes the game and builder consistent.
  ```css
  /* line 221 */ .seg7 button.on{background:color-mix(in srgb,var(--acc) 60%,#000);border-color:var(--acc)}           /* 6.3:1 with #36a7ff */
  /* line 950 */ .pl86 button small{opacity:1;color:#dbe7f7}
  /* line 43  */ .btn.active,.btn.primary{background:linear-gradient(180deg,color-mix(in srgb,var(--acc) 70%,#000),color-mix(in srgb,var(--acc) 52%,#000))!important}
  /* line 964 */ #dzChip{background:#c62f35}                                                                           /* 5.4:1 */
  ```

### P2-2 · Disabled buttons look exactly like enabled ones
* **Gravity Lab:** on Earth, "🌍 Back to Earth" is `disabled`, but it is drawn as the bright primary button. Measured opacity 1, cursor pointer, full gradient (`hudcheck_390x844.json`, screenshot `grav_earth_390x844_p1.png`). It looks like the main action and does nothing when tapped.
* **Evolve:** while a run is going, the Goal, How long and Seed controls are disabled but look live (`evo_running_390x844.png`).
* **Code:** there is no `.btn:disabled`, `.seg7 button:disabled` or `.sg8 button:disabled` rule. Only `.b8b`, `.bB`, `.b72` and similar have one (lines 65, 325, 495).
* **Fix:**
  ```css
  .btn:disabled,.seg7 button:disabled,.sg8 button:disabled{opacity:.4;cursor:default;box-shadow:none!important;filter:saturate(.3)}
  ```
  Better still on Earth: hide "Back to Earth" instead of disabling it (markup at line 7150, `${GL86.k==='earth'&&!mis?'hidden':''}`). The selected 🌍 Earth tile already shows the state.

### P2-3 · Evolve: "Your coaster now" card is 7 rows tall, and the run's main action sits below the fold
* **Where:** `evo_results_390x844.png` (after a run the panel auto-scrolls to this card, and it fills the visible area), `evo_tab_390x844_p1.png`, `evo_tab_390x844_p2.png`.
* **Bug:** `.evoR86>div{display:grid}` (line 989) also matches `.evoSt86` inside the base card (markup line 7391), so each stat chip becomes a full-width row.
  ```css
  .evoR86>.evoSt86{display:flex}
  ```
* **Layout:** at 390×844 the library sheet is about 505 px tall and 180 px of it is the category grid. "🧬 Evolve my coaster" is only reachable by scrolling, below an explanation paragraph plus Goal, How long and Seed.
  * Move the Evolve button directly under Goal.
  * Put How long and Seed inside a collapsed `<details><summary>More options</summary>…</details>` (markup lines 7386–7387).
  * The explanation paragraph (line 7384) can be cut to one sentence: "Evolve tries small changes to **your** coaster and keeps the best ones. Every result passes ✓ Check."
* **Copy** (line 7386): "Quick · 6 gen", "Normal · 10 gen" and "Long · 16 gen" are jargon. Use "Quick (6 rounds)", "Normal (10 rounds)", "Long (16 rounds)". For the Seed heading (line 7387): "Seed" with the hint "same number = same results".
* **Icon-only stat chips** (🎢 45 · 😵 48 · 🛋 100) are explained only by the "Key:" line at the very bottom (line 7393). Add `title`/`aria-label` to each chip in `evoStat86`, or move the key directly under "Best results".
* **Preview button** `.evoR86 .b8b.sm{min-height:38px}` (line 996) measures 84×38. Set `min-height:44px`.

### P2-4 · Library header says "Track pieces" on the Evolve and Daily tabs
* **Where:** all builder screenshots on these tabs, e.g. `daily_tab_390x844.png`. The header is hard-coded at line 7398 (and line 4625).
* **Why it matters:** a challenge and an AI generator are not "track pieces". New players won't look in "Track pieces" for the Daily Challenge they just tapped "Build it now" for.
* **Fix:** use the tab's title. On line 7398, replace `<b>Track pieces</b>` with `<b>${B8.lib==='evo'?'🧬 Evolve':B8.lib==='daily'?'📅 Daily Challenge':'Track pieces'}</b>`. If possible, also put a thin divider before the 🧬 and 📅 tabs, for example `.lbC8 [data-b8lib=evo]{border-left:1px solid var(--b8ln)}`, or give them their own row.

### P2-5 · Daily Challenge is filed under "🧪 Experiments" and can't be found from the start screen
* **Where:**
  * `hub_390x844_p2.png`: the 📅 tile sits in the Experiments group with Gravity Lab and Disaster Mode (line 7095).
  * Settings → 🧪 Experiments also lists it (line 7483).
  * The start screen (line 1088, `start_390x844.png`) has 11 entry cards and none of them is an 8.6 feature.
* **Why it matters:** a daily habit loop only works if players see it on launch. "Experiment" also suggests "unfinished or optional".
* **Fix:**
  * Move `daily86` into the "🎬 Fun & photos" group next to "⭐ Challenges & Level". Line 7095 becomes `['🧪 Experiments',['grav86','dz86']]`, and `'daily86'` is pushed into the Fun group.
  * Remove `expMore86b` from Settings.
  * Add a start-screen card after "▶ Ride now" (line 1088):
    ```html
    <button class="cta" data-go="daily86"><b>📅 Daily</b><small id="stDaily">Today's challenge</small></button>
    ```
    Wire it to `openOv7('daily86')`. This makes 12 cards, an even 2-column grid.

### P2-6 · Settings: the new Experiments block takes the whole first screen in landscape
* **Where:** `settings_844x390_p1.png` (the three Experiments rows fill the visible sheet; Graphics, Sound and the rest start off-screen) and `settings_390x844_p1.png`.
  * The block is inserted with `insertAdjacentHTML('afterbegin',expHTML86())`, line 7164.
  * The Disaster row has an extra "☐ On" checkbox (line 7329) that the other rows don't have, so the three rows have different shapes.
* **Fix:** with P2-5 applied, the section is two rows. Insert it *after* the first section (`beforeend`, or after the Graphics block) rather than at the top. Settings is where people go to fix performance and sound. Remove the inline checkbox so every row is "title + status + Open". The Disaster page already has the switch.

### P2-7 · Disaster Mode page: the on/off state is weak, and there is no "go ride" action
* **Where:** `dz_off_390x844_p1.png` vs `dz_on_390x844_p1.png`. The two states differ only by a 22 px checkbox and "off" → "**ON**". The red-tinted container (`.dzT86`, CSS around line 967, markup line 7321) looks identical in both.
* **Copy:** "This ride" says "💥 Looping Adventure **will** fly off the track…" while the mode is still off, which reads as if it's about to happen.
* **Fix:**
  * Make the state obvious:
    ```css
    .dzT86:has(input:checked){background:rgba(229,72,77,.28);border-color:#ff5a5f;box-shadow:0 0 0 2px rgba(255,90,95,.35)}
    ```
    (`:has` is supported on iOS 15.4+.) Alternatively, toggle a class in `setDz86`.
  * When off, prefix the prediction with "With Disaster Mode on, …" (line 7318), for example "With Disaster Mode on, Looping Adventure would fly off the track at the banked turn…".
  * When on, add a primary "▶ Ride it now" button next to "🪐 Gravity Lab" (line 7325) that runs `closeOv7();reset()`, so players don't have to find ✕ and then the play button.

### P2-8 · Crash view: the HUD panels cover the crash in portrait
* **Where:** `crash_390x844.png`. The camera list and side panel cover about 60% of the width at the moment the train flies off. The riders' parachutes and the flight are mostly hidden. "Ⅱ Pause ride" stays highlighted as if the ride were running.
* **Fix:** add a body class during the crash phase (set in `dzDerail86`, line 7240, and cleared in `dzEnd86`) and hide the panels:
  ```css
  body.dz86crash .camera,body.dz86crash .side,body.dz86crash .hint{opacity:0;pointer-events:none;transition:opacity .2s}
  ```

### P2-9 · Reduced motion is ignored by all of 8.6's motion
* None of the new motion checks `prefers-reduced-motion`:
  * the automatic crash camera (`camMode='crash'`, line 7247);
  * the flying cars and riders;
  * `confettiSmall()` on Daily pass (line 7460);
  * the progress-bar transition `.pb86 i` (line 957);
  * the rotated stamp.
* The JS never calls `matchMedia('(prefers-reduced-motion: reduce)')` (the only `matchMedia` calls are for `pointer:coarse` and `display-mode`). The CSS media queries only cover older classes (lines 115, 203, 253, 555).
* **Fix:** add `const RM86=matchMedia('(prefers-reduced-motion: reduce)').matches;`, then:
  * skip `confettiSmall` and the crash camera switch when it is true (keep the current camera; the report still opens);
  * add `@media(prefers-reduced-motion:reduce){.pb86 i{transition:none}.stamp86{transform:none}}`.

### P2-10 · Gravity Lab: the key result is at the very bottom
* **Where:** `grav_moon_390x844_p1.png` / `p2.png`. "✅ All 16 rides make it round", or the "⚠ 3 rides run out of speed" list, is the last element on the page (line 7154). It sits under the "About the G numbers" paragraph, about 1.5 screens down.
* **Fix:** move the `<div id="gl86">` block directly under the toggle and buttons, before the comparison table, and move "About the G numbers" to the end.
* **Copy:** shorten the toggle label (line 7149) to "Realistic planet (friction and air change too)".
* **Slider:** the custom-gravity slider is 28 px tall. Set `.sl7 input{min-height:44px}` (line 222); this also fixes every Settings volume slider.

---

## P3: polish

1. **Park & tools subtitle reads like a changelog.** "Coaster Lab 8.6 · Gravity Lab · Disaster Mode · Evolve · Daily Challenge" (line 1096) mentions Evolve, which isn't in the hub. Use "Run your park, try experiments, play today's challenge", or drop the subtitle.
2. **Gravity Lab tile doesn't show the current state** ("Moon, Mars, Jupiter…", line 7162). Disaster shows "Off · …". Use `gEarth86()?'🌍 Earth · try the Moon or Jupiter':gravTxt86()` so the tiles match.
3. **Zero-state streak copy:**
   * "🔥 0" in the hub tile and Settings (lines 7482–7483);
   * "🔥 **0** days in a row · best ever 0 · passed 0 in total" on the page (line 7476).

   Show the streak only when it is ≥ 1. Otherwise: "Pass today's challenge to start a 🔥 streak".
4. **Daily share:**
   * 📤 is used for both "Submit my coaster" and "Share" (lines 7471, 7473). Use "🔗 Share result".
   * After a pass, make Share the primary button and "Build it now" secondary on the page (`daily_page_after_390x844_p1.png`).
   * The page's Share button is **75×35** (`.btn` in `.dRes86`). Add `.dRes86 .btn,.dRes86 .b8b{min-height:44px;padding-inline:16px}` (line 1009).
   * The copy-fallback box has no instruction on screen (the hint is only a toast). Add `<small>Long-press to copy, then paste it in a message.</small>` above the `<textarea>` in `.shareBox86` (line 7473).
5. **Daily header repeats the title.** "📅 Daily Challenge" (window) / "DAILY CHALLENGE #329 · WED, NOV 25" (`.dly86>small`). On the page, show just "#329 · Wed, Nov 25".
6. **Incident Report copy** (`report_roll_390x844_p1.png`):
   * the rollback case number shows "Case #00000" because `r.seed` is unset for rollbacks (line 7311);
   * the element name with its index reads "on the drop 2";
   * the planet is repeated with its emoji: "🌙 Moon gravity wanted the train back… 🌙 Moon gravity won." (line 7300).

   Fixes: use `hash86(r.ride+r.s)` when `seed` is 0. Strip trailing numbers from `el` in `fill()` (`.replace(/\s*\d+$/,'')`). For `{planet}`, use a plain name such as "the Moon" or "Jupiter" instead of `gravTxt86()`.
7. **Incident Report in landscape:** the two action buttons are about 2 screens down (`report_derail_844x390_p1.png`). Make the action row sticky at the bottom of the sheet: `.inc86 .row7{position:sticky;bottom:0;padding:10px 0;background:linear-gradient(transparent,#0a1222 30%)}`.
8. **Evolve preview bar:** it shows "Max thrill #1" without the score gain. Append ` · score 46 (+1)`. The button order is flipped between portrait (✓ Place it bottom-left, ✕ Cancel top-right) and landscape (Cancel, then Place it), as seen in `evo_preview_390x844.png` vs `evo_preview_844x390.png`. Keep "Place it" in the same position in both.
9. **Sticky sheet headers** `.ov7H` (`rgba(10,18,34,.96)`, line 219) let scrolled content show through (see `grav_moon_390x844_p2.png`). Use an opaque `#0b1427`.
10. **Library close** `[data-b8=libClose]` is 40×40. Use `min-width:44px;min-height:44px`.

## What already works (keep it)

* All four new pages use the shared `#ov7` sheet, `.h7` headings, `.warn86` / `.ok86` callouts and builder `.b8b` / `.sg8` chips. They look native to the product.
* Copy is friendly and kid-safe:
  * "Nobody gets hurt: the riders pop out with parachutes 🪂";
  * "Scores stay on this device";
  * Wordle-style 🟩🟥 squares.
* The Incident Report stamp, the 2-column stat grid and "Official findings" fit 390×844 without scrolling to the actions.
* Locked secret rides are never named in the Gravity Lab ride list.
* Body text contrast on the navy sheets is strong: `--ink2` `#a9bbd6` on `#14213d` is 8.2:1.
* No horizontal overflow on any new page in either orientation. The only clipped text is the older builder title ("My…/Not…") in portrait.

## Top 3 recommendations

1. **Fix the HUD collision (P1-1) and the landscape library (P1-2).** These are the two places where 8.6 makes older screens worse. I injected both CSS patches above into the running page and measured them: HUD overlap goes from 27 px to 1 px, and the visible Evolve/Daily content in landscape goes from 83 px to 193 px.
2. **Make every 8.6 page open at the top with a 44 px ✕ (P1-3, P1-4), and give buttons a real disabled and selected style with AA contrast (P2-1, P2-2).** The new pages reuse shared components (`openOv7`, `.ov7H .btn`, `.seg7 .on`, `.btn.primary`), so each fix is a one- or two-line change that also fixes Settings and the older screens.
3. **Put the main action within one thumb-reach on each new screen.**
   * Evolve: the button sits under Goal, and Seed/length go under "More options" (P2-3).
   * Disaster: a clear ON state and a "▶ Ride it now" button (P2-7).
   * Gravity Lab: the ride check comes first (P2-10).
   * Daily: it moves out of "Experiments" and onto the start screen (P2-5).
