# 👑 Crown Zones

A daily logic puzzle — place exactly one crown in every colored zone. No two crowns can share a row or column, and none can touch, even diagonally.

**[Play it here](https://anthonydeganijr-bot.github.io/crown-zones/)**

## Features

- One deterministic daily puzzle, seeded by date, shared by every player
- Unlimited random puzzles, playable anytime
- Hints (3 per puzzle), mistake tracking, a timer, and streak tracking
- Optional daily reminder via browser push notifications — no account required
- Works offline as a single static HTML file with no build step or dependencies

## How it works

Every puzzle is pre-generated and verified offline (see [`gen/`](gen/)) rather than generated live in the browser. Generating a region layout with a **guaranteed unique solution** is a hard, probabilistic search problem — some board sizes need thousands of randomized attempts before one succeeds — so it isn't something worth doing on every page load. Instead, `gen/build-pool.mjs` generates a large batch of candidate puzzles offline, verifies each one has exactly one valid solution using a real backtracking solver, and bakes the verified pool directly into `index.html`. The daily puzzle is just a deterministic index into that pool, seeded by date.

`push-worker/` is a small, dependency-free Cloudflare Worker that powers the optional daily reminder notification — same design as [Word Ladder's](https://github.com/anthonydeganijr-bot/word-ladder).

## Support

If you enjoy it, there's a [☕ tip jar](https://buymeacoffee.com/anthonydegani) in the game's footer.
