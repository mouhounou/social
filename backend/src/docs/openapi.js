const categories = require("../utils/categories");

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema) => ({ "application/json": { schema } });
const ok = (description, schema) => ({ description, content: json(schema) });
const error = (description) => ({ description, content: json(ref("Error")) });
const body = (schema, required = true) => ({ required, content: json(schema) });

const member = [{ cookieAuth: [] }, { bearerAuth: [] }];
const optionalMember = [{}, { cookieAuth: [] }, { bearerAuth: [] }];

const objectId = { type: "string", pattern: "^[a-f0-9]{24}$", example: "6af3a63ee6c4608a18356bc0" };
const idParam = (description) => ({ name: "id", in: "path", required: true, description, schema: objectId });
const usernameParam = { name: "username", in: "path", required: true, schema: { type: "string", example: "reinhard" } };

const common = {
  400: error("Données invalides"),
  401: error("Non connecté ou session expirée"),
  403: error("Action non autorisée"),
  404: error("Ressource introuvable"),
  429: error("Trop de tentatives"),
};
const pick = (...codes) => Object.fromEntries(codes.map((c) => [c, common[c]]));

const turnstileToken = {
  "cf-turnstile-response": {
    type: "string",
    maxLength: 2048,
    description:
      "Jeton du widget Cloudflare Turnstile, à usage unique. Obligatoire quand `TURNSTILE_SECRET` est configuré " +
      "sur l'API ; sans lui, la réponse est un 403 avec `field: \"turnstile\"`.",
  },
};

const postFields = {
  title: { type: "string", maxLength: 150, example: "Mon carnet de croquis" },
  content: { type: "string", maxLength: 10000, example: "Sept jours, sept pages. #art #aquarelle" },
  category: { type: "string", enum: categories },
  visibility: { type: "string", enum: ["public", "followers"] },
  tags: {
    type: "string",
    description: "Tags ajoutés à la main, séparés par des virgules (7 max). En JSON, un tableau est aussi accepté. S'ajoutent aux hashtags du contenu.",
    example: "art,aquarelle",
  },
  image: { type: "string", format: "binary", description: "Image (5 Mo max), envoyée sur Cloudinary" },
};

const jsonPostFields = Object.fromEntries(Object.entries(postFields).filter(([key]) => key !== "image"));

const credentials = {
  type: "object",
  required: ["identifier", "password"],
  properties: {
    identifier: { type: "string", description: "Email ou nom d'utilisateur", example: "reinhard" },
    password: { type: "string", example: "secret1" },
    ...turnstileToken,
  },
};

module.exports = {
  openapi: "3.0.3",
  info: {
    title: "API Solola",
    version: "1.0.0",
    description:
      "API de Solola, l'espace de publication. La connexion pose un cookie httpOnly `token` : dans cette page, " +
      "appelle `POST /auth/login` puis les routes protégées fonctionnent directement. Le jeton est aussi renvoyé " +
      "dans la réponse pour un usage en `Authorization: Bearer`.",
  },
  servers: [{ url: "/api" }],
  tags: [
    { name: "Authentification", description: "Inscription, connexion et récupération de compte par code OTP" },
    { name: "Articles" },
    { name: "Commentaires" },
    { name: "Utilisateurs" },
    { name: "Notifications" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: { type: "apiKey", in: "cookie", name: "token" },
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          message: { type: "string", example: "Connecte-toi pour continuer" },
          field: {
            type: "string",
            description: "Champ du formulaire en cause, quand l'erreur en vise un",
            example: "username",
          },
        },
      },
      Message: { type: "object", properties: { message: { type: "string" } } },
      Author: {
        type: "object",
        properties: {
          _id: objectId,
          name: { type: "string", example: "Reinhard Van Zry" },
          username: { type: "string", example: "reinhard" },
          avatar: { type: "string", nullable: true, format: "uri" },
        },
      },
      User: {
        type: "object",
        properties: {
          _id: objectId,
          name: { type: "string" },
          username: { type: "string" },
          email: { type: "string", format: "email", description: "Renvoyé seulement à l'utilisateur lui-même" },
          role: { type: "string", enum: ["reader", "author", "admin"] },
          bio: { type: "string", maxLength: 160 },
          location: { type: "string", maxLength: 60 },
          website: { type: "string", maxLength: 120 },
          avatar: { type: "string", nullable: true, format: "uri" },
          cover: { type: "string", nullable: true, format: "uri" },
          followersCount: { type: "integer" },
          followingCount: { type: "integer" },
          postsCount: { type: "integer" },
          isFollowing: { type: "boolean" },
          isMe: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Session: {
        type: "object",
        properties: { user: ref("User"), token: { type: "string", description: "JWT, aussi posé en cookie" } },
      },
      Post: {
        type: "object",
        properties: {
          _id: objectId,
          title: { type: "string" },
          content: { type: "string" },
          category: { type: "string", enum: categories },
          tags: { type: "array", items: { type: "string" }, example: ["art", "aquarelle"] },
          image: { type: "string", nullable: true, format: "uri" },
          visibility: { type: "string", enum: ["public", "followers"] },
          author: ref("Author"),
          likesCount: { type: "integer" },
          savesCount: { type: "integer" },
          commentsCount: { type: "integer" },
          liked: { type: "boolean", description: "Aimé par l'utilisateur connecté" },
          saved: { type: "boolean", description: "Enregistré par l'utilisateur connecté" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      PostPage: {
        type: "object",
        properties: {
          posts: { type: "array", items: ref("Post") },
          page: { type: "integer", example: 1 },
          pages: { type: "integer", example: 3 },
          total: { type: "integer", example: 24 },
        },
      },
      Comment: {
        type: "object",
        properties: {
          _id: objectId,
          content: { type: "string", maxLength: 1000 },
          post: objectId,
          author: ref("Author"),
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Toggle: {
        type: "object",
        properties: { active: { type: "boolean" }, count: { type: "integer" } },
      },
      Notification: {
        type: "object",
        properties: {
          _id: objectId,
          type: { type: "string", enum: ["like", "comment", "follow"] },
          read: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          actor: ref("Author"),
          post: {
            type: "object",
            nullable: true,
            properties: { _id: objectId, title: { type: "string" }, image: { type: "string", nullable: true } },
          },
          following: { type: "boolean", description: "L'utilisateur connecté suit déjà l'auteur de l'action" },
        },
      },
      Suggestion: {
        allOf: [
          ref("Author"),
          {
            type: "object",
            properties: {
              followersCount: { type: "integer" },
              hint: { type: "string", example: "Suivi par najid" },
            },
          },
        ],
      },
      Connection: {
        allOf: [
          ref("Author"),
          {
            type: "object",
            properties: { bio: { type: "string" }, isFollowing: { type: "boolean" }, isMe: { type: "boolean" } },
          },
        ],
      },
    },
  },
  paths: {
    "/auth/register": {
      post: {
        tags: ["Authentification"],
        summary: "Créer un compte",
        requestBody: body({
          type: "object",
          required: ["name", "username", "email", "password"],
          properties: {
            name: { type: "string", example: "Reinhard Van Zry" },
            username: { type: "string", pattern: "^[a-zA-Z0-9_.]{3,30}$", example: "reinhard" },
            email: { type: "string", format: "email", example: "reinhard@solola.dev" },
            password: { type: "string", minLength: 5, maxLength: 72, example: "secret1" },
            role: { type: "string", enum: ["reader", "author"], default: "reader" },
            ...turnstileToken,
          },
        }),
        responses: {
          201: ok("Compte créé et connecté", ref("Session")),
          400: error(
            "Données invalides, ou inscription impossible avec ces informations " +
              "(le message ne dit pas si l'email a déjà un compte)"
          ),
          403: error("Vérification anti-robot échouée"),
          409: error("Nom d'utilisateur déjà pris"),
          ...pick(429),
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Authentification"],
        summary: "Se connecter",
        requestBody: body(credentials),
        responses: {
          200: ok("Connecté", ref("Session")),
          401: error("Identifiants incorrects"),
          403: error("Compte suspendu, ou vérification anti-robot échouée"),
          ...pick(400, 429),
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Authentification"],
        summary: "Se déconnecter",
        responses: { 200: ok("Cookie de session supprimé", ref("Message")) },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Authentification"],
        summary: "Utilisateur connecté",
        security: member,
        responses: { 200: ok("Utilisateur", { type: "object", properties: { user: ref("User") } }), ...pick(401) },
      },
    },
    "/auth/session": {
      get: {
        tags: ["Authentification"],
        summary: "Session courante, sans erreur pour un invité",
        description: "Renvoie `user: null` pour un invité et efface un cookie devenu invalide.",
        security: optionalMember,
        responses: {
          200: ok("Session", { type: "object", properties: { user: { ...ref("User"), nullable: true } } }),
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Authentification"],
        summary: "Recevoir un code de récupération par email",
        description:
          "Envoie un code à 6 chiffres valable 10 minutes. La réponse est la même que l'email existe ou non. " +
          "Sans SMTP configuré, le code s'affiche dans le terminal de l'API.",
        requestBody: body({
          type: "object",
          required: ["email"],
          properties: { email: { type: "string", format: "email" }, ...turnstileToken },
        }),
        responses: {
          200: ok("Demande prise en compte", ref("Message")),
          403: error("Vérification anti-robot échouée"),
          502: error("L'email n'a pas pu être envoyé"),
          ...pick(400, 429),
        },
      },
    },
    "/auth/verify-otp": {
      post: {
        tags: ["Authentification"],
        summary: "Vérifier le code reçu",
        description: "5 essais par code. Renvoie un jeton à usage unique pour choisir le nouveau mot de passe.",
        requestBody: body({
          type: "object",
          required: ["email", "code"],
          properties: {
            email: { type: "string", format: "email" },
            code: { type: "string", pattern: "^\\d{6}$", example: "482913" },
          },
        }),
        responses: {
          200: ok("Code valide", { type: "object", properties: { resetToken: { type: "string" } } }),
          ...pick(400, 429),
        },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["Authentification"],
        summary: "Choisir un nouveau mot de passe",
        description: "Coupe toutes les sessions ouvertes avant et reconnecte l'utilisateur.",
        requestBody: body({
          type: "object",
          required: ["email", "resetToken", "password"],
          properties: {
            email: { type: "string", format: "email" },
            resetToken: { type: "string" },
            password: { type: "string", minLength: 5, maxLength: 72 },
          },
        }),
        responses: { 200: ok("Mot de passe changé, connecté", ref("Session")), ...pick(400, 403, 404, 429) },
      },
    },
    "/posts": {
      get: {
        tags: ["Articles"],
        summary: "Lister les articles",
        description: "Un invité ne voit que les articles publics ; un membre voit aussi ceux des comptes qu'il suit.",
        security: optionalMember,
        parameters: [
          { name: "q", in: "query", description: "Recherche dans le titre, le contenu et les hashtags", schema: { type: "string", maxLength: 100 } },
          { name: "category", in: "query", schema: { type: "string", enum: categories } },
          { name: "tag", in: "query", description: "Hashtag sans #", schema: { type: "string" } },
          { name: "author", in: "query", description: "Nom d'utilisateur", schema: { type: "string" } },
          { name: "saved", in: "query", description: "Articles enregistrés (membre)", schema: { type: "string", enum: ["true"] } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["recent", "popular"], default: "recent" } },
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 30, default: 10 } },
        ],
        responses: { 200: ok("Page d'articles", ref("PostPage")), ...pick(401) },
      },
      post: {
        tags: ["Articles"],
        summary: "Publier un article (auteur ou admin)",
        security: member,
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: { type: "object", required: ["title", "content"], properties: postFields },
            },
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "content"],
                properties: jsonPostFields,
              },
            },
          },
        },
        responses: {
          201: ok("Article créé", { type: "object", properties: { post: ref("Post") } }),
          503: error("Envoi d'images non configuré"),
          ...pick(400, 401, 403),
        },
      },
    },
    "/posts/categories": {
      get: {
        tags: ["Articles"],
        summary: "Catégories disponibles",
        responses: {
          200: ok("Catégories", {
            type: "object",
            properties: { categories: { type: "array", items: { type: "string" }, example: categories } },
          }),
        },
      },
    },
    "/posts/{id}": {
      parameters: [idParam("Identifiant de l'article")],
      get: {
        tags: ["Articles"],
        summary: "Lire un article",
        security: optionalMember,
        responses: {
          200: ok("Article", { type: "object", properties: { post: ref("Post") } }),
          403: error("Réservé aux abonnés de l'auteur"),
          ...pick(400, 404),
        },
      },
      patch: {
        tags: ["Articles"],
        summary: "Modifier un article (son auteur ou un admin)",
        security: member,
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  ...postFields,
                  removeImage: { type: "string", enum: ["true"], description: "Retirer l'image actuelle" },
                },
              },
            },
            "application/json": {
              schema: { type: "object", properties: jsonPostFields },
            },
          },
        },
        responses: {
          200: ok("Article modifié", { type: "object", properties: { post: ref("Post") } }),
          503: error("Envoi d'images non configuré"),
          ...pick(400, 401, 403, 404),
        },
      },
      delete: {
        tags: ["Articles"],
        summary: "Supprimer un article (son auteur ou un admin)",
        description: "Supprime aussi ses commentaires, ses notifications et son image.",
        security: member,
        responses: { 200: ok("Article supprimé", ref("Message")), ...pick(400, 401, 403, 404) },
      },
    },
    "/posts/{id}/like": {
      parameters: [idParam("Identifiant de l'article")],
      post: {
        tags: ["Articles"],
        summary: "Aimer ou ne plus aimer",
        security: member,
        responses: { 200: ok("Nouvel état et nombre de likes", ref("Toggle")), ...pick(401, 403, 404) },
      },
    },
    "/posts/{id}/save": {
      parameters: [idParam("Identifiant de l'article")],
      post: {
        tags: ["Articles"],
        summary: "Enregistrer ou retirer des enregistrements",
        security: member,
        responses: { 200: ok("Nouvel état et nombre d'enregistrements", ref("Toggle")), ...pick(401, 403, 404) },
      },
    },
    "/posts/{id}/comments": {
      parameters: [idParam("Identifiant de l'article")],
      get: {
        tags: ["Commentaires"],
        summary: "Commentaires d'un article",
        security: optionalMember,
        responses: {
          200: ok("Commentaires, du plus ancien au plus récent", {
            type: "object",
            properties: { comments: { type: "array", items: ref("Comment") } },
          }),
          ...pick(403, 404),
        },
      },
      post: {
        tags: ["Commentaires"],
        summary: "Commenter",
        security: member,
        requestBody: body({
          type: "object",
          required: ["content"],
          properties: { content: { type: "string", maxLength: 1000, example: "Superbe !" } },
        }),
        responses: {
          201: ok("Commentaire ajouté", { type: "object", properties: { comment: ref("Comment") } }),
          ...pick(400, 401, 403, 404),
        },
      },
    },
    "/comments/{id}": {
      parameters: [idParam("Identifiant du commentaire")],
      delete: {
        tags: ["Commentaires"],
        summary: "Supprimer un commentaire",
        description: "Autorisé à l'auteur du commentaire, à l'auteur de l'article et aux admins.",
        security: member,
        responses: { 200: ok("Commentaire supprimé", ref("Message")), ...pick(401, 403, 404) },
      },
    },
    "/users/me": {
      get: {
        tags: ["Utilisateurs"],
        summary: "Mon profil avec mon nombre d'articles",
        security: member,
        responses: { 200: ok("Profil", { type: "object", properties: { user: ref("User") } }), ...pick(401) },
      },
      patch: {
        tags: ["Utilisateurs"],
        summary: "Modifier mon profil",
        security: member,
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", maxLength: 60 },
                  username: { type: "string", pattern: "^[a-zA-Z0-9_.]{3,30}$" },
                  bio: { type: "string", maxLength: 160 },
                  location: { type: "string", maxLength: 60 },
                  website: { type: "string", maxLength: 120, example: "https://solola.dev" },
                  avatar: { type: "string", format: "binary" },
                  cover: { type: "string", format: "binary" },
                  removeAvatar: { type: "string", enum: ["true"] },
                  removeCover: { type: "string", enum: ["true"] },
                },
              },
            },
          },
        },
        responses: {
          200: ok("Profil mis à jour", { type: "object", properties: { user: ref("User") } }),
          409: error("Nom d'utilisateur déjà pris"),
          503: error("Envoi d'images non configuré"),
          ...pick(400, 401),
        },
      },
    },
    "/users/me/password": {
      patch: {
        tags: ["Utilisateurs"],
        summary: "Changer mon mot de passe",
        description: "Coupe les autres sessions et renvoie un nouveau cookie pour celle-ci.",
        security: member,
        requestBody: body({
          type: "object",
          required: ["currentPassword", "newPassword"],
          properties: {
            currentPassword: { type: "string" },
            newPassword: { type: "string", minLength: 5, maxLength: 72 },
          },
        }),
        responses: {
          200: ok("Mot de passe mis à jour", ref("Message")),
          401: error("Non connecté ou mot de passe actuel incorrect"),
          ...pick(400),
        },
      },
    },
    "/users/suggestions": {
      get: {
        tags: ["Utilisateurs"],
        summary: "Comptes à suivre",
        security: optionalMember,
        responses: {
          200: ok("Cinq suggestions au plus", {
            type: "object",
            properties: { users: { type: "array", items: ref("Suggestion") } },
          }),
        },
      },
    },
    "/users/{username}": {
      parameters: [usernameParam],
      get: {
        tags: ["Utilisateurs"],
        summary: "Profil public",
        security: optionalMember,
        responses: { 200: ok("Profil", { type: "object", properties: { user: ref("User") } }), ...pick(404) },
      },
    },
    "/users/{username}/followers": {
      parameters: [usernameParam],
      get: {
        tags: ["Utilisateurs"],
        summary: "Abonnés",
        security: optionalMember,
        responses: {
          200: ok("Abonnés", { type: "object", properties: { users: { type: "array", items: ref("Connection") } } }),
          ...pick(404),
        },
      },
    },
    "/users/{username}/following": {
      parameters: [usernameParam],
      get: {
        tags: ["Utilisateurs"],
        summary: "Abonnements",
        security: optionalMember,
        responses: {
          200: ok("Abonnements", { type: "object", properties: { users: { type: "array", items: ref("Connection") } } }),
          ...pick(404),
        },
      },
    },
    "/users/{id}/follow": {
      parameters: [idParam("Identifiant de l'utilisateur à suivre")],
      post: {
        tags: ["Utilisateurs"],
        summary: "Suivre ou ne plus suivre",
        security: member,
        responses: {
          200: ok("Nouvel état", { type: "object", properties: { following: { type: "boolean" } } }),
          ...pick(400, 401, 404),
        },
      },
    },
    "/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "Mes notifications",
        security: member,
        parameters: [{ name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50, default: 20 } }],
        responses: {
          200: ok("Notifications, de la plus récente à la plus ancienne", {
            type: "object",
            properties: {
              unread: { type: "integer" },
              notifications: { type: "array", items: ref("Notification") },
            },
          }),
          ...pick(401),
        },
      },
    },
    "/notifications/read": {
      patch: {
        tags: ["Notifications"],
        summary: "Tout marquer comme lu",
        security: member,
        responses: { 200: ok("Fait", { type: "object", properties: { ok: { type: "boolean" } } }), ...pick(401) },
      },
    },
    "/health": {
      get: {
        summary: "État de l'API",
        responses: { 200: ok("L'API répond", { type: "object", properties: { ok: { type: "boolean" } } }) },
      },
    },
  },
};
