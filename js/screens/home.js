AP.screens = AP.screens || {};

AP.screens.home = {
  init() {
    document.getElementById('home-ant').innerHTML = AP.ants.render(AP.ants.coach, ['dance']);
    document.getElementById('home-start').addEventListener('click', () => AP.show('quiz'));
    document.getElementById('home-album').addEventListener('click', () => AP.show('album'));
    document.getElementById('home-settings').addEventListener('click', () => AP.show('settings'));
  },
};
