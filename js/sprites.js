// All character/item pixel art, authored as original string-art.
// '.' = transparent; letters index the palette below (per-sprite overrides allowed).
import { makeCanvas } from './util.js';

export const PAL = {
  k: '#181624', // outline
  w: '#fff6ec', // white
  x: '#c8ceda', // light gray
  a: '#8e94a6', // gray
  A: '#555b6e', // dark gray
  s: '#ffcba4', // skin
  S: '#d99a68', // skin shade
  h: '#7a4a22', // hair
  H: '#a86c32', // hair light
  r: '#e04050', // red
  R: '#9c2038', // dark red
  g: '#ffd042', // gold
  G: '#b8901c', // gold shade
  y: '#ffe98a', // pale yellow
  b: '#6a4426', // brown
  B: '#46280f', // dark brown
  t: '#d8b078', // tan
  T: '#a07840', // dark tan
  e: '#3fae4a', // green
  E: '#1f7a30', // dark green
  l: '#8ade6a', // light green
  c: '#7ae0f0', // ice light
  C: '#2a90c0', // ice dark
  u: '#3a60d0', // blue
  U: '#22357a', // dark blue
  p: '#9a4ad0', // purple
  P: '#5c2a80', // dark purple
  m: '#ff7ab0', // pink
  M: '#c04070', // dark pink
  o: '#ff8830', // orange
  O: '#c05510', // dark orange
  f: '#ff5020', // fire
  n: '#2a2a3e', // navy dark
  v: '#4a4a66'  // slate
};

// ---------------------------------------------------------------------------
// Princess Polina — 12x16 frames
// ---------------------------------------------------------------------------
const P_HEAD = [
  '...g.gg.g...',
  '...gggggg...',
  '..hhhhhhhh..',
  '.hhhhhhhhhh.',
  '.hhssssssh..',
  '.hhsksskshh.',
  '..hssssssh..',
  '...sSssSs...'
];
const F = (...body) => [...P_HEAD, ...body];

export const SPRITES = {
  polina_idle: F(
    '...rrrrrr...',
    '..wrrrrrrw..',
    '..srrrrrrs..',
    '..rrrrrrrr..',
    '.rrrrrrrrrr.',
    '.gRrRrrRrRg.',
    '...bb..bb...',
    '...BB..BB...'
  ),
  polina_walk1: F(
    '...rrrrrr...',
    '..wrrrrrrw..',
    '..srrrrrrs..',
    '..rrrrrrrr..',
    '.rrrrrrrrrr.',
    '.gRrRrrRrRg.',
    '..bb....bb..',
    '.BB......BB.'
  ),
  polina_walk2: F(
    '...rrrrrr...',
    '..wrrrrrrw..',
    '..srrrrrrs..',
    '..rrrrrrrr..',
    '..rrrrrrrr..',
    '.gRrRrrRrRg.',
    '....bbbb....',
    '....B..B....'
  ),
  polina_walk3: F(
    '...rrrrrr...',
    '..wrrrrrrw..',
    '..srrrrrrs..',
    '..rrrrrrrr..',
    '.rrrrrrrrrr.',
    '.gRrRrrRrRg.',
    '...bb.bb....',
    '...BB..BB...'
  ),
  polina_jump: [
    '...g.gg.g...',
    '...gggggg...',
    '..hhhhhhhh..',
    '.hhhhhhhhhh.',
    '.hhssssssh..',
    '.hhsksskshh.',
    '..hssssssh..',
    '...sSssSs...',
    '.s.rrrrrr.s.',
    '.wsrrrrrrsw.',
    '..rrrrrrrr..',
    '.rrrrrrrrrr.',
    '.gRrRrrRrRg.',
    '...bb..bb...',
    '...BB..BB...',
    '............'
  ],
  polina_fall: [
    '...g.gg.g...',
    '...gggggg...',
    '..hhhhhhhh..',
    '.hhhhhhhhhh.',
    '.hhssssssh..',
    '.hhsksskshh.',
    '..hssssssh..',
    '...sSssSs...',
    '..w.rrrr.w..',
    '..s.rrrr.s..',
    '..rrrrrrrr..',
    '.rrrrrrrrrr.',
    'grRrRrrRrRrg',
    '..bb....bb..',
    '..BB....BB..',
    '............'
  ],
  polina_skid: F(
    '...rrrrrr...',
    '..wrrrrrrw..',
    '..srrrrrrs..',
    '..rrrrrrrr..',
    'rrrrrrrrrr..',
    'gRrRrrRrRg..',
    '..bb...bb...',
    '..BB..BB....'
  ),
  polina_crouch: [
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
    '...g.gg.g...',
    '...gggggg...',
    '..hhhhhhhh..',
    '.hhhhhhhhhh.',
    '.hhssssssh..',
    '.hhsksskshh.',
    '..rrrrrrrr..',
    '.rrrrrrrrrr.',
    '.gRrRrrRrRg.',
    '..BB....BB..'
  ],
  polina_roll1: [
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
    '...rrrrrr...',
    '..rrhhhhrr..',
    '.rrhhsshhrr.',
    '.rrhskskhrr.',
    '.rrssssssrr.',
    '.gRrrrrrRg..',
    '..RrrrrrR...',
    '...bbbb.....',
    '............',
    '............'
  ],
  polina_roll2: [
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
    '...RrrrrR...',
    '..rrrrrrrr..',
    '.rrbb..bbrr.',
    '.rrbb..bbrr.',
    '.rrrrrrrrrr.',
    '.grhhhhhhrg.',
    '..rhsshshr..',
    '...hssssh...',
    '............',
    '............'
  ],
  polina_climb1: F(
    '..s.rrrr....',
    '..wrrrrrr...',
    '...rrrrrrw..',
    '..rrrrrrrs..',
    '.rrrrrrrrr..',
    '.gRrRrrRrg..',
    '...bb.......',
    '.....B.BB...'
  ),
  polina_swim1: F(
    '...rrrrrr.s.',
    '..wrrrrrrsw.',
    '..rrrrrrrr..',
    '.rrrrrrrrrr.',
    '.gRrRrrRrRg.',
    '...bb.bb....',
    '..BB...BB...',
    '............'
  ),
  polina_swim2: F(
    '.s.rrrrrr...',
    '.wsrrrrrrw..',
    '..rrrrrrrr..',
    '.rrrrrrrrr..',
    '.gRrRrrRrg..',
    '....bbbb....',
    '...BB..BB...',
    '............'
  ),
  polina_pound: [
    '...g.gg.g...',
    '...gggggg...',
    '..hhhhhhhh..',
    '.hhhhhhhhhh.',
    '.hhssssssh..',
    '.hhsksskshh.',
    '..hssssssh..',
    '...sSssSs...',
    '.wsrrrrrrsw.',
    '..rrrrrrrr..',
    '.rrrrrrrrrr.',
    'grRrRrrRrRrg',
    '.bb......bb.',
    '.BB......BB.',
    '............',
    '............'
  ],
  polina_dash: F(
    '..rrrrrrr...',
    '.wrrrrrrrs..',
    '.srrrrrrrr..',
    '.rrrrrrrrrr.',
    'gRrRrrRrRrg.',
    '..bb....bb..',
    '.BB......BB.',
    '............'
  ),
  polina_glide: [
    '...g.gg.g...',
    '...gggggg...',
    '..hhhhhhhh..',
    '.hhhhhhhhhh.',
    '.hhssssssh..',
    '.hhsksskshh.',
    'w.hssssssh.w',
    'wwwsSssSswww',
    'wwwrrrrrrwww',
    '.wwrrrrrrww.',
    '..rrrrrrrr..',
    '.rrrrrrrrrr.',
    '.gRrRrrRrRg.',
    '...bb..bb...',
    '...BB..BB...',
    '............'
  ],
  polina_hurt: F(
    '..rrrrrr....',
    '.wrrrrrrw...',
    '.srrrrrrs...',
    '.rrrrrrrr...',
    'rrrrrrrrrr..',
    'gRrRrrRrRg..',
    '..bb..bb....',
    '.BB....BB...'
  ),
  polina_victory: [
    '.s..........',
    '.w.g.gg.g.s.',
    '...ggggggsw.',
    '..hhhhhhhh..',
    '.hhhhhhhhhh.',
    '.hhssssssh..',
    '.hhsksskshh.',
    '..hssssssh..',
    '...sSssSs...',
    '...rrrrrr...',
    '..rrrrrrrr..',
    '..rrrrrrrr..',
    '.rrrrrrrrrr.',
    '.gRrRrrRrRg.',
    '...bb..bb...',
    '...BB..BB...'
  ],

  // -------------------------------------------------------------------------
  // Enemies (original designs; several get palette-swap variants in enemies.js)
  // -------------------------------------------------------------------------
  // Burrik — round tumbling critter
  burrik1: [
    '....kkkk....',
    '..kkeeeekk..',
    '.keeleeleek.',
    '.keekeekeek.',
    'keeeeeeeeeek',
    'keelleelleek',
    '.keeeeeeeek.',
    '..kkeeeekk..',
    '...kB..Bk...',
    '...BB..BB...'
  ],
  burrik2: [
    '....kkkk....',
    '..kkeeeekk..',
    '.keeleeleek.',
    '.keekeekeek.',
    'keeeeeeeeeek',
    'keelleelleek',
    '.keeeeeeeek.',
    '..kkeeeekk..',
    '..kB....Bk..',
    '..BB....BB..'
  ],
  // Springpaw — long-eared hopper
  springpaw1: [
    '.k.......k..',
    'kmk.....kmk.',
    'kmmk...kmmk.',
    '.kmmk.kmmk..',
    '..kmmmmmk...',
    '.kmkmmmkmk..',
    '.kmmmmmmmk..',
    'kmmwmmmwmmk.',
    'kmmmmmmmmmk.',
    '.kmmkkkmmk..',
    '..kBk.kBk...'
  ],
  springpaw2: [
    '.k..k.......',
    'kmkkmk......',
    'kmmkmmk.....',
    '.kmmmmk.....',
    '..kmmmmmk...',
    '.kmkmmmkmk..',
    '.kmmmmmmmk..',
    'kmmwmmmwmmk.',
    '.kmmmmmmmk..',
    '..kmmkmmk...',
    '...kBkBk....'
  ],
  // Buzzwing — dragonfly
  buzzwing1: [
    '..xx....xx..',
    '.xxxx..xxxx.',
    '..xxxxxxxx..',
    '...kppppk...',
    '..kpkppkpk..',
    '..kpppppppk.',
    '...kpppk....',
    '....kpk.....',
    '.....k......'
  ],
  buzzwing2: [
    '............',
    '.xx......xx.',
    '..xxxxxxxx..',
    '...kppppk...',
    '..kpkppkpk..',
    '..kpppppppk.',
    '...kpppk....',
    '....kpk.....',
    '.....k......'
  ],
  // Thornshell — armored spiky beetle
  thornshell1: [
    '..k..k..k...',
    '.kEkkEkkEk..',
    '.kEEEEEEEk..',
    'kEeEeEeEeEk.',
    'kEEEEEEEEEk.',
    'keeeeeeeeek.',
    'kekeekeekek.',
    '.kkkkkkkkk..',
    '..kB...Bk...'
  ],
  thornshell2: [
    '..k..k..k...',
    '.kEkkEkkEk..',
    '.kEEEEEEEk..',
    'kEeEeEeEeEk.',
    'kEEEEEEEEEk.',
    'keeeeeeeeek.',
    'kekeekeekek.',
    '.kkkkkkkkk..',
    '...kB..Bk...'
  ],
  // Vinesnap — lunging plant
  vinesnap1: [
    '..kkkkkk....',
    '.krrrrrrk...',
    'krrwrrwrrk..',
    'krrrrrrrrk..',
    '.kwkwkwkw...',
    '.krrrrrrk...',
    '..kEEEEk....',
    '...kEEk.....',
    '..kEEEEk....',
    '...kEEk.....'
  ],
  vinesnap2: [
    '..kkkkkk....',
    '.krrrrrrk...',
    'krwrrwrrrk..',
    'kwkwkwkwrk..',
    'krrrrrrrrk..',
    '.krrrrrrk...',
    '..kEEEEk....',
    '...kEEk.....',
    '..kEEEEk....',
    '...kEEk.....'
  ],
  // Owlet — swooping owl
  owlet1: [
    '..kk...kk...',
    '.khhk.khhk..',
    '.khhhkhhhk..',
    'khwkwhwkwhk.',
    'khhhhhhhhhk.',
    'khhkooKhhk..'.replace('K', 'k'),
    '.khhhhhhhk..',
    '..khhhhhk...',
    '...ko.ok....'
  ],
  owlet2: [
    '............',
    '..kk...kk...',
    '.khhkkkhhk..',
    'khwkwhwkwhk.',
    'khhhhhhhhhk.',
    'khhkookhhk..',
    'kkhhhhhhhkk.',
    '..khhhhhk...',
    '...ko.ok....'
  ],
  // Glimmerbat — crystal bat
  glimmerbat1: [
    '.k.......k..',
    'kck.....kck.',
    'kcck...kcck.',
    'kccck.kccck.',
    '.kcckckcck..',
    '..kcccccck..',
    '..kckcckck..',
    '...kcccck...',
    '....k..k....'
  ],
  glimmerbat2: [
    '............',
    '............',
    '.kk.....kk..',
    'kcckk.kkcck.',
    '.kcckckcck..',
    '..kcccccck..',
    '..kckcckck..',
    '...kcccck...',
    '....k..k....'
  ],
  // Golem — shielded walking rock
  golem1: [
    '..kkkkkk....',
    '.kaaaaaak...',
    'kaxaaxaaak..',
    'kakaakaaak..',
    'kaaaaaaaaak.',
    'kaxaaaxaaak.',
    'kaaaaaaaaak.',
    '.kaaakaaak..',
    '.kAAk.kAAk..',
    '.kAAk.kAAk..'
  ],
  golem2: [
    '..kkkkkk....',
    '.kaaaaaak...',
    'kaxaaxaaak..',
    'kakaakaaak..',
    'kaaaaaaaaak.',
    'kaxaaaxaaak.',
    'kaaaaaaaaak.',
    '.kaaakaaak..',
    '..kAAkAAk...',
    '..kAAkAAk...'
  ],
  // Drippy — ceiling slime
  drippy1: [
    '.kkkkkkkkk..',
    'kuuuuuuuuuk.',
    'kuukuukuuuk.',
    'kuuuuuuuuuk.',
    '.kuuuuuuuk..',
    '..kuuuuuk...',
    '...kuuuk....',
    '....kuk.....',
    '.....k......'
  ],
  drippy2: [
    '.kkkkkkkkk..',
    'kuuuuuuuuuk.',
    'kuukuukuuuk.',
    '.kuuuuuuuk..',
    '..kuuuuuk...',
    '...kuuuk....',
    '....kuk.....',
    '............',
    '............'
  ],
  // Sandmaw — burrowing worm head
  sandmaw1: [
    '....kkkk....',
    '..kkttttkk..',
    '.kttwttwttk.',
    '.kttkttkttk.',
    'kttttttttttk',
    'ktkwkwkwkwtk'.replace(/K/g, 'k'),
    'kttttttttttk',
    '.kttttttttk.',
    '..kkttttkk..',
    '....kkkk....'
  ],
  sandmaw2: [
    '....kkkk....',
    '..kkttttkk..',
    '.kttkttkttk.',
    '.kttttttttk.',
    'ktwkwkwkwktk',
    'kttttttttttk',
    'ktkwkwkwkwtk',
    '.kttttttttk.',
    '..kkttttkk..',
    '....kkkk....'
  ],
  // Cactling — spiky pacer (no stomp)
  cactling1: [
    '..k.kk.k....',
    '.kekeekek...',
    'k.keeeek.k..',
    '.keeleelek..',
    'k.keekeekk..',
    '.keeeeeeek..',
    'k.keeeeek.k.',
    '.kkeeeeekk..',
    '..kB...Bk...'
  ],
  cactling2: [
    '..k.kk.k....',
    '.kekeekek...',
    'k.keeeek.k..',
    '.keeleelek..',
    'k.keekeekk..',
    '.keeeeeeek..',
    'k.keeeeek.k.',
    '.kkeeeeekk..',
    '...kB.Bk....'
  ],
  // Frostpuff — floating ice spirit
  frostpuff1: [
    '...kkkkk....',
    '..kcccccck..',
    '.kccwccwcck.',
    'kccckcckccck'.slice(0, 12),
    'kcccccccccck'.slice(0, 12),
    '.kccCccCck..',
    '..kcccccck..',
    '...kck.kck..',
    '....k...k...'
  ],
  frostpuff2: [
    '....kkkkk...',
    '..kcccccck..',
    '.kccwccwcck.',
    'kccckcckccck'.slice(0, 12),
    'kcccccccccck'.slice(0, 12),
    '.kccCccCck..',
    '..kcccccck..',
    '..kck.kck...',
    '...k...k....'
  ],
  // Icehorn — charging ram
  icehorn1: [
    '.kk.....kk..',
    'kcck...kcck.',
    '.kcckkkcck..',
    '..kwwwwwk...',
    '.kwwkwkwwk..',
    'kwwwwwwwwwk.',
    'kwwwwwwwwwk.',
    '.kwwwwwwwk..',
    '..kAk.kAk...',
    '..kAk.kAk...'
  ],
  icehorn2: [
    '.kk.....kk..',
    'kcck...kcck.',
    '.kcckkkcck..',
    '..kwwwwwk...',
    '.kwwkwkwwk..',
    'kwwwwwwwwwk.',
    'kwwwwwwwwwk.',
    '.kwwwwwwwk..',
    '.kAk...kAk..',
    '.kAk...kAk..'
  ],
  // Cloudkin — cloud sprite that drops bolts
  cloudkin1: [
    '...kkkkkk...',
    '..kwwwwwwk..',
    '.kwwkwwkwwk.',
    'kwwwwwwwwwwk',
    'kwxwwwwwwxwk',
    '.kwwwMMwwwk.',
    '..kwwwwwwk..',
    '...kkkkkk...'
  ],
  cloudkin2: [
    '...kkkkkk...',
    '..kwwwwwwk..',
    '.kwwkwwkwwk.',
    'kwwwwwwwwwwk',
    'kwxwwwwwwxwk',
    '.kwwwwwwwwk.',
    '..kwwwwwwk..',
    '...kkkkkk...'
  ],
  // Galewing — gust bird
  galewing1: [
    'kk......kk..',
    'kuuk..kuuk..',
    '.kuuukuuuk..',
    '..kuuuuuk...',
    '.kuwkuuuuk..',
    'kuuuuuuuuuk.',
    '.kuuuuuuuk..',
    '..kuuuuuk...',
    '....k.k.....'
  ],
  galewing2: [
    '............',
    '.kk....kk...',
    'kuuk..kuuk..',
    '.kuuukuuuk..',
    '.kuwkuuuuk..',
    'kuuuuuuuuuk.',
    'kkuuuuuuukk.',
    '..kuuuuuk...',
    '....k.k.....'
  ],
  // Wisp — ghost that chases when unseen
  wisp1: [
    '...kkkkk....',
    '..kxxxxxk...',
    '.kxxkxxkxk..',
    '.kxxxxxxxk..',
    '.kxxAxxAxk..',
    '.kxxxxxxxk..',
    '..kxxxxxxk..',
    '.kx.kxx.xk..',
    '..k..kk..k..'
  ],
  wisp2: [
    '...kkkkk....',
    '..kxxxxxk...',
    '.kxxkxxkxk..',
    '.kxxxxxxxk..',
    '.kxxAxxAxk..',
    '.kxxxxxxxk..',
    '..kxxxxxxk..',
    '..kx.xx.xk..',
    '...k.kk.k...'
  ],
  // Rattlebones — bone thrower
  rattle1: [
    '...kkkkk....',
    '..kwwwwwk...',
    '..kwkwkwk...',
    '..kwwwwwk...',
    '...kkwkk....',
    '..kwwwwwk...',
    '.kw.kwk.wk..',
    '..k.kwk.k...',
    '...kwkwk....',
    '...kw.wk....',
    '..kww.wwk...'
  ],
  rattle2: [
    '...kkkkk....',
    '..kwwwwwk...',
    '..kwkwkwk...',
    '..kwwwwwk...',
    'k..kkwkk....',
    'kwkwwwwwk...',
    '.kw.kwk.wk..',
    '....kwk.....',
    '...kwkwk....',
    '...kw.wk....',
    '..kww.wwk...'
  ],
  // Shade — teleporter
  shade1: [
    '....kkkk....',
    '..kkppppkk..',
    '.kpppppppk..',
    '.kpkppkppk..',
    '.kpppppppk..',
    '.kpPppPppk..',
    '..kpppppk...',
    '.kp.ppp.pk..',
    '..k.kpk.k...',
    '.....k......'
  ],
  shade2: [
    '....kkkk....',
    '..kkppppkk..',
    '.kpppppppk..',
    '.kpkppkppk..',
    '.kpppppppk..',
    '.kpPppPppk..',
    '..kpppppk...',
    '..p.ppp.p...',
    '....kpk.....',
    '............'
  ],
  // Coggun — gear turret
  coggun1: [
    '..k..kk..k..',
    '.kAkkAAkkAk.',
    '.kAAAAAAAAk.',
    'kAaxaAAaxaAk'.slice(0, 12),
    '.kAAAkkAAAk.',
    'kAAAkooKAAk'.replace('K', 'k'),
    '.kAAAkkAAAk.',
    '.kAAAAAAAAk.',
    '.kkAAkkAAkk.',
    '..kkkkkkkk..'
  ],
  coggun2: [
    '..kk.kk.kk..',
    '.kAAkAAkAAk.',
    '.kAAAAAAAAk.',
    'kAaxaAAaxaAk'.slice(0, 12),
    '.kAAAkkAAAk.',
    'kAAAkooKAAk'.replace('K', 'k'),
    '.kAAAkkAAAk.',
    '.kAAAAAAAAk.',
    '.kkAAkkAAkk.',
    '..kkkkkkkk..'
  ],
  // Steamroller — charging machine
  steam1: [
    '..kkkkkkkk..',
    '.kvvvvvvvvk.',
    'kvxvvkkvvxvk',
    'kvvvkooKvvk'.replace('K', 'k'),
    'kvvvvkkvvvvk',
    '.kvvvvvvvvk.',
    'kkakakakakk.',
    'kaAkAaKaAak'.replace('K', 'k'),
    '.kkakakakk..'
  ],
  steam2: [
    '..kkkkkkkk..',
    '.kvvvvvvvvk.',
    'kvxvvkkvvxvk',
    'kvvvkooKvvk'.replace('K', 'k'),
    'kvvvvkkvvvvk',
    '.kvvvvvvvvk.',
    'kkkakakakak.',
    'kAakaAkAaak.',
    '.kkakakakk..'
  ],
  // Dragonewt — sword lizard
  dnewt1: [
    '...kkkk.....',
    '..keeeek..k.',
    '.keekeeek.k.',
    '.keeeeeek.k.',
    '..keeeekkxk.',
    '...keeekxk..',
    '..keeeeek...',
    '.keekeeeek..',
    '.keeeeeeek..',
    '..kek..kek..',
    '..kEk..kEk..'
  ],
  dnewt2: [
    '...kkkk.....',
    '..keeeek....',
    '.keekeeek...',
    '.keeeeeekkk.',
    '..keeeekxxxk',
    '...keeekkk..',
    '..keeeeek...',
    '.keekeeeek..',
    '.keeeeeeek..',
    '.kek....kek.',
    '.kEk....kEk.'
  ],
  // Emberling — fire spirit
  ember1: [
    '.....k......',
    '....kfk.....',
    '...kffok....',
    '..kfoofok...',
    '.kfookoofk..',
    '.kfokoofok..'.replace('K', 'k'),
    '.kfoogoofk..',
    '..kfogofk...',
    '...kfffk....',
    '....kkk.....'
  ],
  ember2: [
    '....k.......',
    '...kfk.k....',
    '...kffkfk...',
    '..kfoofok...',
    '.kfookoofk..',
    '.kfokoofok..',
    '.kfoogoofk..',
    '..kfogofk...',
    '...kfffk....',
    '....kkk.....'
  ],
  // Magmaworm — lava leaper
  magma1: [
    '....kkkk....',
    '..kkfoofkk..',
    '.kfowfwoofk.'.slice(0, 12),
    '.kfokfkofok.'.slice(0, 12),
    'kfoooooooofk',
    'kfkokokokofk'.slice(0, 12),
    'kfoooooooofk',
    '.kfoooooofk.',
    '..kkfoofkk..',
    '....kkkk....'
  ],
  magma2: [
    '....kkkk....',
    '..kkfoofkk..',
    '.kfokfkofok.'.slice(0, 12),
    '.kfowfwoofk.'.slice(0, 12),
    'kfoooooooofk',
    'kfkokokokofk'.slice(0, 12),
    'kfoooooooofk',
    '.kfoooooofk.',
    '..kkfoofkk..',
    '....kkkk....'
  ],

  // -------------------------------------------------------------------------
  // Items and objects
  // -------------------------------------------------------------------------
  petal1: [ // cherry petal — the game's coin
    '..kk..',
    '.kmmk.',
    'kmwmmk',
    'kmmmmk',
    '.kmmk.',
    '..kk..'
  ],
  petal2: [
    '..k...',
    '.kmk..',
    'kmwmk.',
    'kmmmk.',
    '.kmk..',
    '..k...'
  ],
  petal3: [
    '..k...',
    '..kk..',
    '.kmk..',
    '.kmk..',
    '..kk..',
    '..k...'
  ],
  gem: [
    '...kkkk...',
    '..kccwck..',
    '.kccwccck.',
    'kcwcccccck',
    'kccccccCck',
    '.kccccCck.',
    '..kccCck..',
    '...kcck...',
    '....kk....'
  ],
  heart: [
    '.kk..kk.',
    'krrkkrrk',
    'krwrrrrk',
    'krrrrrrk',
    '.krrrrk.',
    '..krrk..',
    '...kk...'
  ],
  matryoshka: [ // 1-up: little nesting doll
    '...kkkk...',
    '..krrrrk..',
    '.krsssssk.'.slice(0, 10),
    '.krskskrk.',
    '.krssssrk.',
    '..krrrrk..',
    '.krgggggk.'.slice(0, 10),
    'krgwgwggrk',
    'krggggggrk',
    '.krrrrrrk.',
    '..kkkkkk..'
  ],
  checkpoint_off: [
    '.kk.......',
    'kggk......',
    'kggkaaaa..',
    'kggkaAAa..',
    'kggkaaaa..',
    'kggk......',
    'kggk......',
    'kggk......',
    'kggk......',
    'kggk......',
    'kBBk......',
    'kBBk......'
  ],
  checkpoint_on: [
    '.kk.......',
    'kggk......',
    'kggkrrrr..',
    'kggkrwwr..',
    'kggkrrrr..',
    'kggk......',
    'kggk......',
    'kggk......',
    'kggk......',
    'kggk......',
    'kBBk......',
    'kBBk......'
  ],
  spring1: [
    'kkkkkkkk',
    'kxxxxxxk',
    '.kAAAAk.',
    '.kAAAAk.',
    'kkkkkkkk'
  ],
  spring2: [
    'kkkkkkkk',
    'kxxxxxxk',
    'kkkkkkkk',
    '........',
    '........'
  ],
  // Projectiles
  proj_fire1: [
    '..kk..',
    '.kfok.',
    'kfogok',
    'kogofk',
    '.kofk.',
    '..kk..'
  ],
  proj_fire2: [
    '..kk..',
    '.kofk.',
    'kogofk',
    'kfogok',
    '.kfok.',
    '..kk..'
  ],
  proj_ice: [
    '..kk..',
    '.kcwk.',
    'kcwcck',
    'kccwck',
    '.kcck.',
    '..kk..'
  ],
  proj_bone: [
    'kk..kk',
    'kwkkwk',
    '.kwwk.',
    '.kwwk.',
    'kwkkwk',
    'kk..kk'
  ],
  proj_bolt: [
    '...kk.',
    '..kyk.',
    '.kyyk.',
    'kkykk.',
    '.kyk..',
    '.kk...'
  ],
  proj_snow: [
    '.kkk.',
    'kwwwk',
    'kwxwk',
    'kwwwk',
    '.kkk.'
  ],
  proj_gear: [
    'k.kk.k',
    '.kaak.',
    'kaakaa'.replace(/1/g, ''),
    'kaakaa'.slice(0, 6),
    '.kaak.',
    'k.kk.k'
  ],
  proj_seed: [
    '.kk.',
    'keek',
    'keek',
    '.kk.'
  ],
  // Power-up pickups (crown-sized icons on a small pedestal glow)
  pw_fire: [
    '.k.k.k.k..',
    'kfkfkfkfk.',
    'kfffffffk.',
    'kfofofofk.',
    'kfffffffk.',
    '.kkkkkkk..'
  ],
  pw_ice: [
    '....k.....',
    '...kck....',
    '.k.kck.k..',
    'kckcwckck.',
    'kcccccccK.'.replace('K', 'k'),
    '.kkkkkkk..'
  ],
  pw_wind: [
    '.kkkk.....',
    'kxxxxkk...',
    'kxwxxxxk..',
    '.kxxxxxxk.',
    '..kxxxxk..',
    '...kkkk...'
  ],
  pw_bear: [
    '.kk...kk..',
    'kbbk.kbbk.',
    'kbbbkbbbk.',
    'kbBbbbBbk.',
    '.kbbbbbk..',
    '..kkkkk...'
  ],
  pw_bolt: [
    '...kkk....',
    '..kyyk....',
    '.kyyk.....',
    'kyyyyk....',
    '..kyyk....',
    '...kk.....'
  ],
  pw_crystal: [
    '...kk.....',
    '..kcck....',
    '.kcwcck...',
    'kcccccck..',
    '.kcCCck...',
    '..kkkk....'
  ],
  pw_shadow: [
    '.kkkkk....',
    'kpPPPpk...',
    'kPpppPk...',
    'kpPpPpk...',
    '.kpppk....',
    '..kkk.....'
  ],
  pw_phoenix: [
    '....kk....',
    '...kok....',
    '..kofk....',
    '.kofok....',
    'kofofk....',
    '.kkkk.....'
  ],
  // Goal: the Radiant Gate
  gate: [
    '....kkkkkkkk....',
    '..kkggggggggkk..',
    '.kgggyyyyyyggGk.'.replace('G', 'g'),
    '.kggyywwwwyygGk.'.replace('G', 'g'),
    'kggyywwwwwwyygk.',
    'kggywwwwwwwwygk.',
    'kggywwwwwwwwygk.',
    'kggywwwwwwwwygk.',
    'kggywwwwwwwwygk.',
    'kggywwwwwwwwygk.',
    'kggywwwwwwwwygk.',
    'kggywwwwwwwwygk.',
    'kggywwwwwwwwygk.',
    'kggywwwwwwwwygk.',
    'kBBkkkkkkkkkkBk.',
    'kBBBBBBBBBBBBBk.'
  ],
  key: [
    '.kkk......',
    'kgggk.....',
    'kg.gkkkkk.',
    'kgggkgkgk.',
    '.kkk..k.k.'
  ]
};

// ---------------------------------------------------------------------------
// Sprite builder with cache, palette overrides, and horizontal flip
// ---------------------------------------------------------------------------
const cache = new Map();

export function buildSprite(rows, pal = {}) {
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  const c = makeCanvas(w, h);
  const x = c.getContext('2d');
  for (let ry = 0; ry < h; ry++) {
    const row = rows[ry];
    for (let rx = 0; rx < row.length; rx++) {
      const ch = row[rx];
      if (ch === '.' || ch === ' ') continue;
      const col = pal[ch] || PAL[ch];
      if (!col) continue;
      x.fillStyle = col;
      x.fillRect(rx, ry, 1, 1);
    }
  }
  return c;
}

// getSprite('burrik1', { flip: true, pal: { e: '#c05510' }, palId: 'desert' })
// palId must uniquely identify the palette override for caching.
export function getSprite(name, { flip = false, pal = null, palId = '' } = {}) {
  const key = `${name}|${flip ? 1 : 0}|${palId}`;
  let c = cache.get(key);
  if (c) return c;
  const rows = SPRITES[name];
  if (!rows) return null;
  let base = buildSprite(rows, pal || {});
  if (flip) {
    const f = makeCanvas(base.width, base.height);
    const x = f.getContext('2d');
    x.translate(base.width, 0);
    x.scale(-1, 1);
    x.drawImage(base, 0, 0);
    base = f;
  }
  cache.set(key, base);
  return base;
}

// Tinted (white-flash / frozen) variants of any sprite, cached.
export function getTinted(name, opts, tint, alpha = 0.75) {
  const key = `T|${name}|${opts.flip ? 1 : 0}|${opts.palId || ''}|${tint}`;
  let c = cache.get(key);
  if (c) return c;
  const base = getSprite(name, opts);
  if (!base) return null;
  c = makeCanvas(base.width, base.height);
  const x = c.getContext('2d');
  x.drawImage(base, 0, 0);
  x.globalCompositeOperation = 'source-atop';
  x.globalAlpha = alpha;
  x.fillStyle = tint;
  x.fillRect(0, 0, c.width, c.height);
  cache.set(key, c);
  return c;
}
