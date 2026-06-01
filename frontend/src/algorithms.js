/**
 * Implementação própria em JS dos 4 algoritmos do projeto.
 * Espelha src/graphs/algorithms.py — sem dependências externas.
 * Grafo dirigido ponderado.
 *
 * Entrada esperada: { nodes: [{id, ...}], links: [{source, target, fee, ...}] }
 * (as posições x/y dos nós são ignoradas aqui).
 */

function srcId(l) {
  return typeof l.source === "object" ? l.source.id : l.source;
}
function tgtId(l) {
  return typeof l.target === "object" ? l.target.id : l.target;
}

function buildAdjacency(graph, weightFn = (l) => l.fee) {
  const adj = new Map(); // id -> [{to, weight, link}]
  for (const n of graph.nodes) adj.set(n.id, []);
  for (const l of graph.links) {
    const s = srcId(l);
    const t = tgtId(l);
    if (!adj.has(s)) adj.set(s, []);
    if (!adj.has(t)) adj.set(t, []);
    adj.get(s).push({ to: t, weight: weightFn(l), link: l });
  }
  return adj;
}

// ─────────────────────────────────────────────────────────────
// BFS — caminho mínimo em arestas
// ─────────────────────────────────────────────────────────────
export function bfs(graph, source, target) {
  const t0 = performance.now();
  const adj = buildAdjacency(graph);
  if (!adj.has(source) || (target && !adj.has(target))) {
    return { ok: false, error: "Vértice inexistente" };
  }
  const parent = new Map([[source, null]]);
  const queue = [source];
  let edgesExplored = 0;

  while (queue.length) {
    const u = queue.shift();
    if (target && u === target) break;
    for (const { to } of adj.get(u) || []) {
      edgesExplored++;
      if (!parent.has(to)) {
        parent.set(to, u);
        queue.push(to);
      }
    }
  }

  const elapsed = performance.now() - t0;

  if (target) {
    if (!parent.has(target)) {
      return { ok: false, error: "Destino inalcançável", time_ms: elapsed };
    }
    const path = [];
    let n = target;
    while (n !== null) {
      path.unshift(n);
      n = parent.get(n);
    }
    return {
      ok: true,
      algorithm: "BFS",
      source,
      target,
      hops: path.length - 1,
      path,
      nodes_visited: parent.size,
      edges_explored: edgesExplored,
      time_ms: elapsed,
    };
  }

  return {
    ok: true,
    algorithm: "BFS",
    source,
    reachable: parent.size,
    edges_explored: edgesExplored,
    time_ms: elapsed,
  };
}

// ─────────────────────────────────────────────────────────────
// DFS — iterativo (evita stack overflow)
// ─────────────────────────────────────────────────────────────
export function dfs(graph, source, target) {
  const t0 = performance.now();
  const adj = buildAdjacency(graph);
  if (!adj.has(source) || (target && !adj.has(target))) {
    return { ok: false, error: "Vértice inexistente" };
  }

  const visited = new Set();
  const parent = new Map([[source, null]]);
  const stack = [source];
  let edgesExplored = 0;
  let hasCycle = false;
  const onStack = new Set();

  while (stack.length) {
    const u = stack[stack.length - 1];
    if (!visited.has(u)) {
      visited.add(u);
      onStack.add(u);
    }
    if (target && u === target) break;

    let advanced = false;
    for (const { to } of adj.get(u) || []) {
      edgesExplored++;
      if (!visited.has(to)) {
        parent.set(to, u);
        stack.push(to);
        advanced = true;
        break;
      } else if (onStack.has(to)) {
        hasCycle = true;
      }
    }
    if (!advanced) {
      onStack.delete(stack.pop());
    }
  }

  const elapsed = performance.now() - t0;

  if (target) {
    if (!parent.has(target)) {
      return { ok: false, error: "Destino inalcançável", time_ms: elapsed };
    }
    const path = [];
    let n = target;
    while (n !== null) {
      path.unshift(n);
      n = parent.get(n);
    }
    return {
      ok: true,
      algorithm: "DFS",
      source,
      target,
      hops: path.length - 1,
      path,
      nodes_visited: visited.size,
      edges_explored: edgesExplored,
      has_cycle: hasCycle,
      time_ms: elapsed,
    };
  }

  return {
    ok: true,
    algorithm: "DFS",
    source,
    visited: visited.size,
    has_cycle: hasCycle,
    edges_explored: edgesExplored,
    time_ms: elapsed,
  };
}

// ─────────────────────────────────────────────────────────────
// Min-heap binário (para Dijkstra)
// ─────────────────────────────────────────────────────────────
class MinHeap {
  constructor() {
    this.h = [];
  }
  size() {
    return this.h.length;
  }
  push(item) {
    this.h.push(item);
    this._up(this.h.length - 1);
  }
  pop() {
    if (!this.h.length) return undefined;
    const top = this.h[0];
    const last = this.h.pop();
    if (this.h.length) {
      this.h[0] = last;
      this._down(0);
    }
    return top;
  }
  _up(i) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.h[p][0] <= this.h[i][0]) break;
      [this.h[p], this.h[i]] = [this.h[i], this.h[p]];
      i = p;
    }
  }
  _down(i) {
    const n = this.h.length;
    while (true) {
      let l = 2 * i + 1;
      let r = 2 * i + 2;
      let smallest = i;
      if (l < n && this.h[l][0] < this.h[smallest][0]) smallest = l;
      if (r < n && this.h[r][0] < this.h[smallest][0]) smallest = r;
      if (smallest === i) break;
      [this.h[smallest], this.h[i]] = [this.h[i], this.h[smallest]];
      i = smallest;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Dijkstra — recusa peso negativo (igual ao Python)
// ─────────────────────────────────────────────────────────────
export function dijkstra(graph, source, target, { allowNegative = false } = {}) {
  const t0 = performance.now();
  const adj = buildAdjacency(graph);
  if (!adj.has(source) || !adj.has(target)) {
    return { ok: false, error: "Vértice inexistente" };
  }

  const dist = new Map();
  const parent = new Map();
  for (const n of graph.nodes) {
    dist.set(n.id, Infinity);
    parent.set(n.id, null);
  }
  dist.set(source, 0);

  const heap = new MinHeap();
  heap.push([0, source]);
  const visited = new Set();
  let nodesVisited = 0;
  let edgesRelaxed = 0;

  while (heap.size()) {
    const [d, u] = heap.pop();
    if (visited.has(u)) continue;
    visited.add(u);
    nodesVisited++;
    if (u === target) break;

    for (const { to, weight } of adj.get(u) || []) {
      edgesRelaxed++;
      if (weight < 0 && !allowNegative) {
        return {
          ok: false,
          error: `Dijkstra recusou aresta com peso negativo: ${u} → ${to} (peso=${weight}). Use Bellman-Ford.`,
          time_ms: performance.now() - t0,
        };
      }
      const nd = d + weight;
      if (nd < dist.get(to)) {
        dist.set(to, nd);
        parent.set(to, u);
        heap.push([nd, to]);
      }
    }
  }

  const elapsed = performance.now() - t0;

  if (!isFinite(dist.get(target))) {
    return { ok: false, error: "Destino inalcançável", time_ms: elapsed };
  }

  const path = [];
  let n = target;
  while (n !== null) {
    path.unshift(n);
    n = parent.get(n);
  }
  return {
    ok: true,
    algorithm: "Dijkstra",
    source,
    target,
    cost: dist.get(target),
    path,
    nodes_visited: nodesVisited,
    edges_relaxed: edgesRelaxed,
    time_ms: elapsed,
  };
}

// ─────────────────────────────────────────────────────────────
// Bellman-Ford — detecta ciclo negativo
// ─────────────────────────────────────────────────────────────
export function bellmanFord(graph, source, target, { weightFn = (l) => l.fee } = {}) {
  const t0 = performance.now();
  const nodes = graph.nodes.map((n) => n.id);
  const idxOf = new Map(nodes.map((n, i) => [n, i]));
  if (!idxOf.has(source) || !idxOf.has(target)) {
    return { ok: false, error: "Vértice inexistente" };
  }

  const n = nodes.length;
  const dist = new Array(n).fill(Infinity);
  const parent = new Array(n).fill(null);
  dist[idxOf.get(source)] = 0;

  const edges = graph.links.map((l) => ({
    u: idxOf.get(srcId(l)),
    v: idxOf.get(tgtId(l)),
    w: weightFn(l),
  }));
  let edgesRelaxed = 0;

  for (let i = 0; i < n - 1; i++) {
    let updated = false;
    for (const { u, v, w } of edges) {
      edgesRelaxed++;
      if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        parent[v] = u;
        updated = true;
      }
    }
    if (!updated) break;
  }

  let hasNegativeCycle = false;
  for (const { u, v, w } of edges) {
    if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
      hasNegativeCycle = true;
      break;
    }
  }

  const elapsed = performance.now() - t0;

  if (hasNegativeCycle) {
    return {
      ok: true,
      algorithm: "Bellman-Ford",
      source,
      target,
      has_negative_cycle: true,
      cost: null,
      path: [],
      nodes_visited: n,
      edges_relaxed: edgesRelaxed,
      time_ms: elapsed,
    };
  }

  const ti = idxOf.get(target);
  if (!isFinite(dist[ti])) {
    return { ok: false, error: "Destino inalcançável", time_ms: elapsed };
  }

  const path = [];
  let cur = ti;
  while (cur !== null) {
    path.unshift(nodes[cur]);
    cur = parent[cur];
  }
  return {
    ok: true,
    algorithm: "Bellman-Ford",
    source,
    target,
    cost: dist[ti],
    path,
    nodes_visited: n,
    edges_relaxed: edgesRelaxed,
    has_negative_cycle: false,
    time_ms: elapsed,
  };
}

// ─────────────────────────────────────────────────────────────
// Roteador genérico
// ─────────────────────────────────────────────────────────────
export function runAlgorithm(algo, graph, source, target, opts = {}) {
  switch (algo) {
    case "BFS":
      return bfs(graph, source, target);
    case "DFS":
      return dfs(graph, source, target);
    case "DIJKSTRA":
      return dijkstra(graph, source, target, opts);
    case "BELLMAN":
      return bellmanFord(graph, source, target, opts);
    default:
      return { ok: false, error: `Algoritmo desconhecido: ${algo}` };
  }
}
