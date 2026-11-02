AP.screens = AP.screens || {};

AP.screens.settings = (() => {
  const $ = id => document.getElementById(id);
  const TYPES = ['mul', 'div', 'addsub'];

  function init() {
    $('set-tables').innerHTML = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(n => `<label class="chip"><input type="checkbox" value="${n}"><span>×${n}</span></label>`)
      .join('');

    $('settings-form').addEventListener('submit', e => {
      e.preventDefault();
      const candidate = read();
      const problems = AP.prefs.problems(candidate);
      $('settings-error').textContent = problems.join(' ');
      if (problems.length) return;
      AP.state.settings = AP.prefs.normalise(candidate);
      AP.prefs.save(AP.state.settings);
      AP.audio.update();
      AP.updateMotion();
      AP.show('home');
    });
    $('settings-cancel').addEventListener('click', () => AP.show('home'));
    $('settings-progress').addEventListener('click', () => AP.show('progress'));
    $('settings-clear-album').addEventListener('click', () => {
      if (confirm('Delete all the saved parties?')) AP.album.clear();
    });
    $('settings-reset').addEventListener('click', () => {
      if (!confirm('Forget which facts are tricky and start fresh?')) return;
      AP.state.stats = {};
      AP.storage.remove('stats');
    });
  }

  function enter() {
    const s = AP.state.settings;
    $('set-food-every').value = s.foodEvery;
    $('set-party-at').value = s.partyAt;
    $('set-max-tries').value = String(s.maxTries);
    $('set-ant-speed').value = s.antSpeed;
    TYPES.forEach(t => ($(`set-type-${t}`).checked = !!s.types[t]));
    $('set-tables').querySelectorAll('input').forEach(box => {
      box.checked = s.tables.includes(Number(box.value));
    });
    $('set-skip-easy').checked = s.skipEasy;
    $('set-addsub-min').value = s.addsubMin;
    $('set-addsub-max').value = s.addsubMax;
    $('set-sfx').checked = s.sfx;
    $('set-music').checked = s.music;
    $('set-volume').value = s.volume;
    $('set-calm').checked = s.calm;
    $('set-calm-device').hidden = !AP.deviceCalm();
    $('settings-error').textContent = '';
  }

  function read() {
    const { limits } = AP.config;
    const num = (id, [lo, hi]) => AP.util.clamp(Math.round(Number($(id).value)) || lo, lo, hi);
    // Not clamped, so a range typed out of bounds (or left blank) is reported rather than changed.
    const exact = id => ($(id).value.trim() === '' ? NaN : Math.round(Number($(id).value)));
    return {
      foodEvery: num('set-food-every', limits.foodEvery),
      partyAt: num('set-party-at', limits.partyAt),
      maxTries: Number($('set-max-tries').value),
      antSpeed: $('set-ant-speed').value,
      types: Object.fromEntries(TYPES.map(t => [t, $(`set-type-${t}`).checked])),
      tables: [...$('set-tables').querySelectorAll('input:checked')].map(box => Number(box.value)),
      skipEasy: $('set-skip-easy').checked,
      addsubMin: exact('set-addsub-min'),
      addsubMax: exact('set-addsub-max'),
      sfx: $('set-sfx').checked,
      music: $('set-music').checked,
      volume: Number($('set-volume').value),
      calm: $('set-calm').checked,
      muted: AP.state.settings.muted, // set by the mute button, not this form
    };
  }

  return { init, enter };
})();
