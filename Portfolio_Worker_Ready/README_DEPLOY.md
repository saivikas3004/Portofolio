# Update the existing Cloudflare Worker `portofolio`

This package targets **Cloudflare Workers with static assets**, NOT Pages. It retains the current Worker name `portofolio` and uses `wrangler.jsonc`.

## GitHub deployment
1. Extract this ZIP and upload the CONTENTS to the root of `https://github.com/saivikas3004/Portofolio`, branch `main`.
2. The repo root MUST contain `wrangler.jsonc`, `src/index.js`, `src/gemini.js` and `public/index.html`.
3. In Cloudflare dashboard > Workers & Pages > portofolio > Settings > Builds, check repository and branch `main`; check that deploy command is `npx wrangler deploy` (or `wrangler deploy`). The dashboard UI wording varies.
4. Commit to GitHub and inspect the Cloudflare Deployments tab for success. Keep a copy of your previous working deployment so you can roll back if needed.
5. The `/admin/` route fails CLOSED with a 503 until `ADMIN_PASSWORD` is configured; it must not render the editor if not configured.
6. Dashboard > Workers & Pages > portofolio > Settings > Variables and Secrets > Add secret: `ADMIN_PASSWORD` (unique, minimum 12 characters). Optional `ADMIN_USERNAME`, default `admin`. **Never put the password in wrangler.jsonc or GitHub.**
7. Save secret and redeploy if prompted.
8. Open https://saivikasmalladi.com/admin/ in a NEW private/incognito window. Verify browser password prompt, wrong password rejection, correct password success. Test `/admin/editor.js` as well. If not protected, immediately roll back the deployment or block `/admin*` with Cloudflare Access.

## Notes
- The login uses HTTP Basic authentication over HTTPS and is suitable as a starter but is not as strong as Cloudflare Access with an identity provider and brute-force controls.
- Admin data is saved locally in the browser, not the website/GitHub; use its Export JSON backup.
- `GEMINI_API_KEY` can be added as a Worker secret later for the public recruiter AI chatbot.
- `assets.run_worker_first=true` is CRITICAL: it ensures authorization runs before static admin assets are served.
- The Pages-specific `functions/` directory is intentionally not present in this package.
- The downloadable résumé remains the PDF in `public/assets/`.
