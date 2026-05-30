window.QUIZ_SETS = window.QUIZ_SETS || {};
window.QUIZ_SETS["quantifiers"] = {
  id: "quantifiers",
  name: "How Many vs. How Much",
  icon: "🥛",
  description: "Quantifiers & measure words",
  badges: {
    qt: { label: "How Many / How Much", cls: "qt" },
    mw: { label: "Measure Word",        cls: "mw" }
  },
  questions: [
    {
      id:1, type:"qt",
      sentence:"_______ water do you drink every day?",
      options:["How many","How much"],
      correct:"How much",
      tip:'"Water" is uncountable — you can\'t say "one water" — so we use How much.'
    },
    {
      id:2, type:"mw",
      sentence:"Please buy a _______ of bread from the bakery.",
      options:["loaf","glass","bar","bunch"],
      correct:"loaf",
      tip:'Bread comes in a loaf. We say "a loaf of bread."'
    },
    {
      id:3, type:"qt",
      sentence:"_______ bananas are on the table?",
      options:["How many","How much"],
      correct:"How many",
      tip:'Bananas are countable (1 banana, 2 bananas…), so we ask How many.'
    },
    {
      id:4, type:"mw",
      sentence:"I ate a _______ of pizza for lunch.",
      options:["slice","bottle","cup","bowl"],
      correct:"slice",
      tip:'Pizza is cut into slices. We say "a slice of pizza."'
    },
    {
      id:5, type:"qt",
      sentence:"_______ sugar is in your tea?",
      options:["How many","How much"],
      correct:"How much",
      tip:'Sugar is uncountable — we use How much. You cannot count individual grains.'
    },
    {
      id:6, type:"mw",
      sentence:"She drank a _______ of water after running.",
      options:["glass","loaf","slice","bar"],
      correct:"glass",
      tip:'Liquids are measured in glasses. We say "a glass of water."'
    },
    {
      id:7, type:"qt",
      sentence:"_______ students are in your classroom?",
      options:["How many","How much"],
      correct:"How many",
      tip:'Students are countable people (1 student, 2 students…), so we ask How many.'
    },
    {
      id:8, type:"mw",
      sentence:"He bought a _______ of chocolate at the shop.",
      options:["bar","loaf","slice","cup"],
      correct:"bar",
      tip:'Chocolate is sold in bars. We say "a bar of chocolate."'
    },
    {
      id:9, type:"qt",
      sentence:"_______ milk do we need for the cake?",
      options:["How many","How much"],
      correct:"How much",
      tip:'Milk is a liquid — uncountable — so we use How much.'
    },
    {
      id:10, type:"mw",
      sentence:"Mom put a _______ of rice in the pot.",
      options:["bowl","slice","bar","loaf"],
      correct:"bowl",
      tip:'Rice is usually served in a bowl. We say "a bowl of rice."'
    },
    {
      id:11, type:"qt",
      sentence:"_______ pencils do you have in your bag?",
      options:["How many","How much"],
      correct:"How many",
      tip:'Pencils are countable objects, so we ask How many.'
    },
    {
      id:12, type:"mw",
      sentence:"Dad ordered a _______ of coffee this morning.",
      options:["cup","loaf","slice","bunch"],
      correct:"cup",
      tip:'Coffee is served in cups. We say "a cup of coffee."'
    },
    {
      id:13, type:"qt",
      sentence:"_______ homework do you have today?",
      options:["How many","How much"],
      correct:"How much",
      tip:'"Homework" is uncountable in English — we never say "two homeworks" — so we use How much.'
    },
    {
      id:14, type:"mw",
      sentence:"She bought a _______ of grapes at the market.",
      options:["bunch","loaf","glass","bar"],
      correct:"bunch",
      tip:'Grapes grow in clusters called bunches. We say "a bunch of grapes."'
    },
    {
      id:15, type:"qt",
      sentence:"_______ chairs are there in the living room?",
      options:["How many","How much"],
      correct:"How many",
      tip:'Chairs are countable objects (1 chair, 2 chairs…), so we ask How many.'
    },
    {
      id:16, type:"mw",
      sentence:"He poured a _______ of orange juice for breakfast.",
      options:["glass","loaf","bar","bunch"],
      correct:"glass",
      tip:'Juice is a liquid measured in glasses. We say "a glass of orange juice."'
    }
  ]
};
