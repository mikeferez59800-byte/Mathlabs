/*
 * Texts of the Multiplication World Championship in English (default), French and Japanese.
 * Written for each language, not translated word for word. Add a language by adding a block with
 * the same keys (scripts/test-championship-pages.js checks that every key exists in every language).
 * {placeholders} are filled in by the page or the browser script.
 */
'use strict';

const LANGS = ['en', 'fr', 'ja'];
const LANG_NAMES = { en: 'English', fr: 'Français', ja: '日本語' };

const en = {
  chrome: {
    skip: 'Skip to content', allWorksheets: 'All worksheets', menu: 'Menu', home: 'Home', championship: 'Championship',
    footWorksheets: 'Worksheets', footMore: 'More worksheets', footSite: 'Site', footChamp: 'Championship',
    about: 'About', contact: 'Contact', privacy: 'Privacy policy', terms: 'Terms of use', legal: 'Legal notice',
    tagline: 'Free printable math worksheets, generated in your browser. Answer keys included, no sign-up.',
    footNote: 'Worksheets are generated in your browser and may be printed and copied freely for personal, home-school and classroom use.',
    cats: {}
  },
  nav: { landing: 'Championship', play: 'Play', practice: 'Practice', leaderboard: 'Leaderboard', hall: 'Hall of Champions', rules: 'Rules', player: 'My profile' },
  name: 'Multiplication World Championship',
  slogan: 'Think Fast. Multiply Faster. Become World Champion.',
  meta: {
    landing: ['Multiplication World Championship – Free Times Tables Speed Test | MathSheetLab', 'Free times tables competition: answer as many multiplication questions as you can in 60 seconds, climb the world leaderboard and become monthly World Champion.'],
    play: ['Play the 60-Second Multiplication Challenge | MathSheetLab Championship', 'Play the official 60-second round of the Multiplication World Championship. Your best score of the month counts in the world leaderboard.'],
    practice: ['Multiplication Practice Game – Times Tables 1 to 12, Free | MathSheetLab', 'Free multiplication practice game: pick a times table from 1 to 12 or mix them all, play against the clock and see your mistakes and progress.'],
    leaderboard: ['Multiplication Leaderboard – World and Country Rankings | MathSheetLab', 'World multiplication leaderboard: this month’s ranking, all-time records, best players of each country and the country ranking.'],
    hall: ['Hall of Champions – Monthly Multiplication World Champions | MathSheetLab', 'Every monthly winner of the Multiplication World Championship, with silver and bronze medals, titles won and all-time world records.'],
    rules: ['Official Rules – Multiplication World Championship | MathSheetLab', 'Official rules of the Multiplication World Championship: 60 seconds, tables 2 to 12, scoring, tie-break, monthly titles, fair play and privacy.'],
    player: ['My Player Profile – Multiplication World Championship | MathSheetLab', 'Manage your championship profile: nickname, country, records, medals, recovery code and profile deletion.'],
    admin: ['Championship Administration | MathSheetLab', 'Private moderation page of the Multiplication World Championship. Access requires the administrator token.']
  },
  landing: {
    eyebrowPill: 'Free', eyebrow: 'Every month · Players worldwide',
    h1: 'Multiplication World Championship',
    lead: 'Sixty seconds. The times tables from 2 to 12. One world ranking. Play as often as you like: your best score of the month counts, and the month’s winner becomes World Champion.',
    join: 'Join the Championship', practice: 'Practice first',
    facts: ['100% free', 'No e-mail, no real name', 'Same rules for everyone'],
    liveTitle: 'Current championship', endsIn: 'Ends in', startsIn: 'Starts in', playersGames: 'Players: {p} · Games played: {g}',
    stepsKicker: 'How it works', stepsH: 'Three steps to the podium',
    steps: [
      ['Choose a nickname', 'Pick a fun nickname and the country you want to represent. No e-mail and no real name: we even suggest a nickname for you.'],
      ['Play 60 seconds', 'Multiplications from 2 × 2 to 12 × 12 appear one at a time. Type the answer and press Enter. Every correct answer is 1 point.'],
      ['Climb the ranking', 'Your best score of the month enters the world leaderboard. On the last day of the month, the leader becomes World Champion.']
    ],
    boardKicker: 'Live ranking', boardH: 'This month’s top 10', fullBoard: 'Full leaderboard',
    hallKicker: 'History', hallH: 'Champions are never forgotten',
    hallP: 'Every month’s gold, silver and bronze medallists stay in the Hall of Champions forever, together with the all-time world records.',
    hallLink: 'Visit the Hall of Champions',
    safeKicker: 'Made for children', safeH: 'Safe, fair and ad-free while you play',
    safe: [
      ['Nicknames only', 'Players are known only by a nickname and a flag. No real names, no photos, no e-mail addresses.'],
      ['No chat, no messages', 'There is no way to contact another player. Nicknames are filtered and moderated.'],
      ['Fair for everyone', 'Every game is checked on our server: the questions, the answers and the clock. Suspicious scores are reviewed.'],
      ['Nothing interrupts a game', 'No advertising during a game, ever. Practice mode needs no profile at all.']
    ],
    faqH: 'Questions and answers'
  },
  faq: [
    ['Is the championship free?', 'Yes. Playing, practising and appearing in the rankings are completely free. There is no subscription and nothing to buy.'],
    ['Do I need an account?', 'Practice mode needs nothing. To enter the official ranking you create a player profile with a nickname and a country only. Instead of an e-mail address you receive a secret recovery code to keep.'],
    ['Which score counts?', 'Your best official score of the month. You may play as many times as you like; a lower score never replaces a better one.'],
    ['What if two players have the same score?', 'The player with fewer errors ranks higher. If that is also equal, the score that was achieved first wins.'],
    ['When does a month end?', 'Each championship runs from the first to the last day of the month in Coordinated Universal Time (UTC). A few minutes after midnight UTC the ranking is frozen, the medals are awarded and the next championship starts automatically.'],
    ['How do you stop cheating?', 'The score is never sent by your browser: our server creates every game, picks the questions, checks each answer in order and keeps the time. Impossible speeds are rejected and very high scores are checked by a moderator. No online system is perfect, but these checks make fake scores much harder.'],
    ['Can I choose my country?', 'Yes, you choose freely the country or territory you want to represent, or “International” if you prefer not to say. We never use your location.']
  ],
  rules: {
    h1: 'Official rules',
    lead: 'The same rules apply to every player, in every country. They are designed so that only fast, accurate multiplication wins.',
    sections: [
      ['The round', ['An official round lasts exactly 60 seconds, measured by our server, after a 3-second countdown.', 'Questions are multiplications with both factors from 2 to 12, shown one at a time. You cannot choose easier tables in the official round.', 'Every question appears in a balanced order: all 121 facts come up once before any fact repeats.', 'Type your answer with the keyboard or the on-screen keypad and press Enter (or OK). The next question appears immediately.']],
      ['Scoring', ['1 point for each correct answer, 0 points for a wrong answer. There are no bonuses and nothing random.', 'A wrong answer costs time: the same question stays until you answer it. After two wrong tries the answer is shown and you must type it to continue, for 0 points. Skipping a hard question is therefore never an advantage.', 'Errors are counted and shown in your result.']],
      ['Monthly championship', ['Each month is a separate championship, from the first day 00:00 UTC to the last day 23:59:59 UTC.', 'You may play as often as you like. Only your best validated score of the month counts.', 'A few minutes after the month ends, the ranking is frozen: the winner becomes World Champion of the month, second place receives silver and third place bronze. The full ranking stays visible forever and can no longer be changed by players.', 'The next championship starts automatically.']],
      ['Ties', ['Higher score first; then fewer errors; then the score that was achieved first (UTC time).']],
      ['Fair play', ['Every official game is created, timed and checked by our server; the browser never sends a score.', 'Answers must arrive in order and on time. Games with impossible timings are rejected, and very high scores are checked by a moderator before they appear.', 'Using a program, a script or another person to answer is cheating. Moderators may remove suspicious scores and block nicknames.', 'If you think a score is not genuine, use the “Report” link in the leaderboard.', 'No anti-cheat system on the web is infallible. We will keep improving these checks.']],
      ['Rankings', ['Current month: the best score of each player this month.', 'All-time: the best score of each player since the championship began. It is never reset.', 'Countries: the best players of each country, and a country ranking based on the average of the country’s 5 best players (missing players count as 0), so a country cannot win only because it has more participants.', 'Hall of Champions: every monthly winner and medallist.']]
    ]
  },
  privacyBox: {
    h: 'Privacy, in short',
    items: ['Public: your nickname, the country you chose, your scores and titles.', 'Never shown: e-mail (we do not ask for one), real name, IP address, precise location or any technical identifier.', 'A single cookie keeps you signed in on this device. There is no advertising cookie in the championship.', 'You can delete your profile at any time from “My profile”.'],
    link: 'Read the full privacy policy'
  },
  hall: {
    h1: 'Hall of Champions',
    lead: 'Every monthly World Champion of multiplication, with silver and bronze medallists. Titles are kept forever.',
    latest: 'Reigning champion', gallery: 'All champions', records: 'All-Time World Records', recordsP: 'The best score of each player since the championship began. This ranking is never reset.',
    empty: 'No championship has been completed yet. The first World Champion will be crowned at the end of {month}. It could be you!',
    titlesWon: '{n} titles', titleWon: '1 title'
  },
  board: {
    h1: 'Multiplication leaderboard',
    lead: 'Live world rankings of the Multiplication World Championship. Rankings refresh about every 30 seconds.',
    tabs: { month: 'Current month', alltime: 'All-time', countries: 'Countries', champions: 'Champions' },
    month: 'Month', country: 'Country', allCountries: 'All countries',
    rank: 'Rank', player: 'Player', score: 'Score', errors: 'Errors', team: 'Team score', best: 'Best', playersCol: 'Players', titles: 'Titles',
    you: 'You', yourRank: 'Your position', notRanked: 'You are not ranked yet this month.', playNow: 'Play now',
    empty: 'Nobody has played in this ranking yet. Be the first!',
    former: 'Former player', report: 'Report', reportAsk: 'Report the score of {name} to the moderators? Please only report scores you really think are not genuine.', reported: 'Thank you. A moderator will check it.',
    prev: 'Previous', next: 'Next', page: 'Page {page} of {pages}',
    teamNote: 'Team score = average of the country’s 5 best players (missing players count as 0).',
    champTitle: 'Champion of {month}', medal1: 'Gold', medal2: 'Silver', medal3: 'Bronze', loading: 'Loading the ranking…', offline: 'The ranking cannot be loaded right now. Please try again later.'
  },
  play: {
    h1: 'World Championship — 60 seconds',
    lead: 'Official round: multiplications from 2 to 12, one at a time, for exactly 60 seconds. Your best score of the month counts in the world leaderboard.',
    soon: 'The official championship opens very soon. In the meantime, warm up in practice mode!',
    opensOn: 'The first official championship starts on {date} (UTC). Until then, warm up in practice mode!',
    signupH: 'Create your player profile', signupP: 'Choose a nickname and the country you want to represent. That is all we need.',
    nickname: 'Nickname', nickHelp: '3 to 16 letters or digits. Do not use your real name.', suggest: 'Suggest another', country: 'Country', countryHelp: 'The flag shown next to your nickname. Choose freely.',
    under13: 'Under 13? Please ask a parent or teacher before creating a profile.',
    agree: 'I have read the {rules} and the {privacy}.', rulesLink: 'rules', privacyLink: 'privacy policy',
    create: 'Create my profile', haveCode: 'I already have a recovery code',
    codeH: 'Your secret recovery code', codeP: 'Write this code down and keep it safe (for example with a parent). It is the only way to get your profile back on another device. We cannot show it again.',
    copy: 'Copy', copied: 'Copied', codeDone: 'I have saved my code',
    restoreH: 'Restore my profile', restoreP: 'Type the recovery code you received when you created your profile.', restore: 'Restore', code: 'Recovery code', cancel: 'Cancel',
    ready: 'Ready, {name}?', bestMonth: 'Best this month', rankMonth: 'Rank this month', allTime: 'All-time best', none: '—',
    start: 'Start — 60 seconds', startHint: 'The clock starts after 3 · 2 · 1. Type the answer, then press Enter.',
    banned: 'This profile can no longer take part in the official championship.',
    timeLeft: 'Time left', points: 'Points', errorsLabel: 'Errors', ok: 'OK', erase: 'Erase', answerLabel: 'Your answer',
    wrong: 'Not quite — try again', reveal: 'The answer is {answer}. Type it to continue.', correct: 'Correct!',
    waiting: 'Connecting…', connection: 'Connection problem. Retrying…',
    resultH: 'Time’s up!', resultScore: '{n} points', resultErrors: '{n} errors', resultError: '1 error',
    valid: 'Your score is in the world leaderboard.', newBest: 'New personal best for this month!', notBest: 'Your best score this month stays {best}.',
    review: 'Impressive! Very high scores are checked by a moderator before they appear in the ranking.',
    invalid: 'This game could not be validated (impossible timing or connection problem), so it does not count.',
    rankNow: 'You are #{rank} in {month}.', again: 'Play again', seeBoard: 'See the leaderboard',
    share: 'Share my score', shareText: 'I scored {n} points in the MathSheetLab World Championship. Can you beat me?', shareDone: 'Image downloaded and text copied: paste it wherever you like.',
    errors: { nick_taken: 'This nickname is already taken. Try another one.', nick_offensive: 'This nickname is not allowed. Please choose a friendly one.', nick_reserved: 'This nickname is reserved. Please choose another one.', nick_length: 'Use 3 to 16 characters.', nick_chars: 'Use only letters, digits, - and _ (no spaces).', nick_digits: 'Too many digits: do not use dates, phone numbers or codes.', nick_mixed: 'Please use a single alphabet in your nickname.', bad_country: 'Please choose a country.', bad_code: 'This recovery code is not valid.', rate_limited: 'Too many attempts. Please wait a little and try again.', profile_cooldown: 'You can change your profile again in a few days.', busy: 'The championship is very busy right now. Please try again in a few minutes.', not_open: 'The official championship has not started yet.', generic: 'Something went wrong. Please try again.' }
  },
  practice: {
    h1: 'Multiplication practice',
    lead: 'Train on one times table or all of them, against the clock. Practice is free, needs no profile and never counts in the official ranking.',
    pick: 'Choose a table', mixed: 'All tables (2–12)', table: '× {n}', mode: 'Mode', mode60: '60 seconds', mode20: '20 questions',
    start: 'Start practising', note: 'Practice results stay on this device and never appear in the official ranking.',
    resultH: 'Practice finished', correct: 'Correct answers', mistakes: 'Your mistakes', noMistakes: 'No mistakes. Excellent!',
    progress: 'Your progress on this device', best: 'Best', last: 'Last', tries: 'Games', table1: 'Table of 1', again: 'Practise again', goOfficial: 'Ready? Join the official championship',
    timeLeft: 'Time left', questionsLeft: 'Questions left'
  },
  player: {
    h1: 'My player profile', lead: 'Your public nickname and country, your records and medals, and your privacy settings.',
    notSigned: 'You do not have a profile on this device yet.', create: 'Create a profile', restore: 'Restore with a recovery code',
    public: 'Public profile', records: 'Records', medals: 'Medals', noMedals: 'No medals yet. Next month could be yours!', recent: 'Recent official games',
    edit: 'Change nickname or country', save: 'Save', saved: 'Saved.', cooldown: 'Nickname and country can be changed once every 7 days.',
    codeH: 'Recovery code', codeP: 'Lost your code? Create a new one. The old code will stop working.', newCode: 'Create a new recovery code',
    signOut: 'Sign out on this device', signOutP: 'You will need your recovery code to come back.',
    deleteH: 'Delete my profile', deleteP: 'Your nickname, recovery code and devices are deleted. Your past results stay in rankings as “Former player” so that other players’ ranks do not change.', deleteBtn: 'Delete my profile', deleteAsk: 'Delete your profile for good? This cannot be undone.', deleted: 'Your profile has been deleted.',
    statusValid: 'counted', statusReview: 'under review', statusInvalid: 'not counted', statusEmpty: 'no answers'
  },
  home: {
    kicker: 'Multiplication World Championship', h: 'Can You Become the Next Multiplication World Champion?',
    p: 'Sixty seconds, the times tables from 2 to 12 and players from around the world. A new champion is crowned every month, and it is free.',
    join: 'Join the Championship', board: 'See the leaderboard', current: 'Current championship'
  },
  multBanner: { h: 'Test your times tables against the world', p: 'Sixty seconds, tables 2 to 12, a world ranking and a new champion every month. Free, with a practice mode.', cta: 'Join the Multiplication World Championship' },
  common: { flagIntl: 'International', podiumEmpty: 'Your name here?', medals: ['Gold', 'Silver', 'Bronze'], place: ['1st', '2nd', '3rd'], monthChampionship: '{month} Championship', days: 'd', hours: 'h', minutes: 'min', seconds: 's', open: 'open' }
};

const fr = {
  chrome: {
    skip: 'Aller au contenu', allWorksheets: 'Toutes les fiches', menu: 'Menu', home: 'Accueil', championship: 'Championnat',
    footWorksheets: 'Fiches', footMore: 'Autres fiches', footSite: 'Site', footChamp: 'Championnat',
    about: 'À propos', contact: 'Contact', privacy: 'Confidentialité', terms: 'Conditions d’utilisation', legal: 'Mentions légales',
    tagline: 'Fiches de maths gratuites à imprimer, générées dans votre navigateur. Corrigés inclus, sans inscription.',
    footNote: 'Les fiches sont générées dans votre navigateur et peuvent être imprimées et photocopiées librement pour un usage personnel, familial ou en classe (site en anglais).',
    cats: { addition: 'Addition', subtraction: 'Soustraction', multiplication: 'Multiplication', division: 'Division', fractions: 'Fractions', decimals: 'Décimaux', 'number-sense': 'Nombres', 'pre-algebra': 'Pré-algèbre', measurement: 'Heure, monnaie et mesures' }
  },
  nav: { landing: 'Championnat', play: 'Jouer', practice: 'Entraînement', leaderboard: 'Classements', hall: 'Palmarès', rules: 'Règlement', player: 'Mon profil' },
  name: 'Championnat du monde de multiplication',
  slogan: 'Pense vite. Multiplie plus vite. Deviens champion du monde.',
  meta: {
    landing: ['Championnat du monde de multiplication – Tables de multiplication en 60 s | MathSheetLab', 'Concours gratuit de tables de multiplication : un maximum de bonnes réponses en 60 secondes, un classement mondial et un nouveau champion du monde chaque mois.'],
    play: ['Jouer au défi de multiplication en 60 secondes | Championnat MathSheetLab', 'Joue la manche officielle de 60 secondes du Championnat du monde de multiplication. Ton meilleur score du mois compte au classement mondial.'],
    practice: ['Jeu d’entraînement aux tables de multiplication de 1 à 12, gratuit | MathSheetLab', 'Entraîne-toi gratuitement sur une table de multiplication de 1 à 12 ou sur toutes à la fois, contre la montre, et vois tes erreurs et tes progrès.'],
    leaderboard: ['Classement de multiplication – Monde et pays | MathSheetLab', 'Classement mondial du championnat de multiplication : classement du mois, records de tous les temps, meilleurs joueurs par pays et classement des pays.'],
    hall: ['Palmarès – Les champions du monde de multiplication | MathSheetLab', 'Tous les champions du monde mensuels de multiplication, avec les médailles d’argent et de bronze, les titres remportés et les records du monde.'],
    rules: ['Règlement officiel – Championnat du monde de multiplication | MathSheetLab', 'Règlement officiel du Championnat du monde de multiplication : 60 secondes, tables de 2 à 12, barème, départage, titres mensuels, fair-play et confidentialité.'],
    player: ['Mon profil joueur – Championnat du monde de multiplication | MathSheetLab', 'Gère ton profil du championnat : pseudo, pays, records, médailles, code de récupération et suppression du profil.']
  },
  landing: {
    eyebrowPill: 'Gratuit', eyebrow: 'Chaque mois · Des joueurs du monde entier',
    h1: 'Championnat du monde de multiplication',
    lead: 'Soixante secondes. Les tables de 2 à 12. Un seul classement mondial. Joue autant de fois que tu veux : ton meilleur score du mois compte, et le premier du mois devient champion du monde.',
    join: 'Rejoindre le championnat', practice: 'S’entraîner d’abord',
    facts: ['100 % gratuit', 'Ni e-mail, ni vrai nom', 'Mêmes règles pour tous'],
    liveTitle: 'Championnat en cours', endsIn: 'Fin dans', startsIn: 'Début dans', playersGames: 'Joueurs\u00a0: {p} · Parties jouées\u00a0: {g}',
    stepsKicker: 'Comment ça marche', stepsH: 'Trois étapes jusqu’au podium',
    steps: [
      ['Choisis un pseudo', 'Choisis un pseudo amusant et le pays que tu veux représenter. Pas d’e-mail ni de vrai nom : on te propose même un pseudo.'],
      ['Joue 60 secondes', 'Les multiplications de 2 × 2 à 12 × 12 arrivent une par une. Tape la réponse et appuie sur Entrée. Chaque bonne réponse rapporte 1 point.'],
      ['Grimpe au classement', 'Ton meilleur score du mois entre au classement mondial. Le dernier jour du mois, le premier devient champion du monde.']
    ],
    boardKicker: 'Classement en direct', boardH: 'Le top 10 du mois', fullBoard: 'Classement complet',
    hallKicker: 'Histoire', hallH: 'Les champions ne sont jamais oubliés',
    hallP: 'Les médaillés d’or, d’argent et de bronze de chaque mois restent pour toujours dans le palmarès, avec les records du monde de tous les temps.',
    hallLink: 'Voir le palmarès',
    safeKicker: 'Pensé pour les enfants', safeH: 'Sûr, équitable et sans publicité pendant le jeu',
    safe: [
      ['Pseudos uniquement', 'Les joueurs ne sont connus que par un pseudo et un drapeau. Ni vrai nom, ni photo, ni adresse e-mail.'],
      ['Ni chat, ni messages', 'Il est impossible de contacter un autre joueur. Les pseudos sont filtrés et modérés.'],
      ['Équitable pour tous', 'Chaque partie est vérifiée sur notre serveur : les questions, les réponses et le chronomètre. Les scores suspects sont examinés.'],
      ['Rien n’interrompt une partie', 'Jamais de publicité pendant une partie. Le mode entraînement ne demande aucun profil.']
    ],
    faqH: 'Questions et réponses'
  },
  faq: [
    ['Le championnat est-il gratuit ?', 'Oui. Jouer, s’entraîner et apparaître au classement est entièrement gratuit. Aucun abonnement, rien à acheter.'],
    ['Faut-il un compte ?', 'Le mode entraînement ne demande rien. Pour entrer au classement officiel, tu crées un profil avec seulement un pseudo et un pays. À la place d’une adresse e-mail, tu reçois un code de récupération secret à conserver.'],
    ['Quel score compte ?', 'Ton meilleur score officiel du mois. Tu peux jouer autant de fois que tu veux : un score moins bon ne remplace jamais un meilleur.'],
    ['Et si deux joueurs ont le même score ?', 'Celui qui a fait le moins d’erreurs passe devant. En cas d’égalité parfaite, le score obtenu en premier l’emporte.'],
    ['Quand un mois se termine-t-il ?', 'Chaque championnat va du premier au dernier jour du mois en temps universel (UTC). Quelques minutes après minuit UTC, le classement est figé, les médailles sont attribuées et le championnat suivant commence automatiquement.'],
    ['Comment empêchez-vous la triche ?', 'Le score n’est jamais envoyé par ton navigateur : notre serveur crée chaque partie, choisit les questions, vérifie chaque réponse dans l’ordre et tient le chronomètre. Les vitesses impossibles sont refusées et les scores très élevés sont vérifiés par un modérateur. Aucun système en ligne n’est parfait, mais ces contrôles rendent les faux scores bien plus difficiles.'],
    ['Puis-je choisir mon pays ?', 'Oui, tu choisis librement le pays ou territoire que tu veux représenter, ou « International » si tu préfères ne pas le dire. Nous n’utilisons jamais ta localisation.']
  ],
  rules: {
    h1: 'Règlement officiel',
    lead: 'Les mêmes règles s’appliquent à tous les joueurs, dans tous les pays. Elles sont conçues pour que seuls la rapidité et l’exactitude gagnent.',
    sections: [
      ['La manche', ['Une manche officielle dure exactement 60 secondes, mesurées par notre serveur, après un compte à rebours de 3 secondes.', 'Les questions sont des multiplications dont les deux facteurs vont de 2 à 12, affichées une par une. Impossible de choisir des tables plus faciles en manche officielle.', 'Les questions arrivent dans un ordre équilibré : les 121 multiplications sortent une fois avant qu’une seule ne revienne.', 'Tape ta réponse au clavier ou sur le pavé numérique de l’écran, puis appuie sur Entrée (ou OK). La question suivante s’affiche aussitôt.']],
      ['Barème', ['1 point par bonne réponse, 0 point par mauvaise réponse. Aucun bonus, aucun hasard.', 'Une mauvaise réponse coûte du temps : la même question reste affichée jusqu’à ce que tu y répondes. Après deux essais faux, la réponse s’affiche et tu dois la recopier pour continuer, sans point. Sauter une question difficile n’est donc jamais avantageux.', 'Les erreurs sont comptées et affichées dans ton résultat.']],
      ['Championnat mensuel', ['Chaque mois est un championnat à part, du premier jour à 00:00 UTC au dernier jour à 23:59:59 UTC.', 'Tu peux jouer aussi souvent que tu veux. Seul ton meilleur score validé du mois compte.', 'Quelques minutes après la fin du mois, le classement est figé : le premier devient champion du monde du mois, le deuxième reçoit la médaille d’argent et le troisième la médaille de bronze. Le classement complet reste consultable pour toujours et ne peut plus être modifié par les joueurs.', 'Le championnat suivant commence automatiquement.']],
      ['Égalités', ['Le score le plus haut d’abord ; puis le moins d’erreurs ; puis le score obtenu en premier (heure UTC).']],
      ['Fair-play', ['Chaque partie officielle est créée, chronométrée et vérifiée par notre serveur ; le navigateur n’envoie jamais de score.', 'Les réponses doivent arriver dans l’ordre et dans les temps. Les parties aux temps impossibles sont refusées, et les scores très élevés sont vérifiés par un modérateur avant d’apparaître.', 'Répondre avec un programme, un script ou l’aide d’une autre personne, c’est tricher. Les modérateurs peuvent retirer les scores suspects et bloquer des pseudos.', 'Si un score te semble faux, utilise le lien « Signaler » du classement.', 'Aucun système anti-triche sur le web n’est infaillible. Nous continuerons d’améliorer ces contrôles.']],
      ['Classements', ['Mois en cours : le meilleur score de chaque joueur ce mois-ci.', 'Tous les temps : le meilleur score de chaque joueur depuis le début du championnat. Il n’est jamais remis à zéro.', 'Pays : les meilleurs joueurs de chaque pays, et un classement des pays fondé sur la moyenne de ses 5 meilleurs joueurs (les places manquantes comptent 0), pour qu’un pays ne gagne pas seulement parce qu’il a plus de participants.', 'Palmarès : tous les champions et médaillés de chaque mois.']]
    ]
  },
  privacyBox: {
    h: 'Confidentialité, en bref',
    items: ['Public : ton pseudo, le pays que tu as choisi, tes scores et tes titres.', 'Jamais affiché : e-mail (nous n’en demandons pas), vrai nom, adresse IP, localisation précise ou identifiant technique.', 'Un seul cookie te garde connecté sur cet appareil. Aucun cookie publicitaire dans le championnat.', 'Tu peux supprimer ton profil à tout moment depuis « Mon profil ».'],
    link: 'Lire la politique de confidentialité complète (en anglais)'
  },
  hall: {
    h1: 'Palmarès', lead: 'Tous les champions du monde mensuels de multiplication, avec les médaillés d’argent et de bronze. Les titres sont conservés pour toujours.',
    latest: 'Champion en titre', gallery: 'Tous les champions', records: 'Records du monde de tous les temps', recordsP: 'Le meilleur score de chaque joueur depuis le début du championnat. Ce classement n’est jamais remis à zéro.',
    empty: 'Aucun championnat n’est encore terminé. Le premier champion du monde sera couronné à la fin de {month}. Pourquoi pas toi ?',
    titlesWon: '{n} titres', titleWon: '1 titre'
  },
  board: {
    h1: 'Classements de multiplication', lead: 'Les classements mondiaux du championnat, en direct. Ils se mettent à jour environ toutes les 30 secondes.',
    tabs: { month: 'Mois en cours', alltime: 'Tous les temps', countries: 'Pays', champions: 'Champions' },
    month: 'Mois', country: 'Pays', allCountries: 'Tous les pays',
    rank: 'Rang', player: 'Joueur', score: 'Score', errors: 'Erreurs', team: 'Score d’équipe', best: 'Meilleur', playersCol: 'Joueurs', titles: 'Titres',
    you: 'Toi', yourRank: 'Ta position', notRanked: 'Tu n’es pas encore classé ce mois-ci.', playNow: 'Jouer maintenant',
    empty: 'Personne n’a encore joué dans ce classement. Sois le premier !',
    former: 'Ancien joueur', report: 'Signaler', reportAsk: 'Signaler le score de {name} aux modérateurs ? Ne signale que les scores qui te semblent vraiment faux.', reported: 'Merci. Un modérateur va vérifier.',
    prev: 'Précédent', next: 'Suivant', page: 'Page {page} sur {pages}',
    teamNote: 'Score d’équipe = moyenne des 5 meilleurs joueurs du pays (les places manquantes comptent 0).',
    champTitle: 'Champion de {month}', medal1: 'Or', medal2: 'Argent', medal3: 'Bronze', loading: 'Chargement du classement…', offline: 'Le classement ne peut pas être chargé pour le moment. Réessaie plus tard.'
  },
  play: {
    h1: 'Championnat du monde — 60 secondes',
    lead: 'Manche officielle : multiplications de 2 à 12, une par une, pendant exactement 60 secondes. Ton meilleur score du mois compte au classement mondial.',
    soon: 'Le championnat officiel ouvre très bientôt. En attendant, échauffe-toi en mode entraînement !',
    opensOn: 'Le premier championnat officiel commence le {date} (heure UTC). D’ici là, échauffe-toi en mode entraînement !',
    signupH: 'Crée ton profil joueur', signupP: 'Choisis un pseudo et le pays que tu veux représenter. C’est tout ce qu’il nous faut.',
    nickname: 'Pseudo', nickHelp: '3 à 16 lettres ou chiffres. N’utilise pas ton vrai nom.', suggest: 'Autre idée', country: 'Pays', countryHelp: 'Le drapeau affiché à côté de ton pseudo. Choisis librement.',
    under13: 'Tu as moins de 13 ans ? Demande à un parent ou à ton enseignant avant de créer un profil.',
    agree: 'J’ai lu le {rules} et la {privacy}.', rulesLink: 'règlement', privacyLink: 'politique de confidentialité',
    create: 'Créer mon profil', haveCode: 'J’ai déjà un code de récupération',
    codeH: 'Ton code de récupération secret', codeP: 'Note ce code et garde-le précieusement (par exemple avec un parent). C’est le seul moyen de retrouver ton profil sur un autre appareil. Nous ne pourrons plus te l’afficher.',
    copy: 'Copier', copied: 'Copié', codeDone: 'J’ai noté mon code',
    restoreH: 'Retrouver mon profil', restoreP: 'Tape le code de récupération reçu à la création de ton profil.', restore: 'Retrouver', code: 'Code de récupération', cancel: 'Annuler',
    ready: 'Prêt, {name} ?', bestMonth: 'Meilleur score du mois', rankMonth: 'Rang du mois', allTime: 'Record personnel', none: '—',
    start: 'Commencer — 60 secondes', startHint: 'Le chrono démarre après 3 · 2 · 1. Tape la réponse puis appuie sur Entrée.',
    banned: 'Ce profil ne peut plus participer au championnat officiel.',
    timeLeft: 'Temps restant', points: 'Points', errorsLabel: 'Erreurs', ok: 'OK', erase: 'Effacer', answerLabel: 'Ta réponse',
    wrong: 'Pas tout à fait — réessaie', reveal: 'La réponse est {answer}. Recopie-la pour continuer.', correct: 'Bravo !',
    waiting: 'Connexion…', connection: 'Problème de connexion. Nouvelle tentative…',
    resultH: 'Temps écoulé !', resultScore: '{n} points', resultErrors: '{n} erreurs', resultError: '1 erreur',
    valid: 'Ton score est au classement mondial.', newBest: 'Nouveau record personnel du mois !', notBest: 'Ton meilleur score du mois reste {best}.',
    review: 'Impressionnant ! Les scores très élevés sont vérifiés par un modérateur avant d’apparaître au classement.',
    invalid: 'Cette partie n’a pas pu être validée (temps impossibles ou problème de connexion) : elle ne compte pas.',
    rankNow: 'Tu es n° {rank} en {month}.', again: 'Rejouer', seeBoard: 'Voir le classement',
    share: 'Partager mon score', shareText: 'J’ai marqué {n} points au Championnat du monde MathSheetLab. Sauras-tu me battre ?', shareDone: 'Image téléchargée et texte copié : colle-le où tu veux.',
    errors: { nick_taken: 'Ce pseudo est déjà pris. Essaie-en un autre.', nick_offensive: 'Ce pseudo n’est pas autorisé. Choisis-en un sympathique.', nick_reserved: 'Ce pseudo est réservé. Choisis-en un autre.', nick_length: 'Utilise de 3 à 16 caractères.', nick_chars: 'Seulement des lettres, des chiffres, - et _ (pas d’espace).', nick_digits: 'Trop de chiffres : pas de dates, de numéros de téléphone ni de codes.', nick_mixed: 'Utilise un seul alphabet dans ton pseudo.', bad_country: 'Choisis un pays.', bad_code: 'Ce code de récupération n’est pas valide.', rate_limited: 'Trop de tentatives. Patiente un peu puis réessaie.', profile_cooldown: 'Tu pourras modifier ton profil dans quelques jours.', busy: 'Le championnat est très sollicité en ce moment. Réessaie dans quelques minutes.', not_open: 'Le championnat officiel n’a pas encore commencé.', generic: 'Une erreur est survenue. Réessaie.' }
  },
  practice: {
    h1: 'Entraînement aux tables de multiplication',
    lead: 'Entraîne-toi sur une table ou sur toutes, contre la montre. L’entraînement est gratuit, sans profil, et ne compte jamais au classement officiel.',
    pick: 'Choisis une table', mixed: 'Toutes les tables (2 à 12)', table: '× {n}', mode: 'Mode', mode60: '60 secondes', mode20: '20 questions',
    start: 'Commencer l’entraînement', note: 'Les résultats d’entraînement restent sur cet appareil et n’apparaissent jamais au classement officiel.',
    resultH: 'Entraînement terminé', correct: 'Bonnes réponses', mistakes: 'Tes erreurs', noMistakes: 'Aucune erreur. Excellent !',
    progress: 'Tes progrès sur cet appareil', best: 'Meilleur', last: 'Dernier', tries: 'Parties', table1: 'Table de 1', again: 'Recommencer', goOfficial: 'Prêt ? Rejoins le championnat officiel',
    timeLeft: 'Temps restant', questionsLeft: 'Questions restantes'
  },
  player: {
    h1: 'Mon profil joueur', lead: 'Ton pseudo et ton pays publics, tes records et tes médailles, et tes réglages de confidentialité.',
    notSigned: 'Tu n’as pas encore de profil sur cet appareil.', create: 'Créer un profil', restore: 'Retrouver avec un code de récupération',
    public: 'Profil public', records: 'Records', medals: 'Médailles', noMedals: 'Pas encore de médaille. Le mois prochain, peut-être !', recent: 'Dernières parties officielles',
    edit: 'Changer de pseudo ou de pays', save: 'Enregistrer', saved: 'Enregistré.', cooldown: 'Le pseudo et le pays peuvent être modifiés une fois tous les 7 jours.',
    codeH: 'Code de récupération', codeP: 'Code perdu ? Crée-en un nouveau. L’ancien ne fonctionnera plus.', newCode: 'Créer un nouveau code',
    signOut: 'Me déconnecter sur cet appareil', signOutP: 'Tu auras besoin de ton code de récupération pour revenir.',
    deleteH: 'Supprimer mon profil', deleteP: 'Ton pseudo, ton code de récupération et tes appareils sont supprimés. Tes anciens résultats restent dans les classements sous le nom « Ancien joueur » pour ne pas changer les rangs des autres joueurs.', deleteBtn: 'Supprimer mon profil', deleteAsk: 'Supprimer définitivement ton profil ? C’est irréversible.', deleted: 'Ton profil a été supprimé.',
    statusValid: 'compté', statusReview: 'en vérification', statusInvalid: 'non compté', statusEmpty: 'aucune réponse'
  },
  home: {}, multBanner: {},
  common: { flagIntl: 'International', podiumEmpty: 'Ta place ici\u00a0?', medals: ['Or', 'Argent', 'Bronze'], place: ['1er', '2e', '3e'], monthChampionship: 'Championnat de {month}', days: 'j', hours: 'h', minutes: 'min', seconds: 's', open: 'libre' }
};

const ja = {
  chrome: {
    skip: '本文へ移動', allWorksheets: 'すべてのプリント', menu: 'メニュー', home: 'ホーム', championship: '世界選手権',
    footWorksheets: 'プリント', footMore: 'その他のプリント', footSite: 'サイト', footChamp: '世界選手権',
    about: 'このサイトについて', contact: 'お問い合わせ', privacy: 'プライバシーポリシー', terms: '利用規約', legal: '運営者情報',
    tagline: 'ブラウザで作れる無料の算数プリント。解答付き、登録不要。',
    footNote: 'プリントはブラウザ上で作成され、家庭や教室で自由に印刷・コピーできます（プリントは英語です）。',
    cats: { addition: 'たし算', subtraction: 'ひき算', multiplication: 'かけ算', division: 'わり算', fractions: '分数', decimals: '小数', 'number-sense': '数の感覚', 'pre-algebra': '代数の準備', measurement: '時計・お金・単位' }
  },
  nav: { landing: '世界選手権', play: 'プレイ', practice: '練習', leaderboard: 'ランキング', hall: '殿堂', rules: 'ルール', player: 'マイプロフィール' },
  name: 'かけ算世界選手権',
  slogan: 'すばやく考え、もっと速くかけ算。めざせ世界チャンピオン。',
  meta: {
    landing: ['かけ算世界選手権 – 60秒の九九スピードチャレンジ（無料） | MathSheetLab', '60秒でかけ算に何問正解できるかを競う無料の世界大会。世界ランキングに挑戦して、毎月の世界チャンピオンをめざそう。'],
    play: ['60秒かけ算チャレンジに挑戦 | MathSheetLab 世界選手権', 'かけ算世界選手権の公式60秒ラウンドに挑戦しよう。2〜12の段がランダムに出題され、その月のベストスコアが世界ランキングに反映されます。'],
    practice: ['かけ算練習ゲーム – 1の段から12の段まで無料 | MathSheetLab', '無料のかけ算練習ゲーム。1〜12の段を選ぶか全部まぜて、時間内に挑戦。まちがえた問題と上達の記録も確認できます。'],
    leaderboard: ['かけ算ランキング – 世界・国別 | MathSheetLab', 'かけ算世界選手権のランキング。今月の順位、歴代記録、国ごとのトッププレイヤー、国別ランキングを見られます。'],
    hall: ['殿堂 – 歴代のかけ算世界チャンピオン | MathSheetLab', 'かけ算世界選手権の歴代チャンピオンを紹介。毎月の金・銀・銅メダリスト、獲得タイトル数、そしてリセットされない歴代世界記録を掲載しています。'],
    rules: ['公式ルール – かけ算世界選手権 | MathSheetLab', 'かけ算世界選手権の公式ルール：60秒、2〜12の段、得点、同点の決め方、月間タイトル、フェアプレー、プライバシー。'],
    player: ['マイプロフィール – かけ算世界選手権 | MathSheetLab', 'かけ算世界選手権のプロフィール管理ページ。ニックネームと国・地域の変更、記録やメダルの確認、復元コードの再発行、プロフィールの削除ができます。']
  },
  landing: {
    eyebrowPill: '無料', eyebrow: '毎月開催 · 世界中のプレイヤー',
    h1: 'かけ算世界選手権',
    lead: '制限時間は60秒。2の段から12の段まで。ランキングは世界でひとつ。何回でも挑戦でき、その月のベストスコアが記録されます。月末に1位の人が世界チャンピオンです。',
    join: '選手権に参加する', practice: 'まずは練習',
    facts: ['完全無料', 'メールも本名も不要', '全員が同じルール'],
    liveTitle: '開催中の選手権', endsIn: '終了まで', startsIn: '開始まで', playersGames: '参加者 {p}人・プレイ {g}回',
    stepsKicker: '遊び方', stepsH: '表彰台までの3ステップ',
    steps: [
      ['ニックネームを決める', '楽しいニックネームと、代表したい国・地域を選びます。メールアドレスも本名もいりません。ニックネームの候補も用意しています。'],
      ['60秒プレイ', '2×2から12×12までのかけ算が1問ずつ出ます。答えを入力してEnterキー。正解1問につき1点です。'],
      ['ランキングを上がる', 'その月のベストスコアが世界ランキングに入ります。月の最終日に1位の人が世界チャンピオンになります。']
    ],
    boardKicker: 'リアルタイム', boardH: '今月のトップ10', fullBoard: 'ランキングをすべて見る',
    hallKicker: 'これまでの記録', hallH: 'チャンピオンの名前はずっと残ります',
    hallP: '毎月の金・銀・銅メダリストは、歴代世界記録とともに殿堂にずっと掲載されます。',
    hallLink: '殿堂を見る',
    safeKicker: '子どもたちのために', safeH: '安全・公平、プレイ中は広告なし',
    safe: [
      ['ニックネームだけ', 'プレイヤーはニックネームと国旗だけで表示されます。本名、写真、メールアドレスは使いません。'],
      ['チャットもメッセージもなし', 'ほかのプレイヤーと連絡をとる機能はありません。ニックネームはフィルターと管理者がチェックします。'],
      ['だれにでも公平', '問題、答え、時間はすべてサーバーで確認します。あやしいスコアは確認されます。'],
      ['プレイのじゃまをしない', 'プレイ中に広告は表示しません。練習モードはプロフィールなしで遊べます。']
    ],
    faqH: 'よくある質問'
  },
  faq: [
    ['無料ですか？', 'はい。プレイも練習もランキング掲載もすべて無料です。月額料金も購入もありません。'],
    ['アカウントは必要ですか？', '練習モードには何も必要ありません。公式ランキングに参加するには、ニックネームと国・地域だけでプロフィールを作ります。メールアドレスの代わりに、大切に保管する「復元コード」が発行されます。'],
    ['どのスコアが記録されますか？', 'その月の公式ベストスコアです。何回でも挑戦でき、低いスコアがよいスコアを上書きすることはありません。'],
    ['同点のときはどうなりますか？', 'まちがいが少ない人が上位です。それも同じなら、先にそのスコアを出した人が上位になります。'],
    ['1か月はいつ終わりますか？', '各選手権は協定世界時（UTC）で月の初日から最終日までです。日本時間では毎月1日の午前9時に切り替わります。数分後に順位が確定し、メダルが決まり、次の選手権が自動で始まります。'],
    ['不正はどう防いでいますか？', 'スコアはブラウザから送られません。サーバーが毎回のゲームを作り、問題を選び、答えを順番どおりに確認し、時間をはかります。ありえない速さのプレイは無効になり、非常に高いスコアは管理者が確認します。完ぺきなしくみはありませんが、偽のスコアはかなり難しくなります。'],
    ['国は選べますか？', 'はい。代表したい国・地域を自由に選べます。言いたくない場合は「インターナショナル」も選べます。位置情報は使いません。']
  ],
  rules: {
    h1: '公式ルール',
    lead: 'すべての国のすべてのプレイヤーに同じルールが適用されます。速さと正確さだけで勝負が決まるように作られています。',
    sections: [
      ['ラウンド', ['公式ラウンドは3秒のカウントダウンのあと、サーバーで計測するちょうど60秒です。', '問題は2〜12どうしのかけ算で、1問ずつ表示されます。公式ラウンドでは段を選べません。', '出題はかたよりがないように並びます。121問すべてが1回ずつ出るまで、同じ問題はくり返されません。', '答えをキーボードか画面の数字パッドで入力し、Enter（またはOK）を押すと、すぐ次の問題が出ます。']],
      ['得点', ['正解は1点、不正解は0点。ボーナスや運の要素はありません。', 'まちがえると時間をロスします。正解するまで同じ問題が残ります。2回まちがえると答えが表示され、それを入力すると次へ進めます（0点）。むずかしい問題を飛ばしても得にはなりません。', 'まちがいの数も数えられ、結果に表示されます。']],
      ['月間選手権', ['毎月がひとつの選手権です。期間は月の初日0:00（UTC）から最終日23:59:59（UTC）まで。日本時間では毎月1日の9:00に切り替わります。', '何回でも挑戦できます。その月の確認済みベストスコアだけが記録されます。', '月が終わって数分後に順位が確定します。1位はその月の世界チャンピオン、2位は銀メダル、3位は銅メダルです。最終順位はずっと見ることができ、プレイヤーが変更することはできません。', '次の選手権は自動で始まります。']],
      ['同点のとき', ['スコアが高い人が上位。次に、まちがいが少ない人。それも同じなら、先にそのスコアを出した人（UTC時刻）が上位です。']],
      ['フェアプレー', ['公式ゲームはすべてサーバーが作り、時間をはかり、確認します。ブラウザからスコアが送られることはありません。', '答えは順番どおり、時間内に届く必要があります。ありえないタイミングのゲームは無効になり、非常に高いスコアは管理者が確認してから表示されます。', 'プログラムやスクリプト、ほかの人の助けで答えるのは不正です。管理者はあやしいスコアを取り消し、ニックネームを停止できます。', 'おかしいと思うスコアがあれば、ランキングの「報告」から知らせてください。', 'Web上の不正対策に完ぺきなものはありません。これからも改善を続けます。']],
      ['ランキング', ['今月：今月の各プレイヤーのベストスコア。', '歴代：選手権開始以来の各プレイヤーのベストスコア。リセットされません。', '国・地域：国ごとのトッププレイヤーと、上位5人の平均（5人に満たない分は0点）による国別ランキング。参加人数が多いだけでは勝てません。', '殿堂：毎月のチャンピオンとメダリスト。']]
    ]
  },
  privacyBox: {
    h: 'プライバシーについて（かんたんに）',
    items: ['公開されるもの：ニックネーム、選んだ国・地域、スコアとタイトル。', '表示しないもの：メールアドレス（そもそも聞きません）、本名、IPアドレス、くわしい位置情報、技術的なID。', 'この端末でログイン状態を保つためのクッキーを1つだけ使います。選手権には広告用クッキーはありません。', '「マイプロフィール」からいつでもプロフィールを削除できます。'],
    link: 'プライバシーポリシー全文（英語）'
  },
  hall: {
    h1: '殿堂', lead: '毎月のかけ算世界チャンピオンと、銀・銅メダリストを紹介します。タイトルはずっと残ります。',
    latest: '現チャンピオン', gallery: '歴代チャンピオン', records: '歴代世界記録', recordsP: '選手権開始以来の各プレイヤーのベストスコア。このランキングはリセットされません。',
    empty: 'まだ終了した選手権はありません。最初の世界チャンピオンは{month}の終わりに決まります。あなたかもしれません！',
    titlesWon: 'タイトル{n}回', titleWon: 'タイトル1回'
  },
  board: {
    h1: 'かけ算ランキング', lead: 'かけ算世界選手権のリアルタイム世界ランキングです。約30秒ごとに更新されます。',
    tabs: { month: '今月', alltime: '歴代', countries: '国・地域', champions: 'チャンピオン' },
    month: '月', country: '国・地域', allCountries: 'すべての国・地域',
    rank: '順位', player: 'プレイヤー', score: 'スコア', errors: 'ミス', team: 'チームスコア', best: 'ベスト', playersCol: '人数', titles: 'タイトル',
    you: 'あなた', yourRank: 'あなたの順位', notRanked: '今月はまだランキングに入っていません。', playNow: '今すぐプレイ',
    empty: 'このランキングにはまだだれもいません。一番乗りをめざそう！',
    former: '退会したプレイヤー', report: '報告', reportAsk: '{name}さんのスコアを管理者に報告しますか？本当におかしいと思うときだけ報告してください。', reported: 'ありがとうございます。管理者が確認します。',
    prev: '前へ', next: '次へ', page: '{pages}ページ中{page}ページ',
    teamNote: 'チームスコア＝その国・地域の上位5人の平均（5人に満たない分は0点）。',
    champTitle: '{month}のチャンピオン', medal1: '金', medal2: '銀', medal3: '銅', loading: 'ランキングを読み込み中…', offline: 'ランキングを読み込めません。しばらくしてからもう一度お試しください。'
  },
  play: {
    h1: '世界選手権 — 60秒',
    lead: '公式ラウンド：2〜12のかけ算を1問ずつ、ちょうど60秒。その月のベストスコアが世界ランキングに記録されます。',
    soon: '公式選手権はまもなく始まります。それまで練習モードでウォーミングアップしよう！',
    opensOn: '最初の公式選手権は{date}（UTC）に始まります。それまで練習モードでウォーミングアップしよう！',
    signupH: 'プロフィールを作ろう', signupP: 'ニックネームと代表する国・地域を選ぶだけです。',
    nickname: 'ニックネーム', nickHelp: '3〜16文字（文字と数字）。本名は使わないでください。', suggest: 'ほかの候補', country: '国・地域', countryHelp: 'ニックネームの横に表示される国旗です。自由に選べます。',
    under13: '13歳未満の人は、プロフィールを作る前におうちの人か先生に聞いてください。',
    agree: '{rules}と{privacy}を読みました。', rulesLink: 'ルール', privacyLink: 'プライバシーポリシー',
    create: 'プロフィールを作る', haveCode: '復元コードを持っています',
    codeH: 'あなたの秘密の復元コード', codeP: 'このコードを書きとめて、大切に保管してください（おうちの人に預けるのもおすすめ）。別の端末でプロフィールを取り戻す唯一の方法です。もう一度表示することはできません。',
    copy: 'コピー', copied: 'コピーしました', codeDone: 'コードを保管しました',
    restoreH: 'プロフィールを復元', restoreP: 'プロフィール作成時に受け取った復元コードを入力してください。', restore: '復元する', code: '復元コード', cancel: 'キャンセル',
    ready: '準備はいい？ {name}さん', bestMonth: '今月のベスト', rankMonth: '今月の順位', allTime: '自己ベスト', none: '—',
    start: 'スタート — 60秒', startHint: '3・2・1のあとに時間がスタート。答えを入力してEnter。',
    banned: 'このプロフィールは公式選手権に参加できなくなりました。',
    timeLeft: '残り時間', points: '得点', errorsLabel: 'ミス', ok: 'OK', erase: '消す', answerLabel: 'あなたの答え',
    wrong: 'ざんねん、もう一度', reveal: '答えは {answer} です。入力して次へ進もう。', correct: '正解！',
    waiting: '接続中…', connection: '接続に問題があります。再試行しています…',
    resultH: 'タイムアップ！', resultScore: '{n}点', resultErrors: 'ミス{n}回', resultError: 'ミス1回',
    valid: 'スコアが世界ランキングに入りました。', newBest: '今月の自己ベスト更新！', notBest: '今月のベストは {best} 点のままです。',
    review: 'すごい！非常に高いスコアは、管理者が確認してからランキングに表示されます。',
    invalid: 'このゲームは確認できなかったため（ありえないタイミング、または接続の問題）、記録されません。',
    rankNow: '{month}の順位は{rank}位です。', again: 'もう一度', seeBoard: 'ランキングを見る',
    share: 'スコアをシェア', shareText: 'MathSheetLab かけ算世界選手権で{n}点を取ったよ。きみはこえられる？', shareDone: '画像をダウンロードし、テキストをコピーしました。好きな場所に貼りつけてね。',
    errors: { nick_taken: 'このニックネームはすでに使われています。別のものを試してください。', nick_offensive: 'このニックネームは使えません。みんなが気持ちよく見られる名前にしてください。', nick_reserved: 'このニックネームは予約されています。別のものを選んでください。', nick_length: '3〜16文字にしてください。', nick_chars: '使えるのは文字、数字、- と _ だけです（スペース不可）。', nick_digits: '数字が多すぎます。日付や電話番号、コードは使わないでください。', nick_mixed: 'ニックネームには1種類の文字（例：ローマ字だけ）を使ってください。', bad_country: '国・地域を選んでください。', bad_code: 'この復元コードは正しくありません。', rate_limited: '試行回数が多すぎます。少し待ってからもう一度お試しください。', profile_cooldown: '数日後にもう一度プロフィールを変更できます。', busy: '現在アクセスが集中しています。数分後にもう一度お試しください。', not_open: '公式選手権はまだ始まっていません。', generic: 'エラーが発生しました。もう一度お試しください。' }
  },
  practice: {
    h1: 'かけ算の練習',
    lead: '1つの段でも、全部まぜても、時間内に挑戦できます。練習は無料でプロフィール不要。公式ランキングには記録されません。',
    pick: '段を選ぶ', mixed: 'ぜんぶ（2〜12の段）', table: '{n}の段', mode: 'モード', mode60: '60秒', mode20: '20問',
    start: '練習スタート', note: '練習の結果はこの端末だけに保存され、公式ランキングには表示されません。',
    resultH: '練習おわり', correct: '正解数', mistakes: 'まちがえた問題', noMistakes: 'ミスなし。すばらしい！',
    progress: 'この端末での上達記録', best: 'ベスト', last: '前回', tries: '回数', table1: '1の段', again: 'もう一度練習', goOfficial: '準備OK？公式選手権に参加しよう',
    timeLeft: '残り時間', questionsLeft: '残り問題数'
  },
  player: {
    h1: 'マイプロフィール', lead: '公開されるニックネームと国・地域、記録とメダル、プライバシーの設定。',
    notSigned: 'この端末にはまだプロフィールがありません。', create: 'プロフィールを作る', restore: '復元コードで復元する',
    public: '公開プロフィール', records: '記録', medals: 'メダル', noMedals: 'まだメダルはありません。来月はあなたの番かも！', recent: '最近の公式ゲーム',
    edit: 'ニックネーム・国を変更', save: '保存', saved: '保存しました。', cooldown: 'ニックネームと国・地域は7日に1回変更できます。',
    codeH: '復元コード', codeP: 'コードをなくしたら、新しいコードを作れます。古いコードは使えなくなります。', newCode: '新しい復元コードを作る',
    signOut: 'この端末からログアウト', signOutP: '戻るときには復元コードが必要です。',
    deleteH: 'プロフィールを削除', deleteP: 'ニックネーム、復元コード、ログイン中の端末が削除されます。ほかのプレイヤーの順位が変わらないよう、過去の結果は「退会したプレイヤー」としてランキングに残ります。', deleteBtn: 'プロフィールを削除', deleteAsk: '本当にプロフィールを削除しますか？元に戻せません。', deleted: 'プロフィールを削除しました。',
    statusValid: '記録済み', statusReview: '確認中', statusInvalid: '無効', statusEmpty: '回答なし'
  },
  home: {}, multBanner: {},
  common: { flagIntl: 'インターナショナル', podiumEmpty: 'ここにあなたの名前？', medals: ['金', '銀', '銅'], place: ['1位', '2位', '3位'], monthChampionship: '{month} 選手権', days: '日', hours: '時間', minutes: '分', seconds: '秒', open: '空き' }
};

const STRINGS = { en, fr, ja };

// Missing keys (for example the home-page texts, only used in English) fall back to English.
function deepMerge(base, over) {
  if (Array.isArray(base) || typeof base !== 'object' || base === null) return over === undefined ? base : over;
  const out = {};
  for (const k of Object.keys(base)) out[k] = deepMerge(base[k], over ? over[k] : undefined);
  for (const k of Object.keys(over || {})) if (!(k in out)) out[k] = over[k];
  return out;
}
const T = Object.fromEntries(LANGS.map((l) => [l, l === 'en' ? en : deepMerge(en, STRINGS[l])]));

module.exports = { LANGS, LANG_NAMES, STRINGS, T };
