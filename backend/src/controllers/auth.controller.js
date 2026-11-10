const crypto = require("crypto");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Otp = require("../models/Otp");
const AppError = require("../utils/AppError");
const { sendMail } = require("../config/mailer");
const { otpEmail, welcomeEmail } = require("../utils/mailTemplates");
const { signToken, setAuthCookie, clearAuthCookie } = require("../utils/token");

const OTP_TTL = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function sendSession(res, user, status = 200) {
  const token = signToken(user);
  setAuthCookie(res, token);
  res.status(status).json({ user: user.toPublic(), token });
}

async function register(req, res) {
  const { name, username, email, password, role } = req.body;

  if (!name || !username || !email || !password) {
    throw new AppError("Tous les champs sont obligatoires");
  }
  if (password.length < 6) {
    throw new AppError("Le mot de passe doit faire au moins 6 caractères");
  }

  const user = await User.create({
    name,
    username,
    email,
    password,
    role: role === "author" ? "author" : "reader",
  });

  sendMail({ to: user.email, subject: "Bienvenue sur Solola", html: welcomeEmail(user.name) }).catch(
    (err) => console.warn("Mail de bienvenue :", err.message)
  );

  sendSession(res, user, 201);
}

async function login(req, res) {
  const { identifier, password } = req.body;
  if (!identifier || !password) throw new AppError("Identifiant et mot de passe requis");

  const value = identifier.toLowerCase().trim();
  const user = await User.findOne({ $or: [{ email: value }, { username: value }] }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Identifiants incorrects", 401);
  }
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
  res.json({ user: req.user ? req.user.toPublic() : null });
}

async function forgotPassword(req, res) {
  const email = req.body.email?.toLowerCase().trim();
  if (!email) throw new AppError("Email requis");

  const user = await User.findOne({ email });

  if (user) {
    const code = crypto.randomInt(100000, 1000000).toString();
    await Otp.deleteMany({ email });
    await Otp.create({
      email,
      codeHash: await bcrypt.hash(code, 10),
      expiresAt: new Date(Date.now() + OTP_TTL),
    });
    await sendMail({ to: email, subject: "Ton code Solola", html: otpEmail(user.name, code) });
    if (process.env.NODE_ENV !== "production" && !process.env.SMTP_USER) {
      console.log(`OTP pour ${email} : ${code}`);
    }
  }

  res.json({ message: "Si un compte existe pour cet email, un code vient d'être envoyé." });
}

async function verifyOtp(req, res) {
  const email = req.body.email?.toLowerCase().trim();
  const code = String(req.body.code || "").trim();
  if (!email || !code) throw new AppError("Email et code requis");

  const otp = await Otp.findOne({ email, verified: false });
  if (!otp || otp.expiresAt < new Date()) {
    throw new AppError("Code expiré, demande-en un nouveau");
  }
  if (otp.attempts >= MAX_ATTEMPTS) {
    await otp.deleteOne();
    throw new AppError("Trop de tentatives, demande un nouveau code", 429);
  }

  const valid = await bcrypt.compare(code, otp.codeHash);
  if (!valid) {
    otp.attempts += 1;
    await otp.save();
    throw new AppError(`Code incorrect (${MAX_ATTEMPTS - otp.attempts} essai(s) restant(s))`);
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  otp.verified = true;
  otp.resetTokenHash = sha256(resetToken);
  otp.expiresAt = new Date(Date.now() + OTP_TTL);
  await otp.save();

  res.json({ resetToken });
}

async function resetPassword(req, res) {
  const email = req.body.email?.toLowerCase().trim();
  const { resetToken, password } = req.body;

  if (!email || !resetToken || !password) throw new AppError("Données manquantes");
  if (password.length < 6) throw new AppError("Le mot de passe doit faire au moins 6 caractères");

  const otp = await Otp.findOne({ email, verified: true, resetTokenHash: sha256(resetToken) });
  if (!otp || otp.expiresAt < new Date()) {
    throw new AppError("Lien de réinitialisation expiré, recommence la procédure");
  }

  const user = await User.findOne({ email });
  if (!user) throw new AppError("Compte introuvable", 404);

  user.password = password;
  await user.save();
  await Otp.deleteMany({ email });

  sendSession(res, user);
}

module.exports = { register, login, logout, me, session, forgotPassword, verifyOtp, resetPassword };
