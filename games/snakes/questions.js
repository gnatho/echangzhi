var snakesQuestions = [
  {
    name: "Level 1 – Easy",
    description: "Simple vocabulary and basic concepts",
    questions: [
      "What is the opposite of 'big'?",
      "Name a fruit that starts with 'A'.",
      "How many legs does a cat have?",
      "What color is the sky on a clear day?",
      "Name something that is cold.",
      "What do you use to write?",
      "Name a vegetable that is green.",
      "How many days are in a week?",
      "What animal says 'moo'?",
      "Name a shape with three sides.",
      "What do you wear on your feet?",
      "Name something that is round.",
      "What season comes after winter?",
      "How many fingers are on one hand?",
      "Name a body of water."
    ]
  },
  {
    name: "Level 2 – Basic",
    description: "Common words and simple spelling",
    questions: [
      "Spell the word 'beautiful'.",
      "What is the past tense of 'go'?",
      "Name a synonym for 'happy'.",
      "How many vowels are in the English alphabet?",
      "What is the plural of 'child'?",
      "Name an antonym for 'fast'.",
      "What rhymes with 'cat'?",
      "Spell the word 'friend'.",
      "Name a word that starts with 'TH'.",
      "What is the opposite of 'above'?",
      "How many consonants are in the word 'school'?",
      "Name a homophone for 'flower'.",
      "What is the past tense of 'eat'?",
      "Spell the word 'together'.",
      "Name a word with a silent letter."
    ]
  },
  {
    name: "Level 3 – Intermediate",
    description: "Grammar and sentence structure",
    questions: [
      "What is a noun? Give an example.",
      "Name three types of punctuation.",
      "What is the difference between 'their' and 'there'?",
      "Give an example of an adjective.",
      "What is a verb? Give an example.",
      "Name a conjunction and use it in a sentence.",
      "What is the past tense of 'swim'?",
      "Give an example of an adverb.",
      "What is a compound word? Give an example.",
      "Name the three articles in English.",
      "What is the plural of 'mouse'?",
      "Give an example of a proper noun.",
      "What is the difference between 'a' and 'an'?",
      "Name a preposition and use it in a phrase.",
      "What is an exclamation mark used for?"
    ]
  },
  {
    name: "Level 4 – Challenging",
    description: "Reading comprehension and vocabulary",
    questions: [
      "What is a synonym for 'enormous'?",
      "Name the four types of sentences.",
      "What is the difference between 'affect' and 'effect'?",
      "Give an example of an onomatopoeia.",
      "What is the past participle of 'write'?",
      "Name a word with three syllables.",
      "What is the difference between 'its' and 'it's'?",
      "Give an example of alliteration.",
      "What is the comparative form of 'good'?",
      "Name a prefix that means 'not'.",
      "What is the superlative form of 'bad'?",
      "Give an example of a simile.",
      "What is the difference between 'who' and 'whom'?",
      "Name a suffix that makes a word an adjective.",
      "What is the past tense of 'bring'?"
    ]
  },
  {
    name: "Level 5 – Hard",
    description: "Advanced vocabulary and word origins",
    questions: [
      "What is the difference between ' stationary' and 'stationery'?",
      "Name a word borrowed from another language.",
      "What is the difference between 'complement' and 'compliment'?",
      "Give an example of a palindrome.",
      "What is the difference between 'principal' and 'principle'?",
      "Name a word with four syllables.",
      "What is the difference between 'desert' and 'dessert'?",
      "Give an example of personification.",
      "What is the difference between 'accept' and 'except'?",
      "Name a word with a Greek root.",
      "What is the difference between 'breath' and 'breathe'?",
      "Give an example of a metaphor.",
      "What is the difference between 'lose' and 'loose'?",
      "Name a word with a Latin root.",
      "What is the difference between 'cite', 'site', and 'sight'?"
    ]
  },
  {
    name: "Level 6 – Expert",
    description: "Complex language concepts",
    questions: [
      "Explain what an oxymoron is and give an example.",
      "What is the difference between 'imply' and 'infer'?",
      "Name three words that are both nouns and verbs.",
      "What is the subjunctive mood? Give an example.",
      "Explain the difference between 'farther' and 'further'.",
      "What is a dangling modifier? Give an example.",
      "Name three types of figurative language.",
      "What is the difference between 'nauseous' and 'nauseated'?",
      "Explain what a gerund is and give an example.",
      "What is the difference between 'disinterested' and 'uninterested'?",
      "Name two words that have changed meaning over time.",
      "What is the difference between 'who's' and 'whose'?",
      "Explain what a participle phrase is.",
      "What is the difference between 'assure', 'ensure', and 'insure'?",
      "Name a word that is its own antonym (contranym)."
    ]
  },
  {
    name: "Level 7 – Master",
    description: "Linguistic nuances and etymology",
    questions: [
      "Explain the concept of linguistic register and give an example.",
      "What is the difference between 'that' and 'which' in relative clauses?",
      "Explain what an ergative verb is and give an example.",
      "What is the historical origin of the word 'quarantine'?",
      "Explain the concept of a shibboleth.",
      "What is the difference between 'anxious' and 'eager'?",
      "Explain what a phrasal verb is and give three examples.",
      "What is the origin of the phrase 'bite the bullet'?",
      "Explain the difference between a paradox and an oxymoron.",
      "What is a hapax legomenon?",
      "Explain what a discourse marker is and give three examples.",
      "What is the origin of the word 'salary'?",
      "Explain the concept of grammatical aspect with examples.",
      "What is the difference between 'appraise' and 'apprise'?",
      "Name a word that exists only in English with no translation equivalent."
    ]
  }
];

var SNAKES_LADDERS_CONFIG = {
  gridSizes: [6, 8, 10],
  difficultyLevels: 7,
  playerTokens: [
    { id: "lion", emoji: "🦁", name: "Lion" },
    { id: "frog", emoji: "🐸", name: "Frog" },
    { id: "rocket", emoji: "🚀", name: "Rocket" },
    { id: "star", emoji: "⭐", name: "Star" },
    { id: "gem", emoji: "💎", name: "Gem" },
    { id: "dragon", emoji: "🐉", name: "Dragon" },
    { id: "unicorn", emoji: "🦄", name: "Unicorn" },
    { id: "robot", emoji: "🤖", name: "Robot" },
    { id: "owl", emoji: "🦉", name: "Owl" },
    { id: "cat", emoji: "🐱", name: "Cat" },
    { id: "flame", emoji: "🔥", name: "Flame" },
    { id: "crown", emoji: "👑", name: "Crown" }
  ],
  defaultSnakes: [
    { start: 97, end: 78 },
    { start: 95, end: 56 },
    { start: 93, end: 68 },
    { start: 87, end: 24 },
    { start: 64, end: 60 },
    { start: 48, end: 26 },
    { start: 36, end: 6 }
  ],
  defaultLadders: [
    { start: 3, end: 51 },
    { start: 6, end: 27 },
    { start: 20, end: 70 },
    { start: 36, end: 55 },
    { start: 63, end: 95 },
    { start: 68, end: 98 },
    { start: 71, end: 92 }
  ],
  snakeCountByGrid: { 6: 4, 8: 5, 10: 6 },
  ladderCountByGrid: { 6: 4, 8: 5, 10: 6 }
};
