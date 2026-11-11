# Solola

Espace de publication avec authentification : les auteurs publient des articles (titre, contenu, catégorie, image), tout le monde peut lire, et les membres connectés aiment, enregistrent, commentent et se suivent.

```
backend/   API Express + MongoDB (Mongoose), JWT, Nodemailer, Cloudinary
user/      Front Next.js 16 (App Router, Tailwind 4)
admin/     Back-office (à venir)
```

Le modèle de données (MCD Looping, MLD et dictionnaire des données) est dans [`docs/analyse`](docs/analyse/analyse-donnees.md).

## Lancer en local

### MongoDB

Il faut un MongoDB local (ou une URI Atlas dans `MONGO_URI`). Le plus simple :

```bash
docker run -d --name solola-mongo -p 27017:27017 mongo:8
```

### API

```bash
cd backend
cp .env.example .env   # remplir Mongo, JWT, Cloudinary et SMTP
pnpm install
pnpm dev               # http://localhost:5000
```

Sans `SMTP_USER`, les emails ne partent pas : le code OTP est affiché dans la console de l'API, pratique en dev.

La documentation interactive de l'API (Swagger) est sur http://localhost:5000/docs, et le document OpenAPI sur http://localhost:5000/docs.json. Dans Swagger, appelle `POST /auth/login` : le cookie de session est posé et les routes protégées marchent ensuite directement.

`TRUST_PROXY` indique les proxys dont l'API accepte l'en-tête `X-Forwarded-For` : `loopback` pour le front Next en local, à adapter à l'hébergeur en production. Sans lui, tous les visiteurs partageraient la même limite de requêtes.

### Tests de l'API

```bash
cd backend
pnpm test
```

Les tests tournent sur une base `solola_test` (vidée au début et à la fin) du MongoDB local, ou sur `MONGO_URI_TEST`. Les mails sont interceptés, rien n'est envoyé.

### Front

```bash
cd user
cp .env.example .env.local
npm install
npm run dev            # http://localhost:3000
```

Tests de bout en bout (navigateur), avec l'API et le front lancés :

```bash
cd user
npx playwright install chromium   # une seule fois
npm run test:e2e                  # E2E_URL=http://localhost:3000 par défaut
```

Ils créent leurs propres comptes (`e2e_auteur`, `e2e_lecteur`) et quelques articles dans la base de dev. Comme tout passe par la même adresse IP en local, les limites anti-abus de l'API (connexion, code OTP) peuvent se déclencher si on les relance beaucoup : redémarre l'API pour les remettre à zéro.

Le front appelle `/api/*`, que Next réécrit vers `API_URL`. Le cookie de session est donc posé sur le même domaine que le front.

## Profil

Sans photo ou couverture, le front affiche `user/public/default-avatar.svg` et `user/public/default-cover.svg`.
Depuis sa page profil, l'utilisateur change directement sa couverture et son avatar (envoyés sur Cloudinary), ou ouvre « Modifier le profil » pour ses infos (nom, pseudo, bio, ville, site) et pour revenir aux images par défaut. Le mot de passe se change dans Paramètres.

## Sécurité

- Session dans un cookie `httpOnly`, `SameSite=Lax`, `Secure` hors développement ; JWT signé en HS256, invalidé après un changement ou une réinitialisation de mot de passe.
- Limites anti-abus : par adresse IP sur toute l'API, et par compte sur la connexion (10 mots de passe faux) et la demande de code OTP (3 par email), même si l'attaquant change d'adresse IP.
- En-têtes de sécurité (`helmet` côté API, `next.config.ts` côté front), site non intégrable dans une iframe, redirection après connexion limitée au site.
- Images acceptées : JPEG, PNG, WebP, GIF, AVIF (pas de SVG), 5 Mo au plus.
- `pnpm test` contient une suite `security.test.js` qui vérifie chacun de ces points.

En production :

- définis `NODE_ENV=production` : sans lui, le cookie n'est pas `Secure` et le code OTP s'affiche dans les journaux ;
- utilise un `JWT_SECRET` d'au moins 32 caractères aléatoires (l'API refuse de démarrer sinon) ;
- la doc Swagger est désactivée ; `API_DOCS=true` la réactive ;
- les limites anti-abus sont gardées en mémoire : avec plusieurs instances de l'API, il faut un stockage partagé (Redis).

## Rôles

| Rôle    | Peut faire                                                      |
| ------- | --------------------------------------------------------------- |
| invité  | lire le fil, les articles, les profils                          |
| reader  | + aimer, enregistrer, commenter, suivre                         |
| author  | + publier, modifier et supprimer ses articles                   |
| admin   | + modifier / supprimer n'importe quel article ou commentaire    |

Le rôle `reader` ou `author` se choisit à l'inscription. `admin` se donne directement en base (ou via le back-office plus tard).

## Récupération de compte (OTP)

1. `POST /api/auth/forgot-password` `{ email }` : génère un code à 6 chiffres (hashé en base, valable 10 min) et l'envoie par mail.
2. `POST /api/auth/verify-otp` `{ email, code }` : 5 essais max, renvoie un `resetToken` à usage unique.
3. `POST /api/auth/reset-password` `{ email, resetToken, password }` : change le mot de passe et reconnecte l'utilisateur.

## API

Le détail des paramètres, corps de requête et réponses est dans Swagger (`/docs`). Résumé :

| Méthode | Route                         | Accès          |
| ------- | ----------------------------- | -------------- |
| POST    | `/api/auth/register`          | public         |
| POST    | `/api/auth/login`             | public         |
| POST    | `/api/auth/logout`            | public         |
| GET     | `/api/auth/session`           | public         |
| GET     | `/api/posts?q=&category=&tag=&author=&sort=recent\|popular&page=` | public |
| GET     | `/api/posts/categories`       | public         |
| GET     | `/api/posts/:id`              | public         |
| POST    | `/api/posts` (multipart)      | author, admin  |
| PATCH   | `/api/posts/:id` (multipart)  | propriétaire, admin |
| DELETE  | `/api/posts/:id`              | propriétaire, admin |
| POST    | `/api/posts/:id/like`         | connecté       |
| POST    | `/api/posts/:id/save`         | connecté       |
| GET     | `/api/posts/:id/comments`     | public         |
| POST    | `/api/posts/:id/comments`     | connecté       |
| DELETE  | `/api/comments/:id`           | auteur du commentaire ou de l'article, admin |
| GET     | `/api/users/me`               | connecté       |
| PATCH   | `/api/users/me` (nom, bio, ville, site, avatar, cover) | connecté |
| PATCH   | `/api/users/me/password`      | connecté       |
| GET     | `/api/users/suggestions`      | public         |
| GET     | `/api/users/:username`        | public         |
| GET     | `/api/users/:username/followers` | public      |
| GET     | `/api/users/:username/following` | public      |
| POST    | `/api/users/:id/follow`       | connecté       |
| GET     | `/api/notifications`          | connecté       |
| PATCH   | `/api/notifications/read`     | connecté       |
