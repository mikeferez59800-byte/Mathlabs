/*
 * Grade-level hub pages (/1st-grade-math-worksheets/ ...). One entry = one indexable page listing every
 * worksheet whose grade range includes that grade. Texts are original summaries of what students usually
 * work on that year (aligned with the US Common Core where it applies).
 */
'use strict';

const grades = [
  {
    n: 0, slug: 'kindergarten-math-worksheets', name: 'Kindergarten', short: 'K',
    h1: 'Kindergarten math worksheets',
    title: 'Kindergarten Math Worksheets – Free Printable, With Answers',
    desc: 'Free printable kindergarten math worksheets: addition and subtraction within 10 and telling time to the hour. New problems each time, with answer keys.',
    intro: [
      'Kindergarten math is about understanding what numbers mean: counting objects, comparing groups, and seeing that 7 can be split into 5 and 2. Addition and subtraction start with small numbers, usually within 10, and are first done with fingers, counters or drawings.',
      'The worksheets below keep the numbers small and the pages uncluttered. Use them for short daily practice once a child can count reliably, and switch on large print for little hands.'
    ],
    focus: ['Adding and taking away within 10', 'Knowing the pairs that make 10', 'Reading the hour on a clock']
  },
  {
    n: 1, slug: '1st-grade-math-worksheets', name: '1st grade', short: '1',
    h1: '1st grade math worksheets',
    title: '1st Grade Math Worksheets – Free Printable With Answer Keys',
    desc: 'Free printable 1st grade math worksheets: addition and subtraction within 20, two-digit sums, missing addends and telling time. Answer keys included.',
    intro: [
      'In first grade, children move from counting to real strategies: making ten, using doubles, and seeing subtraction as a missing addend (9 + ? = 14). The goal is fluent addition and subtraction within 10 and confident work within 20.',
      'They also meet tens and ones, add two-digit numbers without regrouping, and tell time to the hour and half hour. Each worksheet below targets one of these skills and can be printed as often as you like.'
    ],
    focus: ['Addition and subtraction facts within 20', 'Tens and ones, two-digit sums without regrouping', 'Missing addends', 'Time to the hour and half hour']
  },
  {
    n: 2, slug: '2nd-grade-math-worksheets', name: '2nd grade', short: '2',
    h1: '2nd grade math worksheets',
    title: '2nd Grade Math Worksheets – Free Printable, Answer Keys',
    desc: 'Free printable 2nd grade math worksheets: regrouping, place value, money, time to 5 minutes and first times tables. Answer keys and online practice.',
    intro: [
      'Second grade is the year of place value. Students add and subtract within 100 fluently, carry and borrow for the first time, and stretch to three-digit numbers. Knowing all addition facts within 20 from memory is a key goal.',
      'They also count money, tell time to the nearest five minutes, compare numbers and write them in expanded form. Skip counting by 2s, 5s and 10s leads into the first times tables.'
    ],
    focus: ['Addition and subtraction with regrouping', 'Place value and expanded form', 'Money and time to 5 minutes', 'Skip counting and the 2, 5 and 10 times tables']
  },
  {
    n: 3, slug: '3rd-grade-math-worksheets', name: '3rd grade', short: '3',
    h1: '3rd grade math worksheets',
    title: '3rd Grade Math Worksheets – Free Printable Times Tables & More',
    desc: 'Free printable 3rd grade math worksheets: times tables, division facts, rounding, multi-digit addition and subtraction, fractions. With answer keys.',
    intro: [
      'Third grade is all about multiplication and division. By the end of the year students should know every product of two one-digit numbers from memory and understand division as the inverse of multiplication.',
      'They also round to the nearest 10 or 100, add and subtract within 1,000, and begin fractions by comparing them and placing them on a number line. Times tables practice works best little and often: a short sheet every day beats a long one every week.'
    ],
    focus: ['Times tables 1 to 12 and division facts', 'Rounding to the nearest 10 and 100', 'Three- and four-digit addition and subtraction', 'First fractions']
  },
  {
    n: 4, slug: '4th-grade-math-worksheets', name: '4th grade', short: '4',
    h1: '4th grade math worksheets',
    title: '4th Grade Math Worksheets – Free Printable With Answer Keys',
    desc: 'Free printable 4th grade math worksheets: long multiplication, long division, fractions, unit conversions and rounding. Answer keys included.',
    intro: [
      'Fourth graders apply their times tables to bigger numbers: multi-digit multiplication and long division with one-digit divisors, including remainders. Place value now reaches the thousands and beyond.',
      'Fractions grow up too: equivalent fractions, simplifying, comparing, adding and subtracting with like denominators, and converting between mixed numbers and improper fractions. Measurement conversions inside one system (feet to inches, kilograms to grams) complete the year.'
    ],
    focus: ['Multi-digit multiplication', 'Long division with remainders', 'Equivalent fractions, like denominators, mixed numbers', 'Unit conversions and rounding to 1,000']
  },
  {
    n: 5, slug: '5th-grade-math-worksheets', name: '5th grade', short: '5',
    h1: '5th grade math worksheets',
    title: '5th Grade Math Worksheets – Free Printable Fractions, Decimals',
    desc: 'Free printable 5th grade math worksheets: fractions with unlike denominators, decimals, long division by two-digit numbers, order of operations, GCF and LCM.',
    intro: [
      'Fifth grade brings fractions and decimals together. Students add and subtract fractions with unlike denominators, multiply fractions, and work with decimals to the hundredths in all four operations.',
      'Whole-number skills reach their full form: the standard multiplication algorithm and long division by two-digit divisors. Order of operations with parentheses and powers of ten prepare the move to pre-algebra.'
    ],
    focus: ['Fractions with unlike denominators', 'Decimal operations', 'Long division by two-digit divisors', 'Order of operations, exponents, GCF and LCM']
  },
  {
    n: 6, slug: '6th-grade-math-worksheets', name: '6th grade', short: '6',
    h1: '6th grade math worksheets',
    title: '6th Grade Math Worksheets – Free Printable Pre-Algebra Practice',
    desc: 'Free printable 6th grade math worksheets: dividing fractions, integers, one-step equations, exponents, percents, GCF and LCM. Answer keys and online practice.',
    intro: [
      'Sixth grade is the bridge to algebra. Students divide fractions by fractions, become fluent with multi-digit division and decimals, and meet negative numbers on the number line.',
      'Expressions and one-step equations appear, along with whole-number exponents, percents of a quantity, and the greatest common factor and least common multiple used to simplify and compare.'
    ],
    focus: ['Dividing fractions', 'Integers', 'One-step equations', 'Exponents, percents, GCF and LCM']
  },
  {
    n: 7, slug: '7th-grade-math-worksheets', name: '7th grade', short: '7',
    h1: '7th grade math worksheets',
    title: '7th Grade Math Worksheets – Free Printable Integers, Equations',
    desc: 'Free printable 7th grade math worksheets: integer operations, percents and two-step equations. Answer keys and online practice included.',
    intro: [
      'Seventh graders work fluently with signed numbers: adding, subtracting, multiplying and dividing integers and other rational numbers. Sign rules that felt arbitrary become automatic with practice.',
      'Equations get a second step (3x + 5 = 20), and percents are used to solve real problems. The worksheets below cover these core skills; earlier topics such as fractions and order of operations are worth reviewing from the 6th grade page.'
    ],
    focus: ['Integer operations', 'Two-step equations', 'Percent problems']
  }
];

// Grade numbers covered by a catalog entry ("Kindergarten – Grade 1" -> [0, 1]).
function gradesOf(t) {
  const nums = (t.grade.match(/Kindergarten|\d+/g) || []).map((g) => (g === 'Kindergarten' ? 0 : +g));
  const lo = Math.min(...nums), hi = Math.max(...nums), out = [];
  for (let g = lo; g <= hi; g++) out.push(g);
  return out;
}

module.exports = { grades, gradesOf };
