# Procédure AdSense et obligations légales

Rien n'est automatique : Google peut refuser le site, et rien ne garantit un revenu. Ce document décrit ce que le site prévoit déjà et ce qui reste à faire de votre côté.

## A. Avant de demander AdSense

Conditions officielles (https://support.google.com/adsense/answer/9724) :
- avoir **18 ans ou plus** ;
- un contenu **original, de qualité, qui attire une audience** ;
- respecter le **règlement du programme AdSense** ;
- pouvoir **modifier le code HTML** du site (c'est le cas).

Liste de contrôle conseillée (non officielle) :
- [ ] Un **nom de domaine à vous** (voir DEPLOIEMENT.md, étape 6). Les sous-domaines gratuits comme `*.pages.dev` sont, d'après de nombreux témoignages, refusés en pratique.
- [ ] `CONTACT_EMAIL` renseigné (pages Contact et Mentions légales).
- [ ] Page À propos relue et personnalisée (fichier `build.js`, fonction `staticPages`).
- [ ] Pages indexées dans Search Console et **trafic organique régulier** visible depuis plusieurs semaines (Google ne publie pas de seuil).
- [ ] Aucune page vide, en construction ou avec des liens cassés (`node scripts/check-site.js`).

## B. Demande

1. Créez un compte sur https://adsense.google.com avec votre compte Google. Indiquez l'adresse du site et vos coordonnées de paiement (nom et adresse réels : Google envoie un code PIN par courrier au-delà d'un certain montant).
2. Récupérez votre identifiant éditeur `ca-pub-XXXXXXXXXXXXXXXX`.
3. Dans Cloudflare Pages > Settings > Environment variables : `ADSENSE_CLIENT = ca-pub-XXXXXXXXXXXXXXXX`. Relancez le déploiement.
   Le site ajoute alors la balise `<meta name="google-adsense-account">` et le fichier `/ads.txt`, **sans afficher aucune annonce**.
4. Dans AdSense, choisissez la méthode de validation **Balise meta** (ou **ads.txt**), puis **Demander un examen**.
5. Attendez la réponse par e-mail.

## C. Après approbation uniquement

1. AdSense > **Confidentialité et messages** : créez et publiez le message **Réglementations européennes** (RGPD/TCF, plateforme de consentement certifiée par Google). Exigence Google pour les annonces personnalisées dans l'EEE, au Royaume-Uni et en Suisse : https://support.google.com/admanager/answer/13554116. Vérifiez dans l'interface si des frais s'appliquent (je n'ai pas pu le confirmer dans la documentation).
2. AdSense > **Annonces > Par bloc d'annonces** : créez deux blocs « Display » responsives. Notez leurs identifiants (`data-ad-slot`).
3. Variables Cloudflare : `ADSENSE_SLOT_TOP`, `ADSENSE_SLOT_BOTTOM`, puis `ADS_ENABLED = true`. Relancez le déploiement.
4. Le site, automatiquement :
   - charge le script AdSense et affiche deux annonces, sous la fiche et en bas de page, marquées « Advertisement » ;
   - n'affiche jamais d'annonce à côté des boutons Imprimer / Nouvelles fiches, ni dans la version imprimée ;
   - met à jour la politique de confidentialité (section publicité et cookies) ;
   - ajoute le lien « Privacy & cookie settings » en pied de page (retrait du consentement).
5. N'activez pas en plus les « annonces automatiques » (Auto Ads) sans vérifier où elles s'affichent : trop d'annonces nuisent à l'expérience et au référencement.

À ne jamais faire (exclusion définitive possible) : cliquer sur vos propres annonces, demander aux visiteurs de cliquer, acheter du trafic de faible qualité, placer des annonces qui ressemblent à des boutons ou à des liens de téléchargement.

## D. Si la demande est refusée

- « Site pas encore prêt » / « contenu à faible valeur » : enrichissez les pages (exemples résolus, guides), attendez plus de trafic, redemandez après quelques semaines.
- « Site inaccessible » : vérifiez l'adresse, `ads.txt` et la balise meta.
- Alternatives sans seuil de trafic élevé, à étudier plus tard : Ezoic, Media.net. Les régies premium (Mediavine, Raptive) exigent un trafic élevé.

## E. Obligations légales

Ce qui suit est une information générale, pas un conseil juridique. Vérifiez votre situation personnelle.

**Cookies et consentement (RGPD / directive ePrivacy, CNIL en France)**
- Version actuelle : aucun cookie, aucune mesure d'audience, aucune publicité : pas de bandeau nécessaire.
- Avec AdSense : consentement préalable obligatoire pour les visiteurs européens, géré par le message de Google (section C).
- Si vous ajoutez une mesure d'audience : Cloudflare Web Analytics fonctionne sans cookie.

**Mentions légales (France, loi pour la confiance dans l'économie numérique, art. 6 III)**
- La page `/legal/` affiche l'hébergeur (Cloudflare) et le contact.
- Un particulier éditant à titre non professionnel peut, sous conditions, ne pas afficher son nom s'il a communiqué son identité à l'hébergeur. Dès lors que le site génère des revenus, il peut être considéré comme une activité professionnelle : dans ce cas, renseignez `PUBLISHER_NAME` (nom, ou dénomination et numéro SIREN si micro-entreprise). À vérifier sur service-public.fr.

**Fiscalité et statut**
- Les revenus AdSense sont imposables et doivent être déclarés. Selon le montant et la régularité, une déclaration en BNC ou une micro-entreprise peut être nécessaire. À vérifier sur impots.gouv.fr / urssaf.fr.
- AdSense vous demandera aussi des informations fiscales (formulaire W-8BEN pour les revenus provenant des États-Unis).

**Public enfant**
- Le site s'adresse aux adultes qui impriment les fiches (indiqué dans la politique de confidentialité). Ne le présentez pas comme un site pour enfants.
- Si Google ou la loi américaine COPPA le considèrent comme destiné aux enfants, seules des annonces non personnalisées seront diffusées.

**Droits sur le contenu**
- Le code et les textes sont les vôtres. Les fiches générées sont libres d'usage personnel et scolaire (conditions d'utilisation).
- N'ajoutez pas d'images ni de polices sans en vérifier la licence.
