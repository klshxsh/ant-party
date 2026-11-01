window.AP = window.AP || {};

// Ants are plain data, so the same ant can be drawn on its walk, at the party
// and in the album. render() turns that data into a side-on SVG ant facing right.
//
// Animation is all CSS (see "Ants" in style.css), switched on by classes on the
// wrapper: walking, cheer, dance, face-left.
AP.ants = (() => {
  const { pick } = AP.util;
  const { antNames, antColours, antAccessories, antTrims } = AP.config;

  // The ant that pops up to encourage after a wrong answer.
  const coach = { name: 'Coach', colour: '#e4572e', accessory: 'partyHat', trim: '#f4c430', size: 1 };

  function create(q, firstTry, existing) {
    const used = new Set(existing.map(a => a.name));
    const free = antNames.filter(n => !used.has(n));
    return {
      name: free.length ? pick(free) : `${pick(antNames)} ${existing.length + 1}`,
      colour: pick(antColours),
      accessory: pick(antAccessories),
      trim: pick(antTrims),
      size: 0.9 + Math.random() * 0.2,
      fact: `${q.text} = ${q.answer}`,
      firstTry,
    };
  }

  // Lightens (amount > 0) or darkens (amount < 0) a #rrggbb colour.
  function shade(hex, amount) {
    const n = parseInt(hex.slice(1), 16);
    return '#' + [n >> 16, (n >> 8) & 255, n & 255]
      .map(c => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount))
      .map(c => c.toString(16).padStart(2, '0'))
      .join('');
  }

  // Six legs, swung in two tripods (a/b) for the walk. Each rotates about its hip.
  // "far" legs are on the other side of the body, so they're drawn first and paler.
  const LEGS = [
    { pos: 'back', side: 'near', group: 'a', hip: [46, 42], d: 'M46 42 L38 52 L35 62' },
    { pos: 'mid', side: 'near', group: 'b', hip: [52, 44], d: 'M52 44 L53 54 L50 63' },
    { pos: 'front', side: 'near', group: 'a', hip: [58, 42], d: 'M58 42 L66 51 L70 61' },
    { pos: 'back', side: 'far', group: 'b', hip: [50, 41], d: 'M50 41 L43 51 L41 60' },
    { pos: 'mid', side: 'far', group: 'a', hip: [56, 43], d: 'M56 43 L58 53 L56 61' },
    { pos: 'front', side: 'far', group: 'b', hip: [62, 41], d: 'M62 41 L70 49 L75 58' },
  ];

  function legs(side, colour) {
    return LEGS.filter(l => l.side === side)
      .map(l => `<path class="leg ${l.pos} ${l.side} ${l.group}" d="${l.d}" stroke="${colour}" style="transform-origin:${l.hip[0]}px ${l.hip[1]}px"/>`)
      .join('');
  }

  // Hats and things, drawn in the ant's trim colour. The head is a circle at (72, 30), r 13.
  const ACCESSORIES = {
    partyHat: t => `
      <g transform="rotate(-14 66 19)">
        <path d="M58 21 L66 -3 L74 21 Z" fill="${t}" stroke="${shade(t, -0.3)}" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M61 13 L71 13 M63 6 L69 6" stroke="#fff" stroke-width="2" opacity=".8"/>
        <circle cx="66" cy="-4" r="3.2" fill="#fff"/>
      </g>`,
    topHat: t => `
      <g transform="rotate(-12 66 19)">
        <rect x="59" y="2" width="14" height="17" rx="2" fill="#2b2b2b"/>
        <rect x="59" y="13" width="14" height="3.5" fill="${t}"/>
        <ellipse cx="66" cy="19.5" rx="11" ry="2.8" fill="#2b2b2b"/>
      </g>`,
    crown: t => `
      <g transform="rotate(-12 66 19)">
        <path d="M57 20 L57 9 L61.5 14 L66 5 L70.5 14 L75 9 L75 20 Z" fill="#f4c430" stroke="#c99a00" stroke-width="1.2" stroke-linejoin="round"/>
        <circle cx="61" cy="17" r="1.6" fill="${t}"/><circle cx="66" cy="16" r="1.8" fill="${t}"/><circle cx="71" cy="17" r="1.6" fill="${t}"/>
      </g>`,
    bow: t => `
      <g fill="${t}" stroke="${shade(t, -0.3)}" stroke-width="1" stroke-linejoin="round">
        <path d="M64 18 L54 11 L55 24 Z"/>
        <path d="M64 18 L72 8 L75 20 Z"/>
        <circle cx="64" cy="18" r="2.6"/>
      </g>`,
    flower: t => `
      <g transform="translate(63 17)">
        ${[0, 72, 144, 216, 288].map(a => `<circle cx="${(4.2 * Math.cos((a * Math.PI) / 180)).toFixed(1)}" cy="${(4.2 * Math.sin((a * Math.PI) / 180)).toFixed(1)}" r="3.4" fill="${t}"/>`).join('')}
        <circle r="2.6" fill="#f4c430"/>
      </g>`,
    sunglasses: t => `
      <path d="M62 26 L71 25.5" stroke="#2b2b2b" stroke-width="1.6"/>
      <rect x="70.5" y="23" width="12.5" height="9" rx="3.5" fill="#2b2b2b" stroke="${t}" stroke-width="1.4"/>
      <path d="M73 25.5 L76 25.5" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>`,
    scarf: t => `
      <g fill="none" stroke-linecap="round">
        <path d="M61 43 Q56 48 49 50" stroke="${t}" stroke-width="5"/>
        <path d="M50 47.5 L48.5 52.5" stroke="${shade(t, -0.3)}" stroke-width="1.4"/>
        <path d="M59.5 32 Q57.5 39 63.5 44.5" stroke="${t}" stroke-width="7"/>
        <path d="M58.6 37 L62.4 36.2" stroke="${shade(t, -0.3)}" stroke-width="1.4"/>
      </g>`,
    bowtie: t => `
      <g fill="${t}" stroke="${shade(t, -0.3)}" stroke-width="1" stroke-linejoin="round">
        <path d="M63 42 L56.5 37.5 L57 46.5 Z"/>
        <path d="M63 42 L69.5 37.5 L69 46.5 Z"/>
        <circle cx="63" cy="42" r="2"/>
      </g>`,
  };

  function svg(ant) {
    const dark = shade(ant.colour, -0.45);
    const far = shade(ant.colour, -0.2);
    const accessory = (ACCESSORIES[ant.accessory] || (() => ''))(ant.trim || '#f4c430');
    const blink = `animation-delay:${(-Math.random() * 5).toFixed(2)}s`;
    return `
      <svg viewBox="0 -10 100 76" aria-hidden="true">
        <g class="ant-body">
          <g fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${legs('far', far)}</g>
          <g fill="none" stroke="${dark}" stroke-width="2" stroke-linecap="round">
            <g class="antenna" style="transform-origin:74px 19px"><path d="M74 19 Q72 7 81 3"/><circle cx="81" cy="3" r="2.4" fill="${dark}"/></g>
            <g class="antenna b" style="transform-origin:78px 20px"><path d="M78 20 Q83 10 90 8"/><circle cx="90" cy="8" r="2.4" fill="${dark}"/></g>
          </g>
          <g fill="${ant.colour}" stroke="${dark}" stroke-width="1.5">
            <ellipse cx="26" cy="40" rx="18" ry="13" transform="rotate(-8 26 40)"/>
            <circle cx="44" cy="41" r="3.2"/>
            <ellipse cx="53" cy="38" rx="10" ry="7"/>
            <circle cx="72" cy="30" r="13"/>
          </g>
          <ellipse cx="20" cy="34" rx="7" ry="3.5" fill="#fff" opacity=".28" transform="rotate(-15 20 34)"/>
          <ellipse cx="67" cy="23" rx="4.5" ry="2.5" fill="#fff" opacity=".28"/>
          <g class="eye" style="${blink}">
            <circle cx="77" cy="28" r="5.5" fill="#fff"/>
            <circle cx="78.5" cy="28.5" r="3.2" fill="#1b1b1b"/>
            <circle cx="79.6" cy="27.2" r="1.2" fill="#fff"/>
          </g>
          <ellipse cx="70" cy="35" rx="3" ry="1.8" fill="#ff8fa3" opacity=".6"/>
          <path d="M73 36.5 Q77 40.5 81.5 37" fill="none" stroke="${dark}" stroke-width="1.6" stroke-linecap="round"/>
          ${accessory}
          <g fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${legs('near', dark)}</g>
        </g>
      </svg>`;
  }

  // classes: any of 'walking', 'cheer', 'dance', 'face-left'.
  function render(ant, classes = []) {
    return `<span class="ant ${classes.join(' ')}" style="--ant-scale:${ant.size || 1}">${svg(ant)}</span>`;
  }

  return { create, render, coach };
})();
