# Multiplication World Championship : documentation

Rubrique ajoutée à MathSheetLab : un championnat mondial de calcul mental (tables de 2 à 12, 60 secondes, classement mensuel, palmarès permanent). Ce document explique l'architecture, la mise en service sur Cloudflare, l'anti-triche, les données et les points juridiques à vérifier.

## 1. Ce qui a été ajouté

| Élément | Où |
|---|---|
| Pages (anglais, français, japonais) : accueil du championnat, jouer, entraînement, classements, palmarès, règlement, profil | `/multiplication-championship/…`, `/fr/multiplication-championship/…`, `/ja/multiplication-championship/…` |
| Page d'administration (non indexée, non liée) | `/multiplication-championship/admin/` |
| API serveur (Cloudflare Pages Functions) | `functions/api/championship/[[path]].js` → `src/championship/api.mjs` |
| Règles du jeu (questions, barème, contrôles) | `src/championship/core.mjs` |
| Schéma de la base D1 + migrations | `src/championship/schema.mjs`, `migrations/0001_championship.sql` |
| Textes des 3 langues | `src/championship/i18n.js` |
| Pages statiques, script du navigateur, styles | `src/championship/pages.js`, `client.js`, `widget.js`, `championship.css` |
| Filtre de pseudos | `src/championship/blocklist.mjs` |
| Tests (règles, API, sécurité, mois, modération, charge) | `scripts/test-championship.mjs` (Node 22+) |

Sur le site existant : un lien « Championship » doré en tête du menu, une section « Can You Become the Next Multiplication World Champion? » sur l'accueil (avant la liste des fiches), un bandeau sur la catégorie Multiplication et sur ses 7 fiches (masqué à l'impression), une colonne « Championship » dans le pied de page, une section dans la politique de confidentialité, le sitemap (15 pages indexables de plus) et `robots.txt` (`/api/` et la page admin exclues).

Rien n'a été retiré : les 79 générateurs, l'impression (956 PDF vérifiés) et les URL existantes sont inchangés. Correction au passage : le menu du haut débordait déjà sur ordinateur depuis l'ajout de « Time, money & measurement » (le bouton « All worksheets » sortait de l'écran) ; il est maintenant compacté et passe en menu repliable sous 1 400 px de large.

## 2. Architecture

- **Pages** : statiques, générées par `node build.js` comme le reste du site (gratuites et illimitées sur Cloudflare Pages).
- **API** : une seule Pages Function sur `/api/championship/*`. Le fichier `dist/_routes.json` limite les Functions à `/api/*`, donc les pages du site ne consomment jamais le quota de requêtes.
- **Base de données** : Cloudflare D1 (SQLite). Le schéma est créé automatiquement à la première requête (aucune commande SQL à lancer). Les fichiers `migrations/` servent si vous préférez `wrangler d1 migrations apply`.
- **Sans base configurée**, le site fonctionne normalement : l'entraînement marche, et les pages du championnat affichent « The official championship opens very soon ».

### Quotas gratuits vérifiés (octobre 2026)

| Service | Offre gratuite | Consommation du championnat |
|---|---|---|
| Pages Functions (= Workers) | 100 000 requêtes/jour, remise à zéro à minuit UTC | ~12 requêtes par partie (début, ~10 lots de réponses, fin) + 3 ou 4 pour afficher les classements |
| D1 lectures | 5 millions de lignes/jour | classements mis en cache 30 s à 10 min |
| D1 écritures | 100 000 lignes/jour | ~18 lignes par partie (mesuré par le test de charge) |
| D1 stockage | 5 Go au total, 500 Mo par base | quelques centaines d'octets par joueur et par partie |
| D1 requêtes par appel | 50 | 35 au maximum mesurés (clôture de mois) |

Capacité estimée sur l'offre gratuite : **environ 5 000 parties officielles par jour**. Au-delà, D1 et les Functions renvoient des erreurs jusqu'à minuit UTC (le jeu affiche « très sollicité, réessayez ») ; l'offre Workers Paid (5 $/mois) lève ces limites. Sources : pages tarifs D1 et Pages Functions de Cloudflare.

## 3. Mise en service sur Cloudflare (à faire par vous, 10 minutes)

Je n'ai pas accès à votre compte Cloudflare, ces étapes sont donc pour vous. L'interface change souvent : si un libellé diffère, cherchez le mot-clé indiqué.

1. **Créer la base** : tableau de bord Cloudflare → **Storage & Databases** → **D1 SQL Database** → **Create**. Nom : `mathsheetlab-championship`. Emplacement : automatique. → **Create**.
2. **Relier la base au site** : **Workers & Pages** → **mathlabs** → **Settings** → **Bindings** → **Add** → **D1 database**. Nom de la variable : `DB` (exactement, en majuscules). Base : `mathsheetlab-championship`. Enregistrez pour **Production**.
   - Facultatif mais conseillé : créez une deuxième base `mathsheetlab-championship-preview` et reliez-la en `DB` pour l'environnement **Preview**, pour tester les branches sans toucher aux vrais classements.
3. **Mot de passe administrateur** : **Settings** → **Variables and Secrets** → **Add** → type **Secret**, nom `ADMIN_TOKEN`, valeur : un mot de passe long et aléatoire (au moins 24 caractères, généré par un gestionnaire de mots de passe). Ne le mettez nulle part ailleurs. Sans ce secret, la page admin est désactivée.
4. **Redéployer** : **Deployments** → dernier déploiement → **Retry deployment** (les liaisons ne s'appliquent qu'aux nouveaux déploiements).
5. **Vérifier** : ouvrez `https://mathlabs.pages.dev/api/championship/health` → doit afficher `{"ok":true,"schema":1,…}`. Puis jouez une partie, et ouvrez `/multiplication-championship/admin/` avec votre mot de passe.

## 4. Règles officielles (résumé technique)

- 60 s exactement, après 3 s de compte à rebours, mesurées par le serveur.
- Questions : toutes les multiplications de 2×2 à 12×12 (121 faits), en paquets mélangés : chaque fait sort une fois avant toute répétition, jamais deux fois de suite (ni a×b juste après b×a).
- 1 point par bonne réponse, 0 par mauvaise. Une mauvaise réponse garde la même question ; après 2 erreurs la réponse est affichée et doit être recopiée (0 point). Il est donc impossible de « sauter » une question difficile.
- Classement : meilleur score validé du mois. Départage : score, puis moins d'erreurs, puis antériorité (heure UTC).
- Mois en UTC. Clôture automatique quelques minutes après minuit UTC (le temps que les dernières parties se terminent) : or, argent, bronze inscrits au palmarès, classement figé. Les titres s'additionnent. Le classement « All-time » n'est jamais remis à zéro.
- Classement des pays : moyenne des 5 meilleurs joueurs du pays (places manquantes = 0). Un pays ne gagne donc pas seulement par le nombre de participants.

## 5. Anti-triche

Ce qui est en place :

- **Le navigateur n'envoie jamais de score.** Il envoie ses réponses (question, valeur, instant) ; le serveur recalcule tout.
- **Parties créées par le serveur** : identifiant aléatoire de 128 bits, ordre des questions tiré d'une graine aléatoire qui ne quitte jamais le serveur. Les questions arrivent 12 par 12, au fur et à mesure ; les réponses ne sont jamais envoyées.
- **Horloge du serveur** : début et fin fixés par le serveur ; une réponse ne peut pas être datée avant le moment où le serveur a pu la livrer ; rien n'est accepté après la fin + 10 s de tolérance (connexions lentes). Les réponses tapées après 60 s ne comptent pas.
- **Ordre et rejeu** : réponses obligatoirement dans l'ordre des questions ; lots numérotés (un lot renvoyé deux fois n'est compté qu'une fois, un lot sauté est refusé) ; une partie terminée ne peut plus changer ; une partie n'est accessible qu'à son joueur.
- **Performances impossibles** : deux réponses à moins de 120 ms d'intervalle ou plus de 110 points → partie rejetée. 70 points ou plus, ou une moyenne sous 650 ms par réponse, ou beaucoup de réponses sous 300 ms → score mis **en attente de vérification** (il n'apparaît qu'après validation dans l'admin). Les seuils sont dans `RULES` (`core.mjs`) et pourront être ajustés quand on connaîtra les vrais scores.
- **Limites d'abus** : 5 profils par réseau et par jour, 10 essais de code de récupération par heure, 40 parties par joueur et par heure, 10 signalements par jour, 10 essais de mot de passe admin par heure. Le réseau est identifié par une empreinte salée qui change chaque jour (jamais l'adresse IP elle-même).
- **Signalement et retrait** : lien « Report » dans les classements ; l'admin voit signalements, anomalies et scores en attente, peut valider, invalider (même dans un mois clôturé : le podium est recalculé), bannir ou renommer.
- **Journal minimal** : anomalies, signalements, actions admin, erreurs techniques (sans IP, sans réponses), gardés 6 mois.

Limites, honnêtement : aucun anti-triche web n'est infaillible. Un programme qui lit l'écran et répond à une vitesse humaine crédible (par exemple 60 réponses en 60 s) ne peut pas être distingué d'un très bon joueur ; c'est pour cela que les très hauts scores passent par la vérification humaine. Une même personne peut aussi créer plusieurs profils (limité par réseau). La tolérance de 10 s pour les connexions lentes laisse au plus ~10 s de marge théorique à un tricheur.

## 6. Comptes joueurs et vie privée

- **Profil** : un pseudo (3 à 16 caractères, filtré) et un pays choisi librement (ou « International »). Pas d'e-mail, pas de nom, pas d'âge, pas de localisation. Un pseudo amusant est proposé par défaut (« SwiftOtter42 »).
- **Connexion** : clé aléatoire de 256 bits dans un cookie `HttpOnly`, `Secure`, `SameSite=Strict` (le site n'en garde que l'empreinte SHA-256). Ce n'est pas un identifiant en `localStorage`. Les requêtes d'autres sites sont refusées (contrôle d'origine).
- **Récupération sans e-mail** : un code secret de 16 caractères (80 bits) est affiché une seule fois à la création, à noter (idéalement par un parent). Il permet de retrouver le profil sur un autre appareil ; on peut en générer un nouveau depuis « My profile ».
- **Ce qui est public** : pseudo, drapeau et nom du pays, scores, rangs, titres. Jamais l'IP, l'identifiant technique, la localisation.
- **Suppression** : bouton « Delete my profile ». Pseudo, code et appareils sont effacés ; les anciens résultats restent sous « Former player » pour ne pas modifier les rangs des autres.
- **Conservation** : parties 7 jours ; résultats ~13 mois (sauf meilleurs scores et médailles) ; journaux 6 mois ; empreintes réseau 2 jours ; profils inutilisés 2 ans → anonymisés automatiquement.
- **Mineurs** : pas de chat, pas de messages privés, pas de profil social, pas de photo ; pseudos filtrés (anglais, français, japonais, espagnol, allemand, italien, portugais) et modifiables par l'admin ; message « moins de 13 ans : demande à un parent ».

## 7. Points juridiques à faire vérifier (pas d'affirmation de conformité)

Je ne suis pas juriste ; voici les points à faire valider avant une promotion large auprès d'enfants :

- **RGPD (UE)** : base légale à choisir (exécution du service ou intérêt légitime, plutôt que consentement, car l'article 8 impose le consentement parental sous 13 à 16 ans selon les pays, 15 ans en France). Informations adaptées aux enfants (art. 12) : un résumé simple existe dans les pages. Le cookie de connexion est strictement nécessaire (pas de bandeau requis pour lui). Une analyse d'impact (AIPD) peut être demandée pour un service visant des enfants. Voir les 8 recommandations de la CNIL sur les mineurs.
- **COPPA (États-Unis)** : le championnat s'adresse aussi aux moins de 13 ans. Le cookie de connexion relève a priori de l'exception « support des opérations internes ». Un pseudo n'est une donnée personnelle que s'il permet de contacter l'enfant (aucun moyen ici), mais un enfant peut taper son vrai nom : le filtre, l'avertissement et la modération réduisent ce risque sans l'éliminer. Les modifications de la règle COPPA de 2025 (application au 22 avril 2026) exigent notamment une politique écrite de conservation : section 6 ci-dessus, à reprendre dans un document formel si besoin.
- **Royaume-Uni** (Children's Code) et **Japon** (APPI) : la conception (minimisation, pas de géolocalisation, réglages protecteurs par défaut) va dans le bon sens, à confirmer.
- **Mentions légales** : `CONTACT_EMAIL` est toujours vide ; une adresse de contact est nécessaire pour les demandes des parents (droit d'accès, suppression).

## 8. Publicité (AdSense : rien n'est activé)

- Emplacements prévus : accueil du championnat (haut et bas), classements, palmarès, règlement. **Aucun** emplacement sur les pages Jouer, Entraînement et Profil : jamais de publicité pendant une partie.
- Sur toutes les pages du championnat, si un jour `ADS_ENABLED=true`, le code demande automatiquement des annonces **non personnalisées** (`requestNonPersonalizedAds=1`).
- Avant activation, à vérifier : traitement « destiné aux enfants » (TFCD) dans AdSense pour les contenus qui visent les moins de 13 ans, règles Google pour les familles, et une plateforme de consentement certifiée par Google pour l'Europe et le Royaume-Uni. Aucune incitation au clic n'est présente.

## 9. Administration

`/multiplication-championship/admin/` (lien direct, non indexé, interdit dans `robots.txt`) : collez `ADMIN_TOKEN`. Il n'est gardé que dans l'onglet (sessionStorage) ; aucun identifiant n'est écrit dans le code du site. Vous y trouvez : joueurs, parties du mois et au total, top 20, statistiques par pays, scores à vérifier (Valider / Invalider), signalements et anomalies, recherche d'un joueur (bannir, débannir, réinitialiser le pseudo, invalider un score), mois et podiums (recalcul), erreurs techniques, historique des actions.

## 10. Tests et commandes

```bash
node scripts/test-championship.mjs   # 33 tests : règles, API, sécurité, mois, modération, conservation, charge (Node 22+)
node scripts/champ-migrations.mjs    # régénère migrations/ après une modification de schema.mjs
node scripts/make-champ-og.js        # (après un build) images de partage du championnat ; nécessite Playwright
npx wrangler pages dev dist --d1 DB --binding ADMIN_TOKEN=un-long-mot-de-passe-de-test   # essai local complet
```

Les tests de sécurité couvrent : score falsifié, rejeu, ordre des réponses, réponses « venues du futur », vitesse impossible, partie d'un autre joueur, cookie inventé, requêtes d'un autre site, corps trop gros, mot de passe admin (absent, faux, force brute), limites d'abus, absence d'IP stockée. Le test de charge joue 300 parties : ~7 ms de calcul par partie, 35 requêtes D1 au plus par appel (limite 50).

## 11. Idées pour la suite

- Ajuster les seuils de vérification avec les premiers vrais scores.
- Réglage d'un modérateur pour les pseudos (liste de mots enrichie au fil des signalements).
- Si le trafic dépasse ~5 000 parties/jour : passer à Workers Paid (5 $/mois) ou regrouper davantage les réponses par lot.
