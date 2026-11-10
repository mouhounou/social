# Solola

Espace de publication avec authentification : les auteurs publient des articles (titre, contenu, catégorie, image), tout le monde peut lire, et les membres connectés aiment, enregistrent, commentent et se suivent.

```
backend/   API Express + MongoDB (Mongoose), JWT, Nodemailer, Cloudinary
user/      Front Next.js 16 (App Router, Tailwind 4)
admin/     Back-office (à venir)
```

## Lancer en local

### API

```bash
cd backend
cp .env.example .env   # remplir Mongo, JWT, Cloudinary et SMTP
pnpm install
pnpm dev               # http://localhost:5000
```

Sans `SMTP_USER`, les emails ne partent pas : le code OTP est affiché dans la console de l'API, pratique en dev.

### Front

```bash
cd user
cp .env.example .env.local
npm install
npm run dev            # http://localhost:3000
```

Le front appelle `/api/*`, que Next réécrit vers `API_URL`. Le cookie de session est donc posé sur le même domaine que le front.

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
| PATCH   | `/api/users/me` (avatar, cover) | connecté     |
| GET     | `/api/users/suggestions`      | public         |
| GET     | `/api/users/:username`        | public         |
| POST    | `/api/users/:id/follow`       | connecté       |
| GET     | `/api/notifications`          | connecté       |
| PATCH   | `/api/notifications/read`     | connecté       |
