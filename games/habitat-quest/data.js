const HABITATS = [
  {
    id: 'polar',
    name: 'Polar Habitat',
    short: 'Polar',
    emoji: '❄️',
    place: 'a polar habitat',
    description: 'A very cold place with ice and snow.',
    accent: '#60a5fa',
    soft: '#eff6ff'
  },
  {
    id: 'grassland',
    name: 'Grassland',
    short: 'Grassland',
    emoji: '🌾',
    place: 'the grassland',
    description: 'A place with lots of grass.',
    accent: '#84cc16',
    soft: '#f7fee7'
  },
  {
    id: 'rainforest',
    name: 'Rainforest',
    short: 'Rainforest',
    emoji: '🌴',
    place: 'the rainforest',
    description: 'A hot, wet place with many trees.',
    accent: '#16a34a',
    soft: '#dcfce7'
  },
  {
    id: 'ocean',
    name: 'Ocean',
    short: 'Ocean',
    emoji: '🌊',
    place: 'the ocean',
    description: 'A large body of salt water.',
    accent: '#0284c7',
    soft: '#e0f2fe'
  }
];

const ANIMALS = [
  {
    id: 'zebra',
    name: 'Zebra',
    emoji: '🦓',
    image: '../../static/imgs/words/fl_big/SM2_U2_W3_zebra_1.jpg',
    habitats: ['grassland'],
    clues: [
      'I have black and white stripes.',
      'I look like a horse.',
      'I live in the grassland.'
    ],
    fact: 'A zebra has black and white stripes.'
  },
  {
    id: 'crocodile',
    name: 'Crocodile',
    emoji: '🐊',
    image: '../../static/imgs/words/fl_big/SM2_U2_W4_crocodile_1.jpg',
    habitats: ['grassland'],
    clues: [
      'I am green.',
      'I have big teeth.',
      'I live in the water in the grassland.'
    ],
    fact: 'A crocodile has big teeth and lives near water.'
  },
  {
    id: 'monkey',
    name: 'Monkey',
    emoji: '🐵',
    image: '../../static/imgs/words/fl_big/SM2_U2_W8_monkey_1.jpg',
    habitats: ['rainforest'],
    clues: [
      'I like bananas.',
      'I can climb trees.',
      'I live in the rainforest.'
    ],
    fact: 'A monkey can climb trees and eat bananas.'
  },
  {
    id: 'fish',
    name: 'Fish',
    emoji: '🐟',
    image: '../../static/imgs/words/fl_big/SM1_U4_W7_fish_1.jpg',
    habitats: ['ocean'],
    clues: [
      'I live in the water.',
      'I can swim.',
      'I have fins and a tail.'
    ],
    fact: 'A fish has fins and a tail. It can swim.'
  },
  {
    id: 'polar-bear',
    name: 'Polar Bear',
    emoji: '🐻‍❄️',
    image: '../../static/imgs/words/fl_big/SM2_U2_W1_polar_bear_1.jpg',
    habitats: ['polar'],
    clues: [
      'I am big.',
      'I am white.',
      'I live in a very cold place.'
    ],
    fact: 'A polar bear is white and lives in a very cold place.'
  },
  {
    id: 'lizard',
    name: 'Lizard',
    emoji: '🦎',
    image: '../../static/imgs/words/fl_big/SM1_U3_W8_lizard_1.jpg',
    habitats: ['rainforest'],
    clues: [
      'I am small.',
      'I have four legs.',
      'I live in warm, wet places.'
    ],
    fact: 'A lizard is small and has four legs.'
  },
  {
    id: 'elephant',
    name: 'Elephant',
    emoji: '🐘',
    image: '../../static/imgs/words/fl_big/SM1_U3_W2_elephant_1.jpg',
    habitats: ['grassland', 'rainforest'],
    clues: [
      'I am very big.',
      'I have a long trunk.',
      'I live in the grassland or the rainforest.'
    ],
    fact: 'An elephant has a long trunk and big ears.'
  },
  {
    id: 'tuna',
    name: 'Tuna',
    emoji: '🐟',
    image: 'img/tuna.svg',
    habitats: ['ocean'],
    clues: [
      'I live in the ocean.',
      'I am a big fish.',
      'I swim very fast.'
    ],
    fact: 'A tuna is a big fish that swims very fast.'
  },
  {
    id: 'frog',
    name: 'Frog',
    emoji: '🐸',
    image: '../../static/imgs/words/fl_big/SM1_U3_W6_frog_1.jpg',
    habitats: ['grassland'],
    clues: [
      'I am green.',
      'I can jump.',
      'I live near water in the grassland.'
    ],
    fact: 'A frog can jump and lives near water.'
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    emoji: '🦋',
    image: 'img/butterfly.svg',
    habitats: ['grassland', 'rainforest'],
    clues: [
      'I have colourful wings.',
      'I like flowers.',
      'I live in warm places.'
    ],
    fact: 'A butterfly has colourful wings.'
  },
  {
    id: 'snake',
    name: 'Snake',
    emoji: '🐍',
    image: '../../static/imgs/words/fl_big/SM2_U2_W9_snake_1.jpg',
    habitats: ['grassland'],
    clues: [
      'I am long.',
      'I have no legs.',
      'I live in the grassland.'
    ],
    fact: 'A snake is long and has no legs.'
  },
  {
    id: 'penguin',
    name: 'Penguin',
    emoji: '🐧',
    image: 'img/penguin.svg',
    habitats: ['polar', 'ocean'],
    clues: [
      'I am black and white.',
      'I cannot fly.',
      'I live in a very cold place.'
    ],
    fact: 'A penguin is black and white and cannot fly.'
  },
  {
    id: 'parrot',
    name: 'Parrot',
    emoji: '🦜',
    image: '../../static/imgs/words/fl_big/SM2_U2_W7_parrot_1.jpg',
    habitats: ['rainforest'],
    clues: [
      'I have colourful feathers.',
      'I can talk.',
      'I live in the rainforest.'
    ],
    fact: 'A parrot has colourful feathers and can talk.'
  }
];

const EXTRA_ANIMALS = [
  {
    id: 'lion',
    name: 'Lion',
    emoji: '🦁',
    image: '../../static/imgs/words/fl_big/SM0_U4_W4_lion_1.jpg',
    habitats: ['grassland'],
    clues: [
      'I am a big cat.',
      'I have a loud roar.',
      'I live in the grassland.'
    ],
    fact: 'A lion is a big cat with a loud roar.'
  },
  {
    id: 'tiger',
    name: 'Tiger',
    emoji: '🐯',
    image: '../../static/imgs/words/fl_big/SM2_U2_W6_tiger_1.jpg',
    habitats: ['rainforest'],
    clues: [
      'I am orange with black stripes.',
      'I am a big cat.',
      'I live in the rainforest.'
    ],
    fact: 'A tiger is orange with black stripes.'
  },
  {
    id: 'bear',
    name: 'Bear',
    emoji: '🐻',
    image: '../../static/imgs/words/fl_big/SM2_U2_W2_bear_1.jpg',
    habitats: ['rainforest'],
    clues: [
      'I am big and furry.',
      'I like honey.',
      'I live in the forest.'
    ],
    fact: 'A bear is big and furry. It likes honey.'
  },
  {
    id: 'hippo',
    name: 'Hippo',
    emoji: '🦛',
    image: '../../static/imgs/words/fl_big/SM2_U2_W5_hippo_1.jpg',
    habitats: ['grassland'],
    clues: [
      'I am very big.',
      'I have a huge mouth.',
      'I live near water in the grassland.'
    ],
    fact: 'A hippo has a huge mouth and lives near water.'
  },
  {
    id: 'dolphin',
    name: 'Dolphin',
    emoji: '🐬',
    image: '../../static/imgs/words/fl_big/SM3_U5_W1_dolphin_1.jpg',
    habitats: ['ocean'],
    clues: [
      'I live in the ocean.',
      'I am a smart animal.',
      'I can jump out of the water.'
    ],
    fact: 'A dolphin is a smart animal that lives in the ocean.'
  },
  {
    id: 'seal',
    name: 'Seal',
    emoji: '🦭',
    image: '../../static/imgs/words/fl_big/SM3_U5_W2_seal_1.jpg',
    habitats: ['polar', 'ocean'],
    clues: [
      'I have whiskers.',
      'I can swim very well.',
      'I live in cold places.'
    ],
    fact: 'A seal has whiskers and can swim very well.'
  },
  {
    id: 'turtle',
    name: 'Turtle',
    emoji: '🐢',
    image: '../../static/imgs/words/fl_big/SM3_U5_W3_turtle_1.jpg',
    habitats: ['ocean'],
    clues: [
      'I have a hard shell.',
      'I am very slow.',
      'I live in the ocean.'
    ],
    fact: 'A turtle has a hard shell and moves very slowly.'
  },
  {
    id: 'octopus',
    name: 'Octopus',
    emoji: '🐙',
    image: '../../static/imgs/words/fl_big/SM3_U5_W4_octopus_1.jpg',
    habitats: ['ocean'],
    clues: [
      'I have eight arms.',
      'I live in the ocean.',
      'I can change colour.'
    ],
    fact: 'An octopus has eight arms and can change colour.'
  },
  {
    id: 'starfish',
    name: 'Starfish',
    emoji: '⭐',
    image: '../../static/imgs/words/fl_big/SM3_U5_W6_starfish_1.jpg',
    habitats: ['ocean'],
    clues: [
      'I am shaped like a star.',
      'I have five arms.',
      'I live in the ocean.'
    ],
    fact: 'A starfish is shaped like a star and lives in the ocean.'
  },
  {
    id: 'seahorse',
    name: 'Seahorse',
    emoji: '🐠',
    image: '../../static/imgs/words/fl_big/SM3_U5_W8_seahorse_1.jpg',
    habitats: ['ocean'],
    clues: [
      'I am a small fish.',
      'I have a long tail.',
      'I live in the ocean.'
    ],
    fact: 'A seahorse is a small fish with a long tail.'
  },
  {
    id: 'toucan',
    name: 'Toucan',
    emoji: '🐦',
    image: '../../static/imgs/words/fl_big/SM5_U2_W2_toucan_1.jpg',
    habitats: ['rainforest'],
    clues: [
      'I have a big, colourful beak.',
      'I live in the rainforest.',
      'I like fruit.'
    ],
    fact: 'A toucan has a big, colourful beak.'
  },
  {
    id: 'sloth',
    name: 'Sloth',
    emoji: '🦥',
    image: '../../static/imgs/words/fl_big/SM5_U2_W4_sloth_1.jpg',
    habitats: ['rainforest'],
    clues: [
      'I move very slowly.',
      'I have long claws.',
      'I live in the rainforest.'
    ],
    fact: 'A sloth moves very slowly and has long claws.'
  },
  {
    id: 'anaconda',
    name: 'Anaconda',
    emoji: '🐍',
    image: '../../static/imgs/words/fl_big/SM5_U2_W5_anaconda_1.jpg',
    habitats: ['rainforest'],
    clues: [
      'I am a giant snake.',
      'I live in the rainforest.',
      'I can swim.'
    ],
    fact: 'An anaconda is a giant snake that can swim.'
  },
  {
    id: 'jaguar',
    name: 'Jaguar',
    emoji: '🐆',
    image: '../../static/imgs/words/fl_big/SM5_U2_W7_jaguar_1.jpg',
    habitats: ['rainforest'],
    clues: [
      'I am a big cat.',
      'I have spots.',
      'I live in the rainforest.'
    ],
    fact: 'A jaguar is a big cat with spots.'
  },
  {
    id: 'anteater',
    name: 'Anteater',
    emoji: '🐜',
    image: '../../static/imgs/words/fl_big/SM5_U2_W8_anteater_1.jpg',
    habitats: ['rainforest'],
    clues: [
      'I have a long nose.',
      'I eat ants.',
      'I live in the rainforest.'
    ],
    fact: 'An anteater has a long nose and eats ants.'
  },
  {
    id: 'beetle',
    name: 'Beetle',
    emoji: '🪲',
    image: '../../static/imgs/words/fl_big/SM5_U2_W9_beetle_1.jpg',
    habitats: ['rainforest', 'grassland'],
    clues: [
      'I am a small insect.',
      'I have six legs.',
      'I live in the rainforest.'
    ],
    fact: 'A beetle is a small insect with six legs.'
  },
  {
    id: 'spider',
    name: 'Spider',
    emoji: '🕷️',
    image: '../../static/imgs/words/fl_big/SM1_U3_W3_spider_1.jpg',
    habitats: ['rainforest'],
    clues: [
      'I have eight legs.',
      'I can make a web.',
      'I live in the rainforest.'
    ],
    fact: 'A spider has eight legs and can make a web.'
  },
  {
    id: 'cat',
    name: 'Cat',
    emoji: '🐱',
    image: '../../static/imgs/words/fl_big/SM1_U3_W4_cat_1.jpg',
    habitats: ['grassland'],
    clues: [
      'I say meow.',
      'I like milk.',
      'I have soft fur.'
    ],
    fact: 'A cat says meow and has soft fur.'
  },
  {
    id: 'dog',
    name: 'Dog',
    emoji: '🐶',
    image: '../../static/imgs/words/fl_big/SM1_U3_W9_dog_1.jpg',
    habitats: ['grassland'],
    clues: [
      'I say woof.',
      'I like bones.',
      'I can run fast.'
    ],
    fact: 'A dog says woof and can run fast.'
  },
  {
    id: 'duck',
    name: 'Duck',
    emoji: '🦆',
    image: '../../static/imgs/words/fl_big/SM1_U3_W7_duck_1.jpg',
    habitats: ['grassland'],
    clues: [
      'I say quack.',
      'I can swim.',
      'I have a flat beak.'
    ],
    fact: 'A duck says quack and has a flat beak.'
  },
  {
    id: 'donkey',
    name: 'Donkey',
    emoji: '🐴',
    image: '../../static/imgs/words/fl_big/SM1_U3_W1_donkey_1.jpg',
    habitats: ['grassland'],
    clues: [
      'I look like a small horse.',
      'I have long ears.',
      'I can carry things.'
    ],
    fact: 'A donkey has long ears and can carry things.'
  },
  {
    id: 'rat',
    name: 'Rat',
    emoji: '🐀',
    image: '../../static/imgs/words/fl_big/SM1_U3_W5_rat_1.jpg',
    habitats: ['grassland'],
    clues: [
      'I am small.',
      'I have a long tail.',
      'I like cheese.'
    ],
    fact: 'A rat is small and has a long tail.'
  }
];

const MYSTERY_ANIMALS = ANIMALS.concat(EXTRA_ANIMALS);

const HABITATS_BY_ID = Object.fromEntries(HABITATS.map(h => [h.id, h]));
const ANIMALS_BY_ID = Object.fromEntries(MYSTERY_ANIMALS.map(a => [a.id, a]));
const SINGLE_HABITAT_ANIMALS = ANIMALS.filter(a => a.habitats.length === 1);
const MULTI_HABITAT_ANIMALS = ANIMALS.filter(a => a.habitats.length > 1);