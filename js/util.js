window.AP = window.AP || {};

AP.util = {
  // Random integer in [lo, hi], inclusive.
  rand(lo, hi) {
    return lo + Math.floor(Math.random() * (hi - lo + 1));
  },

  pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  },

  shuffle(list) {
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  },

  // Picks one item with probability proportional to weightOf(item).
  weightedPick(list, weightOf) {
    const weights = list.map(weightOf);
    let roll = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < list.length; i++) {
      roll -= weights[i];
      if (roll < 0) return list[i];
    }
    return list[list.length - 1];
  },

  clamp(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
  },
};
