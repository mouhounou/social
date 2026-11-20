# Solola

Espace de publication avec authentification : les auteurs publient des articles (titre, contenu, catégorie, image, et des paragraphes facultatifs avec image ou vidéo), tout le monde peut lire, et les membres connectés aiment, enregistrent, commentent et se suivent.

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

Sans `SMTP_USER`, les emails ne partent pas : le code OTP est affiché dans la console de l'API, pratique en dev. Voir [Emails](#emails-code-otp) pour les configurer.

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

L'URL du backend se règle dans `user/.env.local` (`API_URL=http://localhost:5000`). Le navigateur appelle toujours `/api/...` sur le front, et Next.js redirige ces appels vers `API_URL` (voir `next.config.ts`). Le cookie de session reste ainsi sur le domaine du front.

Arborescence du front :

```
user/
  app/          routes (App Router) et layouts : (auth) et (main)
  components/
    layout/     Navbar, Logo, Shortcuts
    ui/         Avatar, Modal, Spinner, RichText, Pagination
    auth/       AuthField, RequireAuth, GuestOnly
    post/       Feed (fil infini), PostGrid + PostTile (grille paginée), PostCard, PostForm,
                Composer, CommentInput, CategoryChips, ParagraphsEditor, Paragraphs, MediaView
    profile/    ProfileCard, ProfileForm, FollowButton, SuggestionsCard...
    notification/ ActivityCard
    providers/  AuthInitializer (charge la session au démarrage)
  store/        stores zustand (authStore)
  hooks/        useAuth, useOutsideClick, usePostReactions (like et enregistrement)
  lib/          axios.ts (instance + erreurs), api.ts (helper), constants.ts,
                media.ts (liens vidéo, limites), draft.ts (brouillon du fil vers /posts/new)
  utils/        time, query, recovery
  types/        types partagés (User, Post, Comment...)
```

Tests de bout en bout (navigateur), avec l'API et le front lancés :

```bash
cd user
npx playwright install chromium   # une seule fois
npm run test:e2e                  # E2E_URL=http://localhost:3000 par défaut
```

Ils créent leurs propres comptes (`e2e_auteur`, `e2e_lecteur`) et quelques articles dans la base de dev. Comme tout passe par la même adresse IP en local, les limites anti-abus de l'API (connexion, code OTP) peuvent se déclencher si on les relance beaucoup : redémarre l'API pour les remettre à zéro.

Le front appelle `/api/*`, que Next réécrit vers `API_URL`. Le cookie de session est donc posé sur le même domaine que le front.

## Abonnés et abonnements

Sur un profil, « Abonnés » et « Abonnements » ouvrent une fenêtre à deux onglets, avec recherche, badge « Te suit » et un bouton « Suivre » / « Abonné » par compte. Chaque action demande une confirmation.

La liste « Abonnés » d'un compte ne contient que les comptes qui le suivent vraiment : elle est calculée à partir du tableau `following` des autres comptes (celui qui ouvre les publications réservées aux abonnés), et les nombres affichés sur le profil suivent la même règle. Si une ancienne version a laissé des tableaux `followers` désaccordés, remets-les d'accord :

```bash
cd backend
pnpm repair:follows --dry-run   # compte seulement
pnpm repair:follows
```

## Commentaires et réponses

Un commentaire peut avoir des réponses, sur un seul niveau : répondre à une réponse la rattache au même fil, avec la mention de la personne à qui l'on répond (`@pseudo`). Sur la page d'une publication, « Voir les N réponses » ouvre un fil ; « Répondre » passe le champ de saisie en mode réponse (« En réponse à X », Échap pour annuler). Le nombre de commentaires affiché compte les réponses. Supprimer un commentaire supprime aussi ses réponses, après une confirmation qui le dit. La personne à qui l'on répond reçoit une notification « a répondu à ton commentaire » ; l'auteur de la publication est prévenu comme pour un commentaire. Les commentaires d'avant les réponses restent des commentaires de premier niveau.

## Notifications

La page Notifications range l'activité par date (aujourd'hui, hier, cette semaine, plus tôt), avec des filtres (Tout, J'aime, Commentaires, Abonnés) et une pagination de 20 par page ; le filtre et la page sont dans l'adresse. Les « j'aime » d'une même publication sont regroupés (« Awa, Brice et 2 autres ont aimé… »), un commentaire montre son début, et un abonnement propose « Suivre en retour » avec confirmation. Ce qui était non lu à l'ouverture reste signalé pendant la visite, puis tout passe en lu. Supprimer un commentaire supprime aussi sa notification.

## Fil et grilles

L'accueil et Explorer affichent un fil à défilement infini. La page **Enregistrés** et le **profil** (ses publications, et l'onglet « Enregistrés » de son propre profil) affichent une grille paginée : 6 publications par page, 3 colonnes quand la place le permet (2 sur tablette, 1 sur mobile). La page, le tri et l'onglet sont dans l'adresse (`/u/awa?tab=saved&page=2`), donc le retour arrière ramène au même endroit.

## Paragraphes

Une publication peut avoir des paragraphes, ou aucun : c'est facultatif. Chaque paragraphe a un **titre** (obligatoire, 150 caractères), une **description** (facultative, 5 000 caractères) et au plus **un média**, image ou vidéo :

| Source | Ce qui se passe |
| --- | --- |
| Depuis l'appareil | Le fichier est envoyé sur Cloudinary. Image JPEG, PNG, WebP, GIF, AVIF (5 Mo) ou vidéo MP4, WebM, MOV (50 Mo). |
| Lien YouTube, Vimeo ou Dailymotion | La vidéo reste chez elle et se lit dans son lecteur (YouTube passe par `youtube-nocookie.com`). |
| Autre lien | Il doit mener directement à un fichier image ou vidéo : Cloudinary le récupère et en garde une copie, avec la source affichée sous le média. |

Il y a 20 paragraphes au plus par publication. Les hashtags des descriptions deviennent des tags, et la recherche du fil porte aussi sur les paragraphes. Le formulaire complet (`/posts/new` et la modification) permet d'ajouter, réordonner et supprimer les paragraphes ; le bouton « Paragraphes » du formulaire rapide y mène en gardant ce qui est déjà saisi. Dans le fil, la carte indique le nombre de paragraphes, et une publication sans image de couverture montre la première image de ses paragraphes.

Les publications d'avant n'ont rien à migrer : sans paragraphes, elles s'affichent et se modifient comme avant, et l'API renvoie `paragraphs: []`. Les requêtes sans champ `paragraphs` ne touchent pas aux paragraphes.

Côté API, `paragraphs` est une liste JSON (une chaîne JSON en multipart) qui remplace la liste entière. Le média d'un paragraphe s'écrit `{ "file": n }` pour le n-ième fichier du champ `media`, `{ "link": "...", "type": "image" | "video" }` pour un lien, ou `{ "url": "..." }` pour garder le média actuel en modification. Les fichiers qui ne servent plus sont supprimés de Cloudinary. Le détail est dans Swagger.

## Profil

Sans photo ou couverture, le front affiche `user/public/default-avatar.svg` et `user/public/default-cover.svg`.
Depuis sa page profil, l'utilisateur change directement sa couverture et son avatar (envoyés sur Cloudinary), ou ouvre « Modifier le profil » pour ses infos (nom, pseudo, bio, ville, site) et pour revenir aux images par défaut. Le mot de passe se change dans Paramètres.

## Sécurité

- Session dans un cookie `httpOnly`, `SameSite=Lax`, `Secure` hors développement ; JWT signé en HS256, invalidé après un changement ou une réinitialisation de mot de passe.
- Limites anti-abus : par adresse IP sur toute l'API, et par compte sur la connexion (10 mots de passe faux) et la demande de code OTP (3 par email), même si l'attaquant change d'adresse IP.
- En-têtes de sécurité (`helmet` côté API, `next.config.ts` côté front), site non intégrable dans une iframe, redirection après connexion limitée au site.
- Anti-robots : l'inscription, la connexion et la demande de code passent par Cloudflare Turnstile (voir plus bas).
- L'inscription ne confirme pas qu'un email a déjà un compte : le refus est le même message neutre, sans champ désigné. Le nom d'utilisateur, lui, est public (page de profil), donc « déjà pris » reste affiché.
- Images acceptées : JPEG, PNG, WebP, GIF, AVIF (pas de SVG), 5 Mo au plus. Vidéos des paragraphes : MP4, WebM, MOV, 50 Mo au plus, gardées sur le disque le temps de l'envoi puis effacées. Cloudinary revérifie le format à l'arrivée.
- Médias par lien : seuls les liens `http(s)` sont acceptés (pas de `data:`, `file:`, `s3:`...). C'est Cloudinary qui va chercher le fichier, jamais l'API. Les lecteurs intégrés sont reconstruits à partir de l'identifiant de la vidéo, jamais à partir du lien fourni.
- `pnpm test` contient une suite `security.test.js` qui vérifie chacun de ces points.

En production :

- définis `NODE_ENV=production` : sans lui, le cookie n'est pas `Secure` et le code OTP s'affiche dans les journaux ;
- utilise un `JWT_SECRET` d'au moins 32 caractères aléatoires (l'API refuse de démarrer sinon) ;
- la doc Swagger est désactivée ; `API_DOCS=true` la réactive ;
- les limites anti-abus sont gardées en mémoire : avec plusieurs instances de l'API, il faut un stockage partagé (Redis) ;
- renseigne `TURNSTILE_SECRET` et `TURNSTILE_HOSTNAMES` sur l'API, sinon la protection anti-robots reste inactive (un avertissement s'affiche au démarrage).

### Anti-robots (Cloudflare Turnstile)

Le widget est affiché sur l'inscription, la connexion et « mot de passe oublié » (et, caché, sur la page du code pour le renvoi). Le navigateur obtient un jeton à usage unique, l'envoie dans le champ `cf-turnstile-response`, et l'API le fait vérifier par Cloudflare avant de traiter la requête : jeton valide, émis pour la bonne action (`signup`, `login`, `forgot-password`) et pour un domaine autorisé. Sinon elle répond 403 avec `field: "turnstile"`.

| Variable | Où | Rôle |
| --- | --- | --- |
| `TURNSTILE_SECRET` | API | Clé secrète du widget (tableau de bord Cloudflare → Turnstile). Vide = protection inactive. |
| `TURNSTILE_HOSTNAMES` | API | Domaine(s) du site, séparés par des virgules, ex. `solola.app,www.solola.app`. Obligatoire avec le secret ; jamais `localhost` en production. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Front | Facultatif : remplace la clé publique du widget (définie dans `user/lib/constants.ts`). |

En développement, le front utilise la clé de test de Cloudflare (toujours validée) et l'API ne vérifie rien tant que `TURNSTILE_SECRET` est vide. Pour essayer la vérification en local, mets `TURNSTILE_SECRET=1x0000000000000000000000000000000AA` et `TURNSTILE_HOSTNAMES=localhost` ; les secrets `2x…AA` (toujours refusé) et `3x…AA` (jeton déjà utilisé) servent à tester les refus. Ces clés de test sont refusées quand `NODE_ENV=production`.

## Emails (code OTP)

Les codes de « mot de passe oublié » partent par SMTP (variables `SMTP_*` de `backend/.env`). Pour vérifier la configuration sans passer par le site :

```bash
cd backend
pnpm mail:test ton@email.fr
```

La commande affiche ce qu'elle a lu dans `.env` (sans le mot de passe), teste la connexion et les identifiants, envoie un mail, et explique l'échec s'il y en a un. Au démarrage, l'API fait la même vérification et écrit `Emails : SMTP prêt` ou la cause du problème.

| Symptôme | Cause | Solution |
| --- | --- | --- |
| « un code vient d'être envoyé » mais rien n'arrive, en local | `SMTP_USER` vide | Normal en dev : le code est dans la console de l'API. Sinon, remplis les variables `SMTP_*`. |
| `identifiants SMTP refusés` | Avec Gmail, mot de passe du compte au lieu d'un mot de passe d'application | Active la validation en deux étapes, crée un mot de passe d'application (16 lettres) et mets-le dans `SMTP_PASS`. |
| `serveur SMTP injoignable`, ou l'envoi prend 10 s puis échoue | Mauvais `SMTP_HOST` / `SMTP_PORT`, ou hébergeur qui bloque les ports SMTP | Essaie le port 465, le 2525 si ton fournisseur le propose, ou un service d'envoi par API. |
| `adresse d'expéditeur refusée` | `MAIL_FROM` sur un domaine que ton compte SMTP ne peut pas utiliser | Laisse `MAIL_FROM` vide (l'expéditeur devient `Solola <SMTP_USER>`). |
| Le mail est accepté mais n'arrive pas | Filtre anti-spam | Regarde les spams ; un expéditeur sur ton propre domaine (avec SPF et DKIM) arrive mieux. |

En production (`NODE_ENV=production`) sans `SMTP_USER`, « mot de passe oublié » répond 503 au lieu d'annoncer un envoi qui n'a pas lieu, et le code n'est jamais écrit dans les journaux.

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
| POST    | `/api/posts` (multipart ou JSON, paragraphes facultatifs) | author, admin  |
| PATCH   | `/api/posts/:id` (multipart ou JSON) | propriétaire, admin |
| DELETE  | `/api/posts/:id`              | propriétaire, admin |
| POST    | `/api/posts/:id/like`         | connecté       |
| POST    | `/api/posts/:id/save`         | connecté       |
| GET     | `/api/posts/:id/comments`     | public         |
| POST    | `/api/posts/:id/comments`     | connecté       |
| POST    | `/api/posts/:id/comments` avec `parent` | connecté (réponse à un commentaire) |
| GET     | `/api/comments/:id/replies`   | public         |
| DELETE  | `/api/comments/:id`           | auteur du commentaire ou de l'article, admin (emporte ses réponses) |
| GET     | `/api/users/me`               | connecté       |
| PATCH   | `/api/users/me` (nom, bio, ville, site, avatar, cover) | connecté |
| PATCH   | `/api/users/me/password`      | connecté       |
| GET     | `/api/users/suggestions`      | public         |
| GET     | `/api/users/:username`        | public         |
| GET     | `/api/users/:username/followers` | public      |
| GET     | `/api/users/:username/following` | public      |
| POST    | `/api/users/:id/follow`       | connecté       |
| GET     | `/api/notifications?type=like\|comment\|follow&page=&limit=` | connecté |
| PATCH   | `/api/notifications/read`     | connecté       |
