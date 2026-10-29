/*
 * "Common mistakes" shown on each worksheet page: what usually goes wrong with this skill and how to fix it.
 * Keyed by generator (catalog `gen`); a worksheet can override with its own slug key.
 * Each entry: [mistake, fix]. Written for parents and teachers, plain text.
 */
'use strict';

const MISTAKES = {
  addWithin: [
    ['Counting all instead of counting on: for 6 + 3, starting again from 1.', 'Start from the bigger number and count up: "6... 7, 8, 9".'],
    ['Losing track of how many have been counted on.', 'Keep the count on fingers or a ten-frame, one finger per step.']
  ],
  addThree: [
    ['Adding in strict left-to-right order and making a slip on a hard step.', 'Look for pairs that make 10 first (3 + 7), then add the third number.'],
    ['Forgetting one of the three numbers.', 'Touch or tick each number as it is added.']
  ],
  add: [
    ['Forgetting the carried 1, or writing the full two-digit sum in one column (7 + 5 written as 12 under the ones).', 'Say it out loud: "12: write 2, carry 1", and write the small 1 above the next column straight away.'],
    ['Misaligned columns when the numbers have different lengths.', 'Line the digits up from the right (ones under ones); squared paper helps.'],
    ['Starting from the left.', 'Always start with the ones column, because carries move to the left.']
  ],
  subWithin: [
    ['Counting the starting number when counting back (9 − 3: "9, 8, 7").', 'Count the jumps, not the start: "8, 7, 6", so the answer is 6.'],
    ['Treating subtraction as a separate set of facts.', 'Link it to addition: 13 − 5 is "5 plus what makes 13?".']
  ],
  sub: [
    ['Subtracting the smaller digit from the larger one in every column (52 − 17 = 45).', 'In each column, top minus bottom. If the top digit is smaller, borrow first.'],
    ['Borrowing but forgetting to reduce the next digit.', 'Cross out the digit you borrow from and write the new value above it before going on.'],
    ['Borrowing across a zero (400 − 123).', 'Borrow from the first non-zero digit: 400 becomes 3 hundreds, 9 tens, 10 ones.']
  ],
  missingAdd: [
    ['Adding the two numbers shown (4 + ___ = 9 answered as 13).', 'Read it as a question: "4 and how many more make 9?"'],
    ['Not checking the answer.', 'Put the answer in the blank and add: the sum must match.']
  ],
  multTable: [
    ['Reciting the table from the start to find one fact.', 'Practise facts out of order (this worksheet shuffles them) until each one is instant.'],
    ['Thinking 7 × 8 and 8 × 7 are different facts to learn.', 'Use the swap: every fact learned counts twice.']
  ],
  multFacts: [
    ['Confusing × 0 and × 1 (5 × 0 = 5).', 'Anything times 0 is 0; anything times 1 stays the same.'],
    ['Guessing hard facts such as 6 × 8 or 7 × 8.', 'Build them from known facts: 6 × 8 = 5 × 8 + 8 = 48.']
  ],
  mult: [
    ['Forgetting the placeholder zero on the second row of a 2-digit multiplier.', 'Write the 0 in the ones column before multiplying by the tens digit.'],
    ['Adding the carried digit before multiplying.', 'Multiply first, then add what was carried.'],
    ['Errors in the final addition of partial products.', 'Line the rows up carefully and add them like a column addition.']
  ],
  divFacts: [
    ['Not seeing the link with multiplication.', 'Turn it around: 56 ÷ 7 asks "7 times what is 56?"'],
    ['Mixing up 0 rules (0 ÷ 5 and 5 ÷ 0).', '0 divided by a number is 0; dividing by 0 is not possible, so it never appears here.']
  ],
  longDiv: [
    ['Skipping a zero in the quotient (612 ÷ 6 = 12 instead of 102).', 'Every time you bring a digit down, write a digit in the quotient, even if it is 0.'],
    ['A remainder bigger than the divisor.', 'If what is left is as big as the divisor, the last quotient digit was too small: increase it.'],
    ['Losing place value when bringing digits down.', 'Bring down one digit at a time and keep each step under the right column.']
  ],
  fracLike: [
    ['Adding the denominators too (1/5 + 2/5 = 3/10).', 'The denominator names the size of the pieces; it stays the same. Only the numerators are added.'],
    ['Leaving the answer unsimplified or improper.', 'Simplify, and change an improper fraction into a mixed number at the end.']
  ],
  fracUnlike: [
    ['Adding tops and bottoms straight across (1/2 + 1/3 = 2/5).', 'Rewrite both fractions with a common denominator first (3/6 + 2/6).'],
    ['Changing the denominator but not the numerator.', 'Whatever you multiply the bottom by, multiply the top by the same number.'],
    ['Using a large common denominator and then forgetting to simplify.', 'Use the least common multiple, and simplify the result.']
  ],
  fracMult: [
    ['Looking for a common denominator before multiplying.', 'For multiplication, multiply straight across: top × top, bottom × bottom.'],
    ['Dividing by flipping the wrong fraction.', 'Keep the first fraction, change ÷ to ×, flip the second one.']
  ],
  fracSimplify: [
    ['Dividing the top and bottom by different numbers.', 'Divide both by the same common factor.'],
    ['Stopping too early (8/12 = 4/6).', 'Divide by the greatest common factor, or keep going until no common factor is left.']
  ],
  fracCompare: [
    ['Thinking a bigger denominator means a bigger fraction (1/8 > 1/4).', 'More pieces means smaller pieces: 1/8 is smaller than 1/4.'],
    ['Comparing only the numerators when the denominators differ.', 'Use a common denominator, or cross-multiply: compare 2 × 5 with 3 × 3 for 2/3 and 3/5.']
  ],
  decimal: [
    ['Lining up the last digits instead of the decimal points.', 'Line up the decimal points; fill empty places with zeros.'],
    ['Forgetting the decimal point in the answer.', 'Bring the point straight down into the answer line before adding.']
  ],
  decimalMult: [
    ['Lining up the decimal points as in addition.', 'Multiply as whole numbers, then count the decimal places in both factors.'],
    ['Placing the point in the wrong spot.', 'The answer has as many decimal places as the two factors together; estimate to check.']
  ],
  round: [
    ['Looking at the wrong digit to decide.', 'Underline the place you round to, then look only at the digit just to its right.'],
    ['Changing the digits to the left of the rounding place, or not replacing the rest with zeros.', 'Only the underlined digit can change (up by 1 or not); everything to its right becomes 0.']
  ],
  integers: [
    ['Treating −3 − (−5) as −3 − 5.', 'Subtracting a negative is adding: −3 − (−5) = −3 + 5 = 2.'],
    ['Taking the sign of the first number.', 'With different signs, subtract the sizes and keep the sign of the number farther from 0.']
  ],
  intMult: [
    ['Applying addition rules ("two negatives make a bigger negative").', 'For × and ÷: same signs give a positive answer, different signs give a negative answer.'],
    ['Losing the sign while working out the size.', 'Decide the sign first, write it, then compute the size.']
  ],
  orderOps: [
    ['Working strictly from left to right (2 + 3 × 4 = 20).', 'Brackets first, then × and ÷, then + and −: 2 + 3 × 4 = 14.'],
    ['Thinking × always comes before ÷ (or + before −).', '× and ÷ have equal priority and are done left to right; the same goes for + and −.']
  ],
  percentOf: [
    ['Dividing by the percent instead of by 100.', '25% of 80 means 25/100 × 80 = 20.'],
    ['Not using easy benchmarks.', '10% is a tenth, 50% is half, 25% is a quarter: combine them (15% = 10% + 5%).']
  ],
  exponents: [
    ['Multiplying the base by the exponent (3² = 6).', 'The exponent says how many times to use the base as a factor: 3² = 3 × 3 = 9.'],
    ['Thinking any number to the power 1 is 1.', 'A number to the power 1 is the number itself.']
  ],
  compareNumbers: [
    ['Reading the sign the wrong way round.', 'The open side faces the bigger number, like a mouth eating the larger amount.'],
    ['Comparing the first digits of numbers with a different number of digits.', 'First count the digits: more digits means a bigger number. Only then compare digit by digit from the left.']
  ],
  expanded: [
    ['Writing the digits instead of their values (3,405 = 3 + 4 + 0 + 5).', 'Each digit is worth digit × its place: 3,000 + 400 + 5.'],
    ['Writing a term for a zero digit.', 'Leave out places that hold 0.']
  ],
  clock: [
    ['Swapping the hands.', 'The short hand gives the hour, the long hand gives the minutes.'],
    ['Reading the next hour when the hour hand is past the number (2:45 read as 3:45).', 'The hour is the number the short hand has just passed, not the one it is going to.'],
    ['Reading the minute number as minutes (the long hand on 3 read as 3 minutes).', 'Count by fives from the 12: the 3 means 15 minutes.']
  ],
  pow10: [
    ['Adding zeros to a decimal (2.5 × 10 = 2.50).', 'Move every digit one place left for each zero: 2.5 × 10 = 25.'],
    ['Moving the digits the wrong way.', 'Multiplying makes the number bigger, dividing makes it smaller: check the size.']
  ],
  decDiv: [
    ['Forgetting the decimal point in the quotient.', 'Put the point in the answer directly above the point in the dividend before dividing.'],
    ['Stopping when a digit does not divide.', 'Write 0 in the quotient and bring the next digit down.']
  ],
  equation: [
    ['Doing an operation on one side only.', 'Whatever you do to one side, do the same to the other.'],
    ['Undoing the steps in the wrong order in a two-step equation.', 'Undo the + or − first, then the × or ÷.'],
    ['Not checking the solution.', 'Put the value back into the equation: both sides must be equal.']
  ],
  money: [
    ['Ignoring the decimal point and the cents.', 'Line up the decimal points and keep two digits after the point.'],
    ['Forgetting that 100 cents make a dollar when regrouping.', 'Regroup exactly like whole numbers: work in cents if it helps.']
  ],
  convert: [
    ['Dividing when going to a smaller unit.', 'Bigger unit to smaller unit: multiply (there are more of the small ones).'],
    ['Using the wrong factor (12 in a yard).', 'Write the fact first: 1 yd = 3 ft = 36 in, 1 lb = 16 oz, 1 km = 1,000 m.']
  ],
  mixedNumbers: [
    ['Adding the whole number to the numerator (2 3/4 = 5/4).', 'Multiply the whole number by the denominator, then add the numerator: 2 × 4 + 3 = 11, so 11/4.'],
    ['Losing the remainder when converting back.', 'Divide numerator by denominator: the quotient is the whole number, the remainder is the new numerator.']
  ],
  gcf: [
    ['Giving a common factor that is not the greatest.', 'List all factors of both numbers and take the largest one they share.'],
    ['Confusing GCF with LCM.', 'The GCF is never bigger than the smaller number.']
  ],
  lcm: [
    ['Multiplying the two numbers every time.', 'That is a common multiple, but often not the least: 6 and 4 give 12, not 24.'],
    ['Confusing LCM with GCF.', 'The LCM is never smaller than the larger number.']
  ]
};

function mistakesFor(t) {
  return MISTAKES[t.slug] || MISTAKES[t.gen] || [];
}

module.exports = { MISTAKES, mistakesFor };
