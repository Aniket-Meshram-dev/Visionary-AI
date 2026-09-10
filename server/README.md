# ⚙️ QuickAI Server (Backend API)

Node.js + Express 5 backend for the QuickAI SaaS platform.

For full project documentation, architecture, API reference, database schema, and frontend setup, please see the [Root README](../README.md).

## Quick Start

```bash
# Install dependencies
npm install

# Start development server with nodemon
npm run server

# Start production server
npm start
```

## Environment Configuration
Ensure `.env` exists in this directory:
```env
PORT=3000
DATABASE_URL=postgresql://...
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
GEMINI_API_KEY=AIzaSy...
CLIPDROP_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```
