AP.screens = AP.screens || {};

AP.screens.quiz = (() => {
  const $ = id => document.getElementById(id);
  const MAX_DIGITS = 4;
  const WALK_SPEED = 0.2; // px per ms

  let q = null;
  let input = '';
  let tries = 0;
  let shownAt = 0;
  let firstMs = 0;
  let locked = false;

  function init() {
    $('quiz-tent').innerHTML = AP.scenery.tent();
    $('quiz-keypad').addEventListener('click', e => {
      const key = e.target.closest('button[data-key]');
      if (key) press(key.dataset.key);
    });

    document.addEventListener('keydown', e => {
      if ($('screen-quiz').hidden) return;
      let key = null;
      if (/^[0-9]$/.test(e.key)) key = e.key;
      else if (e.key === 'Backspace') key = 'back';
      else if (e.key === 'Enter') key = $('quiz-reveal-ok').hidden ? 'ok' : 'reveal-ok';
      if (!key) return;
      e.preventDefault(); // stops Enter also clicking whichever keypad button has focus
      if (key === 'reveal-ok') revealDone();
      else press(key);
    });

    $('quiz-reveal-ok').addEventListener('click', revealDone);
    $('quiz-home').addEventListener('click', () => {
      if (!confirm('Leave this round? The ants will head home.')) return;
      AP.state.round = null; // cancels any pending timers below
      AP.show('home');
    });
  }

  // opts.resume: carry on with the current round (after choosing food).
  function enter(opts = {}) {
    if (!opts.resume) {
      AP.state.round = AP.round.create(AP.state.settings);
      $('quiz-walkers').innerHTML = '';
    }
    buildTrail();
    next();
  }

  function next() {
    q = AP.round.nextQuestion(AP.state.round, AP.state.stats);
    input = '';
    tries = 0;
    firstMs = 0;
    locked = false;
    shownAt = performance.now();
    $('quiz-question').textContent = `${q.text} =`;
    hideEncourager();
    renderAnswer();
  }

  function press(key) {
    if (locked) return;
    if (key === 'ok') return submit();
    if (key === 'back') input = input.slice(0, -1);
    else if (input.length < MAX_DIGITS) input = (input === '0' ? '' : input) + key;
    renderAnswer();
  }

  function submit() {
    if (!input) return;
    if (tries === 0) firstMs = performance.now() - shownAt;
    if (Number(input) === q.answer) correct();
    else wrong();
  }

  function correct() {
    locked = true;
    hideEncourager();
    renderAnswer('right');
    AP.audio.sfx('correct');
    const round = AP.state.round;
    setTimeout(() => AP.state.round === round && finish(tries === 0), 600);
  }

  function wrong() {
    tries += 1;
    locked = true;
    renderAnswer('wrong');
    AP.audio.sfx('wrong');
    const max = AP.state.round.settings.maxTries;
    if (max && tries >= max) {
      showEncourager(`It's ${q.text} = ${q.answer}. We'll try that one again soon!`, true);
      return;
    }
    showEncourager(AP.util.pick(AP.config.encouragements));
    const round = AP.state.round;
    setTimeout(() => {
      if (AP.state.round !== round) return;
      input = '';
      locked = false;
      renderAnswer();
    }, 500);
  }

  function revealDone() {
    if ($('quiz-reveal-ok').hidden) return;
    hideEncourager();
    finish(false);
  }

  function finish(firstTry) {
    const { stats, round } = AP.state;
    AP.questions.record(stats, q, firstTry, firstMs);
    AP.storage.save('stats', stats);

    const result = AP.round.complete(round, q, firstTry);
    walk(result.ant);
    updateTrail(true);

    // Give the ant a moment to set off before changing screen.
    const later = fn => setTimeout(() => AP.state.round === round && fn(), 1000);
    if (result.food) later(() => AP.show('food', { party: result.party }));
    else if (result.party) later(() => AP.show('party'));
    else next();
  }

  function renderAnswer(state) {
    const box = $('quiz-answer');
    box.textContent = input || '?';
    box.classList.toggle('empty', !input);
    box.classList.remove('right', 'wrong');
    if (state) {
      void box.offsetWidth; // restart the animation
      box.classList.add(state);
    }
  }

  function showEncourager(text, reveal = false) {
    $('quiz-bubble').textContent = text;
    $('quiz-reveal-ok').hidden = !reveal;
    $('quiz-coach').innerHTML = AP.ants.render(AP.ants.coach, ['cheer', 'face-left']);
    const el = $('quiz-encourager');
    el.hidden = false;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
    if (reveal) $('quiz-reveal-ok').focus();
  }

  function hideEncourager() {
    $('quiz-encourager').hidden = true;
    $('quiz-reveal-ok').hidden = true;
  }

  // The ant walks along the ground into the party tent, carrying its answer on a
  // leaf, while the next question appears.
  function walk(ant) {
    const el = document.createElement('div');
    el.className = 'walker';
    el.style.animationDuration = `${Math.max(2500, $('quiz-walkers').offsetWidth / WALK_SPEED)}ms`;
    el.innerHTML = `${AP.ants.render(ant, ['walking'])}<span class="leaf">${q.answer}</span>`;
    el.addEventListener('animationend', e => e.target === el && el.remove());
    $('quiz-walkers').appendChild(el);
    AP.audio.sfx('steps');
  }

  // Progress trail: a path to the tent, with a plate for each food stop. Plates fill
  // with the chosen food, and the latest ant walks along to show how far the round is.
  function buildTrail() {
    const { foodEvery, partyAt } = AP.state.round.settings;
    let plates = '';
    for (let k = foodEvery; k <= partyAt; k += foodEvery) {
      plates += `<span class="trail-plate" style="left:${(100 * k) / partyAt}%"></span>`;
    }
    $('quiz-trail').innerHTML = `
      <div class="trail-track">
        <div class="trail-fill"></div>
        ${plates}
        <div class="trail-leader"></div>
      </div>
      <div class="trail-tent">${AP.scenery.tent()}</div>
      <span class="trail-count"></span>`;
    updateTrail(false);
  }

  function updateTrail(moved) {
    const { done, settings, foods, ants } = AP.state.round;
    const trail = $('quiz-trail');
    const pct = `${(100 * done) / settings.partyAt}%`;
    trail.querySelector('.trail-fill').style.width = pct;
    trail.querySelector('.trail-count').textContent = `${done} / ${settings.partyAt}`;
    trail.querySelectorAll('.trail-plate').forEach((plate, i) => {
      const food = foods[i] && AP.food.byId(foods[i]);
      plate.classList.toggle('full', !!food);
      plate.innerHTML = food ? AP.food.svg(food.id) : '';
      plate.title = food ? food.name : '';
    });

    const leader = trail.querySelector('.trail-leader');
    leader.style.left = pct;
    leader.innerHTML = AP.ants.render(ants[ants.length - 1] || AP.ants.coach, moved ? ['walking'] : []);
    if (moved) setTimeout(() => leader.querySelector('.ant')?.classList.remove('walking'), 600);
  }

  return { init, enter };
})();
