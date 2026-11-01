AP.screens = AP.screens || {};

// Grown-ups' progress view: a 12×12 grid of the × or ÷ facts coloured by how well
// each is known, and a list of the +/− skills.
AP.screens.progress = (() => {
  const $ = id => document.getElementById(id);
  const LABELS = { strong: 'Strong', getting: 'Getting there', tricky: 'Tricky', new: 'Not tried yet' };
  const SKILLS = [
    ['add100-plain', 'Adding to 100'],
    ['add100-carry', 'Adding to 100, with carrying'],
    ['sub100-plain', 'Subtracting to 100'],
    ['sub100-borrow', 'Subtracting to 100, with borrowing'],
    ['add1000-plain', 'Adding to 1000'],
    ['add1000-carry', 'Adding to 1000, with carrying'],
    ['sub1000-plain', 'Subtracting to 1000'],
    ['sub1000-borrow', 'Subtracting to 1000, with borrowing'],
  ];
  let mode = 'mul';

  function init() {
    $('progress-back').addEventListener('click', () => AP.show('settings'));
    $('progress-tabs').addEventListener('click', e => {
      const tab = e.target.closest('[data-mode]');
      if (!tab) return;
      mode = tab.dataset.mode;
      render();
    });
    $('progress-grid').addEventListener('click', e => {
      const cell = e.target.closest('[data-detail]');
      if (cell) $('progress-detail').textContent = cell.dataset.detail;
    });
  }

  function enter() {
    render();
  }

  function describe(text, rating, s) {
    if (!s) return `${text}: not tried yet`;
    const times = s.n === 1 ? 'once' : `${s.n} times`;
    return `${text}: ${LABELS[rating].toLowerCase()}. Asked ${times}, about ${(s.ms / 1000).toFixed(1)}s to answer.`;
  }

  function render() {
    const { stats, settings } = AP.state;
    const sign = mode === 'mul' ? '×' : '÷';
    $('progress-tabs').querySelectorAll('[data-mode]').forEach(tab => {
      tab.setAttribute('aria-selected', String(tab.dataset.mode === mode));
    });

    // Rows are the tables. For ÷, a row is the number divided by and a column the answer.
    const counts = { strong: 0, getting: 0, tricky: 0, new: 0 };
    let html = `<span class="hm-head">${sign}</span>`;
    for (let b = 1; b <= 12; b++) html += `<span class="hm-head">${b}</span>`;
    for (let a = 1; a <= 12; a++) {
      const off = settings.tables.includes(a) ? '' : ' off';
      html += `<span class="hm-head${off}">${a}</span>`;
      for (let b = 1; b <= 12; b++) {
        const key = mode === 'mul' ? `${a}x${b}` : `${a * b}/${a}`;
        const text = mode === 'mul' ? `${a} × ${b} = ${a * b}` : `${a * b} ÷ ${a} = ${b}`;
        const rating = AP.questions.rating(mode, stats[key]);
        counts[rating]++;
        html += `<button class="hm-cell ${rating}${off}" data-detail="${describe(text, rating, stats[key])}" aria-label="${text}, ${LABELS[rating]}"></button>`;
      }
    }
    $('progress-grid').innerHTML = html;
    $('progress-detail').textContent = 'Tap a square for details.';
    $('progress-counts').innerHTML = Object.keys(LABELS)
      .map(r => `<span><span class="swatch ${r}"></span>${LABELS[r]}: <strong>${counts[r]}</strong></span>`)
      .join('');

    $('progress-skills').innerHTML = SKILLS.map(([key, label]) => {
      const rating = AP.questions.rating(key.includes('1000') ? 'addsub1000' : 'addsub100', stats[key]);
      return `<li><span class="swatch ${rating}"></span>${label}<span class="skill-rating">${LABELS[rating]}</span></li>`;
    }).join('');
  }

  return { init, enter };
})();
