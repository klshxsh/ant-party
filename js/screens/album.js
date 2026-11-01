AP.screens = AP.screens || {};

AP.screens.album = (() => {
  const $ = id => document.getElementById(id);
  const ANTS_SHOWN = 5;
  const FOODS_SHOWN = 6;

  function init() {
    $('album-home').addEventListener('click', () => AP.show('home'));
    $('album-grid').addEventListener('click', e => {
      const card = e.target.closest('.album-card');
      const entry = card && AP.album.find(card.dataset.id);
      if (entry) AP.show('party', { saved: entry });
    });
  }

  function enter() {
    const entries = AP.album.list();
    $('album-empty').hidden = entries.length > 0;
    $('album-grid').innerHTML = entries.map(card).join('');
  }

  function card(entry) {
    const more = entry.ants.length - ANTS_SHOWN;
    return `
      <button class="album-card" data-id="${entry.id}">
        <span class="album-date">${AP.album.formatDate(entry.date)}</span>
        <span class="album-foods">${entry.foods.slice(0, FOODS_SHOWN).map(AP.food.svg).join('')}</span>
        <span class="album-ants">
          ${entry.ants.slice(0, ANTS_SHOWN).map(a => AP.ants.render(a)).join('')}
          ${more > 0 ? `<span class="album-more">+${more}</span>` : ''}
        </span>
        <span class="album-summary">${entry.summary.questions} questions · ${entry.summary.firstTry} right first time</span>
      </button>`;
  }

  return { init, enter };
})();
