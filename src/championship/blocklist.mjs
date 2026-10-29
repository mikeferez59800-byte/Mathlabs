/*
 * Nickname filter for a site used by children. Matching ignores case, accents, separators,
 * repeated letters and common look-alike digits (5 -> s, 0 -> o...), see checkNickname() in core.mjs.
 * - contains: rejected anywhere in the nickname (long enough not to hit innocent words).
 * - exact: rejected when the whole nickname is this word, optionally followed by digits.
 * - reserved: names that could impersonate the site or its moderators.
 * No list is complete: moderators can still reset any nickname from the admin page.
 */
export const BLOCKLIST = {
  reserved: ['admin', 'administrator', 'moderator', 'moderateur', 'mathsheetlab', 'mathsheet', 'official', 'officiel', 'staff', 'support', 'system', 'root', 'webmaster', '管理人', '運営', '公式'],
  contains: [
    // English
    'fuck', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'whore', 'slut', 'bastard', 'asshole', 'nigg', 'fag', 'retard', 'porn', 'sexy', 'penis', 'vagina', 'nazi', 'hitler', 'boobs', 'kkk', 'killyou', 'suicide', 'terror', 'cocaine', 'wank', 'twat', 'dildo', 'horny', 'nude', 'naked', 'jizz', 'milf',
    // French
    'merde', 'putain', 'salope', 'connard', 'connasse', 'encule', 'enculé', 'batard', 'bâtard', 'niquer', 'couille', 'chatte', 'tapette', 'negre', 'nègre', 'bougnoul', 'youpin', 'gouine', 'branleur', 'pétasse', 'petasse',
    // Spanish, German, Italian, Portuguese
    'puta', 'mierda', 'cabron', 'pendejo', 'coño', 'joder', 'scheisse', 'scheiße', 'fotze', 'wichser', 'arschloch', 'hure', 'cazzo', 'stronzo', 'vaffanculo', 'caralho', 'porra', 'buceta',
    // Japanese
    'ちんこ', 'ちんちん', 'まんこ', 'うんこ', 'セックス', 'エロ', 'しね', '死ね', '殺す', 'ころす', 'くそ', 'クソ', 'ばか', 'バカ', 'あほ', 'アホ', 'きもい', 'キモい', 'ブス', 'ぶす', 'ガイジ', 'チョン', 'レイプ', 'おっぱい', 'ちくび', '乳首', '射精', '売春', '風俗'
  ],
  exact: ['heroin', 'cum', 'rape', 'rapist', 'boob', 'bite', 'nique', 'pute', 'pede', 'pédé', 'fdp', 'ntm', 'tg', 'ass', 'arse', 'cock', 'sex', 'xxx', 'fck', 'wtf', 'con', 'conne', 'cul', 'zob', 'gay', 'lesbian', 'loser', 'idiot', 'stupid', 'dumb', 'noob', 'kill', 'die', 'pig', 'cochon', 'debile', 'débile', 'abruti', 'crétin', 'cretin', 'imbecile', 'imbécile']
};
