AP.screens = AP.screens || {};

AP.screens.food = (() => {
  const $ = id => document.getElementById(id);
  let partyNext = false;

  function init() {
    $('food-choices').addEventListener('click', e => {
      const card = e.target.closest('button[data-id]');
      if (!card || card.disabled) return;
      $('food-choices').querySelectorAll('button').forEach(b => (b.disabled = true));
      card.classList.add('chosen');
      AP.state.round.foods.push(card.dataset.id);
      setTimeout(() => (partyNext ? AP.show('party') : AP.show('quiz', { resume: true })), 600);
    });
  }

  function enter({ party }) {
    partyNext = party;
    $('food-choices').innerHTML = AP.round
      .foodChoices(AP.state.round)
      .map(f => `
        <button class="food-card" data-id="${f.id}">
          <span class="food-icon">${f.emoji}</span>
          <span class="food-name">${f.name}</span>
        </button>`)
      .join('');
  }

  return { init, enter };
})();
