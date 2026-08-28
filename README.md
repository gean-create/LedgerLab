# LedgerLab — Accounting & Bookkeeping Practice Platform

## Run it locally

```bash
npm install
npm run dev
```

## Deploy to Vercel

Push this project to a GitHub repo and import it in Vercel — it auto-detects
Vite (build command `npm run build`, output directory `dist`).

This version pins conservative, widely-supported versions (Vite 5.4, React
18.3) instead of bleeding-edge releases, specifically to avoid Node.js
version mismatches on hosts like Vercel.

## Notes

- `src/storageShim.js` reproduces Claude.ai's `window.storage` API using the
  browser's `localStorage`, so app data persists in the browser it's opened
  in — no backend or database required.
