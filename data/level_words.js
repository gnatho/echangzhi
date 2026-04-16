const levelUnits = {
    0: {
        0: ["blue", "green", "yellow", "orange", "red", "pink", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"],
        1: ["window", "door", "chair", "pencil", "book", "table"],
        2: ["eyes", "ears", "arms", "legs", "mouth", "nose", "head"],
        3: ["mom", "dad", "sister", "brother", "grandpa", "grandma"],
        4: ["fish", "parrot", "zebra", "lion", "big", "small"],
        5: ["milk", "cupcakes", "oranges", "tomatoes", "chocolate", "pears"],
        6: ["bus stop", "school", "movie theater", "hospital", "toy store", "park"],
        7: ["teacher", "firefighter", "gardener", "police officer", "vet", "doctor"],
        8: ["hat", "coat", "sweater", "scarf", "gloves", "jeans", "T-shirt", "boots"],
        9: ["play soccer", "run", "paint a picture", "swim", "read", "dance"]
    },
    1: {
        0: ["Whisper", "Thunder", "Misty", "Flash"],
        1: ["ruler", "pen", "book", "eraser", "pencil case", "pencil", "desk", "notebook", "bag", "paper"],
        2: ["computer game", "kite", "plane", "bike", "doll", "monster", "train", "go-kart", "car", "ball"],
        3: ["donkey", "elephant", "spider", "cat", "rat", "frog", "duck", "lizard", "dog"],
        4: ["apple", "banana", "cake", "pizza", "sausage", "cheese sandwich", "fish", "chicken", "peas", "steak", "carrots"],
        5: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        6: ["bedroom", "bathroom", "living room", "kitchen", "hall", "stairs", "basement", "dining room"],
        7: ["sweater", "skirt", "shorts", "pants", "jacket", "socks", "jeans", "shoes", "baseball cap", "T-shirt"],
        8: ["arm", "hand", "knee", "fingers", "leg", "foot", "toes", "head"],
        9: ["paint a picture", "listen to music", "catch a fish", "take a photo", "eat ice cream", "play the guitar", "read a book", "make a sandcastle", "look for shells"]
    },
    2: {
        0: ["bookcase", "wall", "board", "clock", "door", "cabinet", "window", "chair", "crayon", "floor"],
        1: ["get up", "get dressed", "have breakfast", "brush your teeth", "go to school", "have lunch", "play in the park", "have dinner", "go to bed"],
        2: ["polar bear", "bear", "zebra", "crocodile", "hippo", "tiger", "parrot", "monkey", "snake"],
        3: ["train station", "hospital", "movie theater", "playground", "cafe", "store", "street", "bus stop", "park", "school", "swimming pool"],
        4: ["tomatoes", "beans", "greens", "potatoes", "kiwis", "lemons", "bread", "mangoes", "grapes", "eggs", "watermelons"],
        5: ["poster", "closet", "mirror", "armchair", "lamp", "bed", "table", "couch", "rug"],
        6: ["eyes", "face", "glasses", "hair", "cheeks", "ears", "nose", "tears", "chin", "mouth"],
        7: ["helicopter", "ship", "truck", "boat", "scooter", "skateboard", "motorcycle", "taxi", "bus"],
        8: ["badminton", "ping-pong", "tennis", "basketball", "baseball", "volleyball", "swimming", "soccer", "field hockey", "track and field"],
        9: ["read a comic book", "go hiking", "visit my cousins", "help in the yard", "take horseback riding lessons", "build a tree house", "keep a scrapbook", "learn to swim", "go camping"]
    },
    3: {
        0: ["upstairs", "twenty-one - fifty", "downstairs", "fifty-one - one hundred", "basement"],
        1: ["English", "math", "geography", "science", "IT", "music", "art", "PE", "history"],
        2: ["apple juice", "roll", "cheese", "water", "soup", "vegetables", "lemonade", "salad"],
        3: ["sweep", "do the dishes", "do the shopping", "clean up", "cook", "dry the dishes", "take the dog for a walk", "feed the dog"],
        4: ["bank", "tower", "fair", "library", "market", "supermarket", "bus station", "parking lot", "sports center", "map"],
        5: ["dolphin", "seal", "turtle", "octopus", "anchor", "starfish", "shell", "seahorse"],
        6: ["cell phone", "tablet", "electric toothbrush", "elevator", "flashlight", "electric fan", "walkie-takie", "laptop", "game console"],
        7: ["earache", "headache", "cold", "toothache", "stomachache", "cough", "doctor", "nurse"],
        8: ["Egypt", "Argentina", "India", "Australia", "Mexico", "Brazil", "Chile", "Spain", "China", "Turkey"],
        9: ["thunderstorm", "cloudy", "lightning", "rainy", "windy", "umbrella", "raincoat", "foggy", "boots"]
    },
    4: {
        0: ["Ferris wheel", "roller coaster", "carousel", "bumper cars", "band", "mayor", "microphone", "journalist", "photographer"],
        1: ["sword", "bow and arrow", "helmet", "crown", "necklace", "belt", "bracelet", "shield", "knight", "queen"],
        2: ["mountain", "forest", "town", "field", "lake", "island", "river", "path"],
        3: ["fire", "flood", "911", "police car", "police officer", "fire engine", "firefighter", "ambulance", "paramedic"],
        4: ["stairs", "escalator", "ticket office", "platform", "engineer", "station", "a cup of coffee", "a cup of tea", "backpack", "suitcase"],
        5: ["dark", "curly", "mustache", "light", "scar", "beard", "blond", "straight"],
        6: ["wing", "horn", "back", "scales", "neck", "tail", "feathers", "tongue"],
        7: ["trombone", "triangle", "keyboard", "drums", "tambourine", "saxophone", "trumpet", "violin", "harp"],
        8: ["comet", "star", "rocket", "planet", "moon", "telescope", "astronaut", "space station"],
        9: ["row a boat", "sail a boat", "dive into the water", "dry your clothes", "make a fire", "make a raft", "swing on a rope", "put up a tent", "collect wood"]
    },
    5: {
        0: ["goggles", "shelf", "apron", "explosion", "bubbles", "liquid", "instructions", "test tube", "powder", "gloves"],
        1: ["smoke", "volcano", "temple", "theater", "statue", "columns", "horse and cart", "vase", "servant", "fountain"],
        2: ["beak", "toucan", "vine", "sloth", "anaconda", "branch", "jaguar", "anteater", "beetle", "pool"],
        3: ["spotlight", "backup singers", "electric guitar", "fans", "dancer", "bass guitar", "drum kit", "bodyguards", "stage"],
        4: ["waiter", "strawberries", "cookies", "spoon", "napkin", "fork", "knife", "pepper", "salt", "chopsticks"],
        5: ["robbers", "jail", "wagon", "sheriff", "saddle", "pistol", "handcuffs", "rope", "barrel"],
        6: ["flag", "plate", "carpet", "sunglasses", "cup and saucer", "pillow", "rings", "comb", "soap", "basket", "earrings"],
        7: ["lute", "candles", "mask", "wig", "actor", "tights", "costume", "audience"],
        8: ["farmer", "janitor", "engineer", "dentist", "artist", "designer", "computer programmer", "mechanic", "businesswoman", "businessman"],
        9: ["sail", "sailor", "captain", "barometer", "mast", "rat", "lifeboat", "porthole", "cabin"]
    },
    6: {
        0: ["basketball hoop", "school bell", "net", "soccer field", "running track", "gym", "trash can", "tennis court", "bike rack", "railing"],
        1: ["palm tree", "hook", "eyepatch", "binoculars", "key", "hammock", "coins", "shovel", "treasure chest", "hole", "stone"],
        2: ["hang glider", "parachute", "monorail", "solar panel", "ultralight", "wind turbine", "cable car", "jet pack", "surfboard", "inline skates", "unicycle", "floating skateboard"],
        3: ["Sphinx", "pharaoh", "slaves", "pyramid", "chariot", "rock", "hieroglyphics", "step", "mummy", "tomb"],
        4: ["long jump", "hurdles", "high jump", "boxing", "archery", "wrestling", "weightlifting", "rowing", "gymnastics", "fencing"],
        5: ["carpenter's shop", "jewelry store", "butcher shop", "market", "bakery", "barber shop", "tailor's shop", "drug store"],
        6: ["screwdriver", "hammer", "drill", "saw", "lever", "wrench", "paintbrush", "can of paint", "button", "switch", "nails", "workbench"],
        7: ["countdown clock", "lunar module", "space capsule", "spacesuit", "launch pad", "crater", "control panel", "headset", "screen"],
        8: ["Northern Lights", "iceberg", "polar bear", "polar bear cub", "ice floe", "seal", "seal pup", "igloo", "mittens", "sled"],
        9: ["sunrise", "horizon", "pond", "grassland", "valley", "bush", "stream", "swamp", "log"]
    }
};

function populateLevelSelector(selectorId) {
    const selector = document.getElementById(selectorId);
    if (!selector) return;
    
    selector.innerHTML = '';
    const levels = Object.keys(levelUnits).sort((a, b) => Number(a) - Number(b));
    levels.forEach(level => {
        const option = document.createElement('option');
        option.value = level;
        option.textContent = "Level " + level;
        selector.appendChild(option);
    });
}

function populateUnitSelector(selectorId, level) {
    const selector = document.getElementById(selectorId);
    if (!selector) return;
    
    selector.innerHTML = '';
    const units = Object.keys(levelUnits[level] || {}).sort((a, b) => Number(a) - Number(b));
    units.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit;
        option.textContent = "Unit " + unit;
        selector.appendChild(option);
    });
}