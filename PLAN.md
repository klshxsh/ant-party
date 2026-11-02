# Ant Party Maths — Plan

A browser maths practice game for 9–11 year olds. Each correct answer sends a cute ant
walking off to a party. Every N questions the child picks a food for the party; after M
questions the party starts, with every ant from the round and all the chosen food.

## Decisions so far

| Topic | Decision |
|---|---|
| Learner | Age 9–11, building fluency |
| Answering | Type the number on an on-screen number pad (keyboard works too) |
| Ant art | Hand-drawn SVG built in code, each ant unique |
| Delivery | Static files, no build step: open `index.html` in a browser |
| N / M | Parent sets them (defaults: food every 5, party at 20) |
| Mistakes | An encourager ant pops up ("You can do it!") with an animation, then the child retries. Parent sets max tries: unlimited (default), 1, 2 or 3. When the tries run out, the ant shows the answer and the fact comes back later in the round |
| Question types | ×  to 12×12, ÷ from the tables, and +/− within a range the parent sets (default −20 to 20, so negatives like −4 − (−7) come in; a minimum of 1 keeps everything positive). Each can be switched on or off; the parent can pick which tables. Default: × and ÷ only |
| Memory | Weak-fact tracking (wrong and slow answers come up more often) **and** a party album |
| Food | Choose 1 of 3, drawn at random from a menu of about 15 foods |
| Party | Ants eat and dance; tap an ant to see its question; save the party to the album |
| Sound | Sound effects made in code with Web Audio. Music tunes as audio files; placeholders supplied, to be swapped for your own |
| Timer | None on screen. Answer time is recorded quietly for weak-fact weighting |
| Colour theme | Green: leafy/grass backgrounds, green buttons and panels. Colours live as CSS variables in one place. Ants and food use warm contrasting colours (red, orange, brown, purple) so they stand out against the green |

## File layout

```
ant_party/
  index.html          markup + screen containers
  style.css
  js/
    util.js           small random/shuffle helpers
    config.js         defaults, food menu, audio manifest (filenames → roles)
    storage.js        localStorage wrapper (try/catch, safe defaults) + settings validation
    album.js          saved parties (newest first, capped at 50)
    questions.js      generators + weighted picker
    round.js          round state: counting, retry queue, food/party triggers
    ants.js           SVG ant generator (traits → SVG), animations
    scenery.js        party tent and other scenery SVG
    food.js           SVG food icons
    audio.js          synth SFX + music player for the files in audio/
    screens/          home, quiz, food-pick, party, album, settings, progress
    main.js           state machine wiring the screens together
  audio/
    main-theme.wav    placeholder (loops on home screen)
    quiz-theme.wav    placeholder (quiet loop during questions)
    food-jingle.wav   placeholder (short, food choice)
    party-theme.wav   placeholder (loops at the party)
  tools/
    make-placeholder-audio.py   generates the placeholder WAVs (stdlib only)
```

Scripts are plain `<script src>` files, not ES modules, so the game works when opened
straight from disk (`file://`). To use your own music, drop the files into `audio/` and
edit the filenames in `config.js`; any format the browser plays (mp3, ogg, m4a, wav) is fine.
If a file is missing, the game carries on without it.

## Game flow

```
Home ──► Round ──► question ──correct──► ant walks to the party ──► next question
            │          │
            │          └─wrong──► encourager ant "You can do it!" ──► retry
            │                     (tries used up → ant shows answer, fact re-queued)
            ├─ every N answers ──► Food pick (1 of 3)
            └─ after M answers ──► Party ──► save to album ──► Home
Home also links to: Album · Settings
```

## Components

### Questions (`questions.js`)
- **×**: `a × b` with `a` from the selected tables and `b` from 1–12 (option to skip ×1 and ×10 as too easy).
- **÷**: the reverse of a table fact, `(a·b) ÷ a = b`, so answers are always whole numbers.
- **+/−**: both numbers and the answer lie within the parent's range (min −1000 to 1,
  max 5 to 1000), and neither number is 0. A negative second number is written in
  brackets with a proper minus sign: `8 − (−5)`, `−8 + (−5)`. Two in three questions
  aim for carrying or borrowing (worked on the sizes, so `−27 + 15` borrows), and round
  numbers and numbers under a tenth of the range are avoided as too easy.
- **Weak-fact weighting**: each fact key (`7x8`, `56/7`) stores attempts, misses and median
  time. For +/− there are too many facts, so stats are kept per sign pattern instead:
  `add-pp` 8 + 5, `sub-pp` 13 − 5, `sub-below0` 5 − 13, `add-pn` 8 + (−5), `add-np` −8 + 5,
  `add-nn` −8 + (−5), `sub-pn` 8 − (−5), `sub-np` −8 − 5, `sub-nn` −8 − (−5). Only the
  patterns that fit in the range are asked (a range from 1 has just `add-pp` and `sub-pp`).
  Pick weight = base + misses + slowness, with
  a short no-repeat window. A missed fact is put back 3–5 questions later in the same round.

### Ants (`ants.js`)
- Each ant is a small data object: `{ name, bodyColour, accessory, size, fact, firstTry }`.
  Accessories: party hat, bow, top hat, crown, flower, sunglasses, scarf… Names come
  from a fun list (Antonio, Antoinette, Antony, Anthea…).
- The SVG is built from those traits, so the same ant can be drawn on the walk, at the
  party and in the album, and the album only has to store the data.
- Animations are CSS keyframes: a three-pair leg cycle, bobbing antennae, and a walk
  across the bottom of the screen carrying the answer as a crumb. The walk runs while
  the next question appears, so it never blocks the child.
- Encourager ant: pops up beside the question, fist-pump and bounce, speech bubble with
  a rotating line ("You can do it!", "Nearly!", "Have another go!").
- A progress trail at the top of the quiz screen shows ants heading to an anthill tent,
  with food markers at every N.

### Food (`food.js`)
- About 15 SVG foods: cake, watermelon, cheese, cookies, sugar cubes, strawberries, a
  doughnut, honey, an apple slice, pizza, grapes, a cupcake, a jelly, a pretzel and an ice lolly.
- The food-pick screen offers 3 random foods with no repeats within a round. The chosen
  food flies to the party table preview.

### Party
- All ants from the round gather around the chosen foods: eating (nibble animation),
  dancing (bounce and spin, staggered so they don't move in sync), confetti, party theme.
- Tap an ant to see a speech bubble: "I'm Antonio! I carried 7 × 8 = 56 🎉".
- **Save to album** stores the date, the ants, the foods and the round summary.

### Album
- A grid of saved parties, each re-drawn live from its data; tap one to open the full scene.
- Capped at about 50 parties so it stays within localStorage limits; the oldest drop off first.

### Settings (parent area)
- N (food every…), M (party at…), checked so that N ≤ M.
- Question types on/off, table picker (2–12), the +/− range (smallest and biggest number).
- Max tries: unlimited / 1 / 2 / 3.
- Sound effects on/off, music on/off and music volume.
- **Progress view**: a 12×12 table heat map of accuracy and speed, and the +/− sign
  patterns the current range allows, each with an example.
- Reset progress, clear album.

### Audio (`audio.js`)
- Sound effects made in code with Web Audio: correct chime, gentle "boop" for wrong,
  tiny footsteps, food pop, party whoosh.
- Music played with `<audio>` elements from the manifest, with looping and crossfades between screens.
  Music starts only after the first tap, as browser autoplay rules require.
- A mute button on every screen.

## Build phases

1. ✅ **Core loop**: screens, number pad, question generators, settings with N/M/mistake
   options, basic home → round → done flow, using emoji placeholders. The weak-fact
   weighting and retry queue were built here too. Check with `node tools/check-questions.js`.
2. ✅ **Ants**: SVG generator (8 accessories, trim colours, blinking, wobbly antennae),
   tripod-gait walk into a party tent along a full-width grassy ground, "Coach" encourager
   ant that jumps and fist-pumps, progress trail with food plates and a leader ant.
3. ✅ **Food and party**: 15 SVG foods; food pick with a flying-off animation; party scene
   (bunting, sun, hills, tent, picnic blanket, confetti) where the round's ants walk in,
   nibble the foods two to a dish and dance in rows; tap an ant for a speech bubble.
   Layout scales from 1 ant/1 food up to 60 ants or 30 foods.
4. ✅ **Memory**: "Save to album" on the party; album screen (newest first, up to 50)
   where each party can be replayed; grown-ups' Progress screen with a 12×12 × / ÷ grid
   (strong / getting there / tricky / not tried, with symbols as well as colours) and the
   +/− skills list; "Clear party album" in settings.
5. ✅ **Sound**: Web Audio effects (correct chime, soft boop, footsteps, food pop, party
   whoosh, an ant's hello); music crossfades between screens (home tune also on the album
   and grown-ups' screens, quieter quiz loop, one-shot food jingle, party loop); mute button
   on every screen (remembered); music volume in settings. Placeholder chiptune WAVs come
   from `tools/make-placeholder-audio.py`.
5.5. ✅ **Adjustments**: +/− to 100 and to 1000 replaced by one +/− type with a min/max
   range in settings (default −20 to 20), including negative numbers; stats per sign
   pattern; a minus key on the number pad (4-column calculator layout) whenever answers
   can be negative, and the − key on a keyboard; progress lists the sign patterns. Old
   saved settings with either +/− type switched on turn into the new type.
6. **Polish**: tablet layout and phone width, reduced-motion support (gentler animations),
   check the question distributions with a quick script over 10,000 picks.

## Settled details

- One player. Separate profiles could come later.
- No parent gate: settings open straight from the home screen.
- Food collected so far is shown on the quiz screen in the progress trail's plates
  (this replaced the separate party-table preview).
