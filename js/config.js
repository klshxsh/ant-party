window.AP = window.AP || {};

AP.config = {
  defaults: {
    foodEvery: 5,   // N: choose a food after this many questions
    partyAt: 20,    // M: the party starts after this many questions
    maxTries: 0,    // tries before the answer is shown; 0 = unlimited
    antSpeed: 'stroll', // how fast the ants walk to the party (a key of antSpeeds)
    types: { mul: true, div: true, addsub: false },
    addsubMin: -20, // + and −: every number, answers too, stays in this range.
    addsubMax: 20,  // A minimum of 1 keeps them all positive.
    tables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    skipEasy: true, // leave out ×1 and ×10 as the second factor
    sfx: true,
    music: true,
    volume: 70,     // music volume, 0–100
    muted: false,   // the mute button on every screen
    calm: false,    // gentler animations (always on when the device asks for reduced motion)
  },

  limits: {
    foodEvery: [1, 25],
    partyAt: [1, 60],
    addsubMin: [-1000, 1],
    addsubMax: [5, 1000],
    volume: [0, 100],
  },

  // Walking speeds in px per ms. Each ant walks at its own pace around these.
  antSpeeds: { dawdle: 0.06, stroll: 0.1, scurry: 0.16 },

  // Music files. Swap in your own here: any format the browser plays (mp3, ogg, m4a,
  // wav). A missing file is skipped quietly. volume is relative to the music setting;
  // loop: false plays once each time. home also plays on the album, settings and progress screens.
  music: {
    home: { src: 'audio/main-theme.wav' },
    quiz: { src: 'audio/quiz-theme.wav', volume: 0.5 },
    food: { src: 'audio/food-jingle.wav', loop: false },
    party: { src: 'audio/party-theme.wav' },
  },

  // Drawn by AP.food.svg(id) in js/food.js.
  foods: [
    { id: 'cake', name: 'Cake' },
    { id: 'watermelon', name: 'Watermelon' },
    { id: 'cheese', name: 'Cheese' },
    { id: 'cookies', name: 'Cookies' },
    { id: 'sugar', name: 'Sugar cubes' },
    { id: 'strawberries', name: 'Strawberries' },
    { id: 'doughnut', name: 'Doughnut' },
    { id: 'honey', name: 'Honey' },
    { id: 'apple', name: 'Apple slice' },
    { id: 'pizza', name: 'Pizza' },
    { id: 'grapes', name: 'Grapes' },
    { id: 'cupcake', name: 'Cupcake' },
    { id: 'jelly', name: 'Jelly' },
    { id: 'pretzel', name: 'Pretzel' },
    { id: 'lolly', name: 'Ice lolly' },
  ],

  antNames: [
    'Antonio', 'Antoinette', 'Anthea', 'Antony', 'Antonia', 'Antoine', 'Anton',
    'Dante', 'Grant', 'Bryant', 'Atlanta', 'Fantasia', 'Constantine', 'Pip',
    'Dot', 'Crumb', 'Nibbles', 'Twig', 'Pebble', 'Clover', 'Sprout', 'Bean',
    'Biscuit', 'Sesame', 'Poppy', 'Maple', 'Acorn', 'Button', 'Tiny', 'Zippy',
    'Hopper', 'Daisy', 'Fern', 'Moss', 'Basil', 'Olive', 'Pepper', 'Ziggy',
    'Juniper', 'Nutmeg', 'Honey', 'Sunny', 'Bramble',
  ],

  // Warm colours that stand out against the green theme.
  antColours: ['#c0392b', '#e4572e', '#8e3b1f', '#5d3a1a', '#7b4fa3', '#d35400', '#2c2c2c', '#b03a6f'],

  antAccessories: ['partyHat', 'bow', 'topHat', 'crown', 'flower', 'sunglasses', 'scarf', 'bowtie'],

  // Bright colours for hats, bows and scarves.
  antTrims: ['#f4c430', '#3fa9f5', '#ff7eb6', '#9b5de5', '#00c2a8', '#ff9f1c'],

  encouragements: [
    'You can do it!',
    'Nearly there!',
    'Have another go!',
    "Don't give up!",
    "You've got this!",
    'Ants never give up!',
  ],
};
