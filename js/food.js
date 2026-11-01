window.AP = window.AP || {};

// SVG party foods, drawn on a 64×64 grid with the food sitting on the bottom edge,
// so they can be placed by their base point on the party blanket.
AP.food = (() => {
  const OUT = '#4a2e14'; // outline colour shared by all foods
  const line = `stroke="${OUT}" stroke-width="2" stroke-linejoin="round"`;

  // An isometric sugar cube standing on (x, y).
  function cube(x, y, s) {
    const h = s * 1.1;
    const L = [x - s, y - s / 2];
    const R = [x + s, y - s / 2];
    const pts = ps => ps.map(p => p.join(',')).join(' ');
    return `
      <polygon points="${pts([[x, y], L, [L[0], L[1] - h], [x, y - h]])}" fill="#eef2f5" ${line}/>
      <polygon points="${pts([[x, y], R, [R[0], R[1] - h], [x, y - h]])}" fill="#d5dde4" ${line}/>
      <polygon points="${pts([[x, y - h], [L[0], L[1] - h], [x, y - s - h], [R[0], R[1] - h]])}" fill="#fff" ${line}/>
      <circle cx="${x - 2}" cy="${y - h - s / 2}" r="1" fill="#c8d3dc"/><circle cx="${x + 3}" cy="${y - h - s / 2 + 1}" r="1" fill="#c8d3dc"/>`;
  }

  function strawberry(tx, ty, k) {
    const seeds = [[26, 32], [38, 32], [32, 40], [22, 42], [42, 42], [32, 50], [27, 49], [37, 49]];
    return `
      <g transform="translate(${tx} ${ty}) scale(${k})">
        <path d="M32 22 C50 18 58 30 50 44 C44 54 36 60 32 60 C28 60 20 54 14 44 C6 30 14 18 32 22 Z" fill="#e63946" ${line}/>
        ${seeds.map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.2" ry="1.8" fill="#ffd95a"/>`).join('')}
        <path d="M32 24 L24 16 L30 18 L32 11 L34 18 L40 16 Z" fill="#3fa34d" ${line}/>
        <ellipse cx="22" cy="30" rx="4" ry="2" fill="#fff" opacity=".35" transform="rotate(-30 22 30)"/>
      </g>`;
  }

  const DRAW = {
    cake: () => `
      <ellipse cx="32" cy="58" rx="27" ry="4.5" fill="#fff" ${line}/>
      <path d="M10 34 H54 V53 A4 4 0 0 1 50 57 H14 A4 4 0 0 1 10 53 Z" fill="#f7c59f" ${line}/>
      <path d="M11 46 H53" stroke="#e4572e" stroke-width="3"/>
      <path d="M8 34 A4 4 0 0 1 12 30 H52 A4 4 0 0 1 56 34 V38 Q52 44 48 38 Q44 44 40 38 Q36 44 32 38 Q28 44 24 38 Q20 44 16 38 Q12 44 8 38 Z" fill="#ff9ec4" ${line}/>
      <rect x="30" y="17" width="4" height="13" rx="1" fill="#3fa9f5" ${line}/>
      <path d="M32 6 Q37 12 32 15 Q27 12 32 6 Z" fill="#f4c430" stroke="#e4572e" stroke-width="1.2"/>
      <path d="M17 33 l2 -1 M27 32 l2 1 M40 33 l2 -1 M48 32 l1 1.5" stroke="#3fa9f5" stroke-width="1.6" stroke-linecap="round"/>`,

    watermelon: () => `
      <path d="M6 32 H58 A26 26 0 0 1 6 32 Z" fill="#3fa34d" ${line}/>
      <path d="M10 32 H54 A22 22 0 0 1 10 32 Z" fill="#fff4e0"/>
      <path d="M13 32 H51 A19 19 0 0 1 13 32 Z" fill="#ff5a6e"/>
      ${[[24, 38], [32, 44], [40, 38], [27, 47], [37, 47], [32, 36]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.4" ry="2.2" fill="#2b2b2b"/>`).join('')}`,

    cheese: () => `
      <polygon points="6,38 58,38 58,58 6,58" fill="#f4c430" ${line}/>
      <polygon points="6,38 40,20 58,38" fill="#ffd95a" ${line}/>
      <ellipse cx="18" cy="48" rx="4" ry="3.5" fill="#d9a400"/>
      <ellipse cx="34" cy="52" rx="3" ry="2.5" fill="#d9a400"/>
      <ellipse cx="48" cy="45" rx="3.5" ry="3" fill="#d9a400"/>
      <ellipse cx="38" cy="31" rx="3" ry="1.6" fill="#e6b800"/>`,

    cookies: () => `
      <circle cx="40" cy="38" r="16" fill="#c98a4b" ${line}/>
      <circle cx="26" cy="44" r="17" fill="#d9a05b" ${line}/>
      ${[[20, 38], [30, 36], [24, 48], [34, 50], [16, 47], [44, 30], [49, 39]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.4" ry="2" fill="#5d3a1a"/>`).join('')}`,

    sugar: () => cube(21, 60, 11) + cube(43, 60, 11) + cube(32, 37, 10),

    strawberries: () => strawberry(18, 2, 0.62) + strawberry(-2, 4, 0.9),

    doughnut: () => `
      <path d="M6 42 A26 16 0 1 0 58 42 A26 16 0 1 0 6 42 Z M24 40 A8 4.5 0 1 0 40 40 A8 4.5 0 1 0 24 40 Z" fill="#d9a05b" fill-rule="evenodd" ${line}/>
      <path d="M10 39 Q8 30 20 27 Q32 23 44 27 Q56 30 54 39 Q50 44 44 41 Q38 47 30 43 Q22 47 18 42 Q12 45 10 39 Z M24 38 A8 4.5 0 1 0 40 38 A8 4.5 0 1 0 24 38 Z" fill="#ff7eb6" fill-rule="evenodd" ${line}/>
      ${[[18, 32, '#3fa9f5', 20], [28, 28, '#f4c430', -30], [44, 31, '#fff', 40], [48, 37, '#9b5de5', -10], [16, 38, '#00c2a8', 60], [36, 46, '#f4c430', 10], [26, 44, '#fff', -50]]
        .map(([x, y, c, r]) => `<rect x="${x - 2}" y="${y - 0.8}" width="4" height="1.6" rx=".8" fill="${c}" transform="rotate(${r} ${x} ${y})"/>`).join('')}`,

    honey: () => `
      <path d="M40 26 L52 6" stroke="#8a6a48" stroke-width="3" stroke-linecap="round"/>
      <path d="M14 30 Q8 58 32 58 Q56 58 50 30 Z" fill="#e8a33c" ${line}/>
      <ellipse cx="32" cy="44" rx="10" ry="7" fill="#fff4e0" ${line}/>
      <path d="M29 44 l3 -3 l3 3 l-3 3 Z" fill="#f4c430"/>
      <rect x="11" y="23" width="42" height="8" rx="3" fill="#cf8a2a" ${line}/>
      <path d="M13 29 H51 V31 Q48 37 45 31 Q42 35 38 31 Q34 39 30 31 Q26 35 22 31 Q18 36 15 31 Z" fill="#f4c430" ${line}/>`,

    apple: () => `
      <path d="M32 18 Q33 11 37 8" fill="none" stroke="#5d3a1a" stroke-width="3" stroke-linecap="round"/>
      <path d="M37 10 Q46 4 50 10 Q44 16 37 10 Z" fill="#3fa34d" ${line}/>
      <path d="M32 20 C22 12 6 18 8 36 C10 52 22 60 32 56 C42 60 54 52 56 36 C58 18 42 12 32 20 Z" fill="#e63946" ${line}/>
      <path d="M32 20 C22 12 6 18 8 36 C10 52 22 60 32 56 C42 60 54 52 56 36 C58 18 42 12 32 20 Z" fill="#fff1d6" transform="translate(32 37) scale(.84) translate(-32 -37)"/>
      <ellipse cx="32" cy="37" rx="6" ry="10" fill="none" stroke="#e8c98f" stroke-width="1.5"/>
      <ellipse cx="30" cy="37" rx="1.6" ry="2.8" fill="#5d3a1a" transform="rotate(15 30 37)"/>
      <ellipse cx="34" cy="37" rx="1.6" ry="2.8" fill="#5d3a1a" transform="rotate(-15 34 37)"/>`,

    pizza: () => `
      <path d="M9 18 L55 18 L32 60 Z" fill="#f4c430" ${line}/>
      <path d="M44 38 Q46 46 43 46 Q41 44 42 39" fill="#f4c430" ${line}/>
      <circle cx="24" cy="27" r="4.5" fill="#c0392b" ${line}/>
      <circle cx="39" cy="28" r="4.5" fill="#c0392b" ${line}/>
      <circle cx="31" cy="42" r="4" fill="#c0392b" ${line}/>
      <path d="M6 18 Q32 9 58 18 L56 24 Q32 15 8 24 Z" fill="#d9a05b" ${line}/>`,

    grapes: () => `
      <path d="M31 20 Q32 12 38 9" fill="none" stroke="#5d3a1a" stroke-width="3" stroke-linecap="round"/>
      <path d="M36 12 Q46 4 52 12 Q44 18 36 12 Z" fill="#3fa34d" ${line}/>
      ${[[19, 25], [31, 24], [43, 26], [25, 35], [37, 35], [49, 35], [20, 45], [32, 45], [43, 45], [27, 54], [38, 54]]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6.5" fill="#7b4fa3" ${line}/><circle cx="${x - 2}" cy="${y - 2}" r="1.6" fill="#fff" opacity=".45"/>`).join('')}`,

    cupcake: () => `
      <path d="M15 38 H49 L44 60 H20 Z" fill="#3fa9f5" ${line}/>
      <path d="M22 40 L24 58 M30 40 L30.5 58 M38 40 L37 58 M45 40 L41 58" stroke="#2b86c9" stroke-width="1.5"/>
      <ellipse cx="32" cy="37" rx="19" ry="7" fill="#fff0f6" ${line}/>
      <ellipse cx="32" cy="29" rx="14" ry="6" fill="#fff0f6" ${line}/>
      <ellipse cx="32" cy="22" rx="9" ry="5" fill="#fff0f6" ${line}/>
      <path d="M32 14 Q33 8 37 6" fill="none" stroke="#5d3a1a" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="32" cy="15" r="4.5" fill="#e63946" ${line}/>
      <path d="M20 35 l2 -1 M42 34 l2 1 M26 27 l1.5 1 M38 28 l2 -1" stroke="#9b5de5" stroke-width="1.6" stroke-linecap="round"/>`,

    jelly: () => `
      <ellipse cx="32" cy="58" rx="27" ry="4.5" fill="#fff" ${line}/>
      <g class="food-wobble">
        <path d="M12 57 C11 34 18 22 32 22 C46 22 53 34 52 57 Z" fill="#e63946" ${line}/>
        <path d="M22 26 C19 36 20 48 21 56 M32 22 V56 M42 26 C45 36 44 48 43 56" fill="none" stroke="#b02a36" stroke-width="1.5"/>
        <ellipse cx="22" cy="34" rx="3" ry="6" fill="#fff" opacity=".4" transform="rotate(12 22 34)"/>
      </g>`,

    pretzel: () => {
      const d = 'M16 48 C2 32 14 12 28 18 C38 22 40 36 31 46 M48 48 C62 32 50 12 36 18 C26 22 24 36 33 46 M16 48 Q32 60 48 48';
      const salt = [[12, 30], [22, 17], [40, 17], [52, 30], [32, 54], [20, 50], [44, 50]];
      return `
        <path d="${d}" fill="none" stroke="${OUT}" stroke-width="10" stroke-linecap="round"/>
        <path d="${d}" fill="none" stroke="#b5651d" stroke-width="6.5" stroke-linecap="round"/>
        ${salt.map(([x, y]) => `<rect x="${x - 1}" y="${y - 1}" width="2" height="2" fill="#fff" transform="rotate(30 ${x} ${y})"/>`).join('')}`;
    },

    lolly: () => `
      <rect x="29" y="44" width="6" height="17" rx="3" fill="#e8c98f" ${line}/>
      <path d="M18 24 A14 14 0 0 1 46 24 V44 A3 3 0 0 1 43 47 H21 A3 3 0 0 1 18 44 Z" fill="#ff9f1c" ${line}/>
      <path d="M18 24 A14 14 0 0 1 46 24 V30 H18 Z" fill="#ff7eb6" ${line}/>
      <path d="M18 30 H46 V37 H18 Z" fill="#fff4e0" stroke="${OUT}" stroke-width="1"/>
      <path d="M23 18 Q24 14 27 12" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>`,
  };

  function svg(id) {
    const draw = DRAW[id];
    return draw ? `<svg class="food food-${id}" viewBox="0 0 64 64" aria-hidden="true">${draw()}</svg>` : '';
  }

  function byId(id) {
    return AP.config.foods.find(f => f.id === id);
  }

  return { svg, byId };
})();
