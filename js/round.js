window.AP = window.AP || {};

// One round: M questions, a food choice every N, then the party.
AP.round = (() => {
  const { rand, shuffle } = AP.util;
  const RECENT = 4;

  function create(settings) {
    return {
      settings: JSON.parse(JSON.stringify(settings)), // fixed for the whole round
      done: 0,
      ants: [],
      foods: [],
      retryQueue: [], // { q, dueAt } — facts missed first time, asked again later
      recent: [],
    };
  }

  function nextQuestion(r, stats) {
    const due = r.retryQueue.findIndex(item => item.dueAt <= r.done);
    if (due >= 0) return r.retryQueue.splice(due, 1)[0].q;
    return AP.questions.pickNext(r.settings, stats, r.recent);
  }

  // Call once a question is finished (answered, or the answer was shown).
  function complete(r, q, firstTry) {
    r.done += 1;
    r.recent = [q.key, ...r.recent].slice(0, RECENT);
    if (!firstTry) r.retryQueue.push({ q, dueAt: r.done + rand(3, 5) });

    const ant = AP.ants.create(q, firstTry, r.ants);
    r.ants.push(ant);
    return {
      ant,
      food: r.done % r.settings.foodEvery === 0,
      party: r.done >= r.settings.partyAt,
    };
  }

  // Foods already on the table aren't offered again, unless the menu runs out.
  function foodChoices(r, count = 3) {
    const menu = AP.config.foods;
    let pool = menu.filter(f => !r.foods.includes(f.id));
    if (pool.length < count) pool = menu;
    return shuffle(pool).slice(0, count);
  }

  return { create, nextQuestion, complete, foodChoices };
})();
