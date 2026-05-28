"""
CLI unificada para Parte 1 (aeroportos) e Parte 2 (transferências).

Exemplos:
  # Parte 1
  python -m src.cli --dataset ./data/aeroportos_data.csv --alg BFS --source REC --out ./out/
  python -m src.cli --dataset ./data/aeroportos_data.csv --alg DIJKSTRA --source REC --target POA --out ./out/

  # Parte 2 (dataset grande)
  python -m src.cli --dataset ./data/dataset_parte2/ --alg DIJKSTRA --source Barcelona --target PSG --out ./out/
  python -m src.cli --dataset ./data/dataset_parte2/ --alg BELLMAN --source Barcelona --target PSG --out ./out/
"""
import argparse
import json
import os
import sys

from src.graphs.algorithms import (
    bfs, dfs, dijkstra, bellman_ford_full,
    bfs_levels, dfs_classify, NegativeWeightError,
)


def _is_parte1(dataset_path: str) -> bool:
    """Decide se o dataset é da Parte 1 (aeroportos) ou Parte 2 (transferências)."""
    p = os.path.normpath(dataset_path).lower()
    if "aeroporto" in p:
        return True
    if "dataset_parte2" in p:
        return False
    return os.path.isfile(dataset_path) and dataset_path.lower().endswith(".csv") \
        and "aeroporto" in os.path.basename(dataset_path).lower()


def load_dataset(dataset_path: str):
    """Devolve (graph, kind) com kind em {'parte1', 'parte2'}."""
    if _is_parte1(dataset_path):
        from src.graphs.io import load_graph, gerar_malha_csv
        # garante que adjacencias existem (Parte 1 gera-as)
        adj_path = "data/adjacencias_aeroportos.csv"
        if not os.path.exists(adj_path):
            gerar_malha_csv(caminho_aeroportos=dataset_path)
        g = load_graph(caminho_aeroportos=dataset_path)
        return g, "parte1"
    else:
        from src.graphs.transfers_io import load_transfers_graph
        csv_path = dataset_path
        if os.path.isdir(dataset_path):
            csv_path = os.path.join(dataset_path, "transferencias.csv")
        g = load_transfers_graph(csv_path)
        return g, "parte2"


def run_algorithm(g, alg: str, source: str, target: str | None):
    alg = alg.upper()

    if alg == "BFS":
        if target:
            dist, path, nv, ae = bfs(g, source, target)
            return {
                "algorithm": "BFS", "source": source, "target": target,
                "distance_in_edges": dist if dist != float("inf") else None,
                "path": path, "nodes_visited": nv, "edges_explored": ae,
            }
        res = bfs_levels(g, source)
        return {
            "algorithm": "BFS_levels", "source": source,
            "reachable_nodes": len(res["levels"]),
            "max_level": max(res["levels"].values()) if res["levels"] else 0,
            "first_20_order": res["order"][:20],
            "edges_explored": res["edges_explored"],
        }

    if alg == "DFS":
        if target:
            dist, path, nv, ae = dfs(g, source, target)
            return {
                "algorithm": "DFS", "source": source, "target": target,
                "distance_in_edges": dist if dist != float("inf") else None,
                "path": path, "nodes_visited": nv, "edges_explored": ae,
            }
        res = dfs_classify(g, source)
        kinds = {}
        for _, _, k in res["edges"]:
            kinds[k] = kinds.get(k, 0) + 1
        return {
            "algorithm": "DFS_classify", "source": source,
            "has_cycle": res["has_cycle"],
            "edges_by_kind": kinds,
            "discovered": len(res["discovery"]),
        }

    if alg == "DIJKSTRA":
        if not target:
            sys.exit("DIJKSTRA exige --target.")
        try:
            cost, path, nv, ae = dijkstra(g, source, target)
        except NegativeWeightError as e:
            return {"algorithm": "Dijkstra", "source": source, "target": target,
                    "error": str(e), "note": "Use --alg BELLMAN para pesos negativos."}
        return {
            "algorithm": "Dijkstra", "source": source, "target": target,
            "cost": cost if cost != float("inf") else None,
            "path": path, "nodes_visited": nv, "edges_relaxed": ae,
        }

    if alg in ("BELLMAN", "BELLMAN_FORD", "BF"):
        if not target:
            sys.exit("BELLMAN exige --target.")
        cost, path, nv, ae, neg = bellman_ford_full(g, source, target)
        return {
            "algorithm": "Bellman-Ford", "source": source, "target": target,
            "has_negative_cycle": neg,
            "cost": (None if cost in (float("inf"), float("-inf")) else cost),
            "path": path, "nodes_visited": nv, "edges_relaxed": ae,
        }

    sys.exit(f"Algoritmo desconhecido: {alg}. Use BFS | DFS | DIJKSTRA | BELLMAN.")


def main():
    parser = argparse.ArgumentParser(
        description="CLI de grafos (Parte 1 / Parte 2)."
    )
    parser.add_argument("--dataset", required=True,
                        help="caminho para o CSV (ou pasta com transferencias.csv)")
    parser.add_argument("--alg", required=True,
                        help="BFS | DFS | DIJKSTRA | BELLMAN")
    parser.add_argument("--source", required=True, help="vértice de origem")
    parser.add_argument("--target", default=None, help="vértice de destino (opcional para BFS/DFS)")
    parser.add_argument("--out", default="./out/", help="diretório de saída")
    args = parser.parse_args()

    g, kind = load_dataset(args.dataset)
    print(f"Dataset: {kind} | |V|={g.get_order()} | |E|={g.get_size()} | dirigido={g.directed}")

    result = run_algorithm(g, args.alg, args.source, args.target)

    os.makedirs(args.out, exist_ok=True)
    out_name = f"cli_{args.alg.lower()}_{args.source}_{args.target or 'all'}.json"
    out_name = out_name.replace(" ", "_").replace("/", "_")
    out_path = os.path.join(args.out, out_name)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"\nResultado salvo em: {out_path}")


if __name__ == "__main__":
    main()
