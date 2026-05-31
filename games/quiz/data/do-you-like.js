window.QUIZ_SETS = window.QUIZ_SETS || {};
window.QUIZ_SETS["do-you-like"] = {
  id: "do-you-like",
  name: "Do you like this/these...?",
  icon: "👍",
  description: "Singular & plural with 'this' and 'these'",
  badges: {
    dt:   { label: "This or These?",  cls: "qt" },
    noun: { label: "Pick the Noun",   cls: "mw" }
  },
  questions: [
    {
      id:1, type:"dt",
      sentence:"Do you like _______ apple?",
      options:["this","these"],
      correct:"this",
      tip:'"Apple" is one (singular), so we use this. → "Do you like this apple?"'
    },
    {
      id:2, type:"dt",
      sentence:"Do you like _______ cookies?",
      options:["this","these"],
      correct:"these",
      tip:'"Cookies" is more than one (plural), so we use these. → "Do you like these cookies?"'
    },
    {
      id:3, type:"noun",
      sentence:"Do you like this _______?",
      options:["cat","cats","dogs","books"],
      correct:"cat",
      tip:'After this we use a singular noun (only one). "Cat" is singular.'
    },
    {
      id:4, type:"dt",
      sentence:"Do you like _______ red balloon?",
      options:["this","these"],
      correct:"this",
      tip:'"Balloon" is one, so we use this. → "Do you like this red balloon?"'
    },
    {
      id:5, type:"noun",
      sentence:"Do you like these _______?",
      options:["flowers","flower","cake","banana"],
      correct:"flowers",
      tip:'After these we use a plural noun (more than one). "Flowers" is plural.'
    },
    {
      id:6, type:"dt",
      sentence:"Do you like _______ toy car?",
      options:["this","these"],
      correct:"this",
      tip:'"Toy car" is one, so we use this. → "Do you like this toy car?"'
    },
    {
      id:7, type:"dt",
      sentence:"Do you like _______ socks?",
      options:["this","these"],
      correct:"these",
      tip:'"Socks" is plural (a pair, more than one), so we use these.'
    },
    {
      id:8, type:"noun",
      sentence:"Do you like this _______?",
      options:["song","songs","games","pens"],
      correct:"song",
      tip:'After this we need one thing. "Song" is singular.'
    },
    {
      id:9, type:"dt",
      sentence:"Do you like _______ pizza?",
      options:["this","these"],
      correct:"this",
      tip:'"Pizza" is one, so we use this. → "Do you like this pizza?"'
    },
    {
      id:10, type:"noun",
      sentence:"Do you like these _______?",
      options:["candies","candy","apple","book"],
      correct:"candies",
      tip:'After these we need more than one. "Candies" is plural.'
    },
    {
      id:11, type:"dt",
      sentence:"Do you like _______ pictures?",
      options:["this","these"],
      correct:"these",
      tip:'"Pictures" is plural (more than one picture), so we use these.'
    },
    {
      id:12, type:"dt",
      sentence:"Do you like _______ ice cream?",
      options:["this","these"],
      correct:"this",
      tip:'"Ice cream" is one (singular), so we use this.'
    },
    {
      id:13, type:"noun",
      sentence:"Do you like this _______?",
      options:["bag","bags","shoes","cars"],
      correct:"bag",
      tip:'After this we use a singular noun. "Bag" is one.'
    },
    {
      id:14, type:"dt",
      sentence:"Do you like _______ puppies?",
      options:["this","these"],
      correct:"these",
      tip:'"Puppies" is plural (more than one puppy), so we use these.'
    },
    {
      id:15, type:"noun",
      sentence:"Do you like these _______?",
      options:["stickers","sticker","hat","ball"],
      correct:"stickers",
      tip:'After these we need a plural noun. "Stickers" is more than one.'
    },
    {
      id:16, type:"dt",
      sentence:"Do you like _______ blue hat?",
      options:["this","these"],
      correct:"this",
      tip:'"Hat" is one, so we use this. → "Do you like this blue hat?"'
    },
    {
      id:17, type:"dt",
      sentence:"Do you like _______ bananas?",
      options:["this","these"],
      correct:"these",
      tip:'"Bananas" is plural (more than one), so we use these.'
    },
    {
      id:18, type:"noun",
      sentence:"Do you like this _______?",
      options:["doll","dolls","toys","pens"],
      correct:"doll",
      tip:'After this we need one thing. "Doll" is singular.'
    },
    {
      id:19, type:"dt",
      sentence:"Do you like _______ chocolate?",
      options:["this","these"],
      correct:"this",
      tip:'"Chocolate" is uncountable here (one piece/bar). We use this.'
    },
    {
      id:20, type:"noun",
      sentence:"Do you like these _______?",
      options:["pencils","pencil","pen","ruler"],
      correct:"pencils",
      tip:'After these we need more than one. "Pencils" is plural.'
    }
  ]
};
