# Hushwork — a clockmakers' guildhall stealth heist

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/vnazt/stealth-game/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/vnazt/stealth-game/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

**Steal the clockmakers' masterworks by night: 5 heists, 19 wardens, 28 treasures, 3 gadgets.**

A top-down 2D stealth heist game in vanilla JavaScript and canvas — no libraries, no network.
Sneak the five halls of the clockmakers' guildhall as Wren, the lifter: learn each warden's
dashed patrol loop, hide where their lamplight cones stop (crates and walls block sight for
real), crouch behind low cover, freeze in the shadow fronds, throw coins to pull a warden off
post, drop smoke to blind a cone, and cut chained gates with the bolt cutters. Detection is a
system, not a switch: suspicion rises and decays, a glimpse earns a "?", a noise earns an
investigation, and even a full alarm cools down if you break line of sight and hide.

## Play it

```sh
node serve.ts        # then open http://localhost:8080
```

WASD / arrows move · SHIFT sneak · CLICK throw coin · Q smoke · E take / cut gate · R retry · ESC pause

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and writes `dossier.json`
with the vendored make.fun library. The game source lives under `game/js/`, split by stealth
job: `levels.js` (the five heists), `vision.js` (line of sight + cones), `guards.js` (warden
AI), `hearing.js` (noise), `gadgets.js` (coins, smoke, cutters), `lighting.js`, `hud.js`,
`render.js`, `input.js`, `shots.js` (screenshot staging) and `game.js` (the loop).
