window.AP = window.AP || {};

// Question generation and weak-fact weighting.
//
// × and ÷ are tracked per fact ("7x8", "56/7"). +/− have far too many possible
// questions to track one by one, so they are tracked per skill bucket
// ("add100-carry", "sub1000-plain", ...) and the numbers are made up fresh each time.
AP.questions = (() => {
  const { rand, pick, weightedPick } = AP.util;

  // Average answer time (ms) above which a fact counts as slow.
  const SLOW_MS = { mul: 6000, div: 7000, addsub100: 12000, addsub1000: 20000 };
  // Ignore anything longer: the child probably wandered off.
  const MAX_MS = 60000;

  // Carrying/borrowing buckets get double weight: that's the useful practice.
  const BUCKETS = {
    addsub100: [
      { key: 'add100-carry', op: '+', regroup: true, base: 2 },
      { key: 'add100-plain', op: '+', regroup: false, base: 1 },
      { key: 'sub100-borrow', op: '-', regroup: true, base: 2 },
      { key: 'sub100-plain', op: '-', regroup: false, base: 1 },
    ],
    addsub1000: [
      { key: 'add1000-carry', op: '+', regroup: true, base: 2 },
      { key: 'add1000-plain', op: '+', regroup: false, base: 1 },
      { key: 'sub1000-borrow', op: '-', regroup: true, base: 2 },
      { key: 'sub1000-plain', op: '-', regroup: false, base: 1 },
    ],
  };

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
    return BUCKETS[type].map(bucket => ({ type, ...bucket }));
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

  // Makes up numbers for a +/− bucket. Operands avoid round numbers (too easy).
  function addSubNumbers(fact) {
    const big = fact.type === 'addsub1000';
    const round = big ? 100 : 10;
    for (let attempt = 0; attempt < 1000; attempt++) {
      let a, b;
      if (fact.op === '+') {
        a = big ? rand(101, 899) : rand(11, 89);
        b = big ? rand(101, 899) : rand(11, 89);
        if (a + b > (big ? 1000 : 100)) continue;
        if (hasCarry(a, b) !== fact.regroup) continue;
      } else {
        a = big ? rand(201, 1000) : rand(21, 100);
        b = big ? rand(101, a - 1) : rand(11, a - 1);
        if (a - b < (big ? 30 : 6)) continue; // e.g. 25 − 24 is too trivial
        if (hasBorrow(a, b) !== fact.regroup) continue;
      }
      if (a % round === 0 && fact.op === '+') continue;
      if (b % round === 0) continue;
      return [a, b];
    }
    // Practically unreachable, but never hand back a broken question.
    return fact.op === '+' ? [big ? 238 : 27, big ? 147 : 15] : [big ? 512 : 52, big ? 238 : 27];
  }

  function build(fact) {
    if (fact.type === 'mul') {
      const [x, y] = Math.random() < 0.5 ? [fact.a, fact.b] : [fact.b, fact.a];
      return { type: fact.type, key: fact.key, text: `${x} × ${y}`, answer: fact.a * fact.b };
    }
    if (fact.type === 'div') {
      return { type: fact.type, key: fact.key, text: `${fact.a * fact.b} ÷ ${fact.a}`, answer: fact.b };
    }
    const [a, b] = addSubNumbers(fact);
    return fact.op === '+'
      ? { type: fact.type, key: fact.key, text: `${a} + ${b}`, answer: a + b }
      : { type: fact.type, key: fact.key, text: `${a} − ${b}`, answer: a - b };
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

  // recentKeys: keys asked in the last few questions, avoided when possible.
  function pickNext(settings, stats, recentKeys) {
    const type = pick(enabledTypes(settings));
    const facts = factsFor(type, settings);
    const fresh = facts.filter(f => !recentKeys.includes(f.key));
    const fact = weightedPick(fresh.length ? fresh : facts, f => weight(f, stats[f.key]));
    return build(fact);
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

  return { pickNext, record, rating, factsFor, enabledTypes, hasCarry, hasBorrow };
})();
