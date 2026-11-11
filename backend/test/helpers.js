process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "test-secret";
process.env.MONGO_URI = process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27017/solola_test";
delete process.env.SMTP_USER;
delete process.env.CLOUDINARY_API_KEY;

const mongoose = require("mongoose");
const mailer = require("../src/config/mailer");
const app = require("../src/app");

const sentMails = [];
mailer.sendMail = async (mail) => {
  if (mailer.failNext) {
    mailer.failNext = false;
    throw new Error("SMTP down");
  }
  sentMails.push(mail);
};

let server;
let baseUrl;

async function start() {
  await mongoose.connect(process.env.MONGO_URI);
  await mongoose.connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
}

async function stop() {
  server?.close();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}

function client() {
  let cookie = "";
  const request = async (method, path, body, headers = {}) => {
    const isForm = body instanceof FormData;
    const res = await fetch(baseUrl + path, {
      method,
      headers: {
        ...(body !== undefined && !isForm && typeof body !== "string" ? { "Content-Type": "application/json" } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : isForm || typeof body === "string" ? body : JSON.stringify(body),
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) cookie = setCookie.split(";")[0].endsWith("=") ? "" : setCookie.split(";")[0];
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  };
  return {
    get: (p, h) => request("GET", p, undefined, h),
    post: (p, b, h) => request("POST", p, b, h),
    patch: (p, b, h) => request("PATCH", p, b, h),
    delete: (p) => request("DELETE", p),
    raw: request,
    get baseUrl() {
      return baseUrl;
    },
    get cookie() {
      return cookie;
    },
    set cookie(value) {
      cookie = value;
    },
  };
}

async function signup(username, role = "reader") {
  const c = client();
  const res = await c.post("/auth/register", {
    name: username,
    username,
    email: `${username}@test.dev`,
    password: "secret1",
    role,
  });
  if (res.status !== 201) throw new Error(`signup ${username}: ${res.data.message}`);
  c.user = res.data.user;
  return c;
}

function lastOtp(email) {
  const mail = [...sentMails].reverse().find((m) => m.to === email && m.subject.includes("code"));
  return mail?.html.match(/>(\d{6})</)?.[1];
}

module.exports = { start, stop, client, signup, lastOtp, mailer };
