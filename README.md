# LedgerLab — Accounting & Bookkeeping Practice Platform

## Run it locally

```bash
npm install
npm run dev
```

Then open the URL it prints (usually http://localhost:5173).

## Deploy it (e.g. to Vercel)

```bash
npm run build
```

This produces a `dist/` folder of static files. Push this project to a GitHub repo
and import it in Vercel — it auto-detects Vite and needs no configuration
(build command `npm run build`, output directory `dist`).

## Notes

- `src/storageShim.js` reproduces Claude.ai's `window.storage` API using the
  browser's `localStorage`, so all app data (companies, transactions, journal
  entries) persists in the browser it's opened in. No backend or database
  required.
- Data is per-browser, not per-account — clearing browser storage or opening
  in a different browser/device starts fresh. If you want real accounts and
  cross-device sync later, that would mean swapping this shim for a real
  backend (e.g. a small API + database, similar to how RankUp uses a Vercel
  serverless function).
