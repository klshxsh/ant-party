// Sanity-checks the question generators and round logic outside the browser.
// Usage: node tools/check-questions.js
const AP = require('./load-game')();

let failures = 0;
function check(ok, message) {
  if (!ok) {
    failures++;
    if (failures <= 20) console.log('FAIL:', message);
  }
}

// Reads "−8 − (−5)" back into [a, op, b] as numbers.
const num = s => Number(s.replace(/[()]/g, '').replace('−', '-'));
function parse(text) {
  const [a, op, b] = text.split(' ');
  return [num(a), op, num(b), b.startsWith('(')];
}

// Every question's text must evaluate to its answer.
const settings = JSON.parse(JSON.stringify(AP.config.defaults));
settings.types = { mul: true, div: true, addsub: true };
const counts = {};
for (let i = 0; i < 10000; i++) {
  const q = AP.questions.pickNext(settings, {}, []);
  counts[q.type] = (counts[q.type] || 0) + 1;
  const [x, op, y] = parse(q.text);
  const expected = { '×': x * y, '÷': x / y, '+': x + y, '−': x - y }[op];
  check(expected === q.answer, `${q.text} gave ${q.answer}`);
  check(Number.isInteger(q.answer), `${q.text}: answer ${q.answer} not a whole number`);
  if (q.type !== 'addsub') check(q.answer >= 0, `${q.text}: answer below zero`);
}
console.log('Mix over 10,000 questions:', counts);

// + and −, over a range of settings: everything in range, signs match the bucket,
// and every bucket the range allows turns up.
const sign = n => (n > 0 ? 'p' : 'n');
const ranges = [[-20, 20], [1, 100], [1, 1000], [-100, 100], [-1000, 1], [-1, 5], [1, 5], [0, 10], [-3, 1000]];
for (const [min, max] of ranges) {
  const s = { ...settings, types: { mul: false, div: false, addsub: true }, addsubMin: min, addsubMax: max };
  const facts = AP.questions.factsFor('addsub', s);
  const seen = {};
  let regrouped = 0;
  for (let i = 0; i < 5000; i++) {
    const q = AP.questions.pickNext(s, {}, []);
    const [x, op, y, bracketed] = parse(q.text);
    const fact = facts.find(f => f.key === q.key);
    seen[q.key] = (seen[q.key] || 0) + 1;
    if (AP.questions.regroups(x, op === '+' ? y : -y)) regrouped++;
    const where = `${q.text} (${min} to ${max})`;
    check(fact, `${where}: unexpected bucket ${q.key}`);
    check([x, y, q.answer].every(n => n >= min && n <= max), `${where}: out of range`);
    check(x !== 0 && y !== 0, `${where}: has a 0`);
    check(bracketed === y < 0, `${where}: brackets`);
    check(op === (q.key.startsWith('add') ? '+' : '−'), `${where}: wrong sign for ${q.key}`);
    if (fact) {
      check(sign(x) === fact.a && sign(y) === fact.b, `${where}: signs don't match ${q.key}`);
      if (fact.ans) check(q.answer !== 0 && sign(q.answer) === fact.ans, `${where}: answer sign for ${q.key}`);
    }
  }
  check(facts.length > 0, `${min} to ${max}: no buckets`);
  check(facts.every(f => seen[f.key]), `${min} to ${max}: some buckets never asked`);
  if (min >= 0) check(facts.every(f => f.a === 'p' && f.b === 'p' && f.ans !== 'n'), `${min} to ${max}: has negatives`);
  check(AP.questions.negatives(s) === min < 0, `${min} to ${max}: negatives()`);
  console.log(`${min} to ${max}: ${facts.length} buckets, ${Math.round(regrouped / 50)}% carry/borrow`);
}
check(AP.questions.factsFor('addsub', { addsubMin: -20, addsubMax: 20 }).length === 9, '−20 to 20 should allow all 9 buckets');

// Stored settings are made safe; the old "to 100" / "to 1000" types turn into + and −.
const old = AP.prefs.normalise({ types: { mul: false, div: false, addsub100: true }, addsubMin: 50, addsubMax: 'x' });
check(JSON.stringify(old.types) === '{"mul":false,"div":false,"addsub":true}', `old types: ${JSON.stringify(old.types)}`);
check(old.addsubMin === 1 && old.addsubMax === 20, `range clamped: ${old.addsubMin} to ${old.addsubMax}`);
check(AP.prefs.problems({ ...settings, addsubMin: 5 }).length === 1, 'smallest number above 1 is a problem');
check(AP.prefs.problems({ ...settings, addsubMax: NaN }).length === 1, 'blank biggest number is a problem');
check(AP.prefs.problems(settings).length === 0, 'defaults have no problems');
check(AP.prefs.normalise({ antSpeed: 'scurry' }).antSpeed === 'scurry', 'ant speed kept');
check(AP.prefs.normalise({ antSpeed: 'toString' }).antSpeed === 'stroll', 'unknown ant speed reset');
check(AP.prefs.normalise({}).calm === false && AP.prefs.normalise({ calm: 1 }).calm === true, 'gentler animations setting');

// Weak facts come up more often.
const stats = { '7x8': { n: 5, err: 1, ms: 15000 } };
const only = { ...settings, types: { mul: true, div: false, addsub: false } };
let hits = 0;
for (let i = 0; i < 10000; i++) if (AP.questions.pickNext(only, stats, []).key === '7x8') hits++;
const fair = 10000 / AP.questions.factsFor('mul', only).length;
console.log(`7×8 marked weak: asked ${hits} times vs about ${Math.round(fair)} if fair`);
check(hits > fair * 3, 'weak fact should be picked much more often');

// A round: food every N, party at M, missed facts come back.
const round = AP.round.create({ ...settings, foodEvery: 5, partyAt: 20 });
const events = [];
let missed = null;
let missedSeenAgain = false;
for (let i = 1; i <= 20; i++) {
  const q = AP.round.nextQuestion(round, {});
  if (missed && q === missed) missedSeenAgain = true;
  const firstTry = i !== 3;
  if (!firstTry) missed = q;
  const r = AP.round.complete(round, q, firstTry);
  if (r.food) events.push(`food@${i}`);
  if (r.party) events.push(`party@${i}`);
  if (r.food) round.foods.push(AP.round.foodChoices(round)[0].id);
}
console.log('Round events:', events.join(' '));
check(events.join(' ') === 'food@5 food@10 food@15 food@20 party@20', 'food/party timing');
check(missedSeenAgain, 'missed fact should come back later in the round');
check(new Set(round.ants.map(a => a.name)).size === 20, 'ants should have different names');
check(new Set(round.foods).size === round.foods.length, 'foods should not repeat');

console.log(failures ? `${failures} failure(s)` : 'All checks passed');
process.exit(failures ? 1 : 0);
