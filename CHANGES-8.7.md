# Coaster Lab 8.7: 👑 VIP

**File:** `coaster_lab_v8_7.html` (still one HTML file). **Backup:** `coaster_lab_v8_6.html` is untouched.

All new game code is one clearly marked block near the end of the game script, `COASTER LAB 8.7 — 👑 VIP PACK`.
Same house rules as 8.0–8.6: older functions are wrapped (call the original, then add), never rewritten, and
8.7 saves live under `coasterlab.v87.*` only.

## What VIP gives you ($2, one time, forever)

* **3 exclusive golden coasters**, built and checked with the Track Builder engine (0 must-fix problems):

  | Coaster | Style | Height | Inversions | Lap |
  |---|---|---|---|---|
  | 👑 Golden Crown | Gold giga coaster, sunset palace | 196 ft | 0 (big airtime hills) | 76 s |
  | ✨ Midas Touch | Gold launch coaster, at night | 83 ft | 3 | 38 s |
  | 🔥 Gilded Phoenix | Gold inverted coaster, phoenix canyon | 156 ft | 3 | 73 s |

* **Upgraded graphics on the golden coasters:** polished gold rails (full metal, low roughness, stronger sky
  reflections, a warm inner glow), gold ties, a gold train with glowing jewel trim (ruby / bright gold / ember),
  glowing lamps along both rails, and gold dust drifting and twinkling around the whole track. The extras cost
  2 draw calls (one particle cloud, one instanced lamp mesh) and use fewer particles on 🐢 low graphics.
  If you give a golden coaster your own 🎨 Train Studio look, your look wins over the gold train.
* **VIP colours for every part:** gold, bright gold, antique gold, champagne, rose gold, platinum, ruby,
  royal purple, emerald and midnight:
  * 🎨 Train Studio: body, trim, seats, restraints, wheels & chassis, lights (a 👑 row under the normal swatches);
  * Track Builder style sheet: rails, ties, supports and station roofs.

## Where players find it

* 🎡 Park & tools → **👑 VIP** (first tile).
* Rides menu: the three golden coasters show as gold **👑 VIP** cards with their stats; tapping one opens the VIP page
  (instead of the "find the secret" shake used by the secret rides).
* 🎨 Train Studio: a **👑 VIP colours** button under the swatches until VIP is owned.

## How paying works

```
game ──(opens)──> Stripe Payment Link ($2, client_reference_id = anonymous player id)
Stripe ──(webhook: checkout.session.completed)──> Supabase function vip-webhook ──> table vip_purchases
game ──(asks every 4 s, and when you come back to the tab)──> Supabase function vip-status ──> "vip: true" → unlock
```

* **Stripe:** a Payment Link with **Managed Payments** on (Stripe is the merchant of record and handles US sales
  tax), product tax code `txcd_10201000` (video game content, permanent rights). Apple Pay and Link show up
  automatically. No Stripe secret key is stored anywhere: the backend only needs the webhook signing secret.
* **Supabase (project "Coaster lab"):**
  * table `vip_purchases`: row-level security on, **no policies**, so no browser can read or write it;
  * `vip-webhook`: checks Stripe's signature (HMAC-SHA256, 5-minute window), ignores unpaid or non-VIP
    checkouts, saves the purchase once (Stripe retries are safe), and makes a restore code like `K7Q2-MX4P`;
  * `vip-status`: answers "is this player VIP?" (by anonymous player id) or restores VIP on a new device with
    **the email you paid with + the restore code**.
* The game saves VIP under `coasterlab.v87.vip` and adds the hidden key `vip` to the secret-ride list. A progress
  reset can't take VIP away: the key is put back on every save.

## ⚠️ Before it can take money

1. **Webhook signing secret (needed even for test purchases).** Supabase Dashboard → project *Coaster lab* →
   Edge Functions → Secrets → add `STRIPE_WEBHOOK_SECRET`. Get the value from the Stripe Dashboard (test mode) →
   Developers → Webhooks → *Coaster Lab VIP unlocks* → Signing secret (starts with `whsec_`). Until it's set,
   `vip-webhook` answers "webhook secret not configured" and purchases are not recorded.
2. **Try a test purchase:** open 8.7, 👑 VIP → Get VIP, pay with card `4242 4242 4242 4242`, any future date, any
   CVC, any ZIP. The game should unlock within a few seconds and show your restore code.
3. **Go live** (only you can do this, in your live Stripe account):
   * make the same Payment Link in live mode ($2, Managed Payments on, tax code `txcd_10201000`, metadata
     `product = coaster_lab_vip`), and a live webhook endpoint to the same `vip-webhook` URL for
     `checkout.session.completed` and `checkout.session.async_payment_succeeded`;
   * put the live signing secret in `STRIPE_WEBHOOK_SECRET`, and the live link in `VIPCFG87.link` near the top
     of the 8.7 block in `coaster_lab_v8_7.html`.

## Known limits (honest)

* **It's a one-file browser game**, so the golden coasters ship inside the HTML. The server stops casual fakes
  (VIP is only granted after Stripe says "paid") and makes restores work, but someone who edits the game's code can
  unlock it for free. Locking that down would mean the server sends the VIP coaster data only after checking the
  purchase.
* **Restoring needs the restore code**, shown in the game right after buying (and on the 👑 VIP page). Lose the code
  and the old device, and the purchase can still be found by email in the Stripe Dashboard or the
  `vip_purchases` table.
* **If you close the game before Stripe confirms**, it keeps checking for 10 minutes the next time you open it.
  After that, use "I already paid — check again".
* The VIP page needs the internet. Once unlocked, VIP works offline.

## Tests

`tests/t6_vip.js` (34 checks, phone + desktop): locked VIP cards open the VIP page, $2 button and restore form,
unlock from a server "yes", restore code saved, VIP colours in both pickers, all three golden coasters finish a lap
with gold graphics on, gold turns off on normal rides, a progress reset keeps VIP, revoking locks it again, and 0
console errors. All the 8.6 suites were also run against 8.7.
