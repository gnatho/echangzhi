// ==================== WORD DATA ====================
const phonemeSets = {
    shortVowels: [
        "c[a]t", "b[e]d", "p[i]g", "h[o]t", "b[u]s",
        "m[a]p", "t[e]n", "s[i]t", "d[o]g", "c[u]p",
        "h[a]t", "p[e]n", "b[i]g", "l[o]g", "n[u]t",
        "r[a]n", "g[e]t", "f[i]x", "t[o]p", "c[u]t",
        "s[a]d", "l[e]t", "w[i]n", "h[o]p", "s[u]n",
        "j[a]m", "r[e]d", "d[i]d", "d[o]t", "m[u]d"
    ],
    longA: [
        "c[a]ke", "r[ai]n", "d[ay]", "[ei]ght", "w[ei]gh",
        "m[a]ke", "tr[ai]n", "pl[ay]", "v[ei]n", "sl[ei]gh",
        "n[a]me", "p[ai]n", "s[ay]", "th[ey]", "n[ei]gh",
        "f[a]ce", "w[ai]t", "p[ay]", "gr[ey]", "h[ei]ght",
        "l[a]ke", "s[ai]l", "st[ay]", "r[ei]gn", "w[ei]rd",
        "t[a]pe", "ch[ai]n", "w[ay]", "ob[ey]", "f[ei]nt"
    ],
    longE: [
        "f[ee]t", "m[ea]t", "f[ie]ld", "c[ei]ling", "happ[y]", "k[ey]",
        "s[ee]", "s[ea]", "p[ie]ce", "rec[ei]ve", "bab[y]", "mon[ey]",
        "tr[ee]", "b[ea]d", "ch[ie]f", "br[ie]f", "ver[y]", "hon[ey]",
        "gr[ee]n", "l[ea]f", "sh[ie]ld", "dec[ei]t", "funn[y]", "donk[ey]",
        "sl[ee]p", "t[ea]", "y[ie]ld", "c[ei]se", "sorr[y]", "j[ey]",
        "sw[ee]t", "s[ea]l", "th[ie]f", "rel[ei]f", "earl[y]", "vall[ey]"
    ],
    longI: [
        "b[i]ke", "n[igh]t", "fl[y]", "p[ie]",
        "l[i]ke", "l[igh]t", "cr[y]", "t[ie]",
        "t[i]me", "h[igh]", "sk[y]", "d[ie]",
        "f[i]ve", "r[igh]t", "tr[y]", "l[ie]",
        "n[i]ne", "f[igh]t", "dr[y]", "p[ie]",
        "r[i]de", "s[igh]t", "fl[y]", "t[ie]",
        "sm[i]le", "br[igh]t", "m[y]", "cr[y]"
    ],
    longO: [
        "h[o]me", "b[oa]t", "sn[ow]", "t[oe]",
        "b[o]ne", "c[oa]t", "gr[ow]", "h[oe]",
        "r[o]se", "r[oa]d", "sh[ow]", "w[oe]",
        "n[o]te", "g[oa]t", "sl[ow]", "f[oe]",
        "h[o]pe", "l[oa]d", "kn[ow]", "t[oe]",
        "st[o]ne", "fl[oa]t", "thr[ow]", "can[oe]",
        "c[o]de", "g[oa]l", "bl[ow]", "t[oe]"
    ],
    longU: [
        "c[u]be", "f[ew]", "bl[ue]", "m[oo]n",
        "t[u]be", "n[ew]", "gl[ue]", "s[oo]n",
        "m[u]le", "d[ew]", "tr[ue]", "sp[oo]n",
        "c[u]te", "kn[ew]", "cl[ue]", "b[oo]t",
        "r[u]le", "gr[ew]", "q[ue]ue", "f[oo]d",
        "d[u]de", "v[iew]", "arg[ue]", "t[oo]l",
        "f[u]me", "f[ew]", "iss[ue]", "sch[oo]l"
    ],
    rControlled: [
        "c[ar]", "h[er]", "b[ir]d", "c[or]n", "t[ur]n",
        "f[ar]", "t[er]m", "g[ir]l", "f[or]k", "b[ur]n",
        "st[ar]", "f[er]n", "st[ir]", "p[or]t", "s[ur]f",
        "p[ar]k", "v[er]b", "f[ir]st", "b[or]n", "h[ur]t",
        "d[ar]k", "ov[er]", "sh[ir]t", "sh[or]t", "c[ur]ve",
        "j[ar]", "p[er]k", "th[ir]d", "st[or]y", "n[ur]se"
    ],
    diphthongs: [
        "h[ou]se", "c[ow]", "c[oi]n", "b[oy]", "[au]to", "s[aw]", "b[oo]k",
        "[ou]t", "n[ow]", "j[oi]n", "t[oy]", "[au]gust", "l[aw]", "l[oo]k",
        "l[ou]d", "t[own]", "p[oi]nt", "en[joy]", "c[au]se", "dr[aw]", "g[oo]d",
        "s[ou]nd", "d[own]", "[oi]l", "destr[oy]", "l[au]nch", "str[aw]", "st[oo]l",
        "r[ou]nd", "br[ow]", "s[oi]l", "empl[oy]", "f[au]lt", "cr[aw]l", "t[oo]k",
        "m[ou]th", "h[ow]", "v[oi]ce", "ann[oy]", "s[au]ce", "l[aw]n", "b[oo]t"
    ],
    digraphs: [
        "[ch]in", "[sh]ip", "[th]at", "[th]in", "[wh]en", "[ph]one", "si[ng]",
        "[ch]at", "[sh]op", "[th]is", "ba[th]", "[wh]ere", "[ph]oto", "si[ng]",
        "[ch]ip", "fi[sh]", "[th]em", "pa[th]", "[wh]ite", "gra[ph]", "so[ng]",
        "[ch]eck", "[sh]ell", "[th]en", "m[oo]th", "[wh]eat", "para[ph]", "ki[ng]",
        "[ch]est", "[sh]eep", "[th]ose", "tee[th]", "[wh]ale", "ele[ph]ant", "ri[ng]",
        "[ch]air", "[sh]oe", "[th]ese", "cl[th]", "[wh]eel", "alph[ph]a", "br[ng]"
    ],
    beginBlends: [
        "[bl]ack", "[br]own", "[cl]ap", "[cr]y", "[dr]um", "[fl]ag", "[fr]og",
        "[gl]ad", "[gr]een", "[pl]an", "[pr]ay", "[sc]an", "[sk]in", "[sl]ip",
        "[sm]all", "[sn]ap", "[sp]in", "[st]op", "[sw]im", "[tr]ee", "[tw]in",
        "[bl]ue", "[br]ead", "[cl]ip", "[cr]ab", "[dr]op", "[fl]at", "[fr]ee",
        "[gl]ass", "[gr]ape", "[pl]ay", "[pr]ess", "[sc]hool", "[sk]y", "[sl]ow",
        "[sm]ile", "[sn]ow", "[sp]eak", "[st]ar", "[sw]eet", "[tr]ain", "[tw]elve"
    ],
    endBlends: [
        "ha[nd]", "te[nt]", "fa[st]", "a[sk]", "cla[sp]", "le[ft]", "co[ld]",
        "wa[lk]", "he[lp]", "be[lt]", "ju[mp]", "ba[nk]", "ki[ng]", "a[ct]",
        "sa[nd]", "mi[nt]", "li[st]", "ta[sk]", "gra[sp]", "so[ft]", "ho[ld]",
        "ta[lk]", "ke[lp]", "sa[lt]", "la[mp]", "dri[nk]", "ri[ng]", "fa[ct]",
        "ba[nd]", "pri[nt]", "bu[st]", "ri[sk]", "cla[sp]", "gi[ft]", "fo[ld]",
        "he[nd]", "hu[nt]", "lo[st]", "de[sk]", "wi[sp]", "shi[ft]", "go[ld]"
    ],
    arWords: [
        "c[ar]", "f[ar]", "b[ar]", "st[ar]", "j[ar]", 
        "p[ark]", "d[ark]", "h[ard]", "c[ard]", "f[arm]", 
        "y[ard]", "sh[arp]", "m[art]", "p[ar]t", "b[arn]", 
        "m[ar]ch", "h[ar]p", "t[ar]t", "l[ar]k", "sc[ar]", 
        "ch[ar]t", "sm[ar]t", "sp[ar]k", "sh[ar]k", "g[ar]den", 
        "p[ar]ty", "c[ar]go", "l[ar]ge", "st[ar]t", "m[ar]k"
    ], 
    orWords:[
        "f[or]", "n[or]", "b[or]n", "c[or]n", "h[or]n", 
        "f[or]k", "p[or]k", "s[ort]", "sh[or]t", "p[or]t", 
        "f[or]m", "st[or]m", "t[or]ch", "m[ore]", "sh[ore]", 
        "sc[or]e", "sn[or]e", "st[or]e", "c[or]k", "f[or]ce", 
        "n[or]th", "h[or]se", "ch[or]d", "l[or]d", "f[or]t", 
        "t[or]n", "w[or]n", "p[or]ch", "sp[or]t", "sh[or]n"
    ]
};

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

// ==================== GRAMMAR DATA ====================
// Each unit contains grammar activities: sentence reordering and fill-in-the-blank
// Types: "reorder" (put words in correct order) and "fill" (fill in the blank)
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
