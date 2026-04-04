const snakesQuestions = {
    "level1": {
        "name": "Level 1 - Basics",
        "description": "Simple emoji/emoticon identification",
        "questions": [
            { "question": "😀", "type": "emoticon", "answer": "smile" },
            { "question": "😢", "type": "emoticon", "answer": "sad" },
            { "question": "😠", "type": "emoticon", "answer": "angry" },
            { "question": "😴", "type": "emoticon", "answer": "sleepy" },
            { "question": "😋", "type": "emoticon", "answer": "hungry" },
            { "question": "🤔", "type": "emoticon", "answer": "thinking" },
            { "question": "🤐", "type": "emoticon", "answer": "quiet" },
            { "question": "🥰", "type": "emoticon", "answer": "love" },
            { "question": "😷", "type": "emoticon", "answer": "sick" },
            { "question": "😎", "type": "emoticon", "answer": "cool" }
        ]
    },
    "level2": {
        "name": "Level 2 - Words",
        "description": "Simple word questions",
        "questions": [
            { "question": "What color is the sky?", "type": "simple", "answer": "blue" },
            { "question": "What is 2 + 2?", "type": "math", "answer": "four" },
            { "question": "What animal says 'meow'?", "type": "vocab", "answer": "cat" },
            { "question": "What do you drink? Water or ___", "type": "vocab", "answer": "milk" },
            { "question": "How many days in a week?", "type": "general", "answer": "seven" },
            { "question": "What is opposite of 'hot'?", "type": "vocab", "answer": "cold" },
            { "question": "What is the opposite of 'big'?", "type": "vocab", "answer": "small" },
            { "question": "What comes after Monday?", "type": "general", "answer": "tuesday" },
            { "question": "Which is faster, car or walking?", "type": "comparison", "answer": "car" },
            { "question": "What fruit is yellow?", "type": "vocab", "answer": "banana" }
        ]
    },
    "level3": {
        "name": "Level 3 - Simple Sentences",
        "description": "Simple sentence completion",
        "questions": [
            { "question": "I ___ a student.", "type": "grammar", "answer": "am" },
            { "question": "She ___ to school.", "type": "grammar", "answer": "goes" },
            { "question": "They ___ happy.", "type": "grammar", "answer": "are" },
            { "question": "He ___ a book.", "type": "grammar", "answer": "has" },
            { "question": "We ___ friends.", "type": "grammar", "answer": "are" },
            { "question": "The cat ___ on the bed.", "type": "grammar", "answer": "sleeps" },
            { "question": "I ___ English every day.", "type": "grammar", "answer": "study" },
            { "question": "She ___ coffee in the morning.", "type": "grammar", "answer": "drinks" },
            { "question": "He ___ football very well.", "type": "grammar", "answer": "plays" },
            { "question": "The sun ___ in the east.", "type": "grammar", "answer": "rises" }
        ]
    },
    "level4": {
        "name": "Level 4 - Intermediate",
        "description": "More complex sentence structures",
        "questions": [
            { "question": "If it rains, I ___ my umbrella.", "type": "conditional", "answer": "will use" },
            { "question": "She ___ to the store yesterday.", "type": "past", "answer": "went" },
            { "question": "They ___ their homework yet.", "type": "present_perfect", "answer": "haven't finished" },
            { "question": "I wish I ___ more money.", "type": "wish", "answer": "had" },
            { "question": "He told me ___ the door.", "type": "indirect", "answer": "to close" },
            { "question": "The book ___ interesting is on the shelf.", "type": "relative", "answer": "that is" },
            { "question": "She is the ___ student in the class.", "type": "superlative", "answer": "smartest" },
            { "question": "If I ___ rich, I would travel.", "type": "conditional", "answer": "were" },
            { "question": "He insisted that she ___ on time.", "type": "subjunctive", "answer": "be" },
            { "question": "The movie was ___ than the book.", "type": "comparative", "answer": "better" }
        ]
    },
    "level5": {
        "name": "Level 5 - Advanced",
        "description": "Advanced grammar and vocabulary",
        "questions": [
            { "question": "Despite ___ hard, he failed.", "type": "gerund", "answer": "working" },
            { "question": "I would rather ___ than stay.", "type": "infinitive", "answer": "go" },
            { "question": "It is essential that he ___ on time.", "type": "subjunctive", "answer": "arrive" },
            { "question": "The manager insisted that the report ___ immediately.", "type": "subjunctive", "answer": "be submitted" },
            { "question": "She acts as if she ___ the owner.", "type": "subjunctive", "answer": "were" },
            { "question": "I regret ___ that to him.", "type": "gerund", "answer": "saying" },
            { "question": "His behavior is ___ annoying.", "type": "adverb", "answer": "extremely" },
            { "question": "She has a strong ___ for music.", "type": "noun", "answer": "talent" },
            { "question": "The politician made a ___ statement.", "type": "adjective", "answer": "controversial" },
            { "question": "His explanation was completely ___.", "type": "adjective", "answer": "incomprehensible" }
        ]
    },
    "level6": {
        "name": "Level 6 - Expert",
        "description": "Complex topics and abstract concepts",
        "questions": [
            { "question": "What does 'ubiquitous' mean?", "type": "vocab", "answer": "present everywhere" },
            { "question": "What does 'ephemeral' mean?", "type": "vocab", "answer": "lasting a short time" },
            { "question": "What does 'paradigm' mean?", "type": "vocab", "answer": "a typical example or pattern" },
            { "question": "What does 'pragmatic' mean?", "type": "vocab", "answer": "practical and realistic" },
            { "question": "What does 'ambiguous' mean?", "type": "vocab", "answer": "unclear or open to interpretation" },
            { "question": "What does 'mitigate' mean?", "type": "vocab", "answer": "to make less severe" },
            { "question": "What does 'proliferate' mean?", "type": "vocab", "answer": "to increase rapidly" },
            { "question": "What does 'scrutinize' mean?", "type": "vocab", "answer": "to examine carefully" },
            { "question": "What does 'ostentatious' mean?", "type": "vocab", "answer": "showy or pretentious" },
            { "question": "What does 'enigma' mean?", "type": "vocab", "answer": "a mystery or puzzle" }
        ]
    },
    "level7": {
        "name": "Level 7 - Discussion",
        "description": "Open-ended discussion questions",
        "questions": [
            { "question": "What would you do if you had a lot of money?", "type": "discussion", "answer": "" },
            { "question": "What food have you never eaten?", "type": "discussion", "answer": "" },
            { "question": "What does 'rambunctious' mean?", "type": "vocab", "answer": "noisy and difficult to control" },
            { "question": "If you could travel anywhere, where would you go?", "type": "discussion", "answer": "" },
            { "question": "What is your biggest fear?", "type": "discussion", "answer": "" },
            { "question": "If you could meet anyone, who would it be?", "type": "discussion", "answer": "" },
            { "question": "What is the best advice you've ever received?", "type": "discussion", "answer": "" },
            { "question": "If you could change one thing about the world, what would it be?", "type": "discussion", "answer": "" },
            { "question": "What skill would you like to learn?", "type": "discussion", "answer": "" },
            { "question": "What is your favorite childhood memory?", "type": "discussion", "answer": "" }
        ]
    }
};

const SNAKES_LADDERS_CONFIG = {
    "gridSizes": [
        { "size": 6, "name": "6×6 - Small" },
        { "size": 8, "name": "8×8 - Medium" },
        { "size": 10, "name": "10×10 - Large" }
    ],
    "difficultyLevels": [
        { "level": 1, "name": "Level 1 - Basics" },
        { "level": 2, "name": "Level 2 - Words" },
        { "level": 3, "name": "Level 3 - Simple Sentences" },
        { "level": 4, "name": "Level 4 - Intermediate" },
        { "level": 5, "name": "Level 5 - Advanced" },
        { "level": 6, "name": "Level 6 - Expert" },
        { "level": 7, "name": "Level 7 - Discussion" }
    ],
    "playerTokens": [
        { "id": "token1", "emoji": "🔴", "name": "Red Circle" },
        { "id": "token2", "emoji": "🔵", "name": "Blue Circle" },
        { "id": "token3", "emoji": "🟢", "name": "Green Circle" },
        { "id": "token4", "emoji": "🟡", "name": "Yellow Circle" },
        { "id": "token5", "emoji": "🐱", "name": "Cat" },
        { "id": "token6", "emoji": "🐶", "name": "Dog" },
        { "id": "token7", "emoji": "🐰", "name": "Rabbit" },
        { "id": "token8", "emoji": "🐸", "name": "Frog" },
        { "id": "token9", "emoji": "🦁", "name": "Lion" },
        { "id": "token10", "emoji": "🦄", "name": "Unicorn" },
        { "id": "token11", "emoji": "🚗", "name": "Car" },
        { "id": "token12", "emoji": "🚀", "name": "Rocket" }
    ],
    "defaultSnakes": [
        { "start": 99, "end": 54 },
        { "start": 70, "end": 55 },
        { "start": 52, "end": 29 },
        { "start": 25, "end": 6 },
        { "start": 95, "end": 72 }
    ],
    "defaultLadders": [
        { "start": 3, "end": 22 },
        { "start": 8, "end": 31 },
        { "start": 15, "end": 44 },
        { "start": 28, "end": 56 },
        { "start": 36, "end": 57 },
        { "start": 63, "end": 86 },
        { "start": 68, "end": 92 }
    ]
};