const grammarUnits = {
    0: {
        0: [
            { type: "reorder", sentence: "I am happy" },
            { type: "reorder", sentence: "She is sad" },
            { type: "reorder", sentence: "He is big" },
            { type: "fill", sentence: "I ___ happy.", answer: "am", options: ["am", "is", "are"] },
            { type: "fill", sentence: "She ___ sad.", answer: "is", options: ["am", "is", "are"] }
        ],
        1: [
            { type: "reorder", sentence: "This is a book" },
            { type: "reorder", sentence: "That is a pen" },
            { type: "fill", sentence: "___ is a book.", answer: "This", options: ["This", "That", "These"] },
            { type: "fill", sentence: "___ is a pen.", answer: "That", options: ["This", "That", "Those"] }
        ],
        2: [
            { type: "reorder", sentence: "I have two eyes" },
            { type: "reorder", sentence: "She has one nose" },
            { type: "fill", sentence: "I ___ two eyes.", answer: "have", options: ["have", "has", "had"] },
            { type: "fill", sentence: "She ___ one nose.", answer: "has", options: ["have", "has", "had"] }
        ],
        3: [
            { type: "reorder", sentence: "This is my mom" },
            { type: "reorder", sentence: "That is my dad" },
            { type: "fill", sentence: "This is ___ mom.", answer: "my", options: ["my", "your", "his"] },
            { type: "fill", sentence: "That is ___ dad.", answer: "my", options: ["my", "her", "their"] }
        ]
    },
    1: {
        0: [
            { type: "reorder", sentence: "What is your name" },
            { type: "reorder", sentence: "My name is Tom" },
            { type: "fill", sentence: "What ___ your name?", answer: "is", options: ["is", "are", "am"] },
            { type: "fill", sentence: "My name ___ Tom.", answer: "is", options: ["is", "are", "am"] }
        ],
        1: [
            { type: "reorder", sentence: "I have a ruler" },
            { type: "reorder", sentence: "She has a pen" },
            { type: "fill", sentence: "I ___ a ruler.", answer: "have", options: ["have", "has", "had"] },
            { type: "fill", sentence: "She ___ a pen.", answer: "has", options: ["have", "has", "had"] }
        ],
        2: [
            { type: "reorder", sentence: "Do you like bikes" },
            { type: "reorder", sentence: "Yes I do" },
            { type: "fill", sentence: "___ you like bikes?", answer: "Do", options: ["Do", "Does", "Did"] },
            { type: "fill", sentence: "Yes, I ___.", answer: "do", options: ["do", "does", "did"] }
        ],
        3: [
            { type: "reorder", sentence: "The cat is small" },
            { type: "reorder", sentence: "The dog is big" },
            { type: "fill", sentence: "The cat ___ small.", answer: "is", options: ["is", "are", "am"] },
            { type: "fill", sentence: "The dog ___ big.", answer: "is", options: ["is", "are", "am"] }
        ],
        4: [
            { type: "reorder", sentence: "I like apples" },
            { type: "reorder", sentence: "She likes bananas" },
            { type: "fill", sentence: "I ___ apples.", answer: "like", options: ["like", "likes", "liked"] },
            { type: "fill", sentence: "She ___ bananas.", answer: "likes", options: ["like", "likes", "liked"] }
        ],
        5: [
            { type: "reorder", sentence: "Today is Monday" },
            { type: "reorder", sentence: "Tomorrow is Tuesday" },
            { type: "fill", sentence: "Today ___ Monday.", answer: "is", options: ["is", "are", "was"] },
            { type: "fill", sentence: "Tomorrow ___ Tuesday.", answer: "is", options: ["is", "are", "was"] }
        ]
    },
    2: {
        0: [
            { type: "reorder", sentence: "There is a book on the table" },
            { type: "reorder", sentence: "There are two chairs in the room" },
            { type: "fill", sentence: "There ___ a book on the table.", answer: "is", options: ["is", "are", "was"] },
            { type: "fill", sentence: "There ___ two chairs in the room.", answer: "are", options: ["is", "are", "was"] }
        ],
        1: [
            { type: "reorder", sentence: "I get up at seven o'clock" },
            { type: "reorder", sentence: "She goes to school at eight" },
            { type: "fill", sentence: "I ___ up at seven o'clock.", answer: "get", options: ["get", "gets", "getting"] },
            { type: "fill", sentence: "She ___ to school at eight.", answer: "goes", options: ["go", "goes", "going"] }
        ],
        2: [
            { type: "reorder", sentence: "The bear is bigger than the cat" },
            { type: "reorder", sentence: "The snake is longer than the frog" },
            { type: "fill", sentence: "The bear is ___ than the cat.", answer: "bigger", options: ["big", "bigger", "biggest"] },
            { type: "fill", sentence: "The snake is ___ than the frog.", answer: "longer", options: ["long", "longer", "longest"] }
        ],
        3: [
            { type: "reorder", sentence: "Where is the hospital" },
            { type: "reorder", sentence: "It is next to the school" },
            { type: "fill", sentence: "___ is the hospital?", answer: "Where", options: ["Where", "What", "When"] },
            { type: "fill", sentence: "It is ___ to the school.", answer: "next", options: ["next", "near", "close"] }
        ]
    },
    3: {
        0: [
            { type: "reorder", sentence: "How many books do you have" },
            { type: "reorder", sentence: "I have twenty-five books" },
            { type: "fill", sentence: "How ___ books do you have?", answer: "many", options: ["many", "much", "any"] },
            { type: "fill", sentence: "I ___ twenty-five books.", answer: "have", options: ["have", "has", "had"] }
        ],
        1: [
            { type: "reorder", sentence: "What is your favorite subject" },
            { type: "reorder", sentence: "My favorite subject is science" },
            { type: "fill", sentence: "What ___ your favorite subject?", answer: "is", options: ["is", "are", "was"] },
            { type: "fill", sentence: "My favorite subject ___ science.", answer: "is", options: ["is", "are", "was"] }
        ],
        2: [
            { type: "reorder", sentence: "Would you like some water" },
            { type: "reorder", sentence: "Yes please" },
            { type: "fill", sentence: "Would you like ___ water?", answer: "some", options: ["some", "any", "a"] },
            { type: "fill", sentence: "Yes, ___.", answer: "please", options: ["please", "thanks", "thank you"] }
        ],
        3: [
            { type: "reorder", sentence: "I have to do my homework" },
            { type: "reorder", sentence: "She has to clean her room" },
            { type: "fill", sentence: "I have ___ do my homework.", answer: "to", options: ["to", "too", "two"] },
            { type: "fill", sentence: "She ___ to clean her room.", answer: "has", options: ["have", "has", "had"] }
        ]
    },
    4: {
        0: [
            { type: "reorder", sentence: "What did you do yesterday" },
            { type: "reorder", sentence: "I went to the park" },
            { type: "fill", sentence: "What ___ you do yesterday?", answer: "did", options: ["do", "does", "did"] },
            { type: "fill", sentence: "I ___ to the park.", answer: "went", options: ["go", "goes", "went"] }
        ],
        1: [
            { type: "reorder", sentence: "The knight wore a helmet" },
            { type: "reorder", sentence: "He carried a sword" },
            { type: "fill", sentence: "The knight ___ a helmet.", answer: "wore", options: ["wear", "wears", "wore"] },
            { type: "fill", sentence: "He ___ a sword.", answer: "carried", options: ["carry", "carries", "carried"] }
        ],
        2: [
            { type: "reorder", sentence: "The mountain is the highest" },
            { type: "reorder", sentence: "The lake is the deepest" },
            { type: "fill", sentence: "The mountain is the ___.", answer: "highest", options: ["high", "higher", "highest"] },
            { type: "fill", sentence: "The lake is the ___.", answer: "deepest", options: ["deep", "deeper", "deepest"] }
        ],
        3: [
            { type: "reorder", sentence: "What happened to the village" },
            { type: "reorder", sentence: "There was a fire" },
            { type: "fill", sentence: "What ___ to the village?", answer: "happened", options: ["happen", "happens", "happened"] },
            { type: "fill", sentence: "There ___ a fire.", answer: "was", options: ["is", "are", "was"] }
        ]
    },
    5: {
        0: [
            { type: "reorder", sentence: "We should wear safety goggles" },
            { type: "reorder", sentence: "The experiment was successful" },
            { type: "fill", sentence: "We ___ wear safety goggles.", answer: "should", options: ["should", "must", "can"] },
            { type: "fill", sentence: "The experiment ___ successful.", answer: "was", options: ["is", "are", "was"] }
        ],
        1: [
            { type: "reorder", sentence: "The volcano erupted yesterday" },
            { type: "reorder", sentence: "Smoke came out of the temple" },
            { type: "fill", sentence: "The volcano ___ yesterday.", answer: "erupted", options: ["erupt", "erupts", "erupted"] },
            { type: "fill", sentence: "Smoke ___ out of the temple.", answer: "came", options: ["come", "comes", "came"] }
        ],
        2: [
            { type: "reorder", sentence: "The toucan has a colorful beak" },
            { type: "reorder", sentence: "The jaguar is a fast animal" },
            { type: "fill", sentence: "The toucan ___ a colorful beak.", answer: "has", options: ["have", "has", "had"] },
            { type: "fill", sentence: "The jaguar is a ___ animal.", answer: "fast", options: ["fast", "faster", "fastest"] }
        ]
    },
    6: {
        0: [
            { type: "reorder", sentence: "The students are playing basketball" },
            { type: "reorder", sentence: "The gym is next to the tennis court" },
            { type: "fill", sentence: "The students ___ playing basketball.", answer: "are", options: ["is", "are", "was"] },
            { type: "fill", sentence: "The gym is ___ to the tennis court.", answer: "next", options: ["next", "near", "close"] }
        ],
        1: [
            { type: "reorder", sentence: "The pirate found the treasure chest" },
            { type: "reorder", sentence: "He dug a hole in the sand" },
            { type: "fill", sentence: "The pirate ___ the treasure chest.", answer: "found", options: ["find", "finds", "found"] },
            { type: "fill", sentence: "He ___ a hole in the sand.", answer: "dug", options: ["dig", "digs", "dug"] }
        ],
        2: [
            { type: "reorder", sentence: "The hang glider flew over the mountains" },
            { type: "reorder", sentence: "Solar panels produce electricity" },
            { type: "fill", sentence: "The hang glider ___ over the mountains.", answer: "flew", options: ["fly", "flies", "flew"] },
            { type: "fill", sentence: "Solar panels ___ electricity.", answer: "produce", options: ["produce", "produces", "produced"] }
        ]
    }
};