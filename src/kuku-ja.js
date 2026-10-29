'use strict';
/**
 * Japanese landing page for 九九 (the times tables), aimed at searches such as 「九九 ゲーム 無料」.
 * It explains the tables and sends visitors to the Japanese championship (play and practice).
 */
const { url } = require('./championship/pages');

const PATH = '/ja/kuku/';
const TITLE = '九九ゲーム（無料）– 60秒タイムアタックで九九を練習 | MathSheetLab';
const DESC = '登録不要の無料九九ゲーム。60秒で何問正解できるかに挑戦して、九九の表・覚え方のコツ・11の段と12の段も確認できます。学校のタブレットやスマホでそのまま遊べます。';

const FAQ = [
  ['無料で使えますか？', 'はい、すべて無料です。アプリのインストールやアカウント登録も必要ありません。ブラウザでページを開くだけで遊べます。'],
  ['学校のタブレット（Chromebook・iPad）でも使えますか？', 'はい。ブラウザだけで動くので、学校のタブレット、パソコン、スマホで使えます。答えは画面のキーやキーボードで入力します。'],
  ['子どもが使っても安全ですか？', '本名、メールアドレス、写真は使いません。世界選手権に参加するときもニックネームと国・地域だけで、チャット機能やプレイ中の広告はありません。練習モードはプロフィールなしで遊べます。'],
  ['何年生向けですか？', '九九を習う小学2年生から、スピードを上げたい3〜6年生まで楽しめます。練習モードでは1つの段だけを選べるので、覚えはじめの子にも使えます。'],
  ['11の段と12の段もあるのはなぜですか？', '世界選手権は世界共通のルールで、2の段から12の段まで出題されます。九九（9の段まで）を覚えたら、11の段・12の段は次のチャレンジにぴったりです。'],
  ['世界選手権はいつありますか？', '毎月開催で、その月のベストスコアで世界ランキングが決まります。第1回の公式戦は2026年12月です。']
];

function kukuTable(esc) {
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const head = `<tr><th scope="col"><span class="visually-hidden">かける数</span>×</th>${nums.map((n) => `<th scope="col">${n}</th>`).join('')}</tr>`;
  const rows = nums.map((a) => `<tr><th scope="row">${esc(a + 'の段')}</th>${nums.map((b) => `<td>${a * b}</td>`).join('')}</tr>`).join('');
  return `<div class="kuku-scroll"><table class="kuku-grid"><caption>九九の表（1の段〜9の段）</caption><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;
}

function kukuPage({ assets, layout, esc, crumbs, abs, ICON }) {
  const play = url('ja', 'play');
  const practice = url('ja', 'practice');
  const champ = url('ja', 'landing');
  const trail = crumbs([{ name: 'ホーム', path: '/' }, { name: '九九ゲーム', path: PATH }]);
  const faqLd = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
  };
  const body = `<section class="page-head dark"><div class="glow" aria-hidden="true"></div><div class="wrap">${trail.html}
<p class="kicker">無料 · 登録不要</p><h1>九九ゲーム：60秒で何問とける？</h1>
<p class="lead">九九を覚えたら、次はスピード。60秒のタイムアタックで、かけ算に何問正解できるか挑戦しよう。毎月の「かけ算世界選手権」では、世界中のプレイヤーとランキングを競えます。</p>
<div class="hero-actions head-actions"><a class="btn btn-primary" href="${practice}">九九を練習する ${ICON.arrow}</a><a class="btn btn-ghost" href="${play}">60秒チャレンジに挑戦</a></div></div></section>
<div class="wrap page-body"><article class="content paper">
<h2>九九ゲームの遊び方</h2>
<ol>
<li><strong>練習モード</strong>：1の段〜12の段から好きな段を選ぶか、全部まぜて練習します。まちがえた問題もあとで確認できます。</li>
<li><strong>60秒チャレンジ</strong>：2×2から12×12までのかけ算が1問ずつ出ます。答えを入力して、正解1問につき1点です。</li>
<li><strong>世界ランキング</strong>：ニックネームと国・地域を選ぶと、その月のベストスコアが世界ランキングに入ります。月末に1位の人が世界チャンピオンです。</li>
</ol>
<p>アプリのインストールも、メールアドレスの登録もいりません。学校のタブレットやスマホで、ページを開いてすぐに遊べます。</p>

<h2>九九の表</h2>
<p>まずは表で確認。たての列が「段」、よこの列が「かける数」です。</p>
${kukuTable(esc)}

<h2>九九を速く覚えるコツ</h2>
<ul>
<li><strong>声に出してとなえる</strong>：「いんいちがいち、いんにがに…」とリズムで覚えると、答えが自然に出てくるようになります。</li>
<li><strong>入れかえても答えは同じ</strong>：3×7と7×3はどちらも21。表の半分を覚えれば、残りの半分もわかります。</li>
<li><strong>5の段</strong>：答えの一の位は、いつも0か5です。</li>
<li><strong>9の段</strong>：答えの十の位と一の位をたすと、いつも9になります（9×4=36 → 3+6=9）。</li>
<li><strong>苦手な段だけ練習</strong>：練習モードで1つの段を選び、7の段や8の段など、まちがえやすい段を集中して練習しましょう。</li>
</ul>

<h2>九九の次は11の段・12の段</h2>
<p>世界選手権では12の段まで出題されます。九九のあとのチャレンジにどうぞ。</p>
<ul>
<li><strong>11の段</strong>：11×1から11×9までは、同じ数字が2つ並びます（11×3=33、11×7=77）。</li>
<li><strong>12の段</strong>：10倍と2倍をたします（12×7 = 70+14 = 84）。</li>
</ul>
<p><a href="${practice}">練習モードで11の段・12の段を選ぶ ${ICON.arrow}</a></p>

<h2>先生・保護者の方へ</h2>
<p>朝学習やすきま時間、家庭学習に使える無料の教材です。プレイヤーはニックネームと国旗だけで表示され、本名・メールアドレス・写真は使いません。チャット機能はなく、プレイ中は広告も表示されません。くわしくは<a href="${url('ja', 'rules')}">公式ルール</a>をご覧ください。</p>

<h2>よくある質問</h2>
${FAQ.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('\n')}

<p class="kuku-cta"><a class="btn btn-primary" href="${champ}">かけ算世界選手権を見る ${ICON.arrow}</a></p>
</article></div>`;
  return { p: PATH, html: layout(assets, { title: TITLE, desc: DESC, pathName: PATH, body, lang: 'ja', scripts: false, jsonld: [trail.ld, faqLd], ogImage: abs('/og/multiplication-championship-ja.jpg') }) };
}

module.exports = { kukuPage, KUKU_PATH: PATH };
