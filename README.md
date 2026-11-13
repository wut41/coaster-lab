# Coaster Lab

A 3D roller coaster simulator and theme park game in a single HTML file (three.js 0.160 from a CDN). Open the HTML file
in a browser (made for iPhone, works on desktop). No install, no build step needed to play.

| File | What it is |
|---|---|
| `coaster_lab_v10_0.html` | **Current version (10.0, the "Coaster Lab 3.0" upgrade)**: My Park tycoon mode with living visitors, 10 new coasters and 2 rebuilt flagships, 8 new train types, 🎲 Generate in the Track Builder, park sharing (codes, cloud, live presence) and optional player accounts |
| `coaster_lab_v9_0.html` | The previous version, kept untouched as a backup. 10.0 is built from this file |
| `coaster_lab_v8_6.html`, `coaster_lab_v8_5.html` | Older versions, also untouched |
| `src/v10/` + `build.mjs` | The source of everything 10.0 adds, and the script that puts it into one HTML file |
| `supabase/migrations/` | The database set-up for the park cloud and accounts |
| `CHANGES-10.0.md` | What 10.0 adds, how it is built, what was tested, known limits, what is left |
| `CHANGES-9.0.md`, `CHANGES-8.6.md`, `PLAN-8.6.md` | Notes for the older versions |
| `tests/` | Headless browser tests (see `tests/README.md`) |

Saves made by 8.5, 8.6 and 9.0 open in 10.0 unchanged. All files use the same browser storage, so going back to an older
file also works (My Park data is stored under its own keys and is ignored by the older files).

## Changing 10.0

`coaster_lab_v10_0.html` is generated. Edit the files in `src/v10/`, then:

```bash
node build.mjs           # reads coaster_lab_v9_0.html (never changed), writes coaster_lab_v10_0.html
node build.mjs --check   # the same, plus a syntax check of the finished page
```

The build needs only Node.js (no packages). It applies a handful of small, checked text patches to the 9.0 page and
inserts the 10.0 styles, markup and scripts. If a patch no longer matches, the build stops and says which one.

## Cloud & accounts (optional)

The game works fully offline and without an account. Three things use the game's Supabase project
(`celqksoohozvqbdktapm`): publishing parks and leaderboards, live presence, and player accounts with cloud saves.

**The page contains only the project's publishable key.** That key is meant to be public; what it may do is decided in
the database. Never put a secret key (`sb_secret_…` or the `service_role` key) in the HTML.

Set-up, once:

1. **Database.** Run `supabase/migrations/20261113000000_coaster_lab_10_parks_and_accounts.sql` (Supabase dashboard →
   SQL Editor → paste → Run). It only adds things: three tables (`cl_parks`, `cl_park_ratings`, `cl_saves`) and
   fourteen functions. The existing `profiles` and `coasters` tables and the sign-up trigger are not changed. The top
   of the file says who can do what and how to undo it. **Until this is run**, park codes, accounts and everything
   offline work; publishing, leaderboards and cloud saves say they are not switched on yet.
2. **Sign-up without emails.** Dashboard → Authentication → Sign In / Providers → Email: keep the Email provider on and
   switch **Confirm email off**. New accounts are then signed in at once and no email is sent. (If it stays on, the
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
