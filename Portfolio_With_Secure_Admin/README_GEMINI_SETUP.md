# Gemini recruiter chatbot — Cloudflare Pages

This bundle contains your website, original résumé PDF, certificate images and a secure Gemini API backend at `functions/api/chat.js`.

## Setup
1. Get a Gemini API key at https://aistudio.google.com/apikey . Choose a Gemini model that is available on the free tier for your project; the default here is `gemini-2.5-flash`.
2. IMPORTANT: Cloudflare Pages Functions need a Pages project deployed through Git integration or Wrangler CLI. Do NOT simply drag-and-drop this ZIP in the Pages dashboard expecting `functions/api/chat.js` to execute. Static Direct Upload does not automatically deploy the source Functions directory.
3. Recommended: push the unzipped project to a private GitHub repository and connect it to your existing Cloudflare Pages project (if your existing project is Direct Upload only, create a Git-integrated Pages project and reassign the custom domain after testing). Build command: none; build output directory: `.`. Or deploy via Wrangler CLI from this project folder with `npx wrangler pages deploy . --project-name YOUR_PROJECT_NAME` (verify Functions are included in the deployed build).
4. In Cloudflare dashboard > Workers & Pages > your Pages project > Settings > Variables and Secrets, add encrypted secret `GEMINI_API_KEY` with your API key. Optionally set `GEMINI_MODEL` to a free-tier model you can access. Redeploy after setting the secret.
5. Recommended for a public site: create a Workers KV namespace and bind it as `CHAT_RATE` to the Pages project for basic per-IP minute rate limiting. Without this binding, no shared rate limit is enforced and malicious visitors may exhaust your free Gemini quota. KV counter updates are not atomic and this is only basic protection; for production add Cloudflare WAF/Turnstile and stronger rate limiting.
6. Open your domain and test the recruiter assistant. If you see 'AI service is not configured yet', the secret is missing from that environment. If the model is unavailable, check Google AI Studio model availability and set `GEMINI_MODEL`.

## Important
- NEVER paste your API key into HTML, GitHub or chat.
- Gemini free-tier limits vary by account and model. Free-tier prompts may be used by Google to improve its products; only public portfolio facts are included in the backend prompt.
- The chatbot is not tested against a live Gemini API here because no private API key was supplied.
- The server prompt includes only professional information. Review before deploying.
- Your original PDF résumé is included and may contain personal contact details.
