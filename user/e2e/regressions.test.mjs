import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { FRONT, PNG, api, apiLogin, close, ensureUser, launch, login, page, PASSWORD } from "./helpers.mjs";

let authorCookie;
let firstPost;

before(async () => {
  authorCookie = await ensureUser("e2e_auteur", "author");
  await ensureUser("e2e_lecteur");
  const { total } = await api(authorCookie, "GET", "/posts?author=e2e_auteur&limit=1");
  for (let i = total; i < 12; i++) {
    await api(authorCookie, "POST", "/posts", { title: `E2E ${i}`, content: `Article de test ${i} #e2e` });
  }
  firstPost = (await api(authorCookie, "GET", "/posts?author=e2e_auteur&limit=1")).posts[0];
  await launch();
});

after(close);

describe("session", () => {
  it("laisse ouvrir /login quand la session a expiré, et bloque les pages membres", async () => {
    const p = await page();
    await login(p, "e2e_lecteur");
    const other = await apiLogin("e2e_lecteur");
    await new Promise((r) => setTimeout(r, 1100));
    await api(other, "PATCH", "/users/me/password", { currentPassword: PASSWORD, newPassword: "e2e-temp1" });
    try {
      await p.goto(`${FRONT}/settings`);
      await p.waitForURL(/\/login\?next=%2Fsettings/, { timeout: 5000 });
      await p.goto(`${FRONT}/login`);
      await p.waitForTimeout(1000);
      assert.match(p.url(), /\/login$/);
    } finally {
      await new Promise((r) => setTimeout(r, 1100));
      const fresh = await apiLogin("e2e_lecteur", "e2e-temp1");
      await api(fresh, "PATCH", "/users/me/password", { currentPassword: "e2e-temp1", newPassword: PASSWORD });
    }
  });

  it("renvoie à l'accueil depuis /login avec une session valide", async () => {
    const p = await page();
    await login(p, "e2e_lecteur");
    await p.goto(`${FRONT}/login`);
    await p.waitForURL(`${FRONT}/`, { timeout: 5000 });
  });

  it("efface les likes affichés à la déconnexion", async () => {
    const p = await page();
    await login(p, "e2e_lecteur");
    const card = p.locator("article").first();
    if (!(await card.locator("svg.fill-red-500").count())) await card.locator("footer button").first().click();
    await card.locator("svg.fill-red-500").waitFor();
    await p.getByRole("button", { name: "Mon compte" }).click();
    await p.getByRole("button", { name: "Déconnexion" }).click();
    await p.getByRole("link", { name: "Connexion" }).first().waitFor();
    await p.waitForTimeout(1000);
    assert.equal(await p.locator("svg.fill-red-500").count(), 0);
  });

  it("montre un message à un lecteur sur /posts/new", async () => {
    const p = await page();
    await login(p, "e2e_lecteur");
    await p.goto(`${FRONT}/posts/new`);
    await p.getByText("Réservé aux auteurs").waitFor();
  });
});

describe("redirection après connexion", () => {
  for (const next of ["/%5Cexample.org", "/%5C%5Cexample.org", "/%09/example.org", "https://example.org"]) {
    it(`reste sur le site avec next=${decodeURIComponent(next)}`, async () => {
      const p = await page();
      await p.route("**://example.org/**", (r) => r.fulfill({ body: "externe" }));
      await p.goto(`${FRONT}/login?next=${next}`);
      await p.getByLabel("Email ou nom d'utilisateur").fill("e2e_lecteur");
      await p.getByLabel("Mot de passe").fill(PASSWORD);
      await p.getByRole("button", { name: "Se connecter" }).click();
      await p.waitForURL(`${FRONT}/`);
    });
  }

  it("respecte une adresse interne", async () => {
    const p = await page();
    await p.goto(`${FRONT}/login?next=%2Fsaved`);
    await p.getByLabel("Email ou nom d'utilisateur").fill("e2e_lecteur");
    await p.getByLabel("Mot de passe").fill(PASSWORD);
    await p.getByRole("button", { name: "Se connecter" }).click();
    await p.waitForURL(`${FRONT}/saved`);
  });
});

describe("fil et articles", () => {
  it("n'affiche pas de doublon après une publication puis « Voir plus »", async () => {
    const p = await page();
    await login(p, "e2e_auteur");
    await p.goto(`${FRONT}/u/e2e_auteur`);
    const title = `Pendant la lecture ${Date.now()}`;
    await p.getByPlaceholder(/Partage quelque chose/).click();
    await p.getByPlaceholder("Titre de ta publication").fill(title);
    await p.getByPlaceholder(/Partage quelque chose/).fill("x");
    await p.getByRole("button", { name: "Publier" }).click();
    await p.getByText(title).waitFor();
    await p.getByRole("button", { name: "Voir plus" }).click();
    await p.waitForTimeout(1500);
    const ids = await p.locator("article a[href^='/posts/'].font-semibold").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    assert.equal(ids.length, new Set(ids).size);
    assert.deepEqual(p.errors, []);
  });

  it("met à jour le compteur de la carte quand on commente", async () => {
    const p = await page();
    await login(p, "e2e_lecteur");
    await p.goto(`${FRONT}/posts/${firstPost._id}`);
    await p.getByText("Commentaires (").waitFor();
    const count = p.locator("article footer a").first();
    const before = Number(await count.innerText());
    const text = `commentaire ${Date.now()}`;
    await p.getByPlaceholder("Écris ton commentaire").fill(text);
    await p.keyboard.press("Enter");
    await p.getByText(text).waitFor();
    assert.equal(Number(await count.innerText()), before + 1);
  });

  it("accepte de reprendre la même image après l'avoir retirée", async () => {
    const p = await page();
    await login(p, "e2e_auteur");
    const file = { name: "a.png", mimeType: "image/png", buffer: PNG };
    const composer = p.locator("form", { has: p.getByPlaceholder(/Partage quelque chose/) });
    const input = composer.locator('input[type="file"]');
    await input.setInputFiles(file);
    await composer.locator('img[src^="blob:"]').waitFor();
    await composer.getByRole("button").filter({ has: p.locator("svg.lucide-x") }).click();
    await composer.locator('img[src^="blob:"]').waitFor({ state: "detached" });
    await input.setInputFiles(file);
    await composer.locator('img[src^="blob:"]').waitFor({ timeout: 2000 });
  });

  it("vide le champ de recherche quand on retire le filtre", async () => {
    const p = await page();
    await p.goto(`${FRONT}/?q=e2e`);
    await p.getByRole("link", { name: /Résultats pour/ }).click();
    await p.waitForURL(`${FRONT}/`);
    assert.equal(await p.getByPlaceholder("Rechercher").first().inputValue(), "");
  });

  it("affiche un message lisible quand l'API est injoignable", async () => {
    const p = await page();
    await p.route("**/api/posts**", (r) => r.abort("failed"));
    await p.goto(FRONT);
    await p.getByText("Impossible de joindre le serveur").waitFor();
  });
});

describe("notifications", () => {
  it("retire la pastille après ouverture des notifications", async () => {
    const reader = await apiLogin("e2e_lecteur");
    await api(reader, "POST", `/posts/${firstPost._id}/comments`, { content: "pour la pastille" });
    const p = await page();
    await login(p, "e2e_auteur");
    await p.getByRole("banner").locator("span.bg-red-500").waitFor();
    await p.getByRole("banner").getByRole("link", { name: "Notifications" }).click();
    await p.waitForURL(/notifications/);
    await p.getByRole("banner").locator("span.bg-red-500").waitFor({ state: "detached", timeout: 5000 });
  });
});

describe("code OTP", () => {
  async function otpPage() {
    const p = await page();
    await p.goto(`${FRONT}/login`);
    await p.evaluate(() => sessionStorage.setItem("solola:recovery", JSON.stringify({ email: "personne@e2e.test" })));
    await p.goto(`${FRONT}/verify-otp`);
    return p;
  }

  it("colle un code complet depuis n'importe quelle case et l'envoie", async () => {
    const p = await otpPage();
    const request = p.waitForRequest((r) => r.url().includes("/api/auth/verify-otp"));
    await p.getByLabel("Chiffre 3").focus();
    await p.evaluate(() => {
      const data = new DataTransfer();
      data.setData("text/plain", "48 29 13");
      document.activeElement.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
    });
    assert.equal(JSON.parse((await request).postData()).code, "482913");
  });

  it("remplace un chiffre quand on tape dans une case remplie", async () => {
    const p = await otpPage();
    await p.getByLabel("Chiffre 1").click();
    await p.keyboard.type("1234");
    await p.getByLabel("Chiffre 2").click();
    await p.keyboard.type("9");
    const values = await p.locator("input").evaluateAll((els) => els.map((e) => e.value).join(""));
    assert.equal(values, "1934");
  });
});
