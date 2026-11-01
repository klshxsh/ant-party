window.AP = window.AP || {};

AP.config = {
  defaults: {
    foodEvery: 5,   // N: choose a food after this many questions
    partyAt: 20,    // M: the party starts after this many questions
    maxTries: 0,    // tries before the answer is shown; 0 = unlimited
    types: { mul: true, div: true, addsub100: true, addsub1000: true },
    tables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    skipEasy: true, // leave out ×1 and ×10 as the second factor
    sfx: true,
    music: true,
  },

  limits: {
    foodEvery: [1, 25],
    partyAt: [1, 60],
  },

  // Music files, by the screen they play on. Swap in your own files here.
  music: {
    home: 'audio/main-theme.wav',
    quiz: 'audio/quiz-theme.wav',
    food: 'audio/food-jingle.wav',
    party: 'audio/party-theme.wav',
  },

  // Emoji are placeholders until the SVG foods arrive (phase 3).
  foods: [
    { id: 'cake', name: 'Cake', emoji: '🎂' },
    { id: 'watermelon', name: 'Watermelon', emoji: '🍉' },
    { id: 'cheese', name: 'Cheese', emoji: '🧀' },
    { id: 'cookies', name: 'Cookies', emoji: '🍪' },
    { id: 'sugar', name: 'Sugar cubes', emoji: '🍬' },
    { id: 'strawberries', name: 'Strawberries', emoji: '🍓' },
    { id: 'doughnut', name: 'Doughnut', emoji: '🍩' },
    { id: 'honey', name: 'Honey', emoji: '🍯' },
    { id: 'apple', name: 'Apple slice', emoji: '🍎' },
    { id: 'pizza', name: 'Pizza', emoji: '🍕' },
    { id: 'grapes', name: 'Grapes', emoji: '🍇' },
    { id: 'cupcake', name: 'Cupcake', emoji: '🧁' },
    { id: 'jelly', name: 'Jelly', emoji: '🍮' },
    { id: 'pretzel', name: 'Pretzel', emoji: '🥨' },
    { id: 'lolly', name: 'Ice lolly', emoji: '🍭' },
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

  encouragements: [
    'You can do it!',
    'Nearly there!',
    'Have another go!',
    "Don't give up!",
    "You've got this!",
    'Ants never give up!',
  ],
};
