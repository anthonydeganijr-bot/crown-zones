import { writeFileSync } from "fs";

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function generateSolution(n, rng) {
  const cols = Array.from({ length: n }, (_, i) => i);
  function backtrack(row, used, perm) {
    if (row === n) return perm.slice();
    for (const c of shuffle(cols.filter((c) => !used.has(c)), rng)) {
      if (row > 0 && Math.abs(c - perm[row - 1]) === 1) continue;
      used.add(c); perm.push(c);
      const result = backtrack(row + 1, used, perm);
      if (result) return result;
      perm.pop(); used.delete(c);
    }
    return null;
  }
  return backtrack(0, new Set(), []);
}
function growRegions(n, solution, rng) {
  const regionOf = Array.from({ length: n }, () => new Array(n).fill(-1));
  let queue = [];
  for (let region = 0; region < n; region++) {
    const r = region, c = solution[region];
    regionOf[r][c] = region;
    queue.push({ region, r, c });
  }
  function neighbors(r, c) {
    return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(
      ([rr, cc]) => rr >= 0 && rr < n && cc >= 0 && cc < n && regionOf[rr][cc] === -1
    );
  }
  queue = shuffle(queue, rng);
  let claimed = n;
  while (claimed < n * n) {
    if (queue.length === 0) {
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        if (regionOf[r][c] !== -1) for (const [rr, cc] of neighbors(r, c)) queue.push({ region: regionOf[r][c], r: rr, c: cc });
      }
      queue = shuffle(queue, rng);
      if (queue.length === 0) break;
    }
    const idx = Math.floor(rng() * queue.length);
    const item = queue[idx];
    queue.splice(idx, 1);
    if (regionOf[item.r][item.c] !== -1) continue;
    regionOf[item.r][item.c] = item.region;
    claimed++;
    for (const [rr, cc] of neighbors(item.r, item.c)) queue.push({ region: item.region, r: rr, c: cc });
  }
  return regionOf;
}
function countSolutions(n, regionOf, cap = 2) {
  const regionCells = Array.from({ length: n }, () => []);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) regionCells[regionOf[r][c]].push([r, c]);
  let count = 0;
  const usedRows = new Set(), usedCols = new Set();
  const placed = [];
  function backtrack(region) {
    if (count >= cap) return;
    if (region === n) { count++; return; }
    for (const [r, c] of regionCells[region]) {
      if (usedRows.has(r) || usedCols.has(c)) continue;
      let touches = false;
      for (const [pr, pc] of placed) if (Math.abs(pr - r) === 1 && Math.abs(pc - c) === 1) { touches = true; break; }
      if (touches) continue;
      usedRows.add(r); usedCols.add(c); placed.push([r, c]);
      backtrack(region + 1);
      usedRows.delete(r); usedCols.delete(c); placed.pop();
      if (count >= cap) return;
    }
  }
  backtrack(0);
  return count;
}

function regionOfToString(n, regionOf) {
  // one char per cell (base36 region index), row-major, no separators -- compact for embedding.
  let s = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) s += regionOf[r][c].toString(36);
  return s;
}

function buildPool(n, targetCount, attemptsPerSeed, seedStart) {
  const pool = [];
  let seed = seedStart;
  let seedsTried = 0;
  while (pool.length < targetCount) {
    seed++;
    seedsTried++;
    const rng = mulberry32(seed);
    const solution = generateSolution(n, rng);
    if (!solution) continue;
    for (let attempt = 0; attempt < attemptsPerSeed; attempt++) {
      const regionOf = growRegions(n, solution, rng);
      if (countSolutions(n, regionOf) === 1) {
        pool.push({ n, solution, regions: regionOfToString(n, regionOf) });
        break;
      }
    }
    if (seedsTried > targetCount * 20) break; // safety valve
  }
  return pool;
}

const t0 = Date.now();
const pool6 = buildPool(6, 150, 300, 6_000_000);
console.log(`n=6: ${pool6.length} puzzles, ${Date.now() - t0}ms`);
const t1 = Date.now();
const pool7 = buildPool(7, 150, 1500, 7_000_000);
console.log(`n=7: ${pool7.length} puzzles, ${Date.now() - t1}ms`);
const t2 = Date.now();
const pool8 = buildPool(8, 100, 4000, 8_000_000);
console.log(`n=8: ${pool8.length} puzzles, ${Date.now() - t2}ms`);

const all = [...pool6, ...pool7, ...pool8];
console.log(`\nTotal: ${all.length} puzzles, total time ${Date.now() - t0}ms`);

writeFileSync("puzzle-pool.json", JSON.stringify(all));
console.log("wrote puzzle-pool.json");
