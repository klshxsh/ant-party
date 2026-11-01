AP.screens = AP.screens || {};

AP.screens.food = (() => {
  const $ = id => document.getElementById(id);
  let partyNext = false;

  function init() {
    $('food-coach').innerHTML = AP.ants.render(AP.ants.coach, ['dance']);
    $('food-choices').addEventListener('click', e => {
      const card = e.target.closest('button[data-id]');
      if (!card || card.disabled) return;
      $('food-choices').querySelectorAll('button').forEach(b => (b.disabled = true));
      card.classList.add('chosen'); // the food flies off to the party
      AP.state.round.foods.push(card.dataset.id);
      setTimeout(() => (partyNext ? AP.show('party') : AP.show('quiz', { resume: true })), 900);
    });
  }

  function enter({ party }) {
    partyNext = party;
    $('food-choices').innerHTML = AP.round
      .foodChoices(AP.state.round)
      .map(f => `
        <button class="food-card" data-id="${f.id}">
          <span class="food-icon">${AP.food.svg(f.id)}</span>
          <span class="food-name">${f.name}</span>
        </button>`)
      .join('');
  }

  return { init, enter };
})();
