# Princess Polina — project notes

## Deploying

- The game deploys to GitHub Pages via `.github/workflows/pages.yml` on every
  push to `main`. Live URL: https://shuffman95.github.io/Princess-Polina/
- `actions/deploy-pages` intermittently fails with "Deployment failed, try
  again later." This is transient on GitHub's side — the workflow has a
  built-in retry step; if both attempts fail, just re-run the workflow.
- GitHub runners force Node 24; older action majors emit a Node 20
  deprecation *warning* (not an error). Keep the actions on current majors
  (checkout@v5+) to avoid the noise.
- Pushing changes to `.github/workflows/` on `main` may be silently dropped
  by the git proxy (scope rule); use the GitHub API (MCP push_files) for
  workflow-file changes to main.
- **Always bump `CACHE` in `sw.js`** (polina-vN) with any gameplay change,
  or installed clients keep playing the old version from the service-worker
  cache. Players must fully close and reopen the game to pick up updates.

## Testing

Scratchpad test scripts (Playwright + headless Chromium at
`/opt/pw-browsers/...`) exercise the game via `window.polina`:

- `playtest.mjs` — physics bot must clear all 27 stages using only the
  abilities available in each world (retries once; flaky levels are usually
  moving-platform timing, deterministic failures are real geometry bugs)
- `progression.mjs` — all 9 bosses winnable through vulnerable windows;
  spirit scenes, ability grants, world unlocks, ending
- `smoke.mjs`, `tour.mjs` — boot/menu flow and per-world screenshots

Run any of them with `node <script>` after starting no servers (they spawn
their own static server on a unique port).

## Design ground rules

- Everything must remain original: no third-party sprites, music, names, or
  recognizable level layouts. Design *principles* (momentum-tier jumps,
  near-symmetric arc with apex hover, soft hitbox sizes, cadence-structured
  levels: training wheels → standard challenge → expansions/evolutions →
  punctuation → climax) are applied from genre study, with original content.
- Physics constants live in `js/const.js` (`PHYS`); jump tiers are
  standing/jog/run. Keep floating interactive blocks ≤3 tiles above their
  ground so block-tops stay a standing jump.
