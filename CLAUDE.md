# Ant Party Maths

A maths practice game for 9–11 year olds: each correct answer sends an ant to a party,
every N questions the child picks a food, and after M questions the party starts.
`PLAN.md` holds the agreed design decisions and the build phases (with ✅ on finished ones).
Read it before starting a phase.

## Run

No build step. Open `index.html` in a browser (`open index.html`). It must keep working
from `file://`, so:
- scripts are plain `<script src>` files loaded in order from `index.html`, not ES modules
- no fetch/XHR of local files; audio uses `<audio>` elements

## Test

- `node tools/check-questions.js`: question generators, weak-fact weighting, round timing.
  Exits non-zero on failure.
- `node tools/play-round.mjs <out-dir> [WxH]`: plays a full round in headless Chrome
  and saves screenshots (home, question, wrong answer, walking ant, food, party arriving, party, settings).
  Exits non-zero on JS errors. Check both phone (`390x844`) and tablet (`820x1180`) sizes
  after UI changes, and look at the screenshots.

## Code layout and conventions

- Everything hangs off one global, `window.AP`. Each file is an IIFE that assigns one
  module: `AP.util`, `AP.config`, `AP.storage`/`AP.prefs`, `AP.questions`, `AP.round`,
  `AP.ants`, `AP.food`, `AP.scenery`, and `AP.screens.<name>` for each screen in `js/screens/`.
- Ants are data (`AP.ants.create`) drawn by `AP.ants.render(ant, classes)` as SVG.
  Animations are CSS only, switched on by the classes `walking`, `cheer`, `dance`,
  `face-left`, `eat`; size them with `--ant-w` on any ancestor.
- Foods are SVG from `AP.food.svg(id)`; the menu (ids and names) is in `js/config.js`.
- The party scene (`js/screens/party.js`) places everything by its base point in % of
  the scene and sizes it in `cqw`, so it scales; `layout()` there is DOM-free.
- Screens are `<section id="screen-<name>">` in `index.html`. `AP.show(name, ...args)`
  hides the others and calls the screen's `enter(...args)`. `init()` runs once at startup.
- Game state is `AP.state` (`settings`, `stats`, `round`). `AP.round` and `AP.questions`
  are pure logic with no DOM, so `tools/check-questions.js` can load them in Node.
- Settings defaults, the food menu, ant names/colours and the music manifest live in
  `js/config.js`. `AP.prefs.normalise` makes any stored settings safe to use.
- localStorage keys are prefixed `antparty.v1.`; all access goes through `AP.storage`,
  which never throws.
- Colours are CSS variables in `:root` in `style.css`. The theme is green; ants and food
  use warm contrasting colours.
- UK English in the UI ("colour", "ice lolly", "maths").

## Git

Work on `main`. Commit only when asked.
