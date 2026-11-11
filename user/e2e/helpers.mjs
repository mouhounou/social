import { chromium } from "playwright";

export const FRONT = process.env.E2E_URL || "http://localhost:3000";
const API = `${FRONT}/api`;
export const PASSWORD = "e2e-secret";

export async function apiLogin(username, password = PASSWORD) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: username, password }),
  });
  if (!res.ok) return null;
  return res.headers.get("set-cookie").split(";")[0];
}

export async function api(cookie, method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: body && JSON.stringify(body),
  });
  return res.json();
}

export async function ensureUser(username, role = "reader") {
  const cookie = await apiLogin(username);
  if (cookie) return cookie;
  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: username, username, email: `${username}@e2e.test`, password: PASSWORD, role }),
  });
  if (!res.ok) throw new Error(`Inscription de ${username} impossible : ${(await res.json()).message}`);
  return res.headers.get("set-cookie").split(";")[0];
}

let browser;

export async function launch() {
  browser = await chromium.launch();
}

export async function close() {
  await browser?.close();
}

export async function page() {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await context.newPage();
  p.errors = [];
  p.on("pageerror", (e) => p.errors.push(e.message));
  p.on("console", (m) => {
    if (m.type() === "error" && /Encountered two children|hydrat/i.test(m.text())) p.errors.push(m.text());
  });
  return p;
}

export async function login(p, username, password = PASSWORD) {
  await p.goto(`${FRONT}/login`);
  await p.getByLabel("Email ou nom d'utilisateur").fill(username);
  await p.getByLabel("Mot de passe").fill(password);
  await p.getByRole("button", { name: "Se connecter" }).click();
  await p.waitForURL(`${FRONT}/`);
}

export const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);
