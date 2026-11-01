// Sanity-checks the question generators and round logic outside the browser.
// Usage: node tools/check-questions.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const ctx = { window: {}, console, Math, JSON, Number, Array, Object, Set };
ctx.window = ctx;
vm.createContext(ctx);
for (const file of ['util.js', 'config.js', 'questions.js', 'ants.js', 'round.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'js', file), 'utf8'), ctx, { filename: file });
}
const { AP } = ctx;

let failures = 0;
function check(ok, message) {
  if (!ok) {
    failures++;
    if (failures <= 20) console.log('FAIL:', message);
  }
}

// Every question's text must evaluate to its answer, within the type's range.
const settings = JSON.parse(JSON.stringify(AP.config.defaults));
const counts = {};
for (let i = 0; i < 10000; i++) {
  const q = AP.questions.pickNext(settings, {}, []);
  const label = q.type === 'mul' || q.type === 'div' ? q.type : q.key;
  counts[label] = (counts[label] || 0) + 1;
  const [a, op, b] = q.text.split(' ');
  const x = Number(a);
  const y = Number(b);
  const expected = { '×': x * y, '÷': x / y, '+': x + y, '−': x - y }[op];
  check(expected === q.answer, `${q.text} gave ${q.answer}`);
  check(Number.isInteger(q.answer) && q.answer >= 0, `${q.text}: answer ${q.answer} not a whole number ≥ 0`);
  if (q.type === 'addsub100') check(x <= 100 && y <= 100 && q.answer <= 100, `${q.text} out of range`);
  if (q.type === 'addsub1000') check(x <= 1000 && y <= 1000 && q.answer <= 1000, `${q.text} out of range`);
  if (op === '−') check(q.answer >= (q.type === 'addsub1000' ? 30 : 6), `${q.text} is too trivial`);
  if (/carry$/.test(q.key)) check(AP.questions.hasCarry(x, y), `${q.text} should carry`);
  if (/borrow$/.test(q.key)) check(AP.questions.hasBorrow(x, y), `${q.text} should borrow`);
  if (/plain$/.test(q.key)) check(op === '+' ? !AP.questions.hasCarry(x, y) : !AP.questions.hasBorrow(x, y), `${q.text} should not regroup`);
}
console.log('Mix over 10,000 questions:', counts);

// Weak facts come up more often.
const stats = { '7x8': { n: 5, err: 1, ms: 15000 } };
const only = { ...settings, types: { mul: true, div: false, addsub100: false, addsub1000: false } };
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
