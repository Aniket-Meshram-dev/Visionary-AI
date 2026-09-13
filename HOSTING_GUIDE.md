# 🚀 Visionary.ai — Complete Hosting & Deployment Guide
### Backend on **Render** + Frontend on **Cloudflare Pages**

This guide gives you the exact settings and environment variables to host your full-stack project with 100% free-tier compatibility, zero routing errors, and fast global delivery.

---

## 🏗️ Architecture Overview

| Component | Platform | URL Type | Build Output |
|---|---|---|---|
| **Backend API** | [Render.com](https://render.com) (Web Service) | `https://your-app.onrender.com` | Express 5 / Node.js |
| **Frontend UI** | [Cloudflare Pages](https://dash.cloudflare.com) | `https://your-site.pages.dev` | Vite Single Page App (`dist/`) |
| **Database & Auth** | [Supabase](https://supabase.com) | `https://xxx.supabase.co` | PostgreSQL + GoTrue Auth |

---

## Part 1: Deploying Backend to Render (First Step)

Deploy the backend first so you get your live backend URL (e.g. `https://visionary-ai-api.onrender.com`).

### 1. Create Web Service on Render
1. Go to [dashboard.render.com](https://dashboard.render.com) and click **"New +"** → **"Web Service"**.
2. Connect your GitHub repository (`QuickAI-Full-Stack` or your repo name).
3. Configure the following settings:
   - **Name**: `visionary-ai-backend` (or your choice)
   - **Region**: Singapore / Frankfurt / Oregon (choose closest to your users)
   - **Branch**: `main`
   - **Root Directory**: `server` ⚠️ *(Crucial!)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

4. Click **Advanced**:
   - **Health Check Path**: `/health` *(Ensures zero downtime & automated recovery)*
   - **Auto-Deploy**: `Yes`

### 2. Add Environment Variables in Render Dashboard
Go to **"Environment"** tab and add these variables (you can copy values from your local `server/.env`):

| Variable Name | Required? | Example / Value |
|---|---|---|
| `PORT` | Yes | `3000` |
| `NODE_VERSION` | Yes | `20.18.0` |
| `SUPABASE_URL` | Yes | Copy from `server/.env` |
| `SUPABASE_ANON_KEY` | Yes | Copy from `server/.env` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Copy from `server/.env` |
| `GROQ_API_KEY` | Yes | Copy from `server/.env` |
| `GROQ_MODEL` | Yes | `groq/compound` |
| `POLLINATIONS_API_KEY` | Optional | Copy from `server/.env` |
| `CLOUDINARY_CLOUD_NAME` | Yes | Copy from `server/.env` |
| `CLOUDINARY_API_KEY` | Yes | Copy from `server/.env` |
| `CLOUDINARY_API_SECRET` | Yes | Copy from `server/.env` |
| `ADMIN_EMAILS` | Yes | `admin@gmail.com` |
| `VIP_PROMO_CODE` | Yes | `VISIONARY2026` |
| `STRIPE_SECRET_KEY` | Optional | Copy from `server/.env` |
| `RAZORPAY_KEY_ID` | Optional | Copy from `server/.env` |
| `RAZORPAY_KEY_SECRET` | Optional | Copy from `server/.env` |

5. Click **"Deploy Web Service"**.
6. Once deployed, test in browser: `https://your-service.onrender.com/health` → should return:
   ```json
   { "status": "ok", "service": "Visionary.ai API Engine" }
   ```
7. **Copy your Render URL**: e.g. `https://visionary-ai-backend.onrender.com`.

---

## Part 2: Deploying Frontend to Cloudflare Pages

### 1. Create Cloudflare Pages Project
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com).
2. On the left sidebar, click **"Workers & Pages"** → **"Create application"** → **"Pages"** tab → **"Connect to Git"**.
3. Select your GitHub repository.

### 2. Configure Build Settings
Fill in these exact build settings:

- **Project Name**: `visionary-ai` (or your choice)
- **Production Branch**: `main`
- **Framework Preset**: `Vite`
- **Root Directory**: `client` ⚠️ *(Crucial!)*
- **Build Command**: `npm run build`
- **Build Output Directory**: `dist` ⚠️ *(Crucial!)*

### 3. Add Environment Variables in Cloudflare Pages
Under **"Environment variables"**, click **"Add variable"**:

| Variable Name | Value |
|---|---|
| `VITE_BASE_URL` | Your Render URL from Part 1 (e.g. `https://visionary-ai-backend.onrender.com`) — **NO trailing slash!** |
| `VITE_SUPABASE_URL` | Copy from `client/.env` |
| `VITE_SUPABASE_ANON_KEY` | Copy from `client/.env` |
| `VITE_RAZORPAY_KEY_ID` | Copy from `client/.env` (optional) |

4. Click **"Save and Deploy"**.
5. Cloudflare will run `npm run build` and deploy to global edge network in ~45 seconds!

---

## Part 3: What We Already Configured for You (Pre-Audit)

To guarantee you don't face the common hosting bugs, the following fixes are already built into the codebase:

1. **SPA 404 Prevention (`client/public/_redirects`)**:
   - `/*  /index.html  200` is now inside `client/public/`.
   - Direct links like `/ai/review-resume` or page refresh will NEVER throw 404 errors.
2. **Cloudflare Security & Cache Headers (`client/public/_headers`)**:
   - Sets secure headers (`X-Frame-Options`, `X-Content-Type-Options`) and immutable caching for static assets.
3. **CORS Safe Mode (`server/server.js`)**:
   - Automatically reflects request origins and permits credentials/preflights from Cloudflare Pages.
4. **Render Health Check (`server/server.js`)**:
   - `/health` endpoint configured to prevent Render deployment timeouts.
5. **Express 5 Compatibility**:
   - Fixed wildcard route routing to prevent `path-to-regexp` crashes on Node 20+.
6. **Trailing Slash Stripping**:
   - Automatically strips any accidental trailing slash (`/`) from `VITE_BASE_URL`.

---

## Part 4: Post-Deploy Sanity Checklist

After both are live:
- [ ] Visit your Cloudflare Pages URL: `https://your-project.pages.dev`
- [ ] Sign in with email or OAuth (powered by Supabase)
- [ ] Try creating an article in **Write Article**
- [ ] Try generating an image in **Generate Images**
- [ ] Try auditing a resume in **Review Resume** (paste text or drop PDF)
- [ ] Test page refresh on `/ai/review-resume` (should stay on page without 404)
