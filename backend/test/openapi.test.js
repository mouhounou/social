const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const SwaggerParser = require("@apidevtools/swagger-parser");
const { start, stop, client } = require("./helpers");
const openapi = require("../src/docs/openapi");

const mounts = {
  "/auth": require("../src/routes/auth.routes"),
  "/posts": require("../src/routes/post.routes"),
  "/comments": require("../src/routes/comment.routes"),
  "/users": require("../src/routes/user.routes"),
  "/notifications": require("../src/routes/notification.routes"),
};

function expressRoutes() {
  const routes = new Set(["get /health"]);
  for (const [prefix, router] of Object.entries(mounts)) {
    for (const layer of router.stack) {
      if (!layer.route) continue;
      const path = (prefix + layer.route.path).replace(/\/$/, "").replace(/:(\w+)/g, "{$1}");
      for (const method of Object.keys(layer.route.methods)) routes.add(`${method} ${path}`);
    }
  }
  return routes;
}

function documentedRoutes() {
  const routes = new Set();
  for (const [path, item] of Object.entries(openapi.paths)) {
    for (const method of ["get", "post", "patch", "put", "delete"]) {
      if (item[method]) routes.add(`${method} ${path}`);
    }
  }
  return routes;
}

describe("documentation OpenAPI", () => {
  before(start);
  after(stop);

  it("est un document OpenAPI 3 valide", async () => {
    await SwaggerParser.validate(structuredClone(openapi));
  });

  it("documente toutes les routes, et seulement elles", () => {
    const code = expressRoutes();
    const docs = documentedRoutes();
    assert.deepEqual([...code].filter((r) => !docs.has(r)), [], "routes sans documentation");
    assert.deepEqual([...docs].filter((r) => !code.has(r)), [], "documentation sans route");
  });

  it("sert la page Swagger et le JSON", async () => {
    const root = client().baseUrl.replace(/\/api$/, "");
    const spec = await fetch(`${root}/docs.json`);
    assert.equal(spec.status, 200);
    assert.equal((await spec.json()).info.title, "API Solola");
    const page = await fetch(`${root}/docs`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /swagger-ui/);
  });
});
