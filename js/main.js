window.AP = window.AP || {};

AP.state = {
  settings: AP.prefs.load(),
  stats: AP.storage.load('stats', {}),
  round: null,
};

// Gentler animations, when the grown-ups ask for them or the device asks for reduced
// motion. The calm class on <html> switches the CSS over (see the end of style.css).
AP.deviceCalm = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
AP.calm = () => AP.state.settings.calm || AP.deviceCalm();
AP.updateMotion = () => document.documentElement.classList.toggle('calm', AP.calm());
window.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener('change', AP.updateMotion);

// Shows one screen and hides the rest. Extra arguments go to the screen's enter().
AP.show = (name, ...args) => {
  document.querySelectorAll('.screen').forEach(el => {
    el.hidden = el.id !== `screen-${name}`;
  });
  const screen = AP.screens[name];
  if (screen.enter) screen.enter(...args);
  AP.audio.screen(name);
};

AP.updateMotion();
AP.audio.init();
Object.values(AP.screens).forEach(screen => screen.init && screen.init());
AP.show('home');
