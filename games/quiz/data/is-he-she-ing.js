window.QUIZ_SETS = window.QUIZ_SETS || {};
window.QUIZ_SETS["is-he-she-ing"] = {
  id: "is-he-she-ing",
  name: "Is he/she + -ing?",
  icon: "🏃",
  description: "Present continuous -ing forms",
  badges: {
    ing: { label: "-ing Verb", cls: "mw" }
  },
  questions: [
    {
      id:3, type:"ing",
      sentence:"Is he _______ a book?",
      options:["reading","read","reads","readed"],
      correct:"reading",
      tip:'After "Is he/she" we use the -ing form. "Read" → reading.'
    },
    {
      id:5, type:"ing",
      sentence:"Is she _______ in the park?",
      options:["running","run","runs","runed"],
      correct:"running",
      tip:'"Run" becomes "running" (double the n). → "Is she running in the park?"'
    },
    {
      id:7, type:"ing",
      sentence:"Is he _______ a picture?",
      options:["drawing","draw","draws","drawed"],
      correct:"drawing",
      tip:'After "Is he" we use the -ing form. "Draw" → drawing.'
    },
    {
      id:9, type:"ing",
      sentence:"Is she _______ her teeth?",
      options:["brushing","brush","brushes","brushed"],
      correct:"brushing",
      tip:'"Brush" → brushing. → "Is she brushing her teeth?"'
    },
    {
      id:11, type:"ing",
      sentence:"Is he _______ TV?",
      options:["watching","watch","watches","watched"],
      correct:"watching",
      tip:'"Watch" → watching. → "Is he watching TV?"'
    },
    {
      id:13, type:"ing",
      sentence:"Is she _______ a letter?",
      options:["writing","write","writes","writed"],
      correct:"writing",
      tip:'"Write" → writing (drop the e, add -ing).'
    },
    {
      id:15, type:"ing",
      sentence:"Is he _______ his hands?",
      options:["washing","wash","washes","washed"],
      correct:"washing",
      tip:'"Wash" → washing. → "Is he washing his hands?"'
    },
    {
      id:17, type:"ing",
      sentence:"Is she _______ to music?",
      options:["listening","listen","listens","listened"],
      correct:"listening",
      tip:'"Listen" → listening. → "Is she listening to music?"'
    },
    {
      id:19, type:"ing",
      sentence:"Is he _______ a sandwich?",
      options:["eating","eat","eats","eated"],
      correct:"eating",
      tip:'"Eat" → eating. → "Is he eating a sandwich?"'
    }
  ]
};