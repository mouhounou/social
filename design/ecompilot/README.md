# EcomPilot — Maquettes (test créativité & design)

| Fichier | Contenu |
|---|---|
| `landing.png` | Landing page, 1440 × 3100 (export @2x) |
| `dashboard.png` | Dashboard, 1440 × 1160 (export @2x) |
| `EcomPilot-maquettes.pdf` | Les 2 maquettes en PDF vectoriel (2 pages) |
| `landing.svg` / `dashboard.svg` | Versions vectorielles **à importer dans Figma** (calques nommés, textes éditables) |
| `source/` | Générateur des maquettes (Python + rendu Playwright) |

## Ouvrir dans Figma

1. Créer un fichier Figma vide.
2. Glisser-déposer `landing.svg` puis `dashboard.svg` sur le canevas (ou *Menu → Fichier → Importer*).
3. Chaque maquette arrive en frame avec des groupes nommés (`Section 1 · Hero`, `KPI / Chiffre d’affaires`, `Tableau des dernières commandes`…). Les textes restent éditables.
4. Polices utilisées (disponibles nativement dans Figma) : **Bricolage Grotesque** et **Inter**.

## Outils

- Claude (IA) : génération du code des maquettes en SVG vectoriel
- Python + Pillow : mesure exacte des textes pour l’alignement
- Playwright / Chromium : export PNG haute définition
- Figma : import, retouches et finitions
- Google Fonts : Bricolage Grotesque, Inter

## Choix de design

**Concept « cockpit ».** Le nom EcomPilot a guidé toute la direction artistique : le titre « Pilotez votre e-commerce sans turbulences », les anneaux de radar et la trajectoire en pointillés dans le visuel principal, le logo en avion en papier, l’appel à l’action « Prêt à décoller ? » et la section « Décollage en 3 étapes ».

**Couleurs.** Un vert forêt profond (#0D3B2C) inspire la confiance et évoque l’argent, sans tomber dans le bleu SaaS habituel. Un vert citron (#D4F36B) sert d’accent pour les chiffres clés et les CTA. Un fond crème chaud (#F3EEE5) remplace le gris froid. Les couleurs de statut sont réservées aux informations : ambre pour « en attente », bleu pour « en cours », vert pour « livrée », rouge pour « annulée ».

**Typographies.** Bricolage Grotesque, en capitales très grasses, donne du caractère aux titres et aux gros chiffres. Inter garantit une lecture nette des données et des tableaux.

**Ancrage local.** Les montants sont en FCFA (avec l’espace des milliers à la française). Les moyens de paiement mobile money (Wave, Orange Money, MTN MoMo, Moov) et le paiement à la livraison sont intégrés. Les quartiers d’Abidjan (Cocody, Plateau, Marcory…), les prénoms et les produits (robe wax, sac raphia) parlent directement à la cible.

**Le visuel principal montre le produit.** À la place d’une photo d’illustration, le hero met en scène l’interface réelle : chiffre d’affaires, nouvelle commande payée par Wave, livreur en route, alerte de stock. Le visiteur comprend ce que fait l’outil en 3 secondes.

**Des données cohérentes.** 385 livrées + 60 en cours + 75 en attente = 520 commandes, et 385 / 520 donne bien un taux de livraison de 74 %. La somme des 30 points du graphique fait exactement 3 850 000 FCFA. L’objectif de 5 000 000 FCFA est atteint à 77 %, et le pic du samedi 28 novembre tombe bien un samedi.

**Hiérarchie du dashboard.** La carte la plus importante, le chiffre d’affaires, est la seule en vert plein. Le badge « 75 » du menu Commandes signale ce qu’il faut traiter. La jauge résume la logistique en un coup d’œil, et les cartes « Objectif » et « Top produits » aident à décider.
