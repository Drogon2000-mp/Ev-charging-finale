# GitHub Pages Deployment (Frontend Only)

This repo uses **Vite** for the frontend. To deploy to **GitHub Pages** and have SPA refresh work, follow these steps.

## 1) Frontend build (create `frontend/dist`)

```bash
cd frontend
npm install
npm run build
```

This generates:
- `frontend/dist/index.html`
- `frontend/dist/assets/*`

## 2) Vite base path

Your current config sets:
- `frontend/vite.config.js`: `base: '/Ev-charging-Finale-main/'`

That means the site must be served under the subpath `/Ev-charging-Finale-main/` (typical for repo-based GitHub Pages).

## 3) SPA refresh handling

Add `404.html` to the frontend root (already present in this repo):
- `frontend/404.html`

GitHub Pages uses this for unknown routes so React Router can still load `index.html`.

## 4) Deploy to GitHub Pages

### Option A (recommended): Deploy from branch to root using `gh-pages`

1. Create a branch deployment using the `gh-pages` package.
2. Ensure the deploy script is enabled.

If you want to deploy via command, confirm your `frontend/package.json` contains a `deploy` script.

### Option B: Manual Pages settings

1. Go to your GitHub repo → **Settings** → **Pages**.
2. **Source**:
   - Deploy from a branch
   - Branch: `gh-pages`
3. **Folder**: `/ (root)`

### Important
If your Pages **Source** is the repo root or `frontend/`, GitHub may publish the wrong `index.html` (dev one). You must publish **the built output**.

## 5) After deployment

Open your GitHub Pages URL and verify:
- JS loads from `/Ev-charging-Finale-main/assets/...` (not `/src/...`)
- Refreshing routes like `/dashboard` does not show a 404


