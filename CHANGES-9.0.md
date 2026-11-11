# Coaster Lab 9.0

`coaster_lab_v9_0.html` is the new version. `coaster_lab_v8_6.html` and `coaster_lab_v8_5.html` are unchanged and stay in the
repository as backups.

9.0 changes three areas. They were picked after measuring 8.6, not before: every ready-made layout, 24 random beginner
builds, 24 sketches, a week of park days at different prices, ride switching and lap timing were all run through the real
game first. The numbers below come from those runs.

## 1. Track Builder 5.0

**Three levels.** The level button in the top bar opens a menu (on a phone it is in the ⋯ menu). Each level adds to the one
before it; switching never changes the coaster.

| | Beginner | Intermediate | Advanced |
|---|---|---|---|
| Library | Basic, Turns, Hills, Inversions, Blueprints, Quick build, Daily, and a **More** chip | every category | every category |
| Settings on a piece | the 2 to 4 that matter most | every everyday setting (banking, transitions, …) | plus expert settings and exact number boxes |
| Selection bar | Duplicate, Smooth, Taller / Shorter, Delete | plus Copy, Paste, Mirror, Reverse, save as Blueprint | same |
| Snap and Grid switches | hidden unless one is off | shown | shown |
| Forces and technical details | no | no | yes |

Someone who already used the builder in 8.x had every category and tool in "Beginner". On the first start of 9.0 they are
moved to Intermediate once, so nothing disappears for them, and a notice explains it. New players start in Beginner.

**One card per cause.** 8.6 listed problems piece by piece. A track that ran out of the park showed one "must fix" card for
every piece beyond the edge: a random 12-piece beginner build showed 21 must-fix cards for what were 4 causes. Now:

* the same problem on neighbouring pieces is one card ("Pieces 4–12 (9 in a row)");
* a problem that is only the result of another is folded into its cause. A blank coaster used to say both "nothing gets the
  train moving" and "the train runs out of speed"; it now says the first;
* each card states the measured size of the problem in plain words ("It reaches about 12 m past the edge of the park",
  "The two tracks are only 1.9 m apart. They need at least 2.5 m"). Force figures are labelled as estimates;
* the count on the ✓ Check tab is the number of cards.

The validator itself is unchanged, so Evolve, the Daily Challenge and the sketch studio score coasters exactly as before.

**Repairs that keep the coaster.**

* "Outside the park" is first repaired by sliding the whole coaster back inside (turning it only if sliding is not enough).
  No piece changes. Before, the repair shortened and reshaped pieces, and often could not finish.
* "Fix it for me" on a grouped card repairs that problem only.
* Fix my track stops searching as soon as it finds a change that fixes the problem with no side effects, and gives the
  browser a turn every 30 ms instead of after every candidate.
* As before, every repair is previewed (Before / After), nothing changes until **Apply**, and **Undo** restores the coaster
  exactly. A test now checks that.

**Blueprints.**

* Three new starting points, listed first: **Starter: lift & first drop**, **Out & Back**, **Figure Eight**. Each passes the
  full check with no must-fix problems and no warnings.
* Every ready-made layout shows its measured length, height, top speed and thrill word, so a layout can be chosen by what
  it is. The figures come from the builder's own lap simulation, a few layouts at a time so the panel never freezes.
* Fixed: the second column of blueprint cards was clipped and its **Start new** button cut off (also in 8.6).

## 2. Sketch-to-Coaster: drawings that come back to the start

The most natural drawing, a closed circuit, was the one that failed. The station sits at the start of the path and the
builder adds its own return track into it, so a drawing that ended where it began ran into the station. In 8.6, 14 closed
test drawings (circles, a square, a star, a zigzag, two strokes forming a ring, a pretzel, with and without a side view)
gave 9 coasters with must-fix problems: 8 where the end hit the station or its return track, 1 with a kink from a jagged
side view. The four built-in examples avoid the problem by stopping short of the start.

9.0 recognises a drawing whose end returns to its start (or runs past it), trims the tail until it is clear of the
station, lets the automatic return track close the circuit, and says so in "what I see". If the first attempt still
touches the station it leaves more room and tries again. Open drawings are not touched.

| Test drawings | 8.6 | 9.0 |
|---|---|---|
| Closed drawings that came out with must-fix problems | 9 of 14 | 0 of 17 |
| Open drawings and the 4 examples | all fine | all fine |

Also: a jagged side view that produced a sharp kink is smoothed on the retry, and a small ring (under 160 m around), which
used to be refused as "very short", now gets a message that says what to draw instead.

## 3. Park: ride fares and guest reactions

**The fare per ride now matters.** In 8.6 the fare had no effect on how many guests rode. Raising it from $1 to $20 left
visitors unchanged and took a day's income from about $210,000 to $1,050,000, so the best fare was always the maximum.

Now each guest type compares the fare with what a ride is worth to them. Better rides are worth more; price-sensitive
guests give up sooner. Guests who skip rides because of the fare are less happy, and say so.

| Fare per ride | Day income, 8.6 | Day income, 9.0 |
|---|---|---|
| $1 (default) | 210,026 | 210,026 |
| $7 | not measured | 358,877 |
| $20 | 1,052,188 | 161,667 |

* At the default $1 a seeded park day is identical to 8.6, number for number. A park that kept the default is unchanged.
* A park that was set to a very high fare will earn less than it did. That is the fix.
* Income now peaks around $6 to $8 in a starting park, and higher in a park with better coasters. When queues are full the
  fare can go up without losing riders, because the rides were over capacity.
* Park HQ → Money shows what guests think a ride is worth and what share of them skip rides at the current fare.

**Speech bubbles.** A few visible guests show a speech bubble with what the simulated crowd is thinking: the same weighted
thoughts the Guests panel counts ("The rides cost too much", "The queue for … is far too long", "… was amazing!"), plus
each guest's own thought. It is a fixed pool of 2 to 4 sprites that redraw only when their text changes. Settings → Coaster
Lab 8.0 has a switch for them.

## What was checked and left alone

* **Ride physics and timing.** Lap time and top speed are the same at 60, 20 and 7 frames per second and at ¼× to 4×
  playback (65.72 s to 65.86 s at 1×). The physics code is untouched; the "identical to 8.5" test still passes.
* **Memory.** Switching through 8 rides three times and opening the builder three times does not grow the number of
  geometries or scene objects.
* **Saves.** Import and restore already write all items or none and lock saving until the reload; unreadable lists are
  copied aside before anything can overwrite them. 9.0 adds no migration and changes no save format. It adds one setting
  value (`bLevel: "intermediate"`), one setting (`bubbles`) and one flag (`coasterlab.v80.lvl90`). 8.6 opens a browser that
  9.0 has used: it ignores the flag and falls back to Beginner if the level was Intermediate.
* **Accidental loss in the builder.** Starting a new coaster saves the current one first, deleting several pieces asks,
  deleting saved coasters and blueprints asks, and everything else is one Undo away. No change was needed.

## Known limits

* The four oldest hand-built rides (Looping Adventure, Canyon Rush, Sky Serpent, Mine Mountain) report very high force
  estimates in the Research Lab (up to 14.5 G on Canyon Rush). Their track shapes are tight and the estimate is honest about
  that. Reshaping them would change rides people know, so it was not done here.
* Fix my track still cannot repair every random pile of pieces. A track much longer than the park cannot be slid inside,
  and then the older piece-by-piece repair runs.
* The fare is one price for the whole park. Each ride's own appeal decides how many guests accept it, but there is no
  price per ride.
* Speech bubbles show the crowd's thoughts on a sample of guests. Guests are still a visible sample of an aggregate
  simulation, not individually simulated people.
* Frame rates were not measured: the test browser draws with a software graphics card. The bubbles add at most 4 draw
  calls; nothing else in 9.0 adds per-frame work.
* Not tested on a real phone in this session. The iPhone checklist in `CHANGES-8.6.md` still applies; add: level menu,
  a closed sketch, the fare slider in Park HQ → Money, and bubbles in the plaza.

## Suggested next steps

1. A price per ride, shown on the ride list in Park HQ, now that fares respond to each ride's appeal.
2. Spend park money on ride upgrades with visible effects (an extra train, faster loading), using the capacity numbers
   Ride Ops already calculates.
3. Gentler versions of the four oldest rides offered as an option, so their force estimates fall into a believable range.
4. A "combine" check for inserting a whole layout into an existing coaster: today it is previewed and can be cancelled,
   but it often leaves the park and then relies on the repair.

## Tests

`tests/t6_v90.js` is new (59 checks). All suites are listed in `tests/README.md`; run them with `cd tests && npm test`.
