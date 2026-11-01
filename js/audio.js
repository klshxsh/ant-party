window.AP = window.AP || {};

// Sound. Effects are made in code with Web Audio; music comes from the files in
// AP.config.music, played with <audio> elements (Web Audio can't read local files
// opened from file://). Browsers only allow sound after the first tap or key press,
// so nothing plays until then.
AP.audio = (() => {
  const FADE_MS = 700;
  const TICK_MS = 40;
  // Which music each screen plays.
  const SCREEN_MUSIC = {
    home: 'home', album: 'home', settings: 'home', progress: 'home',
    quiz: 'quiz', food: 'food', party: 'party',
  };

  let ctx = null;    // AudioContext, made on the first tap
  let master = null;
  let noise = null;  // a second of white noise, for footsteps and whooshes
  let unlocked = false;
  let wanted = null; // the music for the screen on show
  let fadeTimer = 0;
  const tracks = {}; // music name → { el, level, target }

  const $mute = () => document.getElementById('mute');
  const settings = () => AP.state.settings;
  const sfxOn = () => ctx && settings().sfx && !settings().muted;
  const musicOn = () => unlocked && settings().music && !settings().muted && !document.hidden;

  function init() {
    // Capture phase, so sound is unlocked before the tapped button's own handler runs.
    ['click', 'touchend', 'keydown'].forEach(type => document.addEventListener(type, unlock, true));
    document.addEventListener('visibilitychange', () => update(document.hidden));
    $mute().addEventListener('click', () => {
      settings().muted = !settings().muted;
      AP.prefs.save(settings());
      update(settings().muted); // off at once, back on with a fade
    });
    showMute();
  }

  function showMute() {
    const muted = settings().muted;
    const after = muted
      ? '<path d="M16 9l6 6M22 9l-6 6"/>'
      : '<path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>';
    $mute().innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9h4l5-4v14l-5-4H3z" fill="currentColor"/>${after}
      </svg>`;
    $mute().setAttribute('aria-pressed', String(muted));
  }

  function unlock() {
    if (!ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        ctx = new Ctx();
        master = ctx.createGain();
        master.gain.value = 0.6;
        master.connect(ctx.destination);
        noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        noise.getChannelData(0).forEach((_, i, data) => (data[i] = Math.random() * 2 - 1));
      }
    }
    if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
    if (unlocked) return;
    unlocked = true;
    update();
    Object.keys(AP.config.music).forEach(prime);
  }

  // iOS only lets an <audio> element play later if it first played during a tap,
  // so start each one silently now and stop it again if it isn't wanted yet.
  function prime(name) {
    const t = track(name);
    if (t.target > 0) return;
    t.el.muted = true;
    const done = () => {
      t.el.muted = false;
      if (t.target === 0) t.el.pause();
    };
    t.el.play().then(done, done);
  }

  function track(name) {
    if (!tracks[name]) {
      const { src, loop = true } = AP.config.music[name];
      const el = new Audio(src);
      el.loop = loop;
      el.volume = 0;
      tracks[name] = { el, level: 0, target: 0 };
    }
    return tracks[name];
  }

  // Called by AP.show on every screen change.
  function screen(name) {
    const music = SCREEN_MUSIC[name] || null;
    if (music === wanted) return;
    wanted = music;
    if (music && AP.config.music[music].loop === false) track(music).el.currentTime = 0;
    update();
  }

  // Turns the wanted music up and everything else down: fading, or at once if `now`.
  // Also picks up changes to the settings.
  function update(now = false) {
    showMute();
    const on = musicOn();
    Object.entries(AP.config.music).forEach(([name, { volume = 1 }]) => {
      const play = on && name === wanted;
      if (!play && !tracks[name]) return;
      const t = track(name);
      t.target = play ? AP.util.clamp(volume * settings().volume / 100, 0, 1) : 0;
      // A missing file just fails to play, and the game carries on without it.
      if (play && t.el.paused && !t.el.ended) t.el.play().catch(() => {});
      if (now) set(t, t.target);
    });
    if (!now && !fadeTimer) fadeTimer = setInterval(fade, TICK_MS);
  }

  // Volume is tracked here rather than read back from the element, because iOS
  // ignores it (there the music just stops at the end of the fade).
  function set(t, level) {
    t.level = level;
    t.el.volume = level;
    if (level === 0 && !t.el.paused) t.el.pause();
  }

  function fade() {
    const step = TICK_MS / FADE_MS;
    let busy = false;
    Object.values(tracks).forEach(t => {
      if (t.level === t.target) return;
      set(t, t.level < t.target ? Math.min(t.target, t.level + step) : Math.max(t.target, t.level - step));
      busy = busy || t.level !== t.target;
    });
    if (!busy) {
      clearInterval(fadeTimer);
      fadeTimer = 0;
    }
  }

  // --- Sound effects ---

  // One note with a quick attack and a smooth decay, optionally sliding to another pitch.
  function tone(freq, at, dur, { type = 'sine', gain = 0.3, to } = {}) {
    const t0 = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    osc.connect(envelope(t0, dur, 0.01, gain));
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  // A burst of noise through a band-pass filter, whose pitch can sweep.
  function hiss(at, dur, { freq = 2000, to, q = 1, gain = 0.2, attack = 0.005 } = {}) {
    const t0 = ctx.currentTime + at;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = q;
    filter.frequency.setValueAtTime(freq, t0);
    if (to) filter.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    src.connect(filter).connect(envelope(t0, dur, attack, gain));
    src.start(t0, Math.random() * 0.5);
    src.stop(t0 + dur + 0.05);
  }

  function envelope(t0, dur, attack, gain) {
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain, t0 + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    amp.connect(master);
    return amp;
  }

  const SOUNDS = {
    // A right answer: a bright rising arpeggio.
    correct: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      tone(f, i * 0.07, 0.35, { type: 'triangle', gain: 0.3 });
    }),
    // A wrong answer: a soft boop sliding down, not a buzzer.
    wrong: () => tone(330, 0, 0.3, { gain: 0.25, to: 220 }),
    // Tiny footsteps as an ant sets off.
    steps: () => {
      for (let i = 0; i < 6; i++) hiss(0.05 + i * 0.11, 0.04, { freq: i % 2 ? 3400 : 2600, q: 5, gain: 0.35 });
    },
    // A food is chosen.
    pop: () => tone(300, 0, 0.14, { gain: 0.4, to: 1100 }),
    // The party starts: a rising whoosh and a sparkle.
    whoosh: () => {
      hiss(0, 0.9, { freq: 300, to: 5000, q: 1.2, gain: 0.35, attack: 0.6 });
      [1568, 2093, 2637].forEach((f, i) => tone(f, 0.7 + i * 0.08, 0.4, { gain: 0.12 }));
    },
    // An ant at the party says hello.
    hello: () => {
      tone(880, 0, 0.09, { gain: 0.2, to: 1320 });
      tone(1100, 0.1, 0.12, { gain: 0.2, to: 1650 });
    },
  };

  function sfx(name) {
    if (sfxOn()) SOUNDS[name]();
  }

  // The music that's audible now, for tools/play-round.mjs.
  const playing = () => Object.keys(tracks).filter(n => !tracks[n].el.paused && !tracks[n].el.muted && tracks[n].level > 0);

  return { init, screen, update, sfx, playing };
})();
