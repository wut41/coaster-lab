# Coaster Lab — payment readiness (design only)

**Status: nothing here is switched on.** Coaster Lab 10.1 has no shop, no prices, no payment button, no payment
provider script and no premium unlock in the page. This folder is the plan for adding purchases later without
weakening anything, plus a database design that has been tested locally.

| File | What it is | Has it been run? |
|---|---|---|
| `README.md` | This design | — |
| `proposed_schema.sql` | Tables and functions for products, purchases, entitlements and the provider event log | Yes, on a throw-away local PostgreSQL 16 only. **Never on the real project.** It is deliberately not in `supabase/migrations` |
| `proposed_schema_tests.sql` | 47 checks of that schema (`bash supabase/tests/run.sh payments`) | Yes: 47 passed, 0 failed |
| `reference/create-checkout.ts`, `reference/payments-webhook.ts` | The two server functions the design needs, written out for review | **No.** Never deployed, never executed, no test account was created. Check every call against the provider's current documentation before use |

## 1. The rules (what "done properly" means here)

1. **The page never decides that something was bought.** It asks the server what the signed-in player owns. A URL
   like `…#shop=done`, a value in browser storage or a message from the page is never proof of payment.
2. **Only the payment provider's signed webhook marks a purchase paid**, handled by a server function. The player's
   browser coming back from the payment page proves nothing (they can type that address).
3. **No secret in the page.** The provider's secret or restricted key, its webhook signing secret and Supabase's
   service-role key live only in the server functions' secret store. The page keeps using the publishable key it
   has today.
4. **No card details ever touch Coaster Lab.** The player pays on the provider's own hosted page. The game does not
   load a card form, so it stays out of card-data (PCI) scope.
5. **Every event is applied at most once**, and a late or repeated event can never re-grant something refunded.
6. **Sell only what the server can check.** See the next section: this is the part that most shapes the design.

## 2. What can honestly be sold

Coaster Lab is one HTML file. Everything in it (every coaster, every colour, every line of code) is already on the
player's device, and My Park's money is single-player data stored on that device. Two consequences:

- **Park money, XP, perks and anything else in the local save must not be sold.** A player can edit their own save
  (10.1 cleans what it loads, but it cannot know whether $50,000 was earned or typed). Selling something the buyer
  could have typed in for free is unfair to the buyer and impossible to support. Making park money
  server-authoritative would mean moving the whole economy to the server: a different game, not an add-on.
- **An "unlock" that only the page checks is an honour system.** A flag such as `premium = true` in the page can be
  switched by anyone with the browser's developer tools. That is acceptable for a supporter badge shown to yourself
  or a cosmetic thank-you, as long as it is described that way. It is not acceptable as the only gate on something
  described as paid-for content.

What the server *can* enforce, because the server is where it lives:

| Could be sold | Where it is enforced | Notes |
|---|---|---|
| More cloud save slots, or bigger cloud saves | `cl_save_put` (database) checks `cl_has('…')` | Local saves stay unlimited and free |
| More published parks per account, longer park descriptions | `cl_publish_park` | Today: fixed limits for everyone |
| A supporter mark next to the player's name on leaderboards and live presence | The server adds it to what it returns (`cl_list_parks`), never the page | Today's 👑 in live presence is self-declared and cosmetic; a paid mark must come from the server |
| A supporter pack of extra scenery or train colours | Page only (honour system) | Say so plainly; never the only thing a purchase gives |

Only **one-time, non-consumable unlocks** are modelled. Consumables (coins) need a server-side wallet and
server-side spending for everything they buy, which this game does not have. Subscriptions add renewals, failed
renewals, cancellation and proration; if they are ever wanted, design them separately.

## 3. How a purchase would flow

```
 player's browser                 server functions (Supabase Edge)            payment provider       database
 ─────────────────                ───────────────────────────────            ────────────────       ────────
 1. cl_shop()  ───────────────────────────────────────────────────────────────────────────────────▶ what is for sale, what I own
 2. tap "Buy" (signed in)
    POST create-checkout ───────▶ checks the sign-in token
       { product }                looks the product up (never trusts a price
                                  or price id from the page)
                                  creates a hosted checkout ────────────────▶ session
                                  cl_purchase_begin(user, product, session) ─────────────────────▶ purchase: pending
    ◀──────────────── { url } ◀───
 3. browser goes to the provider's page, player pays there
 4.                               payments-webhook ◀──────── signed event ───
                                  verifies the signature (else 400, nothing happens)
                                  works out: paid / failed / expired / refunded / disputed
                                  cl_payment_event(event id, …) ─────────────────────────────────▶ once only: purchase paid,
                                                                                                    entitlement granted
 5. browser comes back to the game (or doesn't: step 4 never depends on it)
    cl_my_entitlements() ─────────────────────────────────────────────────────────────────────────▶ ["supporter"]
```

Later: a refund or a dispute arrives as another signed event and sets `revoked_at` on the entitlement. The row
stays as the record.

Points that are easy to get wrong:

- **Fulfil in the webhook, not on the return page.** A player can pay and lose their connection before the game
  reloads; a player can also open the return address without paying.
- **"Completed" is not always "paid".** With delayed payment methods (bank debits, vouchers) the checkout completes
  while the payment is still pending. The function grants only when the provider says the payment status is not
  `unpaid`, and handles the later "succeeded" and "failed" events.
- **The player is identified by the server**, from the verified sign-in token when the checkout is created, and
  carried through the provider as a reference. Nothing the page sends says who is buying.
- **Guests cannot buy.** A purchase belongs to an account, so that it survives a new phone. The shop asks a
  signed-out player to sign in first.

## 4. The database design (`proposed_schema.sql`)

Four tables, row level security on with **no policy**, and no privilege for the `anon` or `authenticated` roles:

| Table | Holds |
|---|---|
| `cl_products` | What can be bought: id, name, the provider's price id, and an `active` switch that starts off |
| `cl_purchases` | One row per checkout: player, product, provider session and payment ids, status, the amount charged |
| `cl_entitlements` | What a player owns: `(user_id, product_id)`, when granted, and `revoked_at` after a refund or dispute |
| `cl_payment_events` | Every provider event id that was accepted and what happened to it. No payload is kept |

Five functions:

| Function | Who may call it | Does |
|---|---|---|
| `cl_shop()` | anyone | What is for sale, and `owned` for the caller. Never returns a price id |
| `cl_my_entitlements()` | signed-in players | The product ids the caller owns |
| `cl_has(product)` | signed-in players | For other database functions to gate a feature next to the thing it protects |
| `cl_purchase_begin(user, product, session)` | service role only | Records a pending checkout. Refuses products not for sale and products already owned |
| `cl_payment_event(event_id, type, action, session, payment, amount, currency)` | service role only | Applies one verified event, once. Returns `granted`, `revoked`, `noted`, `already`, `duplicate`, `unknown` or `ignored` |

What the 47 tests show (run on a local PostgreSQL 16 with a stand-in for Supabase's roles; the real project runs
PostgreSQL 17):

- A signed-out or signed-in browser cannot read or write any of the four tables, cannot give itself a product,
  cannot mark a purchase paid, cannot write an event and cannot call either server-only function.
- A pending checkout grants nothing. A paid event for a checkout the database never started grants nothing.
- The same event delivered twice does nothing the second time; two different "paid" events for one checkout grant
  once.
- A refund or dispute (matched by payment id) revokes; a "paid" event arriving after the refund does not re-grant;
  an event about an old refunded payment does not touch a newer purchase of the same product.
- A player who owns a product cannot be sent to pay for it again; after a refund they can buy it again.
- Deleting an account removes its purchases and entitlements.
- The file can be run twice.

## 5. The two server functions (`reference/`)

Both are short. They are written for Supabase Edge Functions with Stripe's hosted Checkout, because the project is
already on Supabase and a hosted checkout page means the game needs no payment script. Another provider with signed
webhooks and a hosted page fits the same database design; only these two files change.

`create-checkout` (requires a signed-in caller):
reads the caller from the verified token → loads the product row with the service role → creates a hosted checkout
for that product's stored price id with the player's id as the reference → records it with `cl_purchase_begin` →
returns the checkout address. The return addresses are fixed in the function's settings, not taken from the request.

`payments-webhook` (called by the provider, not by players; sign-in checking is off for this one function and the
provider's signature is the authentication):
reads the raw body → verifies the signature with the signing secret → maps the event to an action → calls
`cl_payment_event` → answers 200. A database error answers 500 so the provider retries; the event id makes the
retry safe.

Keys those functions need, all as function secrets (never in the repository, never in the page):

| Secret | Use | Notes |
|---|---|---|
| Provider API key | Create checkouts | Use a **restricted** key limited to creating Checkout Sessions, not the full secret key |
| Webhook signing secret | Verify events | Treat exactly like an API key |
| Supabase service-role key | Call the two server-only database functions | Already provided to Edge Functions by Supabase; it never appears in the page |

## 6. What changes in the page (later, and only this)

- A shop panel that lists `cl_shop()`, with a Buy button that calls `create-checkout` and follows the address it
  returns. Signed-out players are asked to sign in.
- After sign-in and when the game regains focus: `cl_my_entitlements()`. The answer is held in memory. If it is
  cached for offline play, it is a convenience copy only and is replaced by the server's answer whenever the game is
  online.
- The Content-Security-Policy needs **no** new host for a redirect to a hosted checkout: the functions are on the
  project's own `…supabase.co` address, which `connect-src` already allows, and leaving the page is navigation, which
  the policy does not restrict. (If an embedded payment form were ever used instead, the provider's script, frame and
  connect hosts would have to be added, and the policy should then move from a `<meta>` tag to a response header.)
- Nothing is added to the local save. An entitlement is never written into `coasterlab.v10.*`.

## 7. Before any of this goes live: the owner's checklist

These are decisions and set-up steps for the owner. None of them is done.

1. **Who the players are.** Coaster Lab looks like a game children play. Selling to children is restricted in many
   places (parental consent, no pressure selling, clear prices, and platform rules). Get proper advice before
   offering anything for money; this document is not legal advice.
2. **Where it is sold.** As a web page, a hosted checkout is allowed. If the game is ever wrapped as an iPhone or
   Android app and sold through an app store, digital goods generally have to use that store's own purchase system;
   this design would then need a store-receipt verifier in place of the webhook.
3. **Tax.** Digital sales are taxed where the buyer is. Do not switch on automatic tax calculation until the business
   is registered where it needs to be: without a registration the provider calculates and collects nothing while it
   looks as if tax is on.
4. **Refund policy, terms, privacy notice** published where the shop is, and a way to contact a human.
5. **Provider account**: a separate test sandbox first; two-step sign-in on the account; restricted key; webhook
   endpoint registered for exactly the events the function handles.
6. **Run the database file on a Supabase branch or a copy first**, then the same 47 tests, then on the real project.
   The 10.0 and 10.1 migrations have to be applied before it (they are not applied yet either).
7. **Test the unhappy paths in the sandbox**: card declined, checkout abandoned, a delayed method that fails, a
   refund, a dispute, the same event sent twice, a forged event with a wrong signature.
8. **Watch it**: alert on webhook failures and on purchases stuck in `pending`.

## 8. Risks this design does not remove

- **Honour-system unlocks stay bypassable** (section 2). Only server-enforced products are really protected.
- **Account sharing.** An entitlement belongs to an account; nothing here limits how many devices sign in.
- **Chargeback abuse.** A disputed purchase is revoked, but a determined player can repeat it. The provider's fraud
  tools, not this schema, are the control.
- **The provider being unreachable.** Buying stops; owning does not (entitlements are in the project's own database).
- **The reference functions are unreviewed and unrun.** Treat them as a starting point for a developer with a test
  account, not as finished code.
