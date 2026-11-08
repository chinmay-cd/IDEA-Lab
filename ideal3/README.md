# ideal3 source bundle

This folder contains the complete current site and API source, plus the Render deployment blueprint.

- `index.html` — sign-in, sign-up, password toggle, and post-login dashboard
- `api-config.js` — backend URL setting for the website
- `backend/` — Express authentication API and PostgreSQL setup
- `render.yaml` — Render service blueprint; Render will still require `DATABASE_URL` and `JWT_SECRET` secrets
- `commits/` — three Git patches, in order, based on the repository's earlier `main` commit

To apply the patches to a fresh clone of the original repository, open a terminal in that clone and run:

```sh
git am /path/to/ideal3/commits/0001-Add-password-visibility-toggle.patch
git am /path/to/ideal3/commits/0002-Add-post-login-energy-dashboard.patch
git am /path/to/ideal3/commits/0003-Add-Render-API-deployment-blueprint.patch
```

Never add a real Neon connection string or `.env` file to Git. The database password previously shared in chat should be rotated before using the database.
