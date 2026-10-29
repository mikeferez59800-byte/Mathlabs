# MathSheetLab

Générateur gratuit de fiches d'exercices de maths imprimables (site en anglais, pour un public international).
Site statique sans dépendance npm, sur Cloudflare Pages (gratuit, 24 h/24). Seul le **Multiplication World Championship** (`/multiplication-championship/`) utilise un petit serveur : une Pages Function sur `/api/championship/*` et une base Cloudflare D1. Voir `docs/CHAMPIONNAT.md` (architecture, anti-triche, données, mise en service).

- 61 types de fiches (addition, soustraction, tables de multiplication, division posée, fractions, décimaux, arrondis, entiers relatifs, priorités opératoires, puissances, pourcentages).
- Problèmes générés dans le navigateur, nombre illimité de fiches, corrigé automatique sur une 2e page.
- Chaque fiche a un numéro : le lien `?s=482913` redonne exactement la même fiche (utile pour une classe).
- Impression / PDF via la fonction d'impression du navigateur (seule la fiche est imprimée).
- 75 pages indexables avec `title`, `meta description`, URL canonique, données structurées (BreadcrumbList, LearningResource), `sitemap.xml`, `robots.txt`, page 404.
- Emplacements AdSense prêts mais **désactivés** : aucune publicité ni aucun cookie tant que vous ne les activez pas.

## Commandes

Prérequis : Node.js 18 ou plus récent (gratuit, https://nodejs.org).

```bash
node build.js                 # génère le site dans dist/
node scripts/test-engine.js   # vérifie 1,3 million de problèmes (réponses et règles)
node scripts/check-site.js    # vérifie liens internes, titres, descriptions, sitemap
node scripts/test-print.js    # (après un build) imprime toutes les fiches en PDF et vérifie la mise en page ; nécessite Playwright
node scripts/make-print-samples.js   # (après un build) PDF des fiches témoins (une par famille) dans print-samples/
npm run serve                 # build + aperçu local sur http://localhost:8080 (nécessite Python 3)
SITE_URL=https://votre-site.pages.dev node scripts/check-live.js   # contrôle du site en ligne
node scripts/make-og.js       # (après un build) régénère les images de partage dans static/og/ ; nécessite Playwright
node scripts/test-championship.mjs   # championnat : règles, API, sécurité, charge (Node 22+)
```

## Structure

```
site.config.js          Nom du site, URL, e-mail de contact, réglages AdSense (via variables d'environnement)
build.js                Générateur du site (pages, sitemap, robots.txt, _headers, ads.txt)
src/catalog.js          Catalogue des fiches : 1 entrée = 1 page (titre, description, textes, paramètres)
src/explain.js          Exemples résolus pas à pas (un par fiche), vérifiés par les tests
static/og/              Images de partage 1200x630 (réseaux sociaux, Pinterest), copiées telles quelles dans dist/
src/engine.js           Moteur : générateurs de problèmes + rendu HTML d'un exercice (partagé navigateur / build / tests)
src/layout.js           Mise en page imprimable : familles A à F, pagination A4 / Letter, corrigé, styles Classic / Large print
src/app.js              Interface : options, nouvelles fiches, impression, copie du lien, recherche
src/styles.css          Styles écran + impression, mode sombre
scripts/                Tests du moteur, contrôle du site construit, contrôle du site en ligne
.github/workflows/      CI (tests à chaque push) et contrôle hebdomadaire du site en ligne
src/championship/      Championnat : règles, API, schéma D1, textes EN/FR/JA, pages, script du jeu
functions/              Point d'entrée Cloudflare Pages Functions (API du championnat)
migrations/             Migrations SQL D1 (générées depuis src/championship/schema.mjs)
data/lastmod.json       Dates de dernière modification réelles pour le sitemap (mises à jour automatiquement)
docs/                   Tutoriel de mise en ligne, procédure AdSense et obligations légales
```

## Ajouter une nouvelle fiche

1. Si un générateur existant convient (par ex. `add`, `sub`, `longDiv`), ajoutez simplement une entrée dans `src/catalog.js` avec un `slug` unique, un titre, une description, des paragraphes d'introduction **originaux** et les paramètres.
2. Sinon, ajoutez une fonction `G.monGenerateur = function (rng, p) { ... }` dans `src/engine.js` qui renvoie un problème (`kind: 'h'` pour une ligne, `'v'` pour une opération posée, etc.), puis une vérification dans `scripts/test-engine.js`.
3. Ajoutez un exemple résolu pour un nouveau générateur dans `src/explain.js`.
4. La mise en page est automatique : `src/layout.js` choisit la famille (A grille de calcul, B fractions et nombres, C équations, D figures et mesures, E problèmes rédigés, F opérations posées avec espace de travail) d'après le format des exercices. Pour la forcer, ajoutez `layout: 'C'` (par exemple) à l'entrée du catalogue.
5. Lancez `node scripts/test-engine.js && node build.js && node scripts/make-og.js && node scripts/check-site.js`, puis poussez sur GitHub : Cloudflare reconstruit et publie tout seul, sitemap compris.

## Variables d'environnement (Cloudflare Pages > Settings > Variables)

| Variable | Rôle |
|---|---|
| `SITE_URL` | URL publique exacte, ex. `https://mathsheetlab.pages.dev` ou votre domaine |
| `CONTACT_EMAIL` | Adresse affichée sur les pages Contact et Mentions légales |
| `PUBLISHER_NAME` | Nom de l'éditeur pour les mentions légales (voir docs/ADSENSE-ET-LEGAL.md) |
| `CF_ANALYTICS_TOKEN` | Facultatif : jeton Cloudflare Web Analytics si le site n'est pas activé en un clic dans Cloudflare Pages |
| `GOOGLE_SITE_VERIFICATION` | Jeton de validation Search Console (méthode balise HTML), facultatif |
| `ADSENSE_CLIENT` | `ca-pub-…` : ajoute la balise de validation AdSense et `ads.txt` (sans afficher de pub) |
| `ADS_ENABLED` | `true` **uniquement après approbation AdSense** : charge le script et les blocs d'annonces |
| `ADSENSE_SLOT_TOP`, `ADSENSE_SLOT_BOTTOM` | Identifiants des blocs d'annonces créés dans AdSense |
| `ADMIN_TOKEN` (secret) | Mot de passe de l'admin du championnat (24 caractères ou plus) |
| `RATE_LIMIT_SALT` (secret, facultatif) | Sel des empreintes réseau du championnat |

Liaison D1 : `DB` → base `mathsheetlab-championship` (voir `docs/CHAMPIONNAT.md`, section 3).

Voir `docs/DEPLOIEMENT.md` pour la mise en ligne pas à pas.
