# Wattwise smart electricity saver

A responsive static website with a Node.js/PostgreSQL authentication API.

## Project layout

- `outputs/` — static site files for Vercel
- `backend/` — Express API, PostgreSQL account storage, and setup instructions

See [backend/README.md](backend/README.md) for local setup, required environment variables, and deployment guidance. Set `window.WATTWISE_API_URL` in `outputs/api-config.js` to your API host before deploying the site.

The API implements account registration, sign-in, and authenticated session lookup. Password recovery is not implemented yet. Never commit real `.env` files, database credentials, or signing keys.
