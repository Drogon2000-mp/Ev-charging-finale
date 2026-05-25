# Deploy Guide (Frontend + Backend)

## Overview
This repo contains:
- **Backend**: Express + MongoDB (Mongoose)
- **Frontend**: React + Vite

## 1) Backend deployment
### Required environment variables
Create a `.env` file (in `backend/`) or set env vars in your platform:

- `NODE_ENV` (optional)
- `PORT` (optional, default: `5000`)
- `JWT_SECRET` **(required for production)**
- `MONGODB_URI` **(required)**

Example `backend/.env.example`:
```bash
NODE_ENV=production
PORT=5000
JWT_SECRET=your-strong-secret
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
```

> Note: The app previously had a hardcoded MongoDB URI; this deploy guide expects it to be moved to `MONGODB_URI`.

### Install & run
```bash
cd backend
npm install
npm run start
```

If your `package.json` uses `node server.js`, run:
```bash
node server.js
```

## 2) Frontend deployment
### Build
```bash
cd frontend
npm install
npm run build
```

### Serving the built site
For local preview:
```bash
npm run preview
```

For production, use your hosting platform to serve `frontend/dist/`.

### Frontend env vars
Set `VITE_API_URL` to your backend base URL.
Example:
```bash
VITE_API_URL=https://your-domain.com
```

### Vite `base` path
`frontend/vite.config.js` sets:
- `base: '/Ev-charging-Finale-main/'`

So the site is expected to be hosted under that subpath (common for GitHub Pages / similar).

## 3) Endpoints
Backend mounts APIs under `/api`:
- `GET/POST /api/signup, /api/login`
- `GET/PUT/PATCH/DELETE /api/stations...`
- `GET/POST/PATCH/DELETE /api/reservations...`

## 4) Common deployment issues
- **Wrong `base` path** for static hosting (404 on assets / blank page). Ensure `base` matches your deploy URL.
- **Missing env vars** (`JWT_SECRET`, `MONGODB_URI`, `VITE_API_URL`).
- **CORS**: if you deploy frontend and backend on different domains, ensure CORS allows that origin.

