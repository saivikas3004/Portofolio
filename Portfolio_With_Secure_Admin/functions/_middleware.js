/**
 * Cloudflare Pages Functions middleware.
 * Protects every /admin and /admin/* request (HTML, JS and other assets).
 * Set ADMIN_PASSWORD as an encrypted Cloudflare Pages secret.
 * Optional ADMIN_USERNAME (defaults to "admin").
 * Fail closed when ADMIN_PASSWORD is not configured.
 */
const textEncoder = new TextEncoder();

async function equalConstantTime(a, b) {
  const [left, right] = await Promise.all([
    crypto.subtle.digest("SHA-256", textEncoder.encode(a)),
    crypto.subtle.digest("SHA-256", textEncoder.encode(b))
  ]);
  const x = new Uint8Array(left), y = new Uint8Array(right);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

function challenge() {
  return new Response("Administrator sign-in required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Career Studio (Private)", charset="UTF-8"',
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.pathname !== "/admin" && !url.pathname.startsWith("/admin/")) {
    return context.next();
  }

  const username = context.env.ADMIN_USERNAME || "admin";
  const password = context.env.ADMIN_PASSWORD;
  // Never allow access if credentials have not been configured.
  if (typeof password !== "string" || password.length < 12) {
    return new Response("Admin login is not configured. Set the ADMIN_PASSWORD secret in Cloudflare Pages (at least 12 characters) and redeploy.", {
      status: 503,
      headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" }
    });
  }

  let user = "", pass = "";
  const auth = context.request.headers.get("Authorization") || "";
  if (auth.startsWith("Basic ")) {
    try {
      const bytes = Uint8Array.from(atob(auth.slice(6).trim()), c => c.charCodeAt(0));
      const credentials = new TextDecoder().decode(bytes);
      const i = credentials.indexOf(":");
      if (i >= 0) {
        user = credentials.slice(0, i);
        pass = credentials.slice(i + 1);
      }
    } catch (_) { /* Invalid credentials are rejected below. */ }
  }

  const [userOk, passOk] = await Promise.all([
    equalConstantTime(user, username),
    equalConstantTime(pass, password)
  ]);
  if (!userOk || !passOk) return challenge();

  const response = await context.next();
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "private, no-store");
  headers.set("X-Robots-Tag", "noindex, nofollow");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
