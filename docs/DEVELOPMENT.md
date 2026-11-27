# Developing Coaster Lab

> Moved here unchanged from the old top-level README (10.1) during the 2026-11-27 repository reorganization.
> It describes the 10.0/10.1 toolchain (`src/v10/` + `build.mjs`). See the note at the bottom about 10.2 and later.

## Changing 10.1

`coaster_lab_v10_1.html` is generated. Edit the files in `src/v10/`, then:

```bash
node build.mjs           # reads coaster_lab_v9_0.html (never changed), writes coaster_lab_v10_1.html
node build.mjs --check   # the same, plus a syntax check of the finished page
```

Two house rules keep it safe: wrap an existing function instead of rewriting it, and give every new field that is
saved with a park a line in `cleanPark10` (what is loaded from a save, a park code or the cloud is rebuilt field by
field, and anything not named there is dropped).

The build needs only Node.js (no packages). It applies a handful of small, checked text patches to the 9.0 page and
inserts the 10.0 styles, markup and scripts. If a patch no longer matches, the build stops and says which one.

## Cloud & accounts (optional)

The game works fully offline and without an account. Three things use the game's Supabase project
(`celqksoohozvqbdktapm`): publishing parks and leaderboards, live presence, and player accounts with cloud saves.

**The page contains only the project's publishable key.** That key is meant to be public; what it may do is decided in
the database. Never put a secret key (`sb_secret_…` or the `service_role` key) in the HTML.

Set-up, once:

1. **Database.** Run the three files in `supabase/migrations/` **in order** (Supabase dashboard → SQL Editor → paste →
   Run), ideally on a Supabase branch or a copy of the project first:
   * `20261113000000_coaster_lab_10_parks_and_accounts.sql` only adds things: three tables (`cl_parks`,
     `cl_park_ratings`, `cl_saves`) and fourteen functions.
   * `20261115000000_coaster_lab_10_1_hardening.sql` closes what the 10.1 audit found: it cleans names and
     statistics, checks that a park is a park, adds rate limits, counts a visit once a day, and removes privileges the
     browser roles never need. **It does change existing things**: the sign-up trigger now cleans the player name,
     `profiles` gets a rule that names are unique whatever their capitals, and signed-in players may change only their
     own `username`. If two existing players already have names that differ only in capitals, that one rule is left out and the file
     says so in a notice (rename one of them, then run the file again).
   * `20261127000000_coaster_lab_10_10_1_release_hardening.sql` closes what the 10.10.1 release attacks found
     (`supabase/tests/20_attacks.sql`): rate limits that a browser could reset with made-up headers or IPv6 addresses,
     names that imitate staff or other players with look-alike or invisible characters, and direct table writes that
     skipped the server checks. **It also changes existing things**: players can no longer write `cl_saves`,
     `profiles` or `coasters` directly (the game never does; everything goes through the `cl_*` functions), and
     `vip_purchases` loses its last browser grant. Report: `docs/security/RELEASE-10.10.1.md`.
   The top of each file says who can do what and how to undo it. Run all three, in order.
   **Until they are run**, park codes, accounts and everything offline work; publishing, leaderboards and cloud saves
   say they are not switched on yet.
2. **Sign-up without emails.** *(Security note, 2026-11-27: with Confirm email off and no CAPTCHA, a script can create
   unlimited accounts, and each account gets one rating per park. Prefer a real email sender (step 4) with Confirm
   email on before a public launch; see `docs/security/RELEASE-10.10.1.md`.)* Dashboard → Authentication → Sign In /
   Providers → Email: keep the Email provider on and switch **Confirm email off**. New accounts are then signed in at once and no email is sent. (If it stays on, the
   sign-in page says "confirm by email" instead of pretending; Supabase's built-in email sender only delivers a couple
   of emails an hour, and only to the project team's addresses.)
3. **Where reset links land.** Dashboard → Authentication → URL Configuration: set *Site URL* to the address the game
   is hosted at, and add it to *Redirect URLs*. Password-reset links come back to that address.

Later, when you want reset emails (and, if you like, email confirmation) to work for everyone:

4. **A real email sender.** Dashboard → Authentication → Emails → SMTP Settings: switch on custom SMTP and enter the
   details of a mail service (Resend, Postmark, SendGrid, Amazon SES, …). Nothing in the game changes: it already
   handles "confirm by email" and reset links. **Until then, password-reset emails hit the built-in limit** (about two
   an hour, team addresses only), so most players cannot reset a password by email; they can still change it while
   signed in (Account → Account settings).

Good to know:

* **Costs.** Everything fits Supabase's free plan for a small game: a published park or cloud save is one row of at
  most 400 kB (usually 20–60 kB), and live presence is one small WebSocket per player in a published park.
* **CAPTCHA.** Do not switch on Supabase's CAPTCHA protection yet: the sign-up form does not send a CAPTCHA token.
* **Deleting an account** is done by the owner in the dashboard (Authentication → Users). The player's cloud saves are
  removed with it; parks they published stay, without an owner.
* **Live presence** uses public Realtime channels. If "Allow public access" is switched off in Realtime settings,
  presence will not connect (the rest keeps working).

## Live migrations

What production (`celqksoohozvqbdktapm`) runs, from `supabase_migrations.schema_migrations`. The live version numbers
are the moments they were applied, not the repository file names.

| Live version | Name | Repository file |
|---|---|---|
| 20261107022611 · 20261107123455 · 20261107123546 | account_system_init · lock_down_rls_auto_enable · updated_at_trigger_and_policy_tuning | written out in `supabase/tests/01_live_baseline.sql` |
| 20261120155905 · 20261126213516 | create_vip_purchases · coaster_lab_least_privilege_table_grants | copied into `supabase/tests/02_live_2026-11-27.sql` |
| 20261127224018 | coaster_lab_10_parks_and_accounts | `supabase/migrations/20261113000000_coaster_lab_10_parks_and_accounts.sql` |
| 20261127224256 | coaster_lab_10_1_hardening | `supabase/migrations/20261115000000_coaster_lab_10_1_hardening.sql` |
| 20261127224359 | coaster_lab_10_10_1_release_hardening | `supabase/migrations/20261127000000_coaster_lab_10_10_1_release_hardening.sql` |
| 20261127224546 | coaster_lab_10_10_1_cl_plain_exact_text | none: it restates `cl_plain` from the file above, word for word. The copy step had turned the function's `\uXXXX` escapes into the invisible characters themselves (same behaviour); this put the escapes back |

Checked right after (2026-11-27): every `cl_*` function in production has the same source (md5), owner rights,
volatility, `search_path` and browser grants as a local database built from these files; the tables, grants, row
level security, policies and indexes are identical too.

## Builds after 10.1

Versions 10.2 to 10.10.0 were produced outside this repository and arrive as finished single-file builds in `builds/`.
The `src/v10/` sources here stop at 10.1, so `node build.mjs` still produces **10.1**, not the latest game.
Until the 10.2+ sources are reconciled (see `docs/REPOSITORY.md` → *Open questions*), treat the newest file in `builds/` as the source of truth and do not regenerate it with `build.mjs`.
