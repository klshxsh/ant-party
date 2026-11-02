// Loads the game's DOM-free modules into Node, for the checking scripts. Returns AP.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const FILES = ['util.js', 'config.js', 'storage.js', 'questions.js', 'ants.js', 'round.js'];

module.exports = function loadGame() {
  const ctx = { console, Math, JSON, Number, Array, Object, Set };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const file of FILES) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', file), 'utf8'), ctx, { filename: file });
  }
  return ctx.AP;
};
