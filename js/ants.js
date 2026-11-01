window.AP = window.AP || {};

// Ants are plain data, so the same ant can be drawn on its walk, at the party
// and in the album. Drawing is an emoji placeholder until the SVG ants (phase 2).
AP.ants = (() => {
  const { pick } = AP.util;
  const { antNames, antColours, antAccessories } = AP.config;

  function create(q, firstTry, existing) {
    const used = new Set(existing.map(a => a.name));
    const free = antNames.filter(n => !used.has(n));
    return {
      name: free.length ? pick(free) : `${pick(antNames)} ${existing.length + 1}`,
      colour: pick(antColours),
      accessory: pick(antAccessories),
      size: 0.9 + Math.random() * 0.2,
      fact: `${q.text} = ${q.answer}`,
      firstTry,
    };
  }

  function render(ant) {
    return `<span class="ant-placeholder" style="--ant:${ant.colour}">🐜</span>`;
  }

  return { create, render };
})();
