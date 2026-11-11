const crypto = require("crypto");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Otp = require("../models/Otp");
const AppError = require("../utils/AppError");
const mailer = require("../config/mailer");
const { otpEmail, welcomeEmail } = require("../utils/mailTemplates");
const { signToken, setAuthCookie, clearAuthCookie } = require("../utils/token");
const { text, EMAIL_RE } = require("../utils/input");
const { isDev } = require("../utils/env");

const OTP_TTL = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const DUMMY_HASH = bcrypt.hashSync("solola-mot-de-passe-factice", 10);

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function checkPassword(password) {
  if (password.length < 6) throw new AppError("Le mot de passe doit faire au moins 6 caractères");
  if (Buffer.byteLength(password) > 72) throw new AppError("Le mot de passe est trop long (72 caractères max)");
}

function sendSession(res, user, status = 200) {
  const token = signToken(user);
  setAuthCookie(res, token);
  res.status(status).json({ user: user.toPublic(), token });
}

async function register(req, res) {
  const name = text(req.body.name);
  const username = text(req.body.username);
  const email = text(req.body.email).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!name || !username || !email || !password) {
    throw new AppError("Tous les champs sont obligatoires");
  }
  if (!EMAIL_RE.test(email)) throw new AppError("Adresse email invalide");
  checkPassword(password);

  const user = await User.create({
    name,
    username,
    email,
    password,
    role: req.body.role === "author" ? "author" : "reader",
  });

  mailer
    .sendMail({ to: user.email, subject: "Bienvenue sur Solola", html: welcomeEmail(user.name) })
    .catch((err) => console.warn("Mail de bienvenue :", err.message));

  sendSession(res, user, 201);
}

async function login(req, res) {
  const identifier = text(req.body.identifier).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";
  if (!identifier || !password) throw new AppError("Identifiant et mot de passe requis");

  const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] }).select("+password");

  const valid = user ? await user.comparePassword(password) : await bcrypt.compare(password, DUMMY_HASH);
  if (!user || !valid) throw new AppError("Identifiants incorrects", 401);
  if (user.isBlocked) throw new AppError("Ce compte est suspendu", 403);

  sendSession(res, user);
}

function logout(req, res) {
  clearAuthCookie(res);
  res.json({ message: "Déconnecté" });
}

function me(req, res) {
  res.json({ user: req.user.toPublic() });
}

function session(req, res) {
  if (!req.user && req.cookies?.token) clearAuthCookie(res);
  res.json({ user: req.user ? req.user.toPublic() : null });
}

async function forgotPassword(req, res) {
  const email = text(req.body.email).toLowerCase();
  if (!email) throw new AppError("Email requis");

  const user = await User.findOne({ email });

  if (user && !user.isBlocked) {
    const code = crypto.randomInt(100000, 1000000).toString();
    await Otp.deleteMany({ email });
    await Otp.create({
      email,
      codeHash: await bcrypt.hash(code, 10),
      expiresAt: new Date(Date.now() + OTP_TTL),
    });

    try {
      await mailer.sendMail({ to: email, subject: "Ton code Solola", html: otpEmail(user.name, code) });
    } catch (err) {
      console.error("Envoi de l'OTP impossible :", err.message);
      await Otp.deleteMany({ email });
      throw new AppError("Impossible d'envoyer l'email pour le moment, réessaie plus tard", 502);
    }

    if (isDev() && !process.env.SMTP_USER) {
      console.log(`OTP pour ${email} : ${code}`);
    }
  }

  res.json({ message: "Si un compte existe pour cet email, un code vient d'être envoyé." });
}

async function verifyOtp(req, res) {
  const email = text(req.body.email).toLowerCase();
  const code = text(String(req.body.code ?? ""));
  if (!email || !/^\d{6}$/.test(code)) throw new AppError("Email et code à 6 chiffres requis");

  const otp = await Otp.findOneAndUpdate(
    { email, verified: false, expiresAt: { $gt: new Date() }, attempts: { $lt: MAX_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { returnDocument: "after" }
  );

  if (!otp) {
    const blocked = await Otp.exists({ email, verified: false, expiresAt: { $gt: new Date() } });
    if (blocked) {
      await Otp.deleteMany({ email });
      throw new AppError("Trop de tentatives, demande un nouveau code", 429);
    }
    throw new AppError("Code expiré, demande-en un nouveau");
  }

  if (!(await bcrypt.compare(code, otp.codeHash))) {
    const left = MAX_ATTEMPTS - otp.attempts;
    throw new AppError(left ? `Code incorrect (${left} essai(s) restant(s))` : "Code incorrect, demande un nouveau code");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  otp.verified = true;
  otp.resetTokenHash = sha256(resetToken);
  otp.expiresAt = new Date(Date.now() + OTP_TTL);
  await otp.save();

  res.json({ resetToken });
}

async function resetPassword(req, res) {
  const email = text(req.body.email).toLowerCase();
  const resetToken = text(req.body.resetToken);
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!email || !resetToken || !password) throw new AppError("Données manquantes");
  checkPassword(password);

  const otp = await Otp.findOneAndDelete({ email, verified: true, resetTokenHash: sha256(resetToken) });
  if (!otp || otp.expiresAt < new Date()) {
    throw new AppError("Lien de réinitialisation expiré, recommence la procédure");
  }

  const user = await User.findOne({ email });
  if (!user) throw new AppError("Compte introuvable", 404);
  if (user.isBlocked) throw new AppError("Ce compte est suspendu", 403);

  user.password = password;
  await user.save();
  await Otp.deleteMany({ email });

  sendSession(res, user);
}

module.exports = { register, login, logout, me, session, forgotPassword, verifyOtp, resetPassword };
