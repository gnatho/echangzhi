window.QUIZ_SETS = window.QUIZ_SETS || {};
window.QUIZ_SETS["present-perfect"] = {
  id: "present-perfect",
  name: "Have/Has ... yet?",
  icon: "⏳",
  description: "Present perfect with 'yet'",
  badges: {
    aux: { label: "Have or Has?",      cls: "qt" },
    pp:  { label: "Past Participle",   cls: "mw" }
  },
  questions: [
    {
      id:1, type:"aux",
      sentence:"_______ you finished your homework yet?",
      options:["Have","Has"],
      correct:"Have",
      tip:'With "you" we use Have. → "Have you finished your homework yet?"'
    },
    {
      id:2, type:"aux",
      sentence:"_______ she eaten breakfast yet?",
      options:["Have","Has"],
      correct:"Has",
      tip:'With third-person singular (he / she / it) we use Has. → "Has she eaten…yet?"'
    },
    {
      id:3, type:"pp",
      sentence:"Have you _______ the new movie yet?",
      options:["seen","saw","see","seeing"],
      correct:"seen",
      tip:'Present perfect uses the past participle. The past participle of "see" is seen.'
    },
    {
      id:4, type:"aux",
      sentence:"_______ Tom called his mother yet?",
      options:["Have","Has"],
      correct:"Has",
      tip:'"Tom" is one person (he), so we use Has. → "Has Tom called…yet?"'
    },
    {
      id:5, type:"pp",
      sentence:"Has your sister _______ her room yet?",
      options:["cleaned","cleaning","clean","cleans"],
      correct:"cleaned",
      tip:'After "has" we need the past participle. For regular verbs it ends in -ed: cleaned.'
    },
    {
      id:6, type:"aux",
      sentence:"_______ they arrived at the airport yet?",
      options:["Have","Has"],
      correct:"Have",
      tip:'With "they" (plural) we use Have. → "Have they arrived…yet?"'
    },
    {
      id:7, type:"pp",
      sentence:"Have you _______ your medicine yet?",
      options:["taken","took","take","taking"],
      correct:"taken",
      tip:'The past participle of "take" is taken. → "Have you taken your medicine yet?"'
    },
    {
      id:8, type:"aux",
      sentence:"_______ the bus left the station yet?",
      options:["Have","Has"],
      correct:"Has",
      tip:'"The bus" is one thing (it), so we use Has. → "Has the bus left…yet?"'
    },
    {
      id:9, type:"pp",
      sentence:"Has Dad _______ home from work yet?",
      options:["come","came","comes","coming"],
      correct:"come",
      tip:'The past participle of "come" is come (same as base form). → "Has Dad come home…yet?"'
    },
    {
      id:10, type:"aux",
      sentence:"_______ your parents booked the holiday yet?",
      options:["Have","Has"],
      correct:"Have",
      tip:'"Your parents" is plural (they), so we use Have.'
    },
    {
      id:11, type:"pp",
      sentence:"Have the children _______ their teeth yet?",
      options:["brushed","brush","brushing","brushes"],
      correct:"brushed",
      tip:'"Brush" is regular: past participle = brushed. → "Have the children brushed their teeth yet?"'
    },
    {
      id:12, type:"aux",
      sentence:"_______ Anna written the email yet?",
      options:["Have","Has"],
      correct:"Has",
      tip:'"Anna" is one person (she), so we use Has.'
    },
    {
      id:13, type:"pp",
      sentence:"Have you _______ your keys yet?",
      options:["found","find","finded","finding"],
      correct:"found",
      tip:'"Find" is irregular: find → found → found. → "Have you found your keys yet?"'
    },
    {
      id:14, type:"aux",
      sentence:"_______ it stopped raining yet?",
      options:["Have","Has"],
      correct:"Has",
      tip:'With "it" (third-person singular) we use Has. → "Has it stopped raining yet?"'
    },
    {
      id:15, type:"pp",
      sentence:"Has Mum _______ dinner yet?",
      options:["made","make","maked","making"],
      correct:"made",
      tip:'"Make" is irregular: make → made → made. → "Has Mum made dinner yet?"'
    },
    {
      id:16, type:"aux",
      sentence:"_______ you and Sam finished the project yet?",
      options:["Have","Has"],
      correct:"Have",
      tip:'"You and Sam" = plural (we / you), so we use Have.'
    },
    {
      id:17, type:"pp",
      sentence:"Have you _______ to your grandma yet?",
      options:["spoken","spoke","speak","speaked"],
      correct:"spoken",
      tip:'"Speak" is irregular: speak → spoke → spoken. → "Have you spoken to your grandma yet?"'
    },
    {
      id:18, type:"aux",
      sentence:"_______ the package arrived yet?",
      options:["Have","Has"],
      correct:"Has",
      tip:'"The package" is one thing (it), so we use Has.'
    },
    {
      id:19, type:"pp",
      sentence:"Has the teacher _______ the test results yet?",
      options:["given","gave","give","gived"],
      correct:"given",
      tip:'"Give" is irregular: give → gave → given. → "Has the teacher given the results yet?"'
    },
    {
      id:20, type:"pp",
      sentence:"Have you _______ your homework yet?",
      options:["done","did","do","doed"],
      correct:"done",
      tip:'"Do" is irregular: do → did → done. → "Have you done your homework yet?"'
    }
  ]
};
