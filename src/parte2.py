"""
Parte 2 — Dataset maior (transferências de futebol) + comparação de algoritmos.

Roda BFS, DFS, Dijkstra, Bellman-Ford no grafo dirigido ponderado de
transferências (Transfermarkt; ~3.166 clubes, ~15.451 arestas dedup).

Saídas:
  out/parte2_report.json     ← métricas, tempos, caminhos, ciclo negativo
  out/parte2_hist_graus.png  ← histograma de graus
  out/parte2_tempos.png      ← barras de tempo por algoritmo
  out/parte2_heatmap.png     ← heatmap de distâncias entre top clubes
"""
import json
import os
import time
import tracemalloc

from src.graphs.graph import Graph
from src.graphs.transfers_io import load_transfers_graph, graph_stats
from src.graphs.algorithms import (
    bfs, dfs, dijkstra, bellman_ford_full,
    bfs_levels, dfs_classify, NegativeWeightError,
)

OUT_DIR = "out"
REPORT = os.path.join(OUT_DIR, "parte2_report.json")


# ─────────────────────────────────────────────────────────────────────────────
# Wrappers de medição
# ─────────────────────────────────────────────────────────────────────────────

def timed(fn, *args, **kwargs):
    """Executa fn(*args, **kwargs) medindo tempo (s) e pico de memória (KB)."""
    tracemalloc.start()
    t0 = time.perf_counter()
    try:
        result = fn(*args, **kwargs)
        error = None
    except Exception as e:
        result = None
        error = f"{type(e).__name__}: {e}"
    t1 = time.perf_counter()
    _, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    return {
        "result": result,
        "error": error,
        "time_ms": round((t1 - t0) * 1000, 3),
        "peak_kb": round(peak / 1024, 1),
    }


# ─────────────────────────────────────────────────────────────────────────────
# BFS/DFS — múltiplas fontes
# ─────────────────────────────────────────────────────────────────────────────

def run_bfs_dfs_multi_source(g: Graph, sources: list[str]) -> dict:
    out = {"sources": sources, "bfs": [], "dfs": []}
    for src in sources:
        bfs_run = timed(bfs_levels, g, src)
        bfs_res = bfs_run["result"] or {}
        levels = bfs_res.get("levels", {})
        if levels:
            max_level = max(levels.values())
            level_dist = {}
            for lv in levels.values():
                level_dist[lv] = level_dist.get(lv, 0) + 1
        else:
            max_level = 0
            level_dist = {}

        out["bfs"].append({
            "source": src,
            "reachable": len(levels),
            "max_level": max_level,
            "level_distribution": {str(k): v for k, v in sorted(level_dist.items())},
            "first_10_order": bfs_res.get("order", [])[:10],
            "time_ms": bfs_run["time_ms"],
            "peak_kb": bfs_run["peak_kb"],
        })

        dfs_run = timed(dfs_classify, g, src)
        dfs_res = dfs_run["result"] or {}
        edges = dfs_res.get("edges", [])
        kinds = {}
        for _, _, kind in edges:
            kinds[kind] = kinds.get(kind, 0) + 1

        out["dfs"].append({
            "source": src,
            "has_cycle": bool(dfs_res.get("has_cycle")),
            "edges_total": len(edges),
            "edges_by_kind": kinds,
            "discovered": len(dfs_res.get("discovery", {})),
            "time_ms": dfs_run["time_ms"],
            "peak_kb": dfs_run["peak_kb"],
        })
    return out


# ─────────────────────────────────────────────────────────────────────────────
# Dijkstra — pares específicos (pesos >= 0)
# ─────────────────────────────────────────────────────────────────────────────

def run_dijkstra_pairs(g: Graph, pairs: list[tuple[str, str]]) -> dict:
    runs = []
    for s, t in pairs:
        if s not in g.adj or t not in g.adj:
            runs.append({"source": s, "target": t, "skipped": True,
                         "reason": "vértice ausente"})
            continue
        run = timed(dijkstra, g, s, t)
        custo, caminho, nv, ae = (run["result"] or (None, [], 0, 0))
        runs.append({
            "source": s,
            "target": t,
            "cost": custo if custo != float("inf") else None,
            "reachable": custo != float("inf"),
            "path_length": len(caminho) if caminho else 0,
            "path": caminho,
            "nodes_visited": nv,
            "edges_relaxed": ae,
            "time_ms": run["time_ms"],
            "peak_kb": run["peak_kb"],
            "error": run["error"],
        })
    return {"pairs": runs}


def run_dijkstra_negative_rejection(g: Graph) -> dict:
    """Tenta rodar Dijkstra com peso_lucro (que pode ser negativo)."""
    g_neg = Graph(directed=True)
    for u, v, w, dados in g.iter_edges():
        if dados.get("peso_lucro") is not None:
            g_neg.add_edge(u, v, peso=dados["peso_lucro"])
    sample_src = next(iter(g_neg.adj), None)
    sample_tgt = None
    if sample_src and g_neg.adj[sample_src]:
        sample_tgt = next(iter(g_neg.adj[sample_src]))
    if not sample_src or not sample_tgt:
        return {"rejected": False, "reason": "grafo vazio"}

    try:
        dijkstra(g_neg, sample_src, sample_tgt)
        return {
            "rejected": False,
            "tested_pair": [sample_src, sample_tgt],
            "note": "Inesperado: não havia peso negativo no caminho explorado",
        }
    except NegativeWeightError as e:
        return {
            "rejected": True,
            "tested_pair": [sample_src, sample_tgt],
            "error": str(e),
            "note": "Dijkstra recusou corretamente o peso negativo.",
        }


# ─────────────────────────────────────────────────────────────────────────────
# Bellman-Ford — peso negativo sem ciclo + ciclo negativo
# ─────────────────────────────────────────────────────────────────────────────

def run_bellman_ford_cases(g: Graph) -> dict:
    """
    Caso 1 (REAL): subgrafo com peso_lucro como peso. Pode ter pesos negativos
                   mas sabidamente NÃO tem ciclo negativo no top-50 clubes
                   (verificamos).
    Caso 2 (REAL): grafo inteiro com peso_lucro → detecta se há ciclo negativo
                   no mercado de transferências.
    Caso 3 (SINTÉTICO): grafo pequeno construído à mão com ciclo negativo
                        explícito — garante que a detecção funciona.
    """
    out = {"cases": []}

    # ── Caso 1: top-N clubes com peso_lucro
    top_clubs = sorted(g.get_nodes(),
                       key=lambda n: g.get_degree(n), reverse=True)[:30]
    g1 = _subgraph_with_lucro(g, set(top_clubs))
    src1 = top_clubs[0]
    tgt1 = top_clubs[5]
    run1 = timed(bellman_ford_full, g1, src1, tgt1)
    custo, caminho, nv, ae, neg = (run1["result"] or (None, [], 0, 0, False))
    out["cases"].append({
        "name": "Top-30 clubes com peso = fee - market_value",
        "directed": True,
        "weights_can_be_negative": True,
        "source": src1, "target": tgt1,
        "has_negative_cycle": neg,
        "cost": (None if custo in (float("inf"), float("-inf")) else custo),
        "path_length": len(caminho),
        "path": caminho,
        "time_ms": run1["time_ms"],
        "peak_kb": run1["peak_kb"],
        "interpretation": (
            "Caminho minimiza o saldo (fee - market_value). Saldo total "
            "negativo = série de transferências em que clubes pagaram "
            "abaixo do valor de mercado."
        ),
    })

    # ── Caso 2: grafo todo com peso_lucro
    g2 = _subgraph_with_lucro(g, set(g.get_nodes()))
    src2, tgt2 = top_clubs[0], top_clubs[10]
    run2 = timed(bellman_ford_full, g2, src2, tgt2)
    custo2, caminho2, _, ae2, neg2 = (run2["result"] or (None, [], 0, 0, False))
    out["cases"].append({
        "name": "Grafo inteiro com peso = fee - market_value",
        "directed": True,
        "weights_can_be_negative": True,
        "source": src2, "target": tgt2,
        "has_negative_cycle": neg2,
        "cost": (None if custo2 in (float("inf"), float("-inf")) else custo2),
        "path_length": len(caminho2),
        "time_ms": run2["time_ms"],
        "peak_kb": run2["peak_kb"],
        "interpretation": (
            "Se has_negative_cycle=True, existe um ciclo de transferências "
            "em que a soma dos saldos é negativa — arbitragem de mercado."
        ),
    })

    # ── Caso 3: sintético com ciclo negativo
    g_syn = Graph(directed=True)
    g_syn.add_edge("A", "B", peso=1)
    g_syn.add_edge("B", "C", peso=-3)
    g_syn.add_edge("C", "A", peso=1)   # ciclo A→B→C→A com soma = -1
    g_syn.add_edge("A", "D", peso=2)
    run3 = timed(bellman_ford_full, g_syn, "A", "D")
    custo3, caminho3, _, _, neg3 = (run3["result"] or (None, [], 0, 0, False))
    out["cases"].append({
        "name": "SINTÉTICO: ciclo negativo (A→B→C→A com soma -1)",
        "directed": True,
        "weights_can_be_negative": True,
        "source": "A", "target": "D",
        "has_negative_cycle": neg3,
        "cost": (None if custo3 in (float("inf"), float("-inf")) else custo3),
        "path_length": len(caminho3),
        "time_ms": run3["time_ms"],
        "interpretation": "Esperado has_negative_cycle=True.",
    })

    # ── Caso 4: sintético com peso negativo SEM ciclo
    g_syn2 = Graph(directed=True)
    g_syn2.add_edge("S", "A", peso=4)
    g_syn2.add_edge("S", "B", peso=2)
    g_syn2.add_edge("B", "A", peso=-3)  # caminho S→B→A custa 2-3 = -1
    g_syn2.add_edge("A", "T", peso=1)
    g_syn2.add_edge("B", "T", peso=5)
    run4 = timed(bellman_ford_full, g_syn2, "S", "T")
    custo4, caminho4, _, _, neg4 = (run4["result"] or (None, [], 0, 0, False))
    out["cases"].append({
        "name": "SINTÉTICO: peso negativo SEM ciclo (S→B→A→T com -1+1=0)",
        "directed": True,
        "weights_can_be_negative": True,
        "source": "S", "target": "T",
        "has_negative_cycle": neg4,
        "cost": (None if custo4 in (float("inf"), float("-inf")) else custo4),
        "path": caminho4,
        "time_ms": run4["time_ms"],
        "interpretation": "Esperado: cost=0 via S→B→A→T, has_negative_cycle=False.",
    })

    return out


def _subgraph_with_lucro(g: Graph, allowed: set[str]) -> Graph:
    sub = Graph(directed=True)
    for u, v, _w, dados in g.iter_edges():
        if u in allowed and v in allowed and dados.get("peso_lucro") is not None:
            sub.add_edge(u, v, peso=float(dados["peso_lucro"]))
    return sub


# ─────────────────────────────────────────────────────────────────────────────
# Pipeline principal
# ─────────────────────────────────────────────────────────────────────────────

def pick_sample_pairs(g: Graph, n_pairs: int = 5) -> list[tuple[str, str]]:
    """Pega top clubes por grau e monta pares que existem."""
    top = sorted(g.get_nodes(), key=lambda n: g.get_degree(n), reverse=True)
    pairs = []
    # Pares "famosos" tentados primeiro, se existirem
    candidatos = [
        ("Barcelona", "PSG"),
        ("Real Madrid", "Liverpool"),
        ("Chelsea", "Man City"),
        ("Juventus", "Bayern Munich"),
        ("Benfica", "Tottenham"),
    ]
    for s, t in candidatos:
        if s in g.adj and t in g.adj:
            pairs.append((s, t))
        if len(pairs) >= n_pairs:
            return pairs
    # completar com top clubes
    for i in range(len(top)):
        for j in range(len(top)):
            if i == j:
                continue
            s, t = top[i], top[j]
            if (s, t) in pairs:
                continue
            pairs.append((s, t))
            if len(pairs) >= n_pairs:
                return pairs
    return pairs


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    print("➤ Carregando dataset...")
    g = load_transfers_graph()
    print(f"   |V|={g.get_order()}, |E|={g.get_size()}, dirigido={g.directed}")

    stats = graph_stats(g)
    print("➤ Estatísticas do grafo OK.")

    # Fontes para BFS/DFS — 3 distintas
    top = sorted(g.get_nodes(), key=lambda n: g.get_degree(n), reverse=True)
    sources = [c for c in ["Benfica", "Chelsea", "Palmeiras"] if c in g.adj]
    while len(sources) < 3:
        cand = top[len(sources) * 3]
        if cand not in sources:
            sources.append(cand)

    print(f"➤ BFS/DFS de {sources}...")
    bfs_dfs = run_bfs_dfs_multi_source(g, sources)

    print("➤ Dijkstra em 5 pares...")
    pairs = pick_sample_pairs(g, n_pairs=5)
    dij = run_dijkstra_pairs(g, pairs)

    print("➤ Dijkstra — verificando recusa de peso negativo...")
    dij_reject = run_dijkstra_negative_rejection(g)

    print("➤ Bellman-Ford (4 casos)...")
    bf = run_bellman_ford_cases(g)

    report = {
        "dataset": {
            "path": "data/dataset_parte2/transferencias.csv",
            "description": (
                "Transferências reais (Transfermarkt) com transfer_fee > 0. "
                "Vértices = clubes; arestas = transferências, dirigidas do "
                "clube vendedor para o comprador. Peso = transfer_fee em €. "
                "Em caso de múltiplas transferências entre o mesmo par, "
                "mantemos a de maior fee como aresta canônica."
            ),
            "stats": stats,
        },
        "bfs_dfs": bfs_dfs,
        "dijkstra": dij,
        "dijkstra_negative_rejection": dij_reject,
        "bellman_ford": bf,
        "discussion": {
            "BFS": "Caminho mínimo em arestas. O(V+E). Útil quando todos os "
                   "pesos são iguais ou só interessa o número de saltos.",
            "DFS": "Não encontra caminho mínimo. Útil para detectar ciclos, "
                   "ordenação topológica e classificação de arestas.",
            "Dijkstra": "Caminho mínimo ponderado com pesos >= 0. "
                       "O((V+E) log V) com heap. Recusa peso negativo.",
            "BellmanFord": "Caminho mínimo com pesos arbitrários. O(V·E). "
                          "Detecta ciclos negativos. Mais lento que Dijkstra "
                          "mas obrigatório quando há pesos negativos.",
            "design_limits": (
                "Nosso 'peso = fee' é positivo, então Dijkstra é a escolha "
                "natural. Para Bellman-Ford derivamos peso = fee - market_value "
                "(saldo da transferência). Não há razão semântica para um "
                "ciclo negativo nesse grafo (não é fechado como câmbio), "
                "mas o algoritmo é validado em mini-grafos sintéticos."
            ),
        },
    }

    with open(REPORT, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"✅ {REPORT} gerado.")
    return report


if __name__ == "__main__":
    main()
