# Coaster Lab 10.0: daily streak + daily rewards

A reason to come back every day.

- **Daily streak 🔥**: one reward per calendar day (local midnight). The streak counts the days in a row; the best streak is kept.
- **7-day reward ladder**: 🪙30 / 40 / 60 / 80 / 100 / 120 / 250 coins with 50–300 XP, paid through the normal progress
  system (levels, badges and the shop all see it). Day 5 adds a 🎁 mystery cosmetic you don't own yet. Day 7 is the big one:
  the first time it unlocks the new **🔥 Inferno train skin** (only from the streak), later weeks another shop item you don't own.
- **Week bonus**: +10% per full week in a row, up to +50%.
- **🧊 Streak freeze**: covers one missed day by itself. Every player starts with one; day 7 refills it. Two missed days end the streak.
- **Titles**: "On Fire" (7 days in a row) and "Unstoppable" (30 days in a row).
- **Claim popup**: animated flame with the streak number, the week's seven tiles (done / today / day 7), freeze + best + bonus,
  one big Claim button, flying coins, coin sound and the unlock chime (gold on day 7), confetti when effects are on.
  It pops up once per visit for returning players. On a first visit it waits for the trailer, the title screen and a few
  seconds of play. Never over another dialog, the builder or a text box. A "Show this when I open the game" switch turns it off.
- **🔥 chip** on the HUD (red dot when a reward is waiting) and a **Daily reward** card on the title screen open it any time.
- Clock set backwards = nothing to claim, nothing lost. Daylight-saving days count as one day.

Code: `src/v10/post/20_streak.js` (rules in a `<core>` block with no DOM), `src/v10/css/52_streak.css`.
Data: `coasterlab.v10.streak` on this device only (not part of the cloud save; no database change).

Tests: `t19_streak_logic` (rules, plain node, 28 checks), `t19_streak_dom` (popup, chip, card, rewards, timing, jsdom, 37 checks),
`t19_streak` (the real game in Chromium at 390×844, 844×390, 320×568, 1280×720). The harness turns the popup off for the
other suites.
