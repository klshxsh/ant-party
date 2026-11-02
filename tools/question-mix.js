// Checks how questions are spread out over 10,000 picks: every fact turns up about
// equally often, the +/− sign patterns are balanced, carrying and borrowing come up
// about two times in three, and weak facts come up more. Prints a report.
// Usage: node tools/question-mix.js   (exits non-zero if anything is off)
const AP = require('./load-game')();

const PICKS = 10000;
let failures = 0;
function check(ok, message) {
  if (!ok) {
    failures++;
    console.log('  FAIL:', message);
  }
}
const pct = (n, of) => `${((100 * n) / of).toFixed(1)}%`;

// Questions as rounds ask them (so the no-repeat window applies), all right first
// time. Returned as a list of rounds.
function rounds(settings, stats = {}, count = PICKS) {
  const out = [];
  for (let n = 0; n < count; n += settings.partyAt) {
    const round = AP.round.create(settings);
    const qs = [];
    while (qs.length < settings.partyAt && n + qs.length < count) {
      const q = AP.round.nextQuestion(round, stats);
      AP.round.complete(round, q, true);
      qs.push(q);
    }
    out.push(qs);
  }
  return out;
}
const play = (...args) => rounds(...args).flat();

const tally = (list, keyOf) => list.reduce((t, x) => ((t[keyOf(x)] = (t[keyOf(x)] || 0) + 1), t), {});

// Chi-squared against an even spread over `keys`. With no real bias it stays near the
// number of keys; the limit is about 4 standard deviations above that.
function evenness(counts, keys, label) {
  const total = keys.reduce((n, k) => n + (counts[k] || 0), 0);
  const expected = total / keys.length;
  const chi = keys.reduce((sum, k) => sum + ((counts[k] || 0) - expected) ** 2 / expected, 0);
  const df = keys.length - 1;
  const limit = df + 4 * Math.sqrt(2 * df);
  const values = keys.map(k => counts[k] || 0);
  console.log(`  ${label}: ${keys.length} kinds, each ${Math.min(...values)}–${Math.max(...values)} times (about ${Math.round(expected)} expected), χ² ${chi.toFixed(0)} (limit ${limit.toFixed(0)})`);
  check(values.every(v => v > 0), `${label}: some never asked`);
  check(chi < limit, `${label}: uneven spread`);
}

const num = s => Number(s.replace(/[()]/g, '').replace('−', '-'));
const parse = text => text.split(' ').filter((_, i) => i !== 1).map(num);

function addSubReport(qs, settings) {
  const small = Math.max(-settings.addsubMin, settings.addsubMax) / 10;
  let regrouped = 0;
  let easy = 0;
  const sizes = [0, 0, 0, 0, 0]; // answers by fifth of the range
  for (const q of qs) {
    const [a, b] = parse(q.text);
    const d = q.text.includes(' + ') ? b : -b;
    if (AP.questions.regroups(a, d)) regrouped++;
    if ([a, b].some(n => Math.abs(n) < small || (Math.abs(n) >= 10 && n % 10 === 0))) easy++;
    const span = settings.addsubMax - settings.addsubMin + 1;
    sizes[Math.min(4, Math.floor((5 * (q.answer - settings.addsubMin)) / span))]++;
  }
  return { regrouped: regrouped / qs.length, easy: easy / qs.length, sizes };
}

// --- 1. The default mix, with all three kinds switched on ---
const settings = { ...AP.config.defaults, types: { mul: true, div: true, addsub: true } };
console.log(`1. All three kinds, default settings, ${PICKS.toLocaleString()} questions`);
const played = rounds(settings);
const qs = played.flat();
const byType = tally(qs, q => q.type);
console.log(`  Kinds: × ${pct(byType.mul, PICKS)}, ÷ ${pct(byType.div, PICKS)}, +/− ${pct(byType.addsub, PICKS)}`);
evenness(byType, ['mul', 'div', 'addsub'], 'Kinds');

for (const type of ['mul', 'div', 'addsub']) {
  const keys = AP.questions.factsFor(type, settings).map(f => f.key);
  evenness(tally(qs.filter(q => q.type === type), q => q.key), keys, { mul: '×', div: '÷', addsub: '+/− sign patterns' }[type]);
}

// × is shown either way round: 7 × 8 or 8 × 7 (squares like 7 × 7 aside).
const muls = qs.filter(q => q.type === 'mul');
const unsquare = muls.filter(q => q.key.split('x')[0] !== q.key.split('x')[1]);
const tableFirst = unsquare.filter(q => Number(q.text.split(' ')[0]) === Number(q.key.split('x')[0])).length;
console.log(`  × with the table number first: ${pct(tableFirst, unsquare.length)}`);
check(Math.abs(tableFirst / unsquare.length - 0.5) < 0.05, '× order should be about half and half');

// 7 × 8 and 8 × 7 are separate facts (two cells on the progress grid), so a pair of
// tables shares twice the turns of a square like 7 × 7.
const pairs = tally(muls, q => q.key.split('x').map(Number).sort((x, y) => x - y).join('×'));
const square = Object.keys(pairs).filter(k => k.split('×')[0] === k.split('×')[1]);
const mixed = Object.keys(pairs).filter(k => !square.includes(k) && pairs[k] > 0);
const avg = list => list.reduce((n, k) => n + pairs[k], 0) / list.length;
console.log(`  Squares like 7 × 7 asked ${avg(square).toFixed(0)} times each; a pair like 7 × 8 / 8 × 7 ${avg(mixed).toFixed(0)} times (both orders)`);

const repeats = played.reduce((n, round) => n + round.filter((q, i) => round.slice(Math.max(0, i - 4), i).some(p => p.key === q.key)).length, 0);
console.log(`  Same fact (or +/− pattern) twice within 5 questions of a round: ${repeats} times`);
check(repeats === 0, 'facts should not repeat within the no-repeat window');

const as = addSubReport(qs.filter(q => q.type === 'addsub'), settings);
console.log(`  +/−: ${pct(as.regrouped, 1)} carry or borrow, ${pct(as.easy, 1)} with a too-easy number`);
console.log(`  +/− answers from ${settings.addsubMin} to ${settings.addsubMax}, by fifths: ${as.sizes.join(' / ')}`);

// --- 2. + and − over different ranges ---
console.log(`\n2. + and − only, ${PICKS.toLocaleString()} questions per range`);
console.log('  range          patterns  carry/borrow  too easy   answers by fifths of the range');
const ranges = [[-20, 20], [1, 20], [1, 100], [1, 1000], [-100, 100], [-1000, 1000], [-1000, 1], [-3, 1000], [-5, 5], [1, 5]];
for (const [min, max] of ranges) {
  const s = { ...settings, types: { mul: false, div: false, addsub: true }, addsubMin: min, addsubMax: max };
  const r = addSubReport(play(s), s);
  const patterns = AP.questions.factsFor('addsub', s).length;
  console.log(`  ${`${min} to ${max}`.padEnd(15)}${String(patterns).padEnd(10)}${pct(r.regrouped, 1).padEnd(14)}${pct(r.easy, 1).padEnd(11)}${r.sizes.join(' / ')}`);
  // Big enough ranges can always find carrying, borrowing and not-too-easy numbers.
  if (Math.min(-min, max) >= 20 || (min > 0 && max >= 20)) {
    check(Math.abs(r.regrouped - 2 / 3) < 0.06, `${min} to ${max}: carry/borrow should be about 2 in 3`);
    check(r.easy < 0.02, `${min} to ${max}: too many easy numbers`);
  }
  check(r.sizes.every(n => n > 0) || max - min < 10, `${min} to ${max}: some answers never come up`);
}

// --- 3. Weak facts ---
// A child who knows every × fact well, apart from three they keep missing and one
// they're slow on.
console.log('\n3. Weak facts, × only: every fact known well except three missed and one slow');
const only = { ...settings, types: { mul: true, div: false, addsub: false } };
const stats = {};
for (const f of AP.questions.factsFor('mul', only)) stats[f.key] = { n: 6, err: 0, ms: 2500 };
const missed = ['7x8', '6x7', '8x12'];
missed.forEach(k => (stats[k] = { n: 6, err: 0.8, ms: 5000 }));
stats['9x6'] = { n: 6, err: 0, ms: 13000 };
const weakQs = play(only, stats);
const seen = tally(weakQs, q => q.key);
const fair = PICKS / Object.keys(stats).length;
for (const k of [...missed, '9x6']) {
  const times = (seen[k] || 0) / fair;
  console.log(`  ${k.replace('x', ' × ')} ${k === '9x6' ? 'slow  ' : 'missed'}: ${times.toFixed(1)} times as often as an even share (${pct(seen[k] || 0, PICKS)} of questions)`);
  check(times > (k === '9x6' ? 1.5 : 2.5), `${k} should come up more often`);
}
const perRound = (missed.reduce((n, k) => n + (seen[k] || 0), 0) / PICKS) * 20;
console.log(`  In a 20-question round, the three missed facts come up about ${perRound.toFixed(1)} times between them`);

console.log(failures ? `\n${failures} failure(s)` : '\nAll distribution checks passed');
process.exit(failures ? 1 : 0);
