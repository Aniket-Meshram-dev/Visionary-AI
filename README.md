# ⚡ QuickAI — Full-Stack AI Content & Media Generation Platform

[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.0.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v25-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/Neon_PostgreSQL-Serverless-00E599?style=flat-square&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth_%26_Billing-6C47FF?style=flat-square&logo=clerk&logoColor=white)](https://clerk.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media_%26_AI-3448C5?style=flat-square&logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.0_Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)

> **QuickAI** (also known as Visionary AI / ContentAI) is a full-stack, enterprise-grade AI SaaS application that empowers creators, developers, and professionals with a comprehensive suite of AI-powered tools: Article Writing, Text Summarization, Code Generation, Text-to-Image Generation, AI Background Removal, Generative Object Removal, and Resume Reviewing.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
  - [1. AI Article Writer](#1-ai-article-writer)
  - [2. Summarize Text / Article](#2-summarize-text--article)
  - [3. Quick Code Generator](#3-quick-code-generator)
  - [4. AI Image Generation](#4-ai-image-generation-premium)
  - [5. AI Background Removal](#5-ai-background-removal-premium)
  - [6. Generative Object Removal](#6-generative-object-removal-premium)
  - [7. AI Resume Reviewer](#7-ai-resume-reviewer-premium)
  - [8. User Dashboard & History](#8-user-dashboard--history)
  - [9. Community Feed & Social Likes](#9-community-feed--social-likes)
  - [10. Authentication & Plan Gating](#10-authentication--plan-gating)
- [Tech Stack](#-tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Database Schema (Neon PostgreSQL)](#-database-schema-neon-postgresql)
- [API Documentation](#-api-documentation)
- [Environment Variables](#-environment-variables)
- [Installation & Getting Started](#-installation--getting-started)
- [Deployment (Vercel)](#-deployment-vercel)
- [Security & Access Control](#-security--access-control)

---

## 🌟 Overview

QuickAI delivers an end-to-end software solution combining modern web frontend technologies with multi-provider AI backend services. It implements:
- **Zero-friction authentication & tier enforcement** with Clerk.
- **Multi-modal AI inference**: Google Gemini 2.0 Flash via OpenAI-compatible endpoints, ClipDrop for text-to-image synthesis, and Cloudinary AI for generative media transformations.
- **Serverless PostgreSQL persistence** using Neon Database with raw parameterized SQL queries.
- **Dynamic usage gating**: 10 free credits for standard tools and strict premium subscription gating for compute-intensive media features.

---

## 🏛 System Architecture

```
                                  ┌───────────────────────────┐
                                  │    Client (React + Vite)   │
                                  │   Tailwind CSS + Clerk    │
                                  └─────────────┬─────────────┘
                                                │ (Bearer JWT Token)
                                                ▼
                                  ┌───────────────────────────┐
                                  │  Express 5 Backend Server │
                                  │   Clerk Auth Middleware   │
                                  └──────┬─────────────┬──────┘
                                         │             │
                    ┌────────────────────┼─────────────┼────────────────────┐
                    │                    │             │                    │
                    ▼                    ▼             ▼                    ▼
          ┌──────────────────┐ ┌────────────────┐ ┌───────────────┐ ┌───────────────┐
          │  Google Gemini   │ │  ClipDrop API  │ │  Cloudinary   │ │ Neon Postgres │
          │    2.0 Flash     │ │ Text-to-Image  │ │ AI Media Ops  │ │  Database     │
          │ (Articles, Code, │ │                │ │ (BG / Object  │ │  (Creations & │
          │  Summary, Resume)│ │                │ │  Removal)     │ │   Likes)      │
          └──────────────────┘ └────────────────┘ └───────────────┘ └───────────────┘
```

---

## ✨ Key Features

### 1. AI Article Writer
- **Route**: `/ai/write-article`
- **Model**: `gemini-2.0-flash`
- **Capabilities**:
  - Generates detailed, SEO-friendly articles based on user prompts.
  - Configurable length presets:
    - **Short**: 500–800 words (`max_tokens: 800`)
    - **Medium**: 800–1200 words (`max_tokens: 1200`)
    - **Long**: 1200+ words (`max_tokens: 1600`)
  - Live markdown rendering.
  - One-click copy-to-clipboard functionality.
  - Automatic persistence to database creation history.

### 2. Summarize Text / Article
- **Route**: `/ai/summarize-article`
- **Model**: `gemini-2.0-flash`
- **Capabilities**:
  - Compresses long articles, documents, and notes into concise summaries.
  - Custom percentage reduction input (1% to 99%).
  - Dynamically calculates token thresholds based on source text length.
  - Formatted markdown preview with quick copy button.

### 3. Quick Code Generator
- **Route**: `/ai/quick-code`
- **Model**: `gemini-2.0-flash`
- **Capabilities**:
  - Produces clean, runnable code snippets without conversational fluff.
  - Supports 11+ programming languages:
    - `JavaScript`, `Python`, `Java`, `C`, `C++`, `C#`, `Ruby`, `Go`, `TypeScript`, `PHP`, `Swift`.
  - Syntax block styling with dedicated clipboard copy action.

### 4. AI Image Generation (Premium)
- **Route**: `/ai/generate-images`
- **Engine**: ClipDrop API (`text-to-image/v1`) + Cloudinary CDN
- **Capabilities**:
  - High-resolution image generation from detailed text prompts.
  - 8 distinct artistic styles:
    - *Realistic*, *Ghibli style*, *Anime style*, *Cartoon style*, *Fantasy style*, *Realistic style*, *3D style*, *Portrait style*.
  - Direct Cloudinary CDN upload.
  - **Public Publishing Toggle**: Option to publish images directly to the public Community Feed.
  - Clean image downloader with prompt-based file naming.

### 5. AI Background Removal (Premium)
- **Route**: `/ai/remove-background`
- **Engine**: Cloudinary AI Background Removal (`effect: 'background_removal'`)
- **Capabilities**:
  - One-click upload of portraits, product photos, and graphics.
  - Automatically isolates the foreground subject and returns a transparent PNG.
  - One-click direct download with formatted filename.

### 6. Generative Object Removal (Premium)
- **Route**: `/ai/remove-object`
- **Engine**: Cloudinary Generative AI (`gen_remove:<object>`)
- **Capabilities**:
  - Upload an image and specify a single object name to erase (e.g., `watch`, `car`, `sign`, `cup`).
  - Seamlessly in-paints the removed area with context-aware pixels.
  - Direct download of the cleaned image.

### 7. AI Resume Reviewer (Premium)
- **Route**: `/ai/review-resume`
- **Engine**: `pdf-parse` + `gemini-2.0-flash`
- **Capabilities**:
  - Direct PDF resume upload (enforced 5MB size limit).
  - Server extracts raw text and feeds it to Gemini with structured evaluation criteria.
  - Returns thorough analysis covering:
    - Strengths & Key Highlights
    - Weaknesses & Red Flags
    - Formatting & Impact Advice
    - Actionable Improvement Steps

### 8. User Dashboard & History
- **Route**: `/ai`
- **Capabilities**:
  - Real-time statistics: Total Creations counter and Active Subscription Plan badge.
  - Chronological list of past generations (articles, code, summaries, images, resume reviews).
  - Collapsible cards with Markdown rendering for text and image previews.
  - Quick action buttons: Copy text, Download images, and Delete item.
  - Delete confirmations via **SweetAlert2**.

### 9. Community Feed & Social Likes
- **Route**: `/ai/community`
- **Capabilities**:
  - Explore public creations generated by users across the platform.
  - Responsive masonry/grid layout with hover overlay displaying prompt and creator details.
  - Interactive Like / Unlike toggle with live like counter synced to PostgreSQL array columns.

### 10. Authentication & Plan Gating
- Complete integration with **Clerk**:
  - Multi-factor authentication, Google OAuth, Email/Password.
  - User profile modal and session persistence.
  - Tiered access: Free plan users receive 10 free generations tracked in Clerk `privateMetadata.free_usage`.
  - Premium tools (Image Gen, BG Removal, Object Removal, Resume Review) strictly require an active `premium` subscription plan.
  - Interactive Clerk `<PricingTable />` embedded on the landing page for self-serve subscription upgrades.

---

## 🛠 Tech Stack

### Frontend
| Technology | Description |
| :--- | :--- |
| **React 19** | Modern component library with Hooks and state management |
| **Vite 7** | Ultra-fast build tool and development server |
| **Tailwind CSS v4** | Modern utility-first styling system with custom theme tokens |
| **React Router DOM v7** | Client-side nested routing and layout architecture |
| **@supabase/supabase-js** | Authentication, JWT sessions, OAuth, and user metadata |
| **Axios** | HTTP client for backend REST API communication |
| **React Markdown** | Renders AI responses with Markdown formatting |
| **Lucide React** | Clean, modern iconography |
| **React Hot Toast** | Toast notifications for user feedback |
| **SweetAlert2** | Interactive confirmation modals for deletions |

### Backend
| Technology | Description |
| :--- | :--- |
| **Node.js (ES Modules)** | JavaScript runtime environment |
| **Express 5** | Web framework powering REST API routes and middlewares |
| **@supabase/supabase-js** | Supabase Admin SDK for token verification and user metadata |
| **@neondatabase/serverless**| Lightweight, low-latency PostgreSQL serverless driver |
| **OpenAI SDK** | Configured to interface with Google's Gemini 2.0 Flash endpoint |
| **Cloudinary SDK** | Media uploads, storage, and AI transformations |
| **Multer** | Multipart/form-data handler for image and PDF uploads |
| **pdf-parse** | In-memory PDF extraction library |
| **dotenv** | Environment variable management |
| **cors** | Cross-Origin Resource Sharing middleware |
| **nodemon** | Hot-reload development server |

---

## 📁 Project Directory Structure

```
QuickAI-Full-Stack/
├── client/                              # Frontend React + Vite Application
│   ├── public/                          # Static assets (favicons, background patterns)
│   │   ├── favicon.svg
│   │   ├── gradientBackground.png
│   │   └── vite.svg
│   ├── src/
│   │   ├── assets/                      # App graphics, icons, and static data arrays
│   │   │   ├── assets.js                # Icon mappings, tool meta, sample data
│   │   │   └── logo.svg                 # Brand logo
│   │   ├── components/                  # Reusable UI Components
│   │   │   ├── AiTools.jsx              # Landing page tools grid
│   │   │   ├── CreationItem.jsx         # Dashboard history card with copy/download/delete
│   │   │   ├── Footer.jsx               # Site footer
│   │   │   ├── Hero.jsx                 # Hero landing banner
│   │   │   ├── Navbar.jsx               # Header with auth action buttons
│   │   │   ├── Plan.jsx                 # Clerk pricing table container
│   │   │   └── Sidebar.jsx              # App navigation sidebar with user badge
│   │   ├── pages/                       # Application Views / Routes
│   │   │   ├── Community.jsx            # Public community gallery with like system
│   │   │   ├── Dashboard.jsx            # User history & creation analytics
│   │   │   ├── GenerateImages.jsx       # ClipDrop AI text-to-image studio
│   │   │   ├── Home.jsx                 # Marketing landing page
│   │   │   ├── Layout.jsx               # Authenticated shell layout (Navbar + Sidebar + Outlet)
│   │   │   ├── QuickCode.jsx            # Multi-language code snippet generator
│   │   │   ├── RemoveBackground.jsx     # AI background remover
│   │   │   ├── RemoveObject.jsx         # AI generative object eraser
│   │   │   ├── ReviewResume.jsx         # PDF resume evaluation tool
│   │   │   ├── SummarizeArticle.jsx     # AI article condensation tool
│   │   │   └── WriteArticle.jsx         # Full-length article generator
│   │   ├── App.jsx                      # Route definitions and toast provider
│   │   ├── index.css                    # Tailwind CSS v4 & Google font import
│   │   └── main.jsx                     # ClerkProvider and BrowserRouter entrypoint
│   ├── .env                             # Frontend environment variables
│   ├── index.html                       # HTML template
│   ├── package.json                     # Client scripts and dependencies
│   ├── vercel.json                      # Vercel SPA rewrite configuration
│   └── vite.config.js                   # Vite bundler configuration
│
├── server/                              # Backend Express.js API
│   ├── configs/                         # Service initializers
│   │   ├── cloudinary.js                # Cloudinary v2 SDK configuration
│   │   ├── db.js                        # Neon PostgreSQL connection client
│   │   └── multer.js                    # Disk storage upload middleware
│   ├── controllers/                     # Request Handlers & Business Logic
│   │   ├── aiController.js              # Controllers for all 7 AI tool operations
│   │   └── userController.js            # User creations, community gallery, likes, delete
│   ├── middlewares/
│   │   └── auth.js                      # Clerk token verification, usage checks, plan detection
│   ├── routes/
│   │   ├── aiRoutes.js                  # `/api/ai/*` route endpoints
│   │   └── userRoutes.js                # `/api/user/*` route endpoints
│   ├── .env                             # Backend environment secrets
│   ├── package.json                     # Server scripts and dependencies
│   ├── server.js                        # Express app initialization & server entrypoint
│   └── vercel.json                      # Serverless deployment configuration for Vercel
│
├── .gitignore                           # Git ignore rules
└── README.md                            # Complete Project Documentation
```

---

## 🗄 Database Schema (Neon PostgreSQL)

QuickAI utilizes Neon Serverless PostgreSQL. Execute the following SQL query to create the required table:

```sql
CREATE TABLE IF NOT EXISTS creations (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'article', 'summary', 'quick-code', 'image', 'resume-review'
    publish BOOLEAN DEFAULT FALSE,
    likes TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for high-performance dashboard & community queries:
CREATE INDEX idx_creations_user_id ON creations(user_id);
CREATE INDEX idx_creations_publish ON creations(publish);
```

---

## 🔌 API Documentation

Base URL: `http://localhost:3000` (or your deployed server domain)  
*All endpoints (except `GET /`) require an `Authorization: Bearer <clerk_jwt_token>` header.*

### AI Endpoints (`/api/ai`)

| Method | Endpoint | Auth | Form / Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/generate-article` | Required | `{ prompt, length }` | Generates full-length article (Free limit: 10) |
| `POST` | `/api/ai/summarize-article` | Required | `{ text, reduce_percent }` | Summarizes input text by percentage |
| `POST` | `/api/ai/generate-quick-code` | Required | `{ prompt, language, maxTokens }` | Generates pure code snippet |
| `POST` | `/api/ai/generate-image` | **Premium** | `{ prompt, publish }` | Generates image via ClipDrop and uploads to Cloudinary |
| `POST` | `/api/ai/remove-image-background`| **Premium** | Multipart (`image`) | Strips image background via Cloudinary AI |
| `POST` | `/api/ai/remove-image-object` | **Premium** | Multipart (`image`, `object`) | Removes object from photo via Cloudinary in-painting |
| `POST` | `/api/ai/resume-review` | **Premium** | Multipart (`resume` [PDF]) | Evaluates resume strengths & recommendations |

### User Endpoints (`/api/user`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/user/get-user-creations` | Required | Returns all creations belonging to the logged-in user |
| `GET` | `/api/user/get-published-creations`| Required | Returns all public creations for Community feed |
| `POST` | `/api/user/toggle-like-creation` | Required | Toggles like status (`{ id }`) on a creation |
| `DELETE`| `/api/user/delete-creation/:id` | Required | Deletes creation by ID (user authorized check) |

---

## 🔑 Environment Variables

### Backend Configuration (`server/.env`)
Create a `.env` file in the `server/` directory:

```env
# Server Port
PORT=3000

# Neon PostgreSQL Connection URL
DATABASE_URL=postgresql://<user>:<password>@<host>/<dbname>?sslmode=require

# Clerk Authentication & Secret Keys
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Google Gemini API Key
GEMINI_API_KEY=AIzaSy...

# ClipDrop API Key (for Text-to-Image)
CLIPDROP_API_KEY=your_clipdrop_api_key

# Cloudinary Credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend Configuration (`client/.env`)
Create a `.env` file in the `client/` directory:

```env
# Clerk Publishable Key
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Backend Base API URL
VITE_BASE_URL=http://localhost:3000
```

---

## 🚀 Installation & Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended; tested on v25)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- Free accounts for [Neon Database](https://neon.tech/), [Clerk](https://clerk.com/), [Cloudinary](https://cloudinary.com/), and [Google AI Studio](https://aistudio.google.com/).

### Step 1: Clone the Repository
```bash
git clone https://github.com/<your-username>/QuickAI-Full-Stack.git
cd QuickAI-Full-Stack
```

### Step 2: Install Backend Dependencies
```bash
cd server
npm install
```

### Step 3: Install Frontend Dependencies
```bash
cd ../client
npm install
```

### Step 4: Configure Environment Files
- Fill in the values in `server/.env` and `client/.env` as described in [Environment Variables](#-environment-variables).

### Step 5: Run the Backend Server
```bash
cd ../server
npm run server
# Server will start on http://localhost:3000
```

### Step 6: Run the Frontend Client
Open a second terminal window:
```bash
cd client
npm run dev
# Vite server will launch on http://localhost:5173
```

Now visit [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🚢 Deployment (Vercel)

Both the client and the server include pre-configured `vercel.json` files for zero-configuration deployments on [Vercel](https://vercel.com/).

### 1. Deploying the Backend Server
1. In Vercel, import the repository and specify the **Root Directory** as `server`.
2. Add all environment variables from `server/.env` into Vercel Project Settings.
3. Deploy! The server will operate via serverless functions running `server.js`.

### 2. Deploying the Frontend Client
1. Import the repository in Vercel and specify the **Root Directory** as `client`.
2. Framework Preset: **Vite**.
3. Set the environment variables:
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `VITE_BASE_URL` (set to your deployed Vercel backend URL)
4. Deploy! Single Page Application routes will resolve cleanly via `vercel.json` rewrites.

---

## 🛡 Security & Access Control

1. **Authentication Enforcement**: Every protected endpoint utilizes Clerk's `requireAuth()` and extracts the active user ID from cryptographic JWT claims.
2. **Data Isolation**: Database queries enforce row-level ownership checks (`WHERE id = ${id} AND user_id = ${userId}`). Users cannot edit or delete creations belonging to others.
3. **Plan Gating**:
   - Free users have a strict limit of 10 free generations on text models.
   - Resource-intensive AI features (Image generation, background removal, object erasing, and resume scanning) require an active `premium` subscription entitlement.
4. **File Safety**:
   - File uploads are processed using Multer disk storage.
   - Resume uploads strictly enforce PDF format and a 5MB size limit.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
