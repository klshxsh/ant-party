window.AP = window.AP || {};

AP.scenery = (() => {
  // A striped party tent with a flag. The ants walk in through the door.
  function tent() {
    const base = [6, 17.3, 28.7, 40, 51.3, 62.7, 74];
    const stripes = base.slice(0, -1)
      .map((x, i) => `<path d="M40 6 L${x} 62 L${base[i + 1]} 62 Z" fill="${i % 2 ? '#fff4e0' : '#e4572e'}"/>`)
      .join('');
    return `
      <svg viewBox="0 -10 80 76" aria-hidden="true">
        <ellipse cx="40" cy="63" rx="38" ry="3" fill="#000" opacity=".15"/>
        <path d="M40 6 L40 -8" stroke="#5d3a1a" stroke-width="2"/>
        <path d="M40 -8 L54 -4 L40 0 Z" fill="#f4c430"/>
        ${stripes}
        <path d="M40 30 L29 62 L51 62 Z" fill="#4a2e14"/>
        <path d="M6 62 L40 6 L74 62" fill="none" stroke="#b03a1f" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>`;
  }

  return { tent };
})();
