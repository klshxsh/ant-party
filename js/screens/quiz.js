AP.screens = AP.screens || {};

AP.screens.quiz = (() => {
  const $ = id => document.getElementById(id);
  const MAX_DIGITS = 4;
  const MIN_WALK_MS = 2000;

  let q = null;
  let input = '';
  let tries = 0;
  let shownAt = 0;
  let firstMs = 0;
  let locked = false;
  let signed = false; // answers can be negative, so there's a minus key

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
      else if ((e.key === '-' || e.key === '−') && signed) key = 'minus';
      else if (e.key === 'Backspace') key = 'back';
      else if (e.key === 'Enter') key = $('quiz-reveal-ok').hidden ? 'ok' : 'reveal-ok';
      if (!key) return;
      e.preventDefault(); // stops Enter also clicking whichever keypad button has focus
      if (key === 'reveal-ok') revealDone();
      else press(key);
    });

    $('quiz-reveal-ok').addEventListener('click', revealDone);
    $('quiz-home').addEventListener('click', () => {
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
    signed = AP.questions.negatives(AP.state.round.settings);
    $('quiz-keypad').classList.toggle('signed', signed);
    $('quiz-keypad').querySelector('[data-key="minus"]').hidden = !signed;
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
    // The encourager has said its piece; out of the way of the next try.
    hideEncourager();
    // input is what's typed, e.g. "-12". The minus key flips the sign at any point.
    const sign = input.startsWith('-') ? '-' : '';
    const digits = input.slice(sign.length);
    if (key === 'back') input = input.slice(0, -1);
    else if (key === 'minus') input = (sign ? '' : '-') + digits;
    else if (digits.length < MAX_DIGITS) input = sign + (digits === '0' ? '' : digits) + key;
    renderAnswer();
  }

  function submit() {
    if (!/[0-9]/.test(input)) return;
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
      showEncourager(`It's ${q.text} = ${AP.util.formatNumber(q.answer)}. We'll try that one again soon!`, true);
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
    box.textContent = input.replace('-', '−') || '?';
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
  // leaf, while the next question appears. Each ant has its own pace, so a quick
  // answer can send one ant past another.
  function walk(ant) {
    const width = $('quiz-walkers').offsetWidth;
    const speed = AP.config.antSpeeds[AP.state.round.settings.antSpeed] * (0.7 + Math.random() * 0.65);
    const ms = Math.max(MIN_WALK_MS, width / speed);
    const el = document.createElement('div');
    el.className = 'walker';
    el.style.animationDuration = `${Math.round(ms)}ms`;
    // Legs keep step with the pace: a stride every 36px or so.
    el.style.setProperty('--step', `${AP.util.clamp(36 / (width / ms) / 1000, 0.18, 0.6).toFixed(2)}s`);
    el.innerHTML = `${AP.ants.render(ant, ['walking'])}<span class="leaf">${AP.util.formatNumber(q.answer)}</span>`;
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
    // --plates lets the plates shrink to fit when there are lots of them.
    $('quiz-trail').innerHTML = `
      <div class="trail-track" style="--plates:${Math.floor(partyAt / foodEvery)}">
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
