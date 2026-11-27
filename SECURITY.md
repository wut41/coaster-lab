# Security

## This repository is public

Anything committed here can be read by anyone, forever (removing a file later does not remove it from history).

## Never commit

* Supabase **secret** keys (`sb_secret_…`) or the **`service_role`** key
* Stripe secret keys (`sk_live_…`, `sk_test_…`, `rk_…`) or webhook secrets (`whsec_…`)
* Private keys, `.env` files, database URLs with passwords, GitHub / OpenAI / Anthropic / AWS tokens
* Real player data, real email addresses, or the owner passcode in plain text

## Safe to commit

* The Supabase **publishable** key (`sb_publishable_…`), the legacy **anon** key, and the project URL. They are meant
  to be public: what they can do is decided by row-level security (RLS) in the database, so RLS must stay correct.

## Automatic checks

`python3 tools/ci/secret-scan.py` runs on every push and pull request (GitHub Actions → *CI*). It fails on any of the
"never commit" patterns and notes the public keys as INFO. Run it yourself before committing a new build:

```bash
python3 tools/ci/secret-scan.py builds/coaster_lab_v10_10_0.html
python3 tools/ci/secret-scan.py --history     # every blob in every branch
```

Latest full scan: [`docs/security/SECRET-SCAN-2026-11-27.md`](docs/security/SECRET-SCAN-2026-11-27.md).

## If a secret is committed by mistake

1. **Rotate it first** (Supabase / Stripe dashboard). Deleting the commit is not enough; it is already public.
2. Then tell the owner. Do not force-push or rewrite history without the owner's approval.

## Reporting a problem

Open a private security advisory (repository → *Security* → *Report a vulnerability*) or contact the owner directly.
Please do not open a public issue for a security problem.
