# Wattwise authentication API

A small Express API for the Wattwise sign-up and sign-in form. It stores users in PostgreSQL and issues short-lived bearer tokens.

## Run locally

1. Install Node.js 20+ and PostgreSQL.
2. Create a database, for example `wattwise`.
3. Copy `.env.example` to `.env` and set `DATABASE_URL`, `JWT_SECRET`, and `FRONTEND_ORIGIN`.
4. From this directory run `npm install`, then `npm start`.
5. The API listens on `http://localhost:4000`. The `users` table is created automatically at startup.

Set `DATABASE_URL` to your provider's PostgreSQL connection string. For managed databases that require TLS, set `PGSSL=true`.

## API

- `GET /api/health` — health status
- `POST /api/auth/register` — JSON `{ "name", "email", "password" }`
- `POST /api/auth/login` — JSON `{ "email", "password" }`
- `GET /api/auth/me` — requires `Authorization: Bearer <token>`

Successful register/login responses look like `{ "token": "...", "user": { "id", "name", "email" } }`. Password hashes are never returned. Tokens expire after 12 hours. Do not commit `.env` or use a weak JWT secret.

## Connect the site

Set `window.WATTWISE_API_URL` in `outputs/api-config.js` to the deployed API origin, such as `https://api.example.com`. Keep it empty when the website and API share an origin. Configure `FRONTEND_ORIGIN` on the API to the exact deployed website origin, including `https://` and without a trailing slash.

Deploy the static site in `outputs/` to Vercel and deploy this `backend/` folder to a Node host with a persistent PostgreSQL database. Add all environment variables on the host dashboard. The API is not deployed merely by committing this repository.
