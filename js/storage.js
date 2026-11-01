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
    s.types = { ...defaults.types, ...(raw && raw.types) };
    s.foodEvery = int(s.foodEvery, defaults.foodEvery, limits.foodEvery);
    s.partyAt = int(s.partyAt, defaults.partyAt, limits.partyAt);
    s.maxTries = int(s.maxTries, defaults.maxTries, [0, 3]);
    s.tables = Array.isArray(s.tables)
      ? [...new Set(s.tables.map(Number).filter(n => n >= 1 && n <= 12))].sort((a, b) => a - b)
      : defaults.tables.slice();
    s.skipEasy = !!s.skipEasy;
    s.sfx = !!s.sfx;
    s.music = !!s.music;

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
    return out;
  }

  const load = () => normalise(AP.storage.load('settings', null));
  const save = s => AP.storage.save('settings', s);

  return { normalise, problems, load, save };
})();
