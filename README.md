# Arif light CMS starter

This is a fully static, manual-first starter for an editorial homepage.

## Structure

- `index.html` — homepage
- `assets/site.css` — homepage styles
- `assets/site.js` — homepage loader and filtering
- `released/index.json` — manual order of entries
- `released/<slug>/meta.json` — card metadata
- `released/<slug>/index.html` — entry page
- `released/<slug>/thumbnail.svg` — card thumbnail
- `released/<slug>/assets/` — optional page-specific assets

## Add a new card

1. Create a new folder inside `released/`
2. Add:
   - `meta.json`
   - `index.html`
   - `thumbnail.svg` or `thumbnail.jpg`
3. Add the slug to `released/index.json`

The order in `released/index.json` is the homepage order.

## Important

This uses `fetch()`, so open it through a local or static web server.

Examples:
- VS Code Live Server
- `python3 -m http.server`
- Netlify / Vercel / GitHub Pages