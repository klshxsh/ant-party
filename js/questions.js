window.AP = window.AP || {};

// Question generation and weak-fact weighting.
//
// × and ÷ are tracked per fact ("7x8", "56/7"). +/− have far too many possible
// questions to track one by one, so they are tracked per sign pattern ("add-pn" is
// 8 + (−5)) and the numbers are made up fresh each time, within the grown-ups' range.
AP.questions = (() => {
  const { rand, pick, weightedPick } = AP.util;

  // Average answer time (ms) above which a fact counts as slow.
  const SLOW_MS = { mul: 6000, div: 7000, addsub: 12000 };
  // Ignore anything longer: the child probably wandered off.
  const MAX_MS = 60000;

  // +/− buckets by the signs of the two numbers: p = positive, n = negative.
  // ans narrows the answer's sign where that makes a different skill (5 − 13).
  const BUCKETS = [
    { key: 'add-pp', op: '+', a: 'p', b: 'p' },
    { key: 'sub-pp', op: '-', a: 'p', b: 'p', ans: 'p' },
    { key: 'sub-below0', op: '-', a: 'p', b: 'p', ans: 'n' },
    { key: 'add-pn', op: '+', a: 'p', b: 'n' },
    { key: 'add-np', op: '+', a: 'n', b: 'p' },
    { key: 'add-nn', op: '+', a: 'n', b: 'n' },
    { key: 'sub-pn', op: '-', a: 'p', b: 'n' },
    { key: 'sub-np', op: '-', a: 'n', b: 'p' },
    { key: 'sub-nn', op: '-', a: 'n', b: 'n' },
  ];

  function factors(settings) {
    const all = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    return settings.skipEasy ? all.filter(n => n !== 1 && n !== 10) : all;
  }

  function factsFor(type, settings) {
    if (type === 'mul' || type === 'div') {
      const out = [];
      for (const a of settings.tables) {
        for (const b of factors(settings)) {
          out.push({ type, a, b, key: type === 'mul' ? `${a}x${b}` : `${a * b}/${a}`, base: 1 });
        }
      }
      return out;
    }
    // Only the patterns that fit in the range, e.g. none with negatives when it starts at 1.
    return BUCKETS.filter(bucket => bounds(bucket, settings)).map(bucket => ({ type, ...bucket, base: 1 }));
  }

  function hasCarry(a, b) {
    for (; a || b; a = Math.floor(a / 10), b = Math.floor(b / 10)) {
      if ((a % 10) + (b % 10) >= 10) return true;
    }
    return false;
  }

  function hasBorrow(a, b) {
    for (; b; a = Math.floor(a / 10), b = Math.floor(b / 10)) {
      if (a % 10 < b % 10) return true;
    }
    return false;
  }

  // Carrying or borrowing in the sum worked on the sizes of the numbers:
  // −27 + 15 is really 27 − 15.
  function regroups(a, d) {
    const [x, y] = [Math.abs(a), Math.abs(d)];
    return (a < 0) === (d < 0) ? hasCarry(x, y) : hasBorrow(Math.max(x, y), Math.min(x, y));
  }

  // Both numbers and the answer stay within [addsubMin, addsubMax], and neither
  // number is 0. The answer is a + d, where d is b for + and −b for −. Returns the
  // values a can take (and the limits for d and the answer), or null when the
  // bucket can't be made in this range.
  function bounds(fact, settings) {
    const { addsubMin: min, addsubMax: max } = settings;
    const span = sign => (sign === 'p' ? [1, max] : [min, -1]);
    const [aLo, aHi] = span(fact.a);
    const [bLo, bHi] = span(fact.b);
    const [dLo, dHi] = fact.op === '+' ? [bLo, bHi] : [-bHi, -bLo];
    const lo = fact.ans === 'p' ? Math.max(min, 1) : min;
    const hi = fact.ans === 'n' ? Math.min(max, -1) : max;
    if (aLo > aHi || bLo > bHi || lo > hi) return null;
    const from = Math.max(aLo, lo - dHi);
    const to = Math.min(aHi, hi - dLo);
    return from <= to ? { from, to, dLo, dHi, lo, hi } : null;
  }

  // Makes up numbers for a +/− bucket. Two times in three it looks for carrying or
  // borrowing (the useful practice). It avoids round numbers like 30 and numbers under
  // a tenth of the range, like 2 when it goes to 100 (too easy). Some ranges can't
  // manage both (from −1000 to 1, the only positive number is 1), so it keeps the best
  // try, and carrying or borrowing counts for more than avoiding easy numbers.
  function addSubNumbers(fact, settings) {
    const r = bounds(fact, settings);
    const small = Math.max(-settings.addsubMin, settings.addsubMax) / 10;
    const wantRegroup = Math.random() < 2 / 3;
    let best = null;
    let bestScore = -1;
    for (let attempt = 0; attempt < 30 && bestScore < 3; attempt++) {
      const a = rand(r.from, r.to);
      const d = rand(Math.max(r.dLo, r.lo - a), Math.min(r.dHi, r.hi - a));
      const tooEasy = [a, d].some(n => Math.abs(n) < small || (Math.abs(n) >= 10 && n % 10 === 0));
      const score = 2 * (regroups(a, d) === wantRegroup) + !tooEasy;
      if (score > bestScore) [best, bestScore] = [[a, d], score];
    }
    const [a, d] = best;
    return [a, fact.op === '+' ? d : -d];
  }

  function build(fact, settings) {
    if (fact.type === 'mul') {
      const [x, y] = Math.random() < 0.5 ? [fact.a, fact.b] : [fact.b, fact.a];
      return { type: fact.type, key: fact.key, text: `${x} × ${y}`, answer: fact.a * fact.b };
    }
    if (fact.type === 'div') {
      return { type: fact.type, key: fact.key, text: `${fact.a * fact.b} ÷ ${fact.a}`, answer: fact.b };
    }
    const [a, b] = addSubNumbers(fact, settings);
    const { formatNumber } = AP.util;
    // A negative second number goes in brackets: 8 − (−5).
    const second = b < 0 ? `(${formatNumber(b)})` : formatNumber(b);
    return fact.op === '+'
      ? { type: fact.type, key: fact.key, text: `${formatNumber(a)} + ${second}`, answer: a + b }
      : { type: fact.type, key: fact.key, text: `${formatNumber(a)} − ${second}`, answer: a - b };
  }

  // Higher weight = asked more often. Unseen facts get a small nudge.
  function weight(fact, s) {
    let w = fact.base;
    if (!s) return w + 0.5;
    w += 4 * s.err;
    if (s.ms > SLOW_MS[fact.type]) w += 1;
    if (s.ms > 2 * SLOW_MS[fact.type]) w += 1;
    return w;
  }

  function enabledTypes(settings) {
    return Object.keys(settings.types).filter(t => settings.types[t] && SLOW_MS[t]);
  }

  // Whether an answer can be below zero, so the keypad needs a minus key.
  function negatives(settings) {
    return !!settings.types.addsub && settings.addsubMin < 0;
  }

  // recentKeys: keys asked in the last few questions, avoided when possible.
  function pickNext(settings, stats, recentKeys) {
    const type = pick(enabledTypes(settings));
    const facts = factsFor(type, settings);
    const fresh = facts.filter(f => !recentKeys.includes(f.key));
    const fact = weightedPick(fresh.length ? fresh : facts, f => weight(f, stats[f.key]));
    return build(fact, settings);
  }

  // err and ms are moving averages, so a fact stops being "weak" once it's learned.
  function record(stats, q, firstTry, ms) {
    const s = stats[q.key];
    const miss = firstTry ? 0 : 1;
    ms = Math.min(ms, MAX_MS);
    stats[q.key] = s
      ? { n: s.n + 1, err: s.err * 0.7 + miss * 0.3, ms: Math.round(s.ms * 0.7 + ms * 0.3) }
      : { n: 1, err: miss, ms: Math.round(ms) };
  }

  // How well a fact is known, for the grown-ups' progress view.
  function rating(type, s) {
    if (!s) return 'new';
    if (s.err >= 0.4 || s.ms > 2 * SLOW_MS[type]) return 'tricky';
    if (s.n < 2 || s.err >= 0.15 || s.ms > SLOW_MS[type]) return 'getting';
    return 'strong';
  }

  return { pickNext, record, rating, factsFor, enabledTypes, negatives, hasCarry, hasBorrow, regroups };
})();
