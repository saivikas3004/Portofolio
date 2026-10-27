# Sai Vikas Portfolio + Career Studio Admin

## What works now
- Public portfolio and existing Gemini chatbot integration preserved.
- /admin/ is an editable master career profile, work experience, projects, résumé and cover letter.
- Save drafts in browser localStorage, export/import JSON backups.
- Tailored résumé summary, manual edits, printable PDF via browser Print > Save as PDF.
- Download Word-compatible .doc documents for editing in Word or LibreOffice.
- Gemini is NOT required for manual editing. Automated AI résumé tailoring is NOT implemented yet.
- Editing the dashboard does NOT change the public portfolio or the original résumé PDF.
- Saved data does NOT sync between devices and can be erased by clearing browser data.

## SECURITY — REQUIRED BEFORE PUBLIC DEPLOYMENT
The /admin/ path has NO built-in authentication. Configure Cloudflare Zero Trust Access:
1. Open Cloudflare Zero Trust dashboard > Access > Applications > Add application > Self-hosted.
2. Protect your custom domain path `saivikasmalladi.com/admin/*` (and `saivikasmalladi.com/admin` if needed).
3. Create an Allow policy for ONLY your verified email address; configure email one-time PIN or another approved identity provider.
4. Test from a signed-out/private browser. Ensure `/admin/` AND `/admin/editor.js` are blocked for non-owners.
5. If Cloudflare Access cannot protect the path for your setup, DO NOT publish the admin files; use a separate protected admin subdomain.
Cloudflare Access is a platform configuration, not included in this ZIP.

## DEPLOY
The project contains `functions/api/chat.js`, which requires Cloudflare Pages Functions.
Use Git integration or Wrangler CLI rather than assuming static dashboard ZIP drag-and-drop deploys the function.
Deploy the project directory with `npx wrangler pages deploy . --project-name YOUR_PAGES_PROJECT`.
Configure `GEMINI_API_KEY` as a Cloudflare Pages secret when you want the chatbot active.
Read README_GEMINI_SETUP.md for Gemini-specific instructions.

## Future enhancement
To save and publish changes across devices or update the public site automatically, add authenticated server-side storage (e.g., Cloudflare D1) and a publishing workflow.

## Discreet owner entry
Click the small lock icon next to the saivikas logo, or the name in the footer. This opens /admin/. The icon is only a link, NOT authentication. Configure Cloudflare Access for the /admin path before publishing. Cloudflare Access can use email one-time PIN sign-in; no password is stored in HTML.
