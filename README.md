# Poople 💩

A daily word ladder game. You start with a 4-letter word and have to reach **POOP**, changing one letter at a time.

**Play:** https://poople-opal.vercel.app

## How to play

- Everyone gets the same start word each day. It changes at midnight, local time.
- Each move changes exactly one letter, and every step must be a real English word (`POOL` → `POOP` is valid, `POOL` → `POUT` is not).
- Tiles turn brown when a letter already matches POOP in that position.
- There's no move limit, just a move counter, and no undo.
- Reach POOP and the nuke goes off. 💥

Progress is saved in your browser, so a refresh keeps your ladder.

## Run locally

It's a static site with no build step. Open `index.html` in a browser, or serve the folder:

```
npx serve .
```

## Files

- `index.html` has the game: markup, styles and logic.
- `words.js` has the dictionary (`WORDS`) and the pool of daily start words (`START_WORDS`). Every start word can reach POOP in at least 3 steps.

## Deploy

Hosted on Vercel as a static site, with zero config.

```
vercel --prod
```
