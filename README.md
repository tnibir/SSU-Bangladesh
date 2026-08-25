# SSU Bangladesh Tools

This repository contains National Social Insurance Scheme materials for Bangladesh, including the current-state and projection website, mathematical documentation, and supporting source files.

## Published website

The website in `NSIS-Current State & Projection` is published through GitHub Pages:

<https://tnibir.github.io/SSU-Bangladesh/>

## Local verification

Node.js 20 or newer is required.

```bash
npm ci
npx playwright install chromium
npm test
```

The website can also be served directly:

```bash
python3 -m http.server 8000 --directory "NSIS-Current State & Projection"
```

Then open <http://127.0.0.1:8000/>.
