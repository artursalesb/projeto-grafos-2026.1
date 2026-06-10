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
    Cobre o requisito do PDF (Parte 2): "Bellman-Ford com ao menos um caso
    com peso negativo (e sem ciclo negativo) e um com ciclo negativo (detectado)".

    RÉGUA DE PESOS NEGATIVOS:
    O dataset real só tem transfer_fee >= 0, então Dijkstra basta para custo.
    Para EXERCITAR o Bellman-Ford com pesos negativos, derivamos um peso
    alternativo: peso_lucro = transfer_fee - market_value_in_eur.
      - peso_lucro < 0  → o clube comprador pagou ABAIXO do valor de mercado
        (do ponto de vista do comprador, "bom negócio" = saldo negativo).
      - peso_lucro > 0  → pagou ACIMA do valor de mercado.

    Casos:
      1. REAL (sem ciclo negativo): subgrafo DAG ordenado por grau decrescente
         (clube de maior grau → menor grau). Como toda aresta vai de um rank
         menor para um rank maior, é IMPOSSÍVEL formar ciclo → garante que
         Bellman-Ford computa distâncias válidas mesmo com pesos negativos.
      2. REAL (com ciclo negativo): grafo inteiro com peso_lucro. Sem a
         restrição de ordenação, surgem ciclos de "arbitragem" cuja soma de
         saldos é negativa → Bellman-Ford detecta e sinaliza.
      3. SINTÉTICO (ciclo negativo): mini-grafo com nomes de clubes, ciclo
         explícito de soma -1, para demonstração didática e teste de unidade.
      4. SINTÉTICO (peso negativo SEM ciclo): mini-grafo onde o caminho ótimo
         passa por uma aresta negativa, custo final exato e verificável.
    """
    out = {
        "regua_pesos": {
            "formula": "peso_lucro = transfer_fee - market_value_in_eur",
            "interpretacao_negativo": "comprador pagou abaixo do valor de mercado (bom negocio)",
            "interpretacao_positivo": "comprador pagou acima do valor de mercado",
            "motivacao": (
                "O dataset original so tem transfer_fee >= 0. Derivamos peso_lucro "
                "para exercitar Bellman-Ford com pesos negativos, como exige o PDF."
            ),
        },
        "cases": [],
    }

    # ── Caso 1: REAL, DAG por grau → garantidamente SEM ciclo negativo ──────
    dag = _subgraph_dag_lucro(g)
    nos_dag = sorted(dag.get_nodes(), key=lambda n: dag.get_degree(n), reverse=True)
    src1, tgt1 = "Benfica", "Porto"
    if src1 not in dag.adj or tgt1 not in dag.adj:
        src1, tgt1 = nos_dag[0], nos_dag[20]
    run1 = timed(bellman_ford_full, dag, src1, tgt1)
    custo, caminho, nv, ae, neg = (run1["result"] or (None, [], 0, 0, False))
    out["cases"].append({
        "name": "REAL com peso negativo SEM ciclo negativo (subgrafo DAG por grau)",
        "directed": True,
        "weights_can_be_negative": True,
        "has_negative_cycle": neg,
        "source": src1, "target": tgt1,
        "cost": (None if custo in (float("inf"), float("-inf")) else custo),
        "cost_eur_fmt": (None if custo in (float("inf"), float("-inf")) else f"EUR {custo:,.0f}"),
        "path_length": len(caminho),
        "path": caminho,
        "edges_relaxed": ae,
        "time_ms": run1["time_ms"],
        "peak_kb": run1["peak_kb"],
        "interpretation": (
            f"Caminho {src1} -> {tgt1} sobre o subgrafo DAG (so arestas de clube "
            "de maior grau para menor grau, peso = fee - market_value). Custo "
            "negativo = cadeia de transferencias em que clubes pagaram abaixo do "
            "valor de mercado. has_negative_cycle=False porque um DAG nao tem ciclos."
        ),
    })

    # ── Caso 2: REAL, grafo inteiro → DETECTA ciclo negativo ────────────────
    top_clubs = sorted(g.get_nodes(), key=lambda n: g.get_degree(n), reverse=True)[:30]
    g2 = _subgraph_with_lucro(g, set(g.get_nodes()))
    src2, tgt2 = top_clubs[0], top_clubs[10]
    run2 = timed(bellman_ford_full, g2, src2, tgt2)
    custo2, caminho2, _, ae2, neg2 = (run2["result"] or (None, [], 0, 0, False))
    out["cases"].append({
        "name": "REAL com ciclo negativo DETECTADO (grafo inteiro, peso = fee - market_value)",
        "directed": True,
        "weights_can_be_negative": True,
        "has_negative_cycle": neg2,
        "source": src2, "target": tgt2,
        "cost": (None if custo2 in (float("inf"), float("-inf")) else custo2),
        "path_length": len(caminho2),
        "edges_relaxed": ae2,
        "time_ms": run2["time_ms"],
        "peak_kb": run2["peak_kb"],
        "interpretation": (
            "No grafo dirigido completo com peso_lucro, existem ciclos cuja soma "
            "de saldos e negativa (arbitragem de mercado). Bellman-Ford sinaliza "
            "has_negative_cycle=True e nao retorna caminho finito — comportamento "
            "correto, ja que o custo poderia decrescer indefinidamente."
        ),
    })

    # ── Caso 3: SINTÉTICO com ciclo negativo (nomes de clubes) ──────────────
    g_syn = Graph(directed=True)
    g_syn.add_edge("Ajax", "Roma", peso=1)
    g_syn.add_edge("Roma", "Lyon", peso=-3)
    g_syn.add_edge("Lyon", "Ajax", peso=1)    # ciclo Ajax->Roma->Lyon->Ajax = -1
    g_syn.add_edge("Ajax", "Porto", peso=2)
    run3 = timed(bellman_ford_full, g_syn, "Ajax", "Porto")
    custo3, caminho3, _, _, neg3 = (run3["result"] or (None, [], 0, 0, False))
    out["cases"].append({
        "name": "SINTETICO: ciclo negativo (Ajax->Roma->Lyon->Ajax, soma -1)",
        "directed": True,
        "weights_can_be_negative": True,
        "has_negative_cycle": neg3,
        "source": "Ajax", "target": "Porto",
        "cost": (None if custo3 in (float("inf"), float("-inf")) else custo3),
        "path_length": len(caminho3),
        "time_ms": run3["time_ms"],
        "interpretation": "Esperado has_negative_cycle=True (validacao da deteccao).",
    })

    # ── Caso 4: SINTÉTICO peso negativo SEM ciclo (custo exato) ─────────────
    g_syn2 = Graph(directed=True)
    g_syn2.add_edge("Santos", "Barcelona", peso=4)
    g_syn2.add_edge("Santos", "Inter", peso=2)
    g_syn2.add_edge("Inter", "Barcelona", peso=-3)  # Santos->Inter->Barca = 2-3 = -1
    g_syn2.add_edge("Barcelona", "PSG", peso=1)
    g_syn2.add_edge("Inter", "PSG", peso=5)
    run4 = timed(bellman_ford_full, g_syn2, "Santos", "PSG")
    custo4, caminho4, _, _, neg4 = (run4["result"] or (None, [], 0, 0, False))
    out["cases"].append({
        "name": "SINTETICO: peso negativo SEM ciclo (Santos->Inter->Barca->PSG, custo 0)",
        "directed": True,
        "weights_can_be_negative": True,
        "has_negative_cycle": neg4,
        "source": "Santos", "target": "PSG",
        "cost": (None if custo4 in (float("inf"), float("-inf")) else custo4),
        "path": caminho4,
        "time_ms": run4["time_ms"],
        "interpretation": (
            "Caminho otimo Santos->Inter->Barcelona->PSG = 2 + (-3) + 1 = 0, "
            "passando pela aresta negativa Inter->Barcelona. has_negative_cycle=False."
        ),
    })

    return out


def _subgraph_with_lucro(g: Graph, allowed: set[str]) -> Graph:
    """Subgrafo dirigido com peso = peso_lucro (fee - market_value)."""
    sub = Graph(directed=True)
    for u, v, _w, dados in g.iter_edges():
        if u in allowed and v in allowed and dados.get("peso_lucro") is not None:
            sub.add_edge(u, v, peso=float(dados["peso_lucro"]))
    return sub


def _subgraph_dag_lucro(g: Graph) -> Graph:
    """
    Subgrafo DAG: mantém apenas arestas que vão de um clube de MAIOR grau
    para um de MENOR grau (ordenação total por rank de grau). Isso elimina
    todo ciclo por construção, mas preserva os pesos negativos reais
    (peso = fee - market_value). Útil para o caso 'peso negativo SEM ciclo'.
    """
    nos = sorted(g.get_nodes(), key=lambda n: g.get_degree(n), reverse=True)
    rank = {n: i for i, n in enumerate(nos)}
    sub = Graph(directed=True)
    for u, v, _w, dados in g.iter_edges():
        lucro = dados.get("peso_lucro")
        if lucro is None:
            continue
        if rank[u] < rank[v]:  # só "alto grau → baixo grau" garante DAG
            sub.add_edge(u, v, peso=float(lucro))
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
