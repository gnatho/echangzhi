// ===========================================================================
//  Snakes & Ladders - IMAGE / FIELD CONFIGURATION
// ===========================================================================
//  This file controls the "image fields": special board cells that pop up a
//  picture (with a caption) whenever a player lands on them.
//
//  ── HOW TO ADD REAL IMAGES LATER ──────────────────────────────────────────
//  1. Drop your image inside this folder, e.g.   games/snakes/img/cat.png
//  2. Add an entry to FIELD_IMAGES below, keyed by the CELL NUMBER it should
//     appear on:
//
//         const FIELD_IMAGES = {
//             7:  { title: "Cat", src: "img/cat.png", caption: "A fluffy cat!" },
//             14: { title: "Dog", src: "img/dog.png", caption: "A happy dog!"  },
//         };
//
//  3. Leave `src` empty ("") to keep the auto-generated PLACEHOLDER instead.
//     The placeholder shows the title + an icon so you can see exactly where
//     the picture will appear before the real artwork is ready.
//
//  NOTE: Because the board size is configurable, only entries whose cell
//  number actually exists on the current board are used. Extra "auto" image
//  fields (see AUTO_IMAGE_FIELDS) are scattered across the board as
//  placeholders so there is always something to discover.
// ===========================================================================

// Explicit cell-number -> image map. Add your real images here.
const FIELD_IMAGES = {
    // 7:  { title: "Cat", src: "img/cat.png", caption: "Meow!" },
};

// How many EXTRA placeholder image fields to scatter across the board.
// "auto" picks a sensible count based on board size. Use a number to force it.
const AUTO_IMAGE_FIELDS = "auto";

// Library of placeholder pictures used for auto fields (and as a fallback).
// Each item is used in rotation. Give any item a `src` to upgrade it to a
// real picture everywhere it is used.
const IMAGE_LIBRARY = [
    { title: "Treasure", emoji: "💰", color: "#f9ca24", caption: "You found hidden treasure!" },
    { title: "Rocket",   emoji: "🚀", color: "#48dbfb", caption: "3... 2... 1... blast off!" },
    { title: "Crown",    emoji: "👑", color: "#a29bfe", caption: "All hail the champion!" },
    { title: "Star",     emoji: "⭐", color: "#feca57", caption: "You're a shining star!" },
    { title: "Trophy",   emoji: "🏆", color: "#ff6b6b", caption: "A winner's trophy!" },
    { title: "Cake",     emoji: "🎂", color: "#fd79a8", caption: "Time for a treat!" },
    { title: "Balloon",  emoji: "🎈", color: "#00cec9", caption: "Let's celebrate!" },
    { title: "Gem",      emoji: "💎", color: "#74b9ff", caption: "A sparkling gem!" },
];

// Expose globally (plain <script> include - no module system).
window.SNAKES_FIELDS = { FIELD_IMAGES, AUTO_IMAGE_FIELDS, IMAGE_LIBRARY };
