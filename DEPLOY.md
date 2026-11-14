# Deploying Trainway to Vercel

The repo lives at **github.com/Christospap11/trainway** and builds clean.
Follow these steps once to go live.

## 0. (Recommended) Rotate the Supabase secrets first
The database password and `service_role` key were shared during setup — treat them
as compromised and reset them, then use the **new** values in step 2.
- Supabase → **Settings → Database → Reset database password** → copy the new connection strings.
- Supabase → **Settings → API → Reset** the `service_role` key.
- Update your local `.env` with the new values too.

## 1. Import the repo into Vercel
1. Go to **https://vercel.com/new**
2. Sign in with **GitHub**, authorize the `Christospap11` account.
3. **Import** the `trainway` repository.
4. Framework preset auto-detects as **Next.js** — leave build/output settings at their defaults.
   (`postinstall` runs `prisma generate` automatically.)

## 2. Add Environment Variables (before clicking Deploy)
Expand **Environment Variables** and add these 5 (values from the Supabase dashboard):

| Variable | Where in Supabase | Notes |
|---|---|---|
| `DATABASE_URL` | Database → **Transaction pooler** (port `6543`) | append `?pgbouncer=true` — required for serverless |
| `DIRECT_URL` | Database → **Direct connection** (port `5432`) | used for migrations |
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → anon public key | |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → service_role key | keep secret |

## 3. Deploy
Click **Deploy** and wait for the build to finish. You'll get a URL like
`https://trainway.vercel.app`.

## 4. Point Supabase Auth at the new URL
Supabase → **Authentication → URL Configuration**:
- **Site URL** = your Vercel URL (e.g. `https://trainway.vercel.app`)
- **Redirect URLs** → add `https://trainway.vercel.app/auth/confirm`

(Without this, email login/password-reset links won't work in production.)

## Logins
- Admin: `admin@trainway.ai`, password from `SEED_ADMIN_PASSWORD`
- Trainer: `demo@trainway.ai`, password from `SEED_DEMO_PASSWORD`

## Notes
- `.env` and local reference docs are git-ignored — never commit real secrets.
- For production email volume, configure custom SMTP (Resend/SendGrid/Postmark) in
  Supabase → Auth → SMTP (the default is rate-limited to a few emails/hour).
