AP.screens = AP.screens || {};

// Placeholder party: the full scene with eating and dancing arrives in phase 3.
AP.screens.party = (() => {
  const $ = id => document.getElementById(id);

  function init() {
    $('party-home').addEventListener('click', () => AP.show('home'));
    $('party-ants').addEventListener('click', e => {
      const btn = e.target.closest('button[data-index]');
      if (!btn) return;
      const ant = AP.state.round.ants[Number(btn.dataset.index)];
      $('party-hello').textContent = `I'm ${ant.name}! I carried ${ant.fact} 🎉`;
    });
  }

  function enter() {
    const { ants, foods } = AP.state.round;
    $('party-foods').innerHTML = foods
      .map(id => AP.config.foods.find(f => f.id === id))
      .map(f => `<span class="party-food" title="${f.name}">${f.emoji}</span>`)
      .join('');
    $('party-ants').innerHTML = ants
      .map((ant, i) => `
        <button class="party-ant" data-index="${i}" style="--dance-delay:${(i % 5) * -0.18}s">
          ${AP.ants.render(ant, ['dance'])}
          <span class="party-ant-name">${ant.name}</span>
        </button>`)
      .join('');
    $('party-hello').textContent = 'Tap an ant to say hello!';
  }

  return { init, enter };
})();
