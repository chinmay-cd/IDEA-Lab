# Wattwise smart electricity saver

Responsive Wattwise website with sign-up, sign-in, a password visibility control, and an energy dashboard after authentication.

## Files

- `index.html` — website and post-login dashboard
- `api-config.js` — API origin configuration
- `backend/` — Express API with PostgreSQL account storage

The dashboard begins with clearly labeled sample readings. Users can enter their monthly kWh and bill amount; those values are saved in that browser on that device. The chart and appliance breakdown remain sample data until a meter or real usage integration is connected.

See `backend/README.md` for local setup and deployment. Set `window.WATTWISE_API_URL` in `api-config.js` to your deployed API origin before publishing the site. Never commit real `.env` files, database credentials, or signing keys.
