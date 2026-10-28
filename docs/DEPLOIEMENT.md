# Tutoriel : mettre le site en ligne gratuitement

Durée : environ 30 à 45 minutes la première fois. Coût : 0 €. Aucune carte bancaire n'est demandée par GitHub ni, à ce jour, par l'offre gratuite de Cloudflare Pages (vérifiez à l'inscription ; si une carte est demandée, arrêtez-vous et réfléchissez avant de continuer).

Résultat : le site tourne 24 h/24 sur les serveurs de Cloudflare, ordinateur éteint, et se met à jour tout seul à chaque modification envoyée sur GitHub.

---

## Étape 1 : créer un compte GitHub et un dépôt

1. Créez un compte gratuit sur https://github.com (si vous n'en avez pas).
2. Cliquez sur **New repository**. Nom : `mathsheetlab` (ou autre). Visibilité : **Public** (les GitHub Actions sont gratuites et illimitées sur les dépôts publics) ou **Private** (2 000 minutes/mois gratuites, largement suffisant ici).
3. Ne cochez rien d'autre, cliquez sur **Create repository**.

## Étape 2 : envoyer les fichiers

**Sans ligne de commande :** sur la page du dépôt vide, cliquez sur **uploading an existing file**, glissez tout le contenu du dossier dézippé (y compris les dossiers `src`, `scripts`, `docs`, `data`, `.github`), puis **Commit changes**.
Attention : le dossier `.github` est caché sur certains ordinateurs. Sur Mac : Cmd + Maj + point dans le Finder pour l'afficher. Sur Windows : Explorateur > Affichage > Éléments masqués.
Le dossier `dist` n'est pas nécessaire (Cloudflare le reconstruit).

**Avec Git (si vous l'avez) :**
```bash
cd mathsheetlab
git init && git add . && git commit -m "MathSheetLab v1"
git branch -M main
git remote add origin https://github.com/VOTRE-COMPTE/mathsheetlab.git
git push -u origin main
```

Dans l'onglet **Actions** du dépôt, le workflow **CI** doit passer au vert (tests + build + contrôle des liens).

## Étape 3 : publier sur Cloudflare Pages

1. Créez un compte gratuit sur https://dash.cloudflare.com/sign-up.
2. Menu **Workers & Pages** > **Create** > onglet **Pages** > **Connect to Git**. (L'interface change souvent : si vous ne trouvez pas, cherchez « Pages » ou « Import a repository ».)
3. Autorisez Cloudflare à accéder à votre dépôt GitHub `mathsheetlab`.
4. Réglages de build :
   - Framework preset : **None**
   - Build command : `node build.js`
   - Build output directory : `dist`
5. Variables d'environnement (section *Environment variables*) :
   - `SITE_URL` = l'adresse que Cloudflare va vous donner, par ex. `https://mathsheetlab.pages.dev`. Si le nom est déjà pris, Cloudflare propose une variante (par ex. `mathsheetlab-abc.pages.dev`) : mettez l'adresse exacte, puis relancez un déploiement (**Deployments > Retry deployment**).
   - `CONTACT_EMAIL` = une adresse que vous consultez (une adresse Gmail dédiée gratuite convient).
   - `NODE_VERSION` = `20`
6. **Save and Deploy**. Après une minute environ, le site est en ligne.

Vérification : ouvrez `https://VOTRE-SITE.pages.dev/sitemap.xml` ; les adresses doivent commencer par votre vraie URL. Sinon, corrigez `SITE_URL` et relancez.

## Étape 4 : activer le contrôle automatique hebdomadaire

1. Sur GitHub : **Settings > Secrets and variables > Actions > onglet Variables > New repository variable** : nom `SITE_URL`, valeur l'adresse du site.
2. Onglet **Actions** > **Live site check** > **Run workflow** pour tester tout de suite.
3. Ensuite, il tourne chaque lundi. S'il échoue (page inaccessible), GitHub vous envoie un e-mail.

## Étape 5 : se déclarer auprès des moteurs de recherche

1. **Google Search Console** (https://search.google.com/search-console) > Ajouter une propriété > **Préfixe d'URL** > votre adresse.
   - Méthode de validation **Balise HTML** : copiez seulement la valeur `content="…"`, mettez-la dans la variable Cloudflare `GOOGLE_SITE_VERIFICATION`, relancez le déploiement, puis cliquez sur **Valider**.
   - Menu **Sitemaps** : saisissez `sitemap.xml` > **Envoyer**.
2. **Bing Webmaster Tools** (https://www.bing.com/webmasters) : importez la propriété depuis Search Console (un clic).

## Étape 5 bis : voir le nombre de visites (gratuit, sans cookie)

1. Cloudflare > **Workers & Pages** > projet **mathlabs** > onglet **Metrics**.
2. Dans le bloc **Web Analytics**, cliquez sur **Enable**. Cloudflare ajoute lui-même le petit script de mesure au prochain déploiement (aucun code à changer, aucun cookie, pas de bandeau nécessaire).
3. Les chiffres (visites, pages vues, pages les plus consultées, pays, appareils) apparaissent au même endroit, ou dans **Analytics & Logs > Web Analytics**. Comptez quelques heures avant les premières données.
4. Pour savoir ce que les gens cherchent sur Google avant d'arriver : Search Console > **Performances** (requêtes, clics, positions).

## Étape 6 (plus tard) : nom de domaine

Recommandé avant la demande AdSense (voir `ADSENSE-ET-LEGAL.md`). Idéalement **dès le début**, pour ne pas devoir déménager le référencement.

1. Achetez un domaine (environ 10 à 15 €/an chez Cloudflare Registrar, OVH, Gandi, Porkbun…). Option gratuite : un domaine `eu.org` (validation manuelle pouvant prendre des semaines ; acceptation par AdSense non vérifiée).
2. Cloudflare Pages > votre projet > **Custom domains** > **Set up a custom domain**, suivez les instructions.
3. Changez `SITE_URL` pour la nouvelle adresse, relancez le déploiement, ajoutez la nouvelle propriété dans Search Console et renvoyez le sitemap.
4. Si le site était déjà indexé sur `.pages.dev` : créez une redirection 301 de l'ancienne adresse vers la nouvelle (Cloudflare : **Bulk Redirects**, gratuit).

## Mettre à jour le site

Modifiez un fichier (par exemple `src/catalog.js` pour ajouter une fiche) directement sur GitHub (icône crayon) ou en local, puis envoyez la modification. Cloudflare reconstruit et republie automatiquement, sitemap compris. Si les tests échouent, le workflow CI devient rouge sur GitHub.

## Alternative sans GitHub (déconseillée)

Cloudflare Pages accepte aussi le glisser-déposer du dossier `dist` (**Create > Pages > Upload assets**). Mais il faut alors reconstruire le site sur votre ordinateur (`SITE_URL=https://… node build.js`) à chaque modification, et vous perdez les tests et le contrôle automatiques.
