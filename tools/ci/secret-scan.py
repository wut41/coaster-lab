#!/usr/bin/env python3
"""Coaster Lab secret scan.

Fails (exit 1) if a file contains something that must never be committed:
Supabase secret / service_role keys, Stripe secret or webhook keys, private keys,
GitHub / AWS / OpenAI / Anthropic tokens, or database URLs with a password.

The Supabase *publishable* key and the legacy *anon* JWT are public by design (their
power is decided by row-level security in the database), so they are reported as INFO,
not failures. Anything else that looks like a JWT is decoded and fails if its role is
not "anon".

  python3 tools/ci/secret-scan.py                 # scan files tracked by git (working tree)
  python3 tools/ci/secret-scan.py --history       # scan every blob in every branch's history
  python3 tools/ci/secret-scan.py FILE [FILE...]  # scan specific files (e.g. a build before committing it)
"""
import base64, json, re, subprocess, sys

FAIL = {
    "supabase secret key": rb"sb_secret_[A-Za-z0-9_-]{10,}",
    "stripe secret key": rb"\b(sk|rk)_(live|test)_[A-Za-z0-9]{10,}",
    "stripe webhook secret": rb"\bwhsec_[A-Za-z0-9]{10,}",
    "private key": rb"-----BEGIN [A-Z ]*PRIVATE KEY-----",
    "github token": rb"\bgh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}",
    "aws access key": rb"\bAKIA[0-9A-Z]{16}\b",
    "openai key": rb"\bsk-(proj-)?[A-Za-z0-9_-]{32,}",
    "anthropic key": rb"\bsk-ant-[A-Za-z0-9_-]{20,}",
    "database url with password": rb"postgres(ql)?://[^:\s'\"/]+:[^@\s'\"]{6,}@(?!localhost|127\.0\.0\.1)",
}
JWT = rb"eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}"
INFO = {"supabase publishable key": rb"sb_publishable_[A-Za-z0-9_-]{10,}"}
# Known, intentional test fixtures (not real credentials).
ALLOW_JWT_SUBSTR = [b"eyJzdWIiOiIxMjM0NTY3ODkwIn0"]  # jwt.io sample token used by tests/t22_diag.js


def jwt_role(tok):
    try:
        mid = tok.split(b".")[1]
        mid += b"=" * (-len(mid) % 4)
        return json.loads(base64.urlsafe_b64decode(mid)).get("role")
    except Exception:
        return None


def scan(data, label, fails, infos):
    for name, pat in FAIL.items():
        for m in re.finditer(pat, data):
            fails.append((name, label, m.group(0)[:24] + b"..."))
    for m in re.finditer(JWT, data):
        tok = m.group(0)
        if any(a in tok for a in ALLOW_JWT_SUBSTR):
            continue
        role = jwt_role(tok)
        if role == "anon":
            infos.add(("supabase anon JWT (public by design)", label))
        else:
            fails.append((f"JWT with role={role!r}", label, tok[:24] + b"..."))
    for name, pat in INFO.items():
        if re.search(pat, data):
            infos.add((name + " (public by design)", label))


def git(*args):
    return subprocess.run(["git", *args], capture_output=True, check=True).stdout


def main():
    args = sys.argv[1:]
    fails, infos = [], set()
    if args and args[0] == "--history":
        paths = {}
        for line in git("rev-list", "--objects", "--all").decode().splitlines():
            sha, _, path = line.partition(" ")
            if path:
                paths.setdefault(sha, path)
        p = subprocess.Popen(["git", "cat-file", "--batch"], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
        for sha, path in paths.items():
            p.stdin.write(sha.encode() + b"\n"); p.stdin.flush()
            kind, size = p.stdout.readline().split()[1:3]
            data = p.stdout.read(int(size)); p.stdout.read(1)
            if kind == b"blob":
                scan(data, f"{path} (blob {sha[:8]})", fails, infos)
        n = len(paths)
    else:
        files = args or git("ls-files").decode().splitlines()
        for f in files:
            try:
                scan(open(f, "rb").read(), f, fails, infos)
            except (IsADirectoryError, FileNotFoundError):
                pass
        n = len(files)
    for name, label in sorted(infos):
        print(f"INFO  {name}: {label}")
    for name, label, sample in fails:
        print(f"FAIL  {name}: {label}  [{sample.decode(errors='replace')}]")
    print(f"scanned {n} item(s): {len(fails)} problem(s), {len(infos)} info note(s)")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
