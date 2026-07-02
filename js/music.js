// Original soundtrack for Princess Polina — composed as chiptune sequence data.
// Channels: p1 melody (pulse), p2 harmony/arp (pulse), tri bass (triangle), noise drums.
// Tokens are "note:steps" where a step is one 16th note; 'r' = rest.
// IMPORTANT: all channels in a track must total the same step count (they loop independently).

const rep = (s, n) => Array(n).fill(s).join(' ');
const arp8 = (a, b, c) => `${a}:2 ${b}:2 ${c}:2 ${b}:2 ${a}:2 ${b}:2 ${c}:2 ${b}:2`;
const bass4 = (r, f) => `${r}:4 ${f}:4 ${r}:4 ${f}:4`;
const bass8 = (r) => rep(`${r}:2`, 8);

const DR_POP = 'k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2';
const DR_SOFT = 'k:4 h:4 s:4 h:4';
const DR_DRIVE = 'k:2 h:2 s:2 k:2 k:2 h:2 s:2 h:2';
const DR_HEAVY = 'k:2 k:2 s:2 h:2 k:2 k:2 s:2 s:2';
const DR_WALTZ = 'k:4 h:4 h:4';

export const MUSIC = {
  // ---- TITLE: proud fanfare, C major -------------------------------------
  title: {
    bpm: 104, p1duty: 50, p2duty: 25,
    p1: [
      'g4:2 c5:2 e5:4 g5:4 e5:2 g5:2',
      'a5:4 g5:2 e5:2 f5:4 d5:4',
      'e5:2 f5:2 g5:4 c5:4 d5:2 e5:2',
      'd5:8 g4:8',
      'g4:2 c5:2 e5:4 g5:4 e5:2 c6:2',
      'b5:4 a5:2 g5:2 a5:4 f5:4',
      'g5:2 a5:2 g5:2 e5:2 c5:2 d5:2 e5:2 d5:2',
      'c5:12 r:4'
    ],
    p2: [
      arp8('c4', 'e4', 'g4'), arp8('a3', 'c4', 'f4'),
      arp8('c4', 'e4', 'g4'), arp8('b3', 'd4', 'g4'),
      arp8('c4', 'e4', 'g4'), arp8('a3', 'c4', 'f4'),
      arp8('c4', 'e4', 'g4'), arp8('c4', 'e4', 'g4')
    ],
    tri: [
      bass4('c3', 'g2'), bass4('f2', 'c3'),
      bass4('c3', 'g2'), bass4('g2', 'd3'),
      bass4('c3', 'g2'), bass4('f2', 'c3'),
      'g2:4 g2:4 g2:4 b2:4', 'c3:16'
    ],
    noise: [rep(DR_SOFT, 8)]
  },

  // ---- WORLD MAP: bouncy little march, F major ----------------------------
  map: {
    bpm: 118, p1duty: 25, p2duty: 125,
    p1: [
      'a4:2 r:2 a4:2 c5:2 d5:2 c5:2 a4:2 f4:2',
      'g4:2 r:2 g4:2 bb4:2 c5:4 r:4',
      'a4:2 r:2 a4:2 c5:2 d5:2 f5:2 d5:2 c5:2',
      'd5:2 c5:2 bb4:2 g4:2 f4:4 r:4',
      'c5:2 r:2 c5:2 d5:2 e5:2 d5:2 c5:2 a4:2',
      'bb4:2 r:2 bb4:2 c5:2 d5:4 r:4',
      'f5:2 e5:2 d5:2 c5:2 d5:2 bb4:2 g4:2 e4:2',
      'f4:4 a4:2 c5:2 f5:4 r:4'
    ],
    p2: [
      arp8('f3', 'a3', 'c4'), arp8('e3', 'g3', 'c4'),
      arp8('f3', 'a3', 'c4'), arp8('bb3', 'd4', 'f4'),
      arp8('f3', 'a3', 'c4'), arp8('g3', 'bb3', 'd4'),
      arp8('g3', 'bb3', 'c4'), arp8('f3', 'a3', 'c4')
    ],
    tri: [
      bass4('f2', 'c3'), bass4('c3', 'g2'),
      bass4('f2', 'c3'), bass4('bb2', 'f2'),
      bass4('f2', 'c3'), bass4('g2', 'd3'),
      bass4('c3', 'c3'), bass4('f2', 'c3')
    ],
    noise: [rep(DR_POP, 8)]
  },

  // ---- W1 EMERALD MEADOWS: sunny skip, C major -----------------------------
  w1: {
    bpm: 132, p1duty: 50, p2duty: 25,
    p1: [
      'e5:2 g5:2 e5:2 c5:2 d5:2 e5:2 g4:4',
      'a4:2 c5:2 e5:2 a5:2 g5:4 e5:4',
      'f5:2 a5:2 f5:2 c5:2 d5:2 f5:2 a4:4',
      'g4:2 b4:2 d5:2 g5:2 f5:2 d5:2 b4:4',
      'e5:2 g5:2 c6:4 b5:2 g5:2 a5:4',
      'a5:2 g5:2 e5:2 c5:2 d5:4 e5:4',
      'f5:2 e5:2 d5:2 f5:2 a5:4 g5:2 f5:2',
      'g5:4 e5:2 d5:2 c5:8'
    ],
    p2: [
      arp8('c4', 'e4', 'g4'), arp8('a3', 'c4', 'e4'),
      arp8('f3', 'a3', 'c4'), arp8('g3', 'b3', 'd4'),
      arp8('c4', 'e4', 'g4'), arp8('a3', 'c4', 'e4'),
      arp8('d4', 'f4', 'a4'), arp8('c4', 'e4', 'g4')
    ],
    tri: [
      bass4('c3', 'g2'), bass4('a2', 'e2'),
      bass4('f2', 'c3'), bass4('g2', 'd3'),
      bass4('c3', 'g2'), bass4('a2', 'e2'),
      bass4('d3', 'a2'), 'g2:4 g2:4 c3:8'
    ],
    noise: [rep(DR_POP, 8)]
  },

  // ---- W2 ANCIENT FOREST: mysterious groove, E dorian ----------------------
  w2: {
    bpm: 108, p1duty: 25, p2duty: 50,
    p1: [
      'e4:4 g4:2 a4:2 b4:4 a4:2 g4:2',
      'a4:4 fs4:2 e4:2 fs4:8',
      'e4:4 g4:2 a4:2 b4:2 d5:2 cs5:2 b4:2',
      'a4:4 fs4:2 a4:2 e4:8',
      'b4:4 d5:2 e5:2 d5:4 b4:2 a4:2',
      'g4:4 a4:2 b4:2 a4:8',
      'e5:4 d5:2 b4:2 cs5:2 b4:2 a4:2 g4:2',
      'fs4:4 g4:2 fs4:2 e4:8'
    ],
    p2: [
      arp8('e3', 'g3', 'b3'), arp8('d3', 'fs3', 'a3'),
      arp8('e3', 'g3', 'b3'), arp8('d3', 'fs3', 'a3'),
      arp8('g3', 'b3', 'd4'), arp8('e3', 'g3', 'b3'),
      arp8('a3', 'cs4', 'e4'), arp8('e3', 'g3', 'b3')
    ],
    tri: [
      bass4('e2', 'b2'), bass4('d2', 'a2'),
      bass4('e2', 'b2'), bass4('d2', 'a2'),
      bass4('g2', 'd3'), bass4('e2', 'b2'),
      bass4('a2', 'e3'), bass4('e2', 'b2')
    ],
    noise: [rep('k:4 h:2 h:2 s:4 h:2 o:2', 8)]
  },

  // ---- W3 CRYSTAL CAVERNS: sparse glassy echoes, A minor -------------------
  w3: {
    bpm: 92, p1duty: 50, p2duty: 125,
    p1: [
      'a4:4 c5:4 e5:4 d5:2 c5:2',
      'b4:4 r:4 e4:4 r:4',
      'a4:4 c5:4 e5:4 g5:2 e5:2',
      'f5:4 e5:2 d5:2 c5:8',
      'e5:4 d5:4 c5:4 b4:2 c5:2',
      'd5:4 c5:2 b4:2 a4:8',
      'f4:4 a4:4 c5:4 e5:2 c5:2',
      'b4:4 e4:4 a4:8'
    ],
    p2: [
      'r:2 a5:2 r:2 e5:2 r:2 c6:2 r:2 e5:2',
      'r:2 e5:2 r:2 b5:2 r:2 gs5:2 r:2 b4:2',
      'r:2 a5:2 r:2 e5:2 r:2 c6:2 r:2 e5:2',
      'r:2 f5:2 r:2 c6:2 r:2 a5:2 r:2 c5:2',
      'r:2 c6:2 r:2 g5:2 r:2 e5:2 r:2 g5:2',
      'r:2 d5:2 r:2 a5:2 r:2 f5:2 r:2 a4:2',
      'r:2 f5:2 r:2 c5:2 r:2 a5:2 r:2 c6:2',
      'r:2 e5:2 r:2 b4:2 r:2 a4:2 r:2 e5:2'
    ],
    tri: [
      'a2:8 a2:8', 'e2:8 e2:8', 'a2:8 a2:8', 'f2:8 c3:8',
      'c3:8 g2:8', 'd3:8 a2:8', 'f2:8 c3:8', 'e2:8 a2:8'
    ],
    noise: [rep('k:8 s:4 h:4', 8)]
  },

  // ---- W4 GOLDEN DESERT: sinuous phrygian-dominant, D ----------------------
  w4: {
    bpm: 120, p1duty: 25, p2duty: 25,
    p1: [
      'd5:2 eb5:2 d5:2 c5:2 d5:4 a4:4',
      'bb4:2 c5:2 bb4:2 a4:2 bb4:4 fs4:4',
      'g4:2 a4:2 bb4:2 c5:2 d5:2 eb5:2 fs5:2 d5:2',
      'eb5:4 d5:2 c5:2 d5:8',
      'fs5:2 g5:2 fs5:2 eb5:2 d5:4 c5:4',
      'bb4:2 c5:2 d5:2 eb5:2 d5:4 bb4:4',
      'a4:2 bb4:2 c5:2 bb4:2 a4:2 g4:2 fs4:2 g4:2',
      'a4:4 fs4:2 eb4:2 d4:8'
    ],
    p2: [
      arp8('d3', 'fs3', 'a3'), arp8('bb2', 'd3', 'f3'),
      arp8('g2', 'bb2', 'd3'), arp8('d3', 'fs3', 'a3'),
      arp8('d3', 'fs3', 'a3'), arp8('bb2', 'd3', 'f3'),
      arp8('a2', 'c3', 'eb3'), arp8('d3', 'fs3', 'a3')
    ],
    tri: [
      bass8('d2'), bass8('bb1'), bass8('g1'), bass8('d2'),
      bass8('d2'), bass8('bb1'), bass8('a1'), bass8('d2')
    ],
    noise: [rep('k:2 h:2 k:2 s:2 h:2 k:2 s:2 h:2', 8)]
  },

  // ---- W5 FROZEN PEAKS: crystalline lydian, F ------------------------------
  w5: {
    bpm: 100, p1duty: 50, p2duty: 125,
    p1: [
      'a5:4 g5:2 f5:2 e5:4 c5:4',
      'd5:2 e5:2 f5:2 g5:2 a5:8',
      'b5:4 a5:2 g5:2 a5:4 f5:4',
      'g5:2 f5:2 e5:2 d5:2 c5:8',
      'f5:2 g5:2 a5:2 c6:2 b5:4 a5:4',
      'g5:2 a5:2 b5:2 g5:2 e5:8',
      'f5:4 a5:4 c6:4 b5:2 g5:2',
      'a5:4 g5:2 e5:2 f5:8'
    ],
    p2: [
      'f4:2 a4:2 c5:2 e5:2 f5:2 e5:2 c5:2 a4:2',
      'g4:2 b4:2 d5:2 g5:2 f5:2 d5:2 b4:2 g4:2',
      'f4:2 a4:2 c5:2 e5:2 f5:2 e5:2 c5:2 a4:2',
      'e4:2 g4:2 b4:2 e5:2 d5:2 b4:2 g4:2 e4:2',
      'f4:2 a4:2 c5:2 e5:2 f5:2 e5:2 c5:2 a4:2',
      'c4:2 e4:2 g4:2 c5:2 b4:2 g4:2 e4:2 c4:2',
      'f4:2 a4:2 c5:2 f5:2 g4:2 b4:2 d5:2 g5:2',
      'f4:2 a4:2 c5:2 e5:2 f5:8'
    ],
    tri: [
      bass4('f2', 'c3'), bass4('g2', 'd3'),
      bass4('f2', 'c3'), bass4('e2', 'b2'),
      bass4('f2', 'c3'), bass4('c3', 'g2'),
      'f2:4 c3:4 g2:4 d3:4', 'f2:16'
    ],
    noise: [rep('k:8 h:4 s:4', 8)]
  },

  // ---- W6 SKY ISLES: airy waltz, Bb major (3/4 time) -----------------------
  w6: {
    bpm: 140, p1duty: 50, p2duty: 25,
    p1: [
      'bb4:4 d5:4 f5:4', 'g5:8 f5:4', 'eb5:4 g5:4 bb5:4', 'f5:12',
      'd5:4 f5:4 bb5:4', 'c6:8 bb5:4', 'a5:4 f5:4 c5:4', 'bb4:12',
      'eb5:4 g5:4 bb5:4', 'd6:8 c6:4', 'bb5:4 f5:4 d5:4', 'eb5:12',
      'c5:4 eb5:4 g5:4', 'f5:8 d5:4', 'eb5:4 c5:4 a4:4', 'bb4:12'
    ],
    p2: [
      rep('bb3:2 d4:2 f4:2 d4:2 bb3:2 d4:2', 2), rep('eb4:2 g4:2 bb4:2 g4:2 eb4:2 g4:2', 1), 'f4:2 a4:2 c5:2 a4:2 f4:2 a4:2',
      rep('bb3:2 d4:2 f4:2 d4:2 bb3:2 d4:2', 2), 'f4:2 a4:2 c5:2 a4:2 f4:2 a4:2', 'bb3:2 d4:2 f4:2 d4:2 bb3:2 d4:2',
      rep('eb4:2 g4:2 bb4:2 g4:2 eb4:2 g4:2', 2), 'bb3:2 d4:2 f4:2 d4:2 bb3:2 d4:2', 'eb4:2 g4:2 bb4:2 g4:2 eb4:2 g4:2',
      'c4:2 eb4:2 g4:2 eb4:2 c4:2 eb4:2', 'f4:2 a4:2 c5:2 a4:2 f4:2 a4:2', 'f4:2 a4:2 c5:2 a4:2 f4:2 a4:2', 'bb3:2 d4:2 f4:2 d4:2 bb3:2 d4:2'
    ],
    tri: [
      'bb2:4 f2:4 f2:4', 'eb2:4 bb2:4 bb2:4', 'eb2:4 bb2:4 bb2:4', 'f2:4 c3:4 c3:4',
      'bb2:4 f2:4 f2:4', 'f2:4 c3:4 c3:4', 'f2:4 c3:4 c3:4', 'bb2:4 f2:4 f2:4',
      'eb2:4 bb2:4 bb2:4', 'bb2:4 f2:4 f2:4', 'eb2:4 bb2:4 bb2:4', 'eb2:4 bb2:4 bb2:4',
      'c3:4 g2:4 g2:4', 'f2:4 c3:4 c3:4', 'f2:4 c3:4 c3:4', 'bb2:4 f2:4 f2:4'
    ],
    noise: [rep(DR_WALTZ, 16)]
  },

  // ---- W7 HAUNTED KINGDOM: gothic organ, D harmonic minor ------------------
  w7: {
    bpm: 96, p1duty: 50, p2duty: 50,
    p1: [
      'd5:4 f5:4 e5:2 d5:2 cs5:4',
      'd5:2 e5:2 f5:4 e5:8',
      'a4:4 d5:4 f5:2 e5:2 d5:4',
      'cs5:2 d5:2 e5:4 a4:8',
      'g5:4 f5:2 e5:2 f5:4 d5:4',
      'e5:4 d5:2 cs5:2 d5:8',
      'bb4:4 a4:2 g4:2 a4:4 f4:4',
      'e4:4 cs5:4 d5:8'
    ],
    p2: [
      'd4:8 f4:8', 'a3:8 g4:8', 'd4:8 f4:8', 'a3:8 e4:8',
      'g4:8 bb3:8', 'a3:8 f4:8', 'g3:8 d4:8', 'a3:8 d4:8'
    ],
    tri: [
      bass8('d2'), bass8('a1'), bass8('d2'), bass8('a1'),
      bass8('g1'), bass8('d2'), bass8('g1'), 'a1:8 d2:8'
    ],
    noise: [rep('k:8 s:8', 8)]
  },

  // ---- W8 MECHANICAL CITADEL: relentless machine groove, C minor -----------
  w8: {
    bpm: 140, p1duty: 25, p2duty: 125,
    p1: [
      'c5:2 c5:2 eb5:2 c5:2 g5:2 c5:2 f5:2 eb5:2',
      'c5:2 c5:2 eb5:2 c5:2 ab5:2 g5:2 f5:2 eb5:2',
      'bb4:2 bb4:2 d5:2 bb4:2 f5:2 bb4:2 eb5:2 d5:2',
      'g4:2 b4:2 d5:2 f5:2 g5:4 r:4',
      'c5:2 c5:2 eb5:2 c5:2 g5:2 c5:2 ab5:2 g5:2',
      'f5:2 eb5:2 d5:2 c5:2 b4:2 d5:2 f5:2 ab5:2',
      'g5:4 eb5:2 c5:2 g4:2 c5:2 eb5:2 g5:2',
      'c5:2 g4:2 c5:4 c5:8'
    ],
    p2: [
      bass8('c4'), bass8('c4'), bass8('bb3'), bass8('b3'),
      bass8('c4'), bass8('f3'), bass8('g3'), bass8('c4')
    ],
    tri: [
      'c2:2 c2:2 c3:2 c2:2 c2:2 c3:2 c2:2 c2:2',
      'c2:2 c2:2 c3:2 c2:2 c2:2 c3:2 c2:2 c2:2',
      'bb1:2 bb1:2 bb2:2 bb1:2 bb1:2 bb2:2 bb1:2 bb1:2',
      'g1:2 g1:2 g2:2 g1:2 g1:2 g2:2 g1:2 g1:2',
      'c2:2 c2:2 c3:2 c2:2 c2:2 c3:2 c2:2 c2:2',
      'f1:2 f1:2 f2:2 f1:2 f1:2 f2:2 f1:2 f1:2',
      'g1:2 g1:2 g2:2 g1:2 g1:2 g2:2 g1:2 g1:2',
      'c2:2 c2:2 c3:2 c2:2 c2:4 c2:4'
    ],
    noise: [rep(DR_DRIVE, 8)]
  },

  // ---- W9 DRAGON REALM: grim resolve, E minor ------------------------------
  w9: {
    bpm: 126, p1duty: 50, p2duty: 25,
    p1: [
      'e5:4 g5:2 fs5:2 e5:2 b4:2 e5:4',
      'c5:4 e5:2 d5:2 c5:2 g4:2 c5:4',
      'd5:4 fs5:2 e5:2 d5:2 a4:2 d5:4',
      'b4:2 c5:2 b4:2 a4:2 b4:8',
      'e5:4 g5:2 a5:2 b5:4 g5:4',
      'c6:4 b5:2 a5:2 g5:2 fs5:2 e5:4',
      'a5:4 g5:2 fs5:2 g5:2 e5:2 d5:4',
      'fs5:2 e5:2 ds5:2 fs5:2 e5:8'
    ],
    p2: [
      arp8('e3', 'g3', 'b3'), arp8('c3', 'e3', 'g3'),
      arp8('d3', 'fs3', 'a3'), arp8('b2', 'ds3', 'fs3'),
      arp8('e3', 'g3', 'b3'), arp8('c3', 'e3', 'g3'),
      arp8('a2', 'c3', 'e3'), arp8('e3', 'g3', 'b3')
    ],
    tri: [
      bass4('e2', 'b2'), bass4('c2', 'g2'),
      bass4('d2', 'a2'), bass4('b1', 'fs2'),
      bass4('e2', 'b2'), bass4('c2', 'g2'),
      bass4('a1', 'e2'), 'b1:8 e2:8'
    ],
    noise: [rep(DR_HEAVY, 8)]
  },

  // ---- BOSS: frantic chase -------------------------------------------------
  boss: {
    bpm: 150, p1duty: 25, p2duty: 25,
    p1: [
      'a4:2 a4:2 c5:2 a4:2 e5:2 a4:2 f5:2 e5:2',
      'a4:2 a4:2 c5:2 a4:2 g5:2 f5:2 e5:2 c5:2',
      'g4:2 g4:2 bb4:2 g4:2 d5:2 g4:2 eb5:2 d5:2',
      'e4:2 gs4:2 b4:2 d5:2 e5:4 r:4',
      'a4:2 a4:2 c5:2 a4:2 e5:2 a4:2 f5:2 e5:2',
      'f5:2 e5:2 d5:2 c5:2 b4:2 d5:2 f5:2 gs4:2',
      'a4:2 e5:2 a5:4 gs5:2 e5:2 f5:2 d5:2',
      'e5:2 b4:2 e5:4 a4:8'
    ],
    p2: [
      bass8('a3'), bass8('a3'), bass8('g3'), bass8('e3'),
      bass8('a3'), bass8('d3'), bass8('e3'), bass8('a3')
    ],
    tri: [
      'a1:2 a1:2 a2:2 a1:2 a1:2 a2:2 a1:2 a1:2',
      'a1:2 a1:2 a2:2 a1:2 a1:2 a2:2 a1:2 a1:2',
      'g1:2 g1:2 g2:2 g1:2 g1:2 g2:2 g1:2 g1:2',
      'e1:2 e1:2 e2:2 e1:2 e1:2 e2:2 e1:2 e1:2',
      'a1:2 a1:2 a2:2 a1:2 a1:2 a2:2 a1:2 a1:2',
      'd2:2 d2:2 d3:2 d2:2 d2:2 d3:2 d2:2 d2:2',
      'e2:2 e2:2 e3:2 e2:2 e2:2 e3:2 e2:2 e2:2',
      'a1:2 a1:2 a2:2 a1:2 a1:4 a1:4'
    ],
    noise: [rep('k:2 s:2 k:2 s:2 k:2 s:2 k:2 s:2', 8)]
  },

  // ---- FINAL BOSS: Ivan's fury --------------------------------------------
  final: {
    bpm: 156, p1duty: 50, p2duty: 25,
    p1: [
      'e5:2 e5:2 f5:2 e5:2 b5:2 e5:2 c6:2 b5:2',
      'e5:2 e5:2 f5:2 e5:2 d6:2 c6:2 b5:2 g5:2',
      'a5:2 a5:2 b5:2 a5:2 e6:2 a5:2 f6:2 e6:2',
      'ds5:2 fs5:2 a5:2 c6:2 b5:4 r:4',
      'e5:2 g5:2 b5:2 e6:2 ds6:2 b5:2 g5:2 e5:2',
      'f5:2 a5:2 c6:2 f6:2 e6:2 c6:2 a5:2 f5:2',
      'g5:2 b5:2 e6:2 g6:4 fs6:2 ds6:2 b5:2',
      'e6:4 b5:2 g5:2 e5:8'
    ],
    p2: [
      bass8('e3'), bass8('e3'), bass8('a3'), bass8('b3'),
      bass8('e3'), bass8('f3'), bass8('b3'), bass8('e3')
    ],
    tri: [
      'e2:2 e2:2 e3:2 e2:2 e2:2 e3:2 e2:2 e2:2',
      'e2:2 e2:2 e3:2 e2:2 e2:2 e3:2 e2:2 e2:2',
      'a1:2 a1:2 a2:2 a1:2 a1:2 a2:2 a1:2 a1:2',
      'b1:2 b1:2 b2:2 b1:2 b1:2 b2:2 b1:2 b1:2',
      'e2:2 e2:2 e3:2 e2:2 e2:2 e3:2 e2:2 e2:2',
      'f1:2 f1:2 f2:2 f1:2 f1:2 f2:2 f1:2 f1:2',
      'b1:2 b1:2 b2:2 b1:2 b1:2 b2:2 b1:2 b1:2',
      'e2:2 e2:2 e3:2 e2:2 e2:4 e2:4'
    ],
    noise: [rep('k:2 s:2 s:2 k:2 k:2 s:2 k:2 s:2', 8)]
  },

  // ---- ENDING: warm lullaby, C major ---------------------------------------
  ending: {
    bpm: 78, p1duty: 50, p2duty: 25,
    p1: [
      'e5:4 d5:2 c5:2 d5:4 g4:4',
      'a4:2 c5:2 e5:4 d5:8',
      'e5:4 d5:2 c5:2 d5:4 e5:4',
      'g5:4 e5:4 c5:8',
      'a5:4 g5:2 e5:2 f5:4 d5:4',
      'e5:2 f5:2 g5:4 e5:8',
      'f5:4 e5:2 d5:2 e5:2 c5:2 d5:2 b4:2',
      'c5:16'
    ],
    p2: [
      arp8('c4', 'e4', 'g4'), arp8('f3', 'a3', 'd4'),
      arp8('c4', 'e4', 'g4'), arp8('c4', 'e4', 'g4'),
      arp8('f3', 'a3', 'c4'), arp8('c4', 'e4', 'g4'),
      arp8('d4', 'f4', 'g4'), arp8('c4', 'e4', 'g4')
    ],
    tri: [
      bass4('c3', 'g2'), bass4('d3', 'a2'),
      bass4('c3', 'g2'), bass4('c3', 'e3'),
      bass4('f2', 'c3'), bass4('c3', 'g2'),
      bass4('g2', 'g2'), 'c3:16'
    ],
    noise: [rep('r:16', 8)]
  }
};

// Which music track a world uses.
export const WORLD_MUSIC = { 1: 'w1', 2: 'w2', 3: 'w3', 4: 'w4', 5: 'w5', 6: 'w6', 7: 'w7', 8: 'w8', 9: 'w9' };
