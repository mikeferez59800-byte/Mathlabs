/*
 * Worksheet catalog: one entry = one indexable page.
 * To add a worksheet, add an entry here (and a generator in engine.js if needed),
 * then run `node build.js`. The sitemap, home page and category pages update automatically.
 *
 * Fields: slug, cat, title (<title>), h1, desc (meta description), grade, gen, params,
 * cols (problems per row when printed), counts (choices), count (default),
 * instruction (printed on the sheet), intro (paragraphs), tips (list), related (slugs).
 */
'use strict';

const categories = [
  { slug: 'addition', name: 'Addition', blurb: 'From sums within 10 to 4-digit column addition with regrouping (carrying).' },
  { slug: 'subtraction', name: 'Subtraction', blurb: 'Facts within 10 and 20, then multi-digit subtraction with and without borrowing.' },
  { slug: 'multiplication', name: 'Multiplication', blurb: 'Times tables 1 to 12, mixed facts and multi-digit long multiplication.' },
  { slug: 'division', name: 'Division', blurb: 'Division facts and long division, with or without remainders.' },
  { slug: 'fractions', name: 'Fractions', blurb: 'Simplifying, comparing, adding, subtracting, multiplying and dividing fractions.' },
  { slug: 'decimals', name: 'Decimals', blurb: 'Adding, subtracting and multiplying decimals in column form.' },
  { slug: 'number-sense', name: 'Number sense', blurb: 'Rounding, comparing numbers, expanded form and missing addends.' },
  { slug: 'pre-algebra', name: 'Pre-algebra', blurb: 'Integers, order of operations, exponents and percentages.' }
];

const ADD_TIP = 'Have students say the carried digit out loud ("7 plus 5 is 12, write 2, carry 1") until it becomes automatic.';

const types = [
  // ---------------- Addition ----------------
  {
    slug: 'addition-within-10', cat: 'addition', gen: 'addWithin', params: { max: 10 },
    title: 'Addition Within 10 Worksheets (Printable, Free)',
    h1: 'Addition within 10 worksheets',
    desc: 'Free printable addition worksheets with sums up to 10. Generate new problems, print or save as PDF, answer key included. Ideal for kindergarten and grade 1.',
    grade: 'Kindergarten – Grade 1', cols: 4, counts: [20, 30, 40], count: 30,
    instruction: 'Add the numbers.',
    intro: [
      'These worksheets practice addition facts where the total is never more than 10. They are the first step toward fluency: once a child knows every pair that makes 10 by heart, adding larger numbers becomes much easier.',
      'Each sheet is generated randomly, so you can print a fresh page every day. The link at the bottom of the page reproduces exactly the same sheet if you want to share it with a class.'
    ],
    tips: ['Use fingers or ten-frames at first, then encourage counting on from the larger number.', 'Time a single sheet once a week rather than every day; progress is more visible.'],
    related: ['addition-within-20', 'subtraction-within-10', 'missing-addends']
  },
  {
    slug: 'addition-within-20', cat: 'addition', gen: 'addWithin', params: { max: 20 },
    title: 'Addition Within 20 Worksheets – Free Printable Addition Facts',
    h1: 'Addition within 20 worksheets',
    desc: 'Printable addition facts worksheets with sums to 20. Unlimited random sheets, answer keys, print or download as PDF. Grade 1 and grade 2 practice.',
    grade: 'Grade 1 – Grade 2', cols: 4, counts: [20, 30, 40, 50], count: 40,
    instruction: 'Add the numbers.',
    intro: [
      'Sums to 20 cover every single-digit addition fact a student needs. Fluency here is a key goal of first and second grade in most curricula, including the US Common Core (1.OA.C.6 and 2.OA.B.2).',
      'Problems are written horizontally to encourage mental strategies such as "make ten" (8 + 5 = 8 + 2 + 3) instead of column procedures.'
    ],
    tips: ['Teach "make ten" and "doubles plus one" strategies explicitly.', 'Mix in a few facts the student finds hard and repeat the sheet with the same link a week later.'],
    related: ['addition-within-10', 'adding-three-numbers', 'subtraction-within-20']
  },
  {
    slug: 'adding-three-numbers', cat: 'addition', gen: 'addThree', params: { max: 9 },
    title: 'Adding Three Single-Digit Numbers Worksheets (Free PDF)',
    h1: 'Adding three numbers worksheets',
    desc: 'Free worksheets for adding three single-digit numbers. Random problems, printable with answer key. Builds mental math and the associative property.',
    grade: 'Grade 1 – Grade 2', cols: 3, counts: [15, 21, 30], count: 30,
    instruction: 'Add all three numbers.',
    intro: [
      'Adding three numbers encourages students to look for pairs that are easy to combine first, such as 7 + 3 or 5 + 5. This is an early, concrete introduction to the associative and commutative properties.',
      'All addends are between 1 and 9, so totals stay below 28.'
    ],
    tips: ['Ask students to circle the two numbers they add first.', 'Discuss why the order does not change the total.'],
    related: ['addition-within-20', 'two-digit-addition-no-regrouping']
  },
  {
    slug: 'two-digit-addition-no-regrouping', cat: 'addition', gen: 'add', params: { da: 2, db: 2, regroup: 'none' },
    title: '2-Digit Addition Without Regrouping Worksheets | Free Printable',
    h1: '2-digit addition without regrouping',
    desc: 'Printable 2-digit addition worksheets with no carrying. Column format, unlimited random sheets and answer key. Great for grade 1 and grade 2.',
    grade: 'Grade 1 – Grade 2', cols: 5, counts: [20, 25, 30], count: 25,
    instruction: 'Add. You will not need to regroup.',
    intro: [
      'In every problem on these sheets, the ones digits add up to 9 or less and so do the tens digits. Students can focus on lining up place values correctly before regrouping is introduced.',
      'The column (vertical) layout leaves room under the line for the answer.'
    ],
    tips: ['Always start with the ones column, even when it is not strictly necessary yet; it prepares for carrying.', 'Use base-ten blocks to model the first few problems.'],
    related: ['two-digit-addition-with-regrouping', 'two-digit-subtraction-no-borrowing']
  },
  {
    slug: 'two-digit-addition-with-regrouping', cat: 'addition', gen: 'add', params: { da: 2, db: 2, regroup: 'force' },
    title: '2-Digit Addition With Regrouping (Carrying) Worksheets – Free',
    h1: '2-digit addition with regrouping',
    desc: 'Free printable 2-digit addition with regrouping worksheets. Every problem requires carrying. Random sheets, PDF printing and answer keys.',
    grade: 'Grade 2', cols: 5, counts: [20, 25, 30], count: 25,
    instruction: 'Add. Regroup when needed.',
    intro: [
      'Every problem on these sheets requires at least one carry, so students cannot avoid the step they are learning. Regrouping (also called carrying) is one of the main milestones of second grade arithmetic.',
      'Some sums go above 100, which also introduces carrying into the hundreds place.'
    ],
    tips: [ADD_TIP, 'Write the carried 1 small above the next column.'],
    related: ['two-digit-addition-no-regrouping', 'three-digit-addition', 'two-digit-subtraction-with-borrowing']
  },
  {
    slug: 'three-digit-addition', cat: 'addition', gen: 'add', params: { da: 3, db: 3, regroup: 'any' },
    title: '3-Digit Addition Worksheets With and Without Regrouping (Free)',
    h1: '3-digit addition worksheets',
    desc: 'Printable 3-digit addition worksheets in column form, mixing problems with and without regrouping. Free, unlimited, with answer key.',
    grade: 'Grade 2 – Grade 3', cols: 5, counts: [20, 25, 30], count: 25,
    instruction: 'Add.',
    intro: [
      'Three-digit addition combines everything students know about place value: ones, tens and hundreds. These sheets mix problems that need regrouping in zero, one or several columns, which mirrors real practice better than drilling a single case.'
    ],
    tips: [ADD_TIP, 'Estimate first by rounding to the nearest hundred, then check that the answer is close.'],
    related: ['two-digit-addition-with-regrouping', 'four-digit-addition', 'three-digit-subtraction']
  },
  {
    slug: 'four-digit-addition', cat: 'addition', gen: 'add', params: { da: 4, db: 4, regroup: 'any' },
    title: '4-Digit Addition Worksheets – Free Printable With Answers',
    h1: '4-digit addition worksheets',
    desc: 'Free 4-digit column addition worksheets with regrouping. Generate unlimited sheets, print or save to PDF, answer key on a separate page.',
    grade: 'Grade 3 – Grade 4', cols: 4, counts: [16, 20, 24], count: 20,
    instruction: 'Add.',
    intro: [
      'Four-digit addition is mostly about accuracy and neat alignment. Problems here can carry across several columns in a row (for example 4,968 + 3,057), which is where most mistakes happen.'
    ],
    tips: ['Use squared paper or the column layout to keep digits aligned.', 'Check by adding the numbers in the opposite order.'],
    related: ['three-digit-addition', 'four-digit-subtraction', 'rounding-to-nearest-1000']
  },

  // ---------------- Subtraction ----------------
  {
    slug: 'subtraction-within-10', cat: 'subtraction', gen: 'subWithin', params: { max: 10 },
    title: 'Subtraction Within 10 Worksheets (Free Printable)',
    h1: 'Subtraction within 10 worksheets',
    desc: 'Printable subtraction worksheets with numbers up to 10. Random problems, never negative answers, answer key included. Kindergarten and grade 1.',
    grade: 'Kindergarten – Grade 1', cols: 4, counts: [20, 30, 40], count: 30,
    instruction: 'Subtract.',
    intro: [
      'These sheets practice taking away from numbers up to 10. The first number is always the larger one, so answers are never negative.',
      'Subtraction within 10 is best learned alongside addition: 7 − 3 = 4 because 3 + 4 = 7.'
    ],
    tips: ['Show the matching addition fact next to a few problems.', 'Counting back works for small numbers; encourage "think addition" for the rest.'],
    related: ['addition-within-10', 'subtraction-within-20']
  },
  {
    slug: 'subtraction-within-20', cat: 'subtraction', gen: 'subWithin', params: { max: 20 },
    title: 'Subtraction Within 20 Worksheets – Free Subtraction Facts',
    h1: 'Subtraction within 20 worksheets',
    desc: 'Free printable subtraction facts worksheets within 20. Unlimited random sheets with answer keys. Builds fluency for grades 1 and 2.',
    grade: 'Grade 1 – Grade 2', cols: 4, counts: [20, 30, 40, 50], count: 40,
    instruction: 'Subtract.',
    intro: [
      'These worksheets cover every subtraction fact with numbers up to 20. Fluency within 20 is expected by the end of second grade in many curricula.',
      'Problems are horizontal, which encourages strategies such as subtracting through ten (15 − 7 = 15 − 5 − 2).'
    ],
    tips: ['Practice "subtract through ten" with a number line.', 'Pair this sheet with addition within 20 on alternate days.'],
    related: ['subtraction-within-10', 'addition-within-20', 'two-digit-subtraction-no-borrowing']
  },
  {
    slug: 'two-digit-subtraction-no-borrowing', cat: 'subtraction', gen: 'sub', params: { da: 2, db: 2, borrow: 'none' },
    title: '2-Digit Subtraction Without Regrouping Worksheets – Free',
    h1: '2-digit subtraction without borrowing',
    desc: 'Printable 2-digit subtraction worksheets with no regrouping (no borrowing). Column layout, random sheets and answer key. Grade 1 – 2.',
    grade: 'Grade 1 – Grade 2', cols: 5, counts: [20, 25, 30], count: 25,
    instruction: 'Subtract. You will not need to regroup.',
    intro: [
      'In each problem, every digit on top is at least as large as the digit below it, so no borrowing is needed. This lets students concentrate on subtracting column by column.'
    ],
    tips: ['Start in the ones column every time.', 'Check by adding the answer to the bottom number.'],
    related: ['two-digit-subtraction-with-borrowing', 'two-digit-addition-no-regrouping']
  },
  {
    slug: 'two-digit-subtraction-with-borrowing', cat: 'subtraction', gen: 'sub', params: { da: 2, db: 2, borrow: 'force' },
    title: '2-Digit Subtraction With Regrouping (Borrowing) Worksheets',
    h1: '2-digit subtraction with regrouping',
    desc: 'Free 2-digit subtraction with borrowing worksheets. Every problem needs regrouping. Print or save as PDF, answer key included.',
    grade: 'Grade 2', cols: 5, counts: [20, 25, 30], count: 25,
    instruction: 'Subtract. Regroup when needed.',
    intro: [
      'Each problem requires borrowing from the tens column because the ones digit on top is smaller than the one below (for example 52 − 27). This is usually the hardest step of second grade arithmetic.'
    ],
    tips: ['Model with base-ten blocks: trade one ten for ten ones.', 'Watch for the classic mistake of subtracting the smaller digit from the larger one regardless of position.'],
    related: ['two-digit-subtraction-no-borrowing', 'three-digit-subtraction', 'two-digit-addition-with-regrouping']
  },
  {
    slug: 'three-digit-subtraction', cat: 'subtraction', gen: 'sub', params: { da: 3, db: 3, borrow: 'any' },
    title: '3-Digit Subtraction Worksheets With Regrouping – Free Printable',
    h1: '3-digit subtraction worksheets',
    desc: 'Printable 3-digit subtraction worksheets mixing problems with and without borrowing. Unlimited random sheets with answer keys.',
    grade: 'Grade 2 – Grade 3', cols: 5, counts: [20, 25, 30], count: 25,
    instruction: 'Subtract.',
    intro: [
      'These sheets mix three-digit subtraction problems that need no regrouping, one regrouping or regrouping across several columns. Answers are never negative.'
    ],
    tips: ['Check each answer with addition.', 'Problems with zeros in the top number (like 502 − 167) deserve extra attention; generate a few sheets until some appear.'],
    related: ['two-digit-subtraction-with-borrowing', 'four-digit-subtraction', 'three-digit-addition']
  },
  {
    slug: 'four-digit-subtraction', cat: 'subtraction', gen: 'sub', params: { da: 4, db: 4, borrow: 'any' },
    title: '4-Digit Subtraction Worksheets – Free With Answer Key',
    h1: '4-digit subtraction worksheets',
    desc: 'Free printable 4-digit subtraction worksheets with regrouping, column layout and answer key. Grade 3 and grade 4 practice.',
    grade: 'Grade 3 – Grade 4', cols: 4, counts: [16, 20, 24], count: 20,
    instruction: 'Subtract.',
    intro: [
      'Four-digit subtraction practices borrowing across several places, including through zeros. It consolidates the standard algorithm before students move on to multi-digit multiplication.'
    ],
    tips: ['Estimate the answer first.', 'Encourage students to rewrite the top number when borrowing across zeros.'],
    related: ['three-digit-subtraction', 'four-digit-addition']
  },

  // ---------------- Multiplication ----------------
  ...[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => ({
    slug: `multiplication-table-of-${n}`, cat: 'multiplication', gen: 'multTable', params: { table: n, from: 0, to: 12, swap: true },
    title: `${n} Times Table Worksheets – Free Printable Multiplication by ${n}`,
    h1: `${n} times table worksheets`,
    desc: `Free printable worksheets to practice the ${n} times table (${n} × 0 to ${n} × 12). Random order, unlimited sheets, answer key included.`,
    grade: n <= 5 || n === 10 ? 'Grade 2 – Grade 3' : 'Grade 3 – Grade 4', cols: 3, counts: [13, 26, 39], count: 26,
    instruction: `Multiply by ${n}.`,
    intro: [
      `Each sheet asks every fact of the ${n} times table from ${n} × 0 to ${n} × 12 in a random order, with factors sometimes swapped (for example ${n === 2 ? 7 : 3} × ${n}) so students do not simply count up.`,
      tableHint(n)
    ],
    tips: ['Practise one table until the student can complete a sheet in under two minutes, then move on.', 'Review earlier tables with the mixed multiplication facts sheet.'],
    related: [n > 2 ? `multiplication-table-of-${n - 1}` : null, n < 12 ? `multiplication-table-of-${n + 1}` : null, 'multiplication-facts-0-10'].filter(Boolean)
  })),
  {
    slug: 'multiplication-facts-0-10', cat: 'multiplication', gen: 'multFacts', params: { max: 10 },
    title: 'Multiplication Facts 0–10 Worksheets (Mixed, Free Printable)',
    h1: 'Mixed multiplication facts 0–10',
    desc: 'Printable mixed multiplication facts worksheets with factors from 0 to 10. Random sheets for timed drills, answer keys included.',
    grade: 'Grade 3', cols: 4, counts: [20, 40, 60], count: 40,
    instruction: 'Multiply.',
    intro: [
      'Mixed facts are the real test of multiplication fluency: students cannot rely on the pattern of a single table. Factors range from 0 to 10, which covers the facts expected by the end of third grade (Common Core 3.OA.C.7).'
    ],
    tips: ['Use this sheet as a weekly timed check; use single-table sheets for daily practice.', 'Note which facts are missed and revisit those tables.'],
    related: ['multiplication-facts-0-12', 'division-facts-within-100', 'multiplication-table-of-7']
  },
  {
    slug: 'multiplication-facts-0-12', cat: 'multiplication', gen: 'multFacts', params: { max: 12 },
    title: 'Multiplication Facts to 12 × 12 Worksheets – Free Mixed Drills',
    h1: 'Mixed multiplication facts to 12 × 12',
    desc: 'Free printable mixed multiplication worksheets up to 12 × 12. Unlimited random drills with answer key, ideal for timed practice.',
    grade: 'Grade 3 – Grade 5', cols: 4, counts: [20, 40, 60], count: 40,
    instruction: 'Multiply.',
    intro: [
      'These drills include the 11 and 12 times tables, which are still expected in many schools (for example in England by the end of Year 4).'
    ],
    tips: ['Keep sessions short: one sheet a day is enough.', 'Students who are fluent to 10 × 10 often only need extra work on the 12s.'],
    related: ['multiplication-facts-0-10', 'division-facts-within-144']
  },
  {
    slug: 'two-digit-by-one-digit-multiplication', cat: 'multiplication', gen: 'mult', params: { da: 2, db: 1 },
    title: '2-Digit by 1-Digit Multiplication Worksheets – Free Printable',
    h1: '2-digit by 1-digit multiplication',
    desc: 'Printable 2-digit × 1-digit multiplication worksheets in column form. Random problems with regrouping, answer key included.',
    grade: 'Grade 3 – Grade 4', cols: 5, counts: [20, 25, 30], count: 25,
    instruction: 'Multiply.',
    intro: [
      'This is the first step of the standard multiplication algorithm: multiply the ones, carry, then multiply the tens and add the carried digit. The single-digit factor is always between 2 and 9.'
    ],
    tips: ['Practise the partial-products method (40 × 6 + 7 × 6) alongside the standard algorithm.', 'Make sure the times tables are solid first.'],
    related: ['three-digit-by-one-digit-multiplication', 'two-digit-by-two-digit-multiplication']
  },
  {
    slug: 'three-digit-by-one-digit-multiplication', cat: 'multiplication', gen: 'mult', params: { da: 3, db: 1 },
    title: '3-Digit by 1-Digit Multiplication Worksheets (Free, With Answers)',
    h1: '3-digit by 1-digit multiplication',
    desc: 'Free 3-digit × 1-digit multiplication worksheets. Column layout, random numbers, print or save as PDF with answer key.',
    grade: 'Grade 4', cols: 5, counts: [20, 25, 30], count: 25,
    instruction: 'Multiply.',
    intro: [
      'Multiplying a three-digit number by a single digit involves carrying twice in a row, which is where students need practice keeping track of the carried digits.'
    ],
    tips: ['Estimate first: 487 × 6 is a bit less than 500 × 6 = 3,000.'],
    related: ['two-digit-by-one-digit-multiplication', 'two-digit-by-two-digit-multiplication']
  },
  {
    slug: 'two-digit-by-two-digit-multiplication', cat: 'multiplication', gen: 'mult', params: { da: 2, db: 2 },
    title: '2-Digit by 2-Digit Multiplication Worksheets – Free Printable',
    h1: '2-digit by 2-digit multiplication',
    desc: 'Printable double-digit multiplication worksheets (2-digit × 2-digit). Unlimited random sheets, column format, answer keys.',
    grade: 'Grade 4 – Grade 5', cols: 4, counts: [12, 16, 20], count: 16,
    instruction: 'Multiply. Show your work.',
    intro: [
      'Two-digit by two-digit multiplication introduces partial products: multiply by the ones digit, then by the tens digit (with a zero placeholder), then add. Fewer problems per page leave space for working.'
    ],
    tips: ['Remind students to write the placeholder zero on the second row.', 'The area (box) model is a helpful bridge to the standard algorithm.'],
    related: ['two-digit-by-one-digit-multiplication', 'three-digit-by-two-digit-multiplication']
  },
  {
    slug: 'three-digit-by-two-digit-multiplication', cat: 'multiplication', gen: 'mult', params: { da: 3, db: 2 },
    title: '3-Digit by 2-Digit Long Multiplication Worksheets (Free, Printable)',
    h1: '3-digit by 2-digit multiplication',
    desc: 'Free printable long multiplication worksheets: 3-digit × 2-digit. Random problems with answer key, ready to print or save as PDF.',
    grade: 'Grade 5', cols: 4, counts: [8, 12, 16], count: 12,
    instruction: 'Multiply. Show your work.',
    intro: [
      'Long multiplication of a three-digit number by a two-digit number is a fifth-grade standard (Common Core 5.NBT.B.5). Each problem produces two partial products that must be added carefully.'
    ],
    tips: ['Use lined or squared paper for working.', 'Check by estimating: round both numbers and multiply.'],
    related: ['two-digit-by-two-digit-multiplication', 'long-division-two-digit-divisor']
  },

  // ---------------- Division ----------------
  {
    slug: 'division-facts-within-100', cat: 'division', gen: 'divFacts', params: { min: 1, max: 10 },
    title: 'Division Facts Worksheets Within 100 – Free Printable',
    h1: 'Division facts within 100',
    desc: 'Printable division facts worksheets with divisors and quotients from 1 to 10. Unlimited random sheets, answer keys included.',
    grade: 'Grade 3', cols: 4, counts: [20, 40, 60], count: 40,
    instruction: 'Divide.',
    intro: [
      'Every problem is the reverse of a multiplication fact up to 10 × 10, so all answers are whole numbers. Division facts are part of third grade fluency goals (Common Core 3.OA.C.7).'
    ],
    tips: ['Ask "what times 7 makes 56?" rather than teaching division as a separate set of facts.'],
    related: ['multiplication-facts-0-10', 'division-facts-within-144', 'long-division-no-remainder']
  },
  {
    slug: 'division-facts-within-144', cat: 'division', gen: 'divFacts', params: { min: 1, max: 12 },
    title: 'Division Facts to 144 Worksheets (÷1 to ÷12, Free)',
    h1: 'Division facts to 144',
    desc: 'Free printable division worksheets with divisors from 1 to 12. Random facts up to 144 ÷ 12, answer key included.',
    grade: 'Grade 3 – Grade 5', cols: 4, counts: [20, 40, 60], count: 40,
    instruction: 'Divide.',
    intro: ['These sheets extend division facts to the 11 and 12 times tables. All answers are whole numbers.'],
    tips: ['Practise alongside the 11 and 12 times table sheets.'],
    related: ['division-facts-within-100', 'multiplication-facts-0-12']
  },
  {
    slug: 'long-division-no-remainder', cat: 'division', gen: 'longDiv', params: { dd: 3, dv: 1, remainder: false },
    title: 'Long Division Worksheets Without Remainders (3-Digit ÷ 1-Digit)',
    h1: 'Long division without remainders',
    desc: 'Free printable long division worksheets: 3-digit numbers divided by 1-digit numbers, no remainders. Answer key on a separate page.',
    grade: 'Grade 4', cols: 4, counts: [12, 16, 20], count: 16,
    instruction: 'Divide. Show your work.',
    intro: [
      'Each problem divides a three-digit number by a single digit and comes out exactly. This lets students learn the divide–multiply–subtract–bring down cycle before dealing with remainders.'
    ],
    tips: ['Write the four steps (divide, multiply, subtract, bring down) at the top of the page.', 'Check with multiplication: quotient × divisor = dividend.'],
    related: ['long-division-with-remainders', 'division-facts-within-100']
  },
  {
    slug: 'long-division-with-remainders', cat: 'division', gen: 'longDiv', params: { dd: 3, dv: 1, remainder: true },
    title: 'Long Division With Remainders Worksheets – Free Printable',
    h1: 'Long division with remainders',
    desc: 'Printable long division worksheets with remainders: 3-digit ÷ 1-digit. Random problems, answers written as quotient R remainder.',
    grade: 'Grade 4', cols: 4, counts: [12, 16, 20], count: 16,
    instruction: 'Divide. Write the remainder as R.',
    intro: [
      'Every problem on these sheets leaves a remainder, written in the answer key as "R" (for example 47 R3). Remainders must always be smaller than the divisor, which is a useful self-check.'
    ],
    tips: ['If the remainder is larger than the divisor, the quotient digit was too small.'],
    related: ['long-division-no-remainder', 'long-division-4-digit-by-1-digit']
  },
  {
    slug: 'long-division-4-digit-by-1-digit', cat: 'division', gen: 'longDiv', params: { dd: 4, dv: 1, remainder: true },
    title: '4-Digit by 1-Digit Long Division Worksheets (With Remainders)',
    h1: '4-digit by 1-digit long division',
    desc: 'Free 4-digit ÷ 1-digit long division worksheets with remainders. Generate, print or save as PDF, with answer key.',
    grade: 'Grade 4 – Grade 5', cols: 4, counts: [8, 12, 16], count: 12,
    instruction: 'Divide. Show your work.',
    intro: ['Four-digit dividends add more cycles of the long division algorithm and frequently produce zeros in the quotient, a common source of errors.'],
    tips: ['When a step cannot divide, write 0 in the quotient before bringing down the next digit.'],
    related: ['long-division-with-remainders', 'long-division-two-digit-divisor']
  },
  {
    slug: 'long-division-two-digit-divisor', cat: 'division', gen: 'longDiv', params: { dd: 4, dv: 2, remainder: true },
    title: 'Long Division With 2-Digit Divisors Worksheets – Free',
    h1: 'Long division with 2-digit divisors',
    desc: 'Printable long division worksheets with two-digit divisors and four-digit dividends. Random problems with remainders and answer key.',
    grade: 'Grade 5 – Grade 6', cols: 3, counts: [6, 9, 12], count: 9,
    instruction: 'Divide. Show your work.',
    intro: ['Dividing by a two-digit number requires estimating each quotient digit, for example by rounding 47 to 50. This is a fifth- and sixth-grade skill (Common Core 5.NBT.B.6, 6.NS.B.2).'],
    tips: ['Have students write a short multiples list of the divisor in the margin.'],
    related: ['long-division-4-digit-by-1-digit', 'three-digit-by-two-digit-multiplication']
  },

  // ---------------- Fractions ----------------
  {
    slug: 'simplifying-fractions', cat: 'fractions', gen: 'fracSimplify', params: { maxDen: 12, maxK: 6 },
    title: 'Simplifying Fractions Worksheets – Free Printable With Answers',
    h1: 'Simplifying fractions worksheets',
    desc: 'Free printable worksheets to reduce fractions to lowest terms. Random problems, answer key included. Grade 4 to grade 6.',
    grade: 'Grade 4 – Grade 6', cols: 4, counts: [20, 24, 32], count: 24,
    instruction: 'Write each fraction in simplest form.',
    intro: ['Each fraction can be reduced, and the answer key gives it in lowest terms. Simplifying relies on finding the greatest common factor of the numerator and denominator.'],
    tips: ['Divide by small common factors (2, 3, 5) repeatedly if the GCF is not obvious.'],
    related: ['comparing-fractions', 'adding-fractions-like-denominators']
  },
  {
    slug: 'comparing-fractions', cat: 'fractions', gen: 'fracCompare', params: { maxDen: 12 },
    title: 'Comparing Fractions Worksheets (<, >, =) – Free Printable',
    h1: 'Comparing fractions worksheets',
    desc: 'Printable comparing fractions worksheets with unlike denominators. Students write <, > or =. Random sheets with answer keys.',
    grade: 'Grade 3 – Grade 5', cols: 4, counts: [20, 24, 32], count: 24,
    instruction: 'Write <, > or = in each box.',
    intro: ['Students compare two fractions with different denominators, either by finding a common denominator or by cross-multiplying. Occasionally the two fractions are equal.'],
    tips: ['Compare each fraction to 1/2 first; it settles many problems quickly.'],
    related: ['simplifying-fractions', 'adding-fractions-unlike-denominators']
  },
  {
    slug: 'adding-fractions-like-denominators', cat: 'fractions', gen: 'fracLike', params: { maxDen: 12, op: '+' },
    title: 'Adding Fractions With Like Denominators Worksheets (Free)',
    h1: 'Adding fractions with like denominators',
    desc: 'Free printable worksheets for adding fractions with the same denominator. Answers simplified and written as mixed numbers when needed.',
    grade: 'Grade 4', cols: 3, counts: [16, 20, 24], count: 20,
    instruction: 'Add. Simplify your answer.',
    intro: ['When denominators are the same, only the numerators are added. The answer key simplifies results and converts improper fractions to mixed numbers.'],
    tips: ['A common error is adding the denominators too; fraction strips make the reason clear.'],
    related: ['subtracting-fractions-like-denominators', 'adding-fractions-unlike-denominators']
  },
  {
    slug: 'subtracting-fractions-like-denominators', cat: 'fractions', gen: 'fracLike', params: { maxDen: 12, op: '−' },
    title: 'Subtracting Fractions With Like Denominators Worksheets',
    h1: 'Subtracting fractions with like denominators',
    desc: 'Printable worksheets for subtracting fractions with common denominators. Random problems, simplified answers in the answer key.',
    grade: 'Grade 4', cols: 3, counts: [16, 20, 24], count: 20,
    instruction: 'Subtract. Simplify your answer.',
    intro: ['Subtract the numerators and keep the denominator. Results are always positive and the answer key gives them in simplest form.'],
    tips: ['Ask students to simplify only at the end.'],
    related: ['adding-fractions-like-denominators', 'subtracting-fractions-unlike-denominators']
  },
  {
    slug: 'adding-fractions-unlike-denominators', cat: 'fractions', gen: 'fracUnlike', params: { maxDen: 10, op: '+' },
    title: 'Adding Fractions With Unlike Denominators Worksheets – Free',
    h1: 'Adding fractions with unlike denominators',
    desc: 'Free printable worksheets for adding fractions with different denominators. Random problems, answers simplified, answer key included.',
    grade: 'Grade 5', cols: 3, counts: [12, 16, 20], count: 16,
    instruction: 'Add. Simplify your answer.',
    intro: ['Students must first rewrite both fractions with a common denominator, ideally the least common multiple. This is a core fifth-grade standard (Common Core 5.NF.A.1).'],
    tips: ['Multiplying the two denominators always works; finding the LCM keeps numbers smaller.'],
    related: ['subtracting-fractions-unlike-denominators', 'multiplying-fractions']
  },
  {
    slug: 'subtracting-fractions-unlike-denominators', cat: 'fractions', gen: 'fracUnlike', params: { maxDen: 10, op: '−' },
    title: 'Subtracting Fractions With Unlike Denominators Worksheets',
    h1: 'Subtracting fractions with unlike denominators',
    desc: 'Printable worksheets for subtracting fractions with different denominators. Results are positive and simplified in the answer key.',
    grade: 'Grade 5', cols: 3, counts: [12, 16, 20], count: 16,
    instruction: 'Subtract. Simplify your answer.',
    intro: ['The larger fraction always comes first, so answers are positive. Students find a common denominator, subtract and simplify.'],
    tips: ['Compare the two fractions before subtracting to anticipate the size of the answer.'],
    related: ['adding-fractions-unlike-denominators', 'comparing-fractions']
  },
  {
    slug: 'multiplying-fractions', cat: 'fractions', gen: 'fracMult', params: { maxDen: 10, op: '×' },
    title: 'Multiplying Fractions Worksheets – Free Printable With Answers',
    h1: 'Multiplying fractions worksheets',
    desc: 'Free printable worksheets for multiplying fractions. Random problems, answers in simplest form or as mixed numbers.',
    grade: 'Grade 5 – Grade 6', cols: 3, counts: [16, 20, 24], count: 20,
    instruction: 'Multiply. Simplify your answer.',
    intro: ['Multiply the numerators together and the denominators together, then simplify. Cancelling common factors before multiplying keeps numbers small.'],
    tips: ['Show cross-cancelling once students are comfortable with the basic rule.'],
    related: ['dividing-fractions', 'simplifying-fractions']
  },
  {
    slug: 'dividing-fractions', cat: 'fractions', gen: 'fracMult', params: { maxDen: 10, op: '÷' },
    title: 'Dividing Fractions Worksheets (Free, With Answer Key)',
    h1: 'Dividing fractions worksheets',
    desc: 'Printable dividing fractions worksheets. Random problems, answers simplified and written as mixed numbers where needed.',
    grade: 'Grade 6', cols: 3, counts: [16, 20, 24], count: 20,
    instruction: 'Divide. Simplify your answer.',
    intro: ['To divide by a fraction, multiply by its reciprocal ("keep, change, flip"). Dividing fractions is a sixth-grade standard (Common Core 6.NS.A.1).'],
    tips: ['Ask students to estimate whether the answer will be bigger or smaller than the first fraction.'],
    related: ['multiplying-fractions']
  },

  // ---------------- Decimals ----------------
  {
    slug: 'adding-decimals', cat: 'decimals', gen: 'decimal', params: { places: 2, max: 99, op: '+' },
    title: 'Adding Decimals Worksheets (Hundredths) – Free Printable',
    h1: 'Adding decimals worksheets',
    desc: 'Free printable adding decimals worksheets with two decimal places, in column form. Random problems and answer key.',
    grade: 'Grade 5', cols: 5, counts: [20, 25, 30], count: 25,
    instruction: 'Add.',
    intro: ['All numbers have two decimal places so the decimal points line up in columns. Students add exactly as with whole numbers and bring the decimal point straight down.'],
    tips: ['Insist on lining up the decimal points, not the last digits.'],
    related: ['subtracting-decimals', 'multiplying-decimals']
  },
  {
    slug: 'subtracting-decimals', cat: 'decimals', gen: 'decimal', params: { places: 2, max: 99, op: '−' },
    title: 'Subtracting Decimals Worksheets – Free Printable With Answers',
    h1: 'Subtracting decimals worksheets',
    desc: 'Printable subtracting decimals worksheets (hundredths) in column layout. Random problems, positive answers, answer key.',
    grade: 'Grade 5', cols: 5, counts: [20, 25, 30], count: 25,
    instruction: 'Subtract.',
    intro: ['Subtraction of decimals with two places, aligned on the decimal point. Borrowing works exactly as with whole numbers.'],
    tips: ['Check by adding the answer to the number being subtracted.'],
    related: ['adding-decimals']
  },
  {
    slug: 'multiplying-decimals', cat: 'decimals', gen: 'decimalMult', params: { maxA: 99, whole: false },
    title: 'Multiplying Decimals Worksheets (Tenths × Tenths, Free)',
    h1: 'Multiplying decimals worksheets',
    desc: 'Free printable worksheets for multiplying decimals with one decimal place each. Random problems with answer key.',
    grade: 'Grade 5 – Grade 6', cols: 5, counts: [15, 20, 25], count: 20,
    instruction: 'Multiply.',
    intro: ['Multiply as if there were no decimal points, then count the decimal places in both factors to place the point in the answer. Trailing zeros are dropped in the answer key.'],
    tips: ['Estimate first: 4.8 × 3.1 should be close to 5 × 3 = 15.'],
    related: ['multiplying-decimals-by-whole-numbers', 'adding-decimals']
  },
  {
    slug: 'multiplying-decimals-by-whole-numbers', cat: 'decimals', gen: 'decimalMult', params: { maxA: 99, whole: true },
    title: 'Multiplying Decimals by Whole Numbers Worksheets – Free',
    h1: 'Multiplying decimals by whole numbers',
    desc: 'Printable worksheets: multiply a decimal (tenths) by a one-digit whole number. Random problems with answer key.',
    grade: 'Grade 5', cols: 5, counts: [15, 20, 25], count: 20,
    instruction: 'Multiply.',
    intro: ['A gentle introduction to decimal multiplication: one factor is a whole number from 2 to 9, the other has one decimal place.'],
    tips: ['Connect to repeated addition: 3 × 2.5 = 2.5 + 2.5 + 2.5.'],
    related: ['multiplying-decimals']
  },

  // ---------------- Number sense ----------------
  {
    slug: 'missing-addends', cat: 'number-sense', gen: 'missingAdd', params: { max: 20 },
    title: 'Missing Addend Worksheets Within 20 (Free Printable)',
    h1: 'Missing addend worksheets',
    desc: 'Printable missing number addition worksheets within 20 (like 7 + __ = 12). Random sheets with answer key for grades 1 and 2.',
    grade: 'Grade 1 – Grade 2', cols: 3, counts: [15, 24, 30], count: 24,
    instruction: 'Write the missing number.',
    intro: ['Missing addend problems connect addition and subtraction and are an early form of algebra: 7 + ? = 12 is the same question as 12 − 7.'],
    tips: ['Encourage counting on from the known addend to the total.'],
    related: ['addition-within-20', 'subtraction-within-20']
  },
  {
    slug: 'rounding-to-nearest-10', cat: 'number-sense', gen: 'round', params: { to: 10, min: 11, max: 999 },
    title: 'Rounding to the Nearest 10 Worksheets – Free Printable',
    h1: 'Rounding to the nearest 10',
    desc: 'Free printable rounding to the nearest ten worksheets with numbers up to 999. Random problems and answer key.',
    grade: 'Grade 3', cols: 2, counts: [16, 20, 30], count: 20,
    instruction: 'Round each number to the nearest ten.',
    intro: ['Look at the ones digit: 5 or more rounds up, 4 or less rounds down. Rounding to the nearest 10 and 100 is a third-grade standard (Common Core 3.NBT.A.1).'],
    tips: ['Use a number line to show which ten is closer.'],
    related: ['rounding-to-nearest-100', 'rounding-to-nearest-1000']
  },
  {
    slug: 'rounding-to-nearest-100', cat: 'number-sense', gen: 'round', params: { to: 100, min: 101, max: 9999 },
    title: 'Rounding to the Nearest 100 Worksheets (Free, With Answers)',
    h1: 'Rounding to the nearest 100',
    desc: 'Printable rounding to the nearest hundred worksheets with numbers up to 9,999. Unlimited random sheets with answer key.',
    grade: 'Grade 3 – Grade 4', cols: 2, counts: [16, 20, 30], count: 20,
    instruction: 'Round each number to the nearest hundred.',
    intro: ['Look at the tens digit to decide whether to round up or down. Numbers go up to 9,999, so some round up to the next thousand (for example 4,962 → 5,000).'],
    tips: ['Underline the hundreds digit and circle the digit to its right.'],
    related: ['rounding-to-nearest-10', 'rounding-to-nearest-1000']
  },
  {
    slug: 'rounding-to-nearest-1000', cat: 'number-sense', gen: 'round', params: { to: 1000, min: 1001, max: 99999 },
    title: 'Rounding to the Nearest 1000 Worksheets – Free Printable',
    h1: 'Rounding to the nearest 1,000',
    desc: 'Free rounding to the nearest thousand worksheets with five-digit numbers. Random problems, print or save as PDF, answer key.',
    grade: 'Grade 4', cols: 2, counts: [16, 20, 30], count: 20,
    instruction: 'Round each number to the nearest thousand.',
    intro: ['Rounding larger numbers is useful for estimating sums and products. Look at the hundreds digit to decide.'],
    tips: ['Use rounding to estimate before solving 4-digit addition problems.'],
    related: ['rounding-to-nearest-100', 'four-digit-addition']
  },
  {
    slug: 'comparing-numbers', cat: 'number-sense', gen: 'compareNumbers', params: { min: 100, max: 9999 },
    title: 'Comparing Numbers Worksheets (<, >, =) up to 9,999 – Free',
    h1: 'Comparing numbers worksheets',
    desc: 'Printable comparing numbers worksheets with greater than, less than and equal signs. Numbers up to 9,999, answer key included.',
    grade: 'Grade 2 – Grade 3', cols: 3, counts: [18, 24, 30], count: 24,
    instruction: 'Write <, > or =.',
    intro: ['Students compare two numbers from 100 to 9,999 by looking at place value from the left. A few pairs are equal on purpose.'],
    tips: ['Compare digit by digit starting from the largest place value.'],
    related: ['expanded-form', 'rounding-to-nearest-100']
  },
  {
    slug: 'expanded-form', cat: 'number-sense', gen: 'expanded', params: { digits: 4 },
    title: 'Expanded Form Worksheets (4-Digit Numbers) – Free Printable',
    h1: 'Writing numbers in expanded form',
    desc: 'Free printable expanded form worksheets: write 4-digit numbers as the sum of their place values. Random sheets with answer key.',
    grade: 'Grade 2 – Grade 4', cols: 2, counts: [12, 16, 20], count: 16,
    instruction: 'Write each number in expanded form.',
    intro: ['Writing 4,072 as 4,000 + 70 + 2 makes place value visible, including the role of zero.'],
    tips: ['Use place value charts for numbers with zeros.'],
    related: ['comparing-numbers', 'rounding-to-nearest-10']
  },

  // ---------------- Pre-algebra ----------------
  {
    slug: 'adding-and-subtracting-integers', cat: 'pre-algebra', gen: 'integers', params: { max: 20, op: 'mix' },
    title: 'Adding and Subtracting Integers Worksheets – Free Printable',
    h1: 'Adding and subtracting integers',
    desc: 'Printable integer worksheets mixing addition and subtraction of positive and negative numbers from −20 to 20. Answer key included.',
    grade: 'Grade 6 – Grade 7', cols: 3, counts: [18, 24, 30], count: 24,
    instruction: 'Add or subtract.',
    intro: ['Negative numbers are written in parentheses when they follow an operation sign, for example 5 − (−8). Integer operations are a seventh-grade standard (Common Core 7.NS.A.1).'],
    tips: ['Subtracting a negative is the same as adding a positive; a number line makes it concrete.'],
    related: ['multiplying-integers', 'order-of-operations']
  },
  {
    slug: 'multiplying-integers', cat: 'pre-algebra', gen: 'intMult', params: { max: 12 },
    title: 'Multiplying Integers Worksheets – Free Printable With Answers',
    h1: 'Multiplying integers worksheets',
    desc: 'Free printable worksheets for multiplying positive and negative integers from −12 to 12. Random problems with answer key.',
    grade: 'Grade 7', cols: 3, counts: [18, 24, 30], count: 24,
    instruction: 'Multiply.',
    intro: ['Same signs give a positive product, different signs a negative one. Factors range from −12 to 12.'],
    tips: ['Count the negative signs: an even number gives a positive result.'],
    related: ['dividing-integers', 'adding-and-subtracting-integers']
  },
  {
    slug: 'dividing-integers', cat: 'pre-algebra', gen: 'intMult', params: { max: 12, op: '÷' },
    title: 'Dividing Integers Worksheets (Free, With Answer Key)',
    h1: 'Dividing integers worksheets',
    desc: 'Printable dividing integers worksheets with positive and negative numbers. Every answer is a whole number. Answer key included.',
    grade: 'Grade 7', cols: 3, counts: [18, 24, 30], count: 24,
    instruction: 'Divide.',
    intro: ['Each problem is built from a multiplication fact, so every quotient is a whole number. The sign rules are the same as for multiplication.'],
    tips: ['Practise this sheet right after the multiplying integers sheet.'],
    related: ['multiplying-integers']
  },
  {
    slug: 'order-of-operations', cat: 'pre-algebra', gen: 'orderOps', params: { parens: false },
    title: 'Order of Operations Worksheets (No Parentheses) – Free',
    h1: 'Order of operations worksheets',
    desc: 'Free printable order of operations worksheets without parentheses. Practice multiplication and division before addition and subtraction.',
    grade: 'Grade 5 – Grade 6', cols: 3, counts: [18, 24, 30], count: 24,
    instruction: 'Solve using the order of operations.',
    intro: ['Each expression has three numbers and two operations. Students must multiply or divide before adding or subtracting (the rule summarised by PEMDAS or BODMAS). All answers are whole, non-negative numbers.'],
    tips: ['Underline the operation to do first before calculating.'],
    related: ['order-of-operations-with-parentheses', 'exponents']
  },
  {
    slug: 'order-of-operations-with-parentheses', cat: 'pre-algebra', gen: 'orderOps', params: { parens: true },
    title: 'Order of Operations With Parentheses Worksheets – Free',
    h1: 'Order of operations with parentheses',
    desc: 'Printable order of operations worksheets with parentheses. Random expressions, whole-number answers, answer key included.',
    grade: 'Grade 5 – Grade 6', cols: 3, counts: [18, 24, 30], count: 24,
    instruction: 'Solve. Work inside the parentheses first.',
    intro: ['Expressions mix problems with and without parentheses so students learn when brackets change the answer, for example (3 + 4) × 2 versus 3 + 4 × 2.'],
    tips: ['Ask students to rewrite the expression after each step.'],
    related: ['order-of-operations', 'exponents']
  },
  {
    slug: 'exponents', cat: 'pre-algebra', gen: 'exponents', params: { maxBase: 10, maxExp: 3 },
    title: 'Exponents Worksheets (Squares and Cubes) – Free Printable',
    h1: 'Exponents worksheets',
    desc: 'Free printable exponents worksheets: evaluate squares and cubes of numbers from 1 to 10. Random sheets with answer key.',
    grade: 'Grade 5 – Grade 6', cols: 4, counts: [20, 24, 32], count: 24,
    instruction: 'Evaluate.',
    intro: ['An exponent tells how many times the base is multiplied by itself: 4³ = 4 × 4 × 4 = 64. These sheets use exponents 2 and 3.'],
    tips: ['Watch for the common mistake 4³ = 12.'],
    related: ['order-of-operations', 'percent-of-a-number']
  },
  {
    slug: 'percent-of-a-number', cat: 'pre-algebra', gen: 'percentOf', params: { percents: [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 90], maxBase: 400 },
    title: 'Percent of a Number Worksheets – Free Printable With Answers',
    h1: 'Percent of a number worksheets',
    desc: 'Printable worksheets for finding the percent of a number (like 25% of 80). Friendly numbers, random problems, answer key included.',
    grade: 'Grade 6 – Grade 7', cols: 3, counts: [18, 24, 30], count: 24,
    instruction: 'Find the percent of each number.',
    intro: ['Percentages are chosen so that answers are whole numbers, which keeps the focus on the method: 10% is one tenth, 25% is one quarter, 50% is one half.'],
    tips: ['Find 10% first, then build other percentages from it.'],
    related: ['multiplying-decimals', 'multiplying-fractions']
  }
];

function tableHint(n) {
  const hints = {
    2: 'The 2 times table is doubling: every answer is even.',
    3: 'In the 3 times table, the digits of each answer add up to a multiple of 3 (for example 27 → 2 + 7 = 9).',
    4: 'The 4 times table is "double, then double again": 4 × 7 = 14 doubled = 28.',
    5: 'Answers in the 5 times table always end in 0 or 5, and they are half of the 10 times table.',
    6: 'For even numbers, 6 × n ends in the same digit as n (6 × 4 = 24, 6 × 8 = 48).',
    7: 'The 7 times table has fewest patterns; most students find it hardest, so it deserves extra sheets.',
    8: 'The 8 times table is "double, double, double": 8 × 6 = 12 → 24 → 48.',
    9: 'In the 9 times table up to 9 × 10, the digits of each answer add up to 9, and the tens digit is one less than the factor.',
    10: 'Multiplying by 10 adds a zero to the end of a whole number.',
    11: 'Up to 11 × 9, the 11 times table repeats the digit (11 × 7 = 77); 11 × 11 = 121 and 11 × 12 = 132.',
    12: 'The 12 times table is the 10 times table plus the 2 times table: 12 × 7 = 70 + 14 = 84.'
  };
  return hints[n];
}

module.exports = { categories, types };
