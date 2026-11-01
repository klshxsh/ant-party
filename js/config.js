window.AP = window.AP || {};

AP.config = {
  defaults: {
    foodEvery: 5,   // N: choose a food after this many questions
    partyAt: 20,    // M: the party starts after this many questions
    maxTries: 0,    // tries before the answer is shown; 0 = unlimited
    types: { mul: true, div: true, addsub100: false, addsub1000: false },
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
