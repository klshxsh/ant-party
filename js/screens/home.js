AP.screens = AP.screens || {};

AP.screens.home = {
  init() {
    document.getElementById('home-start').addEventListener('click', () => AP.show('quiz'));
    document.getElementById('home-settings').addEventListener('click', () => AP.show('settings'));
  },
};
