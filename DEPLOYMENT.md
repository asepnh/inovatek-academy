# Deploying Inovatek Academy to your domain

This walks through getting the app live at your own domain using Vercel
(free tier is enough to start). Do these in order — each step depends on
the one before it.

## Step 1 — Push the code to GitHub

Vercel deploys from a Git repository, so the code needs to live on GitHub
(or GitLab/Bitbucket) first.

1. Create a free account at [github.com](https://github.com) if you don't
   have one.
2. Create a new **empty** repository (no README/license) — e.g. named
   `inovatek-academy`. Keep it Private unless you have a reason to make it
   public.
3. On your computer, open a terminal in the `inovatek-academy` project
   folder and run:

   ```bash
   git init
   git add -A
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/inovatek-academy.git
   git push -u origin main
   ```

   (Replace the URL with the one GitHub shows you after creating the repo.)

## Step 2 — Import into Vercel

1. Create a free account at [vercel.com](https://vercel.com) — sign up with
   your GitHub account, it's the smoothest path.
2. Click **Add New → Project**, then select the `inovatek-academy` repo you
   just pushed.
3. Vercel auto-detects Next.js — leave the build settings as default.
4. Before clicking Deploy, open **Environment Variables** and add every
   variable from your `.env.local` file:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` — set this to `https://YOUR-DOMAIN.com` (your
     real domain, decided now even though DNS isn't wired up yet — see
     Step 4)
   - `BILLPLZ_ENV`, `BILLPLZ_API_KEY`, `BILLPLZ_COLLECTION_ID`,
     `BILLPLZ_X_SIGNATURE_KEY`
   - `CRON_SECRET` — generate a long random string
5. Click **Deploy**. Vercel builds and gives you a temporary
   `*.vercel.app` URL — confirm the site loads there before moving on.

## Step 3 — Point your domain at Vercel

1. In your Vercel project, go to **Settings → Domains** and type in your
   domain (e.g. `academy.yourdomain.com` or `yourdomain.com`), then **Add**.
2. Vercel will show you one or two DNS records to create — usually either:
   - An **A record** (`@` → `76.76.21.21`) for a root/apex domain, or
   - A **CNAME record** (e.g. `www` or a subdomain → `cname.vercel-dns.com`)
3. Log into wherever you registered your domain (Namecheap, GoDaddy,
   Cloudflare, Google Domains, etc.), find its **DNS settings**, and add
   exactly the record(s) Vercel showed you.
4. DNS changes can take anywhere from a few minutes to a few hours to
   propagate. Vercel's Domains page will show a green checkmark once it
   detects the record and issues an SSL certificate automatically.

## Step 4 — Update Supabase to trust your real domain

In your Supabase project → **Authentication → URL Configuration**:

- Set **Site URL** to `https://YOUR-DOMAIN.com`
- Add `https://YOUR-DOMAIN.com/auth/callback` under **Redirect URLs**

This is what makes email confirmation / password reset links point to your
real domain instead of localhost or the `*.vercel.app` URL.

## Step 5 — Re-check the Billplz callback URL

Billplz needs to be able to reach `https://YOUR-DOMAIN.com/api/billplz/callback`
from its own servers. Since `NEXT_PUBLIC_SITE_URL` in Vercel is already set
to your domain (Step 2), new bills will automatically use the right
callback/redirect URLs — no extra Billplz-side config needed. Do one real
test payment end-to-end once DNS has propagated (Step 3) to confirm it
reaches your domain and marks the payment as paid.

## Step 6 — Go live checklist

- [ ] Domain resolves to the app over HTTPS (padlock shows in browser)
- [ ] Sign up as a parent, confirm the email link points to your domain
- [ ] Promote yourself to admin (see main README, Step 5)
- [ ] Create a real course, enroll a test student, approve the enrollment
- [ ] Trigger `/api/cron/generate-invoices?secret=YOUR_CRON_SECRET` once
      manually (visit the URL directly) to confirm invoices generate
- [ ] Do one real sandbox payment through to "paid"
- [ ] When ready for real money: switch `BILLPLZ_ENV` to `production` and
      swap in your production Billplz API key / collection ID / X-signature
      key in Vercel's environment variables, then redeploy
- [ ] Confirm the Vercel Cron job in `vercel.json` has your real
      `CRON_SECRET` (not the placeholder) before relying on it monthly
