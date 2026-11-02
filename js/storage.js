window.AP = window.AP || {};

// localStorage can be missing or throw (private windows, blocked site data),
// so every access falls back quietly and the game still runs.
AP.storage = (() => {
  const PREFIX = 'antparty.v1.';

  function load(name, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + name);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  // Returns false if it couldn't be saved (no storage, or it's full).
  function save(name, value) {
    try {
      localStorage.setItem(PREFIX + name, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function remove(name) {
    try {
      localStorage.removeItem(PREFIX + name);
    } catch {}
  }

  return { load, save, remove };
})();

AP.prefs = (() => {
  const { defaults, limits } = AP.config;
  const { clamp } = AP.util;

  function int(value, fallback, [lo, hi]) {
    const n = Math.round(Number(value));
    return Number.isFinite(n) ? clamp(n, lo, hi) : fallback;
  }

  // Returns a complete, safe settings object whatever is stored.
  function normalise(raw) {
    const s = { ...defaults, ...(raw || {}) };
    const types = (raw && raw.types) || {};
    s.types = Object.fromEntries(
      Object.keys(defaults.types).map(t => [t, t in types ? !!types[t] : defaults.types[t]]),
    );
    // Before phase 5.5, + and − came as two types: to 100 and to 1000.
    if (!('addsub' in types) && (types.addsub100 || types.addsub1000)) s.types.addsub = true;
    s.foodEvery = int(s.foodEvery, defaults.foodEvery, limits.foodEvery);
    s.partyAt = int(s.partyAt, defaults.partyAt, limits.partyAt);
    s.maxTries = int(s.maxTries, defaults.maxTries, [0, 3]);
    s.addsubMin = int(s.addsubMin, defaults.addsubMin, limits.addsubMin);
    s.addsubMax = int(s.addsubMax, defaults.addsubMax, limits.addsubMax);
    s.tables = Array.isArray(s.tables)
      ? [...new Set(s.tables.map(Number).filter(n => n >= 1 && n <= 12))].sort((a, b) => a - b)
      : defaults.tables.slice();
    s.skipEasy = !!s.skipEasy;
    s.sfx = !!s.sfx;
    s.music = !!s.music;
    s.volume = int(s.volume, defaults.volume, limits.volume);
    s.muted = !!s.muted;

    if (s.foodEvery > s.partyAt) s.foodEvery = s.partyAt;
    if (!Object.values(s.types).some(Boolean)) s.types = { ...defaults.types };
    if (!s.tables.length) s.tables = defaults.tables.slice();
    return s;
  }

  // Problems a grown-up should fix before saving; empty when the settings are fine.
  function problems(s) {
    const out = [];
    if (!Object.values(s.types).some(Boolean)) out.push('Pick at least one kind of question.');
    if ((s.types.mul || s.types.div) && !s.tables.length) out.push('Pick at least one times table.');
    if (s.foodEvery > s.partyAt) out.push('The food choice has to come before (or at) the party.');
    if (s.types.addsub) {
      const [minLo, minHi] = limits.addsubMin;
      const [maxLo, maxHi] = limits.addsubMax;
      const { formatNumber } = AP.util;
      if (!(s.addsubMin >= minLo && s.addsubMin <= minHi)) {
        out.push(`For + and −, the smallest number has to be between ${formatNumber(minLo)} and ${minHi}.`);
      }
      if (!(s.addsubMax >= maxLo && s.addsubMax <= maxHi)) {
        out.push(`For + and −, the biggest number has to be between ${maxLo} and ${maxHi}.`);
      }
    }
    return out;
  }

  const load = () => normalise(AP.storage.load('settings', null));
  const save = s => AP.storage.save('settings', s);

  return { normalise, problems, load, save };
})();
