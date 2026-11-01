AP.screens = AP.screens || {};

// The party: foods on a picnic blanket, some ants nibbling them, the rest dancing.
// Everything is placed by its base point in % of the scene, and sized in cqw
// (% of the scene's width), so the scene scales to any screen.
AP.screens.party = (() => {
  const $ = id => document.getElementById(id);
  const ANT_W = 12;   // cqw, before perspective
  const FOOD_W = 15;
  const WALK_MS = 1800;
  const STAGGER_MS = 90;
  const BUBBLE_MS = 4000;

  // Things further back (higher up the scene) are drawn smaller.
  const depth = y => 0.7 + 0.4 * (y / 100);

  // Where dancers stand: y in % of height, x range in % of width. Filled in this order.
  const DANCE_ROWS = [
    { y: 38, from: 10, to: 90 },
    { y: 88, from: 8, to: 92 },
    { y: 31, from: 16, to: 78 },
    { y: 97, from: 8, to: 92 },
  ];

  // Works out where every food and ant goes. Pure: no DOM.
  function layout(antCount, foodCount) {
    const rows = foodCount <= 2 ? 1 : foodCount <= 6 ? 2 : 3;
    const perRow = Math.ceil(foodCount / rows);
    const spacing = 64 / perRow;
    const shrink = Math.min(1, spacing / 22);
    const rowYs = { 1: [64], 2: [56, 71], 3: [52, 63, 74] }[rows];

    const foods = [];
    for (let i = 0; i < foodCount; i++) {
      const row = Math.floor(i / perRow);
      const inRow = Math.min(perRow, foodCount - row * perRow);
      const y = rowYs[row];
      const x = 50 + ((i % perRow) - (inRow - 1) / 2) * spacing;
      foods.push({ x, y, w: FOOD_W * shrink * depth(y) });
    }

    // Eaters stand either side of each food, facing it (one side only if crowded).
    const ants = [];
    const sides = spacing >= 28 ? [-1, 1] : [-1];
    foods.forEach((f, food) => {
      for (const side of sides) {
        if (ants.length >= antCount) break;
        const y = f.y + 2;
        ants.push({ x: f.x + side * (f.w / 2 + 3), y, w: ANT_W * shrink * depth(y), role: 'eat', faceLeft: side > 0, food });
      }
    });

    // Everyone else dances. Shrink the dancers until they all fit in the rows.
    const dancers = antCount - ants.length;
    let k = 1;
    const capacity = row => Math.floor((row.to - row.from) / (ANT_W * depth(row.y) * k * 0.95));
    while (k > 0.3 && DANCE_ROWS.reduce((n, row) => n + capacity(row), 0) < dancers) k *= 0.9;

    const counts = DANCE_ROWS.map(() => 0);
    for (let placed = 0, r = 0; placed < dancers; r = (r + 1) % DANCE_ROWS.length) {
      if (counts[r] < capacity(DANCE_ROWS[r])) {
        counts[r]++;
        placed++;
      }
    }
    DANCE_ROWS.forEach((row, r) => {
      const gap = (row.to - row.from) / counts[r];
      for (let j = 0; j < counts[r]; j++) {
        const y = row.y + (Math.random() - 0.5) * 2;
        ants.push({
          x: row.from + (j + 0.5) * gap + (Math.random() - 0.5) * gap * 0.3,
          y,
          w: ANT_W * k * depth(y),
          role: 'dance',
          faceLeft: Math.random() < 0.5,
        });
      }
    });
    return { foods, ants };
  }

  function bunting() {
    const colours = ['#e4572e', '#f4c430', '#3fa9f5', '#ff7eb6', '#9b5de5', '#00c2a8'];
    const flags = Array.from({ length: 11 }, (_, i) => {
      const t = (i + 0.5) / 11;
      const x = 100 * t;
      const y = 2 + 20 * t * (1 - t); // the quadratic rope M0 2 Q50 12 100 2
      return `<path d="M${x - 3.6} ${y} L${x + 3.6} ${y} L${x} ${y + 7} Z" fill="${colours[i % colours.length]}"/>`;
    }).join('');
    return `
      <svg class="party-bunting" viewBox="0 0 100 16" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 2 Q50 12 100 2" fill="none" stroke="#5d3a1a" stroke-width=".6"/>${flags}
      </svg>`;
  }

  function confetti() {
    const colours = [...AP.config.antTrims, '#e4572e'];
    return Array.from({ length: 28 }, (_, i) => {
      const style = [
        `left:${(Math.random() * 100).toFixed(1)}%`,
        `background:${colours[i % colours.length]}`,
        `animation-duration:${(3 + Math.random() * 3).toFixed(2)}s`,
        `animation-delay:${(-Math.random() * 6).toFixed(2)}s`,
      ].join(';');
      return `<span class="confetti" style="${style}"></span>`;
    }).join('');
  }

  // Positions an element by its base point.
  const place = (x, y, w) => `left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;--w:${w.toFixed(2)}cqw;z-index:${Math.round(y * 10)}`;

  let bubbleTimer = 0;
  let party = null;      // the ants and foods on show
  let fromAlbum = false; // a saved party, rather than the round just finished

  function init() {
    $('party-home').addEventListener('click', () => AP.show(fromAlbum ? 'album' : 'home'));
    $('party-save').addEventListener('click', save);
    $('party-scene').addEventListener('click', e => {
      const btn = e.target.closest('.party-ant');
      if (btn) sayHello(btn);
    });
  }

  // opts.saved: an album entry to show instead of the current round.
  function enter(opts = {}) {
    fromAlbum = !!opts.saved;
    party = opts.saved || AP.state.round;
    $('party-title').textContent = fromAlbum ? `Party on ${AP.album.formatDate(party.date)}` : '🎉 Ant Party! 🎉';
    $('party-home').textContent = fromAlbum ? 'Back to album' : 'Back home';
    $('party-save').hidden = fromAlbum;
    showSaved(!fromAlbum && party.savedToAlbum);
    draw();
  }

  function save() {
    const round = AP.state.round;
    if (round.savedToAlbum) return;
    if (AP.album.add(round)) {
      round.savedToAlbum = true;
      showSaved(true);
    } else {
      $('party-save').textContent = "Couldn't save, sorry";
    }
  }

  function showSaved(saved) {
    $('party-save').disabled = saved;
    $('party-save').textContent = saved ? 'Saved to album ✓' : '📸 Save to album';
  }

  function draw() {
    const { ants, foods } = party;
    const plan = layout(ants.length, foods.length);
    const eaten = new Set(plan.ants.filter(a => a.role === 'eat').map(a => a.food));

    const foodHtml = plan.foods.map((f, i) => `
      <div class="party-item party-food${eaten.has(i) ? ' eaten' : ''}" style="${place(f.x, f.y, f.w)}" title="${AP.food.byId(foods[i]).name}">
        ${AP.food.svg(foods[i])}
      </div>`).join('');

    // Ants start off-screen on the nearer side and walk to their places.
    const antHtml = plan.ants.map((spot, i) => {
      const fromLeft = spot.x < 50;
      return `
        <button class="party-item party-ant" data-index="${i}" aria-label="${ants[i].name}"
          style="${place(fromLeft ? -12 : 112, spot.y, spot.w)};transition-delay:${i * STAGGER_MS}ms;--dance-delay:${(-Math.random()).toFixed(2)}s">
          ${AP.ants.render(ants[i], fromLeft ? ['walking'] : ['walking', 'face-left'])}
        </button>`;
    }).join('');

    const scene = $('party-scene');
    scene.innerHTML = `
      <div class="party-sun"></div>
      ${bunting()}
      <div class="party-item party-tent" style="${place(84, 33, 20)}">${AP.scenery.tent()}</div>
      <div class="party-blanket"></div>
      ${foodHtml}
      ${antHtml}
      ${confetti()}
      <div class="party-bubble" id="party-bubble" role="status" hidden></div>`;

    const buttons = scene.querySelectorAll('.party-ant');
    // Two frames so the start position is painted before the walk begins.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      buttons.forEach((btn, i) => (btn.style.left = `${plan.ants[i].x.toFixed(1)}%`));
    }));
    // Once each ant arrives, it starts eating or dancing.
    plan.ants.forEach((spot, i) => {
      setTimeout(() => {
        const ant = buttons[i].querySelector('.ant');
        ant.classList.remove('walking');
        ant.classList.toggle('face-left', spot.faceLeft);
        ant.classList.add(spot.role);
      }, WALK_MS + i * STAGGER_MS);
    });
  }

  // Tapping an ant: it hops, and says which question it carried.
  function sayHello(btn) {
    const ant = party.ants[Number(btn.dataset.index)];
    const scene = $('party-scene');
    const bubble = $('party-bubble');
    const s = scene.getBoundingClientRect();
    const r = btn.getBoundingClientRect();

    btn.classList.remove('hop');
    void btn.offsetWidth;
    btn.classList.add('hop');

    bubble.innerHTML = `<strong>I'm ${ant.name}!</strong><br>I carried ${ant.fact} 🎉`;
    bubble.hidden = false;
    const half = Math.min(bubble.offsetWidth / 2, s.width / 2);
    bubble.style.left = `${AP.util.clamp(r.left + r.width / 2 - s.left, half + 4, s.width - half - 4)}px`;
    bubble.style.top = `${Math.max(r.top - s.top, bubble.offsetHeight + 12)}px`;
    bubble.classList.remove('pop');
    void bubble.offsetWidth;
    bubble.classList.add('pop');

    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => (bubble.hidden = true), BUBBLE_MS);
  }

  return { init, enter, layout };
})();
