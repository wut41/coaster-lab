// Rough concepts for the 10.0 coasters (compass: +x east, +z south; a station with dir0 0 faces east).
// tune_designs.js turns each into a design that passes the builder's full check; the results are frozen in
// src/v10/js/10_rides.js. Kept as a record of where each layout came from, and for tuning future rides.
// lock: settings kept exactly as written · range: settings kept inside [min, max] · goal: wishes for the finished ride
const SOFT = { lat: 1.3 };
module.exports = {
  // DIVE: 58 m lift, holding brake, true vertical drop, climbing turnaround, Immelmann, mid brake, second dive, splash turn
  Talon: {
    els: [['station', { len: 16, brake: 20, sx: -62, sz: 60, dir0: 0, ret: .7 }], ['lift', { h: 58, a: 60, chain: 1, e: .6 }], ['brakes', { len: 8, v: 3.5 }], ['drop', { h: 57, a: 90, e: .55 }],
      ['turn', { dir: 'L', ang: 180, r: 26, climb: 10, bank: 'set', bdeg: 78 }], ['airtime', { h: 10, len: 60 }], ['immelmann', { dir: 'R', r: 13, out: 14 }], ['brakes', { len: 10, v: 8 }], ['drop', { h: 28, a: 85, e: .2 }],
      ['turn', { dir: 'L', ang: 180, r: 18 }], ['airtime', { h: 7, len: 50 }], ['turn', { dir: 'L', ang: 90, r: 16 }]],
    goal: { ...SOFT, inv: 1, gMax: 4.5, comfort: 40, edge: 93 }, lock: ['0.len', '1.h', '2.v', '2.len', '3.a', '3.h', '3.e', '7.len'], range: { '1.a': [56, 63], '4.r': [24, 30], '4.climb': [6, 12], '4.bdeg': [65, 85], '5.h': [7, 12], '6.r': [12, 14], '7.v': [7, 9], '8.h': [24, 30], '8.a': [80, 90], '8.e': [.2, .3], '9.r': [16, 22], '10.h': [5, 9] }, iters: 1400
  },
  // WING (launched): launch into a giant Immelmann, zero-G roll, keyhole hill, overbank, corkscrew, barrel roll, booster, hops home
  Aurora: {
    els: [['station', { len: 16, brake: 18, sx: -58, sz: 62, dir0: 0, ret: .7 }], ['launch', { len: 40, v: 30 }], ['immelmann', { dir: 'L', r: 14, out: 14 }], ['drop', { h: 22, a: 55 }],
      ['turn', { dir: 'R', ang: 180, r: 15 }], ['zerog', { dir: 'R', h: 10, len: 44 }], ['airtime', { h: 11, len: 56 }], ['overbank', { dir: 'L', ang: 180, r: 17, h: 8, bdeg: 100 }],
      ['corkscrew', { dir: 'R', len: 30 }], ['barrel', { dir: 'L', rr: 3, len: 44 }], ['turn', { dir: 'R', ang: 180, r: 15 }], ['launch', { len: 20, v: 20 }], ['airtime', { h: 6, len: 40 }],
      ['turn', { dir: 'L', ang: 180, r: 13 }], ['airtime', { h: 5, len: 40 }], ['hill', { h: 3, len: 30 }], ['airtime', { h: 3, len: 28 }], ['turn', { dir: 'L', ang: 90, r: 13 }],
      ['airtime', { h: 3, len: 30 }], ['hill', { h: 2, len: 28 }]],
    goal: { ...SOFT, inv: 4, gMax: 4.6, comfort: 40 }, lock: ['0.len'], range: { '1.v': [28, 32], '2.r': [12.5, 15], '3.h': [19, 23], '5.h': [8, 12], '6.h': [8, 13], '7.h': [6, 10], '11.v': [17, 22], '12.h': [4, 8], '14.h': [3, 6], '15.h': [2, 4], '16.h': [2, 4], '18.h': [2, 4], '19.h': [1.5, 3] }, iters: 1500
  },
  // INVERTED: curved first drop, loop, zero-G roll, second loop, two corkscrews (a classic five-inversion invert)
  Nightshade: {
    els: [['station', { len: 16, brake: 18, sx: -62, sz: 66, dir0: 0, ret: .7 }], ['lift', { h: 34, a: 40, chain: 1 }], ['twistdrop', { dir: 'L', h: 30, ang: 180, r: 15 }], ['loop', { r: 10, dir: 'L' }],
      ['zerog', { dir: 'R', h: 9, len: 40 }], ['turn', { dir: 'R', ang: 180, r: 15 }], ['loop', { r: 9, dir: 'R' }], ['airtime', { h: 6, len: 40 }], ['turn', { dir: 'L', ang: 180, r: 14, climb: 3 }],
      ['corkscrew', { dir: 'L', len: 28 }], ['hill', { h: 3, len: 30 }], ['corkscrew', { dir: 'R', len: 28 }], ['turn', { dir: 'L', ang: 90, r: 14, climb: -3 }], ['airtime', { h: 5, len: 34 }]],
    goal: { ...SOFT, inv: 5, gMax: 4.5, comfort: 40 }, lock: ['0.len', '1.h'], range: { '2.h': [27, 31], '3.r': [9.5, 12], '4.h': [6, 10], '6.r': [8, 10], '7.h': [4, 8], '10.h': [1.5, 4], '13.h': [3, 6] }, iters: 1300
  },
  // FLYING: swooping curved drop, horseshoe turns low over the lagoon, corkscrew, helix
  Manta: {
    els: [['station', { len: 16, brake: 18, sx: -60, sz: 64, dir0: 0, ret: .8 }], ['lift', { h: 32, a: 38, chain: 1 }], ['twistdrop', { dir: 'L', h: 28, ang: 200, r: 18 }], ['airtime', { h: 8, len: 50 }],
      ['overbank', { dir: 'R', ang: 180, r: 18, h: 9, bdeg: 100 }], ['hill', { h: 5, len: 40 }], ['turn', { dir: 'L', ang: 180, r: 16, climb: 2 }], ['corkscrew', { dir: 'L', len: 32 }],
      ['helix', { dir: 'R', turns: 1, r: 14, climb: -2 }], ['airtime', { h: 5, len: 40 }], ['turn', { dir: 'L', ang: 90, r: 15 }]],
    goal: { ...SOFT, inv: 1, gMax: 4.2, comfort: 55 }, lock: ['0.len', '1.h'], range: { '2.h': [26, 29], '3.h': [5, 9], '4.h': [7, 11], '5.h': [3, 6], '8.turns': [1, 1.25], '8.r': [12, 16], '9.h': [3, 6], '10.r': [12, 18] }, iters: 1100
  },
  // MOTORBIKE LAUNCH: no lift at all; two launches, low banked S-curves like a race track, no inversions
  Turbo: {
    els: [['station', { len: 14, brake: 16, sx: -64, sz: 60, dir0: 0, ret: .7 }], ['launch', { len: 34, v: 26 }], ['turn', { dir: 'L', ang: 90, r: 22, climb: 4 }], ['airtime', { h: 5, len: 44 }],
      ['turn', { dir: 'L', ang: 100, r: 18 }], ['turn', { dir: 'R', ang: 100, r: 18 }], ['hill', { h: 4, len: 36 }], ['turn', { dir: 'L', ang: 180, r: 16, climb: -2 }], ['launch', { len: 24, v: 24 }],
      ['overbank', { dir: 'R', ang: 180, r: 18, h: 7, bdeg: 96 }], ['airtime', { h: 4, len: 40 }], ['turn', { dir: 'L', ang: 180, r: 15 }], ['hill', { h: 3, len: 30 }]],
    goal: { ...SOFT, inv: 0, gMax: 4, comfort: 65, tMin: 45 }, lock: ['0.len'], range: { '1.v': [24, 28], '3.h': [3.5, 6], '6.h': [3, 5], '8.v': [21, 26], '9.h': [6, 9], '10.h': [3, 5], '12.h': [2, 4], '11.r': [13, 18], '4.r': [15, 22], '5.r': [15, 22] }, iters: 1100
  },
  // WOODEN: out-and-back with big camelbacks, a fan turn and a run of bunny hops home; no inversions, lots of airtime
  Timberwolf: {
    els: [['station', { len: 16, brake: 20, sx: -70, sz: 66, dir0: 0, ret: .7 }], ['lift', { h: 30, a: 28, chain: 1 }], ['drop', { h: 28, a: 52 }], ['turn', { dir: 'L', ang: 180, r: 16 }],
      ['airtime', { h: 15, len: 62 }], ['airtime', { h: 10, len: 50 }], ['turn', { dir: 'R', ang: 180, r: 14, climb: 4 }], ['drop', { h: 4, a: 25 }], ['airtime', { h: 7, len: 44 }],
      ['airtime', { h: 5.5, len: 38 }], ['airtime', { h: 4.5, len: 32 }], ['turn', { dir: 'L', ang: 180, r: 12 }], ['airtime', { h: 4, len: 32 }], ['airtime', { h: 3.5, len: 30 }],
      ['hill', { h: 2.5, len: 28 }], ['airtime', { h: 2.5, len: 26 }], ['turn', { dir: 'L', ang: 90, r: 14 }], ['airtime', { h: 2, len: 26 }]],
    goal: { ...SOFT, inv: 0, air: 5, gMax: 4, gMin: -1.1, comfort: 45 }, lock: ['0.len', '1.h', '1.chain'], range: { '1.a': [25, 32], '2.h': [26, 29], '2.a': [48, 56], '4.h': [11, 16], '5.h': [7, 11], '8.h': [4, 8], '9.h': [3, 6], '10.h': [2.5, 5], '12.h': [2, 4.5], '13.h': [2, 4], '14.h': [1.5, 3], '15.h': [2, 3], '17.h': [2, 3] }, iters: 1500
  },
  // FLOORLESS MULTI-LOOPER: 50 m lift, Immelmann + dive loop (a cobra roll), loop, corkscrew, zero-G roll, two more corkscrews
  Hydra: {
    els: [['station', { len: 16, brake: 18, sx: -64, sz: 66, dir0: 0, ret: .7 }], ['lift', { h: 50, a: 62, chain: 1 }], ['drop', { h: 48, a: 72, e: .6 }], ['immelmann', { dir: 'R', r: 15, out: 14 }],
      ['diveloop', { dir: 'R', h: 8, r: 9.5, len: 22 }], ['drop', { h: 18, a: 50 }], ['loop', { r: 12, dir: 'R' }], ['turn', { dir: 'L', ang: 180, r: 20 }],
      ['zerog', { dir: 'R', h: 9, len: 42 }], ['corkscrew', { dir: 'L', len: 26 }], ['corkscrew', { dir: 'L', len: 26 }], ['corkscrew', { dir: 'R', len: 26 }]],
    goal: { ...SOFT, inv: 7, gMax: 4.9, comfort: 30, edge: 93 }, lock: ['0.len', '1.h', '4.h', '7.ang'], range: { '0.sx': [-70, -60], '1.a': [60, 65], '2.h': [46, 49], '2.a': [70, 80], '2.e': [.5, .7], '3.r': [14, 16], '4.r': [9, 10.5], '5.h': [15, 20], '6.r': [11, 13], '7.r': [17, 23], '8.h': [6, 10] }, iters: 1800, seeds: [1, 2, 3, 4]
  },
  // SPINNING WILD MOUSE: high unbanked hairpins, then drops and bunny hops; compact
  Cheddar: {
    els: [['station', { len: 10, brake: 10, sx: -20, sz: 30, dir0: 0, ret: .6 }], ['lift', { h: 13, a: 30, chain: 1 }], ['brakes', { len: 6, v: 5 }], ['turn', { dir: 'L', ang: 180, r: 5, bank: 'flat' }],
      ['straight', { len: 24 }], ['turn', { dir: 'R', ang: 180, r: 5, bank: 'flat' }], ['straight', { len: 24 }], ['turn', { dir: 'L', ang: 180, r: 5, bank: 'flat' }], ['straight', { len: 22 }],
      ['turn', { dir: 'R', ang: 180, r: 5, bank: 'flat' }], ['drop', { h: 8, a: 40 }], ['airtime', { h: 4, len: 22 }], ['turn', { dir: 'L', ang: 180, r: 7 }], ['hill', { h: 3, len: 20 }], ['airtime', { h: 3, len: 20 }], ['turn', { dir: 'L', ang: 90, r: 7 }]],
    goal: { inv: 0, gMax: 3.6, lat: 1.7, lenMax: 460, comfort: 35 }, lock: ['0.len', '1.h', '2.v', 'turn.bank', '3.ang', '5.ang', '7.ang', '9.ang'], range: { '3.r': [5, 6], '5.r': [5, 6], '7.r': [5, 6], '9.r': [5, 6], '4.len': [18, 28], '6.len': [18, 28], '8.len': [18, 28], '4.climb': [-1, 0], '6.climb': [-1, 0], '8.climb': [-1, 0], '10.h': [6, 9], '11.h': [3, 5], '13.h': [2, 4], '14.h': [2, 4] }, iters: 1200
  },
  // FAMILY: 9 m lift, a gentle helix and little hops; nothing over 2.6 G
  Dipper: {
    els: [['station', { len: 12, brake: 10, sx: -20, sz: 24, dir0: 0, ret: .6 }], ['lift', { h: 9, a: 22, chain: 1 }], ['drop', { h: 6, a: 28 }], ['turn', { dir: 'L', ang: 180, r: 11 }],
      ['hill', { h: 2.5, len: 24 }], ['helix', { dir: 'L', turns: 1, r: 10, climb: -1 }], ['hill', { h: 2, len: 22 }], ['turn', { dir: 'L', ang: 90, r: 10 }]],
    goal: { inv: 0, gMax: 2.6, gMin: .2, lat: .9, comfort: 85, lenMax: 340 }, lock: ['0.len', '1.h'], range: { '2.h': [5, 7], '4.h': [1.5, 3], '5.turns': [1, 1.25], '5.r': [9, 12], '6.h': [1.5, 2.5] }, iters: 800
  },
  // SUSPENDED SWINGING: no inversions; long sweeping banked turns that swing the cars out, terrain-hugging dives
  Pendulum: {
    els: [['station', { len: 14, brake: 16, sx: -62, sz: 60, dir0: 0, ret: .8 }], ['lift', { h: 30, a: 35, chain: 1 }], ['turn', { dir: 'L', ang: 120, r: 16, climb: -8 }], ['turn', { dir: 'R', ang: 150, r: 15, climb: -9 }],
      ['turn', { dir: 'L', ang: 180, r: 16, climb: -6 }], ['hill', { h: 5, len: 40 }], ['turn', { dir: 'R', ang: 200, r: 14, climb: -2 }], ['turn', { dir: 'L', ang: 160, r: 14 }], ['hill', { h: 3, len: 30 }],
      ['helix', { dir: 'L', turns: 1.25, r: 12, climb: -1 }]],
    goal: { inv: 0, gMax: 3.8, lat: 1.1, comfort: 70 }, lock: ['0.len', '1.h'], range: { '5.h': [3, 6], '8.h': [2, 4], '9.turns': [1, 1.5], '9.r': [10, 14] }, iters: 900
  },
  // ---- flagship rework of two 8.4 rides (same identity, bigger statements)
  // THUNDER COMET 2: 144 km/h launch into a 44 m top hat, barrel roll, overbank, booster launch, zero-G roll
  Comet2: {
    els: [['station', { len: 16, brake: 18 }], ['launch', { len: 64, v: 40 }], ['lift', { h: 44, a: 62, chain: 0, e: .9 }], ['drop', { h: 43, a: 80, e: .9 }], ['turn', { dir: 'R', ang: 150, r: 34 }],
      ['airtime', { h: 16, len: 90 }], ['barrel', { dir: 'L', rr: 3, len: 48 }], ['overbank', { dir: 'R', ang: 150, r: 24, h: 10, bdeg: 105 }], ['launch', { len: 24, v: 30 }], ['airtime', { h: 10, len: 64 }],
      ['zerog', { dir: 'R', h: 7, len: 46 }], ['turn', { dir: 'L', ang: 120, r: 22 }], ['brakes', { len: 16, v: 9 }]],
    goal: { ...SOFT, noArea: true, lat: 1.5, inv: 2, gMax: 4.7, comfort: 35 }, lock: ['0.len', '0.sx', '0.sz', '0.dir0', '1.v', '2.chain'], range: { '1.len': [62, 72], '2.h': [40, 46], '2.a': [58, 65], '3.a': [75, 85], '5.h': [12, 18], '7.h': [8, 12], '8.v': [26, 32], '9.h': [7, 12], '10.h': [5, 9], '12.v': [8, 10] }, iters: 1500
  },
  // NOVA GIANT 2: 60 m lift, 80° drop, 24 m camelback, a giant 16 m loop, overbank, zero-G hill, two more hills
  Nova2: {
    els: [['station', { len: 18, brake: 20 }], ['lift', { h: 60, a: 45, chain: 1 }], ['drop', { h: 59, a: 80 }], ['airtime', { h: 24, len: 130 }], ['loop', { r: 16, dir: 'L' }],
      ['overbank', { dir: 'L', ang: 180, r: 34, h: 10, bdeg: 100 }], ['zerog', { dir: 'R', h: 14, len: 60 }], ['airtime', { h: 12, len: 100 }], ['airtime', { h: 7, len: 80 }], ['brakes', { len: 20, v: 9 }]],
    goal: { ...SOFT, noArea: true, inv: 2, gMax: 4.8, comfort: 35, lenMax: 930 }, lock: ['0.len', '0.sx', '0.sz', '0.dir0', '1.h', '1.chain', '4.r'], range: { '2.h': [57, 59], '2.a': [76, 82], '3.h': [20, 26], '3.len': [110, 110], '5.h': [8, 12], '5.r': [28, 36], '6.h': [10, 16], '7.h': [9, 14], '8.h': [5, 8], '9.v': [8, 10] }, iters: 1500
  }
};
