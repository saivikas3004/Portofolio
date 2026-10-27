# Career Studio — Admin Password Setup

This website now includes a **real server-side password gate** for `/admin/`.
The login uses the browser's native username/password prompt (HTTP Basic Authentication over HTTPS).

## IMPORTANT: Configure this *before* deployment
The password is never embedded in HTML or GitHub files.
The admin routes fail closed with HTTP 503 until the secret is configured.

1. Open https://dash.cloudflare.com → Workers & Pages → your **Pages project**.
2. Open **Settings → Variables and Secrets**.
3. Create `ADMIN_PASSWORD` as an **encrypted secret** with a unique password of at least 12 characters (longer is better).
4. Optional: Create `ADMIN_USERNAME` as a variable; if omitted, your login username is `admin`.
5. Save, then **redeploy** (or trigger a new Git commit deployment).
6. Open `https://saivikasmalladi.com/admin/` in a private/incognito browser window.
7. Check: without credentials it requests a username/password; wrong details are rejected; correct details open Career Studio.
8. Verify `https://saivikasmalladi.com/admin/editor.js` is also blocked without credentials.

### Login details
- Username: `admin` unless you configured `ADMIN_USERNAME`.
- Password: the value **you privately configure in Cloudflare** as `ADMIN_PASSWORD`.

### For enhanced protection
Enable Cloudflare Access with email verification or a strong identity provider on `/admin*`, and set Cloudflare WAF rate limiting for `/admin*` against password guessing. HTTP Basic Authentication does not support reliable logout and can be susceptible to brute-force attempts without edge rate limiting. Use HTTPS only.

### Admin functionality
The editor saves drafts in your browser; use its JSON export option to back them up.
It does **not** sync drafts across devices or update the public portfolio.
Résumé PDF export uses browser Print → Save as PDF.
Word exports are Word-compatible `.doc` HTML files.
Gemini automatic résumé tailoring is not enabled until separately configured.

### Deployment
GitHub-connected Cloudflare Pages: upload the files and folders at the repository root, preserving `functions/_middleware.js` and `functions/api/chat.js`. Configure **Pages Functions** support, and verify the function executes after deployment.
If Functions aren't deployed, the admin could be publicly exposed. **Do not treat the HTML itself as a security boundary.** Check the gate in an incognito browser before adding sensitive data.
