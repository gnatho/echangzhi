window.GRAMMAR_TOPICS = window.GRAMMAR_TOPICS || {};

window.GRAMMAR_TOPICS["since-vs-for"] = {
    id: "since-vs-for",
    name: "Since vs For",
    icon: "⏳",
    description: "Choose SINCE or FOR to say how long something has been happening.",
    rule: "FOR + a period of time (two hours, three days, ten years, a long time) \u2014 SINCE + a starting point in time (2010, Monday, lunchtime, I was born)",
    questions: [
        {
            id: 1,
            prompt: "I have lived in this town ___ 2010.",
            options: ["since", "for", "from"],
            correct: "since",
            tip: "2010 is a starting point in time, so use SINCE."
        },
        {
            id: 2,
            prompt: "I have lived in this town ___ ten years.",
            options: ["since", "for"],
            correct: "for",
            tip: "Ten years is a period of time, so use FOR."
        },
        {
            id: 3,
            prompt: "She has been a teacher ___ 2015.",
            options: ["since", "for"],
            correct: "since",
            tip: "2015 is a starting point \u2192 SINCE."
        },
        {
            id: 4,
            prompt: "She has been a teacher ___ six years.",
            options: ["since", "for"],
            correct: "for",
            tip: "Six years is a length of time \u2192 FOR."
        },
        {
            id: 5,
            prompt: "We have known each other ___ primary school.",
            options: ["since", "for"],
            correct: "since",
            tip: "Primary school is when it started \u2192 SINCE."
        },
        {
            id: 6,
            prompt: "We have known each other ___ a very long time.",
            options: ["since", "for", "during"],
            correct: "for",
            tip: "A very long time is a period \u2192 FOR."
        },
        {
            id: 7,
            prompt: "He has been ill ___ Monday.",
            options: ["since", "for"],
            correct: "since",
            tip: "Monday is a starting point \u2192 SINCE."
        },
        {
            id: 8,
            prompt: "He has been ill ___ three days.",
            options: ["since", "for"],
            correct: "for",
            tip: "Three days is a period \u2192 FOR."
        },
        {
            id: 9,
            prompt: "They have been married ___ 2012.",
            options: ["since", "for"],
            correct: "since",
            tip: "2012 is a starting point \u2192 SINCE."
        },
        {
            id: 10,
            prompt: "They have been married ___ ten years.",
            options: ["since", "for"],
            correct: "for",
            tip: "Ten years is a period \u2192 FOR."
        },
        {
            id: 11,
            prompt: "I haven't seen Tom ___ last week.",
            options: ["since", "for"],
            correct: "since",
            tip: "Last week is a starting point \u2192 SINCE."
        },
        {
            id: 12,
            prompt: "I haven't seen Tom ___ ages.",
            options: ["since", "for"],
            correct: "for",
            tip: "Ages is a period of time \u2192 FOR."
        },
        {
            id: 13,
            prompt: "It has been raining ___ this morning.",
            options: ["since", "for"],
            correct: "since",
            tip: "This morning is when it started \u2192 SINCE."
        },
        {
            id: 14,
            prompt: "It has been raining ___ two hours.",
            options: ["since", "for"],
            correct: "for",
            tip: "Two hours is a period \u2192 FOR."
        },
        {
            id: 15,
            prompt: "My dad has worked here ___ 1999.",
            options: ["since", "for"],
            correct: "since",
            tip: "1999 is a starting point \u2192 SINCE."
        },
        {
            id: 16,
            prompt: "My dad has worked here ___ twenty years.",
            options: ["since", "for"],
            correct: "for",
            tip: "Twenty years is a period \u2192 FOR."
        },
        {
            id: 17,
            prompt: "She has had that bike ___ her birthday.",
            options: ["since", "for"],
            correct: "since",
            tip: "Her birthday is the starting point \u2192 SINCE."
        },
        {
            id: 18,
            prompt: "She has had that bike ___ two months.",
            options: ["since", "for"],
            correct: "for",
            tip: "Two months is a period \u2192 FOR."
        },
        {
            id: 19,
            prompt: "We have been waiting ___ two o'clock.",
            options: ["since", "for"],
            correct: "since",
            tip: "Two o'clock is a starting time \u2192 SINCE."
        },
        {
            id: 20,
            prompt: "We have been waiting ___ thirty minutes.",
            options: ["since", "for"],
            correct: "for",
            tip: "Thirty minutes is a period \u2192 FOR."
        },
        {
            id: 21,
            prompt: "I have studied English ___ I was seven.",
            options: ["since", "for", "from"],
            correct: "since",
            tip: "\u201cI was seven\u201d is the moment it started \u2192 SINCE."
        },
        {
            id: 22,
            prompt: "I have studied English ___ five years.",
            options: ["since", "for"],
            correct: "for",
            tip: "Five years is a period \u2192 FOR."
        },
        {
            id: 23,
            prompt: "He has been asleep ___ lunch.",
            options: ["since", "for"],
            correct: "since",
            tip: "Lunch is the starting point \u2192 SINCE."
        },
        {
            id: 24,
            prompt: "He has been asleep ___ an hour.",
            options: ["since", "for"],
            correct: "for",
            tip: "An hour is a period \u2192 FOR."
        },
        {
            id: 25,
            prompt: "They have lived in Paris ___ 2008.",
            options: ["since", "for"],
            correct: "since",
            tip: "2008 is a starting point \u2192 SINCE."
        },
        {
            id: 26,
            prompt: "They have lived in Paris ___ many years.",
            options: ["since", "for"],
            correct: "for",
            tip: "Many years is a period \u2192 FOR."
        },
        {
            id: 27,
            prompt: "We have been friends ___ we met at summer camp.",
            options: ["since", "for"],
            correct: "since",
            tip: "After a full clause (we met...), use SINCE."
        },
        {
            id: 28,
            prompt: "It's been a long time ___ we last spoke.",
            options: ["since", "for", "from"],
            correct: "since",
            tip: "A clause comes after the gap (we last spoke) \u2192 SINCE."
        },
        {
            id: 29,
            prompt: "The shop has been closed ___ January.",
            options: ["since", "for"],
            correct: "since",
            tip: "January is a starting month \u2192 SINCE."
        },
        {
            id: 30,
            prompt: "The shop has been closed ___ two weeks.",
            options: ["since", "for"],
            correct: "for",
            tip: "Two weeks is a period \u2192 FOR."
        },
        {
            id: 31,
            prompt: "I have wanted a dog ___ I was little.",
            options: ["since", "for"],
            correct: "since",
            tip: "\u201cI was little\u201d is the starting point \u2192 SINCE."
        },
        {
            id: 32,
            prompt: "I have wanted a dog ___ ages.",
            options: ["since", "for"],
            correct: "for",
            tip: "Ages is a period \u2192 FOR."
        },
        {
            id: 33,
            prompt: "She hasn't called me ___ Friday.",
            options: ["since", "for", "from"],
            correct: "since",
            tip: "Friday is the last time it happened \u2192 SINCE."
        },
        {
            id: 34,
            prompt: "She hasn't called me ___ a whole week.",
            options: ["since", "for"],
            correct: "for",
            tip: "A whole week is a period \u2192 FOR."
        },
        {
            id: 35,
            prompt: "We have been driving ___ six hours.",
            options: ["since", "for"],
            correct: "for",
            tip: "Six hours is a period \u2192 FOR."
        },
        {
            id: 36,
            prompt: "We have been driving ___ nine o'clock this morning.",
            options: ["since", "for", "during"],
            correct: "since",
            tip: "Nine o'clock is a starting time \u2192 SINCE."
        },
        {
            id: 37,
            prompt: "He has played football ___ he was five.",
            options: ["since", "for"],
            correct: "since",
            tip: "\u201cHe was five\u201d is the starting point \u2192 SINCE."
        },
        {
            id: 38,
            prompt: "He has played football ___ ten years.",
            options: ["since", "for"],
            correct: "for",
            tip: "Ten years is a period \u2192 FOR."
        },
        {
            id: 39,
            prompt: "___ 5 a.m., I have been awake.",
            options: ["Since", "For", "From"],
            correct: "Since",
            tip: "SINCE can start a sentence before a time point."
        },
        {
            id: 40,
            prompt: "___ four hours, I have been awake.",
            options: ["For", "Since", "During"],
            correct: "For",
            tip: "FOR can start a sentence before a period of time."
        },
        {
            id: 41,
            prompt: "They have had that car ___ a decade.",
            options: ["since", "for"],
            correct: "for",
            tip: "A decade = ten years, a period \u2192 FOR."
        },
        {
            id: 42,
            prompt: "They have had that car ___ 2016.",
            options: ["since", "for"],
            correct: "since",
            tip: "2016 is a starting point \u2192 SINCE."
        },
        {
            id: 43,
            prompt: "My sister has lived in Rome ___ three years.",
            options: ["since", "for"],
            correct: "for",
            tip: "Three years is a period \u2192 FOR."
        },
        {
            id: 44,
            prompt: "My sister has lived in Rome ___ April.",
            options: ["since", "for"],
            correct: "since",
            tip: "April is a starting month \u2192 SINCE."
        },
        {
            id: 45,
            prompt: "We have waited here ___ half an hour.",
            options: ["since", "for", "during"],
            correct: "for",
            tip: "Half an hour is a period \u2192 FOR."
        },
        {
            id: 46,
            prompt: "We have waited here ___ noon.",
            options: ["since", "for"],
            correct: "since",
            tip: "Noon is a starting time \u2192 SINCE."
        },
        {
            id: 47,
            prompt: "It has been snowing ___ yesterday.",
            options: ["since", "for", "from"],
            correct: "since",
            tip: "Yesterday is a starting point \u2192 SINCE."
        },
        {
            id: 48,
            prompt: "It has been snowing ___ two days.",
            options: ["since", "for"],
            correct: "for",
            tip: "Two days is a period \u2192 FOR."
        },
        {
            id: 49,
            prompt: "I have known Mrs Lee ___ a long time.",
            options: ["since", "for"],
            correct: "for",
            tip: "A long time is a period \u2192 FOR."
        },
        {
            id: 50,
            prompt: "I have known Mrs Lee ___ university.",
            options: ["since", "for"],
            correct: "since",
            tip: "University is where it started \u2192 SINCE."
        }
    ]
};
