# Dossier projet : site gratuit financé par la publicité

Date : 28 octobre 2026. Toutes les sources citées ont été consultées à cette date. Rien dans ce dossier ne garantit un revenu.

**Légende :** ✅ = donnée vérifiée avec source · ⚠️ = hypothèse ou estimation non vérifiée.

---

## 1. Ce qu'il faut savoir avant tout (contexte 2025-2026)

Ces faits pèsent sur toutes les idées et expliquent le choix final.

- **Les résumés IA de Google réduisent les clics.** ✅ Étude Pew Research (mars 2025, 900 adultes américains, 68 879 recherches) : les internautes cliquent sur un lien classique dans **8 %** des visites quand un résumé IA apparaît, contre **15 %** sans résumé ; 18 % des recherches affichaient un résumé. [Pew Research, 22/07/2025](https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/). Conséquence : les sites qui *répondent à une question* (définition, formule, date) perdent du trafic ; un site qui *fait quelque chose* (produire un fichier imprimable) en perd moins. ⚠️ Ce dernier point est un raisonnement, pas une mesure.
- **Google sanctionne le contenu généré en masse.** ✅ Depuis mars 2024, la règle « scaled content abuse » vise les pages produites en nombre « principalement pour manipuler le classement », quel que soit l'outil (IA ou non). [Google Search Central, mars 2024](https://developers.google.com/search/blog/2024/03/core-update-spam-policies). Conséquence : pas de milliers de pages automatiques ; chaque page doit être un outil réellement différent.
- **Les petits éditeurs indépendants ont été durement touchés** par les mises à jour 2024-2025 (nombreux témoignages, par ex. [AdExchanger](https://www.adexchanger.com/marketers/google-searchs-core-updates-are-crushing-sites-and-reshaping-the-web)). ⚠️ Aucune statistique fiable et générale n'existe ; c'est un risque réel mais non chiffrable.
- **AdSense n'accepte en pratique que des sites dont vous contrôlez le domaine.** ✅ Google exige de « posséder le site » et d'accéder à son code HTML ([AdSense, éligibilité](https://support.google.com/adsense/answer/9724?hl=en), [propriété du site](https://support.google.com/adsense/answer/91205?hl=en)). ⚠️ Aucune règle écrite de Google ne dit explicitement « les sous-domaines gratuits (`*.pages.dev`, `*.github.io`, `*.vercel.app`) sont refusés », mais de nombreux développeurs le rapportent ([exemple](https://dev.to/morinaga/why-google-adsense-will-not-approve-a-vercelapp-site-110b)). **Il faut donc prévoir un nom de domaine (environ 10 à 15 €/an) au moment de demander AdSense.** C'est la seule dépense probable du projet ; elle n'est pas nécessaire pour lancer le site.

---

## 2. Étude comparative : 14 idées

Méthode : pour chaque idée, j'ai identifié les concurrents établis (preuve indirecte de la demande) et évalué les 10 critères demandés. **Je n'ai pas accès à un outil gratuit fiable de volumes de recherche** (Google Keyword Planner ne donne que des fourchettes et demande un compte Ads) : aucun volume n'est donc chiffré. Les notes sur 5 sont mon jugement argumenté ⚠️, pas des mesures.

| # | Idée | Public | Demande (preuve) | Concurrence | Résiste à l'IA | Coût / maintenance | Score /30 |
|---|---|---|---|---|---|---|---|
| 1 | **Générateur de fiches de maths imprimables** | Parents, enseignants, soutien scolaire, école à la maison (US, UK, CA, AU) | ✅ dadsworksheets.com revendique « des dizaines de millions de visiteurs » depuis 2008 ([source](https://dadsworksheets.com/about/)) ; rang mondial Similarweb ≈ 17 300 en sept. 2026 ([source](https://www.similarweb.com/website/dadsworksheets.com/competitors)) ; une dizaine de sites comparables (math-drills, math-aids, mathworksheets4kids, k5learning…) | Forte sur les requêtes générales, plus faible sur les requêtes précises | 4 | 0 € ; quasi nulle | **24** |
| 2 | Générateur de puzzles imprimables (mots mêlés, sudoku, mots croisés) | Enseignants, seniors, parents | Concurrents établis : thewordsearch.com, Puzzle Maker (Discovery Education) | Forte | 4 | 0 € ; nulle | 21 |
| 3 | Plannings et calendriers imprimables | Grand public, organisation | Concurrents : calendarlabs, timeanddate | Forte, très saisonnière (déc.-janv.) | 3 | 0 € ; mise à jour annuelle | 18 |
| 4 | Calculateurs de loisirs de niche (impression 3D, résine époxy, tricot, aquarium) | Amateurs passionnés | Forums et calculateurs existants ; ⚠️ volumes inconnus | Moyenne, Omnicalculator couvre beaucoup de niches | 2 (formules faciles à demander à une IA) | 0 € ; faible | 18 |
| 5 | Dates de semis et de gel par localité (US) | Jardiniers | Concurrents : almanac.com, garden.org | Moyenne | 4 | 0 € ; données NOAA à intégrer (complexe) | 18 |
| 6 | Outils image / PDF dans le navigateur (compresser, convertir) | Tout le monde | Demande massive (iLovePDF, Smallpdf, TinyPNG) | Extrême, marques mondiales | 4 | 0 € ; faible | 16 |
| 7 | Calculateurs de dates (jours entre deux dates, âge, compte à rebours) | Grand public | timeanddate, calculator.net | Très forte | 1 (résumé IA répond directement) | 0 € ; nulle | 15 |
| 8 | Jours fériés et ponts par pays | Salariés, RH, voyageurs | officeholidays, timeanddate ; API libre Nager.Date | Forte | 2 | 0 € ; données à mettre à jour | 15 |
| 9 | Outils pour coureurs (allure, prédiction de temps) | Coureurs | Runner's World et nombreux calculateurs | Forte | 2 | 0 € ; nulle | 14 |
| 10 | Convertisseurs de tailles (chaussures, bagues, vêtements) | Acheteurs en ligne | Sites de marques et de distributeurs | Forte, et revenu plutôt en affiliation | 2 | 0 € ; faible | 13 |
| 11 | Jeux de mots quotidiens / solveurs type Wordle | Joueurs | Engouement en baisse ⚠️ ; NYT possède Wordle | Saturée | 3 | 0 € ; contenu quotidien | 12 |
| 12 | Outils couleurs / palettes pour designers | Designers | coolors.co | Forte ; public technophile avec beaucoup de bloqueurs de pub ⚠️ | 3 | 0 € ; nulle | 12 |
| 13 | Outils texte (compteur de mots, changement de casse) | Étudiants, rédacteurs | Demande élevée | Saturée | 1 (ChatGPT le fait) | 0 € ; nulle | 11 |
| 14 | Générateur de QR codes | PME, particuliers | Demande élevée | Saturée, réputation abîmée par des sites piégés | 2 | 0 € ; nulle | 10 |

### Détail des 10 critères pour les 5 meilleures idées

**1. Fiches de maths imprimables (retenue)**
1. Public : parents, enseignants, tuteurs, familles qui font l'école à la maison, dans les pays anglophones.
2. Problème : trouver vite une fiche d'entraînement sur une compétence *précise* (« 2-digit subtraction with regrouping »), au bon niveau, avec corrigé, sans inscription.
3. Recherches visées (exemples, volumes non vérifiés ⚠️) : « 7 times table worksheet », « long division with remainders worksheet », « adding fractions with unlike denominators worksheet », « 2 digit addition with regrouping worksheets free ».
4. Preuves de demande : concurrents rentables depuis plus de 15 ans (voir tableau) ✅ ; besoin récurrent à chaque année scolaire ⚠️.
5. Concurrence : forte sur « math worksheets » ; plus accessible sur les combinaisons précises compétence + niveau. Notre différence : fiches illimitées, lien reproductible, corrigé, impression propre, aucune inscription.
6. Difficulté SEO : élevée sur les requêtes générales, moyenne sur la longue traîne ⚠️.
7. Monétisation : publicité compatible (contenu familial). Usage sur ordinateur pour imprimer ⚠️, ce qui favorise l'affichage des annonces. Risque : public perçu comme « enfants » (voir la fin de la section 4).
8. Coûts techniques : 0 € (site statique).
9. Maintenance : quasi nulle une fois en ligne ; aucune donnée externe à mettre à jour.
10. Risques : concurrence installée ; saisonnalité scolaire (creux en été ⚠️) ; RPM éducation moyen ; possible traitement « public enfant » par Google.

**2. Puzzles imprimables** : même public et même logique ; je le recommande comme **extension du site retenu** (semaine 5-6 ou mois 3) plutôt que comme site séparé, pour concentrer l'autorité sur un seul domaine.

**3. Calendriers imprimables** : trafic très concentré sur 2 mois par an et concurrents puissants : rejeté comme site principal.

**4. Calculateurs de niche** : chaque niche est petite, et une formule se demande facilement à une IA. Les pages répondant à une question simple sont les plus exposées aux résumés IA (§1).

**5. Dates de semis / gel** : bonne idée, mais nécessite de traiter correctement des données climatiques (stations NOAA, codes postaux) ; une erreur de données a des conséquences réelles pour l'utilisateur. Trop risqué pour une v1 à 0 €.

### Pourquoi le n° 1 est préférable aux autres

- **Besoin fréquent et durable** : chaque élève a besoin d'entraînement, chaque année ; le programme change peu.
- **Résiste à ChatGPT** : une IA peut écrire des exercices, mais produire en un clic une fiche propre, mise en page pour l'impression, avec corrigé fiable et reproductible pour une classe, reste plus simple ici. Nos corrigés sont *calculés* et vérifiés par des tests automatiques (1,3 million de problèmes contrôlés), alors qu'une IA peut se tromper dans un corrigé.
- **Entièrement automatisable** : aucune donnée externe, aucun contenu quotidien à produire.
- **Compatible AdSense** : contenu éducatif et familial.
- **SEO réaliste** : beaucoup de requêtes précises, chacune servie par une page réellement différente (pas du contenu dupliqué).
- **Infrastructure gratuite** : 100 % statique.

Ce que je n'ai pas choisi pour de mauvaises raisons : les outils PDF/image sont plus « populaires », mais impossibles à classer face à des marques mondiales.

---

## 3. Modèle économique

### 3.1 RPM : ce qui est vérifié et ce qui ne l'est pas

Le RPM de page est le revenu pour 1 000 pages vues.

- ✅ Une régie (MonetizeMore, article mis à jour en mars 2026, chiffres non datés) cite un RPM de **4,59 à 6,15 $** pour les pays anglophones de premier rang et **30 à 50 $** pour la finance ([source](https://www.monetizemore.com/blog/how-much-should-my-website-be-earning/)). Ce sont des moyennes de régie, pas des chiffres AdSense pour un nouveau site éducatif.
- ⚠️ Pour un nouveau site éducatif, avec une partie du trafic en Europe (annonces non personnalisées sans consentement), des bloqueurs de publicité et peu d'emplacements, j'utilise trois hypothèses prudentes : **1 €**, **3 €** et **6 €** par 1 000 pages vues.

### 3.2 Pages vues nécessaires par mois (calcul : revenu ÷ RPM × 1 000)

| Objectif mensuel | RPM 1 € (pessimiste) | RPM 3 € (intermédiaire) | RPM 6 € (optimiste) |
|---|---|---|---|
| 100 € | 100 000 | 33 333 | 16 667 |
| 300 € | 300 000 | 100 000 | 50 000 |
| 500 € | 500 000 | 166 667 | 83 333 |
| 1 000 € | 1 000 000 | 333 333 | 166 667 |

### 3.3 Trois scénarios de trafic (tous hypothétiques ⚠️)

Hypothèses : site lancé en novembre 2026, enrichi pendant 6 mois, AdSense obtenu vers le mois 4 à 6 *si Google l'accepte*.

| Scénario | Pages vues/mois à 6 mois | à 12 mois | à 24 mois | Revenu à 12 mois | Revenu à 24 mois |
|---|---|---|---|---|---|
| Pessimiste (RPM 1 €) | 500 | 3 000 | 10 000 | ≈ 3 € | ≈ 10 € |
| Intermédiaire (RPM 3 €) | 5 000 | 40 000 | 120 000 | ≈ 120 € | ≈ 360 € |
| Optimiste (RPM 6 €) | 20 000 | 120 000 | 250 000 | ≈ 720 € | ≈ 1 500 € |

Lecture honnête : le scénario pessimiste est **tout à fait possible** (beaucoup de sites ne décollent jamais). L'objectif de 300 à 1 000 €/mois correspond au haut du scénario intermédiaire ou au scénario optimiste, et demande en général **12 à 24 mois** et un enrichissement régulier du site ⚠️. Plusieurs mois sans aucun revenu sont normaux.

### 3.4 Conditions AdSense (vérifiées)

✅ Selon [Google](https://support.google.com/adsense/answer/9724?hl=en) : avoir 18 ans ou plus ; contenu original, de qualité et qui attire une audience ; respecter le règlement AdSense ; pouvoir modifier le code HTML du site. Google ne promet aucune approbation et ne publie pas de seuil de trafic minimal. Un refus avec le motif « site pas encore prêt » est fréquent pour les sites récents ⚠️.

### 3.5 Limites des hébergements gratuits (vérifiées le 28/10/2026)

| | Cloudflare Pages (retenu) | GitHub Pages |
|---|---|---|
| Bande passante | Illimitée pour les fichiers statiques ✅ | Plafond souple de 100 Go/mois ✅ |
| Builds | 500/mois, 20 min max ✅ | 10/heure (plafond souple) ✅ |
| Fichiers | 20 000 par site, 25 Mo max par fichier ✅ | Site de 1 Go max ✅ |
| Domaines personnalisés | 100 par projet ✅ | 1 |
| Usage commercial | Pas de restriction dans les limites publiées ✅ | « Pas destiné à faire tourner une activité en ligne » ✅ |
| Carte bancaire | Non demandée pour l'offre gratuite ⚠️ (à vérifier à l'inscription) | Non |

Sources : [limites Cloudflare Pages](https://developers.cloudflare.com/pages/platform/limits/), [limites GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits). Note : Cloudflare conseille désormais Workers pour les *nouveaux* projets dynamiques ; Pages reste disponible et adapté à un site statique ([source](https://temps.sh/blog/cloudflare-pages-free-tier-limits-2026)). Le site peut passer sur Workers (fichiers statiques gratuits) sans modification du code si un jour c'est nécessaire.

### 3.6 Obligations légales (résumé, détail dans `ADSENSE-ET-LEGAL.md`)

- **Consentement publicitaire** : ✅ pour diffuser des annonces personnalisées dans l'EEE, au Royaume-Uni et en Suisse, Google exige une plateforme de consentement certifiée intégrée au TCF ([Google](https://support.google.com/admanager/answer/13554116)). L'outil « Confidentialité et messages » d'AdSense est certifié. Le site est déjà prêt : lien « Privacy & cookie settings » et politique de confidentialité générés automatiquement à l'activation.
- **Aujourd'hui** : le site ne dépose aucun cookie, donc aucun bandeau n'est nécessaire.
- **Mentions légales** (si vous résidez en France) : page générée ; voir le document dédié pour l'identité de l'éditeur.
- **Fiscalité** : les revenus AdSense se déclarent. ⚠️ Le statut adapté (BNC, micro-entreprise) dépend de votre situation : à vérifier sur impots.gouv.fr ou auprès de l'URSSAF.

---

## 4. Ce qui a été livré (v1)

- **61 fiches** (une page chacune), 8 catégories, 75 pages au total.
- Générateur fonctionnel : nombre de problèmes, titre personnalisé, format Letter ou A4, gros caractères, corrigé, nouvelles fiches illimitées, lien reproductible, copie du lien, impression / PDF.
- Recherche instantanée sur la page d'accueil.
- SEO : titres et descriptions uniques, URL canoniques, fil d'Ariane, données structurées, maillage interne (fiches liées), sitemap avec dates de modification réelles, robots.txt, 404.
- Performance : environ 15 Ko compressés par page (HTML + CSS + JS), aucune police ni image externe ; la fiche est pré-calculée dans le HTML, donc visible même sans JavaScript.
- Accessibilité : contrôle axe-core sans erreur en mode clair et sombre ; navigation au clavier ; messages d'état annoncés aux lecteurs d'écran.
- Tests : 1 344 000 problèmes vérifiés (réponses recalculées indépendamment, règles comme « toujours une retenue » ou « jamais de résultat négatif ») ; contrôle des liens et des balises à chaque build.
- Automatisation : GitHub Actions (tests à chaque modification, contrôle hebdomadaire du site en ligne avec alerte e-mail) ; Cloudflare reconstruit et republie à chaque push.

### Point d’attention : public « enfants »

Les fiches sont destinées aux adultes qui les impriment ; le site ne doit pas être présenté comme un site pour enfants (pas de jeux à jouer en ligne par des enfants). ⚠️ Si Google le considérait comme destiné aux enfants (COPPA), seules des annonces non personnalisées seraient servies, avec un RPM plus faible. C'est intégré au scénario pessimiste.

---

## 5. Plan de développement sur six semaines

| Semaine | Objectif | Tâches | Temps estimé ⚠️ |
|---|---|---|---|
| 1 | Mise en ligne | Créer le dépôt GitHub, publier sur Cloudflare Pages, renseigner `SITE_URL` et `CONTACT_EMAIL`, Google Search Console + sitemap, Bing Webmaster Tools. Décider du nom de domaine. | 4-6 h |
| 2 | Qualité des pages | Relire chaque page ; ajouter un exemple résolu par fiche ; image de partage (Open Graph) ; Cloudflare Web Analytics (gratuit, sans cookie). | 6-8 h |
| 3 | Nouvelles fiches (+15) | Lecture de l'heure (horloges SVG), monnaie, mesures, tables à trous, multiplication par 10/100, divisions décimales, équations à une étape. | 8-10 h |
| 4 | Diffusion | Comptes Pinterest (très utilisé pour les fiches imprimables ⚠️) avec une épingle par fiche ; présentation sur des annuaires de ressources pédagogiques ; participation utile (non promotionnelle) aux communautés d'enseignants et d'école à la maison. | 5-8 h |
| 5 | Guides pédagogiques | 5 guides de fond (« How to teach long division », « Times tables: in what order? »), chacun avec le générateur intégré. Écrits ou relus par vous, pas générés en masse. | 8-10 h |
| 6 | Bilan et module puzzles | Analyse Search Console (requêtes, pages vues, erreurs) ; ajout du module mots mêlés / sudoku ; liste de contrôle « prêt pour AdSense ». | 6-8 h |

---

## 6. Stratégie SEO des six premiers mois

**Principe :** une page = une compétence précise = une intention de recherche. Pas de pages créées seulement pour les mots-clés.

- **Mois 1** : indexation. Sitemap soumis à Search Console et Bing ; vérifier que les 75 pages sont indexées (rapport « Pages ») ; corriger tout ce qui est « Explorée, actuellement non indexée » en enrichissant la page concernée.
- **Mois 2** : longue traîne. +15 à 20 fiches dans les compétences encore absentes ; un exemple résolu et une erreur fréquente par page ; maillage entre niveaux (fiche facile → fiche suivante).
- **Mois 3** : premiers signaux. Pinterest (une épingle verticale par fiche, description utile) ; demander des liens aux blogs d'école à la maison en proposant un générateur réellement utile ; module puzzles.
- **Mois 4** : contenu de fond. 5 à 8 guides pédagogiques ; pages « par niveau » (Grade 3 math worksheets) qui regroupent les fiches existantes.
- **Mois 5** : optimisation sur données réelles. Dans Search Console, repérer les pages en position 8 à 20 et améliorer leur titre, leur introduction et leurs liens internes ; supprimer ou fusionner les pages sans impression.
- **Mois 6** : saisonnalité. Préparer la rentrée et les révisions (pages « summer review », « back to school ») ; décider de la suite selon les chiffres.

Interdits volontaires : achat de liens, échanges de liens en masse, textes générés en masse, faux avis, bourrage de mots-clés, pages par ville ou variantes sans valeur.

---

## 7. Procédure AdSense (résumé ; pas à pas dans `ADSENSE-ET-LEGAL.md`)

1. **Ne pas demander trop tôt.** Attendre que le site ait un domaine à vous, une trentaine de pages ou plus réellement utiles (déjà le cas), des pages À propos / Contact / Confidentialité complètes, et un trafic organique régulier visible dans Search Console ⚠️ (Google ne publie pas de seuil).
2. Créer le compte AdSense (18 ans minimum), ajouter le site.
3. Renseigner `ADSENSE_CLIENT` dans Cloudflare : le site ajoute la balise de validation et `ads.txt` **sans afficher de publicité**.
4. Demander l'examen. Attendre la réponse (souvent plusieurs jours à quelques semaines ⚠️).
5. Seulement après approbation : configurer le message de consentement (Confidentialité et messages), créer deux blocs d'annonces, renseigner `ADSENSE_SLOT_TOP`, `ADSENSE_SLOT_BOTTOM`, puis `ADS_ENABLED=true`.
6. En cas de refus : lire le motif, corriger, redemander.

Règles respectées par le site : annonces jamais collées aux boutons d'impression, aucune incitation au clic, mention « Advertisement », aucune annonce dans la version imprimée, aucune fausse publicité avant approbation.

---

## 8. Maintenance réaliste

| Phase | Tâches | Temps ⚠️ |
|---|---|---|
| Lancement (semaines 1 à 6) | Plan ci-dessus | 6 à 10 h/semaine |
| Croissance (mois 2 à 12) | Nouvelles fiches, guides, Pinterest, analyse Search Console | 2 à 4 h/semaine pour espérer le scénario intermédiaire |
| Régime de croisière | Lire l'e-mail du contrôle hebdomadaire, répondre aux messages, vérifier AdSense et Search Console une fois par mois | 1 à 3 h/mois |

Ce qui ne demande **aucune** intervention : hébergement, certificat HTTPS, génération du sitemap, calcul des fiches, tests à chaque modification, contrôle de disponibilité.

Ce qui peut demander une intervention : GitHub désactive les tâches planifiées après 60 jours sans commit sur un dépôt public (le contrôle hebdomadaire) ; changements de règles Google ; renouvellement annuel du domaine.

Franchement : un site laissé tel quel sans enrichissement pendant un an a peu de chances d'atteindre 300 €/mois ⚠️. L'automatisation supprime la maintenance technique, pas le travail de croissance.

---

## 9. Sources

- Pew Research Center, *Google users are less likely to click on links when an AI summary appears*, 22/07/2025 — https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/
- Google Search Central, *March 2024 core update and new spam policies* — https://developers.google.com/search/blog/2024/03/core-update-spam-policies
- Google AdSense, *Eligibility requirements* — https://support.google.com/adsense/answer/9724?hl=en
- Google AdSense, *Owning the site* — https://support.google.com/adsense/answer/91205?hl=en
- Google, *Consent management requirements (EEA, UK, Switzerland)* — https://support.google.com/admanager/answer/13554116
- Cloudflare Pages, *Limits* — https://developers.cloudflare.com/pages/platform/limits/
- GitHub Pages, *Limits* — https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- MonetizeMore, *How much ad revenue can a website make* — https://www.monetizemore.com/blog/how-much-should-my-website-be-earning/
- Dad's Worksheets, *About* — https://dadsworksheets.com/about/
- Similarweb, dadsworksheets.com — https://www.similarweb.com/website/dadsworksheets.com/competitors
- Témoignage sur les sous-domaines et AdSense — https://dev.to/morinaga/why-google-adsense-will-not-approve-a-vercelapp-site-110b
- AdExchanger, impact des mises à jour Google — https://www.adexchanger.com/marketers/google-searchs-core-updates-are-crushing-sites-and-reshaping-the-web
