window.AP = window.AP || {};

AP.state = {
  settings: AP.prefs.load(),
  stats: AP.storage.load('stats', {}),
  round: null,
};

// Shows one screen and hides the rest. Extra arguments go to the screen's enter().
AP.show = (name, ...args) => {
  document.querySelectorAll('.screen').forEach(el => {
    el.hidden = el.id !== `screen-${name}`;
  });
  const screen = AP.screens[name];
  if (screen.enter) screen.enter(...args);
  AP.audio.screen(name);
};

AP.audio.init();
Object.values(AP.screens).forEach(screen => screen.init && screen.init());
AP.show('home');
