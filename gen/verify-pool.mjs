import { readFileSync } from "fs";

const pool = JSON.parse(readFileSync("puzzle-pool.json", "utf8"));

function decodeRegions(n, s) {
  const grid = [];
  for (let r = 0; r < n; r++) {
    const row = [];
    for (let c = 0; c < n; c++) row.push(parseInt(s[r * n + c], 36));
    grid.push(row);
  }
  return grid;
}

function countSolutions(n, regionOf, cap = 2) {
  const regionCells = Array.from({ length: n }, () => []);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) regionCells[regionOf[r][c]].push([r, c]);
  let count = 0;
  const usedRows = new Set(), usedCols = new Set();
  const placed = [];
  let solved = null;
  function backtrack(region) {
    if (count >= cap) return;
    if (region === n) { count++; solved = placed.map((p) => p[1]).slice(); return; }
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
  return { count, solved };
}

let ok = 0, bad = 0;
const sizeCounts = {};
for (const p of pool) {
  sizeCounts[p.n] = (sizeCounts[p.n] || 0) + 1;
  const problems = [];
  if (p.regions.length !== p.n * p.n) problems.push(`region string length ${p.regions.length} != ${p.n * p.n}`);
  const grid = decodeRegions(p.n, p.regions);
  const seen = new Set(grid.flat());
  if (seen.size !== p.n) problems.push(`expected ${p.n} distinct regions, found ${seen.size}`);
  for (let i = 0; i < p.n; i++) if (!seen.has(i)) problems.push(`missing region index ${i}`);

  const { count, solved } = countSolutions(p.n, grid);
  if (count !== 1) problems.push(`solve count = ${count}, expected 1`);
  else if (JSON.stringify(solved) !== JSON.stringify(p.solution)) {
    problems.push(`solved=${JSON.stringify(solved)} != stored solution=${JSON.stringify(p.solution)}`);
  }

  if (problems.length) { bad++; console.log("BAD:", problems.join("; ")); }
  else ok++;
}
console.log(`\n${ok} OK, ${bad} BAD out of ${pool.length}`);
console.log("size distribution:", sizeCounts);
