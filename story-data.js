/*
 * Stories data library
 * --------------------
 * Add a new story by adding an entry to STORY_LIBRARY. The navigation and the
 * three activities read everything they need from this structure, so no game
 * logic needs to be duplicated for a new book, unit or story.
 *
 * Shape:
 *   STORY_LIBRARY[bookId] = {
 *     title, emoji, theme,
 *     units: {
 *       [unitId]: { stories: [ story, ... ] }
 *     }
 *   }
 *
 * story = {
 *   id, title, emoji, blurb,
 *   text: [paragraph, ...],
 *   sequencing: [sentence in correct order, ...],
 *   quiz: [{ q, options: [..], answer: "<exact option>", explanation }, ...],
 *   storyteller: [{ title, question, options: [..] }, ...],
 *   vocabulary: [{ word, explanation }, ...]
 * }
 */
const STORY_LIBRARY = {
  "superminds-starter": {
    title: "Superminds Starter",
    emoji: "🌱",
    theme: "starter",
    units: {}
  },
  "superminds-1": {
    title: "Superminds 1",
    emoji: "🍎",
    theme: "level1",
    units: {}
  },
  "superminds-2": {
    title: "Superminds 2",
    emoji: "🐘",
    theme: "level2",
    units: {}
  },
  "superminds-3": {
    title: "Superminds 3",
    emoji: "🧪",
    theme: "level3",
    units: {}
  },
  "superminds-4": {
    title: "Superminds 4",
    emoji: "🚀",
    theme: "level4",
    units: {}
  },
  "superminds-5": {
    title: "Superminds 5",
    emoji: "🎭",
    theme: "level5",
    units: {}
  },
  "superminds-6": {
    title: "Superminds 6",
    emoji: "🏔️",
    theme: "level6",
    units: {
      "unit-2": {
        stories: [
          {
            id: "problem-for-patrick",
            title: "A Problem for Patrick",
            emoji: "🪂",
            blurb:
              "Alex and Phoebe take their jet packs for a flight, but Patrick is missing. Can they find him before it is too late?",
            text: [
              `Phoebe and Alex read the instructions very carefully. They were both a little nervous, but they understood how to fly the jet packs now.`,
              `Phoebe looked up at the sky, but she couldn’t see Patrick anywhere.`,
              `"OK, this is it," she said. "1, 2, 3 – go!"`,
              `Alex and Phoebe pressed the yellow button, and up they went. It was an amazing feeling as they went higher and higher.`,
              `"Where should we go?" Alex called out to Phoebe.`,
              `"Let's fly to the mountain over there," Phoebe shouted back.`,
              `They pressed the orange button to go higher.`,
              `"Look at the cable car!" exclaimed Phoebe.`,
              `They also saw some people climbing, who looked so small below them.`,
              `"Isn't this fantastic?" Alex shouted.`,
              `"Yes, it's so exciting!" replied Phoebe.`,
              `The two children flew twice around the big mountain with their jet packs. Then they pressed the green button because they wanted to fly more quickly.`,
              `They were heading back toward the park and then past the park toward the ocean.`,
              `"Hey, Alex!" shouted Phoebe. "Where's Patrick? I can't see him anywhere!"`,
              `"Don't worry," answered Alex. "I'm sure he's OK."`,
              `Alex and Phoebe flew over the beaches and the ocean and then over the fields and the woods.`,
              `Finally, they followed the river and flew back out over the ocean, but there was still no sign of Patrick.`,
              `Phoebe was getting worried.`,
              `"He was too impatient to listen, so he doesn't really know how to fly his jet pack," she thought.`,
              `A second later, Alex saw Patrick. He was high up, but he was falling down through the sky very fast because he had no control over his jet pack.`,
              `With his arms, he was making movements like a swimmer, but much faster.`,
              `It looked funny, but Alex and Phoebe didn't laugh. They knew that their friend was in trouble.`,
              `"We need to get closer to tell him what to do!" Phoebe shouted.`,
              `She and Alex stayed side by side.`,
              `They pressed the orange button and then the green one, to fly up closer to Patrick.`,
              `Then they pressed the blue button so that they started going down next to him.`,
              `Patrick looked very scared.`,
              `"Quick! Press the yellow AND the blue buttons together!" Alex and Phoebe shouted.`,
              `They heard a whoosh as Patrick's parachute opened, and they knew that their friend was now safe.`,
              `As Alex and Phoebe landed safely with their jet packs next to Patrick and his parachute, the man from the jet pack rental stall was walking over to them.`,
              `"Good job, young man," he said to Patrick. "I was worried for a few moments, but it's great that you knew about the emergency buttons!"`,
              `Alex and Phoebe looked at each other, and Patrick was very quiet.`,
              `He was glad to see a yellow glow nearby.`,
              `"Thanks, you two," he said, as they walked together toward the gate.`,
              `"That was close."`,
              `Then they were gone in a flash.`
            ],

            /* Chronological order. Never shuffle this array. */
            sequencing: [
              "Phoebe and Alex carefully read the instructions and learned how to fly their jet packs.",
              "They pressed the yellow button and flew up into the sky.",
              "They decided to fly towards a mountain and used the orange button to go higher.",
              "They saw a cable car and people climbing before flying twice around the mountain.",
              "They pressed the green button to fly faster and headed back towards the park and the ocean.",
              "They couldn't find Patrick, so they searched over the beaches, ocean, fields and woods.",
              "Alex finally spotted Patrick falling very quickly through the sky because he had no control over his jet pack.",
              "Alex and Phoebe flew closer to Patrick and used the blue button to go down next to him.",
              "They told Patrick to press the yellow and blue buttons together, and his parachute opened.",
              "Everyone landed safely, the rental man praised Patrick, and Patrick thanked his friends."
            ],

            quiz: [
              {
                q: "Who read the instructions very carefully?",
                options: ["Patrick", "Alex and Phoebe", "The rental man", "The people climbing the mountain"],
                answer: "Alex and Phoebe",
                explanation: "Alex and Phoebe carefully read the instructions before flying their jet packs."
              },
              {
                q: "Who was too impatient to listen to the instructions?",
                options: ["Alex", "Phoebe", "Patrick", "The rental man"],
                answer: "Patrick",
                explanation: "Phoebe thought Patrick was too impatient to listen and did not really know how to fly his jet pack."
              },
              {
                q: "Who noticed that Patrick was missing?",
                options: ["Phoebe", "Patrick", "Alex", "The rental man"],
                answer: "Phoebe",
                explanation: "Phoebe looked up at the sky and couldn't see Patrick."
              },
              {
                q: "Who suggested flying towards the mountain?",
                options: ["Patrick", "Alex", "The rental man", "Phoebe"],
                answer: "Phoebe",
                explanation: "Phoebe suggested flying towards the mountain."
              },
              {
                q: "Which button did Alex and Phoebe press to take off?",
                options: ["The orange button", "The yellow button", "The green button", "The blue button"],
                answer: "The yellow button",
                explanation: "They pressed the yellow button and flew upwards."
              },
              {
                q: "Which button did they press to fly higher?",
                options: ["The yellow button", "The blue button", "The orange button", "The green button"],
                answer: "The orange button",
                explanation: "They pressed the orange button to go higher."
              },
              {
                q: "Where did Alex and Phoebe decide to fly first?",
                options: ["Towards the ocean", "Towards the woods", "Towards the river", "Towards the mountain"],
                answer: "Towards the mountain",
                explanation: "Phoebe suggested flying towards the mountain."
              },
              {
                q: "What did Phoebe notice while they were flying?",
                options: ["A cable car", "A waterfall", "A helicopter", "A train"],
                answer: "A cable car",
                explanation: "Phoebe noticed a cable car while flying above the mountain."
              },
              {
                q: "How many times did they fly around the mountain?",
                options: ["Once", "Twice", "Three times", "Four times"],
                answer: "Twice",
                explanation: "The story says they flew twice around the big mountain."
              },
              {
                q: "Why did they press the green button?",
                options: ["To fly higher", "To open a parachute", "To fly faster", "To stop flying"],
                answer: "To fly faster",
                explanation: "They wanted to fly more quickly."
              },
              {
                q: "Where were they heading after flying around the mountain?",
                options: [
                  "Back towards the park and then the ocean",
                  "Towards the city and the airport",
                  "Towards the woods and then the mountain",
                  "Towards the river and then the park"
                ],
                answer: "Back towards the park and then the ocean",
                explanation: "They headed back towards the park and then past it towards the ocean."
              },
              {
                q: "Which places did Alex and Phoebe search while looking for Patrick?",
                options: [
                  "The mountains, city and airport",
                  "The beaches, ocean, fields and woods",
                  "The school, park and shopping centre",
                  "The forest, village and desert"
                ],
                answer: "The beaches, ocean, fields and woods",
                explanation: "They searched over the beaches, ocean, fields and woods."
              },
              {
                q: "Who finally spotted Patrick falling through the sky?",
                options: ["Phoebe", "The rental man", "Patrick himself", "Alex"],
                answer: "Alex",
                explanation: "Alex finally saw Patrick falling through the sky."
              },
              {
                q: "What was Patrick doing when Alex saw him?",
                options: ["Falling very quickly", "Flying towards the mountain", "Sitting on the ground", "Climbing a mountain"],
                answer: "Falling very quickly",
                explanation: "Patrick was high up but falling very quickly because he had no control over his jet pack."
              },
              {
                q: "Why did Patrick have no control over his jet pack?",
                options: [
                  "His jet pack had run out of fuel.",
                  "He had forgotten his helmet.",
                  "He hadn't listened carefully and didn't really know how to fly it.",
                  "The other children had taken his controls."
                ],
                answer: "He hadn't listened carefully and didn't really know how to fly it.",
                explanation: "Patrick was too impatient to listen to the instructions."
              },
              {
                q: "What did Patrick's arm movements look like?",
                options: ["He was waving goodbye.", "He was swimming.", "He was climbing.", "He was conducting an orchestra."],
                answer: "He was swimming.",
                explanation: "Patrick was making movements with his arms like a swimmer, but much faster."
              },
              {
                q: "Which buttons did Alex and Phoebe press to fly up closer to Patrick?",
                options: ["Blue and yellow", "Yellow and green", "Blue and orange", "Orange and green"],
                answer: "Orange and green",
                explanation: "They pressed the orange button and then the green one."
              },
              {
                q: "Which button did they press to start going down next to Patrick?",
                options: ["Blue", "Yellow", "Green", "Orange"],
                answer: "Blue",
                explanation: "They pressed the blue button to start descending next to Patrick."
              },
              {
                q: "Which two buttons did they tell Patrick to press together?",
                options: ["Orange and green", "Yellow and blue", "Green and blue", "Yellow and orange"],
                answer: "Yellow and blue",
                explanation: "Alex and Phoebe shouted for Patrick to press the yellow and blue buttons together."
              },
              {
                q: "What happened after Alex and Phoebe shouted the emergency instructions?",
                options: [
                  "His jet pack flew faster.",
                  "He landed on the mountain.",
                  "His parachute opened.",
                  "He started flying towards the ocean."
                ],
                answer: "His parachute opened.",
                explanation: "They heard a whoosh as Patrick's parachute opened."
              },
              {
                q: "Who walked towards the children after they landed?",
                options: ["A mountain climber", "A police officer", "A pilot", "The man from the jet pack rental stall"],
                answer: "The man from the jet pack rental stall",
                explanation: "The man from the jet pack rental stall walked over to them."
              },
              {
                q: "Who did the rental man praise?",
                options: ["Patrick", "Alex", "Phoebe", "All the people climbing the mountain"],
                answer: "Patrick",
                explanation: "The rental man congratulated Patrick for knowing about the emergency buttons."
              },
              {
                q: "What was the rental man glad Patrick knew about?",
                options: ["The cable car controls", "The emergency buttons", "The mountain climbing equipment", "The park entrance"],
                answer: "The emergency buttons",
                explanation: "The rental man said he was glad Patrick knew about the emergency buttons."
              },
              {
                q: "What did Patrick say to Alex and Phoebe?",
                options: [
                  `"Let's fly higher!"`,
                  `"I want another jet pack!"`,
                  `"Thanks, you two. That was close."`,
                  `"I don't need your help!"`
                ],
                answer: `"Thanks, you two. That was close."`,
                explanation: `Patrick thanked his friends and said, "That was close."`
              },
              {
                q: "Who was wearing the parachute in the rescue?",
                options: ["Alex", "Phoebe", "The rental man", "Patrick"],
                answer: "Patrick",
                explanation: "Patrick's parachute opened, and Alex and Phoebe landed next to him."
              }
            ],

            storyteller: [
              {
                title: "Introduce the characters",
                question: "How would you like to start your story?",
                options: [
                  "Patrick, Alex and Phoebe were three friends who wanted to have an exciting adventure.",
                  "Three young friends named Patrick, Alex and Phoebe were getting ready for a jet pack experience.",
                  "It was an exciting day for three friends: Alex, Phoebe and Patrick.",
                  "Patrick, Phoebe and Alex were about to discover that flying jet packs was not as easy as they thought.",
                  "Three young adventurers were ready to explore the sky."
                ]
              },
              {
                title: "Preparing to fly",
                question: "What happened before the flight?",
                options: [
                  "Alex and Phoebe carefully read the instructions before using their jet packs.",
                  "The two friends listened carefully and learned how to control their jet packs.",
                  "Although they felt a little nervous, Alex and Phoebe were ready to fly.",
                  "They wanted to make sure they understood how everything worked.",
                  "Unlike Patrick, Alex and Phoebe took the instructions seriously."
                ]
              },
              {
                title: "Taking off",
                question: "How did their adventure begin?",
                options: [
                  "After counting to three, Alex and Phoebe pressed the yellow buttons and flew into the sky.",
                  `"One, two, three, go!" shouted Phoebe as they took off.`,
                  "They pressed the yellow buttons and quickly rose higher and higher.",
                  "With excitement, the two friends started their jet packs and flew upwards.",
                  "Their amazing flying adventure had finally begun."
                ]
              },
              {
                title: "Choosing their destination",
                question: "Where did they decide to go?",
                options: [
                  "Alex asked where they should go, and Phoebe suggested flying towards the mountain.",
                  "They decided to explore the big mountain nearby.",
                  "Phoebe pointed towards the mountain and asked Alex to fly in that direction.",
                  "They used the orange buttons to fly higher and head towards the mountain.",
                  "The mountain looked like a perfect place to explore from the sky."
                ]
              },
              {
                title: "Exploring the mountain",
                question: "What did they see?",
                options: [
                  "They noticed a cable car travelling across the mountain.",
                  "They saw people climbing below them, looking very small from the sky.",
                  "They flew twice around the mountain and enjoyed the fantastic view.",
                  "Alex and Phoebe were amazed by the beautiful scenery below.",
                  "They couldn't believe how exciting flying above the mountain was."
                ]
              },
              {
                title: "Flying faster",
                question: "What happened next?",
                options: [
                  "They pressed the green buttons because they wanted to fly faster.",
                  "After exploring the mountain, they headed back towards the park and the ocean.",
                  "They continued their adventure and flew past the park towards the sea.",
                  "The two friends decided it was time to explore somewhere else.",
                  "They changed their flight speed and continued towards the ocean."
                ]
              },
              {
                title: "Searching for Patrick",
                question: "What was the problem?",
                options: [
                  "Suddenly, Phoebe realised she couldn't see Patrick anywhere.",
                  "They were getting worried because Patrick was nowhere to be found.",
                  "They searched over the beaches, ocean, fields and woods.",
                  "They followed the river, hoping to find their missing friend.",
                  "Phoebe thought Patrick might be in trouble because he hadn't listened to the instructions."
                ]
              },
              {
                title: "Discovering the danger",
                question: "What did they discover?",
                options: [
                  "Suddenly, Alex spotted Patrick falling very quickly through the sky.",
                  "Patrick was high above them, but he couldn't control his jet pack.",
                  "He was moving his arms like a swimmer, trying to control his fall.",
                  "Alex and Phoebe realised that their friend was in serious danger.",
                  "Patrick looked frightened because he didn't know what to do."
                ]
              },
              {
                title: "Saving Patrick",
                question: "How did they rescue him?",
                options: [
                  "Alex and Phoebe quickly flew closer to Patrick to help him.",
                  "They used the orange and green buttons to get closer and then the blue button to descend beside him.",
                  "They shouted instructions and told Patrick to press the yellow and blue buttons together.",
                  "Suddenly, Patrick's parachute opened with a loud whoosh.",
                  "Luckily, their quick thinking helped Patrick escape the dangerous situation."
                ]
              },
              {
                title: "Ending the story",
                question: "How did the story end?",
                options: [
                  "Everyone landed safely, and the rental man congratulated Patrick.",
                  "The rental man was impressed that Patrick knew about the emergency buttons.",
                  "Patrick was quiet for a moment, but he thanked Alex and Phoebe for helping him.",
                  `"That was close!" said Patrick as they walked towards the gate.`,
                  "In the end, the three friends were safe and happy to have completed their adventure."
                ]
              }
            ],

            vocabulary: [
              {
                word: "jet pack",
                explanation: "A machine you wear on your back that lets you fly through the air."
              },
              {
                word: "instructions",
                explanation: "Words that tell you what to do and how to do it."
              },
              {
                word: "nervous",
                explanation: "A little worried or afraid about something that is going to happen."
              },
              {
                word: "impatient",
                explanation: "Not able to wait; wanting something to happen right now."
              },
              {
                word: "cable car",
                explanation: "A small cabin that hangs from a moving rope and carries people up a mountain."
              },
              {
                word: "mountain",
                explanation: "A very high hill with a pointed top."
              },
              {
                word: "ocean",
                explanation: "A very large area of salt water."
              },
              {
                word: "control",
                explanation: "The power to make something move or work the way you want."
              },
              {
                word: "parachute",
                explanation: "A large piece of material that opens in the air and helps someone fall safely to the ground."
              },
              {
                word: "emergency",
                explanation: "A dangerous situation that needs quick action."
              },
              {
                word: "safely",
                explanation: "In a way that is free from danger."
              },
              {
                word: "worried",
                explanation: "Thinking that something bad might happen."
              }
            ]
          }
        ]
      }
    }
  }
};

/* Convenience helpers shared by the app and the activities. */
const StoryData = {
  books: function () {
    return Object.keys(STORY_LIBRARY).map(function (id) {
      const book = STORY_LIBRARY[id];
      return {
        id: id,
        title: book.title,
        emoji: book.emoji,
        theme: book.theme,
        units: book.units || {}
      };
    });
  },

  getBook: function (bookId) {
    const book = STORY_LIBRARY[bookId];
    if (!book) return null;
    return {
      id: bookId,
      title: book.title,
      emoji: book.emoji,
      theme: book.theme,
      units: book.units || {}
    };
  },

  getStories: function (bookId, unitId) {
    const book = STORY_LIBRARY[bookId];
    if (!book || !book.units) return [];
    const unit = book.units[unitId];
    return unit && Array.isArray(unit.stories) ? unit.stories : [];
  },

  getStory: function (bookId, unitId, storyId) {
    const stories = StoryData.getStories(bookId, unitId);
    for (let i = 0; i < stories.length; i++) {
      if (stories[i].id === storyId) return stories[i];
    }
    return stories.length ? stories[0] : null;
  },

  countStories: function (bookId) {
    const book = STORY_LIBRARY[bookId];
    if (!book || !book.units) return 0;
    return Object.keys(book.units).reduce(function (total, unitId) {
      const unit = book.units[unitId];
      return total + (unit && Array.isArray(unit.stories) ? unit.stories.length : 0);
    }, 0);
  }
};